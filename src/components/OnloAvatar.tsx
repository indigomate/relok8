import React, { useState } from 'react';

interface OnloAvatarProps {
  className?: string;
  size?: number | string;
  variant?: 'avatar' | 'icon' | 'mono';
}

export const OnloAvatar: React.FC<OnloAvatarProps> = ({
  className = '',
  size = 24,
  variant = 'icon'
}) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;
  const [useFallback, setUseFallback] = useState(false);

  if (variant === 'avatar') {
    if (!useFallback) {
      return (
        <img
          src="/onlo.png"
          alt="Onlo AI"
          style={{ width: pixelSize, height: pixelSize }}
          className={`inline-block shrink-0 rounded-[24%] shadow-xs select-none object-contain ${className}`}
          onError={() => setUseFallback(true)}
        />
      );
    }
    return (
      <div 
        style={{ width: pixelSize, height: pixelSize }} 
        className={`inline-flex items-center justify-center shrink-0 rounded-[24%] bg-[#0b101d] p-[10%] shadow-xs select-none ${className}`}
        aria-label="Onlo AI"
      >
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <path 
            d="M50 14 C29.5 14 14 29.5 14 50 C14 58.2 16.7 65.8 21.3 72 L16 86 L30.2 80.8 C36.1 84.7 42.8 86 50 86 C70.5 86 86 70.5 86 50 C86 29.5 70.5 14 50 14 Z" 
            stroke="#766bf5" 
            strokeWidth="9" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="#0b101d"
          />
          <rect x="38" y="40" width="8.5" height="18" rx="4.25" fill="#ff6454" />
          <rect x="53.5" y="40" width="8.5" height="18" rx="4.25" fill="#ff6454" />
        </svg>
      </div>
    );
  }

  if (variant === 'mono') {
    return (
      <svg 
        style={{ width: pixelSize, height: pixelSize }}
        viewBox="0 0 100 100" 
        fill="none" 
        className={`inline-block shrink-0 select-none ${className}`}
        aria-label="Onlo AI"
      >
        <path 
          d="M50 14 C29.5 14 14 29.5 14 50 C14 58.2 16.7 65.8 21.3 72 L16 86 L30.2 80.8 C36.1 84.7 42.8 86 50 86 C70.5 86 86 70.5 86 50 C86 29.5 70.5 14 50 14 Z" 
          stroke="currentColor" 
          strokeWidth="9" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <rect x="38" y="40" width="8.5" height="18" rx="4.25" fill="currentColor" />
        <rect x="53.5" y="40" width="8.5" height="18" rx="4.25" fill="currentColor" />
      </svg>
    );
  }

  // Default: color icon
  return (
    <svg 
      style={{ width: pixelSize, height: pixelSize }}
      viewBox="0 0 100 100" 
      fill="none" 
      className={`inline-block shrink-0 select-none ${className}`}
      aria-label="Onlo AI"
    >
      <path 
        d="M50 14 C29.5 14 14 29.5 14 50 C14 58.2 16.7 65.8 21.3 72 L16 86 L30.2 80.8 C36.1 84.7 42.8 86 50 86 C70.5 86 86 70.5 86 50 C86 29.5 70.5 14 50 14 Z" 
        stroke="#766bf5" 
        strokeWidth="9" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="#0b101d"
      />
      <rect x="38" y="40" width="8.5" height="18" rx="4.25" fill="#ff6454" />
      <rect x="53.5" y="40" width="8.5" height="18" rx="4.25" fill="#ff6454" />
    </svg>
  );
};
