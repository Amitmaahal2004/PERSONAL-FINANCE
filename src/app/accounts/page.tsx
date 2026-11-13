'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Wallet,
  Building2,
  CreditCard,
  Plus,
  Repeat,
  Archive,
  Edit2,
  Trash2,
  ArrowRight,
  TrendingUp,
  X,
  Check,
  AlertCircle,
  History,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { IAccount, AccountType, ITransfer } from '@/types';
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/lib/utils';

const ACCOUNT_TYPES: AccountType[] = [
  'Cash Wallet',
  'Bank Account',
  'Savings Account',
  'Credit Card',
  'UPI',
  'Digital Wallet',
  'Investment',
  'Other',
];

const PRESET_COLORS = ['#10b981', '#0284c7', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#64748b'];

function AccountsContent() {
  const searchParams = useSearchParams();
  const openTransferParam = searchParams.get('transfer') === 'true';
  const { user } = useAuth();

  const [accounts, setAccounts] = useState<IAccount[]>([]);
  const [transfers, setTransfers] = useState<ITransfer[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(openTransferParam);
  const [editAccount, setEditAccount] = useState<IAccount | null>(null);
  const [historyAccount, setHistoryAccount] = useState<IAccount | null>(null);
  const [historyTransactions, setHistoryTransactions] = useState<any[]>([]);

  // Create Form State
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<AccountType>('Bank Account');
  const [newOpeningBalance, setNewOpeningBalance] = useState('');
  const [newAccColor, setNewAccColor] = useState('#10b981');
  const [newAccDesc, setNewAccDesc] = useState('');

  // Transfer Form State
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferError, setTransferError] = useState('');

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const [accRes, transRes] = await Promise.all([
        fetch('/api/accounts?includeArchived=true'),
        fetch('/api/transfers'),
      ]);

      if (accRes.ok) {
        const accData = await accRes.json();
        setAccounts(accData.accounts || []);
        setTotalBalance(accData.totalBalance || 0);

        if (accData.accounts?.length >= 2 && !transferFrom) {
          setTransferFrom(accData.accounts[0]._id);
          setTransferTo(accData.accounts[1]._id);
        }
      }

      if (transRes.ok) {
        const transData = await transRes.json();
        setTransfers(transData.transfers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName: newAccName,
          accountType: newAccType,
          openingBalance: parseFloat(newOpeningBalance) || 0,
          accountColor: newAccColor,
          description: newAccDesc,
        }),
      });

      if (res.ok) {
        setCreateModalOpen(false);
        setNewAccName('');
        setNewOpeningBalance('');
        setNewAccDesc('');
        fetchAccounts();
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finance_updated'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');

    if (transferFrom === transferTo) {
      setTransferError('Source and destination accounts must be different.');
      return;
    }

    if (!transferAmount || Number(transferAmount) <= 0) {
      setTransferError('Please enter a valid transfer amount.');
      return;
    }

    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAccountId: transferFrom,
          toAccountId: transferTo,
          amount: parseFloat(transferAmount),
          notes: transferNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTransferError(data.error || 'Transfer failed.');
        return;
      }

      setTransferModalOpen(false);
      setTransferAmount('');
      setTransferNotes('');
      fetchAccounts();
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finance_updated'));
    } catch (err: any) {
      setTransferError(err.message || 'Transfer failed.');
    }
  };

  const viewAccountHistory = async (acc: IAccount) => {
    setHistoryAccount(acc);
    try {
      const res = await fetch(`/api/accounts/${acc._id}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryTransactions(data.recentTransactions || []);
      }
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
              Financial Accounts & Wallets
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage bank accounts, digital wallets, cash balances, and internal money transfers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTransferModalOpen(true)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-sm transition flex items-center gap-1.5"
            >
              <Repeat className="w-3.5 h-3.5 text-emerald-600" />
              <span>Transfer Money</span>
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Account</span>
            </button>
          </div>
        </div>

        {/* TOTAL BALANCE CARD */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Net Worth Across Accounts
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {formatCurrency(totalBalance, cur, sym)}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Reflects all cash, bank holdings, and digital reserves.
            </p>
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Balances are maintained in real-time with atomic transaction updates.</span>
          </div>
        </div>

        {/* ACCOUNTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <div
              key={acc._id}
              className={`p-5 rounded-3xl bg-white border transition shadow-subtle hover:shadow-card flex flex-col justify-between ${acc.isArchived ? 'opacity-60 border-dashed border-slate-300' : 'border-slate-200/80'
                }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: acc.accountColor || '#10b981' }}
                    >
                      {acc.accountType === 'Cash Wallet' ? (
                        <Wallet className="w-5 h-5" />
                      ) : acc.accountType === 'Credit Card' ? (
                        <CreditCard className="w-5 h-5" />
                      ) : (
                        <Building2 className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{acc.accountName}</h3>
                      <span className="text-[11px] text-slate-400 font-medium">{acc.accountType}</span>
                    </div>
                  </div>

                  {acc.isArchived && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                      Archived
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">Current Balance</span>
                  <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {formatCurrency(acc.currentBalance, cur, sym)}
                  </div>
                  {acc.description && (
                    <p className="text-xs text-slate-500 mt-1 truncate">{acc.description}</p>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => viewAccountHistory(acc)}
                  className="font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>History</span>
                </button>
                <div className="flex items-center gap-2 text-slate-400">
                  <button
                    onClick={() => setEditAccount(acc)}
                    className="p-1 hover:text-slate-700 hover:bg-slate-100 rounded"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* RECENT INTERNAL TRANSFERS TABLE */}
        {transfers.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Recent Internal Transfers</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {transfers.slice(0, 5).map((tr) => (
                <div key={tr._id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{tr.fromAccountName}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800">{tr.toAccountName}</span>
                    {tr.notes && <span className="text-slate-400 italic">({tr.notes})</span>}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400">{formatDate(tr.date)}</span>
                    <span className="font-bold text-slate-900">{formatCurrency(tr.amount, cur, sym)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CREATE ACCOUNT MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Create New Account</h3>
              <button onClick={() => setCreateModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SBI Savings, Cash Wallet, HDFC Credit"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Type</label>
                <select
                  value={newAccType}
                  onChange={(e) => setNewAccType(e.target.value as AccountType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Balance ({sym})</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newOpeningBalance}
                  onChange={(e) => setNewOpeningBalance(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Color Theme</label>
                <div className="flex gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewAccColor(c)}
                      className={`w-7 h-7 rounded-full border-2 ${newAccColor === c ? 'border-slate-900 scale-110' : 'border-transparent'
                        }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Primary salary account"
                  value={newAccDesc}
                  onChange={(e) => setNewAccDesc(e.target.value)}
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
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER MONEY MODAL */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Internal Money Transfer</h3>
                <p className="text-[11px] text-slate-400">Zero effect on income or expenses</p>
              </div>
              <button onClick={() => setTransferModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {transferError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{transferError}</span>
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">From Account (Source)</label>
                <select
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                >
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.accountName} ({sym}{acc.currentBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">To Account (Destination)</label>
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                >
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.accountName} ({sym}{acc.currentBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Amount ({sym})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white text-base font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. ATM cash withdrawal, moving to savings"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACCOUNT HISTORY MODAL */}
      {historyAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{historyAccount.accountName} Ledger</h3>
                <span className="text-xs text-slate-400">
                  Current Balance: {formatCurrency(historyAccount.currentBalance, cur, sym)}
                </span>
              </div>
              <button onClick={() => setHistoryAccount(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {historyTransactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No transactions for this account yet.</div>
              ) : (
                historyTransactions.map((tx) => (
                  <div key={tx._id} className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{tx.title}</div>
                      <div className="text-[10px] text-slate-400">
                        {formatDate(tx.date)} • {tx.category}
                      </div>
                    </div>
                    <div
                      className={`font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount, cur, sym)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading accounts...</div>}>
      <AccountsContent />
    </Suspense>
  );
}

