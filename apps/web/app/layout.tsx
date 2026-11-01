import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Silent QA — Flight Recorder & Defect Report Synthesizer',
  description:
    'Silent in-browser telemetry recorder that transforms 1-sentence tester complaints into engineer-ready defect reports with executable Playwright scripts.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Navigation Bar */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            background: 'rgba(255, 248, 248, 0.85)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(220, 38, 38, 0.1)',
            padding: '0.85rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '1.15rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#111827',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#DC2626',
                  boxShadow: '0 0 10px #DC2626',
                }}
              />
              <span>Silent</span>
              <span style={{ color: '#DC2626' }}>QA</span>
            </Link>

            <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.9rem', fontWeight: 600 }}>
              <Link href="/" style={{ color: '#4B5563', transition: 'color 0.15s' }}>
                Overview
              </Link>
              <Link href="/app" style={{ color: '#4B5563', transition: 'color 0.15s' }}>
                Tester Workspace
              </Link>
              <Link href="/admin" style={{ color: '#4B5563', transition: 'color 0.15s' }}>
                Admin Dashboard
              </Link>
              <Link href="/login" style={{ color: '#DC2626', transition: 'color 0.15s' }}>
                Sign In / Register
              </Link>
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#15803D',
                background: '#DCFCE7',
                padding: '0.3rem 0.75rem',
                borderRadius: '9999px',
                border: '1px solid #86EFAC',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#16A34A',
                }}
              />
              Supabase Live
            </div>

            <Link href="/app" className="btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
              Launch Workspace →
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <main style={{ flex: 1 }}>{children}</main>

        {/* Footer */}
        <footer
          style={{
            borderTop: '1px solid rgba(17, 24, 39, 0.06)',
            padding: '2rem',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: '#6B7280',
            background: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <strong>Silent QA</strong> — Production Hardened Flight Recorder & AI Defect Synthesizer.
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', fontWeight: 500 }}>
              <span>PostgreSQL Partitioned</span>
              <span>OpenRouter Nemotron-3</span>
              <span>Nodemailer SMTP</span>
              <span>Playwright Synthesizer</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

