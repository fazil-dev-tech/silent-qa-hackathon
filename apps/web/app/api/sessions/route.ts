import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: sessions, error } = await supabaseAdmin
      .from('sessions')
      .select('id, app_url, user_agent, started_at, ended_at')
      .order('started_at', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with parsed tester tag and readable labels
    const enriched = (sessions || []).map((s) => {
      let tester = 'Engineer';
      let device = 'Station';
      if (s.user_agent) {
        const testerMatch = s.user_agent.match(/\[Tester:\s*([^\]]+)\]/);
        const deviceMatch = s.user_agent.match(/\[Device:\s*([^\]]+)\]/);
        if (testerMatch) tester = testerMatch[1];
        if (deviceMatch) device = deviceMatch[1];
      }

      let host = 'Active Tab';
      try {
        if (s.app_url && s.app_url.startsWith('http')) {
          const u = new URL(s.app_url);
          host = `${u.hostname}${u.port ? ':' + u.port : ''}${u.pathname !== '/' ? u.pathname : ''}`;
        }
      } catch {}

      return {
        id: s.id,
        app_url: s.app_url,
        host,
        tester,
        device,
        started_at: s.started_at,
      };
    });

    return NextResponse.json({
      success: true,
      sessions: enriched,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to list sessions' }, { status: 500 });
  }
}
