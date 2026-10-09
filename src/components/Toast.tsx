import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  duration = 4000,
  onClose,
  actionLabel,
  onAction,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!isVisible) return null;

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="w-4 h-4 text-[var(--success)] shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-[var(--danger)] shrink-0" />,
    info: <Info className="w-4 h-4 text-[var(--primary)] shrink-0" />,
  };

  // Spec: Bottom-center, white card, --shadow-pop, max 2 lines, 4s, slides up 8px with fade.
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[420px] w-[calc(100%-32px)] bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-[var(--r-lg)] shadow-[var(--shadow-pop)] p-3.5 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-[180ms] ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icons[type]}
        <p className="text-[13px] leading-5 font-medium line-clamp-2 select-text">
          {message}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="text-[13px] font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors cursor-pointer px-1 py-0.5 rounded"
          >
            {actionLabel}
          </button>
        )}

        {onClose && (
          <button
            type="button"
            onClick={() => {
              setIsVisible(false);
              onClose();
            }}
            aria-label="Close notification"
            className="p-1 rounded-[var(--r-sm)] text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
