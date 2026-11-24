import { matchesMoveInDate, leaseHasEnded, todayInPoland } from './utils/leaseTiming';
import { authReturnPath } from './utils/authFlow';
import {knownMonthlyCost} from './utils/listingFlow';
import React, { useState, useMemo, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/react';
import { ArrowRight, MapPin, Home } from 'lucide-react';
import { Listing } from './types';
import { ENABLED_CITIES, getCityBySlug, getCityByName } from './data/cities';
import { Navbar, UserProfile } from './components/Navbar';
import { SearchBar, SearchState } from './components/SearchBar';
import { FiltersBar, FilterValues } from './components/FiltersBar';
import { ListingCard } from './components/ListingCard';
import { AlertCaptureCard } from './components/AlertCaptureCard';
import { CityLandingHeader } from './components/CityLandingHeader';
import { DepartingTenantBanner } from './components/DepartingTenantBanner';
import { ListingGridSkeleton } from './components/ListingCardSkeleton';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';

// Modals & Pages
import { CesjaGeneratorModal } from './components/CesjaGeneratorModal';
import { LoginModal } from './components/LoginModal';
import { CookieBanner } from './components/CookieBanner';
import { AIProxyChatModal } from './components/AIProxyChatModal';
import { Toast } from './components/Toast';

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
import { MessagesPage } from './pages/MessagesPage';
import { LandlordDashboard } from './components/LandlordDashboard';
import { PlacePage } from './pages/PlacePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { RewardsPage } from './pages/RewardsPage';
import { EnrollmentsPage } from './pages/EnrollmentsPage';
import { EmailPreferencesPage } from './pages/EmailPreferencesPage';
import { OnloGlobalWidget } from './components/OnloGlobalWidget';

import { SupportedLocale, formatPLN } from './utils/formatters';
import { t } from './utils/translations';
import { parseRoute, navigateTo, navigateToCity, navigateToListing, switchLocale, ParsedRoute } from './utils/router';
import { shouldShowGlobalOnlo } from './utils/onloAvailability';
import { uploadListingPhotos } from './lib/api';
import { ConvexProvider, mapConvexListingToAppListing } from './lib/convex/client';
import { useAction, useQuery, useMutation, useConvexAuth } from 'convex/react';
import { api } from '../convex/_generated/api';

const DEFAULT_SEARCH: SearchState = {
  city: 'Anywhere in Poland',
  moveInDate: '',
  roomType: 'All room types',
  minRent: 0,
  maxRent: 5000
};

function searchStateFromLocation(route: ParsedRoute, search: string): SearchState {
  const params = new URLSearchParams(search);
  const parsedMin = Number(params.get('min'));
  const parsedMax = Number(params.get('max'));
  const maxRent = Number.isFinite(parsedMax) && parsedMax >= 500
    ? Math.min(parsedMax, DEFAULT_SEARCH.maxRent)
    : DEFAULT_SEARCH.maxRent;
  const minRent = Number.isFinite(parsedMin) && parsedMin > 0 ? Math.min(parsedMin, maxRent) : DEFAULT_SEARCH.minRent;

  return {
    city: route.type === 'city' && route.cityName
      ? route.cityName
      : params.get('city') || DEFAULT_SEARCH.city,
    moveInDate: params.get('from') || DEFAULT_SEARCH.moveInDate,
    roomType: params.get('type') || DEFAULT_SEARCH.roomType,
    minRent,
    maxRent
  };
}

function Relok8App() {
  const [listingToday, setListingToday] = useState(todayInPoland);
  useEffect(() => {const timer = window.setInterval(() => setListingToday(todayInPoland()), 60000); return () => window.clearInterval(timer);}, []);
  // Theme State: Default light
  const theme = 'light';

  // Active Route State from History API
  const [currentRoute, setCurrentRoute] = useState<ParsedRoute>(() =>
    parseRoute(window.location.pathname, window.location.hash, window.location.search)
  );

  const [locale, setLocale] = useState<SupportedLocale>(() => {
    const route = parseRoute(window.location.pathname, window.location.hash, window.location.search);
    if (['pl', 'uk', 'es'].includes(route.locale)) return route.locale as SupportedLocale;
    const stored = localStorage.getItem('r8_locale');
    if (stored && ['en', 'pl', 'uk', 'es'].includes(stored)) return stored as SupportedLocale;
    return 'en';
  });

  // Sync lang attribute on document root
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = 'ltr';
    localStorage.setItem('r8_locale', locale);
  }, [locale]);

  const strings = (t as any)[locale] || t.en;

  // Listings State: sourced strictly from real user submissions (fake data stripped)
  const [listings, setListings] = useState<Listing[]>([]);

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
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Clerk Authentication Sync - authoritative source of truth for user & session state
  const { isSignedIn: isClerkSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();

  // Sync user state and metadata whenever Clerk session loads or updates
  useEffect(() => {
    if (!isClerkLoaded || !isAuthLoaded) return;

    if (isClerkSignedIn && clerkUser) {
      const unsafeMeta = ((clerkUser.unsafeMetadata || (clerkUser as any).unsafe_metadata) || {}) as Record<string, any>;
      const publicMeta = ((clerkUser.publicMetadata || (clerkUser as any).public_metadata) || {}) as Record<string, any>;

      const rawRole = (publicMeta.role as string) || 'student';
      const role = (rawRole === 'member' || !['student', 'expat', 'landlord', 'tenant'].includes(rawRole)) ? 'student' : rawRole;

      const primaryEmail = clerkUser.primaryEmailAddress || 
        clerkUser.emailAddresses?.find(e => e.id === (clerkUser as any).primaryEmailAddressId || e.id === (clerkUser as any).primary_email_address_id) ||
        clerkUser.emailAddresses?.[0];
      const isVerified = Boolean(publicMeta.isVerified === true);

      const university = (unsafeMeta.university as string) || (publicMeta.university as string) || '';
      const phone = clerkUser.primaryPhoneNumber?.phoneNumber || 
        (clerkUser.phoneNumbers?.[0] as any)?.phoneNumber || 
        (clerkUser.phoneNumbers?.[0] as any)?.phone_number || 
        (unsafeMeta.phone as string) || (publicMeta.phone as string) || '';

      const name = clerkUser.fullName || 
        (clerkUser as any).name ||
        [clerkUser.firstName || (clerkUser as any).first_name, clerkUser.lastName || (clerkUser as any).last_name].filter(Boolean).join(' ') || 
        primaryEmail?.emailAddress?.split('@')[0] || 
        'User';

      const mappedUser: UserProfile = {
        id: clerkUser.id,
        name,
        email: primaryEmail?.emailAddress || '',
        avatar: clerkUser.imageUrl || (clerkUser as any).image_url,
        role,
        isVerified,
        phone,
        university
      };

      setCurrentUser(mappedUser);
      try {
        localStorage.setItem('r8_user', JSON.stringify(mappedUser));
      } catch (e) {}
    } else if (isAuthLoaded && !isClerkSignedIn) {
      // Session inactive, logged out, or account deleted: clear auth state immediately
      setCurrentUser(null);
      setSavedIds([]);
      try {
        localStorage.removeItem('r8_saved_ids');
        localStorage.removeItem('r8_my_listing_ids');
        localStorage.removeItem('r8_user');
      } catch (e) {}
    }
  }, [clerkUser, isClerkLoaded, isClerkSignedIn, isAuthLoaded]);

  // Search State: single source of truth synced with URL query
  const [searchState, setSearchState] = useState<SearchState>(() => {
    const initialRoute = parseRoute(window.location.pathname, window.location.hash, window.location.search);
    return searchStateFromLocation(initialRoute, window.location.search);
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
  const [isCesjaOpen, setIsCesjaOpen] = useState(false);
  const [cesjaTemplateDates, setCesjaTemplateDates] = useState<{
    originalLeaseDate: string;
    effectiveDate: string;
  } | null>(null);

  // Quick Action Card Modals state
  const [activeCardAIChat, setActiveCardAIChat] = useState<Listing | null>(null);
  const [isGlobalOnloOpen, setIsGlobalOnloOpen] = useState(false);

  useEffect(() => {
    setIsGlobalOnloOpen(false);
  }, [currentRoute.path]);


  // Live Convex reactive subscriptions (chatty-seahorse-914)
  const { isAuthenticated: isBackendAuthenticated } = useConvexAuth();
  const liveConvexLeases = useQuery(api.leases.get, {});
  const selectedLease = useQuery(api.leases.getById, currentRoute.type === "listing-detail" && currentRoute.listingId ? {id:currentRoute.listingId} : "skip");
  const translatePublicListings = useAction((api as any).services.translatePublicListings);
  const [listingTranslations, setListingTranslations] = useState<Record<string, {
    title?: string;
    description?: string;
    distanceToCampus?: string;
    transitNearby?: string;
  }>>({});
  const createConvexLease = useMutation(api.leases?.create);
  const syncEmailAccount = useAction((api as any).emailPreferences.syncAccountVerified);
  const deleteConvexLease = useMutation(api.leases?.deleteLease);
  const saveRemote = useMutation(api.favorites.addFavorite);
  const removeRemote = useMutation(api.favorites.removeFavorite);
  const ownLeases = useQuery(api.leases.mine, isBackendAuthenticated ? {} : "skip");
  useEffect(() => { if (ownLeases) localStorage.setItem('r8_my_listing_ids', JSON.stringify(ownLeases.map(lease => lease._id))); }, [ownLeases]);
  const remoteFavorites = useQuery(api.favorites.getUserFavorites, isBackendAuthenticated && currentUser ? { userId: currentUser.id } : "skip");
  useEffect(() => {
    if (!isBackendAuthenticated || !currentUser?.id) return;
    const verifiedProfileName = clerkUser?.fullName || [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || undefined;
    syncEmailAccount({
      locale: locale === 'pl' ? 'pl' : 'en',
      ...(verifiedProfileName ? { fullName: verifiedProfileName } : {}),
    }).then((result: { synced: boolean }) => { if (!result.synced) console.warn('Relok8 email account sync incomplete'); }).catch(() => { console.warn('Relok8 email account sync failed'); });
  }, [currentUser?.id, currentUser?.email, clerkUser?.firstName, clerkUser?.fullName, clerkUser?.lastName, isBackendAuthenticated, locale, syncEmailAccount]);
  useEffect(() => { if (remoteFavorites) setSavedIds(remoteFavorites); }, [remoteFavorites]);

  useEffect(() => {
    let cancelled = false;
    setListingTranslations({});
    const routeUsesListingContent = ['home', 'city', 'listing-detail', 'saved'].includes(currentRoute.type);
    if (!routeUsesListingContent || !liveConvexLeases?.length) return () => { cancelled = true; };
    const run = async () => {
      try {
        const next: Record<string, { title?: string; description?: string; distanceToCampus?: string; transitNearby?: string }> = {};
        for (let start = 0; start < liveConvexLeases.length; start += 20) {
          const translated = await translatePublicListings({
            listingIds: liveConvexLeases.slice(start, start + 20).map((listing) => String(listing._id)),
            targetLocale: locale === 'pl' ? 'pl' : 'en',
          });
          if (cancelled) return;
          Object.assign(next, translated);
        }
        if (!cancelled) setListingTranslations(next);
      } catch {
        if (!cancelled) setListingTranslations({});
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [liveConvexLeases, locale, translatePublicListings, currentRoute.type]);

  // Synchronize live Convex backend leases with reactive listings state
  useEffect(() => {
    if (liveConvexLeases !== undefined) {
      if (liveConvexLeases.length === 0) {
        setListings([]);
        try {
          localStorage.removeItem('r8_listings');
        } catch {}
      } else {
        const mapped: Listing[] = liveConvexLeases.map((l: any) => mapConvexListingToAppListing(l, listingTranslations[String(l._id)]));
        const cleanMapped = mapped.filter((l: any) => l && l.id && !l.id.startsWith('cx_list_') && !l.id.startsWith('place-'));
        setListings(cleanMapped);
        try {
          localStorage.setItem('r8_listings', JSON.stringify(cleanMapped));
        } catch {}
      }
    }
  }, [liveConvexLeases, listingTranslations]);
  const [isLoginOpen, setIsLoginOpen] = useState(() => !isClerkSignedIn && (currentRoute.type === 'sign-in' || currentRoute.type === 'sign-up'));
  const [loginMode, setLoginMode] = useState<'signin' | 'signup'>(() => currentRoute.type === 'sign-up' ? 'signup' : 'signin');
  const [loginReason, setLoginReason] = useState('');

  // Prevent re-renders of LoginModal when the authentication state is already handled by ClerkProvider
  useEffect(() => {
    if (isAuthLoaded && isClerkSignedIn) {
      if (isLoginOpen) {
        setIsLoginOpen(false);
      }
      // Ensure that after a successful sign-in, the application gracefully routes back
      // to the intended page or closes the modal without triggering a loop.
      if (currentRoute.type === 'sign-in' || currentRoute.type === 'sign-up') {
        const redirectUrl = authReturnPath(window.location.pathname, window.location.search);
        window.history.replaceState({}, '', redirectUrl);
        setCurrentRoute(parseRoute(window.location.pathname, window.location.hash, window.location.search));
      }
    }
  }, [isAuthLoaded, isClerkSignedIn, isLoginOpen, currentRoute.type, currentRoute.searchParams, locale]);

  // Automatically open auth modal when navigating to /sign-in, /sign-up only if NOT already authenticated
  useEffect(() => {
    if (isAuthLoaded && isClerkSignedIn) return;
    if (currentRoute.type === 'sign-up') {
      setLoginMode('signup');
      setIsLoginOpen(true);
    } else if (currentRoute.type === 'sign-in') {
      setLoginMode('signin');
      setIsLoginOpen(true);
    }
  }, [currentRoute.type, isAuthLoaded, isClerkSignedIn]);

  const handleOpenLogin = (mode: 'signin' | 'signup' = 'signin', reason: string = '') => {
    if (isClerkSignedIn) {
      const accountPath = locale === 'pl' ? '/pl/account' : '/account';
      window.history.pushState({}, '', accountPath);
      setCurrentRoute(parseRoute(accountPath, '', ''));
      return;
    }
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
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
      });

      if (parsed.locale !== locale) {
        setLocale(parsed.locale);
      }

      if (parsed.type === 'city' || parsed.type === 'home') {
        setSearchState(searchStateFromLocation(parsed, window.location.search));
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [locale]);

  // Dynamic SEO Synchronization (Titles, Meta Descriptions, Canonical URLs & OpenGraph)
  useEffect(() => {
    let pageTitle = 'Relok8 — Rooms & Lease Takeovers in Poland | No Broker Fees';
    let metaDesc = 'Find rooms and coordinate landlord-approved lease takeovers in Warsaw, Kraków, Wrocław, Gdańsk and Lublin, with no agency commission.';
    const canonicalPath = currentRoute.path || (locale === 'pl' ? '/pl' : '/');
    const canonicalUrl = `https://relok8.online${canonicalPath === '/' ? '' : canonicalPath}`;

    if (currentRoute.type === 'city' && currentRoute.cityName) {
      pageTitle = locale === 'pl'
        ? `Pokoje w ${currentRoute.cityName} · Bez Prowizji Agencyjnej | Relok8`
        : `Rooms in ${currentRoute.cityName} · No Broker Fees · Lease Takeovers | Relok8`;
      metaDesc = locale === 'pl'
        ? `Znajdź pokój lub mieszkanie w ${currentRoute.cityName}. Uzgodnij przejęcie najmu za pisemną zgodą wynajmującego, bez prowizji agencyjnej.`
        : `Find rooms and apartments for rent in ${currentRoute.cityName}, Poland. Landlord-approved lease transfers for local and international renters with 0 PLN agency commissions.`;
    } else if (currentRoute.type === 'listing-detail' && currentRoute.listingId) {
      const found = listings.find((l) => l.id === currentRoute.listingId);
      if (found) {
        pageTitle = `${found.title} · ${found.city} | Relok8`;
        metaDesc = `${found.roomType} in ${found.district}, ${found.city}. ${formatPLN(found.monthlyRentPLN, locale)}/month. Ask the participants to confirm the lease terms and written landlord approval.`;
      }
    } else if (currentRoute.type === 'saved') {
      pageTitle = locale === 'pl' ? 'Zapisane Pokoje i Mieszkania | Relok8' : 'Saved Rooms & Shortlist | Relok8';
      metaDesc = 'Compare your saved rooms, apartments and lease transfers across Poland.';
    } else if (currentRoute.type === 'how-it-works') {
      pageTitle = locale === 'pl' ? 'Jak Działa Przejęcie Najmu? | Relok8' : 'How a Lease Takeover Works in Poland | Relok8';
      metaDesc = 'Step-by-step guide to discussing a replacement tenant, obtaining written landlord approval and coordinating a handover in Poland.';
    } else if (currentRoute.type === 'help') {
      pageTitle = locale === 'pl' ? 'Centrum Pomocy & FAQ Najemcy | Relok8' : 'Help Center & Renter FAQ · Lease Transfers | Relok8';
      metaDesc = 'Answers to frequent questions about lease takeovers, deposit arrangements, meldunek registration and planning an early move.';
    } else if (currentRoute.type === 'list') {
      pageTitle = locale === 'pl' ? 'Dodaj Ogłoszenie · Przejęcie Najmu | Relok8' : 'List Your Place · Coordinate a Lease Takeover | Relok8';
      metaDesc = 'Moving out early? List your place for free, find an interested replacement and ask the landlord to approve the agreed handover.';
    } else if (currentRoute.type === 'leave-your-lease') {
      pageTitle = locale === 'pl' ? 'Wcześniejsza Wyprowadzka z Mieszkania | Relok8' : 'Plan an Early Move from Your Lease | Relok8';
      metaDesc = 'Learn how to find a replacement, discuss your contract with the landlord and document a mutually agreed handover.';
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
      pageTitle = locale === 'pl' ? 'Wzór Uzgodnienia Przejęcia Najmu | Relok8' : 'Lease Takeover Agreement Template | Relok8';
      metaDesc = 'Prepare a bilingual draft for the participants to review. The appropriate legal structure depends on the lease and circumstances.';
    } else if (currentRoute.type === 'account') {
      pageTitle = locale === 'pl' ? 'Konto Użytkownika | Relok8' : 'User Account & Profile | Relok8';
      metaDesc = 'Manage your saved rooms, lease transfer listings, and account settings on Relok8.';
    } else if (currentRoute.type === 'sign-up') {
      pageTitle = locale === 'pl' ? 'Zarejestruj się | Relok8' : 'Create Account | Relok8';
      metaDesc = 'Create your Relok8 account to find a home or transfer your active lease across Poland, whether you are moving locally or internationally.';
    } else if (currentRoute.type === 'sign-in') {
      pageTitle = locale === 'pl' ? 'Zaloguj się | Relok8' : 'Sign In | Relok8';
      metaDesc = 'Sign in to your Relok8 account to manage saved apartments, inquiries, and lease transfers.';
    }

    metaDesc = locale === 'pl' ? 'Znajdź pokój lub nowego najemcę w Polsce. Ustal szczegóły, uzyskaj zgodę właściciela i koordynuj przekazanie.' : 'Find a room or a replacement tenant in Poland. Discuss details, ask for landlord approval and coordinate the handover.';
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
            'price': knownMonthlyCost(found),
            'priceCurrency': 'PLN',
            'availability': found.occupancyStatus === 'vacant' && found.availableDate <= listingToday ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
            'availabilityStarts': found.availableDate,
            'availabilityEnds': found.leaseEndDate
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
              'text': 'A lease takeover is an arrangement that must be agreed with the landlord and documented by the participants. The appropriate legal structure depends on the contract and circumstances.'
            }
          },
          {
            '@type': 'Question',
            'name': 'Can foreign students and expats register their address (Meldunek) to get a PESEL?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Registration requirements depend on individual circumstances. Confirm requirements with the relevant office.'
            }
          },
          {
            '@type': 'Question',
            'name': 'How is the security deposit settled during a lease transfer?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Participants agree deposit arrangements directly. Relok8 does not process payments or guarantee refunds.'
            }
          }
        ]
      });
    } else if (currentRoute.type === 'how-it-works' || currentRoute.type === 'leave-your-lease') {
      schemaGraph.push({
        '@type': 'HowTo',
        'name': 'How to Coordinate a Residential Lease Takeover in Poland',
        'description': 'Discuss the terms, ask the landlord to approve the replacement and coordinate the handover.',
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
            'text': 'Publish a free room listing to connect with people looking for a room.'
          },
          {
            '@type': 'HowToStep',
            'position': 3,
            'name': 'Review and sign the agreed documents',
            'text': 'Have all participants review the written agreement and obtain legal advice when needed.'
          },
          {
            '@type': 'HowToStep',
            'position': 4,
            'name': 'Deposit Handover Inspection',
            'text': 'Record the property condition, keys and any deposit arrangement agreed by the participants.'
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
  }, [currentRoute, listings, locale, listingToday]);

// Convex is the only data backend.
  const [isLoadingListings, setIsLoadingListings] = useState(true);

// Convex is the only data backend.
  useEffect(() => {
    if (liveConvexLeases !== undefined) { setIsLoadingListings(false); }
  }, [liveConvexLeases]);

  // Update search state and sync URL query
  const handleSearchChange = (changes: Partial<SearchState>) => {
    const next = { ...searchState, ...changes };
    const params = new URLSearchParams(window.location.search);
    params.delete('city');
    if (next.moveInDate) params.set('from', next.moveInDate); else params.delete('from');
    if (next.roomType && next.roomType !== 'All room types') params.set('type', next.roomType); else params.delete('type');
    if (next.minRent > 0) params.set('min', String(next.minRent)); else params.delete('min');
    if (next.maxRent < DEFAULT_SEARCH.maxRent) params.set('max', String(next.maxRent)); else params.delete('max');

    setSearchState(next);
    const query = Object.fromEntries(params.entries());
    if (next.city && next.city !== 'Anywhere in Poland' && next.city !== 'All Poland') {
      const city = getCityByName(next.city);
      if (city && currentRoute.citySlug !== city.slug) {
        navigateToCity(city.slug, locale, query);
      } else {
        window.history.replaceState({}, '', `${window.location.pathname}${params.size ? `?${params}` : ''}`);
      }
    } else if (currentRoute.type === 'city') {
      navigateTo(locale === 'pl' ? '/pl' : '/', query);
    } else {
      window.history.replaceState({}, '', `${window.location.pathname}${params.size ? `?${params}` : ''}`);
    }

    setIsFiltering(true);
    setTimeout(() => setIsFiltering(false), 200);
  };

// Convex is the only data backend.
  const handleToggleSave = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation(); e?.preventDefault();
    if (!currentUser) { handleOpenLogin('signup', locale === 'pl' ? 'Utwórz konto, aby zapisać ten lokal. Po zalogowaniu wybierz Zapisz ponownie.' : 'Create an account to save this home. After signing in, select Save again.'); return; }
    if (!isBackendAuthenticated) { showToast(locale === 'pl' ? 'Łączenie z kontem. Spróbuj ponownie za chwilę.' : 'Connecting your account. Please try again shortly.'); return; }
    try {
      if (savedIds.includes(id)) await removeRemote({ listingId: id, userId: currentUser.id });
      else await saveRemote({ listingId: id, userId: currentUser.id });
    } catch (error: any) { showToast(error.message || 'Could not update saved rooms.'); }
  };

  const handleAddListing = async (newListing: Listing) => {
    if (!isBackendAuthenticated) throw new Error('Sign in before publishing a listing.');
    const id = await createConvexLease({
          title: newListing.title,
          address: newListing.address,
          city: newListing.city,
          district: newListing.district,
          monthlyRent: newListing.monthlyRentPLN,
          deposit: newListing.depositPLN,
          roomType: newListing.roomType,
          areaM2: newListing.squareMeters,
          floor: newListing.floor.trim() === '' ? undefined : Number(newListing.floor),
          occupancyStatus: newListing.occupancyStatus,
          moveInDate: newListing.availableDate,
          leaseEndDate: newListing.leaseEndDate,
          coordinates: (newListing.lat && newListing.lng) ? { lat: newListing.lat, lng: newListing.lng } : undefined,
          currentTenant: newListing.currentTenant ? {
            name: newListing.currentTenant.name,
            status: newListing.currentTenant.role || 'Listing author',
            avatar: newListing.currentTenant.avatar || '',
          } : undefined,
          amenities: newListing.amenities || [],
          description: newListing.description,
          images: await uploadListingPhotos(newListing.images),
          czynszAdmin: newListing.czynszAdminPLN,
          billsIncluded: newListing.billsIncluded, billsMode: newListing.billsMode, fixedBillsPLN: newListing.fixedBillsPLN,
          landlordContactPhone: newListing.landlordContactPhone,
          isFurnished: newListing.isFurnished,
          flatmatesCount: newListing.flatmatesCount,
          distanceToCampus: newListing.distanceToCampus,
          meldunekAllowed: newListing.meldunekAllowed,
          landlordName: newListing.landlordName,
          landlordContactEmail: newListing.landlordContactEmail,
          locale: locale === 'pl' ? 'pl' : 'en',
        });
    showToast('Listing published successfully.');
    return { ...newListing, id };
  };

  // Delete listing permanently
  const handleDeleteListing = async (id: string) => {
    try {
      await deleteConvexLease({ id });
      setSavedIds(previous => previous.filter(value => value !== id));
      showToast('Listing deleted successfully.');
    } catch (error: any) { showToast(error.message || 'Could not delete listing.'); throw error; }
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
      if (leaseHasEnded(l.leaseEndDate, listingToday)) return false;
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
      if (knownMonthlyCost(l) > filterValues.maxRent) return false;
      if (knownMonthlyCost(l) < searchState.minRent) return false;

      // Move in date: listing must be available on or before the selected target date
      if (filterValues.moveInDate) {
        if (!matchesMoveInDate(l.availableDate, l.leaseEndDate, filterValues.moveInDate)) return false;
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
        return knownMonthlyCost(a) - knownMonthlyCost(b);
      }
      if (filterValues.sortBy === 'newest') {
        return b.id.localeCompare(a.id);
      }
      // default: soonest move-in date
      return new Date(a.availableDate).getTime() - new Date(b.availableDate).getTime();
    });
  }, [listings, activeCityConfig, searchState.city, searchState.minRent, filterValues, listingToday]);

  return (
    <div data-motion={['home', 'city', 'listing-detail', 'how-it-works', 'help', 'leave-your-lease', 'savings-calculator', 'meldunek-guide', 'safety-guide', 'cesja-template'].includes(currentRoute.type) ? 'public' : 'workspace'} className={`r8-motion-app ${currentRoute.type === 'messages' && isClerkSignedIn ? 'h-dvh min-h-0 overflow-hidden' : 'min-h-screen overflow-x-hidden'} w-full bg-white text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900`}>
      
      {(currentRoute.type === 'home' || currentRoute.type === 'city') && (
        <a className="r8-home-skip" href="#rooms-grid">
          {locale === 'pl' ? 'Przejdź do ofert' : 'Skip to listings'}
        </a>
      )}

      {/* Toast Notification per Section 2 */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
          duration={4000}
        />
      )}

      {/* Header (§4.1) */}
      <Navbar
        onOpenListPlace={() => navigateTo(locale === 'pl' ? '/pl/list' : '/list')}
        savedCount={savedIds.length}
        locale={locale}
        onSelectLocale={(newLoc) => {
          setLocale(newLoc);
          switchLocale(newLoc === 'pl' ? 'pl' : 'en');
        }}
        theme={theme}
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
        currentPath={currentRoute.type}
        onExpandSearch={() => {
          const el = document.getElementById('search-hero');
          if (el) {
            el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
          } else {
            navigateTo(locale === 'pl' ? '/pl' : '/');
          }
        }}
        isCompactSearchVisible={true}
      />

      {/* Route Views */}
      {currentRoute.type === 'listing-detail' && currentRoute.listingId ? (
        (() => {
          const detailListing = selectedLease
            ? mapConvexListingToAppListing(selectedLease as any, listingTranslations[String((selectedLease as any)._id)])
            : listings.find((l) => l.id === currentRoute.listingId);
          if (!detailListing) return <main className="max-w-3xl mx-auto px-6 py-20"><h1 className="text-2xl font-bold">{isLoadingListings ? 'Loading listing…' : 'Listing not found'}</h1><p>{isLoadingListings ? 'Please wait while the listing loads.' : 'This listing may have been removed or the link may be incorrect.'}</p></main>;
          return (
            <ListingDetailPage
              openComposer={currentRoute.searchParams.get("compose") === "1"}
              listing={detailListing}
              onBack={() => {
                window.history.back();
              }}
              isSaved={savedIds.includes(detailListing.id)}
              onToggleSave={(id) => handleToggleSave(id)}
              locale={locale}
              currentUser={currentUser}
              onRequireLogin={(reason) => {
                setLoginReason(reason);
                setIsLoginOpen(true);
              }}
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
          onOpenLeaveYourLease={() => navigateTo(locale === 'pl' ? '/pl/list' : '/list')}
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
          onOpenCesjaModal={(dates) => {
            setCesjaTemplateDates(dates);
            setIsCesjaOpen(true);
          }}
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
          onOpenOnlo={() => setIsGlobalOnloOpen(true)}
          locale={locale}
        />
      ) : currentRoute.type === 'list' ? (
        <ListPage key={currentUser?.id || "anonymous"} onRequireLogin={() => {setLoginReason(locale === "pl" ? "Zaloguj się, aby opublikować zapisany szkic." : "Sign in to publish your saved draft.");setIsLoginOpen(true);}}
          onBack={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
          onSubmitListing={handleAddListing}
          locale={locale}
          currentUser={currentUser}
        />
      ) : currentRoute.type === 'leave-your-lease' ? (
        <LeaveYourLeasePage
          onBack={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
          locale={locale}
          onOpenIntake={() => navigateTo(locale === 'pl' ? '/pl/list' : '/list')}
        />
      ) : currentRoute.type === 'savings-calculator' ? (
        <SavingsCalculatorPage
          onBack={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
          locale={locale}
          onOpenIntake={() => navigateTo(locale === 'pl' ? '/pl/list' : '/list')}
        />
      ) : currentRoute.type === 'messages' && !isClerkSignedIn ? (
        <main className="max-w-lg mx-auto px-6 py-16 space-y-4"><h1 className="text-2xl font-bold">{locale === 'pl' ? 'Twoje Wiadomości' : 'Your Messages'}</h1><p>{locale === 'pl' ? 'Zaloguj się, aby rozmawiać o oglądaniu lokalu i przejęciu najmu.' : 'Sign in to discuss viewings and lease takeovers.'}</p><button type="button" onClick={() => handleOpenLogin('signin', locale === 'pl' ? 'Zaloguj się, aby otworzyć skrzynkę.' : 'Sign in to open your inbox.')} className="min-h-11 rounded-xl bg-indigo-600 text-white px-5 font-semibold">{locale === 'pl' ? 'Zaloguj się' : 'Sign in to Messages'}</button></main>
      ) : currentRoute.type === 'messages' ? (
        <MessagesPage key={currentUser?.id || "guest"} initialThreadId={currentRoute.searchParams.get("thread") || undefined}
          onBack={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
          locale={locale}
          currentUser={currentUser}
        />
      ) : currentRoute.type === 'dashboard' ? (
        <LandlordDashboard onRequireLogin={()=>{setLoginReason(locale==="pl"?"Zaloguj się adresem odbiorcy zaproszenia.":"Sign in with the invited email.");setIsLoginOpen(true);}}
          locale={locale}
          onBack={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
          onNavigateToListing={(id) => {
            const found = listings.find((l) => l.id === id);
            navigateToListing(id, found?.title || '', locale);
          }}
          overrideLandlordEmail={currentUser?.email}
        />
      ) : currentRoute.type === 'place' ? (
        <PlacePage onRequireLogin={()=>{setLoginReason(locale==="pl"?"Zaloguj się, aby kontynuować.":"Sign in to continue.");setIsLoginOpen(true);}}
          onBack={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
          locale={locale}
          currentUser={currentUser}
          listings={listings}
          onDeleteListing={handleDeleteListing}
          onOpenListing={(id) => {
            const found = listings.find((l) => l.id === id);
            navigateToListing(id, found?.title || '', locale);
          }}
          onOpenMessages={() => navigateTo(locale === 'pl' ? '/pl/messages' : '/messages')}
          onOpenIntake={() => navigateTo(locale === 'pl' ? '/pl/list' : '/list')}
        />
      ) : currentRoute.type === 'notifications' ? (
        <NotificationsPage
          onBack={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
          locale={locale}
          currentUser={currentUser}
          onRequireLogin={() => handleOpenLogin(
            'signin',
            locale === 'pl'
              ? 'Zaloguj się, aby skonfigurować alerty WhatsApp.'
              : 'Sign in to configure WhatsApp alerts.'
          )}
          onOpenListing={(id) => {
            const found = listings.find((l) => l.id === id);
            navigateToListing(id, found?.title || '', locale);
          }}
        />
      ) : currentRoute.type === 'email-preferences' ? (
        <EmailPreferencesPage
          locale={locale}
          onBack={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
        />
      ) : currentRoute.type === 'rewards' ? (
        <RewardsPage
          onBack={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
          locale={locale}
          currentUser={currentUser}
          onOpenIntake={() => navigateTo(locale === 'pl' ? '/pl/list' : '/list')}
        />
      ) : currentRoute.type === 'enrollments' ? (
        <EnrollmentsPage
          onBack={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
          locale={locale}
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
            <section id="search-hero" className="r8-home-hero" aria-labelledby="home-title">
              <div className="r8-home-intro">
                <h1 id="home-title">{strings.heroTitle}</h1>
                <p>{strings.heroSubtitle}</p>
              </div>

              <div className="r8-home-search">
                <SearchBar
                  mode="expanded"
                  searchState={searchState}
                  onSearchChange={handleSearchChange}
                  onSearchSubmit={() => {
                    const results = document.getElementById('rooms-grid');
                    if (!results) return;
                    results.focus({ preventScroll: true });
                    results.scrollIntoView({
                      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
                    });
                  }}
                  locale={locale}
                />
              </div>

              <div className="r8-home-links">
                <a href={locale === 'pl' ? '/pl/leave-your-lease' : '/leave-your-lease'}>
                  {strings.leavingEarlyQuestion}
                </a>
                <a href={locale === 'pl' ? '/pl/how-it-works' : '/how-it-works'}>
                  {locale === 'pl' ? 'Zobacz, jak to działa' : 'See how it works'}
                </a>
              </div>

              <img
                className="r8-home-photo"
                src="/images/home-hero-katowice.webp"
                alt=""
                width={1600}
                height={1068}
                fetchPriority="high"
              />
            </section>
          )}

          {!activeCityConfig && (
            <nav aria-labelledby="browse-cities-title" className="r8-home-cities">
              <h2 id="browse-cities-title">{locale === 'pl' ? 'Oferty według miasta' : 'Browse by city'}</h2>
              <ul>
                {ENABLED_CITIES.map((city) => (
                  <li key={city.slug}>
                    <a href={`${locale === 'pl' ? '/pl' : ''}/${city.slug}/rooms`}>
                      <MapPin size={17} aria-hidden="true" />
                      {locale === 'pl' && city.slug === 'warsaw' ? 'Warszawa' : city.name}
                      <ArrowRight size={16} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* Rooms Grid Section */}
          <section id="rooms-grid" tabIndex={-1} aria-labelledby="rooms-title" className="space-y-6 pt-4 scroll-mt-24">
            <h2 id="rooms-title" className={activeCityConfig ? 'sr-only' : 'r8-section-title'}>
              {locale === 'pl' ? 'Pokoje i mieszkania na cesję' : 'Rooms and lease takeovers'}
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
                  minRent: 0,
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 pt-2">
                {filteredListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    isSaved={savedIds.includes(listing.id)}
                    onToggleSave={(id, e) => handleToggleSave(id, e)}
                    onSelectListing={(l) => navigateToListing(l.id, l.title, locale)}
                    onOpenMessage={(l, e) => {
                      e.stopPropagation();
                      navigateToListing(l.id, l.title, locale, { compose: "1" });
                    }}
                    onOpenAIChat={(l, e) => {
                      e.stopPropagation();
                      setActiveCardAIChat(l);
                    }}
                    locale={locale}
                  />
                ))}
              </div>
            ) : (
              /* Zero Results State with Alert Capture (§4.7, §6.3) */
              <div className="space-y-6">
                <div className="text-center py-10 px-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3 max-w-lg mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-150 flex items-center justify-center mx-auto text-indigo-600">
                    <Home className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {activeCityConfig ? strings.noRoomsInCity : (locale === 'pl' ? 'Brak ogłoszeń – dodaj pierwsze!' : 'No listings yet – be the first to post!')}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    {locale === 'pl'
                      ? 'Nie ma tu jeszcze dostępnych pokoi. Sprawdź inne miasto, wyczyść filtry lub dodaj ogłoszenie, jeśli się wyprowadzasz.'
                      : 'No rooms are available here yet. Try another city, clear filters or list a room if you are moving out.'}
                  </p>
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const prefix = locale === 'pl' ? '/pl' : '';
                        navigateTo(`${prefix}/list`);
                      }}
                      className="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      {locale === 'pl' ? 'Dodaj ogłoszenie' : 'List your place'}
                    </button>
                    {(searchState.city !== 'Anywhere in Poland'
                      || searchState.moveInDate
                      || searchState.roomType !== 'All room types'
                      || searchState.minRent > 0
                      || searchState.maxRent < 5000) && (
                      <button
                        type="button"
                        onClick={() => {
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
                            minRent: 0,
                            maxRent: 5000,
                            moveInDate: '',
                            roomType: 'All room types'
                          });
                        }}
                        className="px-4 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        {locale === 'pl' ? 'Wyczyść filtry' : 'Clear filters'}
                      </button>
                    )}
                  </div>
                </div>

                <AlertCaptureCard
                  locale={locale}
                />
              </div>
            )}

            {/* City Page Alert capture box if listings are present */}
            {activeCityConfig && filteredListings.length > 0 && (
              <div className="pt-6">
                <AlertCaptureCard
                  locale={locale}
                />
              </div>
            )}

          </section>

          {/* How It Works Section (§1 principles: Housing First, placed after rooms) */}
          <section id="how-it-works-section" className="r8-home-process">
            <div className="space-y-2">
              <h2 className="r8-section-title">{strings.howItWorksTitle}</h2>
              <p>{strings.howItWorksSub}</p>
            </div>

            <ol className="grid gap-6 md:grid-cols-3">
              {[
                { title: strings.step1Title, description: strings.step1Desc },
                { title: strings.step2Title, description: strings.step2Desc },
                { title: strings.step3Title, description: strings.step3Desc }
              ].map((step) => (
                <li key={step.title} className="r8-home-step space-y-2">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Leaving Early Banner */}
          <DepartingTenantBanner
            onOpenLeaveLease={() => navigateTo(locale === 'pl' ? '/pl/leave-your-lease' : '/leave-your-lease')}
            onOpenIntake={() => navigateTo(locale === 'pl' ? '/pl/list' : '/list')}
            locale={locale}
          />

        </main>
      )}

      {/* Public website footer; messaging uses a bounded workspace. */}
      {currentRoute.type !== 'messages' && <Footer
        onOpenReportListing={() => {
          showToast(locale === 'pl' ? 'Zgłoszenie oferty: info@relok8.online' : 'Open a listing and choose Report a problem, or email info@relok8.online.');
        }}
        locale={locale}
        theme={theme}
      />}

      {/* Mobile Bottom Navigation (active on browse/saved/account/list, hidden on listing-detail & messages to prevent covering sticky CTA and chat composer) */}
      {currentRoute.type !== 'listing-detail' && currentRoute.type !== 'messages' && (
        <MobileBottomNav
          currentPath={currentRoute.type}
          savedCount={savedIds.length}
          onNavigateHome={() => navigateTo(locale === 'pl' ? '/pl' : '/')}
          onNavigateSaved={() => navigateTo(locale === 'pl' ? '/pl/saved' : '/saved')}
          onNavigateAccount={() => navigateTo(locale === 'pl' ? '/pl/account' : '/account')}
          onNavigateMessages={() => navigateTo(locale === 'pl' ? '/pl/messages' : '/messages')}
          onOpenListRoom={() => navigateTo(locale === 'pl' ? '/pl/list' : '/list')}
          onOpenHelp={() => navigateTo(locale === 'pl' ? '/pl/help' : '/help')}
          onOpenLogin={() => {
            setLoginReason('Sign up or log in to manage your account.');
            setIsLoginOpen(true);
          }}
          locale={locale}
          currentUser={currentUser}
        />
      )}

      {/* Modals */}
      <CesjaGeneratorModal
        isOpen={isCesjaOpen}
        onClose={() => setIsCesjaOpen(false)}
        presetDates={cesjaTemplateDates}
        locale={locale}
      />

      {!isClerkSignedIn && (
        <LoginModal
          isOpen={isLoginOpen}
          onClose={() => {
            setIsLoginOpen(false);
            if (currentRoute.type === 'sign-in' || currentRoute.type === 'sign-up') {
              const returnPath = authReturnPath(window.location.pathname, window.location.search);
              window.history.replaceState({}, '', returnPath);
              setCurrentRoute(parseRoute(window.location.pathname, window.location.hash, window.location.search));
            }
          }}
          initialMode={loginMode}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            localStorage.setItem('r8_user', JSON.stringify(user));
            setIsLoginOpen(false);
            if (currentRoute.type === 'sign-in' || currentRoute.type === 'sign-up') {
              const redirectUrl = authReturnPath(window.location.pathname, window.location.search);
              window.history.replaceState({}, '', redirectUrl);
              setCurrentRoute(parseRoute(window.location.pathname, window.location.hash, window.location.search));
            }
            showToast(locale === 'pl' ? `Witaj, ${user.name}!` : `Welcome back, ${user.name}!`);
          }}
          locale={locale}
          contextMessage={loginReason}
        />
      )}

      {/* Quick Action Modals from Listing Cards */}
      {activeCardAIChat && (
        <AIProxyChatModal
          isOpen={!!activeCardAIChat}
          onClose={() => setActiveCardAIChat(null)}
          listing={activeCardAIChat}
          locale={locale}
          onRequireLogin={() => {
            setActiveCardAIChat(null);
            handleOpenLogin(
              'signin',
              locale === 'pl'
                ? 'Zaloguj się, aby zapytać Onlo o to ogłoszenie.'
                : 'Sign in to ask Onlo about this listing.'
            );
          }}
          onOpenContact={() => {
            const l = activeCardAIChat;
            setActiveCardAIChat(null);
            navigateToListing(l.id, l.title, locale, { compose: "1" });
          }}
        />
      )}

      {shouldShowGlobalOnlo(currentRoute.type) && !activeCardAIChat && (
        <OnloGlobalWidget
          locale={locale}
          isOpen={isGlobalOnloOpen}
          isAuthenticated={isBackendAuthenticated}
          onOpenChange={setIsGlobalOnloOpen}
          onRequireLogin={() => {
            setIsGlobalOnloOpen(false);
            handleOpenLogin(
              'signin',
              locale === 'pl'
                ? 'Zaloguj się, aby porozmawiać z Onlo.'
                : 'Sign in to chat with Onlo.'
            );
          }}
        />
      )}
      <CookieBanner locale={locale} />


    </div>
  );
}

export default function App() {
  return (
    <ConvexProvider>
      <Relok8App />
    </ConvexProvider>
  );
}
