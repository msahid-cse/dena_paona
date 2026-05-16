'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { format } from 'date-fns';

interface DashboardData {
  summary: { totalPaona: number; totalDena: number; netBalance: number };
  byContact: Array<{
    person_name: string;
    contact_user_id: string | null;
    username: string | null;
    total_paona: number;
    total_dena: number;
    transaction_count: number;
    last_activity: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    description: string;
    created_at: string;
  }>;
}

function StatCard({ label, amount, icon, type, subtitle }: { label: string; amount: number; icon: string; type: 'paona' | 'dena' | 'net' | 'total'; subtitle?: string }) {
  const color = type === 'paona' ? 'var(--accent-green)' : type === 'dena' ? 'var(--accent-red)' : type === 'net' ? (amount >= 0 ? 'var(--accent-purple)' : 'var(--accent-red)') : 'var(--accent-amber)';
  const textColor = type === 'paona' ? 'amount-paona' : type === 'dena' ? 'amount-dena' : 'amount-neutral';

  return (
    <div className={`stat-card stat-card-${type}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            {label}
          </p>
          <div className={textColor} style={{ fontSize: 28, fontWeight: 800 }}>
            {amount < 0 ? '-' : ''}৳{Math.abs(amount).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
        </div>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: `${color}18`,
          border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
        }}>
          {icon}
        </div>
      </div>
      {subtitle && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{subtitle}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchDashboard = useCallback(async () => {
    try {
      const token = localStorage.getItem('dp_token');
      const res = await axios.get('/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
    if (user) fetchDashboard();
  }, [user, isLoading, router, fetchDashboard]);

  const filteredContacts = data?.byContact.filter(c =>
    c.person_name?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const getActivityIcon = (action: string) => {
    if (action.includes('created')) return '➕';
    if (action.includes('updated')) return '✏️';
    if (action.includes('deleted')) return '🗑️';
    if (action.includes('login')) return '🔑';
    return '📝';
  };

  if (isLoading || loading) {
    return (
      <AppLayout>
        <div style={{ padding: 32 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />)}
          </div>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 12, marginBottom: 12 }} />)}
        </div>
      </AppLayout>
    );
  }

  const { summary } = data || { summary: { totalPaona: 0, totalDena: 0, netBalance: 0 } };

  return (
    <AppLayout>
      <div style={{ padding: '0 0 40px' }}>
        {/* Page Header */}
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1>Dashboard 📊</h1>
              <p>Welcome back, <strong>{user?.name}</strong> · {format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
            </div>
            <Link href="/transactions/new" className="btn btn-primary">
              ➕ Add Transaction
            </Link>
          </div>
        </div>

        <div style={{ padding: '24px 32px' }}>
          {/* Stats Grid */}
          <div className="stats-grid" style={{ marginBottom: 28 }}>
            <StatCard
              label="Total Paona (Receivable)"
              amount={summary.totalPaona}
              icon="📥"
              type="paona"
              subtitle="Money others owe you"
            />
            <StatCard
              label="Total Dena (Payable)"
              amount={summary.totalDena}
              icon="📤"
              type="dena"
              subtitle="Money you owe others"
            />
            <StatCard
              label="Net Balance"
              amount={summary.netBalance}
              icon={summary.netBalance >= 0 ? '📈' : '📉'}
              type="net"
              subtitle={summary.netBalance >= 0 ? 'You are in the positive' : 'You owe more than you receive'}
            />
          </div>

          {/* Net Balance Banner */}
          {Math.abs(summary.netBalance) > 0 && (
            <div className="card" style={{
              marginBottom: 28,
              background: summary.netBalance > 0
                ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.03))'
                : 'linear-gradient(135deg, rgba(244,63,94,0.08), rgba(244,63,94,0.03))',
              border: `1px solid ${summary.netBalance > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <span style={{ fontSize: 24 }}>{summary.netBalance > 0 ? '🎉' : '⚠️'}</span>
              <p style={{ color: summary.netBalance > 0 ? 'var(--accent-green-light)' : 'var(--accent-red-light)', fontSize: 14 }}>
                {summary.netBalance > 0
                  ? `Overall, people owe you ৳${summary.netBalance.toLocaleString()} more than you owe them.`
                  : `Overall, you owe ৳${Math.abs(summary.netBalance).toLocaleString()} more than others owe you.`
                }
              </p>
            </div>
          )}

          <div className="content-grid">
            {/* Contact Ledger */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>👥 Contact Ledger</h2>
                <Link href="/transactions" style={{ fontSize: 13, color: 'var(--accent-purple-light)', textDecoration: 'none' }}>
                  View All →
                </Link>
              </div>

              <div className="search-bar" style={{ marginBottom: 16 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  className="form-input input-with-icon"
                  placeholder="Search contacts..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {filteredContacts.length === 0 ? (
                <div className="card empty-state">
                  <div className="empty-state-icon">💸</div>
                  <h3>No transactions yet</h3>
                  <p>Add your first transaction to start tracking debts and credits</p>
                  <Link href="/transactions/new" className="btn btn-primary" style={{ marginTop: 8 }}>
                    ➕ Add Transaction
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filteredContacts.map((contact, i) => {
                    const netForContact = contact.total_paona - contact.total_dena;
                    return (
                      <div key={i} className="card" style={{ padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div className="avatar">
                            {contact.person_name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {contact.person_name}
                                </p>
                                {contact.username && (
                                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{contact.username}</p>
                                )}
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div className={netForContact >= 0 ? 'amount-paona' : 'amount-dena'} style={{ fontSize: 16 }}>
                                  {netForContact < 0 ? '-' : '+'}৳{Math.abs(netForContact).toLocaleString()}
                                </div>
                                <span className={`badge ${netForContact >= 0 ? 'badge-green' : 'badge-red'}`} style={{ marginTop: 4 }}>
                                  {netForContact >= 0 ? 'Paona' : 'Dena'}
                                </span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                              {contact.total_paona > 0 && (
                                <span style={{ fontSize: 11, color: 'var(--accent-green)' }}>↑ ৳{contact.total_paona.toLocaleString()} receivable</span>
                              )}
                              {contact.total_dena > 0 && (
                                <span style={{ fontSize: 11, color: 'var(--accent-red)' }}>↓ ৳{contact.total_dena.toLocaleString()} payable</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Activity Log */}
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>📋 Recent Activity</h2>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {data?.recentActivity.length === 0 ? (
                  <div className="empty-state" style={{ padding: '30px 20px' }}>
                    <p style={{ fontSize: 13 }}>No activity yet</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {data?.recentActivity.map((activity, i) => (
                      <div key={activity.id} style={{
                        display: 'flex', gap: 12, padding: '14px 20px',
                        borderBottom: i < (data?.recentActivity.length || 0) - 1 ? '1px solid var(--border)' : 'none'
                      }}>
                        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 2 }}>{getActivityIcon(activity.action)}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {activity.description}
                          </p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {format(new Date(activity.created_at), 'dd MMM yyyy, hh:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div style={{ marginTop: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link href="/transactions/new?type=paona" className="btn btn-success" style={{ justifyContent: 'flex-start' }}>
                    📥 Record Paona (Someone owes you)
                  </Link>
                  <Link href="/transactions/new?type=dena" className="btn btn-danger" style={{ justifyContent: 'flex-start' }}>
                    📤 Record Dena (You owe someone)
                  </Link>
                  <Link href="/contacts" className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
                    🔍 Search Users
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
