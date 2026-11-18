import React from 'react';

export const Relok8Logo: React.FC<{
  height?: number;
  theme?: 'dark' | 'light';
  className?: string;
}> = ({ height = 30, theme = 'light', className = '' }) => {
  const textColor = theme === 'dark' ? '#F8FAFC' : '#0F172A';
  const width = Math.round((height / 32) * 88);
  const gradId = theme === 'dark' ? 'r8-logo-grad-dark' : 'r8-logo-grad-light';

  return (
    <div className={`flex items-center select-none ${className}`} style={{ height: `${height}px` }}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 88 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-auto h-full"
        aria-label="Relok8"
      >
        <defs>
          <linearGradient id={gradId} x1="68" y1="4" x2="86" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="60%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#FF6B5B" />
          </linearGradient>
        </defs>
        <text
          x="0"
          y="24"
          fontFamily="'Plus Jakarta Sans', Inter, -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="26"
          fontWeight="700"
          letterSpacing="-0.035em"
          fill={textColor}
        >
          Relok
        </text>
        <path
          d="M77 16 C73.5 16 70.5 13.5 70.5 9.8 C70.5 6.2 73.4 3.5 77 3.5 C80.6 3.5 83.5 6.2 83.5 9.8 C83.5 13.5 80.5 16 77 16 Z M77 16 C80.5 16 84 18.5 84 22.2 C84 25.8 80.8 28.5 77 28.5 C73.2 28.5 70 25.8 70 22.2 C70 18.5 73.5 16 77 16 Z"
          stroke={`url(#${gradId})`}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
