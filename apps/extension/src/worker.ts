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

const BUFFER_CAP = 500;
const ringBuffer: StoredEvent[] = [];

// Dynamic session & project state loaded from Chrome storage
let sessionId = generateUUID();
let projectToken = 'sqa_live_demo_key_2026';
let apiEndpoint = 'http://localhost:3000/api/ingest';

// Hydrate from storage
chrome.storage.local.get(['project_token', 'session_id', 'api_endpoint'], (res) => {
  if (res.project_token) projectToken = res.project_token;
  if (res.session_id) sessionId = res.session_id;
  if (res.api_endpoint) apiEndpoint = res.api_endpoint;
  else chrome.storage.local.set({ session_id: sessionId });
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.project_token) projectToken = changes.project_token.newValue;
  if (changes.session_id) sessionId = changes.session_id.newValue;
  if (changes.api_endpoint) apiEndpoint = changes.api_endpoint.newValue;
});

// 1. Dual Keep-Alive: Port connections + Alarm watchdog
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'sqa_stream') {
    port.onMessage.addListener((msg) => {
      if (msg.type === 'HEARTBEAT') {
        port.postMessage({ type: 'HEARTBEAT_ACK', ts: Date.now() });
      } else if (msg.type === 'EVENT' && msg.payload) {
        pushEvent({
          session_id: sessionId,
          ...msg.payload,
        });
      }
    });
  }
});

// Periodic alarm watchdog
chrome.alarms.create('sqa_flush_watchdog', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'sqa_flush_watchdog') {
    flushEvents();
  }
});

// 2. Buffer Management
function pushEvent(event: StoredEvent) {
  if (!event.id || !event.id.includes('-')) {
    event.id = generateUUID();
  }
  if (ringBuffer.length >= BUFFER_CAP) {
    ringBuffer.shift(); // Evict oldest
  }
  ringBuffer.push(event);
}

// 3. Batch Flush to API
let isFlushing = false;
async function flushEvents() {
  if (isFlushing || ringBuffer.length === 0) return;
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
        events: batch,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ingest HTTP status ${response.status}`);
    }
  } catch (err) {
    // Offline / Network failure: Spool into chrome.storage.local
    chrome.storage.local.get(['sqa_offline_queue'], (result) => {
      const queue = (result.sqa_offline_queue || []) as StoredEvent[];
      const merged = queue.concat(batch).slice(-BUFFER_CAP);
      chrome.storage.local.set({ sqa_offline_queue: merged });
    });
  } finally {
    isFlushing = false;
  }
}

// Flush every 2 seconds for low-latency realtime stream
setInterval(flushEvents, 2000);
