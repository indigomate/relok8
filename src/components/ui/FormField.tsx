import React from 'react';
import { classNames } from './classNames';

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  required = false,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const detailId = `${htmlFor}-${error ? 'error' : 'hint'}`;
  const control = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
        'aria-describedby': error || hint ? detailId : undefined,
        'aria-invalid': error ? true : undefined,
      })
    : children;
  return (
    <div className={classNames('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-800">
        {label}{required && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}
        {required && <span className="sr-only"> required</span>}
      </label>
      {control}
      {(error || hint) && (
        <div id={detailId} className={classNames('text-xs leading-5', error ? 'text-red-700' : 'text-slate-600')} role={error ? 'alert' : undefined}>
          {error || hint}
        </div>
      )}
    </div>
  );
}
