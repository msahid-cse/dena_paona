'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { format } from 'date-fns';

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  created_at: string;
}

export default function ActivityPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const token = localStorage.getItem('dp_token');
      const res = await axios.get('/api/dashboard', { headers: { Authorization: `Bearer ${token}` } });
      setLogs(res.data.recentActivity || []);
    } catch { toast.error('Failed to load activity'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
    if (user) fetchLogs();
  }, [user, isLoading, router, fetchLogs]);

  const getIcon = (action: string) => {
    if (action.includes('login')) return { icon: '🔑', color: 'var(--accent-purple)' };
    if (action.includes('created')) return { icon: '➕', color: 'var(--accent-green)' };
    if (action.includes('updated')) return { icon: '✏️', color: 'var(--accent-amber)' };
    if (action.includes('deleted')) return { icon: '🗑️', color: 'var(--accent-red)' };
    return { icon: '📝', color: 'var(--text-muted)' };
  };

  return (
    <AppLayout>
      <div style={{ paddingBottom: 40 }}>
        <div className="page-header">
          <h1>Activity Log 📋</h1>
          <p>Your recent activity history</p>
        </div>

        <div style={{ padding: '24px 32px', maxWidth: 700 }}>
          {loading ? (
            <div>{[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12, marginBottom: 10 }} />)}</div>
          ) : logs.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No activity yet</h3>
              <p>Your actions will appear here once you start using the app</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {logs.map((log, i) => {
                  const { icon, color } = getIcon(log.action);
                  return (
                    <div key={log.id} style={{
                      display: 'flex', gap: 14, padding: '16px 20px',
                      borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none',
                      alignItems: 'flex-start'
                    }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                        {icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
                          {log.description}
                        </p>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span className="badge badge-purple" style={{ fontSize: 9, padding: '2px 6px' }}>{log.action.replace(/_/g, ' ')}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {format(new Date(log.created_at), 'dd MMM yyyy, hh:mm a')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
