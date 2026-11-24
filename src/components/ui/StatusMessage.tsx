import React from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { classNames } from './classNames';

type StatusTone = 'success' | 'error' | 'warning' | 'info';

const toneClasses: Record<StatusTone, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  error: 'border-red-200 bg-red-50 text-red-950',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  info: 'border-indigo-200 bg-indigo-50 text-indigo-950',
};

const iconClasses: Record<StatusTone, string> = {
  success: 'text-emerald-700',
  error: 'text-red-700',
  warning: 'text-amber-700',
  info: 'text-indigo-700',
};

const icons: Record<StatusTone, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5" />,
  error: <AlertCircle className="h-5 w-5" />,
  warning: <TriangleAlert className="h-5 w-5" />,
  info: <Info className="h-5 w-5" />,
};

export function StatusMessage({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: StatusTone;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const isError = tone === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={classNames(
        'flex items-start gap-3 rounded-[var(--radius-control)] border p-4 text-sm leading-5',
        toneClasses[tone],
        className,
      )}
    >
      <span aria-hidden="true" className={classNames('mt-0.5 shrink-0', iconClasses[tone])}>
        {icons[tone]}
      </span>
      <div className="min-w-0">
        {title && <div className="font-semibold">{title}</div>}
        <div className={classNames(title && 'mt-0.5')}>{children}</div>
      </div>
    </div>
  );
}
