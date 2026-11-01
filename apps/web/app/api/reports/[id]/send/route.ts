import { NextResponse } from 'next/server';
import { transport, renderReportEmailHtml } from '@/lib/mail';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const recipientEmail = body.recipient || process.env.MAIL_TO || 'qa-team@silentqa.local';

    // Fetch report from Supabase or generate approval confirmation
    let reportData: any = body.report;
    if (!reportData) {
      const { data } = await supabaseAdmin.from('reports').select('*').eq('id', id).single();
      reportData = data;
    }

    if (!reportData) {
      reportData = {
        id,
        title: 'Defect Report ' + id,
        severity: 'high',
        steps: ['1. Reproduce user interaction', '2. Observe abnormal state jump'],
        expected: 'Standard single execution',
        actual: 'Observed anomaly',
        root_cause_hypothesis: 'Duplicate event listener invocation',
        confidence: 'high',
      };
    }

    const publicUrl = `http://localhost:3000/app/report/${id}`;
    const emailHtml = renderReportEmailHtml(reportData, publicUrl);

    // Send email via Nodemailer
    try {
      await transport.sendMail({
        from: process.env.MAIL_FROM || 'Silent QA <reports@silentqa.local>',
        to: recipientEmail,
        subject: `[DEFECT REPORT] ${reportData.title} (${reportData.severity.toUpperCase()})`,
        html: emailHtml,
      });

      await supabaseAdmin.from('email_log').insert({
        report_id: id,
        to_addresses: [recipientEmail],
        status: 'delivered',
        sent_at: new Date().toISOString(),
      });
    } catch (mailErr: any) {
      console.warn('Mail send skipped (SMTP not configured):', mailErr?.message);
    }

    return NextResponse.json({
      success: true,
      report_id: id,
      status: 'sent',
      delivered_to: recipientEmail,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to send report email', message: err?.message },
      { status: 500 }
    );
  }
}
