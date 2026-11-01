import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: logs, error } = await supabaseAdmin
      .from('audit_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mappedLogs = (logs || []).map((l) => ({
      ...l,
      actor_email: l.details?.actor_email || l.details?.tester_name || l.actor_id || 'admin@silentqa.local',
    }));

    return NextResponse.json({
      success: true,
      logs: mappedLogs,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action, target_id, details } = await req.json();

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('audit_log')
      .insert({
        id: crypto.randomUUID(),
        action,
        target_id: target_id || null,
        details: details || {},
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, log: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

