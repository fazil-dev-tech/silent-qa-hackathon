import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET() {
  try {
    const { data: reports, error } = await supabaseAdmin
      .from('reports')
      .select('id, complaint_id, title, severity, steps, expected, actual, root_cause, confidence, playwright_script, status, ai_provider, ai_fallback, assignee_id, created_at, updated_at, complaints(note)')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const enrichedReports = (reports || []).map((r: any) => {
      let testerName = 'QA Tester';
      let deviceTag = 'Station-01';

      if (Array.isArray(r.steps) && r.steps[0]) {
        const match = r.steps[0].match(/\[Tester:\s*([^•\]]+)(?:•\s*Device:\s*([^\]]+))?\]/);
        if (match) {
          testerName = match[1].trim();
          if (match[2]) deviceTag = match[2].trim();
        }
      }

      // Synthesize deterministic code patch fix if not present
      let suggestedFix = r.suggested_fix;
      if (!suggestedFix) {
        const text = ((r.root_cause || '') + ' ' + (r.actual || '') + ' ' + (r.title || '')).toLowerCase();
        if (text.includes('duplicate') || text.includes('race') || text.includes('count')) {
          suggestedFix = `// Fix: Debounce interaction and enforce idempotency key\nlet isSubmitting = false;\nasync function handleAction(payload) {\n  if (isSubmitting) return;\n  isSubmitting = true;\n  try {\n    await api.post('/action', payload, {\n      headers: { 'X-Idempotency-Key': crypto.randomUUID() }\n    });\n  } finally {\n    isSubmitting = false;\n  }\n}`;
        } else if (text.includes('undefined') || text.includes('typeerror') || text.includes('chargeid') || text.includes('read properties')) {
          suggestedFix = `// Fix: Defensive optional chaining and null checking\nconst handleResponse = (payload) => {\n  if (!payload || typeof payload !== 'object') {\n    console.warn('[Defect Shield] Invalid response payload', payload);\n    return null;\n  }\n  const chargeId = payload?.chargeId ?? payload?.data?.chargeId ?? null;\n  return chargeId;\n};`;
        } else {
          suggestedFix = `// Defensive guard patch for UI event handling\nif (!element || isProcessing) return;\ntry {\n  setIsProcessing(true);\n  await executeTransaction();\n} catch (err) {\n  reportTelemetryError(err);\n} finally {\n  setIsProcessing(false);\n}`;
        }
      }

      const rawNote = r.complaints?.note || (Array.isArray(r.complaints) && r.complaints[0]?.note) || r.title;

      return {
        ...r,
        raw_note: rawNote,
        suggested_fix: suggestedFix,
        tester_name: testerName,
        device_tag: deviceTag,
      };
    });

    return NextResponse.json(
      {
        success: true,
        reports: enrichedReports,
      },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}

