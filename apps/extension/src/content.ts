// ====================================================================
// SILENT QA: CONTENT SCRIPT (content.ts)
// Runs in isolated world; tracks DOM, clicks, shadow DOM & relays to worker
// ====================================================================

(() => {
  let port: chrome.runtime.Port | null = null;
  let heartbeatTimer: any = null;
  let isRecordingEnabled = true;

  // Track recent interactions for quick selection in popup
  interface RecentInteraction {
    id: string;
    type: 'click' | 'input' | 'error' | 'network_error';
    label: string;
    selector?: string;
    status?: number;
    url?: string;
    ts: number;
  }

  let recentInteractions: RecentInteraction[] = [];
  let statsCaptured = 0;
  let statsErrors = 0;

  // Hydrate recording state and recent items
  try {
    chrome.storage?.local?.get(['sqa_recording_enabled', 'sqa_recent_interactions', 'sqa_stats'], (res) => {
      if (typeof res?.sqa_recording_enabled === 'boolean') {
        isRecordingEnabled = res.sqa_recording_enabled;
      }
      if (Array.isArray(res?.sqa_recent_interactions)) {
        recentInteractions = res.sqa_recent_interactions;
      }
      if (res?.sqa_stats) {
        statsCaptured = res.sqa_stats.captured || 0;
        statsErrors = res.sqa_stats.errors || 0;
      }
    });

    chrome.storage?.onChanged?.addListener((changes) => {
      if (changes.sqa_recording_enabled) {
        isRecordingEnabled = !!changes.sqa_recording_enabled.newValue;
      }
    });
  } catch {}

  function updateRecentInteraction(item: RecentInteraction) {
    if (!isRecordingEnabled) return;
    recentInteractions = [item, ...recentInteractions.filter((i) => i.id !== item.id)].slice(0, 5);
    statsCaptured++;
    if (item.type === 'error' || item.type === 'network_error') {
      statsErrors++;
    }
    try {
      chrome.storage?.local?.set({
        sqa_recent_interactions: recentInteractions,
        sqa_stats: { captured: statsCaptured, errors: statsErrors, lastActive: Date.now() },
      });
    } catch {}
  }

  let sessionStartTs = Date.now();
  try {
    chrome.storage?.local?.get(['session_start_ts'], (res) => {
      if (res?.session_start_ts) {
        sessionStartTs = res.session_start_ts;
      }
    });
  } catch {}

  // PII Scrubbing Utility
  function scrubPII(obj: any): any {
    if (!obj) return obj;
    if (typeof obj === 'string') {
      return obj
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
        .replace(/\b(?:\d[ -]*?){13,16}\b/g, '[REDACTED_CC]')
        .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED_PHONE]');
    }
    if (typeof obj === 'object') {
      const isArr = Array.isArray(obj);
      const res: any = isArr ? [] : {};
      for (const [k, v] of Object.entries(obj)) {
        if (typeof k === 'string' && /password|token|secret|apiKey|auth|cvv|pin/i.test(k)) {
          res[k] = '[REDACTED_SECRET]';
        } else {
          res[k] = scrubPII(v);
        }
      }
      return res;
    }
    return obj;
  }

  // Emergency DOM Snapshot on Critical Failures
  function captureDomSnapshot(): string {
    try {
      const raw = document.body ? document.body.innerHTML.substring(0, 5000) : '';
      return raw.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    } catch {
      return '';
    }
  }

  // 1. Establish resilient port with worker (Keep-Alive loophole fix)
  function connectPort() {
    try {
      port = chrome.runtime.connect({ name: 'sqa_stream' });
      port.onDisconnect.addListener(() => {
        clearInterval(heartbeatTimer);
        setTimeout(connectPort, 1000); // Reconnect if service worker restarted
      });

      // Pulse heartbeat every 20s to prevent MV3 worker idling
      clearInterval(heartbeatTimer);
      heartbeatTimer = setInterval(() => {
        if (port) {
          port.postMessage({ type: 'HEARTBEAT', ts: Date.now() });
        }
      }, 20000);
    } catch {
      setTimeout(connectPort, 2000);
    }
  }

  connectPort();

  function sendToWorker(eventData: Record<string, unknown>) {
    if (!isRecordingEnabled) return; // 0 overhead when paused

    // 1. Client-Side PII Scrubbing
    const cleaned = scrubPII(eventData);

    // 2. High-Precision Temporal Mapping
    const now = typeof cleaned.ts === 'number' ? cleaned.ts : Date.now();
    cleaned.ts = now;
    cleaned.iso_timestamp = new Date(now).toISOString();
    cleaned.relative_ms = Math.max(0, now - sessionStartTs);

    // 3. Attach DOM Snapshot on Critical Server or JS Errors
    if (cleaned.severity === 'critical' || (typeof cleaned.status === 'number' && cleaned.status >= 500)) {
      const snapshot = captureDomSnapshot();
      if (!cleaned.metadata) cleaned.metadata = {};
      (cleaned.metadata as any).domSnapshot = snapshot;
      if (cleaned.shape && typeof cleaned.shape === 'object') {
        (cleaned.shape as any).domSnapshot = snapshot;
      }
    }

    try {
      if (port) {
        port.postMessage({ type: 'EVENT', payload: cleaned });
      } else {
        chrome.runtime.sendMessage({ type: 'EVENT', payload: cleaned });
      }
    } catch {
      // In offline/suspended state, will recover on next tick
    }
  }

  // 2. Listen to MAIN-world events
  let lastClickTs = 0;
  let lastClickSelector = '';
  let hasActivitySinceLastClick = false;

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.data?.source !== 'SILENT_QA_MAIN') return;
    if (!isRecordingEnabled) return;
    hasActivitySinceLastClick = true;
    const payload = event.data?.payload;
    if (!payload) return;

    // Track API errors or exceptions in recent interactions
    if (payload.type === 'network' && payload.status >= 400) {
      updateRecentInteraction({
        id: payload.id,
        type: 'network_error',
        label: `${payload.method || 'API'} ${payload.url} (${payload.status})`,
        url: payload.url,
        status: payload.status,
        ts: payload.ts || Date.now(),
      });
    } else if (payload.type === 'error' || payload.severity === 'error' || payload.severity === 'critical') {
      updateRecentInteraction({
        id: payload.id,
        type: 'error',
        label: `Error: ${(payload.text || payload.message || 'Exception').slice(0, 50)}`,
        ts: payload.ts || Date.now(),
      });
    }

    sendToWorker(payload);
  });

  // 3. Helper: Generate unique CSS selector
  function getSelector(el: Element): string {
    if (el.id) return `#${el.id}`;
    if (el.getAttribute('data-testid')) return `[data-testid="${el.getAttribute('data-testid')}"]`;
    if (el.className && typeof el.className === 'string') {
      const classes = el.className.trim().split(/\s+/).slice(0, 2).join('.');
      if (classes) return `${el.tagName.toLowerCase()}.${classes}`;
    }
    return el.tagName.toLowerCase();
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

  // 4. Click tracker with Shadow DOM ComposedPath resolution
  let recentClicks: Array<{ ts: number; selector: string }> = [];

  document.addEventListener(
    'click',
    (e) => {
      if (!isRecordingEnabled) return;
      const path = e.composedPath();
      let targetNode = (path && path.length > 0 ? path[0] : e.target) as Element;

      if (!targetNode || targetNode.nodeType !== Node.ELEMENT_NODE) return;

      const selector = getSelector(targetNode);
      const text = (targetNode.textContent || '').trim().slice(0, 50);

      // Check obscured click: is elementFromPoint pointing to something else?
      const topEl = document.elementFromPoint(e.clientX, e.clientY);
      const isObscured = topEl && topEl !== targetNode && !targetNode.contains(topEl);

      const now = Date.now();
      const clickEventId = generateUUID();
      recentClicks.push({ ts: now, selector });
      recentClicks = recentClicks.filter((c) => now - c.ts <= 2000);

      // Track into recent interactions for 1-click bug reporting in popup
      updateRecentInteraction({
        id: clickEventId,
        type: 'click',
        label: text ? `"${text}" (${selector})` : selector,
        selector,
        ts: now,
      });

      // Rage click check
      const sameClicks = recentClicks.filter((c) => c.selector === selector);
      if (sameClicks.length >= 3) {
        sendToWorker({
          id: generateUUID(),
          ts: now,
          type: 'signal',
          severity: 'warn',
          text: `rage_click: 3+ clicks on ${selector} within 2s`,
          selector,
        });
      }

      sendToWorker({
        id: clickEventId,
        ts: now,
        type: 'click',
        severity: 'info',
        selector,
        text,
        metadata: {
          x: e.clientX,
          y: e.clientY,
          isObscured,
        },
      });

      // Dead click tracking for interactive elements
      const isInteractive = targetNode.matches('button, a, input[type="button"], input[type="submit"], [role="button"], [onclick]');
      if (isInteractive) {
        lastClickTs = now;
        lastClickSelector = selector;
        hasActivitySinceLastClick = false;
        setTimeout(() => {
          if (!hasActivitySinceLastClick && lastClickSelector === selector && Date.now() - lastClickTs >= 750) {
            sendToWorker({
              id: generateUUID(),
              ts: Date.now(),
              type: 'signal',
              severity: 'warn',
              text: `dead_click: Click on ${selector} produced no DOM update or network response`,
              selector,
            });
          }
        }, 800);
      }

      if (isObscured) {
        sendToWorker({
          id: generateUUID(),
          ts: now,
          type: 'signal',
          severity: 'warn',
          text: `obscured_click: Click on ${selector} was obscured by ${topEl ? getSelector(topEl) : 'overlay'}`,
          selector,
        });
      }
    },
    true
  );

  // 4b. Input and change tracking with sensitive data masking
  document.addEventListener(
    'change',
    (e) => {
      if (!isRecordingEnabled) return;
      const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (!target || !target.tagName) return;

      const selector = getSelector(target);
      const inputType = (target.getAttribute('type') || '').toLowerCase();
      const nameOrId = `${target.name || ''} ${target.id || ''} ${target.getAttribute('autocomplete') || ''}`.toLowerCase();

      const isSensitive =
        inputType === 'password' ||
        /password|pass|card|cvv|secret|token|ssn|auth|pin|key/.test(nameOrId);

      const val = target.value || '';
      const maskedText = isSensitive ? '[MASKED]' : val.slice(0, 30);

      const inputEventId = generateUUID();
      updateRecentInteraction({
        id: inputEventId,
        type: 'input',
        label: `${selector} (${inputType || 'field'})`,
        selector,
        ts: Date.now(),
      });

      hasActivitySinceLastClick = true;
      sendToWorker({
        id: inputEventId,
        ts: Date.now(),
        type: 'input',
        severity: 'info',
        selector,
        text: `input_change: ${maskedText}`,
        metadata: {
          isSensitive,
          charCount: val.length,
        },
      });
    },
    true
  );

  // 4c. Single Page App Navigation tracking
  function reportNavigation(url: string, trigger: string) {
    hasActivitySinceLastClick = true;
    sendToWorker({
      id: generateUUID(),
      ts: Date.now(),
      type: 'navigation',
      severity: 'info',
      url,
      text: `navigation (${trigger}): ${url}`,
    });
  }

  window.addEventListener('popstate', () => reportNavigation(window.location.href, 'popstate'));
  window.addEventListener('hashchange', () => reportNavigation(window.location.href, 'hashchange'));

  // 4d. Form submission tracking
  document.addEventListener(
    'submit',
    (e) => {
      const form = e.target as HTMLFormElement;
      if (!form || !form.tagName) return;
      hasActivitySinceLastClick = true;
      sendToWorker({
        id: generateUUID(),
        ts: Date.now(),
        type: 'form_submit',
        severity: 'info',
        selector: getSelector(form),
        text: `form_submit: ${form.action || window.location.pathname} (${form.method || 'GET'})`,
      });
    },
    true
  );

  // 5. MutationObserver for numeric value changes & dead click tracking
  const observer = new MutationObserver((mutations) => {
    hasActivitySinceLastClick = true;
    for (const m of mutations) {
      if (m.type === 'characterData' || m.type === 'childList') {
        const target = m.target as HTMLElement;
        const text = target.textContent || '';
        // Detect numeric change
        const numMatch = text.match(/\b\d+\b/);
        if (numMatch) {
          sendToWorker({
            id: generateUUID(),
            ts: Date.now(),
            type: 'dom',
            severity: 'info',
            selector: target.parentElement ? getSelector(target.parentElement) : 'body',
            text: `text_update: ${text.slice(0, 30)}`,
          });
        }
      }
    }
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  // 5b. Web Vitals & Performance Telemetry (LCP, CLS, Long Tasks)
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      const perfObserver = new PerformanceObserver((list) => {
        if (!isRecordingEnabled) return;
        for (const entry of list.getEntries()) {
          const now = Date.now();
          if (entry.entryType === 'largest-contentful-paint') {
            sendToWorker({
              id: generateUUID(),
              ts: now,
              type: 'performance',
              severity: 'info',
              text: `LCP (Largest Contentful Paint): ${Math.round(entry.startTime)}ms`,
              shape: {
                metric: 'LCP',
                value: Math.round(entry.startTime),
                unit: 'ms',
              },
            });
          } else if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            const shiftValue = (entry as any).value || 0;
            if (shiftValue > 0.05) {
              sendToWorker({
                id: generateUUID(),
                ts: now,
                type: 'performance',
                severity: shiftValue > 0.1 ? 'warn' : 'info',
                text: `CLS (Cumulative Layout Shift): ${shiftValue.toFixed(4)}`,
                shape: {
                  metric: 'CLS',
                  value: shiftValue.toFixed(4),
                },
              });
            }
          } else if (entry.entryType === 'longtask') {
            const durationMs = Math.round(entry.duration);
            if (durationMs > 50) {
              sendToWorker({
                id: generateUUID(),
                ts: now,
                type: 'performance',
                severity: 'warn',
                text: `Long Task detected: ${durationMs}ms`,
                shape: {
                  metric: 'Long Task',
                  duration_ms: durationMs,
                  start_ms: Math.round(entry.startTime),
                },
              });
            }
          }
        }
      });

      perfObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      perfObserver.observe({ type: 'layout-shift', buffered: true });
      perfObserver.observe({ type: 'longtask', buffered: true });
    } catch {
      // Browser doesn't support some entry types
    }
  }

  // 6. Interactive Element Picker & State Listener
  chrome.runtime.onMessage?.addListener((request, sender, sendResponse) => {
    if (request.action === 'SET_RECORDING_STATE') {
      isRecordingEnabled = !!request.enabled;
      sendResponse({ success: true, enabled: isRecordingEnabled });
      return;
    }

    if (request.action === 'GET_RECORDING_STATE') {
      sendResponse({ enabled: isRecordingEnabled });
      return;
    }

    if (request.action === 'START_PICKER') {
      let activeHoverEl: HTMLElement | null = null;

      function onMouseOver(e: MouseEvent) {
        if (activeHoverEl) activeHoverEl.style.outline = '';
        activeHoverEl = e.target as HTMLElement;
        if (activeHoverEl) activeHoverEl.style.outline = '2px dashed #DC2626';
      }

      function cleanupPicker() {
        if (activeHoverEl) activeHoverEl.style.outline = '';
        document.removeEventListener('mouseover', onMouseOver, true);
        document.removeEventListener('click', onClickPick, true);
        document.removeEventListener('keydown', onKeyDown, true);
      }

      function onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
          cleanupPicker();
          sendResponse({ cancelled: true });
        }
      }

      function onClickPick(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        cleanupPicker();

        const selector = getSelector((e.target as Element) || document.body);
        sendResponse({ selector });
      }

      document.addEventListener('mouseover', onMouseOver, true);
      document.addEventListener('click', onClickPick, true);
      document.addEventListener('keydown', onKeyDown, true);
      return true; // Keep channel open for async response
    }
  });
})();

