'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

interface Stats {
  totalReports: number;
  totalSessions: number;
  totalEvents: number;
  avgConfidence: number;
}

interface Report {
  id: string;
  raw_summary: string;
  enhanced_title: string;
  severity: string;
  status: string;
  ai_confidence_score: number;
  created_at: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalReports: 0, totalSessions: 0, totalEvents: 0, avgConfidence: 0 });
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      const [reportsRes, sessionsRes, eventsRes] = await Promise.all([
        supabase.from('defect_reports').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('sessions').select('id', { count: 'exact' }),
        supabase.from('captured_events').select('id', { count: 'exact' }),
      ]);

      const reports = reportsRes.data || [];
      const avgConf = reports.length > 0
        ? reports.reduce((sum, r) => sum + (r.ai_confidence_score || 0), 0) / reports.length
        : 0;

      setStats({
        totalReports: reports.length,
        totalSessions: sessionsRes.count || 0,
        totalEvents: eventsRes.count || 0,
        avgConfidence: Math.round(avgConf * 100),
      });
      setRecentReports(reports as Report[]);
      setLoading(false);
    };

    fetchData();
  }, []);

  const severityBadge = (severity: string) => {
    const map: Record<string, string> = { critical: 'badge-critical', major: 'badge-major', minor: 'badge-minor', trivial: 'badge-trivial' };
    return map[severity] || 'badge-info';
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Real-time overview of your QA testing activity</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="glass-card stat-card indigo">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{loading ? '—' : stats.totalReports}</div>
          <div className="stat-label">Defect Reports</div>
        </div>
        <div className="glass-card stat-card emerald">
          <div className="stat-icon">🔌</div>
          <div className="stat-value">{loading ? '—' : stats.totalSessions}</div>
          <div className="stat-label">Extension Sessions</div>
        </div>
        <div className="glass-card stat-card amber">
          <div className="stat-icon">⚡</div>
          <div className="stat-value">{loading ? '—' : stats.totalEvents.toLocaleString()}</div>
          <div className="stat-label">Captured Events</div>
        </div>
        <div className="glass-card stat-card rose">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{loading ? '—' : `${stats.avgConfidence}%`}</div>
          <div className="stat-label">Avg Confidence</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
        <Link href="/dashboard/flag" className="btn btn-primary">🚩 Flag New Defect</Link>
        <Link href="/dashboard/chat" className="btn btn-secondary">💬 Open QA Chatbot</Link>
        <Link href="/dashboard/reports" className="btn btn-secondary">📋 View All Reports</Link>
      </div>

      {/* Recent Reports */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Recent Reports</h2>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '80px' }} />)}
          </div>
        ) : recentReports.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ marginBottom: '8px' }}>No reports yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              Start by flagging a defect or installing the browser extension
            </p>
            <Link href="/dashboard/flag" className="btn btn-primary">🚩 Flag Your First Defect</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentReports.map(report => (
              <Link key={report.id} href={`/dashboard/reports/${report.id}`} style={{ textDecoration: 'none' }}>
                <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span className={`badge ${severityBadge(report.severity)}`}>{report.severity}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {report.enhanced_title || report.raw_summary}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {new Date(report.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="confidence-meter" style={{ width: '160px', padding: '8px 12px' }}>
                    <div className="confidence-bar" style={{ flex: 1 }}>
                      <div
                        className={`confidence-fill ${(report.ai_confidence_score || 0) >= 0.7 ? 'high' : (report.ai_confidence_score || 0) >= 0.4 ? 'medium' : 'low'}`}
                        style={{ width: `${Math.round((report.ai_confidence_score || 0) * 100)}%` }}
                      />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '40px', textAlign: 'right' }}>
                      {Math.round((report.ai_confidence_score || 0) * 100)}%
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
