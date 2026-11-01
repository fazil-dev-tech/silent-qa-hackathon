'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ReportDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function loadReport() {
      try {
        const res = await fetch(`/api/reports/recent`);
        if (res.ok) {
          const data = await res.json();
          const found = data.reports?.find((r: any) => r.id === id);
          if (found) {
            setReport(found);
          } else {
            setError('Defect report not found in database.');
          }
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch report');
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [id]);

  async function handleApproveAndSend() {
    if (!id) return;
    setSendingEmail(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/reports/${id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: 'mohamedfazilpasha156@gmail.com' }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`✓ Report approved and sent to ${data.delivered_to} via Gmail SMTP!`);
        setReport((prev: any) => ({ ...prev, status: 'sent' }));
      } else {
        throw new Error(data.error || 'Failed to deliver email');
      }
    } catch (err: any) {
      setActionMessage(`Error: ${err?.message}`);
    } finally {
      setSendingEmail(false);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '4rem auto', textAlign: 'center', color: '#6B7280' }}>
        Loading report from Supabase database...
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ maxWidth: '900px', margin: '4rem auto', textAlign: 'center' }}>
        <h2 style={{ color: '#DC2626', marginBottom: '1rem' }}>{error || 'Report not found'}</h2>
        <Link href="/app" className="btn-primary">
          Back to Tester Workspace
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/app" style={{ fontSize: '0.85rem', color: '#DC2626', fontWeight: 600 }}>
          ← Back to Workspace
        </Link>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span className={`badge-severity severity-${report.severity}`}>{report.severity}</span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  background: report.status === 'sent' ? '#DCFCE7' : '#FEF3C7',
                  color: report.status === 'sent' ? '#166534' : '#B45309',
                }}
              >
                {report.status.toUpperCase()}
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#111827', lineHeight: 1.25 }}>
              {report.title}
            </h1>
          </div>

          <button
            onClick={handleApproveAndSend}
            disabled={sendingEmail}
            className="btn-primary"
          >
            {sendingEmail ? 'Delivering via SMTP...' : '✉ Approve & Send to Gmail'}
          </button>
        </div>

        {/* Expected vs Actual */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ padding: '1.25rem', background: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Expected Behavior
            </h3>
            <p style={{ fontSize: '0.95rem', color: '#14532D', lineHeight: 1.5 }}>{report.expected}</p>
          </div>

          <div style={{ padding: '1.25rem', background: '#FEF2F2', borderRadius: '12px', border: '1px solid #FECACA' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Actual Behavior
            </h3>
            <p style={{ fontSize: '0.95rem', color: '#7F1D1D', lineHeight: 1.5 }}>{report.actual}</p>
          </div>
        </div>

        {/* Root Cause Hypothesis */}
        {report.root_cause && (
          <div style={{ padding: '1.25rem', background: '#FFFBEB', borderRadius: '12px', border: '1px solid #FDE68A', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400E', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              AI Root Cause Hypothesis (OpenRouter Reasoning)
            </h3>
            <p style={{ fontSize: '0.95rem', color: '#78350F', lineHeight: 1.5 }}>{report.root_cause}</p>
          </div>
        )}

        {/* Steps */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginBottom: '0.75rem' }}>
            Steps to Reproduce
          </h3>
          <ol style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem', color: '#374151' }}>
            {report.steps?.map((step: string, idx: number) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>

        {/* Playwright Script */}
        {report.playwright_script && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>
                🎭 Automated Playwright Reproduction Script
              </h3>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(report.playwright_script);
                  alert('Playwright script copied to clipboard!');
                }}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              >
                Copy Playwright Test
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
              }}
            >
              <code>{report.playwright_script}</code>
            </pre>
          </div>
        )}

        {/* Evidence IDs */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#111827', marginBottom: '0.75rem' }}>
            Verified Evidence IDs ({report.evidence_ids?.length || 0})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {report.evidence_ids?.map((id: string) => (
              <span
                key={id}
                style={{
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  background: 'rgba(17, 24, 39, 0.05)',
                  border: '1px solid rgba(17, 24, 39, 0.12)',
                  padding: '0.25rem 0.6rem',
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
    </div>
  );
}
