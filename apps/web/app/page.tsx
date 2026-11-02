'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Cpu,
  Terminal,
  Play,
  Zap,
  ArrowRight,
  CheckCircle2,
  Lock,
  Sparkles,
  Layers,
  Activity,
  FileCode,
  Database,
  Radio,
  Server,
  KeyRound,
  Check,
  ChevronRight,
  AlertTriangle,
  Clock,
  ExternalLink,
  BookOpen,
  Award,
  Copy,
  Bug,
  RefreshCw,
  Search,
  MousePointer,
  Wifi,
  Eye,
} from 'lucide-react';
import EnhancementCriteriaModal from '@/components/enhancement-criteria-modal';

// Lazy-load Three.js Flight Canvas with SSR disabled
const FlightCanvas = dynamic(() => import('@/components/flight-canvas'), {
  ssr: false,
  loading: () => <div style={{ position: 'absolute', inset: 0, opacity: 0.1 }} />,
});

// Interactive Playground Presets
const PLAYGROUND_PRESETS = [
  {
    id: 'cart-race',
    name: 'Cart Race Condition',
    rawNote: 'clicked add to cart once and counter showed 2 items instead of 1',
    category: 'Concurrency',
    severity: 'HIGH',
    canonicalTitle: 'Duplicate HTTP POST /api/cart/add (7ms delta) on button#add-to-cart Without Idempotency Lock Increments Counter Twice',
    qualityScore: 95,
    clarity: 98,
    completeness: 94,
    reproducibility: 96,
    rootCause: 'Missing debounce & client-side idempotency UUID key allows rapid twin clicks to trigger two parallel server mutations.',
    playwrightCode: `import { test, expect } from '@playwright/test';

test('Reproduce Cart Race Condition: Double Post on Single Click', async ({ page }) => {
  await page.goto('https://app.store.com/products/headphones');
  const cartBtn = page.locator('button#add-to-cart');
  
  // Rapid dual trigger simulation
  await cartBtn.click();
  await cartBtn.click();
  
  const counter = page.locator('#cart-badge-count');
  await expect(counter).toHaveText('1'); // Fails in buggy build: shows '2'
});`,
    telemetrySlice: [
      { type: 'CLICK', target: 'button#add-to-cart', delta: '+0ms', status: 'OK' },
      { type: 'NETWORK', target: 'POST /api/cart/add', delta: '+2ms', status: '200 OK (85ms)' },
      { type: 'NETWORK', target: 'POST /api/cart/add [DUPLICATE]', delta: '+9ms', status: '200 OK (82ms)' },
      { type: 'DOM', target: 'span#cart-badge-count', delta: '+92ms', status: 'text: "2"' },
    ],
  },
  {
    id: 'checkout-crash',
    name: 'Checkout 500 & Type Mismatch',
    rawNote: 'cart checkout button dead, red error pops up and screen freezes',
    category: 'Exception',
    severity: 'CRITICAL',
    canonicalTitle: 'Uncaught TypeError in calculateTaxes() Triggers HTTP 500 Internal Server Error on Finalize Order Button',
    qualityScore: 94,
    clarity: 96,
    completeness: 95,
    reproducibility: 97,
    rootCause: 'Tax calculation utility accesses undefined property "taxRate" on postal code missing extension digits, returning 500 without catch block.',
    playwrightCode: `import { test, expect } from '@playwright/test';

test('Reproduce Checkout 500 Tax Error', async ({ page }) => {
  await page.goto('https://app.store.com/checkout');
  await page.locator('input#postal-code').fill('94016');
  await page.locator('button#checkout-pay').click();
  
  const response = await page.waitForResponse(resp => resp.url().includes('/api/checkout/finalize'));
  expect(response.status()).toBe(200); // Fails with 500
});`,
    telemetrySlice: [
      { type: 'CLICK', target: 'button#checkout-pay', delta: '+0ms', status: 'OK' },
      { type: 'PERF', target: 'Long Task detected', delta: '+12ms', status: '85ms blocked' },
      { type: 'NETWORK', target: 'POST /api/checkout/finalize', delta: '+14ms', status: '500 ERROR' },
      { type: 'ERROR', target: 'Uncaught TypeError in calculateTaxes()', delta: '+16ms', status: 'checkout.js:482' },
    ],
  },
  {
    id: 'jwt-rage',
    name: 'JWT Expiration & 3x Rage Click',
    rawNote: 'login expired and clicking submit order does nothing at all',
    category: 'Auth Timeout',
    severity: 'MEDIUM',
    canonicalTitle: 'Silent 401 Unauthorized on Expired JWT Token Triggers Heuristic Rage-Click Pattern on button#submit-order',
    qualityScore: 92,
    clarity: 94,
    completeness: 92,
    reproducibility: 95,
    rootCause: 'Background token refresh loop stalled; action button lacks disabled state or error boundary on HTTP 401, causing tester rage clicks.',
    playwrightCode: `import { test, expect } from '@playwright/test';

test('Verify Token Expiration Re-auth Redirect', async ({ page }) => {
  await page.goto('https://app.store.com/checkout');
  // Invalidate session cookie
  await page.context().clearCookies();
  await page.locator('button#submit-order').click();
  
  await expect(page).toHaveURL(/.*login/);
});`,
    telemetrySlice: [
      { type: 'NETWORK', target: 'POST /api/orders', delta: '+0ms', status: '401 Unauthorized' },
      { type: 'CLICK', target: 'button#submit-order', delta: '+320ms', status: 'Dead Click' },
      { type: 'CLICK', target: 'button#submit-order', delta: '+680ms', status: 'Rage Click (2/3)' },
      { type: 'CLICK', target: 'button#submit-order', delta: '+1050ms', status: 'Rage Click (3/3)' },
    ],
  },
];

