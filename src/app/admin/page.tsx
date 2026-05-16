'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { format } from 'date-fns';
import Link from 'next/link';

interface AdminStats {
  stats: {
    totalUsers: number;
    verifiedUsers: number;
    bannedUsers: number;
    totalTransactions: number;
    totalVolume: number;
  };
  recentLogs: Array<{ id: string; level: string; message: string; created_at: string }>;
  recentActivity: Array<{ id: string; action: string; description: string; name: string; username: string; created_at: string }>;
}

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('dp_token');
      const res = await axios.get('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } });
      setData(res.data);
    } catch { router.push('/dashboard'); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push('/login');
      else if (!user.isAdmin) router.push('/dashboard');
      else fetchStats();
    }
  }, [user, isLoading, router, fetchStats]);

  if (loading || !data) {
    return (
      <AppLayout>
        <div style={{ padding: 32 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  const { stats, recentLogs, recentActivity } = data;

  return (
    <AppLayout>
      <div style={{ paddingBottom: 40 }}>
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1>🛡️ Admin Panel</h1>
              <p>System overview and management</p>
            </div>
            <Link href="/admin/users" className="btn btn-primary">👥 Manage Users</Link>
          </div>
        </div>

        <div style={{ padding: '24px 32px' }}>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'var(--accent-purple)' },
              { label: 'Verified Users', value: stats.verifiedUsers, icon: '✅', color: 'var(--accent-green)' },
              { label: 'Banned Users', value: stats.bannedUsers, icon: '🚫', color: 'var(--accent-red)' },
              { label: 'Transactions', value: stats.totalTransactions, icon: '💳', color: 'var(--accent-amber)' },
              { label: 'Total Volume', value: `৳${(stats.totalVolume / 1000).toFixed(1)}K`, icon: '💰', color: 'var(--accent-blue)', isString: true },
            ].map(({ label, value, icon, color, isString }) => (
              <div key={label} className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</p>
                    <p style={{ fontSize: 24, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>
                      {isString ? value : value.toLocaleString()}
                    </p>
                  </div>
                  <span style={{ fontSize: 24 }}>{icon}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="content-grid">
            {/* Recent Activity */}
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📋 Recent User Activity</h2>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {recentActivity.length === 0 ? (
                  <div className="empty-state" style={{ padding: 30 }}>No activity recorded</div>
                ) : (
                  recentActivity.map((a, i) => (
                    <div key={a.id} style={{
                      display: 'flex', gap: 12, padding: '14px 20px',
                      borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border)' : 'none',
                      alignItems: 'center'
                    }}>
                      <div className="avatar avatar-sm">{(a.name || 'U').charAt(0)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <strong>@{a.username}:</strong> {a.description}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{format(new Date(a.created_at), 'dd MMM yyyy, hh:mm a')}</p>
                      </div>
                      <span className="badge badge-purple" style={{ fontSize: 9 }}>{a.action.replace(/_/g, ' ')}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* System Logs */}
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🔧 System Logs</h2>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {recentLogs.length === 0 ? (
                  <div className="empty-state" style={{ padding: 30 }}>No system logs</div>
                ) : (
                  recentLogs.slice(0, 15).map((log, i) => (
                    <div key={log.id} style={{
                      padding: '10px 16px',
                      borderBottom: i < recentLogs.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span className={`badge ${log.level === 'error' ? 'badge-red' : log.level === 'warn' ? 'badge-amber' : 'badge-green'}`} style={{ fontSize: 9, flexShrink: 0 }}>
                          {log.level}
                        </span>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {log.message}
                        </p>
                      </div>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, paddingLeft: 40 }}>
                        {format(new Date(log.created_at), 'dd MMM, hh:mm a')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
