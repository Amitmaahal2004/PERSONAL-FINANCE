'use client';

import React, { useState, useEffect } from 'react';
import {
  Repeat,
  Plus,
  Play,
  Pause,
  Trash2,
  CheckCircle2,
  Calendar,
  X,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { IRecurringTransaction, IAccount, ICategory } from '@/types';
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/lib/utils';

export default function RecurringPage() {
  const { user } = useAuth();
  const [recurringList, setRecurringList] = useState<IRecurringTransaction[]>([]);
  const [accounts, setAccounts] = useState<IAccount[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Form
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const fetchRecurring = async () => {
    setLoading(true);
    try {
      const [rRes, aRes, cRes] = await Promise.all([
        fetch('/api/recurring'),
        fetch('/api/accounts'),
        fetch('/api/categories'),
      ]);

      if (rRes.ok) {
        const data = await rRes.json();
        setRecurringList(data.recurring || []);
      }
      if (aRes.ok) {
        const aData = await aRes.json();
        setAccounts(aData.accounts || []);
        if (aData.accounts?.length > 0 && !accountId) {
          setAccountId(aData.accounts[0]._id);
        }
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setCategories(cData.categories || []);
        if (cData.categories?.length > 0 && !category) {
          setCategory(cData.categories[0].name);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecurring();
  }, []);

  const handleCreateRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          amount: parseFloat(amount),
          type,
          category,
          accountId,
          frequency,
          startDate,
          nextDueDate: startDate,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to schedule recurring transaction.');
        return;
      }

      setCreateModalOpen(false);
      setTitle('');
      setAmount('');
      setNotes('');
      fetchRecurring();
    } catch (err: any) {
      setError(err.message || 'Error creating recurring transaction.');
    }
  };

  const toggleStatus = async (item: IRecurringTransaction) => {
    const newStatus = item.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`/api/recurring/${item._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchRecurring();
    } catch (err) {
      console.error(err);
    }
  };

  const handleProcessPayment = async (recurringId: string) => {
    try {
      const res = await fetch('/api/recurring/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recurringId }),
      });
      if (res.ok) {
        fetchRecurring();
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finance_updated'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/recurring/${id}`, { method: 'DELETE' });
      if (res.ok) fetchRecurring();
    } catch (err) {
      console.error(err);
    }
  };

  const cur = user?.preferredCurrency || 'INR';
  const sym = user?.currencySymbol || '₹';

  return (
    <DashboardLayout>
      <div className="recurring">
        {/* HEADER */}
        <div className="recurring-header">
          <div className="recurring-header-info">
            <h1 className="recurring-title">
              Recurring Payments & Inflows
            </h1>
            <p className="recurring-description">
              Automate tracking for monthly rent, subscriptions, utility bills, and salary deposits.
            </p>
          </div>

          <button
            onClick={() => {
              setTitle('');
              setAmount('');
              setNotes('');
              setError('');
              setCreateModalOpen(true);
            }}
            className="recurring-btn-add"
          >
            <Plus style={{ width: 16, height: 16 }} />
            <span>Schedule Recurring Payment</span>
          </button>
        </div>

        {/* LIST */}
        {loading ? (
          <div className="recurring-loading">Loading recurring schedules...</div>
        ) : recurringList.length === 0 ? (
          <div className="recurring-empty">
            <div className="recurring-empty-icon">
              <Repeat style={{ width: 24, height: 24 }} />
            </div>
            <h3 className="recurring-empty-title">No Recurring Schedules</h3>
            <p className="recurring-empty-desc">
              Schedule recurring bills, rent, or salary to track future dues and record payments with a single click.
            </p>
          </div>
        ) : (
          <div className="recurring-grid">
            {recurringList.map((rec) => (
              <div
                key={rec._id}
                className={`recurring-card ${
                  rec.status === 'paused' ? 'recurring-card-paused' : ''
                }`}
              >
                <div>
                  <div className="recurring-card-top">
                    <div className="recurring-card-info">
                      <div
                        className={`recurring-card-icon ${
                          rec.type === 'income' ? 'recurring-card-icon-income' : 'recurring-card-icon-expense'
                        }`}
                      >
                        {rec.type === 'income' ? (
                          <ArrowDownLeft style={{ width: 20, height: 20 }} />
                        ) : (
                          <ArrowUpRight style={{ width: 20, height: 20 }} />
                        )}
                      </div>
                      <div>
                        <h3 className="recurring-card-title">{rec.title}</h3>
                        <span className="recurring-card-meta">
                          {rec.frequency} • {rec.category}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(rec._id)}
                      className="recurring-card-delete-btn"
                      aria-label="Delete schedule"
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  </div>

                  <div className="recurring-card-details">
                    <div className="recurring-card-row">
                      <span className="recurring-card-label">Amount:</span>
                      <span className="recurring-card-val-bold">{formatCurrency(rec.amount, cur, sym)}</span>
                    </div>
                    <div className="recurring-card-row">
                      <span className="recurring-card-label">Account:</span>
                      <span className="recurring-card-val">{rec.account}</span>
                    </div>
                    <div className="recurring-card-footer-info">
                      <span>Next Due: {formatDate(rec.nextDueDate)}</span>
                      <span className="recurring-status-text">{rec.status}</span>
                    </div>
                  </div>
                </div>

                <div className="recurring-card-bottom">
                  <button
                    onClick={() => toggleStatus(rec)}
                    className="recurring-btn-toggle"
                  >
                    {rec.status === 'active' ? (
                      <>
                        <Pause style={{ width: 14, height: 14 }} /> Pause
                      </>
                    ) : (
                      <>
                        <Play style={{ width: 14, height: 14 }} /> Resume
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleProcessPayment(rec._id)}
                    className="recurring-btn-process"
                  >
                    <CheckCircle2 style={{ width: 14, height: 14 }} />
                    <span>Pay / Record Now</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {createModalOpen && (
        <div className="recurring-modal-backdrop">
          <div className="recurring-modal">
            <div className="recurring-modal-header">
              <h3 className="recurring-modal-title">Schedule Recurring Payment</h3>
              <button onClick={() => setCreateModalOpen(false)} className="recurring-modal-close-btn" aria-label="Close modal">
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {error && (
              <div className="recurring-form-error">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateRecurring} className="recurring-form">
              <div className="recurring-form-group">
                <label className="recurring-form-label">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apartment Rent, Netflix Subscription"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="recurring-form-input"
                />
              </div>

              <div className="recurring-form-row">
                <div className="recurring-form-group">
                  <label className="recurring-form-label">Amount ({sym})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="recurring-form-input"
                    style={{ fontSize: 16, fontWeight: 700 }}
                  />
                </div>
                <div className="recurring-form-group">
                  <label className="recurring-form-label">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="recurring-form-select"
                  >
                    <option value="expense">Expense (Outflow)</option>
                    <option value="income">Income (Inflow)</option>
                  </select>
                </div>
              </div>

              <div className="recurring-form-row">
                <div className="recurring-form-group">
                  <label className="recurring-form-label">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="recurring-form-select"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="recurring-form-group">
                  <label className="recurring-form-label">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="recurring-form-select"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="recurring-form-row">
                <div className="recurring-form-group">
                  <label className="recurring-form-label">Account</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="recurring-form-select"
                  >
                    {accounts.map((acc) => (
                      <option key={acc._id} value={acc._id}>
                        {acc.accountName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="recurring-form-group">
                  <label className="recurring-form-label">Start / Next Due Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="recurring-form-input"
                  />
                </div>
              </div>

              <div className="recurring-form-group">
                <label className="recurring-form-label">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Additional details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="recurring-form-input"
                />
              </div>

              <div className="recurring-form-actions">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="recurring-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="recurring-btn-submit"
                >
                  Schedule Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

