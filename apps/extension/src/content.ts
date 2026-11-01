// ====================================================================
// SILENT QA: CONTENT SCRIPT (content.ts)
// Runs in isolated world; tracks DOM, clicks, shadow DOM & relays to worker
// ====================================================================

(() => {
  let port: chrome.runtime.Port | null = null;
  let heartbeatTimer: any = null;

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
    try {
      if (port) {
        port.postMessage({ type: 'EVENT', payload: eventData });
      } else {
        chrome.runtime.sendMessage({ type: 'EVENT', payload: eventData });
      }
    } catch {
      // In offline/suspended state, will recover on next tick
    }
  }

  // 2. Listen to MAIN-world events
  window.addEventListener('message', (event) => {
    if (event.source !== window || event.data?.source !== 'SILENT_QA_MAIN') return;
    sendToWorker(event.data.payload);
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

  // 4. Click tracker with Shadow DOM ComposedPath resolution
  let recentClicks: Array<{ ts: number; selector: string }> = [];

  document.addEventListener(
    'click',
    (e) => {
      const path = e.composedPath();
      let targetNode = (path && path.length > 0 ? path[0] : e.target) as Element;

      if (!targetNode || targetNode.nodeType !== Node.ELEMENT_NODE) return;

      const selector = getSelector(targetNode);
      const text = (targetNode.textContent || '').trim().slice(0, 50);

      // Check obscured click: is elementFromPoint pointing to something else?
      const topEl = document.elementFromPoint(e.clientX, e.clientY);
      const isObscured = topEl && topEl !== targetNode && !targetNode.contains(topEl);

      const now = Date.now();
      recentClicks.push({ ts: now, selector });
      recentClicks = recentClicks.filter((c) => now - c.ts <= 2000);

      // Rage click check
      const sameClicks = recentClicks.filter((c) => c.selector === selector);
      if (sameClicks.length >= 3) {
        sendToWorker({
          id: 'evt_' + Math.random().toString(36).slice(2, 10),
          ts: now,
          type: 'signal',
          severity: 'warn',
          text: `rage_click: 3+ clicks on ${selector} within 2s`,
          selector,
        });
      }

      sendToWorker({
        id: 'evt_' + Math.random().toString(36).slice(2, 10),
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

      if (isObscured) {
        sendToWorker({
          id: 'evt_' + Math.random().toString(36).slice(2, 10),
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

  // 5. MutationObserver for numeric value changes & dead click tracking
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'characterData' || m.type === 'childList') {
        const target = m.target as HTMLElement;
        const text = target.textContent || '';
        // Detect numeric change
        const numMatch = text.match(/\b\d+\b/);
        if (numMatch) {
          sendToWorker({
            id: 'evt_' + Math.random().toString(36).slice(2, 10),
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

  // 6. Interactive Element Picker Listener
  chrome.runtime.onMessage?.addListener((request, sender, sendResponse) => {
    if (request.action === 'START_PICKER') {
      let activeHoverEl: HTMLElement | null = null;

      function onMouseOver(e: MouseEvent) {
        if (activeHoverEl) activeHoverEl.style.outline = '';
        activeHoverEl = e.target as HTMLElement;
        if (activeHoverEl) activeHoverEl.style.outline = '2px dashed #DC2626';
      }

      function onClickPick(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        if (activeHoverEl) activeHoverEl.style.outline = '';

        document.removeEventListener('mouseover', onMouseOver, true);
        document.removeEventListener('click', onClickPick, true);

        const selector = getSelector((e.target as Element) || document.body);
        sendResponse({ selector });
      }

      document.addEventListener('mouseover', onMouseOver, true);
      document.addEventListener('click', onClickPick, true);
      return true; // Keep channel open for async response
    }
  });
})();

