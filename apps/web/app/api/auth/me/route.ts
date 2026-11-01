import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('sqa_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const user = JSON.parse(sessionCookie.value);
    return NextResponse.json({
      authenticated: true,
      user: {
        name: user.name || (user.email ? user.email.split('@')[0] : 'User'),
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'tester',
        loginTime: user.ts || Date.now(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, user: null });
  }
}

