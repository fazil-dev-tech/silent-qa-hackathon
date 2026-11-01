import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { DefectReportUpdateSchema } from '@silent-qa/shared';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: report, error } = await supabaseAdmin
      .from('reports')
      .select('*, complaints(note)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!report) {
      return NextResponse.json({ error: 'Defect report not found in database', id }, { status: 404 });
    }

    let testerName = 'QA Tester';
    let deviceTag = 'Station-01';
    if (Array.isArray(report.steps) && report.steps[0]) {
      const match = report.steps[0].match(/\[Tester:\s*([^•\]]+)(?:•\s*Device:\s*([^\]]+))?\]/);
      if (match) {
        testerName = match[1].trim();
        if (match[2]) deviceTag = match[2].trim();
      }
    }

    let suggestedFix = report.suggested_fix;
    if (!suggestedFix) {
      const text = ((report.root_cause || '') + ' ' + (report.actual || '') + ' ' + (report.title || '')).toLowerCase();
      if (text.includes('duplicate') || text.includes('race') || text.includes('count')) {
        suggestedFix = `// Fix: Debounce interaction and enforce idempotency key\nlet isSubmitting = false;\nasync function handleAction(payload) {\n  if (isSubmitting) return;\n  isSubmitting = true;\n  try {\n    await api.post('/action', payload, {\n      headers: { 'X-Idempotency-Key': crypto.randomUUID() }\n    });\n  } finally {\n    isSubmitting = false;\n  }\n}`;
      } else if (text.includes('undefined') || text.includes('typeerror') || text.includes('chargeid') || text.includes('read properties')) {
        suggestedFix = `// Fix: Defensive optional chaining and null checking\nconst handleResponse = (payload) => {\n  if (!payload || typeof payload !== 'object') {\n    console.warn('[Defect Shield] Invalid response payload', payload);\n    return null;\n  }\n  const chargeId = payload?.chargeId ?? payload?.data?.chargeId ?? null;\n  return chargeId;\n};`;
      } else {
        suggestedFix = `// Defensive guard patch for UI event handling\nif (!element || isProcessing) return;\ntry {\n  setIsProcessing(true);\n  await executeTransaction();\n} catch (err) {\n  reportTelemetryError(err);\n} finally {\n  setIsProcessing(false);\n}`;
      }
    }

    const rawNote = (report as any).complaints?.note || ((report as any).complaints?.[0]?.note) || report.title;

    return NextResponse.json({
      success: true,
      report: {
        ...report,
        raw_note: rawNote,
        suggested_fix: suggestedFix,
        tester_name: testerName,
        device_tag: deviceTag,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to fetch report', message: err?.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await req.json();
    const parsed = DefectReportUpdateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid update payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Update in Supabase
    const { error: updateErr } = await supabaseAdmin
      .from('reports')
      .update(parsed.data)
      .eq('id', id);

    if (updateErr) {
      return NextResponse.json(
        { error: 'Database update failed', details: updateErr.message },
        { status: 500 }
      );
    }

    // Log audit
    try {
      await supabaseAdmin.from('audit_log').insert({
        id: crypto.randomUUID(),
        action: 'REPORT_UPDATED',
        target_id: id,
        details: { ...parsed.data, actor_email: 'admin@silentqa.local' },
        timestamp: new Date().toISOString(),
      });
    } catch {}

    return NextResponse.json({
      success: true,
      updated_id: id,
      updates: parsed.data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to update report', message: err?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete linked cross-references first
    await supabaseAdmin.from('report_events').delete().eq('report_id', id);
    await supabaseAdmin.from('email_log').delete().eq('report_id', id);

    const { error: deleteErr } = await supabaseAdmin
      .from('reports')
      .delete()
      .eq('id', id);

    if (deleteErr) {
      return NextResponse.json(
        { error: 'Database delete failed', details: deleteErr.message },
        { status: 500 }
      );
    }

    // Log audit
    try {
      await supabaseAdmin.from('audit_log').insert({
        id: crypto.randomUUID(),
        action: 'REPORT_DELETED',
        target_id: id,
        details: { actor_email: 'admin@silentqa.local' },
        timestamp: new Date().toISOString(),
      });
    } catch {}

    return NextResponse.json({
      success: true,
      deleted_id: id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to delete report', message: err?.message },
      { status: 500 }
    );
  }
}


