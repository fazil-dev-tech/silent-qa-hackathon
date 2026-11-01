'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Mail,
  Phone,
  Lock,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Shield,
  Eye,
  EyeOff,
  User,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get('redirect') || null;

  // Active Login Method: 'tester' (Email & Mobile OTP) or 'admin' (ID & Password)
  const [authMethod, setAuthMethod] = useState<'tester' | 'admin'>('tester');

  // Tester Mode: 'login' (Email only) or 'register' (Email + Mobile)
  const [testerMode, setTesterMode] = useState<'login' | 'register'>('login');

  // Tester Form fields (ONLY Email and Mobile Number — roles removed)
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Admin Form fields (ID: TGVINCENZO, Password: Adil123#)
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

  // 1. Submit email (+ mobile for registration) to receive OTP
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    if (testerMode === 'register' && (!phone || phone.replace(/\D/g, '').length < 7)) {
      setMessage({ text: 'Please enter a valid mobile number with at least 7 digits', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phone: testerMode === 'register' ? phone : undefined,
          mode: testerMode,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setCooldown(60);
        setMessage({ text: `✓ 6-digit code dispatched to ${email}`, type: 'success' });
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
    if (val.length > 1) {
      const digits = val.replace(/\D/g, '').slice(0, 6).split('');
      const updated = [...otpCode];
      digits.forEach((d, idx) => {
        if (idx < 6) updated[idx] = d;
      });
      setOtpCode(updated);
      const nextIdx = Math.min(5, digits.length);
      otpInputsRef.current[nextIdx]?.focus();
      return;
    }

    const singleDigit = val.replace(/\D/g, '');
    const updated = [...otpCode];
    updated[index] = singleDigit;
    setOtpCode(updated);

    if (singleDigit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  }

  // 3. Verify submitted OTP Code
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const fullCode = otpCode.join('');
    if (fullCode.length !== 6) {
      setMessage({ text: 'Please enter all 6 verification digits', type: 'error' });
      return;
    }

    setVerifying(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phone: testerMode === 'register' ? phone : undefined,
          code: fullCode,
          mode: testerMode,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ text: '✓ Verified successfully! Redirecting...', type: 'success' });
        setTimeout(() => {
          router.push(redirectTarget || data.redirect || '/app');
        }, 600);
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (err: any) {
      setMessage({ text: err?.message || 'Verification failed', type: 'error' });
    } finally {
      setVerifying(false);
    }
  }

  // 4. Admin Direct Authentication (ID: TGVINCENZO, Pass: Adil123#)
  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!adminId || !adminPassword) {
      setMessage({ text: 'Please enter Administrator ID and password', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: adminId,
          password: adminPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ text: '✓ Administrator verified! Entering Command Center...', type: 'success' });
        setTimeout(() => {
          router.push(redirectTarget || '/admin');
        }, 500);
      } else {
        throw new Error(data.error || 'Invalid Administrator credentials');
      }
    } catch (err: any) {
      setMessage({ text: err?.message || 'Admin authentication failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 72px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        background: 'linear-gradient(180deg, #FFF8F8 0%, #FFFFFF 100%)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          width: '100%',
          maxWidth: '460px',
        }}
      >
        {/* Brand Card Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: '#FEE2E2',
              color: '#DC2626',
              marginBottom: '0.85rem',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)',
            }}
          >
            <ShieldCheck size={26} />
          </div>
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: '#111827',
              margin: '0 0 0.4rem 0',
            }}
          >
            Silent QA Access Portal
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0 }}>
            {authMethod === 'admin'
              ? 'Lead & Administrative Command Center access'
              : 'Passkey-free flight recorder access via verified OTP'}
          </p>
        </div>

        {/* Primary Method Switcher (Tester vs Admin) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: '#F3F4F6',
            padding: '0.25rem',
            borderRadius: '10px',
            marginBottom: '1.25rem',
            border: '1px solid rgba(17, 24, 39, 0.06)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setAuthMethod('tester');
              setMessage(null);
            }}
            style={{
              padding: '0.55rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: authMethod === 'tester' ? '#FFFFFF' : 'transparent',
              color: authMethod === 'tester' ? '#111827' : '#6B7280',
              boxShadow: authMethod === 'tester' ? '0 2px 6px rgba(0, 0, 0, 0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Tester Workspace
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod('admin');
              setMessage(null);
            }}
            style={{
              padding: '0.55rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: authMethod === 'admin' ? '#FFFFFF' : 'transparent',
              color: authMethod === 'admin' ? '#DC2626' : '#6B7280',
              boxShadow: authMethod === 'admin' ? '0 2px 6px rgba(0, 0, 0, 0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Admin Portal
          </button>
        </div>

        {/* Auth Glass Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            borderRadius: '16px',
            padding: '1.75rem',
            border: '1px solid rgba(220, 38, 38, 0.14)',
            boxShadow: '0 12px 36px rgba(220, 38, 38, 0.08)',
          }}
        >
          {/* Notification Alert Message */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: '1.25rem' }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  background: message.type === 'success' ? '#DCFCE7' : '#FEE2E2',
                  color: message.type === 'success' ? '#15803D' : '#DC2626',
                  border: `1px solid ${message.type === 'success' ? '#86EFAC' : '#FCA5A5'}`,
                  overflow: 'hidden',
                }}
              >
                {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{message.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TAB 1: TESTER WORKSPACE AUTH (EMAIL & MOBILE OTP) */}
          {authMethod === 'tester' && (
            <>
              {/* Login vs Register Toggle */}
              {!otpSent && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '1.5rem',
                    marginBottom: '1.5rem',
                    borderBottom: '1px solid #F3F4F6',
                    paddingBottom: '0.75rem',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setTesterMode('login');
                      setMessage(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      color: testerMode === 'login' ? '#DC2626' : '#9CA3AF',
                      borderBottom: testerMode === 'login' ? '2px solid #DC2626' : '2px solid transparent',
                      paddingBottom: '0.5rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Tester Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTesterMode('register');
                      setMessage(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      color: testerMode === 'register' ? '#DC2626' : '#9CA3AF',
                      borderBottom: testerMode === 'register' ? '2px solid #DC2626' : '2px solid transparent',
                      paddingBottom: '0.5rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    New Registration
                  </button>
                </div>
              )}

              {/* Step 1: Input Details and Send OTP */}
              {!otpSent ? (
                <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  {/* Email Input */}
                  <div>
                    <label
                      htmlFor="email"
                      style={{
                        display: 'block',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#374151',
                        marginBottom: '0.4rem',
                      }}
                    >
                      Email Address
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="developer@company.com"
                        required
                        disabled={loading}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                          borderRadius: '8px',
                          border: '1px solid rgba(17, 24, 39, 0.16)',
                          fontSize: '0.875rem',
                          boxSizing: 'border-box',
                          outline: 'none',
                        }}
                      />
                      <Mail
                        size={16}
                        color="#9CA3AF"
                        style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }}
                      />
                    </div>
                  </div>

                  {/* Mobile Number Input (Shown on Registration) */}
                  {testerMode === 'register' && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <label
                        htmlFor="phone"
                        style={{
                          display: 'block',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: '#374151',
                          marginBottom: '0.4rem',
                        }}
                      >
                        Mobile Number
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          required
                          disabled={loading}
                          style={{
                            width: '100%',
                            padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                            borderRadius: '8px',
                            border: '1px solid rgba(17, 24, 39, 0.16)',
                            fontSize: '0.875rem',
                            boxSizing: 'border-box',
                            outline: 'none',
                          }}
                        />
                        <Phone
                          size={16}
                          color="#9CA3AF"
                          style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }}
                        />
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '0.25rem', display: 'block' }}>
                        Only mobile number and email required. Role is automatically provisioned as Flight Tester.
                      </span>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="btn-primary"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      marginTop: '0.5rem',
                    }}
                  >
                    {loading ? (
                      <span>Dispatching OTP via Gmail SMTP...</span>
                    ) : (
                      <>
                        <span>{testerMode === 'register' ? 'Register & Send Code' : 'Send Verification Code'}</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Step 2: 6-Digit OTP Verification Boxes */
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: '#4B5563', marginBottom: '0.2rem' }}>
                      Enter the 6-digit code delivered to:
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111827' }}>{email}</div>
                  </div>

                  {/* 6 Digit Input Group */}
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
                        disabled={verifying}
                        style={{
                          width: '46px',
                          height: '52px',
                          textAlign: 'center',
                          fontSize: '1.4rem',
                          fontWeight: 800,
                          borderRadius: '10px',
                          border: digit ? '2px solid #DC2626' : '1px solid rgba(17, 24, 39, 0.2)',
                          background: digit ? '#FFF8F8' : '#FFFFFF',
                          outline: 'none',
                          color: '#111827',
                          transition: 'all 0.15s ease',
                        }}
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={verifying || otpCode.join('').length !== 6}
                    className="btn-primary"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      cursor: verifying ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {verifying ? (
                      <span>Verifying Code...</span>
                    ) : (
                      <>
                        <KeyRound size={16} />
                        <span>Verify & Enter Workspace</span>
                      </>
                    )}
                  </button>

                  {/* Resend & Back controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#6B7280',
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline',
                      }}
                    >
                      ← Change details
                    </button>

                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={cooldown > 0 || loading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: cooldown > 0 ? '#9CA3AF' : '#DC2626',
                        fontWeight: 700,
                        cursor: cooldown > 0 ? 'default' : 'pointer',
                        padding: 0,
                      }}
                    >
                      {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend Code'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* TAB 2: ADMINISTRATOR DIRECT ACCESS (TGVINCENZO / Adil123#) */}
          {authMethod === 'admin' && (
            <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  color: '#991B1B',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Shield size={16} color="#DC2626" />
                <span>Executive Command Center. Pre-authorized credentials required.</span>
              </div>

              {/* Admin ID Input */}
              <div>
                <label
                  htmlFor="adminId"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#374151',
                    marginBottom: '0.4rem',
                  }}
                >
                  Administrator ID
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="adminId"
                    type="text"
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    placeholder="e.g. TGVINCENZO"
                    required
                    disabled={loading}
                    autoComplete="username"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(17, 24, 39, 0.16)',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                  <User
                    size={16}
                    color="#9CA3AF"
                    style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="adminPassword"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#374151',
                    marginBottom: '0.4rem',
                  }}
                >
                  Secret Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="adminPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••••"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                    style={{
                      width: '100%',
                      padding: '0.65rem 2.4rem 0.65rem 2.4rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(17, 24, 39, 0.16)',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                  <Lock
                    size={16}
                    color="#9CA3AF"
                    style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9CA3AF',
                      padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !adminId || !adminPassword}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '0.5rem',
                  background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                }}
              >
                {loading ? (
                  <span>Authenticating Administrator...</span>
                ) : (
                  <>
                    <KeyRound size={16} />
                    <span>Enter Command Center</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Security Note Footer */}
        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.75rem', color: '#6B7280' }}>
          <span>Protected by SHA-256 OTP Code Verification & Gmail SMTP Transport.</span>
        </div>
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <React.Suspense
      fallback={
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
          Loading Access Portal...
        </div>
      }
    >
      <AuthForm />
    </React.Suspense>
  );
}
