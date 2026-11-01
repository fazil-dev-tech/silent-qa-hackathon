'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
  const playwrightCount = reports.filter((r) => !!r.playwright_script).length;
  const reproductionRate = totalReports > 0 ? Math.round((playwrightCount / totalReports) * 100) : 100;

  // Group by status
  const drafts = reports.filter((r) => r.status === 'draft');
  const sent = reports.filter((r) => r.status === 'sent' || r.status === 'approved');
  const inProgress = reports.filter((r) => r.status === 'in_progress' || r.status === 'open');
  const fixed = reports.filter((r) => r.status === 'fixed' || r.status === 'verified');

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

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
            QA Lead & Triage Dashboard
          </h1>
          <p style={{ color: '#4B5563', fontSize: '0.9rem' }}>
            Enterprise overview of incoming telemetry, AI causal synthesis, and engineering hand-offs.
          </p>
        </div>

        <button onClick={loadData} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
          {loading ? 'Refreshing...' : '🔄 Refresh Data'}
        </button>
      </div>

      {/* KPI Tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem',
        }}
      >
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>
            Total Logged Defects
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#111827', marginTop: '0.25rem' }}>
            {totalReports}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16A34A', marginTop: '0.25rem' }}>
            100% in Supabase Database
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>
            High & Critical Priority
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#DC2626', marginTop: '0.25rem' }}>
            {criticalCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
            Requires immediate triage
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>
            Delivered via SMTP
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#16A34A', marginTop: '0.25rem' }}>
            {sentCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
            Dispatched to Gmail
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>
            Auto-Reproduced Rate
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#2563EB', marginTop: '0.25rem' }}>
            {reproductionRate}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
            Playwright scripts generated
          </div>
        </div>
      </div>

      {/* Triage Board */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '1rem' }}>
        Defect Triage & Resolution Board
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        {/* Column 1: Drafts */}
        <div className="glass-panel" style={{ padding: '1.25rem', background: '#F8FAFC' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
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
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827', marginBottom: '0.75rem' }}>
                  {d.title}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
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

        {/* Column 2: Approved / Sent */}
        <div className="glass-panel" style={{ padding: '1.25rem', background: '#EFF6FF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1D4ED8' }}>
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
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827', marginBottom: '0.75rem' }}>
                  {d.title}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => updateStatus(d.id, 'in_progress')}
                    className="btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                  >
                    Investigate →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: In Progress */}
        <div className="glass-panel" style={{ padding: '1.25rem', background: '#FEF3C7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#B45309' }}>
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
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827', marginBottom: '0.75rem' }}>
                  {d.title}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => updateStatus(d.id, 'fixed')}
                    className="btn-primary"
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', background: '#16A34A' }}
                  >
                    Mark Fixed ✓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 4: Fixed / Verified */}
        <div className="glass-panel" style={{ padding: '1.25rem', background: '#DCFCE7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#15803D' }}>
              Fixed & Verified ({fixed.length})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {fixed.map((d) => (
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
                  <span style={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 700 }}>VERIFIED</span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>
                  {d.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
