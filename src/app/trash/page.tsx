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
          <span className="trash-module-badge trash-module-badge-blue">
            <ArrowLeftRight style={{ width: 12, height: 12 }} />
            Transaction
          </span>
        );
      case 'udhaar':
        return (
          <span className="trash-module-badge trash-module-badge-emerald">
            <HandCoins style={{ width: 12, height: 12 }} />
            Udhaar
          </span>
        );
      case 'accounts':
        return (
          <span className="trash-module-badge trash-module-badge-purple">
            <Wallet style={{ width: 12, height: 12 }} />
            Account
          </span>
        );
      case 'categories':
        return (
          <span className="trash-module-badge trash-module-badge-teal">
            <Tag style={{ width: 12, height: 12 }} />
            Category
          </span>
        );
      case 'budgets':
        return (
          <span className="trash-module-badge trash-module-badge-amber">
            <PieChart style={{ width: 12, height: 12 }} />
            Budget
          </span>
        );
      case 'savings':
        return (
          <span className="trash-module-badge trash-module-badge-pink">
            <Target style={{ width: 12, height: 12 }} />
            Savings Goal
          </span>
        );
      case 'loans':
        return (
          <span className="trash-module-badge trash-module-badge-orange">
            <Coins style={{ width: 12, height: 12 }} />
            Loan
          </span>
        );
      case 'recurring':
        return (
          <span className="trash-module-badge trash-module-badge-indigo">
            <Repeat style={{ width: 12, height: 12 }} />
            Recurring
          </span>
        );
      default:
        return (
          <span className="trash-module-badge trash-module-badge-slate">
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
      <div className="trash">
        {/* Header */}
        <div className="trash-header">
          <div className="trash-header-left">
            <div className="trash-header-icon">
              <Trash2 style={{ width: 24, height: 24 }} />
            </div>
            <div>
              <h1 className="trash-title">Recycle Bin</h1>
              <p className="trash-description">
                Safely restore soft-deleted items or permanently remove them from MongoDB
              </p>
            </div>
          </div>

          <div className="trash-actions">
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
                className="trash-btn-empty"
              >
                <Trash2 style={{ width: 16, height: 16 }} />
                <span>Empty Recycle Bin</span>
              </button>
            )}
          </div>
        </div>

        {/* Module Filter Tabs & Search Card */}
        <div className="trash-content">
          {/* Scrollable Module Tabs */}
          <div className="trash-tabs">
            {moduleTabs.map((tab) => {
              const isActive = activeModule === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleModuleChange(tab.id)}
                  className={`trash-tab-btn ${isActive ? 'trash-tab-btn-active' : ''}`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`trash-tab-badge ${isActive ? 'trash-tab-badge-active' : ''}`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="trash-toolbar">
            <form onSubmit={handleSearch} className="trash-search-form">
              <Search className="trash-search-icon" />
              <input
                type="text"
                placeholder="Search soft-deleted records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="trash-search-input"
              />
            </form>

            <div className="trash-count-text">
              Total {totalCount} item(s) in this filter
            </div>
          </div>

          {/* Table */}
          <div className="trash-table-container">
            {loading ? (
              <div style={{ padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: 8 }}>
                <Loader2 style={{ width: 32, height: 32, color: '#e11d48' }} className="animate-spin" />
                <p style={{ fontSize: 12 }}>Loading deleted items...</p>
              </div>
            ) : items.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
                <Trash2 style={{ width: 48, height: 48, color: '#cbd5e1', margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Recycle Bin is Empty</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
                  When you delete transactions, accounts, categories, budgets, savings goals, or Udhaar records, they will safely appear here for restoration.
                </p>
              </div>
            ) : (
              <table className="trash-table">
                <thead>
                  <tr>
                    <th className="trash-table-th" style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        checked={allSelectedOnPage}
                        onChange={handleSelectAllPage}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th className="trash-table-th">Record Name</th>
                    <th className="trash-table-th">Module</th>
                    <th className="trash-table-th">Type</th>
                    <th className="trash-table-th" style={{ textAlign: 'right' }}>Amount</th>
                    <th className="trash-table-th">Deleted Date</th>
                    <th className="trash-table-th" style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const isSelected = selectedIds.includes(item._id);

                    return (
                      <tr
                        key={item._id}
                        className={`trash-table-row ${isSelected ? 'trash-table-row-selected' : ''}`}
                      >
                        <td className="trash-table-td">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(item._id)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>

                        <td className="trash-table-td">
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.recordName}</div>
                          <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#94a3b8', marginTop: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            ID: {item._id}
                          </div>
                        </td>

                        <td className="trash-table-td">{getModuleBadge(item.originalModule)}</td>

                        <td className="trash-table-td" style={{ textTransform: 'capitalize', color: '#475569' }}>
                          {item.recordType || '—'}
                        </td>

                        <td className="trash-table-td" style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                          {item.amount !== undefined
                            ? formatCurrency(item.amount, user?.preferredCurrency, user?.currencySymbol)
                            : '—'}
                        </td>

                        <td className="trash-table-td" style={{ fontSize: 12, color: '#64748b' }}>
                          {new Date(item.deletedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        <td className="trash-table-td" style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <button
                              onClick={() => handleSingleRestore(item)}
                              title="Restore to Active"
                              className="trash-btn-restore"
                            >
                              <RotateCcw style={{ width: 14, height: 14 }} />
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
                              className="trash-btn-delete"
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
          <div className="trash-modal-backdrop">
            <div className="trash-modal">
              <div className="trash-modal-body">
                <div className="trash-modal-icon">
                  <AlertTriangle style={{ width: 24, height: 24 }} />
                </div>
                <div>
                  <h3 className="trash-modal-title">{confirmModal.title}</h3>
                  <p className="trash-modal-text">{confirmModal.description}</p>
                </div>
              </div>

              <div className="trash-modal-actions">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setConfirmModal({ isOpen: false, type: 'empty', title: '', description: '' })}
                  className="transaction-btn-cancel"
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
                  className="transaction-btn-danger"
                >
                  {actionLoading && <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />}
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

