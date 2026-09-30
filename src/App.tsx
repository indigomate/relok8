import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, ArrowRight, Check, CheckCircle2, RefreshCw, 
  MapPin, Calendar, Home, DollarSign, Shield, Users, Heart
} from 'lucide-react';
import { Listing, DepositClearingRecord } from './types';
import { INITIAL_LISTINGS, INITIAL_DEPOSIT_RECORDS } from './data/mockListings';
import { ENABLED_CITIES, getCityBySlug, getCityByName, CityConfig } from './data/cities';
import { Navbar, UserProfile } from './components/Navbar';
import { SearchBar, SearchState } from './components/SearchBar';
import { FiltersBar, FilterValues, SortOption } from './components/FiltersBar';
import { ListingCard } from './components/ListingCard';
import { AlertCaptureCard } from './components/AlertCaptureCard';
import { CityLandingHeader } from './components/CityLandingHeader';
import { DepartingTenantBanner } from './components/DepartingTenantBanner';
import { ListingGridSkeleton } from './components/ListingCardSkeleton';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';

// Modals & Pages
import { IntakeModal } from './components/IntakeModal';
import { CesjaGeneratorModal } from './components/CesjaGeneratorModal';
import { DepositClearingModal } from './components/DepositClearingModal';
import { LeaveYourLeaseModal } from './components/LeaveYourLeaseModal';
import { HelpModal } from './components/HelpModal';
import { LoginModal } from './components/LoginModal';
import { CookieBanner } from './components/CookieBanner';
import { PenaltyCalculatorModal } from './components/PenaltyCalculatorModal';

// Dedicated Subpages
import { ListingDetailPage } from './pages/ListingDetailPage';
import { SavedApartmentsPage } from './pages/SavedApartmentsPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { MeldunekGuidePage } from './pages/MeldunekGuidePage';
import { CesjaTemplatePage } from './pages/CesjaTemplatePage';
import { SafetyGuidePage } from './pages/SafetyGuidePage';
import { LegalTermsPrivacyPage } from './pages/LegalTermsPrivacyPage';

import { SupportedLocale, formatPLN, formatDate } from './utils/formatters';
import { t } from './utils/translations';
import { parseRoute, navigateTo, navigateToCity, navigateToListing, switchLocale, ParsedRoute } from './utils/router';
import { api } from './services/api';

