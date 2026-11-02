'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Radio, RefreshCw } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vdifshqatwyaycxhtbua.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.build_placeholder';

interface LiveEvent {
  id: string;
  session_id: string;
  ts: string | number;
  type: string;
  severity: string;
  url?: string;
  method?: string;
  status?: number;
  selector?: string;
  text?: string;
  shape?: Record<string, any>;
}

export default function LiveTelemetryFeed() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function fetchRecentEvents() {
    setLoading(true);
    try {
      const client = createClient(supabaseUrl, supabaseAnonKey);
      const { data } = await client
        .from('events')
        .select('*')
        .order('ts', { ascending: false })
        .limit(15);

      if (data) {
        const clean = data.filter((e: any) => {
          if (e.url && (e.url.includes('/api/auth/me') || e.url.includes('/api/reports/recent'))) return false;
          return true;
        });
        setEvents(clean);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRecentEvents();

    // Auto-sync polling every 3 seconds for guaranteed low-latency telemetry updates
    const pollInterval = setInterval(() => {
      fetchRecentEvents();
    }, 3000);

    // Setup Supabase Realtime Channel
    let client: any = null;
    let channel: any = null;
    try {
      client = createClient(supabaseUrl, supabaseAnonKey);
      channel = client
        .channel('realtime_events_stream')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'events' },
          (payload: any) => {
            const newEvt = payload.new as LiveEvent;
            if (newEvt.url && (newEvt.url.includes('/api/auth/me') || newEvt.url.includes('/api/reports/recent'))) return;
            setEvents((prev) => {
              if (prev.some((e) => e.id === newEvt.id)) return prev;
              return [newEvt, ...prev.slice(0, 24)];
            });
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            setIsSubscribed(true);
          }
        });
    } catch {
      //
    }

    return () => {
      clearInterval(pollInterval);
      if (client && channel) {
        client.removeChannel(channel);
      }
    };
  }, []);

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={16} color="#DC2626" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F8FAFC' }}>
            Realtime Telemetry Stream
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: '9999px',
              background: isSubscribed ? 'rgba(22, 163, 74, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: isSubscribed ? '#86EFAC' : '#FDE68A',
              border: isSubscribed ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
            }}
          >
            <Radio size={12} className={isSubscribed ? 'animate-pulse' : ''} />
            {isSubscribed ? 'CONNECTED' : 'POLLING'}
          </div>

          <button
            onClick={fetchRecentEvents}
            disabled={loading}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
            title="Refresh stream"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94A3B8', fontSize: '0.8rem' }}>
          Listening for telemetry batches from extension or simulator...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '280px', overflowY: 'auto' }}>
          {events.map((evt) => {
            const isWarn = evt.severity === 'warn' || evt.severity === 'error' || evt.severity === 'critical' || evt.type === 'signal';
            const durationMs = evt.shape?.duration_ms;
            const hasSnapshot = !!evt.shape?.domSnapshot;
            const d = typeof evt.ts === 'string' ? new Date(evt.ts) : new Date(Number(evt.ts));
            const timeFormatted = !isNaN(d.getTime())
              ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}.${String(d.getMilliseconds()).padStart(3, '0')}`
              : typeof evt.ts === 'string' ? evt.ts.slice(11, 23) : 'now';

            return (
              <div
                key={evt.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '8px',
                  background: isWarn ? 'rgba(220, 38, 38, 0.16)' : 'rgba(255, 255, 255, 0.04)',
                  border: isWarn ? '1px solid rgba(220, 38, 38, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '0.785rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
                  <span
                    style={{
                      fontSize: '0.675rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: isWarn ? '#FCA5A5' : '#38BDF8',
                    }}
                  >
                    {evt.type}
                  </span>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      color: '#F8FAFC',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {evt.url || evt.selector || evt.text || 'Event recorded'}
                  </span>
                  {durationMs !== undefined && durationMs !== null && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.35rem',
                        borderRadius: '4px',
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: '#38BDF8',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        fontFamily: 'monospace',
                      }}
                    >
                      {durationMs}ms
                    </span>
                  )}
                  {hasSnapshot && (
                    <span
                      title="DOM Snapshot captured at failure instant"
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.35rem',
                        borderRadius: '4px',
                        background: 'rgba(220, 38, 38, 0.25)',
                        color: '#FCA5A5',
                        border: '1px solid rgba(220, 38, 38, 0.4)',
                      }}
                    >
                      📸 DOM
                    </span>
                  )}
                </div>

                <span style={{ fontSize: '0.675rem', fontFamily: 'monospace', color: '#94A3B8', flexShrink: 0 }}>
                  {timeFormatted}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

