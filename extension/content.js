// ============================================================
// Silent Backend QA — Content Script
// Injected into every page to silently capture:
// Console logs, JS errors, Network requests, DOM mutations,
// User actions, Performance metrics
// ============================================================

(function () {
  'use strict';

  const MAX_EVENTS = 500;
  const events = [];

  // PII Scrubbing Utility
  function scrubPII(obj) {
    if (!obj) return obj;
    if (typeof obj === 'string') {
      return obj
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
        .replace(/\b(?:\d[ -]*?){13,16}\b/g, '[REDACTED_CC]')
        .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED_PHONE]');
    }
    if (typeof obj === 'object') {
      const scrubbed = Array.isArray(obj) ? [] : {};
      for (const [key, value] of Object.entries(obj)) {
        if (key.toLowerCase().includes('password') || key.toLowerCase().includes('token')) {
          scrubbed[key] = '[REDACTED_SECRET]';
        } else {
          scrubbed[key] = scrubPII(value);
        }
      }
      return scrubbed;
    }
    return obj;
  }

  function addEvent(type, severity, payload) {
    let finalPayload = scrubPII(payload);

    // Capture DOM Snapshot on critical errors
    if (severity === 'critical') {
      try {
        const domSnapshot = document.body ? document.body.innerHTML.substring(0, 5000) : '';
        // Strip scripts to keep it clean
        finalPayload.domSnapshot = domSnapshot.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      } catch (e) { /* ignore */ }
    }

    const event = {
      event_type: type,
      severity: severity,
      payload: finalPayload,
      timestamp: new Date().toISOString(),
      source_url: window.location.href,
    };
    events.push(event);
    if (events.length > MAX_EVENTS) events.shift();

    // Send to background worker
    try {
      chrome.runtime.sendMessage({ type: 'NEW_EVENT', event });
    } catch (e) { /* extension context invalidated */ }
  }

  // ========== 1. CONSOLE CAPTURE ==========
  const originalConsole = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    info: console.info.bind(console),
  };

  console.log = function (...args) {
    addEvent('console_log', 'info', {
      message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '),
      level: 'log',
    });
    originalConsole.log(...args);
  };

  console.warn = function (...args) {
    addEvent('console_warn', 'warning', {
      message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '),
      level: 'warn',
    });
    originalConsole.warn(...args);
  };

  console.error = function (...args) {
    addEvent('console_error', 'error', {
      message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '),
      level: 'error',
    });
    originalConsole.error(...args);
  };

  // ========== 2. JS ERROR CAPTURE ==========
  window.addEventListener('error', (e) => {
    addEvent('js_error', 'critical', {
      message: e.message,
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
      stack: e.error?.stack || '',
    });
  });

  window.addEventListener('unhandledrejection', (e) => {
    addEvent('js_error', 'error', {
      message: `Unhandled Promise Rejection: ${e.reason}`,
      stack: e.reason?.stack || '',
      type: 'unhandledrejection',
    });
  });

  // ========== 3. NETWORK CAPTURE (fetch) ==========
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const startTime = performance.now();
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    const method = args[1]?.method || 'GET';

    let requestBody = null;
    try {
      if (args[1]?.body) {
        requestBody = typeof args[1].body === 'string'
          ? args[1].body.substring(0, 500)
          : '[Binary/FormData]';
      }
    } catch (e) { /* ignore */ }

    try {
      const response = await originalFetch.apply(this, args);
      const duration = Math.round(performance.now() - startTime);

      // Clone to read body without consuming
      const cloned = response.clone();
      let responseBody = '';
      try {
        const text = await cloned.text();
        responseBody = text.substring(0, 500);
      } catch (e) { /* ignore */ }

      const severity = response.status >= 500 ? 'critical' :
        response.status >= 400 ? 'error' : 'info';

      addEvent('network_response', severity, {
        method,
        url: url.substring(0, 300),
        status: response.status,
        statusText: response.statusText,
        duration_ms: duration,
        request_body: requestBody,
        response_body: responseBody,
        content_type: response.headers.get('content-type') || '',
      });

      return response;
    } catch (error) {
      addEvent('network_response', 'critical', {
        method,
        url: url.substring(0, 300),
        status: 0,
        error: error.message,
        duration_ms: Math.round(performance.now() - startTime),
      });
      throw error;
    }
  };

  // ========== 4. NETWORK CAPTURE (XMLHttpRequest) ==========
  const originalXHR = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    this._silentQA = { method, url: String(url).substring(0, 300), startTime: 0 };
    const xhr = this;

    const origSend = xhr.send;
    xhr.send = function (body) {
      xhr._silentQA.startTime = performance.now();
      xhr._silentQA.requestBody = body ? String(body).substring(0, 500) : null;

      xhr.addEventListener('load', function () {
        const duration = Math.round(performance.now() - xhr._silentQA.startTime);
        const severity = xhr.status >= 500 ? 'critical' :
          xhr.status >= 400 ? 'error' : 'info';

        addEvent('network_response', severity, {
          method: xhr._silentQA.method,
          url: xhr._silentQA.url,
          status: xhr.status,
          duration_ms: duration,
          response_body: xhr.responseText?.substring(0, 500) || '',
        });
      });

      xhr.addEventListener('error', function () {
        addEvent('network_response', 'critical', {
          method: xhr._silentQA.method,
          url: xhr._silentQA.url,
          status: 0,
          error: 'Network error',
        });
      });

      origSend.apply(this, arguments);
    };

    originalXHR.apply(this, arguments);
  };

  // ========== 5. DOM MUTATION CAPTURE ==========
  let mutationThrottle = null;
  const observer = new MutationObserver((mutations) => {
    if (mutationThrottle) return;
    mutationThrottle = setTimeout(() => { mutationThrottle = null; }, 500);

    for (const mutation of mutations.slice(0, 5)) {
      if (mutation.type === 'characterData') {
        addEvent('dom_mutation', 'info', {
          mutation_type: 'text_change',
          target_selector: getSelector(mutation.target.parentElement),
          old_value: (mutation.oldValue || '').substring(0, 200),
          new_value: (mutation.target.textContent || '').substring(0, 200),
        });
      } else if (mutation.type === 'childList') {
        if (mutation.addedNodes.length > 0) {
          addEvent('dom_mutation', 'info', {
            mutation_type: 'nodes_added',
            target_selector: getSelector(mutation.target),
            count: mutation.addedNodes.length,
            preview: getNodePreview(mutation.addedNodes[0]),
          });
        }
        if (mutation.removedNodes.length > 0) {
          addEvent('dom_mutation', 'info', {
            mutation_type: 'nodes_removed',
            target_selector: getSelector(mutation.target),
            count: mutation.removedNodes.length,
            preview: getNodePreview(mutation.removedNodes[0]),
          });
        }
      } else if (mutation.type === 'attributes') {
        addEvent('dom_mutation', 'info', {
          mutation_type: 'attribute_change',
          target_selector: getSelector(mutation.target),
          attribute: mutation.attributeName,
          old_value: (mutation.oldValue || '').substring(0, 100),
          new_value: (mutation.target.getAttribute?.(mutation.attributeName) || '').substring(0, 100),
        });
      }
    }
  });

  // Start observing when DOM is ready
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: true,
      attributes: true,
      attributeOldValue: true,
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        characterDataOldValue: true,
        attributes: true,
        attributeOldValue: true,
      });
    });
  }

  // ========== 6. USER ACTION CAPTURE ==========
  document.addEventListener('click', (e) => {
    const target = e.target;
    addEvent('user_action', 'info', {
      action: 'click',
      target_selector: getSelector(target),
      target_text: (target.textContent || '').trim().substring(0, 100),
      target_tag: target.tagName,
      coordinates: { x: e.clientX, y: e.clientY },
    });
  }, true);

  document.addEventListener('input', (e) => {
    const target = e.target;
    if (target.type === 'password') return; // Never capture passwords
    addEvent('user_action', 'info', {
      action: 'input',
      target_selector: getSelector(target),
      target_tag: target.tagName,
      input_type: target.type || 'text',
      value_length: (target.value || '').length,
    });
  }, true);

  // ========== 7. PERFORMANCE METRICS ==========
  if (window.PerformanceObserver) {
    try {
      const perfObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            addEvent('performance_metric', 'info', {
              metric: 'LCP',
              value: Math.round(entry.startTime),
              unit: 'ms',
            });
          } else if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
            addEvent('performance_metric', entry.value > 0.1 ? 'warning' : 'info', {
              metric: 'CLS',
              value: entry.value.toFixed(4),
            });
          } else if (entry.entryType === 'longtask') {
            addEvent('performance_metric', 'warning', {
              metric: 'Long Task',
              duration_ms: Math.round(entry.duration),
              start: Math.round(entry.startTime),
            });
          }
        }
      });
      perfObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      perfObserver.observe({ type: 'layout-shift', buffered: true });
      perfObserver.observe({ type: 'longtask', buffered: true });
    } catch (e) { /* browser doesn't support some entry types */ }
  }

  // ========== HELPERS ==========
  function getSelector(el) {
    if (!el || !el.tagName) return 'unknown';
    let selector = el.tagName.toLowerCase();
    if (el.id) selector += `#${el.id}`;
    if (el.className && typeof el.className === 'string') {
      const classes = el.className.trim().split(/\s+/).slice(0, 2).join('.');
      if (classes) selector += `.${classes}`;
    }
    return selector;
  }

  function getNodePreview(node) {
    if (!node) return '';
    if (node.nodeType === 3) return (node.textContent || '').substring(0, 100);
    if (node.tagName) return `<${node.tagName.toLowerCase()}>${(node.textContent || '').substring(0, 80)}`;
    return '';
  }

  // ========== EXPOSE TO BACKGROUND ==========
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'GET_EVENTS') {
      sendResponse({ events: events.slice(-100) });
    } else if (msg.type === 'GET_PAGE_INFO') {
      sendResponse({
        url: window.location.href,
        title: document.title,
        timestamp: new Date().toISOString(),
      });
    }
    return true;
  });

  // Log that the extension is active
  originalConsole.log('%c[Silent QA] 🔍 Extension active — monitoring started', 'color: #6366f1; font-weight: bold;');
})();
