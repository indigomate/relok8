import React, { useState, useMemo, useEffect } from 'react';
import { useUser } from '@clerk/react';
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
import { HelpPage } from './pages/HelpPage';
import { ListPage } from './pages/ListPage';
import { LeaveYourLeasePage } from './pages/LeaveYourLeasePage';
import { SavingsCalculatorPage } from './pages/SavingsCalculatorPage';
import { AccountPage } from './pages/AccountPage';

import { SupportedLocale, formatPLN, formatDate } from './utils/formatters';
import { t } from './utils/translations';
import { parseRoute, navigateTo, navigateToCity, navigateToListing, switchLocale, ParsedRoute } from './utils/router';
import { 
  supabase, 
  getListings, 
  getListingById, 
  createListing, 
  getCurrentUser, 
  addFavorite, 
  removeFavorite, 
  likeListing, 
  isSupabaseConfigured 
} from './lib/supabase/client';

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

  // Listings State: sourced strictly from database / live intake
  const [listings, setListings] = useState<Listing[]>(() => {
    const saved = localStorage.getItem('r8_listings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const live = Array.isArray(parsed) ? parsed.filter((l: any) => !l.id?.startsWith('rel-krk-01') && !l.id?.startsWith('rel-waw-01') && !l.id?.startsWith('rel-wro-01') && !l.id?.startsWith('rel-gdn-01') && !l.id?.startsWith('rel-lub-01')) : [];
        if (live.length > 0) return live;
      } catch (e) {}
    }
    return [];
  });

  // Wishlist Saved State: real user saves only
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('r8_saved_ids');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.filter((id: string) => id !== 'rel-krk-01') : [];
      } catch (e) {}
    }
    return [];
  });

  // Authenticated User State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('r8_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  // Clerk Authentication Sync
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();

  useEffect(() => {
    if (isClerkLoaded) {
      if (clerkUser) {
        const mappedUser: UserProfile = {
          id: clerkUser.id,
          name: clerkUser.fullName || clerkUser.firstName || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User',
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          avatar: clerkUser.imageUrl,
          role: (clerkUser.publicMetadata?.role as string) || 'student',
          isVerified: clerkUser.primaryEmailAddress?.verification?.status === 'verified',
          phone: clerkUser.primaryPhoneNumber?.phoneNumber || ''
        };
        setCurrentUser(mappedUser);
        localStorage.setItem('r8_user', JSON.stringify(mappedUser));
      } else {
        // If logged out from Clerk, clear local storage session
        setCurrentUser(null);
        localStorage.removeItem('r8_user');
      }
    }
  }, [clerkUser, isClerkLoaded]);

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
  const [isLoginOpen, setIsLoginOpen] = useState(() => currentRoute.type === 'sign-in' || currentRoute.type === 'sign-up');
  const [loginMode, setLoginMode] = useState<'signin' | 'signup'>(() => currentRoute.type === 'sign-up' ? 'signup' : 'signin');
  const [loginReason, setLoginReason] = useState('');
  const [presetListingForCesja, setPresetListingForCesja] = useState<Listing | null>(null);

  // Automatically open auth modal when navigating to /sign-in, /sign-up, /login, /register
  useEffect(() => {
    if (currentRoute.type === 'sign-up') {
      setLoginMode('signup');
      setIsLoginOpen(true);
    } else if (currentRoute.type === 'sign-in') {
      setLoginMode('signin');
      setIsLoginOpen(true);
    }
  }, [currentRoute.type]);

  const handleOpenLogin = (mode: 'signin' | 'signup' = 'signin', reason: string = '') => {
    setLoginMode(mode);
    setLoginReason(reason);
    setIsLoginOpen(true);
  };

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
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [locale]);

  // Dynamic SEO Synchronization (Titles, Meta Descriptions, Canonical URLs & OpenGraph)
  useEffect(() => {
    let pageTitle = 'Relok8 — Student & Expat Housing in Poland | No Broker Fees';
    let metaDesc = 'Direct lease takeovers under Polish Civil Code Art. 509 KC. Find verified rooms in Warsaw, Kraków, Wrocław, Gdańsk & Lublin with 0 PLN broker fees and guaranteed meldunek.';
    const canonicalPath = currentRoute.path || (locale === 'pl' ? '/pl' : '/');
    const canonicalUrl = `https://relok8.online${canonicalPath === '/' ? '' : canonicalPath}`;

    if (currentRoute.type === 'city' && currentRoute.cityName) {
      pageTitle = locale === 'pl'
        ? `Pokoje w ${currentRoute.cityName} · Bez Prowizji Agencyjnej | Relok8`
        : `Rooms in ${currentRoute.cityName} · No Broker Fees · Lease Takeovers | Relok8`;
      metaDesc = locale === 'pl'
        ? `Wynajmij pokój lub mieszkanie w ${currentRoute.cityName}. Przejęcie aktywnej umowy najmu (Art. 509 KC), 0 zł prowizji i gwarantowany meldunek.`
        : `Find student and expat rooms for rent in ${currentRoute.cityName}, Poland. Landlord-approved lease transfers with 0 PLN agency commissions.`;
    } else if (currentRoute.type === 'listing-detail' && currentRoute.listingId) {
      const found = listings.find((l) => l.id === currentRoute.listingId);
      if (found) {
        pageTitle = `${found.title} · ${found.city} | Relok8`;
        metaDesc = `${found.roomType} in ${found.district}, ${found.city}. ${formatPLN(found.monthlyRentPLN, locale)}/month. Landlord-approved lease takeover under Art. 509 KC.`;
      }
    } else if (currentRoute.type === 'saved') {
      pageTitle = locale === 'pl' ? 'Zapisane Pokoje i Mieszkania | Relok8' : 'Saved Rooms & Shortlist | Relok8';
      metaDesc = 'Compare your saved student apartments and lease transfers across Poland.';
    } else if (currentRoute.type === 'how-it-works') {
      pageTitle = locale === 'pl' ? 'Jak Działa Cesja Umowy Najmu? | Relok8' : 'How a Lease Takeover Works in Poland (Art. 509 KC) | Relok8';
      metaDesc = 'Step-by-step guide to peer-to-peer lease assignments in Poland. Exit early without deposit loss and move into pre-approved rooms with 0 broker fees.';
    } else if (currentRoute.type === 'help') {
      pageTitle = locale === 'pl' ? 'Centrum Pomocy & FAQ Najemcy | Relok8' : 'Help Center & Renter FAQ · Lease Transfers | Relok8';
      metaDesc = 'Answers to frequent questions about Art. 509 KC lease assignments, deposit return protocols, meldunek registration, and avoiding early exit penalties.';
    } else if (currentRoute.type === 'list') {
      pageTitle = locale === 'pl' ? 'Dodaj Ogłoszenie · Cesja Umowy Najmu | Relok8' : 'List Your Place · Zero-Penalty Lease Takeover | Relok8';
      metaDesc = 'Moving out early? List your room in Warsaw, Kraków, or Wrocław for free and transfer your lease without losing your security deposit.';
    } else if (currentRoute.type === 'leave-your-lease') {
      pageTitle = locale === 'pl' ? 'Wcześniejsza Wyprowadzka z Mieszkania | Relok8' : 'Leave Your Lease Early in Poland · Zero Penalties | Relok8';
      metaDesc = 'Learn how to legally exit a fixed-term lease in Poland without penalty fees using Article 509 KC lease assignment.';
    } else if (currentRoute.type === 'savings-calculator') {
      pageTitle = locale === 'pl' ? 'Kalkulator Kar i Oszczędności Najmu | Relok8' : 'Lease Break Penalty & Savings Calculator | Relok8';
      metaDesc = 'Calculate exact financial liabilities avoided by executing a lease handover instead of breaking your contract unilaterally in Poland.';
    } else if (currentRoute.type === 'meldunek-guide') {
      pageTitle = locale === 'pl' ? 'Poradnik Meldunku dla Studentów i Obcokrajowców | Relok8' : 'Poland Meldunek Guide · Address Registration & PESEL | Relok8';
      metaDesc = 'Complete step-by-step guide for international students and expats registering their address (meldunek) and obtaining a PESEL number in Poland.';
    } else if (currentRoute.type === 'safety-guide') {
      pageTitle = locale === 'pl' ? 'Zasady Bezpiecznego Najmu w Polsce | Relok8' : 'Renter Safety Guide & Anti-Scam Checklist | Relok8';
      metaDesc = 'How to verify rental contracts, avoid deposit scams, and secure landlord approvals in Poland.';
    } else if (currentRoute.type === 'cesja-template') {
      pageTitle = locale === 'pl' ? 'Wzór Umowy Cesji Najmu (Art. 509 KC) | Relok8' : 'Tripartite Lease Assignment Template (Art. 509 KC) | Relok8';
      metaDesc = 'Download verified bilingual Polish-English lease takeover contract template compliant with Article 509 of the Polish Civil Code.';
    } else if (currentRoute.type === 'account') {
      pageTitle = locale === 'pl' ? 'Konto Użytkownika | Relok8' : 'User Account & Profile | Relok8';
      metaDesc = 'Manage your saved rooms, lease transfer listings, and account settings on Relok8.';
    } else if (currentRoute.type === 'sign-up') {
      pageTitle = locale === 'pl' ? 'Zarejestruj się | Relok8' : 'Create Account | Relok8';
      metaDesc = 'Create your Relok8 account to browse student rooms or transfer your active lease across Poland.';
    } else if (currentRoute.type === 'sign-in') {
      pageTitle = locale === 'pl' ? 'Zaloguj się | Relok8' : 'Sign In | Relok8';
      metaDesc = 'Sign in to your Relok8 account to manage saved apartments, inquiries, and lease transfers.';
    }

    document.title = pageTitle;

    // Update canonical link
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', canonicalUrl);

    // Update meta description
    let metaDescTag = document.querySelector('meta[name="description"]');
    if (!metaDescTag) {
      metaDescTag = document.createElement('meta');
      metaDescTag.setAttribute('name', 'description');
      document.head.appendChild(metaDescTag);
    }
    metaDescTag.setAttribute('content', metaDesc);

    // Update OpenGraph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', pageTitle);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', metaDesc);
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', canonicalUrl);

    // Update Twitter tags
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', pageTitle);
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', metaDesc);

    // Dynamic Schema.org Structured Data (JSON-LD)
    const schemaGraph: any[] = [
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Home',
            'item': 'https://relok8.online' + (locale === 'pl' ? '/pl' : '')
          },
          ...(currentRoute.type === 'city' && currentRoute.cityName
            ? [
                {
                  '@type': 'ListItem',
                  'position': 2,
                  'name': currentRoute.cityName,
                  'item': canonicalUrl
                }
              ]
            : currentRoute.type === 'listing-detail' && currentRoute.listingId
            ? [
                {
                  '@type': 'ListItem',
                  'position': 2,
                  'name': 'Listings',
                  'item': 'https://relok8.online' + (locale === 'pl' ? '/pl' : '')
                },
                {
                  '@type': 'ListItem',
                  'position': 3,
                  'name': pageTitle,
                  'item': canonicalUrl
                }
              ]
            : currentRoute.type !== 'home'
            ? [
                {
                  '@type': 'ListItem',
                  'position': 2,
                  'name': pageTitle.split('·')[0].split('|')[0].trim(),
                  'item': canonicalUrl
                }
              ]
            : [])
        ]
      }
    ];

    if (currentRoute.type === 'listing-detail' && currentRoute.listingId) {
      const found = listings.find((l) => l.id === currentRoute.listingId);
      if (found) {
        schemaGraph.push({
          '@type': 'Apartment',
          'name': found.title,
          'description': found.description,
          'url': canonicalUrl,
          'image': found.images,
          'address': {
            '@type': 'PostalAddress',
            'streetAddress': found.address,
            'addressLocality': found.city,
            'addressCountry': 'PL'
          },
          'offers': {
            '@type': 'Offer',
            'price': found.monthlyRentPLN,
            'priceCurrency': 'PLN',
            'availability': 'https://schema.org/InStock',
            'validFrom': found.availableDate
          }
        });
      }
    } else if (currentRoute.type === 'help') {
      schemaGraph.push({
        '@type': 'FAQPage',
        'mainEntity': [
          {
            '@type': 'Question',
            'name': 'What is a lease transfer (Cesja umowy najmu) under Polish law?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'A Cesja umowy najmu is a legal contract assignment pursuant to Article 509 of the Polish Civil Code (Kodeks Cywilny) transferring tenant obligations to a replacement tenant with landlord consent.'
            }
          },
          {
            '@type': 'Question',
            'name': 'Can foreign students and expats register their address (Meldunek) to get a PESEL?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. Every foreign citizen staying in Poland over 30 days can register temporary residence (meldunek czasowy) at the local district office (Urząd Dzielnicy) and receive a PESEL number for free.'
            }
          },
          {
            '@type': 'Question',
            'name': 'How is the security deposit settled during a lease transfer?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'The incoming tenant reimburses the departing tenant directly upon signing the tripartite handover protocol, avoiding landlord cancellation penalties.'
            }
          }
        ]
      });
    } else if (currentRoute.type === 'how-it-works' || currentRoute.type === 'leave-your-lease') {
      schemaGraph.push({
        '@type': 'HowTo',
        'name': 'How to Transfer a Residential Lease in Poland (Art. 509 KC)',
        'description': 'Step-by-step procedure to legally hand over an active apartment lease in Poland without losing your deposit.',
        'step': [
          {
            '@type': 'HowToStep',
            'position': 1,
            'name': 'Obtain Landlord Written Consent',
            'text': 'Notify your landlord that you will introduce a replacement tenant on the same contractual terms.'
          },
          {
            '@type': 'HowToStep',
            'position': 2,
            'name': 'List Your Room on Relok8',
            'text': 'Publish a free room listing to connect with verified students and expats.'
          },
          {
            '@type': 'HowToStep',
            'position': 3,
            'name': 'Execute Tripartite Cesja Protocol',
            'text': 'Sign the bilingual tripartite agreement under Polish Civil Code Art. 509.'
          },
          {
            '@type': 'HowToStep',
            'position': 4,
            'name': 'Deposit Handover Inspection',
            'text': 'The incoming tenant reimburses your security deposit upon key handover.'
          }
        ]
      });
    }

    let schemaTag = document.getElementById('r8-dynamic-schema') as HTMLScriptElement | null;
    if (!schemaTag) {
      schemaTag = document.createElement('script');
      schemaTag.id = 'r8-dynamic-schema';
      schemaTag.type = 'application/ld+json';
      document.head.appendChild(schemaTag);
    }
    schemaTag.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': schemaGraph
    });
  }, [currentRoute, listings, locale]);

  // Loading and error states for live Supabase listings
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [listingError, setListingError] = useState<string | null>(null);

  // Load live listings from Supabase listings table with error handling & realtime updates
  useEffect(() => {
    let isMounted = true;
    setIsLoadingListings(true);

    getListings()
      .then((liveListings) => {
        if (!isMounted) return;
        setListings(liveListings);
        localStorage.setItem('r8_listings', JSON.stringify(liveListings));
        setListingError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error fetching live data from Supabase listings:', err);
        setListingError(err?.message || 'Failed to fetch listings');
      })
      .finally(() => {
        if (isMounted) setIsLoadingListings(false);
      });

    // Realtime channel subscription to live updates from the 'listings' table
    let channel: any = null;
    if (isSupabaseConfigured()) {
      try {
        channel = supabase
          .channel('public:listings')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'listings' },
            async () => {
              try {
                const refreshed = await getListings();
                if (isMounted) {
                  setListings(refreshed);
                  localStorage.setItem('r8_listings', JSON.stringify(refreshed));
                }
              } catch (e) {
                console.warn('Realtime refresh error:', e);
              }
            }
          )
          .subscribe();
      } catch (e) {
        console.warn('Realtime subscription error:', e);
      }
    }

    getCurrentUser()
      .then((user) => {
        if (!isMounted) return;
        if (user) {
          setCurrentUser(user);
          localStorage.setItem('r8_user', JSON.stringify(user));
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
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

  // Toggle save using Supabase favorites
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
      addFavorite(id).catch(() => {});
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
      removeFavorite(id).catch(() => {});
      showToast(locale === 'pl' ? 'Usunięto z zapisanych' : 'Removed from saved');
    }
  };

  // Like listing
  const handleLikeListing = async (id: string) => {
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, likesCount: (l.likesCount || 0) + 1 } : l))
    );
    try {
      await likeListing(id);
    } catch (e) {}
  };

  // Create listing in Supabase
  const handleAddListing = async (newListing: Listing) => {
    try {
      const created = await createListing(newListing);
      const next = [created, ...listings.filter((l) => l.id !== created.id)];
      setListings(next);
      localStorage.setItem('r8_listings', JSON.stringify(next));
      showToast(locale === 'pl' ? 'Ogłoszenie zostało dodane do bazy!' : 'Listing published to database successfully!');
    } catch (err: any) {
      console.error('Error creating listing:', err);
      const next = [newListing, ...listings];
      setListings(next);
      localStorage.setItem('r8_listings', JSON.stringify(next));
      showToast(locale === 'pl' ? 'Ogłoszenie zapisane lokalnie.' : 'Listing saved locally.');
    }
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
    <div className="min-h-screen w-full overflow-x-hidden bg-white text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header (§4.1) */}
      <Navbar
        onOpenListPlace={() => navigateTo(locale === 'pl' ? '/pl/list' : '/list')}
        savedCount={savedIds.length}
        locale={locale}
        onSelectLocale={(newLoc) => {
          setLocale(newLoc);
          switchLocale(newLoc === 'pl' ? 'pl' : 'en', currentRoute);
        }}
        theme={theme}
        setTheme={setTheme}
        onOpenHelp={() => navigateTo(locale === 'pl' ? '/pl/help' : '/help')}
        onOpenLogin={(mode) => {
          handleOpenLogin(mode || 'signin', 'Sign up or log in to manage your saved rooms and contact tenants.');
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
      ) : currentRoute.type === 'help' ? (
        <HelpPage
          onBack={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
          locale={locale}
          onOpenLeaveYourLease={() => navigateTo(locale === 'pl' ? '/pl/leave-your-lease' : '/leave-your-lease')}
          onOpenIntake={() => navigateTo(locale === 'pl' ? '/pl/list' : '/list')}
        />
      ) : currentRoute.type === 'list' ? (
        <ListPage
          onBack={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
          onSubmitListing={handleAddListing}
          locale={locale}
        />
      ) : currentRoute.type === 'leave-your-lease' ? (
        <LeaveYourLeasePage
          onBack={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
          locale={locale}
          onOpenIntake={() => navigateTo(locale === 'pl' ? '/pl/list' : '/list')}
          onOpenCesja={() => navigateTo(locale === 'pl' ? '/pl/cesja-template' : '/cesja-template')}
        />
      ) : currentRoute.type === 'savings-calculator' ? (
        <SavingsCalculatorPage
          onBack={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
          locale={locale}
          onOpenIntake={() => navigateTo(locale === 'pl' ? '/pl/list' : '/list')}
        />
      ) : currentRoute.type === 'account' ? (
        <AccountPage
          currentUser={currentUser}
          onBack={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
          locale={locale}
          savedListings={listings.filter((l) => savedIds.includes(l.id))}
          onSelectListing={(l) => navigateToListing(l.id, l.title, locale)}
          onRemoveSaved={(id) => handleToggleSave(id)}
          onRequireLogin={() => {
            setLoginReason(locale === 'pl' ? 'Zaloguj się, aby zarządzać swoim kontem.' : 'Sign in to access your account dashboard.');
            setIsLoginOpen(true);
          }}
          onUpdateUser={(updated) => {
            setCurrentUser(updated);
            showToast(locale === 'pl' ? 'Profil zaktualizowany' : 'Profile updated');
          }}
          onOpenListPlace={() => navigateTo(locale === 'pl' ? '/pl/list' : '/list')}
          onLogout={() => {
            localStorage.removeItem('r8_user');
            setCurrentUser(null);
            showToast(locale === 'pl' ? 'Wylogowano' : 'Logged out');
            navigateTo(locale === 'pl' ? '/pl' : '/');
          }}
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
                  onClick={() => navigateTo(locale === 'pl' ? '/pl/leave-your-lease' : '/leave-your-lease')}
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
            <h2 className="sr-only">
              {locale === 'pl' ? 'Dostępne pokoje i mieszkania na cesję w Polsce' : 'Available student rooms and lease takeovers in Poland'}
            </h2>
            
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
            {isFiltering || isLoadingListings ? (
              <ListingGridSkeleton count={8} />
            ) : filteredListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-2">
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
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {strings.howItWorksTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                {strings.howItWorksSub}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-left">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center border border-indigo-100">
                  1
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  {strings.step1Title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {strings.step1Desc}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-left">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center border border-indigo-100">
                  2
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  {strings.step2Title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {strings.step2Desc}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-left">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center border border-indigo-100">
                  3
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  {strings.step3Title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {strings.step3Desc}
                </p>
              </div>
            </div>
          </section>

          {/* Leaving Early Banner */}
          <DepartingTenantBanner
            onOpenLeaveLease={() => navigateTo(locale === 'pl' ? '/pl/leave-your-lease' : '/leave-your-lease')}
            onOpenIntake={() => navigateTo(locale === 'pl' ? '/pl/list' : '/list')}
            locale={locale}
          />

        </main>
      )}

      {/* Footer (§4.6) */}
      <Footer
        onOpenLeaveYourLease={() => navigateTo(locale === 'pl' ? '/pl/leave-your-lease' : '/leave-your-lease')}
        onOpenHelp={() => navigateTo(locale === 'pl' ? '/pl/help' : '/help')}
        onOpenSavingsCalculator={() => navigateTo(locale === 'pl' ? '/pl/savings-calculator' : '/savings-calculator')}
        onOpenReportListing={() => {
          showToast(locale === 'pl' ? 'Zgłoszenie oferty: info@relok8.online' : 'Report listing sent to info@relok8.online');
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
        onNavigateAccount={() => navigateTo(locale === 'pl' ? '/pl/account' : '/account')}
        onOpenListRoom={() => navigateTo(locale === 'pl' ? '/pl/list' : '/list')}
        onOpenHelp={() => navigateTo(locale === 'pl' ? '/pl/help' : '/help')}
        onOpenLogin={() => {
          setLoginReason('Sign up or log in to manage your account.');
          setIsLoginOpen(true);
        }}
        locale={locale}
        currentUser={currentUser}
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
        onClose={() => {
          setIsLoginOpen(false);
          if (currentRoute.type === 'sign-in' || currentRoute.type === 'sign-up') {
            const homePath = locale === 'pl' ? '/pl' : '/';
            window.history.replaceState({}, '', homePath);
            setCurrentRoute(parseRoute(homePath, '', ''));
          }
        }}
        initialMode={loginMode}
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
