import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const res = NextResponse.json({
      success: true,
      message: 'Signed out successfully',
    });

    res.cookies.set({
      name: 'sqa_session',
      value: '',
      path: '/',
      maxAge: 0,
      httpOnly: true,
      sameSite: 'lax',
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 });
  }
}

