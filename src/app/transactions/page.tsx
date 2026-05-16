'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  contact_name: string;
  contact_registered_name: string | null;
  contact_username: string | null;
  amount: number;
  paid_amount: number;
  remaining_amount: number;
  type: 'dena' | 'paona';
  status: 'pending' | 'partial' | 'cleared';
  notes: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

interface PaymentModalProps {
  transaction: Transaction;
  onClose: () => void;
  onSuccess: () => void;
}

function PaymentModal({ transaction, onClose, onSuccess }: PaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const remaining = parseFloat(String(transaction.remaining_amount));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payAmount = parseFloat(amount);
    if (payAmount <= 0 || payAmount > remaining) {
      toast.error(`Amount must be between 1 and ${remaining}`);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('dp_token');
      await axios.put(`/api/transactions/${transaction.id}`, {
        paymentAmount: payAmount,
        notes: notes || `Payment of ৳${payAmount}`,
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Payment recorded successfully!');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        toast.error(err.response.data.error || 'Payment failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>💸 Record Payment</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        <div className="card" style={{ padding: '12px 16px', marginBottom: 20, background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Contact:</span>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{transaction.contact_registered_name || transaction.contact_name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Amount:</span>
            <span className="amount-neutral" style={{ fontSize: 13 }}>৳{parseFloat(String(transaction.amount)).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Remaining:</span>
            <span className={transaction.type === 'paona' ? 'amount-paona' : 'amount-dena'} style={{ fontSize: 14, fontWeight: 700 }}>
              ৳{remaining.toLocaleString()}
            </span>
          </div>
          <div style={{ marginTop: 8 }}>
            <div className="progress-bar">
              <div className="progress-fill" style={{
                width: `${(parseFloat(String(transaction.paid_amount)) / parseFloat(String(transaction.amount))) * 100}%`,
                background: 'var(--accent-green)',
              }} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
              {Math.round((parseFloat(String(transaction.paid_amount)) / parseFloat(String(transaction.amount))) * 100)}% paid
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Payment Amount (৳) *</label>
            <input
              type="number"
              className="form-input"
              placeholder={`Max: ${remaining}`}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="1"
              max={remaining}
              step="0.01"
              required
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {[25, 50, 75, 100].map(pct => (
                <button
                  key={pct}
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setAmount(String((remaining * pct / 100).toFixed(2)))}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <textarea
              className="form-textarea"
              placeholder="Payment notes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" className="btn btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-success" disabled={loading} style={{ flex: 1 }}>
              {loading ? '⟳ Recording...' : '✅ Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'paona' | 'dena'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [paymentModal, setPaymentModal] = useState<Transaction | null>(null);

  const fetchTransactions = useCallback(async () => {
    const token = localStorage.getItem('dp_token');
    const params = new URLSearchParams();
    if (activeTab !== 'all') params.set('type', activeTab);
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);

    try {
      const res = await axios.get(`/api/transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data.transactions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, search]);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
    if (user) fetchTransactions();
  }, [user, isLoading, router, fetchTransactions]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      const token = localStorage.getItem('dp_token');
      await axios.delete(`/api/transactions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Transaction deleted');
      fetchTransactions();
    } catch {
      toast.error('Delete failed');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'cleared': return <span className="badge badge-green">✓ Cleared</span>;
      case 'partial': return <span className="badge badge-amber">◑ Partial</span>;
      default: return <span className="badge badge-red">⏳ Pending</span>;
    }
  };

  return (
    <AppLayout>
      {paymentModal && (
        <PaymentModal
          transaction={paymentModal}
          onClose={() => setPaymentModal(null)}
          onSuccess={fetchTransactions}
        />
      )}

      <div style={{ paddingBottom: 40 }}>
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1>Transactions 💳</h1>
              <p>Manage all your Dena and Paona records</p>
            </div>
            <Link href="/transactions/new" className="btn btn-primary">➕ Add New</Link>
          </div>
        </div>

        <div style={{ padding: '24px 32px' }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div className="tabs" style={{ flex: '0 0 auto' }}>
              {['all', 'paona', 'dena'].map(t => (
                <button
                  key={t}
                  className={`tab ${activeTab === t ? 'active' : ''}`}
                  onClick={() => setActiveTab(t as 'all' | 'paona' | 'dena')}
                >
                  {t === 'all' ? '📋 All' : t === 'paona' ? '📥 Paona' : '📤 Dena'}
                </button>
              ))}
            </div>

            <select
              className="form-select"
              style={{ width: 'auto', flex: '0 0 auto' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="cleared">Cleared</option>
            </select>

            <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                className="form-input input-with-icon"
                placeholder="Search by contact name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div>{[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12, marginBottom: 10 }} />)}</div>
          ) : transactions.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon">💸</div>
              <h3>No transactions found</h3>
              <p>Add your first Dena or Paona transaction to get started</p>
              <Link href="/transactions/new" className="btn btn-primary" style={{ marginTop: 8 }}>➕ Add Transaction</Link>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Contact</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Paid</th>
                    <th>Remaining</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar avatar-sm">{(t.contact_registered_name || t.contact_name)?.charAt(0) || '?'}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                              {t.contact_registered_name || t.contact_name}
                            </div>
                            {t.contact_username && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{t.contact_username}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${t.type === 'paona' ? 'badge-green' : 'badge-red'}`}>
                          {t.type === 'paona' ? '📥 Paona' : '📤 Dena'}
                        </span>
                      </td>
                      <td className="amount-neutral">৳{parseFloat(String(t.amount)).toLocaleString()}</td>
                      <td className="amount-paona">৳{parseFloat(String(t.paid_amount)).toLocaleString()}</td>
                      <td className={t.type === 'paona' ? 'amount-paona' : 'amount-dena'}>
                        ৳{parseFloat(String(t.remaining_amount)).toLocaleString()}
                      </td>
                      <td>{getStatusBadge(t.status)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {format(new Date(t.created_at), 'dd MMM yyyy')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {t.status !== 'cleared' && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => setPaymentModal(t)}
                              title="Record payment"
                            >
                              💸
                            </button>
                          )}
                          <Link href={`/transactions/${t.id}`} className="btn btn-outline btn-sm">
                            👁️
                          </Link>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(t.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
