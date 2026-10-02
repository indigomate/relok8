import React, { useState } from 'react';
import { X, Check, ArrowRight, ArrowLeft, UploadCloud, ImagePlus, Trash2, AlertCircle } from 'lucide-react';
import { Listing } from '../types';
import { formatPLN, formatDate, SupportedLocale } from '../utils/formatters';
import { t } from '../utils/translations';
import { PhotoUploader } from './PhotoUploader';

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
  const strings = t[locale === 'pl' ? 'pl' : 'en'];
  const [step, setStep] = useState(1);

  // Form State
  const [title, setTitle] = useState('Bright room near university');
  const [city, setCity] = useState<'Kraków' | 'Warsaw' | 'Wrocław' | 'Gdańsk' | 'Lublin'>('Kraków');
  const [district, setDistrict] = useState('Krowodrza');
  const [address, setAddress] = useState('ul. Czarnowiejska 45');
  const [roomType, setRoomType] = useState<'Private room' | 'Studio' | '1-bedroom' | '2-bedroom'>('Private room');
  const [squareMeters, setSquareMeters] = useState(20);
  const [monthlyRentPLN, setMonthlyRentPLN] = useState(1700);
  const [depositPLN, setDepositPLN] = useState(1800);
  const [availableDate, setAvailableDate] = useState('2026-10-15');
  const [leaseEndDate, setLeaseEndDate] = useState('2027-06-30');
  const [landlordName, setLandlordName] = useState('Tomasz Wiśniewski');
  const [tenantName, setTenantName] = useState('Piotr Kamiński');
  const [reasonForLeaving, setReasonForLeaving] = useState('Completing university semester');
  const [distanceToCampus, setDistanceToCampus] = useState('5 min walk to campus');
  const [flatmatesCount, setFlatmatesCount] = useState(2);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [photos, setPhotos] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (photos.length === 0) {
      setPhotoError(
        locale === 'pl'
          ? 'Proszę dodać co najmniej jedno zdjęcie pokoju ze swojego urządzenia lub zrobić zdjęcie aparatem.'
          : 'Please upload from your device or take a picture of the room.'
      );
      return;
    }

    const finalImages = photos;

    const created: Listing = {
      id: `rel-${city.substring(0, 3).toLowerCase()}-${Date.now().toString().slice(-4)}`,
      type: 'lease_takeover',
      title: title.slice(0, 40),
      city,
      district,
      address,
      roomType,
      monthlyRentPLN: Number(monthlyRentPLN) || 1700,
      czynszAdminPLN: 300,
      billsIncluded: true,
      depositPLN: Number(depositPLN) || 1800,
      availableDate: availableDate || '2026-10-15',
      leaseEndDate: leaseEndDate || '2027-06-30',
      remainingMonths: 8,
      images: finalImages,
      squareMeters: Number(squareMeters) || 20,
      isFurnished: true,
      flatmatesCount: roomType === 'Private room' ? Number(flatmatesCount) || 2 : 0,
      distanceToCampus: distanceToCampus || '5 min walk to campus',
      meldunekAllowed: true,
      landlordApproved: true,
      statusBadge: 'Active takeover',
      landlordName,
      landlordContactEmail: 'landlord@relok8.online',
      likesCount: 1,
      currentTenant: {
        name: tenantName,
        nationality: 'Verified',
        role: 'Student / Expat',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        verifiedDocs: ['Identity Verified', 'Active Lease'],
        reasonForLeaving,
        joinedYear: '2026'
      },
      amenities: [
        'High-Speed Wi-Fi',
        'Desk & Study Area',
        'Furnished Kitchen',
        'Washing Machine'
      ],
      universitiesNearby: [
        `Main ${city} Campuses (10 min transit)`
      ],
      transitNearby: 'Central transit corridor (3 min walk)',
      description: `Bright and quiet ${roomType} in ${district}, ${city}. Furnished, clean, with landlord consent secured for lease takeover. Address registration (meldunek) fully supported.`,
      floor: '2nd floor'
    };

    onSubmitListing(created);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto text-left max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-sm font-bold text-slate-900">
            {strings.listYourPlace}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-50 border-b border-slate-200 text-xs text-slate-500 shrink-0">
          <span className={step === 1 ? 'text-indigo-600 font-bold' : ''}>1. Place details</span>
          <span>→</span>
          <span className={step === 2 ? 'text-indigo-600 font-bold' : ''}>2. Dates & Rent</span>
          <span>→</span>
          <span className={step === 3 ? 'text-indigo-600 font-bold' : ''}>3. Review</span>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Title (max 40 characters)
                </label>
                <input
                  type="text"
                  maxLength={40}
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Room near AGH and UJ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    City
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="Kraków">Kraków</option>
                    <option value="Warsaw">Warsaw</option>
                    <option value="Wrocław">Wrocław</option>
                    <option value="Gdańsk">Gdańsk</option>
                    <option value="Lublin">Lublin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Neighborhood
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Krowodrza"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Room type
                  </label>
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="Private room">Private room</option>
                    <option value="Studio">Studio</option>
                    <option value="1-bedroom">1-bedroom</option>
                    <option value="2-bedroom">2-bedroom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Size (m²)
                  </label>
                  <input
                    type="number"
                    value={squareMeters}
                    onChange={(e) => setSquareMeters(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Walking distance to campus
                </label>
                <input
                  type="text"
                  value={distanceToCampus}
                  onChange={(e) => setDistanceToCampus(e.target.value)}
                  placeholder="e.g. 5 min walk to AGH"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {strings.searchMoveInDate}
                  </label>
                  <input
                    type="date"
                    required
                    value={availableDate}
                    onChange={(e) => setAvailableDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {strings.leaseTo}
                  </label>
                  <input
                    type="date"
                    required
                    value={leaseEndDate}
                    onChange={(e) => setLeaseEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Monthly rent (PLN)
                  </label>
                  <input
                    type="number"
                    required
                    value={monthlyRentPLN}
                    onChange={(e) => setMonthlyRentPLN(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {strings.deposit} (PLN)
                  </label>
                  <input
                    type="number"
                    required
                    value={depositPLN}
                    onChange={(e) => setDepositPLN(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Landlord name (for takeover approval)
                </label>
                <input
                  type="text"
                  required
                  value={landlordName}
                  onChange={(e) => setLandlordName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-2/3 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  Review
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  {locale === 'pl' ? 'Zdjęcia oferty (wgraj z urządzenia lub zrób zdjęcie)' : 'Listing photos (upload from device or take photo)'} *
                </label>
                <PhotoUploader
                  photos={photos}
                  onChange={(newPhotos) => {
                    setPhotos(newPhotos);
                    if (newPhotos.length > 0) setPhotoError(null);
                  }}
                  locale={locale}
                  maxPhotos={6}
                />
                {photoError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{photoError}</span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="font-bold text-slate-900 text-sm">{title}</div>
                <div className="text-slate-600">{district}, {city}</div>
                <div className="text-indigo-600 font-semibold">
                  Move in from {formatDate(availableDate, locale)} · lease to {formatDate(leaseEndDate, locale)}
                </div>
                <div className="font-bold text-slate-900">
                  PLN {monthlyRentPLN} /mo · Deposit PLN {depositPLN}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs leading-relaxed">
                ✓ Landlord pre-approved lease takeover · Address registration (meldunek) supported · 0 PLN broker fee
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/3 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
                >
                  Publish listing
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
