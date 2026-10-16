import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'default' | 'large' | 'small';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'default',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    // Size variants per Section 2
    const sizeClasses = {
      default: 'h-[36px] px-3.5 text-[14px]',
      large: 'h-[40px] px-4 text-[15px]',
      small: 'h-[32px] px-2.5 text-[13px]',
    }[size];

    // Style variants per Section 2
    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] active:scale-[0.98] border border-transparent shadow-xs',
      secondary:
        'bg-[var(--surface)] text-[var(--text)] border border-[var(--border-strong)] hover:bg-[var(--surface-2)] active:scale-[0.98]',
      ghost:
        'bg-transparent text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] active:scale-[0.98] border border-transparent',
      danger:
        'bg-[var(--danger)] text-white hover:bg-[#991B1B] active:scale-[0.98] border border-transparent shadow-xs',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        className={`inline-flex items-center justify-center gap-2 rounded-[var(--r)] font-medium transition-[background-color,border-color,color,transform,opacity,box-shadow] duration-[120ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[var(--ring)] disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none whitespace-nowrap ${sizeClasses} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {/* Loading Spinner replaces left icon or shows on left */}
        {isLoading ? (
          <svg
            className="w-4 h-4 animate-spin shrink-0 text-current opacity-90"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}

        {/* Label stays visible during loading */}
        <span>{children}</span>

        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
