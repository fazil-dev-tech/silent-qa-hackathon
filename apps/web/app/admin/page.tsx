'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  CheckCircle,
  Clock,
  RotateCcw,
  Send,
  Play,
  ArrowRight,
  ExternalLink,
  Mail,
  AlertTriangle,
  TrendingUp,
  Search,
  Settings,
  Shield,
  Trash2,
  Filter,
} from 'lucide-react';
import ProjectSettingsModal from '@/components/project-settings-modal';
import AuditLogModal from '@/components/audit-log-modal';

interface ReportItem {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  created_at: string;
  playwright_script?: string;
}

export default function AdminDashboardPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/recent');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const totalReports = reports.length;
  const criticalCount = reports.filter((r) => r.severity === 'critical' || r.severity === 'high').length;
  const sentCount = reports.filter((r) => r.status === 'sent').length;
  const verifiedCount = reports.filter((r) => r.status === 'verified').length;
  const playwrightCount = reports.filter((r) => !!r.playwright_script).length;
  const reproductionRate = totalReports > 0 ? Math.round((playwrightCount / totalReports) * 100) : 100;

  // Filtered reports
  const displayReports = reports.filter((r) => {
    // Search query match
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchTitle = r.title?.toLowerCase().includes(query);
      const matchId = r.id?.toLowerCase().includes(query);
      if (!matchTitle && !matchId) return false;
    }

    // Severity filter match
    if (severityFilter !== 'all') {
      if (severityFilter === 'critical_high') {
        if (r.severity !== 'critical' && r.severity !== 'high') return false;
      } else if (r.severity !== severityFilter) {
        return false;
      }
    }

    return true;
  });

  const drafts = displayReports.filter((r) => r.status === 'draft');
  const sent = displayReports.filter((r) => r.status === 'sent' || r.status === 'approved');
  const inProgress = displayReports.filter((r) => r.status === 'in_progress' || r.status === 'open');
  const verified = displayReports.filter((r) => r.status === 'fixed' || r.status === 'verified');

  async function updateStatus(reportId: string, newStatus: string) {
    try {
      await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );
    } catch {
      //
    }
  }

  async function deleteReport(reportId: string) {
    if (!confirm('Permanently delete this defect from Supabase?')) return;
    try {
      const res = await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
      }
    } catch {
      //
    }
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      {/* Title & Top Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.025em' }}>
            QA Lead Triage Command Center
          </h1>
          <p style={{ color: '#4B5563', fontSize: '0.9rem' }}>
            High-level defect status tracking, automatic reproduction velocity, audit trail, and engineering triage board.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setAuditModalOpen(true)}
            className="btn-secondary"
            style={{ fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Shield size={14} color="#DC2626" />
            <span>Audit Trail</span>
          </button>

          <button
            onClick={() => setProjectModalOpen(true)}
            className="btn-secondary"
            style={{ fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Settings size={14} />
            <span>Project & API Keys</span>
          </button>

          <button
            onClick={loadData}
            className="btn-secondary"
            style={{ fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <RotateCcw size={13} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase' }}>
              Total Logged Defects
            </span>
            <TrendingUp size={16} color="#DC2626" />
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#111827' }}>
            {totalReports}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 600, marginTop: '0.25rem' }}>
            ✓ 100% in Supabase PostgreSQL
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase' }}>
              High & Critical Priority
            </span>
            <AlertTriangle size={16} color="#DC2626" />
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#DC2626' }}>
            {criticalCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
            Requires immediate developer triage
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase' }}>
              Verified In Probe
            </span>
            <CheckCircle size={16} color="#16A34A" />
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#16A34A' }}>
            {verifiedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
            Confirmed synthetic reproduction
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase' }}>
              Auto-Reproduced Rate
            </span>
            <Play size={16} color="#2563EB" />
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#2563EB' }}>
            {reproductionRate}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
            Playwright TypeScript generated
          </div>
        </div>
      </div>

      {/* Search & Severity Filter Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <input
            type="text"
            placeholder="Search defects by title, ID, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.85rem 0.55rem 2.25rem',
              borderRadius: '8px',
              border: '1px solid rgba(17, 24, 39, 0.12)',
              fontSize: '0.85rem',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        {/* Severity filter pills */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', marginRight: '0.25rem' }}>Severity:</span>
          {[
            { id: 'all', label: 'All' },
            { id: 'critical_high', label: '🔥 High & Critical' },
            { id: 'critical', label: 'Critical' },
            { id: 'high', label: 'High' },
            { id: 'medium', label: 'Medium' },
            { id: 'low', label: 'Low' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setSeverityFilter(pill.id)}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: severityFilter === pill.id ? '1px solid #DC2626' : '1px solid rgba(17, 24, 39, 0.1)',
                background: severityFilter === pill.id ? '#FEE2E2' : '#ffffff',
                color: severityFilter === pill.id ? '#991B1B' : '#4B5563',
                cursor: 'pointer',
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Triage Board */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#111827' }}>
          Triage & Engineering Hand-off Board ({displayReports.length} Shown)
        </h2>
      </div>

      <div className="kanban-grid">
        {/* Column 1: Pending Review */}
        <div className="glass-panel" style={{ padding: '1.25rem', background: '#F8FAFC' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569' }}>
              Pending Review ({drafts.length})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {drafts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#9CA3AF', fontSize: '0.8rem' }}>No pending drafts</div>
            ) : (
              drafts.map((d) => (
                <div
                  key={d.id}
                  style={{
                    background: '#ffffff',
                    padding: '1rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(17, 24, 39, 0.08)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span className={`badge-severity severity-${d.severity}`}>{d.severity}</span>
                    <button
                      onClick={() => deleteReport(d.id)}
                      title="Delete defect"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem' }}>
                    {d.title}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      onClick={() => updateStatus(d.id, 'sent')}
                      className="btn-primary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                    >
                      Send →
                    </button>
                    <Link
                      href={`/app/report/${d.id}`}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Sent to Engineering */}
        <div className="glass-panel" style={{ padding: '1.25rem', background: '#EFF6FF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1D4ED8' }}>
              Dispatched to Eng ({sent.length})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sent.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#9CA3AF', fontSize: '0.8rem' }}>No dispatched defects</div>
            ) : (
              sent.map((d) => (
                <div
                  key={d.id}
                  style={{
                    background: '#ffffff',
                    padding: '1rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(17, 24, 39, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span className={`badge-severity severity-${d.severity}`}>{d.severity}</span>
                    <button
                      onClick={() => deleteReport(d.id)}
                      title="Delete defect"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem' }}>
                    {d.title}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      onClick={() => updateStatus(d.id, 'in_progress')}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                    >
                      Investigate →
                    </button>
                    <Link
                      href={`/app/report/${d.id}`}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: In Progress */}
        <div className="glass-panel" style={{ padding: '1.25rem', background: '#FEF3C7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#B45309' }}>
              In Progress ({inProgress.length})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {inProgress.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#9CA3AF', fontSize: '0.8rem' }}>No defects in progress</div>
            ) : (
              inProgress.map((d) => (
                <div
                  key={d.id}
                  style={{
                    background: '#ffffff',
                    padding: '1rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(17, 24, 39, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span className={`badge-severity severity-${d.severity}`}>{d.severity}</span>
                    <button
                      onClick={() => deleteReport(d.id)}
                      title="Delete defect"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem' }}>
                    {d.title}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      onClick={() => updateStatus(d.id, 'verified')}
                      className="btn-primary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', background: '#16A34A' }}
                    >
                      Mark Verified ✓
                    </button>
                    <Link
                      href={`/app/report/${d.id}`}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 4: Verified & Resolved */}
        <div className="glass-panel" style={{ padding: '1.25rem', background: '#DCFCE7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#15803D' }}>
              Verified & Resolved ({verified.length})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {verified.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#9CA3AF', fontSize: '0.8rem' }}>No verified defects yet</div>
            ) : (
              verified.map((d) => (
                <div
                  key={d.id}
                  style={{
                    background: '#ffffff',
                    padding: '1rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(17, 24, 39, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span className={`badge-severity severity-${d.severity}`}>{d.severity}</span>
                    <button
                      onClick={() => deleteReport(d.id)}
                      title="Delete defect"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
                    {d.title}
                  </div>
                  <Link
                    href={`/app/report/${d.id}`}
                    className="btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  >
                    View Details →
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Project & API Keys Modal */}
      <ProjectSettingsModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
      />

      {/* Audit Log Modal */}
      <AuditLogModal
        isOpen={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
      />
    </div>
  );
}
