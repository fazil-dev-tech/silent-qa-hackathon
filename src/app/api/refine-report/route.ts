import { NextRequest } from 'next/server';
import { callNvidiaLLM } from '@/lib/nvidia';
import { REFINE_REPORT_SYSTEM, buildRefinePrompt } from '@/lib/prompts';
import { computeSHA256Sync } from '@/lib/hash';

export async function POST(request: NextRequest) {
  try {
    const { currentReport, instruction } = await request.json();

    if (!currentReport || !instruction) {
      return Response.json(
        { error: 'currentReport and instruction are required' },
        { status: 400 }
      );
    }

    const prompt = buildRefinePrompt(
      JSON.stringify(currentReport, null, 2),
      instruction
    );

    const aiResponse = await callNvidiaLLM(REFINE_REPORT_SYSTEM, prompt);

    let refinedReport;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      refinedReport = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
    } catch {
      return Response.json(
        { error: 'Failed to parse AI response', raw: aiResponse },
        { status: 500 }
      );
    }

    const shaHash = computeSHA256Sync(JSON.stringify(refinedReport));

    return Response.json({
      report: {
        ...refinedReport,
        shaHash,
        refinedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error('Refine report error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
