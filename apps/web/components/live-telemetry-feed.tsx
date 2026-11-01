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
        setEvents(data);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRecentEvents();

    // Setup Supabase Realtime Channel
    try {
      const client = createClient(supabaseUrl, supabaseAnonKey);
      const channel = client
        .channel('realtime_events_stream')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'events' },
          (payload) => {
            const newEvt = payload.new as LiveEvent;
            setEvents((prev) => [newEvt, ...prev.slice(0, 24)]);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsSubscribed(true);
          }
        });

      return () => {
        client.removeChannel(channel);
      };
    } catch {
      //
    }
  }, []);

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={16} color="#DC2626" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111827' }}>
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
              background: isSubscribed ? '#DCFCE7' : '#FEF3C7',
              color: isSubscribed ? '#166534' : '#B45309',
            }}
          >
            <Radio size={12} className={isSubscribed ? 'animate-pulse' : ''} />
            {isSubscribed ? 'CONNECTED' : 'POLLING'}
          </div>

          <button
            onClick={fetchRecentEvents}
            disabled={loading}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 0 }}
            title="Refresh stream"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#9CA3AF', fontSize: '0.8rem' }}>
          Listening for telemetry batches from extension or simulator...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '280px', overflowY: 'auto' }}>
          {events.map((evt) => {
            const isWarn = evt.severity === 'warn' || evt.severity === 'error' || evt.type === 'signal';
            return (
              <div
                key={evt.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '6px',
                  background: isWarn ? '#FEF2F2' : '#ffffff',
                  border: isWarn ? '1px solid #FECACA' : '1px solid rgba(17, 24, 39, 0.06)',
                  fontSize: '0.785rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
                  <span
                    style={{
                      fontSize: '0.675rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: isWarn ? '#991B1B' : '#2563EB',
                    }}
                  >
                    {evt.type}
                  </span>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      color: '#111827',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {evt.url || evt.selector || evt.text || 'Event recorded'}
                  </span>
                </div>

                <span style={{ fontSize: '0.675rem', fontFamily: 'monospace', color: '#9CA3AF', flexShrink: 0 }}>
                  {typeof evt.ts === 'string' ? evt.ts.slice(11, 19) : new Date(evt.ts).toISOString().slice(11, 19)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

