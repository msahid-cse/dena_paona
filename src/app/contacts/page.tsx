'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';

interface UserResult {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
}

export default function ContactsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (search.length < 2) { setResults([]); return; }
      setSearching(true);
      try {
        const token = localStorage.getItem('dp_token');
        const res = await axios.get(`/api/user/search?q=${search}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setResults(res.data.users);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <AppLayout>
      <div style={{ paddingBottom: 40 }}>
        <div className="page-header">
          <h1>Search Users 🔍</h1>
          <p>Find registered users by username, email, name, or phone number</p>
        </div>

        <div style={{ padding: '24px 32px', maxWidth: 700 }}>
          <div className="search-bar" style={{ marginBottom: 24 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ left: 16 }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className="form-input input-with-icon"
              style={{ paddingLeft: 50, fontSize: 16, height: 52 }}
              placeholder="Search by name, @username, email, or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {searching && (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 14 }}>⟳ Searching...</div>
          )}

          {search.length >= 2 && !searching && results.length === 0 && (
            <div className="card empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>No users found</h3>
              <p>Try different search terms, or add them as an unregistered contact in a transaction.</p>
            </div>
          )}

          {search.length < 2 && (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                Search for Users
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                Type at least 2 characters to search for registered users
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
                {['Search by name', '@username', 'Email address', 'Phone number'].map(hint => (
                  <span key={hint} className="badge badge-purple">{hint}</span>
                ))}
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>{results.length} user{results.length !== 1 ? 's' : ''} found</p>
              {results.map(u => (
                <div key={u.id} className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="avatar avatar-lg">{u.name.charAt(0).toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>{u.name}</h3>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>@{u.username}</span>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>📧 {u.email}</span>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>📱 {u.phone}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <a
                        href={`/transactions/new?contactId=${u.id}`}
                        className="btn btn-success btn-sm"
                      >
                        📥 Paona
                      </a>
                      <a
                        href={`/transactions/new?contactId=${u.id}&type=dena`}
                        className="btn btn-danger btn-sm"
                      >
                        📤 Dena
                      </a>
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
