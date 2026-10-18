import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  as?: React.ElementType;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  hoverable = false,
  as: Component = 'div',
  children,
  className = '',
  ...props
}) => {
  // Card spec per Section 2: --surface, 1px --border, radius 12, no shadow at rest.
  return (
    <Component
      className={`bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-lg)] transition-[border-color,box-shadow,transform] duration-[180ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
        hoverable
          ? 'hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-pop)] hover:-translate-y-0.5 cursor-pointer'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};
