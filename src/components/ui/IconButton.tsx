import React from 'react';
import { classNames } from './classNames';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: 'sm' | 'md';
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({
  label,
  size = 'md',
  className,
  children,
  type = 'button',
  ...props
}, ref) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={classNames(
        'inline-flex shrink-0 items-center justify-center rounded-full text-slate-700 transition-colors',
        'hover:bg-slate-100 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'min-h-10 min-w-10' : 'min-h-11 min-w-11',
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="inline-flex items-center justify-center gap-1">{children}</span>
    </button>
  );
});
