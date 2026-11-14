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
    <div className="quick-add-modal-backdrop">
      <div className="quick-add-modal">
        {/* Header with Type Switcher */}
        <div className="quick-add-header">
          <div className="quick-add-type-toggle">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`quick-add-type-btn ${
                type === 'expense' ? 'quick-add-type-btn-active-expense' : ''
              }`}
            >
              <ArrowUpRight style={{ width: 14, height: 14 }} />
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`quick-add-type-btn ${
                type === 'income' ? 'quick-add-type-btn-active-income' : ''
              }`}
            >
              <ArrowDownLeft style={{ width: 14, height: 14 }} />
              Income
            </button>
          </div>

          <button
            onClick={onClose}
            className="quick-add-close-btn"
            aria-label="Close modal"
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="quick-add-form">
          {error && (
            <div className="quick-add-alert-error">
              <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Amount input */}
          <div className="quick-add-form-group">
            <label className="quick-add-form-label">
              Amount ({user?.currencySymbol || '₹'})
            </label>
            <div className="quick-add-amount-wrapper">
              <span className="quick-add-amount-symbol">
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
                className="quick-add-amount-input"
                autoFocus
              />
            </div>
          </div>

          {/* Title */}
          <div className="quick-add-form-group">
            <label className="quick-add-form-label">
              Description / Title
            </label>
            <input
              type="text"
              required
              placeholder={type === 'expense' ? 'e.g. Grocery store, Uber ride' : 'e.g. November Salary, Client project'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="quick-add-form-input"
            />
          </div>

          {/* Quick Category Selector */}
          <div className="quick-add-form-group">
            <label className="quick-add-form-label">
              Category
            </label>
            {topCategories.length > 0 && (
              <div className="quick-add-categories-pills">
                {topCategories.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => {
                      setCategory(c.name);
                      setCategoryId(c._id);
                    }}
                    className={`quick-add-category-pill ${
                      category === c.name ? 'quick-add-category-pill-active' : ''
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
              className="quick-add-form-select"
            >
              {categories.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account & Date row */}
          <div className="quick-add-form-row">
            <div className="quick-add-form-group">
              <label className="quick-add-form-label">
                Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="quick-add-form-select"
              >
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.accountName} ({user?.currencySymbol || '₹'}{acc.currentBalance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="quick-add-form-group">
              <label className="quick-add-form-label">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="quick-add-form-input"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="quick-add-form-group">
            <label className="quick-add-form-label">
              Payment Method
            </label>
            <div className="quick-add-methods-list">
              {['UPI', 'Cash', 'Credit Card', 'Debit Card', 'Net Banking'].map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`quick-add-method-btn ${
                    paymentMethod === m ? 'quick-add-method-btn-active' : ''
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Notes & Tags */}
          <div className="quick-add-form-row">
            <div className="quick-add-form-group">
              <label className="quick-add-form-label">
                Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="Additional details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="quick-add-form-input"
              />
            </div>
            <div className="quick-add-form-group">
              <label className="quick-add-form-label">
                Tags (Comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. food, vacation, work"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="quick-add-form-input"
              />
            </div>
          </div>

          {/* Receipt Attachment */}
          <div className="quick-add-form-group">
            <label className="quick-add-form-label">
              Receipt / Bill Attachment (Optional)
            </label>
            {receiptUrl ? (
              <div className="quick-add-receipt-preview">
                <span className="quick-add-receipt-name">{receiptName || 'Receipt Attached'}</span>
                <button
                  type="button"
                  onClick={() => {
                    setReceiptUrl('');
                    setReceiptName('');
                  }}
                  className="quick-add-receipt-remove-btn"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="quick-add-receipt-upload-box">
                <Upload style={{ width: 16, height: 16 }} />
                <span>{uploadingReceipt ? 'Uploading...' : 'Attach Image or PDF Receipt'}</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  style={{ display: 'none' }}
                  onChange={handleReceiptUpload}
                  disabled={uploadingReceipt}
                />
              </label>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ paddingTop: 8 }}>
            <button
              type="submit"
              disabled={loading}
              className={`quick-add-btn-submit ${
                type === 'expense'
                  ? 'quick-add-btn-submit-expense'
                  : 'quick-add-btn-submit-income'
              }`}
            >
              {loading ? (
                <span>Recording...</span>
              ) : (
                <>
                  <Check style={{ width: 16, height: 16 }} />
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

