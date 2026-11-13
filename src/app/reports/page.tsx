'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  Wallet,
  PiggyBank,
  HandCoins,
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
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function ReportsPage() {
  const { user } = useAuth();
  const [filterRange, setFilterRange] = useState('thisMonth');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ range: filterRange });
      if (filterRange === 'custom') {
        if (customStart) params.append('startDate', customStart);
        if (customEnd) params.append('endDate', customEnd);
      }

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filterRange]);

  const handleApplyCustom = () => {
    if (customStart && customEnd) {
      fetchReports();
    }
  };

  // Export PDF
  const handleExportPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('MyFinance - Financial Analytics Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Period: ${filterRange} | Generated: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(
      `Total Income: ${formatCurrency(reportData.summary.totalIncome, user?.preferredCurrency)} | Total Expenses: ${formatCurrency(reportData.summary.totalExpenses, user?.preferredCurrency)} | Net Savings: ${formatCurrency(reportData.summary.netSavings, user?.preferredCurrency)} (${reportData.summary.savingsRate}%)`,
      14,
      35
    );

    // Expense Categories Table
    const catData = reportData.expenseCategories.map((c: any) => [
      c.category,
      c.count,
      `${c.percentage}%`,
      formatCurrency(c.total, user?.preferredCurrency),
    ]);

    autoTable(doc, {
      startY: 42,
      head: [['Category', 'Tx Count', '% of Expenses', 'Total Spent']],
      body: catData,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] },
    });

    doc.save(`financial_report_${filterRange}.pdf`);
  };

  // Export Excel
  const handleExportExcel = () => {
    if (!reportData) return;

    // Workbook
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      { Metric: 'Total Income', Value: reportData.summary.totalIncome },
      { Metric: 'Total Expenses', Value: reportData.summary.totalExpenses },
      { Metric: 'Net Savings', Value: reportData.summary.netSavings },
      { Metric: 'Savings Rate (%)', Value: reportData.summary.savingsRate },
      { Metric: 'Transaction Count', Value: reportData.summary.transactionCount },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Expense Categories Sheet
    if (reportData.expenseCategories.length > 0) {
      const wsCats = XLSX.utils.json_to_sheet(reportData.expenseCategories);
      XLSX.utils.book_append_sheet(wb, wsCats, 'Expenses by Category');
    }

    // Accounts Sheet
    if (reportData.accountBreakdown.length > 0) {
      const wsAccs = XLSX.utils.json_to_sheet(reportData.accountBreakdown);
      XLSX.utils.book_append_sheet(wb, wsAccs, 'Accounts Breakdown');
    }

    // Transactions Sheet
    if (reportData.transactions.length > 0) {
      const txRows = reportData.transactions.map((t: any) => ({
        Date: new Date(t.date).toISOString().split('T')[0],
        Title: t.title,
        Type: t.type,
        Amount: t.amount,
        Category: t.category,
        Account: t.account,
        Method: t.paymentMethod,
        Notes: t.notes || '',
      }));
      const wsTx = XLSX.utils.json_to_sheet(txRows);
      XLSX.utils.book_append_sheet(wb, wsTx, 'Transactions');
    }

    XLSX.writeFile(wb, `financial_report_${filterRange}.xlsx`);
  };

  const cur = user?.preferredCurrency || 'INR';
  const sym = user?.currencySymbol || '₹';

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#64748b'];

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Reports & Financial Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Deep dive into earnings, outlays, cash flows, and category distributions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              disabled={loading || !reportData}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-sm transition flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={loading || !reportData}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* TIME PERIOD SELECTOR */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'last7Days', label: 'Last 7 Days' },
              { id: 'thisMonth', label: 'This Month' },
              { id: 'lastMonth', label: 'Last Month' },
              { id: 'thisYear', label: 'This Year' },
              { id: 'custom', label: 'Custom Range' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setFilterRange(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  filterRange === p.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {filterRange === 'custom' && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
              />
              <button
                onClick={handleApplyCustom}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-semibold"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {/* SUMMARY CARDS */}
        {reportData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-subtle">
              <span className="text-xs font-medium text-slate-400">Total Income</span>
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-1">
                {formatCurrency(reportData.summary.totalIncome, cur, sym)}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-subtle">
              <span className="text-xs font-medium text-slate-400">Total Expenses</span>
              <div className="text-xl sm:text-2xl font-extrabold text-rose-600 mt-1">
                {formatCurrency(reportData.summary.totalExpenses, cur, sym)}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-subtle">
              <span className="text-xs font-medium text-slate-400">Net Surplus / Savings</span>
              <div
                className={`text-xl sm:text-2xl font-extrabold mt-1 ${
                  reportData.summary.netSavings >= 0 ? 'text-slate-900' : 'text-rose-600'
                }`}
              >
                {formatCurrency(reportData.summary.netSavings, cur, sym)}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-subtle">
              <span className="text-xs font-medium text-slate-400">Savings Rate</span>
              <div className="text-xl sm:text-2xl font-extrabold text-blue-600 mt-1">
                {reportData.summary.savingsRate}%
              </div>
            </div>
          </div>
        )}

        {/* CHARTS SECTION */}
        {reportData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Expenses Bar Chart */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-subtle">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Top Spending Categories</h3>
              <div className="h-64 w-full">
                {reportData.expenseCategories.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reportData.expenseCategories.slice(0, 6)}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        formatter={(val: any) => [formatCurrency(Number(val), cur, sym), 'Spent']}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      />
                      <Bar dataKey="total" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No expense data in this period.
                  </div>
                )}
              </div>
            </div>

            {/* Account Breakdown Bar Chart */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-subtle">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Account Cash Flow</h3>
              <div className="h-64 w-full">
                {reportData.accountBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reportData.accountBreakdown}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <XAxis dataKey="account" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        formatter={(val: any) => [formatCurrency(Number(val), cur, sym), '']}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      />
                      <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No account movements in this period.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DETAILED CATEGORY EXPENSE TABLE */}
        {reportData && reportData.expenseCategories.length > 0 && (
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Category Breakdown Table</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Transactions</th>
                    <th className="pb-3">% of Total Expenses</th>
                    <th className="pb-3 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.expenseCategories.map((c: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="py-3 font-semibold text-slate-800">{c.category}</td>
                      <td className="py-3 text-slate-600">{c.count} records</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${c.percentage}%` }} />
                          </div>
                          <span className="text-slate-600 font-medium">{c.percentage}%</span>
                        </div>
                      </td>
                      <td className="py-3 font-bold text-slate-900 text-right">
                        {formatCurrency(c.total, cur, sym)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

