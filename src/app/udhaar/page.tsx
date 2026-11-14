'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency';
import { IUdhaar, IUdhaarSummary, IAccount, UdhaarType, UdhaarStatus } from '@/types';
import Pagination from '@/components/common/Pagination';
import BulkActionBar from '@/components/common/BulkActionBar';
import {
  HandCoins,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  History,
  Trash2,
  Download,
  CreditCard,
  User,
  Phone,
  FileText,
  Loader2,
  X,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

export default function UdhaarPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'all' | 'lent' | 'borrowed' | 'active' | 'cleared'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [records, setRecords] = useState<IUdhaar[]>([]);
  const [summary, setSummary] = useState<IUdhaarSummary>({
    totalMoneyLent: 0,
    totalMoneyBorrowed: 0,
    totalAmountReceived: 0,
    totalAmountRepaid: 0,
    pendingReceivables: 0,
    pendingPayables: 0,
    partiallyRepaidCount: 0,
    fullyClearedCount: 0,
    overdueCount: 0,
  });

  const [accounts, setAccounts] = useState<IAccount[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [repayModalData, setRepayModalData] = useState<IUdhaar | null>(null);
  const [historyModalData, setHistoryModalData] = useState<IUdhaar | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    type: 'lent' as UdhaarType,
    personName: '',
    phoneNumber: '',
    originalAmount: '',
    udhaarDate: new Date().toISOString().split('T')[0],
    expectedRepaymentDate: '',
    paymentMethod: 'Cash',
    accountId: '',
    description: '',
    notes: '',
  });

  const [repayData, setRepayData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    accountId: '',
    notes: '',
  });

  const [formError, setFormError] = useState('');

  // Fetch accounts for dropdowns
  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (e) {
      console.error('Error fetching accounts:', e);
    }
  }, []);

  // Fetch Udhaar records
  const fetchUdhaar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('tab', activeTab);
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      if (statusFilter) params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/udhaar?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setRecords(json.data || []);
        setSummary(
          json.summary || {
            totalMoneyLent: 0,
            totalMoneyBorrowed: 0,
            totalAmountReceived: 0,
            totalAmountRepaid: 0,
            pendingReceivables: 0,
            pendingPayables: 0,
            partiallyRepaidCount: 0,
            fullyClearedCount: 0,
            overdueCount: 0,
          }
        );
        if (json.pagination) {
          setTotalCount(json.pagination.totalCount || 0);
          setTotalPages(json.pagination.totalPages || 1);
        }
      }
    } catch (error) {
      console.error('Error fetching Udhaar:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, limit, statusFilter, searchQuery]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user, fetchAccounts]);

  useEffect(() => {
    if (user) {
      fetchUdhaar();
    }
  }, [user, fetchUdhaar]);

  // Reset page when tab/filters change
  const handleTabChange = (newTab: 'all' | 'lent' | 'borrowed' | 'active' | 'cleared') => {
    setActiveTab(newTab);
    setPage(1);
    setSelectedIds([]);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUdhaar();
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllPage = () => {
    const pageIds = records.map((r) => r._id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  // Move to Trash (single or bulk)
  const handleSingleDelete = async (id: string) => {
    if (!confirm('Move this Udhaar record to the Recycle Bin? Any linked financial account balance will be safely reversed.')) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/udhaar/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedIds((prev) => prev.filter((i) => i !== id));
        fetchUdhaar();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('finance_updated'));
        }
      }
    } catch (err) {
      console.error('Error deleting udhaar:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkMoveToTrash = async () => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/bulk/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'udhaar', ids: selectedIds }),
      });
      if (res.ok) {
        setSelectedIds([]);
        fetchUdhaar();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('finance_updated'));
        }
      }
    } catch (err) {
      console.error('Bulk trash error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (selectedIds.length > 0) {
      params.set('ids', selectedIds.join(','));
    } else {
      params.set('tab', activeTab);
      if (statusFilter) params.set('status', statusFilter);
    }
    window.location.href = `/api/udhaar/export?${params.toString()}`;
  };

  // Add Udhaar submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.personName.trim()) {
      setFormError('Please enter person name');
      return;
    }

    const amt = Number(formData.originalAmount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Please enter a valid amount greater than 0');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/udhaar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to create Udhaar record');
        return;
      }

      setIsAddModalOpen(false);
      setFormData({
        type: 'lent',
        personName: '',
        phoneNumber: '',
        originalAmount: '',
        udhaarDate: new Date().toISOString().split('T')[0],
        expectedRepaymentDate: '',
        paymentMethod: 'Cash',
        accountId: '',
        description: '',
        notes: '',
      });
      fetchUdhaar();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('finance_updated'));
      }
    } catch (err: any) {
      setFormError(err.message || 'Error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  // Repayment submit
  const handleRepaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayModalData) return;
    setFormError('');

    const amt = Number(repayData.amount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Please enter a valid repayment amount');
      return;
    }

    if (amt > repayModalData.remainingAmount + 0.01) {
      setFormError(`Repayment cannot exceed remaining balance (₹${repayModalData.remainingAmount.toLocaleString('en-IN')})`);
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/udhaar/${repayModalData._id}/repay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(repayData),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to record repayment');
        return;
      }

      setRepayModalData(null);
      setRepayData({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cash',
        accountId: '',
        notes: '',
      });
      fetchUdhaar();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('finance_updated'));
      }
    } catch (err: any) {
      setFormError(err.message || 'Error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: UdhaarStatus) => {
    switch (status) {
      case 'cleared':
        return (
          <span className="udhaar-badge udhaar-badge-cleared">
            <CheckCircle2 style={{ width: 14, height: 14 }} />
            CLEARED
          </span>
        );
      case 'partially_paid':
        return (
          <span className="udhaar-badge udhaar-badge-partially-paid">
            <Clock style={{ width: 14, height: 14 }} />
            PARTIALLY PAID
          </span>
        );
      case 'overdue':
        return (
          <span className="udhaar-badge udhaar-badge-overdue">
            <AlertCircle style={{ width: 14, height: 14 }} />
            OVERDUE
          </span>
        );
      default:
        return (
          <span className="udhaar-badge udhaar-badge-pending">
            <Clock style={{ width: 14, height: 14 }} />
            PENDING
          </span>
        );
    }
  };

  const pageIds = records.map((r) => r._id);
  const allSelectedOnPage = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  return (
    <DashboardLayout>
      <div className="udhaar">
        {/* Header */}
        <div className="udhaar-header">
          <div className="udhaar-header-left">
            <div className="udhaar-header-icon">
              <HandCoins style={{ width: 24, height: 24 }} />
            </div>
            <div>
              <h1 className="udhaar-title">Udhaar Management</h1>
              <p className="udhaar-description">
                Track money lent, money borrowed, partial repayments and cleared history
              </p>
            </div>
          </div>

          <div className="udhaar-actions">
            <button
              onClick={() => {
                setFormData((prev) => ({ ...prev, type: 'lent' }));
                setIsAddModalOpen(true);
              }}
              className="udhaar-btn-lent"
            >
              <ArrowUpRight style={{ width: 16, height: 16 }} />
              <span>Give Udhaar (Lent)</span>
            </button>

            <button
              onClick={() => {
                setFormData((prev) => ({ ...prev, type: 'borrowed' }));
                setIsAddModalOpen(true);
              }}
              className="udhaar-btn-borrowed"
            >
              <ArrowDownLeft style={{ width: 16, height: 16 }} />
              <span>Take Udhaar (Borrowed)</span>
            </button>
          </div>
        </div>

        {/* 9 KPI SUMMARY CARDS */}
        <div className="udhaar-stats">
          {/* 1. Total Money Lent */}
          <div className="udhaar-stat-card">
            <div className="udhaar-stat-label">Total Lent</div>
            <div className="udhaar-stat-value udhaar-stat-value-emerald">
              {formatCurrency(summary.totalMoneyLent, user?.preferredCurrency, user?.currencySymbol)}
            </div>
            <div className="udhaar-stat-subtitle">Asset / Given out</div>
          </div>

          {/* 2. Total Money Borrowed */}
          <div className="udhaar-stat-card">
            <div className="udhaar-stat-label">Total Borrowed</div>
            <div className="udhaar-stat-value udhaar-stat-value-amber">
              {formatCurrency(summary.totalMoneyBorrowed, user?.preferredCurrency, user?.currencySymbol)}
            </div>
            <div className="udhaar-stat-subtitle">Liability / Taken in</div>
          </div>

          {/* 3. Total Amount Received */}
          <div className="udhaar-stat-card">
            <div className="udhaar-stat-label">Amount Received</div>
            <div className="udhaar-stat-value udhaar-stat-value-teal">
              {formatCurrency(summary.totalAmountReceived, user?.preferredCurrency, user?.currencySymbol)}
            </div>
            <div className="udhaar-stat-subtitle">Recovered from lent</div>
          </div>

          {/* 4. Total Amount Repaid */}
          <div className="udhaar-stat-card">
            <div className="udhaar-stat-label">Amount Repaid</div>
            <div className="udhaar-stat-value udhaar-stat-value-indigo">
              {formatCurrency(summary.totalAmountRepaid, user?.preferredCurrency, user?.currencySymbol)}
            </div>
            <div className="udhaar-stat-subtitle">Repaid to lenders</div>
          </div>

          {/* 5. Pending Receivables */}
          <div className="udhaar-stat-card udhaar-stat-card-highlight-green">
            <div className="udhaar-stat-label" style={{ color: '#065f46' }}>Pending Receivables</div>
            <div className="udhaar-stat-value udhaar-stat-value-emerald">
              {formatCurrency(summary.pendingReceivables, user?.preferredCurrency, user?.currencySymbol)}
            </div>
            <div className="udhaar-stat-subtitle" style={{ color: '#047857' }}>To collect from others</div>
          </div>

          {/* 6. Pending Payables */}
          <div className="udhaar-stat-card udhaar-stat-card-highlight-amber">
            <div className="udhaar-stat-label" style={{ color: '#92400e' }}>Pending Payables</div>
            <div className="udhaar-stat-value udhaar-stat-value-amber">
              {formatCurrency(summary.pendingPayables, user?.preferredCurrency, user?.currencySymbol)}
            </div>
            <div className="udhaar-stat-subtitle" style={{ color: '#b45309' }}>To repay to lenders</div>
          </div>

          {/* 7. Partially Repaid Count */}
          <div className="udhaar-stat-card">
            <div className="udhaar-stat-label">Partially Repaid</div>
            <div className="udhaar-stat-value udhaar-stat-value-blue">{summary.partiallyRepaidCount}</div>
            <div className="udhaar-stat-subtitle">Active installments</div>
          </div>

          {/* 8. Fully Cleared Count */}
          <div className="udhaar-stat-card">
            <div className="udhaar-stat-label">Fully Cleared</div>
            <div className="udhaar-stat-value udhaar-stat-value-emerald">{summary.fullyClearedCount}</div>
            <div className="udhaar-stat-subtitle">Settled records</div>
          </div>

          {/* 9. Overdue Count */}
          <div className="udhaar-stat-card">
            <div className="udhaar-stat-label">Overdue Records</div>
            <div className="udhaar-stat-value udhaar-stat-value-rose">{summary.overdueCount}</div>
            <div className="udhaar-stat-subtitle">Past expected date</div>
          </div>
        </div>

        {/* 5 TABS + FILTER CONTROLS */}
        <div className="udhaar-content">
          {/* Tabs navigation */}
          <div className="udhaar-tabs">
            {[
              { id: 'all', label: 'All Records', count: totalCount },
              { id: 'lent', label: 'Money I Lent', count: undefined },
              { id: 'borrowed', label: 'Money I Borrowed', count: undefined },
              { id: 'active', label: 'Active Udhaar', count: undefined },
              { id: 'cleared', label: 'Cleared History', count: summary.fullyClearedCount },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`udhaar-tab-btn ${isActive ? 'udhaar-tab-btn-active' : ''}`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`udhaar-tab-badge ${isActive ? 'udhaar-tab-badge-active' : ''}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search and Filters toolbar */}
          <div className="udhaar-toolbar">
            <form onSubmit={handleSearch} className="udhaar-search-form">
              <Search className="udhaar-search-icon" />
              <input
                type="text"
                placeholder="Search person, phone, record ID, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="udhaar-search-input"
              />
            </form>

            <div className="udhaar-toolbar-right">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="udhaar-filter-select"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="cleared">Cleared</option>
                <option value="overdue">Overdue</option>
              </select>

              <button
                onClick={handleExportCsv}
                className="udhaar-btn-export"
              >
                <Download style={{ width: 14, height: 14 }} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* TABLE OF RECORDS */}
          <div className="udhaar-table-container">
            {loading ? (
              <div style={{ padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: 8 }}>
                <Loader2 style={{ width: 32, height: 32, color: '#10b981' }} className="animate-spin" />
                <p style={{ fontSize: 12 }}>Loading Udhaar records...</p>
              </div>
            ) : records.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
                <HandCoins style={{ width: 48, height: 48, color: '#cbd5e1', margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>No Udhaar records found</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
                  {activeTab === 'cleared'
                    ? 'No cleared history yet. Once an active Udhaar balance reaches ₹0, it moves here automatically.'
                    : 'Start by tracking money you have lent to others or borrowed from others.'}
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="udhaar-btn-lent"
                  style={{ marginTop: 16, display: 'inline-flex' }}
                >
                  <Plus style={{ width: 16, height: 16 }} />
                  <span>Add First Udhaar</span>
                </button>
              </div>
            ) : (
              <table className="udhaar-table">
                <thead>
                  <tr>
                    <th className="udhaar-table-th" style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        checked={allSelectedOnPage}
                        onChange={handleSelectAllPage}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th className="udhaar-table-th">Record ID</th>
                    <th className="udhaar-table-th">Person</th>
                    <th className="udhaar-table-th">Type</th>
                    <th className="udhaar-table-th" style={{ textAlign: 'right' }}>Original</th>
                    <th className="udhaar-table-th" style={{ textAlign: 'right' }}>Repaid</th>
                    <th className="udhaar-table-th" style={{ textAlign: 'right' }}>Remaining</th>
                    <th className="udhaar-table-th">Dates / Duration</th>
                    <th className="udhaar-table-th">Status</th>
                    <th className="udhaar-table-th" style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => {
                    const isSelected = selectedIds.includes(r._id);
                    const isLent = r.type === 'lent';
                    const isCleared = r.status === 'cleared' || r.remainingAmount <= 0;

                    return (
                      <tr
                        key={r._id}
                        className={`udhaar-table-row ${isSelected ? 'udhaar-table-row-selected' : ''}`}
                      >
                        <td className="udhaar-table-td">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(r._id)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>

                        <td className="udhaar-table-td" style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>
                          {r.recordId}
                        </td>

                        <td className="udhaar-table-td">
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.personName}</div>
                          {r.phoneNumber && (
                            <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Phone style={{ width: 12, height: 12 }} />
                              <span>{r.phoneNumber}</span>
                            </div>
                          )}
                        </td>

                        <td className="udhaar-table-td">
                          {isLent ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #d1fae5' }}>
                              <ArrowUpRight style={{ width: 12, height: 12 }} />
                              Lent (Receivable)
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
                              <ArrowDownLeft style={{ width: 12, height: 12 }} />
                              Borrowed (Payable)
                            </span>
                          )}
                        </td>

                        <td className="udhaar-table-td" style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                          {formatCurrency(r.originalAmount, user?.preferredCurrency, user?.currencySymbol)}
                        </td>

                        <td className="udhaar-table-td" style={{ textAlign: 'right', fontWeight: 600, color: '#0f766e' }}>
                          {formatCurrency(r.totalRepaid || 0, user?.preferredCurrency, user?.currencySymbol)}
                        </td>

                        <td className="udhaar-table-td" style={{ textAlign: 'right', fontWeight: 700 }}>
                          <span
                            style={{
                              color: r.remainingAmount > 0
                                ? isLent
                                  ? '#047857'
                                  : '#b45309'
                                : '#94a3b8'
                            }}
                          >
                            {formatCurrency(r.remainingAmount || 0, user?.preferredCurrency, user?.currencySymbol)}
                          </span>
                        </td>

                        <td className="udhaar-table-td" style={{ fontSize: 12, color: '#475569' }}>
                          <div>
                            <span style={{ color: '#94a3b8' }}>Date: </span>
                            {new Date(r.udhaarDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          {isCleared ? (
                            <div style={{ fontSize: 11, color: '#047857', fontWeight: 600, marginTop: 2 }}>
                              Settled in {r.settlementDurationDays ?? 0} Days
                            </div>
                          ) : r.expectedRepaymentDate ? (
                            <div
                              style={{
                                fontSize: 11,
                                marginTop: 2,
                                color: new Date(r.expectedRepaymentDate) < new Date() ? '#e11d48' : '#94a3b8',
                                fontWeight: new Date(r.expectedRepaymentDate) < new Date() ? 600 : 'normal'
                              }}
                            >
                              Due: {new Date(r.expectedRepaymentDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                          ) : null}
                        </td>

                        <td className="udhaar-table-td">{getStatusBadge(r.status)}</td>

                        <td className="udhaar-table-td" style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {!isCleared && (
                              <button
                                onClick={() => {
                                  setRepayModalData(r);
                                  setRepayData({
                                    amount: r.remainingAmount.toString(),
                                    date: new Date().toISOString().split('T')[0],
                                    paymentMethod: 'Cash',
                                    accountId: r.accountId || '',
                                    notes: '',
                                  });
                                }}
                                title="Record Repayment"
                                className="udhaar-btn-repay"
                              >
                                Repay
                              </button>
                            )}

                            <button
                              onClick={() => setHistoryModalData(r)}
                              title="View Ledger History"
                              className="udhaar-btn-history"
                            >
                              <History style={{ width: 16, height: 16 }} />
                            </button>

                            <button
                              onClick={() => handleSingleDelete(r._id)}
                              title="Move to Recycle Bin"
                              className="udhaar-btn-delete"
                            >
                              <Trash2 style={{ width: 16, height: 16 }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
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

        {/* Global Bulk Action Bar for Udhaar */}
        <BulkActionBar
          selectedCount={selectedIds.length}
          totalPageCount={records.length}
          allSelectedOnPage={allSelectedOnPage}
          onSelectAllPage={handleSelectAllPage}
          onClearSelection={() => setSelectedIds([])}
          onMoveToTrash={handleBulkMoveToTrash}
          onExportCsv={handleExportCsv}
        />

        {/* ADD UDHAAR MODAL */}
        {isAddModalOpen && (
          <div className="udhaar-modal-backdrop">
            <div className="udhaar-modal udhaar-modal-lg">
              <div className="udhaar-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <HandCoins style={{ width: 20, height: 20, color: '#047857' }} />
                  <h3 className="udhaar-modal-title">Add Udhaar Record</h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="udhaar-modal-close-btn"
                >
                  <X style={{ width: 16, height: 16 }} />
                </button>
              </div>

              {formError && (
                <div style={{ marginTop: 14, padding: 12, backgroundColor: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c', fontSize: 12, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleAddSubmit} className="udhaar-form">
                {/* Type toggle */}
                <div className="udhaar-form-group">
                  <label className="udhaar-form-label">
                    Transaction Type <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <div className="udhaar-form-grid">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'lent' })}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        border: formData.type === 'lent' ? '1px solid #059669' : '1px solid #e2e8f0',
                        backgroundColor: formData.type === 'lent' ? '#ecfdf5' : '#ffffff',
                        color: formData.type === 'lent' ? '#065f46' : '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      <ArrowUpRight style={{ width: 16, height: 16, color: '#059669' }} />
                      <span>Money I Lent (Given)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'borrowed' })}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        border: formData.type === 'borrowed' ? '1px solid #d97706' : '1px solid #e2e8f0',
                        backgroundColor: formData.type === 'borrowed' ? '#fffbeb' : '#ffffff',
                        color: formData.type === 'borrowed' ? '#92400e' : '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      <ArrowDownLeft style={{ width: 16, height: 16, color: '#d97706' }} />
                      <span>Money I Borrowed (Taken)</span>
                    </button>
                  </div>
                </div>

                {/* Person Name & Phone */}
                <div className="udhaar-form-grid">
                  <div className="udhaar-form-group">
                    <label className="udhaar-form-label">
                      Person Name <span style={{ color: '#e11d48' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.personName}
                      onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                      className="udhaar-form-input"
                    />
                  </div>

                  <div className="udhaar-form-group">
                    <label className="udhaar-form-label">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="udhaar-form-input"
                    />
                  </div>
                </div>

                {/* Amount & Date */}
                <div className="udhaar-form-grid">
                  <div className="udhaar-form-group">
                    <label className="udhaar-form-label">
                      Original Amount (₹) <span style={{ color: '#e11d48' }}>*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="10000"
                      value={formData.originalAmount}
                      onChange={(e) => setFormData({ ...formData, originalAmount: e.target.value })}
                      className="udhaar-form-input"
                      style={{ fontWeight: 700 }}
                    />
                  </div>

                  <div className="udhaar-form-group">
                    <label className="udhaar-form-label">
                      Udhaar Date <span style={{ color: '#e11d48' }}>*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.udhaarDate}
                      onChange={(e) => setFormData({ ...formData, udhaarDate: e.target.value })}
                      className="udhaar-form-input"
                    />
                  </div>
                </div>

                {/* Expected Repayment Date & Payment Method */}
                <div className="udhaar-form-grid">
                  <div className="udhaar-form-group">
                    <label className="udhaar-form-label">
                      Expected Repayment Date
                    </label>
                    <input
                      type="date"
                      value={formData.expectedRepaymentDate}
                      onChange={(e) => setFormData({ ...formData, expectedRepaymentDate: e.target.value })}
                      className="udhaar-form-input"
                    />
                  </div>

                  <div className="udhaar-form-group">
                    <label className="udhaar-form-label">
                      Payment Method
                    </label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="udhaar-form-select"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="Bank Transfer">Bank Transfer / IMPS</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Linked Financial Account */}
                <div className="udhaar-form-group">
                  <label className="udhaar-form-label">
                    Linked Financial Account (Optional)
                  </label>
                  <select
                    value={formData.accountId}
                    onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                    className="udhaar-form-select"
                  >
                    <option value="">Do not adjust any account balance</option>
                    {accounts.map((acc) => (
                      <option key={acc._id} value={acc._id}>
                        {acc.accountName} ({formatCurrency(acc.currentBalance, user?.preferredCurrency, user?.currencySymbol)})
                      </option>
                    ))}
                  </select>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0' }}>
                    {formData.type === 'lent'
                      ? 'Selecting an account will deduct this amount from the account without marking it as an expense.'
                      : 'Selecting an account will add this amount to the account without marking it as ordinary income.'}
                  </p>
                </div>

                {/* Description & Notes */}
                <div className="udhaar-form-group">
                  <label className="udhaar-form-label">
                    Description / Purpose
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Medical emergency assistance, festival advance"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="udhaar-form-input"
                  />
                </div>

                <div className="udhaar-form-group">
                  <label className="udhaar-form-label">
                    Additional Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Any conditions or extra notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="udhaar-form-textarea"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="udhaar-form-actions">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="transaction-btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="transaction-btn-submit"
                  >
                    {actionLoading && <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />}
                    <span>Save Udhaar Record</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* RECORD REPAYMENT MODAL */}
        {repayModalData && (
          <div className="udhaar-modal-backdrop">
            <div className="udhaar-modal">
              <div className="udhaar-modal-header">
                <div>
                  <h3 className="udhaar-modal-title">Record Repayment</h3>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                    {repayModalData.type === 'lent' ? 'Received from' : 'Paid to'}:{' '}
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{repayModalData.personName}</span>
                  </p>
                </div>
                <button
                  onClick={() => setRepayModalData(null)}
                  className="udhaar-modal-close-btn"
                >
                  <X style={{ width: 16, height: 16 }} />
                </button>
              </div>

              {/* Status summary */}
              <div style={{ marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Original:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    {formatCurrency(repayModalData.originalAmount, user?.preferredCurrency, user?.currencySymbol)}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Already Repaid:</span>
                  <span style={{ fontWeight: 700, color: '#0f766e' }}>
                    {formatCurrency(repayModalData.totalRepaid || 0, user?.preferredCurrency, user?.currencySymbol)}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block' }}>Remaining:</span>
                  <span style={{ fontWeight: 700, color: '#047857' }}>
                    {formatCurrency(repayModalData.remainingAmount, user?.preferredCurrency, user?.currencySymbol)}
                  </span>
                </div>
              </div>

              {formError && (
                <div style={{ marginTop: 12, padding: 10, backgroundColor: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c', fontSize: 12, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleRepaySubmit} className="udhaar-form">
                <div className="udhaar-form-group">
                  <label className="udhaar-form-label">
                    Repayment Amount (₹) <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={repayModalData.remainingAmount}
                    step="any"
                    value={repayData.amount}
                    onChange={(e) => setRepayData({ ...repayData, amount: e.target.value })}
                    className="udhaar-form-input"
                    style={{ fontWeight: 700 }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => setRepayData({ ...repayData, amount: repayModalData.remainingAmount.toString() })}
                      style={{ fontSize: 11, color: '#047857', fontWeight: 600, border: 'none', background: 'transparent', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Clear Full Remaining ({formatCurrency(repayModalData.remainingAmount, user?.preferredCurrency, user?.currencySymbol)})
                    </button>
                  </div>
                </div>

                <div className="udhaar-form-grid">
                  <div className="udhaar-form-group">
                    <label className="udhaar-form-label">
                      Repayment Date <span style={{ color: '#e11d48' }}>*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={repayData.date}
                      onChange={(e) => setRepayData({ ...repayData, date: e.target.value })}
                      className="udhaar-form-input"
                    />
                  </div>

                  <div className="udhaar-form-group">
                    <label className="udhaar-form-label">
                      Payment Method
                    </label>
                    <select
                      value={repayData.paymentMethod}
                      onChange={(e) => setRepayData({ ...repayData, paymentMethod: e.target.value })}
                      className="udhaar-form-select"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="udhaar-form-group">
                  <label className="udhaar-form-label">
                    {repayModalData.type === 'lent' ? 'Received Into Account' : 'Paid From Account'} (Optional)
                  </label>
                  <select
                    value={repayData.accountId}
                    onChange={(e) => setRepayData({ ...repayData, accountId: e.target.value })}
                    className="udhaar-form-select"
                  >
                    <option value="">Do not adjust account balance</option>
                    {accounts.map((acc) => (
                      <option key={acc._id} value={acc._id}>
                        {acc.accountName} ({formatCurrency(acc.currentBalance, user?.preferredCurrency, user?.currencySymbol)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="udhaar-form-group">
                  <label className="udhaar-form-label">Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Part 1 payment via Google Pay"
                    value={repayData.notes}
                    onChange={(e) => setRepayData({ ...repayData, notes: e.target.value })}
                    className="udhaar-form-input"
                  />
                </div>

                <div className="udhaar-form-actions">
                  <button
                    type="button"
                    onClick={() => setRepayModalData(null)}
                    className="transaction-btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="transaction-btn-submit"
                  >
                    {actionLoading && <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />}
                    <span>Record Repayment</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DETAILED HISTORY MODAL */}
        {historyModalData && (
          <div className="udhaar-modal-backdrop">
            <div className="udhaar-modal udhaar-modal-lg">
              <div className="udhaar-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <History style={{ width: 20, height: 20, color: '#047857' }} />
                  <div>
                    <h3 className="udhaar-modal-title">
                      Udhaar History: {historyModalData.personName}
                    </h3>
                    <p style={{ fontSize: 12, fontFamily: 'monospace', color: '#64748b', margin: '2px 0 0' }}>{historyModalData.recordId}</p>
                  </div>
                </div>
                <button
                  onClick={() => setHistoryModalData(null)}
                  className="udhaar-modal-close-btn"
                >
                  <X style={{ width: 16, height: 16 }} />
                </button>
              </div>

              {/* Record Summary Details */}
              <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12, padding: 14, borderRadius: 12, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12 }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: 10, fontWeight: 700 }}>Original Amount</span>
                  <span style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>
                    {formatCurrency(historyModalData.originalAmount, user?.preferredCurrency, user?.currencySymbol)}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: 10, fontWeight: 700 }}>Total Repaid</span>
                  <span style={{ fontWeight: 800, fontSize: 15, color: '#0f766e' }}>
                    {formatCurrency(historyModalData.totalRepaid || 0, user?.preferredCurrency, user?.currencySymbol)}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: 10, fontWeight: 700 }}>Remaining</span>
                  <span style={{ fontWeight: 800, fontSize: 15, color: '#047857' }}>
                    {formatCurrency(historyModalData.remainingAmount, user?.preferredCurrency, user?.currencySymbol)}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', textTransform: 'uppercase', fontSize: 10, fontWeight: 700 }}>Status</span>
                  <div style={{ marginTop: 2 }}>{getStatusBadge(historyModalData.status)}</div>
                </div>
              </div>

              {/* Dates & Settlement Duration */}
              <div style={{ marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', fontSize: 12, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, color: '#475569' }}>
                <div>
                  <span style={{ color: '#94a3b8' }}>Given / Borrowed Date: </span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>
                    {new Date(historyModalData.udhaarDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {historyModalData.settlementDate && (
                  <div>
                    <span style={{ color: '#94a3b8' }}>Final Cleared Date: </span>
                    <span style={{ fontWeight: 600, color: '#047857' }}>
                      {new Date(historyModalData.settlementDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}

                {historyModalData.status === 'cleared' && (
                  <div style={{ backgroundColor: '#d1fae5', color: '#065f46', fontWeight: 700, padding: '3px 10px', borderRadius: 9999, fontSize: 11 }}>
                    Settlement Duration: {historyModalData.settlementDurationDays ?? 0} Days
                  </div>
                )}
              </div>

              {/* Description & Notes */}
              {(historyModalData.description || historyModalData.notes) && (
                <div style={{ marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {historyModalData.description && (
                    <p style={{ color: '#334155', margin: 0 }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>Description:</span> {historyModalData.description}
                    </p>
                  )}
                  {historyModalData.notes && (
                    <p style={{ color: '#64748b', margin: 0 }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>Notes:</span> {historyModalData.notes}
                    </p>
                  )}
                </div>
              )}

              {/* Repayments Ledger Table */}
              <div style={{ marginTop: 20 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#334155', margin: '0 0 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Partial Repayment Ledger</span>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>
                    {historyModalData.repayments?.length || 0} payment(s) recorded
                  </span>
                </h4>

                {!historyModalData.repayments || historyModalData.repayments.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12, border: '1px dashed #cbd5e1', borderRadius: 12 }}>
                    No repayments have been recorded for this record yet.
                  </div>
                ) : (
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
                    <table style={{ width: '100%', textAlign: 'left', fontSize: 12, borderCollapse: 'collapse' }}>
                      <thead style={{ backgroundColor: '#f1f5f9', color: '#475569', textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.05em' }}>
                        <tr>
                          <th style={{ padding: '10px 12px' }}>Repayment ID</th>
                          <th style={{ padding: '10px 12px' }}>Date</th>
                          <th style={{ padding: '10px 12px', textAlign: 'right' }}>Amount</th>
                          <th style={{ padding: '10px 12px' }}>Method</th>
                          <th style={{ padding: '10px 12px' }}>Account</th>
                          <th style={{ padding: '10px 12px' }}>Notes</th>
                        </tr>
                      </thead>
                      <tbody style={{ borderTop: '1px solid #e2e8f0' }}>
                        {historyModalData.repayments.map((rep, idx) => (
                          <tr key={rep.repaymentId || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>
                              {rep.repaymentId}
                            </td>
                            <td style={{ padding: '10px 12px', color: '#0f172a' }}>
                              {new Date(rep.date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#047857' }}>
                              {formatCurrency(rep.amount, user?.preferredCurrency, user?.currencySymbol)}
                            </td>
                            <td style={{ padding: '10px 12px', color: '#475569' }}>{rep.paymentMethod || 'Cash'}</td>
                            <td style={{ padding: '10px 12px', color: '#64748b' }}>{rep.accountName || '—'}</td>
                            <td style={{ padding: '10px 12px', color: '#64748b', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rep.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setHistoryModalData(null)}
                  className="transaction-btn-cancel"
                >
                  Close History
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

