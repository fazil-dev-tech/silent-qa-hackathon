// ====================================================================
// SILENT QA: MAIN-WORLD INJECTOR (inject-main.ts)
// Runs directly in page execution context to intercept runtime internals
// ====================================================================

(() => {
  // Prevent duplicate injection
  if ((window as any).__SILENT_QA_INJECTED__) return;
  (window as any).__SILENT_QA_INJECTED__ = true;

  function relay(type: string, data: Record<string, unknown>, severity: 'info' | 'warn' | 'error' = 'info') {
    window.postMessage(
      {
        source: 'SILENT_QA_MAIN',
        payload: {
          id: 'evt_' + Math.random().toString(36).slice(2, 10),
          ts: Date.now(),
          type,
          severity,
          ...data,
        },
      },
      '*'
    );
  }

  // 1. Monkey-patch window.fetch
  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    const start = performance.now();
    const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url || 'unknown';
    const init = args[1] || {};
    const method = (init.method || 'GET').toUpperCase();

    try {
      const response = await origFetch.apply(this, args);
      const duration = Math.round(performance.now() - start);

      relay(
        'network',
        {
          url,
          method,
          status: response.status,
          duration_ms: duration,
        },
        response.status >= 400 ? 'error' : 'info'
      );

      return response;
    } catch (err: any) {
      const duration = Math.round(performance.now() - start);
      relay(
        'network',
        {
          url,
          method,
          status: 0,
          duration_ms: duration,
          text: err?.message || 'Network fetch error',
        },
        'error'
      );
      throw err;
    }
  };

  // 2. Monkey-patch XMLHttpRequest
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method: string, url: string | URL) {
    (this as any)._sqa_method = method;
    (this as any)._sqa_url = url.toString();
    (this as any)._sqa_start = performance.now();
    return origOpen.apply(this, arguments as any);
  };

  XMLHttpRequest.prototype.send = function () {
    this.addEventListener('loadend', () => {
      const duration = Math.round(performance.now() - ((this as any)._sqa_start || performance.now()));
      relay(
        'network',
        {
          url: (this as any)._sqa_url,
          method: ((this as any)._sqa_method || 'GET').toUpperCase(),
          status: this.status,
          duration_ms: duration,
        },
        this.status >= 400 ? 'error' : 'info'
      );
    });
    return origSend.apply(this, arguments as any);
  };

  // 3. Loophole Fix: Proxy window.WebSocket for full-duplex real-time events
  const OrigWebSocket = window.WebSocket;
  window.WebSocket = function (url: string | URL, protocols?: string | string[]) {
    const ws = new OrigWebSocket(url, protocols);
    const socketId = 'ws_' + Math.random().toString(36).slice(2, 8);

    ws.addEventListener('message', () => {
      relay('websocket_in', { url: url.toString(), socketId });
    });

    const origSend = ws.send;
    ws.send = function (data: any) {
      relay('websocket_out', { url: url.toString(), socketId });
      return origSend.apply(this, arguments as any);
    };

    return ws;
  } as any;
  window.WebSocket.prototype = OrigWebSocket.prototype;

  // 4. Global Error Interception
  window.addEventListener('error', (event) => {
    relay(
      'error',
      {
        text: event.message,
        url: event.filename,
        selector: `${event.lineno}:${event.colno}`,
      },
      'error'
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    relay(
      'error',
      {
        text: 'Unhandled Promise Rejection: ' + (event.reason?.message || String(event.reason)),
      },
      'critical'
    );
  });

  // 5. Console Error & Warning Interception
  const origError = console.error;
  console.error = function (...args) {
    relay(
      'error',
      {
        text: args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '),
      },
      'error'
    );
    return origError.apply(this, args);
  };

  const origWarn = console.warn;
  console.warn = function (...args) {
    relay(
      'warning',
      {
        text: args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '),
      },
      'warn'
    );
    return origWarn.apply(this, args);
  };

  // 6. Listener leak detection tracker
  const listenerRegistry = new Map<EventTarget, Map<string, Set<Function>>>();
  const origAddEventListener = EventTarget.prototype.addEventListener;

  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (typeof listener === 'function') {
      let targetMap = listenerRegistry.get(this);
      if (!targetMap) {
        targetMap = new Map();
        listenerRegistry.set(this, targetMap);
      }
      let handlers = targetMap.get(type);
      if (!handlers) {
        handlers = new Set();
        targetMap.set(type, handlers);
      }
      if (handlers.has(listener)) {
        relay('signal', {
          text: `listener_leak: duplicate handler registered for event '${type}'`,
          severity: 'warn',
        }, 'warn');
      } else {
        handlers.add(listener);
      }
    }
    return origAddEventListener.apply(this, arguments as any);
  };
})();

