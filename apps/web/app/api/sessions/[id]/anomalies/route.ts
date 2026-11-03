import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export interface SessionScenarioItem {
  id: string;
  label: string;
  note: string;
  selector?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'flight_anomaly' | 'flight_reported' | 'flight_action' | 'edge_case';
  windowSeconds: number;
  type?: string;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // 1. Fetch Session, Events, and Reports in Parallel for optimal response time (<500ms)
    const [sessionRes, eventsRes, reportsRes] = await Promise.all([
      supabaseAdmin
        .from('sessions')
        .select('id, app_url, user_agent, started_at, ended_at')
        .eq('id', sessionId)
        .maybeSingle(),
      supabaseAdmin
        .from('events')
        .select('id, ts, type, severity, url, method, status, selector, text, shape, fingerprint')
        .eq('session_id', sessionId)
        .order('ts', { ascending: false })
        .limit(100),
      supabaseAdmin
        .from('reports')
        .select('id, title, severity, steps, expected, actual, root_cause')
        .eq('session_id', sessionId)
        .limit(10),
    ]);

    if (eventsRes.error) {
      return NextResponse.json({ error: eventsRes.error.message }, { status: 500 });
    }

    const session = sessionRes.data || null;
    // Reverse events back to chronological order for causal flow analysis
    const events = (eventsRes.data || []).reverse();
    const reports = reportsRes.data || [];

    const scenarios: SessionScenarioItem[] = [];
    const seenLabels = new Set<string>();

    function addScenario(sc: SessionScenarioItem) {
      if (seenLabels.has(sc.label)) return;
      seenLabels.add(sc.label);
      scenarios.push(sc);
    }

    // 4. Already Synthesized Live Reports for this Flight Session
    for (const r of reports) {
      const cleanTitle = r.title.replace(/^\[Fallback\]\s*/i, '').trim();
      const shortTitle = cleanTitle.length > 34 ? cleanTitle.slice(0, 34) + '...' : cleanTitle;
      addScenario({
        id: `rep-${r.id}`,
        label: `📋 ${shortTitle}`,
        note: cleanTitle,
        severity: (r.severity as any) || 'high',
        category: 'flight_reported',
        windowSeconds: 180,
      });
    }

    // Pre-index clicks in this flight session for correlation
    const clicks = events.filter((e) => e.type === 'click');

    // Helper to find a click immediately preceding an error
    function findTriggerClick(errTsStr: string) {
      const errTs = new Date(errTsStr).getTime();
      return clicks.find((c) => {
        const cTs = new Date(c.ts).getTime();
        return cTs <= errTs && errTs - cTs <= 3500;
      });
    }

    // 5. HTTP 5xx Server Errors (Critical flight anomalies)
    const serverErrors = events.filter((e) => e.status && e.status >= 500);
    for (const err of serverErrors) {
      let urlPath = err.url || '/api/endpoint';
      try {
        if (urlPath.startsWith('http')) {
          const u = new URL(urlPath);
          urlPath = u.pathname;
        }
      } catch {}

      const trigger = findTriggerClick(err.ts);
      const targetSelector = trigger?.selector || (err.selector && !err.selector.includes(':') ? err.selector : undefined);

      addScenario({
        id: `err-5xx-${err.id}`,
        label: `🔥 500 Error: ${err.method || 'POST'} ${urlPath}`,
        note: `${err.method || 'POST'} ${err.url || urlPath} failed with HTTP ${err.status}. Internal Server Error encountered during flight.`,
        selector: targetSelector || (urlPath.includes('checkout') || urlPath.includes('pay') ? 'button#checkout-pay' : undefined),
        severity: 'critical',
        category: 'flight_anomaly',
        windowSeconds: 180,
        type: 'network',
      });
    }

    // 6. Runtime JavaScript Exceptions (Critical/High runtime defects)
    const jsErrors = events.filter((e) => e.type === 'error' || e.severity === 'critical');
    for (const err of jsErrors) {
      if (err.status && err.status >= 500) continue; // Already covered by server errors
      const rawText = err.text || 'Unhandled runtime exception';
      const cleanText = rawText.replace(/^Uncaught\s+/i, '').trim();
      const shortText = cleanText.length > 32 ? cleanText.slice(0, 32) + '...' : cleanText;

      const trigger = findTriggerClick(err.ts);
      const targetSelector = trigger?.selector || (err.selector && !err.selector.includes(':') ? err.selector : undefined);

      addScenario({
        id: `err-js-${err.id}`,
        label: `💥 ${shortText}`,
        note: cleanText,
        selector: targetSelector || (cleanText.toLowerCase().includes('charge') ? 'button#checkout-pay' : undefined),
        severity: 'critical',
        category: 'flight_anomaly',
        windowSeconds: 60,
        type: 'error',
      });
    }

    // 7. Behavioral Signals & Rapid Rage Clicks
    const signals = events.filter((e) => e.type === 'signal' || (e.text && e.text.includes('rage_click')));
    for (const sig of signals) {
      const isRage = sig.text?.includes('rage_click');
      const isObscured = sig.text?.includes('obscured_click');
      const isLeak = sig.text?.includes('listener_leak');

      let label = `⚠️ Signal: ${sig.text?.slice(0, 28)}`;
      let note = sig.text || `Telemetry signal detected on element ${sig.selector || 'target'}`;

      if (isRage) {
        label = `⚡ Rage Click: ${sig.selector || 'element'}`;
        note = `Multiple rapid rage clicks detected on ${sig.selector || 'button'} without DOM state mutation.`;
      } else if (isObscured) {
        label = `👁️ Obscured Click: ${sig.selector || 'element'}`;
        note = `Click event triggered on ${sig.selector} while overlaid or obscured by background elements.`;
      } else if (isLeak) {
        label = `🔌 Listener Leak: ${sig.selector || 'element'}`;
        note = `Multiple duplicate event listeners attached to ${sig.selector || 'element'} without unbinding.`;
      }

      addScenario({
        id: `sig-${sig.id}`,
        label,
        note,
        selector: sig.selector || undefined,
        severity: 'high',
        category: 'flight_anomaly',
        windowSeconds: 60,
        type: 'signal',
      });
    }

    // 8. HTTP 4xx Client Failures
    const clientErrors = events.filter((e) => e.status && e.status >= 400 && e.status < 500);
    for (const err of clientErrors) {
      let urlPath = err.url || 'endpoint';
      try {
        if (urlPath.startsWith('http')) {
          const u = new URL(urlPath);
          urlPath = `${u.pathname}${u.search ? u.search.slice(0, 15) : ''}`;
        }
      } catch {}

      const trigger = findTriggerClick(err.ts);

      addScenario({
        id: `err-4xx-${err.id}`,
        label: `⚠️ ${err.status}: ${err.method || 'GET'} ${urlPath.slice(0, 26)}`,
        note: `${err.method || 'GET'} ${err.url || urlPath} returned HTTP ${err.status} during recorded flight.`,
        selector: trigger?.selector || undefined,
        severity: 'high',
        category: 'flight_anomaly',
        windowSeconds: 180,
        type: 'network',
      });
    }

    // 9. Distinct Recorded Clicks / Interactive Elements
    const uniqueClicks: typeof clicks = [];
    const seenSelectors = new Set<string>();
    for (const c of clicks) {
      if (c.selector && !seenSelectors.has(c.selector)) {
        seenSelectors.add(c.selector);
        uniqueClicks.push(c);
      }
    }
    for (const c of uniqueClicks.slice(0, 4)) {
      addScenario({
        id: `click-${c.id}`,
        label: `🖱️ Click: ${c.selector}`,
        note: `User clicked ${c.selector}${c.text ? ` ("${c.text}")` : ''} during flight session.`,
        selector: c.selector,
        severity: 'medium',
        category: 'flight_action',
        windowSeconds: 180,
        type: 'click',
      });
    }

    // 10. Performance / Main Thread Long Tasks
    const perfEvents = events.filter((e) => e.type === 'performance' && e.text?.includes('Long Task'));
    for (const p of perfEvents.slice(0, 2)) {
      addScenario({
        id: `perf-${p.id}`,
        label: `⏳ Long Task: ${p.text || 'UI freeze'}`,
        note: `Main thread UI freeze detected: ${p.text}. Caused UI frame drops and interaction lag.`,
        selector: clicks[0]?.selector || undefined,
        severity: 'medium',
        category: 'flight_anomaly',
        windowSeconds: 60,
        type: 'performance',
      });
    }

    // 11. Baseline Edge Cases (Always provide fallback if flight has few anomalies)
    if (scenarios.length < 3) {
      const fallbackEdgeCases: SessionScenarioItem[] = [
        {
          id: 'cart-jump',
          label: '⚡ Cart button count jumps to 2',
          note: 'Cart button click fires two duplicate POST /api/cart requests within 7ms, incrementing badge count from 0 to 2.',
          selector: 'button.add-to-cart',
          severity: 'high',
          category: 'edge_case',
          windowSeconds: 60,
        },
        {
          id: 'dead-click',
          label: '⚠️ Unresponsive button (dead click)',
          note: 'Button registers rapid clicks with zero DOM mutation or network response.',
          selector: 'button.btn-save-draft',
          severity: 'medium',
          category: 'edge_case',
          windowSeconds: 60,
        },
        {
          id: 'loading-spinner',
          label: '⏳ Endless loading spinner on checkout',
          note: 'Spinner state remains indefinitely active after network timeout without user-facing error toast.',
          selector: 'div.checkout-spinner',
          severity: 'medium',
          category: 'edge_case',
          windowSeconds: 180,
        },
        {
          id: 'state-reset',
          label: '🔄 State reset after modal close',
          note: 'Form fields unexpectedly clear when user toggles background overlay without explicit discard confirmation.',
          selector: 'div.modal-overlay',
          severity: 'low',
          category: 'edge_case',
          windowSeconds: 300,
        },
      ];

      for (const fb of fallbackEdgeCases) {
        if (scenarios.length < 6) addScenario(fb);
      }
    }

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      session: session || null,
      total_events: events.length,
      anomalies_count: scenarios.filter((s) => s.category === 'flight_anomaly').length,
      scenarios,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to extract session anomalies' }, { status: 500 });
  }
}
