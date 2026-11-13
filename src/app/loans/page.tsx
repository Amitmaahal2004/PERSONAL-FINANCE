'use client';

import React, { useState, useEffect } from 'react';
import {
  HandCoins,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  X,
  CreditCard,
  User,
  History,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { ILoan, IAccount } from '@/types';
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/lib/utils';

export default function LoansPage() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<ILoan[]>([]);
  const [accounts, setAccounts] = useState<IAccount[]>([]);
  const [summary, setSummary] = useState({
    totalMoneyLent: 0,
    totalMoneyBorrowed: 0,
    pendingReceivables: 0,
    pendingPayables: 0,
    overdueCount: 0,
  });
  const [activeTab, setActiveTab] = useState<'all' | 'lent' | 'borrowed'>('all');
  const [loading, setLoading] = useState(true);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [repayLoan, setRepayLoan] = useState<ILoan | null>(null);
  const [historyLoan, setHistoryLoan] = useState<ILoan | null>(null);

  // Form
  const [type, setType] = useState<'lent' | 'borrowed'>('lent');
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Repay Form
  const [repayAmount, setRepayAmount] = useState('');
  const [repayAccount, setRepayAccount] = useState('');
  const [repayNotes, setRepayNotes] = useState('');

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const [lRes, aRes] = await Promise.all([fetch('/api/loans'), fetch('/api/accounts')]);

      if (lRes.ok) {
        const data = await lRes.json();
        setLoans(data.loans || []);
        setSummary(
          data.summary || {
            totalMoneyLent: 0,
            totalMoneyBorrowed: 0,
            pendingReceivables: 0,
            pendingPayables: 0,
            overdueCount: 0,
          }
        );
      }

      if (aRes.ok) {
        const aData = await aRes.json();
        setAccounts(aData.accounts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          personName,
          amount: parseFloat(amount),
          date,
          dueDate: dueDate || undefined,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save loan record.');
        return;
      }

      setCreateModalOpen(false);
      setPersonName('');
      setAmount('');
      setNotes('');
      fetchLoans();
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finance_updated'));
    } catch (err: any) {
      setError(err.message || 'Error recording loan.');
    }
  };

  const handleRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayLoan) return;

    try {
      const res = await fetch(`/api/loans/${repayLoan._id}/repay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(repayAmount),
          accountId: repayAccount || undefined,
          notes: repayNotes,
        }),
      });

      if (res.ok) {
        setRepayLoan(null);
        setRepayAmount('');
        setRepayNotes('');
        fetchLoans();
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finance_updated'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/loans/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLoans();
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finance_updated'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const cur = user?.preferredCurrency || 'INR';
  const sym = user?.currencySymbol || '₹';

  const filteredLoans = loans.filter((l) => (activeTab === 'all' ? true : l.type === activeTab));

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Lending & Borrowed Money
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Keep precise track of personal credit, receivables, payables, and repayments.
            </p>
          </div>

          <button
            onClick={() => {
              setPersonName('');
              setAmount('');
              setNotes('');
              setError('');
              setCreateModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Record Loan / Lending</span>
          </button>
        </div>

        {/* SUMMARY KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
            <span className="text-[11px] font-medium text-slate-400">Total Money Lent</span>
            <div className="text-lg sm:text-xl font-bold text-emerald-600 mt-1">
              {formatCurrency(summary.totalMoneyLent, cur, sym)}
            </div>
            <span className="text-[10px] text-slate-400">Principal disbursed</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
            <span className="text-[11px] font-medium text-slate-400">Pending Receivables</span>
            <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
              {formatCurrency(summary.pendingReceivables, cur, sym)}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold">Others owe you</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
            <span className="text-[11px] font-medium text-slate-400">Total Money Borrowed</span>
            <div className="text-lg sm:text-xl font-bold text-rose-600 mt-1">
              {formatCurrency(summary.totalMoneyBorrowed, cur, sym)}
            </div>
            <span className="text-[10px] text-slate-400">Principal taken</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
            <span className="text-[11px] font-medium text-slate-400">Pending Payables</span>
            <div className="text-lg sm:text-xl font-bold text-rose-700 mt-1">
              {formatCurrency(summary.pendingPayables, cur, sym)}
            </div>
            <span className="text-[10px] text-rose-600 font-semibold">You owe others</span>
          </div>
        </div>

        {/* TAB FILTER */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-80">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All ({loans.length})
          </button>
          <button
            onClick={() => setActiveTab('lent')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'lent' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Money I Lent
          </button>
          <button
            onClick={() => setActiveTab('borrowed')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'borrowed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Money I Borrowed
          </button>
        </div>

        {/* LOANS LIST */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading loan records...</div>
        ) : filteredLoans.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <HandCoins className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">No Loan Records</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Track money you lend to friends or family, or debts you need to repay.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLoans.map((l) => {
              const isOverdue = l.dueDate && new Date(l.dueDate) < new Date() && l.remainingAmount > 0;
              return (
                <div
                  key={l._id}
                  className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-subtle hover:shadow-card transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                            l.type === 'lent' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}
                        >
                          {l.type === 'lent' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{l.personName}</h3>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              l.type === 'lent' ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {l.type === 'lent' ? 'Money I Lent' : 'Money I Borrowed'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(l._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5 my-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Initial Amount:</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(l.initialAmount, cur, sym)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Remaining Balance:</span>
                        <span className="font-bold text-slate-900">{formatCurrency(l.remainingAmount, cur, sym)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                        <span>Disbursed: {formatDate(l.date)}</span>
                        {l.dueDate && <span>Due: {formatDate(l.dueDate)}</span>}
                      </div>
                    </div>

                    {isOverdue && (
                      <div className="p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-[11px] flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Past due date! Payment is overdue.</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        l.status === 'settled'
                          ? 'bg-emerald-100 text-emerald-800'
                          : l.status === 'partially_paid'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {l.status.replace('_', ' ').toUpperCase()}
                    </span>

                    <div className="flex items-center gap-2">
                      {l.repayments && l.repayments.length > 0 && (
                        <button
                          onClick={() => setHistoryLoan(l)}
                          className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                        >
                          History ({l.repayments.length})
                        </button>
                      )}
                      {l.remainingAmount > 0 && (
                        <button
                          onClick={() => {
                            setRepayLoan(l);
                            setRepayAmount(String(l.remainingAmount));
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                        >
                          Record Repayment
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE LOAN MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Record Lending / Borrowing</h3>
              <button onClick={() => setCreateModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateLoan} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Direction</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('lent')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition ${
                      type === 'lent'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-500 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Money I Lent (Asset)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('borrowed')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition ${
                      type === 'borrowed'
                        ? 'bg-rose-50 text-rose-700 border-rose-500 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Money I Borrowed (Debt)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Person / Entity Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh, Priya, Landlord"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Principal Amount ({sym})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date (Optional)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Additional context..."
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
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPAYMENT MODAL */}
      {repayLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Record Repayment</h3>
                <span className="text-xs text-slate-400">
                  {repayLoan.personName} • Remaining: {formatCurrency(repayLoan.remainingAmount, cur, sym)}
                </span>
              </div>
              <button onClick={() => setRepayLoan(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRepayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Repayment Amount ({sym})</label>
                <input
                  type="number"
                  step="0.01"
                  max={repayLoan.remainingAmount}
                  required
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {repayLoan.type === 'lent' ? 'Deposit Into Account (Optional)' : 'Pay From Account (Optional)'}
                </label>
                <select
                  value={repayAccount}
                  onChange={(e) => setRepayAccount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                >
                  <option value="">Do not alter account balance (External)</option>
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.accountName} ({sym}{acc.currentBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Part payment via UPI"
                  value={repayNotes}
                  onChange={(e) => setRepayNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setRepayLoan(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md"
                >
                  Confirm Repayment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPAYMENT HISTORY MODAL */}
      {historyLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Repayment History ({historyLoan.personName})</h3>
              <button onClick={() => setHistoryLoan(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {historyLoan.repayments.map((rep, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">{formatDate(rep.date)}</span>
                    {rep.notes && <p className="text-[11px] text-slate-500 italic mt-0.5">{rep.notes}</p>}
                  </div>
                  <span className="font-bold text-emerald-600">{formatCurrency(rep.amount, cur, sym)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

