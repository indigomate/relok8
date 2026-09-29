import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, ArrowRight, Check, CheckCircle2, RefreshCw, 
  Calculator, FileText, MapPin, Calendar, Home, DollarSign,
  Shield, Users, Sparkles, Map as MapIcon, LayoutGrid, Columns2
} from 'lucide-react';
import { Listing, DepositClearingRecord, SubscriptionTier } from './types';
import { INITIAL_LISTINGS, INITIAL_DEPOSIT_RECORDS } from './data/mockListings';
import { Navbar } from './components/Navbar';
import { ListingCard } from './components/ListingCard';
import { ListingDetailModal } from './components/ListingDetailModal';
import { IntakeModal } from './components/IntakeModal';
import { CesjaGeneratorModal } from './components/CesjaGeneratorModal';
import { DepositClearingModal } from './components/DepositClearingModal';
import { LeaveYourLeaseModal } from './components/LeaveYourLeaseModal';
import { HelpModal } from './components/HelpModal';
import { LoginModal } from './components/LoginModal';
import { CookieBanner } from './components/CookieBanner';
import { Footer } from './components/Footer';
import { SupportedLocale, formatPLN } from './utils/formatters';
import { t } from './utils/translations';
import { parseHashRoute, navigateToCity, CITIES_SEO_INFO } from './utils/router';
import { CityLandingHeader } from './components/CityLandingHeader';
import { ListingGridSkeleton } from './components/ListingCardSkeleton';
import { DepartingTenantBanner } from './components/DepartingTenantBanner';
import { InteractiveMap } from './components/InteractiveMap';

