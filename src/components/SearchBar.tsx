import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Calendar, Home, DollarSign, X, ChevronDown, Check } from 'lucide-react';
import { ENABLED_CITIES } from '../data/cities';
import { formatDate, SupportedLocale } from '../utils/formatters';
import { t } from '../utils/translations';

export interface SearchState {
  city: string; // "Anywhere in Poland" or city name like "Kraków"
  moveInDate: string; // ISO date string "2026-10-15" or empty for flexible
  roomType: string; // "All room types", "Private room", "Studio", "1-bedroom", "2-bedroom"
  minRent: number;
  maxRent: number;
}

interface SearchBarProps {
  mode: 'expanded' | 'compact';
  searchState: SearchState;
  onSearchChange: (newState: Partial<SearchState>) => void;
  onSearchSubmit?: () => void;
  locale?: SupportedLocale;
  onExpandClick?: () => void;
  isFloatingExpanded?: boolean;
  onCloseFloating?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  mode,
  searchState,
  onSearchChange,
  onSearchSubmit,
  locale = 'en',
  onExpandClick
}) => {
  const strings = t[locale === 'pl' ? 'pl' : 'en'];
  const [activeDropdown, setActiveDropdown] = useState<'where' | 'date' | 'type' | 'budget' | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close active dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roomTypeOptions = [
    { key: 'all', label: strings.searchRoomTypeAll, val: 'All room types' },
    { key: 'private', label: strings.roomTypePrivate, val: 'Private room' },
    { key: 'studio', label: strings.roomTypeStudio, val: 'Studio' },
    { key: 'oneBed', label: strings.roomTypeOneBed, val: '1-bedroom' },
    { key: 'twoBed', label: strings.roomTypeTwoBed, val: '2-bedroom' }
  ];

  const citySummary = searchState.city === 'All Poland' || !searchState.city || searchState.city === 'Anywhere in Poland'
    ? 'Anywhere in Poland'
    : searchState.city;

  const dateSummary = searchState.moveInDate
    ? formatDate(searchState.moveInDate, locale)
    : 'Flexible';

  const budgetSummary = searchState.maxRent < 10000
    ? `Up to PLN ${searchState.maxRent.toLocaleString()}`
    : 'Any budget';

  // Screenshot 6 clean pill format: "Anywhere in Poland · Flexible · Up to PLN 5,000"
  const compactSummary = `${citySummary} · ${dateSummary} · ${budgetSummary}`;

  // Simple clean calendar generator for move-in date
  const generateCalendarDays = () => {
    const days: { dateStr: string; label: number; disabled: boolean }[] = [];
    for (let i = 1; i <= 31; i++) {
      const iso = `2026-10-${String(i).padStart(2, '0')}`;
      days.push({ dateStr: iso, label: i, disabled: false });
    }
    return days;
  };

  // COMPACT STATE IN HEADER
  if (mode === 'compact') {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={onExpandClick}
          aria-label="Expand search"
          className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-slate-200/90 bg-white hover:bg-slate-50 shadow-xs hover:shadow-sm transition-all text-xs font-semibold text-slate-800 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none"
        >
          <span className="truncate max-w-[280px] sm:max-w-[380px]">{compactSummary}</span>
          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 ml-1">
            <Search className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>
    );
  }

  // EXPANDED STATE (HERO OR SEARCH ROW)
  return (
    <div ref={containerRef} className="w-full relative">
      {/* Desktop Expanded Bar */}
      <div className="hidden md:flex items-center bg-white rounded-full border border-slate-200 shadow-sm divide-x divide-slate-100 p-1.5 transition-all">
        {/* 1. WHERE */}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'where' ? null : 'where')}
            className={`w-full text-left px-3 md:px-4 lg:px-5 py-2.5 rounded-full transition-colors flex flex-col justify-center ${
              activeDropdown === 'where' ? 'bg-slate-100/80' : 'hover:bg-slate-50'
            }`}
          >
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              {strings.searchWhere}
            </span>
            <span className="text-xs font-medium text-slate-900 truncate">
              {citySummary}
            </span>
          </button>

          {activeDropdown === 'where' && (
            <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="text-[11px] font-semibold text-slate-400 px-3 py-1.5 uppercase">
                {strings.searchWhere}
              </div>
              <button
                type="button"
                onClick={() => {
                  onSearchChange({ city: 'All Poland' });
                  setActiveDropdown(null);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between font-medium transition-colors ${
                  searchState.city === 'All Poland' || !searchState.city
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{strings.searchWhereAny}</span>
                {(searchState.city === 'All Poland' || !searchState.city) && <Check className="w-4 h-4 text-indigo-600" />}
              </button>
              <div className="my-1 border-t border-slate-100" />
              {ENABLED_CITIES.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => {
                    onSearchChange({ city: c.name });
                    setActiveDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between font-medium transition-colors ${
                    searchState.city === c.name
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">{c.name}</span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                      {c.neighborhoods.slice(0, 3).join(', ')}
                    </span>
                  </div>
                  {searchState.city === c.name && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. MOVE-IN DATE */}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'date' ? null : 'date')}
            className={`w-full text-left px-3 md:px-4 lg:px-5 py-2.5 rounded-full transition-colors flex flex-col justify-center ${
              activeDropdown === 'date' ? 'bg-slate-100/80' : 'hover:bg-slate-50'
            }`}
          >
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              {strings.searchMoveInDate}
            </span>
            <span className="text-xs font-medium text-slate-900 truncate">
              {dateSummary}
            </span>
          </button>

          {activeDropdown === 'date' && (
            <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">
                  {locale === 'pl' ? 'Wybierz datę' : 'Select move-in date'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange({ moveInDate: '' });
                    setActiveDropdown(null);
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    !searchState.moveInDate
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {strings.searchMoveInFlexible}
                </button>
              </div>

              <div className="text-center font-semibold text-xs text-slate-700 mb-2">
                October 2026
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                  <span key={idx} className="font-semibold text-slate-400 py-1">
                    {day}
                  </span>
                ))}
                {generateCalendarDays().map((d) => {
                  const isSelected = searchState.moveInDate === d.dateStr;
                  return (
                    <button
                      key={d.dateStr}
                      type="button"
                      onClick={() => {
                        onSearchChange({ moveInDate: d.dateStr });
                        setActiveDropdown(null);
                      }}
                      className={`h-8 w-8 rounded-full flex items-center justify-center font-medium transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. ROOM TYPE */}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'type' ? null : 'type')}
            className={`w-full text-left px-3 md:px-4 lg:px-5 py-2.5 rounded-full transition-colors flex flex-col justify-center ${
              activeDropdown === 'type' ? 'bg-slate-100/80' : 'hover:bg-slate-50'
            }`}
          >
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              {strings.searchRoomType}
            </span>
            <span className="text-xs font-medium text-slate-900 truncate">
              {searchState.roomType === 'All room types' || !searchState.roomType
                ? strings.searchRoomTypeAll
                : searchState.roomType}
            </span>
          </button>

          {activeDropdown === 'type' && (
            <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="text-[11px] font-semibold text-slate-400 px-3 py-1.5 uppercase">
                {strings.searchRoomType}
              </div>
              {roomTypeOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    onSearchChange({ roomType: opt.val });
                    setActiveDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between font-medium transition-colors ${
                    (searchState.roomType === opt.val) || (!searchState.roomType && opt.val === 'All room types')
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  {((searchState.roomType === opt.val) || (!searchState.roomType && opt.val === 'All room types')) && (
                    <Check className="w-4 h-4 text-indigo-600" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 4. BUDGET */}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'budget' ? null : 'budget')}
            className={`w-full text-left px-3 md:px-4 lg:px-5 py-2.5 rounded-full transition-colors flex flex-col justify-center ${
              activeDropdown === 'budget' ? 'bg-slate-100/80' : 'hover:bg-slate-50'
            }`}
          >
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              {strings.searchBudget}
            </span>
            <span className="text-xs font-medium text-slate-900 truncate">
              {budgetSummary}
            </span>
          </button>

          {activeDropdown === 'budget' && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="text-xs font-bold text-slate-900 mb-2">
                Monthly budget (PLN)
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                <span>PLN {searchState.minRent || 500}</span>
                <span className="font-bold text-indigo-600">Up to PLN {searchState.maxRent}</span>
              </div>
              <input
                type="range"
                min={1000}
                max={5000}
                step={100}
                value={searchState.maxRent}
                onChange={(e) => onSearchChange({ maxRent: Number(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex gap-2 mt-4">
                {[2000, 2500, 3200, 4500].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      onSearchChange({ maxRent: preset });
                      setActiveDropdown(null);
                    }}
                    className={`flex-1 py-1 text-[11px] rounded-lg border font-medium ${
                      searchState.maxRent === preset
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SEARCH BUTTON */}
        <div className="pr-1.5 pl-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveDropdown(null);
              if (onSearchSubmit) onSearchSubmit();
            }}
            className="flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none whitespace-nowrap cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">{strings.searchSubmit}</span>
          </button>
        </div>
      </div>

      {/* Mobile Search Input Button (Screenshot 6: exact rounded border pill with magnifying glass and summary text) */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setMobileSheetOpen(true)}
          className="w-full min-h-[46px] flex items-center gap-3 px-4 py-2.5 bg-white rounded-full border border-slate-300 text-left focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none cursor-pointer shadow-2xs hover:border-slate-400 transition-colors"
        >
          <Search className="w-4 h-4 text-slate-500 shrink-0 stroke-[2.2]" />
          <span className="text-xs sm:text-sm font-normal text-slate-800 truncate">
            {compactSummary}
          </span>
        </button>
      </div>

      {/* Mobile Fullscreen Sheet */}
      {mobileSheetOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col p-4 overflow-y-auto animate-in fade-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">
              {locale === 'pl' ? 'Szukaj pokoju' : 'Search rooms'}
            </h2>
            <button
              type="button"
              onClick={() => setMobileSheetOpen(false)}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-4 space-y-5 flex-1">
            {/* Where */}
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                {strings.searchWhere}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onSearchChange({ city: 'All Poland' })}
                  className={`min-h-[44px] p-3 rounded-xl border text-xs font-semibold text-left flex items-center cursor-pointer transition-colors ${
                    searchState.city === 'All Poland' || !searchState.city
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {strings.searchWhereAny}
                </button>
                {ENABLED_CITIES.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => onSearchChange({ city: c.name })}
                    className={`min-h-[44px] p-3 rounded-xl border text-xs font-semibold text-left flex items-center cursor-pointer transition-colors ${
                      searchState.city === c.name
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Room type */}
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                {strings.searchRoomType}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {roomTypeOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => onSearchChange({ roomType: opt.val })}
                    className={`min-h-[44px] p-3 rounded-xl border text-xs font-semibold text-left flex items-center cursor-pointer transition-colors ${
                      (searchState.roomType === opt.val) || (!searchState.roomType && opt.val === 'All room types')
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                <span>{strings.searchBudget}</span>
                <span className="text-indigo-600 font-bold">≤ PLN {searchState.maxRent}</span>
              </div>
              <input
                type="range"
                min={1000}
                max={5000}
                step={100}
                value={searchState.maxRent}
                onChange={(e) => onSearchChange({ maxRent: Number(e.target.value) })}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>

          <div className="pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-slate-100 flex gap-2">
            <button
              type="button"
              onClick={() => {
                onSearchChange({ city: 'All Poland', roomType: 'All room types', maxRent: 5000 });
                setMobileSheetOpen(false);
              }}
              className="flex-1 min-h-[46px] py-3 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileSheetOpen(false);
                if (onSearchSubmit) onSearchSubmit();
              }}
              className="flex-2 min-h-[46px] py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Search
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
