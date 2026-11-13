'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeftRight,
  Plus,
  Search,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  FileText,
  Trash2,
  Edit2,
  Eye,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Tag,
  Paperclip,
  ExternalLink,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { ITransaction, IAccount, ICategory } from '@/types';
import { formatCurrency } from '@/lib/currency';
import { formatDate, toInputDateFormat } from '@/lib/utils';
import QuickAddModal from '@/components/common/QuickAddModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function TransactionsContent() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('id');
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [accounts, setAccounts] = useState<IAccount[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Summary
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpenses: 0, net: 0 });

  // Modals
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [detailModalTx, setDetailModalTx] = useState<ITransaction | null>(null);
  const [editModalTx, setEditModalTx] = useState<ITransaction | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load accounts and categories for filters
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [accRes, catRes] = await Promise.all([
          fetch('/api/accounts'),
          fetch('/api/categories'),
        ]);
        if (accRes.ok) {
          const accData = await accRes.json();
          setAccounts(accData.accounts || []);
        }
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch transactions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeFilter) params.append('type', typeFilter);
      if (accountFilter) params.append('accountId', accountFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('page', String(page));
      params.append('limit', '20');

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setTotalPages(data.pagination.totalPages || 1);
        setTotalCount(data.pagination.totalCount || 0);
        setSummary(data.summary || { totalIncome: 0, totalExpenses: 0, net: 0 });

        if (highlightId && !detailModalTx) {
          const found = data.transactions.find((t: ITransaction) => t._id === highlightId);
          if (found) setDetailModalTx(found);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, typeFilter, accountFilter, categoryFilter, startDate, endDate, sortBy, sortOrder]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchTransactions();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle Delete
  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteConfirmId(null);
        setDetailModalTx(null);
        fetchTransactions();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('finance_updated'));
        }
      }
    } catch (err) {
      console.error('Delete error', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalTx) return;

    try {
      const res = await fetch(`/api/transactions/${editModalTx._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editModalTx),
      });

      if (res.ok) {
        setEditModalTx(null);
        fetchTransactions();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('finance_updated'));
        }
      }
    } catch (err) {
      console.error('Edit error', err);
    }
  };

  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`MyFinance - Transactions Statement`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on ${new Date().toLocaleDateString()} | User: ${user?.name || ''}`, 14, 28);
    doc.text(
      `Total Income: ${formatCurrency(summary.totalIncome, user?.preferredCurrency)} | Total Expenses: ${formatCurrency(summary.totalExpenses, user?.preferredCurrency)}`,
      14,
      34
    );

    const tableData = transactions.map((t) => [
      formatDate(t.date),
      t.title,
      t.type.toUpperCase(),
      t.category,
      t.account,
      t.paymentMethod,
      `${t.type === 'income' ? '+' : '-'}${t.amount}`,
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Date', 'Title', 'Type', 'Category', 'Account', 'Method', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] },
    });

    doc.save(`transactions_${toInputDateFormat(new Date())}.pdf`);
  };

  // Export CSV
  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('format', 'csv');
    window.open(`/api/transactions/export?${params.toString()}`, '_blank');
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
              Transaction Ledger
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Comprehensive log of all incomes and expenditures.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-sm transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-sm transition flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              onClick={() => setQuickAddOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Record</span>
            </button>
          </div>
        </div>

        {/* SUMMARY PILLS */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
            <span className="text-[11px] font-medium text-slate-400">Filtered Income</span>
            <div className="text-base sm:text-xl font-bold text-emerald-600 mt-0.5">
              +{formatCurrency(summary.totalIncome, cur, sym)}
            </div>
          </div>
          <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
            <span className="text-[11px] font-medium text-slate-400">Filtered Expenses</span>
            <div className="text-base sm:text-xl font-bold text-rose-600 mt-0.5">
              -{formatCurrency(summary.totalExpenses, cur, sym)}
            </div>
          </div>
          <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle">
            <span className="text-[11px] font-medium text-slate-400">Net Flow</span>
            <div
              className={`text-base sm:text-xl font-bold mt-0.5 ${
                summary.net >= 0 ? 'text-slate-900' : 'text-rose-600'
              }`}
            >
              {formatCurrency(summary.net, cur, sym)}
            </div>
          </div>
        </div>

        {/* FILTERS TOOLBAR */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search description, tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Type */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Types (Income & Expense)</option>
              <option value="expense">Expense Only</option>
              <option value="income">Income Only</option>
            </select>

            {/* Account */}
            <select
              value={accountFilter}
              onChange={(e) => {
                setAccountFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Accounts</option>
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {acc.accountName}
                </option>
              ))}
            </select>

            {/* Category */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>

            {/* Sort */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              >
                <option value="date">Sort by Date</option>
                <option value="amount">Sort by Amount</option>
              </select>
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 shrink-0"
              >
                {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>
            </div>
          </div>

          {/* Date range row */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-medium">Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
            />
            {(startDate || endDate || search || typeFilter || accountFilter || categoryFilter) && (
              <button
                onClick={() => {
                  setSearch('');
                  setTypeFilter('');
                  setAccountFilter('');
                  setCategoryFilter('');
                  setStartDate('');
                  setEndDate('');
                  setPage(1);
                }}
                className="ml-auto text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* TRANSACTIONS LIST / TABLE */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">No transactions found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No financial records match your criteria. Tap &ldquo;Add Record&rdquo; to create a new transaction.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <div
                  key={tx._id}
                  className="p-4 sm:px-6 hover:bg-slate-50/80 transition flex items-center justify-between gap-4"
                >
                  <div
                    onClick={() => setDetailModalTx(tx)}
                    className="flex items-center gap-3.5 cursor-pointer flex-1 min-w-0"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {tx.type === 'income' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm truncate">{tx.title}</span>
                        {tx.receiptUrl && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
                            <Paperclip className="w-2.5 h-2.5" /> Receipt
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-medium text-slate-600">{tx.category}</span>
                        <span>•</span>
                        <span>{tx.account}</span>
                        <span>•</span>
                        <span>{formatDate(tx.date)}</span>
                        <span>•</span>
                        <span>{tx.paymentMethod}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-sm sm:text-base font-extrabold ${
                          tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatCurrency(tx.amount, cur, sym)}
                      </div>
                    </div>

                    {/* Actions menu */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditModalTx(tx)}
                        title="Edit"
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(tx._id)}
                        title="Delete"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>
                Showing page {page} of {totalPages} ({totalCount} total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-40 font-semibold"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-40 font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DETAIL MODAL */}
      {detailModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Transaction Details
              </span>
              <button
                onClick={() => setDetailModalTx(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center py-2">
              <div
                className={`text-2xl font-extrabold ${
                  detailModalTx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                }`}
              >
                {detailModalTx.type === 'income' ? '+' : '-'}
                {formatCurrency(detailModalTx.amount, cur, sym)}
              </div>
              <h3 className="font-bold text-slate-900 text-base mt-1">{detailModalTx.title}</h3>
              <span className="text-xs text-slate-400">{formatDate(detailModalTx.date)}</span>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Category:</span>
                <span className="font-semibold text-slate-800">{detailModalTx.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Account:</span>
                <span className="font-semibold text-slate-800">{detailModalTx.account}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-semibold text-slate-800">{detailModalTx.paymentMethod}</span>
              </div>
              {detailModalTx.notes && (
                <div className="py-1">
                  <span className="text-slate-500 block mb-0.5">Notes:</span>
                  <span className="text-slate-700 italic">{detailModalTx.notes}</span>
                </div>
              )}
              {detailModalTx.tags && detailModalTx.tags.length > 0 && (
                <div className="py-1 flex flex-wrap gap-1">
                  {detailModalTx.tags.map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px]">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Receipt Preview */}
            {detailModalTx.receiptUrl && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs font-semibold text-slate-700 block mb-2">Attached Receipt:</span>
                {detailModalTx.receiptUrl.includes('application/pdf') ? (
                  <a
                    href={detailModalTx.receiptUrl}
                    download={detailModalTx.receiptName || 'receipt.pdf'}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF Receipt
                  </a>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={detailModalTx.receiptUrl}
                    alt="Receipt"
                    className="max-h-48 w-full object-contain rounded-xl border border-slate-200"
                  />
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setEditModalTx(detailModalTx);
                  setDetailModalTx(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setDeleteConfirmId(detailModalTx._id);
                  setDetailModalTx(null);
                }}
                className="py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Edit Transaction</h3>
              <button onClick={() => setEditModalTx(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editModalTx.title}
                  onChange={(e) => setEditModalTx({ ...editModalTx, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editModalTx.amount}
                    onChange={(e) => setEditModalTx({ ...editModalTx, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                  <select
                    value={editModalTx.type}
                    onChange={(e) => setEditModalTx({ ...editModalTx, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                  <select
                    value={editModalTx.category}
                    onChange={(e) => setEditModalTx({ ...editModalTx, category: e.target.value })}
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
                  <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={toInputDateFormat(editModalTx.date)}
                    onChange={(e) => setEditModalTx({ ...editModalTx, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editModalTx.notes || ''}
                  onChange={(e) => setEditModalTx({ ...editModalTx, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditModalTx(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Delete Transaction?</h3>
            <p className="text-xs text-slate-500">
              Deleting this record will immediately reverse its balance impact on your account. This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                disabled={isDeleting}
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <QuickAddModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSuccess={() => fetchTransactions()}
      />
    </DashboardLayout>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading ledger...</div>}>
      <TransactionsContent />
    </Suspense>
  );
}

