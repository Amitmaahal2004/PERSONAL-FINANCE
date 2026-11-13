'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Users,
  UserCheck,
  UserX,
  Search,
  Trash2,
  Ban,
  CheckCircle,
  AlertTriangle,
  Lock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Actions
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<any | null>(null);

  // Security guard: Ensure only admin has access
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin') {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch(`/api/admin/users?page=${page}&status=${statusFilter}&search=${encodeURIComponent(search)}`),
      ]);

      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData);
      }

      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsersList(uData.users || []);
        setTotalPages(uData.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminData();
    }
  }, [user, page, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user?.role === 'admin') {
        setPage(1);
        fetchAdminData();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleToggleBan = async (targetUser: any) => {
    const isBanning = !targetUser.isBanned;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${targetUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isBanned: isBanning,
          banReason: isBanning ? banReason || 'Administrative suspension' : undefined,
        }),
      });

      if (res.ok) {
        setBanModalOpen(false);
        setBanReason('');
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update user ban state.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteConfirmUser(null);
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete user.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-xs text-slate-400">Verifying administrator permissions...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* HEADER */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold mb-2">
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span>Platform Super Admin</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            User Accounts & Security Oversight
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage registered accounts, view platform metrics, and suspend abusive users while upholding strict zero-knowledge financial privacy.
          </p>
        </div>

        {/* METRICS */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-subtle">
              <span className="text-xs font-semibold text-slate-400">Total Registered Users</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalUsers}</div>
              <span className="text-[11px] text-slate-400">Across platform</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-subtle">
              <span className="text-xs font-semibold text-slate-400">Active Accounts</span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.activeUsers}</div>
              <span className="text-[11px] text-emerald-600 font-semibold">Unrestricted</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-subtle">
              <span className="text-xs font-semibold text-slate-400">Suspended / Banned</span>
              <div className="text-2xl font-extrabold text-rose-600 mt-1">{stats.bannedUsers}</div>
              <span className="text-[11px] text-rose-600 font-semibold">Access revoked</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-subtle">
              <span className="text-xs font-semibold text-slate-400">Recent Signups (30d)</span>
              <div className="text-2xl font-extrabold text-blue-600 mt-1">{stats.recentSignups}</div>
              <span className="text-[11px] text-slate-400">New memberships</span>
            </div>
          </div>
        )}

        {/* PRIVACY NOTICE CARD */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Privacy Policy Enforced:</strong> User financial transactions, accounts, and private notes are cryptographically shielded and never displayed in the Super Admin panel.
            </span>
          </div>
        </div>

        {/* USER LIST TOOLBAR */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Filter */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
              >
                All Users
              </button>
              <button
                onClick={() => {
                  setStatusFilter('active');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition ${statusFilter === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
              >
                Active Only
              </button>
              <button
                onClick={() => {
                  setStatusFilter('banned');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg transition ${statusFilter === 'banned' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
              >
                Banned Only
              </button>
            </div>
          </div>

          {/* TABLE */}
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading user registry...</div>
          ) : usersList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No users match the search criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="pb-3">User</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Email Verified</th>
                    <th className="pb-3">Registered On</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/80">
                      <td className="py-3">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-slate-400 text-[11px]">{u.email}</div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${u.isBanned ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                            }`}
                        >
                          {u.isBanned ? 'BANNED' : 'ACTIVE'}
                        </span>
                        {u.banReason && (
                          <span className="block text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px]">
                            {u.banReason}
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={u.isEmailVerified ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                          {u.isEmailVerified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                      <td className="py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              if (u.isBanned) {
                                handleToggleBan(u);
                              } else {
                                setBanModalOpen(true);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${u.isBanned
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                              }`}
                          >
                            {u.isBanned ? 'Unban' : 'Ban User'}
                          </button>

                          <button
                            onClick={() => setDeleteConfirmUser(u)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                            title="Delete User and Financial Data"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 disabled:opacity-40 font-semibold"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 disabled:opacity-40 font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BAN USER MODAL */}
      {banModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Ban className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-900 text-base">Ban Account: {selectedUser.name}</h3>
              <p className="text-xs text-slate-500 mt-1">
                The user will be immediately logged out and prohibited from logging in or accessing financial endpoints.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Suspension</label>
              <input
                type="text"
                placeholder="e.g. Violation of terms, account misuse"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setBanModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleToggleBan(selectedUser)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-md"
              >
                {actionLoading ? 'Banning...' : 'Confirm Ban'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Permanently Delete User?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              This will permanently purge <strong>{deleteConfirmUser.name}</strong> and all associated accounts, transactions, and budgets in accordance with the data retention policy.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirmUser._id)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md"
              >
                {actionLoading ? 'Deleting...' : 'Permanent Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

