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
import Pagination from '@/components/common/Pagination';
import BulkActionBar from '@/components/common/BulkActionBar';
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
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
      params.append('limit', String(limit));

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
  }, [page, limit, typeFilter, accountFilter, categoryFilter, startDate, endDate, sortBy, sortOrder]);

  // Bulk actions
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllPage = () => {
    const pageIds = transactions.map((t) => t._id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleBulkMoveToTrash = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch('/api/bulk/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'transactions', ids: selectedIds }),
      });
      if (res.ok) {
        setSelectedIds([]);
        fetchTransactions();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('finance_updated'));
        }
      }
    } catch (err) {
      console.error('Bulk trash error:', err);
    }
  };

  const handleExportSelectedCsv = () => {
    if (selectedIds.length > 0) {
      window.location.href = `/api/transactions/export?ids=${selectedIds.join(',')}`;
    }
  };

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
      <div className="transaction">
        {/* HEADER */}
        <div className="transaction-header">
          <div>
            <h1 className="transaction-title">Transaction Ledger</h1>
            <p className="transaction-description">
              Comprehensive log of all incomes and expenditures.
            </p>
          </div>

          <div className="transaction-actions">
            <button onClick={handleExportCSV} className="transaction-btn">
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button onClick={handleExportPDF} className="transaction-btn">
              <FileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              onClick={() => setQuickAddOpen(true)}
              className="transaction-btn transaction-btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Add Record</span>
            </button>
          </div>
        </div>

        {/* SUMMARY METRICS */}
        <div className="transaction-summary">
          <div className="transaction-summary-card">
            <span className="transaction-summary-label">Filtered Income</span>
            <div className="transaction-summary-value transaction-summary-income">
              +{formatCurrency(summary.totalIncome, cur, sym)}
            </div>
          </div>
          <div className="transaction-summary-card">
            <span className="transaction-summary-label">Filtered Expenses</span>
            <div className="transaction-summary-value transaction-summary-expense">
              -{formatCurrency(summary.totalExpenses, cur, sym)}
            </div>
          </div>
          <div className="transaction-summary-card">
            <span className="transaction-summary-label">Net Flow</span>
            <div
              className={`transaction-summary-value ${summary.net >= 0 ? 'transaction-summary-income' : 'transaction-summary-expense'}`}
            >
              {formatCurrency(summary.net, cur, sym)}
            </div>
          </div>
        </div>

        {/* FILTERS TOOLBAR */}
        <div className="transaction-filters">
          <div className="transaction-filters-grid">
            {/* Search */}
            <div className="transaction-search-container">
              <Search className="transaction-search-icon" />
              <input
                type="text"
                placeholder="Search description, tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="transaction-search-input"
              />
            </div>

            {/* Type */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="transaction-select"
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
              className="transaction-select"
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
              className="transaction-select"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>

            {/* Sort */}
            <div className="transaction-sort-group">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="transaction-select"
              >
                <option value="date">Sort by Date</option>
                <option value="amount">Sort by Amount</option>
              </select>
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="transaction-sort-btn"
              >
                {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>
            </div>
          </div>

          {/* Date range row */}
          <div className="transaction-filters-dates">
            <span>Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="transaction-date-input"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="transaction-date-input"
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
                className="transaction-reset-btn"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* TRANSACTIONS LIST CONTAINER */}
        <div className="transaction-table-container">
          {loading ? (
            <div className="transaction-empty">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="transaction-empty">
              <div className="transaction-empty-icon">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <h3 className="transaction-empty-title">No transactions found</h3>
              <p className="transaction-empty-description">
                No financial records match your criteria. Tap &ldquo;Add Record&rdquo; to create a new transaction.
              </p>
            </div>
          ) : (
            <div className="transaction-list">
              {transactions.map((tx) => (
                <div
                  key={tx._id}
                  className={`transaction-item ${selectedIds.includes(tx._id) ? 'transaction-item-selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(tx._id)}
                    onChange={() => handleToggleSelect(tx._id)}
                    className="transaction-item-checkbox"
                  />
                  <div
                    onClick={() => setDetailModalTx(tx)}
                    className="transaction-item-main"
                  >
                    <div
                      className={`transaction-item-icon ${tx.type === 'income' ? 'transaction-item-icon-income' : 'transaction-item-icon-expense'}`}
                    >
                      {tx.type === 'income' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>

                    <div className="transaction-item-details">
                      <div className="transaction-item-title-row">
                        <span className="transaction-item-title">{tx.title}</span>
                        {tx.receiptUrl && (
                          <span className="transaction-item-receipt-tag">
                            <Paperclip className="w-2.5 h-2.5" /> Receipt
                          </span>
                        )}
                      </div>
                      <div className="transaction-item-meta">
                        <span>{tx.category}</span>
                        <span>•</span>
                        <span>{tx.account}</span>
                        <span>•</span>
                        <span>{formatDate(tx.date)}</span>
                        <span>•</span>
                        <span>{tx.paymentMethod}</span>
                      </div>
                    </div>
                  </div>

                  <div className="transaction-item-end">
                    <div
                      className={`transaction-item-amount ${tx.type === 'income' ? 'transaction-item-amount-income' : 'transaction-item-amount-expense'}`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount, cur, sym)}
                    </div>

                    {/* Actions */}
                    <div className="transaction-item-actions">
                      <button
                        onClick={() => setEditModalTx(tx)}
                        title="Edit"
                        className="transaction-item-btn"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(tx._id)}
                        title="Delete"
                        className="transaction-item-btn transaction-item-btn-delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reusable Pagination */}
          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            limit={limit}
            onPageChange={(p) => setPage(p)}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(1);
            }}
          />
        </div>

        {/* Global Bulk Action Bar for Transactions */}
        <BulkActionBar
          selectedCount={selectedIds.length}
          totalPageCount={transactions.length}
          allSelectedOnPage={transactions.length > 0 && transactions.every((t) => selectedIds.includes(t._id))}
          onSelectAllPage={handleSelectAllPage}
          onClearSelection={() => setSelectedIds([])}
          onMoveToTrash={handleBulkMoveToTrash}
          onExportCsv={handleExportSelectedCsv}
        />
      </div>

      {/* DETAIL MODAL */}
      {detailModalTx && (
        <div className="transaction-modal-backdrop" onClick={() => setDetailModalTx(null)}>
          <div className="transaction-modal" onClick={(e) => e.stopPropagation()}>
            <div className="transaction-modal-header">
              <span className="transaction-modal-title">Transaction Details</span>
              <button
                onClick={() => setDetailModalTx(null)}
                className="transaction-modal-close-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="transaction-detail-header">
              <div
                className={`transaction-detail-value ${detailModalTx.type === 'income' ? 'transaction-item-amount-income' : ''}`}
              >
                {detailModalTx.type === 'income' ? '+' : '-'}
                {formatCurrency(detailModalTx.amount, cur, sym)}
              </div>
              <h3 className="transaction-detail-title">{detailModalTx.title}</h3>
              <div className="transaction-detail-date">{formatDate(detailModalTx.date)}</div>
            </div>

            <div className="transaction-detail-grid">
              <div className="transaction-detail-row">
                <span className="transaction-detail-label">Category:</span>
                <span className="transaction-detail-text">{detailModalTx.category}</span>
              </div>
              <div className="transaction-detail-row">
                <span className="transaction-detail-label">Account:</span>
                <span className="transaction-detail-text">{detailModalTx.account}</span>
              </div>
              <div className="transaction-detail-row">
                <span className="transaction-detail-label">Payment Method:</span>
                <span className="transaction-detail-text">{detailModalTx.paymentMethod}</span>
              </div>
              {detailModalTx.notes && (
                <div style={{ paddingTop: '6px' }}>
                  <span className="transaction-detail-label" style={{ display: 'block', marginBottom: '2px' }}>Notes:</span>
                  <span style={{ fontStyle: 'italic', color: '#475569' }}>{detailModalTx.notes}</span>
                </div>
              )}
            </div>

            {/* Receipt Preview */}
            {detailModalTx.receiptUrl && (
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Attached Receipt:</span>
                {detailModalTx.receiptUrl.includes('application/pdf') ? (
                  <a
                    href={detailModalTx.receiptUrl}
                    download={detailModalTx.receiptName || 'receipt.pdf'}
                    className="transaction-btn transaction-btn-primary"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF Receipt
                  </a>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={detailModalTx.receiptUrl}
                    alt="Receipt"
                    style={{ maxHeight: '180px', width: '100%', objectFit: 'contain', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', paddingTop: '8px' }}>
              <button
                onClick={() => {
                  setEditModalTx(detailModalTx);
                  setDetailModalTx(null);
                }}
                className="transaction-btn"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setDeleteConfirmId(detailModalTx._id);
                  setDetailModalTx(null);
                }}
                className="transaction-btn"
                style={{ color: '#e11d48', borderColor: '#fecdd3', backgroundColor: '#fff1f2' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalTx && (
        <div className="transaction-modal-backdrop">
          <div className="transaction-modal transaction-modal-lg">
            <div className="transaction-modal-header">
              <h3 className="transaction-modal-title">Edit Transaction</h3>
              <button onClick={() => setEditModalTx(null)} className="transaction-modal-close-btn">
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="transaction-form">
              <div className="transaction-form-group">
                <label className="transaction-form-label">Title</label>
                <input
                  type="text"
                  required
                  value={editModalTx.title}
                  onChange={(e) => setEditModalTx({ ...editModalTx, title: e.target.value })}
                  className="transaction-form-input"
                />
              </div>

              <div className="transaction-form-grid">
                <div className="transaction-form-group">
                  <label className="transaction-form-label">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editModalTx.amount}
                    onChange={(e) => setEditModalTx({ ...editModalTx, amount: parseFloat(e.target.value) || 0 })}
                    className="transaction-form-input"
                  />
                </div>
                <div className="transaction-form-group">
                  <label className="transaction-form-label">Type</label>
                  <select
                    value={editModalTx.type}
                    onChange={(e) => setEditModalTx({ ...editModalTx, type: e.target.value as any })}
                    className="transaction-form-select"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>

              <div className="transaction-form-grid">
                <div className="transaction-form-group">
                  <label className="transaction-form-label">Category</label>
                  <select
                    value={editModalTx.category}
                    onChange={(e) => setEditModalTx({ ...editModalTx, category: e.target.value })}
                    className="transaction-form-select"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="transaction-form-group">
                  <label className="transaction-form-label">Date</label>
                  <input
                    type="date"
                    required
                    value={toInputDateFormat(editModalTx.date)}
                    onChange={(e) => setEditModalTx({ ...editModalTx, date: e.target.value })}
                    className="transaction-form-input"
                  />
                </div>
              </div>

              <div className="transaction-form-group">
                <label className="transaction-form-label">Notes</label>
                <textarea
                  rows={2}
                  value={editModalTx.notes || ''}
                  onChange={(e) => setEditModalTx({ ...editModalTx, notes: e.target.value })}
                  className="transaction-form-textarea"
                />
              </div>

              <div className="transaction-form-actions">
                <button
                  type="button"
                  onClick={() => setEditModalTx(null)}
                  className="transaction-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="transaction-btn-submit"
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
        <div className="transaction-modal-backdrop">
          <div className="transaction-modal transaction-modal-sm">
            <div className="transaction-confirm-icon">
              <Trash2 style={{ width: 24, height: 24 }} />
            </div>
            <h3 className="transaction-confirm-title">Delete Transaction?</h3>
            <p className="transaction-confirm-text">
              Deleting this record will immediately reverse its balance impact on your account. This action cannot be undone.
            </p>
            <div className="transaction-confirm-actions">
              <button
                disabled={isDeleting}
                onClick={() => setDeleteConfirmId(null)}
                className="transaction-btn-cancel"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={() => handleDelete(deleteConfirmId)}
                className="transaction-btn-danger"
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
    <Suspense fallback={<div className="transaction-empty">Loading ledger...</div>}>
      <TransactionsContent />
    </Suspense>
  );
}

