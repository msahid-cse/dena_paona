'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '', username: '', email: '', phone: '', age: '', gender: '', password: '', confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('/api/auth/register', {
        name: form.name,
        username: form.username,
        email: form.email,
        phone: form.phone,
        age: form.age ? parseInt(form.age) : null,
        gender: form.gender,
        password: form.password,
      });
      toast.success('Registration successful! Check your email for verification code.');
      router.push(`/verify?userId=${res.data.userId}`);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.error || 'Registration failed');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ padding: '40px 20px' }}>
      <div className="auth-bg-glow" style={{ background: 'var(--accent-green)', top: '-200px', right: '-100px' }} />
      <div className="auth-bg-glow" style={{ background: 'var(--accent-purple)', bottom: '-200px', left: '-100px' }} />

      <div className="auth-box animate-slide" style={{ maxWidth: 540 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="logo-icon" style={{ width: 56, height: 56, fontSize: 26, margin: '0 auto 16px' }}>💰</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            Create Your Account
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Join Dena-Paona and start tracking your finances
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  id="reg-name"
                  name="name"
                  type="text"
                  className="form-input"
                  placeholder="Md. Sahid Hasan"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Username *</label>
                <input
                  id="reg-username"
                  name="username"
                  type="text"
                  className="form-input"
                  placeholder="msahid"
                  value={form.username}
                  onChange={handleChange}
                  required
                  pattern="[a-zA-Z0-9_]+"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                id="reg-email"
                name="email"
                type="email"
                className="form-input"
                placeholder="email@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group">
                <label className="form-label">Mobile Number *</label>
                <input
                  id="reg-phone"
                  name="phone"
                  type="tel"
                  className="form-input"
                  placeholder="01XXXXXXXXX"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Age</label>
                <input
                  id="reg-age"
                  name="age"
                  type="number"
                  className="form-input"
                  placeholder="25"
                  value={form.age}
                  onChange={handleChange}
                  min="1"
                  max="120"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                id="reg-gender"
                name="gender"
                className="form-select"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <div className="input-group">
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input input-with-icon-right"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={8}
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
              {form.password && (
                <div style={{ marginTop: 6 }}>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min((form.password.length / 16) * 100, 100)}%`,
                        background: form.password.length < 8 ? 'var(--accent-red)' :
                                    form.password.length < 12 ? 'var(--accent-amber)' :
                                    'var(--accent-green)',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                    Password strength: {form.password.length < 8 ? 'Weak' : form.password.length < 12 ? 'Medium' : 'Strong'}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Confirm Password *</label>
              <input
                id="reg-confirm-password"
                name="confirmPassword"
                type="password"
                className="form-input"
                placeholder="Re-enter your password"
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
              id="reg-submit"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? '⟳ Creating account...' : '🚀 Create Account'}
            </button>
          </form>

          <div className="divider">or</div>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent-purple-light)', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
