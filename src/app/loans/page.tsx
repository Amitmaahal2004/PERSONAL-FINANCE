'use client';

import React, { useState, useEffect } from 'react';
import {
  HandCoins,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  X,
  CreditCard,
  User,
  History,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { ILoan, IAccount } from '@/types';
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/lib/utils';

export default function LoansPage() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<ILoan[]>([]);
  const [accounts, setAccounts] = useState<IAccount[]>([]);
  const [summary, setSummary] = useState({
    totalMoneyLent: 0,
    totalMoneyBorrowed: 0,
    pendingReceivables: 0,
    pendingPayables: 0,
    overdueCount: 0,
  });
  const [activeTab, setActiveTab] = useState<'all' | 'lent' | 'borrowed'>('all');
  const [loading, setLoading] = useState(true);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [repayLoan, setRepayLoan] = useState<ILoan | null>(null);
  const [historyLoan, setHistoryLoan] = useState<ILoan | null>(null);

  // Form
  const [type, setType] = useState<'lent' | 'borrowed'>('lent');
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Repay Form
  const [repayAmount, setRepayAmount] = useState('');
  const [repayAccount, setRepayAccount] = useState('');
  const [repayNotes, setRepayNotes] = useState('');

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const [lRes, aRes] = await Promise.all([fetch('/api/loans'), fetch('/api/accounts')]);

      if (lRes.ok) {
        const data = await lRes.json();
        setLoans(data.loans || []);
        setSummary(
          data.summary || {
            totalMoneyLent: 0,
            totalMoneyBorrowed: 0,
            pendingReceivables: 0,
            pendingPayables: 0,
            overdueCount: 0,
          }
        );
      }

      if (aRes.ok) {
        const aData = await aRes.json();
        setAccounts(aData.accounts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          personName,
          amount: parseFloat(amount),
          date,
          dueDate: dueDate || undefined,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save loan record.');
        return;
      }

      setCreateModalOpen(false);
      setPersonName('');
      setAmount('');
      setNotes('');
      fetchLoans();
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finance_updated'));
    } catch (err: any) {
      setError(err.message || 'Error recording loan.');
    }
  };

  const handleRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayLoan) return;

    try {
      const res = await fetch(`/api/loans/${repayLoan._id}/repay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(repayAmount),
          accountId: repayAccount || undefined,
          notes: repayNotes,
        }),
      });

      if (res.ok) {
        setRepayLoan(null);
        setRepayAmount('');
        setRepayNotes('');
        fetchLoans();
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finance_updated'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/loans/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLoans();
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finance_updated'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const cur = user?.preferredCurrency || 'INR';
  const sym = user?.currencySymbol || '₹';

  const filteredLoans = loans.filter((l) => (activeTab === 'all' ? true : l.type === activeTab));

  return (
    <DashboardLayout>
      <div className="loans">
        {/* HEADER */}
        <div className="loans-header">
          <div className="loans-header-info">
            <h1 className="loans-title">Lending & Borrowed Money</h1>
            <p className="loans-description">
              Keep precise track of personal credit, receivables, payables, and repayments.
            </p>
          </div>

          <button
            onClick={() => {
              setPersonName('');
              setAmount('');
              setNotes('');
              setError('');
              setCreateModalOpen(true);
            }}
            className="loans-btn-add"
          >
            <Plus style={{ width: 16, height: 16 }} />
            <span>Record Loan / Lending</span>
          </button>
        </div>

        {/* SUMMARY KPI CARDS */}
        <div className="loans-stats">
          <div className="loans-stat-card">
            <span className="loans-stat-label">Total Money Lent</span>
            <div className="loans-stat-value loans-stat-value-lent">
              {formatCurrency(summary.totalMoneyLent, cur, sym)}
            </div>
            <span className="loans-stat-sub">Principal disbursed</span>
          </div>

          <div className="loans-stat-card">
            <span className="loans-stat-label">Pending Receivables</span>
            <div className="loans-stat-value loans-stat-value-receivable">
              {formatCurrency(summary.pendingReceivables, cur, sym)}
            </div>
            <span className="loans-stat-sub loans-stat-sub-green">Others owe you</span>
          </div>

          <div className="loans-stat-card">
            <span className="loans-stat-label">Total Money Borrowed</span>
            <div className="loans-stat-value loans-stat-value-borrowed">
              {formatCurrency(summary.totalMoneyBorrowed, cur, sym)}
            </div>
            <span className="loans-stat-sub">Principal taken</span>
          </div>

          <div className="loans-stat-card">
            <span className="loans-stat-label">Pending Payables</span>
            <div className="loans-stat-value loans-stat-value-payable">
              {formatCurrency(summary.pendingPayables, cur, sym)}
            </div>
            <span className="loans-stat-sub loans-stat-sub-red">You owe others</span>
          </div>
        </div>

        {/* TAB FILTER */}
        <div className="loans-tabs">
          <button
            onClick={() => setActiveTab('all')}
            className={`loans-tab-btn ${activeTab === 'all' ? 'loans-tab-btn-active' : ''}`}
          >
            All ({loans.length})
          </button>
          <button
            onClick={() => setActiveTab('lent')}
            className={`loans-tab-btn ${activeTab === 'lent' ? 'loans-tab-btn-active' : ''}`}
          >
            Money I Lent
          </button>
          <button
            onClick={() => setActiveTab('borrowed')}
            className={`loans-tab-btn ${activeTab === 'borrowed' ? 'loans-tab-btn-active' : ''}`}
          >
            Money I Borrowed
          </button>
        </div>

        {/* LOANS LIST */}
        {loading ? (
          <div className="loans-loading">Loading loan records...</div>
        ) : filteredLoans.length === 0 ? (
          <div className="loans-empty">
            <div className="loans-empty-icon">
              <HandCoins style={{ width: 24, height: 24 }} />
            </div>
            <h3 className="loans-empty-title">No Loan Records</h3>
            <p className="loans-empty-desc">
              Track money you lend to friends or family, or debts you need to repay.
            </p>
          </div>
        ) : (
          <div className="loans-grid">
            {filteredLoans.map((l) => {
              const isOverdue = l.dueDate && new Date(l.dueDate) < new Date() && l.remainingAmount > 0;
              return (
                <div key={l._id} className="loans-card">
                  <div>
                    <div className="loans-card-top">
                      <div className="loans-card-info">
                        <div
                          className={`loans-card-icon ${
                            l.type === 'lent' ? 'loans-card-icon-lent' : 'loans-card-icon-borrowed'
                          }`}
                        >
                          {l.type === 'lent' ? (
                            <ArrowUpRight style={{ width: 20, height: 20 }} />
                          ) : (
                            <ArrowDownLeft style={{ width: 20, height: 20 }} />
                          )}
                        </div>
                        <div>
                          <h3 className="loans-card-name">{l.personName}</h3>
                          <span
                            className={`loans-card-badge ${
                              l.type === 'lent' ? 'loans-card-badge-lent' : 'loans-card-badge-borrowed'
                            }`}
                          >
                            {l.type === 'lent' ? 'Money I Lent' : 'Money I Borrowed'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(l._id)}
                        className="loans-card-delete-btn"
                        aria-label="Delete loan record"
                      >
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </div>

                    <div className="loans-card-details">
                      <div className="loans-card-row">
                        <span className="loans-card-label">Initial Amount:</span>
                        <span className="loans-card-val">{formatCurrency(l.initialAmount, cur, sym)}</span>
                      </div>
                      <div className="loans-card-row">
                        <span className="loans-card-label">Remaining Balance:</span>
                        <span className="loans-card-val-bold">{formatCurrency(l.remainingAmount, cur, sym)}</span>
                      </div>
                      <div className="loans-card-meta">
                        <span>Disbursed: {formatDate(l.date)}</span>
                        {l.dueDate && <span>Due: {formatDate(l.dueDate)}</span>}
                      </div>
                    </div>

                    {isOverdue && (
                      <div className="loans-alert-overdue">
                        <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} />
                        <span>Past due date! Payment is overdue.</span>
                      </div>
                    )}
                  </div>

                  <div className="loans-card-bottom">
                    <span
                      className={`loans-status-badge ${
                        l.status === 'settled'
                          ? 'loans-status-settled'
                          : l.status === 'partially_paid'
                          ? 'loans-status-partial'
                          : 'loans-status-pending'
                      }`}
                    >
                      {l.status.replace('_', ' ').toUpperCase()}
                    </span>

                    <div className="loans-card-actions">
                      {l.repayments && l.repayments.length > 0 && (
                        <button
                          onClick={() => setHistoryLoan(l)}
                          className="loans-btn-history"
                        >
                          History ({l.repayments.length})
                        </button>
                      )}
                      {l.remainingAmount > 0 && (
                        <button
                          onClick={() => {
                            setRepayLoan(l);
                            setRepayAmount(String(l.remainingAmount));
                          }}
                          className="loans-btn-repay"
                        >
                          Record Repayment
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE LOAN MODAL */}
      {createModalOpen && (
        <div className="loans-modal-backdrop">
          <div className="loans-modal">
            <div className="loans-modal-header">
              <h3 className="loans-modal-title">Record Lending / Borrowing</h3>
              <button onClick={() => setCreateModalOpen(false)} className="loans-modal-close-btn" aria-label="Close modal">
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {error && (
              <div className="loans-form-error">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateLoan} className="loans-form">
              <div className="loans-form-group">
                <label className="loans-form-label">Direction</label>
                <div className="loans-form-type-toggle">
                  <button
                    type="button"
                    onClick={() => setType('lent')}
                    className={`loans-form-type-btn ${
                      type === 'lent' ? 'loans-form-type-btn-lent' : ''
                    }`}
                  >
                    Money I Lent (Asset)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('borrowed')}
                    className={`loans-form-type-btn ${
                      type === 'borrowed' ? 'loans-form-type-btn-borrowed' : ''
                    }`}
                  >
                    Money I Borrowed (Debt)
                  </button>
                </div>
              </div>

              <div className="loans-form-group">
                <label className="loans-form-label">Person / Entity Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh, Priya, Landlord"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="loans-form-input"
                />
              </div>

              <div className="loans-form-group">
                <label className="loans-form-label">Principal Amount ({sym})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="loans-form-input"
                  style={{ fontSize: 16, fontWeight: 700 }}
                />
              </div>

              <div className="loans-form-row">
                <div className="loans-form-group">
                  <label className="loans-form-label">Transaction Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="loans-form-input"
                  />
                </div>
                <div className="loans-form-group">
                  <label className="loans-form-label">Due Date (Optional)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="loans-form-input"
                  />
                </div>
              </div>

              <div className="loans-form-group">
                <label className="loans-form-label">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Additional context..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="loans-form-input"
                />
              </div>

              <div className="loans-form-actions">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="loans-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="loans-btn-submit"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPAYMENT MODAL */}
      {repayLoan && (
        <div className="loans-modal-backdrop">
          <div className="loans-modal">
            <div className="loans-modal-header">
              <div>
                <h3 className="loans-modal-title">Record Repayment</h3>
                <span className="loans-modal-subtitle">
                  {repayLoan.personName} • Remaining: {formatCurrency(repayLoan.remainingAmount, cur, sym)}
                </span>
              </div>
              <button onClick={() => setRepayLoan(null)} className="loans-modal-close-btn" aria-label="Close modal">
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <form onSubmit={handleRepayment} className="loans-form">
              <div className="loans-form-group">
                <label className="loans-form-label">Repayment Amount ({sym})</label>
                <input
                  type="number"
                  step="0.01"
                  max={repayLoan.remainingAmount}
                  required
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="loans-form-input"
                  style={{ fontSize: 16, fontWeight: 700 }}
                />
              </div>

              <div className="loans-form-group">
                <label className="loans-form-label">
                  {repayLoan.type === 'lent' ? 'Deposit Into Account (Optional)' : 'Pay From Account (Optional)'}
                </label>
                <select
                  value={repayAccount}
                  onChange={(e) => setRepayAccount(e.target.value)}
                  className="loans-form-select"
                >
                  <option value="">Do not alter account balance (External)</option>
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.accountName} ({sym}{acc.currentBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="loans-form-group">
                <label className="loans-form-label">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Part payment via UPI"
                  value={repayNotes}
                  onChange={(e) => setRepayNotes(e.target.value)}
                  className="loans-form-input"
                />
              </div>

              <div className="loans-form-actions">
                <button
                  type="button"
                  onClick={() => setRepayLoan(null)}
                  className="loans-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="loans-btn-submit"
                >
                  Confirm Repayment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPAYMENT HISTORY MODAL */}
      {historyLoan && (
        <div className="loans-modal-backdrop">
          <div className="loans-modal">
            <div className="loans-modal-header">
              <h3 className="loans-modal-title">Repayment History ({historyLoan.personName})</h3>
              <button onClick={() => setHistoryLoan(null)} className="loans-modal-close-btn" aria-label="Close modal">
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <div className="loans-history-list">
              {historyLoan.repayments.map((rep, idx) => (
                <div key={idx} className="loans-history-item">
                  <div>
                    <span className="loans-history-date">{formatDate(rep.date)}</span>
                    {rep.notes && <p className="loans-history-notes">{rep.notes}</p>}
                  </div>
                  <span className="loans-history-amount">{formatCurrency(rep.amount, cur, sym)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

