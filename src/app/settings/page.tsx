'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Settings,
  Bell,
  Globe,
  ShieldCheck,
  Download,
  CheckCircle2,
  AlertCircle,
  Save,
  Clock,
  Sparkles,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { CURRENCY_MAP } from '@/lib/currency';

export default function SettingsPage() {
  const { user, refreshUser, updateUserLocally } = useAuth();

  const [preferredCurrency, setPreferredCurrency] = useState('INR');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [timeZone, setTimeZone] = useState('Asia/Kolkata');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [budgetThresholds, setBudgetThresholds] = useState(true);
  const [recurringReminders, setRecurringReminders] = useState(true);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setPreferredCurrency(user.preferredCurrency || 'INR');
      setDateFormat(user.dateFormat || 'DD/MM/YYYY');
      setTimeZone(user.timeZone || 'Asia/Kolkata');
      if (user.notificationPreferences) {
        setEmailAlerts(user.notificationPreferences.emailAlerts ?? true);
        setBudgetThresholds(user.notificationPreferences.budgetThresholds ?? true);
        setRecurringReminders(user.notificationPreferences.recurringReminders ?? true);
      }
    }
  }, [user]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredCurrency,
          dateFormat,
          timeZone,
          notificationPreferences: {
            emailAlerts,
            budgetThresholds,
            recurringReminders,
          },
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('Preferences saved successfully!');
        updateUserLocally(data.user);
        await refreshUser();
      } else {
        setError(data.error || 'Failed to save settings.');
      }
    } catch {
      setError('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Account Preferences & Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure regional settings, alerts, and security options.
          </p>
        </div>

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Regional Preferences */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600" />
              <span>Regional & Currency Formats</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
                <select
                  value={preferredCurrency}
                  onChange={(e) => setPreferredCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
                >
                  {Object.entries(CURRENCY_MAP).map(([code, info]) => (
                    <option key={code} value={code}>
                      {code} ({info.symbol}) - {info.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date Format</label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 13/11/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 11/13/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-11-13)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Timezone</label>
                <select
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                  <option value="UTC">UTC (Universal Time)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-600" />
              <span>Notification Preferences</span>
            </h3>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 block">Email Digest & Alerts</span>
                  <span className="text-slate-400">Receive periodic summaries of weekly activity.</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 block">Budget Threshold Warnings</span>
                  <span className="text-slate-400">Highlight categories reaching 70%, 90% and 100% of limits.</span>
                </div>
                <input
                  type="checkbox"
                  checked={budgetThresholds}
                  onChange={(e) => setBudgetThresholds(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 block">Recurring Due Reminders</span>
                  <span className="text-slate-400">Remind me of upcoming bills and subscription renewals.</span>
                </div>
                <input
                  type="checkbox"
                  checked={recurringReminders}
                  onChange={(e) => setRecurringReminders(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </label>
            </div>
          </div>

          {/* Email Verification Status */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Email Verification Status</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {user?.isEmailVerified
                  ? 'Your email address is verified and active.'
                  : 'Your email address has not been verified yet.'}
              </p>
            </div>

            {user?.isEmailVerified ? (
              <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
            ) : (
              <Link
                href="/verify-email"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                Verify Now
              </Link>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving Preferences...' : 'Save All Preferences'}</span>
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

