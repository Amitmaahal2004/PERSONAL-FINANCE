'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowRight, Wallet, Tag, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    transactions: any[];
    accounts: any[];
    categories: any[];
  }>({
    transactions: [],
    accounts: [],
    categories: [],
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ transactions: [], accounts: [], categories: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const navigateTo = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <div className="global-search-backdrop">
      <div className="global-search-modal">
        {/* Search Input */}
        <div className="global-search-input-wrapper">
          <Search className="global-search-icon" />
          <input
            type="text"
            className="global-search-input"
            placeholder="Search transactions, accounts, categories, tags, notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="global-search-clear-btn"
              aria-label="Clear search"
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          )}
          <button
            onClick={onClose}
            className="global-search-esc-badge"
          >
            ESC
          </button>
        </div>

        {/* Search Results */}
        <div className="global-search-content">
          {loading && (
            <div className="global-search-loading">
              Searching your financial workspace...
            </div>
          )}

          {!loading && query && results.transactions.length === 0 && results.accounts.length === 0 && results.categories.length === 0 && (
            <div className="global-search-empty">
              <p style={{ fontWeight: 600, color: '#64748b' }}>No results found for &ldquo;{query}&rdquo;</p>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Try searching with a different keyword or amount.</p>
            </div>
          )}

          {/* Transactions */}
          {results.transactions.length > 0 && (
            <div className="global-search-group">
              <h4 className="global-search-group-title">
                Transactions ({results.transactions.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {results.transactions.map((tx) => (
                  <div
                    key={tx._id}
                    onClick={() => navigateTo(`/transactions?id=${tx._id}`)}
                    className="global-search-item"
                  >
                    <div className="global-search-item-info">
                      <div
                        className={`global-search-item-icon ${
                          tx.type === 'income' ? 'global-search-item-icon-income' : 'global-search-item-icon-expense'
                        }`}
                      >
                        {tx.type === 'income' ? (
                          <ArrowDownLeft style={{ width: 16, height: 16 }} />
                        ) : (
                          <ArrowUpRight style={{ width: 16, height: 16 }} />
                        )}
                      </div>
                      <div>
                        <div className="global-search-item-title">{tx.title}</div>
                        <div className="global-search-item-sub">
                          <span>{tx.category}</span>
                          <span> • </span>
                          <span>{tx.account}</span>
                          <span> • </span>
                          <span>{formatDate(tx.date)}</span>
                        </div>
                      </div>
                    </div>
                    <div
                      className="global-search-item-amount"
                      style={{ color: tx.type === 'income' ? '#059669' : '#0f172a' }}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatCurrency(tx.amount, user?.preferredCurrency, user?.currencySymbol)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accounts */}
          {results.accounts.length > 0 && (
            <div className="global-search-group">
              <h4 className="global-search-group-title">
                Accounts ({results.accounts.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {results.accounts.map((acc) => (
                  <div
                    key={acc._id}
                    onClick={() => navigateTo('/accounts')}
                    className="global-search-item"
                  >
                    <div className="global-search-item-info">
                      <div className="global-search-item-icon global-search-item-icon-income">
                        <Wallet style={{ width: 16, height: 16 }} />
                      </div>
                      <div>
                        <div className="global-search-item-title">{acc.accountName}</div>
                        <div className="global-search-item-sub">{acc.accountType}</div>
                      </div>
                    </div>
                    <div className="global-search-item-amount">
                      {formatCurrency(acc.currentBalance, user?.preferredCurrency, user?.currencySymbol)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {results.categories.length > 0 && (
            <div className="global-search-group">
              <h4 className="global-search-group-title">
                Categories ({results.categories.length})
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0 8px' }}>
                {results.categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => navigateTo(`/categories`)}
                    className="quick-add-category-pill"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px' }}
                  >
                    <Tag style={{ width: 14, height: 14 }} />
                    <span>{cat.name}</span>
                    <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>({cat.type})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="global-search-footer">
          <span>Tip: Press ESC or click outside to close</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#047857', fontWeight: 600 }}>
            Search across your entire ledger <ArrowRight style={{ width: 12, height: 12 }} />
          </span>
        </div>
      </div>
    </div>
  );
}

