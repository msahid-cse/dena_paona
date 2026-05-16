'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';

function VerifyContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const router = useRouter();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!userId) router.push('/register');
    inputs.current[0]?.focus();
  }, [userId, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').split('').slice(0, 6);
      const newCode = [...code];
      digits.forEach((d, i) => { if (index + i < 6) newCode[index + i] = d; });
      setCode(newCode);
      const nextIndex = Math.min(index + digits.length, 5);
      inputs.current[nextIndex]?.focus();
      return;
    }
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/auth/verify', { userId, code: fullCode });
      toast.success('Email verified! You can now login.');
      router.push('/login');
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || 'Verification failed');
      } else {
        setError('Verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await axios.post('/api/auth/resend-code', { userId });
      toast.success('New verification code sent!');
      setCountdown(60);
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        toast.error(err.response.data.error || 'Failed to resend code');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-bg-glow" style={{ background: 'var(--accent-purple)', top: 0, left: '50%', transform: 'translateX(-50%)' }} />

      <div className="auth-box animate-slide" style={{ maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
            Verify Your Email
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
            We sent a 6-digit verification code to your email address. Enter it below to activate your account.
          </p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          {error && (
            <div className="alert alert-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 28 }}>
              <label className="form-label" style={{ textAlign: 'center', display: 'block', marginBottom: 16 }}>
                Verification Code
              </label>
              <div className="otp-input">
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputs.current[i] = el; }}
                    id={`otp-${i}`}
                    type="text"
                    className="otp-digit"
                    value={digit}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    maxLength={1}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
            </div>

            <button
              id="verify-submit"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading || code.join('').length !== 6}
              style={{ width: '100%' }}
            >
              {loading ? '⟳ Verifying...' : '✅ Verify Email'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            {countdown > 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Resend code in <strong style={{ color: 'var(--accent-purple-light)' }}>{countdown}s</strong>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                style={{ background: 'none', border: 'none', color: 'var(--accent-purple-light)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
              >
                {resending ? '⟳ Sending...' : '📨 Resend Code'}
              </button>
            )}
          </div>

          <div className="divider" />

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            <Link href="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
              ← Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="auth-container"><div style={{color: 'var(--text-muted)'}}>Loading...</div></div>}>
      <VerifyContent />
    </Suspense>
  );
}