export default function App() {
  // Theme State: Default light
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  // Active Route State from History API
  const [currentRoute, setCurrentRoute] = useState<ParsedRoute>(() =>
    parseRoute(window.location.pathname, window.location.hash, window.location.search)
  );

  // Locale State: synchronized with URL prefix /pl
  const [locale, setLocale] = useState<SupportedLocale>(() => {
    const route = parseRoute(window.location.pathname, window.location.hash, window.location.search);
    if (route.locale === 'pl') return 'pl';
    return (localStorage.getItem('r8_locale') as SupportedLocale) || 'en';
  });

  const strings = t[locale === 'pl' ? 'pl' : 'en'];

  // Listings State
  const [listings, setListings] = useState<Listing[]>(() => {
    const saved = localStorage.getItem('r8_listings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_LISTINGS;
  });

  // Wishlist Saved State
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('r8_saved_ids');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return ['rel-krk-01'];
  });

  // Authenticated User State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('r8_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  // Search State: single source of truth synced with URL query
  const [searchState, setSearchState] = useState<SearchState>(() => {
    const params = new URLSearchParams(window.location.search);
    const initialRoute = parseRoute(window.location.pathname, window.location.hash, window.location.search);
    let initialCity = 'Anywhere in Poland';
    if (initialRoute.type === 'city' && initialRoute.cityName) {
      initialCity = initialRoute.cityName;
    } else if (params.get('city')) {
      initialCity = params.get('city')!;
    }
    return {
      city: initialCity,
      moveInDate: params.get('from') || '',
      roomType: params.get('type') || 'All room types',
      minRent: Number(params.get('min')) || 500,
      maxRent: Number(params.get('max')) || 5000
    };
  });

  // Additional Filter Values
  const [filterValues, setFilterValues] = useState<FilterValues>({
    maxRent: searchState.maxRent,
    moveInDate: searchState.moveInDate,
    roomType: searchState.roomType,
    isFurnishedOnly: false,
    billsIncludedOnly: false,
    meldunekOnly: false,
    maxFlatmates: null,
    sortBy: 'soonest'
  });

  // Synchronize searchState and filterValues
  useEffect(() => {
    setFilterValues((prev) => ({
      ...prev,
      maxRent: searchState.maxRent,
      moveInDate: searchState.moveInDate,
      roomType: searchState.roomType
    }));
  }, [searchState.maxRent, searchState.moveInDate, searchState.roomType]);

  // Loading skeleton state
  const [isFiltering, setIsFiltering] = useState(false);

  // Modals state
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [isLeaveLeaseOpen, setIsLeaveLeaseOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isCesjaOpen, setIsCesjaOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginReason, setLoginReason] = useState('');
  const [presetListingForCesja, setPresetListingForCesja] = useState<Listing | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Listen to popstate for History API navigation
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseRoute(window.location.pathname, window.location.hash, window.location.search);
      setCurrentRoute(parsed);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (parsed.locale !== locale) {
        setLocale(parsed.locale);
      }

      if (parsed.type === 'city' && parsed.cityName) {
        setSearchState((prev) => ({ ...prev, city: parsed.cityName! }));
      } else if (parsed.type === 'home') {
        setSearchState((prev) => ({ ...prev, city: 'Anywhere in Poland' }));
      } else if (parsed.type === 'leave-your-lease') {
        setIsLeaveLeaseOpen(true);
      } else if (parsed.type === 'list') {
        setIsIntakeOpen(true);
      } else if (parsed.type === 'help') {
        setIsHelpOpen(true);
      } else if (parsed.type === 'savings-calculator') {
        setIsCalculatorOpen(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [locale]);

  // Sync title and SEO meta
  useEffect(() => {
    if (currentRoute.type === 'city' && currentRoute.cityName) {
      document.title = `Rooms in ${currentRoute.cityName} · No Broker Fees | Relok8`;
    } else if (currentRoute.type === 'listing-detail' && currentRoute.listingId) {
      const found = listings.find((l) => l.id === currentRoute.listingId);
      if (found) {
        document.title = `${found.title} · ${found.city} | Relok8`;
      }
    } else if (currentRoute.type === 'saved') {
      document.title = 'Saved Rooms | Relok8';
    } else if (currentRoute.type === 'how-it-works') {
      document.title = 'How a Lease Takeover Works | Relok8';
    } else {
      document.title = 'Relok8 — Student & Expat Housing in Poland | No Broker Fees';
    }
  }, [currentRoute, listings]);

  // Load listings from backend API
  useEffect(() => {
    api.listings.getAll()
      .then((serverListings) => {
        if (serverListings && serverListings.length > 0) {
          setListings(serverListings);
          localStorage.setItem('r8_listings', JSON.stringify(serverListings));
        }
      })
      .catch(() => {});

    api.auth.getMe()
      .then((user) => {
        if (user) {
          setCurrentUser(user);
          localStorage.setItem('r8_user', JSON.stringify(user));
        }
      })
      .catch(() => {});
  }, []);

  // Update search state and sync URL query
  const handleSearchChange = (changes: Partial<SearchState>) => {
    setSearchState((prev) => {
      const next = { ...prev, ...changes };
      const params = new URLSearchParams(window.location.search);
      if (next.city && next.city !== 'Anywhere in Poland' && next.city !== 'All Poland') {
        const cityObj = getCityByName(next.city);
        if (cityObj && currentRoute.type !== 'city') {
          navigateToCity(cityObj.slug, locale);
        }
      } else if (changes.city === 'Anywhere in Poland' || changes.city === 'All Poland') {
        if (currentRoute.type === 'city') {
          navigateTo(locale === 'pl' ? '/pl' : '/');
        }
      }
      if (next.moveInDate) params.set('from', next.moveInDate); else params.delete('from');
      if (next.roomType && next.roomType !== 'All room types') params.set('type', next.roomType); else params.delete('type');
      if (next.maxRent < 5000) params.set('max', String(next.maxRent)); else params.delete('max');
      
      const newQuery = params.toString() ? `?${params.toString()}` : '';
      window.history.replaceState({}, '', window.location.pathname + newQuery);
      return next;
    });

    setIsFiltering(true);
    setTimeout(() => setIsFiltering(false), 200);
  };

  // Toggle save
  const handleToggleSave = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const isAdding = !savedIds.includes(id);
    setSavedIds((prev) => {
      const next = isAdding ? [...prev, id] : prev.filter((i) => i !== id);
      localStorage.setItem('r8_saved_ids', JSON.stringify(next));
      return next;
    });

    if (isAdding) {
      api.favorites.add(id).catch(() => {});
      if (!currentUser) {
        showToast(
          locale === 'pl'
            ? 'Zapisano! Zaloguj się, aby zsynchronizować zapisane pokoje.'
            : 'Saved! Sign up in 10s to sync your saved rooms across devices.'
        );
      } else {
        showToast(locale === 'pl' ? 'Dodano do zapisanych!' : 'Added to saved!');
      }
    } else {
      api.favorites.remove(id).catch(() => {});
      showToast(locale === 'pl' ? 'Usunięto z zapisanych' : 'Removed from saved');
    }
  };

  const handleLikeListing = async (id: string) => {
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, likesCount: (l.likesCount || 0) + 1 } : l))
    );
    try {
      await api.listings.like(id);
    } catch (e) {}
  };

  const handleAddListing = async (newListing: Listing) => {
    try {
      const created = await api.listings.create(newListing);
      const next = [created, ...listings];
      setListings(next);
      localStorage.setItem('r8_listings', JSON.stringify(next));
    } catch {
      const next = [newListing, ...listings];
      setListings(next);
      localStorage.setItem('r8_listings', JSON.stringify(next));
    }
    showToast(locale === 'pl' ? 'Ogłoszenie zostało dodane!' : 'Listing published successfully!');
  };

  // Active City Config if on city route
  const activeCityConfig = useMemo(() => {
    if (currentRoute.type === 'city' && currentRoute.citySlug) {
      return getCityBySlug(currentRoute.citySlug);
    }
    if (searchState.city && searchState.city !== 'Anywhere in Poland' && searchState.city !== 'All Poland') {
      return getCityByName(searchState.city);
    }
    return undefined;
  }, [currentRoute, searchState.city]);

  // Filter & Sort Listings
  const filteredListings = useMemo(() => {
    const list = listings.filter((l) => {
      // City check
      if (activeCityConfig) {
        if (l.city.toLowerCase() !== activeCityConfig.name.toLowerCase() && l.city.toLowerCase() !== activeCityConfig.slug.toLowerCase()) {
          return false;
        }
      } else if (searchState.city && searchState.city !== 'Anywhere in Poland' && searchState.city !== 'All Poland') {
        if (l.city.toLowerCase() !== searchState.city.toLowerCase()) return false;
      }

      // Room type check
      if (filterValues.roomType && filterValues.roomType !== 'All room types' && filterValues.roomType !== 'All Types') {
        if (l.roomType !== filterValues.roomType) return false;
      }

      // Max rent
      if (l.monthlyRentPLN > filterValues.maxRent) return false;

      // Move in date: listing must be available on or before the selected target date
      if (filterValues.moveInDate) {
        if (new Date(l.availableDate) > new Date(filterValues.moveInDate)) return false;
      }

      // Furnished
      if (filterValues.isFurnishedOnly && !l.isFurnished) return false;

      // Bills included
      if (filterValues.billsIncludedOnly && !l.billsIncluded) return false;

      // Address registration
      if (filterValues.meldunekOnly && !l.meldunekAllowed) return false;

      // Flatmates count
      if (filterValues.maxFlatmates !== null) {
        if (filterValues.maxFlatmates === 0) {
          if (l.flatmatesCount > 0) return false;
        } else if (l.flatmatesCount > filterValues.maxFlatmates) {
          return false;
        }
      }

      return true;
    });

    // Sorting: Soonest move-in (default) · Price low to high · Newest
    return list.sort((a, b) => {
      if (filterValues.sortBy === 'price-asc') {
        return a.monthlyRentPLN - b.monthlyRentPLN;
      }
      if (filterValues.sortBy === 'newest') {
        return b.id.localeCompare(a.id);
      }
      // default: soonest move-in date
      return new Date(a.availableDate).getTime() - new Date(b.availableDate).getTime();
    });
  }, [listings, activeCityConfig, searchState.city, filterValues]);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header (§4.1) */}
      <Navbar
        onOpenListPlace={() => setIsIntakeOpen(true)}
        savedCount={savedIds.length}
        locale={locale}
        onSelectLocale={(newLoc) => {
          setLocale(newLoc);
          switchLocale(newLoc === 'pl' ? 'pl' : 'en', currentRoute);
        }}
        theme={theme}
        setTheme={setTheme}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenLogin={() => {
          setLoginReason('Sign up or log in to manage your saved rooms and contact tenants.');
          setIsLoginOpen(true);
        }}
        currentUser={currentUser}
        onLogout={() => {
          localStorage.removeItem('r8_user');
          setCurrentUser(null);
          showToast(locale === 'pl' ? 'Wylogowano' : 'Logged out');
        }}
        onNavigateSaved={() => {
          navigateTo(locale === 'pl' ? '/pl/saved' : '/saved');
        }}
        searchState={searchState}
        onSearchChange={handleSearchChange}
        onExpandSearch={() => {
          const el = document.getElementById('search-hero');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          } else {
            navigateTo(locale === 'pl' ? '/pl' : '/');
          }
        }}
        isCompactSearchVisible={true}
      />

      {/* Route Views */}
      {currentRoute.type === 'listing-detail' && currentRoute.listingId ? (
        (() => {
          const detailListing = listings.find((l) => l.id === currentRoute.listingId) || listings[0];
          return (
            <ListingDetailPage
              listing={detailListing}
              onBack={() => {
                window.history.back();
              }}
              isSaved={savedIds.includes(detailListing.id)}
              onToggleSave={(id) => handleToggleSave(id)}
              onOpenCesja={() => {
                setPresetListingForCesja(detailListing);
                setIsCesjaOpen(true);
              }}
              onOpenDepositClearing={() => setIsDepositOpen(true)}
              locale={locale}
              currentUser={currentUser}
              onRequireLogin={(reason) => {
                setLoginReason(reason);
                setIsLoginOpen(true);
              }}
              onLike={handleLikeListing}
            />
          );
        })()
      ) : currentRoute.type === 'saved' ? (
        <SavedApartmentsPage
          savedListings={listings.filter((l) => savedIds.includes(l.id))}
          onSelectListing={(l) => navigateToListing(l.id, l.title, locale)}
          onRemoveSaved={(id) => handleToggleSave(id)}
          onClearAll={() => setSavedIds([])}
          onBrowseListings={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
          locale={locale}
        />
      ) : currentRoute.type === 'how-it-works' ? (
        <HowItWorksPage
          onBack={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
          onOpenLeaveYourLease={() => setIsLeaveLeaseOpen(true)}
          onOpenBrowse={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
          locale={locale}
        />
      ) : currentRoute.type === 'meldunek-guide' ? (
        <MeldunekGuidePage
          onBack={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
          onBrowseRooms={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
          locale={locale}
        />
      ) : currentRoute.type === 'cesja-template' ? (
        <CesjaTemplatePage
          onBack={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
          onOpenCesjaModal={() => setIsCesjaOpen(true)}
          locale={locale}
        />
      ) : currentRoute.type === 'safety-guide' ? (
        <SafetyGuidePage
          onBack={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
          onBrowseRooms={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
          locale={locale}
        />
      ) : currentRoute.type === 'terms' ? (
        <LegalTermsPrivacyPage
          view="terms"
          onBack={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
          locale={locale}
        />
      ) : currentRoute.type === 'privacy' ? (
        <LegalTermsPrivacyPage
          view="privacy"
          onBack={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
          locale={locale}
        />
      ) : currentRoute.type === 'cookies' ? (
        <LegalTermsPrivacyPage
          view="privacy"
          onBack={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
          locale={locale}
        />
      ) : (
        /* HOME & CITY PAGE TEMPLATE */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-12 text-left">
          
          {/* City Landing Template Header if on a city route */}
          {activeCityConfig ? (
            <CityLandingHeader
              city={activeCityConfig}
              roomCount={filteredListings.length}
              onClearCity={() => {
                handleSearchChange({ city: 'Anywhere in Poland' });
                navigateTo(locale === 'pl' ? '/pl' : '/');
              }}
              locale={locale}
            />
          ) : (
            /* Home Hero Section (§4.2 expanded search) */
            <section id="search-hero" className="pt-2 sm:pt-6 pb-2 text-center max-w-4xl mx-auto space-y-6">
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                  {strings.heroTitle}
                </h1>
                <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
                  {strings.heroSubtitle}
                </p>
              </div>

              {/* Unified Expanded Search Bar (§4.2) */}
              <div className="w-full max-w-3xl mx-auto">
                <SearchBar
                  mode="expanded"
                  searchState={searchState}
                  onSearchChange={handleSearchChange}
                  onSearchSubmit={() => {
                    const el = document.getElementById('rooms-grid');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  locale={locale}
                />
              </div>

              {/* Value fact & Secondary Link */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setIsLeaveLeaseOpen(true)}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                >
                  {strings.leavingEarlyQuestion}
                </button>
                <span className="hidden sm:inline text-slate-300">·</span>
                <span className="text-slate-500 font-medium">
                  {strings.noBrokerFeeFact}
                </span>
              </div>
            </section>
          )}

          {/* Rooms Grid Section */}
          <section id="rooms-grid" className="space-y-6 pt-4 scroll-mt-24">
            
            {/* Unified Filter Bar (§4.4) */}
            <FiltersBar
              filters={filterValues}
              onFilterChange={(changes) => {
                setFilterValues((prev) => ({ ...prev, ...changes }));
                if (changes.maxRent !== undefined || changes.moveInDate !== undefined || changes.roomType !== undefined) {
                  handleSearchChange({
                    maxRent: changes.maxRent !== undefined ? changes.maxRent : searchState.maxRent,
                    moveInDate: changes.moveInDate !== undefined ? changes.moveInDate : searchState.moveInDate,
                    roomType: changes.roomType !== undefined ? changes.roomType : searchState.roomType
                  });
                }
              }}
              onResetFilters={() => {
                setFilterValues({
                  maxRent: 5000,
                  moveInDate: '',
                  roomType: 'All room types',
                  isFurnishedOnly: false,
                  billsIncludedOnly: false,
                  meldunekOnly: false,
                  maxFlatmates: null,
                  sortBy: 'soonest'
                });
                handleSearchChange({
                  city: 'Anywhere in Poland',
                  maxRent: 5000,
                  moveInDate: '',
                  roomType: 'All room types'
                });
              }}
              resultsCount={filteredListings.length}
              locale={locale}
            />

            {/* Grid or Skeletons or Empty/Alerts State */}
            {isFiltering ? (
              <ListingGridSkeleton count={6} />
            ) : filteredListings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 pt-2">
                {filteredListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    isSaved={savedIds.includes(listing.id)}
                    onToggleSave={(id, e) => handleToggleSave(id, e)}
                    onSelectListing={(l) => navigateToListing(l.id, l.title, locale)}
                    locale={locale}
                  />
                ))}
              </div>
            ) : (
              /* Zero Results State with Alert Capture (§4.7, §6.3) */
              <div className="space-y-6">
                <div className="text-center py-8 px-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {activeCityConfig ? strings.noRoomsInCity : strings.noRoomsFound}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {locale === 'pl'
                      ? 'Zmień kryteria wyszukiwania lub ustaw powiadomienie e-mail dla nowych ofert.'
                      : 'Adjust your filters or set up an email alert to get notified when a new room is listed.'}
                  </p>
                </div>

                <AlertCaptureCard
                  city={activeCityConfig ? activeCityConfig.name : (searchState.city !== 'Anywhere in Poland' ? searchState.city : 'Poland')}
                  locale={locale}
                  onAlertRegistered={(email, city) => {
                    showToast(locale === 'pl' ? `Powiadomienie zapisane dla: ${city}` : `Alert set for ${city}`);
                  }}
                />
              </div>
            )}

            {/* City Page Alert capture box if listings are present */}
            {activeCityConfig && filteredListings.length > 0 && (
              <div className="pt-6">
                <AlertCaptureCard
                  city={activeCityConfig.name}
                  locale={locale}
                  onAlertRegistered={(email, city) => {
                    showToast(locale === 'pl' ? `Powiadomienie zapisane dla: ${city}` : `Alert set for ${city}`);
                  }}
                />
              </div>
            )}

          </section>

          {/* How It Works Section (§1 principles: Housing First, placed after rooms) */}
          <section id="how-it-works-section" className="pt-10 border-t border-slate-200 space-y-6 scroll-mt-24">
            <div className="text-center max-w-2xl mx-auto space-y-1.5">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                {strings.howItWorksTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                {strings.howItWorksSub}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-left">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center border border-indigo-100">
                  1
                </div>
                <h4 className="font-bold text-sm text-slate-900">
                  {strings.step1Title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {strings.step1Desc}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-left">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center border border-indigo-100">
                  2
                </div>
                <h4 className="font-bold text-sm text-slate-900">
                  {strings.step2Title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {strings.step2Desc}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-left">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center border border-indigo-100">
                  3
                </div>
                <h4 className="font-bold text-sm text-slate-900">
                  {strings.step3Title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {strings.step3Desc}
                </p>
              </div>
            </div>
          </section>

          {/* Leaving Early Banner */}
          <DepartingTenantBanner
            onOpenLeaveLease={() => setIsLeaveLeaseOpen(true)}
            onOpenIntake={() => setIsIntakeOpen(true)}
            locale={locale}
          />

        </main>
      )}

      {/* Footer (§4.6) */}
      <Footer
        onOpenLeaveYourLease={() => setIsLeaveLeaseOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenSavingsCalculator={() => setIsCalculatorOpen(true)}
        onOpenReportListing={() => {
          showToast(locale === 'pl' ? 'Formularz zgłoszenia ogłoszenia: contact@relok8.online' : 'Listing report request logged');
        }}
        locale={locale}
        theme={theme}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentPath={currentRoute.type}
        savedCount={savedIds.length}
        onNavigateHome={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
        onNavigateSaved={() => navigateTo(locale === 'pl' ? '/pl/saved' : '/saved')}
        onOpenListRoom={() => setIsIntakeOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenLogin={() => {
          setLoginReason('Sign up or log in to manage your account.');
          setIsLoginOpen(true);
        }}
        locale={locale}
      />

      {/* Modals */}
      <IntakeModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        onSubmitListing={handleAddListing}
        locale={locale}
      />

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

      <DepositClearingModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        records={INITIAL_DEPOSIT_RECORDS}
        onUpdateRecord={() => {}}
        locale={locale}
      />

      <CesjaGeneratorModal
        isOpen={isCesjaOpen}
        onClose={() => setIsCesjaOpen(false)}
        presetListing={presetListingForCesja}
        locale={locale}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        locale={locale}
      />

      <PenaltyCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        onOpenIntake={() => {
          setIsCalculatorOpen(false);
          setIsIntakeOpen(true);
        }}
        locale={locale}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem('r8_user', JSON.stringify(user));
          setIsLoginOpen(false);
          showToast(locale === 'pl' ? `Witaj, ${user.name}!` : `Welcome back, ${user.name}!`);
        }}
        locale={locale}
        contextMessage={loginReason}
      />

      <CookieBanner locale={locale} />

    </div>
  );
}
