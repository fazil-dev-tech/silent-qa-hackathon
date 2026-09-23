'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Evidence {
  id: string;
  event_type: string;
  severity: string;
  payload: Record<string, unknown>;
  timestamp: string;
  relevanceScore?: number;
}

interface Report {
  id?: string;
  title: string;
  severity: string;
  environment: string;
  stepsToReproduce: string[];
  expectedResult: string;
  actualResult: string;
  technicalEvidence: string;
  rootCauseHypothesis: string;
  confidenceScore: number;
  confidenceReason: string;
  shaHash?: string;
}

export default function FlagDefectPage() {
  const [rawNote, setRawNote] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [sessions, setSessions] = useState<{ id: string; page_url: string; qa_engineer: string; started_at: string }[]>([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [step, setStep] = useState<'input' | 'evidence' | 'report'>('input');
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('sessions')
        .select('id, page_url, qa_engineer, started_at')
        .order('started_at', { ascending: false })
        .limit(20);
      if (data) setSessions(data);
    };
    fetchSessions();
  }, []);

  const findEvidence = async () => {
    if (!rawNote.trim()) return;
    setLoading(true);

    const supabase = createClient();
    const { data: events } = await supabase
      .from('captured_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (events) {
      const keywords = rawNote.toLowerCase().split(/\s+/).filter(w => w.length > 3);

      const scored = events.map(event => {
        let relevanceScore = 0.3;
        if (event.severity === 'error' || event.severity === 'critical') relevanceScore += 0.35;
        if (event.severity === 'warning') relevanceScore += 0.2;
        if (event.event_type === 'js_error' || event.event_type === 'console_error') relevanceScore += 0.15;
        if (event.event_type === 'network_response') {
          const status = event.payload?.status;
          if (typeof status === 'number' && status >= 400) relevanceScore += 0.3;
        }
        const payloadStr = JSON.stringify(event.payload || {}).toLowerCase();
        const matches = keywords.filter(k => payloadStr.includes(k));
        relevanceScore += matches.length * 0.12;
        if (pageUrl && (event.source_url || '').includes(pageUrl)) relevanceScore += 0.15;
        if (selectedSession && event.session_id === selectedSession) relevanceScore += 0.1;
        return { ...event, relevanceScore: Math.min(relevanceScore, 1.0) };
      });

      scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
      setEvidence(scored.slice(0, 15) as Evidence[]);
    }

    setStep('evidence');
    setLoading(false);
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawNote,
          sessionId: selectedSession || null,
          pageUrl: pageUrl || null,
        }),
      });
      const data = await res.json();
      if (data.report) {
        setReport(data.report);
        setStep('report');
      }
    } catch (err) {
      console.error('Generate error:', err);
    }
    setLoading(false);
  };

  const refineReport = async () => {
    if (!refinePrompt.trim() || !report) return;
    setRefining(true);
    try {
      const res = await fetch('/api/refine-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentReport: report, instruction: refinePrompt }),
      });
      const data = await res.json();
      if (data.report) {
        setReport({ ...data.report, id: report.id });
        setRefinePrompt('');
      }
    } catch (err) {
      console.error('Refine error:', err);
    }
    setRefining(false);
  };

  const sendEmail = async () => {
    if (!emailTo.trim() || !report) return;
    setEmailSending(true);
    try {
      const user = JSON.parse(localStorage.getItem('qa_user') || '{}');
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: emailTo, report, reportedBy: user.name || 'QA' }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailSent(true);
        setTimeout(() => { setShowEmailModal(false); setEmailSent(false); }, 2000);
      }
    } catch (err) {
      console.error('Email error:', err);
    }
    setEmailSending(false);
  };

  const updateReportField = (field: keyof Report, value: unknown) => {
    if (report) setReport({ ...report, [field]: value });
  };

  const copyToClipboard = () => {
    if (!report) return;
    const text = `# ${report.title}\n\n**Severity:** ${report.severity}\n**Environment:** ${report.environment}\n\n## Steps to Reproduce\n${report.stepsToReproduce.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n**Expected:** ${report.expectedResult}\n**Actual:** ${report.actualResult}\n\n## Technical Evidence\n${report.technicalEvidence}\n\n## Root Cause Hypothesis\n${report.rootCauseHypothesis}\n\n---\nConfidence: ${Math.round(report.confidenceScore * 100)}% | SHA-256: ${report.shaHash}`;
    navigator.clipboard.writeText(text);
  };

  const eventIcon = (type: string) => {
    const icons: Record<string, string> = {
      console_error: '🔴', console_warn: '🟡', console_log: '📝',
      js_error: '💥', network_request: '🌐', network_response: '🌐',
      dom_mutation: '🔄', user_action: '🖱️', performance_metric: '⏱️',
    };
    return icons[type] || '📌';
  };

  const eventClass = (type: string) => {
    if (type.includes('error')) return 'error';
    if (type.includes('warn')) return 'warning';
    if (type.includes('network')) return 'network';
    if (type.includes('dom')) return 'dom';
    if (type.includes('action')) return 'action';
    return '';
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Flag Defect</h1>
        <p className="page-subtitle">Describe the problem — we&apos;ll match it with technical evidence</p>
      </div>

      {/* Step 1: Input */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: step === 'input' ? 'var(--gradient-primary)' : 'var(--bg-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: 'white'
          }}>1</div>
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Describe the Problem</h3>
        </div>

        <textarea
          className="input-field"
          placeholder="e.g. Cart total shows ₹500 but should be ₹450 after applying coupon code SAVE10..."
          value={rawNote}
          onChange={e => setRawNote(e.target.value)}
          style={{ marginBottom: '16px' }}
        />

        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
            <label className="input-label">Page URL (optional)</label>
            <input className="input-field" placeholder="https://..." value={pageUrl} onChange={e => setPageUrl(e.target.value)} />
          </div>
          <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
            <label className="input-label">Extension Session (optional)</label>
            <select className="input-field" value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
              <option value="">— No session —</option>
              {sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.qa_engineer} — {s.page_url || 'Unknown'} ({new Date(s.started_at).toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button className="btn btn-primary" onClick={findEvidence} disabled={!rawNote.trim() || loading}>
          {loading ? <><span className="spinner" /> Searching...</> : <>🔍 Find Matching Evidence</>}
        </button>
      </div>

      {/* Step 2: Evidence */}
      {step !== 'input' && (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', animation: 'slideUp 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: step === 'evidence' ? 'var(--gradient-primary)' : 'var(--bg-card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: 'white'
            }}>2</div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Matched Evidence</h3>
            <span className="badge badge-info">{evidence.length} matches</span>
          </div>

          {evidence.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
              <p>No matching events found in the database.</p>
              <p style={{ fontSize: '13px', marginTop: '8px' }}>You can still generate a report from your description alone.</p>
            </div>
          ) : (
            <div className="evidence-list">
              {evidence.map((e, i) => (
                <div key={e.id || i} className={`evidence-item ${eventClass(e.event_type)}`}>
                  <span className="evidence-icon">{eventIcon(e.event_type)}</span>
                  <div className="evidence-content">
                    <div className="evidence-title">{e.event_type.replace(/_/g, ' ').toUpperCase()}</div>
                    <div className="evidence-detail">
                      {JSON.stringify(e.payload).substring(0, 200)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: e.relevanceScore && e.relevanceScore > 0.7 ? 'var(--accent-emerald)' : 'var(--text-secondary)' }}>
                      {Math.round((e.relevanceScore || 0) * 100)}%
                    </div>
                    <div className="relevance-bar">
                      <div className="relevance-fill" style={{
                        width: `${Math.round((e.relevanceScore || 0) * 100)}%`,
                        background: e.relevanceScore && e.relevanceScore > 0.7 ? 'var(--gradient-success)' : e.relevanceScore && e.relevanceScore > 0.4 ? 'linear-gradient(135deg, #f59e0b, #f97316)' : 'var(--gradient-danger)'
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            <button className="btn btn-primary btn-lg" onClick={generateReport} disabled={loading}>
              {loading ? <><span className="spinner" /> Generating with AI...</> : <>✨ Generate Enhanced Report</>}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Report */}
      {step === 'report' && report && (
        <div className="glass-card" style={{ padding: '24px', animation: 'slideUp 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: 'white'
            }}>3</div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Enhanced Defect Report</h3>
          </div>

          {/* Confidence + Hash */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div className="confidence-meter" style={{ flex: 1 }}>
              <div>
                <div className="confidence-label">AI Confidence</div>
                <div className="confidence-value" style={{
                  color: report.confidenceScore >= 0.7 ? 'var(--accent-emerald)' : report.confidenceScore >= 0.4 ? 'var(--accent-amber)' : 'var(--accent-rose)'
                }}>
                  {Math.round(report.confidenceScore * 100)}%
                </div>
              </div>
              <div className="confidence-bar" style={{ flex: 1 }}>
                <div className={`confidence-fill ${report.confidenceScore >= 0.7 ? 'high' : report.confidenceScore >= 0.4 ? 'medium' : 'low'}`}
                  style={{ width: `${Math.round(report.confidenceScore * 100)}%` }} />
              </div>
            </div>
            {report.shaHash && (
              <div className="hash-badge" onClick={() => navigator.clipboard.writeText(report.shaHash || '')} title="Click to copy full hash">
                🔒 SHA-256: {report.shaHash.substring(0, 20)}...
              </div>
            )}
          </div>

          {/* Report Content — Editable */}
          <div className="report-preview glass">
            <div className="report-section">
              <div className="report-section-title">Title</div>
              <div className="report-editable" contentEditable suppressContentEditableWarning
                onBlur={e => updateReportField('title', e.currentTarget.textContent || '')}
              >{report.title}</div>
            </div>

            <div className="report-section">
              <div className="report-section-title">Severity</div>
              <select className="input-field" value={report.severity}
                onChange={e => updateReportField('severity', e.target.value)}
                style={{ padding: '8px 12px' }}>
                <option value="critical">🔴 Critical</option>
                <option value="major">🟠 Major</option>
                <option value="minor">🔵 Minor</option>
                <option value="trivial">⚪ Trivial</option>
              </select>
            </div>

            <div className="report-section">
              <div className="report-section-title">Environment</div>
              <div className="report-editable" contentEditable suppressContentEditableWarning
                onBlur={e => updateReportField('environment', e.currentTarget.textContent || '')}
              >{report.environment}</div>
            </div>

            <div className="report-section">
              <div className="report-section-title">Steps to Reproduce</div>
              {report.stepsToReproduce.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--accent-indigo)', fontWeight: 700, minWidth: '20px' }}>{i + 1}.</span>
                  <div className="report-editable" style={{ flex: 1 }} contentEditable suppressContentEditableWarning
                    onBlur={e => {
                      const newSteps = [...report.stepsToReproduce];
                      newSteps[i] = e.currentTarget.textContent || '';
                      updateReportField('stepsToReproduce', newSteps);
                    }}
                  >{step}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="report-section" style={{ flex: 1 }}>
                <div className="report-section-title">Expected Result</div>
                <div className="report-editable" contentEditable suppressContentEditableWarning
                  style={{ borderLeft: '3px solid var(--accent-emerald)', paddingLeft: '12px' }}
                  onBlur={e => updateReportField('expectedResult', e.currentTarget.textContent || '')}
                >{report.expectedResult}</div>
              </div>
              <div className="report-section" style={{ flex: 1 }}>
                <div className="report-section-title">Actual Result</div>
                <div className="report-editable" contentEditable suppressContentEditableWarning
                  style={{ borderLeft: '3px solid var(--accent-rose)', paddingLeft: '12px' }}
                  onBlur={e => updateReportField('actualResult', e.currentTarget.textContent || '')}
                >{report.actualResult}</div>
              </div>
            </div>

            <div className="report-section">
              <div className="report-section-title">Technical Evidence</div>
              <div className="report-editable" contentEditable suppressContentEditableWarning
                style={{ fontFamily: "'Courier New', monospace", fontSize: '12px', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}
                onBlur={e => updateReportField('technicalEvidence', e.currentTarget.textContent || '')}
              >{report.technicalEvidence}</div>
            </div>

            <div className="report-section">
              <div className="report-section-title">Root Cause Hypothesis</div>
              <div className="report-editable" contentEditable suppressContentEditableWarning
                onBlur={e => updateReportField('rootCauseHypothesis', e.currentTarget.textContent || '')}
              >{report.rootCauseHypothesis}</div>
            </div>
          </div>

          {/* Refine with AI */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
            <input
              className="input-field"
              style={{ flex: 1 }}
              placeholder="Refine: e.g. 'make severity critical' or 'add more steps' or 'be more technical'..."
              value={refinePrompt}
              onChange={e => setRefinePrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && refineReport()}
            />
            <button className="btn btn-secondary" onClick={refineReport} disabled={refining || !refinePrompt.trim()}>
              {refining ? <span className="spinner" /> : '🔄'} Refine
            </button>
          </div>

          {/* Before/After */}
          <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)' }}>
            <div className="report-section-title" style={{ marginBottom: '12px' }}>Before → After</div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1, padding: '12px', background: 'rgba(244,63,94,0.05)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-rose)' }}>
                <div style={{ fontSize: '11px', color: 'var(--accent-rose)', fontWeight: 700, marginBottom: '6px' }}>RAW INPUT</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{rawNote}"</div>
              </div>
              <div style={{ flex: 2, padding: '12px', background: 'rgba(16,185,129,0.05)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-emerald)' }}>
                <div style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: 700, marginBottom: '6px' }}>AI-ENHANCED</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{report.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {report.stepsToReproduce.length} steps · {report.severity} · {Math.round(report.confidenceScore * 100)}% confidence
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setShowEmailModal(true)}>📧 Send Email</button>
            <button className="btn btn-secondary" onClick={copyToClipboard}>📋 Copy Markdown</button>
            <button className="btn btn-success" onClick={() => alert('Report saved!')}>💾 Save Report</button>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="modal-overlay" onClick={() => !emailSending && setShowEmailModal(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>📧 Send Report via Email</h3>
            {emailSent ? (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                <p style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>Email sent successfully!</p>
              </div>
            ) : (
              <>
                <div className="input-group" style={{ marginBottom: '20px' }}>
                  <label className="input-label">Recipient Email(s)</label>
                  <input
                    className="input-field"
                    placeholder="developer@company.com"
                    value={emailTo}
                    onChange={e => setEmailTo(e.target.value)}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Separate multiple emails with commas</span>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-primary" onClick={sendEmail} disabled={emailSending || !emailTo.trim()} style={{ flex: 1 }}>
                    {emailSending ? <><span className="spinner" /> Sending...</> : '📧 Send'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowEmailModal(false)} disabled={emailSending}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
