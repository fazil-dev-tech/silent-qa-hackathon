import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: Request) {
  try {
    const { email, phone, code, mode = 'login' } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and 6-digit verification code are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone ? String(phone).trim() : '';
    const cleanCode = code.trim();

    // 1. Compute submitted code hash
    const submittedHash = crypto.createHash('sha256').update(cleanCode + cleanEmail).digest('hex');

    // 2. Fetch the latest active unexpired OTP code from Supabase
    const { data: records, error: fetchErr } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('email', cleanEmail)
      .is('used_at', null)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchErr) {
      return NextResponse.json({ error: 'Database verification error: ' + fetchErr.message }, { status: 500 });
    }

    const activeOtp = records && records.length > 0 ? records[0] : null;

    if (!activeOtp) {
      return NextResponse.json(
        { error: 'No active verification code found or code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // 3. Verify match
    if (activeOtp.code_hash !== submittedHash) {
      // Increment attempt count
      const newAttempts = (activeOtp.attempts || 0) + 1;
      await supabaseAdmin.from('otp_codes').update({ attempts: newAttempts }).eq('id', activeOtp.id);

      return NextResponse.json(
        { error: `Invalid verification code. Attempts remaining: ${Math.max(0, 5 - newAttempts)}` },
        { status: 400 }
      );
    }

    // 4. Mark code as successfully used
    await supabaseAdmin
      .from('otp_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', activeOtp.id);

    // 5. Organization association in Supabase
    let orgId = '11111111-1111-1111-1111-111111111111';
    try {
      const { data: defaultOrg } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .limit(1)
        .maybeSingle();
      if (defaultOrg?.id) {
        orgId = defaultOrg.id;
      }
    } catch {
      // fallback
    }

    // Default role for registered users is 'tester' (roles input removed)
    const validRole = 'tester';
    const { data: profile, error: profErr } = await supabaseAdmin
      .from('profiles')
      .upsert({
        email: cleanEmail,
        role: validRole,
        org_id: orgId,
      }, { onConflict: 'email' })
      .select('id, email, role, org_id')
      .single();

    if (profErr) {
      console.warn('[Profile Upsert Warning]:', profErr.message);
    }

    // Log to audit trail
    try {
      await supabaseAdmin.from('audit_log').insert({
        id: crypto.randomUUID(),
        action: mode === 'register' ? 'USER_REGISTERED' : 'USER_LOGIN',
        target_id: profile?.id || cleanEmail,
        details: { email: cleanEmail, phone: cleanPhone, role: validRole },
        timestamp: new Date().toISOString(),
      });
    } catch {
      // non-blocking
    }

    // Always redirect regular users to /app
    const targetRedirect = '/app';

    // 6. Return verified session payload & set auth cookie
    const response = NextResponse.json(
      {
        success: true,
        message: 'Verification successful',
        user: {
          email: cleanEmail,
          phone: cleanPhone,
          role: validRole,
          org_id: orgId,
        },
        redirect: targetRedirect,
      },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );

    response.cookies.set({
      name: 'sqa_session',
      value: JSON.stringify({ email: cleanEmail, phone: cleanPhone, role: validRole, ts: Date.now() }),
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Verification failed', message: err?.message },
      { status: 500 }
    );
  }
}

