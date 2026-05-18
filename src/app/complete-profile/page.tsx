'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function CompleteProfilePage() {
  const { user, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    phone: '',
    bkash_available: false,
    age: '',
    gender: '',
    language_pref: 'en',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return; }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadAvatar = async () => {
    if (!avatarPreview) return;
    setUploading(true);
    try {
      const token = localStorage.getItem('dp_token');
      await axios.post('/api/user/complete-profile', { imageData: avatarPreview }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Profile picture uploaded!');
    } catch {
      toast.error('Avatar upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = async () => {
    try {
      const token = localStorage.getItem('dp_token');
      await axios.put('/api/user/complete-profile', {}, { headers: { Authorization: `Bearer ${token}` } });
      await refreshUser();
    } catch {}
    router.push('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('dp_token');
      // Upload avatar if pending
      if (avatarPreview && !uploading) {
        await axios.post('/api/user/complete-profile', { imageData: avatarPreview }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      await axios.put('/api/user/complete-profile', form, { headers: { Authorization: `Bearer ${token}` } });
      await refreshUser();
      toast.success('Profile completed! Welcome to Dena-Paona 🎉');
      router.push('/dashboard');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="auth-container" style={{ padding: '40px 20px' }}>
      <div className="auth-bg-glow" style={{ background: 'var(--accent-green)', top: '-200px', right: '-100px' }} />
      <div className="auth-bg-glow" style={{ background: 'var(--accent-blue)', bottom: '-200px', left: '-100px' }} />

      <div className="auth-box animate-slide" style={{ maxWidth: 520 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
            🎨 Complete Your Profile
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            This helps others recognize you. You can always skip and do it later.
          </p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          {/* Progress */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28, alignItems: 'center' }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--accent-purple)' }} />
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--accent-purple)' }} />
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--border)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Step 2 of 2</span>
          </div>

          {/* Avatar upload */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 96, height: 96, borderRadius: '50%', margin: '0 auto 12px',
                background: avatarPreview ? 'transparent' : 'linear-gradient(135deg, var(--accent-purple), #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', overflow: 'hidden',
                border: '3px dashed var(--border)', transition: 'border-color 0.2s',
                fontSize: avatarPreview ? undefined : 28, color: 'white', fontWeight: 700,
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-purple)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              {avatarPreview
                ? <img src={avatarPreview} alt="Avatar preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : user?.profilePicture
                  ? <img src={user.profilePicture} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : getInitials(user?.name || '')
              }
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                📷 {avatarPreview ? 'Change Photo' : 'Upload Photo'}
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleUploadAvatar}
                  disabled={uploading}
                >
                  {uploading ? '⟳ Uploading...' : '☁️ Save Photo'}
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group">
                <label className="form-label">Phone (Optional)</label>
                <input
                  id="cp-phone"
                  type="tel"
                  className="form-input"
                  placeholder="01XXXXXXXXX"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Age (Optional)</label>
                <input
                  id="cp-age"
                  type="number"
                  className="form-input"
                  placeholder="25"
                  value={form.age}
                  onChange={e => setForm(p => ({ ...p, age: e.target.value }))}
                  min="1" max="120"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group">
                <label className="form-label">Gender (Optional)</label>
                <select
                  id="cp-gender"
                  className="form-select"
                  value={form.gender}
                  onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Language</label>
                <select
                  id="cp-language"
                  className="form-select"
                  value={form.language_pref}
                  onChange={e => setForm(p => ({ ...p, language_pref: e.target.value }))}
                >
                  <option value="en">🇬🇧 English</option>
                  <option value="bn">🇧🇩 বাংলা</option>
                  <option value="banglish">🔤 Banglish</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  id="cp-bkash"
                  type="checkbox"
                  checked={form.bkash_available}
                  onChange={e => setForm(p => ({ ...p, bkash_available: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: 'var(--accent-purple)' }}
                />
                <span style={{ fontSize: 14 }}>
                  💳 I accept bKash / mobile banking payments
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleSkip}
                style={{ flex: 1 }}
              >
                Skip for now →
              </button>
              <button
                id="cp-submit"
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ flex: 2 }}
              >
                {saving ? '⟳ Saving...' : '🎉 Complete Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
