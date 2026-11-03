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
  Users,
  BarChart3,
  Kanban,
  Activity,
  Cpu,
  Layers,
  Database,
  Radio,
  Check,
  CheckCircle2,
} from 'lucide-react';
import ProjectSettingsModal from '@/components/project-settings-modal';
import AuditLogModal from '@/components/audit-log-modal';
import { supabaseBrowserClient } from '@/lib/supabase';

interface ReportItem {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  created_at: string;
  playwright_script?: string;
  tester_name?: string;
  device_tag?: string;
}

interface AdminUser {
  id: string;
  name: string;
  role: string;
  status: string;
  created_at: string;
  last_activity: string;
  extension_connected: boolean;
  submitted_reports: number;
  processed_reports: number;
}

export default function AdminDashboardPage() {
  const [adminView, setAdminView] = useState<'triage' | 'users' | 'analytics'>('triage');

  // Reports / Triage State
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);

  // Users State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');

  // Analytics State
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsRange, setAnalyticsRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Action status toast
  const [actionMessage, setActionMessage] = useState<string | null>(null);

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

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      //
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadAnalytics(range = analyticsRange) {
    setLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch {
      //
    } finally {
      setLoadingAnalytics(false);
    }
  }

  useEffect(() => {
    async function verifyAdminAuth() {
      try {
        const authRes = await fetch('/api/auth/me');
        if (!authRes.ok) {
          window.location.replace('/login?redirect=/admin');
          return;
        }
        const authData = await authRes.json();
        if (!authData.authenticated || !authData.user) {
          window.location.replace('/login?redirect=/admin');
          return;
        }
        if (authData.user.role !== 'admin') {
          window.location.replace('/app');
          return;
        }
        loadData();
        loadUsers();
        loadAnalytics();
      } catch {
        window.location.replace('/login?redirect=/admin');
      }
    }
    verifyAdminAuth();

    // 1. Live Supabase Realtime WebSocket Subscription for Admin Command Center
    const channel = supabaseBrowserClient
      .channel('admin_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        loadData();
        loadAnalytics();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadUsers();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_log' }, () => {
        loadAnalytics();
      })
      .subscribe();

    // 2. Fallback periodic auto-refresh every 12s
    const syncInterval = setInterval(() => {
      loadData();
      loadUsers();
      loadAnalytics();
    }, 12000);

    return () => {
      clearInterval(syncInterval);
      supabaseBrowserClient.removeChannel(channel);
    };
  }, []);

  const totalReports = reports.length;
  const criticalCount = reports.filter((r) => r.severity === 'critical' || r.severity === 'high').length;
  const openCriticalCount = reports.filter(
    (r) => (r.severity === 'critical' || r.severity === 'high') && r.status !== 'verified' && r.status !== 'fixed'
  ).length;
  const sentCount = reports.filter((r) => r.status === 'sent').length;
  const verifiedCount = reports.filter((r) => r.status === 'verified').length;
  const playwrightCount = reports.filter((r) => !!r.playwright_script).length;
  const reproductionRate = totalReports > 0 ? Math.round((playwrightCount / totalReports) * 100) : 100;

  // Filtered reports
  const displayReports = reports.filter((r) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchTitle = r.title?.toLowerCase().includes(query);
      const matchId = r.id?.toLowerCase().includes(query);
      if (!matchTitle && !matchId) return false;
    }

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

  // Filtered users
  const displayUsers = users.filter((u) => {
    if (userSearch) {
      const q = userSearch.toLowerCase();
      const matchName = u.name.toLowerCase().includes(q);
      const matchId = u.id.toLowerCase().includes(q);
      if (!matchName && !matchId) return false;
    }
    if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
    if (userStatusFilter !== 'all' && u.status !== userStatusFilter) return false;
    return true;
  });

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
      setActionMessage(`✓ Defect status updated to ${newStatus.toUpperCase()}`);
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
        setActionMessage('✓ Defect report deleted.');
      }
    } catch {
      //
    }
  }

  async function toggleUserStatus(userId: string, currentStatus: string) {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, status: nextStatus }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u))
        );
        setActionMessage(`✓ User status updated to ${nextStatus.toUpperCase()}`);
      }
    } catch {
      //
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#07080A',
        backgroundImage:
          'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(220, 38, 38, 0.15), rgba(7, 8, 10, 0.98))',
        color: '#F8FAFC',
        paddingBottom: '5rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      {/* Title & Top Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="live-pulse-dot" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Carrier Console
            </span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.025em' }}>
            QA Lead Triage Command Center
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
            User account management, platform monitoring, extension activity, AI causal metrics, and engineering triage.
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
            onClick={() => {
              loadData();
              loadUsers();
              loadAnalytics();
            }}
            className="btn-secondary"
            style={{ fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <RotateCcw size={13} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh All'}</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            background: actionMessage.startsWith('✓') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(220, 38, 38, 0.15)',
            border: `1px solid ${actionMessage.startsWith('✓') ? 'rgba(52, 211, 153, 0.35)' : 'rgba(248, 113, 113, 0.35)'}`,
            color: actionMessage.startsWith('✓') ? '#86EFAC' : '#FCA5A5',
            fontSize: '0.85rem',
            fontWeight: 700,
          }}
        >
          {actionMessage}
        </motion.div>
      )}

      {/* Primary Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '0.75rem',
          marginBottom: '2rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setAdminView('triage')}
          style={{
            padding: '0.55rem 1.25rem',
            borderRadius: '8px',
            fontSize: '0.885rem',
            fontWeight: 800,
            border: adminView === 'triage' ? '1px solid #DC2626' : '1px solid rgba(255, 255, 255, 0.1)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: adminView === 'triage' ? '#DC2626' : 'rgba(255, 255, 255, 0.05)',
            color: adminView === 'triage' ? '#ffffff' : '#94A3B8',
            boxShadow: adminView === 'triage' ? '0 4px 14px rgba(220, 38, 38, 0.4)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Kanban size={15} />
          <span>Triage &amp; Kanban ({displayReports.length})</span>
        </button>

        <button
          onClick={() => setAdminView('users')}
          style={{
            padding: '0.55rem 1.25rem',
            borderRadius: '8px',
            fontSize: '0.885rem',
            fontWeight: 800,
            border: adminView === 'users' ? '1px solid #DC2626' : '1px solid rgba(255, 255, 255, 0.1)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: adminView === 'users' ? '#DC2626' : 'rgba(255, 255, 255, 0.05)',
            color: adminView === 'users' ? '#ffffff' : '#94A3B8',
            boxShadow: adminView === 'users' ? '0 4px 14px rgba(220, 38, 38, 0.4)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Users size={15} />
          <span>User Accounts &amp; Extensions ({users.length})</span>
        </button>

        <button
          onClick={() => setAdminView('analytics')}
          style={{
            padding: '0.55rem 1.25rem',
            borderRadius: '8px',
            fontSize: '0.885rem',
            fontWeight: 800,
            border: adminView === 'analytics' ? '1px solid #DC2626' : '1px solid rgba(255, 255, 255, 0.1)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: adminView === 'analytics' ? '#DC2626' : 'rgba(255, 255, 255, 0.05)',
            color: adminView === 'analytics' ? '#ffffff' : '#94A3B8',
            boxShadow: adminView === 'analytics' ? '0 4px 14px rgba(220, 38, 38, 0.4)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <BarChart3 size={15} />
          <span>Operational Data Analytics</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: KANBAN TRIAGE & DISPATCH BOARD                                    */}
      {/* ========================================================================= */}
      {adminView === 'triage' && (
        <div>
          {/* KPI Tiles */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2rem',
            }}
          >
            <div
              className="glass-panel"
              onClick={() => setSeverityFilter('all')}
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                border: severityFilter === 'all' ? '1.5px solid rgba(255, 255, 255, 0.25)' : undefined,
                transition: 'all 0.2s ease',
              }}
              title="Click to view all defects"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.775rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                  Total Logged Defects
                </span>
                <TrendingUp size={16} color="#DC2626" />
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#F8FAFC' }}>
                {totalReports}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 600, marginTop: '0.25rem' }}>
                ✓ 100% in Supabase PostgreSQL
              </div>
            </div>

            <div
              className="glass-panel"
              onClick={() => setSeverityFilter((prev) => (prev === 'critical_high' ? 'all' : 'critical_high'))}
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                border: severityFilter === 'critical_high' ? '1.5px solid #DC2626' : undefined,
                boxShadow: severityFilter === 'critical_high' ? '0 0 20px rgba(220, 38, 38, 0.3)' : undefined,
                transition: 'all 0.2s ease',
              }}
              title="Click to filter Kanban by High & Critical priority"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '0.775rem',
                    fontWeight: 800,
                    color: severityFilter === 'critical_high' ? '#FCA5A5' : '#94A3B8',
                    textTransform: 'uppercase',
                  }}
                >
                  High &amp; Critical Priority
                </span>
                <AlertTriangle size={16} color="#DC2626" />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#DC2626' }}>
                  {criticalCount}
                </span>
                {openCriticalCount > 0 ? (
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F87171' }}>
                    ({openCriticalCount} open)
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4ADE80' }}>
                    (all resolved)
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {openCriticalCount > 0 ? (
                  <span style={{ color: '#F87171', fontWeight: 700 }}>
                    ⚠️ {openCriticalCount} requires immediate developer triage
                  </span>
                ) : (
                  <span style={{ color: '#4ADE80', fontWeight: 600 }}>
                    ✓ All {criticalCount} verified &amp; closed in probe
                  </span>
                )}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.775rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                  Verified In Probe
                </span>
                <CheckCircle size={16} color="#16A34A" />
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#16A34A' }}>
                {verifiedCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#86EFAC', fontWeight: 600, marginTop: '0.25rem' }}>
                ✓ {totalReports > 0 ? Math.round((verifiedCount / totalReports) * 100) : 100}% verified in probe
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.775rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                  Auto-Reproduced Rate
                </span>
                <Play size={16} color="#2563EB" />
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#38BDF8' }}>
                {reproductionRate}%
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.25rem' }}>
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
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: '#F8FAFC',
                  fontSize: '0.85rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            {/* Severity filter pills */}
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginRight: '0.25rem' }}>Severity:</span>
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
                    border: severityFilter === pill.id ? '1px solid #DC2626' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: severityFilter === pill.id ? 'rgba(220, 38, 38, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                    color: severityFilter === pill.id ? '#FCA5A5' : '#94A3B8',
                    cursor: 'pointer',
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Kanban Triage Board */}
          <div className="kanban-grid">
            {/* Column 1: Pending Review */}
            <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#E2E8F0' }}>
                  Pending Review ({drafts.length})
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {drafts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#64748B', fontSize: '0.8rem' }}>No pending drafts</div>
                ) : (
                  drafts.map((d) => (
                    <div
                      key={d.id}
                      style={{
                        background: 'rgba(13, 16, 25, 0.95)',
                        padding: '1rem',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span className={`badge-severity severity-${d.severity}`}>{d.severity}</span>
                        <button
                          onClick={() => deleteReport(d.id)}
                          title="Delete defect"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                        {d.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '0.65rem' }}>
                        <span>👤 {d.tester_name || 'QA Tester'}</span>
                        <span>•</span>
                        <span>💻 {d.device_tag || 'Station-01'}</span>
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
            <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(56, 189, 248, 0.03)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#38BDF8' }}>
                  Dispatched to Eng ({sent.length})
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sent.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#64748B', fontSize: '0.8rem' }}>No dispatched defects</div>
                ) : (
                  sent.map((d) => (
                    <div
                      key={d.id}
                      style={{
                        background: 'rgba(13, 16, 25, 0.95)',
                        padding: '1rem',
                        borderRadius: '10px',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span className={`badge-severity severity-${d.severity}`}>{d.severity}</span>
                        <button
                          onClick={() => deleteReport(d.id)}
                          title="Delete defect"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                        {d.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '0.65rem' }}>
                        <span>👤 {d.tester_name || 'QA Tester'}</span>
                        <span>•</span>
                        <span>💻 {d.device_tag || 'Station-01'}</span>
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
            <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(245, 158, 11, 0.03)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FBBF24' }}>
                  In Progress ({inProgress.length})
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {inProgress.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#64748B', fontSize: '0.8rem' }}>No defects in progress</div>
                ) : (
                  inProgress.map((d) => (
                    <div
                      key={d.id}
                      style={{
                        background: 'rgba(13, 16, 25, 0.95)',
                        padding: '1rem',
                        borderRadius: '10px',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span className={`badge-severity severity-${d.severity}`}>{d.severity}</span>
                        <button
                          onClick={() => deleteReport(d.id)}
                          title="Delete defect"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                        {d.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '0.65rem' }}>
                        <span>👤 {d.tester_name || 'QA Tester'}</span>
                        <span>•</span>
                        <span>💻 {d.device_tag || 'Station-01'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => updateStatus(d.id, 'verified')}
                          className="btn-primary"
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', background: '#16A34A', borderColor: '#15803D' }}
                        >
                          Verify Fix ✓
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

            {/* Column 4: Verified */}
            <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#34D399' }}>
                  Verified & Closed ({verified.length})
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {verified.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#64748B', fontSize: '0.8rem' }}>No verified closures</div>
                ) : (
                  verified.map((d) => (
                    <div
                      key={d.id}
                      style={{
                        background: 'rgba(13, 16, 25, 0.95)',
                        padding: '1rem',
                        borderRadius: '10px',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span className={`badge-severity severity-${d.severity}`}>{d.severity}</span>
                        <button
                          onClick={() => deleteReport(d.id)}
                          title="Delete defect"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                        {d.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#94A3B8', marginBottom: '0.65rem' }}>
                        <span>👤 {d.tester_name || 'QA Tester'}</span>
                        <span>•</span>
                        <span>💻 {d.device_tag || 'Station-01'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#4ADE80', fontWeight: 700, padding: '0.3rem 0' }}>
                          ✓ Confirmed Fix
                        </span>
                        <Link
                          href={`/app/report/${d.id}`}
                          className="btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', marginLeft: 'auto' }}
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: USER ACCOUNT & EXTENSION MANAGEMENT (NO EMAILS EXPOSED)          */}
      {/* ========================================================================= */}
      {adminView === 'users' && (
        <div className="glass-panel" style={{ padding: 'clamp(1rem, 3vw, 2rem)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F8FAFC' }}>
                User Accounts & Extension Status
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
                Privacy-preserving user administration with real activity tracking, extension heartbeats, and report metrics.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '240px' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search user name or ID..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem 0.45rem 1.85rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: '#F8FAFC',
                    fontSize: '0.8rem',
                    outline: 'none',
                  }}
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                style={{
                  padding: '0.45rem 0.65rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  fontSize: '0.8rem',
                  background: '#0D1019',
                  color: '#F8FAFC',
                  outline: 'none',
                }}
              >
                <option value="all">All Roles</option>
                <option value="tester">Testers</option>
                <option value="lead">QA Leads</option>
                <option value="admin">Admins</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                style={{
                  padding: '0.45rem 0.65rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  fontSize: '0.8rem',
                  background: '#0D1019',
                  color: '#F8FAFC',
                  outline: 'none',
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {loadingUsers ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
              Loading user accounts from Supabase PostgreSQL...
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.08)', color: '#94A3B8' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>User Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>User ID</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Account Status</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Extension Connection</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Submitted</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Processed</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Last Activity</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayUsers.map((user) => (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#F8FAFC' }}>
                        {user.name}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.775rem', color: '#94A3B8' }}>
                        {user.id.slice(0, 8)}...
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            fontSize: '0.725rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            background: user.role === 'admin' ? 'rgba(220, 38, 38, 0.2)' : user.role === 'lead' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                            color: user.role === 'admin' ? '#FCA5A5' : user.role === 'lead' ? '#FCD34D' : '#7DD3FC',
                            border: `1px solid ${user.role === 'admin' ? 'rgba(220, 38, 38, 0.35)' : user.role === 'lead' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(56, 189, 248, 0.35)'}`,
                          }}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            fontSize: '0.725rem',
                            fontWeight: 800,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '9999px',
                            background: user.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                            color: user.status === 'active' ? '#86EFAC' : '#94A3B8',
                            border: user.status === 'active' ? '1px solid rgba(52, 211, 153, 0.35)' : '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          {user.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600 }}>
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              backgroundColor: user.extension_connected ? '#16A34A' : '#64748B',
                              boxShadow: user.extension_connected ? '0 0 6px #16A34A' : 'none',
                            }}
                          />
                          <span style={{ color: user.extension_connected ? '#4ADE80' : '#94A3B8' }}>
                            {user.extension_connected ? 'Connected' : 'Offline'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#F8FAFC' }}>
                        {user.submitted_reports}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#4ADE80' }}>
                        {user.processed_reports}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#94A3B8' }}>
                        {new Date(user.last_activity).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <button
                          onClick={() => toggleUserStatus(user.id, user.status)}
                          className="btn-secondary"
                          style={{ fontSize: '0.725rem', padding: '0.25rem 0.55rem' }}
                        >
                          {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: OPERATIONAL DATA ANALYTICS (6 COMPLETE CATEGORIES)                 */}
      {/* ========================================================================= */}
      {adminView === 'analytics' && (
        <div>
          {/* Filter Range Selector */}
          <div
            className="glass-panel"
            style={{
              padding: '0.85rem 1.25rem',
              marginBottom: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F8FAFC' }}>
                Operational Metric Window:
              </span>
              <span style={{ fontSize: '0.775rem', color: '#94A3B8', marginLeft: '0.5rem' }}>
                All figures queried live from Supabase PostgreSQL & OpenRouter telemetry.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {(['7d', '30d', '90d', 'all'] as const).map((rng) => (
                <button
                  key={rng}
                  onClick={() => {
                    setAnalyticsRange(rng);
                    loadAnalytics(rng);
                  }}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    border: analyticsRange === rng ? '1px solid #DC2626' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: analyticsRange === rng ? 'rgba(220, 38, 38, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                    color: analyticsRange === rng ? '#FCA5A5' : '#94A3B8',
                    cursor: 'pointer',
                  }}
                >
                  {rng === 'all' ? 'All Time' : `Last ${rng}`}
                </button>
              ))}
            </div>
          </div>

          {loadingAnalytics || !analytics ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
              Computing operational analytics across 12 partitioned tables...
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
              {/* Category 1: User Analytics */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Users size={18} color="#DC2626" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
                    1. User Analytics
                  </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Total Accounts</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F8FAFC' }}>
                      {analytics.user_analytics?.total_users}
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#86EFAC', fontWeight: 600 }}>Active Testers</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4ADE80' }}>
                      {analytics.user_analytics?.active_users}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div>• Role Breakdown: {analytics.user_analytics?.testers} Testers, {analytics.user_analytics?.leads} Leads, {analytics.user_analytics?.admins} Admins</div>
                  <div>• Average Reports Contributed per User: {analytics.user_analytics?.avg_reports_per_user}</div>
                </div>
              </div>

              {/* Category 2: Extension Analytics */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Radio size={18} color="#38BDF8" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
                    2. Extension Analytics
                  </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.75rem', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#7DD3FC', fontWeight: 600 }}>Recorded Sessions</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38BDF8' }}>
                      {analytics.extension_analytics?.total_sessions_recorded}
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#86EFAC', fontWeight: 600 }}>Capture Success</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4ADE80' }}>
                      {analytics.extension_analytics?.capture_success_rate}%
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div>• Extension Engine: {analytics.extension_analytics?.version}</div>
                  <div>• Active Ring Buffer: {analytics.extension_analytics?.buffer_slots} slots with 2000ms flush</div>
                </div>
              </div>

              {/* Category 3: Bug Report Analytics */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Kanban size={18} color="#FBBF24" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
                    3. Bug Report Analytics
                  </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#FCD34D', fontWeight: 600 }}>Total Reports</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FBBF24' }}>
                      {analytics.report_analytics?.total_reports}
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#86EFAC', fontWeight: 600 }}>Auto-Reproduction</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4ADE80' }}>
                      {analytics.report_analytics?.reproduction_rate_percent}%
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div>• Critical: {analytics.report_analytics?.severity_distribution?.critical} | High: {analytics.report_analytics?.severity_distribution?.high}</div>
                  <div>• Verified & Fixed: {analytics.report_analytics?.status_distribution?.verified} | Sent: {analytics.report_analytics?.status_distribution?.sent}</div>
                </div>
              </div>

              {/* Category 4: Evidence Analytics */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Layers size={18} color="#A855F7" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
                    4. Evidence Analytics
                  </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.75rem', background: 'rgba(168, 85, 247, 0.08)', borderRadius: '8px', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#C084FC', fontWeight: 600 }}>Stored Telemetry</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#C084FC' }}>
                      {analytics.evidence_analytics?.total_events_in_db}
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem', background: 'rgba(220, 38, 38, 0.08)', borderRadius: '8px', border: '1px solid rgba(220, 38, 38, 0.25)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#FCA5A5', fontWeight: 600 }}>Signals Flagged</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F87171' }}>
                      {analytics.evidence_analytics?.signals_flagged}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div>• Clicks: {analytics.evidence_analytics?.sampled_event_types?.click} | Network: {analytics.evidence_analytics?.sampled_event_types?.network}</div>
                  <div>• Avg Evidence Snapshot: {analytics.evidence_analytics?.avg_evidence_per_report} events/defect</div>
                </div>
              </div>

              {/* Category 5: AI Reasoning Analytics */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Cpu size={18} color="#DC2626" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
                    5. AI Reasoning Analytics
                  </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.75rem', background: 'rgba(220, 38, 38, 0.08)', borderRadius: '8px', border: '1px solid rgba(220, 38, 38, 0.25)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#FCA5A5', fontWeight: 600 }}>AI Success Rate</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F87171' }}>
                      {analytics.ai_analytics?.ai_success_rate_percent}%
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#86EFAC', fontWeight: 600 }}>Avg Latency</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4ADE80' }}>
                      {analytics.ai_analytics?.avg_latency_ms}ms
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div>• Model: <code style={{ fontSize: '0.725rem' }}>Nemotron-3-Nano-Omni-30B</code></div>
                  <div>• Confidence: {analytics.ai_analytics?.confidence?.high} High | {analytics.ai_analytics?.confidence?.medium} Med | {analytics.ai_analytics?.confidence?.low} Low</div>
                </div>
              </div>

              {/* Category 6: System & Infrastructure */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Database size={18} color="#16A34A" />
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
                    6. System & Infrastructure
                  </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#86EFAC', fontWeight: 600 }}>Platform Uptime</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4ADE80' }}>
                      {analytics.system_analytics?.uptime_percent}%
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#7DD3FC', fontWeight: 600 }}>Partitioned Tables</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38BDF8' }}>
                      {analytics.system_analytics?.database_tables_count}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div>• Database: {analytics.system_analytics?.database_type}</div>
                  <div>• Realtime Sync: <code style={{ fontSize: '0.725rem' }}>events, reports, audit_log</code></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings Modal */}
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
    </div>
  );
}
