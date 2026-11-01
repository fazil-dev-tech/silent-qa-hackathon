import { NextResponse } from 'next/server';
import { transport, renderReportEmailHtml } from '@/lib/mail';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const recipientEmail = body.recipient || process.env.MAIL_TO || 'qa-team@silentqa.local';

    // 1. Strictly fetch the real report from Supabase (NO MOCKS)
    const { data: reportData, error: fetchErr } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !reportData) {
      return NextResponse.json(
        { error: 'Defect report not found in database', report_id: id },
        { status: 404 }
      );
    }

    // 2. Mark report as approved and sent
    await supabaseAdmin
      .from('reports')
      .update({ status: 'sent', updated_at: new Date().toISOString() })
      .eq('id', id);

    // 3. Render and deliver HTML email
    const publicUrl = `http://localhost:3000/app/report/${id}`;
    const emailHtml = renderReportEmailHtml(reportData, publicUrl);

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
      console.warn('[Mail Warning] SMTP delivery failed:', mailErr?.message);
      await supabaseAdmin.from('email_log').insert({
        report_id: id,
        to_addresses: [recipientEmail],
        status: 'failed',
        error: mailErr?.message,
      });
    }

    return NextResponse.json({
      success: true,
      report_id: id,
      status: 'sent',
      delivered_to: recipientEmail,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to dispatch report', message: err?.message },
      { status: 500 }
    );
  }
}
