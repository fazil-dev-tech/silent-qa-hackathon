document.addEventListener('DOMContentLoaded', () => {
  const testerNameInput = document.getElementById('tester-name');
  const deviceTagInput = document.getElementById('device-tag');
  const defaultRecSelect = document.getElementById('default-rec-state');
  const endpointInput = document.getElementById('api-endpoint');
  const tokenInput = document.getElementById('project-token');
  const bufferSelect = document.getElementById('buffer-capacity');
  const flushSelect = document.getElementById('flush-interval');
  const piiSelect = document.getElementById('pii-level');
  const currentSessionEl = document.getElementById('current-session-id');
  const copySessionBtn = document.getElementById('btn-copy-session');
  const newSessionBtn = document.getElementById('btn-new-session');
  const clearQueueBtn = document.getElementById('btn-clear-queue');
  const testGatewayBtn = document.getElementById('btn-test-gateway');
  const gatewayStatus = document.getElementById('gateway-status');
  const form = document.getElementById('settings-form');
  const resetBtn = document.getElementById('btn-reset');
  const statusMsg = document.getElementById('status-msg');

  function generateUUID() {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
  }

  const CLOUD_PROD_API = 'https://hhhcct.vercel.app/api/ingest';
  const LOCAL_DEV_API = 'http://localhost:3000/api/ingest';

  const btnPresetCloud = document.getElementById('btn-preset-cloud');
  const btnPresetLocal = document.getElementById('btn-preset-local');

  if (btnPresetCloud) {
    btnPresetCloud.addEventListener('click', () => {
      endpointInput.value = CLOUD_PROD_API;
      showToast('✓ Selected Cloud Production Gateway', '#EFF6FF', '#1D4ED8', '#BFDBFE');
    });
  }

  if (btnPresetLocal) {
    btnPresetLocal.addEventListener('click', () => {
      endpointInput.value = LOCAL_DEV_API;
      showToast('✓ Selected Localhost Gateway', '#EFF6FF', '#1D4ED8', '#BFDBFE');
    });
  }

  // 1. Load stored settings or defaults
  chrome.storage.local.get(
    [
      'tester_name',
      'device_tag',
      'default_rec_state',
      'api_endpoint',
      'project_token',
      'flush_rate',
      'buffer_cap',
      'pii_level',
      'session_id',
    ],
    (res) => {
      testerNameInput.value = res.tester_name || 'Engineer #1 - QA Rig';
      deviceTagInput.value = res.device_tag || 'Station-01 (Chrome)';
      defaultRecSelect.value = res.default_rec_state || 'active';
      endpointInput.value = res.api_endpoint || CLOUD_PROD_API;
      tokenInput.value = res.project_token || 'sqa_live_demo_key_2026';
      if (res.flush_rate) flushSelect.value = String(res.flush_rate);
      if (res.buffer_cap) bufferSelect.value = String(res.buffer_cap);
      if (res.pii_level) piiSelect.value = res.pii_level;

      let sessionId = res.session_id;
      if (!sessionId) {
        sessionId = generateUUID();
        chrome.storage.local.set({ session_id: sessionId });
      }
      currentSessionEl.textContent = sessionId;
    }
  );

  // 2. Generate New Session UUID
  newSessionBtn.addEventListener('click', () => {
    const newId = generateUUID();
    chrome.storage.local.set({ session_id: newId }, () => {
      currentSessionEl.textContent = newId;
      showToast('✓ Generated fresh Session UUID! Previous telemetry is cleanly sealed.', '#DCFCE7', '#166534', '#86EFAC');
    });
  });

  // 3. Copy Session UUID
  copySessionBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(currentSessionEl.textContent);
    copySessionBtn.textContent = 'Copied!';
    setTimeout(() => {
      copySessionBtn.textContent = 'Copy';
    }, 1500);
  });

  // 4. Clear Local Offline Queue
  clearQueueBtn.addEventListener('click', () => {
    chrome.storage.local.remove(['sqa_offline_queue', 'sqa_recent_interactions'], () => {
      showToast('✓ Local offline queue & interaction buffer cleared.', '#EFF6FF', '#1D4ED8', '#BFDBFE');
    });
  });

  // 5. Test Gateway Latency & Health
  testGatewayBtn.addEventListener('click', async () => {
    const ep = endpointInput.value.trim();
    const token = tokenInput.value.trim();

    gatewayStatus.textContent = 'Pinging gateway...';
    gatewayStatus.style.color = '#4B5563';

    const t0 = performance.now();
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_token: token,
          session_id: currentSessionEl.textContent || generateUUID(),
          tester_name: testerNameInput.value.trim() || 'Health-Check',
          device_tag: deviceTagInput.value.trim() || 'Diagnostic',
          events: [
            {
              id: generateUUID(),
              session_id: currentSessionEl.textContent || generateUUID(),
              ts: Date.now(),
              type: 'signal',
              severity: 'info',
              text: 'gateway_health_check_ping',
            },
          ],
        }),
      });

      const latency = Math.round(performance.now() - t0);
      if (res.ok) {
        gatewayStatus.textContent = `✓ Connected to Supabase Gateway (${latency}ms round-trip)`;
        gatewayStatus.style.color = '#16A34A';
      } else {
        const errJson = await res.json().catch(() => ({}));
        gatewayStatus.textContent = `⚠️ Gateway responded with HTTP ${res.status}: ${errJson.error || 'Check project key'}`;
        gatewayStatus.style.color = '#DC2626';
      }
    } catch (err) {
      gatewayStatus.textContent = `✕ Connection failed: Could not reach ${ep}`;
      gatewayStatus.style.color = '#DC2626';
    }
  });

  // 6. Save settings
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const settings = {
      tester_name: testerNameInput.value.trim(),
      device_tag: deviceTagInput.value.trim(),
      default_rec_state: defaultRecSelect.value,
      api_endpoint: endpointInput.value.trim(),
      project_token: tokenInput.value.trim(),
      flush_rate: Number(flushSelect.value),
      buffer_cap: Number(bufferSelect.value),
      pii_level: piiSelect.value,
    };

    chrome.storage.local.set(settings, () => {
      showToast('✓ Fleet configuration and tester profile saved successfully!', '#DCFCE7', '#166534', '#86EFAC');
    });
  });

  // 7. Reset settings to default
  resetBtn.addEventListener('click', () => {
    testerNameInput.value = 'Engineer #1 - QA Rig';
    deviceTagInput.value = 'Station-01 (Chrome)';
    defaultRecSelect.value = 'active';
    endpointInput.value = CLOUD_PROD_API;
    tokenInput.value = 'sqa_live_demo_key_2026';
    flushSelect.value = '2000';
    bufferSelect.value = '500';
    piiSelect.value = 'strict';

    chrome.storage.local.set(
      {
        tester_name: 'Engineer #1 - QA Rig',
        device_tag: 'Station-01 (Chrome)',
        default_rec_state: 'active',
        api_endpoint: CLOUD_PROD_API,
        project_token: 'sqa_live_demo_key_2026',
        flush_rate: 2000,
        buffer_cap: 500,
        pii_level: 'strict',
      },
      () => {
        showToast('✓ Preferences reset to defaults (Cloud Production Gateway).', '#EFF6FF', '#1D4ED8', '#BFDBFE');
      }
    );
  });

  function showToast(msg, bg, color, border) {
    statusMsg.textContent = msg;
    statusMsg.style.display = 'block';
    statusMsg.style.background = bg;
    statusMsg.style.color = color;
    statusMsg.style.border = `1px solid ${border}`;

    setTimeout(() => {
      statusMsg.style.display = 'none';
    }, 3500);
  }
});
