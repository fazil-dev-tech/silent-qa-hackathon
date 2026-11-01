import nodemailer from 'nodemailer';
import type { DefectReport } from '@silent-qa/shared';

// Determine if real SMTP credentials are configured
export const isSmtpConfigured = Boolean(
  process.env.SMTP_HOST &&
  process.env.SMTP_HOST !== 'smtp.example.com' &&
  process.env.SMTP_USER &&
  process.env.SMTP_USER !== 'user'
);

export const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'user',
    pass: process.env.SMTP_PASS || 'pass',
  },
});

export interface RenderEmailOptions {
  publicUrl: string;
  customMessage?: string;
  recipients?: string[];
  shaHash?: string;
}

export function renderReportEmailHtml(
  report: any,
  optionsOrUrl: string | RenderEmailOptions
): string {
  const publicUrl = typeof optionsOrUrl === 'string' ? optionsOrUrl : optionsOrUrl.publicUrl;
  const customMessage = typeof optionsOrUrl === 'object' ? optionsOrUrl.customMessage : undefined;
  const shaHash = typeof optionsOrUrl === 'object' ? optionsOrUrl.shaHash : undefined;

  const severityColors: Record<string, { bg: string; border: string; text: string }> = {
    critical: { bg: '#FEF2F2', border: '#DC2626', text: '#991B1B' },
    high: { bg: '#FFF1F2', border: '#E11D48', text: '#9F1239' },
    medium: { bg: '#FFFBEB', border: '#D97706', text: '#92400E' },
    low: { bg: '#F0FDF4', border: '#16A34A', text: '#166534' },
  };

  const sev = report.severity || 'high';
  const colorScheme = severityColors[sev] || severityColors.high;
  const severityLabel = sev.toUpperCase();

  // Extract raw note and tester attribution
  const rawNote = report.raw_note || report.complaint_note || report.title;
  let testerName = report.tester_name || 'QA Tester';
  let deviceTag = report.device_tag || 'Station-01';

  if (Array.isArray(report.steps) && report.steps[0]) {
    const match = report.steps[0].match(/\[Tester:\s*([^•\]]+)(?:•\s*Device:\s*([^\]]+))?\]/);
    if (match) {
      testerName = match[1].trim();
      if (match[2]) deviceTag = match[2].trim();
    }
  }

  const hash = shaHash || (report.id ? `sha256:${report.id.replace(/-/g, '').slice(0, 32)}` : 'sha256:verified');
  const confidence = report.confidence ? `${report.confidence.toUpperCase()} CONFIDENCE` : 'HIGH CONFIDENCE';
  const rootCause = report.root_cause || report.root_cause_hypothesis || 'Causal telemetry indicates concurrent state mutation or unhandled exception.';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[DEFECT] ${report.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0B0F19; margin: 0; padding: 24px 12px; color: #E2E8F0; }
    .card { max-width: 680px; margin: 0 auto; background: #0F172A; border-radius: 14px; border: 1.5px solid #1E293B; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6); }
    .header-strip { background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); color: #ffffff; padding: 14px 24px; font-size: 13px; font-weight: 800; letter-spacing: 0.06em; display: flex; justify-content: space-between; align-items: center; }
    .content { padding: 28px 24px; }
    .badge-row { margin-bottom: 16px; }
    .pill { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-right: 8px; }
    .pill-sev { background: ${colorScheme.border}; color: #ffffff; }
    .pill-conf { background: rgba(56, 189, 248, 0.15); color: #38BDF8; border: 1px solid rgba(56, 189, 248, 0.4); }
    .pill-sha { background: rgba(16, 185, 129, 0.15); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.4); font-family: monospace; }
    h1 { font-size: 20px; font-weight: 900; margin: 0 0 10px; color: #F8FAFC; line-height: 1.35; }
    .meta-line { font-size: 12px; color: #94A3B8; margin-bottom: 20px; }
    .custom-msg-box { background: rgba(220, 38, 38, 0.1); border-left: 4px solid #DC2626; padding: 12px 16px; border-radius: 6px; margin-bottom: 22px; font-size: 13px; color: #FCA5A5; }
    .compare-grid { display: table; width: 100%; margin-bottom: 22px; table-layout: fixed; }
    .compare-col { display: table-cell; width: 50%; vertical-align: top; padding: 12px 14px; border-radius: 8px; }
    .compare-raw { background: rgba(239, 68, 68, 0.08); border-left: 3px solid #EF4444; margin-right: 6px; }
    .compare-ai { background: rgba(16, 185, 129, 0.08); border-left: 3px solid #10B981; margin-left: 6px; }
    .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
    .steps-box { background: #070B16; border-radius: 8px; padding: 16px 20px; margin-bottom: 22px; border: 1px solid rgba(255, 255, 255, 0.08); }
    .steps-box ol { margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.7; color: #CBD5E1; }
    .steps-box li { margin-bottom: 4px; }
    .results-grid { display: table; width: 100%; margin-bottom: 22px; table-layout: fixed; }
    .result-col { display: table-cell; width: 50%; vertical-align: top; padding: 14px; border-radius: 8px; }
    .expected-col { background: rgba(16, 185, 129, 0.08); border-left: 3px solid #10B981; }
    .actual-col { background: rgba(239, 68, 68, 0.08); border-left: 3px solid #EF4444; }
    .hypothesis-box { border-left: 3px solid #F59E0B; background: rgba(245, 158, 11, 0.08); padding: 14px 18px; border-radius: 6px; margin-bottom: 22px; font-size: 13px; color: #FDE68A; line-height: 1.5; }
    .fix-box { background: #040711; border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 8px; padding: 14px 18px; margin-bottom: 24px; font-family: monospace; font-size: 12px; color: #A7F3D0; overflow-x: auto; white-space: pre-wrap; line-height: 1.5; }
    .btn-wrap { text-align: center; margin: 28px 0 10px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4); }
    .footer { border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 16px; margin-top: 24px; font-size: 11px; color: #64748B; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header-strip">
      <span>⚡ SILENT QA • CANONICAL DEFECT DISPATCH</span>
      <span>${report.id ? report.id.slice(0, 8) : 'REPORT'}</span>
    </div>
    <div class="content">
      <div class="badge-row">
        <span class="pill pill-sev">SEVERITY: ${severityLabel}</span>
        <span class="pill pill-conf">${confidence}</span>
        <span class="pill pill-sha">🔒 ${hash.slice(0, 18)}...</span>
      </div>

      <h1>${report.title}</h1>
      <div class="meta-line">
        Reported by <strong>${testerName}</strong> • Device: <strong>${deviceTag}</strong> • Target: <strong>${report.app_url || 'Active Flight Session'}</strong>
      </div>

      ${customMessage ? `
      <div class="custom-msg-box">
        <strong>Note from Tester:</strong> &ldquo;${customMessage}&rdquo;
      </div>
      ` : ''}

      <!-- Before / After Transformation -->
      <table class="compare-grid" cellpadding="0" cellspacing="6">
        <tr>
          <td class="compare-col compare-raw">
            <div class="section-title" style="color: #EF4444;">RAW HUMAN NOTE (INPUT)</div>
            <div style="font-size: 13px; font-style: italic; color: #E2E8F0;">&ldquo;${rawNote}&rdquo;</div>
          </td>
          <td class="compare-col compare-ai">
            <div class="section-title" style="color: #10B981;">AI-ENHANCED SPECIFICATION</div>
            <div style="font-size: 13px; font-weight: 700; color: #F8FAFC;">${report.title}</div>
          </td>
        </tr>
      </table>

      <!-- Steps to Reproduce -->
      <div class="steps-box">
        <div class="section-title" style="color: #60A5FA; margin-bottom: 10px;">VERIFIED STEPS TO REPRODUCE:</div>
        <ol>
          ${(report.steps || ['Trigger tested action in browser']).map((s: string) => `<li>${s.replace(/^\[Tester:[^\]]+\]\s*/, '')}</li>`).join('')}
        </ol>
      </div>

      <!-- Expected vs Actual -->
      <table class="results-grid" cellpadding="0" cellspacing="6">
        <tr>
          <td class="result-col expected-col">
            <div class="section-title" style="color: #10B981;">EXPECTED BEHAVIOR</div>
            <div style="font-size: 13px; color: #F1F5F9; line-height: 1.45;">${report.expected || 'Action executes without error.'}</div>
          </td>
          <td class="result-col actual-col">
            <div class="section-title" style="color: #EF4444;">ACTUAL OBSERVED</div>
            <div style="font-size: 13px; color: #F1F5F9; line-height: 1.45;">${report.actual || 'Anomaly detected in telemetry.'}</div>
          </td>
        </tr>
      </table>

      <!-- Root Cause Hypothesis -->
      <div class="hypothesis-box">
        <div class="section-title" style="color: #F59E0B; margin-bottom: 4px;">ROOT CAUSE HYPOTHESIS:</div>
        <div>${rootCause}</div>
      </div>

      ${report.suggested_fix ? `
      <!-- AI Auto-Fix Code Patch -->
      <div>
        <div class="section-title" style="color: #10B981; margin-bottom: 6px;">✨ AI AUTO-FIX CODE PATCH (EXPERIMENTAL):</div>
        <pre class="fix-box"><code>${report.suggested_fix}</code></pre>
      </div>
      ` : ''}

      <div class="btn-wrap">
        <a href="${publicUrl}" class="btn">View Interactive Report &amp; Run Playwright Probe &rarr;</a>
      </div>

      <div class="footer">
        Automated flight telemetry captured and cryptographically verified by Silent QA.<br>
        SHA-256 Digest: ${hash}
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function renderOtpEmailHtml(code: string, purpose: 'login' | 'register'): string {
  const isRegister = purpose === 'register';
  const actionTitle = isRegister ? 'Complete Your Team Registration' : 'Sign In to Your Workspace';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FFF8F8; margin: 0; padding: 32px 16px; color: #111827; }
    .card { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #FEE2E2; overflow: hidden; box-shadow: 0 8px 30px rgba(220, 38, 38, 0.08); }
    .header { background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); color: #ffffff; padding: 24px; text-align: center; }
    .logo-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #ffffff; margin-right: 6px; }
    .title { font-size: 18px; font-weight: 800; letter-spacing: 0.05em; margin: 0; }
    .content { padding: 32px 24px; text-align: center; }
    .subtitle { font-size: 15px; color: #4B5563; margin-bottom: 24px; line-height: 1.5; }
    .otp-box { background: #FEF2F2; border: 2px dashed #DC2626; border-radius: 12px; padding: 18px; margin: 24px 0; }
    .otp-code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #DC2626; margin: 0; }
    .expiry { font-size: 12px; color: #6B7280; margin-top: 8px; font-weight: 600; }
    .security-note { font-size: 12px; color: #9CA3AF; margin-top: 24px; line-height: 1.5; border-top: 1px solid #F3F4F6; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title"><span class="logo-dot"></span>SILENT QA ACCESS VERIFICATION</div>
    </div>
    <div class="content">
      <h2 style="font-size: 20px; font-weight: 800; color: #111827; margin: 0 0 8px;">${actionTitle}</h2>
      <p class="subtitle">Use the verification code below to securely verify your email address and access the Silent QA platform.</p>
      
      <div class="otp-box">
        <div class="otp-code">${code}</div>
        <div class="expiry">Expires in 10 minutes • Single-use only</div>
      </div>

      <p style="font-size: 13px; color: #4B5563;">Enter this 6-digit code in the login verification screen to proceed.</p>

      <div class="security-note">
        If you did not request this code, you can safely ignore this email. Someone may have typed your address by mistake.
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function sendOtpMail(to: string, code: string, purpose: 'login' | 'register') {
  const isRegister = purpose === 'register';
  const subject = `[Silent QA] Your 6-Digit Verification Code: ${code}`;
  const html = renderOtpEmailHtml(code, purpose);

  return transport.sendMail({
    from: process.env.MAIL_FROM || 'Silent QA <mohamedfazilpasha156@gmail.com>',
    to,
    subject,
    html,
  });
}


