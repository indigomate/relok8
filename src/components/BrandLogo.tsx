import React from 'react';

export const Relok8Logo: React.FC<{
  height?: number;
  theme?: 'dark' | 'light';
  className?: string;
}> = ({ height = 30, theme = 'light', className = '' }) => {
  const source = theme === 'dark'
    ? '/relok8-logo-for-dark.svg'
    : '/relok8-logo-for-light.svg';
  const width = Math.round(height * (2400 / 599));

  return (
    <div className={`flex items-center select-none ${className}`} style={{ height: `${height}px` }}>
      <img
        src={source}
        alt="Relok8"
        width={width}
        height={height}
        className="block h-full w-auto"
        draggable={false}
      />
    </div>
  );
};
