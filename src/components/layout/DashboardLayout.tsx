'use client';

import React, { useState, useEffect } from 'react';
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
  TrendingUp,
  Trash2,
  Coins,
  Bell,
  Crown,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import GlobalSearchModal from '@/components/common/GlobalSearchModal';
import QuickAddModal from '@/components/common/QuickAddModal';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: number;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [trashCount, setTrashCount] = useState<number>(0);

  useEffect(() => {
    const fetchTrashCount = async () => {
      try {
        const res = await fetch('/api/trash?limit=1');
        if (res.ok) {
          const data = await res.json();
          setTrashCount(data?.counts?.all || 0);
        }
      } catch (err) {
        // silent
      }
    };
    fetchTrashCount();

    const handleUpdate = () => fetchTrashCount();
    window.addEventListener('finance_updated', handleUpdate);
    return () => window.removeEventListener('finance_updated', handleUpdate);
  }, [pathname]);

  const financeNavItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
    { name: 'Udhaar Management', href: '/udhaar', icon: HandCoins },
    { name: 'Accounts', href: '/accounts', icon: Wallet },
    { name: 'Categories', href: '/categories', icon: Tag },
    { name: 'Budgets', href: '/budgets', icon: PieChart },
    { name: 'Savings Goals', href: '/savings', icon: Target },
    { name: 'Loans & Borrowing', href: '/loans', icon: Coins },
    { name: 'Recurring Payments', href: '/recurring', icon: Repeat },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Recycle Bin', href: '/trash', icon: Trash2, badge: trashCount > 0 ? trashCount : undefined },
  ];

  const settingsNavItems: NavItem[] = [
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  if (user?.role === 'admin') {
    settingsNavItems.push({ name: 'Admin Panel', href: '/admin', icon: Shield });
  }

  const allNavItems = [...financeNavItems, ...settingsNavItems];

  const mobileBottomItems = [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Ledger', href: '/transactions', icon: ArrowLeftRight },
    { name: 'Add', href: '#', icon: Plus, isAdd: true },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'More', href: '#', icon: Menu, isMore: true },
  ];

  return (
    <div className="app">
      {/* DESKTOP SIDEBAR */}
      <aside className="sidebar">
        {/* Brand Header */}
        <div className="sidebar-header">
          <Link href="/dashboard" className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-name">MyFinance</span>
              <span className="sidebar-brand-tag">PRIVATE & SECURE</span>
            </div>
          </Link>
        </div>

        {/* Navigation items */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-group">
            {financeNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-nav-link ${isActive ? 'sidebar-nav-link-active' : ''}`}
                >
                  <Icon className="sidebar-nav-icon" />
                  <span className="sidebar-nav-text">{item.name}</span>
                  {item.badge !== undefined && (
                    <span className="sidebar-nav-badge sidebar-nav-badge-alert">{item.badge}</span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Settings Section */}
          <div className="sidebar-section-title">SETTINGS</div>
          <div className="sidebar-nav-group">
            {settingsNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-nav-link ${isActive ? 'sidebar-nav-link-active' : ''}`}
                >
                  <Icon className="sidebar-nav-icon" />
                  <span className="sidebar-nav-text">{item.name}</span>
                  {item.name === 'Admin Panel' && (
                    <span className="sidebar-nav-badge sidebar-nav-badge-admin">ADMIN</span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Decorative Promo Card */}
          <div className="sidebar-promo">
            <div className="sidebar-promo-icon">
              <Crown className="w-5 h-5 text-amber-300" />
            </div>
            <div className="sidebar-promo-title">
              Keep Your Finances Organized & Secure
            </div>
            <div className="sidebar-promo-wave" aria-hidden="true">
              <svg viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 25 C40 10, 80 35, 120 18 C140 10, 150 15, 160 12 L160 40 L0 40 Z" fill="rgba(16, 185, 129, 0.25)" />
                <path d="M0 32 C50 20, 90 38, 130 25 C145 20, 155 24, 160 22 L160 40 L0 40 Z" fill="rgba(56, 189, 248, 0.2)" />
              </svg>
            </div>
          </div>
        </nav>

        {/* User Mini Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <Link href="/profile" className="sidebar-user-link">
              <div className="sidebar-user-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user?.name || 'Super Administrator'}</div>
                <div className="sidebar-user-email">{user?.email || 'admin@myfinance.app'}</div>
              </div>
            </Link>
            <button
              onClick={() => logout()}
              title="Logout"
              className="sidebar-logout-btn"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN APPLICATION CONTENT */}
      <div className="app-content">
        {/* DESKTOP HEADER */}
        <header className="header">
          <div className="header-inner-container">
            {/* Global Search Bar */}
            <button
              onClick={() => setSearchOpen(true)}
              className="header-search-btn"
            >
              <Search className="w-4 h-4 shrink-0" />
              <span className="header-search-text">Search transactions, tags, accounts...</span>
              <kbd className="header-search-kbd">Ctrl K</kbd>
            </button>

            {/* Right Header items */}
            <div className="header-actions">
              <Link href="/profile" className="header-currency" title="Change preferred currency">
                <span>Currency:</span>
                <strong>{user?.preferredCurrency || 'INR'} ({user?.currencySymbol || '₹'})</strong>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </Link>

              <button
                type="button"
                className="header-notification-btn"
                title="Notifications"
                aria-label="Notifications"
                onClick={() => {}}
              >
                <Bell className="w-4 h-4" />
                <span className="header-notification-dot" />
              </button>

              <Link href="/profile" className="header-profile-link" title="My Profile">
                <div className="header-profile-avatar">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* MOBILE HEADER */}
        <header className="mobile-header">
          <Link href="/dashboard" className="mobile-header-logo">
            <div className="mobile-header-logo-icon">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="mobile-header-brand-name">MyFinance</span>
          </Link>

          <div className="mobile-header-actions">
            <button
              onClick={() => setSearchOpen(true)}
              className="mobile-header-search-btn"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
            <Link href="/profile" className="header-profile-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Link>
          </div>
        </header>

        {/* MAIN VIEWPORT WITH 1440PX MAXIMUM CONTAINER */}
        <main className="main">
          <div className="main-container">
            {children}
          </div>
        </main>

        {/* MOBILE BOTTOM NAVIGATION */}
        <div className="mobile-bottom-nav">
          {mobileBottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            if (item.isAdd) {
              return (
                <button
                  key="add-btn"
                  onClick={() => setQuickAddOpen(true)}
                  className="mobile-nav-add-btn"
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
                  className="mobile-nav-item"
                >
                  <Icon className="w-5 h-5" />
                  <span>More</span>
                </button>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`mobile-nav-item ${isActive ? 'mobile-nav-item-active' : ''}`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* MOBILE "MORE" DRAWER */}
        {mobileDrawerOpen && (
          <div className="mobile-drawer-backdrop" onClick={() => setMobileDrawerOpen(false)}>
            <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-drawer-header">
                <span className="mobile-drawer-title">All Modules</span>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="mobile-drawer-close-btn"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mobile-drawer-grid">
                {allNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className="mobile-drawer-link"
                    >
                      <div className="mobile-drawer-link-content">
                        <Icon className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className="sidebar-nav-badge sidebar-nav-badge-alert">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              <div className="mobile-drawer-footer">
                <div>
                  Signed in as <strong>{user?.name}</strong>
                </div>
                <button
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    logout();
                  }}
                  className="mobile-drawer-logout-btn"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
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
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('finance_updated'));
          }
        }}
      />
    </div>
  );
}
