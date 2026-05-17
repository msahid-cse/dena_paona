'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [form, setForm] = useState({
    email: searchParams.get('email') || '',
    code: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await axios.post('/api/auth/reset-password', {
        email: form.email,
        code: form.code,
        password: form.password,
      });
      toast.success('Password reset! Please sign in.');
      router.push('/login');
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        toast.error(err.response.data.error || 'Reset failed');
      } else {
        toast.error('Reset failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-bg-glow" style={{ background: 'var(--accent-red)', top: '-200px', right: '-100px' }} />
      <div className="auth-bg-glow" style={{ background: 'var(--accent-purple)', bottom: '-200px', left: '-100px' }} />

      <div className="auth-box animate-slide" style={{ maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="logo-icon" style={{ width: 56, height: 56, fontSize: 26, margin: '0 auto 16px', background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>🔑</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            Reset Your Password
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Enter the 6-digit code from your email and set a new password.
          </p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                id="reset-email"
                name="email"
                type="email"
                className="form-input"
                placeholder="email@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Reset Code</label>
              <input
                id="reset-code"
                name="code"
                type="text"
                className="form-input"
                placeholder="6-digit code"
                value={form.code}
                onChange={handleChange}
                required
                maxLength={10}
                style={{ letterSpacing: 6, fontSize: 18, textAlign: 'center', fontWeight: 700 }}
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                Check your email inbox (and spam folder).{' '}
                <Link href="/forgot-password" style={{ color: 'var(--accent-purple-light)' }}>Resend code</Link>
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="input-group">
                <input
                  id="reset-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input input-with-icon-right"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                />
                <button type="button" className="input-icon-right" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Confirm New Password</label>
              <input
                id="reset-confirm-password"
                name="confirmPassword"
                type="password"
                className="form-input"
                placeholder="Re-enter new password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <span style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 4, display: 'block' }}>
                  ❌ Passwords do not match
                </span>
              )}
            </div>

            <button
              id="reset-submit"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? '⟳ Resetting...' : '🔐 Reset Password'}
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
            <Link href="/login" style={{ color: 'var(--accent-purple-light)', fontWeight: 600, textDecoration: 'none' }}>
              ← Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="auth-container"><div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Loading...</div></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
