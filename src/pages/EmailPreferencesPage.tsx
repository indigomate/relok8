import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bell, CheckCircle2, Mail, ShieldCheck } from 'lucide-react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { ENABLED_CITIES } from '../data/cities';
import type { SupportedLocale } from '../utils/formatters';

type Preferences = {
  email: string;
  unreadMessages: boolean;
  listingReminders: boolean;
  weeklyDigest: boolean;
  marketingConsent: boolean;
  digestCities: string[];
  digestRoomTypes: string[];
  digestMaxMonthlyRent?: number;
};

export function EmailPreferencesPage({ locale, onBack }: { locale: SupportedLocale; onBack: () => void }) {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const getPublic = useAction((api as any).emailPreferences.getPublic);
  const updatePublic = useAction((api as any).emailPreferences.updatePublic);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'saving' | 'saved' | 'error'>('loading');
  const [maxRent, setMaxRent] = useState('');

  useEffect(() => {
    let active = true;
    if (!token) { setStatus('error'); return; }
    getPublic({ token }).then((value) => {
      if (!active || !value) throw new Error('not_found');
      setPreferences(value as Preferences);
      setMaxRent(value.digestMaxMonthlyRent ? String(value.digestMaxMonthlyRent) : '');
      setStatus('ready');
    }).catch(() => active && setStatus('error'));
    return () => { active = false; };
  }, [getPublic, token]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!preferences) return;
    setStatus('saving');
    try {
      const value = await updatePublic({
        token,
        unreadMessages: preferences.unreadMessages,
        listingReminders: preferences.listingReminders,
        weeklyDigest: preferences.weeklyDigest && preferences.marketingConsent,
        marketingConsent: preferences.marketingConsent,
        digestCities: preferences.digestCities,
        digestRoomTypes: preferences.digestRoomTypes,
        digestMaxMonthlyRent: maxRent ? Number(maxRent) : undefined,
      });
      setPreferences(value as Preferences);
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  };

  const pl = locale === 'pl';
  if (status === 'loading') return <main className="min-h-screen bg-slate-50 grid place-items-center text-sm text-slate-600">{pl ? 'Wczytywanie ustawień…' : 'Loading preferences…'}</main>;
  if (status === 'error' || !preferences) return <main className="min-h-screen bg-slate-50 grid place-items-center p-6"><div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center"><Mail className="mx-auto mb-4 h-8 w-8 text-indigo-600"/><h1 className="text-xl font-bold text-slate-900">{pl ? 'Link jest nieprawidłowy lub wygasł' : 'This link is invalid or expired'}</h1><p className="mt-2 text-sm text-slate-600">{pl ? 'Zaloguj się i otwórz Powiadomienia, aby zmienić ustawienia.' : 'Sign in and open Notifications to change your settings.'}</p><button onClick={onBack} className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white">{pl ? 'Wróć do Relok8' : 'Return to Relok8'}</button></div></main>;

  const toggle = (key: keyof Preferences) => setPreferences((current) => current ? { ...current, [key]: !current[key] } : current);
  return (
    <main className="r8-motion-page min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-2xl">
        <button onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft className="h-4 w-4"/>{pl ? 'Relok8' : 'Relok8'}</button>
        <form onSubmit={save} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6 sm:p-8"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white"><Mail className="h-6 w-6"/></div><h1 className="text-2xl font-bold">{pl ? 'Ustawienia e-mail' : 'Email preferences'}</h1><p className="mt-2 text-sm text-slate-600">{preferences.email}</p></div>
          <div className="space-y-5 p-6 sm:p-8">
            {[
              ['unreadMessages', Bell, pl ? 'Podsumowania nieprzeczytanych wiadomości' : 'Unread-message summaries', pl ? 'Jedno przypomnienie, gdy rozmowa czeka na odpowiedź.' : 'A reminder when a conversation is waiting for you.'],
              ['listingReminders', ShieldCheck, pl ? 'Przypomnienia o wygaśnięciu ogłoszenia' : 'Listing-expiry reminders', pl ? 'Przypomnienia 7 dni i 1 dzień przed końcem najmu.' : 'Reminders 7 days and 1 day before the lease end date.'],
            ].map(([key, Icon, title, description]) => <label key={String(key)} className="flex cursor-pointer gap-4 rounded-2xl border border-slate-200 p-4"><Icon className="mt-0.5 h-5 w-5 text-indigo-600"/><span className="flex-1"><span className="block text-sm font-bold">{String(title)}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{String(description)}</span></span><input type="checkbox" checked={Boolean(preferences[key as keyof Preferences])} onChange={() => toggle(key as keyof Preferences)} className="h-5 w-5 accent-indigo-600"/></label>)}

            <section className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
              <label className="flex cursor-pointer gap-3"><input type="checkbox" checked={preferences.marketingConsent} onChange={() => setPreferences({ ...preferences, marketingConsent: !preferences.marketingConsent, weeklyDigest: !preferences.marketingConsent ? preferences.weeklyDigest : false })} className="mt-0.5 h-5 w-5 accent-indigo-600"/><span><span className="block text-sm font-bold">{pl ? 'Zgoda na wiadomości marketingowe Relok8' : 'Consent to Relok8 marketing emails'}</span><span className="mt-1 block text-xs leading-5 text-slate-600">{pl ? 'Zgadzam się na cotygodniowe oferty oraz maksymalnie dwa przypomnienia o dodaniu własnego ogłoszenia, jeśli jeszcze go nie mam. Zgodę mogę wycofać w każdej chwili.' : 'I agree to weekly property matches and at most two reminders to list my own place if I have not published one. I can withdraw consent at any time.'}</span></span></label>
              <label className="mt-4 flex items-center justify-between gap-3 border-t border-indigo-100 pt-4 text-sm font-semibold"><span>{pl ? 'Cotygodniowy przegląd ofert' : 'Weekly property digest'}</span><input type="checkbox" disabled={!preferences.marketingConsent} checked={preferences.weeklyDigest} onChange={() => toggle('weeklyDigest')} className="h-5 w-5 accent-indigo-600 disabled:opacity-40"/></label>
              {preferences.marketingConsent && preferences.weeklyDigest && <div className="mt-4 grid gap-3 sm:grid-cols-2"><select value={preferences.digestCities[0] || ''} onChange={(event) => setPreferences({ ...preferences, digestCities: event.target.value ? [event.target.value] : [] })} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">{pl ? 'Cała Polska' : 'All Poland'}</option>{ENABLED_CITIES.map((city) => <option key={city.slug} value={city.name}>{city.name}</option>)}</select><input type="number" min="500" max="100000" value={maxRent} onChange={(event) => setMaxRent(event.target.value)} placeholder={pl ? 'Maks. czynsz (PLN)' : 'Max rent (PLN)'} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"/></div>}
            </section>
            {status === 'saved' && <p role="status" className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4"/>{pl ? 'Ustawienia zapisane.' : 'Preferences saved.'}</p>}
            <button disabled={status === 'saving'} className="min-h-12 w-full rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">{status === 'saving' ? (pl ? 'Zapisywanie…' : 'Saving…') : (pl ? 'Zapisz ustawienia' : 'Save preferences')}</button>
          </div>
        </form>
      </div>
    </main>
  );
}
