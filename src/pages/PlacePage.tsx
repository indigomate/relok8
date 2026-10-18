import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Home, Building2, ShieldCheck, CheckCircle2,
  Clock, XCircle, AlertCircle, Edit3, MessageSquare,
  Lock, Share2, Check, User, ChevronRight, FileText,
  Key, Sparkles, Send, Bell, ExternalLink, Calendar,
  Bot, Award, Shield, Trash2
} from 'lucide-react';
import { SupportedLocale, formatPLN } from '../utils/formatters';
import {
  Place,
  Relok8User,
  HandoverChecklist,
  Announcement,
  Thread
} from '../types/relok8';
import {
  getPlaces,
  updatePlace,
  requestExit,
  cancelExit,
  decideExit,
  updateHandoverChecklist,
  getAnnouncement,
  shareAnnouncementWhatsApp,
  getCurrentDevUser,
  getPlaceRoomMessages,
  sendPlaceRoomMessage,
  getThreads,
  deletePlace
} from '../lib/api';
import { deleteListing } from '../lib/supabase/client';
import { Listing } from '../types';

interface PlacePageProps {
  onBack: () => void;
  locale?: SupportedLocale;
  onOpenListing?: (id: string) => void;
  onOpenMessages?: () => void;
  currentUser?: { id?: string; name?: string; email?: string; role?: string } | null;
  listings?: Listing[];
  onDeleteListing?: (id: string) => Promise<boolean | void> | void;
  onOpenIntake?: () => void;
}

