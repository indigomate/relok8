import React, { useEffect, useMemo, useRef, useState } from 'react';

interface TypewriterTextProps {
  text: string;
  animate?: boolean;
  className?: string;
  onComplete?: () => void;
  onProgress?: () => void;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  animate = false,
  className,
  onComplete,
  onProgress,
}) => {
  const reduceMotion = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const shouldAnimate = animate && !reduceMotion && text.length > 1;
  const [visibleLength, setVisibleLength] = useState(shouldAnimate ? 0 : text.length);
  const onCompleteRef = useRef(onComplete);
  const onProgressRef = useRef(onProgress);
  onCompleteRef.current = onComplete;
  onProgressRef.current = onProgress;

  useEffect(() => {
    if (!shouldAnimate) {
      setVisibleLength(text.length);
      onCompleteRef.current?.();
      return;
    }

    setVisibleLength(0);
    const targetDuration = Math.min(1800, Math.max(520, text.length * 5));
    const intervalMs = 18;
    const charactersPerTick = Math.max(1, Math.ceil(text.length / (targetDuration / intervalMs)));
    const timer = window.setInterval(() => {
      setVisibleLength((current) => {
        const next = Math.min(text.length, current + charactersPerTick);
        onProgressRef.current?.();
        if (next >= text.length) {
          window.clearInterval(timer);
          onCompleteRef.current?.();
        }
        return next;
      });
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [shouldAnimate, text]);

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden="true">{text.slice(0, visibleLength)}</span>
      {visibleLength < text.length && <span aria-hidden="true" className="onlo-type-caret" />}
    </span>
  );
};
