'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Terminal,
  Send,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertOctagon,
  Copy,
  Check,
  Share2,
  FileText,
  Clock,
  Layers,
  Activity,
  Trash2,
  Search,
  Download,
  ExternalLink,
  ShieldAlert,
  Radio,
  Cpu,
  Laptop,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  History,
  MessageSquare,
  X,
  RefreshCw,
} from 'lucide-react';
import LiveTelemetryFeed from '@/components/live-telemetry-feed';
import EventTimeline from '@/components/event-timeline';
import ExportModal from '@/components/export-modal';
import SendEmailModal from '@/components/send-email-modal';
import CanonicalDefectCard from '@/components/canonical-defect-card';
import QACopilotChat from '@/components/qa-copilot-chat';

interface ReportItem {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  steps: string[];
  expected: string;
  actual: string;
  root_cause: string;
  confidence: string;
  evidence: any[];
  evidence_ids: string[];
  raw_note?: string;
  suggested_fix?: string;
  playwright_script?: string;
  status: string;
  session_id?: string;
  ai_fallback: boolean;
  tester_name?: string;
  device_tag?: string;
  created_at: string;
}

interface SessionItem {
  id: string;
  app_url: string;
  host: string;
  tester: string;
  device: string;
  started_at: string;
}

export default function TesterWorkspacePage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Reports
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [loading, setLoading] = useState(false);

  // Sessions & Time Window
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [timeWindowSeconds, setTimeWindowSeconds] = useState<number>(180); // 180s = 3m default
  const [showSessionModal, setShowSessionModal] = useState(false);

  // Human Complaint Note Input
  const [testNote, setTestNote] = useState('');
  const [pickedSelector, setPickedSelector] = useState('');
  const [showSelectorInput, setShowSelectorInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Active Report Tab (Single active tab)
  const [activeReportTab, setActiveReportTab] = useState<'canonical' | 'overview' | 'timeline' | 'playwright'>('canonical');
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showHistoryShelf, setShowHistoryShelf] = useState(false);

  // Reproduction probe state
  const [runningProbe, setRunningProbe] = useState(false);
  const [probeResult, setProbeResult] = useState<any | null>(null);

  // Modals
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false);
  const [deletingReport, setDeletingReport] = useState(false);

  // Copy feedback
  const [copiedJira, setCopiedJira] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  // 1. Strict Authentication Guard & Data Hydration
  useEffect(() => {
    async function verifyAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          window.location.replace('/login?redirect=/app');
          return;
        }
        const data = await res.json();
        if (!data.authenticated || !data.user) {
          window.location.replace('/login?redirect=/app');
          return;
        }
        setCurrentUser(data.user);
        setAuthChecked(true);
        fetchReports();
        fetchSessions();
      } catch {
        window.location.replace('/login?redirect=/app');
      }
    }
    verifyAuth();
  }, []);

  // 2. Fetch Sessions & Auto-Select Latest
  async function fetchSessions() {
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        const list: SessionItem[] = data.sessions || [];
        setSessions(list);
        if (list.length > 0 && !selectedSessionId) {
          setSelectedSessionId(list[0].id);
        }
      }
    } catch {}
  }

  // 3. Fetch Reports
  async function fetchReports() {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/recent');
      if (res.ok) {
        const data = await res.json();
        const reportList: ReportItem[] = data.reports || [];
        setReports(reportList);
        if (reportList.length > 0) {
          setSelectedReport((prev) => {
            if (!prev) return reportList[0];
            const match = reportList.find((r) => r.id === prev.id);
            return match || reportList[0];
          });
        }
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }

  // 4. Submit Complaint Note & Trigger Causal Synthesis
  async function handleEnhanceDefect() {
    if (!testNote.trim()) {
      setActionMessage('Please describe what went wrong or what button/flow failed.');
      return;
    }

    setSubmitting(true);
    setActionMessage(null);
    setProbeResult(null);

    try {
      const sessionId = selectedSessionId || crypto.randomUUID();
      const baseTs = Date.now();

      const complaintRes = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          note: testNote.trim(),
          picked_selector: pickedSelector.trim() || undefined,
          tester_name: currentUser?.name || 'QA Engineer',
          device_tag: 'Station-01 (Active Workstation)',
          window_seconds: timeWindowSeconds,
          submitted_at: baseTs,
        }),
      });

      const complaintData = await complaintRes.json();
      if (complaintRes.ok && complaintData.report) {
        const enhancedReport: ReportItem = {
          ...complaintData.report,
          raw_note: testNote.trim(),
        };
        setActionMessage('✓ Defect enhanced into Canonical Engineering Specification!');
        setTestNote('');
        setPickedSelector('');
        setSelectedReport(enhancedReport);
        setReports((prev) => [enhancedReport, ...prev]);
        setActiveReportTab('canonical');
      } else {
        throw new Error(complaintData.error || 'Failed to enhance defect');
      }
    } catch (err: any) {
      setActionMessage(`Error: ${err?.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  // 5. Run Playwright Reproduction Probe
  async function handleRunProbe(reportId: string) {
    setRunningProbe(true);
    setProbeResult(null);
    try {
      const res = await fetch('/api/reproduce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: reportId }),
      });
      const data = await res.json();
      if (res.ok) {
        setProbeResult(data);
        if (selectedReport) {
          setSelectedReport({ ...selectedReport, status: data.reproduced ? 'verified' : selectedReport.status });
        }
      } else {
        throw new Error(data.error || 'Probe run failed');
      }
    } catch (err: any) {
      setActionMessage(`Reproduction Probe error: ${err?.message}`);
    } finally {
      setRunningProbe(false);
    }
  }

  function handleToggleStep(index: number) {
    setCompletedSteps((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }

  function handleDownloadScript() {
    if (!selectedReport?.playwright_script) return;
    const blob = new Blob([selectedReport.playwright_script], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reproduce-${selectedReport.id.slice(0, 8)}.spec.ts`;
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

  async function handleDeleteReport(reportId: string) {
    if (!confirm('Are you sure you want to permanently delete this defect report from Supabase?')) {
      return;
    }
    setDeletingReport(true);
    try {
      const res = await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
        setSelectedReport((prev) => {
          const remaining = reports.filter((r) => r.id !== reportId);
          return remaining.length > 0 ? remaining[0] : null;
        });
        setActionMessage('✓ Defect report permanently deleted from database.');
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete report');
      }
    } catch (err: any) {
      setActionMessage(`Delete Error: ${err?.message}`);
    } finally {
      setDeletingReport(false);
    }
  }

  // Active session object
  const activeSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0] || {
    id: selectedSessionId || 'active-live-session',
    host: 'Active Browser Flight Session',
    tester: currentUser?.name || 'Engineer #1',
    device: 'Station-01',
    started_at: new Date().toISOString(),
  };

  const quickPhraseChips = [
    'Cart button count jumps to 2',
    '500 Server Error on payment submit',
    'Unresponsive button (dead click)',
    'Endless loading spinner on checkout',
    'State reset after modal close',
  ];

  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFF8F8' }}>
        <div style={{ textAlign: 'center', color: '#64748B' }}>
          <Activity size={32} className="animate-spin" color="#DC2626" style={{ margin: '0 auto 1rem' }} />
          <p style={{ fontWeight: 600 }}>Loading Silent QA Flight Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FFF8F8',
        backgroundImage:
          'radial-gradient(at 0% 0%, rgba(220, 38, 38, 0.05) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(56, 189, 248, 0.04) 0px, transparent 40%)',
        color: '#0F172A',
        paddingBottom: '5rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Main Studio Workspace Container */}
      <main style={{ maxWidth: '1380px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Workspace Title & Live Pulse */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1.75rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.025em' }}>
                Tester Flight Workspace
              </h1>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#16A34A',
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }} />
                <span>Live Telemetry Active</span>
              </span>
            </div>
            <p style={{ fontSize: '0.885rem', color: '#64748B' }}>
              Live browser telemetry streams, AI causal synthesis, in-browser Playwright reproduction probes, and Gmail delivery.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={fetchReports}
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Reports</span>
            </button>
          </div>
        </div>

        {/* Global Toast Message */}
        {actionMessage && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              borderRadius: '10px',
              marginBottom: '1.5rem',
              background: actionMessage.startsWith('✓') ? '#F0FDF4' : '#FEF2F2',
              border: `1px solid ${actionMessage.startsWith('✓') ? '#86EFAC' : '#FCA5A5'}`,
              color: actionMessage.startsWith('✓') ? '#166534' : '#991B1B',
              fontSize: '0.875rem',
              fontWeight: 600,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
              <X size={15} />
            </button>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 2-COLUMN COCKPIT LAYOUT                                             */}
        {/* ==================================================================== */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* ================================================================ */}
          {/* LEFT COLUMN: LIVE TELEMETRY RADAR & COMPLAINT UPLINK              */}
          {/* ================================================================ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* 1. Realtime Telemetry Stream */}
            <LiveTelemetryFeed />

            {/* 2. Flight Recorder Uplink & Complaint Intake */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#DC2626', fontWeight: 800, fontSize: '0.85rem' }}>
                  <Terminal size={16} />
                  <span>Flight Recorder Uplink</span>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                  EXTENSION READY
                </span>
              </div>

              <p style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.45, marginBottom: '1rem' }}>
                The Silent QA Flight Recorder extension automatically captures clicks, network failures, and DOM anomalies on your active tabs. You can also flag a specific observation below.
              </p>

              {/* Observed Defect / Complaint Note */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                  Observed Defect / Complaint Note:
                </label>
                <textarea
                  value={testNote}
                  onChange={(e) => setTestNote(e.target.value)}
                  placeholder="e.g. Save Draft button not responding to multiple clicks / returns 500"
                  rows={3}
                  style={{
                    width: '100%',
                    background: '#FFFFFF',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '0.75rem 0.85rem',
                    color: '#0F172A',
                    fontSize: '0.885rem',
                    fontFamily: 'inherit',
                    lineHeight: 1.45,
                    outline: 'none',
                    resize: 'vertical',
                    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.03)',
                  }}
                />
              </div>

              {/* Quick Scenario Preset Chips */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B', marginBottom: '0.35rem' }}>
                  Quick Scenario Presets:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {quickPhraseChips.map((phrase) => (
                    <button
                      key={phrase}
                      type="button"
                      onClick={() => setTestNote(phrase)}
                      style={{
                        background: 'rgba(0, 0, 0, 0.03)',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        color: '#475569',
                        borderRadius: '9999px',
                        padding: '0.2rem 0.55rem',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      + {phrase}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recorded Session Selector */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Recorded Flight Session:
                  </label>
                  <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{sessions.length} active sessions</span>
                </div>

                <div
                  onClick={() => setShowSessionModal(!showSessionModal)}
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '0.6rem 0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <strong style={{ color: '#0F172A' }}>{activeSession.host}</strong>
                    <span style={{ color: '#64748B', marginLeft: '0.35rem' }}>({activeSession.tester})</span>
                  </div>
                  <ChevronDown size={14} color="#64748B" />
                </div>

                {/* Session Selector Drawer */}
                {showSessionModal && (
                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '0.5rem',
                      marginTop: '0.35rem',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                      maxHeight: '180px',
                      overflowY: 'auto',
                    }}
                  >
                    {sessions.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSelectedSessionId(s.id);
                          setShowSessionModal(false);
                        }}
                        style={{
                          padding: '0.45rem 0.65rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          background: selectedSessionId === s.id ? 'rgba(220, 38, 38, 0.08)' : 'transparent',
                          color: selectedSessionId === s.id ? '#DC2626' : '#334155',
                          fontSize: '0.78rem',
                          fontWeight: selectedSessionId === s.id ? 700 : 500,
                          marginBottom: '0.2rem',
                        }}
                      >
                        <div>{s.host}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{s.tester} • {new Date(s.started_at).toLocaleTimeString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Telemetry Slice Time Window */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Telemetry Window Slice:
                </label>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {[
                    { label: '60s', value: 60 },
                    { label: '3m (Rec)', value: 180 },
                    { label: '5m', value: 300 },
                    { label: 'Full Flight', value: 0 },
                  ].map((win) => (
                    <button
                      key={win.value}
                      type="button"
                      onClick={() => setTimeWindowSeconds(win.value)}
                      style={{
                        flex: 1,
                        padding: '0.3rem 0.45rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        border: timeWindowSeconds === win.value ? '1px solid #DC2626' : '1px solid #E2E8F0',
                        background: timeWindowSeconds === win.value ? 'rgba(220, 38, 38, 0.08)' : '#FFFFFF',
                        color: timeWindowSeconds === win.value ? '#DC2626' : '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      {win.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Synthesize Button */}
              <button
                onClick={handleEnhanceDefect}
                disabled={submitting || !testNote.trim()}
                className="btn-primary"
                style={{ width: '100%', padding: '0.85rem' }}
              >
                <Sparkles size={16} />
                <span>{submitting ? 'Synthesizing Telemetry...' : '✨ Enhance Defect with Telemetry →'}</span>
              </button>
            </div>
          </div>

          {/* ================================================================ */}
          {/* RIGHT COLUMN: ACTIVE DEFECT REPORT STATION                       */}
          {/* ================================================================ */}
          <div>
            {selectedReport ? (
              <div className="glass-panel" style={{ padding: '2rem' }}>
                {/* Header Strip with Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span className={`badge-severity severity-${selectedReport.severity}`}>
                        {selectedReport.severity.toUpperCase()}
                      </span>

                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.65rem',
                          borderRadius: '9999px',
                          background: selectedReport.status === 'verified' ? '#DCFCE7' : '#EFF6FF',
                          color: selectedReport.status === 'verified' ? '#166534' : '#1D4ED8',
                          border: `1px solid ${selectedReport.status === 'verified' ? '#86EFAC' : '#BFDBFE'}`,
                        }}
                      >
                        {selectedReport.status === 'verified' ? '✓ REPRODUCED & VERIFIED' : selectedReport.status.toUpperCase()}
                      </span>

                      {!selectedReport.ai_fallback && (
                        <span style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Sparkles size={12} /> OpenRouter Nemotron-3
                        </span>
                      )}
                    </div>

                    <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0F172A', lineHeight: 1.3 }}>
                      {selectedReport.title}
                    </h2>

                    <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.25rem' }}>
                      Reported by: <strong style={{ color: '#0F172A' }}>{selectedReport.tester_name || 'Engineer #1'}</strong> • Station: <strong>{selectedReport.device_tag || 'Station-01'}</strong> • Created: {new Date(selectedReport.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* The 4 Action Toolbar Buttons */}
                  <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleRunProbe(selectedReport.id)}
                      disabled={runningProbe}
                      className="btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Play size={13} color="#2563EB" />
                      <span>{runningProbe ? 'Running Probe...' : '▶ Run Reproduction Probe'}</span>
                    </button>

                    <button
                      onClick={() => setExportModalOpen(true)}
                      className="btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Share2 size={13} />
                      <span>Export</span>
                    </button>

                    <button
                      onClick={() => setSendEmailModalOpen(true)}
                      className="btn-primary"
                      style={{ fontSize: '0.8rem', padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Send size={13} />
                      <span>Approve &amp; Send to Gmail</span>
                    </button>

                    <button
                      onClick={() => handleDeleteReport(selectedReport.id)}
                      disabled={deletingReport}
                      className="btn-secondary"
                      style={{
                        fontSize: '0.8rem',
                        padding: '0.45rem 0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        color: '#DC2626',
                        borderColor: 'rgba(220, 38, 38, 0.25)',
                      }}
                    >
                      <Trash2 size={13} />
                      <span>{deletingReport ? 'Deleting...' : 'Delete'}</span>
                    </button>
                  </div>
                </div>

                {/* Reproduction Probe Banner */}
                {probeResult && (
                  <div
                    style={{
                      background: probeResult.reproduced ? '#F0FDF4' : '#FEF2F2',
                      border: `1px solid ${probeResult.reproduced ? '#86EFAC' : '#FECACA'}`,
                      borderRadius: '10px',
                      padding: '0.85rem 1.15rem',
                      marginBottom: '1.25rem',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: probeResult.reproduced ? '#166534' : '#991B1B' }}>
                      {probeResult.reproduced ? <CheckCircle2 size={16} color="#16A34A" /> : <AlertOctagon size={16} color="#DC2626" />}
                      <span>{probeResult.reproduced ? '✓ 100% Deterministic Reproduction Verified by In-Browser Probe' : 'Reproduction Probe Anomaly'}</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: 'auto' }}>
                        Latency: {probeResult.execution_time_ms}ms
                      </span>
                    </div>
                    <div style={{ color: probeResult.reproduced ? '#14532D' : '#7F1D1D', fontSize: '0.78rem', marginTop: '0.25rem' }}>
                      {probeResult.verdict || probeResult.output || 'Steps replayed against target endpoint matched expected crash fingerprint.'}
                    </div>
                  </div>
                )}

                {/* 4 Clean Navigation Tabs */}
                <div
                  style={{
                    display: 'flex',
                    gap: '0.4rem',
                    marginBottom: '1.5rem',
                    borderBottom: '1px solid rgba(220, 38, 38, 0.1)',
                    paddingBottom: '0.65rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    onClick={() => setActiveReportTab('canonical')}
                    style={{
                      padding: '0.45rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      border: activeReportTab === 'canonical' ? '1px solid #0284C7' : '1px solid transparent',
                      cursor: 'pointer',
                      background: activeReportTab === 'canonical' ? '#0284C7' : 'rgba(0, 0, 0, 0.04)',
                      color: activeReportTab === 'canonical' ? '#FFFFFF' : '#475569',
                      boxShadow: activeReportTab === 'canonical' ? '0 4px 14px rgba(2, 132, 199, 0.3)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Sparkles size={13} />
                    <span>⚡ Canonical Spec Card</span>
                  </button>

                  <button
                    onClick={() => setActiveReportTab('overview')}
                    style={{
                      padding: '0.45rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      border: activeReportTab === 'overview' ? '1px solid #DC2626' : '1px solid transparent',
                      cursor: 'pointer',
                      background: activeReportTab === 'overview' ? '#DC2626' : 'rgba(0, 0, 0, 0.04)',
                      color: activeReportTab === 'overview' ? '#FFFFFF' : '#475569',
                      boxShadow: activeReportTab === 'overview' ? '0 4px 14px rgba(220, 38, 38, 0.3)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Overview &amp; Findings
                  </button>

                  <button
                    onClick={() => setActiveReportTab('timeline')}
                    style={{
                      padding: '0.45rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      border: activeReportTab === 'timeline' ? '1px solid #059669' : '1px solid transparent',
                      cursor: 'pointer',
                      background: activeReportTab === 'timeline' ? '#059669' : 'rgba(0, 0, 0, 0.04)',
                      color: activeReportTab === 'timeline' ? '#FFFFFF' : '#475569',
                      boxShadow: activeReportTab === 'timeline' ? '0 4px 14px rgba(5, 150, 105, 0.3)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Interactive Event Timeline ({Array.isArray(selectedReport.evidence) ? selectedReport.evidence.length : 0})
                  </button>

                  <button
                    onClick={() => setActiveReportTab('playwright')}
                    style={{
                      padding: '0.45rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      border: activeReportTab === 'playwright' ? '1px solid #7C3AED' : '1px solid transparent',
                      cursor: 'pointer',
                      background: activeReportTab === 'playwright' ? '#7C3AED' : 'rgba(0, 0, 0, 0.04)',
                      color: activeReportTab === 'playwright' ? '#FFFFFF' : '#475569',
                      boxShadow: activeReportTab === 'playwright' ? '0 4px 14px rgba(124, 58, 237, 0.3)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Terminal size={13} />
                    <span>🎭 Playwright Script</span>
                  </button>
                </div>

                {/* Tab 1: The Canonical Defect Card */}
                {activeReportTab === 'canonical' && (
                  <CanonicalDefectCard
                    report={{
                      id: selectedReport.id,
                      title: selectedReport.title,
                      severity: selectedReport.severity,
                      steps: selectedReport.steps,
                      expected: selectedReport.expected,
                      actual: selectedReport.actual,
                      root_cause: selectedReport.root_cause,
                      confidence: selectedReport.confidence,
                      evidence: selectedReport.evidence,
                      raw_note: selectedReport.raw_note,
                      suggested_fix: selectedReport.suggested_fix,
                      tester_name: selectedReport.tester_name,
                      device_tag: selectedReport.device_tag,
                      created_at: selectedReport.created_at,
                    }}
                  />
                )}

                {/* Tab 2: Overview & Findings */}
                {activeReportTab === 'overview' && (
                  <div>
                    {/* Expected vs Actual */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                      <div style={{ padding: '1.25rem', background: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0', borderLeft: '4px solid #10B981' }}>
                        <h4 style={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', marginBottom: '0.45rem', letterSpacing: '0.06em' }}>
                          EXPECTED BEHAVIOR
                        </h4>
                        <p style={{ fontSize: '0.925rem', color: '#14532D', lineHeight: 1.5 }}>
                          {selectedReport.expected}
                        </p>
                      </div>

                      <div style={{ padding: '1.25rem', background: '#FEF2F2', borderRadius: '12px', border: '1px solid #FECACA', borderLeft: '4px solid #EF4444' }}>
                        <h4 style={{ fontSize: '0.72rem', fontWeight: 800, color: '#991B1B', textTransform: 'uppercase', marginBottom: '0.45rem', letterSpacing: '0.06em' }}>
                          ACTUAL OBSERVED BEHAVIOR
                        </h4>
                        <p style={{ fontSize: '0.925rem', color: '#7F1D1D', lineHeight: 1.5 }}>
                          {selectedReport.actual}
                        </p>
                      </div>
                    </div>

                    {/* AI Causal Hypothesis */}
                    {selectedReport.root_cause && (
                      <div style={{ padding: '1.25rem', background: '#FFFBEB', borderRadius: '12px', border: '1px solid #FDE68A', borderLeft: '4px solid #F59E0B', marginBottom: '1.5rem' }}>
                        <h4 style={{ fontSize: '0.72rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase', marginBottom: '0.45rem', letterSpacing: '0.06em' }}>
                          AI ROOT CAUSE HYPOTHESIS ({selectedReport.confidence || 'HIGH'} CONFIDENCE)
                        </h4>
                        <p style={{ fontSize: '0.925rem', color: '#78350F', lineHeight: 1.5 }}>
                          {selectedReport.root_cause}
                        </p>
                      </div>
                    )}

                    {/* Interactive Steps to Reproduce */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                          Steps to Reproduce ({completedSteps.length}/{selectedReport.steps?.length || 0} Verified)
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          Click steps to check off during manual reproduction
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {selectedReport.steps?.map((step: string, idx: number) => {
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
                                border: isDone ? '1px solid #86EFAC' : '1px solid #E2E8F0',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <div
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '50%',
                                  border: isDone ? 'none' : '2px solid #CBD5E1',
                                  background: isDone ? '#16A34A' : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                {isDone && <Check size={11} color="#FFFFFF" />}
                              </div>
                              <span
                                style={{
                                  fontSize: '0.9rem',
                                  color: isDone ? '#166534' : '#334155',
                                  textDecoration: isDone ? 'line-through' : 'none',
                                  fontWeight: isDone ? 600 : 500,
                                }}
                              >
                                <strong style={{ color: '#0284C7', marginRight: '0.35rem' }}>{idx + 1}.</strong>
                                {step.replace(/^\[Tester:[^\]]+\]\s*/, '')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Interactive Event Timeline */}
                {activeReportTab === 'timeline' && (
                  <div style={{ padding: '0.5rem 0' }}>
                    <EventTimeline events={selectedReport.evidence || []} />
                  </div>
                )}

                {/* Tab 4: Playwright Script */}
                {activeReportTab === 'playwright' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Terminal size={17} color="#DC2626" />
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                          Synthesized Playwright Reproduction Test
                        </h4>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          onClick={handleDownloadScript}
                          className="btn-secondary"
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Download size={13} />
                          <span>Download (.spec.ts)</span>
                        </button>

                        <button
                          onClick={() => {
                            if (!selectedReport?.playwright_script) return;
                            navigator.clipboard.writeText(selectedReport.playwright_script);
                            setCopiedScript(true);
                            setTimeout(() => setCopiedScript(false), 2000);
                          }}
                          className="btn-secondary"
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          {copiedScript ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                          <span>{copiedScript ? 'Copied!' : 'Copy Script'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Terminal CLI Snippet */}
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
                          npx playwright test tests/reproduce-{selectedReport.id.slice(0, 8)}.spec.ts --headed
                        </code>
                      </div>

                      <button
                        onClick={() =>
                          handleCopyCommand(
                            `npx playwright test tests/reproduce-${selectedReport.id.slice(0, 8)}.spec.ts --headed`
                          )
                        }
                        style={{
                          background: '#0F172A',
                          border: '1px solid #475569',
                          color: '#94A3B8',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {copiedCmd ? <Check size={11} color="#10B981" /> : <Copy size={11} />}
                        <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <pre
                      style={{
                        background: '#0F172A',
                        color: '#E2E8F0',
                        padding: '1.25rem',
                        borderRadius: '10px',
                        overflowX: 'auto',
                        fontSize: '0.825rem',
                        lineHeight: 1.55,
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        fontFamily: 'monospace',
                      }}
                    >
                      <code>{selectedReport.playwright_script || '// No test script generated'}</code>
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                <Sparkles size={32} color="#DC2626" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
                  No Defect Report Selected
                </h3>
                <p style={{ fontSize: '0.885rem', color: '#64748B', maxWidth: '420px', margin: '0 auto' }}>
                  Enter a complaint note on the left or select a previous test from the archive below to view the Canonical Engineering Specification.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ==================================================================== */}
        {/* PAST TESTED REPORTS ARCHIVE (ACCORDION / SHELF)                      */}
        {/* ==================================================================== */}
        <section style={{ borderTop: '1px solid rgba(220, 38, 38, 0.1)', paddingTop: '2.5rem', marginTop: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} color="#DC2626" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                Tested Defect Reports Archive ({reports.length})
              </h3>
            </div>
            <button
              onClick={() => setShowHistoryShelf(!showHistoryShelf)}
              style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 700 }}
            >
              {showHistoryShelf ? 'Collapse Archive ▲' : 'Expand Archive ▼'}
            </button>
          </div>

          {showHistoryShelf && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {reports.map((r) => (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedReport(r);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="glass-card"
                  style={{
                    padding: '1.15rem',
                    cursor: 'pointer',
                    border: selectedReport?.id === r.id ? '2px solid #DC2626' : '1px solid rgba(17, 24, 39, 0.08)',
                    background: selectedReport?.id === r.id ? 'rgba(254, 242, 242, 0.95)' : '#FFFFFF',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.45rem' }}>
                    <span className={`badge-severity severity-${r.severity}`}>
                      {r.severity}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                      {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '0.925rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.35, marginBottom: '0.35rem' }}>
                    {r.title}
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: '#64748B', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {r.root_cause || r.actual}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Floating QA Copilot Chat Assistant */}
      <QACopilotChat
        activeReport={selectedReport}
        sessionId={selectedReport?.session_id || selectedSessionId}
      />

      {/* Export Modal */}
      {selectedReport && (
        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          report={selectedReport as any}
        />
      )}

      {/* Send Email Modal */}
      {selectedReport && (
        <SendEmailModal
          isOpen={sendEmailModalOpen}
          onClose={() => setSendEmailModalOpen(false)}
          report={selectedReport}
          onSentSuccess={(result) => {
            setSelectedReport((prev) => (prev ? { ...prev, status: 'sent' } : null));
            setActionMessage(`✓ Defect report successfully dispatched to ${result.recipients?.join(', ')}`);
          }}
        />
      )}
    </div>
  );
}
