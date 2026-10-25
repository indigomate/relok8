import React, { useState, useEffect } from 'react';

export type OnloState = 'static' | 'idle' | 'hello' | 'thinking' | 'speaking' | 'happy' | 'away';

interface OnloAvatarProps {
  className?: string;
  size?: number | string;
  variant?: 'avatar' | 'icon' | 'mono' | 'image';
  state?: OnloState;
  title?: string;
  onStateTransition?: (nextState: OnloState) => void;
}

export const OnloAvatar: React.FC<OnloAvatarProps> = ({
  className = '',
  size = 24,
  variant = 'icon',
  state = 'idle',
  title = 'Onlo AI Assistant',
  onStateTransition
}) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  // Active state with automatic transitions for 'hello' (0.6s) and 'happy' (2s)
  const [currentState, setCurrentState] = useState<OnloState>(state);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  // Sync external state changes
  useEffect(() => {
    setCurrentState(state);
  }, [state]);

  // Handle transient states (hello -> idle after 600ms, happy -> idle after 2000ms)
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (currentState === 'hello') {
      timer = setTimeout(() => {
        setCurrentState('idle');
        if (onStateTransition) onStateTransition('idle');
      }, 650);
    } else if (currentState === 'happy') {
      timer = setTimeout(() => {
        setCurrentState('idle');
        if (onStateTransition) onStateTransition('idle');
      }, 2000);
    }

    return () => clearTimeout(timer);
  }, [currentState, onStateTransition]);

  // Suspend animations when document/tab is not visible
  useEffect(() => {
    const handleVisibility = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Effective state: freeze to static if tab is hidden
  const activeState: OnloState = !isVisible ? 'static' : currentState;

  // Colors
  const isMono = variant === 'mono';
  const strokeColor = isMono ? 'currentColor' : '#766bf5';
  const eyeColor = isMono ? 'currentColor' : '#ff6454';
  const bubbleFill = isMono ? 'none' : '#0b101d';
  const dotColor = isMono ? 'currentColor' : '#a5b4fc';
  const mouthColor = isMono ? 'currentColor' : '#ff6454';
  const sparkleColor = isMono ? 'currentColor' : '#ff8a7a';
  const zColor = isMono ? 'currentColor' : '#c7d2fe';

  const renderFaces = () => {
    switch (activeState) {
      case 'static':
        return (
          <g>
            <rect x="38" y="40" width="8.5" height="18" rx="4.25" fill={eyeColor} />
            <rect x="53.5" y="40" width="8.5" height="18" rx="4.25" fill={eyeColor} />
          </g>
        );

      case 'idle':
        return (
          <g className="onlo-anim-glance">
            <g className="onlo-anim-blink">
              <rect x="38" y="40" width="8.5" height="18" rx="4.25" fill={eyeColor} />
              <rect x="53.5" y="40" width="8.5" height="18" rx="4.25" fill={eyeColor} />
            </g>
          </g>
        );

      case 'hello':
        return (
          <g className="onlo-anim-pop-in">
            <g className="onlo-anim-blink">
              <rect x="38" y="40" width="8.5" height="18" rx="4.25" fill={eyeColor} />
              <rect x="53.5" y="40" width="8.5" height="18" rx="4.25" fill={eyeColor} />
            </g>
          </g>
        );

      case 'thinking':
        return (
          <g>
            {/* Glancing eyes */}
            <g className="onlo-anim-glance">
              <rect x="38" y="38" width="8.5" height="18" rx="4.25" fill={eyeColor} />
              <rect x="53.5" y="38" width="8.5" height="18" rx="4.25" fill={eyeColor} />
            </g>
            {/* 3 Hopping Thought Dots */}
            <g transform="translate(0, -3)">
              <circle cx="39" cy="65" r="2.8" fill={dotColor} className="onlo-anim-dot-1" />
              <circle cx="50" cy="65" r="2.8" fill={dotColor} className="onlo-anim-dot-2" />
              <circle cx="61" cy="65" r="2.8" fill={dotColor} className="onlo-anim-dot-3" />
            </g>
          </g>
        );

      case 'speaking':
        return (
          <g>
            {/* Eyes */}
            <rect x="38" y="38" width="8.5" height="17" rx="4.25" fill={eyeColor} />
            <rect x="53.5" y="38" width="8.5" height="17" rx="4.25" fill={eyeColor} />
            {/* Talking mouth */}
            <ellipse cx="50" cy="61" rx="4.2" ry="3.5" fill={mouthColor} className="onlo-anim-mouth" />
          </g>
        );

      case 'happy':
        return (
          <g className="onlo-anim-happy">
            {/* Cheerful smiling eyes (arches) */}
            <path
              d="M 36 49 C 38 41 46 41 48 49"
              stroke={eyeColor}
              strokeWidth="4.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 52 49 C 54 41 62 41 64 49"
              stroke={eyeColor}
              strokeWidth="4.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Wide happy smile */}
            <path
              d="M 41 58 Q 50 67 59 58"
              stroke={mouthColor}
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            {/* Sparkle 1 (top right) */}
            <path
              d="M 75 24 L 76.5 27.5 L 80 29 L 76.5 30.5 L 75 34 L 73.5 30.5 L 70 29 L 73.5 27.5 Z"
              fill={sparkleColor}
              className="onlo-anim-sparkle-1"
            />
            {/* Sparkle 2 (mid left) */}
            <path
              d="M 23 31 L 24.2 33.5 L 27 34.5 L 24.2 35.5 L 23 38 L 21.8 35.5 L 19 34.5 L 21.8 33.5 Z"
              fill="#c7d2fe"
              className="onlo-anim-sparkle-2"
            />
          </g>
        );

      case 'away':
        return (
          <g className="onlo-anim-breathe">
            {/* Resting closed eyes */}
            <path
              d="M 37 47 Q 42 52 47 47"
              stroke={eyeColor}
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 53 47 Q 58 52 63 47"
              stroke={eyeColor}
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            {/* Floating 'z' sleep drift */}
            <g className="onlo-anim-z">
              <text
                x="65"
                y="31"
                fill={zColor}
                fontSize="14"
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                z
              </text>
            </g>
          </g>
        );

      default:
        return (
          <g>
            <rect x="38" y="40" width="8.5" height="18" rx="4.25" fill={eyeColor} />
            <rect x="53.5" y="40" width="8.5" height="18" rx="4.25" fill={eyeColor} />
          </g>
        );
    }
  };

  const svgElement = (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      className={`w-full h-full select-none ${activeState === 'away' ? 'opacity-85' : ''}`}
      aria-hidden="true"
    >
      {/* Speech bubble silhouette */}
      <path
        d="M50 14 C29.5 14 14 29.5 14 50 C14 58.2 16.7 65.8 21.3 72 L16 86 L30.2 80.8 C36.1 84.7 42.8 86 50 86 C70.5 86 86 70.5 86 50 C86 29.5 70.5 14 50 14 Z"
        stroke={strokeColor}
        strokeWidth="8.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={bubbleFill}
      />

      {/* Dynamic Animated Face */}
      {renderFaces()}
    </svg>
  );

  if (variant === 'image') {
    return (
      <div
        style={{ width: pixelSize, height: pixelSize }}
        className={`inline-flex items-center justify-center shrink-0 rounded-[24%] bg-[#0b101d] overflow-hidden shadow-xs select-none relative ${className}`}
        aria-label={title}
        title={title}
      >
        <img
          src="/onlo.png"
          alt={title}
          className="w-full h-full object-contain pointer-events-none select-none"
        />
      </div>
    );
  }

  if (variant === 'avatar') {
    return (
      <div
        style={{ width: pixelSize, height: pixelSize }}
        className={`inline-flex items-center justify-center shrink-0 rounded-[24%] bg-[#0b101d] p-[10%] shadow-xs select-none relative overflow-visible ${className}`}
        aria-label={title}
        title={title}
      >
        {svgElement}
      </div>
    );
  }

  return (
    <div
      style={{ width: pixelSize, height: pixelSize }}
      className={`inline-block shrink-0 select-none relative overflow-visible ${className}`}
      aria-label={title}
      title={title}
    >
      {svgElement}
    </div>
  );
};
