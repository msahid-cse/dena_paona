'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
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
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(identifier, password);
    setLoading(false);
    if (result.success) {
      toast.success(t('welcomeBack') + '!');
      // Get user from localStorage to check flags
      const savedUser = localStorage.getItem('dp_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        // Post-login redirect logic
        if (!u.usernameSet) {
          router.push('/set-username');
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/dashboard');
      }
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
      <div className="auth-bg-glow" style={{ background: 'var(--accent-purple)', top: '-200px', left: '-200px' }} />
      <div className="auth-bg-glow" style={{ background: 'var(--accent-blue)', bottom: '-200px', right: '-200px' }} />

      {/* Top controls */}
      <div style={{ position: 'fixed', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 10 }}>
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <select
          className="lang-select"
          value={language}
          onChange={e => setLanguage(e.target.value as Language)}
        >
          <option value="en">🇬🇧 EN</option>
          <option value="bn">🇧🇩 বাং</option>
          <option value="banglish">🔤 BL</option>
        </select>
      </div>

      <div className="auth-box animate-slide">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="logo-icon" style={{ width: 56, height: 56, fontSize: 26, margin: '0 auto 16px' }}>💰</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            {t('welcomeBack')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{t('signInSubtitle')}</p>
        </div>

        <div className="card" style={{ padding: 28 }}>
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
              <label className="form-label">{t('emailOrUsername')}</label>
              <div className="input-group">
                <span className="input-icon">👤</span>
                <input
                  id="login-identifier"
                  type="text"
                  className="form-input input-with-icon"
                  placeholder="email@example.com"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>{t('password')}</label>
                <Link href="/forgot-password" style={{ fontSize: 12, color: 'var(--accent-purple-light)', textDecoration: 'none' }}>
                  {t('forgotPassword')}
                </Link>
              </div>
              <div className="input-group">
                <span className="input-icon">🔒</span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input input-with-icon input-with-icon-right"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button type="button" className="input-icon-right" onClick={() => setShowPassword(!showPassword)}>
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
              {loading ? <><span className="animate-spin">⟳</span> Signing in...</> : `🚀 ${t('signIn')}`}
            </button>
          </form>

          <div className="divider">or</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            <Link href="/api/auth/oauth/google" className="btn btn-lg hover:bg-[var(--bg-hover)] transition-colors" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border)', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Link>
          </div>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
            {t('dontHaveAccount')}{' '}
            <Link href="/register" style={{ color: 'var(--accent-purple-light)', fontWeight: 600, textDecoration: 'none' }}>
              {t('createAccount')}
            </Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
          🔐 Secured with JWT authentication &amp; bcrypt encryption
        </p>
      </div>
    </div>
  );
}
