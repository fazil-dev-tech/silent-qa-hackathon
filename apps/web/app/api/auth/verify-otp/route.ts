import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, code, mode = 'login', org_name, role = 'tester' } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and 6-digit verification code are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
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

    // 5. Registration / Profile Resolution in Supabase
    let orgId: string | null = null;

    if (mode === 'register' && org_name) {
      // Find or create organization
      const cleanOrgName = org_name.trim();
      const { data: existingOrg } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .eq('name', cleanOrgName)
        .maybeSingle();

      if (existingOrg) {
        orgId = existingOrg.id;
      } else {
        const { data: newOrg } = await supabaseAdmin
          .from('organizations')
          .insert({ name: cleanOrgName })
          .select('id')
          .single();
        orgId = newOrg?.id || null;
      }
    }

    if (!orgId) {
      // Default fallback organization
      const { data: defaultOrg } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .limit(1)
        .maybeSingle();
      orgId = defaultOrg?.id || '11111111-1111-1111-1111-111111111111';
    }

    // Upsert user profile
    const validRole = role === 'lead' ? 'lead' : role === 'admin' ? 'admin' : 'tester';
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

    // Determine target redirect
    const targetRedirect = validRole === 'lead' || validRole === 'admin' ? '/admin' : '/app';

    // 6. Return verified session payload & set auth cookie
    const response = NextResponse.json({
      success: true,
      message: 'Verification successful',
      user: {
        email: cleanEmail,
        role: validRole,
        org_id: orgId,
      },
      redirect: targetRedirect,
    });

    response.cookies.set({
      name: 'sqa_session',
      value: JSON.stringify({ email: cleanEmail, role: validRole, ts: Date.now() }),
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
