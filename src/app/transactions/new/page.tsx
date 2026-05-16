'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';

interface UserResult {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
}

function NewTransactionContent() {
  const searchParams = useSearchParams();
  const defaultType = searchParams.get('type') as 'dena' | 'paona' | null;
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [type, setType] = useState<'dena' | 'paona'>(defaultType || 'paona');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  // Contact selection
  const [contactMode, setContactMode] = useState<'search' | 'manual'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 2) { setSearchResults([]); return; }
      setSearching(true);
      try {
        const token = localStorage.getItem('dp_token');
        const res = await axios.get(`/api/user/search?q=${searchQuery}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSearchResults(res.data.users);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (contactMode === 'search' && !selectedUser) {
      toast.error('Please select a contact or switch to manual entry');
      return;
    }
    if (contactMode === 'manual' && !manualName.trim()) {
      toast.error('Please enter a contact name');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('dp_token');
      const payload = {
        type,
        amount: parseFloat(amount),
        notes: notes || undefined,
        dueDate: dueDate || undefined,
        ...(contactMode === 'search' && selectedUser
          ? { contactUserId: selectedUser.id, contactName: selectedUser.name }
          : { contactName: manualName, contactPhone: manualPhone || undefined }
        ),
      };

      await axios.post('/api/transactions', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Transaction added successfully!');
      router.push('/transactions');
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        toast.error(err.response.data.error || 'Failed to create transaction');
      } else {
        toast.error('Failed to create transaction');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div style={{ paddingBottom: 40 }}>
        <div className="page-header">
          <h1>Add Transaction ➕</h1>
          <p>Record a new Dena (payable) or Paona (receivable) transaction</p>
        </div>

        <div style={{ padding: '24px 32px' }}>
          <div style={{ maxWidth: 600 }}>
            {/* Type Selector */}
            <div style={{ marginBottom: 24 }}>
              <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>Transaction Type *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setType('paona')}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    border: `2px solid ${type === 'paona' ? 'var(--accent-green)' : 'var(--border)'}`,
                    background: type === 'paona' ? 'rgba(16,185,129,0.05)' : 'var(--bg-card)',
                    padding: 20,
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📥</div>
                  <div style={{ fontWeight: 700, color: 'var(--accent-green)', fontSize: 16 }}>Paona</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Money to Receive</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Someone owes you</div>
                </button>
                <button
                  type="button"
                  onClick={() => setType('dena')}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    border: `2px solid ${type === 'dena' ? 'var(--accent-red)' : 'var(--border)'}`,
                    background: type === 'dena' ? 'rgba(244,63,94,0.05)' : 'var(--bg-card)',
                    padding: 20,
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📤</div>
                  <div style={{ fontWeight: 700, color: 'var(--accent-red)', fontSize: 16 }}>Dena</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Money to Pay</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>You owe someone</div>
                </button>
              </div>
            </div>

            {/* Contact Selection */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>👤 Contact</h3>
                <div className="tabs" style={{ padding: 3 }}>
                  <button className={`tab ${contactMode === 'search' ? 'active' : ''}`} onClick={() => setContactMode('search')}>
                    🔍 Search User
                  </button>
                  <button className={`tab ${contactMode === 'manual' ? 'active' : ''}`} onClick={() => setContactMode('manual')}>
                    ✍️ Manual Entry
                  </button>
                </div>
              </div>

              {contactMode === 'search' ? (
                <div>
                  {selectedUser ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--accent-purple)' }}>
                      <div className="avatar">{selectedUser.name.charAt(0)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{selectedUser.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{selectedUser.username} · {selectedUser.phone}</div>
                      </div>
                      <button onClick={() => setSelectedUser(null)} className="btn btn-outline btn-sm">Change</button>
                    </div>
                  ) : (
                    <div>
                      <div className="search-bar">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                        </svg>
                        <input
                          className="form-input input-with-icon"
                          placeholder="Search by name, username, email, or phone..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                        />
                      </div>
                      {searching && <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>⟳ Searching...</p>}
                      {searchResults.length > 0 && (
                        <div style={{ marginTop: 8, border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                          {searchResults.map(u => (
                            <div
                              key={u.id}
                              onClick={() => { setSelectedUser(u); setSearchQuery(''); setSearchResults([]); }}
                              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <div className="avatar avatar-sm">{u.name.charAt(0)}</div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{u.username} · {u.phone}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                        <div style={{ padding: '12px 0', textAlign: 'center' }}>
                          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No registered users found.</p>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setContactMode('manual')}
                            style={{ marginTop: 8 }}
                          >
                            ✍️ Add as unregistered contact
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="form-group">
                    <label className="form-label">Contact Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Full name of the person"
                      value={manualName}
                      onChange={e => setManualName(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="01XXXXXXXXX"
                      value={manualPhone}
                      onChange={e => setManualPhone(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Transaction Details */}
            <form onSubmit={handleSubmit}>
              <div className="card">
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>💰 Transaction Details</h3>

                <div className="form-group">
                  <label className="form-label">Amount (৳) *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    min="1"
                    step="0.01"
                    style={{ fontSize: 18, fontFamily: 'JetBrains Mono, monospace' }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Due Date (Optional)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 24 }}>
                  <label className="form-label">Notes (Optional)</label>
                  <textarea
                    className="form-textarea"
                    placeholder="What is this transaction for?"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>

                {/* Summary */}
                {amount && (parseFloat(amount) > 0) && (
                  <div style={{
                    padding: '16px',
                    background: type === 'paona' ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)',
                    border: `1px solid ${type === 'paona' ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`,
                    borderRadius: 12,
                    marginBottom: 20
                  }}>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>Transaction Summary:</p>
                    <p style={{ fontSize: 14, color: type === 'paona' ? 'var(--accent-green-light)' : 'var(--accent-red-light)' }}>
                      {type === 'paona'
                        ? `📥 ${(contactMode === 'search' ? selectedUser?.name : manualName) || 'Contact'} owes you ৳${parseFloat(amount).toLocaleString()}`
                        : `📤 You owe ${(contactMode === 'search' ? selectedUser?.name : manualName) || 'Contact'} ৳${parseFloat(amount).toLocaleString()}`
                      }
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => router.back()}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`btn ${type === 'paona' ? 'btn-success' : 'btn-danger'}`}
                    disabled={loading}
                    style={{ flex: 2 }}
                  >
                    {loading ? '⟳ Saving...' : `${type === 'paona' ? '📥 Add Paona' : '📤 Add Dena'}`}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function NewTransactionPage() {
  return (
    <Suspense fallback={<AppLayout><div style={{ padding: 32 }}><div className="skeleton" style={{ height: 400, borderRadius: 16 }} /></div></AppLayout>}>
      <NewTransactionContent />
    </Suspense>
  );
}
