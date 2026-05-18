'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AppLayout from '@/components/AppLayout';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  name: string;
  username: string | null;
  email: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
  profile_picture: string | null;
  bkash_available: boolean;
  username_set: boolean;
  profile_completed: boolean;
  language_pref: string;
}

export default function ProfilePage() {
  const { user, isLoading, refreshUser } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', age: '', gender: '', phone: '', bkash_available: false, language_pref: 'en' });
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('dp_token');
      const res = await axios.get('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } });
      const u = res.data.user;
      setProfile(u);
      setForm({
        name: u.name,
        username: u.username || '',
        age: u.age || '',
        gender: u.gender || '',
        phone: u.phone || '',
        bkash_available: u.bkash_available || false,
        language_pref: u.language_pref || 'en',
      });
    } catch { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
    if (user) fetchProfile();
  }, [user, isLoading, router, fetchProfile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUploadAvatar = async () => {
    if (!avatarPreview) return;
    setUploadingAvatar(true);
    try {
      const token = localStorage.getItem('dp_token');
      await axios.post('/api/user/complete-profile', { imageData: avatarPreview }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Profile picture updated!');
      setAvatarPreview(null);
      await fetchProfile();
      await refreshUser();
    } catch { toast.error('Avatar upload failed'); }
    finally { setUploadingAvatar(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('dp_token');
      await axios.put('/api/user/profile', form, { headers: { Authorization: `Bearer ${token}` } });
      // Also update bkash and language via complete-profile endpoint
      await axios.put('/api/user/complete-profile', {
        phone: form.phone,
        bkash_available: form.bkash_available,
        age: form.age,
        gender: form.gender,
        language_pref: form.language_pref,
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Profile updated!');
      setEditing(false);
      await fetchProfile();
      await refreshUser();
    } catch (error: any) { 
      toast.error(error.response?.data?.error || 'Update failed'); 
    }
    finally { setSaving(false); }
  };

  if (loading) return <AppLayout><div style={{ padding: 32 }}><div className="skeleton" style={{ height: 300, borderRadius: 16 }} /></div></AppLayout>;
  if (!profile) return null;

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const avatarSrc = avatarPreview || profile.profile_picture;

  return (
    <AppLayout>
      <div style={{ paddingBottom: 40 }}>
        <div className="page-header">
          <h1>{t('profile')} 👤</h1>
          <p>Manage your account information</p>
        </div>

        <div style={{ padding: '24px 32px', maxWidth: 640 }}>
          {/* Profile Incomplete Banner */}
          {!profile.profile_completed && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', borderRadius: 12, marginBottom: 20,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
              border: '1px solid rgba(99,102,241,0.3)',
            }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                  🎨 {t('profileIncomplete')}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('completeProfileBanner')}</p>
              </div>
              <Link href="/complete-profile" className="btn btn-primary btn-sm" style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}>
                Complete →
              </Link>
            </div>
          )}

          {/* Avatar Card */}
          <div className="card" style={{ marginBottom: 20, textAlign: 'center', padding: 32 }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="Profile"
                  style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border)' }}
                />
              ) : (
                <div className="avatar" style={{ width: 80, height: 80, fontSize: 28, background: 'linear-gradient(135deg, var(--accent-purple), #7c3aed)' }}>
                  {getInitials(profile.name)}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'absolute', bottom: 0, right: 0, width: 26, height: 26,
                  borderRadius: '50%', background: 'var(--accent-purple)', border: '2px solid var(--bg-primary)',
                  cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                title="Change avatar"
              >
                📷
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />

            {avatarPreview && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
                <button className="btn btn-primary btn-sm" onClick={handleUploadAvatar} disabled={uploadingAvatar}>
                  {uploadingAvatar ? '⟳ Uploading...' : '☁️ Save Photo'}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setAvatarPreview(null)}>Cancel</button>
              </div>
            )}

            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{profile.name}</h2>
            {profile.username && <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>@{profile.username}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
              {profile.is_verified && <span className="badge badge-green">✓ Verified</span>}
              {profile.is_admin && <span className="badge badge-purple">🛡️ Admin</span>}
              {profile.profile_completed && <span className="badge badge-green">✅ Profile Complete</span>}
              {profile.bkash_available && <span className="badge badge-amber">💳 bKash</span>}
              <span className="badge badge-amber">💰 Member</span>
            </div>
          </div>

          {/* Info Card */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>{t('accountInfo')}</h3>
              {!editing && (
                <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>✏️ Edit</button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSave}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  <div className="form-group">
                    <label className="form-label">{t('fullName')}</label>
                    <input type="text" className="form-input" value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('username')}</label>
                    <input type="text" className="form-input" placeholder="unique_username" value={form.username}
                      onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('phone')}</label>
                  <input type="tel" className="form-input" placeholder="01XXXXXXXXX" value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  <div className="form-group">
                    <label className="form-label">{t('age')}</label>
                    <input type="number" className="form-input" value={form.age}
                      onChange={e => setForm(p => ({ ...p, age: e.target.value }))} min="1" max="120" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('gender')}</label>
                    <select className="form-select" value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('language')}</label>
                  <select className="form-select" value={form.language_pref} onChange={e => setForm(p => ({ ...p, language_pref: e.target.value }))}>
                    <option value="en">🇬🇧 English</option>
                    <option value="bn">🇧🇩 বাংলা</option>
                    <option value="banglish">🔤 Banglish</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.bkash_available}
                      onChange={e => setForm(p => ({ ...p, bkash_available: e.target.checked }))}
                      style={{ width: 18, height: 18, accentColor: 'var(--accent-purple)' }} />
                    <span style={{ fontSize: 14 }}>💳 {t('bkashAvailable')}</span>
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button type="button" className="btn btn-outline" onClick={() => setEditing(false)} style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
                    {saving ? '⟳ Saving...' : '💾 Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { label: t('fullName'), value: profile.name, icon: '👤' },
                  { label: t('username'), value: profile.username ? `@${profile.username}` : 'Not set', icon: '🏷️' },
                  { label: t('email'), value: profile.email, icon: '📧' },
                  { label: t('phone'), value: profile.phone || 'Not set', icon: '📱' },
                  { label: t('age'), value: profile.age ? `${profile.age} years` : 'Not set', icon: '🎂' },
                  { label: t('gender'), value: profile.gender || 'Not set', icon: '⚧️' },
                  { label: 'bKash', value: profile.bkash_available ? '✅ Available' : '❌ Not set', icon: '💳' },
                  { label: t('memberSince'), value: format(new Date(profile.created_at), 'dd MMMM yyyy'), icon: '📅' },
                ].map(({ label, value, icon }, i, arr) => (
                  <div key={label} style={{
                    display: 'flex', gap: 14, padding: '12px 0',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: 16, width: 24, flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', width: 110, flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Security Card */}
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>🔐 {t('security')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>Email Verification</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Your email is verified and secure</p>
                </div>
                <span className="badge badge-green">✓ Verified</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>Password</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Secured with bcrypt hashing</p>
                </div>
                <span className="badge badge-green">🔒 Hashed</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>Forgot Password?</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Reset your password via email</p>
                </div>
                <Link href="/forgot-password" className="btn btn-outline btn-sm" style={{ textDecoration: 'none' }}>
                  Reset →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
