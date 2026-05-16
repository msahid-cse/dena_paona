'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { format } from 'date-fns';
import Link from 'next/link';

interface Transaction {
  id: string;
  contact_name: string;
  contact_registered_name: string | null;
  contact_username: string | null;
  contact_email: string | null;
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

interface PaymentRecord {
  id: string;
  amount: number;
  notes: string;
  created_at: string;
}

export default function TransactionDetailPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [paying, setPaying] = useState(false);

  const fetchTransaction = useCallback(async () => {
    const token = localStorage.getItem('dp_token');
    try {
      const res = await axios.get(`/api/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransaction(res.data.transaction);
      setPaymentHistory(res.data.paymentHistory);
    } catch {
      toast.error('Transaction not found');
      router.push('/transactions');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
    if (user) fetchTransaction();
  }, [user, isLoading, router, fetchTransaction]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;
    const amount = parseFloat(payAmount);
    const remaining = parseFloat(String(transaction.remaining_amount));
    if (amount <= 0 || amount > remaining) {
      toast.error(`Amount must be between 1 and ${remaining}`);
      return;
    }
    setPaying(true);
    try {
      const token = localStorage.getItem('dp_token');
      await axios.put(`/api/transactions/${id}`, {
        paymentAmount: amount,
        notes: payNotes || `Payment of ৳${amount}`,
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Payment recorded!');
      setPayAmount('');
      setPayNotes('');
      fetchTransaction();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) toast.error(err.response.data.error);
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ padding: 32 }}>
          <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
        </div>
      </AppLayout>
    );
  }

  if (!transaction) return null;

  const remaining = parseFloat(String(transaction.remaining_amount));
  const paidPercent = Math.round((parseFloat(String(transaction.paid_amount)) / parseFloat(String(transaction.amount))) * 100);
  const contactName = transaction.contact_registered_name || transaction.contact_name;

  return (
    <AppLayout>
      <div style={{ paddingBottom: 40 }}>
        <div className="page-header">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/transactions" className="btn btn-outline btn-sm">← Back</Link>
            <div>
              <h1>Transaction Detail 📋</h1>
              <p>Manage payment and view history</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '24px 32px' }}>
          <div className="content-grid">
            <div>
              {/* Main Info Card */}
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div className="avatar avatar-lg">{contactName?.charAt(0) || '?'}</div>
                    <div>
                      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{contactName}</h2>
                      {transaction.contact_username && (
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>@{transaction.contact_username}</p>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${transaction.type === 'paona' ? 'badge-green' : 'badge-red'}`} style={{ marginBottom: 6 }}>
                      {transaction.type === 'paona' ? '📥 Paona' : '📤 Dena'}
                    </span>
                    <br />
                    <span className={`badge ${transaction.status === 'cleared' ? 'badge-green' : transaction.status === 'partial' ? 'badge-amber' : 'badge-red'}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>

                {/* Amount Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                  {[
                    { label: 'Total Amount', value: transaction.amount, cls: 'amount-neutral' },
                    { label: 'Paid So Far', value: transaction.paid_amount, cls: 'amount-paona' },
                    { label: 'Remaining', value: transaction.remaining_amount, cls: transaction.type === 'paona' ? 'amount-paona' : 'amount-dena' },
                  ].map(({ label, value, cls }) => (
                    <div key={label} style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 10, textAlign: 'center' }}>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</p>
                      <p className={cls} style={{ fontSize: 18, fontWeight: 700 }}>৳{parseFloat(String(value)).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                {/* Progress */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Payment Progress</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-green)' }}>{paidPercent}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: 8 }}>
                    <div className="progress-fill" style={{ width: `${paidPercent}%`, background: paidPercent === 100 ? 'var(--accent-green)' : 'linear-gradient(90deg, var(--accent-purple), var(--accent-green))' }} />
                  </div>
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>📅 Created: {format(new Date(transaction.created_at), 'dd MMM yyyy')}</span>
                  {transaction.due_date && <span>⏰ Due: {format(new Date(transaction.due_date), 'dd MMM yyyy')}</span>}
                  <span>🔄 Updated: {format(new Date(transaction.updated_at), 'dd MMM yyyy')}</span>
                </div>

                {transaction.notes && (
                  <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 10, borderLeft: '3px solid var(--accent-purple)' }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Notes:</p>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{transaction.notes}</p>
                  </div>
                )}
              </div>

              {/* Payment History */}
              <div className="card">
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>📊 Payment History</h3>
                {paymentHistory.length === 0 ? (
                  <div className="empty-state" style={{ padding: '30px 0' }}>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No payments recorded yet</p>
                  </div>
                ) : (
                  <div>
                    {paymentHistory.map((p, i) => (
                      <div key={p.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 0',
                        borderBottom: i < paymentHistory.length - 1 ? '1px solid var(--border)' : 'none'
                      }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💸</div>
                          <div>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{p.notes}</p>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{format(new Date(p.created_at), 'dd MMM yyyy, hh:mm a')}</p>
                          </div>
                        </div>
                        <span className="amount-paona" style={{ fontSize: 14 }}>+৳{parseFloat(String(p.amount)).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Form */}
            {transaction.status !== 'cleared' && (
              <div>
                <div className="card">
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>💸 Record Payment</h3>
                  <form onSubmit={handlePayment}>
                    <div className="form-group">
                      <label className="form-label">Payment Amount (৳)</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder={`Max: ${remaining}`}
                        value={payAmount}
                        onChange={e => setPayAmount(e.target.value)}
                        min="0.01"
                        max={remaining}
                        step="0.01"
                        required
                        style={{ fontSize: 18, fontFamily: 'JetBrains Mono, monospace' }}
                      />
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        {[25, 50, 75, 100].map(pct => (
                          <button
                            key={pct}
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => setPayAmount(String((remaining * pct / 100).toFixed(2)))}
                            style={{ flex: 1 }}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 20 }}>
                      <label className="form-label">Notes</label>
                      <textarea
                        className="form-textarea"
                        placeholder="Payment notes..."
                        value={payNotes}
                        onChange={e => setPayNotes(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn btn-success" disabled={paying} style={{ width: '100%' }}>
                      {paying ? '⟳ Recording...' : '✅ Record Payment'}
                    </button>
                  </form>
                </div>

                {remaining > 0 && (
                  <div className="card" style={{ marginTop: 16, background: 'rgba(244,63,94,0.04)', border: '1px solid rgba(244,63,94,0.15)' }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Outstanding Balance</p>
                    <p className={transaction.type === 'paona' ? 'amount-paona' : 'amount-dena'} style={{ fontSize: 24, fontWeight: 800 }}>
                      ৳{remaining.toLocaleString()}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      {transaction.type === 'paona' ? `${contactName} still owes you this amount` : `You still owe ${contactName} this amount`}
                    </p>
                  </div>
                )}
              </div>
            )}

            {transaction.status === 'cleared' && (
              <div className="card" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center', padding: 32 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                <h3 style={{ color: 'var(--accent-green-light)', fontSize: 16, fontWeight: 700 }}>Fully Cleared!</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>This transaction has been completely settled.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
