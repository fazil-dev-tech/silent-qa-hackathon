import type { TelemetryEvent, SignalSummary } from './types.ts';

/**
 * Computes a deterministic fingerprint for an event
 */
export function computeFingerprint(
  method?: string,
  url?: string,
  shape?: Record<string, unknown>
): string {
  const normMethod = (method || '').toUpperCase();
  const normUrl = (url || '').split('?')[0];
  const shapeStr = shape ? JSON.stringify(shape) : '';

  let hash = 0;
  const str = `${normMethod}|${normUrl}|${shapeStr}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `${normMethod}|${normUrl}|${Math.abs(hash).toString(16)}`;
}

/**
 * Detects duplicate HTTP requests within a 1,000ms window
 */
export function detectDuplicateRequests(
  events: TelemetryEvent[],
  thresholdMs = 1000
): Array<{ first: TelemetryEvent; duplicate: TelemetryEvent }> {
  const duplicates: Array<{ first: TelemetryEvent; duplicate: TelemetryEvent }> = [];
  const networkEvents = events.filter((e) => e.type === 'network' && e.method && e.url);

  for (let i = 0; i < networkEvents.length; i++) {
    const cur = networkEvents[i];
    for (let j = i + 1; j < networkEvents.length; j++) {
      const next = networkEvents[j];
      if (next.ts - cur.ts > thresholdMs) break;

      if (
        cur.method === next.method &&
        cur.url === next.url &&
        JSON.stringify(cur.shape) === JSON.stringify(next.shape)
      ) {
        duplicates.push({ first: cur, duplicate: next });
      }
    }
  }

  return duplicates;
}

/**
 * Detects rage clicks (3+ clicks on same selector within 2,000ms)
 */
export function detectRageClicks(
  events: TelemetryEvent[],
  windowMs = 2000,
  minClicks = 3
): TelemetryEvent[] {
  const clicks = events.filter((e) => e.type === 'click' && e.selector);
  const rageClickEvents: TelemetryEvent[] = [];

  for (let i = 0; i < clicks.length; i++) {
    const cluster = [clicks[i]];
    for (let j = i + 1; j < clicks.length; j++) {
      if (clicks[j].ts - clicks[i].ts > windowMs) break;
      if (clicks[j].selector === clicks[i].selector) {
        cluster.push(clicks[j]);
      }
    }
    if (cluster.length >= minClicks) {
      rageClickEvents.push(cluster[cluster.length - 1]);
    }
  }

  return rageClickEvents;
}

/**
 * Generates an aggregated signal summary for prompt context
 */
export function buildSignalSummary(events: TelemetryEvent[]): SignalSummary {
  const summary: SignalSummary = {
    error_count: 0,
    failed_request_count: 0,
    dead_click_count: 0,
    rage_click_count: 0,
    duplicate_request_count: 0,
    slow_request_count: 0,
    numeric_change_count: 0,
  };

  for (const e of events) {
    if (e.type === 'error' || e.severity === 'error') summary.error_count++;
    if (e.type === 'network' && e.status && e.status >= 400) summary.failed_request_count++;
    if (e.duration_ms && e.duration_ms > 5000) summary.slow_request_count++;
    if (e.type === 'signal') {
      if (e.text?.includes('dead_click')) summary.dead_click_count++;
      if (e.text?.includes('rage_click')) summary.rage_click_count++;
      if (e.text?.includes('duplicate_request')) summary.duplicate_request_count++;
      if (e.text?.includes('numeric_value_change')) summary.numeric_change_count++;
    }
  }

  return summary;
}

/**
 * Ranks and scores events in the temporal window for LLM prompt assembly
 */
export function rankEventsForMapper(
  events: TelemetryEvent[],
  note: string,
  pickedSelector?: string,
  limit = 25,
  recentEventId?: string
): TelemetryEvent[] {
  const noteKeywords = note
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const scored = events.map((event) => {
    let score = 0;

    // 1. Severity weight
    if (event.severity === 'critical') score += 50;
    else if (event.severity === 'error') score += 30;
    else if (event.severity === 'warn') score += 15;

    // 2. Behavioral signals bonus
    if (event.type === 'signal') score += 40;
    if (event.text?.includes('duplicate_request') || event.text?.includes('dead_click')) score += 25;

    // 3. Keyword matching against note
    const searchable = `${event.url || ''} ${event.selector || ''} ${event.text || ''}`.toLowerCase();
    for (const kw of noteKeywords) {
      if (searchable.includes(kw)) score += 20;
    }

    // 4. Picked selector bonus
    if (pickedSelector && event.selector && (event.selector.includes(pickedSelector) || pickedSelector.includes(event.selector))) {
      score += 45;
    }

    // 5. Recent Event ID direct mapping bonus
    if (recentEventId && (event.id === recentEventId || event.trigger_event_id === recentEventId)) {
      score += 60;
    }

    return { event, score };
  });

  // Sort descending by score, then by timestamp
  scored.sort((a, b) => b.score - a.score || b.event.ts - a.event.ts);

  return scored.slice(0, limit).map((s) => s.event);
}
