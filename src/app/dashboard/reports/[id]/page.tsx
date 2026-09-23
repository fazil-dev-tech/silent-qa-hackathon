'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function ReportDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('defect_reports')
        .select('*')
        .eq('id', id)
        .single();
      
      if (data) setReport(data);
      setLoading(false);
    };
    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="skeleton" style={{ height: '40px', width: '30%' }} />
        <div className="skeleton" style={{ height: '400px' }} />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Report Not Found</h2>
        <button className="btn btn-secondary" onClick={() => router.push('/dashboard/reports')} style={{ marginTop: '16px' }}>
          Back to Reports
        </button>
      </div>
    );
  }

  const enhanced = report.enhanced_description ? JSON.parse(report.enhanced_description) : null;
  const hash = report.extracted_context?.sha256;

  const severityColor = (s: string) => {
    const map: Record<string, string> = { critical: 'var(--accent-rose)', major: 'var(--accent-amber)', minor: 'var(--accent-indigo)', trivial: 'var(--text-secondary)' };
    return map[s] || 'var(--accent-indigo)';
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => router.push('/dashboard/reports')}>
          ← Back
        </button>
        <div>
          <h1 className="page-title" style={{ marginBottom: '4px' }}>{report.enhanced_title || report.raw_summary}</h1>
          <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <span>Reported: {new Date(report.created_at).toLocaleString()}</span>
            <span>Status: <strong style={{ color: 'var(--accent-emerald)' }}>{report.status}</strong></span>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div className="badge" style={{ background: `${severityColor(report.severity)}22`, color: severityColor(report.severity), border: `1px solid ${severityColor(report.severity)}44`, fontSize: '14px', padding: '6px 12px' }}>
            Severity: {report.severity.toUpperCase()}
          </div>
          <div className="confidence-meter" style={{ width: '200px' }}>
            <span style={{ fontSize: '12px' }}>AI Confidence</span>
            <div className="confidence-bar" style={{ flex: 1, margin: '0 8px' }}>
              <div className={`confidence-fill ${(report.ai_confidence_score || 0) >= 0.7 ? 'high' : (report.ai_confidence_score || 0) >= 0.4 ? 'medium' : 'low'}`}
                style={{ width: `${Math.round((report.ai_confidence_score || 0) * 100)}%` }} />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700 }}>
              {Math.round((report.ai_confidence_score || 0) * 100)}%
            </span>
          </div>
          {hash && (
            <div className="hash-badge" onClick={() => navigator.clipboard.writeText(hash)}>
              🔒 SHA-256 Verified (Click to copy)
            </div>
          )}
        </div>

        <div className="report-preview glass" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="report-section">
            <div className="report-section-title">Raw QA Note</div>
            <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{report.raw_summary}"</div>
          </div>

          <div className="report-section">
            <div className="report-section-title">Environment</div>
            <div>{report.environment_info?.environment || enhanced?.environment || 'Unknown'}</div>
          </div>

          <div className="report-section">
            <div className="report-section-title">Steps to Reproduce</div>
            <ol style={{ paddingLeft: '20px', margin: 0 }}>
              {(report.steps_to_reproduce || enhanced?.stepsToReproduce || []).map((step: string, i: number) => (
                <li key={i} style={{ marginBottom: '4px' }}>{step}</li>
              ))}
            </ol>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div className="report-section" style={{ flex: 1, minWidth: '300px' }}>
              <div className="report-section-title">Expected Result</div>
              <div style={{ borderLeft: '3px solid var(--accent-emerald)', paddingLeft: '12px' }}>
                {report.expected_result || enhanced?.expectedResult}
              </div>
            </div>
            <div className="report-section" style={{ flex: 1, minWidth: '300px' }}>
              <div className="report-section-title">Actual Result</div>
              <div style={{ borderLeft: '3px solid var(--accent-rose)', paddingLeft: '12px' }}>
                {report.actual_result || enhanced?.actualResult}
              </div>
            </div>
          </div>

          <div className="report-section">
            <div className="report-section-title">Technical Evidence (Captured by Extension)</div>
            <div 
              style={{ fontFamily: "'Courier New', monospace", fontSize: '12px', lineHeight: '1.6', whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', color: 'var(--text-muted)' }}
              dangerouslySetInnerHTML={{ 
                __html: (report.technical_evidence?.findings || enhanced?.technicalEvidence || '')
                  .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--text-primary);">$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em style="color: var(--accent-cyan);">$1</em>')
                  .replace(/`(.*?)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 4px; border-radius: 4px; color: var(--accent-emerald);">$1</code>') 
              }}
            />
          </div>

          <div className="report-section">
            <div className="report-section-title">Root Cause Hypothesis</div>
            <div>{report.technical_evidence?.rootCause || enhanced?.rootCauseHypothesis}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
