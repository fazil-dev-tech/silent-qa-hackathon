import { NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  ComplaintSubmissionSchema,
  rankEventsForMapper,
  buildSignalSummary,
  generatePlaywrightReproductionScript,
} from '@silent-qa/shared';
import type { TelemetryEvent } from '@silent-qa/shared';
import { generateDefectReport } from '@/lib/llm';
import { supabaseAdmin, ensureUUID } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = ComplaintSubmissionSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid complaint submission', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { session_id, note, picked_selector, tester_name, device_tag, recent_event_id, submitted_at } = parsed.data;
    const safeSessionId = ensureUUID(session_id);

    // 1. Record Complaint in Supabase
    const complaintId = crypto.randomUUID();
    const windowStartIso = new Date(submitted_at - 180000).toISOString();
    const windowEndIso = new Date(submitted_at + 5000).toISOString();

    const { error: complaintErr } = await supabaseAdmin.from('complaints').insert({
      id: complaintId,
      session_id: safeSessionId,
      note,
      picked_selector: picked_selector || null,
      submitted_at: new Date(submitted_at).toISOString(),
      window_start: windowStartIso,
      window_end: windowEndIso,
    });

    if (complaintErr) {
      console.warn('Complaint insert warning:', complaintErr.message);
    }

    // 2. Fetch Real Telemetry from Supabase Events Table
    const { data: dbEvents, error: eventsErr } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('session_id', safeSessionId)
      .gte('ts', windowStartIso)
      .lte('ts', windowEndIso)
      .order('ts', { ascending: false });

    if (eventsErr) {
      return NextResponse.json(
        { error: 'Database event retrieval failed', details: eventsErr.message },
        { status: 500 }
      );
    }

    // Normalize events for mapper
    const candidateEvents: TelemetryEvent[] = (dbEvents || []).map((e) => ({
      id: e.id,
      session_id: e.session_id,
      ts: new Date(e.ts).getTime(),
      type: e.type,
      severity: e.severity,
      url: e.url,
      method: e.method,
      status: e.status,
      selector: e.selector,
      text: e.text,
      shape: e.shape,
      fingerprint: e.fingerprint,
    }));

    // 3. Rank events and summarize signals (Anchoring recent event if clicked in popup)
    const rankedEvents = rankEventsForMapper(candidateEvents, note, picked_selector, 25, recent_event_id);
    const signalSummary = buildSignalSummary(rankedEvents);

    // 4. Generate AI defect report with deterministic fallback
    const { report: generatedReport, isFallback } = await generateDefectReport(
      note,
      rankedEvents,
      signalSummary
    );

    // 5. Synthesize automated Playwright reproduction script
    const playwrightScript = generatePlaywrightReproductionScript(generatedReport, rankedEvents);

    const reportId = crypto.randomUUID();
    const enrichedSteps = [
      `[Tester: ${tester_name || 'Engineer #1'} • Device: ${device_tag || 'Station-01'}] Browser flight session initialized`,
      ...generatedReport.steps,
    ];

    const fullReport = {
      id: reportId,
      complaint_id: complaintId,
      title: generatedReport.title,
      severity: generatedReport.severity,
      steps: enrichedSteps,
      expected: generatedReport.expected,
      actual: generatedReport.actual,
      root_cause: generatedReport.root_cause_hypothesis,
      confidence: generatedReport.confidence,
      evidence: rankedEvents,
      evidence_ids: rankedEvents.map((e) => e.id),
      playwright_script: playwrightScript,
      status: 'draft',
      ai_fallback: isFallback,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 6. Persist Defect Report directly to Supabase
    const { error: reportInsertErr } = await supabaseAdmin.from('reports').insert(fullReport);
    if (reportInsertErr) {
      return NextResponse.json(
        { error: 'Failed to save defect report to database', details: reportInsertErr.message },
        { status: 500 }
      );
    }

    // 7. Save evidence linkages in report_events cross-reference table
    if (rankedEvents.length > 0) {
      const linkRows = rankedEvents.map((e) => ({
        report_id: reportId,
        event_id: e.id,
      }));
      try {
        await supabaseAdmin.from('report_events').insert(linkRows);
      } catch {
        // Linkage errors should not fail complaint processing
      }
    }

    // 8. Record audit log with multi-tester attribution
    try {
      await supabaseAdmin.from('audit_log').insert({
        id: crypto.randomUUID(),
        action: 'REPORT_SYNTHESIZED',
        target_id: reportId,
        actor_email: tester_name || 'tester@silentqa.local',
        details: {
          title: fullReport.title,
          severity: fullReport.severity,
          is_fallback: isFallback,
          tester_name: tester_name || 'Engineer #1',
          device_tag: device_tag || 'Station-01',
          session_id: safeSessionId,
          recent_event_id: recent_event_id || null,
        },
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Audit non-blocking
    }

    return NextResponse.json({
      success: true,
      report: fullReport,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to process complaint', message: err?.message },
      { status: 500 }
    );
  }
}
