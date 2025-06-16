import React from 'react';

export default function ConfirmModal({
  open,
  onConfirm,
  onCancel,
  futureStatus,
  title = 'Confirm',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  futureStatus?: 'enabled' | 'disabled' | null;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <p className="mb-6">{message}</p>
        {futureStatus && (
          <div className="mb-4 text-center text-sm">
            The agent will be{' '}
            <span
              className={
                futureStatus === 'enabled' ? 'text-green-500' : 'text-red-500'
              }
            >
              {futureStatus}
            </span>
            .
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-muted text-foreground hover:bg-muted-foreground/10"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
} 