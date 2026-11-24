import { ArrowLeft, Plus } from 'lucide-react';
import { PlaceErrorBoundary } from '../components/PlaceErrorBoundary';
import { TakeoverProgress } from '../components/TakeoverProgress';
import { navigateTo } from '../utils/router';
import type { SupportedLocale } from '../utils/formatters';
import type { Listing } from '../types';

interface PlacePageProps {
  onRequireLogin?: () => void;
  onBack: () => void;
  locale?: SupportedLocale;
  onOpenListing?: (id: string) => void;
  onOpenMessages?: () => void;
  currentUser?: { id?: string; name?: string; email?: string; role?: string } | null;
  listings?: Listing[];
  onDeleteListing?: (id: string) => Promise<boolean | void> | void;
  onOpenIntake?: () => void;
}

export function PlacePage({ onRequireLogin, onBack, locale = 'en', onDeleteListing, onOpenIntake }: PlacePageProps) {
  const pl = locale === 'pl';
  return (
    <main className="r8-motion-page r8-place min-h-screen bg-slate-50 text-slate-900 pb-32">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 text-sm text-slate-600 hover:text-indigo-700"><ArrowLeft size={16} aria-hidden="true" />{pl ? 'Wróć do ogłoszeń' : 'Back to Explore'}</button>
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2"><h1 className="text-3xl font-bold tracking-tight">{pl ? 'Moje miejsce' : 'My Place'}</h1><p className="text-sm text-slate-600">{pl ? 'Twoje lokale, wnioski i kolejne kroki — w jednym miejscu.' : 'Your homes, applications and next steps, together.'}</p></div>
          <button type="button" onClick={onOpenIntake || (() => navigateTo(pl ? '/pl/list' : '/list'))} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus size={16} aria-hidden="true" />{pl ? 'Dodaj ogłoszenie' : 'Add a listing'}</button>
        </header>
        <PlaceErrorBoundary pl={pl}><TakeoverProgress locale={locale} onDeleteListing={onDeleteListing} onRequireLogin={onRequireLogin || (() => navigateTo(pl ? '/pl/sign-in' : '/sign-in'))} /></PlaceErrorBoundary>
      </div>
    </main>
  );
}
