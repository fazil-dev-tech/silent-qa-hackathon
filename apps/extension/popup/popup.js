document.addEventListener('DOMContentLoaded', async () => {
  const noteInput = document.getElementById('complaint-note');
  const submitBtn = document.getElementById('btn-submit');
  const pickBtn = document.getElementById('btn-pick');
  const statusText = document.getElementById('status-text');
  const siteHost = document.getElementById('site-host');
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
  let activeTesterName = 'Engineer #1';
  let activeDeviceTag = 'Station-01';

  // 1. Identify active tab host
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      try {
        const u = new URL(tab.url);
        siteHost.textContent = `${u.hostname}${u.port ? ':' + u.port : ''}`;
      } catch {
        siteHost.textContent = tab.url.slice(0, 30);
      }
    }
  } catch {
    siteHost.textContent = 'Active Browser Tab';
  }

  // 2. Master Recording Toggle Sync & Controller
  function renderRecordingState(enabled) {
    isRecordingEnabled = enabled;
    if (enabled) {
      toggleRecordingBtn.className = 'rec-toggle';
      recStatusText.textContent = 'RECORDING: ON';
      toggleRecordingBtn.title = 'Recording is ACTIVE. Click to pause telemetry capture.';
      pausedBanner.style.display = 'none';
    } else {
      toggleRecordingBtn.className = 'rec-toggle is-paused';
      recStatusText.textContent = 'RECORDING: PAUSED';
      toggleRecordingBtn.title = 'Recording is PAUSED. Click to resume telemetry capture.';
      pausedBanner.style.display = 'flex';
    }
  }

  toggleRecordingBtn.addEventListener('click', () => {
    const nextState = !isRecordingEnabled;
    renderRecordingState(nextState);
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

  // 3. Hydrate storage (Session ID, Tester Identity, Recent Items, Stats)
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
      activeTesterName = stored.tester_name || 'Engineer #1';
      activeDeviceTag = stored.device_tag || 'Station-01';
      testerDisplay.textContent = activeTesterName;
      stationDisplay.textContent = activeDeviceTag;

      // Stats
      const captured = stored.sqa_stats?.captured || 0;
      const errors = stored.sqa_stats?.errors || 0;
      recentCount.textContent = errors > 0 ? `${captured} ev (${errors} err)` : `${captured} ev`;

      // Render Recent Interactions
      renderRecentInteractions(stored.sqa_recent_interactions || []);
    }
  );

  // 4. Render and Bind Recent Interactions
  function renderRecentInteractions(items) {
    if (!items || items.length === 0) {
      recentChipsContainer.innerHTML =
        '<div class="recent-empty">No actions captured yet. Interacting with page populates this list.</div>';
      return;
    }

    recentChipsContainer.innerHTML = '';
    items.slice(0, 4).forEach((item) => {
      const chip = document.createElement('div');
      chip.className = 'recent-chip';

      let icon = '🔘';
      if (item.type === 'error' || item.type === 'network_error') {
        icon = '⚠️';
      } else if (item.type === 'input') {
        icon = '📝';
      }

      const elapsed = Math.max(0, Math.round((Date.now() - item.ts) / 1000));
      const timeStr = elapsed < 60 ? `${elapsed}s ago` : `${Math.round(elapsed / 60)}m ago`;

      chip.innerHTML = `
        <span class="chip-icon">${icon}</span>
        <div class="chip-info">
          <div class="chip-title">${escapeHtml(item.label || item.selector || 'Element')}</div>
          <div class="chip-meta">${escapeHtml(item.type.toUpperCase())} • ${timeStr}</div>
        </div>
      `;

      chip.addEventListener('click', () => {
        // Toggle selection
        const alreadySelected = chip.classList.contains('is-selected');
        document.querySelectorAll('.recent-chip').forEach((c) => c.classList.remove('is-selected'));

        if (!alreadySelected) {
          chip.classList.add('is-selected');
          currentPickedSelector = item.selector || '';
          currentRecentEventId = item.id || '';
          boundText.textContent = item.selector || item.label || 'Selected Target';
          boundTargetPill.style.display = 'flex';

          // Pre-populate complaint if empty
          if (!noteInput.value.trim()) {
            if (item.type === 'network_error') {
              noteInput.value = `API request to ${item.label} failed with status ${item.status || 500}`;
            } else if (item.type === 'click') {
              noteInput.value = `Clicking "${item.label}" does not respond or failed`;
            }
          }
        } else {
          currentPickedSelector = '';
          currentRecentEventId = '';
          boundTargetPill.style.display = 'none';
        }
      });

      recentChipsContainer.appendChild(chip);
    });
  }

  // Clear target button
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

  workspaceBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000/app' });
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
      statusText.textContent = 'Could not activate picker on this page';
    }
  });

  // 7. Submit complaint note & trigger AI synthesis with full tester attribution
  submitBtn.addEventListener('click', async () => {
    const note = noteInput.value.trim();
    if (!note) {
      statusText.textContent = 'Please describe what looks wrong.';
      statusText.style.color = '#DC2626';
      return;
    }

    submitBtn.disabled = true;
    statusText.textContent = 'Synthesizing report via OpenRouter AI...';
    statusText.style.color = '#4B5563';

    chrome.storage.local.get(['session_id', 'api_endpoint', 'tester_name', 'device_tag'], async (stored) => {
      let activeSessionId = stored.session_id;
      if (!activeSessionId) {
        activeSessionId = crypto.randomUUID();
        chrome.storage.local.set({ session_id: activeSessionId });
      }
      const baseApiUrl = (stored.api_endpoint || 'http://localhost:3000/api/ingest').replace('/api/ingest', '');

      try {
        const response = await fetch(`${baseApiUrl}/api/complaints`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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

        const data = await response.json();
        if (response.ok && data.report) {
          statusText.textContent = '✓ Defect synthesized! Opening report...';
          statusText.style.color = '#16A34A';
          noteInput.value = '';
          currentPickedSelector = '';
          currentRecentEventId = '';
          boundTargetPill.style.display = 'none';

          // Automatically open report in browser workspace
          setTimeout(() => {
            chrome.tabs.create({ url: `${baseApiUrl}/app/report/${data.report.id}` });
          }, 800);
        } else {
          statusText.textContent = data?.error || 'Failed to submit flag.';
          statusText.style.color = '#DC2626';
        }
      } catch (err) {
        statusText.textContent = `Cannot reach API at ${baseApiUrl}`;
        statusText.style.color = '#DC2626';
      } finally {
        submitBtn.disabled = false;
      }
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
