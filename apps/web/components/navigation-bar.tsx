'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, LogOut, ShieldCheck, ChevronRight, Sparkles, KeyRound } from 'lucide-react';

interface AuthUser {
  name?: string;
  email: string;
  phone?: string;
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
      } else {
        setUser(null);
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
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    } finally {
      setSigningOut(false);
    }
  }

  const isAdmin = user?.role === 'admin';

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255, 248, 248, 0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(220, 38, 38, 0.12)',
        padding: '0.85rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
      }}
    >
      {/* Brand & Left Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '1.2rem',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            color: '#111827',
            textDecoration: 'none',
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

        {/* Navigation links: Visible ONLY AFTER user logs in */}
        {user && (
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            <Link
              href="/"
              style={{
                color: pathname === '/' ? '#DC2626' : '#4B5563',
                textDecoration: 'none',
                transition: 'color 0.15s',
              }}
            >
              Overview
            </Link>
            <Link
              href="/app"
              style={{
                color: pathname === '/app' || pathname?.startsWith('/app/report') ? '#DC2626' : '#4B5563',
                textDecoration: 'none',
                transition: 'color 0.15s',
              }}
            >
              Tester Workspace
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                style={{
                  color: pathname === '/admin' ? '#DC2626' : '#4B5563',
                  textDecoration: 'none',
                  transition: 'color 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <span>Admin Command Center</span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    background: '#FEE2E2',
                    color: '#DC2626',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px',
                  }}
                >
                  CONSOLE
                </span>
              </Link>
            )}
          </nav>
        )}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Supabase Realtime Health Pill */}
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
          Live Cloud
        </div>

        {/* User Account / Auth Status */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#1F2937',
                background: '#FFFFFF',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(17, 24, 39, 0.1)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <User size={14} color="#DC2626" />
              <span
                style={{
                  maxWidth: '150px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={user.name || user.email}
              >
                {user.name || (user.email ? user.email.split('@')[0] : 'User')}
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  background: isAdmin ? '#FEE2E2' : '#E0E7FF',
                  color: isAdmin ? '#991B1B' : '#3730A3',
                  padding: '0.12rem 0.4rem',
                  borderRadius: '4px',
                }}
              >
                {user.role}
              </span>
            </div>

            <Link
              href={isAdmin ? '/admin' : '/app'}
              className="btn-primary"
              style={{
                padding: '0.45rem 1rem',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                textDecoration: 'none',
              }}
            >
              <span>{isAdmin ? 'Admin Portal' : 'Workspace'}</span>
              <ChevronRight size={14} />
            </Link>

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              title="Sign Out"
              style={{
                background: 'transparent',
                border: '1px solid rgba(17, 24, 39, 0.15)',
                borderRadius: '8px',
                padding: '0.4rem 0.6rem',
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
              <span>{signingOut ? '...' : 'Sign Out'}</span>
            </button>
          </div>
        ) : (
          /* When NOT logged in: Prominent Sign In / Register CTA */
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Link
              href="/login"
              className="btn-primary"
              style={{
                padding: '0.5rem 1.15rem',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.25)',
              }}
            >
              <KeyRound size={14} />
              <span>Sign In / Register</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
