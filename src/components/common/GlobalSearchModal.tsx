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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            type="text"
            className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-base focus:outline-none"
            placeholder="Search transactions, accounts, categories, tags, notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200"
          >
            ESC
          </button>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="py-8 text-center text-slate-400 text-sm">
              Searching your financial workspace...
            </div>
          )}

          {!loading && query && results.transactions.length === 0 && results.accounts.length === 0 && results.categories.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-slate-500 font-medium">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-400 mt-1">Try searching with a different keyword or amount.</p>
            </div>
          )}

          {/* Transactions */}
          {results.transactions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">
                Transactions ({results.transactions.length})
              </h4>
              <div className="space-y-1">
                {results.transactions.map((tx) => (
                  <div
                    key={tx._id}
                    onClick={() => navigateTo(`/transactions?id=${tx._id}`)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {tx.type === 'income' ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">{tx.title}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <span>{tx.category}</span>
                          <span>•</span>
                          <span>{tx.account}</span>
                          <span>•</span>
                          <span>{formatDate(tx.date)}</span>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`text-sm font-bold ${
                        tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                      }`}
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
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">
                Accounts ({results.accounts.length})
              </h4>
              <div className="space-y-1">
                {results.accounts.map((acc) => (
                  <div
                    key={acc._id}
                    onClick={() => navigateTo('/accounts')}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800 text-sm">{acc.accountName}</div>
                        <div className="text-xs text-slate-400">{acc.accountType}</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-slate-700">
                      {formatCurrency(acc.currentBalance, user?.preferredCurrency, user?.currencySymbol)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {results.categories.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">
                Categories ({results.categories.length})
              </h4>
              <div className="flex flex-wrap gap-2 px-2">
                {results.categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => navigateTo(`/categories`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-medium rounded-lg transition"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>{cat.name}</span>
                    <span className="text-[10px] text-slate-400 uppercase">({cat.type})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Tip: Press ESC or click outside to close</span>
          <span className="flex items-center gap-1 font-medium text-emerald-700">
            Search across your entire ledger <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

