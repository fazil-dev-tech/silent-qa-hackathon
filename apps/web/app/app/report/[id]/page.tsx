'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Send,
  Play,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  Terminal,
  Trash2,
  Download,
} from 'lucide-react';
import EventTimeline from '@/components/event-timeline';
import ExportModal from '@/components/export-modal';
import SendEmailModal from '@/components/send-email-modal';
import CanonicalDefectCard from '@/components/canonical-defect-card';
import QACopilotChat from '@/components/qa-copilot-chat';

export default function ReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Probe runner state
  const [runningProbe, setRunningProbe] = useState(false);
  const [probeResult, setProbeResult] = useState<any | null>(null);

  // Export modal state
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Copy feedback
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  // 4 Focused Tabs
  const [activeTab, setActiveTab] = useState<'canonical' | 'overview' | 'timeline' | 'playwright'>('canonical');

  // Verification checklist state
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  function handleToggleStep(index: number) {
    setCompletedSteps((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }

  async function handleUpdateStatus(newStatus: string) {
    if (!id) return;
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setReport((prev: any) => ({ ...prev, status: newStatus }));
        setActionMessage(`✓ Defect status updated to ${newStatus.toUpperCase()}`);
      }
    } catch (err: any) {
      setActionMessage(`Error updating status: ${err?.message}`);
    }
  }

  function handleDownloadScript() {
    if (!report?.playwright_script) return;
    const blob = new Blob([report.playwright_script], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reproduce-${id ? id.slice(0, 8) : 'test'}.spec.ts`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleCopyCommand(cmd: string) {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  }

  useEffect(() => {
    async function verifyAuthAndLoad() {
      try {
        const authRes = await fetch('/api/auth/me');
        if (!authRes.ok) {
          window.location.replace(`/login?redirect=/app/report/${id}`);
          return;
        }
        const authData = await authRes.json();
        if (!authData.authenticated || !authData.user) {
          window.location.replace(`/login?redirect=/app/report/${id}`);
          return;
        }

        if (!id) return;
        // Direct individual report fetch
        const res = await fetch(`/api/reports/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.report) {
            setReport(data.report);
            return;
          }
        }

        // Fallback to recent reports
        const recentRes = await fetch(`/api/reports/recent`);
        if (recentRes.ok) {
          const recentData = await recentRes.json();
          const found = recentData.reports?.find((r: any) => r.id === id);
          if (found) {
            setReport(found);
            return;
          }
        }

        setError('Defect report not found in database.');
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch report');
      } finally {
        setLoading(false);
      }
    }
    verifyAuthAndLoad();
  }, [id]);

  async function handleDeleteReport() {
    if (!id) return;
    if (!confirm('Are you sure you want to permanently delete this defect report from Supabase?')) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/app');
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete report');
      }
    } catch (err: any) {
      setActionMessage(`Delete Error: ${err?.message}`);
      setDeleting(false);
    }
  }

  async function handleRunProbe() {
    if (!id) return;
    setRunningProbe(true);
    setProbeResult(null);
    try {
      const res = await fetch('/api/reproduce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: id }),
      });
      const data = await res.json();
      if (res.ok) {
        setProbeResult(data);
        if (data.reproduced) {
          setReport((prev: any) => ({ ...prev, status: 'verified' }));
        }
      } else {
        throw new Error(data.error || 'Reproduction probe failed');
      }
    } catch (err: any) {
      setProbeResult({ error: err?.message, reproduced: false });
    } finally {
      setRunningProbe(false);
    }
  }

  function handleCopyScript() {
    if (!report?.playwright_script) return;
    navigator.clipboard.writeText(report.playwright_script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '960px', margin: '4rem auto', textAlign: 'center', color: '#6B7280' }}>
        Loading report from Supabase PostgreSQL database...
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ maxWidth: '960px', margin: '4rem auto', textAlign: 'center' }}>
        <h2 style={{ color: '#DC2626', marginBottom: '1rem' }}>{error || 'Report not found'}</h2>
        <Link href="/app" className="btn-primary">
          Back to Tester Workspace
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <div
        style={{
          minHeight: '100vh',
          background: '#FFF8F8',
          backgroundImage:
            'radial-gradient(at 0% 0%, rgba(220, 38, 38, 0.05) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(56, 189, 248, 0.04) 0px, transparent 40%)',
          padding: '2.5rem 1.5rem',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link
              href="/app"
              style={{
                fontSize: '0.85rem',
                color: '#DC2626',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to Tester Workspace</span>
            </Link>

            <button
              onClick={() => setExportModalOpen(true)}
              className="btn-secondary"
              style={{ fontSize: '0.825rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Share2 size={13} />
              <span>Export Defect</span>
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

          <div className="glass-panel" style={{ padding: '2.5rem' }}>
            {/* Title Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span className={`badge-severity severity-${report.severity}`}>{report.severity}</span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.65rem',
                      borderRadius: '9999px',
                      background:
                        report.status === 'verified'
                          ? '#DCFCE7'
                          : report.status === 'sent'
                            ? '#EFF6FF'
                            : '#FEF3C7',
                      color:
                        report.status === 'verified'
                          ? '#166534'
                          : report.status === 'sent'
                            ? '#1D4ED8'
                            : '#B45309',
                    }}
                  >
                    {report.status === 'verified' ? '✓ REPRODUCED & VERIFIED' : report.status.toUpperCase()}
                  </span>
                  {!report.ai_fallback && (
                    <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Sparkles size={12} /> OpenRouter Nemotron-3
                    </span>
                  )}
                </div>
                <h1 style={{ fontSize: '1.95rem', fontWeight: 900, color: '#111827', lineHeight: 1.25 }}>
                  {report.title}
                </h1>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleRunProbe}
                  disabled={runningProbe}
                  className="btn-secondary"
                  style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Play size={13} color="#2563EB" />
                  <span>{runningProbe ? 'Running Probe...' : '▶ Run Reproduction Probe'}</span>
                </button>

                <button
                  onClick={() => setExportModalOpen(true)}
                  className="btn-secondary"
                  style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Share2 size={13} />
                  <span>Export</span>
                </button>

                <button
                  onClick={() => setSendEmailModalOpen(true)}
                  className="btn-primary"
                  style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Send size={13} />
                  <span>Approve &amp; Send to Gmail</span>
                </button>

                <button
                  onClick={handleDeleteReport}
                  disabled={deleting}
                  className="btn-secondary"
                  style={{
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    color: '#DC2626',
                    borderColor: 'rgba(220, 38, 38, 0.25)',
                  }}
                >
                  <Trash2 size={13} />
                  <span>{deleting ? 'Deleting...' : 'Delete'}</span>
                </button>
              </div>
            </div>

            {/* 4 Professional Navigation Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', borderBottom: '1px solid rgba(17, 24, 39, 0.08)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveTab('canonical')}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  border: activeTab === 'canonical' ? '1px solid #0284C7' : '1px solid transparent',
                  cursor: 'pointer',
                  background: activeTab === 'canonical' ? '#0284C7' : 'rgba(0, 0, 0, 0.04)',
                  color: activeTab === 'canonical' ? '#ffffff' : '#4B5563',
                  boxShadow: activeTab === 'canonical' ? '0 0 12px rgba(2, 132, 199, 0.35)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                ⚡ Canonical Spec Card
              </button>

              <button
                onClick={() => setActiveTab('overview')}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  border: activeTab === 'overview' ? '1px solid #DC2626' : '1px solid transparent',
                  cursor: 'pointer',
                  background: activeTab === 'overview' ? '#DC2626' : 'rgba(0, 0, 0, 0.04)',
                  color: activeTab === 'overview' ? '#ffffff' : '#4B5563',
                  boxShadow: activeTab === 'overview' ? '0 0 12px rgba(220, 38, 38, 0.35)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Overview &amp; Findings
              </button>

              <button
                onClick={() => setActiveTab('timeline')}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  border: activeTab === 'timeline' ? '1px solid #059669' : '1px solid transparent',
                  cursor: 'pointer',
                  background: activeTab === 'timeline' ? '#059669' : 'rgba(0, 0, 0, 0.04)',
                  color: activeTab === 'timeline' ? '#ffffff' : '#4B5563',
                  boxShadow: activeTab === 'timeline' ? '0 0 12px rgba(5, 150, 105, 0.35)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Interactive Event Timeline ({Array.isArray(report.evidence) ? report.evidence.length : 0})
              </button>

              <button
                onClick={() => setActiveTab('playwright')}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  border: activeTab === 'playwright' ? '1px solid #7C3AED' : '1px solid transparent',
                  cursor: 'pointer',
                  background: activeTab === 'playwright' ? '#7C3AED' : 'rgba(0, 0, 0, 0.04)',
                  color: activeTab === 'playwright' ? '#ffffff' : '#4B5563',
                  boxShadow: activeTab === 'playwright' ? '0 0 12px rgba(124, 58, 237, 0.35)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                🎭 Playwright Script
              </button>
            </div>

            {/* Tab 1: Canonical Defect Card */}
            {activeTab === 'canonical' && (
              <div style={{ marginBottom: '2rem' }}>
                <CanonicalDefectCard report={report} />
              </div>
            )}

            {/* Tab 2: Overview & Findings */}
            {activeTab === 'overview' && (
              <div>
                {probeResult && (
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      marginBottom: '1.75rem',
                      background: probeResult.reproduced ? '#F0FDF4' : '#FEF2F2',
                      border: probeResult.reproduced ? '1px solid #86EFAC' : '1px solid #FECACA',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      {probeResult.reproduced ? (
                        <CheckCircle2 size={16} color="#16A34A" />
                      ) : (
                        <AlertOctagon size={16} color="#DC2626" />
                      )}
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: probeResult.reproduced ? '#166534' : '#991B1B' }}>
                        Verdict: {probeResult.reproduced ? 'REPRODUCED & VERIFIED IN REALTIME' : 'PROBE COMPLETE'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#6B7280', marginLeft: 'auto' }}>
                        Latency: {probeResult.execution_time_ms}ms
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: probeResult.reproduced ? '#14532D' : '#7F1D1D' }}>
                      {probeResult.verdict}
                    </p>
                  </div>
                )}

                {/* Expected vs Actual */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
                  <div style={{ padding: '1.25rem', background: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
                    <h3 style={{ fontSize: '0.775rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      Expected Behavior
                    </h3>
                    <p style={{ fontSize: '0.95rem', color: '#14532D', lineHeight: 1.5 }}>{report.expected}</p>
                  </div>

                  <div style={{ padding: '1.25rem', background: '#FEF2F2', borderRadius: '12px', border: '1px solid #FECACA' }}>
                    <h3 style={{ fontSize: '0.775rem', fontWeight: 800, color: '#991B1B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      Actual Behavior
                    </h3>
                    <p style={{ fontSize: '0.95rem', color: '#7F1D1D', lineHeight: 1.5 }}>{report.actual}</p>
                  </div>
                </div>

                {/* Root Cause Hypothesis */}
                {report.root_cause && (
                  <div style={{ padding: '1.25rem', background: '#FFFBEB', borderRadius: '12px', border: '1px solid #FDE68A', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '0.775rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      AI Causal Hypothesis (OpenRouter Reasoning)
                    </h3>
                    <p style={{ fontSize: '0.95rem', color: '#78350F', lineHeight: 1.5 }}>{report.root_cause}</p>
                  </div>
                )}

                {/* Interactive Steps to Reproduce */}
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>
                      Steps to Reproduce ({completedSteps.length}/{report.steps?.length || 0} Verified)
                    </h3>
                    {report.steps && report.steps.length > 0 && (
                      <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        Click steps to check off during manual reproduction
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {report.steps?.map((step: string, idx: number) => {
                      const isDone = completedSteps.includes(idx);
                      return (
                        <div
                          key={idx}
                          onClick={() => handleToggleStep(idx)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            background: isDone ? '#F0FDF4' : '#FFFFFF',
                            border: isDone ? '1px solid #86EFAC' : '1px solid rgba(17, 24, 39, 0.08)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              border: isDone ? 'none' : '2px solid #D1D5DB',
                              background: isDone ? '#16A34A' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {isDone && <Check size={12} color="#FFFFFF" />}
                          </div>
                          <span
                            style={{
                              fontSize: '0.925rem',
                              color: isDone ? '#166534' : '#374151',
                              textDecoration: isDone ? 'line-through' : 'none',
                              fontWeight: isDone ? 600 : 500,
                            }}
                          >
                            {idx + 1}. {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Interactive Event Timeline */}
            {activeTab === 'timeline' && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginBottom: '0.75rem' }}>
                  Flight Telemetry Timeline ({Array.isArray(report.evidence) ? report.evidence.length : 0} Events)
                </h3>
                <EventTimeline events={report.evidence || []} />
              </div>
            )}

            {/* Tab 4: Playwright Script */}
            {activeTab === 'playwright' && (
              <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Terminal size={18} color="#DC2626" />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>
                      Synthesized Playwright Reproduction Test
                    </h3>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={handleDownloadScript}
                      className="btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Download size={13} />
                      <span>Download (.spec.ts)</span>
                    </button>

                    <button
                      onClick={handleCopyScript}
                      className="btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      {copiedScript ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                      <span>{copiedScript ? 'Copied!' : 'Copy Script'}</span>
                    </button>
                  </div>
                </div>

                {/* Terminal Execution Snippet */}
                <div
                  style={{
                    background: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '0.65rem 1rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                    <span style={{ color: '#F43F5E', fontWeight: 800, fontSize: '0.8rem', userSelect: 'none' }}>$</span>
                    <code style={{ color: '#F1F5F9', fontSize: '0.8rem', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      npx playwright test tests/reproduce-{id ? id.slice(0, 8) : 'test'}.spec.ts --headed
                    </code>
                  </div>

                  <button
                    onClick={() =>
                      handleCopyCommand(
                        `npx playwright test tests/reproduce-${id ? id.slice(0, 8) : 'test'}.spec.ts --headed`
                      )
                    }
                    style={{
                      background: '#0F172A',
                      border: '1px solid #475569',
                      color: '#94A3B8',
                      padding: '0.25rem 0.55rem',
                      borderRadius: '4px',
                      fontSize: '0.725rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {copiedCmd ? <Check size={11} color="#10B981" /> : <Copy size={11} />}
                    <span>{copiedCmd ? 'Copied' : 'Copy Command'}</span>
                  </button>
                </div>

                <pre
                  style={{
                    background: '#0F172A',
                    color: '#E2E8F0',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    overflowX: 'auto',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <code>{report.playwright_script || '// No test script generated'}</code>
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Root Cause Hypothesis */}
        {report.root_cause && (
          <div style={{ padding: '1.25rem', background: '#FFFBEB', borderRadius: '12px', border: '1px solid #FDE68A', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.775rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              AI Causal Hypothesis (OpenRouter Reasoning)
            </h3>
            <p style={{ fontSize: '0.95rem', color: '#78350F', lineHeight: 1.5 }}>{report.root_cause}</p>
          </div>
        )}

        {/* Interactive Steps to Reproduce */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>
              Steps to Reproduce ({completedSteps.length}/{report.steps?.length || 0} Verified)
            </h3>
            {report.steps && report.steps.length > 0 && (
              <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                Click steps to check off during manual reproduction
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {report.steps?.map((step: string, idx: number) => {
              const isDone = completedSteps.includes(idx);
              return (
                <div
                  key={idx}
                  onClick={() => handleToggleStep(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: isDone ? '#F0FDF4' : '#FFFFFF',
                    border: isDone ? '1px solid #86EFAC' : '1px solid rgba(17, 24, 39, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: isDone ? 'none' : '2px solid #D1D5DB',
                      background: isDone ? '#16A34A' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isDone && <Check size={12} color="#FFFFFF" />}
                  </div>
                  <span
                    style={{
                      fontSize: '0.925rem',
                      color: isDone ? '#166534' : '#374151',
                      textDecoration: isDone ? 'line-through' : 'none',
                      fontWeight: isDone ? 600 : 500,
                    }}
                  >
                    {idx + 1}. {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Playwright Script */}
        {report.playwright_script && (
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Terminal size={18} color="#DC2626" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>
                  Synthesized Playwright Reproduction Test
                </h3>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={handleDownloadScript}
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <Download size={13} />
                  <span>Download (.spec.ts)</span>
                </button>

                <button
                  onClick={handleCopyScript}
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  {copiedScript ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                  <span>{copiedScript ? 'Copied!' : 'Copy Script'}</span>
                </button>
              </div>
            </div>


            {/* Terminal Execution Snippet */}
            <div
              style={{
                background: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '0.65rem 1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                <span style={{ color: '#F43F5E', fontWeight: 800, fontSize: '0.8rem', userSelect: 'none' }}>$</span>
                <code style={{ color: '#F1F5F9', fontSize: '0.8rem', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  npx playwright test tests/reproduce-{id ? id.slice(0, 8) : 'test'}.spec.ts --headed
                </code>
              </div>

              <button
                onClick={() =>
                  handleCopyCommand(
                    `npx playwright test tests/reproduce-${id ? id.slice(0, 8) : 'test'}.spec.ts --headed`
                  )
                }
                style={{
                  background: '#0F172A',
                  border: '1px solid #475569',
                  color: '#94A3B8',
                  padding: '0.25rem 0.55rem',
                  borderRadius: '4px',
                  fontSize: '0.725rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  whiteSpace: 'nowrap',
                }}
              >
                {copiedCmd ? <Check size={11} color="#10B981" /> : <Copy size={11} />}
                <span>{copiedCmd ? 'Copied' : 'Copy Command'}</span>
              </button>
            </div>

            <pre
              style={{
                background: '#0F172A',
                color: '#E2E8F0',
                padding: '1.25rem',
                borderRadius: '12px',
                overflowX: 'auto',
                fontSize: '0.85rem',
                lineHeight: 1.5,
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <code>{report.playwright_script}</code>
            </pre>
          </div>
        )}

      </div>

      {/* Export Modal */}
      <ExportModal
        report={report}
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />

      {/* Send Email Modal with Recipient Input and Formatted HTML Preview */}
      <SendEmailModal
        report={report}
        isOpen={sendEmailModalOpen}
        onClose={() => setSendEmailModalOpen(false)}
        onSentSuccess={(result) => {
          setReport((prev: any) => ({ ...prev, status: 'sent' }));
          setActionMessage(`✓ Defect report successfully dispatched to ${result.recipients?.join(', ')}`);
        }}
      />

      {/* Floating QA Copilot Chat with Live Supabase & Telemetry Context */}
      <QACopilotChat activeReport={report} sessionId={report?.session_id} />
    </div>
  );
}
