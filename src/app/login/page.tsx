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
