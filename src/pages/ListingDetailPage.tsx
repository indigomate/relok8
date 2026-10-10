import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Heart, Share2, MapPin, Check, Shield, 
  Calendar, School, Train, ChevronLeft, ChevronRight,
  UserCheck, ShieldCheck, ChevronDown, CheckCircle2, MessageSquare,
  Maximize2, Lock, Clock, Sparkles
} from 'lucide-react';
import { Listing } from '../types';
import { formatPLN, formatDate, SupportedLocale } from '../utils/formatters';
import { t } from '../utils/translations';
import { ImageLightbox } from '../components/ImageLightbox';
import { EarlyLockModal } from '../components/EarlyLockModal';
import { AIProxyChatModal } from '../components/AIProxyChatModal';
import { useConvex } from '../lib/convex/client';

interface ListingDetailPageProps {
  listing: Listing;
  onBack: () => void;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onOpenCesja: () => void;
  onOpenDepositClearing: () => void;
  locale?: SupportedLocale;
  currentUser?: { name: string; email: string; avatar?: string } | null;
  onRequireLogin?: (reason: string) => void;
  onLike?: (id: string) => void;
}

export const ListingDetailPage: React.FC<ListingDetailPageProps> = ({
  listing,
  onBack,
  isSaved,
  onToggleSave,
  onOpenCesja,
  onOpenDepositClearing,
  locale = 'en',
  currentUser,
  onRequireLogin,
  onLike
}) => {
  const strings = t[locale === 'pl' ? 'pl' : 'en'];
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [photoLoaded, setPhotoLoaded] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [isTakeoverFaqOpen, setIsTakeoverFaqOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isEarlyLockOpen, setIsEarlyLockOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [inquiryText, setInquiryText] = useState('');
  const [inquirySent, setInquirySent] = useState(false);

  const convex = useConvex();
  const convexDoc = convex.db.listings.find((l) => l._id === listing.id);
  const isLocked = Boolean(convexDoc?.isLocked && convexDoc.lockedUntil && convexDoc.lockedUntil > Date.now());

  const tenant = listing.currentTenant || (listing as any).departingTenant || {
    name: 'Marek S.',
    status: 'Leaving after an Erasmus semester',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    reasonForLeaving: 'Leaving after an Erasmus semester'
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      if (onRequireLogin) {
        onRequireLogin(`Sign up or log in to message ${tenant.name} directly and coordinate the lease takeover.`);
      }
      return;
    }
    const finalMessage = inquiryText.trim() || `Hi ${tenant.name}, I am interested in taking over your lease on ${listing.address} from ${formatDate(listing.availableDate, locale)}. Could we schedule a viewing?`;
    try {
      await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          tenantName: currentUser.name,
          tenantEmail: currentUser.email,
          message: finalMessage
        })
      });
    } catch (err) {}
    setInquirySent(true);
    setTimeout(() => {
      setIsContactModalOpen(false);
      setInquirySent(false);
    }, 2000);
  };

  const handleMessageClick = () => {
    if (!currentUser) {
      if (onRequireLogin) {
        onRequireLogin(`Sign in to message ${tenant.name} directly.`);
      }
      return;
    }
    setIsContactModalOpen(true);
  };

  const moveInDateFormatted = formatDate(listing.availableDate, locale);
  const leaseEndDateFormatted = formatDate(listing.leaseEndDate, locale);

  // Amenities list matching screenshot 4 / screenshot 8
  const defaultAmenities = [
    { label: 'Fibre Wi-Fi' },
    { label: 'Dishwasher' },
    { label: 'Balcony' },
    { label: 'Washing machine' },
    { label: 'Bicycle storage' },
    { label: 'Desk and chair' }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-28 text-left">
      {/* 1. Clean Top Header Bar with Back Arrow, Title, Share & Heart icons (Screenshot 4, 8) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-1 -ml-1 text-slate-800 hover:text-slate-950 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
            {listing.title}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleShare}
            className="p-2 text-slate-700 hover:text-slate-900 cursor-pointer"
            aria-label="Share"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Share2 className="w-5 h-5 stroke-[1.8]" />}
          </button>
          <button
            type="button"
            onClick={() => onToggleSave(listing.id)}
            className="p-2 text-slate-700 hover:text-rose-600 cursor-pointer"
            aria-label={isSaved ? 'Remove from saved' : 'Save'}
          >
            <Heart className={`w-5 h-5 stroke-[1.8] ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-3 space-y-6">
        {/* Photo Gallery (Swipeable carousel / Aspect 4:3 or 16:9, Screenshot 8) */}
        <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/70 shadow-sm">
          {!photoLoaded[activePhotoIdx] && (
            <div className="absolute inset-0 bg-slate-200 animate-pulse z-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin opacity-40" />
            </div>
          )}
          <img
            src={listing.images[activePhotoIdx] || listing.images[0]}
            alt={listing.title}
            onLoad={() => setPhotoLoaded((prev) => ({ ...prev, [activePhotoIdx]: true }))}
            className="w-full h-full object-cover"
            onError={(e) => {
              setPhotoLoaded((prev) => ({ ...prev, [activePhotoIdx]: true }));
              e.currentTarget.src = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80';
            }}
          />

          {/* Top Left: "Available for Takeover" badge */}
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/95 text-slate-800 shadow-sm border border-slate-200/60 backdrop-blur-xs">
              Available for Takeover
            </span>
          </div>

          {/* Navigation Arrows */}
          {listing.images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setActivePhotoIdx((prev) => (prev === 0 ? listing.images.length - 1 : prev - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md cursor-pointer"
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={() => setActivePhotoIdx((prev) => (prev === listing.images.length - 1 ? 0 : prev + 1))}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md cursor-pointer"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </>
          )}

          {/* Photo Counter */}
          <div className="absolute bottom-3 right-3 z-10 px-2 py-0.5 rounded-md bg-black/60 text-white text-xs font-semibold backdrop-blur-xs">
            {activePhotoIdx + 1}/{listing.images.length}
          </div>
        </div>

        {/* Status badges: Meldunek OK, Landlord approved (Screenshot 8) */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {listing.meldunekAllowed && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-100">
              Meldunek OK
            </span>
          )}
          {listing.landlordApproved && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-100">
              Landlord approved
            </span>
          )}
        </div>

        {/* Main Title & Location (Screenshot 8) */}
        <div className="space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {listing.title}
          </h2>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{listing.district}, {listing.city}</span>
          </div>
          {listing.distanceToCampus && (
            <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
              {listing.distanceToCampus}
            </div>
          )}
        </div>

        {/* 4-Box Quick Specs Grid (Screenshot 8: Room type, Size, Floor, Furnished) */}
        <div className="grid grid-cols-2 rounded-2xl border border-slate-200/90 divide-x divide-y divide-slate-200/90 overflow-hidden bg-white text-xs">
          <div className="p-3.5 space-y-0.5">
            <span className="text-slate-500 font-normal">Room type</span>
            <div className="text-sm font-bold text-slate-900">{listing.roomType}</div>
          </div>
          <div className="p-3.5 space-y-0.5">
            <span className="text-slate-500 font-normal">Size</span>
            <div className="text-sm font-bold text-slate-900">{listing.squareMeters} m²</div>
          </div>
          <div className="p-3.5 space-y-0.5">
            <span className="text-slate-500 font-normal">Floor</span>
            <div className="text-sm font-bold text-slate-900">{listing.floor || '3rd floor'}</div>
          </div>
          <div className="p-3.5 space-y-0.5">
            <span className="text-slate-500 font-normal">Furnished</span>
            <div className="text-sm font-bold text-slate-900">{listing.isFurnished ? 'Yes' : 'No'}</div>
          </div>
        </div>

        {/* Price & Deposit Summary Line */}
        <div className="flex items-baseline justify-between pt-1">
          <div>
            <span className="text-2xl font-black text-slate-900 tnum">
              PLN {listing.monthlyRentPLN.toLocaleString()}
            </span>
            <span className="text-slate-500 text-sm font-normal">/mo</span>
          </div>
          <span className="text-slate-500 text-xs font-medium">
            Deposit PLN {listing.depositPLN.toLocaleString()}
          </span>
        </div>

        <div className="border-t border-slate-100 my-4" />

        {/* "About this place" Section (Screenshot 4) */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-900">About this place</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            {listing.description || `Furnished studio on a quiet street, a short walk from campus. Bills are included. The tenant is moving out on ${moveInDateFormatted}.`}
          </p>
        </div>

        <div className="border-t border-slate-100 my-4" />

        {/* Current Tenant Card (Screenshot 4: Avatar circle with initials, Name, Current tenant pill, subtitle) */}
        <div className="flex items-center gap-3.5 py-1">
          <div className="w-11 h-11 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0">
            {tenant.name.split(' ').map((n: string) => n[0]).join('') || 'MS'}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">{tenant.name}</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
                Current tenant
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {tenant.reasonForLeaving || 'Leaving after an Erasmus semester'}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 my-4" />

        {/* "What's included" 2-column Checkmark List (Screenshot 4) */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900">What's included</h3>
          <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs font-medium text-slate-700">
            {defaultAmenities.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-100 my-4" />

        {/* "Nearby" transit & university list (Screenshot 4) */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900">Nearby</h3>
          <div className="space-y-2.5 text-xs text-slate-700">
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="font-medium text-slate-800">Politechnika Warszawska</span>
              <span className="text-slate-500">6 min walk</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="font-medium text-slate-800">Metro Politechnika</span>
              <span className="text-slate-500">4 min walk</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="font-medium text-slate-800">Tram Plac Politechniki</span>
              <span className="text-slate-500">3 min walk</span>
            </div>
          </div>
        </div>

        {/* "How the takeover works" Accordion (Screenshot 4) */}
        <div className="rounded-xl border border-slate-200/90 overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setIsTakeoverFaqOpen(!isTakeoverFaqOpen)}
            className="w-full p-4 flex items-center justify-between text-left text-xs sm:text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span>How the takeover works</span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isTakeoverFaqOpen ? 'rotate-180' : ''}`} />
          </button>
          {isTakeoverFaqOpen && (
            <div className="p-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 space-y-2 bg-slate-50/50">
              <p>
                1. <strong>Direct Landlord Approval</strong>: The current tenant has pre-cleared this room for assignment under Polish Civil Code Art. 509 KC.
              </p>
              <p>
                2. <strong>Zero Agency Fees</strong>: You take over the remaining months at the frozen rental price without 1-month broker commissions.
              </p>
              <p>
                3. <strong>Meldunek Guaranteed</strong>: You receive an official tripartite contract allowing you to register temporary residence and PESEL.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenCesja}
                  className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                >
                  View bilingual tripartite agreement template →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Fixed Sticky Bottom Bar (Screenshot 4: PLN 2,350/mo From 1 Nov & [Message Marek] button) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex items-center justify-between shadow-lg pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="text-left">
          <div className="text-base sm:text-lg font-black text-slate-900 tnum leading-tight">
            PLN {listing.monthlyRentPLN.toLocaleString()}<span className="text-xs font-normal text-slate-500">/mo</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            From {moveInDateFormatted}
          </div>
        </div>

        <button
          type="button"
          onClick={handleMessageClick}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-semibold text-sm transition-all shadow-sm cursor-pointer"
        >
          Message {tenant.name.split(' ')[0]}
        </button>
      </div>

      {/* Message Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Message {tenant.name}
            </h3>
            <p className="text-xs text-slate-500">
              Coordinate a viewing or introduce yourself for the takeover on {listing.address}.
            </p>
            <form onSubmit={handleSendInquiry} className="space-y-4">
              <textarea
                value={inquiryText}
                onChange={(e) => setInquiryText(e.target.value)}
                placeholder={`Hi ${tenant.name}, I'm interested in taking over your lease from ${moveInDateFormatted}...`}
                rows={4}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  {inquirySent ? 'Sent!' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
