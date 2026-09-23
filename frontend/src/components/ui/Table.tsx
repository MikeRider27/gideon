import { ReactNode } from 'react';

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return <thead className="border-b border-grid dark:border-grid-dark text-left text-xs uppercase tracking-wide text-ink-muted">{children}</thead>;
}

export function Th({ children }: { children: ReactNode }) {
  return <th className="px-3 py-2 font-medium">{children}</th>;
}

export function Td({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}

export function Tr({ children }: { children: ReactNode }) {
  return <tr className="border-b border-grid/60 dark:border-grid-dark/60 hover:bg-plane dark:hover:bg-plane-dark">{children}</tr>;
}
