// ====================================================================
// SILENT QA: BACKGROUND SERVICE WORKER (worker.ts)
// Production ring buffer, offline queue, alarm watchdog & batch dispatcher
// ====================================================================

interface StoredEvent {
  id: string;
  session_id: string;
  ts: number;
  type: string;
  severity: string;
  [key: string]: unknown;
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let bufferCap = 500;
let flushRateMs = 2000;
let flushTimer: any = null;
const ringBuffer: StoredEvent[] = [];

// Dynamic session, tester & project state loaded from Chrome storage
let sessionId = generateUUID();
let sessionStartTs = Date.now();
let projectToken = 'sqa_live_demo_key_2026';
let apiEndpoint = 'http://localhost:3000/api/ingest';
let testerName = 'Engineer #1';
let deviceTag = 'Station-01';
let isRecordingEnabled = true;

function updateBadge() {
  try {
    if (chrome.action?.setBadgeText) {
      chrome.action.setBadgeText({ text: isRecordingEnabled ? 'REC' : 'OFF' });
      chrome.action.setBadgeBackgroundColor({
        color: isRecordingEnabled ? '#16A34A' : '#6B7280',
      });
    }
  } catch {}
}

function restartFlushTimer() {
  if (flushTimer) clearInterval(flushTimer);
  flushTimer = setInterval(flushEvents, flushRateMs);
}

// Hydrate from storage
chrome.storage.local.get(
  [
    'project_token',
    'session_id',
    'session_start_ts',
    'api_endpoint',
    'buffer_cap',
    'flush_rate',
    'tester_name',
    'device_tag',
    'sqa_recording_enabled',
  ],
  (res) => {
    if (res.project_token) projectToken = res.project_token;
    if (res.session_id) sessionId = res.session_id;
    if (res.session_start_ts) sessionStartTs = Number(res.session_start_ts);
    if (res.api_endpoint) apiEndpoint = res.api_endpoint;
    if (res.buffer_cap) bufferCap = Number(res.buffer_cap);
    if (res.tester_name) testerName = res.tester_name;
    if (res.device_tag) deviceTag = res.device_tag;
    if (typeof res.sqa_recording_enabled === 'boolean') {
      isRecordingEnabled = res.sqa_recording_enabled;
    }
    if (res.flush_rate) {
      flushRateMs = Number(res.flush_rate);
      restartFlushTimer();
    }
    if (!res.session_id) {
      chrome.storage.local.set({ session_id: sessionId, session_start_ts: sessionStartTs });
    }
    updateBadge();
  }
);

chrome.storage.onChanged.addListener((changes) => {
  if (changes.project_token) projectToken = changes.project_token.newValue;
  if (changes.session_id) sessionId = changes.session_id.newValue;
  if (changes.session_start_ts) sessionStartTs = Number(changes.session_start_ts.newValue);
  if (changes.api_endpoint) apiEndpoint = changes.api_endpoint.newValue;
  if (changes.buffer_cap) bufferCap = Number(changes.buffer_cap.newValue);
  if (changes.tester_name) testerName = changes.tester_name.newValue;
  if (changes.device_tag) deviceTag = changes.device_tag.newValue;
  if (changes.sqa_recording_enabled) {
    isRecordingEnabled = !!changes.sqa_recording_enabled.newValue;
    updateBadge();
  }
  if (changes.flush_rate) {
    flushRateMs = Number(changes.flush_rate.newValue);
    restartFlushTimer();
  }
});

// 1. Dual Keep-Alive: Port connections + Alarm watchdog + Message API
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'sqa_stream') {
    port.onMessage.addListener((msg) => {
      if (msg.type === 'HEARTBEAT') {
        port.postMessage({ type: 'HEARTBEAT_ACK', ts: Date.now() });
      } else if (msg.type === 'EVENT' && msg.payload) {
        if (!isRecordingEnabled) return;
        pushEvent({
          session_id: sessionId,
          ...msg.payload,
        });
      }
    });
  }
});

