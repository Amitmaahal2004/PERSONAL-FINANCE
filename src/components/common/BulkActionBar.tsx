'use client';

import React, { useState } from 'react';
import { Trash2, RotateCcw, Download, X, AlertTriangle, CheckSquare, Loader2 } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  totalPageCount?: number;
  allSelectedOnPage?: boolean;
  onSelectAllPage?: () => void;
  onClearSelection: () => void;
  // Standard action props
  onMoveToTrash?: () => Promise<void> | void;
  onExportCsv?: () => void;
  // Trash-specific action props
  isTrashMode?: boolean;
  onRestoreSelected?: () => Promise<void> | void;
  onPermanentDeleteSelected?: () => Promise<void> | void;
  onEmptyTrash?: () => Promise<void> | void;
}

export default function BulkActionBar({
  selectedCount,
  totalPageCount = 0,
  allSelectedOnPage = false,
  onSelectAllPage,
  onClearSelection,
  onMoveToTrash,
  onExportCsv,
  isTrashMode = false,
  onRestoreSelected,
  onPermanentDeleteSelected,
  onEmptyTrash,
}: BulkActionBarProps) {
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'trash' | 'restore' | 'permanent' | 'empty';
    title: string;
    description: string;
  }>({
    isOpen: false,
    type: 'trash',
    title: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);

  if (selectedCount === 0 && !isTrashMode) return null;

  const handleAction = async () => {
    setLoading(true);
    try {
      if (confirmModal.type === 'trash' && onMoveToTrash) {
        await onMoveToTrash();
      } else if (confirmModal.type === 'restore' && onRestoreSelected) {
        await onRestoreSelected();
      } else if (confirmModal.type === 'permanent' && onPermanentDeleteSelected) {
        await onPermanentDeleteSelected();
      } else if (confirmModal.type === 'empty' && onEmptyTrash) {
        await onEmptyTrash();
      }
      setConfirmModal({ isOpen: false, type: 'trash', title: '', description: '' });
    } catch (err) {
      console.error('Bulk action error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toolbar */}
      {selectedCount > 0 ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-2xl bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Left: Selected count and select-all/clear */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-1 rounded-full text-xs sm:text-sm border border-emerald-500/30">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <span>{selectedCount} selected</span>
            </div>

            {onSelectAllPage && totalPageCount > 0 && (
              <button
                type="button"
                onClick={onSelectAllPage}
                className="text-xs text-slate-300 hover:text-white underline underline-offset-2 transition-colors hidden sm:inline"
              >
                {allSelectedOnPage ? 'Deselect page' : `Select all ${totalPageCount} on page`}
              </button>
            )}

            <button
              type="button"
              onClick={onClearSelection}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Clear</span>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {!isTrashMode ? (
              <>
                {onExportCsv && (
                  <button
                    type="button"
                    onClick={onExportCsv}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium rounded-xl border border-slate-600 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                )}

                {onMoveToTrash && (
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmModal({
                        isOpen: true,
                        type: 'trash',
                        title: 'Move Selected to Trash',
                        description: `Are you sure you want to move ${selectedCount} selected record(s) to the Recycle Bin? You can restore them anytime from the Recycle Bin.`,
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-medium rounded-xl transition-colors shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Move to Trash</span>
                  </button>
                )}
              </>
            ) : (
              <>
                {onRestoreSelected && (
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmModal({
                        isOpen: true,
                        type: 'restore',
                        title: 'Restore Selected Records',
                        description: `Restore ${selectedCount} selected record(s) back to their original module? Account balance adjustments will be safely reapplied.`,
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium rounded-xl transition-colors shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore ({selectedCount})</span>
                  </button>
                )}

                {onPermanentDeleteSelected && (
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmModal({
                        isOpen: true,
                        type: 'permanent',
                        title: 'Permanently Delete Selected Records',
                        description: `WARNING: This action CANNOT be undone. ${selectedCount} selected record(s) will be permanently erased from MongoDB.`,
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-medium rounded-xl transition-colors shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Forever</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-full flex-shrink-0 ${
                  confirmModal.type === 'permanent' || confirmModal.type === 'empty'
                    ? 'bg-rose-100 text-rose-600'
                    : confirmModal.type === 'trash'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-emerald-100 text-emerald-600'
                }`}
              >
                {confirmModal.type === 'permanent' || confirmModal.type === 'empty' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : confirmModal.type === 'trash' ? (
                  <Trash2 className="w-6 h-6" />
                ) : (
                  <RotateCcw className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">{confirmModal.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{confirmModal.description}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => setConfirmModal({ isOpen: false, type: 'trash', title: '', description: '' })}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleAction}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl text-white transition-colors shadow-sm disabled:opacity-50 ${
                  confirmModal.type === 'permanent' || confirmModal.type === 'empty'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : confirmModal.type === 'trash'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>
                  {confirmModal.type === 'permanent'
                    ? 'Permanently Delete'
                    : confirmModal.type === 'empty'
                    ? 'Empty Recycle Bin'
                    : confirmModal.type === 'trash'
                    ? 'Move to Trash'
                    : 'Restore Records'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

