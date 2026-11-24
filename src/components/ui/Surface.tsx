import React from 'react';
import { classNames } from './classNames';

export function Surface({
  as: Element = 'section',
  padding = 'md',
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section' | 'article' | 'aside';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}) {
  const paddingClass = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' }[padding];
  return (
    <Element
      className={classNames('rounded-[var(--radius-card)] border border-slate-200 bg-white', paddingClass, className)}
      {...props}
    >
      {children}
    </Element>
  );
}
