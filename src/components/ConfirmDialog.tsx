import { tokens } from '../lib/design-tokens';
import { Button } from './Button';

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  isOpen: boolean;
  isConfirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * In-app confirmation dialog. Screens must use this instead of `window.confirm`.
 *
 * @param title - Dialog heading
 * @param description - Consequence the user should understand before confirming
 * @param confirmLabel - Primary action label
 * @param isOpen - Whether the dialog is shown
 * @param isConfirming - Disables actions while the request is in flight
 * @param onCancel - Dismiss without changing data
 * @param onConfirm - Destructive or confirmed action
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Delete',
  isOpen,
  isConfirming = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
        style={{ borderRadius: tokens.radius.lg }}
        className="w-full max-w-md bg-white p-5 shadow-lg"
      >
        <h2 id="confirm-title" className="text-lg font-semibold text-slate-900">
          {title}
        </h2>
        <p id="confirm-description" className="mt-2 text-sm text-slate-600">
          {description}
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" disabled={isConfirming} onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" isLoading={isConfirming} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
