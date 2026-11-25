import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Bell, Share2, Heart, ShieldCheck, MessageSquare, FileText, Home, CheckCircle2, Clock3, Mail, Settings2, X, ChevronRight } from 'lucide-react';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { ENABLED_CITIES } from '../data/cities';
import { SupportedLocale } from '../utils/formatters';
import { Notification } from '../types/relok8';
import { getNotifications, markNotificationRead } from '../lib/api';

interface NotificationsPageProps {
  onBack: () => void;
  locale?: SupportedLocale;
  onOpenListing?: (id: string) => void;
  onRequireLogin?: () => void;
  currentUser?: { id?: string; name?: string; email?: string; role?: string } | null;
}

type NotificationCategory = 'all' | 'saved' | 'inquiries' | 'approvals';

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  onBack,
  locale = 'en',
  onOpenListing,
  onRequireLogin,
  currentUser
}) => {
  const preferencesDialog = React.useRef<HTMLDialogElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState<NotificationCategory>('all');
  
  const { isAuthenticated } = useConvexAuth();
  const whatsappPreferences = useQuery(api.whatsapp.getPreferences, isAuthenticated ? {} : 'skip');
  const recentWhatsappDeliveries = useQuery(api.whatsapp.getRecentDeliveries, isAuthenticated ? {} : 'skip');
  const configureWhatsapp = useMutation(api.whatsapp.configurePreferences);
  const pauseWhatsapp = useMutation(api.whatsapp.pausePreferences);
  const emailPreferences = useQuery((api as any).emailPreferences.getMine, isAuthenticated ? {} : 'skip') as any;
  const updateEmailPreferences = useMutation((api as any).emailPreferences.updateMine);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappCity, setWhatsappCity] = useState('All Poland');
  const [whatsappRoomType, setWhatsappRoomType] = useState('All room types');
  const [whatsappMaxRent, setWhatsappMaxRent] = useState('');
  const [whatsappHour, setWhatsappHour] = useState('8');
  const [whatsappConsent, setWhatsappConsent] = useState(false);
  const [whatsappDigestEnabled, setWhatsappDigestEnabled] = useState(true);
  const [whatsappMessagesEnabled, setWhatsappMessagesEnabled] = useState(false);
  const [whatsappSaving, setWhatsappSaving] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [emailUnread, setEmailUnread] = useState(true);
  const [emailListingReminders, setEmailListingReminders] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);
  const [emailConsent, setEmailConsent] = useState(false);
  const [emailCity, setEmailCity] = useState('');
  const [emailMaxRent, setEmailMaxRent] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!whatsappPreferences) return;
    setWhatsappCity(whatsappPreferences.cities[0] || 'All Poland');
    setWhatsappRoomType(whatsappPreferences.roomTypes[0] || 'All room types');
    setWhatsappMaxRent(whatsappPreferences.maxMonthlyRent ? String(whatsappPreferences.maxMonthlyRent) : '');
    setWhatsappHour(String(whatsappPreferences.sendHourLocal));
    setWhatsappConsent(whatsappPreferences.active);
    setWhatsappDigestEnabled(whatsappPreferences.dailyDigestEnabled !== false);
    setWhatsappMessagesEnabled(whatsappPreferences.messageNotificationsEnabled === true);
  }, [whatsappPreferences]);

  useEffect(() => {
    if (!emailPreferences) return;
    setEmailUnread(emailPreferences.unreadMessages);
    setEmailListingReminders(emailPreferences.listingReminders);
    setEmailDigest(emailPreferences.weeklyDigest);
    setEmailConsent(emailPreferences.marketingConsent);
    setEmailCity(emailPreferences.digestCities[0] || '');
    setEmailMaxRent(emailPreferences.digestMaxMonthlyRent ? String(emailPreferences.digestMaxMonthlyRent) : '');
  }, [emailPreferences]);

  const handleEmailSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isAuthenticated) { onRequireLogin?.(); return; }
    setEmailSaving(true);
    setEmailStatus(null);
    try {
      await updateEmailPreferences({
        locale: locale === 'pl' ? 'pl' : 'en',
        unreadMessages: emailUnread,
        listingReminders: emailListingReminders,
        weeklyDigest: emailDigest && emailConsent,
        marketingConsent: emailConsent,
        digestCities: emailCity ? [emailCity] : [],
        digestRoomTypes: [],
        digestMaxMonthlyRent: emailMaxRent ? Number(emailMaxRent) : undefined,
      });
      setEmailStatus(locale === 'pl' ? 'Ustawienia e-mail zapisane.' : 'Email preferences saved.');
    } catch (error) {
      setEmailStatus(error instanceof Error ? error.message : (locale === 'pl' ? 'Nie udało się zapisać ustawień.' : 'Could not save email preferences.'));
    } finally {
      setEmailSaving(false);
    }
  };

  const handleWhatsappSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isAuthenticated) {
      onRequireLogin?.();
      return;
    }
    setWhatsappSaving(true);
    setWhatsappStatus(null);
    try {
      const maxMonthlyRent = whatsappMaxRent.trim() ? Number(whatsappMaxRent) : undefined;
      await configureWhatsapp({
        phoneE164: whatsappPhone.trim() || undefined,
        cities: whatsappCity === 'All Poland' ? [] : [whatsappCity],
        roomTypes: whatsappRoomType === 'All room types' ? [] : [whatsappRoomType],
        maxMonthlyRent,
        locale: locale === 'pl' ? 'pl' : 'en',
        sendHourLocal: Number(whatsappHour),
        consent: whatsappConsent,
        dailyDigestEnabled: whatsappDigestEnabled,
        messageNotificationsEnabled: whatsappMessagesEnabled,
      });
      setWhatsappPhone('');
      setWhatsappStatus({
        kind: 'success',
        message: locale === 'pl'
          ? 'Zapisano wybrane powiadomienia WhatsApp.'
          : 'Your WhatsApp notification choices are saved.',
      });
    } catch (error) {
      setWhatsappStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : (locale === 'pl' ? 'Nie udało się zapisać alertu.' : 'Could not save the alert.'),
      });
    } finally {
      setWhatsappSaving(false);
    }
  };

  const handleWhatsappPause = async () => {
    setWhatsappSaving(true);
    setWhatsappStatus(null);
    try {
      await pauseWhatsapp({});
      setWhatsappConsent(false);
      setWhatsappStatus({
        kind: 'success',
        message: locale === 'pl' ? 'Alerty WhatsApp zostały wstrzymane.' : 'WhatsApp alerts are paused.',
      });
    } catch (error) {
      setWhatsappStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Could not pause alerts.' });
    } finally {
      setWhatsappSaving(false);
    }
  };

  const loadData = async () => {
    try {
      const notifs = await getNotifications();
      setNotifications(notifs);
    } catch (e) {
      console.warn('Failed to load notifications:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: Date.now() } : n));
    } catch (e) {}
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.readAt);
    await Promise.all(unread.map(n => markNotificationRead(n.id).catch(() => {})));
    setNotifications(prev => prev.map(n => ({ ...n, readAt: Date.now() })));
  };

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'saved') {
        return n.type === 'saved_available' || (n.body && n.body.toLowerCase().includes('saved'));
      }
      if (activeFilter === 'inquiries') {
        return n.type === 'message' || (n.body && n.body.toLowerCase().includes('inquiry'));
      }
      if (activeFilter === 'approvals') {
        return n.type === 'exit_request' || (n.body && (n.body.toLowerCase().includes('consent') || n.body.toLowerCase().includes('approved')));
      }
      return true;
    });
  }, [notifications, activeFilter]);

  const unreadCount = notifications.filter(n => !n.readAt).length;

  return (
    <main className="r8-notifications flex-1 w-full bg-slate-50 text-slate-900 text-left pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 min-h-11 text-sm text-slate-600 hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-600"><ArrowLeft size={18}/>{locale === 'pl' ? 'Wróć' : 'Back'}</button>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0"><h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{locale === 'pl' ? 'Powiadomienia' : 'Notifications'}</h1><p className="mt-2 text-sm text-slate-600">{locale === 'pl' ? 'Bądź na bieżąco z aktywnością najmu.' : 'Stay up to date with your rental activity.'}</p></div>
          <button type="button" onClick={() => preferencesDialog.current?.showModal()} aria-label={locale === 'pl' ? 'Ustawienia powiadomień' : 'Notification settings'} className="shrink-0 w-11 h-11 rounded-xl border border-slate-200 bg-white grid place-items-center focus-visible:ring-2 focus-visible:ring-indigo-600"><Settings2 size={20}/></button>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {[
            { label: locale === 'pl' ? 'Nieprzeczytane' : 'Unread', count: unreadCount, Icon: Bell },
            { label: locale === 'pl' ? 'Wiadomości' : 'Messages', count: notifications.filter(n => n.type === 'message').length, Icon: MessageSquare },
            { label: locale === 'pl' ? 'Zapisane pokoje' : 'Saved rooms', count: notifications.filter(n => n.type === 'saved_available').length, Icon: Heart },
          ].map(({label,count,Icon}) => <div key={label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 sm:p-5"><Icon size={20} className="text-indigo-600"/><div className="mt-3 text-2xl font-bold tabular-nums">{count}</div><div className="text-xs sm:text-sm text-slate-600 break-words">{label}</div></div>)}
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="shrink-0 rounded-xl bg-emerald-50 text-emerald-700 p-3"><Share2 size={20}/></div>
          <div className="min-w-0 flex-1"><h2 className="text-sm font-semibold">{locale === 'pl' ? 'Nie przegap aktualizacji' : 'Never miss an update'}</h2><p className="text-xs sm:text-sm text-slate-600">{locale === 'pl' ? 'Zarządzaj alertami WhatsApp i e-mail.' : 'Manage your WhatsApp and email alerts.'}</p></div>
          <button type="button" onClick={() => preferencesDialog.current?.showModal()} className="shrink-0 min-h-11 px-3 rounded-xl border border-slate-200 text-sm font-semibold text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-600">{locale === 'pl' ? 'Ustawienia' : 'Manage'}</button>
        </div>
        <section aria-label={locale === 'pl' ? 'Aktywność' : 'Activity'} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">{locale === 'pl' ? 'Aktywność' : 'Activity'}</h2>{unreadCount > 0 && <button type="button" onClick={handleMarkAllAsRead} className="min-h-11 text-sm font-semibold text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-600">{locale === 'pl' ? 'Oznacz wszystkie jako przeczytane' : 'Mark all as read'}</button>}</div>
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`min-h-11 px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                    activeFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {locale === 'pl' ? 'Wszystkie' : 'All'}
                  {notifications.length > 0 && (
                    <span className="ml-1.5 text-[11px] text-slate-400 font-normal">
                      ({notifications.length})
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter('saved')}
                  className={`min-h-11 px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                    activeFilter === 'saved'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {locale === 'pl' ? 'Zapisane pokoje' : 'Saved rooms'}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter('inquiries')}
                  className={`min-h-11 px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                    activeFilter === 'inquiries'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {locale === 'pl' ? 'Zapytania' : 'Inquiries'}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFilter('approvals')}
                  className={`min-h-11 px-3 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                    activeFilter === 'approvals'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {locale === 'pl' ? 'Zgody i umowy' : 'Approvals'}
                </button>
              </div>

              <span className="text-xs text-slate-400">
                {unreadCount > 0 ? (
                  <span className="font-semibold text-indigo-600">
                    {unreadCount} {locale === 'pl' ? 'nieprzeczytane' : 'unread'}
                  </span>
                ) : (
                  locale === 'pl' ? 'Wszystko przeczytane' : 'All caught up'
                )}
              </span>
            </div>

            {/* Notifications Feed */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden divide-y divide-slate-100">
              {filteredNotifications.length === 0 ? (
                <div className="py-16 px-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                    <Bell className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {locale === 'pl' ? 'Brak powiadomień w tej kategorii' : 'No notifications in this category'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    {activeFilter === 'saved'
                      ? (locale === 'pl' ? 'Zapisz pokój na liście, aby otrzymywać powiadomienia o jego dostępności.' : 'Save rooms to your wishlist to get immediate takeover alerts.')
                      : (locale === 'pl' ? 'Wszystkie najnowsze wiadomości i alerty będą widoczne w tym miejscu.' : 'New messages, takeover approvals, and saved room updates will appear here.')}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((n) => {
                  const isUnread = !n.readAt;
                  return (
                    <div
                      key={n.id}
                      className={`p-4 sm:p-5 flex flex-wrap sm:flex-nowrap items-start justify-between gap-3 transition-colors ${
                        isUnread ? 'bg-indigo-50/30' : 'bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                          n.type === 'saved_available'
                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                            : n.type === 'exit_request'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                        }`}>
                          {n.type === 'saved_available' ? (
                            <Home className="w-4 h-4" />
                          ) : n.type === 'exit_request' ? (
                            <FileText className="w-4 h-4" />
                          ) : (
                            <Bell className="w-4 h-4" />
                          )}
                        </div>
                        
                        <div className="min-w-0">
                          <div className="text-sm text-slate-900 font-semibold leading-relaxed break-words">
                            {n.body}
                          </div>
                          <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                            <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>·</span>
                            <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                            {isUnread && (
                              <>
                                <span>·</span>
                                <span className="font-semibold text-indigo-600">
                                  {locale === 'pl' ? 'Nowe' : 'New'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-center sm:self-start">
                        {isUnread && (
                          <button
                            type="button"
                            onClick={() => handleMarkAsRead(n.id)}
                            className="min-h-11 px-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            {locale === 'pl' ? 'Oznacz' : 'Read'}
                          </button>
                        )}
                        {n.placeId && onOpenListing && (
                          <button
                            type="button"
                            onClick={() => onOpenListing(n.placeId!)}
                            className="min-h-11 px-3 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                          >
                            {locale === 'pl' ? 'Zobacz pokój' : 'View room'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
        </section>
        <dialog ref={preferencesDialog} aria-labelledby="notification-preferences-title" className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-full sm:max-w-lg overflow-y-auto overscroll-contain bg-slate-50 p-0 shadow-2xl backdrop:bg-slate-900/40">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-white border-b border-slate-200 px-4 py-3">
            <h2 id="notification-preferences-title" className="text-lg font-semibold">{locale === 'pl' ? 'Ustawienia powiadomień' : 'Notification settings'}</h2>
            <button autoFocus type="button" onClick={() => preferencesDialog.current?.close()} aria-label={locale === 'pl' ? 'Zamknij' : 'Close'} className="w-11 h-11 grid place-items-center rounded-xl hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-600"><X size={22}/></button>
          </div>
          <div className="p-4 sm:p-5 space-y-4">
            {/* WhatsApp-first apartment digest settings */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      {locale === 'pl' ? 'Powiadomienia WhatsApp' : 'WhatsApp notifications'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {locale === 'pl'
                        ? 'Wybierz codzienny przegląd mieszkań, powiadomienia o nowych wiadomościach lub oba.'
                        : 'Choose a daily apartment digest, new-message notifications, or both.'}
                    </p>
                  </div>
                </div>
                {whatsappPreferences?.active && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 px-2.5 py-1 text-[11px] font-bold shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {locale === 'pl' ? 'Aktywny' : 'Active'}
                  </span>
                )}
              </div>

              {!isAuthenticated ? (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 space-y-3">
                  <p className="text-xs leading-5 text-slate-700">
                    {locale === 'pl' ? 'Zaloguj się, aby połączyć numer WhatsApp z własnymi filtrami mieszkań.' : 'Sign in to connect your WhatsApp number to your apartment filters.'}
                  </p>
                  <button type="button" onClick={onRequireLogin} className="min-h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer">
                    {locale === 'pl' ? 'Zaloguj się' : 'Sign in'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleWhatsappSave} className="space-y-4">
                  <fieldset className="space-y-2">
                    <legend className="text-xs font-bold text-slate-700">{locale === 'pl' ? 'Co wysyłać' : 'What to send'}</legend>
                    <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 cursor-pointer">
                      <input type="checkbox" checked={whatsappMessagesEnabled} onChange={(event) => setWhatsappMessagesEnabled(event.target.checked)} className="mt-0.5 w-4 h-4 accent-indigo-600" />
                      <span><span className="block text-xs font-bold text-slate-800">{locale === 'pl' ? 'Nowe wiadomości' : 'New messages'}</span><span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{locale === 'pl' ? 'Wyślemy nazwę nadawcy, nazwę ogłoszenia i bezpieczny link. Treść rozmowy pozostaje w Relok8.' : 'We send the sender name, listing name, and a secure link. Message content stays inside Relok8.'}</span></span>
                    </label>
                    <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 cursor-pointer">
                      <input type="checkbox" checked={whatsappDigestEnabled} onChange={(event) => setWhatsappDigestEnabled(event.target.checked)} className="mt-0.5 w-4 h-4 accent-indigo-600" />
                      <span><span className="block text-xs font-bold text-slate-800">{locale === 'pl' ? 'Codzienny przegląd mieszkań' : 'Daily apartment digest'}</span><span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{locale === 'pl' ? 'Jedna wiadomość dziennie z nowymi ofertami pasującymi do filtrów.' : 'One daily message with new listings matching your filters.'}</span></span>
                    </label>
                  </fieldset>
                  <div>
                    <label htmlFor="whatsapp-phone" className="block text-xs font-bold text-slate-700 mb-1.5">
                      {locale === 'pl' ? 'Numer WhatsApp' : 'WhatsApp number'}
                    </label>
                    <input
                      id="whatsapp-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={whatsappPhone}
                      onChange={(event) => setWhatsappPhone(event.target.value)}
                      placeholder={whatsappPreferences ? `${whatsappPreferences.maskedPhone} · ${locale === 'pl' ? 'pozostaw puste, aby zachować' : 'leave blank to keep'}` : '+48 123 456 789'}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                    <p className="mt-1.5 text-[11px] text-slate-500">
                      {locale === 'pl' ? 'Użyj formatu międzynarodowego z kodem kraju.' : 'Use international format with the country code.'}
                    </p>
                  </div>

                  {whatsappDigestEnabled && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="text-xs font-bold text-slate-700">
                      {locale === 'pl' ? 'Miasto' : 'City'}
                      <select value={whatsappCity} onChange={(event) => setWhatsappCity(event.target.value)} className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600">
                        <option value="All Poland">{locale === 'pl' ? 'Cała Polska' : 'All Poland'}</option>
                        {ENABLED_CITIES.map((city) => <option key={city.slug} value={city.name}>{city.name}</option>)}
                      </select>
                    </label>
                    <label className="text-xs font-bold text-slate-700">
                      {locale === 'pl' ? 'Typ lokalu' : 'Room type'}
                      <select value={whatsappRoomType} onChange={(event) => setWhatsappRoomType(event.target.value)} className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600">
                        <option value="All room types">{locale === 'pl' ? 'Wszystkie typy' : 'All room types'}</option>
                        <option value="Private room">{locale === 'pl' ? 'Pokój prywatny' : 'Private room'}</option>
                        <option value="Studio">Studio</option>
                        <option value="Shared room">{locale === 'pl' ? 'Pokój współdzielony' : 'Shared room'}</option>
                        <option value="Entire apartment">{locale === 'pl' ? 'Całe mieszkanie' : 'Entire apartment'}</option>
                      </select>
                    </label>
                    <label className="text-xs font-bold text-slate-700">
                      {locale === 'pl' ? 'Maksymalny koszt miesięczny' : 'Maximum monthly cost'}
                      <div className="relative mt-1.5">
                        <input type="number" min="500" max="100000" step="50" value={whatsappMaxRent} onChange={(event) => setWhatsappMaxRent(event.target.value)} placeholder={locale === 'pl' ? 'Bez limitu' : 'No limit'} className="w-full h-11 px-3 pr-12 rounded-xl border border-slate-200 bg-white text-sm font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">PLN</span>
                      </div>
                    </label>
                    <label className="text-xs font-bold text-slate-700">
                      {locale === 'pl' ? 'Godzina wysyłki' : 'Delivery time'}
                      <div className="relative mt-1.5">
                        <Clock3 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select value={whatsappHour} onChange={(event) => setWhatsappHour(event.target.value)} className="w-full h-11 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-sm font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600">
                          {[7, 8, 9, 10, 12, 18, 20].map((hour) => <option key={hour} value={hour}>{String(hour).padStart(2, '0')}:00 · Europe/Warsaw</option>)}
                        </select>
                      </div>
                    </label>
                  </div>}

                  <label className="flex items-start gap-2.5 rounded-xl bg-slate-50 border border-slate-200 p-3 cursor-pointer">
                    <input type="checkbox" checked={whatsappConsent} onChange={(event) => setWhatsappConsent(event.target.checked)} className="mt-0.5 w-4 h-4 accent-indigo-600" />
                    <span className="text-[11px] leading-4 text-slate-600">
                      {locale === 'pl'
                        ? 'Wyrażam zgodę na wybrane powiadomienia WhatsApp od Relok8. Mogę w każdej chwili odpowiedzieć STOP lub wyłączyć je tutaj.'
                        : 'I agree to receive the selected WhatsApp notifications from Relok8. I can reply STOP or pause them here at any time.'}
                    </span>
                  </label>

                  {whatsappStatus && (
                    <div role="status" className={`rounded-xl px-3 py-2.5 text-xs ${whatsappStatus.kind === 'success' ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' : 'bg-rose-50 border border-rose-100 text-rose-800'}`}>
                      {whatsappStatus.message}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button type="submit" disabled={whatsappSaving || !whatsappConsent || (!whatsappDigestEnabled && !whatsappMessagesEnabled)} className="min-h-11 flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 text-white text-xs font-bold cursor-pointer disabled:cursor-not-allowed">
                      {whatsappSaving ? (locale === 'pl' ? 'Zapisywanie…' : 'Saving…') : whatsappPreferences ? (locale === 'pl' ? 'Zapisz ustawienia' : 'Save settings') : (locale === 'pl' ? 'Włącz powiadomienia' : 'Enable notifications')}
                    </button>
                    {whatsappPreferences?.active && (
                      <button type="button" onClick={handleWhatsappPause} disabled={whatsappSaving} className="min-h-11 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer">
                        {locale === 'pl' ? 'Wstrzymaj' : 'Pause'}
                      </button>
                    )}
                  </div>

                  {recentWhatsappDeliveries?.[0] && (
                    <p className="text-[11px] text-slate-500">
                      {locale === 'pl' ? 'Ostatnia dostawa' : 'Latest delivery'}: <span className="font-semibold text-slate-700 capitalize">{recentWhatsappDeliveries[0].status}</span> · {recentWhatsappDeliveries[0].digestDate}
                    </p>
                  )}
                  <p className="text-[10px] leading-4 text-slate-400">
                    {locale === 'pl' ? 'Wiadomości są wysyłane przez oficjalny interfejs WhatsApp Business po zatwierdzeniu szablonu Meta.' : 'Messages are sent through the official WhatsApp Business API after Meta approves the message template.'}
                  </p>
                </form>
              )}
            </div>

            <form onSubmit={handleEmailSave} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-start gap-3"><div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100"><Mail className="w-5 h-5" /></div><div><h3 className="text-sm font-bold text-slate-900">{locale === 'pl' ? 'Alerty e-mail' : 'Email alerts'}</h3><p className="mt-0.5 text-xs leading-5 text-slate-500">{locale === 'pl' ? 'Wybierz wiadomości produktowe i dobrowolny przegląd ofert.' : 'Choose product notifications and the optional property digest.'}</p></div></div>
              {!isAuthenticated ? <button type="button" onClick={onRequireLogin} className="min-h-10 w-full rounded-xl bg-indigo-600 text-xs font-bold text-white">{locale === 'pl' ? 'Zaloguj się' : 'Sign in'}</button> : <>
                <label className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-700"><span>{locale === 'pl' ? 'Nieprzeczytane wiadomości' : 'Unread-message summaries'}</span><input type="checkbox" checked={emailUnread} onChange={(e) => setEmailUnread(e.target.checked)} className="h-4 w-4 accent-indigo-600" /></label>
                <label className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-700"><span>{locale === 'pl' ? 'Wygaśnięcie ogłoszenia' : 'Listing-expiry reminders'}</span><input type="checkbox" checked={emailListingReminders} onChange={(e) => setEmailListingReminders(e.target.checked)} className="h-4 w-4 accent-indigo-600" /></label>
                <label className="flex items-start gap-2.5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3"><input type="checkbox" checked={emailConsent} onChange={(e) => { setEmailConsent(e.target.checked); if (!e.target.checked) setEmailDigest(false); }} className="mt-0.5 h-4 w-4 accent-indigo-600"/><span className="text-[11px] leading-4 text-slate-600">{locale === 'pl' ? 'Zgadzam się na cotygodniowe oferty oraz maksymalnie dwa przypomnienia o dodaniu własnego ogłoszenia, jeśli jeszcze go nie mam. Zgodę mogę wycofać w każdej chwili.' : 'I agree to weekly property matches and at most two reminders to list my own place if I have not published one. I can withdraw consent at any time.'}</span></label>
                <label className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-700"><span>{locale === 'pl' ? 'Cotygodniowy przegląd' : 'Weekly property digest'}</span><input type="checkbox" disabled={!emailConsent} checked={emailDigest} onChange={(e) => setEmailDigest(e.target.checked)} className="h-4 w-4 accent-indigo-600 disabled:opacity-40" /></label>
                {emailConsent && emailDigest && <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"><select value={emailCity} onChange={(e) => setEmailCity(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs"><option value="">{locale === 'pl' ? 'Cała Polska' : 'All Poland'}</option>{ENABLED_CITIES.map((city) => <option key={city.slug} value={city.name}>{city.name}</option>)}</select><input type="number" min="500" max="100000" value={emailMaxRent} onChange={(e) => setEmailMaxRent(e.target.value)} placeholder={locale === 'pl' ? 'Maks. czynsz' : 'Max rent'} className="h-10 rounded-xl border border-slate-200 px-3 text-xs" /></div>}
                {emailStatus && <p role="status" className="text-xs font-semibold text-indigo-700">{emailStatus}</p>}
                <button disabled={emailSaving} className="min-h-10 w-full rounded-xl bg-indigo-600 text-xs font-bold text-white disabled:opacity-50">{emailSaving ? (locale === 'pl' ? 'Zapisywanie…' : 'Saving…') : (locale === 'pl' ? 'Zapisz e-mail' : 'Save email settings')}</button>
              </>}
            </form>

          </div>
        </dialog>
      </div>
    </main>
  );
};
