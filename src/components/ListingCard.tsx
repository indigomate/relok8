import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Heart, Clock, Calendar, Check, ShieldCheck } from 'lucide-react';
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

  // Move-in and lease dates
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
      className="group relative rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 transition-all duration-200 hover:shadow-md overflow-hidden cursor-pointer flex flex-col justify-between text-left focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none"
    >
      {/* 1. Photo Container with exact rounded corners & overlay buttons */}
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
          className={`w-full h-full object-cover group-hover:scale-102 transition-transform duration-300 ${
            isImgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onError={(e) => {
            setIsImgLoaded(true);
            e.currentTarget.src = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Top-left: Takeover / Lock Pill or Available status */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none select-none">
          {isLocked ? (
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500 text-white shadow-sm border border-amber-600 flex items-center gap-1.5 animate-pulse">
              <Clock className="w-3.5 h-3.5 text-white" />
              <span>
                Held: {secondsLeft !== null ? `${Math.floor(secondsLeft / 60)}:${(secondsLeft % 60).toString().padStart(2, '0')}` : '15m'}
              </span>
            </span>
          ) : (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/95 text-slate-800 shadow-sm border border-slate-200/60 backdrop-blur-xs">
              {listing.statusBadge || 'Available for Takeover'}
            </span>
          )}
        </div>

        {/* Top-right: Heart button (white circle with soft shadow) */}
        <button
          type="button"
          onClick={handleHeartClick}
          aria-label={isSaved ? 'Remove from saved' : 'Save listing'}
          className="absolute top-3 right-3 z-10 w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-rose-600 flex items-center justify-center shadow-md transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none cursor-pointer"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-700'
            }`}
          />
        </button>

        {/* Left & Right subtle chevron navigation circles */}
        {listing.images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevImg}
              aria-label="Previous photo"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md opacity-90 transition-opacity cursor-pointer hover:scale-105"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={handleNextImg}
              aria-label="Next photo"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md opacity-90 transition-opacity cursor-pointer hover:scale-105"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </>
        )}

        {/* Photo counter / dots indicator */}
        {listing.images.length > 1 && (
          <div className="absolute bottom-2.5 right-3 z-10 px-2 py-0.5 rounded-md bg-black/60 text-white text-[11px] font-semibold backdrop-blur-xs">
            {currentImgIndex + 1}/{listing.images.length}
          </div>
        )}
      </div>

      {/* Card Content - Clean Typography & Badges aligned with screenshot 6 */}
      <div className="p-4 flex flex-col justify-between flex-1 gap-3">
        <div className="space-y-1.5">
          {/* Title: Studio near Politechnika */}
          <h3 className="font-bold text-slate-900 text-[17px] leading-snug line-clamp-1">
            {listing.title}
          </h3>

          {/* Subtitle / Location: Śródmieście Południowe, Warsaw */}
          <p className="text-xs font-medium text-slate-600">
            {listing.district}, {listing.city}
          </p>

          {/* Date range with Calendar icon */}
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium pt-0.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {locale === 'pl' ? 'Od' : 'From'} {moveInDateFormatted} · {locale === 'pl' ? 'umowa do' : 'lease to'} {leaseEndDateFormatted}
            </span>
          </div>

          {/* Size · Room type · Furnished */}
          <p className="text-xs text-slate-500 font-normal">
            {listing.squareMeters} m² · {listing.roomType} · {listing.isFurnished ? (locale === 'pl' ? 'Umeblowane' : 'Furnished') : (locale === 'pl' ? 'Nieumeblowane' : 'Unfurnished')}
          </p>

          {/* Badges: Meldunek OK / Bills included in soft rounded pills with green text */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
            {listing.meldunekAllowed && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-100">
                Meldunek OK
              </span>
            )}
            {listing.billsIncluded && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                Bills included
              </span>
            )}
            {listing.landlordApproved && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-100">
                Landlord approved
              </span>
            )}
          </div>
        </div>

        {/* Pricing: PLN 2,350 /mo and Deposit PLN 2,350 */}
        <div className="pt-2.5 mt-1 border-t border-slate-100 flex items-baseline justify-between text-xs">
          <div>
            <span className="text-lg font-bold text-slate-900 tnum">
              PLN {listing.monthlyRentPLN.toLocaleString()}
            </span>
            <span className="text-slate-500 font-normal">/mo</span>
          </div>
          <span className="text-slate-500 text-xs">
            Deposit PLN {listing.depositPLN.toLocaleString()}
          </span>
        </div>
      </div>
    </article>
  );
};
