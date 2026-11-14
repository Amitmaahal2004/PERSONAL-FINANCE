'use client';

import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  TrendingUp,
  Calendar,
  Wallet,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { ISavingsGoal, IAccount } from '@/types';
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/lib/utils';

export default function SavingsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<ISavingsGoal[]>([]);
  const [accounts, setAccounts] = useState<IAccount[]>([]);
  const [totalSaved, setTotalSaved] = useState(0);
  const [totalTarget, setTotalTarget] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<ISavingsGoal | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionAccount, setContributionAccount] = useState('');
  const [contributionNotes, setContributionNotes] = useState('');

  // Form State
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialSaved, setInitialSaved] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const [gRes, aRes] = await Promise.all([fetch('/api/savings'), fetch('/api/accounts')]);

      if (gRes.ok) {
        const data = await gRes.json();
        setGoals(data.savingsGoals || []);
        setTotalSaved(data.totalSaved || 0);
        setTotalTarget(data.totalTarget || 0);
      }

      if (aRes.ok) {
        const aData = await aRes.json();
        setAccounts(aData.accounts || []);
        if (aData.accounts?.length > 0 && !contributionAccount) {
          setContributionAccount(aData.accounts[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalName,
          targetAmount: parseFloat(targetAmount),
          currentSavedAmount: parseFloat(initialSaved) || 0,
          targetDate,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create goal.');
        return;
      }

      setCreateModalOpen(false);
      setGoalName('');
      setTargetAmount('');
      setInitialSaved('');
      setDescription('');
      fetchGoals();
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finance_updated'));
    } catch (err: any) {
      setError(err.message || 'Error creating savings goal.');
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeGoal) return;

    try {
      const res = await fetch(`/api/savings/${contributeGoal._id}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(contributionAmount),
          accountId: contributionAccount || undefined,
          notes: contributionNotes,
        }),
      });

      if (res.ok) {
        setContributeGoal(null);
        setContributionAmount('');
        setContributionNotes('');
        fetchGoals();
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finance_updated'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/savings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchGoals();
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finance_updated'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const cur = user?.preferredCurrency || 'INR';
  const sym = user?.currencySymbol || '₹';

  return (
    <DashboardLayout>
      <div className="savings">
        {/* HEADER */}
        <div className="savings-header">
          <div className="savings-header-info">
            <h1 className="savings-title">Savings Goals</h1>
            <p className="savings-description">
              Target funds for life milestones, emergencies, and dream purchases.
            </p>
          </div>

          <button
            onClick={() => {
              setGoalName('');
              setTargetAmount('');
              setInitialSaved('');
              setError('');
              setCreateModalOpen(true);
            }}
            className="savings-btn-add"
          >
            <Plus style={{ width: 16, height: 16 }} />
            <span>New Savings Goal</span>
          </button>
        </div>

        {/* OVERVIEW STATS */}
        <div className="savings-stats">
          <div className="savings-stat-card">
            <span className="savings-stat-label">Total Capital Saved</span>
            <div className="savings-stat-value savings-stat-value-saved">
              {formatCurrency(totalSaved, cur, sym)}
            </div>
          </div>
          <div className="savings-stat-card">
            <span className="savings-stat-label">Total Target Amount</span>
            <div className="savings-stat-value savings-stat-value-target">
              {formatCurrency(totalTarget, cur, sym)}
            </div>
          </div>
          <div className="savings-stat-card">
            <span className="savings-stat-label">Overall Progress</span>
            <div className="savings-stat-value savings-stat-value-progress">
              {totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* GOALS GRID */}
        {loading ? (
          <div className="savings-loading">Loading savings goals...</div>
        ) : goals.length === 0 ? (
          <div className="savings-empty">
            <div className="savings-empty-icon">
              <Target style={{ width: 24, height: 24 }} />
            </div>
            <h3 className="savings-empty-title">No Savings Goals Set</h3>
            <p className="savings-empty-desc">
              Create an Emergency Fund, Travel Fund, or New Laptop target to track your progress.
            </p>
          </div>
        ) : (
          <div className="savings-grid">
            {goals.map((g) => {
              const pct = g.progressPercentage || 0;
              const remaining = Math.max(0, g.targetAmount - g.currentSavedAmount);

              return (
                <div key={g._id} className="savings-card">
                  <div>
                    <div className="savings-card-top">
                      <div className="savings-card-info">
                        <div className="savings-card-icon">
                          <Target style={{ width: 20, height: 20 }} />
                        </div>
                        <div>
                          <h3 className="savings-card-title">{g.goalName}</h3>
                          <span className="savings-card-target-date">
                            <Calendar style={{ width: 12, height: 12 }} /> Target: {formatDate(g.targetDate)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(g._id)}
                        className="savings-card-delete-btn"
                        aria-label="Delete goal"
                      >
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </div>

                    {g.description && (
                      <p className="savings-card-desc">{g.description}</p>
                    )}

                    {/* Progress */}
                    <div className="savings-progress-section">
                      <div className="savings-progress-amounts">
                        <span className="savings-progress-current">{formatCurrency(g.currentSavedAmount, cur, sym)}</span>
                        <span className="savings-progress-percent">{pct}%</span>
                      </div>
                      <div className="savings-progress-bar">
                        <div
                          className="savings-progress-fill"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <div className="savings-progress-meta">
                        <span>Remaining: {formatCurrency(remaining, cur, sym)}</span>
                        <span>Target: {formatCurrency(g.targetAmount, cur, sym)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="savings-card-bottom">
                    <span
                      className={`savings-status-badge ${
                        g.status === 'completed'
                          ? 'savings-status-completed'
                          : 'savings-status-active'
                      }`}
                    >
                      {g.status.toUpperCase()}
                    </span>

                    <button
                      onClick={() => {
                        setContributeGoal(g);
                        setContributionAmount('');
                      }}
                      className="savings-btn-contribute"
                    >
                      <Plus style={{ width: 14, height: 14 }} />
                      <span>Add Contribution</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE GOAL MODAL */}
      {createModalOpen && (
        <div className="savings-modal-backdrop">
          <div className="savings-modal">
            <div className="savings-modal-header">
              <h3 className="savings-modal-title">Create Savings Target</h3>
              <button onClick={() => setCreateModalOpen(false)} className="savings-modal-close-btn" aria-label="Close modal">
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {error && (
              <div className="savings-form-error">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateGoal} className="savings-form">
              <div className="savings-form-group">
                <label className="savings-form-label">Goal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency Fund, New Bike, Tokyo Trip"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="savings-form-input"
                />
              </div>

              <div className="savings-form-row">
                <div className="savings-form-group">
                  <label className="savings-form-label">Target Amount ({sym})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="100000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="savings-form-input"
                    style={{ fontWeight: 700 }}
                  />
                </div>
                <div className="savings-form-group">
                  <label className="savings-form-label">Initial Saved ({sym})</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={initialSaved}
                    onChange={(e) => setInitialSaved(e.target.value)}
                    className="savings-form-input"
                  />
                </div>
              </div>

              <div className="savings-form-group">
                <label className="savings-form-label">Target Date</label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="savings-form-input"
                />
              </div>

              <div className="savings-form-group">
                <label className="savings-form-label">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Purpose of this savings fund..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="savings-form-input"
                />
              </div>

              <div className="savings-form-actions">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="savings-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="savings-btn-submit"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONTRIBUTE MODAL */}
      {contributeGoal && (
        <div className="savings-modal-backdrop">
          <div className="savings-modal">
            <div className="savings-modal-header">
              <div>
                <h3 className="savings-modal-title">Add Savings Contribution</h3>
                <span className="savings-modal-subtitle">Target: {contributeGoal.goalName}</span>
              </div>
              <button onClick={() => setContributeGoal(null)} className="savings-modal-close-btn" aria-label="Close modal">
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <form onSubmit={handleContribute} className="savings-form">
              <div className="savings-form-group">
                <label className="savings-form-label">Contribution Amount ({sym})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  className="savings-form-input"
                  style={{ fontSize: 16, fontWeight: 700 }}
                />
              </div>

              <div className="savings-form-group">
                <label className="savings-form-label">
                  Fund from Account (Optional)
                </label>
                <select
                  value={contributionAccount}
                  onChange={(e) => setContributionAccount(e.target.value)}
                  className="savings-form-select"
                >
                  <option value="">Do not deduct from accounts (Manual track)</option>
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.accountName} ({sym}{acc.currentBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
                <p className="savings-form-hint">
                  If selected, this amount will be safely moved from the account into your savings goal without double-counting as an expense.
                </p>
              </div>

              <div className="savings-form-group">
                <label className="savings-form-label">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly allocation from bonus"
                  value={contributionNotes}
                  onChange={(e) => setContributionNotes(e.target.value)}
                  className="savings-form-input"
                />
              </div>

              <div className="savings-form-actions">
                <button
                  type="button"
                  onClick={() => setContributeGoal(null)}
                  className="savings-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="savings-btn-submit"
                >
                  Record Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

