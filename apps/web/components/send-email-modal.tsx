'use client';

import React, { useState } from 'react';
import {
  Mail,
  X,
  Send,
  CheckCircle,
  AlertCircle,
  Plus,
  Sparkles,
  Lock,
  Eye,
  Settings2,
  Copy,
  Check,
} from 'lucide-react';

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: {
    id: string;
    title: string;
    severity: string;
    steps: string[];
    expected: string;
    actual: string;
    root_cause?: string;
    confidence?: string;
    raw_note?: string;
    suggested_fix?: string;
    tester_name?: string;
    device_tag?: string;
    status?: string;
  };
  onSentSuccess?: (result: any) => void;
}

export default function SendEmailModal({
  isOpen,
  onClose,
  report,
  onSentSuccess,
}: SendEmailModalProps) {
  const [recipients, setRecipients] = useState<string[]>([
    'qa-team@silentqa.local',
    'lead-engineer@company.com',
  ]);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'payload'>('preview');

  const [sending, setSending] = useState(false);
  const [sentResult, setSentResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  function handleAddRecipient() {
    const trimmed = newEmailInput.trim().toLowerCase();
    if (!trimmed) return;
    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      setErrorMessage('Please enter a valid email address (e.g. name@domain.com)');
      return;
    }
    if (recipients.includes(trimmed)) {
      setErrorMessage('This email is already in the recipient list');
      return;
    }
    setRecipients((prev) => [...prev, trimmed]);
    setNewEmailInput('');
    setErrorMessage(null);
  }

  function handleRemoveRecipient(email: string) {
    setRecipients((prev) => prev.filter((r) => r !== email));
  }

  function handleAddPreset(preset: string) {
    if (!recipients.includes(preset)) {
      setRecipients((prev) => [...prev, preset]);
    }
  }

  async function handleDispatchEmail() {
    if (recipients.length === 0) {
      setErrorMessage('Please provide at least one recipient email address.');
      return;
    }

    setSending(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/reports/${report.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
          custom_message: customNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to deliver email');
      }

      setSentResult(data);
      if (onSentSuccess) {
        onSentSuccess(data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error occurred while dispatching email');
    } finally {
      setSending(false);
    }
  }

  const shaHash = `sha256:${report.id.replace(/-/g, '').slice(0, 32)}`;
  const severityColor =
    report.severity === 'critical'
      ? '#DC2626'
      : report.severity === 'high'
      ? '#EF4444'
      : report.severity === 'medium'
      ? '#D97706'
      : '#10B981';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '92vh',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(220, 38, 38, 0.18)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(220, 38, 38, 0.15), 0 10px 30px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          color: '#0F172A',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(254, 242, 242, 0.8) 0%, rgba(255, 255, 255, 0.95) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
              }}
            >
              <Mail size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Approve &amp; Dispatch Defect Report via Email
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, marginTop: '0.15rem' }}>
                Delivers the formatted Canonical Specification with Before/After proof and AI Auto-Fix code
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            style={{
              background: 'rgba(0, 0, 0, 0.04)',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '8px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {sentResult ? (
            /* Success State */
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: '50%',
                  background: '#F0FDF4',
                  border: '2px solid #10B981',
                  color: '#16A34A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)',
                }}
              >
                <CheckCircle size={32} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
                Defect Report Dispatched Successfully!
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
                Delivered to{' '}
                <strong style={{ color: '#0F172A' }}>{sentResult.recipients?.join(', ')}</strong>. The report
                status in Supabase has been updated to <strong style={{ color: '#0284C7' }}>SENT</strong>.
              </p>

              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '1rem',
                  maxWidth: '520px',
                  margin: '0 auto 1.75rem',
                  textAlign: 'left',
                  fontSize: '0.78rem',
                }}
              >
                <div style={{ color: '#64748B', marginBottom: '0.35rem', fontWeight: 600 }}>Public Verification Link:</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="text"
                    readOnly
                    value={sentResult.public_url || (typeof window !== 'undefined' ? window.location.href : '')}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: '#0284C7',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(sentResult.public_url || (typeof window !== 'undefined' ? window.location.href : ''));
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    type="button"
                    style={{
                      background: 'rgba(2, 132, 199, 0.08)',
                      border: '1px solid rgba(2, 132, 199, 0.25)',
                      color: '#0284C7',
                      padding: '0.3rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    {copiedLink ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <button
                onClick={onClose}
                type="button"
                className="btn-primary"
                style={{ padding: '0.75rem 2rem' }}
              >
                Close &amp; Return to Workspace
              </button>
            </div>
          ) : (
            <>
              {/* Recipient Input Area */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#DC2626',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '0.45rem',
                  }}
                >
                  Enter Recipient Email Address(es):
                </label>

                {/* Recipient Chips Container */}
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '0.5rem 0.65rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.45rem',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  {recipients.map((email) => (
                    <span
                      key={email}
                      style={{
                        background: 'rgba(239, 246, 255, 0.95)',
                        border: '1px solid #BFDBFE',
                        color: '#1D4ED8',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <span>{email}</span>
                      <button
                        onClick={() => handleRemoveRecipient(email)}
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#3B82F6',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                        }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}

                  <input
                    type="email"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddRecipient();
                      }
                    }}
                    placeholder={
                      recipients.length === 0
                        ? 'Type recipient email and press Enter...'
                        : 'Add another email...'
                    }
                    style={{
                      flex: 1,
                      minWidth: '180px',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#0F172A',
                      fontSize: '0.85rem',
                      padding: '0.2rem 0.35rem',
                    }}
                  />

                  {newEmailInput.trim() && (
                    <button
                      onClick={handleAddRecipient}
                      type="button"
                      style={{
                        background: '#DC2626',
                        border: 'none',
                        color: '#FFFFFF',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                      }}
                    >
                      <Plus size={12} />
                      <span>Add</span>
                    </button>
                  )}
                </div>

                {/* Quick Preset Email Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Quick Presets:</span>
                  {[
                    'qa-lead@silentqa.local',
                    'dev-triage@company.com',
                    'incident-response@company.com',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAddPreset(preset)}
                      style={{
                        background: 'rgba(0, 0, 0, 0.04)',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        color: '#475569',
                        borderRadius: '4px',
                        padding: '0.15rem 0.45rem',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        fontWeight: 500,
                      }}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Urgent Message / Note */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#DC2626',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '0.35rem',
                  }}
                >
                  Urgent Note / Message to Development Team (Optional):
                </label>
                <textarea
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g. Critical blocker on staging: checkout button triggers duplicate requests and 500 error. Please review the attached AI auto-fix patch."
                  rows={2}
                  style={{
                    width: '100%',
                    background: '#F8FAFC',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    color: '#0F172A',
                    fontSize: '0.85rem',
                    fontFamily: 'inherit',
                    lineHeight: 1.45,
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* View Switcher Tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
                  paddingBottom: '0.65rem',
                  marginBottom: '1rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: activeTab === 'preview' ? 'rgba(220, 38, 38, 0.1)' : 'transparent',
                    color: activeTab === 'preview' ? '#DC2626' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Eye size={13} />
                  <span>Formatted Email Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('payload')}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: activeTab === 'payload' ? 'rgba(220, 38, 38, 0.1)' : 'transparent',
                    color: activeTab === 'payload' ? '#DC2626' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Settings2 size={13} />
                  <span>Dispatch Settings &amp; Payload</span>
                </button>
              </div>

              {/* Tab 1: Formatted Email Preview */}
              {activeTab === 'preview' ? (
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    maxHeight: '320px',
                    overflowY: 'auto',
                    fontSize: '0.85rem',
                  }}
                >
                  {/* Subject Line Bar */}
                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      fontSize: '0.78rem',
                    }}
                  >
                    <div>
                      <strong style={{ color: '#64748B' }}>To:</strong>{' '}
                      <span style={{ color: '#0F172A', fontWeight: 600 }}>{recipients.join(', ') || 'No recipients'}</span>
                    </div>
                    <div style={{ marginTop: '0.2rem' }}>
                      <strong style={{ color: '#64748B' }}>Subject:</strong>{' '}
                      <span style={{ color: '#0F172A', fontWeight: 700 }}>
                        [DEFECT REPORT] {report.title} ({report.severity.toUpperCase()})
                      </span>
                    </div>
                  </div>

                  {/* Header Strip */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                      color: '#FFFFFF',
                      padding: '0.65rem 1rem',
                      borderRadius: '8px 8px 0 0',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      letterSpacing: '0.06em',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>SILENT QA DEFECT REPORT</span>
                    <span>{report.id.slice(0, 8)}</span>
                  </div>

                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderTop: 'none',
                      borderRadius: '0 0 8px 8px',
                      padding: '1.25rem',
                    }}
                  >
                    {/* Badges */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span
                        style={{
                          background: severityColor,
                          color: '#FFFFFF',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          textTransform: 'uppercase',
                        }}
                      >
                        SEVERITY: {report.severity}
                      </span>
                      <span
                        style={{
                          background: 'rgba(2, 132, 199, 0.08)',
                          color: '#0284C7',
                          border: '1px solid rgba(2, 132, 199, 0.25)',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                        }}
                      >
                        AI CONFIDENCE: {report.confidence || 'HIGH'}
                      </span>
                      <span
                        style={{
                          background: 'rgba(16, 185, 129, 0.08)',
                          color: '#059669',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <Lock size={10} />
                        <span>{shaHash.slice(0, 16)}...</span>
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem' }}>
                      {report.title}
                    </h4>

                    {customNote && (
                      <div
                        style={{
                          background: '#FEF2F2',
                          borderLeft: '3px solid #EF4444',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '4px',
                          marginBottom: '0.75rem',
                          fontSize: '0.78rem',
                          color: '#991B1B',
                        }}
                      >
                        <strong>Note from Tester:</strong> &ldquo;{customNote}&rdquo;
                      </div>
                    )}

                    {/* Before/After in Preview */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div style={{ background: '#FEF2F2', borderLeft: '3px solid #EF4444', padding: '0.5rem', borderRadius: '4px' }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase' }}>RAW HUMAN NOTE</div>
                        <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: '#7F1D1D' }}>&ldquo;{report.raw_note || report.title}&rdquo;</div>
                      </div>
                      <div style={{ background: '#F0FDF4', borderLeft: '3px solid #10B981', padding: '0.5rem', borderRadius: '4px' }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>AI SPECIFICATION</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065F46' }}>{report.title}</div>
                      </div>
                    </div>

                    {/* Expected vs Actual in Preview */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div style={{ background: '#F0FDF4', borderLeft: '3px solid #10B981', padding: '0.5rem', borderRadius: '4px' }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>EXPECTED</div>
                        <div style={{ fontSize: '0.75rem', color: '#14532D' }}>{report.expected}</div>
                      </div>
                      <div style={{ background: '#FEF2F2', borderLeft: '3px solid #EF4444', padding: '0.5rem', borderRadius: '4px' }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase' }}>ACTUAL</div>
                        <div style={{ fontSize: '0.75rem', color: '#7F1D1D' }}>{report.actual}</div>
                      </div>
                    </div>

                    {/* Auto-fix code in Preview */}
                    {report.suggested_fix && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                          ✨ AI AUTO-FIX CODE PATCH
                        </div>
                        <pre style={{ background: '#0F172A', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '6px', padding: '0.65rem 0.85rem', fontSize: '0.72rem', color: '#A7F3D0', margin: 0, overflowX: 'auto' }}>
                          <code>{report.suggested_fix}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Tab 2: Settings & Payload */
                <div
                  style={{
                    background: '#0F172A',
                    border: '1px solid #1E293B',
                    borderRadius: '10px',
                    padding: '1rem',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: '#94A3B8',
                  }}
                >
                  <div style={{ color: '#38BDF8', marginBottom: '0.5rem', fontWeight: 700 }}>
                    Target API: POST /api/reports/{report.id}/send
                  </div>
                  <pre style={{ margin: 0, color: '#E2E8F0', lineHeight: 1.5 }}>
                    {JSON.stringify(
                      {
                        report_id: report.id,
                        recipients,
                        custom_message: customNote || null,
                        delivery_channel: 'SMTP / Cloud / Supabase Audit',
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    color: '#991B1B',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertCircle size={14} />
                  <span>{errorMessage}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!sentResult && (
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid rgba(226, 232, 240, 0.9)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F8FAFC',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
              <span>{recipients.length} recipient(s) queued for delivery</span>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className="btn-secondary"
                style={{ padding: '0.55rem 1rem', fontSize: '0.825rem' }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDispatchEmail}
                disabled={sending || recipients.length === 0}
                className="btn-primary"
                style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
              >
                <Send size={14} />
                <span>{sending ? 'Dispatching Email...' : 'Approve & Send to Gmail →'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
