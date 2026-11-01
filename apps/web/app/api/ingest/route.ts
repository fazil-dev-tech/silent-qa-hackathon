import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { IngestBatchSchema, computeFingerprint } from '@silent-qa/shared';
import { supabaseAdmin, ensureUUID } from '@/lib/supabase';

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

    const { project_token, session_id, tester_name, device_tag, events } = result.data;
    const safeSessionId = ensureUUID(session_id);

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

    // 2. Ensure active session exists in database with tester attribution
    const projectId = project?.id || '33333333-3333-3333-3333-333333333333';
    const clientAppUrl = events.find((e) => e.url && e.url.startsWith('http'))?.url ||
      req.headers.get('origin') ||
      req.headers.get('referer') ||
      'https://production-app';

    const rawAgent = req.headers.get('user-agent') || 'Browser-Agent';
    const enrichedAgent = tester_name || device_tag
      ? `[Tester: ${tester_name || 'QA Engineer'}] [Device: ${device_tag || 'Workstation'}] ${rawAgent}`
      : rawAgent;

    await supabaseAdmin
      .from('sessions')
      .upsert({
        id: safeSessionId,
        project_id: projectId,
        app_url: clientAppUrl,
        user_agent: enrichedAgent,
      }, { onConflict: 'id' });

    // 3. Enrich events with computed fingerprints, shape metadata, and valid timestamps
    const enriched = events.map((e) => {
      const mergedShape: Record<string, unknown> = {
        ...(typeof e.shape === 'object' && e.shape !== null ? e.shape : {}),
      };

      if (e.duration_ms !== undefined) mergedShape.duration_ms = e.duration_ms;
      if ((e.metadata as any)?.duration_ms !== undefined) mergedShape.duration_ms = (e.metadata as any).duration_ms;
      if ((e.metadata as any)?.domSnapshot) mergedShape.domSnapshot = (e.metadata as any).domSnapshot;
      if ((e as any).domSnapshot) mergedShape.domSnapshot = (e as any).domSnapshot;
      if ((e.metadata as any)?.relative_ms !== undefined) mergedShape.relative_ms = (e.metadata as any).relative_ms;
      if ((e as any).relative_ms !== undefined) mergedShape.relative_ms = (e as any).relative_ms;
      if ((e.metadata as any)?.coordinates) mergedShape.coordinates = (e.metadata as any).coordinates;
      mergedShape.iso_timestamp = (e as any).iso_timestamp || new Date(e.ts).toISOString();

      return {
        id: ensureUUID(e.id),
        session_id: safeSessionId,
        type: e.type,
        severity: e.severity || 'info',
        url: e.url || null,
        method: e.method || null,
        status: e.status || null,
        selector: e.selector || null,
        text: e.text || null,
        shape: mergedShape,
        fingerprint: computeFingerprint(e.method, e.url, mergedShape as any),
        ts: new Date(e.ts).toISOString(),
      };
    });

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
