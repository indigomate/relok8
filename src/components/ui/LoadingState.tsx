import { LoaderCircle } from 'lucide-react';
import { classNames } from './classNames';

export function LoadingState({
  label,
  compact = false,
  className,
}: {
  label: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={classNames(
        'flex items-center justify-center gap-2 text-slate-600',
        compact ? 'p-3 text-xs' : 'p-8 text-sm',
        className,
      )}
    >
      <LoaderCircle
        aria-hidden="true"
        className="h-5 w-5 animate-spin motion-reduce:animate-none"
      />
      <span>{label}</span>
    </div>
  );
}
