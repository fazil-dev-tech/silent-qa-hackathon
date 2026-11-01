'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, FileText, CheckCircle, Trash2, Send, RefreshCw, Shield } from 'lucide-react';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AuditLogEntry {
  id: string;
  action: string;
  target_id: string | null;
  details: any;
  timestamp: string;
}

export default function AuditLogModal({ isOpen, onClose }: AuditLogModalProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchAuditLogs() {
    setLoading(true);
    try {
      const res = await fetch('/api/audit');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchAuditLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function getActionBadge(action: string) {
    if (action === 'REPORT_SYNTHESIZED') {
      return (
        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: '#DBEAFE', color: '#1D4ED8' }}>
          SYNTHESIZED
        </span>
      );
    }
    if (action === 'REPORT_UPDATED') {
      return (
        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: '#FEF3C7', color: '#B45309' }}>
          UPDATED
        </span>
      );
    }
    if (action === 'REPORT_DISPATCHED_EMAIL') {
      return (
        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: '#DCFCE7', color: '#166534' }}>
          EMAIL SENT
        </span>
      );
    }
    if (action === 'REPORT_DELETED') {
      return (
        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: '#FEE2E2', color: '#991B1B' }}>
          DELETED
        </span>
      );
    }
    return (
      <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: '#F3F4F6', color: '#374151' }}>
        {action}
      </span>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(17, 24, 39, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRadius: '18px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid rgba(17, 24, 39, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-primary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={20} color="#DC2626" />
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>
                System Activity Audit Trail
              </h3>
              <p style={{ fontSize: '0.785rem', color: '#6B7280' }}>
                Immutable audit records stored in Supabase PostgreSQL audit_log table.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={fetchAuditLogs}
              disabled={loading}
              title="Refresh logs"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div style={{ flex: 1, padding: '1.25rem 1.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {loading && logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF', fontSize: '0.85rem' }}>
              Fetching audit records from database...
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF', fontSize: '0.85rem' }}>
              No audit records logged yet. Operations will appear here automatically.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  background: '#F9FAFB',
                  border: '1px solid rgba(17, 24, 39, 0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {getActionBadge(log.action)}
                  <div>
                    <span style={{ fontWeight: 700, color: '#111827' }}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    {log.target_id && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', fontFamily: 'monospace', color: '#6B7280' }}>
                        ID: {log.target_id.slice(0, 8)}
                      </span>
                    )}
                    {log.details?.title && (
                      <div style={{ fontSize: '0.785rem', color: '#4B5563', marginTop: '0.15rem' }}>
                        &quot;{log.details.title}&quot;
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '0.72rem', color: '#9CA3AF', fontFamily: 'monospace' }}>
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '0.85rem 1.75rem', borderTop: '1px solid rgba(17, 24, 39, 0.08)', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg-primary)' }}>
          <button onClick={onClose} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

