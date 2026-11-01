import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { id, password } = await req.json();

    if (!id || !password) {
      return NextResponse.json(
        { error: 'Administrator ID and password are required' },
        { status: 400 }
      );
    }

    const cleanId = String(id).trim();
    const cleanPassword = String(password);

    // Verify authorized Admin credentials
    const isAuthorized = cleanId === 'TGVINCENZO' && cleanPassword === 'Adil123#';

    if (!isAuthorized) {
      // Audit failed admin attempt
      try {
        await supabaseAdmin.from('audit_log').insert({
          id: crypto.randomUUID(),
          action: 'ADMIN_LOGIN_FAILED',
          target_id: cleanId,
          details: { attempted_id: cleanId, ip: req.headers.get('x-forwarded-for') || 'local' },
          timestamp: new Date().toISOString(),
        });
      } catch {
        // non-blocking audit
      }

      return NextResponse.json(
        { error: 'Invalid Administrator ID or password' },
        { status: 401 }
      );
    }

    // Ensure admin profile exists in database
    const adminSessionId = '22222222-2222-2222-2222-222222222222';
    try {
      await supabaseAdmin.from('profiles').upsert(
        {
          id: adminSessionId,
          email: 'tgvincenzo@silentqa.internal',
          role: 'admin',
          org_id: '11111111-1111-1111-1111-111111111111',
        },
        { onConflict: 'email' }
      );

      await supabaseAdmin.from('audit_log').insert({
        id: crypto.randomUUID(),
        action: 'ADMIN_LOGIN_SUCCESS',
        target_id: adminSessionId,
        details: { admin_id: 'TGVINCENZO', role: 'admin' },
        timestamp: new Date().toISOString(),
      });
    } catch (dbErr: any) {
      console.warn('[Admin DB Warning]:', dbErr?.message);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Administrator authentication successful',
      user: {
        id: adminSessionId,
        name: 'TGVINCENZO',
        role: 'admin',
      },
      redirect: '/admin',
    });

    // Set secure HTTP-only session cookie
    response.cookies.set({
      name: 'sqa_session',
      value: JSON.stringify({
        id: adminSessionId,
        name: 'TGVINCENZO',
        email: 'tgvincenzo@silentqa.internal',
        role: 'admin',
        ts: Date.now(),
      }),
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Authentication service error', message: err?.message },
      { status: 500 }
    );
  }
}

