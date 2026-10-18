import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Award, Shield, CheckCircle2, Clock, Sparkles, 
  AlertCircle, Info, MessageSquare, Calendar, Key, Plus, 
  Search, ArrowRight, UserCheck
} from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';
import { RewardEvent, RewardConfig, InsurancePlanConfig } from '../types/relok8';
import { getRewards } from '../lib/api';
import { navigateTo } from '../utils/router';

interface RewardsPageProps {
  onBack: () => void;
  locale?: SupportedLocale;
  currentUser?: { id?: string; name?: string; email?: string; role?: string } | null;
  onOpenIntake?: () => void;
}

export const RewardsPage: React.FC<RewardsPageProps> = ({ 
  onBack, 
  locale = 'en',
  currentUser,
  onOpenIntake
}) => {
  const [points, setPoints] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [events, setEvents] = useState<RewardEvent[]>([]);
  const [config, setConfig] = useState<RewardConfig | null>(null);

  const activeRole = currentUser?.role || 'prospect';
  const isProspect = activeRole === 'prospect';
  const isLandlord = activeRole === 'landlord';
  const isTenant = activeRole === 'tenant';

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getRewards();
        // If current user is a tenant, use real points, otherwise preview
        setPoints(isTenant ? data.points : 0);
        setUnlocked(isTenant ? data.unlocked : false);
        setEvents(isTenant ? data.events : []);
        setConfig(data.config);
      } catch (e) {
        console.warn('Failed to load rewards:', e);
      }
    };
    load();
  }, [isTenant]);

  const threshold = config?.thresholdPoints || 15;
  const progressPercent = Math.min(100, Math.round((points / threshold) * 100));

  const handleGoToListing = () => {
    if (onOpenIntake) {
      onOpenIntake();
    } else {
      const prefix = locale === 'pl' ? '/pl' : '';
      navigateTo(`${prefix}/list`);
    }
  };

  const handleBrowseRooms = () => {
    const prefix = locale === 'pl' ? '/pl' : '';
    navigateTo(`${prefix}/`);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] text-left pb-36 sm:pb-24 font-sans">
      {/* Top Header - Compact single-row layout */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 sm:h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1 text-slate-700 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight truncate">
              {locale === 'pl' ? 'Program Nagród i Odznaki' : 'Tenant Rewards & Badges'}
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block truncate">
              {locale === 'pl'
                ? 'Odpowiadaj sprawnie na pytania studentów, aby zdobyć odznakę i wyróżnienie ogłoszenia.'
                : 'Answer prospects promptly to earn points, unlock the Fast Responder badge, and boost your room.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoToListing}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer shrink-0 ml-2"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{locale === 'pl' ? 'Wystaw' : 'List room'}</span>
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8">

        {/* Prospect & Non-Tenant Guidance Banner */}
        {isProspect && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>{locale === 'pl' ? 'Informacja dla poszukujących' : 'Prospect Notice'}</span>
                  <span>·</span>
                  <span>{locale === 'pl' ? 'Program dla lokatorów' : 'For Departing Tenants'}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  {locale === 'pl' 
                    ? 'Szukasz pokoju na przejęcie umowy w Polsce?' 
                    : 'Looking for a room to take over in Poland?'}
                </h2>
                <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
                  {locale === 'pl'
                    ? 'Program Odznak Aktywności nagradza obecnych lokatorów za szybkie odpowiedzi na Twoje zapytania. Jeśli sam planujesz wyprowadzkę przed końcem umowy, dodaj ogłoszenie, aby zacząć zbierać punkty.'
                    : 'The Tenant Rewards program rewards current tenants for responding quickly to your inquiries. If you are preparing to leave your own lease early, list your room to start earning badges and visibility.'}
                </p>
              </div>

              <div className="flex flex-wrap sm:flex-col gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleBrowseRooms}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl transition-all shadow-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{locale === 'pl' ? 'Przeglądaj pokoje' : 'Browse Rooms'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleGoToListing}
                  className="px-4 py-2.5 bg-indigo-700/80 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl border border-indigo-400/30 transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{locale === 'pl' ? 'Wystaw swój pokój' : 'List Your Room'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Landlord Notice Banner */}
        {isLandlord && (
          <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-950 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
              <Shield className="w-4 h-4 text-amber-600" />
              <span>{locale === 'pl' ? 'Konto Wynajmującego' : 'Landlord Portal View'}</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              {locale === 'pl'
                ? 'Wynajmujący nie zbierają punktów lokatorskich. Zamiast tego możesz monitorować wskaźnik odpowiedzi lokatorów w swoim pulpicie właściciela, aby upewnić się, że zapytania studentów są obsługiwane sprawnie.'
                : 'Landlords do not accrue response points. You can track your tenants’ responsiveness in your Landlord Portal to ensure prospective student takeovers are handled smoothly.'}
            </p>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Progress Meter & Status (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Rewards Progress Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3.5 rounded-2xl bg-indigo-600 text-white shrink-0 shadow-2xs">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      {locale === 'pl' ? 'Program Aktywności Lokatora' : 'Tenant Activity Program'}
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                      {points} / {threshold} Points Earned
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {locale === 'pl'
                        ? `Zdobądź ${threshold} punktów, aby odblokować odznakę Szybkiego Kontaktu i priorytetowe pozycjonowanie ogłoszenia.`
                        : `Reach ${threshold} points to unlock your Fast Responder Badge and top-rank your listing.`}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 self-start sm:self-auto">
                  {unlocked ? (
                    <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{locale === 'pl' ? 'Odznaka Odblokowana' : 'Badge Unlocked'}</span>
                    </span>
                  ) : (
                    <span className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                      {threshold - points} pts remaining
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>{locale === 'pl' ? 'Postęp do odznaki' : 'Progress towards badge'}</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="w-full h-3.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                  <div
                    className={`h-full transition-all duration-700 rounded-full ${
                      unlocked ? 'bg-emerald-600' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Fast Responder Badge Benefit Card */}
              <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>{locale === 'pl' ? 'Odznaka Szybkiego Kontaktu & Wyróżnienie' : 'Fast Responder Badge & Search Boost'}</span>
                  </div>
                  <p className="text-xs text-indigo-900/80 leading-relaxed">
                    {locale === 'pl'
                      ? 'Pokoje aktywnych lokatorów otrzymują wyróżniającą odznakę zaufania i są wyświetlane na początku wyników wyszukiwania.'
                      : 'Listings from responsive tenants receive a priority badge and are placed at the top of student searches.'}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-indigo-700 bg-white px-3 py-1 rounded-full border border-indigo-200 shadow-2xs">
                    {unlocked ? (locale === 'pl' ? 'Aktywne na ogłoszeniu' : 'Active on listing') : (locale === 'pl' ? 'Wymaga 15 pkt' : '15 pts required')}
                  </span>
                </div>
              </div>
            </div>

            {/* Activity Log */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  {locale === 'pl' ? 'Dziennik aktywności' : 'Recent Points Activity'}
                </h3>
                <span className="text-xs text-slate-400">
                  {events.length} {locale === 'pl' ? 'wpisów' : 'events'}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {events.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 space-y-2">
                    <Clock className="w-7 h-7 mx-auto text-slate-300 stroke-[1.5]" />
                    <p className="text-xs font-medium">
                      {isProspect 
                        ? (locale === 'pl' ? 'Zalogowano jako poszukujący. Punkty naliczają się dla lokatorów.' : 'Logged in as prospect. Points are earned by departing tenants.')
                        : (locale === 'pl' ? 'Brak zarejestrowanej aktywności. Odpowiedz na pierwsze zapytanie!' : 'No points activity recorded yet. Reply to an inquiry to earn points!')}
                    </p>
                  </div>
                ) : (
                  events.map((e) => (
                    <div key={e.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{e.description || e.kind}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{new Date(e.createdAt).toLocaleDateString()}</div>
                      </div>
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        +{e.points} pts
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right Column: How to Earn Points & Rules (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* How Points Are Earned */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                {locale === 'pl' ? 'Jak zdobywać punkty' : 'How You Earn Points'}
              </h3>
              
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-slate-900">+1 Point</span>
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    {locale === 'pl' ? 'Odpowiedź na zapytanie' : 'Human reply'}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {locale === 'pl'
                      ? 'Odpowiedz na wiadomość zweryfikowanego studenta w ciągu 12h (min. 20 znaków). Max 3 pkt na wątek.'
                      : 'Reply to a verified prospect within 12 hours (min 20 characters). Maximum 3 points per thread.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-slate-900">+3 Points</span>
                    <Calendar className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    {locale === 'pl' ? 'Umówione oglądanie pokoju' : 'Viewing arranged'}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {locale === 'pl'
                      ? 'Gdy student umówi prezentację osobistą lub wideo przez wątek czatu.'
                      : 'When a prospective tenant schedules an in-person or video walk-through.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-slate-900">+10 Points</span>
                    <Key className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    {locale === 'pl' ? 'Zakończona cesja umowy' : 'Handover completed'}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {locale === 'pl'
                      ? 'Gdy nowy najemca podpisze umowę cesji i przejmie Twój pokój.'
                      : 'When your replacement tenant signs the Cesja takeover agreement.'}
                  </p>
                </div>
              </div>

              {/* Anti-Gaming Rules Note */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>{locale === 'pl' ? 'Zasady uczciwości:' : 'Anti-gaming rules:'}</strong>{' '}
                  {locale === 'pl'
                    ? 'Punkty naliczają się tylko dla unikalnych wątków zweryfikowanych użytkowników. Automatyczne odpowiedzi Onlo AI nie naliczają punktów.'
                    : 'Counted only on distinct prospect threads with verified users. Minimum 20 characters per reply. Automated Onlo responses do not award points.'}
                </span>
              </div>
            </div>

            {/* Platform Trust & Legal Notice */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 leading-relaxed">
              {locale === 'pl'
                ? 'Relok8 to platforma łącząca studentów, ekspatów i wynajmujących. Nie świadczymy usług ubezpieczeniowych, depozytowych ani pośrednictwa finansowego.'
                : 'Relok8 is a peer-to-peer community platform connecting students, expats, and landlords. Relok8 does not provide insurance policies, depository escrow, or regulated financial services.'}
            </div>

          </div>

        </div>

      </main>
    </div>
  );
};
