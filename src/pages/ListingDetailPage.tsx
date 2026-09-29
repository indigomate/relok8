import React, { useState } from 'react';
import { 
  ArrowLeft, Heart, Bookmark, Share2, MapPin, Check, Shield, FileCheck, 
  Calendar, School, Train, AlertCircle, Sparkles, ChevronLeft, ChevronRight,
  UserCheck, Building2, Key, Info, CheckCircle2, MessageSquare, Phone
} from 'lucide-react';
import { Listing } from '../types';
import { formatPLN, formatDate, SupportedLocale } from '../utils/formatters';

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
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [photoLoaded, setPhotoLoaded] = useState<Record<number, boolean>>({});
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState<number>(listing.likesCount || 24);
  const [copied, setCopied] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);
  const [inquiryText, setInquiryText] = useState(
    `Hi ${listing.departingTenant.name}, I am interested in taking over your lease on ${listing.address} from ${formatDate(listing.availableDate, locale)}. Could we schedule a viewing?`
  );

  const handleToggleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikesCount((prev) => Math.max(1, prev - 1));
    } else {
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
      if (onLike) onLike(listing.id);
    }
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
        onRequireLogin('Sign up or log in to message this tenant directly and coordinate the lease handover.');
      }
      return;
    }

    try {
      await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          tenantName: currentUser.name,
          tenantEmail: currentUser.email,
          message: inquiryText
        })
      });
    } catch (err) {}

    setInquirySent(true);
  };

  const handleTakeoverClick = () => {
    if (!currentUser) {
      if (onRequireLogin) {
        onRequireLogin('Sign up or log in to step into this lease under Polish Civil Code Art. 509 KC.');
      }
      return;
    }
    onOpenCesja();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 text-left">
      
      {/* Top Sticky Header */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          
          {/* Back & Breadcrumb */}
          <div className="flex items-center gap-2 text-xs sm:text-[13px] text-slate-500 overflow-hidden">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to listings</span>
            </button>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="font-medium text-slate-700 hidden sm:inline">{listing.city}</span>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-xs">{listing.title}</span>
          </div>

          {/* Action Buttons: Like, Save, Share */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Share link button */}
            <button
              type="button"
              onClick={handleShare}
              className="p-2 sm:px-3 sm:py-1.5 rounded-full border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 bg-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Share listing URL"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline text-emerald-700">Link copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>

            {/* Like button: only available on the listing page */}
            <button
              type="button"
              onClick={handleToggleLike}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                isLiked
                  ? 'bg-rose-50 border-rose-300 text-rose-700 scale-105 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-rose-600 hover:border-rose-200'
              }`}
              title={isLiked ? 'Unlike listing' : 'Like listing'}
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-500'
                }`}
              />
              <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
            </button>

            {/* Save Apartment button */}
            <button
              type="button"
              onClick={() => onToggleSave(listing.id)}
              className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                isSaved
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300'
              }`}
              title={isSaved ? 'Remove from saved' : 'Save apartment'}
            >
              <Bookmark
                className={`w-4 h-4 ${
                  isSaved ? 'fill-white text-white' : 'text-slate-500'
                }`}
              />
              <span className="hidden sm:inline">{isSaved ? 'Saved apartment' : 'Save apartment'}</span>
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-6 space-y-8">
        
        {/* Title & Location Header */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              {listing.city} · {listing.district}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ✓ Rooms with Meldunek allowed
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              0 PLN Broker Commission
            </span>
            {listing.landlordConsentStatus === 'Guaranteed Consent' && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white">
                Landlord Consent Guaranteed (Art. 509 KC)
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            {listing.title}
          </h1>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{listing.address}</span>
            {listing.metroNearby && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-slate-600 font-medium">{listing.metroNearby}</span>
              </>
            )}
          </div>
        </div>

        {/* Suspended Preview Image Gallery */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            
            {/* Primary Big Photo (Span 3 cols) */}
            <div className="md:col-span-3 relative aspect-[16/10] md:aspect-[16/9] rounded-2xl overflow-hidden bg-slate-200 border border-slate-200 shadow-sm group">
              {/* Suspended Shimmer Placeholder */}
              {!photoLoaded[activePhotoIdx] && (
                <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse z-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full border-3 border-indigo-300 border-t-indigo-600 animate-spin opacity-50" />
                </div>
              )}

              <img
                src={listing.images[activePhotoIdx] || listing.images[0]}
                alt={`${listing.title} photo ${activePhotoIdx + 1}`}
                onLoad={() => setPhotoLoaded((prev) => ({ ...prev, [activePhotoIdx]: true }))}
                className={`w-full h-full object-cover transition-opacity duration-300 relative z-1 ${
                  photoLoaded[activePhotoIdx] ? 'opacity-100' : 'opacity-0'
                }`}
                onError={(e) => {
                  setPhotoLoaded((prev) => ({ ...prev, [activePhotoIdx]: true }));
                  e.currentTarget.src = '/images/listing_warsaw_mokotow_1790621438299.jpg';
                }}
              />

              {/* Prev / Next controls */}
              {listing.images.length > 1 && (
                <div className="absolute inset-y-0 inset-x-3 flex items-center justify-between z-10 pointer-events-none">
                  <button
                    type="button"
                    onClick={() => setActivePhotoIdx((prev) => (prev === 0 ? listing.images.length - 1 : prev - 1))}
                    className="w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-lg transition-transform hover:scale-105 pointer-events-auto cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePhotoIdx((prev) => (prev === listing.images.length - 1 ? 0 : prev + 1))}
                    className="w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-lg transition-transform hover:scale-105 pointer-events-auto cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              <div className="absolute bottom-3 right-3 z-10 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold">
                Photo {activePhotoIdx + 1} of {listing.images.length}
              </div>
            </div>

            {/* Thumbnail Strip (Span 1 col) */}
            <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto max-h-[460px] scrollbar-none">
              {listing.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all shrink-0 w-28 md:w-full cursor-pointer ${
                    activePhotoIdx === idx ? 'border-indigo-600 scale-[0.98] ring-2 ring-indigo-500/20' : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/images/listing_warsaw_mokotow_1790621438299.jpg';
                    }}
                  />
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* Content Layout: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Details (Col span 2) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-white border border-slate-200/90 space-y-1">
                <span className="text-xs text-slate-500 block">Apartment Type</span>
                <span className="text-sm font-bold text-slate-900">{listing.roomType}</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200/90 space-y-1">
                <span className="text-xs text-slate-500 block">Size & Floor</span>
                <span className="text-sm font-bold text-slate-900">{listing.squareMeters} m² · {listing.floor}</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200/90 space-y-1">
                <span className="text-xs text-slate-500 block">Available Date</span>
                <span className="text-sm font-bold text-slate-900">{formatDate(listing.availableDate, locale)}</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200/90 space-y-1">
                <span className="text-xs text-slate-500 block">Lease Duration</span>
                <span className="text-sm font-bold text-indigo-600">{listing.remainingMonths} months left</span>
              </div>
            </div>

            {/* Description */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
              <h2 className="text-lg font-bold text-slate-900">About this apartment & lease assignment</h2>
              <p className="text-[14px] text-slate-600 leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            {/* Outgoing Tenant Verified Story */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={listing.departingTenant.avatar}
                  alt={listing.departingTenant.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{listing.departingTenant.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      <span>Verified Tenant</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {listing.departingTenant.nationality} · {listing.departingTenant.role}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs text-slate-600">
                <span className="font-semibold text-slate-800 block">Reason for early lease transfer:</span>
                <p>"{listing.departingTenant.reasonForLeaving}"</p>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 block">Verified Tenant Credentials:</span>
                <div className="flex flex-wrap gap-2">
                  {listing.departingTenant.verifiedDocs.map((doc, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{doc}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Amenities Grid */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Amenities & Furniture</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[13px] text-slate-700">
                {listing.amenities.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Universities & Transit Connections */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Nearby Campuses & Transit</h2>
              <div className="space-y-2.5">
                {listing.universitiesNearby.map((uni, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700 p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100">
                    <School className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-medium">{uni}</span>
                  </div>
                ))}
                {listing.transitInfo && (
                  <div className="flex items-center gap-2.5 text-xs text-slate-700 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <Train className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-medium">{listing.transitInfo}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Polish Legal Protections: Cesja Umowy Najmu */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 space-y-3">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                <Shield className="w-4 h-4" />
                <span>Cesja umowy najmu wzór english (Art. 509 KC)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                By taking over this lease, you step into the existing contract with zero price increases, guaranteed landlord approval, and official address registration (Meldunek) permitted for your PESEL or Karta Pobytu.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={onOpenCesja}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                >
                  Generate Cesja Agreement
                </button>
                <button
                  type="button"
                  onClick={onOpenDepositClearing}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  View Deposit Protocol
                </button>
              </div>
            </div>

          </div>

          {/* Sticky Side Card: Price & Takeover Contact Form (Col span 1) */}
          <div className="lg:col-span-1 lg:sticky lg:top-36 space-y-4">
            
            {/* Financial Card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 space-y-5">
              
              {/* Price header */}
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-medium">Monthly Rent</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-slate-900 tnum">
                    {formatPLN(listing.monthlyRentPLN, locale)}
                  </span>
                  <span className="text-xs text-slate-500 font-normal">/ month</span>
                </div>
                <div className="text-xs text-emerald-700 font-medium">
                  {listing.czynszIncluded ? '✓ Admin fee (czynsz) included' : `+ czynsz approx. ${listing.czynszAdminPLN} PLN`}
                </div>
              </div>

              {/* Price breakdown table */}
              <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Refundable deposit (Kaucja)</span>
                  <span className="font-bold text-slate-900 font-mono">{formatPLN(listing.depositPLN, locale)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Agency broker commission</span>
                  <span className="font-bold text-emerald-600">0 PLN (Free)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Lease ends</span>
                  <span className="font-medium text-slate-900">{formatDate(listing.leaseEndDate, locale)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Address registration (Meldunek)</span>
                  <span className="font-bold text-emerald-600">Permitted ✓</span>
                </div>
              </div>

              {/* Takeover CTA */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleTakeoverClick}
                  className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Take Over This Lease</span>
                </button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Landlord consent guaranteed under Polish law</span>
                </div>
              </div>

              {/* Contact Message Form */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="text-xs font-bold text-slate-900">
                  Message departing tenant directly
                </div>

                {inquirySent ? (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1">
                    <span className="font-bold block">✓ Inquiry Sent!</span>
                    <p>{listing.departingTenant.name} has been notified and will reply to your contact details.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSendInquiry} className="space-y-2.5">
                    <textarea
                      rows={3}
                      value={inquiryText}
                      onChange={(e) => setInquiryText(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-slate-800 bg-slate-50 resize-none"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Send inquiry to tenant</span>
                    </button>
                  </form>
                )}
              </div>

            </div>

            {/* Landlord Consent Badge Card */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Property Owner: {listing.landlordName}</span>
              </div>
              <p className="text-slate-500 leading-snug">
                Written consent ready for immediate assignment without breaking penalty or additional contract fees.
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
