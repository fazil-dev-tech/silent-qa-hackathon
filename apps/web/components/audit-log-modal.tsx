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
        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
          SYNTHESIZED
        </span>
      );
    }
    if (action === 'REPORT_UPDATED') {
      return (
        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          UPDATED
        </span>
      );
    }
    if (action === 'REPORT_DISPATCHED_EMAIL') {
      return (
        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          EMAIL SENT
        </span>
      );
    }
    if (action === 'REPORT_DELETED') {
      return (
        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'rgba(220, 38, 38, 0.15)', color: '#F87171', border: '1px solid rgba(220, 38, 38, 0.3)' }}>
          DELETED
        </span>
      );
    }
    return (
      <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'rgba(255, 255, 255, 0.05)', color: '#94A3B8', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
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
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(12px)',
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
          background: 'rgba(13, 16, 25, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '18px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          color: '#F8FAFC',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(13, 16, 25, 0.95) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={20} color="#DC2626" />
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                System Activity Audit Trail
              </h3>
              <p style={{ fontSize: '0.785rem', color: '#94A3B8', margin: '0.2rem 0 0' }}>
                Immutable audit records stored in Supabase PostgreSQL audit_log table.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={fetchAuditLogs}
              disabled={loading}
              title="Refresh logs"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div style={{ flex: 1, padding: '1.25rem 1.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {loading && logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8', fontSize: '0.85rem' }}>
              Fetching audit records from database...
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8', fontSize: '0.85rem' }}>
              No audit records logged yet. Operations will appear here automatically.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {getActionBadge(log.action)}
                  <div>
                    <span style={{ fontWeight: 700, color: '#F8FAFC' }}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    {log.target_id && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', fontFamily: 'monospace', color: '#94A3B8' }}>
                        ID: {log.target_id.slice(0, 8)}
                      </span>
                    )}
                    {log.details?.title && (
                      <div style={{ fontSize: '0.785rem', color: '#CBD5E1', marginTop: '0.15rem' }}>
                        &quot;{log.details.title}&quot;
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'monospace' }}>
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '0.85rem 1.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(255, 255, 255, 0.02)' }}>
          <button onClick={onClose} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

