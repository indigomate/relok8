import React from 'react';

export const HeroLoopIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 440 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="hero-loop-grad"
          x1="20"
          y1="40"
          x2="420"
          y2="240"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="55%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#FF6B5B" />
        </linearGradient>
      </defs>

      {/* Subtle door / arch aperture background silhouette */}
      <rect
        x="290"
        y="60"
        width="110"
        height="180"
        rx="24"
        stroke="var(--r8-border-strong)"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />
      <circle cx="380" cy="150" r="4" fill="var(--r8-border-strong)" />

      {/* The single continuous monoline loop path extending the 8 */}
      <path
        d="M 60 140 
           C 60 85, 120 70, 160 110 
           C 200 150, 240 210, 300 210 
           C 350 210, 385 175, 385 130 
           C 385 85, 345 55, 300 55 
           C 255 55, 215 110, 175 160 
           C 135 210, 95 210, 60 175
           C 35 150, 35 120, 60 90
           C 85 60, 130 60, 160 85"
        stroke="url(#hero-loop-grad)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Key silhouette linked to the continuous loop */}
      <circle
        cx="75"
        cy="150"
        r="14"
        stroke="url(#hero-loop-grad)"
        strokeWidth="2.5"
      />
      <path
        d="M 89 150 L 115 150 M 105 150 L 105 158 M 112 150 L 112 156"
        stroke="url(#hero-loop-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
};
