import './globals.css';
import type { Metadata } from 'next';
import NavigationBar from '@/components/navigation-bar';
import Footer from '@/components/footer';

export const metadata: Metadata = {
  title: 'Silent QA — Enterprise Flight Recorder & Defect Report Synthesizer',
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

        {/* Adaptive Enterprise Footer */}
        <Footer />
      </body>
    </html>
  );
}

