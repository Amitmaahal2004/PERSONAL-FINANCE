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
      <div className="reports">
        {/* HEADER */}
        <div className="reports-header">
          <div className="reports-header-info">
            <h1 className="reports-title">
              Reports & Financial Intelligence
            </h1>
            <p className="reports-description">
              Deep dive into earnings, outlays, cash flows, and category distributions.
            </p>
          </div>

          <div className="reports-header-actions">
            <button
              onClick={handleExportExcel}
              disabled={loading || !reportData}
              className="reports-btn-excel"
            >
              <FileSpreadsheet style={{ width: 14, height: 14, color: '#10b981' }} />
              <span>Export Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={loading || !reportData}
              className="reports-btn-pdf"
            >
              <FileText style={{ width: 14, height: 14 }} />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* TIME PERIOD SELECTOR */}
        <div className="reports-filters">
          <div className="reports-range-buttons">
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
                className={`reports-range-btn ${
                  filterRange === p.id ? 'reports-range-btn-active' : ''
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {filterRange === 'custom' && (
            <div className="reports-custom-range">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="reports-custom-input"
              />
              <span className="reports-custom-separator">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="reports-custom-input"
              />
              <button
                onClick={handleApplyCustom}
                className="reports-btn-apply"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {/* SUMMARY CARDS */}
        {reportData && (
          <div className="reports-summary">
            <div className="reports-summary-card">
              <span className="reports-summary-label">Total Income</span>
              <div className="reports-summary-val reports-summary-val-income">
                {formatCurrency(reportData.summary.totalIncome, cur, sym)}
              </div>
            </div>

            <div className="reports-summary-card">
              <span className="reports-summary-label">Total Expenses</span>
              <div className="reports-summary-val reports-summary-val-expense">
                {formatCurrency(reportData.summary.totalExpenses, cur, sym)}
              </div>
            </div>

            <div className="reports-summary-card">
              <span className="reports-summary-label">Net Surplus / Savings</span>
              <div
                className={`reports-summary-val ${
                  reportData.summary.netSavings >= 0 ? '' : 'reports-summary-val-expense'
                }`}
              >
                {formatCurrency(reportData.summary.netSavings, cur, sym)}
              </div>
            </div>

            <div className="reports-summary-card">
              <span className="reports-summary-label">Savings Rate</span>
              <div className="reports-summary-val reports-summary-val-rate">
                {reportData.summary.savingsRate}%
              </div>
            </div>
          </div>
        )}

        {/* CHARTS SECTION */}
        {reportData && (
          <div className="reports-charts">
            {/* Category Expenses Bar Chart */}
            <div className="reports-chart-card">
              <h3 className="reports-chart-title">Top Spending Categories</h3>
              <div className="reports-chart-wrapper">
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
                  <div className="reports-chart-empty">
                    No expense data in this period.
                  </div>
                )}
              </div>
            </div>

            {/* Account Breakdown Bar Chart */}
            <div className="reports-chart-card">
              <h3 className="reports-chart-title">Account Cash Flow</h3>
              <div className="reports-chart-wrapper">
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
                  <div className="reports-chart-empty">
                    No account movements in this period.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DETAILED CATEGORY EXPENSE TABLE */}
        {reportData && reportData.expenseCategories.length > 0 && (
          <div className="reports-table-card">
            <h3 className="reports-table-title">Category Breakdown Table</h3>
            <div className="reports-table-wrapper">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th className="reports-table-head-cell">Category</th>
                    <th className="reports-table-head-cell">Transactions</th>
                    <th className="reports-table-head-cell">% of Total Expenses</th>
                    <th className="reports-table-head-cell" style={{ textAlign: 'right' }}>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.expenseCategories.map((c: any, i: number) => (
                    <tr key={i} className="reports-table-row">
                      <td className="reports-table-cell reports-table-cell-bold">{c.category}</td>
                      <td className="reports-table-cell">{c.count} records</td>
                      <td className="reports-table-cell">
                        <div className="reports-percentage-wrapper">
                          <div className="reports-percentage-bar">
                            <div className="reports-percentage-fill" style={{ width: `${c.percentage}%` }} />
                          </div>
                          <span>{c.percentage}%</span>
                        </div>
                      </td>
                      <td className="reports-table-cell reports-table-cell-right">
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

