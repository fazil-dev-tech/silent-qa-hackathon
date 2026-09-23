import { NextRequest } from 'next/server';
import { callNvidiaLLM } from '@/lib/nvidia';
import { GENERATE_REPORT_SYSTEM, buildReportPrompt } from '@/lib/prompts';
import { computeSHA256Sync } from '@/lib/hash';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { sendQAReportEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rawNote, sessionId, pageUrl } = body;

    if (!rawNote) {
      return Response.json({ error: 'rawNote is required' }, { status: 400 });
    }

    // Fetch matching evidence from Supabase
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    let evidence: Record<string, unknown>[] = [];

    if (sessionId) {
      // Strategy 1: Time-based — get events from last 120 seconds
      const { data: timeEvents } = await supabase
        .from('captured_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false })
        .limit(50);

      // Strategy 2: Keyword-based — search for keywords in payloads
      const keywords = rawNote
        .toLowerCase()
        .split(/\s+/)
        .filter((w: string) => w.length > 3);

      // Strategy 3: Filter by severity (errors and warnings first)
      if (timeEvents) {
        evidence = timeEvents.map((event: Record<string, unknown>) => {
          let relevanceScore = 0.5;

          // Boost errors/warnings
          if (event.severity === 'error' || event.severity === 'critical') relevanceScore += 0.3;
          if (event.severity === 'warning') relevanceScore += 0.15;

          // Boost keyword matches
          const payloadStr = JSON.stringify(event.payload || {}).toLowerCase();
          const matchedKeywords = keywords.filter((k: string) => payloadStr.includes(k));
          relevanceScore += matchedKeywords.length * 0.1;

          // Boost if same page URL
          if (pageUrl && (event.source_url as string || '').includes(pageUrl)) {
            relevanceScore += 0.15;
          }

          return { ...event, relevanceScore: Math.min(relevanceScore, 1.0) };
        });

        // Sort by relevance and take top 15
        evidence.sort((a, b) => (b.relevanceScore as number) - (a.relevanceScore as number));
        evidence = evidence.slice(0, 15);
      }
    }

    // Call NVIDIA LLM to generate the report
    const prompt = buildReportPrompt(rawNote, evidence, pageUrl);
    const aiResponse = await callNvidiaLLM(GENERATE_REPORT_SYSTEM, prompt);

    // Parse the AI response as JSON
    let report;
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      report = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
    } catch {
      // If parsing fails, create a structured report from raw text
      report = {
        title: rawNote,
        severity: 'major',
        environment: 'Unable to parse — see raw AI response',
        stepsToReproduce: [rawNote],
        expectedResult: 'To be determined',
        actualResult: rawNote,
        technicalEvidence: aiResponse,
        rootCauseHypothesis: 'Requires manual analysis',
        confidenceScore: 0.3,
        confidenceReason: 'AI response could not be parsed into structured format',
      };
    }

    // Compute SHA-256 hash of the report content
    const reportContent = JSON.stringify(report);
    const shaHash = computeSHA256Sync(reportContent);

    // Save to Supabase
    const { data: savedReport, error: saveError } = await supabase
      .from('defect_reports')
      .insert({
        session_id: sessionId || null,
        raw_summary: rawNote,
        flagged_at: new Date().toISOString(),
        enhanced_title: report.title,
        enhanced_description: JSON.stringify(report),
        steps_to_reproduce: report.stepsToReproduce,
        expected_result: report.expectedResult,
        actual_result: report.actualResult,
        technical_evidence: { findings: report.technicalEvidence, rootCause: report.rootCauseHypothesis },
        environment_info: { environment: report.environment },
        severity: report.severity,
        status: 'generated',
        ai_model_used: process.env.NVIDIA_MODEL || 'meta/llama-3.1-8b-instruct',
        ai_confidence_score: report.confidenceScore,
        extracted_context: { evidence, sha256: shaHash },
      })
      .select()
      .single();

    // Trigger Email Delivery
    const emailSubject = `[QA Defect - ${report.severity?.toUpperCase() || 'UNKNOWN'}] ${report.title || rawNote}`;
    const emailBody = `
Title: ${report.title}
Severity: ${report.severity}
Environment: ${report.environment}
      
Steps to Reproduce:
${Array.isArray(report.stepsToReproduce) ? report.stepsToReproduce.join('\n') : report.stepsToReproduce}
      
Expected: ${report.expectedResult}
Actual: ${report.actualResult}
      
Root Cause Hypothesis:
${report.rootCauseHypothesis}

Confidence Score: ${report.confidenceScore}
      
Technical Evidence:
${typeof report.technicalEvidence === 'string' ? report.technicalEvidence : JSON.stringify(report.technicalEvidence)}
    `;
    
    // Fire and forget so we don't block the UI response
    const recipient = process.env.GMAIL_USER || 'qa-team@example.com';
    sendQAReportEmail(recipient, emailSubject, emailBody).catch(console.error);

    return Response.json({
      report: {
        ...report,
        id: savedReport?.id,
        shaHash,
        rawNote,
        evidence: evidence.slice(0, 10),
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error('Generate report error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
