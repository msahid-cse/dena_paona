'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AppLayout from '@/components/AppLayout';
import { format } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  sender_name: string;
  sender_username: string;
  is_read: boolean;
  is_actioned: boolean;
  action_taken: string | null;
  data: Record<string, unknown>;
  created_at: string;
}

export default function NotificationsPage() {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('dp_token');
      const res = await axios.get('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(res.data.notifications);
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push('/login');
      else fetchNotifications();
    }
  }, [user, isLoading, router, fetchNotifications]);

  const markAllRead = async () => {
    const token = localStorage.getItem('dp_token');
    await axios.put('/api/notifications', { markAllRead: true }, { headers: { Authorization: `Bearer ${token}` } });
    fetchNotifications();
  };

  const handleAction = async (notifId: string, action: 'approve' | 'reject') => {
    setActionLoading(notifId + action);
    try {
      const token = localStorage.getItem('dp_token');
      await axios.post(`/api/notifications/${notifId}`, { action }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(action === 'approve' ? '✅ Added to your Dena list!' : '❌ Request declined');
      fetchNotifications();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) toast.error(err.response.data.error);
    } finally { setActionLoading(null); }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      transaction_request: '💰',
      transaction_approved: '✅',
      transaction_rejected: '❌',
      dena_info: '📋',
      user_banned: '🚫',
      default: '🔔',
    };
    return icons[type] || icons.default;
  };

  const getTypeBadgeClass = (type: string) => {
    if (type === 'transaction_request') return 'badge-amber';
    if (type === 'transaction_approved') return 'badge-green';
    if (type === 'transaction_rejected') return 'badge-red';
    return 'badge-purple';
  };

  return (
    <AppLayout>
      <div style={{ paddingBottom: 40 }}>
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1>🔔 Notifications</h1>
              <p>Transaction requests and updates</p>
            </div>
            <button className="btn btn-outline btn-sm" onClick={markAllRead}>
              ✓ Mark all read
            </button>
          </div>
        </div>

        <div style={{ padding: '24px 32px', maxWidth: 780 }}>
          {loading ? (
            <div>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12, marginBottom: 12 }} />)}</div>
          ) : notifications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔔</div>
              <h3>No notifications yet</h3>
              <p>When someone adds you to their paona list, you&apos;ll see a request here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {notifications.map(n => (
                <div
                  key={n.id}
                  className="card"
                  style={{
                    padding: '16px 20px',
                    borderLeft: `4px solid ${n.is_read ? 'var(--border)' : 'var(--accent-purple)'}`,
                    opacity: n.is_read && n.is_actioned ? 0.7 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{getTypeIcon(n.type)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{n.title}</span>
                          {!n.is_read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-purple)', display: 'inline-block' }} />}
                          <span className={`badge ${getTypeBadgeClass(n.type)}`} style={{ fontSize: 10 }}>{n.type.replace(/_/g, ' ')}</span>
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {format(new Date(n.created_at), 'dd MMM, hh:mm a')}
                        </span>
                      </div>

                      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>{n.message}</p>

                      {n.sender_name && (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                          From: <strong style={{ color: 'var(--text-secondary)' }}>{n.sender_name}</strong> (@{n.sender_username})
                        </p>
                      )}

                      {/* Action buttons for transaction requests */}
                      {n.type === 'transaction_request' && !n.is_actioned && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleAction(n.id, 'approve')}
                            disabled={!!actionLoading}
                          >
                            {actionLoading === n.id + 'approve' ? '⟳ Adding...' : '✅ Approve & Add to My Dena'}
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleAction(n.id, 'reject')}
                            disabled={!!actionLoading}
                            style={{ color: 'var(--accent-red)' }}
                          >
                            {actionLoading === n.id + 'reject' ? '⟳...' : '❌ Decline'}
                          </button>
                        </div>
                      )}

                      {n.type === 'transaction_request' && n.is_actioned && (
                        <span className={`badge ${n.action_taken === 'approve' ? 'badge-green' : 'badge-red'}`}>
                          {n.action_taken === 'approve' ? '✅ You approved this' : '❌ You declined this'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
