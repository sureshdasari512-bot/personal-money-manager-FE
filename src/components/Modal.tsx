import type { ReactNode } from 'react';
import { Button } from './Button';

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Shared dialog wrapper with a visible close control and keyboard-friendly button.
 *
 * @param title - Dialog heading
 * @param isOpen - Whether the dialog is shown
 * @param onClose - Close handler
 * @param children - Dialog body
 */
export function Modal({ title, isOpen, onClose, children }: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="flex w-full max-w-md flex-col rounded-2xl bg-white shadow-lg"
        style={{ maxHeight: 'calc(100dvh - 2rem)' }}
      >
        {/* Sticky header */}
        <div className="flex shrink-0 items-center justify-between px-5 pt-5 pb-4">
          <h2 id="modal-title" className="text-lg font-semibold">
            {title}
          </h2>
          <Button variant="ghost" onClick={onClose} aria-label="Close dialog">
            Close
          </Button>
        </div>
        {/* Scrollable body */}
        <div className="overflow-y-auto px-5 pb-5">
          {children}
        </div>
      </div>
    </div>
  );
}
