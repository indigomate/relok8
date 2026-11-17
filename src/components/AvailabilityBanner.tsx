import { CalendarDays } from 'lucide-react';
import { availabilityState, timingLabels, isDateOnly } from '../utils/leaseTiming';
import { formatDate, type SupportedLocale } from '../utils/formatters';
import type { Listing } from '../types';
export function AvailabilityBanner({listing, locale, compact = false}: {listing: Listing; locale: SupportedLocale; compact?: boolean}) {
  const state = availabilityState(listing, locale);
  const labels = timingLabels(listing.occupancyStatus, locale);
  return <div className={`r8-availability rounded-xl border border-white/80 bg-white/95 text-slate-900 backdrop-blur-sm ${compact ? 'r8-availability-compact px-3 py-2 shadow-sm' : 'border-slate-200 bg-slate-50 p-4 space-y-2'}`}>
    <div className="flex items-center gap-2"><CalendarDays size={compact ? 15 : 18} aria-hidden="true" className={state.kind === 'now' ? 'text-emerald-700 shrink-0' : 'text-indigo-700 shrink-0'} /><strong className={compact ? 'text-base leading-snug' : 'text-lg'}>{state.title}{listing.occupancyStatus === 'vacant' && state.kind === 'upcoming' ? ' ' + formatDate(listing.availableDate, locale) : ''}</strong></div>
    {(state.kind === 'upcoming' && listing.occupancyStatus === 'occupied' || state.kind === 'confirm' && isDateOnly(listing.availableDate)) && <p className="text-xs font-semibold mt-1">{labels.date}: {formatDate(listing.availableDate, locale)}</p>}
    {compact && <p className="text-xs text-slate-600 mt-1">{state.description}</p>}
    {!compact && <><p className="text-sm text-slate-600">{state.description}</p><p className="text-sm">{labels.date}: {formatDate(listing.availableDate, locale)} · {labels.end}: {formatDate(listing.leaseEndDate, locale)}</p><p className="text-xs text-slate-500">{labels.notice}</p></>}
  </div>;
}
