'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);

    // Simple auth — store in localStorage + cookie
    const user = { name: name.trim(), email: email.trim(), loginAt: new Date().toISOString() };
    localStorage.setItem('qa_user', JSON.stringify(user));
    document.cookie = `qa_user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400`;

    // Simulate brief loading for polish
    await new Promise(r => setTimeout(r, 600));
    router.push('/dashboard');
  };

  return (
    <div className="login-container">
      <div className="login-bg-orb orb1" />
      <div className="login-bg-orb orb2" />

      <div className="login-card glass">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '56px', height: '56px', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            borderRadius: '16px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '28px'
          }}>
            🔍
          </div>
        </div>
        <h1 style={{ 
          background: 'var(--gradient-neon)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: '32px'
        }}>Silent Backend QA</h1>
        <p>AI-Powered Defect Report Enhancement</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <label className="input-label">Your Name</label>
            <input
              className="input-field"
              type="text"
              placeholder="e.g. Mohamed Fazil"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Email</label>
            <input
              className="input-field"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            className="btn btn-primary btn-lg"
            type="submit"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Logging in...
              </>
            ) : (
              <>🚀 Enter Dashboard</>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: 'var(--text-muted)' }}>
          TCS Technology Day — Automated Defect Enhancement
        </p>
      </div>
    </div>
  );
}
