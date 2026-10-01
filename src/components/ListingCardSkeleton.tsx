import React from 'react';

interface ListingCardSkeletonProps {
  className?: string;
}

export const ListingCardSkeleton: React.FC<ListingCardSkeletonProps> = ({ className = '' }) => {
  return (
    <article
      aria-busy="true"
      aria-label="Loading room listing..."
      className={`bg-white rounded-2xl border border-slate-200/90 flex flex-col justify-between overflow-hidden text-left shadow-xs ${className}`}
    >
      {/* 4:3 Photo Area Skeleton */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-200 animate-pulse">
        {/* Shimmer gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />

        {/* Top-Left: Badge placeholder */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <div className="h-6 w-24 rounded-full bg-slate-300/80 backdrop-blur-xs" />
          <div className="hidden sm:block h-6 w-20 rounded-full bg-slate-300/60" />
        </div>

        {/* Top-Right: Heart button placeholder */}
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/70 shadow-xs" />

        {/* Bottom: Carousel dots placeholder */}
        <div className="absolute bottom-2.5 inset-x-0 flex justify-center items-center gap-1.5">
          <div className="h-1.5 w-3.5 rounded-full bg-white/70" />
          <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
          <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
        </div>
      </div>

      {/* Card Body Skeleton */}
      <div className="p-4 flex flex-col justify-between flex-1 gap-3">
        <div className="space-y-2">
          {/* Title placeholder */}
          <div className="h-5 w-4/5 rounded-md bg-slate-200 animate-pulse" />

          {/* Location / District placeholder */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <div className="w-3.5 h-3.5 rounded-full bg-indigo-200 shrink-0 animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-slate-200 animate-pulse" />
          </div>

          {/* Campus & Transit line placeholder */}
          <div className="h-3.5 w-3/5 rounded bg-slate-100 animate-pulse" />

          {/* Decision Facts chips placeholder */}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <div className="h-5 w-24 rounded-md bg-emerald-100/60 animate-pulse" />
            <div className="h-5 w-28 rounded-md bg-slate-100 animate-pulse" />
            <div className="h-4 w-16 rounded bg-slate-100 animate-pulse" />
          </div>

          {/* Move-in Date & Lease Term placeholder */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <div className="h-3.5 w-28 rounded bg-slate-100 animate-pulse" />
            <div className="h-3.5 w-16 rounded bg-slate-100 animate-pulse" />
          </div>
        </div>

        {/* Pricing Line placeholder */}
        <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <div className="h-6 w-24 rounded-md bg-slate-200 animate-pulse" />
            <div className="h-3.5 w-10 rounded bg-slate-100 animate-pulse" />
          </div>

          <div className="h-4 w-20 rounded bg-slate-100 animate-pulse" />
        </div>
      </div>
    </article>
  );
};

interface ListingGridSkeletonProps {
  count?: number;
}

export const ListingGridSkeleton: React.FC<ListingGridSkeletonProps> = ({ count = 8 }) => {
  return (
    <div
      role="status"
      aria-label="Loading available rooms"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-2"
    >
      {Array.from({ length: count }).map((_, index) => (
        <ListingCardSkeleton key={`skeleton-card-${index}`} />
      ))}
    </div>
  );
};
