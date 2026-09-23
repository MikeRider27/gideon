import { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-lg border border-grid dark:border-grid-dark bg-surface dark:bg-surface-dark shadow-xl">
        <div className="flex items-center justify-between border-b border-grid dark:border-grid-dark px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink-primary dark:hover:text-ink-primary-dark"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
