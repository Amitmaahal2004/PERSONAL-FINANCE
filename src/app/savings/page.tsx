'use client';

import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  TrendingUp,
  Calendar,
  Wallet,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { ISavingsGoal, IAccount } from '@/types';
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/lib/utils';

export default function SavingsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<ISavingsGoal[]>([]);
  const [accounts, setAccounts] = useState<IAccount[]>([]);
  const [totalSaved, setTotalSaved] = useState(0);
  const [totalTarget, setTotalTarget] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<ISavingsGoal | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionAccount, setContributionAccount] = useState('');
  const [contributionNotes, setContributionNotes] = useState('');

  // Form State
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialSaved, setInitialSaved] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const [gRes, aRes] = await Promise.all([fetch('/api/savings'), fetch('/api/accounts')]);

      if (gRes.ok) {
        const data = await gRes.json();
        setGoals(data.savingsGoals || []);
        setTotalSaved(data.totalSaved || 0);
        setTotalTarget(data.totalTarget || 0);
      }

      if (aRes.ok) {
        const aData = await aRes.json();
        setAccounts(aData.accounts || []);
        if (aData.accounts?.length > 0 && !contributionAccount) {
          setContributionAccount(aData.accounts[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalName,
          targetAmount: parseFloat(targetAmount),
          currentSavedAmount: parseFloat(initialSaved) || 0,
          targetDate,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create goal.');
        return;
      }

      setCreateModalOpen(false);
      setGoalName('');
      setTargetAmount('');
      setInitialSaved('');
      setDescription('');
      fetchGoals();
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finance_updated'));
    } catch (err: any) {
      setError(err.message || 'Error creating savings goal.');
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeGoal) return;

    try {
      const res = await fetch(`/api/savings/${contributeGoal._id}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(contributionAmount),
          accountId: contributionAccount || undefined,
          notes: contributionNotes,
        }),
      });

      if (res.ok) {
        setContributeGoal(null);
        setContributionAmount('');
        setContributionNotes('');
        fetchGoals();
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finance_updated'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/savings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchGoals();
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finance_updated'));
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
              Savings Goals
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Target funds for life milestones, emergencies, and dream purchases.
            </p>
          </div>

          <button
            onClick={() => {
              setGoalName('');
              setTargetAmount('');
              setInitialSaved('');
              setError('');
              setCreateModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Savings Goal</span>
          </button>
        </div>

        {/* OVERVIEW STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-subtle">
            <span className="text-xs font-medium text-slate-400">Total Capital Saved</span>
            <div className="text-2xl font-extrabold text-blue-600 mt-1">
              {formatCurrency(totalSaved, cur, sym)}
            </div>
          </div>
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-subtle">
            <span className="text-xs font-medium text-slate-400">Total Target Amount</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {formatCurrency(totalTarget, cur, sym)}
            </div>
          </div>
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-subtle">
            <span className="text-xs font-medium text-slate-400">Overall Progress</span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">
              {totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* GOALS GRID */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading savings goals...</div>
        ) : goals.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">No Savings Goals Set</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Create an Emergency Fund, Travel Fund, or New Laptop target to track your progress.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((g) => {
              const pct = g.progressPercentage || 0;
              const remaining = Math.max(0, g.targetAmount - g.currentSavedAmount);

              return (
                <div
                  key={g._id}
                  className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-subtle hover:shadow-card transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <Target className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{g.goalName}</h3>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Target: {formatDate(g.targetDate)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(g._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {g.description && (
                      <p className="text-xs text-slate-500 mb-3">{g.description}</p>
                    )}

                    {/* Progress */}
                    <div className="space-y-1.5 my-3">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-800">{formatCurrency(g.currentSavedAmount, cur, sym)}</span>
                        <span className="text-blue-600">{pct}%</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Remaining: {formatCurrency(remaining, cur, sym)}</span>
                        <span>Target: {formatCurrency(g.targetAmount, cur, sym)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        g.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {g.status.toUpperCase()}
                    </span>

                    <button
                      onClick={() => {
                        setContributeGoal(g);
                        setContributionAmount('');
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Contribution</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE GOAL MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Create Savings Target</h3>
              <button onClick={() => setCreateModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Goal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency Fund, New Bike, Tokyo Trip"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Amount ({sym})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="100000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Saved ({sym})</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={initialSaved}
                    onChange={(e) => setInitialSaved(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Date</label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Purpose of this savings fund..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONTRIBUTE MODAL */}
      {contributeGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Add Savings Contribution</h3>
                <span className="text-xs text-slate-400">Target: {contributeGoal.goalName}</span>
              </div>
              <button onClick={() => setContributeGoal(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleContribute} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contribution Amount ({sym})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fund from Account (Optional)
                </label>
                <select
                  value={contributionAccount}
                  onChange={(e) => setContributionAccount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                >
                  <option value="">Do not deduct from accounts (Manual track)</option>
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.accountName} ({sym}{acc.currentBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  If selected, this amount will be safely moved from the account into your savings goal without double-counting as an expense.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly allocation from bonus"
                  value={contributionNotes}
                  onChange={(e) => setContributionNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setContributeGoal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md"
                >
                  Record Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

