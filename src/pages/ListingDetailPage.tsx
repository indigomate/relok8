import React, { useState } from 'react';
import { 
  ArrowLeft, Heart, Bookmark, Share2, MapPin, Check, Shield, 
  Calendar, School, Train, AlertCircle, ChevronLeft, ChevronRight,
  UserCheck, Building2, Key, Info, CheckCircle2, MessageSquare, Phone,
  Maximize2
} from 'lucide-react';
import { Listing } from '../types';
import { formatPLN, formatDate, SupportedLocale } from '../utils/formatters';
import { t } from '../utils/translations';
import { ImageLightbox } from '../components/ImageLightbox';

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
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState<number>(listing.likesCount || 24);
  const [copied, setCopied] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const tenant = listing.currentTenant || (listing as any).departingTenant || {
    name: 'Current Tenant',
    nationality: 'Verified',
    role: 'Student',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    verifiedDocs: ['Identity Verified', 'Active Lease'],
    reasonForLeaving: 'Relocating for study/work commitments.'
  };

  const [inquiryText, setInquiryText] = useState(
    `Hi ${tenant.name}, I am interested in taking over your lease on ${listing.address} from ${formatDate(listing.availableDate, locale)}. Could we schedule a viewing?`
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
        onRequireLogin('Sign up or log in to message this tenant directly and coordinate the lease takeover.');
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
        onRequireLogin('Sign up or log in to step into this lease takeover with official landlord approval.');
      }
      return;
    }
    onOpenCesja();
  };

  const moveInDateFormatted = formatDate(listing.availableDate, locale);
  const leaseEndDateFormatted = formatDate(listing.leaseEndDate, locale);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 text-left">
      
      {/* Top Header */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          
          {/* Back & Breadcrumb */}
          <div className="flex items-center gap-2 text-xs sm:text-[13px] text-slate-500 overflow-hidden min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden xs:inline">{locale === 'pl' ? 'Wróć do listy' : 'Back to rooms'}</span>
              <span className="xs:hidden">{locale === 'pl' ? 'Wróć' : 'Back'}</span>
            </button>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="font-medium text-slate-700 hidden sm:inline">{listing.city}</span>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="font-semibold text-slate-900 truncate max-w-[120px] sm:max-w-[200px] md:max-w-xs">{listing.title}</span>
          </div>

          {/* Action Buttons: Like, Save, Share */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleShare}
              className="min-h-[38px] min-w-[38px] p-2 sm:px-3 sm:py-1.5 rounded-full border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 bg-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Share listing URL"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline text-emerald-700">{locale === 'pl' ? 'Skopiowano!' : 'Link copied!'}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">{locale === 'pl' ? 'Udostępnij' : 'Share'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleToggleLike}
              className={`min-h-[38px] min-w-[38px] px-2.5 sm:px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                isLiked
                  ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-rose-600 hover:border-rose-200'
              }`}
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-500'
                }`}
              />
              <span>{likesCount}</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleSave(listing.id)}
              className={`min-h-[38px] min-w-[38px] px-2.5 sm:px-3.5 py-1.5 rounded-full border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                isSaved
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300'
              }`}
            >
              <Bookmark
                className={`w-4 h-4 ${
                  isSaved ? 'fill-white text-white' : 'text-slate-500'
                }`}
              />
              <span className="hidden sm:inline">{isSaved ? strings.saved : strings.save}</span>
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-8">
        
        {/* Apartment Schema.org JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Apartment',
              name: listing.title,
              description: listing.description,
              image: listing.images,
              address: {
                '@type': 'PostalAddress',
                addressLocality: listing.city,
                streetAddress: listing.address,
                addressCountry: 'PL'
              },
              numberOfRooms: listing.roomType === 'Studio' ? 1 : 2,
              floorSize: {
                '@type': 'QuantitativeValue',
                value: listing.squareMeters,
                unitCode: 'MTK'
              },
              offers: {
                '@type': 'Offer',
                price: listing.monthlyRentPLN,
                priceCurrency: 'PLN',
                availability: 'https://schema.org/InStock',
                validFrom: listing.availableDate,
                priceSpecification: {
                  '@type': 'UnitPriceSpecification',
                  price: listing.monthlyRentPLN,
                  priceCurrency: 'PLN',
                  unitText: 'MONTH'
                }
              }
            })
          }}
        />

        {/* Title & Location Header */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              {listing.city} · {listing.district}
            </span>
            {listing.meldunekAllowed && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ✓ {strings.meldunekOkChip}
              </span>
            )}
            {listing.landlordApproved && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white">
                {strings.landlordApprovedChip}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {listing.title}
          </h1>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{listing.address}</span>
            {listing.distanceToCampus && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-slate-700 font-semibold">{listing.distanceToCampus}</span>
              </>
            )}
          </div>
        </div>

        {/* Image Gallery */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div 
              onClick={() => setIsLightboxOpen(true)}
              className="md:col-span-3 relative aspect-[16/10] md:aspect-[16/9] rounded-2xl overflow-hidden bg-slate-200 border border-slate-200 shadow-sm group cursor-zoom-in"
              title="Click to view full size photo"
            >
              {!photoLoaded[activePhotoIdx] && (
                <div className="absolute inset-0 bg-slate-200 animate-pulse z-0 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-300 border-t-indigo-600 animate-spin opacity-50" />
                </div>
              )}

              <img
                src={listing.images[activePhotoIdx] || listing.images[0]}
                alt={`${listing.title} photo ${activePhotoIdx + 1}`}
                onLoad={() => setPhotoLoaded((prev) => ({ ...prev, [activePhotoIdx]: true }))}
                className={`w-full h-full object-cover transition-all duration-300 relative z-1 group-hover:scale-[1.01] ${
                  photoLoaded[activePhotoIdx] ? 'opacity-100' : 'opacity-0'
                }`}
                onError={(e) => {
                  setPhotoLoaded((prev) => ({ ...prev, [activePhotoIdx]: true }));
                  e.currentTarget.src = '/images/listing_warsaw_mokotow_1790621438299.jpg';
                }}
              />

              {/* View Full Size pill */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLightboxOpen(true);
                }}
                className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer pointer-events-auto"
                aria-label="View full size photo"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>{locale === 'pl' ? 'Pełny rozmiar' : 'Full size'}</span>
              </button>

              {listing.images.length > 1 && (
                <div className="absolute inset-y-0 inset-x-3 flex items-center justify-between z-10 pointer-events-none">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIdx((prev) => (prev === 0 ? listing.images.length - 1 : prev - 1));
                    }}
                    className="w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-lg transition-transform hover:scale-105 pointer-events-auto cursor-pointer"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIdx((prev) => (prev === listing.images.length - 1 ? 0 : prev + 1));
                    }}
                    className="w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-lg transition-transform hover:scale-105 pointer-events-auto cursor-pointer"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              <div className="absolute bottom-3 right-3 z-10 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold">
                Photo {activePhotoIdx + 1} of {listing.images.length}
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto max-h-[460px] scrollbar-none">
              {listing.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all shrink-0 w-28 md:w-full cursor-pointer ${
                    activePhotoIdx === idx ? 'border-indigo-600 scale-[0.98]' : 'border-transparent opacity-75 hover:opacity-100'
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

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <div className="lg:col-span-2 space-y-8">
            
            {/* Quick Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-xs text-slate-500 block">{strings.searchRoomType}</span>
                <span className="text-sm font-bold text-slate-900">{listing.roomType}</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-xs text-slate-500 block">Area & Floor</span>
                <span className="text-sm font-bold text-slate-900">{listing.squareMeters} m² · {listing.floor || '2nd floor'}</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-xs text-slate-500 block">{strings.searchMoveInDate}</span>
                <span className="text-sm font-bold text-slate-900">{moveInDateFormatted}</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-xs text-slate-500 block">{strings.leaseTo}</span>
                <span className="text-sm font-bold text-indigo-600">{leaseEndDateFormatted}</span>
              </div>
            </div>

            {/* Description */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
              <h2 className="text-lg font-bold text-slate-900">About this place</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>

            {/* Current Tenant Story */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={tenant.avatar}
                  alt={tenant.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{tenant.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      <span>{strings.currentTenant}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {tenant.nationality} · {tenant.role}
                  </p>
                </div>
              </div>

              {tenant.reasonForLeaving && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800 block">Reason for lease takeover:</span>
                  <p>"{tenant.reasonForLeaving}"</p>
                </div>
              )}
            </div>

            {/* Amenities */}
            {listing.amenities && listing.amenities.length > 0 && (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Amenities & furnishings</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
                  {listing.amenities.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nearby Campuses & Transit */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Nearby universities & transit</h2>
              <div className="space-y-2.5">
                {listing.universitiesNearby && listing.universitiesNearby.map((uni, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700 p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100">
                    <School className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-medium">{uni}</span>
                  </div>
                ))}
                {(listing.transitNearby || (listing as any).transitInfo) && (
                  <div className="flex items-center gap-2.5 text-xs text-slate-700 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <Train className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-medium">{listing.transitNearby || (listing as any).transitInfo}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Landlord Approval Banner */}
            <div className="p-6 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Landlord approved lease takeover</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                By taking over this lease, you step directly into the existing contract with zero agency commissions, landlord agreement, and full eligibility for address registration (meldunek) for your PESEL or residence permit.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTakeoverClick}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                >
                  Start lease takeover
                </button>
                <button
                  type="button"
                  onClick={onOpenDepositClearing}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  View handover protocol
                </button>
              </div>
            </div>

          </div>

          {/* Sticky Side Form */}
          <div id="contact-section" className="lg:col-span-1 lg:sticky lg:top-24 space-y-4 scroll-mt-24">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-100 space-y-5">
              
              {/* Price */}
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-medium">Monthly rent</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {formatPLN(listing.monthlyRentPLN, locale)}
                  </span>
                  <span className="text-xs text-slate-500 font-normal"> / month</span>
                </div>
                <div className="text-xs text-emerald-700 font-medium">
                  {listing.billsIncluded || (listing as any).czynszIncluded
                    ? '✓ Bills included'
                    : `+ bills approx. ${listing.czynszAdminPLN} PLN`}
                </div>
              </div>

              {/* Deposit */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">{strings.deposit}</span>
                <span className="font-bold text-slate-900">{formatPLN(listing.depositPLN, locale)}</span>
              </div>

              {/* Message Tenant Form */}
              {inquirySent ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2 text-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                  <p className="font-bold">Inquiry sent to {tenant.name}!</p>
                  <p className="text-[11px] text-emerald-700">They will reply to your registered email shortly to schedule a viewing.</p>
                </div>
              ) : (
                <form onSubmit={handleSendInquiry} className="space-y-3">
                  <label className="block text-xs font-bold text-slate-800">
                    Message the current tenant
                  </label>
                  <textarea
                    rows={3}
                    value={inquiryText}
                    onChange={(e) => setInquiryText(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    Contact {tenant.name}
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={handleTakeoverClick}
                className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
              >
                Apply for lease takeover
              </button>

            </div>
          </div>

        </div>

      </div>

      {/* Mobile Floating Bottom Bar (§10 Mobile Touch Guidelines) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg flex items-center justify-between gap-3">
        <div>
          <div className="text-base font-extrabold text-slate-900 tnum">
            {formatPLN(listing.monthlyRentPLN, locale)}
            <span className="text-xs font-normal text-slate-500"> / mo</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">
            {listing.billsIncluded || (listing as any).czynszIncluded
              ? '✓ Bills included'
              : `+ bills ${listing.czynszAdminPLN} PLN`}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('contact-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
        >
          Contact {tenant.name.split(' ')[0]}
        </button>
      </div>

      {/* Full-size Image Lightbox Modal */}
      <ImageLightbox
        images={listing.images}
        initialIndex={activePhotoIdx}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        title={listing.title}
      />

    </div>
  );
};
