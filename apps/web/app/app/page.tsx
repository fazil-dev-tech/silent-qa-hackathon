'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import EventTimeline from '@/components/event-timeline';
import ExportModal from '@/components/export-modal';
import SendEmailModal from '@/components/send-email-modal';
import CanonicalDefectCard from '@/components/canonical-defect-card';
import { supabaseBrowserClient } from '@/lib/supabase';
import QACopilotChat from '@/components/qa-copilot-chat';
import ExtensionInstallModal from '@/components/extension-install-modal';

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
  const [selectedSessionId, setSelectedSessionId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sqa_selected_session_id') || '';
    }
    return '';
  });
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
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
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

    // 1. Live Supabase Realtime WebSocket Subscription
    const channel = supabaseBrowserClient
      .channel('app_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchReports(false, true);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => {
        fetchReports(false, true);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, () => {
        fetchSessions();
      })
      .subscribe();

    // 2. Fallback periodic sync every 12s (silent background sync)
    const syncInterval = setInterval(() => {
      fetchReports(false, true);
      fetchSessions();
    }, 12000);

    return () => {
      clearInterval(syncInterval);
      supabaseBrowserClient.removeChannel(channel);
    };
  }, []);

  // 2. Fetch Sessions & Preserve User Selected Session
  async function fetchSessions() {
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        const list: SessionItem[] = data.sessions || [];
        setSessions(list);
        setSelectedSessionId((prev) => {
          // If currently selected session exists in latest list, keep it locked
          if (prev && list.some((s) => s.id === prev)) {
            return prev;
          }
          // If localStorage has a valid session from earlier, use that
          if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('sqa_selected_session_id');
            if (stored && list.some((s) => s.id === stored)) {
              return stored;
            }
          }
          // Otherwise default to the top active flight session
          return list.length > 0 ? list[0].id : '';
        });
      }
    } catch {}
  }

  // 3. Fetch Reports (Silent in background polling to avoid flicker)
  async function fetchReports(showToast = false, isBackground = false) {
    if (!isBackground) setLoading(true);
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
        if (showToast) {
          setActionMessage(`✓ Refreshed ${reportList.length} defect reports live from Supabase PostgreSQL`);
        }
      }
    } catch (err: any) {
      if (showToast) {
        setActionMessage(`Refresh notice: ${err?.message || 'Could not fetch reports'}`);
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  }

  // Manual Full Studio Refresh (both reports & flight recorder sessions)
  async function handleManualRefresh() {
    setLoading(true);
    try {
      await Promise.all([
        fetchReports(true, false),
        fetchSessions(),
      ]);
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

  // Dynamic Flight-Specific Scenario Presets: Dynamically bound to the selected flight recording session
  interface ScenarioPreset {
    id: string;
    label: string;
    note: string;
    selector?: string;
    severity?: string;
    category: 'flight_anomaly' | 'flight_reported' | 'flight_action' | 'edge_case';
    windowSeconds?: number;
    type?: string;
  }

  // Baseline fallback edge cases if a session has no telemetry recorded yet
  const baselineEdgeCases: ScenarioPreset[] = useMemo(() => [
    {
      id: 'cart-jump',
      label: '⚡ Cart button count jumps to 2',
      note: 'Cart button click fires two duplicate POST /api/cart requests within 7ms, incrementing badge count from 0 to 2.',
      selector: 'button.add-to-cart',
      severity: 'high',
      category: 'edge_case',
      windowSeconds: 60,
    },
    {
      id: '500-error',
      label: '🔥 500 Server Error on payment submit',
      note: 'Payment submit button click triggers 500 Internal Server Error on POST /api/checkout with unhandled TypeError.',
      selector: 'button#submit-payment',
      severity: 'critical',
      category: 'edge_case',
      windowSeconds: 180,
    },
    {
      id: 'dead-click',
      label: '⚠️ Unresponsive button (dead click)',
      note: 'Save Draft button registers 3 rapid clicks with zero DOM mutation or network response.',
      selector: 'button.btn-save-draft',
      severity: 'medium',
      category: 'edge_case',
      windowSeconds: 60,
    },
    {
      id: 'loading-spinner',
      label: '⏳ Endless loading spinner on checkout',
      note: 'Spinner state remains indefinitely active after network timeout without user-facing error toast.',
      selector: 'div.checkout-spinner',
      severity: 'medium',
      category: 'edge_case',
      windowSeconds: 180,
    },
    {
      id: 'state-reset',
      label: '🔄 State reset after modal close',
      note: 'Form fields unexpectedly clear when user toggles background overlay without explicit discard confirmation.',
      selector: 'div.modal-overlay',
      severity: 'low',
      category: 'edge_case',
      windowSeconds: 300,
    },
  ], []);

  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [sessionScenarios, setSessionScenarios] = useState<ScenarioPreset[]>(baselineEdgeCases);
  const [loadingScenarios, setLoadingScenarios] = useState<boolean>(false);
  const [sessionAnomaliesCount, setSessionAnomaliesCount] = useState<number>(0);
  const [scenarioFilter, setScenarioFilter] = useState<'all' | 'anomalies' | 'actions' | 'edge_case'>('all');

  // Dynamically load anomalies & telemetry events specifically for the chosen flight session
  useEffect(() => {
    if (!selectedSessionId) return;
    let isMounted = true;
    async function fetchFlightAnomalies() {
      setLoadingScenarios(true);
      try {
        const res = await fetch(`/api/sessions/${selectedSessionId}/anomalies`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            const fetched = data.scenarios && data.scenarios.length > 0 ? data.scenarios : baselineEdgeCases;
            setSessionScenarios(fetched);
            setSessionAnomaliesCount(data.anomalies_count || 0);
          }
        } else {
          if (isMounted) setSessionScenarios(baselineEdgeCases);
        }
      } catch {
        if (isMounted) setSessionScenarios(baselineEdgeCases);
      } finally {
        if (isMounted) setLoadingScenarios(false);
      }
    }
    fetchFlightAnomalies();
    return () => {
      isMounted = false;
    };
  }, [selectedSessionId, baselineEdgeCases]);

  const displayedScenarios = useMemo(() => {
    const list = sessionScenarios.length > 0 ? sessionScenarios : baselineEdgeCases;
    if (scenarioFilter === 'anomalies') {
      return list.filter((s) => s.category === 'flight_anomaly' || s.category === 'flight_reported');
    }
    if (scenarioFilter === 'actions') {
      return list.filter((s) => s.category === 'flight_action');
    }
    if (scenarioFilter === 'edge_case') {
      return list.filter((s) => s.category === 'edge_case');
    }
    return list;
  }, [sessionScenarios, baselineEdgeCases, scenarioFilter]);

  function handleSelectScenario(sc: ScenarioPreset) {
    if (selectedScenarioId === sc.id) {
      setSelectedScenarioId(null);
      setTestNote('');
      setPickedSelector('');
      setShowSelectorInput(false);
      setActionMessage(null);
      return;
    }

    setSelectedScenarioId(sc.id);
    setTestNote(sc.note);
    if (sc.selector) {
      setPickedSelector(sc.selector);
      setShowSelectorInput(true);
    }
    if (sc.windowSeconds) {
      setTimeWindowSeconds(sc.windowSeconds);
    }
    const cleanCategory = sc.category.replace('_', ' ').toUpperCase();
    setActionMessage(`✓ Bound ${cleanCategory} scenario to complaint note & target selector: "${sc.selector || 'Session Telemetry'}"`);
  }

  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07080A' }}>
        <div style={{ textAlign: 'center', color: '#94A3B8' }}>
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
        background: '#07080A',
        backgroundImage:
          'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(220, 38, 38, 0.15), rgba(7, 8, 10, 0.98))',
        color: '#F8FAFC',
        paddingBottom: '5rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Main Studio Workspace Container */}
      <main style={{ maxWidth: '1380px', margin: '0 auto', padding: 'clamp(1rem, 2.5vw, 2rem) clamp(0.75rem, 2vw, 1.5rem)' }}>
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
              <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.025em' }}>
                Tester Flight Workspace
              </h1>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#4ADE80',
                  background: 'rgba(22, 163, 74, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80' }} />
                <span>Live Telemetry Active</span>
              </span>
            </div>
            <p style={{ fontSize: '0.885rem', color: '#94A3B8' }}>
              Live browser telemetry streams, AI causal synthesis, in-browser Playwright reproduction probes, and Gmail delivery.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => handleManualRefresh()}
              disabled={loading}
              className="btn-secondary"
              style={{
                fontSize: '0.82rem',
                padding: '0.45rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Refreshing...' : 'Refresh Reports'}</span>
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
              background: actionMessage.startsWith('✓') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(220, 38, 38, 0.15)',
              border: `1px solid ${actionMessage.startsWith('✓') ? 'rgba(52, 211, 153, 0.35)' : 'rgba(248, 113, 113, 0.35)'}`,
              color: actionMessage.startsWith('✓') ? '#86EFAC' : '#FCA5A5',
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
        <div className="workspace-grid">
          {/* ================================================================ */}
          {/* LEFT COLUMN: FLIGHT RECORDER UPLINK & COMPLAINT INTAKE             */}
          {/* ================================================================ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Flight Recorder Uplink & Complaint Intake */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#F87171', fontWeight: 800, fontSize: '0.85rem' }}>
                  <Terminal size={16} />
                  <span>Flight Recorder Uplink</span>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, background: 'rgba(22, 163, 74, 0.15)', color: '#4ADE80', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                  EXTENSION READY
                </span>
              </div>

              <p style={{ fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.45, marginBottom: '0.75rem' }}>
                The Silent QA Flight Recorder extension automatically captures clicks, network failures, and DOM anomalies on your active tabs. You can also flag a specific observation below.
              </p>

              {/* Extension ZIP Download & Setup Trigger */}
              <div style={{ marginBottom: '1.15rem' }}>
                <button
                  type="button"
                  onClick={() => setExtensionModalOpen(true)}
                  style={{
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38BDF8',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    padding: '0.4rem 0.85rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(56, 189, 248, 0.18)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)';
                  }}
                >
                  <Download size={13} color="#38BDF8" />
                  <span>Download Extension (.ZIP) &amp; Setup</span>
                </button>
              </div>

              {/* Observed Defect / Complaint Note */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#E2E8F0', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                  Observed Defect / Complaint Note:
                </label>
                <textarea
                  value={testNote}
                  onChange={(e) => setTestNote(e.target.value)}
                  placeholder="e.g. Save Draft button not responding to multiple clicks / returns 500"
                  rows={3}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1.5px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    padding: '0.75rem 0.85rem',
                    color: '#F8FAFC',
                    fontSize: '0.885rem',
                    fontFamily: 'inherit',
                    lineHeight: 1.45,
                    outline: 'none',
                    resize: 'vertical',
                    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)',
                  }}
                />
              </div>

              {/* Dynamic Flight-Specific Scenario Presets */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#E2E8F0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Flight Telemetry Scenarios:
                    </span>
                    <span
                      title={`Flight session host: ${activeSession.host}`}
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        background: 'rgba(56, 189, 248, 0.12)',
                        color: '#38BDF8',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        maxWidth: '180px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {activeSession.host}
                    </span>
                    {loadingScenarios ? (
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(234, 179, 8, 0.15)', color: '#FBBF24', border: '1px solid rgba(234, 179, 8, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <RefreshCw size={10} className="animate-spin" />
                        SYNCING...
                      </span>
                    ) : sessionAnomaliesCount > 0 ? (
                      <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(220, 38, 38, 0.18)', color: '#F87171', border: '1px solid rgba(220, 38, 38, 0.35)' }}>
                        {sessionAnomaliesCount} ANOMALIES DETECTED
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ADE80', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                        NORMAL TELEMETRY
                      </span>
                    )}
                  </div>

                  {/* Filter tabs */}
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setScenarioFilter('all')}
                      style={{
                        background: scenarioFilter === 'all' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: scenarioFilter === 'all' ? '#F8FAFC' : '#94A3B8',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      All ({displayedScenarios.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setScenarioFilter('anomalies')}
                      style={{
                        background: scenarioFilter === 'anomalies' ? 'rgba(220, 38, 38, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                        border: scenarioFilter === 'anomalies' ? '1px solid #DC2626' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: scenarioFilter === 'anomalies' ? '#F87171' : '#94A3B8',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Anomalies ({sessionScenarios.filter((s) => s.category === 'flight_anomaly' || s.category === 'flight_reported').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setScenarioFilter('actions')}
                      style={{
                        background: scenarioFilter === 'actions' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                        border: scenarioFilter === 'actions' ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: scenarioFilter === 'actions' ? '#38BDF8' : '#94A3B8',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Actions ({sessionScenarios.filter((s) => s.category === 'flight_action').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setScenarioFilter('edge_case')}
                      style={{
                        background: scenarioFilter === 'edge_case' ? 'rgba(234, 179, 8, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                        border: scenarioFilter === 'edge_case' ? '1px solid #FBBF24' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: scenarioFilter === 'edge_case' ? '#FBBF24' : '#94A3B8',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Presets ({sessionScenarios.filter((s) => s.category === 'edge_case').length})
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', minHeight: '36px', alignItems: 'center' }}>
                  {loadingScenarios && displayedScenarios.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', fontSize: '0.75rem', color: '#94A3B8', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px' }}>
                      <RefreshCw size={13} className="animate-spin" color="#38BDF8" />
                      <span>Extracting anomalies &amp; events for flight {activeSession.host}...</span>
                    </div>
                  ) : displayedScenarios.length === 0 ? (
                    <div style={{ fontSize: '0.75rem', color: '#64748B', padding: '0.3rem 0.5rem' }}>
                      No scenarios matching active filter for this flight.
                    </div>
                  ) : (
                    displayedScenarios.map((sc) => {
                      const isSelected = selectedScenarioId === sc.id;
                      return (
                        <button
                          key={sc.id}
                          type="button"
                          className="flight-scenario-chip"
                          data-scenario-id={sc.id}
                          onClick={() => handleSelectScenario(sc)}
                          title={`Click to load: "${sc.note}" with selector ${sc.selector || 'none'}`}
                          style={{
                            background: isSelected ? 'rgba(220, 38, 38, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                            border: isSelected ? '1px solid #DC2626' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: isSelected ? '#F87171' : sc.category === 'flight_anomaly' ? '#FCA5A5' : '#E2E8F0',
                            boxShadow: isSelected ? '0 0 12px rgba(220, 38, 38, 0.35)' : 'none',
                            borderRadius: '9999px',
                            padding: '0.25rem 0.65rem',
                            fontSize: '0.72rem',
                            fontWeight: isSelected ? 800 : 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span style={{ fontWeight: 800 }}>{isSelected ? '✓' : '+'}</span>
                          <span>{sc.label}</span>
                          {sc.category === 'flight_anomaly' && (
                            <span style={{ fontSize: '0.56rem', fontWeight: 800, textTransform: 'uppercase', background: 'rgba(220, 38, 38, 0.25)', color: '#F87171', padding: '0.05rem 0.35rem', borderRadius: '3px' }}>
                              ANOMALY
                            </span>
                          )}
                          {sc.category === 'flight_action' && (
                            <span style={{ fontSize: '0.56rem', fontWeight: 800, textTransform: 'uppercase', background: 'rgba(56, 189, 248, 0.2)', color: '#38BDF8', padding: '0.05rem 0.35rem', borderRadius: '3px' }}>
                              ACTION
                            </span>
                          )}
                          {sc.category === 'flight_reported' && (
                            <span style={{ fontSize: '0.56rem', fontWeight: 800, textTransform: 'uppercase', background: 'rgba(34, 197, 94, 0.2)', color: '#4ADE80', padding: '0.05rem 0.35rem', borderRadius: '3px' }}>
                              REPORTED
                            </span>
                          )}
                          {sc.category === 'edge_case' && (
                            <span style={{ fontSize: '0.56rem', fontWeight: 800, textTransform: 'uppercase', background: 'rgba(234, 179, 8, 0.2)', color: '#FBBF24', padding: '0.05rem 0.35rem', borderRadius: '3px' }}>
                              PRESET
                            </span>
                          )}
                          {sc.selector && (
                            <span style={{ fontSize: '0.58rem', fontFamily: 'monospace', color: '#94A3B8', background: 'rgba(0, 0, 0, 0.35)', padding: '0.05rem 0.3rem', borderRadius: '3px' }}>
                              {sc.selector.length > 20 ? sc.selector.slice(0, 20) + '...' : sc.selector}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Target Element Selector Input */}
                <div style={{ marginTop: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowSelectorInput(!showSelectorInput)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: pickedSelector ? '#38BDF8' : '#94A3B8',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <span>🎯 Target Element (CSS Selector):</span>
                      <span style={{ fontSize: '0.65rem', color: pickedSelector ? '#38BDF8' : '#64748B' }}>
                        {pickedSelector ? `[${pickedSelector}]` : '(optional)'}
                      </span>
                    </button>
                    {pickedSelector && (
                      <button
                        type="button"
                        onClick={() => setPickedSelector('')}
                        style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '0.65rem', cursor: 'pointer' }}
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {showSelectorInput && (
                    <input
                      type="text"
                      value={pickedSelector}
                      onChange={(e) => setPickedSelector(e.target.value)}
                      placeholder="e.g. button#checkout-btn, div.cart-badge"
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: '6px',
                        padding: '0.4rem 0.65rem',
                        color: '#38BDF8',
                        fontSize: '0.78rem',
                        fontFamily: 'monospace',
                        outline: 'none',
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Recorded Session Selector */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#E2E8F0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Recorded Flight Session:
                  </label>
                  <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{sessions.length} active sessions</span>
                </div>

                <div
                  id="flight-session-trigger"
                  onClick={() => setShowSessionModal(!showSessionModal)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1.5px solid rgba(255, 255, 255, 0.12)',
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
                    <strong style={{ color: '#F8FAFC' }}>{activeSession.host}</strong>
                    <span style={{ color: '#94A3B8', marginLeft: '0.35rem' }}>({activeSession.tester})</span>
                  </div>
                  <ChevronDown size={14} color="#94A3B8" />
                </div>

                {/* Session Selector Drawer */}
                {showSessionModal && (
                  <div style={{ position: 'relative' }}>
                    {/* Invisible Backdrop to close on click outside */}
                    <div
                      onClick={() => setShowSessionModal(false)}
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 40,
                      }}
                    />
                    <div
                      id="flight-session-drawer"
                      style={{
                        position: 'relative',
                        zIndex: 50,
                        background: 'rgba(13, 16, 25, 0.98)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '0.5rem',
                        marginTop: '0.35rem',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                        maxHeight: '180px',
                        overflowY: 'auto',
                      }}
                    >
                      {sessions.map((s) => (
                        <div
                          key={s.id}
                          className="flight-session-option"
                          data-session-id={s.id}
                          data-host={s.host}
                          onClick={() => {
                            setSelectedSessionId(s.id);
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('sqa_selected_session_id', s.id);
                            }
                            setSelectedScenarioId(null);
                            setShowSessionModal(false);
                            setActionMessage(`✓ Switched to flight: ${s.host} (${new Date(s.started_at).toLocaleTimeString()})`);
                          }}
                          style={{
                            padding: '0.45rem 0.65rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: selectedSessionId === s.id ? 'rgba(220, 38, 38, 0.2)' : 'transparent',
                            color: selectedSessionId === s.id ? '#F87171' : '#E2E8F0',
                            fontSize: '0.78rem',
                            fontWeight: selectedSessionId === s.id ? 700 : 500,
                            marginBottom: '0.2rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700 }}>{s.host}</div>
                            <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{s.tester} • {new Date(s.started_at).toLocaleTimeString()}</div>
                          </div>
                          {selectedSessionId === s.id && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#F87171', background: 'rgba(220, 38, 38, 0.2)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                              ACTIVE
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Telemetry Slice Time Window */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
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
                        border: timeWindowSeconds === win.value ? '1px solid #DC2626' : '1px solid rgba(255, 255, 255, 0.12)',
                        background: timeWindowSeconds === win.value ? 'rgba(220, 38, 38, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        color: timeWindowSeconds === win.value ? '#F87171' : '#94A3B8',
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
              <div className="glass-panel" style={{ padding: 'clamp(0.85rem, 2vw, 1.35rem)' }}>
                {/* Header Strip with Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.65rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                      <span className={`badge-severity severity-${selectedReport.severity}`}>
                        {selectedReport.severity.toUpperCase()}
                      </span>

                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.55rem',
                          borderRadius: '9999px',
                          background: selectedReport.status === 'verified' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                          color: selectedReport.status === 'verified' ? '#4ADE80' : '#38BDF8',
                          border: `1px solid ${selectedReport.status === 'verified' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(56, 189, 248, 0.35)'}`,
                        }}
                      >
                        {selectedReport.status === 'verified' ? '✓ REPRODUCED & VERIFIED' : selectedReport.status.toUpperCase()}
                      </span>

                      {!selectedReport.ai_fallback && (
                        <span style={{ fontSize: '0.7rem', color: '#F87171', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Sparkles size={11} /> OpenRouter Nemotron-3
                        </span>
                      )}
                    </div>

                    <h2 style={{ fontSize: 'clamp(1.15rem, 2vw, 1.35rem)', fontWeight: 800, color: '#F8FAFC', lineHeight: 1.35 }}>
                      {selectedReport.title}
                    </h2>

                    <p style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                      Reported by: <strong style={{ color: '#F8FAFC' }}>{selectedReport.tester_name || 'Engineer #1'}</strong> • Station: <strong style={{ color: '#F8FAFC' }}>{selectedReport.device_tag || 'Station-01'}</strong> • Created: {new Date(selectedReport.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* The 4 Action Toolbar Buttons */}
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleRunProbe(selectedReport.id)}
                      disabled={runningProbe}
                      className="btn-secondary"
                      style={{ fontSize: '0.76rem', padding: '0.38rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Play size={12} color="#38BDF8" />
                      <span>{runningProbe ? 'Running Probe...' : '▶ Run Reproduction Probe'}</span>
                    </button>

                    <button
                      onClick={() => setExportModalOpen(true)}
                      className="btn-secondary"
                      style={{ fontSize: '0.76rem', padding: '0.38rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Share2 size={12} />
                      <span>Export</span>
                    </button>

                    <button
                      onClick={() => setSendEmailModalOpen(true)}
                      className="btn-primary"
                      style={{ fontSize: '0.76rem', padding: '0.38rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Send size={12} />
                      <span>Approve &amp; Send to Gmail</span>
                    </button>

                    <button
                      onClick={() => handleDeleteReport(selectedReport.id)}
                      disabled={deletingReport}
                      className="btn-secondary"
                      style={{
                        fontSize: '0.76rem',
                        padding: '0.38rem 0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        color: '#F87171',
                        borderColor: 'rgba(220, 38, 38, 0.35)',
                      }}
                    >
                      <Trash2 size={12} />
                      <span>{deletingReport ? 'Deleting...' : 'Delete'}</span>
                    </button>
                  </div>
                </div>

                {/* Reproduction Probe Banner */}
                {probeResult && (
                  <div
                    style={{
                      background: probeResult.reproduced ? 'rgba(16, 185, 129, 0.12)' : 'rgba(220, 38, 38, 0.12)',
                      border: `1px solid ${probeResult.reproduced ? 'rgba(52, 211, 153, 0.35)' : 'rgba(248, 113, 113, 0.35)'}`,
                      borderRadius: '8px',
                      padding: '0.65rem 0.95rem',
                      marginBottom: '1rem',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800, color: probeResult.reproduced ? '#86EFAC' : '#FCA5A5' }}>
                      {probeResult.reproduced ? <CheckCircle2 size={14} color="#34D399" /> : <AlertOctagon size={14} color="#F87171" />}
                      <span>{probeResult.reproduced ? '✓ 100% Deterministic Reproduction Verified by In-Browser Probe' : 'Reproduction Probe Anomaly'}</span>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginLeft: 'auto' }}>
                        Latency: {probeResult.execution_time_ms}ms
                      </span>
                    </div>
                    <div style={{ color: probeResult.reproduced ? '#BBF7D0' : '#FECACA', fontSize: '0.74rem', marginTop: '0.2rem' }}>
                      {probeResult.verdict || probeResult.output || 'Steps replayed against target endpoint matched expected crash fingerprint.'}
                    </div>
                  </div>
                )}

                {/* 4 Clean Navigation Tabs */}
                <div
                  style={{
                    display: 'flex',
                    gap: '0.35rem',
                    marginBottom: '1rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingBottom: '0.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    onClick={() => setActiveReportTab('canonical')}
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      border: activeReportTab === 'canonical' ? '1px solid #0284C7' : '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                      background: activeReportTab === 'canonical' ? '#0284C7' : 'rgba(255, 255, 255, 0.05)',
                      color: activeReportTab === 'canonical' ? '#FFFFFF' : '#94A3B8',
                      boxShadow: activeReportTab === 'canonical' ? '0 4px 14px rgba(2, 132, 199, 0.4)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Sparkles size={12} />
                    <span>⚡ Canonical Spec Card</span>
                  </button>

                  <button
                    onClick={() => setActiveReportTab('overview')}
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      border: activeReportTab === 'overview' ? '1px solid #DC2626' : '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                      background: activeReportTab === 'overview' ? '#DC2626' : 'rgba(255, 255, 255, 0.05)',
                      color: activeReportTab === 'overview' ? '#FFFFFF' : '#94A3B8',
                      boxShadow: activeReportTab === 'overview' ? '0 4px 14px rgba(220, 38, 38, 0.4)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Overview &amp; Findings
                  </button>

                  <button
                    onClick={() => setActiveReportTab('timeline')}
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      border: activeReportTab === 'timeline' ? '1px solid #059669' : '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                      background: activeReportTab === 'timeline' ? '#059669' : 'rgba(255, 255, 255, 0.05)',
                      color: activeReportTab === 'timeline' ? '#FFFFFF' : '#94A3B8',
                      boxShadow: activeReportTab === 'timeline' ? '0 4px 14px rgba(5, 150, 105, 0.4)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Interactive Event Timeline ({Array.isArray(selectedReport.evidence) ? selectedReport.evidence.length : 0})
                  </button>

                  <button
                    onClick={() => setActiveReportTab('playwright')}
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      border: activeReportTab === 'playwright' ? '1px solid #7C3AED' : '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                      background: activeReportTab === 'playwright' ? '#7C3AED' : 'rgba(255, 255, 255, 0.05)',
                      color: activeReportTab === 'playwright' ? '#FFFFFF' : '#94A3B8',
                      boxShadow: activeReportTab === 'playwright' ? '0 4px 14px rgba(124, 58, 237, 0.4)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Terminal size={12} />
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
                      <div style={{ padding: '1.25rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.25)', borderLeft: '4px solid #10B981' }}>
                        <h4 style={{ fontSize: '0.72rem', fontWeight: 800, color: '#34D399', textTransform: 'uppercase', marginBottom: '0.45rem', letterSpacing: '0.06em' }}>
                          EXPECTED BEHAVIOR
                        </h4>
                        <p style={{ fontSize: '0.925rem', color: '#E2E8F0', lineHeight: 1.5 }}>
                          {selectedReport.expected}
                        </p>
                      </div>

                      <div style={{ padding: '1.25rem', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.25)', borderLeft: '4px solid #EF4444' }}>
                        <h4 style={{ fontSize: '0.72rem', fontWeight: 800, color: '#F87171', textTransform: 'uppercase', marginBottom: '0.45rem', letterSpacing: '0.06em' }}>
                          ACTUAL OBSERVED BEHAVIOR
                        </h4>
                        <p style={{ fontSize: '0.925rem', color: '#E2E8F0', lineHeight: 1.5 }}>
                          {selectedReport.actual}
                        </p>
                      </div>
                    </div>

                    {/* AI Causal Hypothesis */}
                    {selectedReport.root_cause && (
                      <div style={{ padding: '1.25rem', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.25)', borderLeft: '4px solid #F59E0B', marginBottom: '1.5rem' }}>
                        <h4 style={{ fontSize: '0.72rem', fontWeight: 800, color: '#FBBF24', textTransform: 'uppercase', marginBottom: '0.45rem', letterSpacing: '0.06em' }}>
                          AI ROOT CAUSE HYPOTHESIS ({selectedReport.confidence || 'HIGH'} CONFIDENCE)
                        </h4>
                        <p style={{ fontSize: '0.925rem', color: '#E2E8F0', lineHeight: 1.5 }}>
                          {selectedReport.root_cause}
                        </p>
                      </div>
                    )}

                    {/* Interactive Steps to Reproduce */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
                          Steps to Reproduce ({completedSteps.length}/{selectedReport.steps?.length || 0} Verified)
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
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
                                background: isDone ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                                border: isDone ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <div
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '50%',
                                  border: isDone ? 'none' : '2px solid rgba(255, 255, 255, 0.25)',
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
                                  fontSize: '0.9rem',
                                  color: isDone ? '#86EFAC' : '#E2E8F0',
                                  textDecoration: isDone ? 'line-through' : 'none',
                                  fontWeight: isDone ? 600 : 500,
                                }}
                              >
                                <strong style={{ color: '#38BDF8', marginRight: '0.35rem' }}>{idx + 1}.</strong>
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
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F8FAFC', marginBottom: '0.5rem' }}>
                  No Defect Report Selected
                </h3>
                <p style={{ fontSize: '0.885rem', color: '#94A3B8', maxWidth: '420px', margin: '0 auto' }}>
                  Enter a complaint note on the left or select a previous test from the archive below to view the Canonical Engineering Specification.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ==================================================================== */}
        {/* PAST TESTED REPORTS ARCHIVE (ACCORDION / SHELF)                      */}
        {/* ==================================================================== */}
        <section style={{ borderTop: '1px solid rgba(220, 38, 38, 0.15)', paddingTop: '2.5rem', marginTop: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} color="#DC2626" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F8FAFC' }}>
                Tested Defect Reports Archive ({reports.length})
              </h3>
            </div>
            <button
              onClick={() => setShowHistoryShelf(!showHistoryShelf)}
              style={{ background: 'none', border: 'none', color: '#F87171', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 700 }}
            >
              {showHistoryShelf ? 'Collapse Archive ▲' : 'Expand Archive ▼'}
            </button>
          </div>

          {showHistoryShelf && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '1rem' }}>
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
                    border: selectedReport?.id === r.id ? '2px solid #DC2626' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: selectedReport?.id === r.id ? 'rgba(220, 38, 38, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.45rem' }}>
                    <span className={`badge-severity severity-${r.severity}`}>
                      {r.severity}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                      {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '0.925rem', fontWeight: 800, color: '#F8FAFC', lineHeight: 1.35, marginBottom: '0.35rem' }}>
                    {r.title}
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: '#94A3B8', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
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

      {/* Extension Install & Setup Guide Modal */}
      <ExtensionInstallModal
        isOpen={extensionModalOpen}
        onClose={() => setExtensionModalOpen(false)}
      />
    </div>
  );
}
