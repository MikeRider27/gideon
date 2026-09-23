import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  tone?: 'neutral' | 'good' | 'warning' | 'serious' | 'critical' | 'info';
}

const toneClasses: Record<string, string> = {
  neutral: 'bg-grid/60 dark:bg-grid-dark/60 text-ink-secondary dark:text-ink-secondary-dark',
  good: 'bg-status-good/15 text-status-good',
  warning: 'bg-status-warning/20 text-[#8a6200]',
  serious: 'bg-status-serious/20 text-[#a1461f]',
  critical: 'bg-status-critical/15 text-status-critical',
  info: 'bg-series-1/15 text-series-1',
};

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
