import nodemailer from 'nodemailer';
import type { DefectReport } from '@silent-qa/shared';

export const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'user',
    pass: process.env.SMTP_PASS || 'pass',
  },
});

export function renderReportEmailHtml(report: DefectReport, publicUrl: string): string {
  const severityColors: Record<string, string> = {
    low: '#6B7280',
    medium: '#D97706',
    high: '#EF4444',
    critical: '#DC2626',
  };
  const color = severityColors[report.severity] || '#DC2626';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FFF8F8; margin: 0; padding: 24px; color: #111827; }
    .card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #FEE2E2; overflow: hidden; box-shadow: 0 4px 16px rgba(220, 38, 38, 0.06); }
    .header-strip { background: #DC2626; color: #ffffff; padding: 12px 20px; font-size: 13px; font-weight: 700; letter-spacing: 0.05em; display: flex; justify-content: space-between; }
    .content { padding: 24px; }
    .pill { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #fff; background: ${color}; }
    h1 { font-size: 18px; margin: 12px 0 16px; color: #111827; line-height: 1.3; }
    .steps-box { background: #F9FAFB; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; border: 1px solid #E5E7EB; }
    .columns { display: table; width: 100%; margin-bottom: 20px; }
    .col { display: table-cell; width: 50%; vertical-align: top; padding: 12px; border-radius: 8px; }
    .col-expected { background: #F0FDF4; border: 1px solid #DCFCE7; }
    .col-actual { background: #FEF2F2; border: 1px solid #FEE2E2; }
    .col-title { font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; }
    .hypothesis-box { border-left: 3px solid #DC2626; background: #FFF5F5; padding: 12px 16px; margin-bottom: 24px; font-size: 13px; }
    .btn { display: inline-block; background: #DC2626; color: #ffffff !important; text-decoration: none; padding: 10px 22px; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header-strip">
      <span>SILENT QA DEFECT REPORT</span>
      <span>${report.id}</span>
    </div>
    <div class="content">
      <span class="pill">${report.severity}</span>
      <h1>${report.title}</h1>

      <div class="steps-box">
        <div style="font-size: 12px; font-weight: 700; margin-bottom: 8px; color: #4B5563;">STEPS TO REPRODUCE:</div>
        <ol style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.6;">
          ${report.steps.map((s) => `<li>${s}</li>`).join('')}
        </ol>
      </div>

      <div class="columns">
        <div class="col col-expected" style="padding-right: 12px;">
          <div class="col-title" style="color: #16A34A;">EXPECTED BEHAVIOR</div>
          <div style="font-size: 13px;">${report.expected}</div>
        </div>
        <div class="col col-actual" style="padding-left: 12px;">
          <div class="col-title" style="color: #DC2626;">ACTUAL OBSERVED</div>
          <div style="font-size: 13px;">${report.actual}</div>
        </div>
      </div>

      <div class="hypothesis-box">
        <strong>Root Cause Hypothesis (${report.confidence} confidence):</strong><br>
        ${report.root_cause_hypothesis || 'Under investigation'}
      </div>

      <div style="text-align: center; margin-top: 20px;">
        <a href="${publicUrl}" class="btn">Open Full Report & Evidence</a>
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


