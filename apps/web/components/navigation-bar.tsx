'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, LogOut, ShieldCheck, ChevronRight } from 'lucide-react';

interface AuthUser {
  email: string;
  role: string;
  loginTime: number;
}

export default function NavigationBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  async function checkSession() {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkSession();
  }, [pathname]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      setUser(null);
      router.push('/login');
    } catch {
      //
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255, 248, 248, 0.88)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(220, 38, 38, 0.1)',
        padding: '0.85rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Brand & Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '1.15rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#111827',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#DC2626',
              boxShadow: '0 0 10px #DC2626',
            }}
          />
          <span>Silent</span>
          <span style={{ color: '#DC2626' }}>QA</span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.9rem', fontWeight: 600 }}>
          <Link
            href="/"
            style={{
              color: pathname === '/' ? '#DC2626' : '#4B5563',
              transition: 'color 0.15s',
            }}
          >
            Overview
          </Link>
          <Link
            href="/app"
            style={{
              color: pathname === '/app' || pathname?.startsWith('/app/report') ? '#DC2626' : '#4B5563',
              transition: 'color 0.15s',
            }}
          >
            Tester Workspace
          </Link>
          <Link
            href="/admin"
            style={{
              color: pathname === '/admin' ? '#DC2626' : '#4B5563',
              transition: 'color 0.15s',
            }}
          >
            Admin Dashboard
          </Link>
        </nav>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Supabase Status Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#15803D',
            background: '#DCFCE7',
            padding: '0.3rem 0.75rem',
            borderRadius: '9999px',
            border: '1px solid #86EFAC',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#16A34A',
            }}
          />
          Supabase Live
        </div>

        {/* User Account / Auth Status */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#1F2937',
                background: '#FFFFFF',
                padding: '0.3rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid rgba(17, 24, 39, 0.1)',
              }}
            >
              <User size={14} color="#DC2626" />
              <span
                style={{
                  maxWidth: '140px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={user.email}
              >
                {user.email}
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  background: '#FEE2E2',
                  color: '#991B1B',
                  padding: '0.1rem 0.35rem',
                  borderRadius: '4px',
                }}
              >
                {user.role}
              </span>
            </div>

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              title="Sign Out"
              style={{
                background: 'transparent',
                border: '1px solid rgba(17, 24, 39, 0.15)',
                borderRadius: '8px',
                padding: '0.35rem 0.55rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                color: '#6B7280',
                fontSize: '0.8rem',
                fontWeight: 600,
                transition: 'all 0.15s ease',
              }}
            >
              <LogOut size={13} />
              <span>{signingOut ? '...' : 'Exit'}</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#DC2626',
              padding: '0.35rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(220, 38, 38, 0.25)',
              background: '#FFF1F2',
              transition: 'all 0.15s ease',
            }}
          >
            Sign In / Register
          </Link>
        )}

        <Link
          href="/app"
          className="btn-primary"
          style={{
            padding: '0.45rem 1rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}
        >
          <span>Workspace</span>
          <ChevronRight size={14} />
        </Link>
      </div>
    </header>
  );
}

