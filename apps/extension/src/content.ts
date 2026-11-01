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
  let lastClickTs = 0;
  let lastClickSelector = '';
  let hasActivitySinceLastClick = false;

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.data?.source !== 'SILENT_QA_MAIN') return;
    hasActivitySinceLastClick = true;
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
          id: generateUUID(),
          ts: now,
          type: 'signal',
          severity: 'warn',
          text: `rage_click: 3+ clicks on ${selector} within 2s`,
          selector,
        });
      }

      sendToWorker({
        id: generateUUID(),
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

      hasActivitySinceLastClick = true;
      sendToWorker({
        id: generateUUID(),
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

  // 6. Interactive Element Picker Listener
  chrome.runtime.onMessage?.addListener((request, sender, sendResponse) => {
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

