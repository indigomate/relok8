import {TakeoverProgress} from './TakeoverProgress';
import React, { useState } from 'react';
import { useQuery, useMutation, useConvexAuth } from 'convex/react';
import { useUser } from '@clerk/react';
import { api } from '../../convex/_generated/api';
import { 
  Building2, CheckCircle2, XCircle, Clock, AlertCircle, 
  MapPin, ShieldCheck, UserCheck, ArrowRight, Sparkles, 
  RefreshCw, FileText, Check, ChevronRight, Info, Mail, Plus
} from 'lucide-react';
import { SupportedLocale, formatPLN } from '../utils/formatters';
import { navigateTo } from '../utils/router';

interface LandlordDashboardProps {
  onRequireLogin?: () => void;
  locale?: SupportedLocale;
  onBack?: () => void;
  onNavigateToListing?: (id: string) => void;
  overrideLandlordEmail?: string;
}

export const LandlordDashboard: React.FC<LandlordDashboardProps> = ({
  onRequireLogin,
  locale = 'en',
  onBack,
  onNavigateToListing,
  overrideLandlordEmail
}) => {
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();

  // Resolve current logged-in landlord's email
  const resolvedEmail = (
    overrideLandlordEmail ||
    clerkUser?.primaryEmailAddress?.emailAddress ||
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    ''
  ).trim().toLowerCase();

  const activeEmail = resolvedEmail;
  const [actionFeedback, setActionFeedback] = useState<{ id: string; type: 'success' | 'error'; text: string } | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'approved'>('all');

  // ---------------------------------------------------------------------------
  // CONVEX REACTIVE HOOKS:
  // 1. useQuery: Display only listings associated with current logged-in landlord's email
  // ---------------------------------------------------------------------------
  const { isAuthenticated } = useConvexAuth();
  const listings = useQuery(api.leases.getByLandlordEmail, isAuthenticated && resolvedEmail ? { email: resolvedEmail } : "skip");

  // 2. useMutation: Approve or reject incoming takeovers
  const approveTakeoverMutation = useMutation(api.leases.approveTakeover);
  const rejectTakeoverMutation = useMutation(api.leases.rejectTakeover);

  // Stats calculation
  const totalCount = listings?.length || 0;
  const pendingCount = listings?.filter((l) => l.status === 'PENDING_HOLD' || l.isLocked).length || 0;
  const approvedCount = listings?.filter((l) => l.status === 'APPROVED').length || 0;

  // Filtered list
  const displayedListings = (listings || []).filter((listing) => {
    if (filterTab === 'pending') {
      return listing.status === 'PENDING_HOLD' || listing.isLocked;
    }
    if (filterTab === 'approved') {
      return listing.status === 'APPROVED';
    }
    return true;
  });

  // Handle Approve Takeover
  const handleApprove = async (leaseId: string, propertyTitle: string) => {
    try {
      setPendingActionId(leaseId);
      setActionFeedback(null);
      const res = await approveTakeoverMutation({
        leaseId,
        reason: 'Landlord approved the applicant. Documents and payment arrangements must be confirmed separately.',
      });

      if (res?.success) {
        setActionFeedback({
          id: leaseId,
          type: 'success',
          text: locale === 'pl'
            ? `Cesja dla „${propertyTitle}” została zatwierdzona. Protokół przekazania lokalu jest gotowy do podpisania.`
            : `Takeover for "${propertyTitle}" approved. The handover protocol is ready for direct signing.`,
        });
      }
    } catch (err: any) {
      setActionFeedback({
        id: leaseId,
        type: 'error',
        text: err?.message || (locale === 'pl' ? 'Wystąpił błąd podczas zatwierdzania.' : 'Failed to approve takeover.'),
      });
    } finally {
      setPendingActionId(null);
    }
  };

  // Handle Reject Takeover
  const handleReject = async (leaseId: string, propertyTitle: string) => {
    try {
      setPendingActionId(leaseId);
      setActionFeedback(null);
      const res = await rejectTakeoverMutation({
        leaseId,
        reason: 'Landlord declined takeover request. Listing returned to active market.',
      });

      if (res?.success) {
        setActionFeedback({
          id: leaseId,
          type: 'success',
          text: locale === 'pl'
            ? `Wniosek o cesję odrzucony. Pokój „${propertyTitle}” został odblokowany i powrócił do wyszukiwarki.`
            : `Takeover rejected. Room "${propertyTitle}" has been unlocked and restored to active search.`,
        });
      }
    } catch (err: any) {
      setActionFeedback({
        id: leaseId,
        type: 'error',
        text: err?.message || (locale === 'pl' ? 'Wystąpił błąd podczas odrzucania.' : 'Failed to reject takeover.'),
      });
    } finally {
      setPendingActionId(null);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 text-left">
      <TakeoverProgress locale={locale} onRequireLogin={()=>{if(onRequireLogin)onRequireLogin();else navigateTo(locale==='pl'?'/pl/sign-in':'/sign-in');}}/>
      {/* Navigation header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <Building2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {locale === 'pl' ? 'Pulpit wynajmującego' : 'Landlord dashboard'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {locale === 'pl'
              ? 'Zarządzaj swoimi lokalami i podejmuj decyzje o cesji umowy najmu (Art. 509 KC).'
              : 'Review lease assignments and authorize incoming student takeovers pursuant to Art. 509 KC.'}
          </p>
        </div>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="self-start sm:self-auto px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            {locale === 'pl' ? '← Wróć' : '← Back'}
          </button>
        )}
      </div>

      {/* Polish Civil Code Legal Info Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
              {locale === 'pl' ? 'Zgoda wynajmującego · Art. 509 i 519 KC' : 'Landlord consent requirement · Art. 509 KC'}
            </div>
            <p className="text-xs text-indigo-900/80 leading-relaxed max-w-3xl">
              {locale === 'pl'
                ? 'Zgodnie z Kodeksem Cywilnym cesja umowy najmu wymaga wyraźnej zgody właściciela lokalu. Jako wynajmujący masz pełne prawo zaakceptować nowego najemcę lub odrzucić cesję bez ponoszenia kosztów.'
                : 'Under Articles 509 & 519 of the Polish Civil Code, lease takeovers legally require landlord consent. As the landlord, you verify tenant eligibility and hold complete authority to approve or reject assignments.'}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-indigo-900 border border-indigo-200 text-xs font-semibold shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{locale === 'pl' ? '0 PLN prowizji' : '0 PLN agency fee'}</span>
          </span>
        </div>
      </div>

      {/* Landlord Identity & Email Association Card */}
      <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {locale === 'pl' ? 'Zalogowany adres e-mail wynajmującego' : 'Logged-in landlord email address'}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80 font-mono text-sm font-semibold text-slate-900">
              <Mail className="w-4 h-4 text-indigo-600" />
              <span>{activeEmail}</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>{locale === 'pl' ? 'Zalogowano' : 'Signed in'}</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            {locale === 'pl'
              ? 'Poniżej wyświetlane są wyłącznie lokale przypisane do Twojego adresu w bazie Convex.'
              : 'Only listings associated with this contact email in the Convex database are displayed.'}
          </p>
        </div>

        {/* Change / Switch email for testing */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">

          <button
            type="button"
            onClick={() => {
              const prefix = locale === 'pl' ? '/pl' : '';
              navigateTo(`${prefix}/list`);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Post a real room or lease takeover listing"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{locale === 'pl' ? '+ Dodaj ogłoszenie' : '+ Post a listing'}</span>
          </button>
        </div>
      </div>

      {/* Global feedback message if any */}
      {actionFeedback && actionFeedback.id === 'global' && (
        <div className={`p-4 rounded-2xl text-xs font-medium flex items-center gap-2.5 ${
          actionFeedback.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border border-rose-200 text-rose-900'
        }`}>
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionFeedback.text}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-slate-500">
            {locale === 'pl' ? 'Wszystkie lokale' : 'Total listed properties'}
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {listings === undefined ? '...' : totalCount}
          </div>
          <div className="text-[11px] text-slate-400">
            {locale === 'pl' ? 'Przypisane do Twojego konta' : 'Associated with your email'}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-amber-900">
            {locale === 'pl' ? 'Oczekujące na decyzję' : 'Pending takeover requests'}
          </div>
          <div className="text-2xl font-black text-amber-950 tracking-tight flex items-center gap-2">
            <span>{listings === undefined ? '...' : pendingCount}</span>
            {pendingCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            )}
          </div>
          <div className="text-[11px] text-amber-700">
            {locale === 'pl' ? 'Wymaga akceptacji lub odrzucenia' : 'Requires approval or rejection'}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 shadow-xs space-y-1">
          <div className="text-xs font-semibold text-emerald-900">
            {locale === 'pl' ? 'Zatwierdzone cesje' : 'Approved takeovers'}
          </div>
          <div className="text-2xl font-black text-emerald-950 tracking-tight">
            {listings === undefined ? '...' : approvedCount}
          </div>
          <div className="text-[11px] text-emerald-700">
            {locale === 'pl' ? 'Zgoda udzielona (Art. 509 KC)' : 'Consent finalized (Art. 509 KC)'}
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setFilterTab('all')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
            filterTab === 'all'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          {locale === 'pl' ? 'Wszystkie lokale' : 'All listings'} ({totalCount})
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('pending')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
            filterTab === 'pending'
              ? 'bg-amber-600 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>{locale === 'pl' ? 'Oczekujące na decyzję' : 'Pending takeovers'}</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            filterTab === 'pending' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-900'
          }`}>
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('approved')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
            filterTab === 'approved'
              ? 'bg-emerald-700 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>{locale === 'pl' ? 'Zatwierdzone' : 'Approved'}</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            filterTab === 'approved' ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-900'
          }`}>
            {approvedCount}
          </span>
        </button>
      </div>

      {/* Listings List / Reactive View */}
      {listings === undefined ? (
        /* Loading skeleton */
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-6 rounded-3xl bg-white border border-slate-200 animate-pulse space-y-4">
              <div className="h-5 bg-slate-200 rounded-md w-1/3"></div>
              <div className="h-4 bg-slate-100 rounded-md w-1/2"></div>
              <div className="h-12 bg-slate-50 rounded-xl w-full"></div>
            </div>
          ))}
        </div>
      ) : displayedListings.length === 0 ? (
        /* Empty state */
        <div className="p-10 text-center rounded-3xl bg-white border border-slate-200 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
            <Building2 className="w-7 h-7" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">
              {filterTab === 'pending'
                ? (locale === 'pl' ? 'Brak oczekujących wniosków o cesję' : 'No pending takeover requests')
                : (locale === 'pl' ? 'Brak lokali dla tego adresu e-mail' : 'No listings found for this landlord')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {filterTab === 'pending'
                ? (locale === 'pl' ? 'Wszystkie wnioski o cesję zostały rozpatrzone.' : 'All incoming takeover inquiries have been handled.')
                : (locale === 'pl' 
                    ? `Nie znaleziono aktywnych ogłoszeń zarejestrowanych na adres ${activeEmail}. Dodaj swoje pierwsze ogłoszenie, aby zarządzać najmem.`
                    : `No active listings are registered under ${activeEmail}. Post your room or property to connect directly with students.`)}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                const prefix = locale === 'pl' ? '/pl' : '';
                navigateTo(`${prefix}/list`);
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{locale === 'pl' ? 'Dodaj nowe ogłoszenie' : 'Post a new listing'}</span>
            </button>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                {locale === 'pl' ? 'Przeglądaj pokoje' : 'Browse listings'}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Render Landlord Listings */
        <div className="space-y-6">
          {displayedListings.map((listing) => {
            const isPendingTakeover = listing.status === 'PENDING_HOLD' || Boolean(listing.isLocked);
            const isApproved = listing.status === 'APPROVED';
            const isActionInProgress = pendingActionId === listing._id;
            const currentItemFeedback = actionFeedback && actionFeedback.id === listing._id ? actionFeedback : null;

            return (
              <div
                key={listing._id}
                className={`bg-white rounded-3xl border transition-all shadow-xs overflow-hidden ${
                  isPendingTakeover
                    ? 'border-amber-300 ring-2 ring-amber-100'
                    : isApproved
                    ? 'border-emerald-300'
                    : 'border-slate-200'
                }`}
              >
                {/* Header: Title, City, Status Chip */}
                <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                        {listing.roomType || 'Room'}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        · {listing.city}{listing.district ? `, ${listing.district}` : ''}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      {listing.title}
                    </h2>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{listing.address}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {isPendingTakeover ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold">
                        <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" style={{ animationDuration: '6s' }} />
                        <span>{locale === 'pl' ? 'Wniosek o cesję w toku' : 'Takeover pending review'}</span>
                      </span>
                    ) : isApproved ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{locale === 'pl' ? 'Zgoda udzielona (Art. 509 KC)' : 'Takeover approved'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                        <span>{locale === 'pl' ? 'Dostępne w katalogu' : 'Active · Available'}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Financial & Lease Details Bar */}
                <div className="px-5 sm:px-6 py-3.5 bg-slate-50/30 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">{locale === 'pl' ? 'Czynsz najmu' : 'Monthly rent'}</span>
                    <span className="font-bold text-slate-900">{formatPLN(listing.monthlyRent, locale)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">{locale === 'pl' ? 'Kaucja zwrotna' : 'Deposit'}</span>
                    <span className="font-bold text-slate-900">{formatPLN(listing.deposit, locale)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">{locale === 'pl' ? 'Czynsz administracyjny' : 'Admin czynsz'}</span>
                    <span className="font-medium text-slate-700">
                      {listing.czynszAdmin ? formatPLN(listing.czynszAdmin, locale) : (locale === 'pl' ? 'W cenie' : 'Included')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">{locale === 'pl' ? 'Koniec obecnej umowy' : 'Lease end date'}</span>
                    <span className="font-medium text-slate-700">{listing.leaseEndDate || '2027-06-30'}</span>
                  </div>
                </div>

                {/* Item-specific Feedback */}
                {currentItemFeedback && (
                  <div className={`mx-5 sm:mx-6 mt-4 p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2 ${
                    currentItemFeedback.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border border-rose-200 text-rose-900'
                  }`}>
                    {currentItemFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{currentItemFeedback.text}</span>
                  </div>
                )}

                {/* Takeover Actions Section */}
                <div className="p-5 sm:p-6 space-y-4">
                  {isPendingTakeover ? (
                    /* PENDING TAKEOVER REVIEW PANEL with APPROVE / REJECT BUTTONS */
                    <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                            <span>{locale === 'pl' ? 'Wpłynął wniosek o przejęcie umowy' : 'Incoming lease takeover request'}</span>
                          </div>
                          <div className="text-xs text-amber-900">
                            <strong>{listing.reservedByName || 'Applicant'}</strong> {locale === 'pl' ? 'wysłał wniosek o przejęcie najmu. Nie dokonano płatności.' : 'submitted a takeover request. No payment has been made.'}
                          </div>
                        </div>

                        <div className="text-xs text-amber-800 bg-amber-100/90 px-3 py-1.5 rounded-xl border border-amber-300 font-semibold self-start sm:self-auto">
                          {locale === 'pl' ? 'Blokada 15-minutowa aktywna' : '15-minute EarlyLock hold active'}
                        </div>
                      </div>

                      {/* Summary of rights under Polish Civil Code */}
                      <p className="text-[11px] text-amber-900/80 leading-relaxed border-t border-amber-200/80 pt-2.5">
                        {locale === 'pl'
                          ? 'Klikając [Zatwierdź cesję], wyrażasz zgodę na wstąpienie nowego najemcy na dotychczasowych warunkach umowy najmu. Rozliczenie kaucji następuje bezpośrednio przy protokole zdawczo-odbiorczym.'
                          : 'Clicking [Approve takeover] grants your consent to transfer the existing lease to the replacement tenant. Security deposit is settled directly between parties via the handover protocol.'}
                      </p>

                      {/* Action Buttons: APPROVE / REJECT */}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <button
                          type="button"
                          disabled={isActionInProgress}
                          onClick={() => handleApprove(listing._id, listing.title)}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4 text-white" />
                          <span>
                            {isActionInProgress
                              ? (locale === 'pl' ? 'Przetwarzanie...' : 'Processing...')
                              : (locale === 'pl' ? 'Zatwierdź cesję (Art. 509 KC)' : 'Approve takeover (Art. 509 KC)')}
                          </span>
                        </button>

                        <button
                          type="button"
                          disabled={isActionInProgress}
                          onClick={() => handleReject(listing._id, listing.title)}
                          className="px-5 py-2.5 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 font-bold text-xs rounded-xl border border-rose-300 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4 text-rose-600" />
                          <span>
                            {isActionInProgress
                              ? (locale === 'pl' ? 'Przetwarzanie...' : 'Processing...')
                              : (locale === 'pl' ? 'Odrzuć wniosek' : 'Reject takeover')}
                          </span>
                        </button>

                        {onNavigateToListing && (
                          <button
                            type="button"
                            onClick={() => onNavigateToListing(listing._id)}
                            className="ml-auto text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                          >
                            {locale === 'pl' ? 'Zobacz szczegóły lokalu →' : 'View listing details →'}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : isApproved ? (
                    /* APPROVED STATUS PANEL */
                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{locale === 'pl' ? 'Cesja zaakceptowana przez wynajmującego' : 'Takeover approved by landlord'}</span>
                        </div>
                        <p className="text-xs text-emerald-900/80">
                          {locale === 'pl'
                            ? 'Zgoda została odnotowana. Protokół zdawczo-odbiorczy i umowa cesji gotowe do podpisania.'
                            : 'Consent confirmed under Art. 509 KC. Handover inspection protocol ready for key transfer.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleReject(listing._id, listing.title)}
                          className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          {locale === 'pl' ? 'Cofnij i przywróć do wyszukiwarki' : 'Re-open to search'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* AVAILABLE STATUS PANEL */
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{locale === 'pl' ? 'Oferta aktywna i widoczna dla studentów' : 'Active listing · Open for student requests'}</span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {locale === 'pl'
                            ? 'Brak oczekujących wniosków w tej chwili. Gdy student zarezerwuje pokój, pojawi się powiadomienie.'
                            : 'No pending requests at this moment. You will receive an immediate alert when a student applies.'}
                        </p>
                      </div>

                      <span className="text-xs text-slate-500">No pending request</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
