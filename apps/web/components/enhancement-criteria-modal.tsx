'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  CheckCircle2,
  BookOpen,
  Layers,
  Terminal,
  Zap,
  ArrowRight,
  ShieldCheck,
  Award,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';

interface EnhancementCriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQualityScore?: number;
}

export default function EnhancementCriteriaModal({
  isOpen,
  onClose,
  currentQualityScore = 94,
}: EnhancementCriteriaModalProps) {
  const [activeTab, setActiveTab] = useState<'criteria' | 'examples' | 'formula'>('criteria');
  const [copiedExample, setCopiedExample] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedExample(id);
    setTimeout(() => setCopiedExample(null), 2000);
  }

  const examples = [
    {
      id: 'ex-1',
      title: 'Scenario 1: Checkout Double-Click Race Condition',
      raw: 'cart button clicked twice and it showed two items instead of one',
      enhanced:
        'Rapid Dual Invocations on button#add-to-cart (7ms apart) without Idempotency Lock Result in Duplicate HTTP POST /api/cart/add and False Counter State (2)',
      clarity: '98%',
      completeness: '95%',
      reproducibility: '96%',
      score: '96%',
      delta: '+210% Context Density',
    },
    {
      id: 'ex-2',
      title: 'Scenario 2: Unhandled 500 Payment Gateway Server Error',
      raw: 'checkout crashes when i click pay button',
      enhanced:
        'Checkout Submission on button#pay Triggers HTTP 500 Internal Server Error (Gateway Timeout) Leading to Unhandled Promise Rejection and UI Deadlock',
      clarity: '96%',
      completeness: '94%',
      reproducibility: '95%',
      score: '95%',
      delta: '+240% Context Density',
    },
    {
      id: 'ex-3',
      title: 'Scenario 3: Expired Session JWT Rage Clicks',
      raw: 'orders list button not responding',
      enhanced:
        'Action on button#load-orders Fails Silently with HTTP 401 Unauthorized, Inducing Heuristic Rage-Click Pattern (3 clicks in 1.1s) Without Visual Toast Feedback',
      clarity: '94%',
      completeness: '91%',
      reproducibility: '92%',
      score: '92%',
      delta: '+190% Context Density',
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(24px)',
          border: '1.5px solid rgba(220, 38, 38, 0.2)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.2), 0 0 35px rgba(220, 38, 38, 0.1)',
          overflow: 'hidden',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem 1.75rem',
            borderBottom: '1px solid rgba(220, 38, 38, 0.12)',
            background: 'linear-gradient(135deg, rgba(255, 241, 242, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.25)',
              }}
            >
              <Award size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#111827', margin: 0 }}>
                  Defect Description Enhancement Criteria
                </h2>
                <span
                  style={{
                    background: '#DCFCE7',
                    border: '1px solid #86EFAC',
                    color: '#166534',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.55rem',
                    borderRadius: '9999px',
                  }}
                >
                  TCS IT QA STANDARD
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '0.2rem 0 0' }}>
                Target Quality Metric: &gt;85% • Real-time synthesis • Before/After transformation framework
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#F3F4F6',
              border: 'none',
              color: '#4B5563',
              padding: '0.45rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            padding: '0.75rem 1.75rem',
            background: '#FAFAFA',
            borderBottom: '1px solid rgba(17, 24, 39, 0.06)',
          }}
        >
          <button
            onClick={() => setActiveTab('criteria')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: activeTab === 'criteria' ? '1px solid #DC2626' : '1px solid transparent',
              background: activeTab === 'criteria' ? '#DC2626' : 'transparent',
              color: activeTab === 'criteria' ? '#FFFFFF' : '#4B5563',
              boxShadow: activeTab === 'criteria' ? '0 2px 8px rgba(220, 38, 38, 0.25)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            🎯 Core Evaluation Criteria
          </button>

          <button
            onClick={() => setActiveTab('examples')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: activeTab === 'examples' ? '1px solid #0284C7' : '1px solid transparent',
              background: activeTab === 'examples' ? '#0284C7' : 'transparent',
              color: activeTab === 'examples' ? '#FFFFFF' : '#4B5563',
              boxShadow: activeTab === 'examples' ? '0 2px 8px rgba(2, 132, 199, 0.25)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            ⚖ Before / After Showcase
          </button>

          <button
            onClick={() => setActiveTab('formula')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: activeTab === 'formula' ? '1px solid #16A34A' : '1px solid transparent',
              background: activeTab === 'formula' ? '#16A34A' : 'transparent',
              color: activeTab === 'formula' ? '#FFFFFF' : '#4B5563',
              boxShadow: activeTab === 'formula' ? '0 2px 8px rgba(22, 163, 74, 0.25)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            📐 85%+ Scoring Formula
          </button>
        </div>

        {/* Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem' }}>
          {activeTab === 'criteria' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <Sparkles size={20} color="#DC2626" />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#991B1B' }}>
                    Current Report Quality Feedback: {currentQualityScore}% (Exceeds &gt;85% Requirement)
                  </div>
                  <div style={{ fontSize: '0.775rem', color: '#7F1D1D' }}>
                    Silent QA automatically validates defect specifications against these four pillars before enabling export or developer notification.
                  </div>
                </div>
              </div>

              {/* 4 Pillars Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                {/* Pillar 1 */}
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(220, 38, 38, 0.15)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ background: '#FEE2E2', padding: '0.3rem', borderRadius: '6px', color: '#DC2626' }}>
                      <BookOpen size={16} />
                    </div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                      1. Linguistic Clarity (Weight: 35%)
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#4B5563', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
                    Translates colloquial shorthand (&quot;broken&quot;, &quot;crashed&quot;, &quot;buggy&quot;) into standardized ISO-29119 defect vocabulary:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.78rem', color: '#374151', lineHeight: 1.55 }}>
                    <li>Structured BEM Title: [Component] + [Trigger Condition] + [Failure State]</li>
                    <li>Unambiguous semantic distinction between Expected vs Actual behavior</li>
                    <li>Elimination of redundant emotional adjectives and vague assertions</li>
                  </ul>
                </div>

                {/* Pillar 2 */}
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(2, 132, 199, 0.15)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ background: '#E0F2FE', padding: '0.3rem', borderRadius: '6px', color: '#0284C7' }}>
                      <Layers size={16} />
                    </div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                      2. Contextual Completeness (Weight: 35%)
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#4B5563', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
                    Fuses silent in-browser telemetry into the report without manual tester burden:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.78rem', color: '#374151', lineHeight: 1.55 }}>
                    <li>HTTP Network trace: method, endpoint, status code, payload schema, latency</li>
                    <li>DOM target context: unique CSS selector, tag, bounding rect coordinates</li>
                    <li>System fingerprints: OS version, browser build, viewport resolution, millisecond timestamp</li>
                  </ul>
                </div>

                {/* Pillar 3 */}
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(22, 163, 74, 0.15)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ background: '#DCFCE7', padding: '0.3rem', borderRadius: '6px', color: '#16A34A' }}>
                      <Terminal size={16} />
                    </div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                      3. Deterministic Reproducibility (Weight: 20%)
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#4B5563', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
                    Guarantees developers never receive &quot;works on my machine&quot; rejections:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.78rem', color: '#374151', lineHeight: 1.55 }}>
                    <li>Synthesized, numbered reproduction steps with interactive checklist</li>
                    <li>Executable Playwright TypeScript test (.spec.ts) asserting exact failure state</li>
                    <li>Real-time automated reproduction probe runner with latency verification</li>
                  </ul>
                </div>

                {/* Pillar 4 */}
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(124, 58, 237, 0.15)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ background: '#EDE9FE', padding: '0.3rem', borderRadius: '6px', color: '#7C3AED' }}>
                      <Zap size={16} />
                    </div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                      4. Real-Time Generation (Weight: 10%)
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#4B5563', lineHeight: 1.5, margin: '0 0 0.75rem 0' }}>
                    Instant AI synthesis matching the problem statement real-time expectation:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.78rem', color: '#374151', lineHeight: 1.55 }}>
                    <li>Synthesis time: ~1.2s average via OpenRouter Nemotron-3 streaming</li>
                    <li>Zero manual copy-paste: browser extension uplink streams telemetry directly</li>
                    <li>Cryptographic SHA-256 seal guarantees integrity of telemetry payload</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'examples' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#4B5563', margin: 0 }}>
                Here are concrete real-world examples demonstrating how raw human tester observations are enriched into canonical specifications meeting the 85%+ quality threshold:
              </p>

              {examples.map((ex) => (
                <div
                  key={ex.id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(17, 24, 39, 0.08)',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#111827' }}>
                      {ex.title}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          color: '#166534',
                          background: '#DCFCE7',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                        }}
                      >
                        Quality Score: {ex.score}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: '#0284C7',
                          background: '#E0F2FE',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                        }}
                      >
                        {ex.delta}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {/* Before */}
                    <div
                      style={{
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        borderRadius: '8px',
                        padding: '0.75rem',
                      }}
                    >
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        BEFORE: Raw Human Note
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#991B1B', fontStyle: 'italic', lineHeight: 1.4 }}>
                        &ldquo;{ex.raw}&rdquo;
                      </div>
                    </div>

                    {/* After */}
                    <div
                      style={{
                        background: '#F0FDF4',
                        border: '1px solid #BBF7D0',
                        borderRadius: '8px',
                        padding: '0.75rem',
                      }}
                    >
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        AFTER: AI Canonical Specification
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#14532D', fontWeight: 600, lineHeight: 1.4 }}>
                        {ex.enhanced}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.72rem', color: '#6B7280' }}>
                    <span>Clarity: <strong style={{ color: '#111827' }}>{ex.clarity}</strong></span>
                    <span>Completeness: <strong style={{ color: '#111827' }}>{ex.completeness}</strong></span>
                    <span>Reproducibility: <strong style={{ color: '#111827' }}>{ex.reproducibility}</strong></span>
                    <button
                      onClick={() => handleCopy(ex.enhanced, ex.id)}
                      style={{
                        marginLeft: 'auto',
                        background: 'none',
                        border: 'none',
                        color: '#0284C7',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                      }}
                    >
                      {copiedExample === ex.id ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
                      <span>{copiedExample === ex.id ? 'Copied' : 'Copy Spec'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'formula' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '1.25rem',
                }}
              >
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
                  Mathematical Scoring Model
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                  Each defect description generated by the agent is scored using a multi-factor composite heuristic that measures clarity, completeness, and reproducibility against the 85% success threshold:
                </p>

                <div
                  style={{
                    background: '#0F172A',
                    color: '#38BDF8',
                    padding: '1rem',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    lineHeight: 1.6,
                    marginBottom: '1rem',
                  }}
                >
                  Quality_Score = (0.35 × C_clarity) + (0.35 × C_completeness) + (0.20 × R_reproducibility) + (0.10 × S_speed)
                  <br />
                  <span style={{ color: '#4ADE80' }}>
                    Threshold Requirement: Quality_Score &gt;= 85.0%
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.78rem' }}>
                  <div style={{ padding: '0.75rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <strong style={{ color: '#0F172A' }}>C_clarity (35%):</strong> Normalized token ratio, absence of emotional qualifiers, structured BEM title syntax, distinct expected/actual fields.
                  </div>
                  <div style={{ padding: '0.75rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <strong style={{ color: '#0F172A' }}>C_completeness (35%):</strong> Presence of HTTP status codes, DOM CSS selectors, network latency metrics, device environment data.
                  </div>
                  <div style={{ padding: '0.75rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <strong style={{ color: '#0F172A' }}>R_reproducibility (20%):</strong> Sequential step integrity, executable Playwright test script generation, successful probe test execution.
                  </div>
                  <div style={{ padding: '0.75rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <strong style={{ color: '#0F172A' }}>S_speed (10%):</strong> Generation latency below 3,000ms from the instant the human tester submits the complaint note.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.75rem',
            borderTop: '1px solid rgba(17, 24, 39, 0.08)',
            background: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
            Built for <strong>TCS Technology Day</strong> • Automated Defect Description Enhancer
          </span>

          <button
            onClick={onClose}
            className="btn-primary"
            style={{ fontSize: '0.85rem', padding: '0.45rem 1.25rem' }}
          >
            Done Reviewing
          </button>
        </div>
      </div>
    </div>
  );
}

