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
        <div className="bulk-actions-bar">
          {/* Left: Selected count and select-all/clear */}
          <div className="bulk-actions-info">
            <div className="bulk-actions-count-badge">
              <CheckSquare style={{ width: 14, height: 14 }} />
              <span>{selectedCount} selected</span>
            </div>

            {onSelectAllPage && totalPageCount > 0 && (
              <button
                type="button"
                onClick={onSelectAllPage}
                className="bulk-actions-select-btn"
              >
                {allSelectedOnPage ? 'Deselect page' : `Select all ${totalPageCount} on page`}
              </button>
            )}

            <button
              type="button"
              onClick={onClearSelection}
              className="bulk-actions-clear-btn"
              title="Clear selection"
            >
              <X style={{ width: 14, height: 14 }} />
              <span>Clear</span>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="bulk-actions-group">
            {!isTrashMode ? (
              <>
                {onExportCsv && (
                  <button
                    type="button"
                    onClick={onExportCsv}
                    className="bulk-actions-btn bulk-actions-btn-export"
                  >
                    <Download style={{ width: 14, height: 14 }} />
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
                    className="bulk-actions-btn bulk-actions-btn-trash"
                  >
                    <Trash2 style={{ width: 14, height: 14 }} />
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
                    className="bulk-actions-btn bulk-actions-btn-restore"
                  >
                    <RotateCcw style={{ width: 14, height: 14 }} />
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
                    className="bulk-actions-btn bulk-actions-btn-danger"
                  >
                    <Trash2 style={{ width: 14, height: 14 }} />
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
        <div className="bulk-actions-modal-backdrop">
          <div className="bulk-actions-modal">
            <div className="bulk-actions-modal-body">
              <div
                className={`bulk-actions-modal-icon ${
                  confirmModal.type === 'permanent' || confirmModal.type === 'empty'
                    ? 'bulk-actions-modal-icon-rose'
                    : confirmModal.type === 'trash'
                    ? 'bulk-actions-modal-icon-amber'
                    : 'bulk-actions-modal-icon-emerald'
                }`}
              >
                {confirmModal.type === 'permanent' || confirmModal.type === 'empty' ? (
                  <AlertTriangle style={{ width: 24, height: 24 }} />
                ) : confirmModal.type === 'trash' ? (
                  <Trash2 style={{ width: 24, height: 24 }} />
                ) : (
                  <RotateCcw style={{ width: 24, height: 24 }} />
                )}
              </div>
              <div>
                <h3 className="bulk-actions-modal-title">{confirmModal.title}</h3>
                <p className="bulk-actions-modal-text">{confirmModal.description}</p>
              </div>
            </div>

            <div className="bulk-actions-modal-actions">
              <button
                type="button"
                disabled={loading}
                onClick={() => setConfirmModal({ isOpen: false, type: 'trash', title: '', description: '' })}
                className="transaction-btn-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleAction}
                className={
                  confirmModal.type === 'permanent' || confirmModal.type === 'empty'
                    ? 'transaction-btn-danger'
                    : 'transaction-btn-submit'
                }
              >
                {loading && <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />}
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

