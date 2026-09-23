'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const navLinks = [
  { href: '/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/dashboard/flag', icon: '🚩', label: 'Flag Defect' },
  { href: '/dashboard/reports', icon: '📋', label: 'Reports' },
  { href: '/dashboard/chat', icon: '💬', label: 'QA Chatbot' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('qa_user');
    if (stored) {
      setUser(JSON.parse(stored));
    } else {
      window.location.href = '/';
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('qa_user');
    document.cookie = 'qa_user=; path=/; max-age=0';
    window.location.href = '/';
  };

  if (!user) return null;

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🔍</div>
          <span className="sidebar-logo-text">SilentQA</span>
        </div>

        <nav className="sidebar-nav">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
            >
              <span className="sidebar-link-icon">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: '16px' }}>
          <div style={{ padding: '8px 12px', marginBottom: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>{user.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{user.email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-link"
            style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <span className="sidebar-link-icon">🚪</span>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
