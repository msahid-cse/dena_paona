'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AdminUsersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
    if (action === 'delete' && !confirm('Are you sure you want to permanently delete this user?')) return;
    setActionLoading(userId + action);
    try {
      const token = localStorage.getItem('dp_token');
      await axios.put(`/api/admin/users/${userId}`, { action }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Action '${action}' completed`);
      fetchUsers(pagination.page);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) toast.error(err.response.data.error);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AppLayout>
      <div style={{ paddingBottom: 40 }}>
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1>👥 User Management</h1>
              <p>View, ban, or delete user accounts</p>
            </div>
            <Link href="/admin" className="btn btn-outline btn-sm">← Admin Panel</Link>
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
                placeholder="Search users by name, email, username..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchUsers(1)}
              />
            </div>
            <button className="btn btn-primary" onClick={() => fetchUsers(1)}>Search</button>
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
                    <th>Transactions</th>
                    <th>Joined</th>
                    <th>Actions</th>
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
                          {u.is_verified ? <span className="badge badge-green" style={{ width: 'fit-content' }}>✓ Verified</span> : <span className="badge badge-red" style={{ width: 'fit-content' }}>Unverified</span>}
                          {u.is_admin && <span className="badge badge-purple" style={{ width: 'fit-content' }}>🛡️ Admin</span>}
                          {u.is_banned && <span className="badge badge-red" style={{ width: 'fit-content' }}>🚫 Banned</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 12 }}>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{u.stats?.transaction_count || 0} txns</div>
                          <div style={{ color: 'var(--text-muted)' }}>৳{parseFloat(String(u.stats?.total_amount || 0)).toLocaleString()}</div>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{format(new Date(u.created_at), 'dd MMM yyyy')}</td>
                      <td>
                        {u.id !== user?.id && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {u.is_banned ? (
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleAction(u.id, 'unban')}
                                disabled={actionLoading === u.id + 'unban'}
                              >
                                ✓ Unban
                              </button>
                            ) : (
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => handleAction(u.id, 'ban')}
                                disabled={actionLoading === u.id + 'ban'}
                                style={{ color: 'var(--accent-amber)' }}
                              >
                                🚫 Ban
                              </button>
                            )}
                            {!u.is_admin ? (
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => handleAction(u.id, 'make_admin')}
                                disabled={actionLoading === u.id + 'make_admin'}
                                style={{ color: 'var(--accent-purple-light)' }}
                              >
                                ↑ Admin
                              </button>
                            ) : (
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => handleAction(u.id, 'remove_admin')}
                                disabled={actionLoading === u.id + 'remove_admin'}
                              >
                                ↓ Remove
                              </button>
                            )}
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleAction(u.id, 'delete')}
                              disabled={actionLoading === u.id + 'delete'}
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                        {u.id === user?.id && (
                          <span className="badge badge-purple" style={{ fontSize: 9 }}>You</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
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
