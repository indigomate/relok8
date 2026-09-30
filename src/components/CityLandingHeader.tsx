import React, { useState } from 'react';
import { MapPin, School, Train, Share2, Check, ArrowLeft } from 'lucide-react';
import { CityConfig } from '../data/cities';
import { SupportedLocale } from '../utils/formatters';

interface CityLandingHeaderProps {
  city: CityConfig;
  roomCount: number;
  onClearCity: () => void;
  locale?: SupportedLocale;
}

export const CityLandingHeader: React.FC<CityLandingHeaderProps> = ({
  city,
  roomCount,
  onClearCity,
  locale = 'en'
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isPl = locale === 'pl';

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 text-left relative overflow-hidden">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 relative z-10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClearCity}
            className="hover:text-indigo-600 transition-colors flex items-center gap-1 font-medium cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isPl ? 'Wszystkie miasta' : 'All cities'}</span>
          </button>
          <span>/</span>
          <span className="font-semibold text-slate-900">{city.name}</span>
        </div>

        {/* Share direct city landing link */}
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">{isPl ? 'Link skopiowany!' : 'Link copied!'}</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>{isPl ? 'Udostępnij stronę miasta' : 'Share city link'}</span>
            </>
          )}
        </button>
      </div>

      {/* Main Title & Subtitle - Template Driven */}
      <div className="space-y-2 relative z-10 max-w-3xl">
        <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider">
          <MapPin className="w-3.5 h-3.5" />
          <span>{city.name}, Poland</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {isPl ? `Pokoje na wynajem w ${city.name === 'Warsaw' ? 'Warszawie' : city.name === 'Kraków' ? 'Krakowie' : city.name === 'Wrocław' ? 'Wrocławiu' : city.name === 'Gdańsk' ? 'Gdańsku' : 'Lublinie'}` : `Rooms for rent in ${city.name}`}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          {isPl
            ? `Przejmij aktywną umowę najmu w ${city.name === 'Warsaw' ? 'Warszawie' : city.name === 'Kraków' ? 'Krakowie' : city.name === 'Wrocław' ? 'Wrocławiu' : city.name === 'Gdańsk' ? 'Gdańsku' : 'Lublinie'} za zgodą właściciela. Zero prowizji agencji i pełne wsparcie przy meldunku.`
            : `Take over an active lease in ${city.name} directly from the current tenant with official landlord approval and zero broker commissions.`}
        </p>
      </div>

      {/* City Data Grid - Separate Universities and Transit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2 relative z-10 text-xs">
        {/* Nearby Universities */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <School className="w-4 h-4 text-indigo-600" />
            <span>{isPl ? 'Uczelnie' : 'Universities'}</span>
          </div>
          <ul className="text-slate-600 space-y-1 leading-snug">
            {city.universities.map((uni, i) => (
              <li key={i} className="truncate">• {uni}</li>
            ))}
          </ul>
        </div>

        {/* Public Transit */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Train className="w-4 h-4 text-indigo-600" />
            <span>{isPl ? 'Komunikacja miejska' : 'Public transit'}</span>
          </div>
          <ul className="text-slate-600 space-y-1 leading-snug">
            {city.transit.map((tr, i) => (
              <li key={i} className="truncate">• {tr}</li>
            ))}
          </ul>
        </div>

        {/* Key Neighborhoods */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <MapPin className="w-4 h-4 text-indigo-600" />
            <span>{isPl ? 'Dzielnice' : 'Neighborhoods'}</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            {city.neighborhoods.join(' · ')}
          </p>
        </div>
      </div>

      {/* Available Room Count */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs relative z-10">
        <span className="font-semibold text-slate-900">
          {roomCount} {roomCount === 1 ? (isPl ? 'dostępny pokój' : 'room available') : (isPl ? 'dostępnych pokoi' : 'rooms available')} {isPl ? 'w' : 'in'} {city.name}
        </span>
        <button
          type="button"
          onClick={onClearCity}
          className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
        >
          {isPl ? 'Pokaż całą Polskę' : 'View anywhere in Poland'}
        </button>
      </div>
    </div>
  );
};
