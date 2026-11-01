import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: reports, error } = await supabaseAdmin
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const enrichedReports = (reports || []).map((r) => {
      let testerName = 'QA Tester';
      let deviceTag = 'Station-01';

      if (Array.isArray(r.steps) && r.steps[0]) {
        const match = r.steps[0].match(/\[Tester:\s*([^•\]]+)(?:•\s*Device:\s*([^\]]+))?\]/);
        if (match) {
          testerName = match[1].trim();
          if (match[2]) deviceTag = match[2].trim();
        }
      }

      return {
        ...r,
        tester_name: testerName,
        device_tag: deviceTag,
      };
    });

    return NextResponse.json({
      success: true,
      reports: enrichedReports,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

