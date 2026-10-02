import React, { useState } from 'react';
import { 
  X, Heart, Check, Calendar, MapPin, Building,
  ArrowRight, FileText, CheckCircle2, Lock, Share2
} from 'lucide-react';
import { Listing } from '../types';
import { formatPLN, formatDate, SupportedLocale } from '../utils/formatters';
import { t } from '../utils/translations';
import { TransferTracker } from './TransferTracker';

interface ListingDetailModalProps {
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onInitiateCesja: (listing: Listing) => void;
  onInitiateDeposit: (listing: Listing) => void;
  locale?: SupportedLocale;
}

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({
  listing,
  isOpen,
  onClose,
  isSaved,
  onToggleSave,
  onInitiateCesja,
  onInitiateDeposit,
  locale = 'en'
}) => {
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [messageSent, setMessageSent] = useState(false);
  const strings = (t[locale === 'pl' ? 'pl' : 'en'] as any);

  if (!isOpen || !listing) return null;

  const tenant = listing.currentTenant || listing.departingTenant || {
    name: 'Current Tenant',
    nationality: 'Verified',
    role: 'Student / Expat',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    joinedYear: '2025',
    reasonForLeaving: 'Lease takeover'
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#0B1120]/80 backdrop-blur-sm flex justify-center p-3 sm:p-6 md:p-10 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-[800px] bg-[var(--r8-surface-1)] border border-[var(--r8-border)] rounded-[24px] r8-shadow-overlay overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="h-16 px-6 border-b border-[var(--r8-border)] flex items-center justify-between bg-[var(--r8-surface-1)]">
          <div className="flex items-center gap-2 text-[13px] text-[var(--r8-text-2)] font-mono">
            <span>Cesja ref:</span>
            <strong className="text-[var(--r8-text)]">{listing.id.toUpperCase()}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleSave(listing.id)}
              className="w-9 h-9 rounded-[10px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)] text-[var(--r8-text)] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Save listing"
            >
              <Heart
                className={`w-4 h-4 ${isSaved ? 'fill-[var(--r8-coral-500)] text-[var(--r8-coral-500)]' : ''}`}
                strokeWidth={1.75}
              />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-[10px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)] text-[var(--r8-text-2)] hover:text-[var(--r8-text)] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Modal Scroll Body */}
        <div className="p-6 md:p-8 space-y-7 max-h-[82vh] overflow-y-auto">
          
          {/* Header Title */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--r8-surface-2)] border border-[var(--r8-border)] text-[12px] font-semibold text-[var(--r8-text)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--r8-success)]" />
                <span>{listing.landlordConsentStatus || strings.landlordApprovedChip}</span>
              </span>
              <span className="text-[12px] text-[var(--r8-text-3)] font-mono">
                {listing.roomType} · {listing.squareMeters} m²
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-[var(--r8-text)] tracking-tight">
              {listing.title}
            </h2>
            <p className="text-[13px] text-[var(--r8-text-2)] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[var(--r8-indigo-400)] shrink-0" strokeWidth={1.75} />
              <span>{listing.address} ({listing.district}, {listing.city})</span>
            </p>
          </div>

          {/* Photo Gallery - 1 large + thumbnails */}
          <div className="space-y-2.5">
            <div className="aspect-[16/9] w-full rounded-[16px] overflow-hidden bg-[var(--r8-surface-2)] border border-[var(--r8-border)]">
              <img
                src={listing.images[selectedImgIndex] || listing.images[0]}
                alt={listing.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/src/assets/images/listing_warsaw_mokotow_1790621438299.jpg';
                }}
              />
            </div>

            {listing.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {listing.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImgIndex(i)}
                    className={`relative w-20 h-14 rounded-[10px] overflow-hidden shrink-0 border transition-all ${
                      selectedImgIndex === i
                        ? 'border-[var(--r8-indigo-400)] opacity-100'
                        : 'border-transparent opacity-60 hover:opacity-90'
                    }`}
                  >
                    <img src={img} alt={`${listing.title} thumbnail ${i + 1}`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Key Facts strip per §9 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-[16px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)]">
            <div>
              <div className="text-[11px] font-semibold text-[var(--r8-text-3)] uppercase tracking-wider">
                {strings.availableFrom}
              </div>
              <div className="text-sm font-semibold text-[var(--r8-text)] mt-0.5 tnum">
                {formatDate(listing.availableDate, locale)}
              </div>
              <div className="text-[11px] text-[var(--r8-text-3)]">
                {listing.remainingMonths} {locale === 'pl' ? 'mies. do końca' : 'months left'}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-[var(--r8-text-3)] uppercase tracking-wider">
                {strings.leaseRunsTo}
              </div>
              <div className="text-sm font-semibold text-[var(--r8-text)] mt-0.5 tnum">
                {formatDate(listing.leaseEndDate, locale)}
              </div>
              <div className="text-[11px] text-[var(--r8-text-3)]">
                {locale === 'pl' ? 'Koniec umowy' : 'Original end date'}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-[var(--r8-text-3)] uppercase tracking-wider">
                {locale === 'pl' ? 'Czynsz miesięczny' : 'Monthly rent'}
              </div>
              <div className="text-base font-bold text-[var(--r8-text)] mt-0.5 tnum">
                {formatPLN(listing.monthlyRentPLN, locale)}
              </div>
              <div className="text-[11px] text-[var(--r8-success)]">
                {strings.billsIncluded}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-[var(--r8-text-3)] uppercase tracking-wider">
                {strings.deposit} (Kaucja)
              </div>
              <div className="text-base font-bold text-[var(--r8-text)] mt-0.5 tnum">
                {formatPLN(listing.depositPLN, locale)}
              </div>
              <div className="text-[11px] text-[var(--r8-text-3)]">
                {locale === 'pl' ? 'Bezpośrednio P2P' : 'Direct P2P wire'}
              </div>
            </div>
          </div>

          {/* Transfer Tracker in listing context */}
          <div className="p-5 rounded-[16px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)]">
            <TransferTracker currentStepIndex={2} locale={locale} showTitle={true} />
          </div>

          {/* Verification Block per §6.9 */}
          <div className="space-y-3">
            <div className="text-[12px] font-semibold text-[var(--r8-text-3)] uppercase tracking-wider">
              {strings.trustTitle}
            </div>

            <div className="p-4 rounded-[16px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)] space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={tenant.avatar}
                  alt={tenant.name}
                  className="w-10 h-10 rounded-full object-cover border border-[var(--r8-border-strong)]"
                />
                <div>
                  <div className="text-sm font-semibold text-[var(--r8-text)]">
                    {tenant.name} ({tenant.nationality})
                  </div>
                  <div className="text-[12px] text-[var(--r8-text-2)]">
                    {tenant.role} · Member since {tenant.joinedYear}
                  </div>
                </div>
              </div>

              {/* Three verification rows with green tick per §6.9 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[var(--r8-border)]">
                <div className="flex items-center gap-2 text-[12px] text-[var(--r8-text)]">
                  <Check className="w-4 h-4 text-[var(--r8-success)] shrink-0" strokeWidth={2.5} />
                  <span>{strings.trustPassport || 'Passport verified'}</span>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-[var(--r8-text)]">
                  <Check className="w-4 h-4 text-[var(--r8-success)] shrink-0" strokeWidth={2.5} />
                  <span>{strings.trustUni || 'University verified'}</span>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-[var(--r8-text)]">
                  <Check className="w-4 h-4 text-[var(--r8-success)] shrink-0" strokeWidth={2.5} />
                  <span>{strings.trustLandlord || 'Landlord consent secured'}</span>
                </div>
              </div>

              <div className="text-[12px] text-[var(--r8-text-2)] pt-1 italic">
                "{tenant.reasonForLeaving}"
              </div>
            </div>
          </div>

          {/* Legal Assignment Explainer (Art. 509 KC) */}
          <div className="p-4 rounded-[16px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)] space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--r8-text)]">
              <FileText className="w-4 h-4 text-[var(--r8-indigo-600)]" strokeWidth={1.75} />
              <span>{locale === 'pl' ? 'Informacja prawna: Cesja z art. 509 i 519 KC' : 'How the legal assignment works (Art. 509 KC)'}</span>
            </div>
            <p className="text-[12px] text-[var(--r8-text-2)] leading-relaxed">
              {locale === 'pl'
                ? `Właściciel (${listing.landlordName}) wyraził wstępną zgodę na cesję praw i obowiązków z umowy najmu. Dotychczasowy najemca zostaje w pełni zwolniony ze zobowiązań z dniem przekazania lokalu, a wpłacona pierwotnie kaucja zostaje przypisana nowemu najemcy po rozliczeniu P2P.`
                : `The landlord (${listing.landlordName}) has agreed to assign this tenancy. The outgoing tenant is released from all lease obligations on handover day, and the security deposit is re-credited to the incoming tenant following direct settlement.`}
            </p>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onInitiateCesja(listing);
              }}
              className="w-full sm:flex-1 py-3 px-4 bg-[var(--r8-indigo-600)] hover:bg-[var(--r8-indigo-500)] active:translate-y-[1px] text-white text-[13px] font-semibold rounded-[12px] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-none"
            >
              <FileText className="w-4 h-4" strokeWidth={1.75} />
              <span>{locale === 'pl' ? 'Generuj umowę cesji' : 'Generate Bilingual Cesja'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onInitiateDeposit(listing);
              }}
              className="w-full sm:flex-1 py-3 px-4 bg-[var(--r8-surface-2)] hover:bg-[var(--r8-surface-3)] border border-[var(--r8-border-strong)] text-[var(--r8-text)] text-[13px] font-semibold rounded-[12px] transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 text-[var(--r8-success)]" strokeWidth={2} />
              <span>{locale === 'pl' ? 'Rozliczenie kaucji P2P' : 'P2P Deposit Escrow'}</span>
            </button>

            <button
              type="button"
              onClick={() => setMessageSent(true)}
              className="w-full sm:w-auto py-3 px-4 text-[13px] font-medium text-[var(--r8-text-2)] hover:text-[var(--r8-text)] hover:bg-[var(--r8-surface-2)] rounded-[12px] transition-colors cursor-pointer"
            >
              {messageSent ? (locale === 'pl' ? '✓ Wysłano wiadomość' : '✓ Message sent') : (locale === 'pl' ? 'Napisz do lokatora' : 'Message tenant')}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
