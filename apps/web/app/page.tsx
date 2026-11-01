'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { ShieldCheck, Cpu, Terminal, Play, Zap, ArrowRight, CheckCircle2, Lock, Sparkles, Layers } from 'lucide-react';

// Lazy-load Three.js Flight Canvas with SSR disabled
const FlightCanvas = dynamic(() => import('@/components/flight-canvas'), {
  ssr: false,
  loading: () => <div style={{ position: 'absolute', inset: 0, opacity: 0.1 }} />,
});

export default function HomePage() {
  return (
    <div style={{ position: 'relative', overflowX: 'hidden' }}>
      {/* Three.js Interactive WebGL Flight Lattice in Hero Background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '680px',
          overflow: 'hidden',
          zIndex: 0,
          opacity: 0.85,
        }}
      >
        <FlightCanvas />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1240px', margin: '0 auto', padding: '3.5rem 1.5rem' }}>
        {/* Hero Section */}
        <section style={{ textAlign: 'center', marginBottom: '5rem', paddingTop: '1.5rem' }}>
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1rem',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(220, 38, 38, 0.2)',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.1)',
              color: '#DC2626',
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '1.75rem',
            }}
          >
            <Sparkles size={14} color="#DC2626" />
            <span>Zero Mock Data • Real Supabase • OpenRouter AI</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{
              fontSize: '3.75rem',
              lineHeight: 1.1,
              fontWeight: 900,
              letterSpacing: '-0.035em',
              color: '#111827',
              maxWidth: '960px',
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

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              fontSize: '1.25rem',
              color: '#4B5563',
              maxWidth: '740px',
              margin: '0 auto 2.5rem',
              lineHeight: 1.6,
            }}
          >
            Silent in-browser telemetry captures DOM interactions, WebSocket/fetch streams, and console anomalies.
            Our causal AI reasoning engine synthesizes production-ready bug reports and verifiable Playwright reproduction scripts in seconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}
          >
            <Link
              href="/app"
              className="btn-primary"
              style={{ padding: '0.85rem 1.85rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span>Launch Tester Workspace</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/admin"
              className="btn-secondary"
              style={{ padding: '0.85rem 1.85rem', fontSize: '1rem' }}
            >
              QA Lead Triage Board
            </Link>
          </motion.div>
        </section>

        {/* Live System Pillars */}
        <section style={{ marginBottom: '5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
              Hardened Carrier-Grade Architecture
            </h2>
            <p style={{ color: '#6B7280', fontSize: '0.95rem' }}>
              Zero compromise telemetry pipeline engineered to eliminate dropped events, memory leaks, and false positives.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.5rem',
            }}
          >
            <motion.div
              whileHover={{ y: -4, boxShadow: 'var(--shadow-hover)' }}
              transition={{ duration: 0.2 }}
              className="glass-panel"
              style={{ padding: '2rem' }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: 'rgba(220, 38, 38, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <Cpu size={22} color="#DC2626" />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>
                Dual Keep-Alive MV3
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.6 }}>
                Solves Chrome MV3 service worker suspensions using persistent runtime ports + alarms watchdog pulse. 500-slot ring buffer prevents event dropouts.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4, boxShadow: 'var(--shadow-hover)' }}
              transition={{ duration: 0.2 }}
              className="glass-panel"
              style={{ padding: '2rem' }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: 'rgba(220, 38, 38, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <Lock size={22} color="#DC2626" />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>
                Luhn & PII Masking
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.6 }}>
                16-digit Luhn algorithm verifies and redacts real credit card numbers, JWT tokens, Bearer headers, and PAN/Aadhaar IDs before database persistence.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4, boxShadow: 'var(--shadow-hover)' }}
              transition={{ duration: 0.2 }}
              className="glass-panel"
              style={{ padding: '2rem' }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: 'rgba(220, 38, 38, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <Zap size={22} color="#DC2626" />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>
                Adaptive Causal Mapper
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.6 }}>
                Dynamically backtracks up to 300s of browser telemetry to isolate the root trigger. Evaluated by OpenRouter Nemotron-3 reasoning AI in JSON mode.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4, boxShadow: 'var(--shadow-hover)' }}
              transition={{ duration: 0.2 }}
              className="glass-panel"
              style={{ padding: '2rem' }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: 'rgba(220, 38, 38, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <Terminal size={22} color="#DC2626" />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>
                Playwright Synthesizer
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.6 }}>
                Automatically outputs an executable Playwright reproduction test with verified network assertions and DOM locators ready for immediate CI/CD integration.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Live End-to-End Visual Workflow */}
        <section
          className="glass-panel"
          style={{
            padding: '2.5rem',
            marginBottom: '4rem',
            borderLeft: '6px solid #DC2626',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: '0.25rem' }}>
                Zero Mock Data • Verified Cloud Production Pipeline
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#4B5563' }}>
                Every click and HTTP request is stored in partitioned PostgreSQL tables on Supabase (<code style={{ color: '#DC2626' }}>vdifshqatwyaycxhtbua</code>) and synthesized via OpenRouter.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link href="/app" className="btn-primary" style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}>
                Test Live Workspace →
              </Link>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(17, 24, 39, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#111827', fontWeight: 600 }}>
              <CheckCircle2 size={16} color="#16A34A" /> 12 Partitioned Tables
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#111827', fontWeight: 600 }}>
              <CheckCircle2 size={16} color="#16A34A" /> OpenRouter Nemotron-3
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#111827', fontWeight: 600 }}>
              <CheckCircle2 size={16} color="#16A34A" /> Nodemailer Gmail SMTP
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#111827', fontWeight: 600 }}>
              <CheckCircle2 size={16} color="#16A34A" /> Playwright Probe Runner
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
