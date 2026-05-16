'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [pendingUserId, setPendingUserId] = useState('');

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(identifier, password);
    setLoading(false);

    if (result.success) {
      toast.success('Welcome back!');
      router.push('/dashboard');
    } else {
      if (result.needsVerification && result.userId) {
        setNeedsVerification(true);
        setPendingUserId(result.userId);
      }
      setError(result.error || 'Login failed');
    }
  };

  return (
    <div className="auth-container">
      {/* Background glows */}
      <div className="auth-bg-glow" style={{ background: 'var(--accent-purple)', top: '-200px', left: '-200px' }} />
      <div className="auth-bg-glow" style={{ background: 'var(--accent-blue)', bottom: '-200px', right: '-200px' }} />

      <div className="auth-box animate-slide">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="logo-icon" style={{ width: 56, height: 56, fontSize: 26, margin: '0 auto 16px' }}>💰</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            Welcome back
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Sign in to your Dena-Paona account
          </p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          {error && (
            <div className="alert alert-error">
              <span>⚠️</span>
              <div>
                <div>{error}</div>
                {needsVerification && (
                  <Link href={`/verify?userId=${pendingUserId}`} style={{ color: 'var(--accent-purple-light)', fontSize: 13, marginTop: 4, display: 'block' }}>
                    → Verify your email now
                  </Link>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email or Username</label>
              <div className="input-group">
                <span className="input-icon" style={{ fontSize: 15 }}>👤</span>
                <input
                  id="login-identifier"
                  type="text"
                  className="form-input input-with-icon"
                  placeholder="email@example.com or username"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: 12, color: 'var(--accent-purple-light)', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="input-group">
                <span className="input-icon" style={{ fontSize: 15 }}>🔒</span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input input-with-icon input-with-icon-right"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ fontSize: 14 }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? (
                <>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                  Signing in...
                </>
              ) : (
                '🚀 Sign In'
              )}
            </button>
          </form>

          <div className="divider">or</div>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{ color: 'var(--accent-purple-light)', fontWeight: 600, textDecoration: 'none' }}>
              Create account
            </Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 20 }}>
          🔐 Secured with JWT authentication & bcrypt encryption
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
