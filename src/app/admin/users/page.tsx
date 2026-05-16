'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AppLayout from '@/components/AppLayout';
import { format } from 'date-fns';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  age: number | null;
  gender: string | null;
  is_verified: boolean;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
  stats: { transaction_count: number; total_amount: number };
}

interface EditModal {
  user: User;
  name: string;
  email: string;
  phone: string;
  password: string;
}

export default function AdminUsersPage() {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<EditModal | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', username: '', email: '', phone: '', password: '', gender: '', age: '' });

  const fetchUsers = useCallback(async (page = 1) => {
    try {
      const token = localStorage.getItem('dp_token');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await axios.get(`/api/admin/users?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push('/login');
      else if (!user.isAdmin) router.push('/dashboard');
      else fetchUsers();
    }
  }, [user, isLoading, router, fetchUsers]);

  const handleAction = async (userId: string, action: string) => {
    if (action === 'delete' && !confirm('Permanently delete this user?')) return;
    setActionLoading(userId + action);
    try {
      const token = localStorage.getItem('dp_token');
      if (action === 'delete') {
        await axios.delete(`/api/admin/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.put(`/api/admin/users/${userId}`, { action }, { headers: { Authorization: `Bearer ${token}` } });
      }
      toast.success(`Action '${action}' completed`);
      fetchUsers(pagination.page);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) toast.error(err.response.data.error);
    } finally { setActionLoading(null); }
  };

  const handleEdit = async () => {
    if (!editModal) return;
    setActionLoading('edit');
    try {
      const token = localStorage.getItem('dp_token');
      await axios.put(`/api/admin/users/${editModal.user.id}`, {
        action: 'edit',
        name: editModal.name,
        email: editModal.email,
        phone: editModal.phone,
        password: editModal.password || undefined,
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('User updated!');
      setEditModal(null);
      fetchUsers(pagination.page);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) toast.error(err.response.data.error);
    } finally { setActionLoading(null); }
  };

  const handleCreate = async () => {
    if (!createForm.name || !createForm.username || !createForm.email || !createForm.phone || !createForm.password) {
      toast.error('Please fill all required fields'); return;
    }
    setActionLoading('create');
    try {
      const token = localStorage.getItem('dp_token');
      await axios.post('/api/auth/register', {
        ...createForm,
        age: createForm.age ? parseInt(createForm.age) : null,
      }, { headers: { Authorization: `Bearer ${token}` } });
      // Auto-verify via admin
      toast.success('User created! Note: They need to verify email or admin can verify from list.');
      setCreateModal(false);
      setCreateForm({ name: '', username: '', email: '', phone: '', password: '', gender: '', age: '' });
      setTimeout(() => fetchUsers(1), 1000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) toast.error(err.response.data.error);
    } finally { setActionLoading(null); }
  };

  return (
    <AppLayout>
      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>✏️ Edit User</h2>
              <button onClick={() => setEditModal(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={editModal.name} onChange={e => setEditModal(p => p && ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={editModal.email} onChange={e => setEditModal(p => p && ({ ...p, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={editModal.phone} onChange={e => setEditModal(p => p && ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">New Password (leave blank to keep)</label>
              <input className="form-input" type="password" placeholder="••••••••" value={editModal.password} onChange={e => setEditModal(p => p && ({ ...p, password: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" onClick={() => setEditModal(null)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleEdit} disabled={actionLoading === 'edit'} style={{ flex: 1 }}>
                {actionLoading === 'edit' ? '⟳ Saving...' : '💾 Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {createModal && (
        <div className="modal-overlay" onClick={() => setCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>➕ Create Member</h2>
              <button onClick={() => setCreateModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            {['name', 'username', 'email', 'phone', 'password'].map(field => (
              <div className="form-group" key={field}>
                <label className="form-label" style={{ textTransform: 'capitalize' }}>{field} *</label>
                <input
                  className="form-input"
                  type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                  value={createForm[field as keyof typeof createForm]}
                  onChange={e => setCreateForm(p => ({ ...p, [field]: e.target.value }))}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" onClick={() => setCreateModal(false)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-success" onClick={handleCreate} disabled={actionLoading === 'create'} style={{ flex: 1 }}>
                {actionLoading === 'create' ? '⟳ Creating...' : '✅ Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ paddingBottom: 40 }}>
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1>👥 {t('manageUsers')}</h1>
              <p>Create, edit, ban or delete user accounts</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-success btn-sm" onClick={() => setCreateModal(true)}>➕ Create Member</button>
              <Link href="/admin" className="btn btn-outline btn-sm">← {t('adminPanel')}</Link>
            </div>
          </div>
        </div>

        <div style={{ padding: '24px 32px' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div className="search-bar" style={{ flex: 1 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                className="form-input input-with-icon"
                placeholder="Search users..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchUsers(1)}
              />
            </div>
            <button className="btn btn-primary" onClick={() => fetchUsers(1)}>🔍</button>
          </div>

          <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
            {pagination.total} total users
          </div>

          {loading ? (
            <div>{[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12, marginBottom: 10 }} />)}</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Txns</th>
                    <th>{t('joined')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar avatar-sm">{u.name.charAt(0)}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{u.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 12 }}>
                          <div style={{ color: 'var(--text-secondary)' }}>{u.email}</div>
                          <div style={{ color: 'var(--text-muted)' }}>{u.phone}</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {u.is_verified
                            ? <span className="badge badge-green" style={{ width: 'fit-content' }}>✓ Verified</span>
                            : <span className="badge badge-red" style={{ width: 'fit-content' }}>Unverified</span>}
                          {u.is_admin && <span className="badge badge-purple" style={{ width: 'fit-content' }}>🛡️ Admin</span>}
                          {u.is_banned && <span className="badge badge-red" style={{ width: 'fit-content' }}>🚫 Banned</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 12 }}>
                          <div style={{ fontWeight: 600 }}>{u.stats?.transaction_count || 0}</div>
                          <div style={{ color: 'var(--text-muted)' }}>৳{parseFloat(String(u.stats?.total_amount || 0)).toLocaleString()}</div>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {format(new Date(u.created_at), 'dd MMM yy')}
                      </td>
                      <td>
                        {u.id === user?.id ? (
                          <span className="badge badge-purple" style={{ fontSize: 9 }}>You</span>
                        ) : (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => setEditModal({ user: u, name: u.name, email: u.email, phone: u.phone, password: '' })}
                              style={{ fontSize: 11 }}
                            >✏️</button>
                            {!u.is_verified && (
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleAction(u.id, 'verify')}
                                disabled={actionLoading === u.id + 'verify'}
                                style={{ fontSize: 11 }}
                              >✓ Verify</button>
                            )}
                            {u.is_banned ? (
                              <button className="btn btn-success btn-sm" onClick={() => handleAction(u.id, 'unban')} disabled={!!actionLoading} style={{ fontSize: 11 }}>
                                ✓ {t('unban')}
                              </button>
                            ) : (
                              <button className="btn btn-outline btn-sm" onClick={() => handleAction(u.id, 'ban')} disabled={!!actionLoading} style={{ fontSize: 11, color: 'var(--accent-amber)' }}>
                                🚫 {t('ban')}
                              </button>
                            )}
                            {!u.is_admin ? (
                              <button className="btn btn-outline btn-sm" onClick={() => handleAction(u.id, 'make_admin')} disabled={!!actionLoading} style={{ fontSize: 11, color: 'var(--accent-purple-light)' }}>
                                ↑ Admin
                              </button>
                            ) : (
                              <button className="btn btn-outline btn-sm" onClick={() => handleAction(u.id, 'remove_admin')} disabled={!!actionLoading} style={{ fontSize: 11 }}>
                                ↓ Remove
                              </button>
                            )}
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleAction(u.id, 'delete')}
                              disabled={!!actionLoading}
                              style={{ fontSize: 11 }}
                            >🗑️</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.pages > 1 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`btn btn-sm ${p === pagination.page ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => fetchUsers(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
