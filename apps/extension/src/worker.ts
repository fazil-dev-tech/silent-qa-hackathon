// ====================================================================
// SILENT QA: BACKGROUND SERVICE WORKER (worker.ts)
// Resilient ring buffer, offline queue, alarm watchdog & batch dispatcher
// ====================================================================

interface StoredEvent {
  id: string;
  session_id: string;
  ts: number;
  type: string;
  severity: string;
  [key: string]: unknown;
}

const BUFFER_CAP = 500;
const ringBuffer: StoredEvent[] = [];
let sessionId = 'ses_' + Math.random().toString(36).slice(2, 10);
let projectToken = 'sqa_live_demo_key_2026';
let apiEndpoint = 'http://localhost:3000/api/ingest';

// 1. Dual Keep-Alive: Port connections + Alarm watchdog
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'sqa_stream') {
    port.onMessage.addListener((msg) => {
      if (msg.type === 'HEARTBEAT') {
        // Resets Chrome's internal 30s worker termination timer
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
  if (ringBuffer.length >= BUFFER_CAP) {
    ringBuffer.shift(); // Evict oldest event
  }
  ringBuffer.push(event);
}

// 3. Batch Flush to API
let isFlushing = false;
async function flushEvents() {
  if (isFlushing || ringBuffer.length === 0) return;
  isFlushing = true;

  const batch = ringBuffer.splice(0, 50); // Take next 50 events

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

// Flush every 5 seconds
setInterval(flushEvents, 5000);

