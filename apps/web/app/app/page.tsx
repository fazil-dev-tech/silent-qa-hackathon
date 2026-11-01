'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ReportItem {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  steps: string[];
  expected: string;
  actual: string;
  root_cause: string;
  confidence: string;
  evidence_ids: string[];
  playwright_script?: string;
  status: string;
  ai_fallback: boolean;
  created_at: string;
}

export default function TesterWorkspacePage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [testNote, setTestNote] = useState('problem in cart button, count jumps to 2');
  const [pickedSelector, setPickedSelector] = useState('button#add-to-cart');
  const [submitting, setSubmitting] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Load real reports directly from API / Supabase
  async function fetchReports() {
    setLoading(true);
    try {
      // Ingest test or query recent reports from API
      const res = await fetch('/api/reports/recent');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
        if (data.reports?.length > 0 && !selectedReport) {
          setSelectedReport(data.reports[0]);
        }
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
  }, []);

  // Submit a live complaint through the full production pipeline (Ingest -> Map -> LLM -> Report)
  async function handleSimulateAndFlag() {
    setSubmitting(true);
    setActionMessage(null);

    try {
      const sessionId = crypto.randomUUID();
      const baseTs = Date.now();

      // Step A: Ingest real telemetry batch into Supabase
      const eventsBatch = [
        {
          id: crypto.randomUUID(),
          session_id: sessionId,
          ts: baseTs - 50,
          type: 'click',
          severity: 'info',
          selector: pickedSelector,
          text: 'Add to Cart',
        },
        {
          id: crypto.randomUUID(),
          session_id: sessionId,
          ts: baseTs - 40,
          type: 'network',
          severity: 'info',
          url: '/api/cart/add',
          method: 'POST',
          status: 200,
          shape: { itemId: 'number', qty: 'number' },
        },
        {
          id: crypto.randomUUID(),
          session_id: sessionId,
          ts: baseTs - 32,
          type: 'network',
          severity: 'info',
          url: '/api/cart/add',
          method: 'POST',
          status: 200,
          shape: { itemId: 'number', qty: 'number' },
        },
        {
          id: crypto.randomUUID(),
          session_id: sessionId,
          ts: baseTs - 10,
          type: 'dom',
          severity: 'info',
          selector: '#cart-counter',
          text: 'text_update: 2',
        },
        {
          id: crypto.randomUUID(),
          session_id: sessionId,
          ts: baseTs - 5,
          type: 'signal',
          severity: 'warn',
          text: 'duplicate_request: POST /api/cart/add fired twice within 8ms',
          selector: pickedSelector,
        },
      ];

      const ingestRes = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_token: 'sqa_live_demo_key_2026',
          session_id: sessionId,
          events: eventsBatch,
        }),
      });

      if (!ingestRes.ok) {
        throw new Error('Failed to ingest telemetry into Supabase');
      }

      // Step B: Submit complaint and trigger AI synthesis
      const complaintRes = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          note: testNote,
          picked_selector: pickedSelector || undefined,
          submitted_at: baseTs,
        }),
      });

      const complaintData = await complaintRes.json();
      if (complaintRes.ok && complaintData.report) {
        setActionMessage('✓ Live defect report synthesized and persisted to Supabase PostgreSQL!');
        setSelectedReport(complaintData.report);
        setReports((prev) => [complaintData.report, ...prev]);
      } else {
        throw new Error(complaintData.error || 'Failed to synthesize report');
      }
    } catch (err: any) {
      setActionMessage(`Error: ${err?.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  // Approve and dispatch HTML email via Nodemailer Gmail SMTP
  async function handleApproveAndSend(reportId: string) {
    setSendingEmail(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/reports/${reportId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: 'mohamedfazilpasha156@gmail.com',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionMessage(`✓ Defect report approved and delivered to ${data.delivered_to} via Gmail SMTP!`);
        if (selectedReport && selectedReport.id === reportId) {
          setSelectedReport({ ...selectedReport, status: 'sent' });
        }
      } else {
        throw new Error(data.error || 'SMTP dispatch failed');
      }
    } catch (err: any) {
      setActionMessage(`Dispatch Warning: ${err?.message}`);
    } finally {
      setSendingEmail(false);
    }
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
            Tester Flight Workspace
          </h1>
          <p style={{ color: '#4B5563', fontSize: '0.9rem' }}>
            Inspect live browser telemetry, verify AI-synthesized defect reports, and dispatch to engineering via Gmail SMTP.
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="btn-secondary"
          disabled={loading}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
        >
          {loading ? 'Refreshing...' : '🔄 Refresh Live Reports'}
        </button>
      </div>

      {actionMessage && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            background: actionMessage.startsWith('✓') ? '#DCFCE7' : '#FEE2E2',
            border: `1px solid ${actionMessage.startsWith('✓') ? '#86EFAC' : '#F87171'}`,
            color: actionMessage.startsWith('✓') ? '#166534' : '#991B1B',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          {actionMessage}
        </div>
      )}

      {/* Grid: Simulator & Report View */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '2rem' }}>
        {/* Left Column: Complaint Simulator & Report List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick Trigger Tool */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: '#111827' }}>
              ⚡ 1-Click Telemetry & Flag Simulator
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '1rem' }}>
              Simulates flight telemetry from an active session and submits a 1-line complaint directly to the real OpenRouter pipeline.
            </p>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4B5563', marginBottom: '0.25rem' }}>
                Tester Complaint Note:
              </label>
              <textarea
                value={testNote}
                onChange={(e) => setTestNote(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(17, 24, 39, 0.12)',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4B5563', marginBottom: '0.25rem' }}>
                Target Selector:
              </label>
              <input
                type="text"
                value={pickedSelector}
                onChange={(e) => setPickedSelector(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(17, 24, 39, 0.12)',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>

            <button
              onClick={handleSimulateAndFlag}
              disabled={submitting}
              className="btn-primary"
              style={{ width: '100%', padding: '0.65rem' }}
            >
              {submitting ? 'Synthesizing with AI...' : 'Run Live Pipeline →'}
            </button>
          </div>

          {/* Reports History */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: '#111827' }}>
              📋 Database Reports ({reports.length})
            </h3>

            {reports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#9CA3AF', fontSize: '0.85rem' }}>
                No reports found yet. Click the button above to synthesize a live report!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '420px', overflowY: 'auto' }}>
                {reports.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedReport(r)}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: selectedReport?.id === r.id ? '2px solid #DC2626' : '1px solid rgba(17, 24, 39, 0.08)',
                      background: selectedReport?.id === r.id ? '#FFF1F2' : '#ffffff',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span className={`badge-severity severity-${r.severity}`}>{r.severity}</span>
                      <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        {r.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {r.title}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Report Review Editor */}
        <div>
          {selectedReport ? (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span className={`badge-severity severity-${selectedReport.severity}`}>{selectedReport.severity}</span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '9999px',
                        background: selectedReport.status === 'sent' ? '#DCFCE7' : '#FEF3C7',
                        color: selectedReport.status === 'sent' ? '#166534' : '#B45309',
                      }}
                    >
                      {selectedReport.status === 'sent' ? '✓ SENT TO ENG' : 'STATUS: ' + selectedReport.status.toUpperCase()}
                    </span>
                    {selectedReport.ai_fallback ? (
                      <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Deterministic Fallback</span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 600 }}>★ OpenRouter AI Synthesized</span>
                    )}
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827' }}>
                    {selectedReport.title}
                  </h2>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleApproveAndSend(selectedReport.id)}
                    disabled={sendingEmail}
                    className="btn-primary"
                    style={{ fontSize: '0.85rem', padding: '0.6rem 1.15rem' }}
                  >
                    {sendingEmail ? 'Delivering via SMTP...' : '✉ Approve & Deliver via Gmail'}
                  </button>
                </div>
              </div>

              {/* Grid: Expected vs Actual */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '1rem', background: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Expected Behavior
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: '#14532D' }}>{selectedReport.expected}</p>
                </div>

                <div style={{ padding: '1rem', background: '#FEF2F2', borderRadius: '10px', border: '1px solid #FECACA' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Actual Behavior
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: '#7F1D1D' }}>{selectedReport.actual}</p>
                </div>
              </div>

              {/* Root Cause Hypothesis */}
              {selectedReport.root_cause && (
                <div style={{ padding: '1rem', background: '#FFFBEB', borderRadius: '10px', border: '1px solid #FDE68A', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400E', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Root Cause Hypothesis
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: '#78350F' }}>{selectedReport.root_cause}</p>
                </div>
              )}

              {/* Reproduction Steps */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
                  Verified Steps to Reproduce:
                </h4>
                <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.9rem', color: '#374151' }}>
                  {selectedReport.steps?.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ol>
              </div>

              {/* Playwright Script Synthesizer */}
              {selectedReport.playwright_script && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>
                      🎭 Synthesized Playwright Reproduction Test:
                    </h4>
                    <button
                      onClick={() => {
                        if (selectedReport.playwright_script) {
                          navigator.clipboard.writeText(selectedReport.playwright_script);
                          alert('Playwright test script copied to clipboard!');
                        }
                      }}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                    >
                      Copy Script
                    </button>
                  </div>
                  <pre
                    style={{
                      background: '#1E293B',
                      color: '#E2E8F0',
                      padding: '1rem',
                      borderRadius: '8px',
                      overflowX: 'auto',
                      fontSize: '0.8rem',
                      lineHeight: 1.45,
                    }}
                  >
                    <code>{selectedReport.playwright_script}</code>
                  </pre>
                </div>
              )}

              {/* Evidence IDs Cross-Reference */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
                  Causal Evidence Cross-References ({selectedReport.evidence_ids?.length || 0} events)
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {selectedReport.evidence_ids?.map((id) => (
                    <span
                      key={id}
                      style={{
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        background: 'rgba(17, 24, 39, 0.05)',
                        border: '1px solid rgba(17, 24, 39, 0.1)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        color: '#4B5563',
                      }}
                    >
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div
              className="glass-panel"
              style={{
                padding: '4rem 2rem',
                textAlign: 'center',
                color: '#6B7280',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔬</div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
                Select a Defect Report to Review
              </h3>
              <p style={{ maxWidth: '450px', fontSize: '0.9rem' }}>
                Choose a report from the database history on the left, or use the 1-Click Simulator to synthesize a new defect report right now.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
