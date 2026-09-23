'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

interface Report {
  id: string;
  raw_summary: string;
  enhanced_title: string;
  severity: string;
  status: string;
  ai_confidence_score: number;
  ai_model_used: string;
  created_at: string;
  extracted_context: { sha256?: string };
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchReports = async () => {
      const supabase = createClient();
      let query = supabase.from('defect_reports').select('*').order('created_at', { ascending: false });
      if (filter !== 'all') query = query.eq('severity', filter);
      const { data } = await query.limit(50);
      setReports((data as Report[]) || []);
      setLoading(false);
    };
    fetchReports();
  }, [filter]);

  const severityBadge = (s: string) => {
    const map: Record<string, string> = { critical: 'badge-critical', major: 'badge-major', minor: 'badge-minor', trivial: 'badge-trivial' };
    return map[s] || 'badge-info';
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Defect Reports</h1>
        <p className="page-subtitle">All AI-enhanced defect reports with SHA-256 integrity verification</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['all', 'critical', 'major', 'minor', 'trivial'].map(f => (
          <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? '📋 All' : f === 'critical' ? '🔴 Critical' : f === 'major' ? '🟠 Major' : f === 'minor' ? '🔵 Minor' : '⚪ Trivial'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '100px' }} />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>📋</div>
          <h3 style={{ marginBottom: '8px' }}>No reports found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            {filter !== 'all' ? `No ${filter} severity reports. Try a different filter.` : 'Flag your first defect to get started.'}
          </p>
          <Link href="/dashboard/flag" className="btn btn-primary">🚩 Flag a Defect</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {reports.map(report => (
            <Link key={report.id} href={`/dashboard/reports/${report.id}`} style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span className={`badge ${severityBadge(report.severity)}`}>{report.severity}</span>
                      <span className="badge badge-success">{report.status}</span>
                    </div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                      {report.enhanced_title || report.raw_summary}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Raw: &quot;{report.raw_summary}&quot;
                    </p>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '140px' }}>
                    <div className="confidence-meter" style={{ marginBottom: '8px', padding: '6px 10px' }}>
                      <div className="confidence-bar">
                        <div className={`confidence-fill ${(report.ai_confidence_score || 0) >= 0.7 ? 'high' : (report.ai_confidence_score || 0) >= 0.4 ? 'medium' : 'low'}`}
                          style={{ width: `${Math.round((report.ai_confidence_score || 0) * 100)}%` }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, minWidth: '35px' }}>
                        {Math.round((report.ai_confidence_score || 0) * 100)}%
                      </span>
                    </div>
                    {report.extracted_context?.sha256 && (
                      <div className="hash-badge" style={{ fontSize: '10px' }}>
                        🔒 {report.extracted_context.sha256.substring(0, 12)}...
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      {new Date(report.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
