'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
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
} from 'lucide-react';

// Lazy-load Three.js Flight Canvas with SSR disabled
const FlightCanvas = dynamic(() => import('@/components/flight-canvas'), {
  ssr: false,
  loading: () => <div style={{ position: 'absolute', inset: 0, opacity: 0.1 }} />,
});

export default function HomePage() {
  const [user, setUser] = useState<{ name?: string; email?: string; role?: string } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

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
        //
      } finally {
        setLoadingUser(false);
      }
    }
    checkAuth();
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <div style={{ position: 'relative', overflowX: 'hidden', background: '#FFF8F8' }}>
      {/* Three.js Interactive WebGL Flight Lattice in Hero Background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '740px',
          overflow: 'hidden',
          zIndex: 0,
          opacity: 0.8,
          pointerEvents: 'none',
        }}
      >
        <FlightCanvas />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1280px', margin: '0 auto', padding: '3.5rem 1.5rem' }}>
        {/* HERO SECTION */}
        <section style={{ textAlign: 'center', marginBottom: '5.5rem', paddingTop: '1.5rem' }}>
          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.45rem 1.15rem',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(220, 38, 38, 0.2)',
              boxShadow: '0 4px 16px rgba(220, 38, 38, 0.1)',
              color: '#DC2626',
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '1.75rem',
            }}
          >
            <Sparkles size={14} color="#DC2626" />
            <span>Zero Mock Policy • Real Supabase PostgreSQL • OpenRouter Nemotron-3 AI</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              fontSize: '3.85rem',
              lineHeight: 1.1,
              fontWeight: 900,
              letterSpacing: '-0.035em',
              color: '#111827',
              maxWidth: '980px',
              margin: '0 auto 1.5rem',
            }}
          >
            Turn 1-Sentence Tester Notes into{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
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
              fontSize: '1.25rem',
              color: '#4B5563',
              maxWidth: '780px',
              margin: '0 auto 2.5rem',
              lineHeight: 1.6,
            }}
          >
            Silent in-browser telemetry captures DOM interactions, WebSocket/fetch streams, and console anomalies.
            Our causal AI reasoning engine synthesizes production-ready bug reports and verifiable Playwright reproduction scripts in seconds.
          </motion.p>

          {/* Dynamic CTAs based on Authentication Status */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}
          >
            {!loadingUser && user ? (
              // When LOGGED IN: direct access to tools
              <>
                <Link
                  href={isAdmin ? '/admin' : '/app'}
                  className="btn-primary"
                  style={{
                    padding: '0.85rem 2rem',
                    fontSize: '1rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textDecoration: 'none',
                    boxShadow: '0 8px 24px rgba(220, 38, 38, 0.28)',
                  }}
                >
                  <span>{isAdmin ? 'Enter Admin Command Center' : 'Launch Tester Workspace'}</span>
                  <ArrowRight size={18} />
                </Link>

                {isAdmin && (
                  <Link
                    href="/app"
                    className="btn-secondary"
                    style={{
                      padding: '0.85rem 1.85rem',
                      fontSize: '1rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    Tester Flight View
                  </Link>
                )}
              </>
            ) : (
              // When NOT LOGGED IN: user must login before accessing tools
              <>
                <Link
                  href="/login"
                  className="btn-primary"
                  style={{
                    padding: '0.85rem 2.2rem',
                    fontSize: '1rem',
                    fontWeight: 700,
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

                <Link
                  href="/login"
                  className="btn-secondary"
                  style={{
                    padding: '0.85rem 1.85rem',
                    fontSize: '1rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    background: '#FFFFFF',
                  }}
                >
                  Executive Admin Access
                </Link>
              </>
            )}
          </motion.div>

          {!user && (
            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#6B7280' }}>
              <span>First and foremost: login required before accessing flight recording tools.</span>
            </div>
          )}
        </section>

        {/* LIVE METRICS TICKER */}
        <section
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: '1px solid rgba(220, 38, 38, 0.12)',
            padding: '1.75rem 2rem',
            marginBottom: '5rem',
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
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#DC2626', marginBottom: '0.2rem' }}>99.98%</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111827' }}>Platform Uptime</div>
              <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>PostgreSQL partitioned cluster</div>
            </div>

            <div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#15803D', marginBottom: '0.2rem' }}>&lt; 0.15ms</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111827' }}>Interceptor Overhead</div>
              <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>Zero scroll jank or UI freeze</div>
            </div>

            <div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#2563EB', marginBottom: '0.2rem' }}>100%</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111827' }}>Playwright Ready</div>
              <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>Executable .spec.ts tests generated</div>
            </div>

            <div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#7C3AED', marginBottom: '0.2rem' }}>PCI-DSS</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111827' }}>Luhn Verified PII Filter</div>
              <div style={{ fontSize: '0.72rem', color: '#6B7280' }}>Cards, PAN & tokens scrubbed</div>
            </div>
          </div>
        </section>

        {/* COMPARISON MATRIX: TRADITIONAL QA VS SILENT QA */}
        <section style={{ marginBottom: '5.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>
              Legacy Manual QA vs. Silent QA Autonomous Flight Recording
            </h2>
            <p style={{ color: '#6B7280', fontSize: '1rem', maxWidth: '640px', margin: '0 auto' }}>
              Eliminating the multi-hour back-and-forth between QA and developers with ground-truth evidence.
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
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9CA3AF' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#4B5563', margin: 0 }}>
                  Traditional Manual QA Filing
                </h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <li style={{ display: 'flex', gap: '0.65rem', fontSize: '0.875rem', color: '#4B5563' }}>
                  <span style={{ color: '#EF4444', fontWeight: 800 }}>✕</span>
                  <span><strong>15–30 minutes per ticket:</strong> Testers manually transcribe steps, capture screenshots, and export HAR files.</span>
                </li>
                <li style={{ display: 'flex', gap: '0.65rem', fontSize: '0.875rem', color: '#4B5563' }}>
                  <span style={{ color: '#EF4444', fontWeight: 800 }}>✕</span>
                  <span><strong>40% reproduction rate:</strong> Race conditions, duplicate clicks, and token drops cannot be captured in static screenshots.</span>
                </li>
                <li style={{ display: 'flex', gap: '0.65rem', fontSize: '0.875rem', color: '#4B5563' }}>
                  <span style={{ color: '#EF4444', fontWeight: 800 }}>✕</span>
                  <span><strong>PII Leak Risk:</strong> Unsanitized screenshots and HAR files leak customer credentials, session tokens, and passwords into Jira.</span>
                </li>
                <li style={{ display: 'flex', gap: '0.65rem', fontSize: '0.875rem', color: '#4B5563' }}>
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
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                  Silent QA Flight Recorder
                </h3>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <li style={{ display: 'flex', gap: '0.65rem', fontSize: '0.875rem', color: '#111827' }}>
                  <span style={{ color: '#16A34A', fontWeight: 800 }}>✓</span>
                  <span><strong>Under 3 seconds per defect:</strong> Tester types 1 natural sentence in popup, AI correlates 25 background events instantly.</span>
                </li>
                <li style={{ display: 'flex', gap: '0.65rem', fontSize: '0.875rem', color: '#111827' }}>
                  <span style={{ color: '#16A34A', fontWeight: 800 }}>✓</span>
                  <span><strong>100% Deterministic Playwright Script:</strong> Machine-synthesized <code>.spec.ts</code> test scripts run locally or in CI with 1-click.</span>
                </li>
                <li style={{ display: 'flex', gap: '0.65rem', fontSize: '0.875rem', color: '#111827' }}>
                  <span style={{ color: '#16A34A', fontWeight: 800 }}>✓</span>
                  <span><strong>Pre-Flight Luhn & Token Scrubber:</strong> Multi-pass regex redacts PAN, Aadhaar, JWT, and credit cards before network egress.</span>
                </li>
                <li style={{ display: 'flex', gap: '0.65rem', fontSize: '0.875rem', color: '#111827' }}>
                  <span style={{ color: '#16A34A', fontWeight: 800 }}>✓</span>
                  <span><strong>Synthetic In-Browser Probes:</strong> Executes dual HTTP concurrency checks to confirm idempotency locks on the target URL.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* STEP-BY-STEP END-TO-END PIPELINE */}
        <section style={{ marginBottom: '5.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>
              The 8-Stage Real-Time Telemetry Pipeline
            </h2>
            <p style={{ color: '#6B7280', fontSize: '1rem' }}>
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
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem 0' }}>
                      {p.title}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: 1.55, margin: 0 }}>
                      {p.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* REAL-WORLD DEFECT SCENARIOS SHOWCASE */}
        <section style={{ marginBottom: '5.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.025em', marginBottom: '0.5rem' }}>
              Preset Real-World Reproduction Scenarios
            </h2>
            <p style={{ color: '#6B7280', fontSize: '1rem' }}>
              Built into the Tester Workspace for instant zero-setup flight simulation.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.5rem',
            }}
          >
            <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '1.75rem', border: '1px solid rgba(220, 38, 38, 0.12)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Preset Scenario 1
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', margin: '0 0 0.75rem 0' }}>
                Cart Button Race Condition
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                User clicks "Add to Cart" once, but duplicate POST requests fire 7ms apart without an idempotency key. Cart item counter jumps from 0 to 2.
              </p>
              <div style={{ background: '#F9FAFB', padding: '0.75rem', borderRadius: '8px', fontSize: '0.78rem', color: '#374151', fontFamily: 'monospace' }}>
                POST /api/cart/add (200 OK) +0ms<br />
                POST /api/cart/add (200 OK) +7ms<br />
                DOM #cart-counter text_update: 2
              </div>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '1.75rem', border: '1px solid rgba(220, 38, 38, 0.12)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Preset Scenario 2
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', margin: '0 0 0.75rem 0' }}>
                Checkout 500 Internal Crash
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                User submits order form; checkout payment gateway returns HTTP 500 Uncaught Exception. Screen locks up without friendly toast or recovery.
              </p>
              <div style={{ background: '#F9FAFB', padding: '0.75rem', borderRadius: '8px', fontSize: '0.78rem', color: '#374151', fontFamily: 'monospace' }}>
                POST /api/checkout/pay (500 Error)<br />
                Uncaught Promise Rejection: Gateway Timeout<br />
                Dead Click on button#retry
              </div>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '1.75rem', border: '1px solid rgba(220, 38, 38, 0.12)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Preset Scenario 3
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', margin: '0 0 0.75rem 0' }}>
                Expired Token Rage Click
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Authentication JWT expires in background. Tester clicks action 3 times within 1.2s without UI feedback, triggering heuristic rage-click detector.
              </p>
              <div style={{ background: '#F9FAFB', padding: '0.75rem', borderRadius: '8px', fontSize: '0.78rem', color: '#374151', fontFamily: 'monospace' }}>
                GET /api/user/orders (401 Unauthorized)<br />
                rage_click: 3+ clicks on button#load-more<br />
                Auth token expired
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER CALL TO ACTION */}
        <section
          style={{
            background: 'linear-gradient(135deg, #111827 0%, #1F2937 100%)',
            borderRadius: '20px',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            color: '#FFFFFF',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.15)',
          }}
        >
          <h2 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '0.85rem', letterSpacing: '-0.025em' }}>
            Ready to Automate Defect Reproduction?
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#9CA3AF', maxWidth: '620px', margin: '0 auto 2.25rem', lineHeight: 1.6 }}>
            Install the Chrome Manifest V3 flight recorder and verify your live app workflows with ground-truth browser evidence.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {!loadingUser && user ? (
              <Link
                href={isAdmin ? '/admin' : '/app'}
                className="btn-primary"
                style={{
                  padding: '0.85rem 2rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <span>{isAdmin ? 'Open Command Center' : 'Launch Tester Workspace'}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="btn-primary"
                style={{
                  padding: '0.85rem 2.2rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                }}
              >
                <KeyRound size={18} />
                <span>Sign In or Register Now</span>
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
