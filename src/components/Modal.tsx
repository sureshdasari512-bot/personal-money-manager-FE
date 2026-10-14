import type { ReactNode } from 'react';

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
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Scrollable body */}
        <div className="overflow-y-auto px-5 pb-5">
          {children}
        </div>
      </div>
    </div>
  );
}
