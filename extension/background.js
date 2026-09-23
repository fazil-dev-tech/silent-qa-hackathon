// ============================================================
// Silent Backend QA — Background Service Worker
// Manages the event buffer, communicates with the backend API,
// and handles start/stop signals from the popup.
// ============================================================

const API_URL = 'http://localhost:3000/api/events';
let eventBuffer = [];
let sessionId = null;
let qaEngineer = 'Extension User';
let isMonitoring = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'NEW_EVENT') {
    if (isMonitoring) {
      eventBuffer.push(message.event);
      if (eventBuffer.length >= 20) {
        flushEvents();
      }
    }
    // We don't need to sendResponse for every event
    return false;
  } else if (message.type === 'START_SESSION') {
    qaEngineer = message.qaEngineer || 'Extension User';
    sessionId = null; // Will be assigned by backend
    isMonitoring = true;
    eventBuffer = []; // Clear old buffer
    console.log('[Silent QA] Session started for:', qaEngineer);
    sendResponse({ success: true });
    return true;
  } else if (message.type === 'STOP_SESSION') {
    isMonitoring = false;
    flushEvents();
    console.log('[Silent QA] Session stopped.');
    sessionId = null;
    sendResponse({ success: true });
    return true;
  } else if (message.type === 'GET_STATUS') {
    sendResponse({ isMonitoring, qaEngineer, sessionId, bufferLength: eventBuffer.length });
    return true;
  }
});

// Flush every 5 seconds if there are events
setInterval(() => {
  if (eventBuffer.length > 0 && isMonitoring) {
    flushEvents();
  }
}, 5000);

// Load offline events on startup
chrome.storage.local.get(['offlineEvents'], (result) => {
  if (result.offlineEvents && Array.isArray(result.offlineEvents)) {
    eventBuffer = [...result.offlineEvents, ...eventBuffer];
    console.log('[Silent QA] Loaded offline events:', result.offlineEvents.length);
  }
});

async function flushEvents() {
  // Pull from local storage to catch any offline backlog
  const storage = await chrome.storage.local.get(['offlineEvents']);
  const offlineEvents = storage.offlineEvents || [];
  
  const eventsToSend = [...offlineEvents, ...eventBuffer].slice(-1000); // Prevent massive payloads
  if (eventsToSend.length === 0) return;
  
  eventBuffer = []; // Clear memory buffer
  await chrome.storage.local.set({ offlineEvents: [] }); // Clear storage buffer

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: eventsToSend, sessionId, qaEngineer }),
    });

    if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

    const data = await response.json();
    if (data.sessionId && !sessionId) {
      sessionId = data.sessionId;
      console.log('[Silent QA] New session created:', sessionId);
    }
    console.log(`[Silent QA] Flushed ${eventsToSend.length} events successfully.`);
  } catch (err) {
    console.error('[Silent QA] Server offline. Saving to local storage:', err.message);
    // Push back to offline storage
    const existing = await chrome.storage.local.get(['offlineEvents']);
    const newOfflineBuffer = [...(existing.offlineEvents || []), ...eventsToSend].slice(-1000);
    await chrome.storage.local.set({ offlineEvents: newOfflineBuffer });
  }
}
