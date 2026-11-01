document.addEventListener('DOMContentLoaded', () => {
  const noteInput = document.getElementById('complaint-note');
  const submitBtn = document.getElementById('btn-submit');
  const pickBtn = document.getElementById('btn-pick');
  const pickedLabel = document.getElementById('picked-label');
  const statusText = document.getElementById('status-text');

  let currentPickedSelector = '';

  // Element Picker integration
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

  submitBtn.addEventListener('click', async () => {
    const note = noteInput.value.trim();
    if (!note) {
      statusText.textContent = 'Please describe what looks wrong.';
      statusText.style.color = '#DC2626';
      return;
    }

    submitBtn.disabled = true;
    statusText.textContent = 'Mapping evidence & generating draft...';
    statusText.style.color = '#4B5563';

    // Retrieve active session ID from chrome storage
    chrome.storage.local.get(['session_id', 'api_endpoint'], async (stored) => {
      const activeSessionId = stored.session_id || 'ses_' + Date.now();
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
        if (response.ok) {
          statusText.textContent = '✓ Draft created in database! Open workspace to review.';
          statusText.style.color = '#16A34A';
          noteInput.value = '';
          currentPickedSelector = '';
          pickedLabel.style.display = 'none';
        } else {
          statusText.textContent = data?.error || 'Failed to submit flag.';
          statusText.style.color = '#DC2626';
        }
      } catch {
        statusText.textContent = `Cannot reach API at ${baseApiUrl}`;
        statusText.style.color = '#DC2626';
      } finally {
        submitBtn.disabled = false;
      }
    });
  });
});
