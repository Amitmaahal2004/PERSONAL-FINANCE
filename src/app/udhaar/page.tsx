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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            CLEARED
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            PARTIALLY PAID
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            OVERDUE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            PENDING
          </span>
        );
    }
  };

  const pageIds = records.map((r) => r._id);
  const allSelectedOnPage = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <HandCoins className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Udhaar Management</h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  Track money lent, money borrowed, partial repayments and cleared history
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => {
                setFormData((prev) => ({ ...prev, type: 'lent' }));
                setIsAddModalOpen(true);
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-sm active:scale-[0.98]"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Give Udhaar (Lent)</span>
            </button>

            <button
              onClick={() => {
                setFormData((prev) => ({ ...prev, type: 'borrowed' }));
                setIsAddModalOpen(true);
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-sm active:scale-[0.98]"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Take Udhaar (Borrowed)</span>
            </button>
          </div>
        </div>

        {/* 9 KPI SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* 1. Total Money Lent */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Lent</div>
            <div className="mt-1 text-lg sm:text-xl font-bold text-emerald-700">
              {formatCurrency(summary.totalMoneyLent, user?.preferredCurrency, user?.currencySymbol)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Asset / Given out</div>
          </div>

          {/* 2. Total Money Borrowed */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Borrowed</div>
            <div className="mt-1 text-lg sm:text-xl font-bold text-amber-700">
              {formatCurrency(summary.totalMoneyBorrowed, user?.preferredCurrency, user?.currencySymbol)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Liability / Taken in</div>
          </div>

          {/* 3. Total Amount Received */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Amount Received</div>
            <div className="mt-1 text-lg sm:text-xl font-bold text-teal-700">
              {formatCurrency(summary.totalAmountReceived, user?.preferredCurrency, user?.currencySymbol)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Recovered from lent</div>
          </div>

          {/* 4. Total Amount Repaid */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Amount Repaid</div>
            <div className="mt-1 text-lg sm:text-xl font-bold text-indigo-700">
              {formatCurrency(summary.totalAmountRepaid, user?.preferredCurrency, user?.currencySymbol)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Repaid to lenders</div>
          </div>

          {/* 5. Pending Receivables */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 shadow-xs">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Pending Receivables</div>
            <div className="mt-1 text-lg sm:text-xl font-extrabold text-emerald-700">
              {formatCurrency(summary.pendingReceivables, user?.preferredCurrency, user?.currencySymbol)}
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5">To collect from others</div>
          </div>

          {/* 6. Pending Payables */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 shadow-xs">
            <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Pending Payables</div>
            <div className="mt-1 text-lg sm:text-xl font-extrabold text-amber-700">
              {formatCurrency(summary.pendingPayables, user?.preferredCurrency, user?.currencySymbol)}
            </div>
            <div className="text-[10px] text-amber-600 mt-0.5">To repay to lenders</div>
          </div>

          {/* 7. Partially Repaid Count */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Partially Repaid</div>
            <div className="mt-1 text-lg sm:text-xl font-bold text-blue-700">{summary.partiallyRepaidCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Active installments</div>
          </div>

          {/* 8. Fully Cleared Count */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Fully Cleared</div>
            <div className="mt-1 text-lg sm:text-xl font-bold text-emerald-700">{summary.fullyClearedCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Settled records</div>
          </div>

          {/* 9. Overdue Count */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Overdue Records</div>
            <div className="mt-1 text-lg sm:text-xl font-bold text-rose-600">{summary.overdueCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Past expected date</div>
          </div>
        </div>

        {/* 5 TABS + FILTER CONTROLS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Tabs navigation */}
          <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none px-4 pt-2">
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
                  className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                    isActive
                      ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search and Filters toolbar */}
          <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100">
            <form onSubmit={handleSearch} className="flex-1 w-full sm:max-w-md relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search person, phone, record ID, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </form>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="cleared">Cleared</option>
                <option value="overdue">Overdue</option>
              </select>

              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-medium transition"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </div>
          </div>

          {/* TABLE OF RECORDS */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                <p className="text-xs">Loading Udhaar records...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <HandCoins className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No Udhaar records found</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  {activeTab === 'cleared'
                    ? 'No cleared history yet. Once an active Udhaar balance reaches ₹0, it moves here automatically.'
                    : 'Start by tracking money you have lent to others or borrowed from others.'}
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Udhaar</span>
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 select-none">
                  <tr>
                    <th className="py-3 px-3.5 w-10">
                      <input
                        type="checkbox"
                        checked={allSelectedOnPage}
                        onChange={handleSelectAllPage}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-3">Record ID</th>
                    <th className="py-3 px-3">Person</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3 text-right">Original</th>
                    <th className="py-3 px-3 text-right">Repaid</th>
                    <th className="py-3 px-3 text-right">Remaining</th>
                    <th className="py-3 px-3">Dates / Duration</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r) => {
                    const isSelected = selectedIds.includes(r._id);
                    const isLent = r.type === 'lent';
                    const isCleared = r.status === 'cleared' || r.remainingAmount <= 0;

                    return (
                      <tr
                        key={r._id}
                        className={`hover:bg-slate-50/80 transition ${
                          isSelected ? 'bg-emerald-50/30' : ''
                        }`}
                      >
                        <td className="py-3 px-3.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(r._id)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>

                        <td className="py-3 px-3 font-mono text-xs text-slate-500">
                          {r.recordId}
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900">{r.personName}</div>
                          {r.phoneNumber && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>{r.phoneNumber}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          {isLent ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <ArrowUpRight className="w-3 h-3" />
                              Lent (Receivable)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                              <ArrowDownLeft className="w-3 h-3" />
                              Borrowed (Payable)
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right font-medium text-slate-900">
                          {formatCurrency(r.originalAmount, user?.preferredCurrency, user?.currencySymbol)}
                        </td>

                        <td className="py-3 px-3 text-right font-medium text-teal-600">
                          {formatCurrency(r.totalRepaid || 0, user?.preferredCurrency, user?.currencySymbol)}
                        </td>

                        <td className="py-3 px-3 text-right font-bold">
                          <span
                            className={
                              r.remainingAmount > 0
                                ? isLent
                                  ? 'text-emerald-700'
                                  : 'text-amber-700'
                                : 'text-slate-400'
                            }
                          >
                            {formatCurrency(r.remainingAmount || 0, user?.preferredCurrency, user?.currencySymbol)}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-xs text-slate-600">
                          <div>
                            <span className="text-slate-400">Date: </span>
                            {new Date(r.udhaarDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          {isCleared ? (
                            <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                              Settled in {r.settlementDurationDays ?? 0} Days
                            </div>
                          ) : r.expectedRepaymentDate ? (
                            <div
                              className={`text-[11px] mt-0.5 ${
                                new Date(r.expectedRepaymentDate) < new Date()
                                  ? 'text-rose-600 font-semibold'
                                  : 'text-slate-400'
                              }`}
                            >
                              Due: {new Date(r.expectedRepaymentDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                          ) : null}
                        </td>

                        <td className="py-3 px-3">{getStatusBadge(r.status)}</td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
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
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-xs transition border border-emerald-200"
                              >
                                Repay
                              </button>
                            )}

                            <button
                              onClick={() => setHistoryModalData(r)}
                              title="View Ledger History"
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                            >
                              <History className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleSingleDelete(r._id)}
                              title="Move to Recycle Bin"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
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
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <HandCoins className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-bold text-slate-900">Add Udhaar Record</h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
                {/* Type toggle */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Transaction Type <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'lent' })}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition ${
                        formData.type === 'lent'
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      <span>Money I Lent (Given)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'borrowed' })}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition ${
                        formData.type === 'borrowed'
                          ? 'bg-amber-50 border-amber-600 text-amber-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <ArrowDownLeft className="w-4 h-4 text-amber-600" />
                      <span>Money I Borrowed (Taken)</span>
                    </button>
                  </div>
                </div>

                {/* Person Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Person Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.personName}
                      onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Amount & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Original Amount (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="10000"
                      value={formData.originalAmount}
                      onChange={(e) => setFormData({ ...formData, originalAmount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Udhaar Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.udhaarDate}
                      onChange={(e) => setFormData({ ...formData, udhaarDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Expected Repayment Date & Payment Method */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Expected Repayment Date
                    </label>
                    <input
                      type="date"
                      value={formData.expectedRepaymentDate}
                      onChange={(e) => setFormData({ ...formData, expectedRepaymentDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Linked Financial Account (Optional)
                  </label>
                  <select
                    value={formData.accountId}
                    onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Do not adjust any account balance</option>
                    {accounts.map((acc) => (
                      <option key={acc._id} value={acc._id}>
                        {acc.accountName} ({formatCurrency(acc.currentBalance, user?.preferredCurrency, user?.currencySymbol)})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {formData.type === 'lent'
                      ? 'Selecting an account will deduct this amount from the account without marking it as an expense.'
                      : 'Selecting an account will add this amount to the account without marking it as ordinary income.'}
                  </p>
                </div>

                {/* Description & Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description / Purpose
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Medical emergency assistance, festival advance"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Any conditions or extra notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Udhaar Record</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* RECORD REPAYMENT MODAL */}
        {repayModalData && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Record Repayment</h3>
                  <p className="text-xs text-slate-500">
                    {repayModalData.type === 'lent' ? 'Received from' : 'Paid to'}:{' '}
                    <span className="font-semibold text-slate-800">{repayModalData.personName}</span>
                  </p>
                </div>
                <button
                  onClick={() => setRepayModalData(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status summary */}
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">Original:</span>
                  <span className="font-bold text-slate-800">
                    {formatCurrency(repayModalData.originalAmount, user?.preferredCurrency, user?.currencySymbol)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Already Repaid:</span>
                  <span className="font-bold text-teal-600">
                    {formatCurrency(repayModalData.totalRepaid || 0, user?.preferredCurrency, user?.currencySymbol)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Remaining:</span>
                  <span className="font-bold text-emerald-700">
                    {formatCurrency(repayModalData.remainingAmount, user?.preferredCurrency, user?.currencySymbol)}
                  </span>
                </div>
              </div>

              {formError && (
                <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleRepaySubmit} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Repayment Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={repayModalData.remainingAmount}
                    step="any"
                    value={repayData.amount}
                    onChange={(e) => setRepayData({ ...repayData, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setRepayData({ ...repayData, amount: repayModalData.remainingAmount.toString() })}
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold underline underline-offset-2"
                    >
                      Clear Full Remaining ({formatCurrency(repayModalData.remainingAmount, user?.preferredCurrency, user?.currencySymbol)})
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Repayment Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={repayData.date}
                      onChange={(e) => setRepayData({ ...repayData, date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={repayData.paymentMethod}
                      onChange={(e) => setRepayData({ ...repayData, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {repayModalData.type === 'lent' ? 'Received Into Account' : 'Paid From Account'} (Optional)
                  </label>
                  <select
                    value={repayData.accountId}
                    onChange={(e) => setRepayData({ ...repayData, accountId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Do not adjust account balance</option>
                    {accounts.map((acc) => (
                      <option key={acc._id} value={acc._id}>
                        {acc.accountName} ({formatCurrency(acc.currentBalance, user?.preferredCurrency, user?.currencySymbol)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Part 1 payment via Google Pay"
                    value={repayData.notes}
                    onChange={(e) => setRepayData({ ...repayData, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRepayModalData(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Record Repayment</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DETAILED HISTORY MODAL */}
        {historyModalData && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Udhaar History: {historyModalData.personName}
                    </h3>
                    <p className="text-xs font-mono text-slate-500">{historyModalData.recordId}</p>
                  </div>
                </div>
                <button
                  onClick={() => setHistoryModalData(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Record Summary Details */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-400 block uppercase text-[10px] font-semibold">Original Amount</span>
                  <span className="font-bold text-sm text-slate-900">
                    {formatCurrency(historyModalData.originalAmount, user?.preferredCurrency, user?.currencySymbol)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase text-[10px] font-semibold">Total Repaid</span>
                  <span className="font-bold text-sm text-teal-600">
                    {formatCurrency(historyModalData.totalRepaid || 0, user?.preferredCurrency, user?.currencySymbol)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase text-[10px] font-semibold">Remaining</span>
                  <span className="font-bold text-sm text-emerald-700">
                    {formatCurrency(historyModalData.remainingAmount, user?.preferredCurrency, user?.currencySymbol)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase text-[10px] font-semibold">Status</span>
                  <div className="mt-0.5">{getStatusBadge(historyModalData.status)}</div>
                </div>
              </div>

              {/* Dates & Settlement Duration */}
              <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs flex flex-wrap items-center justify-between gap-2 text-slate-600">
                <div>
                  <span className="text-slate-400">Given / Borrowed Date: </span>
                  <span className="font-semibold text-slate-800">
                    {new Date(historyModalData.udhaarDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {historyModalData.settlementDate && (
                  <div>
                    <span className="text-slate-400">Final Cleared Date: </span>
                    <span className="font-semibold text-emerald-700">
                      {new Date(historyModalData.settlementDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}

                {historyModalData.status === 'cleared' && (
                  <div className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-xs">
                    Settlement Duration: {historyModalData.settlementDurationDays ?? 0} Days
                  </div>
                )}
              </div>

              {/* Description & Notes */}
              {(historyModalData.description || historyModalData.notes) && (
                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  {historyModalData.description && (
                    <p className="text-slate-700">
                      <span className="font-semibold text-slate-900">Description:</span> {historyModalData.description}
                    </p>
                  )}
                  {historyModalData.notes && (
                    <p className="text-slate-500">
                      <span className="font-semibold text-slate-900">Notes:</span> {historyModalData.notes}
                    </p>
                  )}
                </div>
              )}

              {/* Repayments Ledger Table */}
              <div className="mt-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
                  <span>Partial Repayment Ledger</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {historyModalData.repayments?.length || 0} payment(s) recorded
                  </span>
                </h4>

                {!historyModalData.repayments || historyModalData.repayments.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                    No repayments have been recorded for this record yet.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 text-slate-600 uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Repayment ID</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                          <th className="py-2.5 px-3">Method</th>
                          <th className="py-2.5 px-3">Account</th>
                          <th className="py-2.5 px-3">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {historyModalData.repayments.map((rep, idx) => (
                          <tr key={rep.repaymentId || idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                              {rep.repaymentId}
                            </td>
                            <td className="py-2.5 px-3 text-slate-800">
                              {new Date(rep.date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                              {formatCurrency(rep.amount, user?.preferredCurrency, user?.currencySymbol)}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{rep.paymentMethod || 'Cash'}</td>
                            <td className="py-2.5 px-3 text-slate-500">{rep.accountName || '—'}</td>
                            <td className="py-2.5 px-3 text-slate-500 max-w-[150px] truncate">{rep.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setHistoryModalData(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
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

