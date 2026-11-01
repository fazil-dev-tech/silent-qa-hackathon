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
