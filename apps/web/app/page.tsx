import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3.5rem 1.5rem' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: '9999px',
            background: 'rgba(220, 38, 38, 0.08)',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            color: '#DC2626',
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '1.5rem',
          }}
        >
          <span>★</span> 100% Real Pipeline • Zero Mock Data • Enterprise Hardened
        </div>

        <h1
          style={{
            fontSize: '3.25rem',
            lineHeight: 1.15,
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: '#111827',
            maxWidth: '900px',
            margin: '0 auto 1.5rem',
          }}
        >
          Turn 1-Sentence Bug Notes into{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Engineer-Ready Defect Reports
          </span>
        </h1>

        <p
          style={{
            fontSize: '1.2rem',
            color: '#4B5563',
            maxWidth: '720px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.6,
          }}
        >
          Silent in-browser telemetry captures DOM interactions, network payloads, and console signals in real time.
          Our causal AI reasoning engine synthesizes full bug reports and runnable Playwright tests in seconds.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/app" className="btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
            Open Tester Workspace →
          </Link>
          <Link href="/admin" className="btn-secondary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
            QA Lead Dashboard
          </Link>
        </div>
      </section>

      {/* Live System Pillars */}
      <section style={{ marginBottom: '4.5rem' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#111827',
            textAlign: 'center',
            marginBottom: '2rem',
            letterSpacing: '-0.02em',
          }}
        >
          Hardened Architecture & Carrier-Grade Engineering
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
          }}
        >
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🛰️</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>
              Dual Keep-Alive Extension
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.5 }}>
              Solves Chrome MV3 service worker suspensions using persistent port heartbeats + periodic alarms watchdog. 500-slot ring buffer prevents telemetry loss.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🛡️</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>
              Zero-Leak PII Scrubber
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.5 }}>
              Luhn-validated credit card masking, Bearer/JWT redaction, Aadhaar/PAN hashing, and JSON body structural shaping prior to database persistence.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🧠</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>
              Adaptive Causal Mapper
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.5 }}>
              Dynamic temporal window backtracks up to 300s to identify the true causal interaction. Evaluated by OpenRouter Nemotron-3 reasoning model.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🎭</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>
              Automated Playwright Script
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.5 }}>
              Synthesizes an immediately executable Playwright reproduction test for developers with network assertions and verified DOM selectors.
            </p>
          </div>
        </div>
      </section>

      {/* Production Pipeline Status Bar */}
      <section
        className="glass-panel"
        style={{
          padding: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          borderLeft: '6px solid #DC2626',
        }}
      >
        <div>
          <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827', marginBottom: '0.25rem' }}>
            Live Production Database: Supabase PostgreSQL (vdifshqatwyaycxhtbua)
          </h4>
          <p style={{ fontSize: '0.875rem', color: '#4B5563' }}>
            Partitioned events table, RLS security policies, verified Nodemailer Gmail SMTP, and OpenRouter AI integration active.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/app" className="btn-primary">
            Launch Flight Workspace
          </Link>
        </div>
      </section>
    </div>
  );
}
