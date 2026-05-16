'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { format } from 'date-fns';

interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  age: number | null;
  gender: string | null;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
}

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', age: '', gender: '' });
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('dp_token');
      const res = await axios.get('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } });
      setProfile(res.data.user);
      setForm({ name: res.data.user.name, age: res.data.user.age || '', gender: res.data.user.gender || '' });
    } catch { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
    if (user) fetchProfile();
  }, [user, isLoading, router, fetchProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('dp_token');
      await axios.put('/api/user/profile', form, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Profile updated!');
      setEditing(false);
      fetchProfile();
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <AppLayout><div style={{ padding: 32 }}><div className="skeleton" style={{ height: 300, borderRadius: 16 }} /></div></AppLayout>;
  if (!profile) return null;

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <AppLayout>
      <div style={{ paddingBottom: 40 }}>
        <div className="page-header">
          <h1>Profile 👤</h1>
          <p>Manage your account information</p>
        </div>

        <div style={{ padding: '24px 32px', maxWidth: 640 }}>
          {/* Avatar Card */}
          <div className="card" style={{ marginBottom: 20, textAlign: 'center', padding: 32 }}>
            <div className="avatar" style={{ width: 80, height: 80, fontSize: 28, margin: '0 auto 16px', background: 'linear-gradient(135deg, var(--accent-purple), #7c3aed)' }}>
              {getInitials(profile.name)}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{profile.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>@{profile.username}</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
              {profile.is_verified && <span className="badge badge-green">✓ Verified</span>}
              {profile.is_admin && <span className="badge badge-purple">🛡️ Admin</span>}
              <span className="badge badge-amber">💰 Member</span>
            </div>
          </div>

          {/* Info Card */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>Account Information</h3>
              {!editing && (
                <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>✏️ Edit</button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  <div className="form-group">
                    <label className="form-label">Age</label>
                    <input
                      type="number"
                      className="form-input"
                      value={form.age}
                      onChange={e => setForm(p => ({ ...p, age: e.target.value }))}
                      min="1" max="120"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select
                      className="form-select"
                      value={form.gender}
                      onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
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
                  { label: 'Full Name', value: profile.name, icon: '👤' },
                  { label: 'Username', value: `@${profile.username}`, icon: '🏷️' },
                  { label: 'Email', value: profile.email, icon: '📧' },
                  { label: 'Phone', value: profile.phone, icon: '📱' },
                  { label: 'Age', value: profile.age ? `${profile.age} years` : 'Not set', icon: '🎂' },
                  { label: 'Gender', value: profile.gender || 'Not set', icon: '⚧️' },
                  { label: 'Member Since', value: format(new Date(profile.created_at), 'dd MMMM yyyy'), icon: '📅' },
                ].map(({ label, value, icon }, i) => (
                  <div key={label} style={{
                    display: 'flex', gap: 14, padding: '12px 0',
                    borderBottom: i < 6 ? '1px solid var(--border)' : 'none',
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
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>🔐 Security</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>Email Verification</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Your email is verified and secure</p>
                </div>
                <span className="badge badge-green">✓ Verified</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>Password</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Secured with bcrypt hashing</p>
                </div>
                <span className="badge badge-green">🔒 Hashed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
