import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  radius?: 'sm' | 'default' | 'lg' | 'pill' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  radius = 'default',
  className = '',
  style,
  ...props
}) => {
  const radiusClasses = {
    sm: 'rounded-[var(--r-sm)]',
    default: 'rounded-[var(--r)]',
    lg: 'rounded-[var(--r-lg)]',
    pill: 'rounded-[var(--r-pill)]',
    none: 'rounded-none',
  }[radius];

  const inlineStyles: React.CSSProperties = {
    ...style,
    width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  // Spec: --surface-2 blocks with a 1.4s shimmer; same dimensions as the real content
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden bg-[var(--surface-2)] ${radiusClasses} ${className}`}
      style={inlineStyles}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer" />
    </div>
  );
};
