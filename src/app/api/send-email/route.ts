import { NextRequest } from 'next/server';
import { sendQAReportEmail as sendDefectEmail } from '@/lib/email';
import { computeSHA256Sync } from '@/lib/hash';

export async function POST(request: NextRequest) {
  try {
    const { to, report, reportedBy } = await request.json();

    if (!to || !report) {
      return Response.json(
        { error: 'to (email) and report are required' },
        { status: 400 }
      );
    }

    const shaHash = computeSHA256Sync(JSON.stringify(report));

    const subject = `[QA Defect - ${report.severity?.toUpperCase() || 'UNKNOWN'}] ${report.title || 'Defect Report'}`;
    const reportContent = `
Title: ${report.title}
Severity: ${report.severity}
Environment: ${report.environment}

Steps to Reproduce:
${Array.isArray(report.stepsToReproduce) ? report.stepsToReproduce.join('\\n') : report.stepsToReproduce}

Expected Result: ${report.expectedResult}
Actual Result: ${report.actualResult}

Root Cause Hypothesis:
${report.rootCauseHypothesis}

Confidence Score: ${report.confidenceScore}

Reported By: ${reportedBy || 'QA Engineer'}
Date: ${new Date().toLocaleString()}
`;

    const result = await sendDefectEmail(to, subject, reportContent);

    return Response.json(result);
  } catch (error: unknown) {
    console.error('Send email error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message, success: false }, { status: 500 });
  }
}
