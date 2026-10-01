import React, { useState } from 'react';
import { 
  ArrowLeft, CheckCircle2, UploadCloud, ImagePlus, Trash2, 
  MapPin, Home, DollarSign, Calendar, Shield, Sparkles, AlertCircle 
} from 'lucide-react';
import { Listing } from '../types';
import { SupportedLocale, formatPLN } from '../utils/formatters';
import { t } from '../utils/translations';
import { navigateTo } from '../utils/router';

interface ListPageProps {
  onBack: () => void;
  onSubmitListing: (newListing: Listing) => void;
  locale?: SupportedLocale;
}

export const ListPage: React.FC<ListPageProps> = ({
  onBack,
  onSubmitListing,
  locale = 'en'
}) => {
  const strings = t[locale === 'pl' ? 'pl' : 'en'];
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form State
  const [title, setTitle] = useState('Bright room near university');
  const [city, setCity] = useState<'Kraków' | 'Warsaw' | 'Wrocław' | 'Gdańsk' | 'Lublin' | 'Poznań'>('Warsaw');
  const [district, setDistrict] = useState('Mokotów');
  const [address, setAddress] = useState('ul. Puławska 42');
  const [roomType, setRoomType] = useState<'Private room' | 'Studio' | '1-bedroom' | '2-bedroom'>('Studio');
  const [squareMeters, setSquareMeters] = useState(28);
  const [monthlyRentPLN, setMonthlyRentPLN] = useState(2400);
  const [czynszAdminPLN, setCzynszAdminPLN] = useState(400);
  const [depositPLN, setDepositPLN] = useState(2500);
  const [availableDate, setAvailableDate] = useState('2026-10-15');
  const [leaseEndDate, setLeaseEndDate] = useState('2027-06-30');
  const [landlordName, setLandlordName] = useState('Marek Wiśniewski');
  const [tenantName, setTenantName] = useState('Alexandre Martin');
  const [tenantEmail, setTenantEmail] = useState('alex.tenant@relok8.online');
  const [reasonForLeaving, setReasonForLeaving] = useState('Exchange semester ending');
  const [distanceToCampus, setDistanceToCampus] = useState('6 min walk to SGH / WUT');
  const [flatmatesCount, setFlatmatesCount] = useState(0);
  const [isFurnished, setIsFurnished] = useState(true);
  const [meldunekAllowed, setMeldunekAllowed] = useState(true);
  const [landlordApproved, setLandlordApproved] = useState(true);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');

  const PHOTO_PRESETS = [
    { label: 'Warsaw Studio', path: '/images/listing_warsaw_mokotow_1790621438299.jpg' },
    { label: 'Kraków Room', path: '/images/listing_krakow_loft_1790621454348.jpg' },
    { label: 'Wrocław Nordic', path: '/images/listing_wroclaw_nordic_1790621466153.jpg' },
    { label: 'Central Warsaw', path: '/images/listing_warsaw_center_1790621476399.jpg' }
  ];
  const [photos, setPhotos] = useState<string[]>([PHOTO_PRESETS[0].path]);

  const handleAddCustomPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (customPhotoUrl && customPhotoUrl.startsWith('http')) {
      setPhotos((prev) => [...prev, customPhotoUrl]);
      setCustomPhotoUrl('');
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const finalImages = photos.length > 0 ? photos : [PHOTO_PRESETS[0].path];

    const created: Listing = {
      id: `rel-${city.substring(0, 3).toLowerCase()}-${Date.now().toString().slice(-4)}`,
      type: 'lease_takeover',
      title: title.slice(0, 50),
      city,
      district,
      address,
      roomType,
      monthlyRentPLN: Number(monthlyRentPLN) || 2000,
      czynszAdminPLN: Number(czynszAdminPLN) || 350,
      billsIncluded: true,
      depositPLN: Number(depositPLN) || 2000,
      availableDate: availableDate || '2026-10-15',
      leaseEndDate: leaseEndDate || '2027-06-30',
      remainingMonths: 8,
      images: finalImages,
      squareMeters: Number(squareMeters) || 25,
      isFurnished,
      flatmatesCount: roomType === 'Private room' ? Number(flatmatesCount) || 2 : 0,
      distanceToCampus: distanceToCampus || '10 min transit to university',
      meldunekAllowed,
      landlordApproved,
      statusBadge: 'Active takeover',
      landlordName,
      landlordContactEmail: 'landlord@relok8.online',
      likesCount: 1,
      currentTenant: {
        name: tenantName,
        nationality: 'Verified',
        role: 'Departing Tenant',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        verifiedDocs: ['Identity Verified', 'Active Lease'],
        reasonForLeaving,
        joinedYear: '2026'
      },
      amenities: [
        'High-Speed Wi-Fi',
        'Study Desk & Lamp',
        'Equipped Kitchen',
        'Washing Machine'
      ],
      universitiesNearby: [
        `Main ${city} Campuses (10 min transit)`
      ],
      transitNearby: 'Central transit hub (3 min walk)',
      description: `Bright and clean ${roomType} in ${district}, ${city}. Fully furnished, with landlord pre-approval secured for lease takeover (Art. 509 KC). Address registration (meldunek) guaranteed.`,
      depositSettlementType: 'P2P Direct Clearing',
      czynszIncluded: true,
      floor: '2nd floor (with elevator)'
    };

    onSubmitListing(created);
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 text-left">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 pt-8 space-y-8">
        
        {/* Breadcrumb / Back button */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{locale === 'pl' ? 'Wróć do ogłoszeń' : 'Back to rooms'}</span>
          </button>
          <span>/</span>
          <span className="text-slate-700 font-medium">{locale === 'pl' ? 'Dodaj ogłoszenie' : 'List your place'}</span>
        </div>

        {/* Hero Section */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{locale === 'pl' ? 'Cesja bez prowizji · 0 zł opłat' : 'Zero Broker Fees · Free Listing'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {locale === 'pl' ? 'Przekaż swój pokój lub mieszkanie innemu najemcy' : 'List Your Room for a Zero-Penalty Lease Takeover'}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
            {locale === 'pl'
              ? 'Wyprowadzasz się przed końcem umowy najmu? Znajdź godnego zaufania studenta lub ekspata, podpisz trójstronną cesję (Art. 509 KC) i odzyskaj pełną kaucję.'
              : 'Leaving Poland or your lease early? Find a verified replacement tenant to step into your contract, get your deposit back, and pay 0 PLN in landlord penalties.'}
          </p>
        </div>

        {isSuccess ? (
          /* Success Screen */
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-6 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">
                {locale === 'pl' ? 'Twoje ogłoszenie jest już aktywne!' : 'Your listing is live on Relok8!'}
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                {locale === 'pl'
                  ? 'Zainteresowani studenci i ekspaci mogą teraz przeglądać Twoją ofertę i wysyłać zapytania o przejęcie umowy.'
                  : 'International students and expats searching in your city can now contact you to arrange viewings and coordinate the lease takeover.'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {locale === 'pl' ? 'Przejdź do strony głównej' : 'Browse Marketplace'}
              </button>
              <button
                type="button"
                onClick={() => navigateTo(locale === 'pl' ? '/pl/cesja-template' : '/cesja-template')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                {locale === 'pl' ? 'Pobierz wzór cesji dla właściciela' : 'Download Landlord Cesja Template'}
              </button>
            </div>
          </div>
        ) : (
          /* Stepped Intake Form */
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-8 shadow-xs">
            
            {/* Step Indicators */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              {[
                { s: 1, label: locale === 'pl' ? 'Lokalizacja' : 'Location' },
                { s: 2, label: locale === 'pl' ? 'Szczegóły lokalu' : 'Room Specs' },
                { s: 3, label: locale === 'pl' ? 'Czynsz & Daty' : 'Rent & Dates' },
                { s: 4, label: locale === 'pl' ? 'Zdjęcia & Zgody' : 'Photos & Consent' }
              ].map((item) => (
                <button
                  key={item.s}
                  type="button"
                  onClick={() => setStep(item.s)}
                  className={`flex items-center gap-2 text-xs font-bold cursor-pointer transition-colors ${
                    step === item.s
                      ? 'text-indigo-600'
                      : step > item.s
                      ? 'text-slate-700'
                      : 'text-slate-400'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
                    step === item.s
                      ? 'bg-indigo-600 text-white'
                      : step > item.s
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {step > item.s ? '✓' : item.s}
                  </span>
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
            </div>

            {/* STEP 1: Location */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    <span>{locale === 'pl' ? 'Krok 1: Gdzie znajduje się pokój?' : 'Step 1: Where is your room located?'}</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {locale === 'pl' ? 'Wybierz jedno z 6 obsługiwanych miast studenckich w Polsce.' : 'Select one of our primary student university cities in Poland.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {locale === 'pl' ? 'Miasto' : 'City'} *
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                    >
                      <option value="Warsaw">Warsaw (Warszawa)</option>
                      <option value="Kraków">Kraków</option>
                      <option value="Wrocław">Wrocław</option>
                      <option value="Gdańsk">Gdańsk</option>
                      <option value="Lublin">Lublin</option>
                      <option value="Poznań">Poznań</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {locale === 'pl' ? 'Dzielnica' : 'District'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. Mokotów, Śródmieście, Krowodrza"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {locale === 'pl' ? 'Dokładny adres' : 'Street address'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. ul. Puławska 42 / 12"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {locale === 'pl' ? 'Odległość do uczelni / kampusu' : 'Distance to nearest universities'}
                    </label>
                    <input
                      type="text"
                      value={distanceToCampus}
                      onChange={(e) => setDistanceToCampus(e.target.value)}
                      placeholder="e.g. 5 min walk to SGH / WUT, 10 min metro to UW"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {locale === 'pl' ? 'Dalej: Szczegóły lokalu' : 'Next: Room Specs'} &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Room Specs */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Home className="w-4 h-4 text-indigo-600" />
                    <span>{locale === 'pl' ? 'Krok 2: Parametry i wyposażenie' : 'Step 2: Room specifications'}</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {locale === 'pl' ? 'Określ typ pokoju, metraż oraz liczbę współlokatorów.' : 'Specify the room type, square meters, and whether it is furnished.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {locale === 'pl' ? 'Typ pokoju' : 'Room Type'} *
                    </label>
                    <select
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                    >
                      <option value="Studio">Studio (kawalerka)</option>
                      <option value="Private room">Private room (pokój 1-osobowy)</option>
                      <option value="1-bedroom">1-Bedroom (mieszkanie 2-pokojowe)</option>
                      <option value="2-bedroom">2-Bedroom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {locale === 'pl' ? 'Powierzchnia (m²)' : 'Area in m²'} *
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={200}
                      value={squareMeters}
                      onChange={(e) => setSquareMeters(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  {roomType === 'Private room' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {locale === 'pl' ? 'Liczba współlokatorów' : 'Number of flatmates in apartment'}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={flatmatesCount}
                        onChange={(e) => setFlatmatesCount(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="furnishedCheck"
                      checked={isFurnished}
                      onChange={(e) => setIsFurnished(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <label htmlFor="furnishedCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                      {locale === 'pl' ? 'Lokal w pełni umeblowany (łóżko, biurko, szafa)' : 'Fully furnished (bed, study desk, wardrobe)'}
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
                  >
                    &larr; {locale === 'pl' ? 'Wróć' : 'Back'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {locale === 'pl' ? 'Dalej: Czynsz & Daty' : 'Next: Rent & Dates'} &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Rent & Dates */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-indigo-600" />
                    <span>{locale === 'pl' ? 'Krok 3: Koszty i terminy najmu' : 'Step 3: Rent, deposit & timeline'}</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {locale === 'pl' ? 'Nowy najemca przejmuje umowę na dokładnie takich samych warunkach finansowych.' : 'The replacement tenant inherits the active lease at the exact existing rental rate.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {locale === 'pl' ? 'Czynsz najmu (PLN / miesiąc)' : 'Monthly rent (PLN / month)'} *
                    </label>
                    <input
                      type="number"
                      required
                      min={500}
                      max={15000}
                      value={monthlyRentPLN}
                      onChange={(e) => setMonthlyRentPLN(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {locale === 'pl' ? 'Opłaty administracyjne / czynsz adm. (PLN)' : 'Administrative fees (czynsz adm. in PLN)'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={czynszAdminPLN}
                      onChange={(e) => setCzynszAdminPLN(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {locale === 'pl' ? 'Wysokość kaucji (PLN)' : 'Security deposit (PLN)'} *
                    </label>
                    <input
                      type="number"
                      required
                      min={500}
                      value={depositPLN}
                      onChange={(e) => setDepositPLN(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {locale === 'pl' ? 'Dostępne od (data wprowadzenia)' : 'Available from (move-in date)'} *
                    </label>
                    <input
                      type="date"
                      required
                      value={availableDate}
                      onChange={(e) => setAvailableDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {locale === 'pl' ? 'Koniec obecnej umowy najmu' : 'End date of current active lease'} *
                    </label>
                    <input
                      type="date"
                      required
                      value={leaseEndDate}
                      onChange={(e) => setLeaseEndDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
                  >
                    &larr; {locale === 'pl' ? 'Wróć' : 'Back'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {locale === 'pl' ? 'Dalej: Zdjęcia & Zgody' : 'Next: Photos & Landlord'} &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Photos, Landlord Consent & Submit */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-indigo-600" />
                    <span>{locale === 'pl' ? 'Krok 4: Zdjęcia i weryfikacja' : 'Step 4: Photos & Landlord Agreement'}</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {locale === 'pl' ? 'Dobre zdjęcia zwiększają liczbę odpowiedzi o 300% w pierwszych 24h.' : 'Clear photos and landlord consent details ensure smooth handover without disputes.'}
                  </p>
                </div>

                {/* Photo Previews */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700">
                    {locale === 'pl' ? 'Zdjęcia oferty (min. 1 zdjęcie)' : 'Listing Photos (at least 1 photo)'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {photos.map((photo, i) => (
                      <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 group bg-slate-100">
                        <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                        {photos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(i)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Preset or URL */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-xs text-slate-500 self-center">
                      {locale === 'pl' ? 'Szybkie zdjęcia demonstracyjne:' : 'Quick photo templates:'}
                    </span>
                    {PHOTO_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPhotos((prev) => [...prev, p.path])}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer"
                      >
                        + {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Landlord & Meldunek Consent Checks */}
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
                  <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>{locale === 'pl' ? 'Zgoda właściciela i meldunek' : 'Landlord Approval & Meldunek'}</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={landlordApproved}
                        onChange={(e) => setLandlordApproved(e.target.checked)}
                        className="w-4 h-4 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-slate-700 font-medium">
                        {locale === 'pl'
                          ? 'Właściciel mieszkania został poinformowany o zamiarze cesji umowy najmu pod Art. 509 KC.'
                          : 'The landlord is informed and agrees in principle to a lease transfer under Art. 509 KC.'}
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={meldunekAllowed}
                        onChange={(e) => setMeldunekAllowed(e.target.checked)}
                        className="w-4 h-4 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-slate-700 font-medium">
                        {locale === 'pl'
                          ? 'Właściciel wyraża zgodę na meldunek czasowy nowego najemcy w urzędzie (PESEL).'
                          : 'The landlord permits address registration (meldunek) for foreign students/workers.'}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
                  >
                    &larr; {locale === 'pl' ? 'Wróć' : 'Back'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (locale === 'pl' ? 'Publikowanie...' : 'Publishing...') : (locale === 'pl' ? 'Opublikuj ogłoszenie bez prowizji' : 'Publish Free Listing')}
                  </button>
                </div>
              </div>
            )}

          </form>
        )}

      </div>
    </div>
  );
};
