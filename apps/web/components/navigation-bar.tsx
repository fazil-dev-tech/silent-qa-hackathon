'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, LogOut, ShieldCheck, ChevronRight, Sparkles, KeyRound, Download, Puzzle } from 'lucide-react';
import ExtensionInstallModal from '@/components/extension-install-modal';

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
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);

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
  const isLanding = pathname === '/';

  return (
    <>
      <header
        style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(7, 8, 11, 0.85)',
        backdropFilter: 'blur(28px) saturate(190%)',
        WebkitBackdropFilter: 'blur(28px) saturate(190%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '0.85rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.75), inset 0 -1px 0 rgba(255, 255, 255, 0.04)',
        transition: 'all 0.2s ease',
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
            color: '#FFFFFF',
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

        {/* Landing Page Navigation Links (Visible for everyone on Landing Page) */}
        {isLanding ? (
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.4rem',
              fontSize: '0.86rem',
              fontWeight: 600,
            }}
          >
            <a
              href="#problem"
              style={{
                color: '#94A3B8',
                textDecoration: 'none',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
            >
              The Problem
            </a>
            <a
              href="#how-it-works"
              style={{
                color: '#94A3B8',
                textDecoration: 'none',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
            >
              How It Works
            </a>
            <a
              href="#capabilities"
              style={{
                color: '#94A3B8',
                textDecoration: 'none',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
            >
              Capabilities
            </a>
            <a
              href="#architecture"
              style={{
                color: '#00F0FF',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.22rem 0.65rem',
                borderRadius: '9999px',
                background: 'rgba(0, 240, 255, 0.08)',
                border: '1px solid rgba(0, 240, 255, 0.25)',
                boxShadow: '0 0 12px rgba(0, 240, 255, 0.15)',
                fontWeight: 700,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 240, 255, 0.16)';
                e.currentTarget.style.boxShadow = '0 0 18px rgba(0, 240, 255, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 240, 255, 0.08)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 240, 255, 0.15)';
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#00F0FF',
                  boxShadow: '0 0 6px #00F0FF',
                }}
              />
              <span>Architecture</span>
            </a>
            {user && (
              <Link
                href="/app"
                style={{
                  color: '#F87171',
                  textDecoration: 'none',
                  fontWeight: 700,
                }}
              >
                Workspace
              </Link>
            )}
          </nav>
        ) : user ? (
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
                color: pathname === '/' ? '#DC2626' : '#94A3B8',
                textDecoration: 'none',
                transition: 'color 0.15s',
              }}
            >
              Overview
            </Link>
            <Link
              href="/app"
              style={{
                color: pathname === '/app' || pathname?.startsWith('/app/report') ? '#DC2626' : '#94A3B8',
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
                  color: pathname === '/admin' ? '#DC2626' : '#94A3B8',
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
                    background: 'rgba(220, 38, 38, 0.2)',
                    color: '#FCA5A5',
                    border: '1px solid rgba(220, 38, 38, 0.35)',
                    padding: '0.1rem 0.35rem',
                    borderRadius: '4px',
                  }}
                >
                  CONSOLE
                </span>
              </Link>
            )}
          </nav>
        ) : null}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Chrome Extension Download Button */}
        <button
          onClick={() => setExtensionModalOpen(true)}
          title="Download Chrome Manifest V3 Extension (.ZIP) & View Setup Instructions"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#38BDF8',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            padding: '0.35rem 0.85rem',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 0 14px rgba(56, 189, 248, 0.15)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(56, 189, 248, 0.35)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)';
            e.currentTarget.style.boxShadow = '0 0 14px rgba(56, 189, 248, 0.15)';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <Download size={14} color="#38BDF8" />
          <span>Extension .ZIP</span>
        </button>

        {/* Supabase Realtime Health Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#4ADE80',
            background: 'rgba(22, 163, 74, 0.15)',
            padding: '0.3rem 0.75rem',
            borderRadius: '9999px',
            border: '1px solid rgba(74, 222, 128, 0.3)',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#16A34A',
              boxShadow: '0 0 6px #16A34A',
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
                color: '#F8FAFC',
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.3)',
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
                  background: isAdmin ? 'rgba(220, 38, 38, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                  color: isAdmin ? '#FCA5A5' : '#7DD3FC',
                  border: `1px solid ${isAdmin ? 'rgba(220, 38, 38, 0.35)' : 'rgba(56, 189, 248, 0.3)'}`,
                  padding: '0.12rem 0.4rem',
                  borderRadius: '4px',
                }}
              >
                {user.role}
              </span>
            </div>

            {isAdmin ? (
              <Link
                href={pathname === '/admin' ? '/app' : '/admin'}
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
                <span>{pathname === '/admin' ? 'Tester Workspace' : 'Admin Console'}</span>
                <ChevronRight size={14} />
              </Link>
            ) : pathname !== '/app' && !pathname?.startsWith('/app/report') ? (
              <Link
                href="/app"
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
                <span>Workspace</span>
                <ChevronRight size={14} />
              </Link>
            ) : null}

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              title="Sign Out"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '0.4rem 0.6rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                color: '#94A3B8',
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
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
              }}
            >
              <KeyRound size={14} />
              <span>Sign In / Register</span>
            </Link>
          </div>
        )}
      </div>
    </header>

    <ExtensionInstallModal
      isOpen={extensionModalOpen}
      onClose={() => setExtensionModalOpen(false)}
    />
  </>
  );
}
