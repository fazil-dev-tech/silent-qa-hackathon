import { NextResponse } from 'next/server';
import { supabaseAdmin, ensureUUID } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { message, history = [], report_id, session_id } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 1. Gather Live Context from Supabase PostgreSQL Database
    let activeReport: any = null;
    if (report_id) {
      const { data: rep } = await supabaseAdmin
        .from('reports')
        .select('*')
        .eq('id', report_id)
        .maybeSingle();
      activeReport = rep;
    }

    // Fetch recent fleet reports from Supabase
    const { data: recentReports } = await supabaseAdmin
      .from('reports')
      .select('id, title, severity, status, steps, expected, actual, root_cause, created_at')
      .order('created_at', { ascending: false })
      .limit(6);

    // Fetch recent telemetry events (errors, signals, clicks)
    let recentEvents: any[] = [];
    if (session_id) {
      const { data: sEvts } = await supabaseAdmin
        .from('events')
        .select('id, type, severity, selector, text, url, method, status, ts')
        .eq('session_id', ensureUUID(session_id))
        .order('ts', { ascending: false })
        .limit(15);
      recentEvents = sEvts || [];
    } else {
      const { data: gEvts } = await supabaseAdmin
        .from('events')
        .select('id, type, severity, selector, text, url, method, status, ts')
        .order('ts', { ascending: false })
        .limit(15);
      recentEvents = gEvts || [];
    }

    // 2. Build Rich Knowledge Context
    const activeReportContext = activeReport
      ? `ACTIVE SELECTED REPORT:
- ID: ${activeReport.id}
- Title: ${activeReport.title}
- Severity: ${activeReport.severity}
- Status: ${activeReport.status}
- Steps to Reproduce: ${JSON.stringify(activeReport.steps || [])}
- Expected Behavior: ${activeReport.expected}
- Actual Behavior: ${activeReport.actual}
- AI Root Cause Hypothesis: ${activeReport.root_cause}
- Evidence Events Count: ${Array.isArray(activeReport.evidence) ? activeReport.evidence.length : 0}
- Playwright Script Available: ${Boolean(activeReport.playwright_script)}`
      : 'No specific report currently selected by user.';

    const recentReportsSummary = (recentReports || [])
      .map(
        (r, i) =>
          `[Report #${i + 1}] "${r.title}" (Severity: ${r.severity}, Status: ${r.status}) - Root cause: ${r.root_cause || 'Under investigation'}`
      )
      .join('\n');

    const recentEventsSummary = recentEvents
      .map(
        (e) =>
          `• [${e.type.toUpperCase()}] ${e.method ? `${e.method} ` : ''}${e.url || e.selector || e.text || 'Event'} -> Status/Severity: ${e.status || e.severity}`
      )
      .join('\n');

    const systemPrompt = `You are Silent QA Copilot — an expert Principal Software Engineer and autonomous QA Architect.
You have real-time live access to the Silent QA Supabase PostgreSQL database and telemetry flight recorder.

=== LIVE SUPABASE DATABASE CONTEXT ===
${activeReportContext}

=== RECENT FLEET DEFECT REPORTS ===
${recentReportsSummary || 'No recent reports found.'}

=== RECENT TELEMETRY EVENTS RECORDED BY FLIGHT RECORDER ===
${recentEventsSummary || 'No recent events recorded.'}

=== CORE CAPABILITIES & INSTRUCTIONS ===
1. Answer questions about tested buttons, components, API endpoints, and reproduction sequences with precision.
2. For questions like "what is the problem in button 2 / checkout button / save button?", refer directly to the active report or the telemetry events above. Specify the exact selector (e.g. button#checkout, button#save-draft), the user action (click/dead-click), the network failure (e.g. 500 error or duplicate POST request), and the root cause.
3. Provide code-level fixes (React, TypeScript, Node.js, Express) to solve race conditions, duplicate API requests, missing error boundaries, or unhandled exceptions.
4. If requested, provide or explain Playwright automated reproduction test scripts.
5. Keep your tone professional, concise, insightful, and engineering-focused. Use markdown for code blocks and bold highlights.`;

    // 3. Dispatch to OpenRouter AI (or Gemini / local fallback)
    const baseUrl = process.env.LLM_BASE_URL || 'https://openrouter.ai/api/v1';
    const apiKey = process.env.LLM_API_KEY || '';
    const model = process.env.LLM_MODEL || 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free';

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map((h: any) => ({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: String(h.content),
      })),
      { role: 'user', content: message },
    ];

    let aiReply = '';
    try {
      const aiRes = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://silentqa.dev',
          'X-Title': 'Silent QA Copilot',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.3,
          max_tokens: 800,
        }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        aiReply = aiData?.choices?.[0]?.message?.content || '';
      }
    } catch (e: any) {
      console.warn('OpenRouter Chat Copilot fallback triggered:', e?.message);
    }

    // 4. Deterministic Intelligent Fallback if API key quota exceeded or offline
    if (!aiReply.trim()) {
      if (activeReport) {
        const qLower = message.toLowerCase();
        if (qLower.includes('button') || qLower.includes('click') || qLower.includes('problem') || qLower.includes('issue')) {
          aiReply = `Based on live telemetry for **${activeReport.title}**:\n\n- **Problem Identified**: The button interaction resulted in: *${activeReport.actual}*.\n- **Expected**: *${activeReport.expected}*.\n- **Root Cause Hypothesis**: ${activeReport.root_cause || 'Unresponsive event listener or server 500 error.'}\n- **Reproduction Steps**:\n${(activeReport.steps || []).map((s: string, idx: number) => `  ${idx + 1}. ${s}`).join('\n')}\n\nYou can run the automated in-browser reproduction probe using the Playwright runner on this report.`;
        } else if (qLower.includes('fix') || qLower.includes('code') || qLower.includes('solution')) {
          aiReply = `To fix this issue (**${activeReport.title}**):\n\n\`\`\`typescript\n// Recommended Frontend Fix\nconst handleButtonClick = async (e: React.MouseEvent) => {\n  e.preventDefault();\n  if (isSubmitting) return; // Prevent duplicate requests / race conditions\n  setIsSubmitting(true);\n  try {\n    const response = await fetch('/api/action', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify(payload),\n    });\n    if (!response.ok) throw new Error(\`Server error: \${response.status}\`);\n    // Update UI state\n  } catch (err) {\n    showErrorMessage(err.message);\n  } finally {\n    setIsSubmitting(false);\n  }\n};\n\`\`\`\n\nEnsure idempotency keys are passed to backend mutations to avoid duplicate processing.`;
        } else {
          aiReply = `**Silent QA Copilot Report Analysis**:\n\n- **Active Defect**: ${activeReport.title} (Severity: ${activeReport.severity.toUpperCase()})\n- **Status**: ${activeReport.status.toUpperCase()}\n- **AI Causal Finding**: ${activeReport.root_cause}\n\nAsk me anything specific like *"How do I fix this in code?"* or *"Show me the Playwright reproduction script"*.`;
        }
      } else {
        aiReply = `I am connected to the Supabase database with **${recentReports?.length || 0} recent fleet defect reports** and live flight recorder telemetry. Select any report or ask me about recent component anomalies!`;
      }
    }

    return NextResponse.json({
      success: true,
      reply: aiReply,
      meta: {
        active_report_id: activeReport?.id || null,
        active_report_title: activeReport?.title || null,
        events_referenced: recentEvents.length,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'QA Copilot error', details: err?.message },
      { status: 500 }
    );
  }
}

