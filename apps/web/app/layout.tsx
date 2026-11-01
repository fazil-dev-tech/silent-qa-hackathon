import './globals.css';
import type { Metadata } from 'next';
import NavigationBar from '@/components/navigation-bar';

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
        <NavigationBar />

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

