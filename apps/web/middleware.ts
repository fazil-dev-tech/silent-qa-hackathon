import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionCookie = req.cookies.get('sqa_session');

  let session: { role?: string; email?: string; name?: string } | null = null;
  if (sessionCookie?.value && sessionCookie.value.trim() !== '') {
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      session = null;
    }
  }

  const isAuthenticated = Boolean(session && (session.email || session.name || session.role));
  const isAdmin = session?.role === 'admin';

  // 1. Tool and Dashboard Route Protection
  // Users must be authenticated before accessing /app or /admin
  if (pathname.startsWith('/app') || pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Admin-only protection for /admin routes
    if (pathname.startsWith('/admin') && !isAdmin) {
      return NextResponse.redirect(new URL('/app', req.url));
    }
  }

  // 2. Redirect already logged-in users away from /login
  if (pathname === '/login' && isAuthenticated) {
    const target = isAdmin ? '/admin' : '/app';
    return NextResponse.redirect(new URL(target, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app', '/app/:path*', '/admin', '/admin/:path*', '/login'],
};

