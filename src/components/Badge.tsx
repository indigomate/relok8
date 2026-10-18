import React from 'react';

export type BadgeVariant = 'neutral' | 'success' | 'info' | 'warning' | 'danger';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  icon,
  children,
  className = '',
  ...props
}) => {
  // Styles per Section 2: One style family, 24px high, pill radius, 12/16 medium, sentence case
  const variantStyles: Record<BadgeVariant, string> = {
    neutral:
      'bg-[var(--surface-2)] text-[var(--text-2)] border border-transparent',
    success:
      'bg-[var(--success-soft)] text-[var(--success)] border border-transparent',
    info:
      'bg-[var(--primary-soft)] text-[var(--primary)] border border-transparent',
    warning:
      'bg-[var(--warning-soft)] text-[var(--warning)] border border-transparent',
    danger:
      'bg-[var(--danger-soft)] text-[var(--danger)] border border-transparent',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-[var(--r-pill)] text-[12px] leading-4 font-medium normal-case select-none shrink-0 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0 w-3.5 h-3.5 items-center justify-center">{icon}</span>}
      <span className="truncate">{children}</span>
    </span>
  );
};

// Chip is an alias conforming to the same specification
export const Chip = Badge;
