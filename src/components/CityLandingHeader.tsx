import React, { useState } from 'react';
import { MapPin, School, Train, Share2, Check, ArrowLeft } from 'lucide-react';
import { CitySeoInfo } from '../utils/router';
import { SupportedLocale } from '../utils/formatters';

interface CityLandingHeaderProps {
  cityInfo: CitySeoInfo;
  roomCount: number;
  onClearCity: () => void;
  locale: SupportedLocale;
}

export const CityLandingHeader: React.FC<CityLandingHeaderProps> = ({
  cityInfo,
  roomCount,
  onClearCity,
  locale
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 text-left relative overflow-hidden">
      {/* Decorative clean background accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-slate-500 relative z-10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClearCity}
            className="hover:text-indigo-600 transition-colors flex items-center gap-1 font-medium cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{locale === 'pl' ? 'Wszystkie miasta w Polsce' : 'All Poland'}</span>
          </button>
          <span>/</span>
          <span className="font-semibold text-slate-900">{cityInfo.name}</span>
        </div>

        {/* Share direct city landing link */}
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">{locale === 'pl' ? 'Link skopiowany!' : 'Link copied!'}</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>{locale === 'pl' ? 'Udostępnij stronę miasta' : 'Share city link'}</span>
            </>
          )}
        </button>
      </div>

      {/* Main Title & Subtitle */}
      <div className="space-y-2 relative z-10 max-w-3xl">
        <div className="flex items-center gap-2 text-indigo-600 text-[12px] font-bold uppercase tracking-wider">
          <MapPin className="w-3.5 h-3.5" />
          <span>{cityInfo.name}, Poland · Verified Direct Handovers</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {cityInfo.heading}
        </h1>
        <p className="text-[14px] sm:text-[15px] text-slate-600 leading-relaxed">
          {cityInfo.tagline}
        </p>
      </div>

      {/* City Specific Facts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2 relative z-10 text-[13px]">
        {/* Nearby Universities */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <School className="w-4 h-4 text-indigo-600" />
            <span>Key Universities</span>
          </div>
          <p className="text-[12px] text-slate-600 leading-snug">
            {cityInfo.universities.slice(0, 3).join(' · ')}
          </p>
        </div>

        {/* Public Transit */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Train className="w-4 h-4 text-indigo-600" />
            <span>Transit & Metro</span>
          </div>
          <p className="text-[12px] text-slate-600 leading-snug">
            {cityInfo.transit}
          </p>
        </div>

        {/* Guaranteed Standards */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 space-y-1.5 sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Check className="w-4 h-4 text-emerald-600" strokeWidth={2.5} />
            <span>Tenant Safeguards</span>
          </div>
          <p className="text-[12px] text-slate-600 leading-snug">
            0 PLN broker fees · Landlord consent confirmed · Address registration (Meldunek) permitted
          </p>
        </div>
      </div>

      {/* Available Room Count Pill */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-[13px] relative z-10">
        <span className="font-semibold text-slate-900">
          {roomCount} {roomCount === 1 ? 'room' : 'rooms'} currently available in {cityInfo.name}
        </span>
        <button
          type="button"
          onClick={onClearCity}
          className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
        >
          {locale === 'pl' ? 'Pokaż całą Polskę' : 'View all cities'}
        </button>
      </div>
    </div>
  );
};
