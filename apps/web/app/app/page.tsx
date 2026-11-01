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

  // Progressive Disclosure Toggles
  const [showTelemetryDrawer, setShowTelemetryDrawer] = useState(false);
  const [showHistoryShelf, setShowHistoryShelf] = useState(false);

  // Reproduction probe state
  const [runningProbe, setRunningProbe] = useState(false);
  const [probeResult, setProbeResult] = useState<any | null>(null);

  // Export modal state
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false);
  const [deletingReport, setDeletingReport] = useState(false);
  const [activeReportTab, setActiveReportTab] = useState<'canonical' | 'overview' | 'timeline' | 'playwright'>('canonical');
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [copiedJira, setCopiedJira] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

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
        setShowTelemetryDrawer(false); // keep view focused on defect spec
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

  // Copy Jira Markdown
  function handleCopyJira() {
    if (!selectedReport) return;
    const text = `h1. ${selectedReport.title}

*Severity:* ${selectedReport.severity.toUpperCase()}
*Raw QA Note:* "${selectedReport.raw_note || selectedReport.title}"
*Environment:* ${selectedReport.device_tag || 'Chrome on Windows 11'} (${selectedReport.tester_name || 'QA'})

h2. Steps to Reproduce
${selectedReport.steps.map((s, i) => `# ${s}`).join('\n')}

*Expected Result:* ${selectedReport.expected}
*Actual Result:* ${selectedReport.actual}

h2. Root Cause Hypothesis
${selectedReport.root_cause}

h2. Technical Evidence
${selectedReport.evidence?.length || 0} telemetry events correlated.
`;
    navigator.clipboard.writeText(text);
    setCopiedJira(true);
    setTimeout(() => setCopiedJira(false), 2000);
  }

  // Active session object
  const activeSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0] || {
    id: selectedSessionId || 'active-live-session',
    host: 'localhost:3000 (Active Tab)',
    tester: currentUser?.name || 'Engineer #1',
    device: 'Station-01',
    started_at: new Date().toISOString(),
  };

  const quickPhraseChips = [
    '500 Server Error on click',
    'Cart button count jumps to 2',
    'Endless loading spinner',
    'Unresponsive button (dead click)',
    'Missing data after submit',
  ];

  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center', color: '#64748B' }}>
          <Activity size={32} className="animate-spin" color="#DC2626" style={{ margin: '0 auto 1rem' }} />
          <p style={{ fontWeight: 600 }}>Loading Silent QA Flight Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#030712', color: '#F8FAFC', paddingBottom: '5rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* 1. Ultra-Clean Global Navigation Bar */}
      <header
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(3, 7, 18, 0.85)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 10px #EF4444' }} />
            <span style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              Silent QA
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(16, 185, 129, 0.12)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              LIVE FLIGHT RECORDER
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.82rem' }}>
            <span style={{ color: '#94A3B8' }}>
              👤 <strong style={{ color: '#F1F5F9' }}>{currentUser?.name || 'QA Tester'}</strong>
            </span>
            <Link href="/admin" style={{ color: '#60A5FA', textDecoration: 'none', fontWeight: 600 }}>
              Admin Fleet ↗
            </Link>
            <button
              onClick={() => {
                fetch('/api/auth/signout', { method: 'POST' }).finally(() => {
                  window.location.href = '/login';
                });
              }}
              style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontWeight: 600 }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Container */}
      <main style={{ maxWidth: '1040px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        {/* Toast / Notification */}
        <AnimatePresence>
          {actionMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                marginBottom: '1.5rem',
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                background: actionMessage.startsWith('✓') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: actionMessage.startsWith('✓') ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                color: actionMessage.startsWith('✓') ? '#34D399' : '#F87171',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>{actionMessage}</span>
              <button onClick={() => setActionMessage(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ==================================================================== */}
        {/* STEP 1: DETECTED TEST FLIGHT SESSION BANNER                           */}
        {/* ==================================================================== */}
        <section
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '14px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.75rem',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Radio size={18} color="#38BDF8" className="animate-pulse" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  STEP 1: DETECTED TEST FLIGHT SESSION
                </span>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981' }} />
                <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700 }}>SILENTLY RECORDED</span>
              </div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', marginTop: '0.15rem' }}>
                {activeSession.host}
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.15rem' }}>
                Tester: <strong style={{ color: '#E2E8F0' }}>{activeSession.tester}</strong> ({activeSession.device}) • Recorded {new Date(activeSession.started_at).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              onClick={() => setShowSessionModal(!showSessionModal)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#E2E8F0',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span>Switch Flight Session</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </section>

        {/* Modal / Dropdown to Switch Session */}
        {showSessionModal && (
          <div
            style={{
              background: '#0B1222',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.75rem',
              boxShadow: '0 12px 35px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#93C5FD' }}>
                Select a Recorded Browser Flight Session:
              </span>
              <button onClick={() => setShowSessionModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
              {sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedSessionId(s.id);
                    setShowSessionModal(false);
                  }}
                  style={{
                    padding: '0.6rem 0.75rem',
                    borderRadius: '8px',
                    background: selectedSessionId === s.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: selectedSessionId === s.id ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.07)',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#F1F5F9' }}>{s.host}</div>
                  <div style={{ color: '#94A3B8', fontSize: '0.72rem', marginTop: '0.15rem' }}>
                    {s.tester} ({s.device}) • {new Date(s.started_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* STEP 2: WHAT WENT WRONG? (NATURAL HUMAN COMPLAINT NOTE)              */}
        {/* ==================================================================== */}
        <section
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '1.75rem',
            marginBottom: '2rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
          }}
        >
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#F43F5E', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              STEP 2: DESCRIBE WHAT FAILED (HUMAN NOTE)
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', marginTop: '0.2rem' }}>
              What went wrong during your test?
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '0.25rem' }}>
              Type your observation in plain English. Silent QA cross-references your note with intercepted API failures, JS crashes, and DOM mutations.
            </p>
          </div>

          {/* Quick Phrases */}
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            {quickPhraseChips.map((phrase) => (
              <button
                key={phrase}
                type="button"
                onClick={() => setTestNote(phrase)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#CBD5E1',
                  borderRadius: '9999px',
                  padding: '0.25rem 0.65rem',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                + {phrase}
              </button>
            ))}
          </div>

          {/* Large Clean Note Input */}
          <textarea
            value={testNote}
            onChange={(e) => setTestNote(e.target.value)}
            placeholder="e.g. Items are not added in the cart when clicking button, count stays at 0 and server gives error"
            rows={3}
            style={{
              width: '100%',
              background: '#040711',
              border: '1.5px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              color: '#FFFFFF',
              fontSize: '0.95rem',
              fontFamily: 'inherit',
              lineHeight: 1.5,
              outline: 'none',
              resize: 'vertical',
              marginBottom: '1rem',
            }}
          />

          {/* Telemetry Slice Selector & Options */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8' }}>Telemetry Window:</span>
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
                      padding: '0.22rem 0.55rem',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      border: timeWindowSeconds === win.value ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: timeWindowSeconds === win.value ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      color: timeWindowSeconds === win.value ? '#38BDF8' : '#94A3B8',
                      cursor: 'pointer',
                    }}
                  >
                    {win.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSelectorInput(!showSelectorInput)}
              style={{ background: 'none', border: 'none', color: '#60A5FA', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {showSelectorInput ? 'Hide Element Target Selector' : '+ Pin Target Element Selector (Optional)'}
            </button>
          </div>

          {showSelectorInput && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.3rem' }}>
                Element Selector:
              </label>
              <input
                type="text"
                value={pickedSelector}
                onChange={(e) => setPickedSelector(e.target.value)}
                placeholder="e.g. button#add-to-cart or [data-testid='checkout']"
                style={{
                  width: '100%',
                  background: '#040711',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '0.5rem 0.75rem',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace',
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* Primary Action Button */}
          <button
            onClick={handleEnhanceDefect}
            disabled={submitting || !testNote.trim()}
            style={{
              width: '100%',
              padding: '0.9rem 1.5rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 50%, #B91C1C 100%)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              fontSize: '1rem',
              fontWeight: 800,
              letterSpacing: '0.02em',
              cursor: submitting || !testNote.trim() ? 'not-allowed' : 'pointer',
              opacity: submitting || !testNote.trim() ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 20px rgba(220, 38, 38, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            <Sparkles size={18} />
            <span>{submitting ? 'Synthesizing Causal Defect Specification...' : '✨ Enhance Defect with Telemetry →'}</span>
          </button>
        </section>

        {/* ==================================================================== */}
        {/* STEP 3: ENHANCED CANONICAL SPECIFICATION CARD                        */}
        {/* ==================================================================== */}
        {selectedReport && (
          <section style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10B981', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  STEP 3: ENHANCED SPECIFICATION
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Canonical Defect Specification
                </h3>
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleRunProbe(selectedReport.id)}
                  disabled={runningProbe}
                  style={{
                    background: 'rgba(37, 99, 235, 0.15)',
                    border: '1px solid #3B82F6',
                    color: '#93C5FD',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: runningProbe ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Play size={13} color="#60A5FA" />
                  <span>{runningProbe ? 'Running Probe...' : '▶ Run Reproduction Probe'}</span>
                </button>

                <button
                  onClick={() => setExportModalOpen(true)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#E2E8F0',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Share2 size={13} />
                  <span>Export</span>
                </button>

                <button
                  onClick={() => setSendEmailModalOpen(true)}
                  style={{
                    background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#FFFFFF',
                    padding: '0.45rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                  }}
                >
                  <Send size={13} />
                  <span>Approve &amp; Send to Gmail</span>
                </button>

                <button
                  onClick={() => handleDeleteReport(selectedReport.id)}
                  disabled={deletingReport}
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#F87171',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: deletingReport ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Trash2 size={13} />
                  <span>{deletingReport ? 'Deleting...' : 'Delete Defect'}</span>
                </button>
              </div>
            </div>

            {/* Reproduction Probe Banner */}
            {probeResult && (
              <div
                style={{
                  background: probeResult.reproduced ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: probeResult.reproduced ? '1px solid #10B981' : '1px solid #EF4444',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: probeResult.reproduced ? '#34D399' : '#F87171' }}>
                  {probeResult.reproduced ? <CheckCircle size={16} /> : <AlertOctagon size={16} />}
                  <span>{probeResult.reproduced ? '✓ 100% Deterministic Reproduction Verified by In-Browser Probe' : 'Reproduction Probe Anomaly'}</span>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginLeft: 'auto' }}>
                    Latency: {probeResult.execution_time_ms}ms
                  </span>
                </div>
                <div style={{ color: '#CBD5E1', fontSize: '0.78rem', marginTop: '0.25rem' }}>
                  {probeResult.verdict || probeResult.output || 'Steps replayed against target endpoint matched expected crash fingerprint.'}
                </div>
              </div>
            )}

            {/* 4 Professional Navigation Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.65rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveReportTab('canonical')}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  border: activeReportTab === 'canonical' ? '1px solid #0284C7' : '1px solid transparent',
                  cursor: 'pointer',
                  background: activeReportTab === 'canonical' ? '#0284C7' : 'rgba(255, 255, 255, 0.04)',
                  color: activeReportTab === 'canonical' ? '#FFFFFF' : '#94A3B8',
                  boxShadow: activeReportTab === 'canonical' ? '0 0 14px rgba(2, 132, 199, 0.35)' : 'none',
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
                  background: activeReportTab === 'overview' ? '#DC2626' : 'rgba(255, 255, 255, 0.04)',
                  color: activeReportTab === 'overview' ? '#FFFFFF' : '#94A3B8',
                  boxShadow: activeReportTab === 'overview' ? '0 0 14px rgba(220, 38, 38, 0.35)' : 'none',
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
                  background: activeReportTab === 'timeline' ? '#059669' : 'rgba(255, 255, 255, 0.04)',
                  color: activeReportTab === 'timeline' ? '#FFFFFF' : '#94A3B8',
                  boxShadow: activeReportTab === 'timeline' ? '0 0 14px rgba(5, 150, 105, 0.35)' : 'none',
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
                  background: activeReportTab === 'playwright' ? '#7C3AED' : 'rgba(255, 255, 255, 0.04)',
                  color: activeReportTab === 'playwright' ? '#FFFFFF' : '#94A3B8',
                  boxShadow: activeReportTab === 'playwright' ? '0 0 14px rgba(124, 58, 237, 0.35)' : 'none',
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
              <div style={{ background: '#070B16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', padding: '1.75rem' }}>
                {/* Expected vs Actual */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{ padding: '1.25rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', borderLeft: '3px solid #10B981' }}>
                    <h4 style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', marginBottom: '0.45rem', letterSpacing: '0.06em' }}>
                      EXPECTED BEHAVIOR
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: '#F1F5F9', lineHeight: 1.5 }}>
                      {selectedReport.expected}
                    </p>
                  </div>

                  <div style={{ padding: '1.25rem', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '10px', borderLeft: '3px solid #EF4444' }}>
                    <h4 style={{ fontSize: '0.72rem', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', marginBottom: '0.45rem', letterSpacing: '0.06em' }}>
                      ACTUAL OBSERVED BEHAVIOR
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: '#F1F5F9', lineHeight: 1.5 }}>
                      {selectedReport.actual}
                    </p>
                  </div>
                </div>

                {/* AI Causal Hypothesis */}
                {selectedReport.root_cause && (
                  <div style={{ padding: '1.25rem', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '10px', borderLeft: '3px solid #F59E0B', marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.72rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', marginBottom: '0.45rem', letterSpacing: '0.06em' }}>
                      AI ROOT CAUSE HYPOTHESIS ({selectedReport.confidence || 'HIGH'} CONFIDENCE)
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: '#FDE68A', lineHeight: 1.5 }}>
                      {selectedReport.root_cause}
                    </p>
                  </div>
                )}

                {/* Interactive Steps to Reproduce */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>
                      Steps to Reproduce ({completedSteps.length}/{selectedReport.steps?.length || 0} Verified)
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                      Click steps to toggle verification status
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
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
                            background: isDone ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                            border: isDone ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              border: isDone ? 'none' : '1.5px solid #64748B',
                              background: isDone ? '#10B981' : 'transparent',
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
                              fontSize: '0.88rem',
                              color: isDone ? '#34D399' : '#CBD5E1',
                              textDecoration: isDone ? 'line-through' : 'none',
                              fontWeight: isDone ? 600 : 400,
                            }}
                          >
                            <strong style={{ color: '#60A5FA', marginRight: '0.35rem' }}>{idx + 1}.</strong>
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
              <div style={{ background: '#070B16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', padding: '1.25rem' }}>
                <EventTimeline events={selectedReport.evidence || []} />
              </div>
            )}

            {/* Tab 4: Playwright Script */}
            {activeReportTab === 'playwright' && (
              <div style={{ background: '#070B16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Terminal size={16} color="#EF4444" />
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                      Synthesized Playwright Reproduction Test
                    </h4>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={handleDownloadScript}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#E2E8F0',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
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
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#E2E8F0',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      {copiedScript ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
                      <span>{copiedScript ? 'Copied!' : 'Copy Script'}</span>
                    </button>
                  </div>
                </div>

                {/* Terminal CLI Snippet */}
                <div
                  style={{
                    background: '#040711',
                    border: '1px solid #1E293B',
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
                    <span style={{ color: '#EF4444', fontWeight: 800, fontSize: '0.8rem', userSelect: 'none' }}>$</span>
                    <code style={{ color: '#F1F5F9', fontSize: '0.78rem', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
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
                    background: '#020617',
                    color: '#E2E8F0',
                    padding: '1.25rem',
                    borderRadius: '10px',
                    overflowX: 'auto',
                    fontSize: '0.8rem',
                    lineHeight: 1.5,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    fontFamily: 'monospace',
                  }}
                >
                  <code>{selectedReport.playwright_script || '// No test script generated'}</code>
                </pre>
              </div>
            )}
          </section>
        )}

        {/* ==================================================================== */}
        {/* PAST TESTED REPORTS ARCHIVE (ACCORDION / SHELF)                      */}
        {/* ==================================================================== */}
        <section style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={16} color="#94A3B8" />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#E2E8F0' }}>
                Tested Defect Reports Archive ({reports.length})
              </h4>
            </div>
            <button
              onClick={() => setShowHistoryShelf(!showHistoryShelf)}
              style={{ background: 'none', border: 'none', color: '#60A5FA', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
            >
              {showHistoryShelf ? 'Collapse Archive ▲' : 'Expand Archive ▼'}
            </button>
          </div>

          {showHistoryShelf && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '0.85rem' }}>
              {reports.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedReport(r)}
                  style={{
                    background: selectedReport?.id === r.id ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    border: selectedReport?.id === r.id ? '1.5px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: r.severity === 'critical' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: r.severity === 'critical' ? '#F87171' : '#FBBF24',
                      }}
                    >
                      {r.severity}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
                      {new Date(r.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F1F5F9', lineHeight: 1.35, marginBottom: '0.25rem' }}>
                    {r.title}
                  </h5>
                  <p style={{ fontSize: '0.75rem', color: '#94A3B8', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {r.root_cause}
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

      {/* Send Email Modal with Recipient Input and Formatted HTML Preview */}
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
