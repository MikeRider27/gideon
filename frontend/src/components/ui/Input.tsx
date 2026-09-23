import { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full rounded-md border border-grid dark:border-grid-dark bg-surface dark:bg-surface-dark px-3 py-2 text-sm text-ink-primary dark:text-ink-primary-dark placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-series-1 ${className}`}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...props }, ref) => (
    <textarea
      ref={ref}
      className={`w-full rounded-md border border-grid dark:border-grid-dark bg-surface dark:bg-surface-dark px-3 py-2 text-sm text-ink-primary dark:text-ink-primary-dark placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-series-1 ${className}`}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className="mb-1 block text-xs font-medium text-ink-secondary dark:text-ink-secondary-dark" {...props} />;
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-md border border-grid dark:border-grid-dark bg-surface dark:bg-surface-dark px-3 py-2 text-sm text-ink-primary dark:text-ink-primary-dark focus:outline-none focus:ring-2 focus:ring-series-1 ${className}`}
      {...props}
    />
  );
}
