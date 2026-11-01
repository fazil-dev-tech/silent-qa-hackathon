// ====================================================================
// SILENT QA: MAIN-WORLD INJECTOR (inject-main.ts)
// Runs directly in page execution context to intercept runtime internals
// ====================================================================

(() => {
  // Prevent duplicate injection
  if ((window as any).__SILENT_QA_INJECTED__) return;
  (window as any).__SILENT_QA_INJECTED__ = true;

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

  function relay(
    type: string,
    data: Record<string, unknown>,
    severity: 'info' | 'warn' | 'error' | 'critical' = 'info'
  ) {
    window.postMessage(
      {
        source: 'SILENT_QA_MAIN',
        payload: {
          id: generateUUID(),
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

    let requestBodySnippet: string | undefined = undefined;
    try {
      if (init.body) {
        requestBodySnippet = typeof init.body === 'string'
          ? init.body.slice(0, 400)
          : '[Payload/FormData]';
      }
    } catch {}

    try {
      const response = await origFetch.apply(this, args);
      const duration = Math.round(performance.now() - start);

      let responseSnippet: string | undefined = undefined;
      if (response.status >= 400) {
        try {
          const clone = response.clone();
          const txt = await clone.text();
          responseSnippet = txt.slice(0, 400);
        } catch {}
      }

      const severity = response.status >= 500 ? 'critical' : response.status >= 400 ? 'error' : 'info';

      relay(
        'network',
        {
          url,
          method,
          status: response.status,
          statusText: response.statusText,
          duration_ms: duration,
          text: `${method} ${url} -> ${response.status} (${duration}ms)`,
          shape: {
            method,
            url,
            status: response.status,
            duration_ms: duration,
            request_body: requestBodySnippet,
            response_body: responseSnippet,
          },
        },
        severity
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
          text: `Network fetch failed: ${err?.message || 'Connection refused'}`,
          shape: {
            method,
            url,
            status: 0,
            duration_ms: duration,
            error: err?.message || 'Network fetch error',
          },
        },
        'critical'
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

  XMLHttpRequest.prototype.send = function (body?: any) {
    if (body) {
      try {
        (this as any)._sqa_body = typeof body === 'string' ? body.slice(0, 400) : '[Binary/Payload]';
      } catch {}
    }

    this.addEventListener('loadend', () => {
      const duration = Math.round(performance.now() - ((this as any)._sqa_start || performance.now()));
      const method = ((this as any)._sqa_method || 'GET').toUpperCase();
      const url = (this as any)._sqa_url || 'unknown';
      const severity = this.status >= 500 ? 'critical' : this.status >= 400 ? 'error' : 'info';

      let responseSnippet: string | undefined = undefined;
      if (this.status >= 400) {
        try {
          responseSnippet = (this.responseText || '').slice(0, 400);
        } catch {}
      }

      relay(
        'network',
        {
          url,
          method,
          status: this.status,
          duration_ms: duration,
          text: `${method} ${url} -> ${this.status} (${duration}ms)`,
          shape: {
            method,
            url,
            status: this.status,
            duration_ms: duration,
            request_body: (this as any)._sqa_body,
            response_body: responseSnippet,
          },
        },
        severity
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
        text: `Uncaught Exception: ${event.message}`,
        url: event.filename,
        selector: `${event.lineno}:${event.colno}`,
        shape: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack || '',
        },
      },
      'critical'
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    const errorMsg = event.reason?.message || String(event.reason);
    relay(
      'error',
      {
        text: `Unhandled Promise Rejection: ${errorMsg}`,
        shape: {
          message: errorMsg,
          stack: event.reason?.stack || '',
          type: 'unhandledrejection',
        },
      },
      'critical'
    );
  });

  // 5. Console Error & Warning Interception
  const origError = console.error;
  console.error = function (...args) {
    const msg = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    relay(
      'error',
      {
        text: `console.error: ${msg.slice(0, 300)}`,
        shape: {
          level: 'error',
          message: msg.slice(0, 500),
          stack: new Error().stack || '',
        },
      },
      'error'
    );
    return origError.apply(this, args);
  };

  const origWarn = console.warn;
  console.warn = function (...args) {
    const msg = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    relay(
      'warning',
      {
        text: `console.warn: ${msg.slice(0, 300)}`,
        shape: {
          level: 'warn',
          message: msg.slice(0, 500),
        },
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

