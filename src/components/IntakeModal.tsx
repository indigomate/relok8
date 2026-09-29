import React, { useState } from 'react';
import { X, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { Listing } from '../types';
import { formatPLN, formatDate, SupportedLocale } from '../utils/formatters';

interface IntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitListing: (newListing: Listing) => void;
  locale?: SupportedLocale;
}

export const IntakeModal: React.FC<IntakeModalProps> = ({
  isOpen,
  onClose,
  onSubmitListing,
  locale = 'en'
}) => {
  const [step, setStep] = useState(1);

  // Form State
  const [city, setCity] = useState<'Warsaw' | 'Kraków' | 'Wrocław' | 'Gdańsk' | 'Poznań' | 'Lublin'>('Warsaw');
  const [district, setDistrict] = useState('Mokotów');
  const [address, setAddress] = useState('ul. Puławska 42');
  const [roomType, setRoomType] = useState<'Studio' | '1-Bedroom' | '2-Bedroom' | 'Private Room'>('Studio');
  const [squareMeters, setSquareMeters] = useState(32);
  const [monthlyRentPLN, setMonthlyRentPLN] = useState(2500);
  const [depositPLN, setDepositPLN] = useState(2800);
  const [availableDate, setAvailableDate] = useState('2026-10-20');
  const [leaseEndDate, setLeaseEndDate] = useState('2027-06-30');
  const [landlordName, setLandlordName] = useState('Tomasz Wiśniewski');
  const [tenantName, setTenantName] = useState('Matteo Rossi');
  const [reasonForLeaving, setReasonForLeaving] = useState('Completing university semester');
  const [isFireSale, setIsFireSale] = useState(false);

  const PHOTO_PRESETS = [
    { label: 'Warsaw Studio', path: '/src/assets/images/listing_warsaw_mokotow_1790621438299.jpg' },
    { label: 'Kraków Loft', path: '/src/assets/images/listing_krakow_loft_1790621454348.jpg' },
    { label: 'Wrocław Nordic', path: '/src/assets/images/listing_wroclaw_nordic_1790621466153.jpg' },
    { label: 'Central Room', path: '/src/assets/images/listing_warsaw_center_1790621476399.jpg' }
  ];
  const [selectedPhoto, setSelectedPhoto] = useState(PHOTO_PRESETS[0].path);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const created: Listing = {
      id: `rel-${city.substring(0, 3).toLowerCase()}-${Date.now().toString().slice(-4)}`,
      title: `${roomType} in ${city} ${district}`,
      shortTitle: `${roomType} in ${city} ${district}`,
      city,
      district,
      address,
      roomType,
      monthlyRentPLN: Number(monthlyRentPLN) || 2500,
      czynszAdminPLN: 400,
      czynszIncluded: true,
      depositPLN: Number(depositPLN) || 2800,
      availableDate: availableDate || '2026-10-20',
      leaseEndDate: leaseEndDate || '2027-06-30',
      remainingMonths: 8,
      images: [
        selectedPhoto,
        '/src/assets/images/listing_warsaw_mokotow_1790621438299.jpg'
      ],
      meldunekAllowed: true,
      isFurnished: true,
      flatmatesInfo: roomType === 'Private Room' ? 'Shared with flatmates' : 'Entire flat',
      transitInfo: 'Direct transit to university and city center',
      isFireSale,
      isGuestFavorite: false,
      isVerifiedTransfer: true,
      landlordConsentStatus: 'Guaranteed Consent',
      landlordName,
      landlordContactEmail: 'landlord@relok8.online',
      departingTenant: {
        name: tenantName,
        nationality: 'International',
        role: 'Expat / Student',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        verifiedDocs: ['Passport', 'University ID', 'Lease Contract'],
        reasonForLeaving,
        joinedYear: '2026'
      },
      amenities: [
        'High-Speed Wi-Fi',
        'Furnished Kitchen',
        'Washing Machine',
        'Heating Included'
      ],
      universitiesNearby: [
        `Main ${city} Campuses (10 min public transit)`
      ],
      description: `Registered Day 1. Early lease assignment under Polish Civil Code Art. 509 KC. Security deposit cleared directly upon handover.`,
      squareMeters: Number(squareMeters) || 32,
      floor: '2nd floor',
      depositSettlementType: 'P2P Direct Clearing'
    };

    onSubmitListing(created);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#0B1120]/80 backdrop-blur-sm flex justify-center p-3 sm:p-6 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-[720px] bg-[var(--r8-surface-1)] border border-[var(--r8-border)] rounded-[24px] r8-shadow-overlay overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="h-16 px-6 border-b border-[var(--r8-border)] flex items-center justify-between bg-[var(--r8-surface-1)]">
          <div className="text-[13px] font-bold text-[var(--r8-text)]">
            {locale === 'pl' ? 'Dodaj pokój (Dzień 1)' : 'List your room (Day 1)'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[10px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)] text-[var(--r8-text-2)] hover:text-[var(--r8-text)] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Stepper progress */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-[var(--r8-surface-2)] border-b border-[var(--r8-border)] text-[12px] text-[var(--r8-text-3)]">
          <span className={step === 1 ? 'text-[var(--r8-text)] font-semibold' : ''}>1. Property</span>
          <span>→</span>
          <span className={step === 2 ? 'text-[var(--r8-text)] font-semibold' : ''}>2. Dates & Rent</span>
          <span>→</span>
          <span className={step === 3 ? 'text-[var(--r8-text)] font-semibold' : ''}>3. Landlord</span>
          <span>→</span>
          <span className={step === 4 ? 'text-[var(--r8-text)] font-semibold' : ''}>4. Review</span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
          
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-medium text-[var(--r8-text-2)] block mb-1">City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value as any)}
                    className="w-full h-11 bg-[var(--r8-surface-2)] border border-[var(--r8-border-strong)] rounded-[12px] px-3 text-[13px] text-[var(--r8-text)] outline-none"
                  >
                    <option value="Warsaw">Warsaw</option>
                    <option value="Kraków">Kraków</option>
                    <option value="Wrocław">Wrocław</option>
                    <option value="Gdańsk">Gdańsk</option>
                    <option value="Poznań">Poznań</option>
                    <option value="Lublin">Lublin</option>
                  </select>
                </div>
                <div>
                  <label className="text-[13px] font-medium text-[var(--r8-text-2)] block mb-1">District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full h-11 bg-[var(--r8-surface-2)] border border-[var(--r8-border-strong)] rounded-[12px] px-3 text-[13px] text-[var(--r8-text)] outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[13px] font-medium text-[var(--r8-text-2)] block mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full h-11 bg-[var(--r8-surface-2)] border border-[var(--r8-border-strong)] rounded-[12px] px-3 text-[13px] text-[var(--r8-text)] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-medium text-[var(--r8-text-2)] block mb-1">Room Type</label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value as any)}
                    className="w-full h-11 bg-[var(--r8-surface-2)] border border-[var(--r8-border-strong)] rounded-[12px] px-3 text-[13px] text-[var(--r8-text)] outline-none"
                  >
                    <option value="Studio">Studio</option>
                    <option value="1-Bedroom">1-Bedroom</option>
                    <option value="2-Bedroom">2-Bedroom</option>
                    <option value="Private Room">Private Room in Flatshare</option>
                  </select>
                </div>
                <div>
                  <label className="text-[13px] font-medium text-[var(--r8-text-2)] block mb-1">Size (m²)</label>
                  <input
                    type="number"
                    value={squareMeters}
                    onChange={(e) => setSquareMeters(Number(e.target.value))}
                    className="w-full h-11 bg-[var(--r8-surface-2)] border border-[var(--r8-border-strong)] rounded-[12px] px-3 text-[13px] text-[var(--r8-text)] outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[13px] font-medium text-[var(--r8-text-2)] block mb-1.5">Apartment photo</label>
                <div className="grid grid-cols-4 gap-2">
                  {PHOTO_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPhoto(p.path)}
                      className={`relative aspect-[4/3] rounded-[10px] overflow-hidden border transition-all cursor-pointer ${
                        selectedPhoto === p.path ? 'border-[var(--r8-indigo-400)] scale-[0.98]' : 'border-transparent opacity-60'
                      }`}
                    >
                      <img src={p.path} alt={p.label} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 inset-x-1 text-[9px] bg-[#0B1120]/80 text-white rounded text-center truncate px-1">
                        {p.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-medium text-[var(--r8-text-2)] block mb-1">Monthly Rent (PLN)</label>
                  <input
                    type="number"
                    value={monthlyRentPLN}
                    onChange={(e) => setMonthlyRentPLN(Number(e.target.value))}
                    className="w-full h-11 bg-[var(--r8-surface-2)] border border-[var(--r8-border-strong)] rounded-[12px] px-3 text-[13px] text-[var(--r8-text)] font-mono outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[13px] font-medium text-[var(--r8-text-2)] block mb-1">Deposit Kaucja (PLN)</label>
                  <input
                    type="number"
                    value={depositPLN}
                    onChange={(e) => setDepositPLN(Number(e.target.value))}
                    className="w-full h-11 bg-[var(--r8-surface-2)] border border-[var(--r8-border-strong)] rounded-[12px] px-3 text-[13px] text-[var(--r8-text)] font-mono outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[13px] font-medium text-[var(--r8-text-2)] block mb-1">Available Date</label>
                  <input
                    type="date"
                    value={availableDate}
                    onChange={(e) => setAvailableDate(e.target.value)}
                    className="w-full h-11 bg-[var(--r8-surface-2)] border border-[var(--r8-border-strong)] rounded-[12px] px-3 text-[13px] text-[var(--r8-text)] font-mono outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[13px] font-medium text-[var(--r8-text-2)] block mb-1">Lease End Date</label>
                  <input
                    type="date"
                    value={leaseEndDate}
                    onChange={(e) => setLeaseEndDate(e.target.value)}
                    className="w-full h-11 bg-[var(--r8-surface-2)] border border-[var(--r8-border-strong)] rounded-[12px] px-3 text-[13px] text-[var(--r8-text)] font-mono outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-[13px] font-medium text-[var(--r8-text-2)] block mb-1">Landlord Name</label>
                <input
                  type="text"
                  value={landlordName}
                  onChange={(e) => setLandlordName(e.target.value)}
                  className="w-full h-11 bg-[var(--r8-surface-2)] border border-[var(--r8-border-strong)] rounded-[12px] px-3 text-[13px] text-[var(--r8-text)] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[13px] font-medium text-[var(--r8-text-2)] block mb-1">Your Name</label>
                <input
                  type="text"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="w-full h-11 bg-[var(--r8-surface-2)] border border-[var(--r8-border-strong)] rounded-[12px] px-3 text-[13px] text-[var(--r8-text)] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[13px] font-medium text-[var(--r8-text-2)] block mb-1">Reason for Leaving</label>
                <input
                  type="text"
                  value={reasonForLeaving}
                  onChange={(e) => setReasonForLeaving(e.target.value)}
                  className="w-full h-11 bg-[var(--r8-surface-2)] border border-[var(--r8-border-strong)] rounded-[12px] px-3 text-[13px] text-[var(--r8-text)] outline-none"
                  required
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <div className="text-[13px] font-semibold text-[var(--r8-text)]">
                Review your room listing
              </div>

              {/* Mini Card Preview */}
              <div className="p-3 rounded-[16px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)] space-y-2">
                <div className="text-sm font-semibold text-[var(--r8-text)]">
                  {roomType} · {district} ({city})
                </div>
                <div className="text-xs text-[var(--r8-text-2)]">
                  Available {formatDate(availableDate, locale)} · Lease runs to {formatDate(leaseEndDate, locale)}
                </div>
                <div className="text-sm font-bold text-[var(--r8-text)] font-mono tnum">
                  {formatPLN(monthlyRentPLN, locale)} /mo · Deposit {formatPLN(depositPLN, locale)}
                </div>
              </div>

              <div className="p-3 rounded-[12px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)] flex items-center justify-between">
                <div className="text-xs text-[var(--r8-text-2)]">
                  Mark as urgent transfer (Ends in 6 days badge)
                </div>
                <input
                  type="checkbox"
                  checked={isFireSale}
                  onChange={(e) => setIsFireSale(e.target.checked)}
                  className="w-4 h-4 rounded text-[var(--r8-indigo-600)]"
                />
              </div>
            </div>
          )}

          {/* Nav Buttons */}
          <div className="pt-3 border-t border-[var(--r8-border)] flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-3.5 py-2 text-xs font-semibold text-[var(--r8-text-2)] hover:text-[var(--r8-text)] bg-[var(--r8-surface-2)] rounded-[10px] flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Back</span>
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[var(--r8-indigo-600)] hover:bg-[var(--r8-indigo-500)] rounded-[10px] flex items-center gap-1 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            ) : (
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[var(--r8-indigo-600)] hover:bg-[var(--r8-indigo-500)] rounded-[10px] flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" strokeWidth={2.5} />
                <span>Publish room</span>
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};
