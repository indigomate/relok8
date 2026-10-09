import React from 'react';
import { Skeleton } from './Skeleton';

interface ListingCardSkeletonProps {
  className?: string;
}

export const ListingCardSkeleton: React.FC<ListingCardSkeletonProps> = ({ className = '' }) => {
  return (
    <article
      aria-busy="true"
      aria-label="Loading room listing..."
      className={`bg-[var(--surface)] rounded-[var(--r-lg)] border border-[var(--border)] flex flex-col justify-between overflow-hidden text-left ${className}`}
    >
      {/* 3:2 Photo Area Skeleton */}
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-[var(--surface-2)]">
        <Skeleton className="w-full h-full rounded-none" />

        {/* Top-Right: Heart button placeholder */}
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 shadow-xs" />
      </div>

      {/* Card Body Skeleton */}
      <div className="p-4 flex flex-col justify-between flex-1 gap-3">
        <div className="space-y-2">
          {/* Title placeholder */}
          <Skeleton height={20} className="w-4/5" />

          {/* Location / District placeholder */}
          <Skeleton height={16} className="w-1/2" />

          {/* Date line placeholder */}
          <Skeleton height={16} className="w-3/5" />

          {/* Specs placeholder */}
          <Skeleton height={14} className="w-2/3" />

          {/* Chips placeholder */}
          <div className="pt-1 flex items-center gap-2">
            <Skeleton height={24} width={90} radius="pill" />
            <Skeleton height={24} width={100} radius="pill" />
          </div>
        </div>

        {/* Pricing Line placeholder */}
        <div className="pt-3 border-t border-[var(--border)] flex items-baseline justify-between">
          <Skeleton height={20} width={110} />
          <Skeleton height={16} width={80} />
        </div>
      </div>
    </article>
  );
};

interface ListingGridSkeletonProps {
  count?: number;
}

export const ListingGridSkeleton: React.FC<ListingGridSkeletonProps> = ({ count = 6 }) => {
  return (
    <div
      role="status"
      aria-label="Loading available rooms"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2"
    >
      {Array.from({ length: count }).map((_, index) => (
        <ListingCardSkeleton key={`skeleton-card-${index}`} />
      ))}
    </div>
  );
};

