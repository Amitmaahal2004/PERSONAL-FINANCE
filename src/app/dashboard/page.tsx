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
  CreditCard,
  Repeat,
  PieChart as PieIcon,
  ChevronRight,
  Plus,
  ArrowLeftRight,
  BarChart3,
  Calendar,
  Lightbulb,
  CheckCircle2,
  Target,
  ExternalLink,
  MoreVertical,
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
} from 'recharts';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, safeSubtract } from '@/lib/currency';
import { formatDate } from '@/lib/utils';
import { IDashboardStats } from '@/types';
import QuickAddModal from '@/components/common/QuickAddModal';
import {
  HeroFintechIllustration,
  GoalsTargetIllustration,
  PiggyBankIllustration,
  CalendarDuesIllustration,
} from './DashboardIllustrations';

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
        <div className="dashboard-loading">
          <div className="dashboard-skeleton dashboard-skeleton-title"></div>
          <div className="dashboard-skeleton-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="dashboard-skeleton dashboard-skeleton-card"></div>
            ))}
          </div>
          <div className="dashboard-skeleton-charts">
            <div className="dashboard-skeleton dashboard-skeleton-chart"></div>
            <div className="dashboard-skeleton dashboard-skeleton-chart"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const sym = stats?.currencySymbol || user?.currencySymbol || '₹';
  const cur = user?.preferredCurrency || 'INR';
  const isNewUser = !stats?.recentTransactions || stats.recentTransactions.length === 0;

  // Calculate Net Flow
  const netFlow = safeSubtract(stats?.monthlyIncome || 0, stats?.monthlyExpenses || 0);

  // Derive dynamic Quick Insights based on actual data
  const hasExpenses = (stats?.monthlyExpenses || 0) > 0;
  const hasIncome = (stats?.monthlyIncome || 0) > 0;
  const upcomingDuesCount = stats?.upcomingRecurring?.length || 0;

  const insights = [
    hasExpenses
      ? 'You are managing your personal budget actively this month.'
      : 'No expenses recorded this month yet.',
    hasIncome
      ? 'Your income is stable this month.'
      : 'Add an income record to populate your financial trends.',
    upcomingDuesCount > 0
      ? `${upcomingDuesCount} recurring dues upcoming this cycle.`
      : 'No upcoming payments in next 7 days.',
  ];

  return (
    <DashboardLayout>
      <div className="dashboard">
        {/* TOP ROW: WELCOME BANNER (LEFT) & 3 QUICK ACTIONS (RIGHT) */}
        <div className="dashboard-top-row">
          {/* Welcome Hero Banner */}
          <div className="dashboard-hero">
            <div className="dashboard-hero-content">
              <h1 className="dashboard-hero-title">
                Good day, {user?.name?.split(' ')[0] || 'Super'}! 👋
              </h1>
              <p className="dashboard-hero-subtitle">
                Here is your personal financial overview. Your records are 100% private.
              </p>
            </div>
            <div className="dashboard-hero-graphic">
              <HeroFintechIllustration />
            </div>
          </div>

          {/* Quick Action Cards (3 cards) */}
          <div className="dashboard-quick-actions">
            {/* 1. New Transaction */}
            <button
              onClick={() => {
                setQuickAddType('expense');
                setQuickAddOpen(true);
              }}
              className="dashboard-quick-action-card"
              type="button"
            >
              <div className="dashboard-quick-action-icon dashboard-quick-action-icon-green">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="dashboard-quick-action-label">New Transaction</span>
            </button>

            {/* 2. Transfer Money */}
            <Link
              href="/accounts?transfer=true"
              className="dashboard-quick-action-card"
            >
              <div className="dashboard-quick-action-icon dashboard-quick-action-icon-purple">
                <ArrowLeftRight className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="dashboard-quick-action-label">Transfer Money</span>
            </Link>

            {/* 3. View Reports */}
            <Link
              href="/reports"
              className="dashboard-quick-action-card"
            >
              <div className="dashboard-quick-action-icon dashboard-quick-action-icon-blue">
                <BarChart3 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="dashboard-quick-action-label">View Reports</span>
            </Link>
          </div>
        </div>

        {/* GETTING STARTED BANNER FOR NEW USERS */}
        {isNewUser && (
          <div className="dashboard-banner">
            <div className="dashboard-banner-content">
              <span className="dashboard-banner-tag">Getting Started</span>
              <h3 className="dashboard-banner-title">Welcome to your clean financial ledger!</h3>
              <p className="dashboard-banner-description">
                Default Indian categories and accounts have already been provisioned for you. Add your initial account balance or log your first transaction to populate your live charts.
              </p>
            </div>
            <div className="dashboard-banner-actions">
              <Link href="/accounts" className="dashboard-banner-btn">
                Set Opening Balances
              </Link>
              <button
                onClick={() => {
                  setQuickAddType('income');
                  setQuickAddOpen(true);
                }}
                className="dashboard-banner-btn dashboard-banner-btn-primary"
              >
                Record Income
              </button>
            </div>
          </div>
        )}

        {/* 8 FINANCIAL SUMMARY KPI CARDS (2 ROWS OF 4) */}
        <div className="dashboard-stats">
          {/* 1. Available Balance */}
          <div className="dashboard-card">
            <div className="dashboard-card-top">
              <div className="dashboard-card-icon dashboard-card-icon-wallet">
                <Wallet className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="dashboard-card-meta">
                <span className="dashboard-card-title">Available Balance</span>
                <div className="dashboard-card-value">
                  {formatCurrency(stats?.availableBalance, cur, sym)}
                </div>
                <div className="dashboard-card-subtext">All active accounts</div>
              </div>
            </div>
            <div className="dashboard-card-wave-decoration dashboard-card-wave-green" aria-hidden="true" />
          </div>

          {/* 2. Monthly Income */}
          <div className="dashboard-card">
            <div className="dashboard-card-top">
              <div className="dashboard-card-icon dashboard-card-icon-income">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="dashboard-card-meta">
                <span className="dashboard-card-title">Monthly Income</span>
                <div className="dashboard-card-value dashboard-card-value-income">
                  {formatCurrency(stats?.monthlyIncome, cur, sym)}
                </div>
                <div className="dashboard-card-subtext">Current month</div>
              </div>
            </div>
          </div>

          {/* 3. Monthly Expenses */}
          <div className="dashboard-card">
            <div className="dashboard-card-top">
              <div className="dashboard-card-icon dashboard-card-icon-expense">
                <ArrowUpRight className="w-4 h-4 text-rose-500" />
              </div>
              <div className="dashboard-card-meta">
                <span className="dashboard-card-title">Monthly Expenses</span>
                <div className="dashboard-card-value dashboard-card-value-expense">
                  {formatCurrency(stats?.monthlyExpenses, cur, sym)}
                </div>
                <div className="dashboard-card-subtext">Current month spending</div>
              </div>
            </div>
          </div>

          {/* 4. Total Savings */}
          <div className="dashboard-card">
            <div className="dashboard-card-top">
              <div className="dashboard-card-icon dashboard-card-icon-savings">
                <PiggyBank className="w-4 h-4 text-blue-600" />
              </div>
              <div className="dashboard-card-meta">
                <span className="dashboard-card-title">Total Savings</span>
                <div className="dashboard-card-value dashboard-card-value-savings">
                  {formatCurrency(stats?.totalSavings, cur, sym)}
                </div>
                <div className="dashboard-card-subtext">
                  {stats?.savingsGoals?.length || 0} active goals
                </div>
              </div>
            </div>
            <div className="dashboard-card-wave-decoration dashboard-card-wave-blue" aria-hidden="true" />
          </div>

          {/* 5. Total Income (All-Time) */}
          <div className="dashboard-card">
            <div className="dashboard-card-top">
              <div className="dashboard-card-icon dashboard-card-icon-all-income">
                <TrendingUp className="w-4 h-4 text-teal-600" />
              </div>
              <div className="dashboard-card-meta">
                <span className="dashboard-card-title">Total Income (All-Time)</span>
                <div className="dashboard-card-value">
                  {formatCurrency(stats?.totalIncome, cur, sym)}
                </div>
                <div className="dashboard-card-subtext">Cumulative earnings</div>
              </div>
            </div>
          </div>

          {/* 6. Total Expenses (All-Time) */}
          <div className="dashboard-card">
            <div className="dashboard-card-top">
              <div className="dashboard-card-icon dashboard-card-icon-all-expense">
                <TrendingDown className="w-4 h-4 text-pink-600" />
              </div>
              <div className="dashboard-card-meta">
                <span className="dashboard-card-title">Total Expenses (All-Time)</span>
                <div className="dashboard-card-value">
                  {formatCurrency(stats?.totalExpenses, cur, sym)}
                </div>
                <div className="dashboard-card-subtext">Cumulative spend</div>
              </div>
            </div>
            <div className="dashboard-card-wave-decoration dashboard-card-wave-pink" aria-hidden="true" />
          </div>

          {/* 7. Outstanding Money (Lent vs Borrowed) */}
          <div className="dashboard-card">
            <div className="dashboard-card-top">
              <div className="dashboard-card-icon dashboard-card-icon-outstanding">
                <Repeat className="w-4 h-4 text-amber-600" />
              </div>
              <div className="dashboard-card-meta">
                <span className="dashboard-card-title">Outstanding Money</span>
                <div className="dashboard-card-split">
                  <div className="dashboard-card-split-row">
                    <span className="dashboard-card-split-label">To Receive:</span>
                    <span className="dashboard-card-split-val text-emerald-600">
                      {formatCurrency(stats?.outstandingMoney?.lentPending, cur, sym)}
                    </span>
                  </div>
                  <div className="dashboard-card-split-row">
                    <span className="dashboard-card-split-label">To Repay:</span>
                    <span className="dashboard-card-split-val text-slate-800">
                      {formatCurrency(stats?.outstandingMoney?.borrowedPending, cur, sym)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 8. Budget Remaining */}
          <div className="dashboard-card">
            <div className="dashboard-card-top">
              <div className="dashboard-card-icon dashboard-card-icon-budget">
                <PieIcon className="w-4 h-4 text-purple-600" />
              </div>
              <div className="dashboard-card-meta">
                <span className="dashboard-card-title">Budget Remaining</span>
                <div
                  className={`dashboard-card-value ${(stats?.budgetRemaining?.remaining || 0) < 0 ? 'dashboard-card-value-expense' : 'dashboard-card-value-budget'}`}
                >
                  {formatCurrency(stats?.budgetRemaining?.remaining, cur, sym)}
                </div>
                <div className="dashboard-card-subtext">
                  Of {formatCurrency(stats?.budgetRemaining?.budgetTotal, cur, sym)} budget
                </div>
              </div>
            </div>
            <div className="dashboard-card-wave-decoration dashboard-card-wave-purple" aria-hidden="true" />
          </div>
        </div>

        {/* MAIN DASHBOARD SPLIT: LEFT/CENTER AREA (70%) + RIGHT COLUMN (30%) */}
        <div className="dashboard-main-split">
          {/* LEFT & CENTER CONTENT */}
          <div className="dashboard-primary-column">
            {/* ROW 1: CHARTS (INCOME VS EXPENSE + CATEGORIES DONUT) */}
            <div className="dashboard-charts-row">
              {/* Chart 1: Income vs Expense Trend (6 Months) */}
              <div className="dashboard-chart-card dashboard-chart-card-trend">
                <div className="dashboard-chart-header">
                  <div className="dashboard-chart-header-left">
                    <div className="dashboard-chart-icon-box">
                      <BarChart3 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="dashboard-chart-title">Income vs Expense Trend</h3>
                      <p className="dashboard-chart-description">Monthly comparison over last 6 months</p>
                    </div>
                  </div>

                  <div className="dashboard-chart-legend">
                    <div className="dashboard-chart-legend-item">
                      <span className="dashboard-chart-legend-dot dashboard-chart-legend-dot-income" />
                      <span className="dashboard-chart-legend-text">Income</span>
                    </div>
                    <div className="dashboard-chart-legend-item">
                      <span className="dashboard-chart-legend-dot dashboard-chart-legend-dot-expense" />
                      <span className="dashboard-chart-legend-text">Expense</span>
                    </div>
                  </div>
                </div>

                <div className="dashboard-chart-body">
                  {stats?.incomeVsExpenseMonthly && stats.incomeVsExpenseMonthly.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={stats.incomeVsExpenseMonthly} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          axisLine={{ stroke: '#e2e8f0' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          formatter={(val: any) => [formatCurrency(Number(val), cur, sym), '']}
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                            fontSize: '12px',
                          }}
                        />
                        <Bar
                          dataKey="income"
                          name="Income"
                          fill="#10b981"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={28}
                        />
                        <Bar
                          dataKey="expense"
                          name="Expense"
                          fill="#f43f5e"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={28}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="dashboard-empty">
                      No monthly activity recorded yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Chart 2: Expenses by Category Donut */}
              <div className="dashboard-chart-card dashboard-chart-card-donut">
                <div className="dashboard-chart-header">
                  <div className="dashboard-chart-header-left">
                    <div className="dashboard-chart-icon-box dashboard-chart-icon-box-orange">
                      <Calendar className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="dashboard-chart-title">Expenses by Category</h3>
                      <p className="dashboard-chart-description">Current month breakdown</p>
                    </div>
                  </div>
                  <Link href="/categories" className="dashboard-chart-expand-btn" title="View all categories">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="dashboard-donut-wrapper">
                  {stats?.categoryWiseExpenses && stats.categoryWiseExpenses.length > 0 ? (
                    <>
                      <div className="dashboard-donut-container">
                        <ResponsiveContainer width="100%" height={170}>
                          <PieChart>
                            <Pie
                              data={stats.categoryWiseExpenses}
                              dataKey="amount"
                              nameKey="category"
                              innerRadius={48}
                              outerRadius={72}
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
                        {/* Donut Center Total Label */}
                        <div className="dashboard-donut-center">
                          <div className="dashboard-donut-center-amount">
                            {formatCurrency(stats?.monthlyExpenses || 0, cur, sym)}
                          </div>
                          <div className="dashboard-donut-center-label">Total</div>
                        </div>
                      </div>

                      {/* Category Legend List */}
                      <div className="dashboard-donut-legend">
                        {stats.categoryWiseExpenses.slice(0, 3).map((c, i) => (
                          <div key={i} className="dashboard-donut-legend-item">
                            <div className="dashboard-donut-legend-left">
                              <span className="dashboard-donut-legend-dot" style={{ backgroundColor: c.color }} />
                              <span className="dashboard-donut-legend-name">{c.category}</span>
                            </div>
                            <div className="dashboard-donut-legend-val">
                              {formatCurrency(c.amount, cur, sym)} ({c.percentage}%)
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="dashboard-empty">
                      No expenses recorded this month.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ROW 2: RECENT TRANSACTIONS + UPCOMING & GOALS STACK */}
            <div className="dashboard-secondary-row">
              {/* Recent Transactions List (Left ~60%) */}
              <div className="dashboard-transactions-card">
                <div className="dashboard-card-header-bar">
                  <div className="dashboard-card-header-left">
                    <div className="dashboard-chart-icon-box">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="dashboard-section-title">Recent Transactions</h3>
                      <p className="dashboard-section-desc">Latest financial activities</p>
                    </div>
                  </div>
                  <Link href="/transactions" className="dashboard-section-link">
                    <span>View All</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
                  <div className="dashboard-tx-list">
                    {stats.recentTransactions.map((tx) => (
                      <div key={tx._id} className="dashboard-tx-item">
                        <div className="dashboard-tx-left">
                          <div
                            className={`dashboard-tx-icon ${
                              tx.type === 'income' ? 'dashboard-tx-icon-income' : 'dashboard-tx-icon-expense'
                            }`}
                          >
                            {tx.type === 'income' ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div className="dashboard-tx-info">
                            <div className="dashboard-tx-title">{tx.title}</div>
                            <div className="dashboard-tx-meta">
                              <span>{tx.category}</span>
                              <span className="dashboard-tx-meta-sep">•</span>
                              <span>{tx.account}</span>
                              <span className="dashboard-tx-meta-sep">•</span>
                              <span>{formatDate(tx.date)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="dashboard-tx-right">
                          <div
                            className={`dashboard-tx-amount ${
                              tx.type === 'income' ? 'dashboard-tx-amount-income' : 'dashboard-tx-amount-expense'
                            }`}
                          >
                            {tx.type === 'income' ? '+' : '-'}
                            {formatCurrency(tx.amount, cur, sym)}
                          </div>
                          <div className="dashboard-tx-method">
                            {tx.paymentMethod}
                          </div>
                          <button
                            type="button"
                            className="dashboard-tx-menu-btn"
                            aria-label="Transaction options"
                            onClick={() => router.push('/transactions')}
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dashboard-empty">
                    No recent transactions. Use the New Transaction button to record your first transaction.
                  </div>
                )}
              </div>

              {/* Stacked Mini Cards: Upcoming Payments & Savings Goals (Right ~40%) */}
              <div className="dashboard-mini-stack">
                {/* Upcoming Payments Mini Card */}
                <div className="dashboard-mini-card">
                  <div className="dashboard-card-header-bar">
                    <div className="dashboard-card-header-left">
                      <div className="dashboard-mini-icon-pill">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <h3 className="dashboard-mini-title">Upcoming Payments</h3>
                    </div>
                    <Link href="/recurring" className="dashboard-section-link">
                      <span>View All</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {stats?.upcomingRecurring && stats.upcomingRecurring.length > 0 ? (
                    <div className="dashboard-recurring-list">
                      {stats.upcomingRecurring.map((r) => (
                        <div key={r._id} className="dashboard-recurring-item">
                          <div>
                            <div className="dashboard-recurring-title">{r.title}</div>
                            <div className="dashboard-recurring-meta">
                              Due {formatDate(r.nextDueDate)} • {r.frequency}
                            </div>
                          </div>
                          <div className="dashboard-recurring-amount">
                            {formatCurrency(r.amount, cur, sym)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="dashboard-mini-empty">
                      <CalendarDuesIllustration />
                      <p className="dashboard-mini-empty-text">No upcoming recurring dues.</p>
                    </div>
                  )}
                </div>

                {/* Savings Goals Mini Card */}
                <div className="dashboard-mini-card">
                  <div className="dashboard-card-header-bar">
                    <div className="dashboard-card-header-left">
                      <div className="dashboard-mini-icon-pill">
                        <PiggyBank className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <h3 className="dashboard-mini-title">Savings Goals</h3>
                    </div>
                    <Link href="/savings" className="dashboard-section-link">
                      <span>View All</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {stats?.savingsGoals && stats.savingsGoals.length > 0 ? (
                    <div className="dashboard-goal-list">
                      {stats.savingsGoals.slice(0, 2).map((g) => {
                        const pct =
                          g.targetAmount > 0
                            ? Math.min(100, Math.round((g.currentSavedAmount / g.targetAmount) * 100))
                            : 0;
                        return (
                          <div key={g._id} className="dashboard-goal-item">
                            <div className="dashboard-goal-header">
                              <span className="dashboard-goal-name">{g.goalName}</span>
                              <span className="dashboard-goal-percent">{pct}%</span>
                            </div>
                            <div className="dashboard-goal-bar">
                              <div className="dashboard-goal-fill" style={{ width: `${pct}%` }}></div>
                            </div>
                            <div className="dashboard-goal-footer">
                              <span>{formatCurrency(g.currentSavedAmount, cur, sym)}</span>
                              <span>Target: {formatCurrency(g.targetAmount, cur, sym)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="dashboard-mini-empty">
                      <PiggyBankIllustration />
                      <p className="dashboard-mini-empty-text">No savings goals created yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: THIS MONTH AT A GLANCE + QUICK INSIGHTS + GOALS PROGRESS */}
          <div className="dashboard-sidebar-column">
            {/* 1. This Month at a Glance */}
            <div className="dashboard-aside-card">
              <div className="dashboard-card-header-bar">
                <h3 className="dashboard-aside-title">This Month at a Glance</h3>
                <div className="dashboard-aside-header-icon">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                </div>
              </div>

              <div className="dashboard-glance-list">
                {/* Income */}
                <div className="dashboard-glance-item">
                  <div className="dashboard-glance-item-left">
                    <div className="dashboard-glance-icon dashboard-glance-icon-income">
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                    </div>
                    <span className="dashboard-glance-label">Income</span>
                  </div>
                  <span className="dashboard-glance-val dashboard-glance-val-income">
                    {formatCurrency(stats?.monthlyIncome, cur, sym)}
                  </span>
                </div>

                {/* Expenses */}
                <div className="dashboard-glance-item">
                  <div className="dashboard-glance-item-left">
                    <div className="dashboard-glance-icon dashboard-glance-icon-expense">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                    <span className="dashboard-glance-label">Expenses</span>
                  </div>
                  <span className="dashboard-glance-val dashboard-glance-val-expense">
                    {formatCurrency(stats?.monthlyExpenses, cur, sym)}
                  </span>
                </div>

                {/* Net Flow */}
                <div className="dashboard-glance-item dashboard-glance-item-total">
                  <div className="dashboard-glance-item-left">
                    <div className="dashboard-glance-icon dashboard-glance-icon-net">
                      <span className="dashboard-glance-sigma">Σ</span>
                    </div>
                    <span className="dashboard-glance-label">Net Flow</span>
                  </div>
                  <span className="dashboard-glance-val dashboard-glance-val-net">
                    {formatCurrency(netFlow, cur, sym)}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Quick Insights */}
            <div className="dashboard-aside-card">
              <div className="dashboard-card-header-bar">
                <div className="dashboard-card-header-left">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <h3 className="dashboard-aside-title">Quick Insights</h3>
                </div>
              </div>

              <div className="dashboard-insights-list">
                {insights.map((insight, idx) => (
                  <div key={idx} className="dashboard-insight-item">
                    <CheckCircle2 className="dashboard-insight-check" />
                    <p className="dashboard-insight-text">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Goals Progress */}
            <div className="dashboard-aside-card dashboard-goals-card">
              <div className="dashboard-card-header-bar">
                <div className="dashboard-card-header-left">
                  <div className="dashboard-mini-icon-pill">
                    <Target className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h3 className="dashboard-aside-title">Goals Progress</h3>
                </div>
              </div>

              <div className="dashboard-goals-content">
                <div className="dashboard-goals-illustration-wrap">
                  <GoalsTargetIllustration />
                </div>
                <p className="dashboard-goals-subtext">
                  {stats?.savingsGoals && stats.savingsGoals.length > 0
                    ? `${stats.savingsGoals.length} active savings goals in progress.`
                    : 'No savings goals yet.'}
                </p>
                <Link href="/savings" className="dashboard-goals-cta-btn">
                  <span>Create Goal</span>
                </Link>
              </div>
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