export const PlacePage: React.FC<PlacePageProps> = ({
  onBack,
  locale = 'en',
  onOpenListing,
  onOpenMessages,
  currentUser,
  listings: propListings,
  onDeleteListing,
  onOpenIntake
}) => {
  const [devUser, setDevUser] = useState<Relok8User | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('');
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [placeRoomMessages, setPlaceRoomMessages] = useState<any[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [prInput, setPrInput] = useState('');

  // Delete Listing Modal State
  const [listingToDelete, setListingToDelete] = useState<{
    id: string;
    title: string;
    city?: string;
    rent?: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Exit State
  const [leaveDate, setLeaveDate] = useState('2026-11-01');
  const [exitNotes, setExitNotes] = useState('');
  const [isSubmittingExit, setIsSubmittingExit] = useState(false);

  // Landlord Decision State
  const [declineReason, setDeclineReason] = useState('');
  const [suggestedDate, setSuggestedDate] = useState('');
  const [showDeclineInput, setShowDeclineInput] = useState(false);
  const [showSuggestInput, setShowSuggestInput] = useState(false);

  // Landlord Edit Facts State
  const [isEditingFacts, setIsEditingFacts] = useState(false);
  const [editedRules, setEditedRules] = useState('');
  const [editedRent, setEditedRent] = useState(0);
  const [editedCzynsz, setEditedCzynsz] = useState(0);

  // Notification feedback
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [u, allPlaces] = await Promise.all([
        getCurrentDevUser(),
        getPlaces()
      ]);
      setDevUser(u);
      setPlaces(allPlaces);
      if (allPlaces.length > 0) {
        const placeToSelect = allPlaces.find(p => p.id === selectedPlaceId) || allPlaces[0];
        setSelectedPlaceId(placeToSelect.id);
        setEditedRules(placeToSelect.rules);
        setEditedRent(placeToSelect.rentPLN);
        setEditedCzynsz(placeToSelect.czynszPLN);

        const [ann, prMsgs, ths] = await Promise.all([
          getAnnouncement(placeToSelect.id),
          getPlaceRoomMessages(placeToSelect.id),
          getThreads(placeToSelect.id)
        ]);
        setAnnouncement(ann);
        setPlaceRoomMessages(prMsgs);
        setThreads(ths);
      }
    } catch (e) {
      console.warn('PlacePage load error:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPlaceId]);

  // User's uploaded listings from prop or localStorage
  const userUploadedListings = useMemo(() => {
    let sourceListings: Listing[] = [];
    if (propListings && propListings.length > 0) {
      sourceListings = propListings;
    } else {
      try {
        const saved = localStorage.getItem('r8_listings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) sourceListings = parsed;
        }
      } catch {}
    }

    let myIds: string[] = [];
    try {
      const stored = localStorage.getItem('r8_my_listing_ids');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) myIds = parsed;
      }
    } catch {}

    const userEmail = currentUser?.email?.toLowerCase().trim();
    const userId = currentUser?.id;
    const userName = currentUser?.name?.toLowerCase().trim();

    return sourceListings.filter((l) => {
      if (myIds.includes(l.id)) return true;
      if (userEmail && l.landlordContactEmail?.toLowerCase().trim() === userEmail) return true;
      if (userEmail && (l as any).ownerEmail?.toLowerCase().trim() === userEmail) return true;
      if (userId && (l as any).userId === userId) return true;
      if (userName && l.currentTenant?.name?.toLowerCase().trim() === userName) return true;
      if (userName && l.landlordName?.toLowerCase().trim() === userName) return true;
      return false;
    });
  }, [propListings, currentUser]);

  const listingToPlace = (l: Listing, tenantId = 'user-mateo'): Place => ({
    id: l.id,
    landlordId: (l as any).userId || 'user-landlord',
    tenantId: (l as any).userId || tenantId,
    title: l.title,
    city: l.city,
    district: l.district || '',
    address: l.address || `${l.district ? l.district + ', ' : ''}${l.city}`,
    rentPLN: l.monthlyRentPLN,
    czynszPLN: l.czynszAdminPLN || 0,
    depositPLN: l.depositPLN || l.monthlyRentPLN,
    availableFrom: l.availableDate || 'Immediate',
    roomType: l.roomType || 'Private room',
    flatmates: l.flatmatesCount || 0,
    furnished: l.isFurnished ?? true,
    billsIncluded: l.billsIncluded ?? false,
    meldunekOk: l.meldunekAllowed ?? true,
    commuteNote: l.distanceToCampus || '10 min transit to campus',
    nearInstitutions: l.universitiesNearby || [],
    photos: l.images && l.images.length > 0 ? l.images : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop'],
    status: 'available_for_takeover',
    rules: l.description || 'Standard house rules apply. Quiet hours 22:00-06:00. Non-smoking flat.',
    landlordBedPricePLN: 39,
    handoverChecklist: {
      agreementSigned: false,
      depositTransferred: false,
      keysHandedOver: false,
      meldunekCompleted: false
    }
  });

  const mergedPlaces = useMemo(() => {
    const existingIds = new Set(places.map(p => p.id));
    const uploadedAsPlaces = userUploadedListings
      .filter(l => !existingIds.has(l.id))
      .map(l => listingToPlace(l, currentUser?.id || 'user-mateo'));

    return [...uploadedAsPlaces, ...places];
  }, [places, userUploadedListings, currentUser]);

  // Default selection to first available place if any
  useEffect(() => {
    if (mergedPlaces.length > 0) {
      if (!selectedPlaceId || !mergedPlaces.some(p => p.id === selectedPlaceId)) {
        setSelectedPlaceId(mergedPlaces[0].id);
      }
    } else {
      setSelectedPlaceId('');
    }
  }, [mergedPlaces, selectedPlaceId]);

  const currentPlace = mergedPlaces.find(p => p.id === selectedPlaceId) || mergedPlaces[0];
  const [roleOverride, setRoleOverride] = useState<'landlord' | 'tenant' | null>(null);
  const baseIsLandlord = currentUser?.role === 'landlord' || devUser?.role === 'landlord';
  const isLandlord = roleOverride ? roleOverride === 'landlord' : baseIsLandlord;
  const isTenant = !isLandlord;

  const [onloAutoTriage, setOnloAutoTriage] = useState(true);

  // Check if current place belongs to/was uploaded by this user
  const isCurrentPlaceUserUploaded = useMemo(() => {
    if (!currentPlace) return false;
    let myIds: string[] = [];
    try {
      myIds = JSON.parse(localStorage.getItem('r8_my_listing_ids') || '[]');
    } catch {}
    if (myIds.includes(currentPlace.id)) return true;
    if (userUploadedListings.some(l => l.id === currentPlace.id)) return true;
    if (currentUser?.email && (currentPlace as any).landlordContactEmail?.toLowerCase() === currentUser.email.toLowerCase()) return true;
    if (currentUser?.id && (currentPlace.tenantId === currentUser.id || currentPlace.landlordId === currentUser.id)) return true;
    return false;
  }, [currentPlace, userUploadedListings, currentUser]);

  // Confirm delete listing handler
  const handleConfirmDelete = async () => {
    if (!listingToDelete) return;
    setIsDeleting(true);
    const targetId = listingToDelete.id;
    try {
      if (onDeleteListing) {
        await onDeleteListing(targetId);
      } else {
        try {
          const saved = localStorage.getItem('r8_listings');
          if (saved) {
            const list = JSON.parse(saved);
            const filtered = list.filter((l: any) => l.id !== targetId);
            localStorage.setItem('r8_listings', JSON.stringify(filtered));
          }
        } catch {}
        try {
          const myIds = JSON.parse(localStorage.getItem('r8_my_listing_ids') || '[]');
          const filteredIds = myIds.filter((id: string) => id !== targetId);
          localStorage.setItem('r8_my_listing_ids', JSON.stringify(filteredIds));
        } catch {}
        await deleteListing(targetId).catch(() => {});
        await deletePlace(targetId).catch(() => {});
      }

      setPlaces(prev => prev.filter(p => p.id !== targetId));
      setFeedback(locale === 'pl' ? 'Ogłoszenie zostało pomyślnie usunięte.' : 'Listing deleted successfully.');
      setListingToDelete(null);

      const remaining = mergedPlaces.filter(p => p.id !== targetId);
      if (remaining.length > 0) {
        setSelectedPlaceId(remaining[0].id);
      } else {
        setSelectedPlaceId('');
      }
    } catch (err: any) {
      setFeedback(err?.message || 'Failed to delete listing.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Tenant Exit Request
  const handleStartExit = async () => {
    if (!currentPlace) return;
    try {
      setIsSubmittingExit(true);
      const updated = await requestExit(currentPlace.id, leaveDate, exitNotes);
      setPlaces(prev => prev.map(p => p.id === updated.id ? updated : p));
      setFeedback('Exit request submitted! Your landlord has been notified to review and approve.');
    } catch (e: any) {
      setFeedback(e?.message || 'Failed to submit exit request.');
    } finally {
      setIsSubmittingExit(false);
    }
  };

  // Handle Tenant Cancel Exit
  const handleCancelExit = async () => {
    if (!currentPlace) return;
    try {
      const updated = await cancelExit(currentPlace.id);
      setPlaces(prev => prev.map(p => p.id === updated.id ? updated : p));
      setFeedback('Exit request cancelled. Your room remains occupied.');
    } catch (e: any) {
      setFeedback(e?.message || 'Could not cancel exit.');
    }
  };

  // Handle Landlord Decision
  const handleLandlordDecision = async (decision: 'approve' | 'suggest_date' | 'decline') => {
    if (!currentPlace) return;
    try {
      const payloadReason = decision === 'decline' ? declineReason : decision === 'suggest_date' ? suggestedDate : undefined;
      const updated = await decideExit(currentPlace.id, decision, payloadReason);
      setPlaces(prev => prev.map(p => p.id === updated.id ? updated : p));
      
      const ann = await getAnnouncement(updated.id);
      setAnnouncement(ann);

      if (decision === 'approve') {
        setFeedback('Takeover approved! Place is now listed as Available for Takeover, WhatsApp announcement created, and saved prospects notified.');
      } else {
        setFeedback(`Decision recorded: ${decision}.`);
      }
      setShowDeclineInput(false);
      setShowSuggestInput(false);
    } catch (e: any) {
      setFeedback(e?.message || 'Decision failed.');
    }
  };

  // Handle Handover Checklist Toggle
  const handleChecklistToggle = async (key: keyof HandoverChecklist) => {
    if (!currentPlace?.handoverChecklist) return;
    try {
      const currentVal = currentPlace.handoverChecklist[key];
      const updated = await updateHandoverChecklist(currentPlace.id, {
        [key]: !currentVal
      });
      setPlaces(prev => prev.map(p => p.id === updated.id ? updated : p));
      if (updated.status === 'handed_over') {
        setFeedback('All handover steps completed! Status updated to Handed Over. 10 points awarded to tenant.');
      }
    } catch (e: any) {
      console.warn('Checklist update error:', e);
    }
  };

  // Handle WhatsApp Share Announcement
  const handleShareWhatsApp = async () => {
    if (!currentPlace) return;
    try {
      const { channelUrl, announcement: ann } = await shareAnnouncementWhatsApp(currentPlace.id);
      setAnnouncement(ann);
      window.open(channelUrl, '_blank');
      setFeedback('Opening WhatsApp with pre-filled announcement text!');
    } catch (e: any) {
      setFeedback(e?.message || 'Could not share to WhatsApp.');
    }
  };

  // Handle Save Facts Edited by Landlord
  const handleSaveFacts = async () => {
    if (!currentPlace) return;
    try {
      const updated = await updatePlace(currentPlace.id, {
        rules: editedRules,
        rentPLN: editedRent,
        czynszPLN: editedCzynsz
      });
      setPlaces(prev => prev.map(p => p.id === updated.id ? updated : p));
      setIsEditingFacts(false);
      setFeedback('Place facts & rules updated! Onlo AI will now answer prospects with the latest info.');
    } catch (e: any) {
      setFeedback('Failed to update place facts.');
    }
  };

  // Handle Send Place Room Message
  const handleSendPRMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prInput.trim() || !currentPlace) return;
    try {
      const newMsg = await sendPlaceRoomMessage(currentPlace.id, prInput.trim());
      setPlaceRoomMessages(prev => [...prev, newMsg]);
      setPrInput('');
    } catch (e) {
      console.warn('Error sending Place Room message:', e);
    }
  };

  if (!currentPlace) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] text-left pb-32 sm:pb-24 font-sans">
        <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 -ml-2 text-slate-700 hover:text-slate-900 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-[28px] lg:text-[30px] font-bold text-slate-900 tracking-tight leading-tight">
                {isLandlord ? 'My Places (Landlord Portal)' : 'My Place'}
              </h1>
              <p className="text-xs text-slate-500">
                {locale === 'pl'
                  ? 'Zarządzaj swoimi ogłoszeniami i miejscami.'
                  : 'Manage your lease takeover listings and active places.'}
              </p>
            </div>
          </div>
        </header>

        {feedback && (
          <div className="max-w-xl mx-auto px-4 mt-2">
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-950 flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>{feedback}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-[11px] text-indigo-700 hover:underline shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <main className="max-w-md mx-auto px-4 pt-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-150 shadow-2xs">
            <Home className="w-8 h-8" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            {locale === 'pl' ? 'Brak aktywnych ogłoszeń lub miejsc' : 'No active listings or places'}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            {locale === 'pl'
              ? 'Wszystkie Twoje ogłoszenia zostały usunięte lub nie dodałeś jeszcze żadnego pokoju na platformie.'
              : 'You have no active listings uploaded right now. Post your room to find an approved tenant takeover.'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            {onOpenIntake && (
              <button
                type="button"
                onClick={onOpenIntake}
                className="px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                {locale === 'pl' ? 'Dodaj ogłoszenie' : 'Post a listing'}
              </button>
            )}
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              {locale === 'pl' ? 'Przeglądaj pokoje' : 'Browse listings'}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Unread thread count for current user
  const unreadThreadCount = threads.filter(
    t => t.unreadFor && devUser && t.unreadFor.includes(devUser.id)
  ).length;

  // Status mapping
  const statusBadgeInfo: Record<Place['status'], { label: string; color: string }> = {
    occupied: { label: 'Occupied', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    exit_requested: { label: 'Exit requested', color: 'bg-amber-50 text-amber-800 border-amber-200' },
    available_for_takeover: { label: 'Open to takeover', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    reserved: { label: 'Replacement found', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    handed_over: { label: 'Handed over', color: 'bg-emerald-600 text-white border-emerald-700' },
  };

  // 5-step handover progress sequence
  const progressSteps: { id: Place['status']; label: string }[] = [
    { id: 'occupied', label: 'Occupied' },
    { id: 'exit_requested', label: 'Exit requested' },
    { id: 'available_for_takeover', label: 'Open to takeover' },
    { id: 'reserved', label: 'Replacement found' },
    { id: 'handed_over', label: 'Handed over' },
  ];

  const currentStepIndex = progressSteps.findIndex(s => s.id === currentPlace.status);
  const activeStepIndex = currentStepIndex >= 0 ? currentStepIndex : 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] text-left pb-36 sm:pb-24 font-sans">
      {/* 1. Header: Compact title row (aligned back button, responsive title) */}
      <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-5 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 -ml-1 text-slate-700 hover:text-slate-900 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-[28px] lg:text-[30px] font-bold text-slate-900 tracking-tight leading-tight truncate">
                {isLandlord ? 'My Places (Landlord Portal)' : 'My Place'}
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block truncate">
                One shared place record: both tenant and landlord look at the same facts and handover steps.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-end sm:self-auto shrink-0">
            {/* Dedicated Landlord / Tenant View toggle */}
            <div className="flex rounded-full bg-slate-200/80 p-0.5 border border-slate-300 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setRoleOverride('landlord')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                  isLandlord
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Landlord view</span>
              </button>
              <button
                type="button"
                onClick={() => setRoleOverride('tenant')}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                  isTenant
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Tenant view</span>
              </button>
            </div>

            {/* Place select if user has several places */}
            {mergedPlaces.length > 1 && (
              <select
                value={selectedPlaceId}
                onChange={(e) => setSelectedPlaceId(e.target.value)}
                className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-600 focus:outline-none cursor-pointer"
              >
                {mergedPlaces.map(p => {
                  const isUploaded = userUploadedListings.some(u => u.id === p.id);
                  return (
                    <option key={p.id} value={p.id}>
                      {isUploaded ? '⭐ ' : ''}{p.title} ({p.city}){isUploaded ? ' · Your listing' : ''}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Layout: Two-column grid (Main column + 300px right rail) */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-2">
        
        {/* Feedback Alert if present */}
        {feedback && (
          <div className="mb-5 p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-950 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{feedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-[11px] text-indigo-700 hover:underline shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 min-[1000px]:grid-cols-[1fr_300px] gap-6 items-start">
          
          {/* ======================================================== */}
          {/* MAIN COLUMN (In order: 1. Hero, 2. Progress, 3. Action, 4. Room) */}
          {/* ======================================================== */}
          <div className="space-y-6 min-w-0">

            {/* 1. HERO CARD */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row items-start gap-5">
                {/* Larger photo on the left (200px) */}
                {currentPlace.photos?.[0] && (
                  <div className="w-full sm:w-[200px] h-48 sm:h-[180px] rounded-2xl overflow-hidden shrink-0 border border-slate-200/80 shadow-2xs bg-slate-100">
                    <img
                      src={currentPlace.photos[0]}
                      alt={currentPlace.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Details on the right */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                      {currentPlace.roomType} · {currentPlace.district}, {currentPlace.city}
                    </span>
                    {/* Status as normal pill inside the property card */}
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusBadgeInfo[currentPlace.status].color}`}>
                      {statusBadgeInfo[currentPlace.status].label}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug mt-1">
                    {currentPlace.title}
                  </h2>

                  {/* Commute note */}
                  {currentPlace.commuteNote && (
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{currentPlace.commuteNote}</span>
                    </div>
                  )}

                  {/* Four fact tiles (Rent, Czynsz, Deposit, Available) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3.5">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase">Rent</div>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">
                        {formatPLN(currentPlace.rentPLN, locale)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase">Czynsz</div>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">
                        {currentPlace.billsIncluded ? 'Included' : formatPLN(currentPlace.czynszPLN, locale)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase">Deposit</div>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">
                        {formatPLN(currentPlace.depositPLN, locale)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase">Available</div>
                      <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                        {currentPlace.availableFrom || 'Immediate'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Linked people & Two action buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Linked people: tenant and landlord avatars with roles */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center border border-emerald-200">
                      AK
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 leading-tight">Anna</div>
                      <div className="text-[10px] text-slate-500">Current tenant</div>
                    </div>
                  </div>

                  <div className="w-px h-5 bg-slate-200 hidden sm:block" />

                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center border border-amber-200">
                      JM
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 leading-tight">Judy M.</div>
                      <div className="text-[10px] text-slate-500">Landlord</div>
                    </div>
                  </div>
                </div>

                {/* Action buttons: Public listing, Open inbox, and Delete listing */}
                <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
                  {onOpenListing && (
                    <button
                      type="button"
                      onClick={() => onOpenListing(currentPlace.id)}
                      className="px-4 py-2 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <span>Public listing</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  )}

                  {onOpenMessages && (
                    <button
                      type="button"
                      onClick={onOpenMessages}
                      className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Open inbox</span>
                      {unreadThreadCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#F2705A] text-white text-[10px] font-bold">
                          {unreadThreadCount}
                        </span>
                      )}
                    </button>
                  )}

                  {isCurrentPlaceUserUploaded && (
                    <button
                      type="button"
                      onClick={() => setListingToDelete({
                        id: currentPlace.id,
                        title: currentPlace.title,
                        city: currentPlace.city,
                        rent: currentPlace.rentPLN
                      })}
                      className="px-4 py-2 rounded-full border border-rose-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title={locale === 'pl' ? 'Usuń to ogłoszenie' : 'Delete this listing'}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>{locale === 'pl' ? 'Usuń ogłoszenie' : 'Delete listing'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* YOUR UPLOADED LISTINGS SECTION (If user uploaded any listings) */}
            {userUploadedListings.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>{locale === 'pl' ? 'Twoje ogłoszenia' : 'Your uploaded listings'}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-150">
                        {userUploadedListings.length}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {locale === 'pl'
                        ? 'Zarządzaj lub usuń ogłoszenia dodane przez Twoje konto.'
                        : 'Manage or delete listings uploaded with your account.'}
                    </p>
                  </div>
                  {onOpenIntake && (
                    <button
                      type="button"
                      onClick={onOpenIntake}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                    >
                      {locale === 'pl' ? '+ Dodaj kolejne' : '+ Add another'}
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-100">
                  {userUploadedListings.map((listing) => {
                    const isCurrent = currentPlace?.id === listing.id;
                    return (
                      <div key={listing.id} className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                            <img
                              src={listing.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&auto=format&fit=crop'}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {listing.title}
                              </h4>
                              {isCurrent && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                  {locale === 'pl' ? 'Wybrane' : 'Active view'}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {listing.district ? `${listing.district}, ` : ''}{listing.city} · <span className="font-bold text-slate-700">{formatPLN(listing.monthlyRentPLN, locale)}</span>/mo
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => setSelectedPlaceId(listing.id)}
                              className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              {locale === 'pl' ? 'Pokaż' : 'View'}
                            </button>
                          )}
                          {onOpenListing && (
                            <button
                              type="button"
                              onClick={() => onOpenListing(listing.id)}
                              className="px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                              title={locale === 'pl' ? 'Zobacz ogłoszenie publiczne' : 'View public listing'}
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                              <span className="hidden md:inline">Public</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setListingToDelete({
                              id: listing.id,
                              title: listing.title,
                              city: listing.city,
                              rent: listing.monthlyRentPLN
                            })}
                            className="px-3 py-1.5 rounded-full border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            title={locale === 'pl' ? 'Usuń to ogłoszenie' : 'Delete this listing'}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>{locale === 'pl' ? 'Usuń' : 'Delete'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. HANDOVER PROGRESS: Five-step bar */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Handover progress</h3>
                  <p className="text-xs text-slate-500">
                    Step-by-step room handover between tenant and landlord
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  Step {activeStepIndex + 1} of {progressSteps.length}
                </span>
              </div>

              {/* Progress track */}
              <div className="pt-2 pb-1 relative">
                {/* Connecting track line */}
                <div className="absolute top-[22px] left-4 right-4 h-1 bg-slate-200 -z-0">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-500"
                    style={{
                      width: `${(activeStepIndex / (progressSteps.length - 1)) * 100}%`
                    }}
                  />
                </div>

                <div className="relative z-10 flex items-start justify-between">
                  {progressSteps.map((step, idx) => {
                    const isDone = idx < activeStepIndex;
                    const isCurrent = idx === activeStepIndex;

                    return (
                      <div key={step.id} className="flex flex-col items-center flex-1 text-center">
                        {/* Step circle */}
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                            isDone
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : isCurrent
                              ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-2xs'
                              : 'bg-white border border-slate-300 text-slate-400'
                          }`}
                        >
                          {isDone ? (
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>

                        {/* Step label */}
                        <span
                          className={`text-[11px] mt-2 max-w-[80px] leading-tight ${
                            isCurrent
                              ? 'text-indigo-600 font-bold'
                              : isDone
                              ? 'text-slate-800 font-semibold'
                              : 'text-slate-400 font-medium'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. ONE ACTION CARD THAT CHANGES WITH THE STATUS */}
            {/* Case A: status === 'occupied' -> Tenant 'I'm moving out' with a date */}
            {currentPlace.status === 'occupied' && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>{isTenant ? "I'm moving out (Exit Request)" : "Lease Active · Occupied by Tenant"}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isTenant
                        ? "Hand over your room to an approved replacement tenant with your landlord's agreement."
                        : "The room is actively leased by Anna. When an exit request is submitted, approval options will appear here."}
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    Direct Handover
                  </span>
                </div>

                {isTenant ? (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Target Leave Date
                        </label>
                        <input
                          type="date"
                          value={leaveDate}
                          onChange={(e) => setLeaveDate(e.target.value)}
                          className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Notes for Landlord (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Erasmus semester ending, room spotless..."
                          value={exitNotes}
                          onChange={(e) => setExitNotes(e.target.value)}
                          className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end">
                      <button
                        type="button"
                        disabled={isSubmittingExit}
                        onClick={handleStartExit}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-full transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isSubmittingExit ? 'Submitting...' : "I'm moving out"}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>No action needed right now. Anna's lease is active through the term.</span>
                  </div>
                )}
              </div>
            )}

            {/* Case B: status === 'exit_requested' -> Landlord Approve / Decline */}
            {currentPlace.status === 'exit_requested' && (
              <div className="bg-white rounded-3xl border border-amber-200 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-950 uppercase tracking-wider">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Tenant Exit Request Review</span>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                    Review required
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  The current tenant requested to hand over their lease on <strong>{currentPlace.leaveDate || 'Early November'}</strong>.
                  {currentPlace.exitNotes && ` Notes: "${currentPlace.exitNotes}"`}
                </p>

                {isLandlord ? (
                  <div className="space-y-3 pt-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleLandlordDecision('approve')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve takeover</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowSuggestInput(!showSuggestInput)}
                        className="px-4 py-2 bg-white hover:bg-amber-50 text-amber-900 font-semibold text-xs rounded-full border border-amber-300 transition-colors cursor-pointer"
                      >
                        Suggest alternate date
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowDeclineInput(!showDeclineInput)}
                        className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 font-semibold text-xs rounded-full border border-rose-300 transition-colors cursor-pointer"
                      >
                        Decline with reason
                      </button>
                    </div>

                    {showSuggestInput && (
                      <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200 flex items-center gap-2 max-w-md">
                        <input
                          type="date"
                          value={suggestedDate}
                          onChange={(e) => setSuggestedDate(e.target.value)}
                          className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg flex-1 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleLandlordDecision('suggest_date')}
                          className="px-3.5 py-1.5 text-xs font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700 cursor-pointer"
                        >
                          Send date
                        </button>
                      </div>
                    )}

                    {showDeclineInput && (
                      <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-200 flex items-center gap-2 max-w-md">
                        <input
                          type="text"
                          placeholder="Reason for declining..."
                          value={declineReason}
                          onChange={(e) => setDeclineReason(e.target.value)}
                          className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg flex-1 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleLandlordDecision('decline')}
                          className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer"
                        >
                          Confirm decline
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Awaiting your landlord's approval.
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelExit}
                      className="px-4 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-full border border-slate-300 transition-colors cursor-pointer"
                    >
                      Cancel exit request
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Case C: status === 'available_for_takeover' -> WhatsApp-style Announcement */}
            {currentPlace.status === 'available_for_takeover' && announcement && (
              <div className="bg-[#E7F6EC] border border-[#C6ECD2] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-[#075E54]" />
                      <span>Takeover announcement</span>
                    </h3>
                    <p className="text-xs text-slate-600">
                      Share to Relok8 WhatsApp channels or student groups with one tap.
                    </p>
                  </div>

                  {/* Drafted/Shared pill */}
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      announcement.status === 'shared'
                        ? 'bg-[#25D366]/20 text-[#075E54] border-[#25D366]/40'
                        : 'bg-white/80 text-slate-700 border-slate-200'
                    }`}
                  >
                    {announcement.status === 'shared' ? 'Shared' : 'Drafted'}
                  </span>
                </div>

                {/* WhatsApp-style message bubble (NO monospace code block!) */}
                <div className="bg-[#DCF8C6] border border-[#C5E9AE] text-[#111B21] rounded-2xl rounded-tr-xs p-4 text-xs sm:text-sm leading-relaxed shadow-xs">
                  <div>{announcement.text}</div>
                  <div className="text-[10px] text-[#667781] text-right mt-2 flex items-center justify-end gap-1">
                    <span>12:00</span>
                    <Check className="w-3 h-3 text-[#53BDEB]" />
                  </div>
                </div>

                {/* Subscribed people notification line */}
                <div className="text-xs font-medium text-[#075E54] flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" />
                  <span>3 people who saved this place were notified.</span>
                </div>

                {/* Actions: 'Share to WhatsApp' (solid dark green, white text) & 'Copy text' */}
                <div className="flex items-center gap-3 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="px-4 py-2.5 bg-[#075E54] hover:bg-[#128C7E] text-white font-bold text-xs rounded-full transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share to WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(announcement.text);
                      setFeedback('Announcement copied to clipboard!');
                    }}
                    className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-full border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                  >
                    Copy text
                  </button>
                </div>
              </div>
            )}

            {/* Case D: status === 'reserved' or 'handed_over' -> Checklist as large tickable rows */}
            {(currentPlace.status === 'reserved' || currentPlace.status === 'handed_over') && currentPlace.handoverChecklist && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Key className="w-4 h-4 text-emerald-600" />
                      <span>Room Handover Checklist</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Both current tenant and landlord can tick steps. When all 4 are checked, status updates to Handed Over.
                    </p>
                  </div>

                  {currentPlace.status === 'handed_over' && (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      Completed
                    </span>
                  )}
                </div>

                {/* Large tickable rows */}
                <div className="space-y-3 pt-1">
                  {[
                    { key: 'agreementSigned', label: '1. Handover Agreement Signed', desc: 'Tenancy agreement signed directly between landlord and replacement tenant.' },
                    { key: 'depositTransferred', label: '2. Deposit Settled', desc: 'Direct deposit settlement confirmed between tenant and landlord.' },
                    { key: 'keysHandedOver', label: '3. Keys Handed Over', desc: 'Physical room inspection protocol signed and keys delivered.' },
                    { key: 'meldunekCompleted', label: '4. Meldunek Completed', desc: 'Address registration registered at Urząd Miasta.' },
                  ].map(item => {
                    const isChecked = currentPlace.handoverChecklist![item.key as keyof HandoverChecklist];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleChecklistToggle(item.key as keyof HandoverChecklist)}
                        className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-4 cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                            isChecked
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-slate-300'
                          }`}
                        >
                          {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 leading-snug">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {item.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. PLACE ROOM: Chat with bubbles and docked pill input with round send button */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-600" />
                    <span>Place room</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Private channel between tenant and landlord for handover notes, inspection dates, and meter readings.
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  Private channel
                </span>
              </div>

              {/* Chat bubbles area */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3 max-h-64 overflow-y-auto">
                {placeRoomMessages.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No private notes yet.</p>
                ) : (
                  placeRoomMessages.map((m) => {
                    const isFromTenant = m.authorType === 'tenant';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isFromTenant ? 'items-start mr-auto' : 'items-end ml-auto'} max-w-md`}
                      >
                        <span className="text-[10px] font-semibold text-slate-400 mb-1 px-1">
                          {isFromTenant ? 'Tenant (Anna)' : 'Landlord (Judy M.)'}
                        </span>
                        <div
                          className={`px-4 py-2 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                            isFromTenant
                              ? 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                              : 'bg-indigo-600 text-white rounded-br-sm'
                          }`}
                        >
                          {m.body}
                        </div>
                        <span className="text-[9px] text-slate-400 mt-1 px-1">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Docked pill input with round send button */}
              <form onSubmit={handleSendPRMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Send private message to landlord / tenant..."
                  value={prInput}
                  onChange={(e) => setPrInput(e.target.value)}
                  className="flex-1 text-xs px-4 py-2.5 rounded-full border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!prInput.trim()}
                  className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors shadow-2xs shrink-0 cursor-pointer disabled:opacity-40"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>

          {/* ======================================================== */}
          {/* RIGHT RAIL (300px, drops below on screens < 1000px) */}
          {/* ======================================================== */}
          <div className="w-full min-[1000px]:w-[300px] space-y-6 shrink-0">

            {/* 1. Inbox summary */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Inbox summary
                </h3>
                <MessageSquare className="w-4 h-4 text-slate-400" />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Active threads</span>
                  <span className="font-bold text-slate-900">{threads.length}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Unread inquiries</span>
                  <span className={`font-bold ${unreadThreadCount > 0 ? 'text-[#F2705A]' : 'text-slate-900'}`}>
                    {unreadThreadCount}
                  </span>
                </div>
              </div>

              {onOpenMessages && (
                <button
                  type="button"
                  onClick={onOpenMessages}
                  className="w-full mt-2 py-2 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Open inbox</span>
                </button>
              )}
            </div>

            {/* 2. Tenant's response score */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {locale === 'pl' ? 'Aktywność najemcy' : 'Tenant activity'}
                </h3>
                <Award className="w-4 h-4 text-indigo-600" />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500 font-medium">
                    {locale === 'pl' ? 'Ocena kontaktu' : 'Response score'}
                  </span>
                  <span className="font-bold text-indigo-700">35 / 50 pts</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all"
                    style={{ width: '70%' }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 space-y-1">
                <div className="font-bold flex items-center gap-1 text-indigo-800">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{locale === 'pl' ? 'Odznaka szybkiego kontaktu' : 'Fast responder badge'}</span>
                </div>
                <p className="text-[11px] text-indigo-900/80 leading-relaxed">
                  {locale === 'pl'
                    ? 'Szybkie odpowiedzi zainteresowanym studentom wyróżniają Twój pokój na liście wyszukiwania.'
                    : 'Replying promptly to students helps highlight your room at the top of search results.'}
                </p>
              </div>
            </div>

            {/* 3. Onlo AI Assistant (Free community matching, no licenses or billing) */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {locale === 'pl' ? 'Asystent Onlo AI' : 'Onlo AI Assistant'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {locale === 'pl' ? 'Odpowiedzi na pytania o pokój 24/7' : '24/7 automated room answers'}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  {locale === 'pl' ? 'Aktywny (Bezpłatnie)' : 'Active (Free)'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-150 space-y-2 text-xs text-slate-600 leading-relaxed">
                <p className="text-[11px] text-slate-600">
                  {locale === 'pl'
                    ? 'Onlo AI odpowiada na pytania studentów w oparciu o ustalone przez Ciebie zasady domu, oszczędzając czas.'
                    : 'Onlo AI automatically answers student inquiries based directly on your house rules, saving you time.'}
                </p>
                <div className="text-[10px] text-slate-500 font-medium">
                  {locale === 'pl'
                    ? 'Bez opłat, bez subskrypcji i bez pośredników. Pełna swoboda porozumienia.'
                    : 'Direct community matching. No subscription fees, no agency commissions.'}
                </div>
              </div>
            </div>

            {/* 4. House rules with the note that Onlo answers from them */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  House rules
                </h3>
                {isLandlord && (
                  <button
                    type="button"
                    onClick={() => setIsEditingFacts(!isEditingFacts)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                  >
                    {isEditingFacts ? 'Cancel' : 'Edit'}
                  </button>
                )}
              </div>

              {isEditingFacts ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Monthly Rent</label>
                    <input
                      type="number"
                      value={editedRent}
                      onChange={(e) => setEditedRent(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Czynsz</label>
                    <input
                      type="number"
                      value={editedCzynsz}
                      onChange={(e) => setEditedCzynsz(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Rules text</label>
                    <textarea
                      rows={3}
                      value={editedRules}
                      onChange={(e) => setEditedRules(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveFacts}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-full transition-colors cursor-pointer"
                  >
                    Save & update Onlo
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 italic leading-relaxed">
                    "{currentPlace.rules}"
                  </div>
                  <div className="p-2.5 bg-indigo-50/80 border border-indigo-150 rounded-2xl text-[11px] text-indigo-950 flex items-start gap-2">
                    <Bot className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">
                      Onlo answers prospect inquiries 24/7 directly from these rules.
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </main>

      {/* Delete Listing Confirmation Modal */}
      {listingToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => !isDeleting && setListingToDelete(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 text-left transform animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0 text-rose-600">
                <Trash2 className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {locale === 'pl' ? 'Usunąć ogłoszenie?' : 'Delete listing?'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {locale === 'pl'
                    ? 'Czy na pewno chcesz usunąć to ogłoszenie? Zostanie ono natychmiast wycofane z wyników wyszukiwania, a oczekujące rezerwacje zostaną anulowane. Tej operacji nie można cofnąć.'
                    : 'Are you sure you want to delete this listing? It will be permanently removed from search results and all active lease takeover holds will be cancelled. This action cannot be undone.'}
                </p>
              </div>
            </div>

            {/* Summary card inside modal */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-xs font-bold text-slate-900 truncate">
                {listingToDelete.title}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>{listingToDelete.city}</span>
                {listingToDelete.rent && (
                  <span className="font-bold text-slate-700">
                    {formatPLN(listingToDelete.rent, locale)}/mo
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setListingToDelete(null)}
                className="px-4 py-2.5 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {locale === 'pl' ? 'Anuluj' : 'Keep listing'}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{locale === 'pl' ? 'Usuwanie...' : 'Deleting...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{locale === 'pl' ? 'Usuń ogłoszenie' : 'Delete listing'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};
