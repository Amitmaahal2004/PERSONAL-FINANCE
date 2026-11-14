'use client';

import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Utensils,
  Car,
  Plane,
  ShoppingBag,
  Zap,
  Home,
  HeartPulse,
  GraduationCap,
  Film,
  Wifi,
  Tv,
  Sparkles,
  Users,
  Gift,
  Briefcase,
  Laptop,
  TrendingUp,
  Percent,
  PieChart,
  Coins,
  RotateCcw,
  Wallet,
  MoreHorizontal,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ICategory, TransactionType } from '@/types';

const ICON_MAP: Record<string, any> = {
  Utensils,
  Car,
  Plane,
  ShoppingBag,
  Zap,
  Home,
  HeartPulse,
  GraduationCap,
  Film,
  Wifi,
  Tv,
  Sparkles,
  Users,
  Gift,
  Briefcase,
  Laptop,
  TrendingUp,
  Percent,
  PieChart,
  Coins,
  RotateCcw,
  Wallet,
  Tag,
  MoreHorizontal,
};

const PRESET_COLORS = ['#f97316', '#0284c7', '#06b6d4', '#ec4899', '#eab308', '#8b5cf6', '#ef4444', '#3b82f6', '#10b981', '#64748b'];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [loading, setLoading] = useState(true);

  // Modals & form state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<ICategory | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981');
  const [icon, setIcon] = useState('Tag');
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type: activeTab,
          icon,
          color,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create category.');
        return;
      }

      setCreateModalOpen(false);
      setName('');
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Error creating category.');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCategory) return;
    setError('');

    try {
      const res = await fetch(`/api/categories/${editCategory._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editCategory.name,
          icon: editCategory.icon,
          color: editCategory.color,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update category.');
        return;
      }

      setEditCategory(null);
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Error updating category.');
    }
  };

  const handleDelete = async (id: string) => {
    setError('');
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Cannot delete category.');
        return;
      }
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category.');
    }
  };

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  return (
    <DashboardLayout>
      <div className="categories">
        {/* HEADER */}
        <div className="categories-header">
          <div>
            <h1 className="categories-title">
              Categories Management
            </h1>
            <p className="categories-description">
              Customize income and expense tags, colors, and iconography.
            </p>
          </div>

          <button
            onClick={() => {
              setName('');
              setColor(PRESET_COLORS[0]);
              setIcon('Tag');
              setError('');
              setCreateModalOpen(true);
            }}
            className="categories-btn-primary"
          >
            <Plus style={{ width: 16, height: 16 }} />
            <span>New {activeTab === 'expense' ? 'Expense' : 'Income'} Category</span>
          </button>
        </div>

        {/* TAB SWITCHER */}
        <div className="categories-tabs">
          <button
            onClick={() => setActiveTab('expense')}
            className={`categories-tab-btn ${activeTab === 'expense' ? 'categories-tab-btn-active' : ''}`}
          >
            Expense Categories ({categories.filter((c) => c.type === 'expense').length})
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`categories-tab-btn ${activeTab === 'income' ? 'categories-tab-btn-active' : ''}`}
          >
            Income Categories ({categories.filter((c) => c.type === 'income').length})
          </button>
        </div>

        {/* CATEGORIES GRID */}
        {loading ? (
          <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
            Loading categories...
          </div>
        ) : (
          <div className="categories-grid">
            {filteredCategories.map((c) => {
              const IconComp = ICON_MAP[c.icon] || Tag;
              return (
                <div key={c._id} className="category-card">
                  <div className="category-card-main">
                    <div
                      className="category-card-icon"
                      style={{ backgroundColor: c.color }}
                    >
                      <IconComp style={{ width: 20, height: 20 }} />
                    </div>
                    <div className="category-card-info">
                      <h4 className="category-card-name">{c.name}</h4>
                      <span className="category-card-badge">
                        {c.isDefault ? 'Default' : 'Custom'}
                      </span>
                    </div>
                  </div>

                  <div className="category-card-actions">
                    <button
                      onClick={() => setEditCategory(c)}
                      className="category-card-btn"
                      title="Edit Category"
                    >
                      <Edit2 style={{ width: 14, height: 14 }} />
                    </button>
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="category-card-btn category-card-btn-delete"
                      title="Delete Category"
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {createModalOpen && (
        <div className="categories-modal-backdrop">
          <div className="categories-modal">
            <div className="categories-modal-header">
              <h3 className="categories-modal-title">
                Create {activeTab === 'expense' ? 'Expense' : 'Income'} Category
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="categories-modal-close-btn">
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {error && (
              <div style={{ marginTop: 12, padding: 10, backgroundColor: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c', borderRadius: 12, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="categories-form">
              <div className="categories-form-group">
                <label className="categories-form-label">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gym & Fitness, Royalties"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="categories-form-input"
                />
              </div>

              <div className="categories-form-group">
                <label className="categories-form-label">Color Accent</label>
                <div className="categories-form-colors">
                  {PRESET_COLORS.map((clr) => (
                    <button
                      key={clr}
                      type="button"
                      onClick={() => setColor(clr)}
                      className={`categories-form-color-btn ${color === clr ? 'categories-form-color-btn-active' : ''}`}
                      style={{ backgroundColor: clr }}
                    />
                  ))}
                </div>
              </div>

              <div className="categories-form-group">
                <label className="categories-form-label">Icon</label>
                <div className="categories-form-icons">
                  {Object.keys(ICON_MAP).map((icName) => {
                    const Comp = ICON_MAP[icName];
                    return (
                      <button
                        key={icName}
                        type="button"
                        onClick={() => setIcon(icName)}
                        className={`categories-form-icon-btn ${icon === icName ? 'categories-form-icon-btn-active' : ''}`}
                      >
                        <Comp style={{ width: 16, height: 16 }} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="categories-form-actions">
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
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editCategory && (
        <div className="categories-modal-backdrop">
          <div className="categories-modal">
            <div className="categories-modal-header">
              <h3 className="categories-modal-title">Edit Category</h3>
              <button onClick={() => setEditCategory(null)} className="categories-modal-close-btn">
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <form onSubmit={handleEdit} className="categories-form">
              <div className="categories-form-group">
                <label className="categories-form-label">Category Name</label>
                <input
                  type="text"
                  required
                  value={editCategory.name}
                  onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
                  className="categories-form-input"
                />
              </div>

              <div className="categories-form-group">
                <label className="categories-form-label">Color Accent</label>
                <div className="categories-form-colors">
                  {PRESET_COLORS.map((clr) => (
                    <button
                      key={clr}
                      type="button"
                      onClick={() => setEditCategory({ ...editCategory, color: clr })}
                      className={`categories-form-color-btn ${editCategory.color === clr ? 'categories-form-color-btn-active' : ''}`}
                      style={{ backgroundColor: clr }}
                    />
                  ))}
                </div>
              </div>

              <div className="categories-form-actions">
                <button
                  type="button"
                  onClick={() => setEditCategory(null)}
                  className="transaction-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="transaction-btn-submit"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

