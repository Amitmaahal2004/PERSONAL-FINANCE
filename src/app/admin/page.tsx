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
        <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
          Verifying administrator permissions...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="admin">
        {/* TOP ADMIN HEADER */}
        <div className="admin-header">
          <div className="admin-header-main">
            <div className="admin-badge">
              <Shield style={{ width: 14, height: 14 }} />
              <span>Platform Super Admin</span>
            </div>
            <h1 className="admin-title">Administration & Visual Architecture</h1>
            <p className="admin-description">
              Manage platform users, monitor registrations, and customize global theme tokens with zero-flash database persistence.
            </p>
          </div>

          {/* ADMIN NAVIGATION TABS */}
          <div className="admin-tabs">
            <button
              onClick={() => setActiveAdminTab('users')}
              className={`admin-tab-btn ${activeAdminTab === 'users' ? 'admin-tab-btn-active' : ''}`}
            >
              <Users style={{ width: 16, height: 16 }} />
              <span>User Registry</span>
            </button>
            <button
              onClick={() => setActiveAdminTab('theme')}
              className={`admin-tab-btn ${activeAdminTab === 'theme' ? 'admin-tab-btn-active' : ''}`}
            >
              <Palette style={{ width: 16, height: 16 }} />
              <span>Appearance & Theme</span>
            </button>
          </div>
        </div>

        {/* TAB 1: APPEARANCE & THEME SETTINGS */}
        {activeAdminTab === 'theme' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Theme status alert */}
            {themeStatusMessage && (
              <div className={`admin-alert admin-alert-${themeStatusMessage.type}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {themeStatusMessage.type === 'success' && <CheckCircle style={{ width: 16, height: 16 }} />}
                  {themeStatusMessage.type === 'error' && <AlertTriangle style={{ width: 16, height: 16 }} />}
                  {themeStatusMessage.type === 'info' && <Sparkles style={{ width: 16, height: 16 }} />}
                  <span>{themeStatusMessage.text}</span>
                </div>
                <button
                  onClick={() => setThemeStatusMessage(null)}
                  className="admin-alert-dismiss"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Platform branding banner */}
            <div className="admin-banner">
              <div className="admin-banner-info">
                <div
                  className="admin-banner-icon"
                  style={{ backgroundColor: primaryInput }}
                >
                  <Sparkles style={{ width: 24, height: 24 }} />
                </div>
                <div>
                  <h3 className="admin-banner-title">Dynamic Design Token Engine</h3>
                  <p className="admin-banner-description">
                    Colors configured here are written to MongoDB and loaded into CSS variables (<code>--color-primary</code> & <code>--color-secondary</code>) on server render with zero FOUC flash.
                  </p>
                </div>
              </div>
              <div className="admin-banner-badge">
                <span>Active Theme:</span>
                <span>{theme.primaryColor || '#10B981'} / {theme.secondaryColor || '#0F766E'}</span>
              </div>
            </div>

            {/* TWO-COLUMN CONTROLS & PREVIEW */}
            <div className="theme-settings-grid">
              {/* LEFT COLUMN: PALETTE CONTROLS */}
              <div className="theme-controls-column">
                {/* PRIMARY COLOR CARD */}
                <div className="theme-picker-card">
                  <div className="theme-picker-header">
                    <div>
                      <h4 className="theme-picker-title">Primary Brand Accent</h4>
                      <p className="theme-picker-description">
                        Applied to main buttons, active nav tabs, KPI highlights, and primary focus rings.
                      </p>
                    </div>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: '1px solid #e2e8f0',
                        backgroundColor: primaryInput,
                      }}
                    />
                  </div>

                  <div className="theme-color-row">
                    <div className="theme-color-swatch" style={{ backgroundColor: primaryInput }}>
                      <input
                        type="color"
                        value={HEX_REGEX.test(primaryInput) ? primaryInput : '#10B981'}
                        onChange={(e) => handlePrimaryChange(e.target.value)}
                        title="Pick a color"
                      />
                    </div>
                    <div className="theme-hex-container">
                      <label className="theme-hex-label">HEX Code</label>
                      <input
                        type="text"
                        maxLength={7}
                        value={primaryInput}
                        onChange={(e) => handlePrimaryChange(e.target.value)}
                        placeholder="#10B981"
                        className="theme-hex-input"
                      />
                    </div>
                  </div>
                </div>

                {/* SECONDARY COLOR CARD */}
                <div className="theme-picker-card">
                  <div className="theme-picker-header">
                    <div>
                      <h4 className="theme-picker-title">Secondary Brand Accent</h4>
                      <p className="theme-picker-description">
                        Applied to subtle gradient backgrounds, secondary chips, badges, and accents.
                      </p>
                    </div>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: '1px solid #e2e8f0',
                        backgroundColor: secondaryInput,
                      }}
                    />
                  </div>

                  <div className="theme-color-row">
                    <div className="theme-color-swatch" style={{ backgroundColor: secondaryInput }}>
                      <input
                        type="color"
                        value={HEX_REGEX.test(secondaryInput) ? secondaryInput : '#0F766E'}
                        onChange={(e) => handleSecondaryChange(e.target.value)}
                        title="Pick a color"
                      />
                    </div>
                    <div className="theme-hex-container">
                      <label className="theme-hex-label">HEX Code</label>
                      <input
                        type="text"
                        maxLength={7}
                        value={secondaryInput}
                        onChange={(e) => handleSecondaryChange(e.target.value)}
                        placeholder="#0F766E"
                        className="theme-hex-input"
                      />
                    </div>
                  </div>
                </div>

                {/* PRESET PALETTES */}
                <div className="theme-picker-card">
                  <div className="theme-picker-header">
                    <h4 className="theme-picker-title">Curated Finance Palettes</h4>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>Click to load</span>
                  </div>

                  <div className="theme-palettes-grid">
                    {PRESET_PALETTES.map((preset) => {
                      const isCurrent =
                        primaryInput.toUpperCase() === preset.primary.toUpperCase() &&
                        secondaryInput.toUpperCase() === preset.secondary.toUpperCase();
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`theme-palette-card ${isCurrent ? 'theme-palette-card-active' : ''}`}
                        >
                          <div className="theme-palette-dots">
                            <span
                              className="theme-palette-dot"
                              style={{ backgroundColor: preset.primary }}
                            />
                            <span
                              className="theme-palette-dot"
                              style={{ backgroundColor: preset.secondary }}
                            />
                          </div>
                          <span className="theme-palette-name">{preset.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="theme-actions">
                  <button
                    type="button"
                    onClick={handleApplyPreview}
                    className="theme-btn-preview"
                  >
                    <Eye style={{ width: 16, height: 16 }} />
                    <span>Apply Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveTheme}
                    disabled={savingTheme}
                    className="theme-btn-save"
                    style={{ backgroundColor: primaryInput }}
                  >
                    <Save style={{ width: 16, height: 16 }} />
                    <span>{savingTheme ? 'Saving...' : 'Save Theme'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetTheme}
                    disabled={savingTheme}
                    className="theme-btn-reset"
                    title="Reset to default Emerald theme"
                  >
                    <RotateCcw style={{ width: 16, height: 16 }} />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: LIVE INTERACTIVE COMPONENT PREVIEW */}
              <div className="theme-preview-column">
                <div className="theme-preview-card" style={{ position: 'sticky', top: 96 }}>
                  <div className="theme-preview-header">
                    <div>
                      <h4 className="theme-picker-title">Live Component Preview</h4>
                      <p className="theme-picker-description">Interactive preview styled in real-time with selected colors.</p>
                    </div>
                    <span
                      className="theme-preview-badge"
                      style={{
                        backgroundColor: `${primaryInput}18`,
                        color: primaryInput,
                      }}
                    >
                      Live Rendering
                    </span>
                  </div>

                  {/* SIMULATED APP HEADER */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#f8fafc', borderRadius: 14, border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          background: `linear-gradient(135deg, ${primaryInput}, ${secondaryInput})`,
                        }}
                      >
                        <TrendingUp style={{ width: 16, height: 16 }} />
                      </div>
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', display: 'block' }}>MyFinance App</span>
                        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: primaryInput }}>Personal Workspace</span>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '4px 8px',
                        borderRadius: 8,
                        fontSize: 10,
                        fontWeight: 700,
                        border: `1px solid ${primaryInput}35`,
                        backgroundColor: `${primaryInput}12`,
                        color: primaryInput,
                      }}
                    >
                      ₹ 1,48,250.00
                    </div>
                  </div>

                  {/* SIMULATED KPI STAT CARD */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    <div style={{ padding: 14, borderRadius: 14, backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Monthly Net</span>
                        <CreditCard style={{ width: 14, height: 14, color: '#94a3b8' }} />
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: primaryInput }}>+₹ 42,800</div>
                      <span style={{ fontSize: 10, color: '#10b981', fontWeight: 600 }}>+18.4% vs last mo</span>
                    </div>

                    <div style={{ padding: 14, borderRadius: 14, backgroundColor: '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Budget Spent</span>
                        <PieChart style={{ width: 14, height: 14, color: '#94a3b8' }} />
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>₹ 24,190</div>
                      <div style={{ width: '100%', height: 6, borderRadius: 9999, backgroundColor: '#e2e8f0', overflow: 'hidden', marginTop: 4 }}>
                        <div style={{ height: '100%', width: '64%', backgroundColor: primaryInput, borderRadius: 9999 }} />
                      </div>
                    </div>
                  </div>

                  {/* BUTTONS DEMO */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Buttons & Controls
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <button
                        type="button"
                        style={{ padding: '8px 14px', borderRadius: 10, color: '#ffffff', fontSize: 12, fontWeight: 700, border: 'none', backgroundColor: primaryInput, cursor: 'pointer' }}
                      >
                        Primary Action
                      </button>

                      <button
                        type="button"
                        style={{ padding: '8px 14px', borderRadius: 10, color: '#ffffff', fontSize: 12, fontWeight: 700, border: 'none', backgroundColor: secondaryInput, cursor: 'pointer' }}
                      >
                        Secondary Action
                      </button>

                      <button
                        type="button"
                        style={{
                          padding: '8px 14px',
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 700,
                          border: `1px solid ${primaryInput}50`,
                          color: primaryInput,
                          backgroundColor: `${primaryInput}08`,
                          cursor: 'pointer',
                        }}
                      >
                        Outline Button
                      </button>
                    </div>
                  </div>

                  {/* BADGES & CHIPS DEMO */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Badges & Status Chips
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 9999,
                          fontSize: 10,
                          fontWeight: 700,
                          backgroundColor: `${primaryInput}18`,
                          color: primaryInput,
                        }}
                      >
                        Active Account
                      </span>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 9999,
                          fontSize: 10,
                          fontWeight: 700,
                          backgroundColor: `${secondaryInput}18`,
                          color: secondaryInput,
                        }}
                      >
                        Secondary Tag
                      </span>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 9999,
                          fontSize: 10,
                          fontWeight: 700,
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                        }}
                      >
                        Neutral Tag
                      </span>
                    </div>
                  </div>

                  {/* INTERACTIVE INPUT DEMO */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Focus Ring Demo
                    </label>
                    <input
                      type="text"
                      defaultValue="Dynamic focus ring preview..."
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                        fontSize: 12,
                        color: '#0f172a',
                        boxSizing: 'border-box',
                        outline: 'none',
                        transition: 'all 0.15s ease',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* METRICS */}
            {stats && (
              <div className="admin-stats">
                <div className="admin-stat-card">
                  <span className="admin-stat-label">Total Registered Users</span>
                  <div className="admin-stat-value">{stats.totalUsers}</div>
                  <span className="admin-stat-subtitle">Across platform</span>
                </div>

                <div className="admin-stat-card">
                  <span className="admin-stat-label">Active Accounts</span>
                  <div className="admin-stat-value admin-stat-value-emerald">{stats.activeUsers}</div>
                  <span className="admin-stat-subtitle" style={{ color: '#10b981', fontWeight: 600 }}>Unrestricted</span>
                </div>

                <div className="admin-stat-card">
                  <span className="admin-stat-label">Suspended / Banned</span>
                  <div className="admin-stat-value admin-stat-value-rose">{stats.bannedUsers}</div>
                  <span className="admin-stat-subtitle" style={{ color: '#e11d48', fontWeight: 600 }}>Access revoked</span>
                </div>

                <div className="admin-stat-card">
                  <span className="admin-stat-label">Recent Signups (30d)</span>
                  <div className="admin-stat-value admin-stat-value-blue">{stats.recentSignups}</div>
                  <span className="admin-stat-subtitle">New memberships</span>
                </div>
              </div>
            )}

            {/* PRIVACY NOTICE CARD */}
            <div className="admin-privacy-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Lock style={{ width: 16, height: 16, color: '#34d399', flexShrink: 0 }} />
                <span>
                  <strong>Privacy Policy Enforced:</strong> User financial transactions, accounts, and private notes are cryptographically shielded and never displayed in the Super Admin panel.
                </span>
              </div>
            </div>

            {/* USER LIST TOOLBAR & TABLE */}
            <div className="admin-toolbar">
              <div className="admin-toolbar-row">
                {/* Search */}
                <div className="admin-search-container">
                  <Search className="admin-search-icon" />
                  <input
                    type="text"
                    placeholder="Search by name, email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="admin-search-input"
                  />
                </div>

                {/* Filter */}
                <div className="admin-filter-group">
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setPage(1);
                    }}
                    className={`admin-filter-btn ${statusFilter === 'all' ? 'admin-filter-btn-active' : ''}`}
                  >
                    All Users
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('active');
                      setPage(1);
                    }}
                    className={`admin-filter-btn ${statusFilter === 'active' ? 'admin-filter-btn-active' : ''}`}
                  >
                    Active Only
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('banned');
                      setPage(1);
                    }}
                    className={`admin-filter-btn ${statusFilter === 'banned' ? 'admin-filter-btn-active' : ''}`}
                  >
                    Banned Only
                  </button>
                </div>
              </div>

              {/* TABLE */}
              {loading ? (
                <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                  Loading user registry...
                </div>
              ) : usersList.length === 0 ? (
                <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                  No users match the search criteria.
                </div>
              ) : (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th className="admin-table-th">User</th>
                        <th className="admin-table-th">Status</th>
                        <th className="admin-table-th">Email Verified</th>
                        <th className="admin-table-th">Registered On</th>
                        <th className="admin-table-th" style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.map((u) => (
                        <tr key={u._id} className="admin-table-row">
                          <td className="admin-table-td">
                            <div className="admin-user-name">{u.name}</div>
                            <div className="admin-user-email">{u.email}</div>
                          </td>
                          <td className="admin-table-td">
                            <span
                              className={`admin-status-badge ${u.isBanned ? 'admin-status-banned' : 'admin-status-active'}`}
                            >
                              {u.isBanned ? 'BANNED' : 'ACTIVE'}
                            </span>
                            {u.banReason && (
                              <span style={{ display: 'block', fontSize: 10, color: '#94a3b8', marginTop: 2, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {u.banReason}
                              </span>
                            )}
                          </td>
                          <td className="admin-table-td">
                            <span style={{ color: u.isEmailVerified ? '#10b981' : '#94a3b8', fontWeight: 600 }}>
                              {u.isEmailVerified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td className="admin-table-td" style={{ color: '#64748b' }}>{formatDate(u.createdAt)}</td>
                          <td className="admin-table-td" style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  if (u.isBanned) {
                                    handleToggleBan(u);
                                  } else {
                                    setBanModalOpen(true);
                                  }
                                }}
                                className={`admin-btn-action ${u.isBanned ? 'admin-btn-unban' : 'admin-btn-ban'}`}
                              >
                                {u.isBanned ? 'Unban' : 'Ban User'}
                              </button>

                              <button
                                onClick={() => setDeleteConfirmUser(u)}
                                className="admin-btn-delete"
                                title="Delete User and Financial Data"
                              >
                                <Trash2 style={{ width: 14, height: 14 }} />
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
                <div className="admin-pagination">
                  <span>
                    Page {page} of {totalPages}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                      className="admin-pagination-btn"
                    >
                      Previous
                    </button>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                      className="admin-pagination-btn"
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
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-icon admin-modal-icon-amber">
              <Ban style={{ width: 24, height: 24 }} />
            </div>
            <div>
              <h3 className="admin-modal-title">Ban Account: {selectedUser.name}</h3>
              <p className="admin-modal-text" style={{ marginTop: 4 }}>
                The user will be immediately logged out and prohibited from logging in or accessing financial endpoints.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Reason for Suspension</label>
              <input
                type="text"
                placeholder="e.g. Violation of terms, account misuse"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="admin-search-input"
              />
            </div>

            <div className="admin-modal-actions">
              <button
                onClick={() => setBanModalOpen(false)}
                className="transaction-btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={() => handleToggleBan(selectedUser)}
                disabled={actionLoading}
                className="transaction-btn-submit"
                style={{ backgroundColor: '#d97706' }}
              >
                {actionLoading ? 'Banning...' : 'Confirm Ban'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmUser && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-icon admin-modal-icon-rose">
              <AlertTriangle style={{ width: 24, height: 24 }} />
            </div>
            <h3 className="admin-modal-title">Permanently Delete User?</h3>
            <p className="admin-modal-text">
              This will permanently purge <strong>{deleteConfirmUser.name}</strong> and all associated accounts, transactions, and budgets in accordance with the data retention policy.
            </p>

            <div className="admin-modal-actions">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="transaction-btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirmUser._id)}
                disabled={actionLoading}
                className="transaction-btn-danger"
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
