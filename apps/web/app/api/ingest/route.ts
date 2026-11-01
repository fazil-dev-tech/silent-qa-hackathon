import { NextResponse } from 'next/server';
import { IngestBatchSchema, computeFingerprint } from '@silent-qa/shared';
import { supabaseAdmin } from '@/lib/supabase';

// In-memory fallback event cache for development/demo harness
export const memoryEventsStore: any[] = [];

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

    // Enrich events with fingerprints and valid timestamps
    const enriched = events.map((e) => ({
      ...e,
      session_id,
      fingerprint: computeFingerprint(e.method, e.url, e.shape as any),
      ts: new Date(e.ts).toISOString(),
    }));

    // Cache in memory for instant local retrieval
    memoryEventsStore.push(...enriched);
    if (memoryEventsStore.length > 2000) {
      memoryEventsStore.splice(0, memoryEventsStore.length - 2000);
    }

    // Persist to Supabase if configured
    try {
      await supabaseAdmin.from('events').insert(enriched);
    } catch {
      // Continue gracefully if offline or mock
    }

    return NextResponse.json({
      success: true,
      ingested_count: enriched.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to ingest events', message: err?.message },
      { status: 500 }
    );
  }
}
