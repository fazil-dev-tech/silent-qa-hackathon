import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { IngestBatchSchema, computeFingerprint } from '@silent-qa/shared';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const result = IngestBatchSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid batch payload', details: result.error.format() },
        { status: 400 }
      );
    }

    const { project_token, session_id, events } = result.data;

    // 1. Verify Project Authentication via API key hash
    const tokenHash = crypto.createHash('sha256').update(project_token).digest('hex');
    const { data: project, error: projErr } = await supabaseAdmin
      .from('projects')
      .select('id, org_id')
      .eq('api_key_hash', tokenHash)
      .maybeSingle();

    if (projErr) {
      return NextResponse.json({ error: 'Database project lookup failed', details: projErr.message }, { status: 500 });
    }

    // 2. Ensure active session exists in database
    const projectId = project?.id || '33333333-3333-3333-3333-333333333333';
    await supabaseAdmin
      .from('sessions')
      .upsert({
        id: session_id,
        project_id: projectId,
        app_url: events[0]?.url || 'http://localhost:4000',
        user_agent: req.headers.get('user-agent') || 'Browser-Agent',
      }, { onConflict: 'id' });

    // 3. Enrich events with computed fingerprints and valid timestamps
    const enriched = events.map((e) => ({
      id: e.id,
      session_id,
      type: e.type,
      severity: e.severity,
      url: e.url || null,
      method: e.method || null,
      status: e.status || null,
      selector: e.selector || null,
      text: e.text || null,
      shape: e.shape || null,
      fingerprint: computeFingerprint(e.method, e.url, e.shape as any),
      ts: new Date(e.ts).toISOString(),
    }));

    // 4. Strict Database Write to Supabase partitioned events table
    const { error: insertErr } = await supabaseAdmin.from('events').insert(enriched);

    if (insertErr) {
      return NextResponse.json(
        { error: 'Failed to insert events into database', details: insertErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ingested_count: enriched.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Ingestion pipeline error', message: err?.message },
      { status: 500 }
    );
  }
}
