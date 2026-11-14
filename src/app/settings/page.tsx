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
      <div className="settings">
        <div className="settings-header">
          <h1 className="settings-title">
            Account Preferences & Settings
          </h1>
          <p className="settings-description">
            Configure regional settings, alerts, and security options.
          </p>
        </div>

        {success && (
          <div className="settings-alert-success">
            <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="settings-alert-error">
            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="settings-form">
          {/* Regional Preferences */}
          <div className="settings-card">
            <h3 className="settings-card-title">
              <Globe className="settings-card-icon" />
              <span>Regional & Currency Formats</span>
            </h3>

            <div className="settings-grid-3">
              <div className="settings-form-group">
                <label className="settings-form-label">Currency</label>
                <select
                  value={preferredCurrency}
                  onChange={(e) => setPreferredCurrency(e.target.value)}
                  className="settings-form-select"
                >
                  {Object.entries(CURRENCY_MAP).map(([code, info]) => (
                    <option key={code} value={code}>
                      {code} ({info.symbol}) - {info.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="settings-form-group">
                <label className="settings-form-label">Date Format</label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="settings-form-select"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 13/11/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 11/13/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-11-13)</option>
                </select>
              </div>

              <div className="settings-form-group">
                <label className="settings-form-label">Timezone</label>
                <select
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  className="settings-form-select"
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
          <div className="settings-card">
            <h3 className="settings-card-title">
              <Bell className="settings-card-icon" />
              <span>Notification Preferences</span>
            </h3>

            <div className="settings-toggle-list">
              <label className="settings-toggle-item">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-title">Email Digest & Alerts</span>
                  <span className="settings-toggle-desc">Receive periodic summaries of weekly activity.</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                />
              </label>

              <label className="settings-toggle-item">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-title">Budget Threshold Warnings</span>
                  <span className="settings-toggle-desc">Highlight categories reaching 70%, 90% and 100% of limits.</span>
                </div>
                <input
                  type="checkbox"
                  checked={budgetThresholds}
                  onChange={(e) => setBudgetThresholds(e.target.checked)}
                />
              </label>

              <label className="settings-toggle-item">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-title">Recurring Due Reminders</span>
                  <span className="settings-toggle-desc">Remind me of upcoming bills and subscription renewals.</span>
                </div>
                <input
                  type="checkbox"
                  checked={recurringReminders}
                  onChange={(e) => setRecurringReminders(e.target.checked)}
                />
              </label>
            </div>
          </div>

          {/* Email Verification Status */}
          <div className="settings-verification-card">
            <div className="settings-verification-info">
              <div className="settings-card-title">
                <ShieldCheck className="settings-card-icon" />
                <span>Email Verification Status</span>
              </div>
              <p className="settings-description">
                {user?.isEmailVerified
                  ? 'Your email address is verified and active.'
                  : 'Your email address has not been verified yet.'}
              </p>
            </div>

            {user?.isEmailVerified ? (
              <span className="settings-badge-verified">
                <CheckCircle2 style={{ width: 14, height: 14 }} /> Verified
              </span>
            ) : (
              <Link
                href="/verify-email"
                className="settings-btn-verify"
              >
                Verify Now
              </Link>
            )}
          </div>

          <div className="settings-form-actions">
            <button
              type="submit"
              disabled={loading}
              className="settings-btn-save"
            >
              <Save style={{ width: 14, height: 14 }} />
              <span>{loading ? 'Saving Preferences...' : 'Save All Preferences'}</span>
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

