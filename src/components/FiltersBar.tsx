import React, { useState } from 'react';
import { SlidersHorizontal, X, ChevronDown, Check } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';
import { t } from '../utils/translations';

export type SortOption = 'soonest' | 'price-asc' | 'newest';

export interface FilterValues {
  maxRent: number;
  moveInDate: string;
  roomType: string;
  isFurnishedOnly: boolean;
  billsIncludedOnly: boolean;
  meldunekOnly: boolean;
  maxFlatmates: number | null; // null = any, 0 = 0 flatmates (studio/alone), 1, 2, 3+
  sortBy: SortOption;
}

interface FiltersBarProps {
  filters: FilterValues;
  onFilterChange: (newFilters: Partial<FilterValues>) => void;
  onResetFilters: () => void;
  resultsCount: number;
  locale?: SupportedLocale;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  resultsCount,
  locale = 'en'
}) => {
  const strings = t[locale === 'pl' ? 'pl' : 'en'];
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Active filter chip badges that can be removed individually
  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];

  if (filters.maxRent < 5000) {
    activeChips.push({
      key: 'price',
      label: `≤ PLN ${filters.maxRent}`,
      onRemove: () => onFilterChange({ maxRent: 5000 })
    });
  }

  if (filters.moveInDate) {
    activeChips.push({
      key: 'date',
      label: `${strings.searchMoveInDate}: ${filters.moveInDate}`,
      onRemove: () => onFilterChange({ moveInDate: '' })
    });
  }

  if (filters.roomType && filters.roomType !== 'All room types' && filters.roomType !== 'All Types') {
    activeChips.push({
      key: 'roomType',
      label: filters.roomType,
      onRemove: () => onFilterChange({ roomType: 'All room types' })
    });
  }

  if (filters.isFurnishedOnly) {
    activeChips.push({
      key: 'furnished',
      label: strings.filterFurnished,
      onRemove: () => onFilterChange({ isFurnishedOnly: false })
    });
  }

  if (filters.billsIncludedOnly) {
    activeChips.push({
      key: 'bills',
      label: strings.filterBillsIncluded,
      onRemove: () => onFilterChange({ billsIncludedOnly: false })
    });
  }

  if (filters.meldunekOnly) {
    activeChips.push({
      key: 'meldunek',
      label: strings.filterMeldunek,
      onRemove: () => onFilterChange({ meldunekOnly: false })
    });
  }

  const resultsLabel = resultsCount === 1
    ? `1 ${strings.roomCountSingular}`
    : `${resultsCount} ${strings.roomsCount}`;

  return (
    <div className="w-full space-y-3">
      {/* Horizontal Filter Row (Scrollable on mobile without wrapping awkwardly, Screenshot 6) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none no-scrollbar">
        {/* Furnished Pill */}
        <button
          type="button"
          onClick={() => onFilterChange({ isFurnishedOnly: !filters.isFurnishedOnly })}
          className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer ${
            filters.isFurnishedOnly
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-800 border-slate-200/90 hover:border-slate-300'
          }`}
        >
          {locale === 'pl' ? 'Umeblowane' : 'Furnished'}
        </button>

        {/* Bills included Pill */}
        <button
          type="button"
          onClick={() => onFilterChange({ billsIncludedOnly: !filters.billsIncludedOnly })}
          className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer ${
            filters.billsIncludedOnly
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-800 border-slate-200/90 hover:border-slate-300'
          }`}
        >
          {locale === 'pl' ? 'Rachunki w cenie' : 'Bills included'}
        </button>

        {/* Meldunek OK Pill */}
        <button
          type="button"
          onClick={() => onFilterChange({ meldunekOnly: !filters.meldunekOnly })}
          className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer ${
            filters.meldunekOnly
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-800 border-slate-200/90 hover:border-slate-300'
          }`}
        >
          {locale === 'pl' ? 'Meldunek OK' : 'Meldunek OK'}
        </button>

        {/* Flatmates Filter */}
        <button
          type="button"
          onClick={() => onFilterChange({ maxFlatmates: filters.maxFlatmates === 0 ? null : 0 })}
          className={`shrink-0 px-4 py-2 rounded-full text-xs font-medium border transition-all cursor-pointer ${
            filters.maxFlatmates === 0
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-800 border-slate-200/90 hover:border-slate-300'
          }`}
        >
          {locale === 'pl' ? 'Bez współlokatorów' : 'Flatmates'}
        </button>

        {/* More Filters Trigger (Sliders) */}
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="shrink-0 p-2 rounded-full border border-slate-200/90 text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
          aria-label="More filters"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Subheader line: Count and Sort Dropdown */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-sm font-semibold text-slate-800">
          {resultsLabel}
        </span>

        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
          <span className="text-slate-500 hidden xs:inline">{locale === 'pl' ? 'Sortuj:' : 'Sort:'}</span>
          <select
            aria-label={strings.filterSortLabel}
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as SortOption })}
            className="text-xs font-semibold bg-transparent text-slate-900 border-none focus:outline-none cursor-pointer pr-1"
          >
            <option value="soonest">{strings.sortSoonestMoveIn}</option>
            <option value="price-asc">{strings.sortPriceLowToHigh}</option>
            <option value="newest">{strings.sortNewest}</option>
          </select>
        </div>
      </div>

      {/* Active removable chips row */}
      {activeChips.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"
            >
              <span>{chip.label}</span>
              <button
                type="button"
                onClick={chip.onRemove}
                aria-label={`Remove filter ${chip.label}`}
                className="hover:bg-slate-200 rounded-full p-0.5 text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs text-indigo-600 hover:underline font-semibold ml-1 cursor-pointer"
          >
            {strings.filterReset}
          </button>
        </div>
      )}

      {/* Mobile Filter Fullscreen Sheet */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col p-4 overflow-y-auto animate-in fade-in slide-in-from-bottom">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              {locale === 'pl' ? 'Filtry pokoi' : 'Room filters'}
            </h3>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-4 space-y-6 flex-1">
            {/* Price */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                <span>{strings.filterPrice}</span>
                <span className="text-indigo-600 font-bold">≤ PLN {filters.maxRent}</span>
              </div>
              <input
                type="range"
                min={1000}
                max={5000}
                step={100}
                value={filters.maxRent}
                onChange={(e) => onFilterChange({ maxRent: Number(e.target.value) })}
                className="w-full accent-indigo-600"
              />
            </div>

            {/* Toggle checkboxes */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.isFurnishedOnly}
                  onChange={(e) => onFilterChange({ isFurnishedOnly: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                />
                <span className="text-xs font-medium text-slate-800">{strings.filterFurnished}</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.billsIncludedOnly}
                  onChange={(e) => onFilterChange({ billsIncludedOnly: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                />
                <span className="text-xs font-medium text-slate-800">{strings.filterBillsIncluded}</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.meldunekOnly}
                  onChange={(e) => onFilterChange({ meldunekOnly: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                />
                <span className="text-xs font-medium text-slate-800">{strings.filterMeldunek}</span>
              </label>
            </div>

            {/* Sort */}
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                {strings.filterSortLabel}
              </label>
              <div className="space-y-2">
                {[
                  { val: 'soonest', label: strings.sortSoonestMoveIn },
                  { val: 'price-asc', label: strings.sortPriceLowToHigh },
                  { val: 'newest', label: strings.sortNewest }
                ].map((s) => (
                  <button
                    key={s.val}
                    type="button"
                    onClick={() => onFilterChange({ sortBy: s.val as SortOption })}
                    className={`w-full p-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between ${
                      filters.sortBy === s.val
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{s.label}</span>
                    {filters.sortBy === s.val && <Check className="w-4 h-4 text-indigo-600" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-slate-100 flex gap-2">
            <button
              type="button"
              onClick={onResetFilters}
              className="flex-1 min-h-[46px] py-3 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
            >
              {strings.filterReset}
            </button>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="flex-2 min-h-[46px] py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              {locale === 'pl' ? `Pokaż (${resultsLabel})` : `Show (${resultsLabel})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
