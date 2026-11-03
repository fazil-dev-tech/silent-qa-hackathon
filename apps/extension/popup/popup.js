document.addEventListener('DOMContentLoaded', async () => {
  const CLOUD_PROD_URL = 'https://hhhcct.vercel.app';
  const CLOUD_PROD_API = 'https://hhhcct.vercel.app/api/ingest';

  const noteInput = document.getElementById('complaint-note');
  const submitBtn = document.getElementById('btn-submit');
  const pickBtn = document.getElementById('btn-pick');
  const statusText = document.getElementById('status-text');
  const siteHost = document.getElementById('site-host');
  const gatewayLabel = document.getElementById('gateway-label');
  const btnQuickSwitchHost = document.getElementById('btn-quick-switch-host');
  const btnQuickSwitchCloud = document.getElementById('btn-quick-switch-cloud');
  const sessionDisplay = document.getElementById('session-display');
  const workspaceBtn = document.getElementById('btn-workspace');
  const toggleRecordingBtn = document.getElementById('btn-toggle-recording');
  const recStatusText = document.getElementById('rec-status-text');
  const pausedBanner = document.getElementById('paused-banner');
  const testerDisplay = document.getElementById('tester-display');
  const stationDisplay = document.getElementById('station-display');
  const openOptionsBtn = document.getElementById('btn-open-options');
  const recentChipsContainer = document.getElementById('recent-chips');
  const recentCount = document.getElementById('recent-count');
  const boundTargetPill = document.getElementById('bound-target-pill');
  const boundText = document.getElementById('bound-text');
  const clearTargetBtn = document.getElementById('btn-clear-target');
  const phraseChips = document.querySelectorAll('.phrase-chip');

  let currentPickedSelector = '';
  let currentRecentEventId = '';
  let isRecordingEnabled = true;
  let activeTesterName = 'Eng #1';
  let activeDeviceTag = 'Station-01';
  let currentTabOrigin = '';

  function updateStatus(msg, color) {
    if (!statusText) return;
    if (msg) {
      statusText.textContent = msg;
      statusText.style.color = color || '#4B5563';
      statusText.classList.add('has-content');
    } else {
      statusText.textContent = '';
      statusText.classList.remove('has-content');
    }
  }

  function setGatewayLabel(url) {
    if (!gatewayLabel) return;
    const clean = (url || '').replace(/\/api\/ingest\/?$/, '').replace(/\/+$/, '');
    gatewayLabel.textContent = clean || CLOUD_PROD_URL;
    gatewayLabel.title = `Current Target Gateway: ${clean || CLOUD_PROD_URL}`;
  }

  // 1. Identify active tab host & origin
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      try {
        const u = new URL(tab.url);
        currentTabOrigin = `${u.protocol}//${u.host}`;
        siteHost.textContent = `${u.hostname}${u.port ? ':' + u.port : ''}`;
      } catch {
        siteHost.textContent = tab.url.slice(0, 30);
      }
    }
  } catch {
    siteHost.textContent = 'Active Browser Tab';
  }

  // 1b. Quick Gateway Switchers
  if (btnQuickSwitchCloud) {
    btnQuickSwitchCloud.addEventListener('click', () => {
      chrome.storage.local.set({ api_endpoint: CLOUD_PROD_API }, () => {
        setGatewayLabel(CLOUD_PROD_URL);
        updateStatus('✓ Switched to Cloud Production (hhhcct.vercel.app)', '#4338CA');
        setTimeout(() => updateStatus(''), 2500);
      });
    });
  }

  if (btnQuickSwitchHost) {
    btnQuickSwitchHost.addEventListener('click', () => {
      if (!currentTabOrigin || currentTabOrigin.startsWith('chrome') || currentTabOrigin.startsWith('about')) {
        updateStatus('Current tab does not have a web origin.', '#DC2626');
        return;
      }
      const hostEndpoint = `${currentTabOrigin}/api/ingest`;
      chrome.storage.local.set({ api_endpoint: hostEndpoint }, () => {
        setGatewayLabel(currentTabOrigin);
        updateStatus(`✓ Switched to Tab Host (${currentTabOrigin})`, '#166534');
        setTimeout(() => updateStatus(''), 2500);
      });
    });
  }

  // 2. Master Recording Toggle Sync & Controller
  function renderRecordingState(enabled) {
    isRecordingEnabled = enabled;
    if (enabled) {
      toggleRecordingBtn.className = 'rec-toggle';
      recStatusText.textContent = 'Active Recording';
      toggleRecordingBtn.title = 'Recording is ACTIVE. Click to pause telemetry capture.';
      pausedBanner.style.display = 'none';
    } else {
      toggleRecordingBtn.className = 'rec-toggle is-paused';
      recStatusText.textContent = 'Paused';
      toggleRecordingBtn.title = 'Recording is PAUSED. Click to resume telemetry capture.';
      pausedBanner.style.display = 'flex';
    }
  }

  toggleRecordingBtn.addEventListener('click', () => {
    const nextState = !isRecordingEnabled;
    renderRecordingState(nextState);

    // Sync worker session state
    chrome.runtime.sendMessage({
      type: nextState ? 'START_SESSION' : 'STOP_SESSION',
      testerName: activeTesterName,
      deviceTag: activeDeviceTag,
    }, (res) => {
      if (res?.sessionId) {
        sessionDisplay.textContent = res.sessionId.slice(0, 13) + '...';
      }
    });

    chrome.storage.local.set({ sqa_recording_enabled: nextState });

    // Broadcast to active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs?.[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'SET_RECORDING_STATE',
          enabled: nextState,
        }).catch(() => {});
      }
    });
  });

  // Click session display to copy full session ID
  if (sessionDisplay) {
    sessionDisplay.style.cursor = 'pointer';
    sessionDisplay.title = 'Click to copy full Session UUID';
    sessionDisplay.addEventListener('click', () => {
      chrome.storage.local.get(['session_id'], (res) => {
        if (res?.session_id) {
          navigator.clipboard.writeText(res.session_id);
          const orig = sessionDisplay.textContent;
          sessionDisplay.textContent = 'Copied!';
          setTimeout(() => { sessionDisplay.textContent = orig; }, 1500);
        }
      });
    });
  }

  // 3. Hydrate storage & Smart Resolve API Endpoint
  chrome.storage.local.get(
    [
      'session_id',
      'api_endpoint',
      'tester_name',
      'device_tag',
      'sqa_recording_enabled',
      'sqa_recent_interactions',
      'sqa_stats',
    ],
    (stored) => {
      // Intelligently resolve endpoint if missing or legacy localhost
      let activeEndpoint = stored.api_endpoint;
      const isLegacyLocal = !activeEndpoint || activeEndpoint.includes('localhost:3000');

      if (isLegacyLocal) {
        if (currentTabOrigin && !currentTabOrigin.includes('localhost') && !currentTabOrigin.startsWith('chrome')) {
          // If on silentai.dpdns.org or custom domain running Silent QA, adapt to tab host
          if (currentTabOrigin.includes('silentai') || currentTabOrigin.includes('vercel.app')) {
            activeEndpoint = `${currentTabOrigin}/api/ingest`;
          } else {
            activeEndpoint = CLOUD_PROD_API;
          }
        } else {
          activeEndpoint = CLOUD_PROD_API;
        }
        chrome.storage.local.set({ api_endpoint: activeEndpoint });
      }

      setGatewayLabel(activeEndpoint);

      // Recording state
      if (typeof stored.sqa_recording_enabled === 'boolean') {
        renderRecordingState(stored.sqa_recording_enabled);
      } else {
        renderRecordingState(true);
      }

      // Session ID
      let activeSessionId = stored.session_id;
      if (!activeSessionId) {
        activeSessionId =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                const r = (Math.random() * 16) | 0;
                const v = c === 'x' ? r : (r & 0x3) | 0x8;
                return v.toString(16);
              });
        chrome.storage.local.set({ session_id: activeSessionId });
      }
      sessionDisplay.textContent = activeSessionId.slice(0, 13) + '...';

      // Tester & Device Attribution
      activeTesterName = stored.tester_name || 'Eng #1';
      activeDeviceTag = stored.device_tag || 'Station-01';
      testerDisplay.textContent = activeTesterName;
      if (stationDisplay) {
        stationDisplay.textContent = activeDeviceTag;
      }

      // Stats - single line badge
      const captured = stored.sqa_stats?.captured || 0;
      const errors = stored.sqa_stats?.errors || 0;
      if (errors > 0) {
        recentCount.textContent = `${captured} ev (${errors} err)`;
      } else if (captured > 0) {
        recentCount.textContent = `${captured} events`;
      } else {
        recentCount.textContent = '0 events';
      }

      // Render Recent Interactions
      renderRecentInteractions(stored.sqa_recent_interactions || []);
    }
  );

  // 4. Render and Bind Recent Interactions
  function renderRecentInteractions(items) {
    if (!items || items.length === 0) {
      recentChipsContainer.innerHTML =
        '<div class="recent-empty">Interacting with the page records events in real time.</div>';
      return;
    }

    recentChipsContainer.innerHTML = '';
    items.forEach((item) => {
      const chip = document.createElement('div');
      chip.className = 'recent-chip';
      chip.setAttribute('data-id', item.id);
      if (item.selector) {
        chip.setAttribute('data-selector', item.selector);
      }

      const isError = item.type === 'error' || item.type === 'network_error';
      const icon = isError ? '⚠️' : '🔘';
      const timeAgo = formatTimeAgo(item.ts);

      chip.innerHTML = `
        <span class="chip-icon">${icon}</span>
        <div class="chip-body">
          <div class="chip-label">${escapeHtml(item.label || item.selector || item.type)}</div>
          <div class="chip-meta">${item.type.toUpperCase()}${item.status ? ' [' + item.status + ']' : ''} • ${timeAgo}</div>
        </div>
      `;

      chip.addEventListener('click', () => {
        document.querySelectorAll('.recent-chip').forEach((c) => c.classList.remove('is-selected'));
        chip.classList.add('is-selected');

        currentRecentEventId = item.id;
        if (item.selector) {
          currentPickedSelector = item.selector;
          boundText.textContent = item.selector;
          boundTargetPill.style.display = 'flex';
        }

        // Prefill or append to note
        const notePrefix = isError
          ? `Observed ${item.type.toUpperCase()}: ${item.label || item.selector}`
          : `Interacted with ${item.label || item.selector}`;

        if (!noteInput.value.trim()) {
          noteInput.value = notePrefix;
        }
        noteInput.focus();
      });

      recentChipsContainer.appendChild(chip);
    });
  }

  function formatTimeAgo(ts) {
    if (!ts) return '';
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 5) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  }

  // Clear Bound Target
  clearTargetBtn.addEventListener('click', () => {
    currentPickedSelector = '';
    currentRecentEventId = '';
    boundTargetPill.style.display = 'none';
    document.querySelectorAll('.recent-chip').forEach((c) => c.classList.remove('is-selected'));
  });

  // Quick phrase buttons
  phraseChips.forEach((btn) => {
    btn.addEventListener('click', () => {
      const phrase = btn.getAttribute('data-phrase');
      if (!phrase) return;
      if (noteInput.value.trim()) {
        noteInput.value += ` — ${phrase}`;
      } else {
        noteInput.value = phrase;
      }
      noteInput.focus();
    });
  });

  // 5. Open Settings & Workspace
  openOptionsBtn.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html') });
    }
  });

  workspaceBtn.addEventListener('click', async () => {
    chrome.storage.local.get(['api_endpoint'], (stored) => {
      const ep = stored.api_endpoint || CLOUD_PROD_API;
      const base = ep.replace(/\/api\/ingest\/?$/, '').replace(/\/+$/, '') || CLOUD_PROD_URL;
      chrome.tabs.create({ url: `${base}/app` });
    });
  });

  // 6. Element Picker integration
  pickBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;

      chrome.tabs.sendMessage(tab.id, { action: 'START_PICKER' }, (response) => {
        if (response?.selector) {
          currentPickedSelector = response.selector;
          boundText.textContent = currentPickedSelector;
          boundTargetPill.style.display = 'flex';
        }
      });
      window.close();
    } catch {
      updateStatus('Could not activate picker on this page', '#DC2626');
    }
  });

  // 7. Submit complaint note with auto-failover & full tester attribution
  submitBtn.addEventListener('click', async () => {
    const note = noteInput.value.trim();
    if (!note) {
      updateStatus('Please describe what looks wrong.', '#DC2626');
      return;
    }

    submitBtn.disabled = true;
    updateStatus('Flushing telemetry buffer & synthesizing report...', '#4B5563');

    // Flush any pending events in memory buffer to API first
    try {
      await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'FLUSH_NOW' }, () => resolve(true));
        setTimeout(resolve, 250);
      });
    } catch {}

    chrome.storage.local.get(['session_id', 'api_endpoint', 'tester_name', 'device_tag'], async (stored) => {
      let activeSessionId = stored.session_id;
      if (!activeSessionId) {
        activeSessionId = crypto.randomUUID();
        chrome.storage.local.set({ session_id: activeSessionId });
      }

      // Build ordered candidate base URLs with graceful automatic fallback
      const candidateBases = [];

      // 1. Configured endpoint base
      if (stored.api_endpoint) {
        const configuredBase = stored.api_endpoint.replace(/\/api\/ingest\/?$/, '').replace(/\/+$/, '');
        if (configuredBase && !configuredBase.includes('localhost:3000')) {
          candidateBases.push(configuredBase);
        }
      }

      // 2. Active Tab Origin (e.g. silentai.dpdns.org or vercel.app)
      if (currentTabOrigin && !currentTabOrigin.includes('localhost') && !currentTabOrigin.startsWith('chrome')) {
        if (!candidateBases.includes(currentTabOrigin)) {
          candidateBases.push(currentTabOrigin);
        }
      }

      // 3. Official Cloud Production
      if (!candidateBases.includes(CLOUD_PROD_URL)) {
        candidateBases.push(CLOUD_PROD_URL);
      }

      // 4. Localhost fallback if all else fails
      if (stored.api_endpoint && stored.api_endpoint.includes('localhost:3000')) {
        candidateBases.push('http://localhost:3000');
      }

      let success = false;
      let lastErrorMessage = '';

      for (const baseApiUrl of candidateBases) {
        try {
          updateStatus(`Connecting to ${baseApiUrl}...`, '#4B5563');
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 9000);

          const response = await fetch(`${baseApiUrl}/api/complaints`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              session_id: activeSessionId,
              note,
              picked_selector: currentPickedSelector || undefined,
              tester_name: stored.tester_name || 'Engineer #1',
              device_tag: stored.device_tag || 'Station-01',
              recent_event_id: currentRecentEventId || undefined,
              submitted_at: Date.now(),
            }),
          });
          clearTimeout(timeoutId);

          const data = await response.json();
          if (response.ok && data.report) {
            success = true;
            // Persist the working endpoint as default
            const workingEndpoint = `${baseApiUrl}/api/ingest`;
            chrome.storage.local.set({ api_endpoint: workingEndpoint });
            setGatewayLabel(baseApiUrl);

            updateStatus('✓ Defect synthesized! Opening report...', '#16A34A');
            noteInput.value = '';
            currentPickedSelector = '';
            currentRecentEventId = '';
            boundTargetPill.style.display = 'none';

            // Automatically open report in browser workspace
            setTimeout(() => {
              chrome.tabs.create({ url: `${baseApiUrl}/app/report/${data.report.id}` });
            }, 800);
            break;
          } else {
            lastErrorMessage = data?.error || `HTTP ${response.status} from ${baseApiUrl}`;
          }
        } catch (err) {
          lastErrorMessage = `Cannot reach ${baseApiUrl}`;
        }
      }

      if (!success) {
        updateStatus(`Failed to connect: ${lastErrorMessage}. Use ☁️ Cloud or ⚙ settings to update gateway.`, '#DC2626');
      }
      submitBtn.disabled = false;
    });
  });

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
