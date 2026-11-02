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
              border: filter === tab ? '1px solid #DC2626' : '1px solid rgba(255, 255, 255, 0.1)',
              background: filter === tab ? 'rgba(220, 38, 38, 0.25)' : 'rgba(255, 255, 255, 0.04)',
              color: filter === tab ? '#FCA5A5' : '#94A3B8',
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
            background: 'rgba(220, 38, 38, 0.25)',
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
                  background: isSignal ? 'rgba(220, 38, 38, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: isSignal ? '1px solid rgba(220, 38, 38, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
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
                    background: isSignal ? '#DC2626' : '#0D1019',
                    border: isSignal ? '2px solid #F87171' : '2px solid #38BDF8',
                    boxShadow: isSignal ? '0 0 8px rgba(220, 38, 38, 0.5)' : 'none',
                  }}
                />

                {/* Top Row: Icon + Type + Relative Offset + ID */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getEventIcon(item.type, item.severity)}
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: isSignal ? '#F87171' : '#F8FAFC' }}>
                      {item.type}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '9999px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: '#94A3B8',
                        fontFamily: 'monospace',
                      }}
                    >
                      +{deltaMs}ms
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#64748B' }}>
                      {item.id.slice(0, 8)}
                    </span>
                    <button
                      onClick={() => handleCopy(item.id, item.id)}
                      title="Copy Event UUID"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94A3B8' }}
                    >
                      {copiedId === item.id ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                {/* Event Content Details */}
                <div style={{ fontSize: '0.85rem', color: '#E2E8F0', lineHeight: 1.4 }}>
                  {item.type === 'network' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          background: item.method === 'POST' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                          color: item.method === 'POST' ? '#38BDF8' : '#C084FC',
                        }}
                      >
                        {item.method}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#F8FAFC' }}>{item.url}</span>
                      {item.status && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            background: item.status < 400 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(220, 38, 38, 0.15)',
                            color: item.status < 400 ? '#4ADE80' : '#F87171',
                          }}
                        >
                          HTTP {item.status}
                        </span>
                      )}
                      {((item.duration_ms !== undefined && item.duration_ms !== null) || (item.shape?.duration_ms !== undefined && item.shape?.duration_ms !== null)) && (
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                          ({item.duration_ms ?? item.shape?.duration_ms}ms)
                        </span>
                      )}
                      {item.shape?.domSnapshot && (
                        <span
                          title="DOM snapshot captured at error moment"
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.1rem 0.35rem',
                            borderRadius: '4px',
                            background: 'rgba(220, 38, 38, 0.2)',
                            color: '#F87171',
                            fontWeight: 700,
                          }}
                        >
                          📸 DOM Snapshot
                        </span>
                      )}
                    </div>
                  )}

                  {item.type === 'click' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, color: '#F8FAFC' }}>Clicked: &quot;{item.text || 'Element'}&quot;</span>
                      {item.selector && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontFamily: 'monospace',
                            background: 'rgba(255, 255, 255, 0.06)',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            color: '#38BDF8',
                          }}
                        >
                          {item.selector}
                        </span>
                      )}
                    </div>
                  )}

                  {item.type === 'dom' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: '#94A3B8' }}>Mutation:</span>
                      <span style={{ fontFamily: 'monospace', color: '#F8FAFC' }}>{item.text}</span>
                    </div>
                  )}

                  {item.type === 'signal' && (
                    <div style={{ color: '#F87171', fontWeight: 600 }}>
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
                      color: '#94A3B8',
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
                        background: '#07080A',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
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

