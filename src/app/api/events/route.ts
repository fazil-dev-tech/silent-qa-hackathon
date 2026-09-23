import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events, sessionId } = body;

    if (!events || !Array.isArray(events)) {
      return Response.json({ error: 'events array is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Create session if needed
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const { data: session } = await supabase
        .from('sessions')
        .insert({
          qa_engineer: body.qaEngineer || 'Extension User',
          project_name: body.projectName || 'Default',
          page_url: body.pageUrl || '',
          browser_info: body.browserInfo || {},
          is_active: true,
        })
        .select()
        .single();
      activeSessionId = session?.id;
    }

    // Batch insert events
    const eventsWithSession = events.map((event: Record<string, unknown>) => ({
      ...event,
      session_id: activeSessionId,
    }));

    const { error } = await supabase
      .from('captured_events')
      .insert(eventsWithSession);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      sessionId: activeSessionId,
      eventsStored: events.length,
    });
  } catch (error: unknown) {
    console.error('Store events error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
