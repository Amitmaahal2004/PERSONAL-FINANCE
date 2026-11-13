'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Upload, Check, AlertCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { IAccount, ICategory } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { toInputDateFormat } from '@/lib/utils';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultType?: 'expense' | 'income';
}

export default function QuickAddModal({
  isOpen,
  onClose,
  onSuccess,
  defaultType = 'expense',
}: QuickAddModalProps) {
  const { user } = useAuth();
  const [type, setType] = useState<'expense' | 'income'>(defaultType);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(toInputDateFormat(new Date()));
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptName, setReceiptName] = useState('');

  const [accounts, setAccounts] = useState<IAccount[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setType(defaultType);
  }, [defaultType, isOpen]);

  // Load accounts and categories
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        const [accRes, catRes] = await Promise.all([
          fetch('/api/accounts'),
          fetch(`/api/categories?type=${type}`),
        ]);

        if (accRes.ok) {
          const accData = await accRes.json();
          setAccounts(accData.accounts || []);
          if (accData.accounts?.length > 0 && !accountId) {
            setAccountId(accData.accounts[0]._id);
          }
        }

        if (catRes.ok) {
          const catData = await catRes.json();
          const cats: ICategory[] = catData.categories || [];
          setCategories(cats);
          if (cats.length > 0) {
            setCategory(cats[0].name);
            setCategoryId(cats[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load accounts/categories', err);
      }
    };

    loadData();
  }, [isOpen, type]);

  if (!isOpen) return null;

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB.');
      return;
    }

    setUploadingReceipt(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileData: base64Data,
            fileName: file.name,
            fileType: file.type,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setReceiptUrl(data.url);
          setReceiptName(data.fileName);
        } else {
          setError(data.error || 'Failed to upload receipt.');
        }
        setUploadingReceipt(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setError('Receipt upload failed.');
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title / description.');
      return;
    }

    if (!accountId) {
      setError('Please select an account.');
      return;
    }

    if (!category) {
      setError('Please select a category.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          amount: parseFloat(amount),
          type,
          category,
          categoryId: categoryId || undefined,
          accountId,
          date,
          paymentMethod,
          notes: notes.trim(),
          tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
          receiptUrl: receiptUrl || undefined,
          receiptName: receiptName || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save transaction.');
        setLoading(false);
        return;
      }

      // Reset form
      setTitle('');
      setAmount('');
      setNotes('');
      setTags('');
      setReceiptUrl('');
      setReceiptName('');
      setLoading(false);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error recording transaction.');
      setLoading(false);
    }
  };

  // Top frequent categories pills for quick 1-tap select
  const topCategories = categories.slice(0, 6);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with Type Switcher */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Income
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount input */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Amount ({user?.currencySymbol || '₹'})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">
                {user?.currencySymbol || '₹'}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-2xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                autoFocus
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Description / Title
            </label>
            <input
              type="text"
              required
              placeholder={type === 'expense' ? 'e.g. Grocery store, Uber ride' : 'e.g. November Salary, Client project'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Quick Category Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Category
            </label>
            {topCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {topCategories.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => {
                      setCategory(c.name);
                      setCategoryId(c._id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
                      category === c.name
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            )}
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                const found = categories.find((c) => c.name === e.target.value);
                if (found) setCategoryId(found._id);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {categories.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account & Date row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.accountName} ({user?.currencySymbol || '₹'}{acc.currentBalance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Payment Method
            </label>
            <div className="flex flex-wrap gap-2">
              {['UPI', 'Cash', 'Credit Card', 'Debit Card', 'Net Banking'].map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    paymentMethod === m
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Notes & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="Additional details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Tags (Comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. food, vacation, work"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Receipt Attachment */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Receipt / Bill Attachment (Optional)
            </label>
            {receiptUrl ? (
              <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                <span className="font-medium truncate max-w-[200px]">{receiptName || 'Receipt Attached'}</span>
                <button
                  type="button"
                  onClick={() => {
                    setReceiptUrl('');
                    setReceiptName('');
                  }}
                  className="text-emerald-700 hover:text-rose-600 text-xs font-semibold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl cursor-pointer text-xs text-slate-600 hover:text-emerald-700 transition">
                <Upload className="w-4 h-4" />
                <span>{uploadingReceipt ? 'Uploading...' : 'Attach Image or PDF Receipt'}</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleReceiptUpload}
                  disabled={uploadingReceipt}
                />
              </label>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold text-white transition flex items-center justify-center gap-2 shadow-md ${
                type === 'expense'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {loading ? (
                <span>Recording...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save {type === 'expense' ? 'Expense' : 'Income'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