// Message Listener for Session Lifecycle (Start, Stop, Status, Manual Flush)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'START_SESSION') {
    sessionId = msg.sessionId || generateUUID();
    sessionStartTs = Date.now();
    isRecordingEnabled = true;
    if (msg.testerName) testerName = msg.testerName;
    if (msg.deviceTag) deviceTag = msg.deviceTag;

    chrome.storage.local.set({
      session_id: sessionId,
      session_start_ts: sessionStartTs,
      sqa_recording_enabled: true,
      tester_name: testerName,
      device_tag: deviceTag,
    });
    updateBadge();
    sendResponse({ success: true, sessionId, isRecording: true, sessionStartTs });
    return true;
  }

  if (msg.type === 'STOP_SESSION') {
    isRecordingEnabled = false;
    chrome.storage.local.set({ sqa_recording_enabled: false });
    updateBadge();
    flushEvents();
    sendResponse({ success: true, isRecording: false });
    return true;
  }

  if (msg.type === 'GET_STATUS') {
    sendResponse({
      isRecording: isRecordingEnabled,
      sessionId,
      sessionStartTs,
      bufferCount: ringBuffer.length,
      testerName,
      deviceTag,
      apiEndpoint,
    });
    return true;
  }

  if (msg.type === 'FLUSH_NOW') {
    flushEvents();
    sendResponse({ success: true, bufferCount: ringBuffer.length });
    return true;
  }

  if ((msg.type === 'EVENT' || msg.type === 'NEW_EVENT') && msg.payload) {
    if (isRecordingEnabled) {
      pushEvent({
        session_id: sessionId,
        ...msg.payload,
      });
    }
    return false;
  }
});

// Periodic alarm watchdog
chrome.alarms.create('sqa_flush_watchdog', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'sqa_flush_watchdog') {
    flushEvents();
  }
});

// 2. Buffer Management with Temporal & Session Mapping
function pushEvent(event: StoredEvent) {
  if (!isRecordingEnabled) return;
  if (!event.id || !event.id.includes('-')) {
    event.id = generateUUID();
  }
  event.session_id = sessionId;
  if (!event.ts) event.ts = Date.now();
  if (!event.iso_timestamp) event.iso_timestamp = new Date(event.ts).toISOString();

  if (ringBuffer.length >= bufferCap) {
    ringBuffer.shift(); // Evict oldest
  }
  ringBuffer.push(event);

  // Critical errors flush immediately
  if (event.severity === 'critical' || event.type === 'error') {
    flushEvents();
  }
}

// 3. Batch Flush to API
let isFlushing = false;
async function flushEvents() {
  if (isFlushing || ringBuffer.length === 0 || !isRecordingEnabled) return;
  isFlushing = true;

  const batch = ringBuffer.splice(0, 50);

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project_token: projectToken,
        session_id: sessionId,
        tester_name: testerName,
        device_tag: deviceTag,
        events: batch,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ingest HTTP status ${response.status}`);
    }

    // Success: Check if offline queue has accumulated events to drain
    chrome.storage.local.get(['sqa_offline_queue'], async (res) => {
      const offlineQueue = (res.sqa_offline_queue || []) as StoredEvent[];
      if (offlineQueue.length > 0) {
        const drainBatch = offlineQueue.splice(0, 50);
        try {
          const drainRes = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              project_token: projectToken,
              session_id: sessionId,
              tester_name: testerName,
              device_tag: deviceTag,
              events: drainBatch,
            }),
          });
          if (drainRes.ok) {
            chrome.storage.local.set({ sqa_offline_queue: offlineQueue });
          }
        } catch {
          // If network dropped again, leave queue intact
        }
      }
    });
  } catch (err) {
    // Offline / Network failure: Spool into chrome.storage.local
    chrome.storage.local.get(['sqa_offline_queue'], (result) => {
      const queue = (result.sqa_offline_queue || []) as StoredEvent[];
      const merged = queue.concat(batch).slice(-bufferCap);
      chrome.storage.local.set({ sqa_offline_queue: merged });
    });
  } finally {
    isFlushing = false;
  }
}

// Start recurring flush timer based on configured flush rate
restartFlushTimer();
updateBadge();
