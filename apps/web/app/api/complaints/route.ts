import { NextResponse } from 'next/server';
import {
  ComplaintSubmissionSchema,
  rankEventsForMapper,
  buildSignalSummary,
  generatePlaywrightReproductionScript,
} from '@silent-qa/shared';
import { generateDefectReport } from '@/lib/llm';
import { supabaseAdmin } from '@/lib/supabase';
import { memoryEventsStore } from '../ingest/route';

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

    const { session_id, note, picked_selector, submitted_at } = parsed.data;

    // 1. Adaptive Temporal Window: [submitted_at - 60s, submitted_at] (dynamic up to 300s)
    const windowStart = submitted_at - 180000; // 3-minute adaptive window
    const candidateEvents = memoryEventsStore.filter((e) => {
      const eventTs = new Date(e.ts).getTime();
      return eventTs >= windowStart && eventTs <= submitted_at + 5000;
    });

    // 2. Rank events & build signal summary
    const rankedEvents = rankEventsForMapper(candidateEvents, note, picked_selector, 25);
    const signalSummary = buildSignalSummary(rankedEvents);

    // 3. AI synthesis with deterministic fallback
    const { report: generatedReport, isFallback } = await generateDefectReport(
      note,
      rankedEvents,
      signalSummary
    );

    // 4. Synthesize executable Playwright test script
    const playwrightScript = generatePlaywrightReproductionScript(generatedReport, rankedEvents);

    const reportId = 'rep_' + Math.random().toString(36).slice(2, 10);
    const fullReport = {
      id: reportId,
      ...generatedReport,
      playwright_script: playwrightScript,
      status: 'draft',
      ai_fallback: isFallback,
      evidence_snapshot: rankedEvents,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 5. Persist to Supabase if configured
    try {
      await supabaseAdmin.from('reports').insert({
        id: reportId,
        title: fullReport.title,
        severity: fullReport.severity,
        steps: fullReport.steps,
        expected: fullReport.expected,
        actual: fullReport.actual,
        root_cause: fullReport.root_cause_hypothesis,
        confidence: fullReport.confidence,
        evidence: rankedEvents,
        evidence_ids: fullReport.evidence_ids,
        playwright_script: playwrightScript,
        status: 'draft',
        ai_fallback: isFallback,
      });
    } catch {
      // Continue gracefully
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
