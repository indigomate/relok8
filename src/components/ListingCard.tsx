import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, MapPin, Check, Users } from 'lucide-react';
import { Listing } from '../types';
import { formatPLN, formatDate, SupportedLocale } from '../utils/formatters';
import { t } from '../utils/translations';

interface ListingCardProps {
  listing: Listing;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
  onSelectListing: (listing: Listing) => void;
  locale?: SupportedLocale;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onSelectListing,
  locale = 'en'
}) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [isImgLoaded, setIsImgLoaded] = useState(false);
  const strings = t[locale];

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

  return (
    <article
      onClick={() => onSelectListing(listing)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectListing(listing);
        }
      }}
      className="group rounded-2xl bg-white border border-slate-100 hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 overflow-hidden cursor-pointer flex flex-col justify-between text-left focus:outline-none"
    >
      {/* Image Container with fixed 4:3 Aspect Ratio & Suspended Preview */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {/* Suspended Preview Shimmer Skeleton */}
        {!isImgLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse z-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin opacity-40" />
          </div>
        )}

        <img
          src={listing.images[currentImgIndex] || listing.images[0]}
          alt={`${listing.title} · Rooms with Meldunek allowed, student & expat housing in ${listing.city}`}
          loading="lazy"
          onLoad={() => setIsImgLoaded(true)}
          className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 relative z-1 ${
            isImgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onError={(e) => {
            setIsImgLoaded(true);
            e.currentTarget.src = '/images/listing_warsaw_mokotow_1790621438299.jpg';
          }}
        />

        {/* Translucent Glassmorphic Badges */}
        <div className="absolute top-3 left-3 z-10 flex gap-1.5 flex-wrap pointer-events-none select-none">
          <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20">
            {strings.noBrokerFee}
          </span>
          {listing.landlordConsentStatus === 'Guaranteed Consent' && (
            <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-emerald-500/80 backdrop-blur-md text-white border border-emerald-400/30">
              {strings.landlordApproved}
            </span>
          )}
        </div>

        {/* Carousel Navigation Arrows on Hover */}
        {listing.images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevImg}
              aria-label="Previous photo"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={handleNextImg}
              aria-label="Next photo"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={2} />
            </button>

            {/* Dots */}
            <div className="absolute bottom-2.5 inset-x-0 flex justify-center items-center gap-1 pointer-events-none">
              {listing.images.slice(0, 5).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    idx === currentImgIndex ? 'w-3.5 bg-white' : 'w-1.5 bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          <h3 className="font-semibold text-slate-900 text-base truncate">
            {listing.shortTitle || listing.title}
          </h3>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" strokeWidth={1.8} />
            <span>{listing.city}, {listing.district}</span>
            {listing.transitInfo && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-slate-400 truncate">{listing.transitInfo}</span>
              </>
            )}
          </p>

          <div className="mt-3 flex gap-1.5 flex-wrap text-[11px]">
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200/60">
              ✓ {strings.meldunekAllowed}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
              {listing.czynszIncluded ? strings.billsIncluded : `${strings.billsExtra} (~${listing.czynszAdminPLN} PLN)`}
            </span>
            {listing.flatmatesInfo && (
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                {listing.flatmatesInfo}
              </span>
            )}
          </div>
        </div>

        {/* Price & Deposit Layout */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
          <div>
            <span className="text-lg font-extrabold text-slate-900 tnum">
              {formatPLN(listing.monthlyRentPLN, locale)}
            </span>
            <span className="text-xs text-slate-500 font-normal"> /mo</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Deposit: {formatPLN(listing.depositPLN, locale)}
          </span>
        </div>
      </div>
    </article>
  );
};
