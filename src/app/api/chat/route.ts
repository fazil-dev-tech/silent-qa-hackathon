import { NextRequest } from 'next/server';
import { callNvidiaLLMWithHistory } from '@/lib/nvidia';
import { CHATBOT_SYSTEM } from '@/lib/prompts';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { message, history, sessionId } = await request.json();

    if (!message) {
      return Response.json({ error: 'message is required' }, { status: 400 });
    }

    // Fetch recent events from Supabase for context
    let contextData = '';
    if (sessionId) {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);
      const { data: events } = await supabase
        .from('captured_events')
        .select('event_type, severity, payload, timestamp')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (events && events.length > 0) {
        contextData = `\n\nCAPTURED EVENTS DATA (from browser extension):\n${events
          .map(
            (e: Record<string, unknown>) =>
              `[${e.event_type}] ${e.severity || 'info'}: ${JSON.stringify(e.payload).substring(0, 200)}`
          )
          .join('\n')}`;
      }
    }

    const systemPrompt = CHATBOT_SYSTEM + contextData;
    const messages = [
      ...(history || []).slice(-10),
      { role: 'user' as const, content: message },
    ];

    const response = await callNvidiaLLMWithHistory(systemPrompt, messages, {
      temperature: 0.5,
      maxTokens: 1024,
    });

    return Response.json({ response });
  } catch (error: unknown) {
    console.error('Chat error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
