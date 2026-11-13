'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tag,
  PieChart,
  Target,
  HandCoins,
  Repeat,
  Calendar,
  BarChart3,
  Settings,
  User,
  Shield,
  Search,
  Plus,
  Menu,
  X,
  LogOut,
  ChevronRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import GlobalSearchModal from '@/components/common/GlobalSearchModal';
import QuickAddModal from '@/components/common/QuickAddModal';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const mainNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
    { name: 'Accounts', href: '/accounts', icon: Wallet },
    { name: 'Categories', href: '/categories', icon: Tag },
    { name: 'Budgets', href: '/budgets', icon: PieChart },
    { name: 'Savings Goals', href: '/savings', icon: Target },
    { name: 'Loans & Borrowing', href: '/loans', icon: HandCoins },
    { name: 'Recurring Payments', href: '/recurring', icon: Repeat },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  // Super Admin section
  if (user?.role === 'admin') {
    mainNavItems.push({ name: 'Admin Panel', href: '/admin', icon: Shield });
  }

  const mobileBottomItems = [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Ledger', href: '/transactions', icon: ArrowLeftRight },
    { name: 'Add', href: '#', icon: Plus, isAdd: true },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'More', href: '#', icon: Menu, isMore: true },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col md:flex-row">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 shrink-0 h-screen sticky top-0 z-30 select-none">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">MyFinance</span>
              <span className="block text-[10px] font-semibold text-emerald-600 uppercase tracking-widest leading-none">
                Private & Secure
              </span>
            </div>
          </Link>
        </div>

        {/* Quick Add Button in Sidebar */}
        <div className="p-4 pb-2">
          <button
            onClick={() => setQuickAddOpen(true)}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Transaction</span>
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}
                />
                <span>{item.name}</span>
                {item.name === 'Admin Panel' && (
                  <span className="ml-auto text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                    ADMIN
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Mini Footer */}
        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
            <Link href="/profile" className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="truncate text-left">
                <div className="text-xs font-semibold text-slate-800 truncate">{user?.name || 'User'}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
              </div>
            </Link>
            <button
              onClick={() => logout()}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* DESKTOP TOP HEADER */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200/80 items-center justify-between px-8 sticky top-0 z-20">
          {/* Global Search Bar */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-3 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-xl text-xs transition w-72"
          >
            <Search className="w-4 h-4" />
            <span className="truncate">Search transactions, tags, accounts...</span>
            <kbd className="ml-auto text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 font-semibold text-slate-500">
              Ctrl K
            </kbd>
          </button>

          {/* Right Header items */}
          <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-100 flex items-center gap-1.5">
              <span>Currency:</span>
              <span className="font-bold">{user?.preferredCurrency || 'INR'} ({user?.currencySymbol || '₹'})</span>
            </div>

            <Link
              href="/profile"
              className="flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-emerald-700 transition"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="font-semibold">{user?.name}</span>
            </Link>
          </div>
        </header>

        {/* MOBILE TOP BAR */}
        <header className="md:hidden h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-30">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="font-bold text-base text-slate-900">MyFinance</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <Link
              href="/profile"
              className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs"
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Link>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 pb-24 md:pb-12 overflow-x-hidden">
          {children}
        </main>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 flex items-center justify-around z-40">
          {mobileBottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            if (item.isAdd) {
              return (
                <button
                  key="add-btn"
                  onClick={() => setQuickAddOpen(true)}
                  className="w-12 h-12 -mt-5 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center active:scale-95 transition"
                  aria-label="Add Transaction"
                >
                  <Plus className="w-6 h-6 stroke-[2.5]" />
                </button>
              );
            }

            if (item.isMore) {
              return (
                <button
                  key="more-btn"
                  onClick={() => setMobileDrawerOpen(true)}
                  className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-900 transition"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">More</span>
                </button>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center gap-1 transition ${
                  isActive ? 'text-emerald-700 font-semibold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : ''}`} />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* MOBILE "MORE" DRAWER */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-sm md:hidden animate-fadeIn">
            <div className="w-full bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-base">All Modules</span>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {mainNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-medium transition border border-slate-100"
                    >
                      <Icon className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Signed in as <span className="font-semibold text-slate-800">{user?.name}</span>
                </div>
                <button
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSuccess={() => {
          // If on transactions or dashboard, dispatch event or reload data
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('finance_updated'));
          }
        }}
      />
    </div>
  );
}

