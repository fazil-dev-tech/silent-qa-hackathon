'use client';

import React, { useState } from 'react';
import { MousePointer, Globe, AlertTriangle, Bug, Layers, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

interface TimelineEvent {
  id: string;
  ts: number | string;
  type: string;
  severity: string;
  url?: string;
  method?: string;
  status?: number;
  duration_ms?: number;
  selector?: string;
  text?: string;
  shape?: Record<string, any>;
  fingerprint?: string;
}

interface EventTimelineProps {
  events: TimelineEvent[];
}

export default function EventTimeline({ events }: EventTimelineProps) {
  const [filter, setFilter] = useState<'all' | 'network' | 'click' | 'signal' | 'dom'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!events || events.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.85rem' }}>
        No telemetry events recorded for this report.
      </div>
    );
  }

  // Sort chronologically ascending
  const sorted = [...events].sort((a, b) => {
    const tA = typeof a.ts === 'string' ? new Date(a.ts).getTime() : a.ts;
    const tB = typeof b.ts === 'string' ? new Date(b.ts).getTime() : b.ts;
    return tA - tB;
  });

  const baseTs = typeof sorted[0].ts === 'string' ? new Date(sorted[0].ts).getTime() : sorted[0].ts;

  const filtered = sorted.filter((e) => {
    if (filter === 'all') return true;
    if (filter === 'network') return e.type === 'network' || e.type.startsWith('websocket');
    if (filter === 'click') return e.type === 'click' || e.type === 'input';
    if (filter === 'signal') return e.type === 'signal' || e.severity === 'warn' || e.severity === 'error';
    if (filter === 'dom') return e.type === 'dom';
    return true;
  });

  function getEventIcon(type: string, severity: string) {
    if (severity === 'warn' || severity === 'error' || type === 'signal') {
      return <AlertTriangle size={15} color="#DC2626" />;
    }
    if (type === 'network' || type.startsWith('websocket')) {
      return <Globe size={15} color="#2563EB" />;
    }
    if (type === 'click') {
      return <MousePointer size={15} color="#059669" />;
    }
    if (type === 'dom') {
      return <Layers size={15} color="#7C3AED" />;
    }
    return <Bug size={15} color="#4B5563" />;
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {(['all', 'network', 'click', 'signal', 'dom'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              border: filter === tab ? '1px solid #DC2626' : '1px solid rgba(17, 24, 39, 0.1)',
              background: filter === tab ? '#FEE2E2' : '#ffffff',
              color: filter === tab ? '#991B1B' : '#4B5563',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab} ({tab === 'all' ? sorted.length : sorted.filter((e) => e.type === tab || (tab === 'signal' && e.type === 'signal')).length})
          </button>
        ))}
      </div>

      {/* Timeline Stream */}
      <div style={{ position: 'relative', paddingLeft: '1.75rem' }}>
        {/* Vertical Guide Line */}
        <div
          style={{
            position: 'absolute',
            left: '11px',
            top: '8px',
            bottom: '8px',
            width: '2px',
            background: 'rgba(220, 38, 38, 0.15)',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((item) => {
            const itemTs = typeof item.ts === 'string' ? new Date(item.ts).getTime() : item.ts;
            const deltaMs = Math.max(0, itemTs - baseTs);
            const isExpanded = expandedId === item.id;
            const isSignal = item.type === 'signal' || item.severity === 'warn' || item.severity === 'error';

            return (
              <div
                key={item.id}
                style={{
                  position: 'relative',
                  background: isSignal ? '#FEF2F2' : '#ffffff',
                  border: isSignal ? '1px solid #FECACA' : '1px solid rgba(17, 24, 39, 0.08)',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Node Dot on Guide Line */}
                <div
                  style={{
                    position: 'absolute',
                    left: '-23px',
                    top: '14px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: isSignal ? '#DC2626' : '#ffffff',
                    border: isSignal ? '2px solid #991B1B' : '2px solid #DC2626',
                    boxShadow: isSignal ? '0 0 8px rgba(220, 38, 38, 0.4)' : 'none',
                  }}
                />

                {/* Top Row: Icon + Type + Relative Offset + ID */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getEventIcon(item.type, item.severity)}
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: isSignal ? '#991B1B' : '#111827' }}>
                      {item.type}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '9999px',
                        background: 'rgba(17, 24, 39, 0.06)',
                        color: '#4B5563',
                        fontFamily: 'monospace',
                      }}
                    >
                      +{deltaMs}ms
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#9CA3AF' }}>
                      {item.id.slice(0, 8)}
                    </span>
                    <button
                      onClick={() => handleCopy(item.id, item.id)}
                      title="Copy Event UUID"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#6B7280' }}
                    >
                      {copiedId === item.id ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                {/* Event Content Details */}
                <div style={{ fontSize: '0.85rem', color: '#374151', lineHeight: 1.4 }}>
                  {item.type === 'network' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          background: item.method === 'POST' ? '#DBEAFE' : '#E0E7FF',
                          color: item.method === 'POST' ? '#1D4ED8' : '#3730A3',
                        }}
                      >
                        {item.method}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#111827' }}>{item.url}</span>
                      {item.status && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            background: item.status < 400 ? '#DCFCE7' : '#FEE2E2',
                            color: item.status < 400 ? '#166534' : '#991B1B',
                          }}
                        >
                          HTTP {item.status}
                        </span>
                      )}
                      {item.duration_ms !== undefined && (
                        <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>({item.duration_ms}ms)</span>
                      )}
                    </div>
                  )}

                  {item.type === 'click' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, color: '#111827' }}>Clicked: &quot;{item.text || 'Element'}&quot;</span>
                      {item.selector && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            background: '#F3F4F6',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            color: '#1F2937',
                          }}
                        >
                          {item.selector}
                        </span>
                      )}
                    </div>
                  )}

                  {item.type === 'dom' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: '#4B5563' }}>Mutation:</span>
                      <span style={{ fontFamily: 'monospace', color: '#111827' }}>{item.text}</span>
                    </div>
                  )}

                  {item.type === 'signal' && (
                    <div style={{ color: '#991B1B', fontWeight: 600 }}>
                      ⚡ {item.text}
                    </div>
                  )}
                </div>

                {/* Expandable JSON Payload Inspector */}
                <div style={{ marginTop: '0.5rem' }}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.725rem',
                      color: '#6B7280',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    <span>{isExpanded ? 'Hide Payload' : 'View Raw Payload & Shape'}</span>
                  </button>

                  {isExpanded && (
                    <pre
                      style={{
                        marginTop: '0.4rem',
                        padding: '0.6rem',
                        borderRadius: '6px',
                        background: '#0F172A',
                        color: '#E2E8F0',
                        fontSize: '0.75rem',
                        overflowX: 'auto',
                        lineHeight: 1.4,
                      }}
                    >
                      <code>{JSON.stringify(item, null, 2)}</code>
                    </pre>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