export default function App() {
  // Theme State: Default light
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  // Locale State: EN / PL / UK
  const [locale, setLocale] = useState<SupportedLocale>(() => {
    return (localStorage.getItem('r8_locale') as SupportedLocale) || 'en';
  });

  const strings = t[locale];

  useEffect(() => {
    localStorage.setItem('r8_locale', locale);
  }, [locale]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Listings State
  const [listings, setListings] = useState<Listing[]>(() => {
    const saved = localStorage.getItem('r8_listings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_LISTINGS;
  });

  // Deposit Records State
  const [depositRecords, setDepositRecords] = useState<DepositClearingRecord[]>(() => {
    const saved = localStorage.getItem('r8_deposits');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_DEPOSIT_RECORDS;
  });

  // Wishlist Saved State
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('r8_saved_ids');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return ['rel-waw-01'];
  });

  // Filters State - Initialized from Hash Route if present
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    const initialRoute = parseHashRoute(window.location.hash);
    if (initialRoute.type === 'city' && initialRoute.city) {
      return initialRoute.city;
    }
    return 'All Poland';
  });
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('All Types');
  const [maxRent, setMaxRent] = useState<number>(4500);
  const [isSavedOnly, setIsSavedOnly] = useState<boolean>(false);
  const [filterBillsIncludedOnly, setFilterBillsIncludedOnly] = useState<boolean>(false);
  const [filterMeldunekOnly, setFilterMeldunekOnly] = useState<boolean>(false);

  // View Mode: 'grid' | 'split' | 'map'
  const [viewMode, setViewMode] = useState<'grid' | 'split' | 'map'>('grid');
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);

  // Skeleton Loading & Filter Transition State
  const [isFiltering, setIsFiltering] = useState<boolean>(true);

  // Initial load simulation (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFiltering(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Filter transition effect
  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => {
      setIsFiltering(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedCity, selectedRoomType, maxRent, filterBillsIncludedOnly, filterMeldunekOnly, selectedDate, isSavedOnly]);

  // Modals State - Initialized from Hash Route if applicable
  const [activeListing, setActiveListing] = useState<Listing | null>(null);
  const [isIntakeOpen, setIsIntakeOpen] = useState<boolean>(() => {
    return parseHashRoute(window.location.hash).type === 'list-room';
  });
  const [isCesjaOpen, setIsCesjaOpen] = useState<boolean>(false);
  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);
  const [isLeaveLeaseOpen, setIsLeaveLeaseOpen] = useState<boolean>(() => {
    return parseHashRoute(window.location.hash).type === 'leave-your-lease';
  });
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(() => {
    return parseHashRoute(window.location.hash).type === 'help';
  });
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [presetListingForCesja, setPresetListingForCesja] = useState<Listing | null>(null);

  // HashRouter Listener for SEO-friendly City routes and Page views
  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseHashRoute(window.location.hash);
      
      if (parsed.type === 'city' && parsed.city) {
        setSelectedCity(parsed.city);
        document.title = `${parsed.city} Student Rooms & Housing – No Broker Fees | Relok8`;
      } else if (parsed.type === 'home') {
        setSelectedCity('All Poland');
        document.title = 'Relok8 – Student & Expat Housing in Poland | No Broker Fees';
      } else if (parsed.type === 'leave-your-lease') {
        setIsLeaveLeaseOpen(true);
        document.title = 'Leave Your Lease in Poland (0 PLN Break Fee) | Relok8';
      } else if (parsed.type === 'list-room') {
        setIsIntakeOpen(true);
        document.title = 'List Your Room in Poland | Relok8';
      } else if (parsed.type === 'help') {
        setIsHelpOpen(true);
        document.title = 'Help & Rental Safety Guide | Relok8';
      } else if (parsed.type === 'room-detail' && parsed.listingId) {
        const found = listings.find((l) => l.id === parsed.listingId);
        if (found) {
          setActiveListing(found);
          document.title = `${found.shortTitle || found.title} – ${found.city} | Relok8`;
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initial call to sync title on first mount
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [listings]);

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    navigateToCity(city);
    const target = document.getElementById('rooms');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleToggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      localStorage.setItem('r8_saved_ids', JSON.stringify(next));
      return next;
    });
  };

  const handleAddListing = (newListing: Listing) => {
    const next = [newListing, ...listings];
    setListings(next);
    localStorage.setItem('r8_listings', JSON.stringify(next));
    showToast(locale === 'pl' ? 'Pokój został pomyślnie dodany!' : 'Room listing posted successfully!');
  };

  // Filter listings
  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      if (selectedCity !== 'All Poland' && l.city !== selectedCity) return false;
      if (selectedRoomType !== 'All Types' && l.roomType !== selectedRoomType) return false;
      if (l.monthlyRentPLN > maxRent) return false;
      if (isSavedOnly && !savedIds.includes(l.id)) return false;
      if (filterBillsIncludedOnly && !l.czynszIncluded) return false;
      if (filterMeldunekOnly && !l.meldunekAllowed) return false;
      if (selectedDate && new Date(l.availableDate) > new Date(selectedDate)) return false;
      return true;
    });
  }, [listings, selectedCity, selectedRoomType, maxRent, isSavedOnly, savedIds, filterBillsIncludedOnly, filterMeldunekOnly, selectedDate]);

  const CITIES = [
    { key: 'All Poland', label: strings.searchCityAny },
    { key: 'Warsaw', label: 'Warsaw' },
    { key: 'Kraków', label: 'Kraków' },
    { key: 'Wrocław', label: 'Wrocław' },
    { key: 'Gdańsk', label: 'Gdańsk' },
    { key: 'Lublin', label: 'Lublin' }
  ];

  const ROOM_TYPES = [
    { key: 'All Types', label: strings.searchRoomTypeAny },
    { key: 'Studio', label: 'Studio' },
    { key: '1-Bedroom', label: '1-Bedroom' },
    { key: 'Private Room', label: 'Private Room' },
    { key: '2-Bedroom', label: '2-Bedroom' }
  ];

  const BUDGETS = [
    { value: 4500, label: strings.searchBudgetAny },
    { value: 2000, label: `< ${formatPLN(2000, locale)}` },
    { value: 2600, label: `< ${formatPLN(2600, locale)}` },
    { value: 3200, label: `< ${formatPLN(3200, locale)}` }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center gap-2.5 text-[13px] font-medium animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Navbar
        onOpenIntake={() => setIsIntakeOpen(true)}
        onOpenLeaveYourLease={() => setIsLeaveLeaseOpen(true)}
        savedCount={savedIds.length}
        onToggleSavedOnly={() => setIsSavedOnly(!isSavedOnly)}
        isSavedOnly={isSavedOnly}
        locale={locale}
        setLocale={setLocale}
        theme={theme}
        setTheme={setTheme}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-12">
        
        {/* 1. HERO SECTION: Housing Search First */}
        <section className="pt-2 sm:pt-6 pb-2 text-center max-w-4xl mx-auto space-y-6">
          
          {/* Main Headline */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              {strings.heroTitle}
            </h1>
            <p className="text-[15px] sm:text-[17px] text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {strings.heroSubtitle}
            </p>
          </div>

          {/* Airbnb-style Integrated Search Bar */}
          <div className="bg-white border border-slate-200 shadow-xl rounded-2xl sm:rounded-full p-2 sm:p-2.5 text-left grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-0 items-center">
            
            {/* Where / City */}
            <div className="px-4 py-2 hover:bg-slate-50 rounded-xl sm:rounded-full transition-colors">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {strings.searchCity}
              </label>
              <select
                value={selectedCity}
                onChange={(e) => handleSelectCity(e.target.value)}
                className="w-full bg-transparent text-[14px] font-bold text-slate-900 outline-none cursor-pointer"
              >
                {CITIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* When / Move-in Date */}
            <div className="px-4 py-2 hover:bg-slate-50 rounded-xl sm:rounded-full transition-colors sm:border-l sm:border-slate-200">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {strings.searchDate}
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-transparent text-[13px] font-semibold text-slate-800 outline-none cursor-pointer"
              />
            </div>

            {/* Room Type */}
            <div className="px-4 py-2 hover:bg-slate-50 rounded-xl sm:rounded-full transition-colors sm:border-l sm:border-slate-200">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {strings.searchRoomType}
              </label>
              <select
                value={selectedRoomType}
                onChange={(e) => setSelectedRoomType(e.target.value)}
                className="w-full bg-transparent text-[14px] font-bold text-slate-900 outline-none cursor-pointer"
              >
                {ROOM_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Budget & Search Action */}
            <div className="pl-4 pr-1.5 py-1.5 flex items-center justify-between sm:border-l sm:border-slate-200">
              <div className="flex-1 pr-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {strings.searchBudget}
                </label>
                <select
                  value={maxRent}
                  onChange={(e) => setMaxRent(Number(e.target.value))}
                  className="w-full bg-transparent text-[14px] font-bold text-slate-900 outline-none cursor-pointer"
                >
                  {BUDGETS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  const target = document.getElementById('rooms');
                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-12 h-12 rounded-xl sm:rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-sm"
                aria-label="Search rooms"
              >
                <Search className="w-5 h-5 text-white" strokeWidth={2.2} />
              </button>
            </div>

          </div>

          {/* Secondary Link for departing tenants & Trust Highlights */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-[13px] pt-1">
            <button
              type="button"
              onClick={() => setIsLeaveLeaseOpen(true)}
              className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{strings.heroLeavingLink}</span>
            </button>

            <span className="hidden sm:inline text-slate-300">·</span>

            <div className="flex items-center gap-3 text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
                <span>No broker fees</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
                <span>Landlord approved</span>
              </span>
            </div>
          </div>

        </section>

        {/* 2. AVAILABLE ROOMS & FILTER BAR */}
        <section id="rooms" className="space-y-6 pt-4 scroll-mt-24">
          
          {/* SEO City Landing Page Header (rendered when a city is active, e.g. #/warsaw/rooms) */}
          {selectedCity !== 'All Poland' && CITIES_SEO_INFO[selectedCity] && (
            <CityLandingHeader
              cityInfo={CITIES_SEO_INFO[selectedCity]}
              roomCount={filteredListings.length}
              onClearCity={() => handleSelectCity('All Poland')}
              locale={locale}
            />
          )}

          {/* Section Header: Title & Clean City Tabs */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">
                  {selectedCity === 'All Poland' ? 'Poland Housing Marketplace' : `${selectedCity} Lease Handovers`}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {selectedCity !== 'All Poland' 
                  ? (locale === 'pl' ? `Pokoje w mieście ${selectedCity}` : `Rooms in ${selectedCity}`)
                  : (locale === 'pl' ? 'Dostępne pokoje i mieszkania' : locale === 'uk' ? 'Доступні кімнати та квартири' : 'Rooms available now')}
              </h2>
              <p className="text-[13px] text-slate-500 mt-0.5">
                {locale === 'pl'
                  ? 'Oferty bezpośrednie od wyprowadzających się lokatorów. Bez prowizji agencji.'
                  : 'Direct lease assignments from departing tenants. Zero broker commissions.'}
              </p>
            </div>

            {/* City Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {CITIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => handleSelectCity(c.key)}
                  className={`px-3.5 py-1.5 text-[13px] rounded-full whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    selectedCity === c.key
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 font-semibold'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80 font-medium'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-[13px]">
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Max 2,500 PLN chip */}
              <button
                type="button"
                onClick={() => setMaxRent(maxRent === 2500 ? 4500 : 2500)}
                className={`px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                  maxRent === 2500
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200/80'
                }`}
              >
                ≤ 2,500 PLN
              </button>

              {/* Private Room chip */}
              <button
                type="button"
                onClick={() => setSelectedRoomType(selectedRoomType === 'Private Room' ? 'All Types' : 'Private Room')}
                className={`px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                  selectedRoomType === 'Private Room'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200/80'
                }`}
              >
                Private Room
              </button>

              {/* Studio / 1-Bed chip */}
              <button
                type="button"
                onClick={() => setSelectedRoomType(selectedRoomType === 'Studio' ? 'All Types' : 'Studio')}
                className={`px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                  selectedRoomType === 'Studio'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200/80'
                }`}
              >
                Studio
              </button>

              {/* Bills Included chip */}
              <button
                type="button"
                onClick={() => setFilterBillsIncludedOnly(!filterBillsIncludedOnly)}
                className={`px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                  filterBillsIncludedOnly
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200/80'
                }`}
              >
                {strings.billsIncluded}
              </button>

              {/* Meldunek Allowed chip */}
              <button
                type="button"
                onClick={() => setFilterMeldunekOnly(!filterMeldunekOnly)}
                className={`px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                  filterMeldunekOnly
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200/80'
                }`}
              >
                ✓ {strings.meldunekAllowed}
              </button>
            </div>

            {/* Active Result Count, Reset & View Mode Toggles */}
            <div className="flex flex-wrap items-center gap-3 text-slate-500">
              <span className="font-semibold text-slate-700">
                {isFiltering ? (
                  <span className="inline-flex items-center gap-1.5 text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span>{locale === 'pl' ? 'Aktualizowanie ofert...' : 'Updating rooms...'}</span>
                  </span>
                ) : (
                  `${filteredListings.length} ${strings.roomsAvailable}`
                )}
              </span>

              {(selectedCity !== 'All Poland' || selectedRoomType !== 'All Types' || maxRent < 4500 || filterBillsIncludedOnly || filterMeldunekOnly || isSavedOnly || selectedDate) && (
                <button
                  type="button"
                  onClick={() => {
                    handleSelectCity('All Poland');
                    setSelectedRoomType('All Types');
                    setMaxRent(4500);
                    setFilterBillsIncludedOnly(false);
                    setFilterMeldunekOnly(false);
                    setIsSavedOnly(false);
                    setSelectedDate('');
                  }}
                  className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{strings.filterReset}</span>
                </button>
              )}

              {/* View Mode Toggle: Grid / Split / Map */}
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  title="Split View (List + Map)"
                  className={`hidden md:flex px-2.5 py-1 rounded-lg text-xs font-semibold items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'split'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Columns2 className="w-3.5 h-3.5" />
                  <span>Split</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  title="Map View"
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'map'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>Map</span>
                </button>
              </div>
            </div>
          </div>

          {/* Listings Container: Responsive Grid / Split / Map with Skeleton Loading State */}
          {isFiltering ? (
            <ListingGridSkeleton count={selectedCity === 'All Poland' ? 6 : Math.min(Math.max(filteredListings.length, 3), 6)} />
          ) : filteredListings.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2 animate-in fade-in duration-200">
                {filteredListings.map((listing) => (
                  <div
                    key={listing.id}
                    onMouseEnter={() => setHoveredListingId(listing.id)}
                    onMouseLeave={() => setHoveredListingId(null)}
                  >
                    <ListingCard
                      listing={listing}
                      isSaved={savedIds.includes(listing.id)}
                      onToggleSave={handleToggleSave}
                      onSelectListing={(l) => {
                        setActiveListing(l);
                        window.location.hash = `#/room/${l.id}`;
                      }}
                      locale={locale}
                    />
                  </div>
                ))}
              </div>
            ) : viewMode === 'split' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 items-start animate-in fade-in duration-200">
                {/* Left: 2-column cards */}
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {filteredListings.map((listing) => (
                    <div
                      key={listing.id}
                      onMouseEnter={() => setHoveredListingId(listing.id)}
                      onMouseLeave={() => setHoveredListingId(null)}
                    >
                      <ListingCard
                        listing={listing}
                        isSaved={savedIds.includes(listing.id)}
                        onToggleSave={handleToggleSave}
                        onSelectListing={(l) => {
                          setActiveListing(l);
                          window.location.hash = `#/room/${l.id}`;
                        }}
                        locale={locale}
                      />
                    </div>
                  ))}
                </div>

                {/* Right: Sticky interactive Leaflet map */}
                <div className="hidden lg:block lg:col-span-5 sticky top-24 h-[calc(100vh-140px)] min-h-[520px]">
                  <InteractiveMap
                    listings={filteredListings}
                    onSelectListing={(l) => {
                      setActiveListing(l);
                      window.location.hash = `#/room/${l.id}`;
                    }}
                    onHoverListing={setHoveredListingId}
                    hoveredListingId={hoveredListingId}
                    locale={locale}
                    cityFilter={selectedCity}
                  />
                </div>
              </div>
            ) : (
              /* Full Map View */
              <div className="h-[580px] sm:h-[650px] w-full pt-2 animate-in fade-in duration-200">
                <InteractiveMap
                  listings={filteredListings}
                  onSelectListing={(l) => {
                    setActiveListing(l);
                    window.location.hash = `#/room/${l.id}`;
                  }}
                  onHoverListing={setHoveredListingId}
                  hoveredListingId={hoveredListingId}
                  locale={locale}
                  cityFilter={selectedCity}
                />
              </div>
            )
          ) : (
            <div className="text-center py-16 px-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Home className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {locale === 'pl' ? 'Brak pokoi dla wybranych filtrów' : 'No rooms match these filters'}
              </h3>
              <p className="text-[13px] text-slate-500 max-w-sm mx-auto">
                {locale === 'pl' ? 'Spróbuj wybrać inne miasto lub zresetować filtry.' : 'Try changing your city or increasing your budget range.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  handleSelectCity('All Poland');
                  setSelectedRoomType('All Types');
                  setMaxRent(4500);
                  setFilterBillsIncludedOnly(false);
                  setFilterMeldunekOnly(false);
                  setIsSavedOnly(false);
                  setSelectedDate('');
                }}
                className="px-4 py-2 bg-slate-900 text-white text-[13px] font-semibold rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                {strings.filterReset}
              </button>
            </div>
          )}

          {/* Floating Mobile/Desktop Bottom Pill to toggle Map/List */}
          <div className="fixed bottom-6 inset-x-0 flex justify-center z-40 pointer-events-none">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'map' ? 'grid' : 'map')}
              className="pointer-events-auto px-4 py-2.5 rounded-full bg-slate-900/95 hover:bg-slate-900 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xl hover:scale-105 transition-all cursor-pointer border border-white/20 backdrop-blur-md"
            >
              {viewMode === 'map' ? (
                <>
                  <LayoutGrid className="w-4 h-4 text-indigo-400" />
                  <span>{locale === 'pl' ? 'Pokaż listę' : 'Show list'}</span>
                </>
              ) : (
                <>
                  <MapIcon className="w-4 h-4 text-indigo-400" />
                  <span>{locale === 'pl' ? 'Pokaż mapę' : 'Show map'}</span>
                </>
              )}
            </button>
          </div>

        </section>

        {/* 3. HOW IT WORKS (Placed after listings, clean 3 steps) */}
        <section id="how-it-works" className="pt-10 border-t border-slate-200 space-y-6 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto space-y-1.5">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {strings.howItWorksTitle}
            </h3>
            <p className="text-[14px] text-slate-600">
              {strings.howItWorksSub}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-500/40 hover:shadow-lg transition-all duration-300 space-y-3 text-left group">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-sm flex items-center justify-center border border-indigo-100 shadow-sm">
                1
              </div>
              <h4 className="font-bold text-[16px] text-slate-900 group-hover:text-indigo-600 transition-colors">
                {strings.step1Title}
              </h4>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                {strings.step1Desc}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-500/40 hover:shadow-lg transition-all duration-300 space-y-3 text-left group">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-sm flex items-center justify-center border border-indigo-100 shadow-sm">
                2
              </div>
              <h4 className="font-bold text-[16px] text-slate-900 group-hover:text-indigo-600 transition-colors">
                {strings.step2Title}
              </h4>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                {strings.step2Desc}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-500/40 hover:shadow-lg transition-all duration-300 space-y-3 text-left group">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 font-bold text-sm flex items-center justify-center border border-indigo-100 shadow-sm">
                3
              </div>
              <h4 className="font-bold text-[16px] text-slate-900 group-hover:text-indigo-600 transition-colors">
                {strings.step3Title}
              </h4>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                {strings.step3Desc}
              </p>
            </div>

          </div>
        </section>

        {/* 4. LEAVING YOUR LEASE EARLY? DEDICATED PROMO BANNER */}
        <DepartingTenantBanner
          onOpenLeaveLease={() => {
            window.location.hash = '#/leave-your-lease';
            setIsLeaveLeaseOpen(true);
          }}
          onOpenIntake={() => {
            window.location.hash = '#/list-your-room';
            setIsIntakeOpen(true);
          }}
          locale={locale}
        />

        {/* 5. HONEST TRUST & SAFETY SECTION */}
        <section className="pt-6 border-t border-slate-200 space-y-6">
          <div className="space-y-1 text-left">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              {strings.trustTitle}
            </h3>
            <p className="text-[13px] text-slate-500">
              {locale === 'pl'
                ? 'Co robimy, aby proces najmu był bezpieczny dla obcokrajowców i studentów:'
                : 'How Relok8 safeguards international students and working expats:'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-[14px] font-bold text-slate-900">
                <Check className="w-4 h-4 text-emerald-600" strokeWidth={2.5} />
                <span>{locale === 'pl' ? 'Pisemna zgoda właściciela' : 'Landlord pre-approval'}</span>
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                {locale === 'pl'
                  ? 'Przygotowujemy oficjalną dokumentację cesji najmu, którą właściciel akceptuje przed podpisaniem umowy.'
                  : 'We prepare the assignment documents and ensure the property owner approves before any agreement is signed.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-[14px] font-bold text-slate-900">
                <Check className="w-4 h-4 text-emerald-600" strokeWidth={2.5} />
                <span>{locale === 'pl' ? 'Gwarancja meldunku' : 'Address registration (Meldunek)'}</span>
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                {locale === 'pl'
                  ? 'Wszyscy właściciele lokali na Relok8 potwierdzają zgodę na rejestrację pobytu i nadanie numeru PESEL.'
                  : 'Every room listed explicitly permits official city address registration needed for PESEL and residence permits.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-[14px] font-bold text-slate-900">
                <Check className="w-4 h-4 text-emerald-600" strokeWidth={2.5} />
                <span>{locale === 'pl' ? 'Bezpieczny protokół zdawczy' : 'Handover protocol inspection'}</span>
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                {locale === 'pl'
                  ? 'Kaucja jest rozliczana na podstawie podpisanego stanu liczników i wyposażenia lokalu.'
                  : 'Security deposits are transferred with mutually signed meter readings and photographic handover checklists.'}
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <Footer
        onOpenLeaveYourLease={() => {
          window.location.hash = '#/leave-your-lease';
          setIsLeaveLeaseOpen(true);
        }}
        onOpenHelp={() => {
          window.location.hash = '#/help';
          setIsHelpOpen(true);
        }}
        onOpenIntake={() => {
          window.location.hash = '#/list-your-room';
          setIsIntakeOpen(true);
        }}
        onSelectCity={(city) => {
          handleSelectCity(city);
        }}
        locale={locale}
        theme={theme}
      />

      {/* Cookie Consent Banner */}
      <CookieBanner locale={locale} />

      {/* Modals */}
      {activeListing && (
        <ListingDetailModal
          isOpen={!!activeListing}
          listing={activeListing}
          isSaved={savedIds.includes(activeListing.id)}
          onToggleSave={handleToggleSave}
          onClose={() => {
            setActiveListing(null);
            if (window.location.hash.startsWith('#/room/')) {
              navigateToCity(selectedCity);
            }
          }}
          onInitiateCesja={(listing: Listing) => {
            setPresetListingForCesja(listing);
            setIsCesjaOpen(true);
            setActiveListing(null);
          }}
          onInitiateDeposit={(_listing: Listing) => {
            setIsDepositOpen(true);
            setActiveListing(null);
          }}
          locale={locale}
        />
      )}

      {isIntakeOpen && (
        <IntakeModal
          isOpen={isIntakeOpen}
          onClose={() => setIsIntakeOpen(false)}
          onSubmitListing={handleAddListing}
          locale={locale}
        />
      )}

      {isCesjaOpen && (
        <CesjaGeneratorModal
          isOpen={isCesjaOpen}
          onClose={() => {
            setIsCesjaOpen(false);
            setPresetListingForCesja(null);
          }}
          presetListing={presetListingForCesja}
          locale={locale}
        />
      )}

      {isDepositOpen && (
        <DepositClearingModal
          isOpen={isDepositOpen}
          onClose={() => setIsDepositOpen(false)}
          records={depositRecords}
          onUpdateRecord={(updated) => {
            setDepositRecords((prev) => prev.map((r) => r.id === updated.id ? updated : r));
          }}
          locale={locale}
        />
      )}

      {isLeaveLeaseOpen && (
        <LeaveYourLeaseModal
          isOpen={isLeaveLeaseOpen}
          onClose={() => setIsLeaveLeaseOpen(false)}
          onOpenIntake={() => {
            setIsLeaveLeaseOpen(false);
            setIsIntakeOpen(true);
          }}
          onOpenCesja={() => {
            setIsLeaveLeaseOpen(false);
            setIsCesjaOpen(true);
          }}
          locale={locale}
        />
      )}

      {isHelpOpen && (
        <HelpModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          locale={locale}
        />
      )}

      {isLoginOpen && (
        <LoginModal
          isOpen={isLoginOpen}
          onClose={() => setIsLoginOpen(false)}
          locale={locale}
        />
      )}

    </div>
  );
}
