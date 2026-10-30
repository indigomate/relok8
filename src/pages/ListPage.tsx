import {invalidListingStep, draftStore} from '../utils/listingFlow';
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, CheckCircle2, UploadCloud, ImagePlus, Trash2, 
  MapPin, Home, DollarSign, Calendar, Shield, ShieldCheck, AlertCircle 
} from 'lucide-react';
import { Listing } from '../types';
import { SupportedLocale, formatPLN } from '../utils/formatters';
import { t } from '../utils/translations';
import { navigateTo } from '../utils/router';
import { PhotoUploader } from '../components/PhotoUploader';

interface ListPageProps {
  onBack: () => void;
  onSubmitListing: (newListing: Listing) => Promise<Listing>;
  onRequireLogin?: () => void;
  locale?: SupportedLocale;
  currentUser?: { id?: string; name?: string; email?: string } | null;
}

export const ListPage: React.FC<ListPageProps> = ({
  onBack,
  onRequireLogin,
  onSubmitListing,
  locale = 'en',
  currentUser
}) => {
  const strings = t[locale === 'pl' ? 'pl' : 'en'];
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form State - start empty with placeholders (first number is never fixed)
  const [title, setTitle] = useState('');
  const [city, setCity] = useState<'Kraków' | 'Warsaw' | 'Wrocław' | 'Gdańsk' | 'Lublin' | 'Poznań'>('Warsaw');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [roomType, setRoomType] = useState<'Private room' | 'Studio' | '1-bedroom' | '2-bedroom'>('Studio');
  const [squareMeters, setSquareMeters] = useState('');
  const [monthlyRentPLN, setMonthlyRentPLN] = useState('');
  const [czynszAdminPLN, setCzynszAdminPLN] = useState('');
  const [depositPLN, setDepositPLN] = useState('');
  // Dynamic default dates (first of upcoming month and academic year end)
  const getUpcomingMoveInDate = () => {
    const d = new Date();
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return nextMonth.toISOString().split('T')[0];
  };

  const getUpcomingLeaseEndDate = () => {
    const d = new Date();
    const targetYear = d.getMonth() >= 6 ? d.getFullYear() + 1 : d.getFullYear();
    return `${targetYear}-06-30`;
  };

  const [availableDate, setAvailableDate] = useState('');
  const [leaseEndDate, setLeaseEndDate] = useState('');
  const [landlordEmail, setLandlordEmail] = useState('');
  const [billsIncluded, setBillsIncluded] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [publishedId, setPublishedId] = useState('');
  const [landlordName, setLandlordName] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [reasonForLeaving, setReasonForLeaving] = useState('');
  const [distanceToCampus, setDistanceToCampus] = useState('');
  const [flatmatesCount, setFlatmatesCount] = useState('');
  const [isFurnished, setIsFurnished] = useState(false);
  const [meldunekAllowed, setMeldunekAllowed] = useState(false);
  const [landlordApproved, setLandlordApproved] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Helper: ensures only digits (0-9) are accepted in numeric parts of the form
  const handleNumericInput = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '');
    setter(digitsOnly);
  };

  // Real photos uploaded from device or captured from site camera
  const [photos, setPhotos] = useState<string[]>([]);

  const draftKey = currentUser?.id || 'anonymous';
  const [draftReady,setDraftReady] = useState(false);
  const [draftStatus,setDraftStatus] = useState('');
  const formRef=useRef<HTMLFormElement>(null);
  const errorRef=useRef<HTMLParagraphElement>(null);
  const draft = {title,city,district,address,roomType,squareMeters,monthlyRentPLN,czynszAdminPLN,depositPLN,availableDate,leaseEndDate,landlordName,landlordEmail,tenantName,tenantEmail,reasonForLeaving,distanceToCampus,flatmatesCount,isFurnished,meldunekAllowed,landlordApproved,billsIncluded,photos};
  useEffect(()=>{let active=true;(async()=>{try{const saved=await draftStore('read',draftKey)||(draftKey!=='anonymous'?await draftStore('read','anonymous'):undefined);if(active&&saved){if(typeof saved.title === typeof title) setTitle(saved.title);
if(typeof saved.city === typeof city) setCity(saved.city);
if(typeof saved.district === typeof district) setDistrict(saved.district);
if(typeof saved.address === typeof address) setAddress(saved.address);
if(typeof saved.roomType === typeof roomType) setRoomType(saved.roomType);
if(typeof saved.squareMeters === typeof squareMeters) setSquareMeters(saved.squareMeters);
if(typeof saved.monthlyRentPLN === typeof monthlyRentPLN) setMonthlyRentPLN(saved.monthlyRentPLN);
if(typeof saved.czynszAdminPLN === typeof czynszAdminPLN) setCzynszAdminPLN(saved.czynszAdminPLN);
if(typeof saved.depositPLN === typeof depositPLN) setDepositPLN(saved.depositPLN);
if(typeof saved.availableDate === typeof availableDate) setAvailableDate(saved.availableDate);
if(typeof saved.leaseEndDate === typeof leaseEndDate) setLeaseEndDate(saved.leaseEndDate);
if(typeof saved.landlordName === typeof landlordName) setLandlordName(saved.landlordName);
if(typeof saved.landlordEmail === typeof landlordEmail) setLandlordEmail(saved.landlordEmail);
if(typeof saved.tenantName === typeof tenantName) setTenantName(saved.tenantName);
if(typeof saved.tenantEmail === typeof tenantEmail) setTenantEmail(saved.tenantEmail);
if(typeof saved.reasonForLeaving === typeof reasonForLeaving) setReasonForLeaving(saved.reasonForLeaving);
if(typeof saved.distanceToCampus === typeof distanceToCampus) setDistanceToCampus(saved.distanceToCampus);
if(typeof saved.flatmatesCount === typeof flatmatesCount) setFlatmatesCount(saved.flatmatesCount);
if(typeof saved.isFurnished === typeof isFurnished) setIsFurnished(saved.isFurnished);
if(typeof saved.meldunekAllowed === typeof meldunekAllowed) setMeldunekAllowed(saved.meldunekAllowed);
if(typeof saved.landlordApproved === typeof landlordApproved) setLandlordApproved(saved.landlordApproved);
if(typeof saved.billsIncluded === typeof billsIncluded) setBillsIncluded(saved.billsIncluded);
if(typeof saved.photos === typeof photos) setPhotos(saved.photos);}}catch{if(active)setDraftStatus(locale==='pl'?'Zapis szkicu jest niedostępny. Nie zamykaj strony.':'Draft storage unavailable. Keep this page open.');}finally{if(active)setDraftReady(true);}})();return()=>{active=false;};},[]);
  useEffect(()=>{if(!draftReady||isSuccess)return;draftStore('write',draftKey,draft).then(()=>setDraftStatus(locale==='pl'?'Szkic zapisany na tym urządzeniu.':'Draft saved on this device.')).catch(()=>setDraftStatus(locale==='pl'?'Nie zapisano szkicu. Nie zamykaj strony.':'Could not save draft. Keep this page open.'));},[draftReady,isSuccess,title,city,district,address,roomType,squareMeters,monthlyRentPLN,czynszAdminPLN,depositPLN,availableDate,leaseEndDate,landlordName,landlordEmail,tenantName,tenantEmail,reasonForLeaving,distanceToCampus,flatmatesCount,isFurnished,meldunekAllowed,landlordApproved,billsIncluded,photos]);
  const goToStep=(next:number)=>{setReviewed(false);const invalid=invalidListingStep(draft);if(next>step&&invalid!==null&&invalid<next){setPhotoError(locale==='pl'?'Uzupełnij wymagane pola przed przejściem dalej.':'Complete the required fields before continuing.');setStep(invalid);requestAnimationFrame(()=>{errorRef.current?.focus();formRef.current?.reportValidity();});return;}setPhotoError(null);setStep(next);};
  const stepComplete=(n:number)=>{const invalid=invalidListingStep(draft);return invalid===null||n<invalid;};
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const invalid=invalidListingStep(draft);
    if(invalid){setStep(invalid);setPhotoError(locale==='pl'?'Sprawdź wymagane pola, kwoty, daty i email właściciela.':'Check required fields, amounts, dates and the landlord email.');requestAnimationFrame(()=>errorRef.current?.focus());return;}
    if(!reviewed){setReviewed(true);return;}
    if(!currentUser){onRequireLogin?.();return;}
    if (photos.length === 0) {
      setPhotoError(
        locale === 'pl'
          ? 'Proszę dodać co najmniej jedno zdjęcie pokoju ze swojego urządzenia lub zrobić zdjęcie aparatem.'
          : 'Please upload from your device or take a picture of the room before publishing.'
      );
      return;
    }

    setPhotoError(null);
    setIsSubmitting(true);

    const finalImages = photos;

    const created: Listing = {
      id: `rel-${city.substring(0, 3).toLowerCase()}-${Date.now().toString().slice(-4)}`,
      type: 'lease_takeover',
      title: title ? title.slice(0, 50) : `${roomType} in ${district || city}`,
      city,
      district,
      address,
      roomType,
      monthlyRentPLN: Number(monthlyRentPLN),
      czynszAdminPLN: Number(czynszAdminPLN),
      billsIncluded,
      depositPLN: Number(depositPLN),
      availableDate,
      leaseEndDate,
      remainingMonths: Math.max(0,Math.round((Date.parse(leaseEndDate)-Date.parse(availableDate))/2629800000)),
      images: finalImages,
      squareMeters: Number(squareMeters),
      isFurnished,
      flatmatesCount: roomType === 'Private room' ? Number(flatmatesCount) || 0 : 0,
      distanceToCampus,
      meldunekAllowed,
      landlordApproved: false,
      landlordName,
      landlordContactEmail: landlordEmail.trim().toLowerCase(),
      likesCount: 0,
      currentTenant: {
        name: tenantName || currentUser?.name || 'Departing Tenant',
        nationality: 'Tenant',
        role: 'Departing Tenant',
        avatar: '',
        verifiedDocs: [],
        reasonForLeaving,
        joinedYear: '2026'
      },
      amenities: [],
      universitiesNearby: [],
      transitNearby: '',
      description: reasonForLeaving.trim(),
      depositSettlementType: 'P2P Direct Clearing',
      czynszIncluded: false,
      floor: ''
    };

    if (currentUser?.id) {
      (created as any).userId = currentUser.id;
    }
    if (currentUser?.email) {
      (created as any).ownerEmail = currentUser.email;
    }


    try {
      const published = await onSubmitListing(created);
      setPublishedId(published.id);
      setIsSuccess(true);
      await draftStore('delete',draftKey).catch(()=>{});
      await draftStore('delete','anonymous').catch(()=>{});
      try { const mine=JSON.parse(localStorage.getItem('r8_my_listing_ids')||'[]');localStorage.setItem('r8_my_listing_ids',JSON.stringify([published.id,...mine.filter((id:string)=>id!==published.id)])); } catch {}
    } catch (error: any) {
      setPhotoError(error.message || 'Publishing failed. Please try again.');
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-36 sm:pb-24 text-left font-sans">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 pt-4 sm:pt-8 space-y-6 sm:space-y-8">
        
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
        <div className="space-y-2.5 sm:space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>{locale === 'pl' ? 'Cesja bez prowizji · 0 zł opłat' : 'Zero Broker Fees · Free Listing'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {locale === 'pl' ? 'Przekaż swój pokój lub mieszkanie innemu najemcy' : 'List your room and find a replacement tenant'}
          </h1>
          <p className="text-xs sm:text-base text-slate-600 leading-relaxed max-w-2xl">
            {locale === 'pl'
              ? 'Wyprowadzasz się przed końcem umowy? Znajdź nowego najemcę, uzyskaj zgodę właściciela i ustal rozliczenie kaucji.'
              : 'Moving out early? Find a replacement tenant, ask your landlord to approve the change, and agree deposit arrangements directly.'}
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
                onClick={() => navigateTo((locale === 'pl' ? '/pl' : '') + '/listing/' + publishedId)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {locale === 'pl' ? 'Zobacz ogłoszenie' : 'View listing'}
              </button>
              <button
                type="button"
                onClick={() => navigateTo(locale === 'pl' ? '/pl/place' : '/place')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                {locale === 'pl' ? 'Zarządzaj swoim miejscem' : 'Manage My Place'}
              </button>
            </div>
          </div>
        ) : (
          /* Stepped Intake Form */
          <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-8 space-y-6 sm:space-y-8 shadow-xs">
            
            <p role="status" className="text-xs text-slate-500">{draftStatus} {locale==='pl'?'Korzystaj z zaufanego urządzenia.':'Use a trusted device.'}</p>
            {photoError && <p ref={errorRef} tabIndex={-1} role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl">{photoError}</p>}
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
                  onClick={() => goToStep(item.s)}
                  className={`flex items-center gap-2 text-xs font-bold cursor-pointer transition-colors ${
                    step === item.s
                      ? 'text-indigo-600'
                      : stepComplete(item.s)
                      ? 'text-slate-700'
                      : 'text-slate-400'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
                    step === item.s
                      ? 'bg-indigo-600 text-white'
                      : stepComplete(item.s)
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {stepComplete(item.s) ? '✓' : item.s}
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
                    <label htmlFor="listing-city" className="block text-xs font-bold text-slate-700 mb-1.5">
                      {locale === 'pl' ? 'Miasto' : 'City'} *
                    </label>
                    <select id="listing-city"
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
                    <label htmlFor="listing-district" className="block text-xs font-bold text-slate-700 mb-1.5">
                      {locale === 'pl' ? 'Dzielnica' : 'District'} *
                    </label>
                    <input id="listing-district"
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. Mokotów, Śródmieście, Krowodrza"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="listing-address" className="block text-xs font-bold text-slate-700 mb-1.5">
                      {locale === 'pl' ? 'Dokładny adres' : 'Street address'} *
                    </label>
                    <input id="listing-address"
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. ul. Puławska 42 / 12"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="listing-distanceToCampus" className="block text-xs font-bold text-slate-700 mb-1.5">
                      {locale === 'pl' ? 'Odległość do uczelni / kampusu' : 'Distance to nearest universities'}
                    </label>
                    <input id="listing-distanceToCampus"
                      type="text"
                      value={distanceToCampus}
                      onChange={(e) => setDistanceToCampus(e.target.value)}
                      placeholder="e.g. 5 min walk to SGH / WUT, 10 min metro to UW"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
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
                    <label htmlFor="listing-roomType" className="block text-xs font-bold text-slate-700 mb-1.5">
                      {locale === 'pl' ? 'Typ pokoju' : 'Room Type'} *
                    </label>
                    <select id="listing-roomType"
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
                    <label htmlFor="listing-squareMeters" className="block text-xs font-bold text-slate-700 mb-1.5">
                      {locale === 'pl' ? 'Powierzchnia (m²)' : 'Area in m²'} *
                    </label>
                    <input id="listing-squareMeters"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      value={squareMeters}
                      onChange={handleNumericInput(setSquareMeters)}
                      placeholder={locale === 'pl' ? 'np. 28' : 'e.g. 28'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  {roomType === 'Private room' && (
                    <div>
                      <label htmlFor="listing-flatmatesCount" className="block text-xs font-bold text-slate-700 mb-1.5">
                        {locale === 'pl' ? 'Liczba współlokatorów' : 'Number of flatmates in apartment'}
                      </label>
                      <input id="listing-flatmatesCount"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={flatmatesCount}
                        onChange={handleNumericInput(setFlatmatesCount)}
                        placeholder={locale === 'pl' ? 'np. 2' : 'e.g. 2'}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
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
                    onClick={() => goToStep(1)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
                  >
                    &larr; {locale === 'pl' ? 'Wróć' : 'Back'}
                  </button>
                  <button
                    type="button"
                    onClick={() => goToStep(3)}
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
                    {locale === 'pl' ? 'Podaj rzeczywisty czynsz i dodatkowe opłaty. Potwierdź warunki z właścicielem.' : 'Enter the actual rent and additional charges. Confirm the final terms with the landlord.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="listing-monthlyRentPLN" className="block text-xs font-bold text-slate-700 mb-1.5">
                      {locale === 'pl' ? 'Czynsz najmu (PLN / miesiąc)' : 'Monthly rent (PLN / month)'} *
                    </label>
                    <input id="listing-monthlyRentPLN"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      value={monthlyRentPLN}
                      onChange={handleNumericInput(setMonthlyRentPLN)}
                      placeholder={locale === 'pl' ? 'np. 2400' : 'e.g. 2400'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label htmlFor="listing-czynszAdminPLN" className="block text-xs font-bold text-slate-700 mb-1.5">
                      {locale === 'pl' ? 'Opłaty administracyjne / czynsz adm. (PLN)' : 'Additional administration (PLN; enter 0 if included)'}
                    </label>
                    <input id="listing-czynszAdminPLN"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      value={czynszAdminPLN}
                      onChange={handleNumericInput(setCzynszAdminPLN)}
                      placeholder={locale === 'pl' ? 'np. 400' : 'e.g. 400'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label htmlFor="listing-depositPLN" className="block text-xs font-bold text-slate-700 mb-1.5">
                      {locale === 'pl' ? 'Wysokość kaucji (PLN)' : 'Security deposit (PLN)'} *
                    </label>
                    <input id="listing-depositPLN"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      value={depositPLN}
                      onChange={handleNumericInput(setDepositPLN)}
                      placeholder={locale === 'pl' ? 'np. 2500' : 'e.g. 2500'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label htmlFor="listing-availableDate" className="block text-xs font-bold text-slate-700 mb-1.5">
                      {locale === 'pl' ? 'Dostępne od (data wprowadzenia)' : 'Available from (move-in date)'} *
                    </label>
                    <input id="listing-availableDate"
                      type="date"
                      required
                      value={availableDate}
                      onChange={(e) => setAvailableDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="listing-leaseEndDate" className="block text-xs font-bold text-slate-700 mb-1.5">
                      {locale === 'pl' ? 'Koniec obecnej umowy najmu' : 'End date of current active lease'} *
                    </label>
                    <input id="listing-leaseEndDate"
                      type="date"
                      required
                      value={leaseEndDate}
                      onChange={(e) => setLeaseEndDate(e.target.value)}
                      min={availableDate || undefined}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
                  >
                    &larr; {locale === 'pl' ? 'Wróć' : 'Back'}
                  </button>
                  <button
                    type="button"
                    onClick={() => goToStep(4)}
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
                    {locale === 'pl' ? 'Dodaj aktualne zdjęcia oferowanego lokalu.' : 'Add recent photos of the actual room and landlord contact details.'}
                  </p>
                </div>

                <label className="block text-xs font-bold text-slate-700 space-y-2">{locale==='pl'?'Email właściciela (prywatny, do zaproszenia) *':'Landlord email (private, for invitation) *'}<input type="email" required value={landlordEmail} onChange={e=>{setLandlordEmail(e.target.value);setReviewed(false);}} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"/></label>
                <p className="text-xs text-slate-500">{locale==='pl'?'Po publikacji wyślij właścicielowi zaproszenie z My Place. Publikacja nie oznacza zgody właściciela.':'After publishing, invite the landlord from My Place. Publication does not mean landlord approval.'}</p>
                {/* Photo Upload & Camera Capture Component */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      {locale === 'pl' ? 'Zdjęcia oferty (min. 1 zdjęcie)' : 'Listing Photos (at least 1 photo)'} *
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {locale === 'pl' ? 'Prawdziwe zdjęcia z Twojego lokalu' : 'Real photos from your place'}
                    </span>
                  </div>

                  <PhotoUploader
                    photos={photos}
                    onChange={(newPhotos) => {
                      setPhotos(newPhotos);
                      if (newPhotos.length > 0) setPhotoError(null);
                    }}
                    locale={locale}
                    maxPhotos={8}
                  />

                  {photoError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{photoError}</span>
                    </div>
                  )}
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
                          ? 'Omówiłem zmianę najemcy z właścicielem. To moje oświadczenie, nie zweryfikowana zgoda.'
                          : 'I have discussed a possible replacement with the landlord. This is my statement, not verified approval.'}
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

                {reviewed && <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm space-y-2" role="status"><strong>{locale==='pl'?'Podsumowanie ogłoszenia':'Review your listing'}</strong><p>{roomType} · {district}, {city} · {squareMeters} m²</p><p>{address}</p><p>{availableDate} → {leaseEndDate}</p><p>{formatPLN(Number(monthlyRentPLN)+Number(czynszAdminPLN),locale)} / {locale==='pl'?'miesiąc + media do ustalenia':'month + utilities to confirm'}</p><p>{locale==='pl'?'Kaucja: ':'Deposit: '}{formatPLN(Number(depositPLN),locale)}</p><p>{photos.length} {locale==='pl'?'zdjęć · email właściciela:':'photos · landlord email:'} {landlordEmail}</p><p>{locale==='pl'?'Sprawdź dane. Relok8 nie pobiera płatności ani nie gwarantuje zwrotu kaucji.':'Check the details. Relok8 does not collect payments or guarantee deposit returns.'}</p></div>}
                <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => goToStep(3)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer text-center"
                  >
                    &larr; {locale === 'pl' ? 'Wróć' : 'Back'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !draftReady}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 text-center"
                  >
                    {isSubmitting ? (locale === 'pl' ? 'Publikowanie...' : 'Publishing...') : (!reviewed ? (locale==='pl'?'Sprawdź przed publikacją':'Review before publishing') : !currentUser ? (locale==='pl'?'Zaloguj się, aby opublikować':'Sign in to publish') : (locale==='pl'?'Opublikuj ogłoszenie':'Publish listing'))}
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
