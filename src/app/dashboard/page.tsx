'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar as CalendarIcon,
  CreditCard,
  AlertTriangle,
  Plus,
  ArrowRight,
  Repeat,
  Target,
  PieChart as PieIcon,
  CheckCircle2,
  Clock,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/lib/utils';
import { IDashboardStats } from '@/types';
import QuickAddModal from '@/components/common/QuickAddModal';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'expense' | 'income'>('expense');

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else if (res.status === 401) {
        router.push('/login');
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchDashboardStats();
    }
  }, [user, authLoading]);

  // Listen for global finance update events to refresh dashboard
  useEffect(() => {
    const handleUpdate = () => fetchDashboardStats();
    window.addEventListener('finance_updated', handleUpdate);
    return () => window.removeEventListener('finance_updated', handleUpdate);
  }, []);

  if (authLoading || (loading && !stats)) {
    return (
      <DashboardLayout>
        <div className="p-6 sm:p-8 space-y-6 animate-pulse">
          <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-slate-100 p-4"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-72 bg-white rounded-2xl"></div>
            <div className="h-72 bg-white rounded-2xl"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const sym = stats?.currencySymbol || user?.currencySymbol || '₹';
  const cur = user?.preferredCurrency || 'INR';

  const isNewUser = !stats?.recentTransactions || stats.recentTransactions.length === 0;

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* TOP WELCOME & QUICK ACTIONS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Good day, {user?.name?.split(' ')[0] || 'Member'}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Here is your personal financial overview. Your records are 100% private.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setQuickAddType('income');
                setQuickAddOpen(true);
              }}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200 transition flex items-center gap-1.5 active:scale-95"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>+ Income</span>
            </button>
            <button
              onClick={() => {
                setQuickAddType('expense');
                setQuickAddOpen(true);
              }}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition flex items-center gap-1.5 active:scale-95"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+ Expense</span>
            </button>
            <Link
              href="/accounts?transfer=true"
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 active:scale-95"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Transfer</span>
            </Link>
          </div>
        </div>

        {/* EMPTY STATE BANNER FOR BRAND NEW USERS */}
        {isNewUser && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center md:text-left">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Getting Started
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Welcome to your clean financial ledger!
              </h3>
              <p className="text-xs text-slate-600 max-w-xl">
                Default Indian categories and accounts have already been provisioned for you. Add your initial account balance or log your first transaction to populate your live charts.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/accounts"
                className="px-4 py-2.5 bg-white text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition"
              >
                Set Opening Balances
              </Link>
              <button
                onClick={() => {
                  setQuickAddType('income');
                  setQuickAddOpen(true);
                }}
                className="px-4 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-sm hover:bg-emerald-700 transition"
              >
                Record Income
              </button>
            </div>
          </div>
        )}

        {/* 8 KPI CARDS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Available Balance */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle hover:border-emerald-200 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-500">Available Balance</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-extrabold text-slate-900 truncate">
              {formatCurrency(stats?.availableBalance, cur, sym)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>All active accounts</span>
            </div>
          </div>

          {/* 2. Monthly Income */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle hover:border-emerald-200 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-500">Monthly Income</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-extrabold text-emerald-600 truncate">
              {formatCurrency(stats?.monthlyIncome, cur, sym)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Current month</div>
          </div>

          {/* 3. Monthly Expenses */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle hover:border-rose-200 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-500">Monthly Expenses</span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-extrabold text-rose-600 truncate">
              {formatCurrency(stats?.monthlyExpenses, cur, sym)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Current month spending</div>
          </div>

          {/* 4. Total Savings */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle hover:border-blue-200 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-500">Total Savings</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <PiggyBank className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-extrabold text-blue-600 truncate">
              {formatCurrency(stats?.totalSavings, cur, sym)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {stats?.savingsGoals?.length || 0} active goals
            </div>
          </div>

          {/* 5. Total Income (All Time) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-500">Total Income (All-Time)</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-base sm:text-xl font-bold text-slate-800 truncate">
              {formatCurrency(stats?.totalIncome, cur, sym)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Cumulative earnings</div>
          </div>

          {/* 6. Total Expenses (All Time) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-500">Total Expenses (All-Time)</span>
              <TrendingDown className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-base sm:text-xl font-bold text-slate-800 truncate">
              {formatCurrency(stats?.totalExpenses, cur, sym)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Cumulative spend</div>
          </div>

          {/* 7. Outstanding Money (Lent vs Borrowed) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-500">Outstanding Money</span>
              <CreditCard className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xs text-slate-700 space-y-0.5 mt-1 font-semibold">
              <div className="flex justify-between">
                <span className="text-emerald-600 font-medium">To Receive:</span>
                <span>{formatCurrency(stats?.outstandingMoney?.lentPending, cur, sym)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-600 font-medium">To Repay:</span>
                <span>{formatCurrency(stats?.outstandingMoney?.borrowedPending, cur, sym)}</span>
              </div>
            </div>
          </div>

          {/* 8. Budget Remaining */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-500">Budget Remaining</span>
              <PieIcon className="w-4 h-4 text-purple-500" />
            </div>
            <div
              className={`text-base sm:text-xl font-bold truncate ${(stats?.budgetRemaining?.remaining || 0) < 0 ? 'text-rose-600' : 'text-slate-900'
                }`}
            >
              {formatCurrency(stats?.budgetRemaining?.remaining, cur, sym)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Of {formatCurrency(stats?.budgetRemaining?.budgetTotal, cur, sym)} budget
            </div>
          </div>
        </div>

        {/* CHARTS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Income vs Expense (6 Months) */}
          <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Income vs Expense Trend</h3>
                <p className="text-xs text-slate-400">Monthly comparison over last 6 months</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Income
                </span>
                <span className="flex items-center gap-1.5 text-rose-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span> Expense
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              {stats?.incomeVsExpenseMonthly && stats.incomeVsExpenseMonthly.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.incomeVsExpenseMonthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val), cur, sym), '']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No monthly activity recorded yet.
                </div>
              )}
            </div>
          </div>

          {/* Category-wise Breakdown Donut */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-subtle flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900">Expenses by Category</h3>
              <p className="text-xs text-slate-400">Current month breakdown</p>
            </div>

            <div className="h-48 w-full relative">
              {stats?.categoryWiseExpenses && stats.categoryWiseExpenses.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryWiseExpenses}
                      dataKey="amount"
                      nameKey="category"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {stats.categoryWiseExpenses.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val), cur, sym), '']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 text-center p-4">
                  No expense recorded this month.
                </div>
              )}
            </div>

            {/* Top categories legend list */}
            <div className="space-y-1.5 mt-2 overflow-y-auto max-h-32">
              {stats?.categoryWiseExpenses?.slice(0, 4).map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-slate-700 truncate">{c.category}</span>
                  </div>
                  <div className="font-semibold text-slate-900 shrink-0">
                    {formatCurrency(c.amount, cur, sym)} ({c.percentage}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: RECENT TRANSACTIONS & GOALS/BUDGETS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Transactions List (2 Cols on lg) */}
          <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Transactions</h3>
                <p className="text-xs text-slate-400">Latest financial activities</p>
              </div>
              <Link
                href="/transactions"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
              <div className="space-y-2.5">
                {stats.recentTransactions.map((tx) => (
                  <div
                    key={tx._id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/60 hover:bg-slate-50 border border-slate-100 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-rose-50 text-rose-600'
                          }`}
                      >
                        {tx.type === 'income' ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{tx.title}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <span>{tx.category}</span>
                          <span>•</span>
                          <span>{tx.account}</span>
                          <span>•</span>
                          <span>{formatDate(tx.date)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-sm font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                          }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatCurrency(tx.amount, cur, sym)}
                      </div>
                      <div className="text-[10px] text-slate-400">{tx.paymentMethod}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No recent transactions. Use the (+) button to record your first transaction.
              </div>
            )}
          </div>

          {/* SIDE WIDGETS: UPCOMING PAYMENTS & BUDGET ALERTS */}
          <div className="space-y-6">
            {/* Upcoming Recurring Payments */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-subtle">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">Upcoming Payments</h3>
                <Link href="/recurring" className="text-xs text-emerald-600 font-semibold hover:underline">
                  Manage
                </Link>
              </div>

              {stats?.upcomingRecurring && stats.upcomingRecurring.length > 0 ? (
                <div className="space-y-2">
                  {stats.upcomingRecurring.map((r) => (
                    <div
                      key={r._id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-800">{r.title}</div>
                        <div className="text-[10px] text-slate-400">
                          Due {formatDate(r.nextDueDate)} • {r.frequency}
                        </div>
                      </div>
                      <div className="text-right font-bold text-slate-900">
                        {formatCurrency(r.amount, cur, sym)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No upcoming recurring dues.
                </div>
              )}
            </div>

            {/* Savings Goals Mini Progress */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-subtle">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">Savings Goals</h3>
                <Link href="/savings" className="text-xs text-emerald-600 font-semibold hover:underline">
                  View All
                </Link>
              </div>

              {stats?.savingsGoals && stats.savingsGoals.length > 0 ? (
                <div className="space-y-3">
                  {stats.savingsGoals.slice(0, 3).map((g) => {
                    const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentSavedAmount / g.targetAmount) * 100)) : 0;
                    return (
                      <div key={g._id} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-800">{g.goalName}</span>
                          <span className="text-emerald-700">{pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>{formatCurrency(g.currentSavedAmount, cur, sym)}</span>
                          <span>Target: {formatCurrency(g.targetAmount, cur, sym)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No savings goals created yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <QuickAddModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        defaultType={quickAddType}
        onSuccess={() => fetchDashboardStats()}
      />
    </DashboardLayout>
  );
}

