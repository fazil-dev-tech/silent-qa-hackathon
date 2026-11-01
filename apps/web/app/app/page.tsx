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
} from 'lucide-react';
import LiveTelemetryFeed from '@/components/live-telemetry-feed';
import EventTimeline from '@/components/event-timeline';
import ExportModal from '@/components/export-modal';

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
  playwright_script?: string;
  status: string;
  ai_fallback: boolean;
  created_at: string;
}

const PRESET_SCENARIOS = [
  {
    id: 'cart-race',
    label: 'Cart Race Condition',
    note: 'problem in cart button, count jumps to 2',
    selector: 'button#add-to-cart',
    getEvents: (sessionId: string, baseTs: number, selector: string) => [
      {
        id: crypto.randomUUID(),
        session_id: sessionId,
        ts: baseTs - 50,
        type: 'click',
        severity: 'info',
        selector,
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
        selector,
      },
    ],
  },
  {
    id: 'checkout-500',
    label: 'Checkout 500 Crash',
    note: 'clicked checkout and screen froze with unhandled server error',
    selector: 'button#submit-order',
    getEvents: (sessionId: string, baseTs: number, selector: string) => [
      {
        id: crypto.randomUUID(),
        session_id: sessionId,
        ts: baseTs - 80,
        type: 'click',
        severity: 'info',
        selector,
        text: 'Complete Order',
      },
      {
        id: crypto.randomUUID(),
        session_id: sessionId,
        ts: baseTs - 60,
        type: 'network',
        severity: 'error',
        url: '/api/checkout/process',
        method: 'POST',
        status: 500,
        shape: { error: 'string', code: 'number' },
      },
      {
        id: crypto.randomUUID(),
        session_id: sessionId,
        ts: baseTs - 20,
        type: 'console',
        severity: 'error',
        text: 'Unhandled Server Error: 500 Internal Server Error at /api/checkout/process',
      },
      {
        id: crypto.randomUUID(),
        session_id: sessionId,
        ts: baseTs - 5,
        type: 'signal',
        severity: 'error',
        text: 'critical_api_failure: /api/checkout/process returned 500 without error boundary',
        selector,
      },
    ],
  },
  {
    id: 'auth-rage',
    label: 'Expired Token Rage Click',
    note: 'save profile button does nothing when clicked repeatedly',
    selector: 'button.save-settings-btn',
    getEvents: (sessionId: string, baseTs: number, selector: string) => [
      {
        id: crypto.randomUUID(),
        session_id: sessionId,
        ts: baseTs - 120,
        type: 'click',
        severity: 'info',
        selector,
        text: 'Save Changes',
      },
      {
        id: crypto.randomUUID(),
        session_id: sessionId,
        ts: baseTs - 90,
        type: 'click',
        severity: 'info',
        selector,
        text: 'Save Changes',
      },
      {
        id: crypto.randomUUID(),
        session_id: sessionId,
        ts: baseTs - 60,
        type: 'click',
        severity: 'info',
        selector,
        text: 'Save Changes',
      },
      {
        id: crypto.randomUUID(),
        session_id: sessionId,
        ts: baseTs - 40,
        type: 'network',
        severity: 'error',
        url: '/api/profile/update',
        method: 'PUT',
        status: 401,
        shape: { message: 'string' },
      },
      {
        id: crypto.randomUUID(),
        session_id: sessionId,
        ts: baseTs - 10,
        type: 'signal',
        severity: 'warn',
        text: 'rage_click: 3 rapid clicks detected on button.save-settings-btn within 120ms',
        selector,
      },
    ],
  },
];

