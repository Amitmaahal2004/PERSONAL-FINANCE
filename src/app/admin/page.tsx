'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Users,
  Search,
  Trash2,
  Ban,
  CheckCircle,
  AlertTriangle,
  Lock,
  Palette,
  RotateCcw,
  Save,
  Eye,
  Sparkles,
  TrendingUp,
  CreditCard,
  PieChart,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useGlobalTheme } from '@/context/ThemeContext';
import { formatDate } from '@/lib/utils';

const HEX_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

const PRESET_PALETTES = [
  { name: 'Default Emerald', primary: '#10B981', secondary: '#0F766E' },
  { name: 'Sapphire Blue', primary: '#2563EB', secondary: '#1E40AF' },
  { name: 'Royal Indigo', primary: '#6366F1', secondary: '#4338CA' },
  { name: 'Violet Purple', primary: '#8B5CF6', secondary: '#6D28D9' },
  { name: 'Sunset Amber', primary: '#F59E0B', secondary: '#D97706' },
  { name: 'Crimson Rose', primary: '#F43F5E', secondary: '#BE123C' },
  { name: 'Oceanic Teal', primary: '#14B8A6', secondary: '#0D9488' },
  { name: 'Slate Charcoal', primary: '#0F172A', secondary: '#334155' },
];

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { theme, previewTheme, setPreviewTheme, applyPreview, saveTheme, resetTheme } = useGlobalTheme();

  // Active admin tab
  const [activeAdminTab, setActiveAdminTab] = useState<'users' | 'theme'>('users');

  // Theme settings local state
  const [primaryInput, setPrimaryInput] = useState(theme.primaryColor || '#10B981');
  const [secondaryInput, setSecondaryInput] = useState(theme.secondaryColor || '#0F766E');
  const [themeStatusMessage, setThemeStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [savingTheme, setSavingTheme] = useState(false);

  // User management state
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

  // Sync theme inputs when theme context updates
  useEffect(() => {
    if (theme.primaryColor) setPrimaryInput(theme.primaryColor);
    if (theme.secondaryColor) setSecondaryInput(theme.secondaryColor);
  }, [theme]);

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
    if (user?.role === 'admin' && activeAdminTab === 'users') {
      fetchAdminData();
    }
  }, [user, page, statusFilter, activeAdminTab]);

  // Debounced search
  useEffect(() => {
    if (activeAdminTab !== 'users') return;
    const timer = setTimeout(() => {
      if (user?.role === 'admin') {
        setPage(1);
        fetchAdminData();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Color change handlers
  const handlePrimaryChange = (val: string) => {
    const clean = val.startsWith('#') ? val : `#${val}`;
    setPrimaryInput(clean);
    if (HEX_REGEX.test(clean)) {
      setPreviewTheme({ primaryColor: clean });
    }
  };

  const handleSecondaryChange = (val: string) => {
    const clean = val.startsWith('#') ? val : `#${val}`;
    setSecondaryInput(clean);
    if (HEX_REGEX.test(clean)) {
      setPreviewTheme({ secondaryColor: clean });
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_PALETTES[0]) => {
    setPrimaryInput(preset.primary);
    setSecondaryInput(preset.secondary);
    setPreviewTheme({ primaryColor: preset.primary, secondaryColor: preset.secondary });
    setThemeStatusMessage({
      type: 'info',
      text: `Loaded preset: "${preset.name}". Click "Apply Preview" to test or "Save Theme" to persist.`,
    });
  };

  const handleApplyPreview = () => {
    if (!HEX_REGEX.test(primaryInput)) {
      setThemeStatusMessage({ type: 'error', text: 'Invalid Primary HEX color. Format must be #RRGGBB or #RGB.' });
      return;
    }
    if (!HEX_REGEX.test(secondaryInput)) {
      setThemeStatusMessage({ type: 'error', text: 'Invalid Secondary HEX color. Format must be #RRGGBB or #RGB.' });
      return;
    }
    applyPreview();
    setThemeStatusMessage({
      type: 'success',
      text: 'Preview active on current page! CSS custom properties updated.',
    });
  };

  const handleSaveTheme = async () => {
    if (!HEX_REGEX.test(primaryInput)) {
      setThemeStatusMessage({ type: 'error', text: 'Invalid Primary HEX color. Format must be #RRGGBB or #RGB.' });
      return;
    }
    if (!HEX_REGEX.test(secondaryInput)) {
      setThemeStatusMessage({ type: 'error', text: 'Invalid Secondary HEX color. Format must be #RRGGBB or #RGB.' });
      return;
    }

    setSavingTheme(true);
    setThemeStatusMessage(null);

    const res = await saveTheme({
      primaryColor: primaryInput.toUpperCase(),
      secondaryColor: secondaryInput.toUpperCase(),
    });

    setSavingTheme(false);
    if (res.success) {
      setThemeStatusMessage({
        type: 'success',
        text: 'Global theme saved successfully! Stored in database and applied to all users.',
      });
    } else {
      setThemeStatusMessage({
        type: 'error',
        text: res.error || 'Failed to save global theme to database.',
      });
    }
  };

  const handleResetTheme = async () => {
    if (!confirm('Are you sure you want to reset the platform theme to the default emerald green & teal branding?')) {
      return;
    }
    setSavingTheme(true);
    const res = await resetTheme();
    setSavingTheme(false);
    if (res.success) {
      setPrimaryInput('#10B981');
      setSecondaryInput('#0F766E');
      setThemeStatusMessage({
        type: 'success',
        text: 'Theme reset to default Emerald (#10B981) and Teal (#0F766E).',
      });
    } else {
      setThemeStatusMessage({
        type: 'error',
        text: res.error || 'Failed to reset theme.',
      });
    }
  };

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
      <div className="py-6 space-y-6">
        {/* TOP ADMIN HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold mb-2">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>Platform Super Admin</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Administration & Visual Architecture
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage platform users, monitor registrations, and customize global theme tokens with zero-flash database persistence.
            </p>
          </div>

          {/* ADMIN NAVIGATION TABS */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-semibold self-start sm:self-auto shadow-xs">
            <button
              onClick={() => setActiveAdminTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
                activeAdminTab === 'users'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Registry</span>
            </button>
            <button
              onClick={() => setActiveAdminTab('theme')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
                activeAdminTab === 'theme'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Appearance & Theme</span>
            </button>
          </div>
        </div>

        {/* TAB 1: APPEARANCE & THEME SETTINGS */}
        {activeAdminTab === 'theme' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Theme status alert */}
            {themeStatusMessage && (
              <div
                className={`p-4 rounded-2xl flex items-center justify-between text-xs font-medium border ${
                  themeStatusMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : themeStatusMessage.type === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {themeStatusMessage.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />}
                  {themeStatusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                  {themeStatusMessage.type === 'info' && <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />}
                  <span>{themeStatusMessage.text}</span>
                </div>
                <button
                  onClick={() => setThemeStatusMessage(null)}
                  className="text-[11px] underline font-semibold hover:opacity-75"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Platform branding banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-subtle">
              <div className="flex items-center gap-3.5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: primaryInput }}
                >
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    Dynamic Design Token Engine
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Colors configured here are written to MongoDB and loaded into CSS variables (<code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">--color-primary</code> & <code className="bg-slate-800 px-1 py-0.5 rounded text-teal-300">--color-secondary</code>) on server render with zero FOUC flash.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="text-xs text-slate-300">Active Theme:</span>
                <span className="font-mono text-xs font-bold uppercase bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                  {theme.primaryColor || '#10B981'} / {theme.secondaryColor || '#0F766E'}
                </span>
              </div>
            </div>

            {/* TWO-COLUMN CONTROLS & PREVIEW */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT COLUMN: PALETTE CONTROLS */}
              <div className="lg:col-span-6 space-y-6">
                {/* PRIMARY COLOR CARD */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Primary Brand Accent</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Applied to main buttons, active nav tabs, KPI highlights, and primary focus rings.
                      </p>
                    </div>
                    <div
                      className="w-6 h-6 rounded-full border border-slate-200 shadow-xs"
                      style={{ backgroundColor: primaryInput }}
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    {/* Color Swatch & Native Picker */}
                    <div
                      className="relative w-14 h-12 rounded-xl border-2 border-slate-200 overflow-hidden cursor-pointer shadow-xs transition hover:scale-105 shrink-0"
                      style={{ backgroundColor: primaryInput }}
                    >
                      <input
                        type="color"
                        value={HEX_REGEX.test(primaryInput) ? primaryInput : '#10B981'}
                        onChange={(e) => handlePrimaryChange(e.target.value)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        title="Pick a color"
                      />
                    </div>

                    {/* HEX Input */}
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        HEX Code
                      </label>
                      <input
                        type="text"
                        maxLength={7}
                        value={primaryInput}
                        onChange={(e) => handlePrimaryChange(e.target.value)}
                        placeholder="#10B981"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase tracking-wider focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* SECONDARY COLOR CARD */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Secondary Brand Accent</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Applied to subtle gradient backgrounds, secondary chips, badges, and accents.
                      </p>
                    </div>
                    <div
                      className="w-6 h-6 rounded-full border border-slate-200 shadow-xs"
                      style={{ backgroundColor: secondaryInput }}
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    {/* Color Swatch & Native Picker */}
                    <div
                      className="relative w-14 h-12 rounded-xl border-2 border-slate-200 overflow-hidden cursor-pointer shadow-xs transition hover:scale-105 shrink-0"
                      style={{ backgroundColor: secondaryInput }}
                    >
                      <input
                        type="color"
                        value={HEX_REGEX.test(secondaryInput) ? secondaryInput : '#0F766E'}
                        onChange={(e) => handleSecondaryChange(e.target.value)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        title="Pick a color"
                      />
                    </div>

                    {/* HEX Input */}
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        HEX Code
                      </label>
                      <input
                        type="text"
                        maxLength={7}
                        value={secondaryInput}
                        onChange={(e) => handleSecondaryChange(e.target.value)}
                        placeholder="#0F766E"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase tracking-wider focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* PRESET PALETTES */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-5 sm:p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-sm">Curated Finance Palettes</h4>
                    <span className="text-[11px] text-slate-400 font-medium">Click to load</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {PRESET_PALETTES.map((preset) => {
                      const isCurrent =
                        primaryInput.toUpperCase() === preset.primary.toUpperCase() &&
                        secondaryInput.toUpperCase() === preset.secondary.toUpperCase();
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`p-2.5 rounded-2xl border text-left transition flex flex-col gap-2 ${
                            isCurrent
                              ? 'border-slate-900 bg-slate-50 shadow-sm ring-1 ring-slate-900'
                              : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: preset.primary }}
                            />
                            <span
                              className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: preset.secondary }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-800 truncate leading-none">
                            {preset.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleApplyPreview}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Eye className="w-4 h-4 text-slate-500" />
                    <span>Apply Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveTheme}
                    disabled={savingTheme}
                    className="flex-1 py-3 px-5 rounded-xl text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 active:scale-95"
                    style={{ backgroundColor: primaryInput }}
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingTheme ? 'Saving...' : 'Save Theme'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetTheme}
                    disabled={savingTheme}
                    className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95"
                    title="Reset to default Emerald theme"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: LIVE INTERACTIVE COMPONENT PREVIEW */}
              <div className="lg:col-span-6">
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-5 sm:p-6 space-y-6 sticky top-24">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Live Component Preview</h4>
                      <p className="text-[11px] text-slate-400">
                        Interactive preview styled in real-time with selected colors.
                      </p>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${primaryInput}18`,
                        color: primaryInput,
                      }}
                    >
                      Live Rendering
                    </span>
                  </div>

                  {/* SIMULATED APP HEADER */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${primaryInput}, ${secondaryInput})`,
                        }}
                      >
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-extrabold text-xs text-slate-900">MyFinance App</span>
                        <span
                          className="block text-[9px] font-bold uppercase tracking-wider"
                          style={{ color: primaryInput }}
                        >
                          Personal Workspace
                        </span>
                      </div>
                    </div>

                    <div
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold border"
                      style={{
                        backgroundColor: `${primaryInput}12`,
                        color: primaryInput,
                        borderColor: `${primaryInput}35`,
                      }}
                    >
                      ₹ 1,48,250.00
                    </div>
                  </div>

                  {/* SIMULATED KPI STAT CARD */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-500">Monthly Net</span>
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <div className="text-lg font-black" style={{ color: primaryInput }}>
                        +₹ 42,800
                      </div>
                      <span className="text-[10px] text-emerald-600 font-semibold">+18.4% vs last mo</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-500">Budget Spent</span>
                        <PieChart className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <div className="text-lg font-black text-slate-800">
                        ₹ 24,190
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden mt-1">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: '64%', backgroundColor: primaryInput }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* BUTTONS DEMO */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Buttons & Controls
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs transition"
                        style={{ backgroundColor: primaryInput }}
                      >
                        Primary Action
                      </button>

                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs transition"
                        style={{ backgroundColor: secondaryInput }}
                      >
                        Secondary Action
                      </button>

                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl text-xs font-bold border transition"
                        style={{
                          borderColor: `${primaryInput}50`,
                          color: primaryInput,
                          backgroundColor: `${primaryInput}08`,
                        }}
                      >
                        Outline Button
                      </button>
                    </div>
                  </div>

                  {/* BADGES & CHIPS DEMO */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Badges & Status Chips
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                        style={{
                          backgroundColor: `${primaryInput}18`,
                          color: primaryInput,
                        }}
                      >
                        Active Account
                      </span>
                      <span
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                        style={{
                          backgroundColor: `${secondaryInput}18`,
                          color: secondaryInput,
                        }}
                      >
                        Secondary Tag
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        Neutral Tag
                      </span>
                    </div>
                  </div>

                  {/* INTERACTIVE INPUT DEMO */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Focus Ring Demo
                    </label>
                    <input
                      type="text"
                      defaultValue="Dynamic focus ring preview..."
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 transition"
                      style={{
                        outlineColor: primaryInput,
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = primaryInput;
                        e.target.style.boxShadow = `0 0 0 3px ${primaryInput}35`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER REGISTRY & SECURITY */}
        {activeAdminTab === 'users' && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
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
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                {/* Filter */}
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    All Users
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('active');
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      statusFilter === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    Active Only
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('banned');
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      statusFilter === 'banned' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
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
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                u.isBanned ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
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
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                                  u.isBanned
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
        )}
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
