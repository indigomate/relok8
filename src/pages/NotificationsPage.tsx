import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Bell, Share2, Heart, ShieldCheck, MessageSquare, FileText, Home } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';
import { Notification } from '../types/relok8';
import { getNotifications, markNotificationRead } from '../lib/api';

interface NotificationsPageProps {
  onBack: () => void;
  locale?: SupportedLocale;
  onOpenListing?: (id: string) => void;
  currentUser?: { id?: string; name?: string; email?: string; role?: string } | null;
}

type NotificationCategory = 'all' | 'saved' | 'inquiries' | 'approvals';

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  onBack,
  locale = 'en',
  onOpenListing,
  currentUser
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeFilter, setActiveFilter] = useState<NotificationCategory>('all');
  
  const activeRole = currentUser?.role || 'prospect';

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
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] text-left pb-32 sm:pb-24 font-sans">
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
              {locale === 'pl' ? 'Powiadomienia i Alerty' : 'Notifications & Alerts'}
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block truncate">
              {locale === 'pl'
                ? 'Aktualizacje w czasie rzeczywistym dotyczące zapisanych pokoi, zgód właścicieli i zapytań o cesję.'
                : 'Real-time updates on saved rooms, landlord approvals, and lease takeover inquiries.'}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer shrink-0 ml-2"
          >
            {locale === 'pl' ? 'Oznacz przeczytane' : 'Mark all read'}
          </button>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Role-Specific Context Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0 mt-0.5">
              {activeRole === 'prospect' ? (
                <Heart className="w-5 h-5" />
              ) : activeRole === 'tenant' ? (
                <MessageSquare className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {locale === 'pl' ? 'Profil aktywny' : 'Active View'} · <span className="text-indigo-600 capitalize">{activeRole}</span>
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {activeRole === 'prospect'
                  ? (locale === 'pl' ? 'Alerty dla poszukujących pokoju' : 'Room Discovery & Takeover Alerts')
                  : activeRole === 'tenant'
                  ? (locale === 'pl' ? 'Powiadomienia o zapytaniach studentów' : 'Incoming Inquiries & Response Score')
                  : (locale === 'pl' ? 'Wnioski o cesję i weryfikacja najemców' : 'Takeover Consent & Verification')}
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                {activeRole === 'prospect'
                  ? (locale === 'pl'
                      ? 'Gdy zapiszesz interesujący pokój serduszkiem, powiadomimy Cię w pierwszej kolejności, gdy zwolni się do przejęcia cesji.'
                      : 'When you save rooms you like, you will be notified instantly when a departing tenant makes them available for takeover.')
                  : activeRole === 'tenant'
                  ? (locale === 'pl'
                      ? 'Odpowiadaj sprawnie na zapytania chętnych, aby utrzymać wysoki wynik odpowiedzi i odznakę Szybkiego Kontaktu.'
                      : 'Reply promptly to verified prospect inquiries to maintain your response score and top-rank badge.')
                  : (locale === 'pl'
                      ? 'Otrzymuj natychmiastowe powiadomienia, gdy lokator zgłasza chęć wcześniejszego przekazania umowy (Art. 509 KC).'
                      : 'Receive instant notifications when a tenant requests lease takeover consent under Polish Civil Code Art. 509 KC.')}
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Desktop Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Feed Column (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
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
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
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
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
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
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
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
                      className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
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
                          <div className="text-xs text-slate-900 font-semibold leading-relaxed">
                            {n.body}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
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
                            className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                          >
                            {locale === 'pl' ? 'Oznacz' : 'Read'}
                          </button>
                        )}
                        {n.placeId && onOpenListing && (
                          <button
                            type="button"
                            onClick={() => onOpenListing(n.placeId!)}
                            className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
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
          </div>

          {/* Sidebar Settings Column (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* WhatsApp availability */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-2xl bg-slate-100 text-slate-500 shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div className="flex items-start gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      {locale === 'pl' ? 'Alerty WhatsApp' : 'WhatsApp alerts'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {locale === 'pl'
                        ? 'Automatyczna wysyłka WhatsApp nie jest jeszcze dostępna. Relok8 nie zapisuje numeru ani nie wyświetla potwierdzenia wysyłki, dopóki integracja nie zostanie uruchomiona.'
                        : 'Automated WhatsApp delivery is not available yet. Relok8 does not save a phone number or report a message as sent until the integration is connected.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* In-App Delivery Preferences */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {locale === 'pl' ? 'Kanały dostarczania' : 'Delivery Channels'}
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-700">{locale === 'pl' ? 'Powiadomienia w aplikacji' : 'In-App Notifications'}</span>
                  <span className="text-emerald-600 font-bold">{locale === 'pl' ? 'Włączone' : 'Always on'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-700">{locale === 'pl' ? 'Alerty e-mail' : 'Email alerts'}</span>
                  <span className="text-slate-500 font-medium">{locale === 'pl' ? 'Niedostępne' : 'Unavailable'}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-700">WhatsApp</span>
                  <span className="text-slate-500 font-medium">{locale === 'pl' ? 'Niedostępne' : 'Unavailable'}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
};
