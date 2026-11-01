'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
} from 'lucide-react';

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
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical'>('all');

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
  const displayReports = statusFilter === 'critical' ? reports.filter((r) => r.severity === 'critical' || r.severity === 'high') : reports;

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
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.025em' }}>
            QA Lead Triage Dashboard
          </h1>
          <p style={{ color: '#4B5563', fontSize: '0.9rem' }}>
            High-level defect status tracking, automatic reproduction velocity, and engineering triage board.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => setStatusFilter(statusFilter === 'all' ? 'critical' : 'all')}
            className="btn-secondary"
            style={{
              fontSize: '0.825rem',
              borderColor: statusFilter === 'critical' ? '#DC2626' : 'rgba(17, 24, 39, 0.15)',
              color: statusFilter === 'critical' ? '#DC2626' : '#111827',
              fontWeight: 700,
            }}
          >
            {statusFilter === 'critical' ? 'Show All Defects' : 'Filter Critical Only'}
          </button>

          <button
            onClick={loadData}
            className="btn-secondary"
            style={{ fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <RotateCcw size={13} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh Board'}</span>
          </button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem',
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

      {/* Kanban Triage Board */}
      <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#111827', marginBottom: '1.25rem' }}>
        Triage & Engineering Hand-off Board
      </h2>

      <div className="kanban-grid">
        {/* Column 1: Pending Review */}
        <div className="glass-panel" style={{ padding: '1.25rem', background: '#F8FAFC' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569' }}>
              Pending Review ({drafts.length})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {drafts.map((d) => (
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
            ))}
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
            {sent.map((d) => (
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
            ))}
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
            {inProgress.map((d) => (
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
            ))}
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
            {verified.map((d) => (
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
                  <span style={{ fontSize: '0.7rem', color: '#16A34A', fontWeight: 800 }}>VERIFIED</span>
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
