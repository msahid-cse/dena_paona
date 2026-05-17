'use client';

import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset code sent! Check your email.');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-bg-glow" style={{ background: 'var(--accent-amber)', top: '-200px', right: '-100px' }} />
      <div className="auth-bg-glow" style={{ background: 'var(--accent-purple)', bottom: '-200px', left: '-100px' }} />

      <div className="auth-box animate-slide" style={{ maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="logo-icon" style={{ width: 56, height: 56, fontSize: 26, margin: '0 auto 16px', background: 'linear-gradient(135deg, var(--accent-amber), #d97706)' }}>🔐</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            Forgot Password?
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            No worries! We'll send a reset code to your email.
          </p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                Check Your Email
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
                If <strong style={{ color: 'var(--text-primary)' }}>{email}</strong> is registered, we've sent a 6-digit reset code. Check your inbox (and spam folder).
              </p>
              <Link
                href={`/reset-password?email=${encodeURIComponent(email)}`}
                className="btn btn-primary btn-lg"
                style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
              >
                Enter Reset Code →
              </Link>
              <button
                onClick={() => setSent(false)}
                style={{ marginTop: 12, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}
              >
                Try a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Email Address</label>
                <div className="input-group">
                  <span className="input-icon">📧</span>
                  <input
                    id="forgot-email"
                    type="email"
                    className="form-input input-with-icon"
                    placeholder="email@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                id="forgot-submit"
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? '⟳ Sending...' : '📨 Send Reset Code'}
              </button>
            </form>
          )}

          <div className="divider" />
          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
            Remember your password?{' '}
            <Link href="/login" style={{ color: 'var(--accent-purple-light)', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
