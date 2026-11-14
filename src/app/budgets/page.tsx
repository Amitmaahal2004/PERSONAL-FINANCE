'use client';

import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  Bell,
  TrendingDown,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { IBudget, ICategory } from '@/types';
import { formatCurrency } from '@/lib/currency';

export default function BudgetsPage() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [overallSpent, setOverallSpent] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<any | null>(null);
  const [categoryName, setCategoryName] = useState('Overall');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [alert70, setAlert70] = useState(true);
  const [alert90, setAlert90] = useState(true);
  const [alert100, setAlert100] = useState(true);
  const [error, setError] = useState('');

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([
        fetch('/api/budgets'),
        fetch('/api/categories?type=expense'),
      ]);

      if (bRes.ok) {
        const data = await bRes.json();
        setBudgets(data.budgets || []);
        setOverallSpent(data.overallSpent || 0);
      }

      if (cRes.ok) {
        const cData = await cRes.json();
        setCategories(cData.categories || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryName,
          monthlyBudget: parseFloat(monthlyBudget),
          alertThreshold70: alert70,
          alertThreshold90: alert90,
          alertThreshold100: alert100,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to set budget.');
        return;
      }

      setCreateModalOpen(false);
      setMonthlyBudget('');
      fetchBudgets();
    } catch (err: any) {
      setError(err.message || 'Error saving budget.');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchBudgets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const cur = user?.preferredCurrency || 'INR';
  const sym = user?.currencySymbol || '₹';

  return (
    <DashboardLayout>
      <div className="budgets">
        {/* HEADER */}
        <div className="budgets-header">
          <div>
            <h1 className="budgets-title">
              Budget Management
            </h1>
            <p className="budgets-description">
              Set spending limits and receive alerts before exceeding budget thresholds.
            </p>
          </div>

          <button
            onClick={() => {
              setCategoryName('Overall');
              setMonthlyBudget('');
              setError('');
              setCreateModalOpen(true);
            }}
            className="budgets-btn-primary"
          >
            <Plus style={{ width: 16, height: 16 }} />
            <span>Set New Budget</span>
          </button>
        </div>

        {/* BUDGET CARDS GRID */}
        {loading ? (
          <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
            Loading budgets...
          </div>
        ) : budgets.length === 0 ? (
          <div className="budgets-empty">
            <div className="budgets-empty-icon">
              <PieChart style={{ width: 24, height: 24 }} />
            </div>
            <h3 className="budgets-empty-title">No Budgets Configured</h3>
            <p className="budgets-empty-desc">
              Set an overall monthly budget or category-specific targets to monitor your spending habits.
            </p>
          </div>
        ) : (
          <div className="budgets-grid">
            {budgets.map((b) => {
              const pct = b.percentageUsed || 0;
              const isOver = pct > 100;
              const isWarning = pct >= 90 && pct <= 100;
              const isNotice = pct >= 70 && pct < 90;

              return (
                <div key={b._id} className="budget-card">
                  <div>
                    <div className="budget-card-header">
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span className="budget-card-title">{b.categoryName}</span>
                        {b.categoryName.toLowerCase() === 'overall' && (
                          <span className="budget-card-badge">
                            PRIMARY
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteBudget(b._id)}
                        className="budget-card-delete-btn"
                        title="Delete Budget"
                      >
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="budget-progress-container">
                      <div className="budget-progress-labels">
                        <span className="budget-progress-spent">Spent: {formatCurrency(b.spent, cur, sym)}</span>
                        <span
                          className={`budget-progress-pct ${
                            isOver ? 'budget-progress-pct-danger' : isWarning ? 'budget-progress-pct-warning' : ''
                          }`}
                        >
                          {pct}% used
                        </span>
                      </div>
                      <div className="budget-progress-bar">
                        <div
                          className={`budget-progress-fill ${
                            isOver
                              ? 'budget-progress-fill-danger'
                              : isWarning
                              ? 'budget-progress-fill-warning'
                              : isNotice
                              ? 'budget-progress-fill-notice'
                              : ''
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Budget & Remaining */}
                    <div className="budget-card-metrics">
                      <div>
                        <span className="budget-card-metric-label">Monthly Limit</span>
                        <div className="budget-card-metric-value">
                          {formatCurrency(b.monthlyBudget, cur, sym)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="budget-card-metric-label">Remaining</span>
                        <div
                          className={`budget-card-metric-remaining ${
                            b.remaining < 0 ? 'budget-card-metric-remaining-over' : ''
                          }`}
                        >
                          {formatCurrency(b.remaining, cur, sym)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Alert Badges */}
                  {(isOver || isWarning || isNotice) && (
                    <div
                      className={`budget-alert ${
                        isOver
                          ? 'budget-alert-danger'
                          : isWarning
                          ? 'budget-alert-warning'
                          : 'budget-alert-notice'
                      }`}
                    >
                      <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0 }} />
                      <span>
                        {isOver
                          ? 'Budget exceeded! You have spent more than allocated.'
                          : isWarning
                          ? 'Warning: 90% threshold reached. Limit further spending.'
                          : 'Notice: 70% threshold reached.'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE BUDGET MODAL */}
      {createModalOpen && (
        <div className="budgets-modal-backdrop">
          <div className="budgets-modal">
            <div className="budgets-modal-header">
              <h3 className="budgets-modal-title">Configure Budget Target</h3>
              <button onClick={() => setCreateModalOpen(false)} className="budgets-modal-close-btn" aria-label="Close modal">
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {error && (
              <div className="budgets-form-error">
                <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateBudget} className="budgets-form">
              <div className="budgets-form-group">
                <label className="budgets-form-label">Target Category</label>
                <select
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="budgets-form-select"
                >
                  <option value="Overall">Overall Monthly Budget (All Expenses)</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="budgets-form-group">
                <label className="budgets-form-label">
                  Monthly Budget Limit ({sym})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 25000"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  className="budgets-form-input"
                  style={{ fontSize: 16, fontWeight: 700 }}
                />
              </div>

              <div className="budgets-form-checkbox-group">
                <span className="budgets-form-label">Notification Threshold Alerts</span>
                <label className="budgets-form-checkbox-label">
                  <input
                    type="checkbox"
                    checked={alert70}
                    onChange={(e) => setAlert70(e.target.checked)}
                  />
                  <span>Alert me when 70% is reached</span>
                </label>
                <label className="budgets-form-checkbox-label">
                  <input
                    type="checkbox"
                    checked={alert90}
                    onChange={(e) => setAlert90(e.target.checked)}
                  />
                  <span>Alert me when 90% is reached</span>
                </label>
                <label className="budgets-form-checkbox-label">
                  <input
                    type="checkbox"
                    checked={alert100}
                    onChange={(e) => setAlert100(e.target.checked)}
                  />
                  <span>Alert me when budget is exceeded (100%+)</span>
                </label>
              </div>

              <div className="budgets-form-actions">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="budgets-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="budgets-btn-submit"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

