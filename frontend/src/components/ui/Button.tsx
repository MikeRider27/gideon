import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

const variantClasses: Record<string, string> = {
  primary: 'bg-series-1 text-white hover:opacity-90',
  secondary: 'bg-surface dark:bg-surface-dark border border-grid dark:border-grid-dark text-ink-primary dark:text-ink-primary-dark hover:bg-plane dark:hover:bg-plane-dark',
  danger: 'bg-status-critical text-white hover:opacity-90',
  ghost: 'text-ink-secondary dark:text-ink-secondary-dark hover:text-ink-primary dark:hover:text-ink-primary-dark',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className = '', ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
