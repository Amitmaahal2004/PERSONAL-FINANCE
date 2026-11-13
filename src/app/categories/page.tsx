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
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Categories Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
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
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New {activeTab === 'expense' ? 'Expense' : 'Income'} Category</span>
          </button>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-72">
          <button
            onClick={() => setActiveTab('expense')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${activeTab === 'expense' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            Expense Categories ({categories.filter((c) => c.type === 'expense').length})
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${activeTab === 'income' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            Income Categories ({categories.filter((c) => c.type === 'income').length})
          </button>
        </div>

        {/* CATEGORIES GRID */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading categories...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredCategories.map((c) => {
              const IconComp = ICON_MAP[c.icon] || Tag;
              return (
                <div
                  key={c._id}
                  className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-subtle hover:shadow-card transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: c.color }}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        {c.isDefault ? 'Default' : 'Custom'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400">
                    <button
                      onClick={() => setEditCategory(c)}
                      className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                Create {activeTab === 'expense' ? 'Expense' : 'Income'} Category
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gym & Fitness, Royalties"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Color Accent</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((clr) => (
                    <button
                      key={clr}
                      type="button"
                      onClick={() => setColor(clr)}
                      className={`w-7 h-7 rounded-full border-2 ${color === clr ? 'border-slate-900 scale-110' : 'border-transparent'
                        }`}
                      style={{ backgroundColor: clr }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Icon</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
                  {Object.keys(ICON_MAP).map((icName) => {
                    const Comp = ICON_MAP[icName];
                    return (
                      <button
                        key={icName}
                        type="button"
                        onClick={() => setIcon(icName)}
                        className={`p-2 rounded-lg border transition ${icon === icName
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                      >
                        <Comp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Edit Category</h3>
              <button onClick={() => setEditCategory(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={editCategory.name}
                  onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Color Accent</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((clr) => (
                    <button
                      key={clr}
                      type="button"
                      onClick={() => setEditCategory({ ...editCategory, color: clr })}
                      className={`w-7 h-7 rounded-full border-2 ${editCategory.color === clr ? 'border-slate-900 scale-110' : 'border-transparent'
                        }`}
                      style={{ backgroundColor: clr }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditCategory(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md"
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

