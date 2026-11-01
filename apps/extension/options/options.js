document.addEventListener('DOMContentLoaded', () => {
  const endpointInput = document.getElementById('api-endpoint');
  const tokenInput = document.getElementById('project-token');
  const flushSelect = document.getElementById('flush-interval');
  const bufferSelect = document.getElementById('buffer-capacity');
  const piiSelect = document.getElementById('pii-level');
  const form = document.getElementById('settings-form');
  const resetBtn = document.getElementById('btn-reset');
  const statusMsg = document.getElementById('status-msg');

  // Load stored settings or defaults
  chrome.storage.local.get(
    ['api_endpoint', 'project_token', 'flush_interval_ms', 'buffer_capacity', 'pii_level'],
    (res) => {
      if (res.api_endpoint) endpointInput.value = res.api_endpoint;
      if (res.project_token) tokenInput.value = res.project_token;
      if (res.flush_interval_ms) flushSelect.value = String(res.flush_interval_ms);
      if (res.buffer_capacity) bufferSelect.value = String(res.buffer_capacity);
      if (res.pii_level) piiSelect.value = res.pii_level;
    }
  );

  // Save settings
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const settings = {
      api_endpoint: endpointInput.value.trim(),
      project_token: tokenInput.value.trim(),
      flush_interval_ms: Number(flushSelect.value),
      buffer_capacity: Number(bufferSelect.value),
      pii_level: piiSelect.value,
    };

    chrome.storage.local.set(settings, () => {
      statusMsg.textContent = '✓ Extension preferences saved successfully!';
      statusMsg.style.display = 'block';
      statusMsg.style.background = '#DCFCE7';
      statusMsg.style.color = '#166534';
      statusMsg.style.border = '1px solid #86EFAC';

      setTimeout(() => {
        statusMsg.style.display = 'none';
      }, 3000);
    });
  });

  // Reset settings
  resetBtn.addEventListener('click', () => {
    endpointInput.value = 'http://localhost:3000/api/ingest';
    tokenInput.value = 'sqa_live_demo_key_2026';
    flushSelect.value = '2000';
    bufferSelect.value = '500';
    piiSelect.value = 'strict';

    chrome.storage.local.set(
      {
        api_endpoint: 'http://localhost:3000/api/ingest',
        project_token: 'sqa_live_demo_key_2026',
        flush_interval_ms: 2000,
        buffer_capacity: 500,
        pii_level: 'strict',
      },
      () => {
        statusMsg.textContent = '✓ Preferences reset to defaults.';
        statusMsg.style.display = 'block';
        statusMsg.style.background = '#EFF6FF';
        statusMsg.style.color = '#1D4ED8';
        statusMsg.style.border = '1px solid #BFDBFE';

        setTimeout(() => {
          statusMsg.style.display = 'none';
        }, 3000);
      }
    );
  });
});

