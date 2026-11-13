'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/currency';
import { ITrashItem } from '@/types';
import Pagination from '@/components/common/Pagination';
import BulkActionBar from '@/components/common/BulkActionBar';
import {
  Trash2,
  RotateCcw,
  Search,
  Filter,
  AlertTriangle,
  Loader2,
  Calendar,
  Layers,
  ArrowLeftRight,
  Wallet,
  Tag,
  PieChart,
  Target,
  HandCoins,
  Repeat,
  Coins,
  CheckSquare,
  RefreshCw,
} from 'lucide-react';

export default function TrashPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [activeModule, setActiveModule] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [items, setItems] = useState<ITrashItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({
    all: 0,
    transactions: 0,
    accounts: 0,
    categories: 0,
    budgets: 0,
    savings: 0,
    loans: 0,
    udhaar: 0,
    recurring: 0,
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Single action confirmation modals
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'empty' | 'permanent' | 'restore';
    title: string;
    description: string;
    item?: ITrashItem;
  }>({
    isOpen: false,
    type: 'empty',
    title: '',
    description: '',
  });

  const fetchTrash = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('module', activeModule);
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/trash?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setItems(json.data || []);
        if (json.pagination) {
          setTotalCount(json.pagination.totalCount || 0);
          setTotalPages(json.pagination.totalPages || 1);
        }
        if (json.counts) {
          setCounts(json.counts);
        }
      }
    } catch (err) {
      console.error('Error fetching trash:', err);
    } finally {
      setLoading(false);
    }
  }, [activeModule, page, limit, searchQuery]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchTrash();
    }
  }, [user, fetchTrash]);

  const handleModuleChange = (mod: string) => {
    setActiveModule(mod);
    setPage(1);
    setSelectedIds([]);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTrash();
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const pageIds = items.map((i) => i._id);
  const allSelectedOnPage = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const handleSelectAllPage = () => {
    if (allSelectedOnPage) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  // Single Item Actions
  const handleSingleRestore = async (item: ITrashItem) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/trash/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: item.originalModule, id: item._id }),
      });
      if (res.ok) {
        setSelectedIds((prev) => prev.filter((id) => id !== item._id));
        fetchTrash();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('finance_updated'));
        }
      }
    } catch (e) {
      console.error('Error restoring record:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSinglePermanentDelete = async (item: ITrashItem) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/trash/permanent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: item.originalModule, id: item._id }),
      });
      if (res.ok) {
        setSelectedIds((prev) => prev.filter((id) => id !== item._id));
        fetchTrash();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('finance_updated'));
        }
      }
    } catch (e) {
      console.error('Error deleting record permanently:', e);
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Actions
  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    try {
      // Group selected IDs by their module
      const moduleMap: Record<string, string[]> = {};
      items
        .filter((it) => selectedIds.includes(it._id))
        .forEach((it) => {
          if (!moduleMap[it.originalModule]) moduleMap[it.originalModule] = [];
          moduleMap[it.originalModule].push(it._id);
        });

      for (const mod of Object.keys(moduleMap)) {
        await fetch('/api/trash/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ module: mod, ids: moduleMap[mod] }),
        });
      }

      setSelectedIds([]);
      fetchTrash();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('finance_updated'));
      }
    } catch (err) {
      console.error('Bulk restore error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkPermanentDelete = async () => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    try {
      const moduleMap: Record<string, string[]> = {};
      items
        .filter((it) => selectedIds.includes(it._id))
        .forEach((it) => {
          if (!moduleMap[it.originalModule]) moduleMap[it.originalModule] = [];
          moduleMap[it.originalModule].push(it._id);
        });

      for (const mod of Object.keys(moduleMap)) {
        await fetch('/api/trash/permanent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ module: mod, ids: moduleMap[mod] }),
        });
      }

      setSelectedIds([]);
      fetchTrash();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('finance_updated'));
      }
    } catch (err) {
      console.error('Bulk permanent delete error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEmptyTrash = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/trash/permanent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emptyAll: true }),
      });
      if (res.ok) {
        setSelectedIds([]);
        fetchTrash();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('finance_updated'));
        }
      }
    } catch (err) {
      console.error('Empty trash error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const getModuleBadge = (mod: string) => {
    switch (mod) {
      case 'transactions':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <ArrowLeftRight className="w-3 h-3 text-blue-600" />
            Transaction
          </span>
        );
      case 'udhaar':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <HandCoins className="w-3 h-3 text-emerald-600" />
            Udhaar
          </span>
        );
      case 'accounts':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Wallet className="w-3 h-3 text-purple-600" />
            Account
          </span>
        );
      case 'categories':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <Tag className="w-3 h-3 text-teal-600" />
            Category
          </span>
        );
      case 'budgets':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <PieChart className="w-3 h-3 text-amber-600" />
            Budget
          </span>
        );
      case 'savings':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200">
            <Target className="w-3 h-3 text-pink-600" />
            Savings Goal
          </span>
        );
      case 'loans':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <Coins className="w-3 h-3 text-orange-600" />
            Loan
          </span>
        );
      case 'recurring':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Repeat className="w-3 h-3 text-indigo-600" />
            Recurring
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {mod}
          </span>
        );
    }
  };

  const moduleTabs = [
    { id: 'all', label: 'All Items', count: counts.all },
    { id: 'transactions', label: 'Transactions', count: counts.transactions },
    { id: 'udhaar', label: 'Udhaar', count: counts.udhaar },
    { id: 'accounts', label: 'Accounts', count: counts.accounts },
    { id: 'categories', label: 'Categories', count: counts.categories },
    { id: 'budgets', label: 'Budgets', count: counts.budgets },
    { id: 'savings', label: 'Savings Goals', count: counts.savings },
    { id: 'loans', label: 'Loans', count: counts.loans },
    { id: 'recurring', label: 'Recurring', count: counts.recurring },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recycle Bin</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Safely restore soft-deleted items or permanently remove them from MongoDB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {counts.all > 0 && (
              <button
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    type: 'empty',
                    title: 'Empty Entire Recycle Bin',
                    description: `WARNING: This will permanently delete all ${counts.all} item(s) in your Recycle Bin across all modules. This action CANNOT be undone.`,
                  })
                }
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-sm active:scale-[0.98]"
              >
                <Trash2 className="w-4 h-4" />
                <span>Empty Recycle Bin</span>
              </button>
            )}
          </div>
        </div>

        {/* Module Filter Tabs & Search Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Scrollable Module Tabs */}
          <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-none px-4 pt-2">
            {moduleTabs.map((tab) => {
              const isActive = activeModule === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleModuleChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                    isActive
                      ? 'border-rose-600 text-rose-700 bg-rose-50/50'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100">
            <form onSubmit={handleSearch} className="flex-1 w-full sm:max-w-md relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search soft-deleted records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
              />
            </form>

            <div className="text-xs text-slate-500 font-medium">
              Total {totalCount} item(s) in this filter
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
                <p className="text-xs">Loading deleted items...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Trash2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">Recycle Bin is Empty</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                  When you delete transactions, accounts, categories, budgets, savings goals, or Udhaar records, they will safely appear here for restoration.
                </p>
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
                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-3">Record Name</th>
                    <th className="py-3 px-3">Module</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 px-3">Deleted Date</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const isSelected = selectedIds.includes(item._id);

                    return (
                      <tr
                        key={item._id}
                        className={`hover:bg-slate-50/80 transition ${
                          isSelected ? 'bg-rose-50/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(item._id)}
                            className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                          />
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900">{item.recordName}</div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate max-w-[200px]">
                            ID: {item._id}
                          </div>
                        </td>

                        <td className="py-3 px-3">{getModuleBadge(item.originalModule)}</td>

                        <td className="py-3 px-3 text-slate-600 capitalize">
                          {item.recordType || '—'}
                        </td>

                        <td className="py-3 px-3 text-right font-semibold text-slate-900">
                          {item.amount !== undefined
                            ? formatCurrency(item.amount, user?.preferredCurrency, user?.currencySymbol)
                            : '—'}
                        </td>

                        <td className="py-3 px-3 text-slate-500 text-xs">
                          {new Date(item.deletedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSingleRestore(item)}
                              title="Restore to Active"
                              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-xs transition border border-emerald-200"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore</span>
                            </button>

                            <button
                              onClick={() =>
                                setConfirmModal({
                                  isOpen: true,
                                  type: 'permanent',
                                  title: 'Permanently Delete Record',
                                  description: `Are you sure you want to permanently erase "${item.recordName}"? This action cannot be reversed.`,
                                  item,
                                })
                              }
                              title="Delete Permanently"
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

        {/* Bulk Action Bar in Trash mode */}
        <BulkActionBar
          selectedCount={selectedIds.length}
          totalPageCount={items.length}
          allSelectedOnPage={allSelectedOnPage}
          onSelectAllPage={handleSelectAllPage}
          onClearSelection={() => setSelectedIds([])}
          isTrashMode={true}
          onRestoreSelected={handleBulkRestore}
          onPermanentDeleteSelected={handleBulkPermanentDelete}
          onEmptyTrash={handleEmptyTrash}
        />

        {/* Confirmation Modal */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full flex-shrink-0 bg-rose-100 text-rose-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">{confirmModal.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{confirmModal.description}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setConfirmModal({ isOpen: false, type: 'empty', title: '', description: '' })}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={async () => {
                    if (confirmModal.type === 'empty') {
                      await handleEmptyTrash();
                    } else if (confirmModal.type === 'permanent' && confirmModal.item) {
                      await handleSinglePermanentDelete(confirmModal.item);
                    }
                    setConfirmModal({ isOpen: false, type: 'empty', title: '', description: '' });
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{confirmModal.type === 'empty' ? 'Empty Trash' : 'Delete Permanently'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

