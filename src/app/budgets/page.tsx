'use client';

import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  Bell,
  TrendingDown,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { IBudget, ICategory } from '@/types';
import { formatCurrency } from '@/lib/currency';

export default function BudgetsPage() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [overallSpent, setOverallSpent] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<any | null>(null);
  const [categoryName, setCategoryName] = useState('Overall');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [alert70, setAlert70] = useState(true);
  const [alert90, setAlert90] = useState(true);
  const [alert100, setAlert100] = useState(true);
  const [error, setError] = useState('');

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([
        fetch('/api/budgets'),
        fetch('/api/categories?type=expense'),
      ]);

      if (bRes.ok) {
        const data = await bRes.json();
        setBudgets(data.budgets || []);
        setOverallSpent(data.overallSpent || 0);
      }

      if (cRes.ok) {
        const cData = await cRes.json();
        setCategories(cData.categories || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryName,
          monthlyBudget: parseFloat(monthlyBudget),
          alertThreshold70: alert70,
          alertThreshold90: alert90,
          alertThreshold100: alert100,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to set budget.');
        return;
      }

      setCreateModalOpen(false);
      setMonthlyBudget('');
      fetchBudgets();
    } catch (err: any) {
      setError(err.message || 'Error saving budget.');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchBudgets();
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
              Budget Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Set spending limits and receive alerts before exceeding budget thresholds.
            </p>
          </div>

          <button
            onClick={() => {
              setCategoryName('Overall');
              setMonthlyBudget('');
              setError('');
              setCreateModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Set New Budget</span>
          </button>
        </div>

        {/* BUDGET CARDS GRID */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading budgets...</div>
        ) : budgets.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <PieChart className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">No Budgets Configured</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Set an overall monthly budget or category-specific targets to monitor your spending habits.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((b) => {
              const pct = b.percentageUsed || 0;
              const isOver = pct > 100;
              const isWarning = pct >= 90 && pct <= 100;
              const isNotice = pct >= 70 && pct < 90;

              return (
                <div
                  key={b._id}
                  className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-subtle hover:shadow-card transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">{b.categoryName}</span>
                        {b.categoryName.toLowerCase() === 'overall' && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                            PRIMARY
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDeleteBudget(b._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 my-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-medium">Spent: {formatCurrency(b.spent, cur, sym)}</span>
                        <span
                          className={`font-bold ${
                            isOver ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-slate-700'
                          }`}
                        >
                          {pct}% used
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOver
                              ? 'bg-rose-500'
                              : isWarning
                              ? 'bg-amber-500'
                              : isNotice
                              ? 'bg-yellow-400'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Budget & Remaining */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 text-[11px]">Monthly Limit</span>
                        <div className="font-bold text-slate-900 mt-0.5">
                          {formatCurrency(b.monthlyBudget, cur, sym)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-[11px]">Remaining</span>
                        <div
                          className={`font-bold mt-0.5 ${
                            b.remaining < 0 ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        >
                          {formatCurrency(b.remaining, cur, sym)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Alert Badges */}
                  {(isOver || isWarning || isNotice) && (
                    <div
                      className={`mt-4 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                        isOver
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : isWarning
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        {isOver
                          ? 'Budget exceeded! You have spent more than allocated.'
                          : isWarning
                          ? 'Warning: 90% threshold reached. Limit further spending.'
                          : 'Notice: 70% threshold reached.'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE BUDGET MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Configure Budget Target</h3>
              <button onClick={() => setCreateModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateBudget} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Category</label>
                <select
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
                >
                  <option value="Overall">Overall Monthly Budget (All Expenses)</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monthly Budget Limit ({sym})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 25000"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:bg-white"
                />
              </div>

              <div className="pt-2 space-y-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-700 block">Notification Threshold Alerts</span>
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alert70}
                    onChange={(e) => setAlert70(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Alert me when 70% is reached</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alert90}
                    onChange={(e) => setAlert90(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Alert me when 90% is reached</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alert100}
                    onChange={(e) => setAlert100(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Alert me when budget is exceeded (100%+)</span>
                </label>
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
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

