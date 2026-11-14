'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Wallet,
  Building2,
  CreditCard,
  Plus,
  Repeat,
  Archive,
  Edit2,
  Trash2,
  ArrowRight,
  TrendingUp,
  X,
  Check,
  AlertCircle,
  History,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { IAccount, AccountType, ITransfer } from '@/types';
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/lib/utils';

const ACCOUNT_TYPES: AccountType[] = [
  'Cash Wallet',
  'Bank Account',
  'Savings Account',
  'Credit Card',
  'UPI',
  'Digital Wallet',
  'Investment',
  'Other',
];

const PRESET_COLORS = ['#10b981', '#0284c7', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#64748b'];

function AccountsContent() {
  const searchParams = useSearchParams();
  const openTransferParam = searchParams.get('transfer') === 'true';
  const { user } = useAuth();

  const [accounts, setAccounts] = useState<IAccount[]>([]);
  const [transfers, setTransfers] = useState<ITransfer[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(openTransferParam);
  const [editAccount, setEditAccount] = useState<IAccount | null>(null);
  const [historyAccount, setHistoryAccount] = useState<IAccount | null>(null);
  const [historyTransactions, setHistoryTransactions] = useState<any[]>([]);

  // Create Form State
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<AccountType>('Bank Account');
  const [newOpeningBalance, setNewOpeningBalance] = useState('');
  const [newAccColor, setNewAccColor] = useState('#10b981');
  const [newAccDesc, setNewAccDesc] = useState('');

  // Transfer Form State
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferError, setTransferError] = useState('');

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const [accRes, transRes] = await Promise.all([
        fetch('/api/accounts?includeArchived=true'),
        fetch('/api/transfers'),
      ]);

      if (accRes.ok) {
        const accData = await accRes.json();
        setAccounts(accData.accounts || []);
        setTotalBalance(accData.totalBalance || 0);

        if (accData.accounts?.length >= 2 && !transferFrom) {
          setTransferFrom(accData.accounts[0]._id);
          setTransferTo(accData.accounts[1]._id);
        }
      }

      if (transRes.ok) {
        const transData = await transRes.json();
        setTransfers(transData.transfers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName: newAccName,
          accountType: newAccType,
          openingBalance: parseFloat(newOpeningBalance) || 0,
          accountColor: newAccColor,
          description: newAccDesc,
        }),
      });

      if (res.ok) {
        setCreateModalOpen(false);
        setNewAccName('');
        setNewOpeningBalance('');
        setNewAccDesc('');
        fetchAccounts();
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finance_updated'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');

    if (transferFrom === transferTo) {
      setTransferError('Source and destination accounts must be different.');
      return;
    }

    if (!transferAmount || Number(transferAmount) <= 0) {
      setTransferError('Please enter a valid transfer amount.');
      return;
    }

    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAccountId: transferFrom,
          toAccountId: transferTo,
          amount: parseFloat(transferAmount),
          notes: transferNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTransferError(data.error || 'Transfer failed.');
        return;
      }

      setTransferModalOpen(false);
      setTransferAmount('');
      setTransferNotes('');
      fetchAccounts();
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finance_updated'));
    } catch (err: any) {
      setTransferError(err.message || 'Transfer failed.');
    }
  };

  const viewAccountHistory = async (acc: IAccount) => {
    setHistoryAccount(acc);
    try {
      const res = await fetch(`/api/accounts/${acc._id}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryTransactions(data.recentTransactions || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const cur = user?.preferredCurrency || 'INR';
  const sym = user?.currencySymbol || '₹';

  return (
    <DashboardLayout>
      <div className="accounts">
        {/* HEADER */}
        <div className="accounts-header">
          <div>
            <h1 className="accounts-title">Financial Accounts & Wallets</h1>
            <p className="accounts-description">
              Manage bank accounts, digital wallets, cash balances, and internal money transfers.
            </p>
          </div>

          <div className="accounts-actions">
            <button
              onClick={() => setTransferModalOpen(true)}
              className="accounts-btn-secondary"
            >
              <Repeat style={{ width: 14, height: 14, color: '#10b981' }} />
              <span>Transfer Money</span>
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="accounts-btn-primary"
            >
              <Plus style={{ width: 16, height: 16 }} />
              <span>Add Account</span>
            </button>
          </div>
        </div>

        {/* TOTAL BALANCE CARD */}
        <div className="accounts-balance-card">
          <div>
            <span className="accounts-balance-label">
              Total Net Worth Across Accounts
            </span>
            <div className="accounts-balance-value">
              {formatCurrency(totalBalance, cur, sym)}
            </div>
            <p className="accounts-balance-desc">
              Reflects all cash, bank holdings, and digital reserves.
            </p>
          </div>

          <div className="accounts-balance-tip">
            <TrendingUp style={{ width: 16, height: 16, color: '#10b981', flexShrink: 0 }} />
            <span>Balances are maintained in real-time with atomic transaction updates.</span>
          </div>
        </div>

        {/* ACCOUNTS GRID */}
        <div className="accounts-grid">
          {accounts.map((acc) => (
            <div
              key={acc._id}
              className={`account-card ${acc.isArchived ? 'account-card-archived' : ''}`}
            >
              <div>
                <div className="account-card-header">
                  <div className="account-card-brand">
                    <div
                      className="account-card-icon"
                      style={{ backgroundColor: acc.accountColor || '#10b981' }}
                    >
                      {acc.accountType === 'Cash Wallet' ? (
                        <Wallet style={{ width: 20, height: 20 }} />
                      ) : acc.accountType === 'Credit Card' ? (
                        <CreditCard style={{ width: 20, height: 20 }} />
                      ) : (
                        <Building2 style={{ width: 20, height: 20 }} />
                      )}
                    </div>
                    <div>
                      <h3 className="account-card-name">{acc.accountName}</h3>
                      <span className="account-card-type">{acc.accountType}</span>
                    </div>
                  </div>

                  {acc.isArchived && (
                    <span className="account-card-badge-archived">
                      Archived
                    </span>
                  )}
                </div>

                <div className="account-card-body">
                  <span className="account-card-balance-label">Current Balance</span>
                  <div className="account-card-balance-value">
                    {formatCurrency(acc.currentBalance, cur, sym)}
                  </div>
                  {acc.description && (
                    <p className="account-card-description">{acc.description}</p>
                  )}
                </div>
              </div>

              <div className="account-card-footer">
                <button
                  onClick={() => viewAccountHistory(acc)}
                  className="account-card-history-btn"
                >
                  <History style={{ width: 14, height: 14 }} />
                  <span>History</span>
                </button>
                <div className="account-card-actions">
                  <button
                    onClick={() => setEditAccount(acc)}
                    className="account-card-action-btn"
                    title="Edit Account"
                  >
                    <Edit2 style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* RECENT INTERNAL TRANSFERS TABLE */}
        {transfers.length > 0 && (
          <div className="accounts-transfers-card">
            <h3 className="accounts-transfers-title">Recent Internal Transfers</h3>
            <div className="accounts-transfers-list">
              {transfers.slice(0, 5).map((tr) => (
                <div key={tr._id} className="accounts-transfer-item">
                  <div className="accounts-transfer-route">
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{tr.fromAccountName}</span>
                    <ArrowRight style={{ width: 14, height: 14, color: '#94a3b8' }} />
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{tr.toAccountName}</span>
                    {tr.notes && <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>({tr.notes})</span>}
                  </div>
                  <div className="accounts-transfer-meta">
                    <span style={{ color: '#94a3b8' }}>{formatDate(tr.date)}</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(tr.amount, cur, sym)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CREATE ACCOUNT MODAL */}
      {createModalOpen && (
        <div className="accounts-modal-backdrop">
          <div className="accounts-modal">
            <div className="accounts-modal-header">
              <h3 className="accounts-modal-title">Create New Account</h3>
              <button onClick={() => setCreateModalOpen(false)} className="accounts-modal-close-btn">
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="accounts-form">
              <div className="accounts-form-group">
                <label className="accounts-form-label">Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SBI Savings, Cash Wallet, HDFC Credit"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="accounts-form-input"
                />
              </div>

              <div className="accounts-form-group">
                <label className="accounts-form-label">Account Type</label>
                <select
                  value={newAccType}
                  onChange={(e) => setNewAccType(e.target.value as AccountType)}
                  className="accounts-form-select"
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="accounts-form-group">
                <label className="accounts-form-label">Opening Balance ({sym})</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newOpeningBalance}
                  onChange={(e) => setNewOpeningBalance(e.target.value)}
                  className="accounts-form-input"
                />
              </div>

              <div className="accounts-form-group">
                <label className="accounts-form-label">Color Theme</label>
                <div className="accounts-form-colors">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewAccColor(c)}
                      className={`accounts-form-color-btn ${newAccColor === c ? 'accounts-form-color-btn-active' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="accounts-form-group">
                <label className="accounts-form-label">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Primary salary account"
                  value={newAccDesc}
                  onChange={(e) => setNewAccDesc(e.target.value)}
                  className="accounts-form-input"
                />
              </div>

              <div className="accounts-form-actions">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="transaction-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="transaction-btn-submit"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER MONEY MODAL */}
      {transferModalOpen && (
        <div className="accounts-modal-backdrop">
          <div className="accounts-modal">
            <div className="accounts-modal-header">
              <div>
                <h3 className="accounts-modal-title">Internal Money Transfer</h3>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>Zero effect on income or expenses</p>
              </div>
              <button onClick={() => setTransferModalOpen(false)} className="accounts-modal-close-btn">
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {transferError && (
              <div style={{ marginTop: 12, padding: 10, backgroundColor: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c', borderRadius: 12, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                <span>{transferError}</span>
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="accounts-form">
              <div className="accounts-form-group">
                <label className="accounts-form-label">From Account (Source)</label>
                <select
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value)}
                  className="accounts-form-select"
                >
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.accountName} ({sym}{acc.currentBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="accounts-form-group">
                <label className="accounts-form-label">To Account (Destination)</label>
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="accounts-form-select"
                >
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.accountName} ({sym}{acc.currentBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="accounts-form-group">
                <label className="accounts-form-label">Transfer Amount ({sym})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="accounts-form-input"
                  style={{ fontWeight: 700, fontSize: 15 }}
                />
              </div>

              <div className="accounts-form-group">
                <label className="accounts-form-label">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. ATM cash withdrawal, moving to savings"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="accounts-form-input"
                />
              </div>

              <div className="accounts-form-actions">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="transaction-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="transaction-btn-submit"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACCOUNT HISTORY MODAL */}
      {historyAccount && (
        <div className="accounts-modal-backdrop">
          <div className="accounts-modal accounts-modal-lg">
            <div className="accounts-modal-header">
              <div>
                <h3 className="accounts-modal-title">{historyAccount.accountName} Ledger</h3>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  Current Balance: {formatCurrency(historyAccount.currentBalance, cur, sym)}
                </span>
              </div>
              <button onClick={() => setHistoryAccount(null)} className="accounts-modal-close-btn">
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
              {historyTransactions.length === 0 ? (
                <div style={{ padding: '32px 0', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
                  No transactions for this account yet.
                </div>
              ) : (
                historyTransactions.map((tx) => (
                  <div key={tx._id} className="accounts-history-item">
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{tx.title}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                        {formatDate(tx.date)} • {tx.category}
                      </div>
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: tx.type === 'income' ? '#059669' : '#0f172a'
                      }}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount, cur, sym)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>Loading accounts...</div>}>
      <AccountsContent />
    </Suspense>
  );
}

