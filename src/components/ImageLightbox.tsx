import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  title
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setIsZoomed(false);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
        setIsZoomed(false);
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
        setIsZoomed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, images.length, onClose]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setIsZoomed(false);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setIsZoomed(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Full size image viewer"
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div
        className="w-full h-16 px-4 sm:px-6 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 text-white">
          <span className="text-xs sm:text-sm font-semibold text-slate-300">
            {currentIndex + 1} / {images.length}
          </span>
          {title && (
            <>
              <span className="text-slate-600 hidden sm:inline">·</span>
              <span className="text-xs sm:text-sm font-medium text-slate-200 truncate max-w-xs sm:max-w-md hidden sm:inline">
                {title}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom toggle */}
          <button
            type="button"
            onClick={() => setIsZoomed(!isZoomed)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title={isZoomed ? 'Zoom out' : 'Zoom in'}
            aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
          >
            {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close viewer (Esc)"
            aria-label="Close image viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Area */}
      <div
        className="flex-1 relative flex items-center justify-center p-2 sm:p-6 overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Previous Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 sm:left-6 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/10 shadow-xl transition-all hover:scale-105 cursor-pointer"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Center Image */}
        <div
          className={`relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200 ${
            isZoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setIsZoomed(!isZoomed);
          }}
        >
          <img
            src={currentImage}
            alt={title || `Photo ${currentIndex + 1}`}
            className="max-h-[78vh] sm:max-h-[82vh] max-w-[92vw] sm:max-w-[88vw] object-contain rounded-lg shadow-2xl transition-all"
            onError={(e) => {
              e.currentTarget.src = '/images/listing_warsaw_mokotow_1790621438299.jpg';
            }}
          />
        </div>

        {/* Next Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 sm:right-6 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/10 shadow-xl transition-all hover:scale-105 cursor-pointer"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnails Strip */}
      {images.length > 1 && (
        <div
          className="w-full py-3 px-4 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 overflow-x-auto max-w-2xl px-2 py-1 scrollbar-none">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsZoomed(false);
                }}
                className={`relative aspect-[4/3] w-14 sm:w-16 rounded-md overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  currentIndex === idx
                    ? 'border-indigo-500 scale-105 shadow-md'
                    : 'border-transparent opacity-50 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/images/listing_warsaw_mokotow_1790621438299.jpg';
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