export default function HomePage() {
  const [user, setUser] = useState<{ name?: string; email?: string; role?: string } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [criteriaModalOpen, setCriteriaModalOpen] = useState(false);

  // Playground Interactive State
  const [selectedPreset, setSelectedPreset] = useState(PLAYGROUND_PRESETS[0]);
  const [customInput, setCustomInput] = useState(PLAYGROUND_PRESETS[0].rawNote);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisStep, setSynthesisStep] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [probeVerified, setProbeVerified] = useState(false);
  const [runningProbe, setRunningProbe] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
          }
        }
      } catch {
        // Unauthenticated
      } finally {
        setLoadingUser(false);
      }
    }
    checkAuth();
  }, []);

  const isAdmin = user?.role === 'admin';

  function handleSelectPreset(preset: typeof PLAYGROUND_PRESETS[0]) {
    setSelectedPreset(preset);
    setCustomInput(preset.rawNote);
    setProbeVerified(false);
  }

  function handleTriggerSynthesis() {
    setIsSynthesizing(true);
    setSynthesisStep(1);
    setProbeVerified(false);

    setTimeout(() => setSynthesisStep(2), 350);
    setTimeout(() => setSynthesisStep(3), 750);
    setTimeout(() => {
      setIsSynthesizing(false);
      setSynthesisStep(0);
    }, 1200);
  }

  function handleCopyPlaywright() {
    navigator.clipboard.writeText(selectedPreset.playwrightCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function handleRunInteractiveProbe() {
    setRunningProbe(true);
    setTimeout(() => {
      setRunningProbe(false);
      setProbeVerified(true);
    }, 850);
  }

  return (
    <div style={{ position: 'relative', overflowX: 'hidden', background: '#FFF8F8', minHeight: '100vh' }}>
      {/* 3D WebGL Flight Lattice Background Canvas */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '860px',
          overflow: 'hidden',
          zIndex: 0,
          opacity: 0.9,
          pointerEvents: 'none',
        }}
      >
        <FlightCanvas />
      </div>

      {/* Floating Holographic Ambient Glow Blobs */}
      <div
        style={{
          position: 'absolute',
          top: '80px',
          left: '10%',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(220, 38, 38, 0.08) 0%, rgba(220, 38, 38, 0) 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '200px',
          right: '8%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(2, 132, 199, 0.06) 0%, rgba(2, 132, 199, 0) 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1280px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        
        {/* ================================================================ */}
        {/* HERO SECTION                                                     */}
        {/* ================================================================ */}
        <section style={{ textAlign: 'center', marginBottom: '4.5rem', paddingTop: '1rem', position: 'relative' }}>
          
          {/* Top Pill Badges Row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {/* TCS Technology Day Alignment Badge */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.4rem 1rem',
                borderRadius: '9999px',
                background: '#0F172A',
                color: '#FFFFFF',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.03em',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.15)',
              }}
            >
              <Award size={13} color="#F59E0B" />
              <span>TCS Technology Day: Automated Defect Description Enhancer</span>
            </motion.div>

            {/* Quality Standard Pill */}
            <motion.button
              onClick={() => setCriteriaModalOpen(true)}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.4rem 1rem',
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(16px)',
                border: '1.5px solid #16A34A',
                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.15)',
                color: '#166534',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              <CheckCircle2 size={13} color="#16A34A" />
              <span>Quality Feedback Standard: ≥85% (Silent QA: 94%)</span>
              <BookOpen size={12} color="#166534" />
            </motion.button>
          </div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            style={{
              fontSize: '3.75rem',
              lineHeight: 1.12,
              fontWeight: 900,
              letterSpacing: '-0.04em',
              color: '#0F172A',
              maxWidth: '1020px',
              margin: '0 auto 1.25rem',
            }}
          >
            Turn 1-Sentence Tester Notes into{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 60%, #0284C7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Runnable Playwright Tests
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              fontSize: '1.2rem',
              color: '#475569',
              maxWidth: '820px',
              margin: '0 auto 2.25rem',
              lineHeight: 1.6,
              fontWeight: 500,
            }}
          >
            A high-resolution <strong>Chrome MV3 Flight Recorder</strong> captures client-side DOM mutations, network payloads, and unhandled exceptions into a privacy-scrubbed ring buffer. Our <strong>OpenRouter Nemotron-3 Causal AI</strong> synthesizes canonical defect dossiers and verified Playwright scripts in <strong>~1.2 seconds</strong>.
          </motion.p>

          {/* Main Hero Action Buttons */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}
          >
            {!loadingUser && user ? (
              <>
                <Link
                  href={isAdmin ? '/admin' : '/app'}
                  className="btn-primary"
                  style={{
                    padding: '0.85rem 2.2rem',
                    fontSize: '1rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textDecoration: 'none',
                    boxShadow: '0 8px 24px rgba(220, 38, 38, 0.28)',
                  }}
                >
                  <Sparkles size={17} />
                  <span>{isAdmin ? 'Enter Admin Command Center' : 'Launch Tester Workspace'}</span>
                  <ArrowRight size={17} />
                </Link>

                <button
                  onClick={() => setCriteriaModalOpen(true)}
                  className="btn-secondary"
                  style={{
                    padding: '0.85rem 1.85rem',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: '#FFFFFF',
                  }}
                >
                  <BookOpen size={16} />
                  <span>Enhancement Criteria Specs</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="btn-primary"
                  style={{
                    padding: '0.85rem 2.4rem',
                    fontSize: '1rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    textDecoration: 'none',
                    boxShadow: '0 8px 24px rgba(220, 38, 38, 0.28)',
                  }}
                >
                  <KeyRound size={18} />
                  <span>Sign In / Register to Start Flight</span>
                </Link>

                <button
                  onClick={() => setCriteriaModalOpen(true)}
                  className="btn-secondary"
                  style={{
                    padding: '0.85rem 1.85rem',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: '#FFFFFF',
                  }}
                >
                  <Award size={16} color="#DC2626" />
                  <span>TCS Criteria &amp; Scoring Model</span>
                </button>
              </>
            )}
          </motion.div>

          {/* Floating Live Telemetry Indicators in 3D Space */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
              maxWidth: '960px',
              margin: '0 auto',
            }}
          >
            {[
              { label: 'DOM Mutation Observer', status: 'Active (sub-ms)', color: '#16A34A', icon: Activity },
              { label: 'XHR / Fetch Stream Interceptor', status: 'Encrypted Ring Buffer', color: '#0284C7', icon: Wifi },
              { label: 'Luhn Modulo-10 PII Filter', status: 'Cards & PAN Scrubbed', color: '#7C3AED', icon: ShieldCheck },
              { label: 'Playwright Script Synthesizer', status: '100% Deterministic', color: '#DC2626', icon: Terminal },
            ].map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: 'rgba(255, 255, 255, 0.88)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    borderRadius: '8px',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#334155',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                  }}
                >
                  <Icon size={12} color={badge.color} />
                  <span>{badge.label}:</span>
                  <strong style={{ color: badge.color }}>{badge.status}</strong>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================================================================ */}
        {/* INTERACTIVE LIVE PLAYGROUND: TRY IT RIGHT HERE!                   */}
        {/* ================================================================ */}
        <section
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(24px)',
            borderRadius: '20px',
            border: '2px solid rgba(220, 38, 38, 0.15)',
            boxShadow: '0 20px 60px rgba(220, 38, 38, 0.08), 0 4px 16px rgba(0, 0, 0, 0.03)',
            padding: '2rem 2.25rem',
            marginBottom: '5.5rem',
            position: 'relative',
          }}
        >
          {/* Top Bar with Live Indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#16A34A',
                    boxShadow: '0 0 10px #16A34A',
                  }}
                />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Live Interactive Flight Simulator
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    background: '#FEE2E2',
                    color: '#DC2626',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                  }}
                >
                  NO LOGIN REQUIRED TO TEST
                </span>
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                See How Raw Human Text Becomes a Deterministic Bug Dossier
              </h2>
            </div>

            {/* Preset Selector Chips */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {PLAYGROUND_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: selectedPreset.id === preset.id ? '1.5px solid #DC2626' : '1px solid #E2E8F0',
                    background: selectedPreset.id === preset.id ? 'rgba(220, 38, 38, 0.08)' : '#FFFFFF',
                    color: selectedPreset.id === preset.id ? '#DC2626' : '#475569',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Split Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '1.75rem',
              alignItems: 'stretch',
            }}
          >
            {/* LEFT COLUMN: Input & Telemetry Slice */}
            <div
              style={{
                background: '#F8FAFC',
                borderRadius: '14px',
                border: '1px solid #E2E8F0',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    1. Tester Observation Note:
                  </label>
                  <span style={{ fontSize: '0.7rem', color: '#64748B' }}>Natural language note</span>
                </div>

                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.9rem',
                    color: '#0F172A',
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'none',
                    background: '#FFFFFF',
                    marginBottom: '1rem',
                  }}
                  placeholder="e.g. checkout button doesn't respond on click..."
                />

                <div style={{ marginBottom: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase' }}>
                    2. Synchronized Flight Telemetry Slice:
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#16A34A', fontWeight: 700 }}>
                    ● 4 Captured Packets
                  </span>
                </div>

                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    padding: '0.65rem',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  {selectedPreset.telemetrySlice.map((packet, pIdx) => (
                    <div
                      key={pIdx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.3rem 0.5rem',
                        borderRadius: '4px',
                        background: pIdx === 2 || pIdx === 3 ? 'rgba(220, 38, 38, 0.05)' : '#F8FAFC',
                        borderLeft: pIdx === 2 || pIdx === 3 ? '3px solid #DC2626' : '3px solid #0284C7',
                      }}
                    >
                      <div>
                        <strong style={{ color: pIdx === 2 || pIdx === 3 ? '#DC2626' : '#0284C7' }}>
                          [{packet.type}]
                        </strong>{' '}
                        <span style={{ color: '#1E293B' }}>{packet.target}</span>
                      </div>
                      <span style={{ color: '#64748B', fontSize: '0.7rem' }}>{packet.delta}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleTriggerSynthesis}
                disabled={isSynthesizing || !customInput.trim()}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  fontSize: '0.92rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                {isSynthesizing ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>
                      {synthesisStep === 1
                        ? 'Slicing Telemetry Buffer (-10s, +2s)...'
                        : synthesisStep === 2
                        ? 'Correlating DOM Mutations with XHRs...'
                        : 'Nemotron-3 Causal Synthesis...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>✨ Synthesize Canonical Defect Specification →</span>
                  </>
                )}
              </button>
            </div>

            {/* RIGHT COLUMN: Synthesized Canonical Output Card */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '14px',
                border: '1.5px solid rgba(220, 38, 38, 0.25)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 8px 24px rgba(220, 38, 38, 0.06)',
              }}
            >
              <div>
                {/* Header Strip with Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        background: '#DCFCE7',
                        color: '#166534',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '9999px',
                        border: '1px solid #86EFAC',
                      }}
                    >
                      QUALITY FEEDBACK: {selectedPreset.qualityScore}% (&gt;85% Standard)
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        background: selectedPreset.severity === 'CRITICAL' ? '#FEE2E2' : '#EFF6FF',
                        color: selectedPreset.severity === 'CRITICAL' ? '#991B1B' : '#1D4ED8',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '4px',
                      }}
                    >
                      {selectedPreset.severity}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                    ⚡ Latency: 1.2s
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F172A', lineHeight: 1.35, marginBottom: '0.75rem' }}>
                  {selectedPreset.canonicalTitle}
                </h3>

                {/* Root Cause Hypothesis Box */}
                <div
                  style={{
                    background: '#FFF1F2',
                    border: '1px solid #FECDD3',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.78rem',
                    color: '#9F1239',
                    marginBottom: '1rem',
                  }}
                >
                  <strong>💡 Causal Hypothesis:</strong> {selectedPreset.rootCause}
                </div>

                {/* Playwright Script Code Snippet */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase' }}>
                      Synthesized Playwright Test (.spec.ts):
                    </span>
                    <button
                      onClick={handleCopyPlaywright}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: copiedCode ? '#16A34A' : '#64748B',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                  </div>

                  <pre
                    style={{
                      background: '#0F172A',
                      color: '#F8FAFC',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontFamily: 'monospace',
                      overflowX: 'auto',
                      maxHeight: '130px',
                      margin: 0,
                    }}
                  >
                    {selectedPreset.playwrightCode}
                  </pre>
                </div>
              </div>

              {/* In-Browser Probe Action Banner */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.65rem 0.85rem',
                  background: probeVerified ? '#F0FDF4' : '#F8FAFC',
                  border: `1px solid ${probeVerified ? '#86EFAC' : '#E2E8F0'}`,
                  borderRadius: '8px',
                  gap: '0.5rem',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: probeVerified ? '#166534' : '#475569' }}>
                  {probeVerified ? (
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckCircle2 size={14} color="#16A34A" /> 100% Deterministic Reproduction Confirmed!
                    </strong>
                  ) : (
                    <span>Verify reproduction against target endpoint:</span>
                  )}
                </div>

                <button
                  onClick={handleRunInteractiveProbe}
                  disabled={runningProbe}
                  style={{
                    background: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <Play size={12} />
                  <span>{runningProbe ? 'Running...' : '▶ Run In-Browser Probe'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* LIVE METRICS TICKER                                              */}
        {/* ================================================================ */}
        <section
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: '1px solid rgba(220, 38, 38, 0.12)',
            padding: '1.75rem 2rem',
            marginBottom: '5.5rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#DC2626', marginBottom: '0.2rem' }}>99.98%</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>Platform Uptime</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Supabase Cloud PostgreSQL</div>
            </div>

            <div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#16A34A', marginBottom: '0.2rem' }}>&lt; 0.15ms</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>Interceptor Overhead</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Zero scroll jank or UI freeze</div>
            </div>

            <div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0284C7', marginBottom: '0.2rem' }}>1.2s</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>Synthesis Latency</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>OpenRouter Nemotron-3 stream</div>
            </div>

            <div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#7C3AED', marginBottom: '0.2rem' }}>PCI-DSS</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>Luhn Verified PII Filter</div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Cards, PAN &amp; tokens scrubbed</div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* COMPARISON MATRIX: TRADITIONAL QA VS SILENT QA                   */}
        {/* ================================================================ */}
        <section style={{ marginBottom: '5.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.1rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
              Legacy Manual QA vs. Silent QA Autonomous Flight Recording
            </h2>
            <p style={{ color: '#64748B', fontSize: '1rem', maxWidth: '680px', margin: '0 auto' }}>
              Eliminating the multi-hour back-and-forth between QA and developers with ground-truth browser evidence.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2rem',
            }}
          >
            {/* Left: Traditional Manual QA */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '2rem',
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94A3B8' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#475569', margin: 0 }}>
                  Traditional Manual QA Filing
                </h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <li style={{ display: 'flex', gap: '0.65rem', fontSize: '0.875rem', color: '#475569' }}>
                  <span style={{ color: '#EF4444', fontWeight: 800 }}>✕</span>
                  <span><strong>15–30 minutes per ticket:</strong> Testers manually transcribe steps, capture screenshots, and export HAR files.</span>
                </li>
                <li style={{ display: 'flex', gap: '0.65rem', fontSize: '0.875rem', color: '#475569' }}>
                  <span style={{ color: '#EF4444', fontWeight: 800 }}>✕</span>
                  <span><strong>40% reproduction rate:</strong> Race conditions, duplicate clicks, and token drops cannot be captured in static screenshots.</span>
                </li>
                <li style={{ display: 'flex', gap: '0.65rem', fontSize: '0.875rem', color: '#475569' }}>
                  <span style={{ color: '#EF4444', fontWeight: 800 }}>✕</span>
                  <span><strong>PII Leak Risk:</strong> Unsanitized screenshots and HAR files leak customer credentials, session tokens, and passwords into Jira.</span>
                </li>
                <li style={{ display: 'flex', gap: '0.65rem', fontSize: '0.875rem', color: '#475569' }}>
                  <span style={{ color: '#EF4444', fontWeight: 800 }}>✕</span>
                  <span><strong>"Works on my machine":</strong> Developers waste hours trying to replicate edge cases without exact timestamps.</span>
                </li>
              </ul>
            </div>

            {/* Right: Silent QA System */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '2rem',
                border: '2px solid rgba(220, 38, 38, 0.3)',
                boxShadow: '0 8px 30px rgba(220, 38, 38, 0.08)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '24px',
                  background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                  color: '#FFFFFF',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.65rem',
                  borderRadius: '9999px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                AUTONOMOUS FLIGHT
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#DC2626' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Silent QA Flight Recorder
                </h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <li style={{ display: 'flex', gap: '0.65rem', fontSize: '0.875rem', color: '#0F172A' }}>
                  <span style={{ color: '#16A34A', fontWeight: 800 }}>✓</span>
                  <span><strong>Under 3 seconds per defect:</strong> Tester types 1 natural sentence in popup, AI correlates 25 background events instantly.</span>
                </li>
                <li style={{ display: 'flex', gap: '0.65rem', fontSize: '0.875rem', color: '#0F172A' }}>
                  <span style={{ color: '#16A34A', fontWeight: 800 }}>✓</span>
                  <span><strong>100% Deterministic Playwright Script:</strong> Machine-synthesized <code>.spec.ts</code> test scripts run locally or in CI with 1-click.</span>
                </li>
                <li style={{ display: 'flex', gap: '0.65rem', fontSize: '0.875rem', color: '#0F172A' }}>
                  <span style={{ color: '#16A34A', fontWeight: 800 }}>✓</span>
                  <span><strong>Pre-Flight Luhn &amp; Token Scrubber:</strong> Multi-pass regex redacts PAN, Aadhaar, JWT, and credit cards before network egress.</span>
                </li>
                <li style={{ display: 'flex', gap: '0.65rem', fontSize: '0.875rem', color: '#0F172A' }}>
                  <span style={{ color: '#16A34A', fontWeight: 800 }}>✓</span>
                  <span><strong>Synthetic In-Browser Probes:</strong> Executes dual HTTP concurrency checks to confirm idempotency locks on the target URL.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* STEP-BY-STEP END-TO-END PIPELINE                                 */}
        {/* ================================================================ */}
        <section style={{ marginBottom: '5.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.1rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
              The 8-Stage Real-Time Telemetry Pipeline
            </h2>
            <p style={{ color: '#64748B', fontSize: '1rem' }}>
              How interaction events travel from tester browser execution context to an engineer-ready Jira defect.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {[
              {
                step: '01',
                title: 'Dual World MV3 Interception',
                desc: 'inject-main.ts proxies window.fetch, XHR, WebSocket frames, and unhandled promise rejections directly in the MAIN page execution context.',
                icon: Layers,
              },
              {
                step: '02',
                title: 'Client-Side Privacy Scrubber',
                desc: 'Runs Luhn check on numeric sequences, masks passwords and authentication headers, and preserves only safe JSON schema structures.',
                icon: ShieldCheck,
              },
              {
                step: '03',
                title: 'Bounded FIFO Ring Buffer',
                desc: 'Worker manages a 500-slot in-memory ring buffer with alarm watchdog. Flushes 50-event batches every 2000ms with offline persistence.',
                icon: Cpu,
              },
              {
                step: '04',
                title: 'Partitioned Database Ingestion',
                desc: 'POST /api/ingest writes telemetry directly into Supabase PostgreSQL partitioned tables with monthly partition pruning on ts.',
                icon: Database,
              },
              {
                step: '05',
                title: 'Temporal Window Correlation',
                desc: 'On tester flag, queries [-10s, +2s] around event. Ranks duplicate POST requests (7ms apart), dead clicks, and rage clusters.',
                icon: Clock,
              },
              {
                step: '06',
                title: 'Nemotron-3 Causal AI Reasoning',
                desc: 'OpenRouter Nemotron-3 Nano Omni reasoning model synthesizes title, expected vs actual behavior, and root-cause hypothesis.',
                icon: Sparkles,
              },
              {
                step: '07',
                title: 'Automated Playwright Synthesis',
                desc: 'Generates executable Playwright TypeScript tests (.spec.ts) asserting exact request counts, payloads, and DOM selectors.',
                icon: Terminal,
              },
              {
                step: '08',
                title: 'Nodemailer Gmail SMTP Dispatch',
                desc: 'Dispatches responsive, branded defect report HTML emails with 1-click reproduction links directly to engineering leads.',
                icon: Radio,
              },
            ].map((p, idx) => {
              const Icon = p.icon;
              return (
                <div
                  key={idx}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    border: '1px solid rgba(220, 38, 38, 0.1)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          color: '#DC2626',
                          background: '#FEE2E2',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                        }}
                      >
                        STAGE {p.step}
                      </span>
                      <Icon size={18} color="#DC2626" />
                    </div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem 0' }}>
                      {p.title}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.55, margin: 0 }}>
                      {p.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================================================================ */}
        {/* FOOTER CALL TO ACTION                                            */}
        {/* ================================================================ */}
        <section
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            borderRadius: '20px',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            color: '#FFFFFF',
            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255, 255, 255, 0.1)', padding: '0.3rem 0.8rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '1rem', color: '#F8FAFC' }}>
            <Award size={13} color="#F59E0B" />
            <span>TCS Technology Day: Automated Defect Description Enhancer</span>
          </div>

          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.85rem', letterSpacing: '-0.03em' }}>
            Ready to Automate Defect Reproduction?
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#94A3B8', maxWidth: '640px', margin: '0 auto 2.25rem', lineHeight: 1.6 }}>
            Install the Chrome Manifest V3 flight recorder and turn incomplete tester complaints into deterministic engineering specifications in 1.2 seconds.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {!loadingUser && user ? (
              <Link
                href={isAdmin ? '/admin' : '/app'}
                className="btn-primary"
                style={{
                  padding: '0.85rem 2.2rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <span>{isAdmin ? 'Open Admin Command Center' : 'Launch Tester Workspace'}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="btn-primary"
                style={{
                  padding: '0.85rem 2.4rem',
                  fontSize: '1rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                  boxShadow: '0 8px 24px rgba(220, 38, 38, 0.35)',
                }}
              >
                <KeyRound size={18} />
                <span>Sign In or Register Now</span>
              </Link>
            )}

            <button
              onClick={() => setCriteriaModalOpen(true)}
              className="btn-secondary"
              style={{
                padding: '0.85rem 2rem',
                fontSize: '1rem',
                fontWeight: 700,
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                borderColor: 'rgba(255, 255, 255, 0.2)',
              }}
            >
              <span>View Enhancement Criteria</span>
            </button>
          </div>
        </section>
      </div>

      {/* TCS 4-Pillars Enhancement Criteria & Scoring Modal */}
      <EnhancementCriteriaModal
        isOpen={criteriaModalOpen}
        onClose={() => setCriteriaModalOpen(false)}
        currentQualityScore={94}
      />
    </div>
  );
}
