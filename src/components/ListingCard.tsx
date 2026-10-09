import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Heart, Lock, Clock } from 'lucide-react';
import { Listing } from '../types';
import { formatPLN, formatDate, SupportedLocale } from '../utils/formatters';
import { t } from '../utils/translations';
import { useConvex } from '../lib/convex/client';

interface ListingCardProps {
  listing: Listing;
  isSaved?: boolean;
  onToggleSave?: (id: string, e?: React.MouseEvent) => void;
  onSelectListing: (listing: Listing) => void;
  locale?: SupportedLocale;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  isSaved = false,
  onToggleSave,
  onSelectListing,
  locale = 'en'
}) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [isImgLoaded, setIsImgLoaded] = useState(false);
  const strings = t[locale === 'pl' ? 'pl' : 'en'];
  const convex = useConvex();

  // Real-time Convex lock tracking
  const convexDoc = convex.db.listings.find((l) => l._id === listing.id);
  const isLocked = Boolean(convexDoc?.isLocked && convexDoc.lockedUntil && convexDoc.lockedUntil > Date.now());
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!isLocked || !convexDoc?.lockedUntil) {
      setSecondsLeft(null);
      return;
    }
    const update = () => {
      const left = Math.max(0, Math.floor((convexDoc.lockedUntil! - Date.now()) / 1000));
      setSecondsLeft(left);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isLocked, convexDoc?.lockedUntil]);

  const handlePrevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsImgLoaded(false);
    setCurrentImgIndex((prev) => (prev === 0 ? listing.images.length - 1 : prev - 1));
  };

  const handleNextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsImgLoaded(false);
    setCurrentImgIndex((prev) => (prev === listing.images.length - 1 ? 0 : prev + 1));
  };

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onToggleSave) {
      onToggleSave(listing.id, e);
    }
  };

  // Facts line: 19 m² · Furnished · Private room · 2 flatmates
  const factsList = [
    listing.squareMeters ? `${listing.squareMeters} m²` : null,
    listing.isFurnished ? (locale === 'pl' ? 'Umeblowane' : 'Furnished') : null,
    listing.roomType,
    listing.flatmatesCount && listing.flatmatesCount > 0
      ? `${listing.flatmatesCount} ${locale === 'pl' ? strings.flatmates : 'flatmates'}`
      : (locale === 'pl' ? 'Całe mieszkanie' : 'Entire place')
  ].filter(Boolean);

  // Chips: up to three chips, strictly from real fields
  const chips: string[] = [];
  if (listing.meldunekAllowed) {
    chips.push(strings.meldunekOkChip);
  }
  if (listing.billsIncluded) {
    chips.push(strings.billsIncludedChip);
  }
  if (listing.landlordApproved) {
    chips.push(strings.landlordApprovedChip);
  }

  // Dates: Move in from 15 Oct 2026 · lease to 30 Jun 2027
  const moveInDateFormatted = formatDate(listing.availableDate, locale);
  const leaseEndDateFormatted = formatDate(listing.leaseEndDate, locale);

  return (
    <article
      onClick={() => onSelectListing(listing)}
      tabIndex={0}
      role="link"
      aria-label={`${listing.title}, ${listing.district}, ${listing.city}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectListing(listing);
        }
      }}
      className="group relative rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all duration-200 hover:shadow-lg overflow-hidden cursor-pointer flex flex-col justify-between text-left focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none"
    >
      {/* 1. Photo (Aspect 4:3) with ONE status badge and Save (heart) button */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {!isImgLoaded && (
          <div className="absolute inset-0 bg-slate-200 animate-pulse z-0 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin opacity-40" />
          </div>
        )}

        <img
          src={listing.images[currentImgIndex] || listing.images[0]}
          alt={`${listing.title} - ${listing.roomType} in ${listing.district}, ${listing.city} Poland`}
          loading="lazy"
          decoding="async"
          width="400"
          height="300"
          onLoad={() => setIsImgLoaded(true)}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
            isImgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onError={(e) => {
            setIsImgLoaded(true);
            e.currentTarget.src = '/images/listing_warsaw_mokotow_1790621438299.jpg';
          }}
        />

        {/* Exactly ONE status badge with real-time countdown when locked */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none select-none">
          {isLocked ? (
            <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-amber-500 text-white shadow-sm border border-amber-600 flex items-center gap-1.5 animate-pulse">
              <Clock className="w-3.5 h-3.5 text-white" />
              <span>
                Held: {secondsLeft !== null ? `${Math.floor(secondsLeft / 60)}:${(secondsLeft % 60).toString().padStart(2, '0')}` : '15m'}
              </span>
            </span>
          ) : (
            <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-white/95 text-slate-800 shadow-sm border border-slate-200/60 backdrop-blur-xs">
              {listing.statusBadge || strings.landlordApprovedChip}
            </span>
          )}
        </div>

        {/* Save (heart) button on every card */}
        <button
          type="button"
          onClick={handleHeartClick}
          aria-label={isSaved ? 'Remove from saved' : 'Save listing'}
          className="absolute top-3 right-3 z-10 w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-rose-600 flex items-center justify-center shadow-md transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none cursor-pointer"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-700'
            }`}
          />
        </button>

        {/* Carousel Arrows */}
        {listing.images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevImg}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-sm opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextImg}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-sm opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-2 inset-x-0 flex justify-center items-center gap-1 pointer-events-none">
              {listing.images.slice(0, 5).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentImgIndex ? 'w-3 bg-white' : 'w-1.5 bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Card Content - Strict Order from §4.3 */}
      <div className="p-4 flex flex-col justify-between flex-1 gap-2.5">
        <div>
          {/* 2. Title: max ~40 chars, lister written */}
          <h3 className="font-semibold text-slate-900 text-base leading-snug line-clamp-1">
            {listing.title}
          </h3>

          {/* 3. Location: Krowodrza, Kraków (own line, never truncated) */}
          <p className="text-xs font-medium text-slate-600 mt-1">
            {listing.district}, {listing.city}
          </p>

          {/* 4. Dates: Move in from 15 Oct 2026 · lease to 30 Jun 2027 (most important line) */}
          <p className="text-xs font-semibold text-indigo-950 mt-1.5 flex items-center gap-1.5">
            <span>
              {strings.moveInFrom} {moveInDateFormatted}
            </span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span>
              {strings.leaseTo} {leaseEndDateFormatted}
            </span>
          </p>

          {/* 5. Facts: 19 m² · Furnished · Private room · 2 flatmates */}
          <p className="text-xs text-slate-500 mt-1.5 flex items-center flex-wrap gap-1.5">
            {factsList.map((fact, i) => (
              <React.Fragment key={i}>
                <span>{fact}</span>
                {i < factsList.length - 1 && (
                  <span className="text-slate-300" aria-hidden="true">·</span>
                )}
              </React.Fragment>
            ))}
          </p>

          {/* 6. Distance (own line, one item): 5 min walk to AGH */}
          {listing.distanceToCampus && (
            <p className="text-xs text-slate-600 mt-1 font-medium">
              {listing.distanceToCampus}
            </p>
          )}

          {/* 7. Up to three chips, strictly from real fields */}
          {chips.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {chips.slice(0, 3).map((chipText, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700"
                >
                  {chipText}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 8. Price: PLN 1,650 /mo · Deposit PLN 1,800 */}
        <div className="pt-3 mt-1 border-t border-slate-100 flex flex-wrap items-baseline justify-between gap-1 text-xs">
          <div>
            <span className="text-base font-bold text-slate-900 tnum">
              {formatPLN(listing.monthlyRentPLN, locale)}
            </span>
            <span className="text-slate-500 font-normal"> {strings.perMonth}</span>
          </div>
          <span className="text-slate-500 text-[11px] sm:text-xs">
            {strings.deposit} {formatPLN(listing.depositPLN, locale)}
          </span>
        </div>
      </div>
    </article>
  );
};
