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
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Recurring Payments & Inflows
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
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
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Recurring Payment</span>
          </button>
        </div>

        {/* LIST */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading recurring schedules...</div>
        ) : recurringList.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Repeat className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">No Recurring Schedules</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Schedule recurring bills, rent, or salary to track future dues and record payments with a single click.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recurringList.map((rec) => (
              <div
                key={rec._id}
                className={`p-5 rounded-3xl bg-white border transition shadow-subtle hover:shadow-card flex flex-col justify-between ${
                  rec.status === 'paused' ? 'opacity-65 border-dashed border-slate-300' : 'border-slate-200/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                          rec.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {rec.type === 'income' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{rec.title}</h3>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          {rec.frequency} • {rec.category}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(rec._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1 my-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Amount:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(rec.amount, cur, sym)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Account:</span>
                      <span className="font-medium text-slate-700">{rec.account}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                      <span>Next Due: {formatDate(rec.nextDueDate)}</span>
                      <span className="font-semibold capitalize text-emerald-700">{rec.status}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => toggleStatus(rec)}
                    className="font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    {rec.status === 'active' ? (
                      <>
                        <Pause className="w-3.5 h-3.5" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" /> Resume
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleProcessPayment(rec._id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Schedule Recurring Payment</h3>
              <button onClick={() => setCreateModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateRecurring} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apartment Rent, Netflix Subscription"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount ({sym})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="expense">Expense (Outflow)</option>
                    <option value="income">Income (Inflow)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    {accounts.map((acc) => (
                      <option key={acc._id} value={acc._id}>
                        {acc.accountName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start / Next Due Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Additional details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md"
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

