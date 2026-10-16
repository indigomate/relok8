import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isRequired?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      leftIcon,
      rightIcon,
      isRequired,
      className = '',
      id,
      onBlur,
      disabled,
      ...props
    },
    ref
  ) => {
    const [touched, setTouched] = useState(false);
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const hasError = Boolean(errorMessage && touched);

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true);
      if (onBlur) onBlur(e);
    };

    return (
      <div className="w-full space-y-1.5 text-left">
        {/* Label above: 13px / 500 medium, sentence case per Section 2 */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] leading-5 font-medium text-[var(--text)] normal-case"
          >
            {label}
            {isRequired && (
              <span className="text-[var(--text-3)] font-normal ml-1">
                (required)
              </span>
            )}
          </label>
        )}

        {/* Input container */}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-[var(--text-3)]">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={hasError}
            onBlur={handleBlur}
            className={`w-full h-[40px] rounded-[var(--r)] bg-[var(--surface)] text-[var(--text)] text-[15px] leading-6 placeholder:text-[var(--text-3)] border transition-[border-color,box-shadow,background-color] duration-[120ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] focus:outline-none disabled:bg-[var(--surface-2)] disabled:opacity-50 disabled:cursor-not-allowed ${
              leftIcon ? 'pl-9' : 'pl-3'
            } ${rightIcon ? 'pr-9' : 'pr-3'} ${
              hasError
                ? 'border-[var(--danger)] focus:border-[var(--danger)] focus:shadow-[0_0_0_3px_rgba(180,35,24,0.18)]'
                : 'border-[var(--border-strong)] focus:border-[var(--primary)] focus:shadow-[var(--ring)]'
            } ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 flex items-center pointer-events-none text-[var(--text-3)]">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Error message appears only after blur or submit with 16px icon */}
        {hasError ? (
          <p className="flex items-center gap-1.5 text-[13px] leading-5 text-[var(--danger)] mt-1 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </p>
        ) : helperText ? (
          /* Helper below: 13px text-3 */
          <p className="text-[13px] leading-5 text-[var(--text-3)] mt-1">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
