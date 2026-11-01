'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Mail,
  Building,
  UserCheck,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Compass,
} from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();

  // Mode: login or register
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form fields
  const [email, setEmail] = useState('');
  const [orgName, setOrgName] = useState('');
  const [role, setRole] = useState<'tester' | 'lead' | 'admin'>('tester');

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Resend countdown
  const [cooldown, setCooldown] = useState(0);

  const otpInputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    let timer: any = null;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // 1. Submit email to receive real OTP via Gmail Nodemailer
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          mode,
          org_name: mode === 'register' ? orgName : undefined,
          role: mode === 'register' ? role : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setCooldown(60);
        setMessage({ text: `✓ Verification code sent to ${email}`, type: 'success' });
        setTimeout(() => otpInputsRef.current[0]?.focus(), 150);
      } else {
        throw new Error(data.error || 'Failed to dispatch verification code');
      }
    } catch (err: any) {
      setMessage({ text: err?.message || 'Authentication service error', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // 2. Handle OTP input changes, paste events & auto-focus
  function handleOtpChange(index: number, val: string) {
    // If user pasted multi-digit code
    if (val.length > 1) {
      const digits = val.replace(/\D/g, '').slice(0, 6).split('');
      const updated = [...otpCode];
      digits.forEach((d, idx) => {
        if (idx < 6) updated[idx] = d;
      });
      setOtpCode(updated);
      const nextIdx = Math.min(5, digits.length);
      otpInputsRef.current[nextIdx]?.focus();

      if (digits.length === 6) {
        verifyCode(digits.join(''));
      }
      return;
    }

    const updated = [...otpCode];
    updated[index] = val;
    setOtpCode(updated);

    if (val && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto verify once all 6 digits entered
    const complete = updated.join('');
    if (complete.length === 6 && !updated.includes('')) {
      verifyCode(complete);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  }

  // 3. Verify OTP code against Supabase database
  async function verifyCode(codeToVerify: string) {
    setVerifying(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: codeToVerify,
          mode,
          org_name: orgName,
          role,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ text: '✓ Verified! Entering Silent QA...', type: 'success' });
        setTimeout(() => {
          router.push(data.redirect || '/app');
        }, 600);
      } else {
        throw new Error(data.error || 'Verification code failed');
      }
    } catch (err: any) {
      setMessage({ text: err?.message || 'Invalid code', type: 'error' });
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '85vh',
        padding: '2.5rem 1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Ambient Glow */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(220, 38, 38, 0.08) 0%, rgba(255, 248, 248, 0) 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '2.5rem 2rem',
          position: 'relative',
          zIndex: 1,
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(220, 38, 38, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'rgba(220, 38, 38, 0.1)',
              color: '#DC2626',
              marginBottom: '1rem',
            }}
          >
            <ShieldCheck size={28} />
          </div>

          <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            {otpSent ? 'Enter Verification Code' : mode === 'register' ? 'Register Your QA Team' : 'Sign In to Silent QA'}
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#6B7280' }}>
            {otpSent
              ? `We sent a single-use code to ${email}`
              : mode === 'register'
              ? 'Create your organization account with real Gmail OTP verification.'
              : 'Passwordless team access with real Gmail SMTP verification.'}
          </p>
        </div>

        {/* Feedback Alert */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              marginBottom: '1.25rem',
              background: message.type === 'success' ? '#DCFCE7' : '#FEE2E2',
              border: `1px solid ${message.type === 'success' ? '#86EFAC' : '#F87171'}`,
              color: message.type === 'success' ? '#166534' : '#991B1B',
              fontSize: '0.825rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{message.text}</span>
          </motion.div>
        )}

        {/* View 1: Send OTP (Sign In / Register) */}
        {!otpSent ? (
          <div>
            {/* Mode Switcher Tabs */}
            <div
              style={{
                display: 'flex',
                background: '#F3F4F6',
                borderRadius: '10px',
                padding: '0.25rem',
                marginBottom: '1.5rem',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setMessage(null);
                }}
                style={{
                  flex: 1,
                  padding: '0.55rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: mode === 'login' ? '#ffffff' : 'transparent',
                  color: mode === 'login' ? '#DC2626' : '#6B7280',
                  boxShadow: mode === 'login' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setMessage(null);
                }}
                style={{
                  flex: 1,
                  padding: '0.55rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: mode === 'register' ? '#ffffff' : 'transparent',
                  color: mode === 'register' ? '#DC2626' : '#6B7280',
                  boxShadow: mode === 'register' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Register Team
              </button>
            </div>

            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {/* Registration Specific Fields */}
              {mode === 'register' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>
                      Organization / Company Name
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Acme Engineering Lab"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem 0.65rem 2.25rem',
                          borderRadius: '8px',
                          border: '1px solid rgba(17, 24, 39, 0.15)',
                          fontSize: '0.9rem',
                          outline: 'none',
                          fontFamily: 'inherit',
                        }}
                      />
                      <Building size={16} color="#9CA3AF" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>
                      Select Your Role
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                      {(['tester', 'lead', 'admin'] as const).map((r) => (
                        <div
                          key={r}
                          onClick={() => setRole(r)}
                          style={{
                            padding: '0.6rem 0.4rem',
                            borderRadius: '8px',
                            border: role === r ? '2px solid #DC2626' : '1px solid rgba(17, 24, 39, 0.12)',
                            background: role === r ? '#FFF1F2' : '#ffffff',
                            textAlign: 'center',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: role === r ? '#DC2626' : '#4B5563',
                            textTransform: 'capitalize',
                          }}
                        >
                          {r === 'tester' ? '🧪 Tester' : r === 'lead' ? '🛡️ QA Lead' : '⚡ Admin'}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Email Address */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.35rem' }}>
                  Work Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2.25rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(17, 24, 39, 0.15)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                  <Mail size={16} color="#9CA3AF" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', marginTop: '0.5rem' }}
              >
                {loading ? (
                  <span>Sending Verification Code...</span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>{mode === 'register' ? 'Register & Send Code' : 'Send Magic OTP'}</span>
                    <ArrowRight size={16} />
                  </span>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* View 2: Enter & Verify 6-Digit OTP */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* 6 Digit Inputs */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              {otpCode.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputsRef.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  style={{
                    width: '46px',
                    height: '54px',
                    textAlign: 'center',
                    fontSize: '1.45rem',
                    fontWeight: 800,
                    borderRadius: '10px',
                    border: digit ? '2px solid #DC2626' : '1px solid rgba(17, 24, 39, 0.2)',
                    background: digit ? '#FFF1F2' : '#ffffff',
                    color: '#111827',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => verifyCode(otpCode.join(''))}
              disabled={verifying || otpCode.includes('')}
              className="btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
            >
              {verifying ? 'Verifying Code...' : 'Verify & Continue →'}
            </button>

            {/* Resend & Back controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#6B7280' }}>
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtpCode(['', '', '', '', '', '']);
                }}
                style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: 0 }}
              >
                ← Change Email
              </button>

              <button
                type="button"
                disabled={cooldown > 0}
                onClick={handleSendOtp}
                style={{
                  background: 'none',
                  border: 'none',
                  color: cooldown > 0 ? '#9CA3AF' : '#DC2626',
                  fontWeight: 700,
                  cursor: cooldown > 0 ? 'default' : 'pointer',
                  padding: 0,
                }}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
              </button>
            </div>
          </div>
        )}

        {/* Direct Workspace Bypass */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(17, 24, 39, 0.08)', paddingTop: '1.25rem', textAlign: 'center' }}>
          <Link
            href="/app"
            style={{
              fontSize: '0.825rem',
              color: '#DC2626',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <Compass size={14} />
            <span>Direct Access: Launch Tester Flight Workspace →</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
