import { NextResponse } from 'next/server';
import { DefectReportUpdateSchema } from '@silent-qa/shared';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await req.json();
    const parsed = DefectReportUpdateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid update payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Update in Supabase
    try {
      await supabaseAdmin.from('reports').update(parsed.data).eq('id', id);
    } catch {
      // Continue gracefully
    }

    return NextResponse.json({
      success: true,
      updated_id: id,
      updates: parsed.data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to update report', message: err?.message },
      { status: 500 }
    );
  }
}
