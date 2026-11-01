document.addEventListener('DOMContentLoaded', async () => {
  const noteInput = document.getElementById('complaint-note');
  const submitBtn = document.getElementById('btn-submit');
  const pickBtn = document.getElementById('btn-pick');
  const pickedLabel = document.getElementById('picked-label');
  const statusText = document.getElementById('status-text');
  const siteHost = document.getElementById('site-host');
  const sessionDisplay = document.getElementById('session-display');
  const workspaceBtn = document.getElementById('btn-workspace');

  let currentPickedSelector = '';

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

  // 2. Hydrate session ID
  chrome.storage.local.get(['session_id', 'api_endpoint'], (stored) => {
    let activeSessionId = stored.session_id;
    if (!activeSessionId) {
      activeSessionId = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
      chrome.storage.local.set({ session_id: activeSessionId });
    }
    sessionDisplay.textContent = activeSessionId.slice(0, 13) + '...';
  });

  // 3. Open QA Workspace button
  workspaceBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000/app' });
  });

  // 4. Element Picker integration
  pickBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;

      chrome.tabs.sendMessage(tab.id, { action: 'START_PICKER' }, (response) => {
        if (response?.selector) {
          currentPickedSelector = response.selector;
          pickedLabel.textContent = `Target: ${currentPickedSelector}`;
          pickedLabel.style.display = 'block';
        }
      });
      window.close();
    } catch {
      statusText.textContent = 'Could not activate picker on this page';
    }
  });

  // 5. Submit complaint note & trigger AI synthesis
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

    chrome.storage.local.get(['session_id', 'api_endpoint'], async (stored) => {
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
            submitted_at: Date.now(),
          }),
        });

        const data = await response.json();
        if (response.ok && data.report) {
          statusText.textContent = '✓ Defect synthesized! Opening report...';
          statusText.style.color = '#16A34A';
          noteInput.value = '';
          currentPickedSelector = '';
          pickedLabel.style.display = 'none';

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
});