export default function TesterWorkspacePage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [testNote, setTestNote] = useState('problem in cart button, count jumps to 2');
  const [pickedSelector, setPickedSelector] = useState('button#add-to-cart');
  const [selectedScenario, setSelectedScenario] = useState<string>('cart-race');
  const [submitting, setSubmitting] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  function handleSelectPreset(presetId: string) {
    setSelectedScenario(presetId);
    const found = PRESET_SCENARIOS.find((p) => p.id === presetId);
    if (found) {
      setTestNote(found.note);
      setPickedSelector(found.selector);
    }
  }

  // Reproduction probe state
  const [runningProbe, setRunningProbe] = useState(false);
  const [probeResult, setProbeResult] = useState<any | null>(null);

  // Export modal state
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Active view tab in review editor
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'playwright'>('overview');

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  function handleDownloadScript(report: ReportItem) {
    if (!report.playwright_script) return;
    const blob = new Blob([report.playwright_script], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reproduce-${report.id.slice(0, 8)}.spec.ts`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleCopyScript(script: string) {
    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  }

  function handleCopyCommand(cmd: string) {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  }

  const filteredReports = reports.filter((r) => {
    const matchesQuery =
      searchQuery === '' ||
      r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.root_cause?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || r.severity === severityFilter;
    return matchesQuery && matchesSeverity;
  });

  // Load real reports directly from Supabase API
  async function fetchReports() {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/recent');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
        if (data.reports?.length > 0 && !selectedReport) {
          setSelectedReport(data.reports[0]);
        }
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReports();
  }, []);

  // Submit live complaint through full production pipeline (Ingest -> Map -> LLM -> Report)
  async function handleSimulateAndFlag() {
    setSubmitting(true);
    setActionMessage(null);
    setProbeResult(null);

    try {
      const sessionId = crypto.randomUUID();
      const baseTs = Date.now();

      // Step A: Ingest real telemetry batch into Supabase
      const activePreset = PRESET_SCENARIOS.find((p) => p.id === selectedScenario);
      const eventsBatch = activePreset
        ? activePreset.getEvents(sessionId, baseTs, pickedSelector)
        : PRESET_SCENARIOS[0].getEvents(sessionId, baseTs, pickedSelector);

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

      // Step B: Submit complaint & trigger AI causal mapper
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

  // Run in-browser automated reproduction probe
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
      setProbeResult({ error: err?.message, reproduced: false });
    } finally {
      setRunningProbe(false);
    }
  }

  // Approve and dispatch HTML email via Gmail SMTP
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

  // Delete report permanently
  async function handleDeleteReport(reportId: string) {
    if (!confirm('Permanently delete this defect report from Supabase?')) return;
    try {
      const res = await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
      if (res.ok) {
        setActionMessage('✓ Report deleted from database.');
        setReports((prev) => prev.filter((r) => r.id !== reportId));
        if (selectedReport?.id === reportId) {
          const remaining = reports.filter((r) => r.id !== reportId);
          setSelectedReport(remaining.length > 0 ? remaining[0] : null);
        }
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
    } catch (err: any) {
      setActionMessage(`Delete Error: ${err?.message}`);
    }
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Workspace Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.025em' }}>
            Tester Flight Workspace
          </h1>
          <p style={{ color: '#4B5563', fontSize: '0.9rem' }}>
            Live browser telemetry streams, AI causal synthesis, in-browser Playwright reproduction probes, and Gmail delivery.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={fetchReports}
            className="btn-secondary"
            disabled={loading}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh Reports'}</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
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
        </motion.div>
      )}

      {/* Main Grid: Left Stream & Right Review Workspace */}
      <div className="workspace-grid">
        {/* Left Column: Live Stream & Simulator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Live Telemetry Stream Widget */}
          <LiveTelemetryFeed />

          {/* 1-Click Telemetry & Flag Simulator */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <Sparkles size={16} color="#DC2626" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111827' }}>
                1-Click Flight & Flag Simulator
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '1rem' }}>
              Simulates live in-browser telemetry and triggers the OpenRouter causal synthesis engine.
            </p>

            {/* Scenario Preset Selector */}
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Scenario Preset:
              </label>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {PRESET_SCENARIOS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    type="button"
                    style={{
                      padding: '0.25rem 0.55rem',
                      borderRadius: '6px',
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      border: selectedScenario === preset.id ? '1px solid #DC2626' : '1px solid rgba(17, 24, 39, 0.1)',
                      background: selectedScenario === preset.id ? '#FFF1F2' : '#ffffff',
                      color: selectedScenario === preset.id ? '#DC2626' : '#4B5563',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#4B5563', marginBottom: '0.25rem' }}>
                Complaint Note:
              </label>
              <textarea
                value={testNote}
                onChange={(e) => setTestNote(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.55rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(17, 24, 39, 0.12)',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#4B5563', marginBottom: '0.25rem' }}>
                Element Selector:
              </label>
              <input
                type="text"
                value={pickedSelector}
                onChange={(e) => setPickedSelector(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem',
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
              style={{ width: '100%', padding: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >
              <Terminal size={14} />
              <span>{submitting ? 'Synthesizing Report...' : 'Simulate & Flag Bug →'}</span>
            </button>
          </div>

          {/* Database Reports List */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111827' }}>
                Database Reports ({filteredReports.length}/{reports.length})
              </h3>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '0.65rem' }}>
              <Search size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                type="text"
                placeholder="Search reports by title or root cause..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem 0.45rem 1.85rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(17, 24, 39, 0.12)',
                  fontSize: '0.785rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>

            {/* Severity Filter Pills */}
            <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    border: severityFilter === sev ? '1px solid #DC2626' : '1px solid rgba(17, 24, 39, 0.1)',
                    background: severityFilter === sev ? '#FFF1F2' : '#ffffff',
                    color: severityFilter === sev ? '#DC2626' : '#4B5563',
                    cursor: 'pointer',
                  }}
                >
                  {sev}
                </button>
              ))}
            </div>

            {reports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#9CA3AF', fontSize: '0.85rem' }}>
                No reports found yet. Click the button above to synthesize a live report!
              </div>
            ) : filteredReports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.25rem', color: '#9CA3AF', fontSize: '0.825rem' }}>
                No reports match your filters.
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSeverityFilter('all');
                  }}
                  style={{ display: 'block', margin: '0.5rem auto 0', color: '#DC2626', background: 'none', border: 'none', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '380px', overflowY: 'auto' }}>
                {filteredReports.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => {
                      setSelectedReport(r);
                      setProbeResult(null);
                    }}
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
                      <span style={{ fontSize: '0.75rem', color: r.status === 'verified' ? '#16A34A' : '#6B7280', fontWeight: 700 }}>
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
              {/* Header Bar */}
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
                        background:
                          selectedReport.status === 'verified'
                            ? '#DCFCE7'
                            : selectedReport.status === 'sent'
                            ? '#EFF6FF'
                            : '#FEF3C7',
                        color:
                          selectedReport.status === 'verified'
                            ? '#166534'
                            : selectedReport.status === 'sent'
                            ? '#1D4ED8'
                            : '#B45309',
                      }}
                    >
                      {selectedReport.status === 'verified' ? '✓ REPRODUCED & VERIFIED' : selectedReport.status.toUpperCase()}
                    </span>
                    {!selectedReport.ai_fallback && (
                      <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 700 }}>
                        ★ OpenRouter Nemotron-3
                      </span>
                    )}
                  </div>
                  <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#111827' }}>
                    {selectedReport.title}
                  </h2>
                </div>

                {/* Actions Toolbar */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleRunProbe(selectedReport.id)}
                    disabled={runningProbe}
                    className="btn-secondary"
                    style={{ fontSize: '0.825rem', padding: '0.55rem 0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Play size={13} color="#2563EB" />
                    <span>{runningProbe ? 'Running Probe...' : '▶ Run Reproduction Probe'}</span>
                  </button>

                  <button
                    onClick={() => setExportModalOpen(true)}
                    className="btn-secondary"
                    style={{ fontSize: '0.825rem', padding: '0.55rem 0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Share2 size={13} />
                    <span>Export</span>
                  </button>

                  <button
                    onClick={() => handleApproveAndSend(selectedReport.id)}
                    disabled={sendingEmail}
                    className="btn-primary"
                    style={{ fontSize: '0.825rem', padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Send size={13} />
                    <span>{sendingEmail ? 'Delivering...' : 'Approve & Send to Gmail'}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteReport(selectedReport.id)}
                    className="btn-secondary"
                    title="Delete report from database"
                    style={{
                      fontSize: '0.825rem',
                      padding: '0.55rem 0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      color: '#DC2626',
                      borderColor: 'rgba(220, 38, 38, 0.25)',
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {/* Reproduction Probe Verdict Output */}
              {probeResult && (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '10px',
                    marginBottom: '1.5rem',
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
                      Reproduction Verdict: {probeResult.reproduced ? 'REPRODUCED & CONFIRMED' : 'PROBE EXECUTED'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#6B7280', marginLeft: 'auto' }}>
                      Probe latency: {probeResult.execution_time_ms}ms
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: probeResult.reproduced ? '#14532D' : '#7F1D1D', marginBottom: '0.5rem' }}>
                    {probeResult.verdict}
                  </p>
                  {probeResult.logs && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontFamily: 'monospace', fontSize: '0.725rem', color: '#374151' }}>
                      {probeResult.logs.map((l: any, i: number) => (
                        <div key={i}>• {l.message}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* View Selector Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(17, 24, 39, 0.08)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
                <button
                  onClick={() => setActiveTab('overview')}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: activeTab === 'overview' ? '#DC2626' : 'transparent',
                    color: activeTab === 'overview' ? '#ffffff' : '#4B5563',
                  }}
                >
                  Overview & Findings
                </button>

                <button
                  onClick={() => setActiveTab('timeline')}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: activeTab === 'timeline' ? '#DC2626' : 'transparent',
                    color: activeTab === 'timeline' ? '#ffffff' : '#4B5563',
                  }}
                >
                  Interactive Event Timeline ({Array.isArray(selectedReport.evidence) ? selectedReport.evidence.length : 0})
                </button>

                <button
                  onClick={() => setActiveTab('playwright')}
                  style={{
                    padding: '0.45rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: activeTab === 'playwright' ? '#DC2626' : 'transparent',
                    color: activeTab === 'playwright' ? '#ffffff' : '#4B5563',
                  }}
                >
                  🎭 Playwright Script
                </button>
              </div>

              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div>
                  {/* Expected vs Actual */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
                      <h4 style={{ fontSize: '0.775rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        Expected Behavior
                      </h4>
                      <p style={{ fontSize: '0.9rem', color: '#14532D', lineHeight: 1.5 }}>{selectedReport.expected}</p>
                    </div>

                    <div style={{ padding: '1rem', background: '#FEF2F2', borderRadius: '10px', border: '1px solid #FECACA' }}>
                      <h4 style={{ fontSize: '0.775rem', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        Actual Behavior
                      </h4>
                      <p style={{ fontSize: '0.9rem', color: '#7F1D1D', lineHeight: 1.5 }}>{selectedReport.actual}</p>
                    </div>
                  </div>

                  {/* Root Cause Hypothesis */}
                  {selectedReport.root_cause && (
                    <div style={{ padding: '1rem', background: '#FFFBEB', borderRadius: '10px', border: '1px solid #FDE68A', marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.775rem', fontWeight: 700, color: '#92400E', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        AI Root Cause Hypothesis
                      </h4>
                      <p style={{ fontSize: '0.9rem', color: '#78350F', lineHeight: 1.5 }}>{selectedReport.root_cause}</p>
                    </div>
                  )}

                  {/* Reproduction Steps */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>
                      Verified Steps to Reproduce:
                    </h4>
                    <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.9rem', color: '#374151' }}>
                      {selectedReport.steps?.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}

              {/* Tab 2: Interactive Timeline */}
              {activeTab === 'timeline' && (
                <div>
                  <EventTimeline events={selectedReport.evidence || []} />
                </div>
              )}

              {/* Tab 3: Playwright Script */}
              {activeTab === 'playwright' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Terminal size={16} color="#DC2626" />
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111827' }}>
                        Synthesized Playwright Reproduction Test
                      </h4>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={() => handleDownloadScript(selectedReport)}
                        className="btn-secondary"
                        style={{ fontSize: '0.785rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Download size={13} />
                        <span>Download (.spec.ts)</span>
                      </button>

                      <button
                        onClick={() => handleCopyScript(selectedReport.playwright_script || '')}
                        className="btn-secondary"
                        style={{ fontSize: '0.785rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        {copiedScript ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                        <span>{copiedScript ? 'Copied!' : 'Copy Script'}</span>
                      </button>

                      <Link
                        href={`/app/report/${selectedReport.id}`}
                        className="btn-secondary"
                        style={{ fontSize: '0.785rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#DC2626' }}
                      >
                        <ExternalLink size={13} />
                        <span>Permalink</span>
                      </Link>
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
                      borderRadius: '10px',
                      overflowX: 'auto',
                      fontSize: '0.85rem',
                      lineHeight: 1.5,
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <code>{selectedReport.playwright_script || '// No Playwright script generated'}</code>
                  </pre>
                </div>
              )}
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
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem' }}>
                Select a Defect Report to Review
              </h3>
              <p style={{ maxWidth: '450px', fontSize: '0.9rem' }}>
                Choose a report from the database history on the left, or use the 1-Click Simulator to synthesize a new defect report right now.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        report={selectedReport}
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />
    </div>
  );
}
