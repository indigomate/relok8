import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, CheckCircle2, Clock, Share2, Sparkles, AlertCircle, Heart } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';
import { Notification } from '../types/relok8';
import { getNotifications, markNotificationRead, getSavedPlaces, getCurrentDevUser, updateUserAvailability } from '../lib/api';

interface NotificationsPageProps {
  onBack: () => void;
  locale?: SupportedLocale;
  onOpenListing?: (id: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  onBack,
  locale = 'en',
  onOpenListing
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<any[]>([]);
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);

  const loadData = async () => {
    try {
      const [notifs, saves, user] = await Promise.all([
        getNotifications(),
        getSavedPlaces(),
        getCurrentDevUser()
      ]);
      setNotifications(notifs);
      setSavedPlaces(saves);
      if (user && user.whatsappAlertsOptIn !== undefined) {
        setWhatsappOptIn(user.whatsappAlertsOptIn);
      }
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

  const handleToggleWhatsApp = async () => {
    const newVal = !whatsappOptIn;
    setWhatsappOptIn(newVal);
    try {
      await updateUserAvailability(true);
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] text-left pb-24 font-sans">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 text-slate-700 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {locale === 'pl' ? 'Powiadomienia i Alerty' : 'Notifications & Alerts'}
            </h1>
            <p className="text-[11px] text-slate-500">
              Real-time updates on saved places, landlord approvals, and incoming prospect inquiries.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* WhatsApp Channel Alert Opt-In (§7) */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-2xl bg-[#25D366] text-white shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">WhatsApp Takeover Alerts (§7)</div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Receive instant notifications on WhatsApp when a saved room becomes available for takeover. No spam; only explicit opt-ins.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={whatsappOptIn}
              onChange={handleToggleWhatsApp}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
          <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Recent Notifications</span>
            <span className="text-[11px] text-slate-400">{notifications.length} total</span>
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <Bell className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium">No new notifications. You are all caught up!</p>
            </div>
          ) : (
            notifications.map((n) => {
              const isUnread = !n.readAt;
              return (
                <div
                  key={n.id}
                  className={`p-4 flex items-start justify-between gap-3 transition-colors ${
                    isUnread ? 'bg-indigo-50/40' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      <Bell className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-900 font-medium leading-relaxed">
                        {n.body}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(n.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(n.id)}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        Mark read
                      </button>
                    )}
                    {n.placeId && onOpenListing && (
                      <button
                        type="button"
                        onClick={() => onOpenListing(n.placeId!)}
                        className="text-[11px] font-semibold text-slate-600 hover:text-slate-900"
                      >
                        View room →
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};
