'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function SetUsernamePage() {
  const { user, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
    if (!isLoading && user?.usernameSet) router.push('/dashboard');
  }, [user, isLoading, router]);

  // Debounced availability check
  useEffect(() => {
    if (!username || username.length < 3) { setAvailable(null); return; }
    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await axios.get(`/api/user/check-username?username=${encodeURIComponent(username)}`);
        setAvailable(res.data.available);
      } catch { setAvailable(null); }
      setChecking(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || username.length < 3) { toast.error('Username must be at least 3 characters'); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('dp_token');
      await axios.post('/api/user/set-username', { username }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await refreshUser();
      toast.success(`Username @${username} set!`);
      router.push('/complete-profile');
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        toast.error(err.response.data.error || 'Failed to set username');
      } else {
        toast.error('Failed to set username');
      }
    } finally {
      setLoading(false);
    }
  };

  const isValid = /^[a-zA-Z0-9_]{3,30}$/.test(username);

  return (
    <div className="auth-container">
      <div className="auth-bg-glow" style={{ background: 'var(--accent-purple)', top: '-200px', left: '-200px' }} />
      <div className="auth-bg-glow" style={{ background: 'var(--accent-green)', bottom: '-200px', right: '-200px' }} />

      <div className="auth-box animate-slide" style={{ maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="logo-icon" style={{ width: 56, height: 56, fontSize: 26, margin: '0 auto 16px' }}>🏷️</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            Choose Your Username
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Hi <strong style={{ color: 'var(--text-primary)' }}>{user?.name}</strong>! Pick a unique username for your Dena-Paona profile.
          </p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          {/* Progress steps */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28, alignItems: 'center' }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--accent-purple)' }} />
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--border)' }} />
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--border)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Step 1 of 2</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 8 }}>
              <label className="form-label">Username</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', fontSize: 16, pointerEvents: 'none'
                }}>@</span>
                <input
                  id="set-username-input"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: 28 }}
                  placeholder="yourname"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  required
                  minLength={3}
                  maxLength={30}
                  autoFocus
                />
              </div>
            </div>

            {/* Availability indicator */}
            {username.length >= 3 && (
              <div style={{ marginBottom: 16, fontSize: 13 }}>
                {checking ? (
                  <span style={{ color: 'var(--text-muted)' }}>⟳ Checking availability...</span>
                ) : !isValid ? (
                  <span style={{ color: 'var(--accent-red)' }}>❌ Only letters, numbers and underscores allowed</span>
                ) : available === true ? (
                  <span style={{ color: 'var(--accent-green)' }}>✅ @{username} is available!</span>
                ) : available === false ? (
                  <span style={{ color: 'var(--accent-red)' }}>❌ @{username} is already taken</span>
                ) : null}
              </div>
            )}

            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
              3-30 characters. Letters, numbers and underscores only. Cannot be changed later easily.
            </p>

            <button
              id="set-username-submit"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading || !isValid || available === false}
              style={{ width: '100%' }}
            >
              {loading ? '⟳ Setting username...' : '✅ Set Username & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
