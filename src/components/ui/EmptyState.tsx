import React from 'react';
import { classNames } from './classNames';

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div role="status" className={classNames('flex flex-col items-center justify-center text-center', compact ? 'gap-2 p-4' : 'gap-3 p-8', className)}>
      {icon && <div aria-hidden="true" className="text-slate-400">{icon}</div>}
      <div>
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        {description && <div className="mt-1 max-w-sm text-xs leading-5 text-slate-600">{description}</div>}
      </div>
      {action}
    </div>
  );
}
