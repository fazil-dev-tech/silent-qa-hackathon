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
        className="mobile-header-padding"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(7, 8, 11, 0.9)',
          backdropFilter: 'blur(28px) saturate(190%)',
          WebkitBackdropFilter: 'blur(28px) saturate(190%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '0.65rem clamp(0.75rem, 2vw, 1.5rem)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.65rem',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.75), inset 0 -1px 0 rgba(255, 255, 255, 0.04)',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Brand & Left Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.75rem, 2vw, 1.75rem)', flexWrap: 'wrap' }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1.15rem',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: '#FFFFFF',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '9px',
                height: '9px',
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
            className="desktop-nav-links"
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
            <a
              href="/shop/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#F472B6',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.22rem 0.65rem',
                borderRadius: '9999px',
                background: 'rgba(244, 114, 182, 0.1)',
                border: '1px solid rgba(244, 114, 182, 0.3)',
                boxShadow: '0 0 12px rgba(244, 114, 182, 0.15)',
                fontWeight: 700,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(244, 114, 182, 0.2)';
                e.currentTarget.style.boxShadow = '0 0 18px rgba(244, 114, 182, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(244, 114, 182, 0.1)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(244, 114, 182, 0.15)';
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#EC4899',
                  boxShadow: '0 0 6px #EC4899',
                }}
              />
              <span>Demo Shop</span>
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
            className="desktop-nav-links"
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
                  fontWeight: pathname === '/admin' ? 700 : 600,
                }}
              >
                <span>Admin Console</span>
              </Link>
            )}
          </nav>
        ) : null}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'nowrap', justifyContent: 'flex-end', flexShrink: 0 }}>
        {/* Chrome Extension Download Button */}
        <button
          onClick={() => setExtensionModalOpen(true)}
          title="Download Chrome Manifest V3 Extension (.ZIP) & View Setup Instructions"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.74rem',
            fontWeight: 700,
            color: '#38BDF8',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            padding: '0.3rem 0.55rem',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 0 10px rgba(56, 189, 248, 0.12)',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)';
            e.currentTarget.style.boxShadow = '0 0 16px rgba(56, 189, 248, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(56, 189, 248, 0.12)';
          }}
        >
          <Download size={13} color="#38BDF8" />
          <span className="hidden sm:inline">Extension .ZIP</span>
          <span className="sm:hidden">.ZIP</span>
        </button> 

        {/* Supabase Realtime Health Pill (Hidden on narrow mobile screens) */}
        <div
          className="hidden sm:flex"
          style={{
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: '#4ADE80',
            background: 'rgba(22, 163, 74, 0.15)',
            padding: '0.25rem 0.6rem',
            borderRadius: '9999px',
            border: '1px solid rgba(74, 222, 128, 0.3)',
            whiteSpace: 'nowrap',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'nowrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#F8FAFC',
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                whiteSpace: 'nowrap',
              }}
            >
              <User size={13} color="#DC2626" />
              <span
                style={{
                  maxWidth: '110px',
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
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  background: isAdmin ? 'rgba(220, 38, 38, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                  color: isAdmin ? '#FCA5A5' : '#7DD3FC',
                  border: `1px solid ${isAdmin ? 'rgba(220, 38, 38, 0.35)' : 'rgba(56, 189, 248, 0.3)'}`,
                  padding: '0.1rem 0.35rem',
                  borderRadius: '3px',
                }}
              >
                {user.role}
              </span>
            </div>

            {isAdmin && pathname === '/admin' ? (
              <Link
                href="/app"
                className="btn-primary"
                style={{
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.74rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>Workspace</span>
                <ChevronRight size={13} />
              </Link>
            ) : null}

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              title="Sign Out"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                padding: '0.35rem 0.55rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                color: '#94A3B8',
                fontSize: '0.76rem',
                fontWeight: 600,
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <LogOut size={12} />
              <span>{signingOut ? '...' : 'Sign Out'}</span>
            </button>
          </div>
        ) : (
          /* When NOT logged in: Prominent Sign In / Register CTA */
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Link
              href="/login"
              className="btn-primary"
              style={{
                padding: '0.35rem 0.85rem',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                whiteSpace: 'nowrap',
              }}
            >
              <KeyRound size={13} />
              <span className="hidden sm:inline">Sign In / Register</span>
              <span className="sm:hidden">Sign In</span>
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
