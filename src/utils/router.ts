import { CITIES_CONFIG, ENABLED_CITIES, getCityBySlug } from '../data/cities';

export type RouteType =
  | 'home'
  | 'city'
  | 'listing-detail'
  | 'leave-your-lease'
  | 'list'
  | 'saved'
  | 'messages'
  | 'dashboard'
  | 'help'
  | 'how-it-works'
  | 'savings-calculator'
  | 'meldunek-guide'
  | 'safety-guide'
  | 'cesja-template'
  | 'terms'
  | 'privacy'
  | 'cookies';

export interface ParsedRoute {
  type: RouteType;
  locale: 'en' | 'pl';
  citySlug?: string;
  cityName?: string;
  listingId?: string;
  listingSlug?: string;
  helpArticle?: string;
  path: string;
  searchParams: URLSearchParams;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

/**
 * Parses real pathname and search query, handling hash redirects seamlessly
 */
export function parseRoute(pathname: string = window.location.pathname, hash: string = window.location.hash, search: string = window.location.search): ParsedRoute {
  // If an old hash route is present (e.g. #/krakow/rooms, #/saved, #/listing/rel-01), redirect to clean path
  if (hash && hash.startsWith('#/')) {
    const rawHash = hash.replace(/^#\/?/, '').trim();
    if (rawHash) {
      const targetPath = '/' + rawHash;
      try {
        window.history.replaceState({}, '', targetPath + search);
        pathname = targetPath;
      } catch (e) {
        pathname = targetPath;
      }
    }
  }

  const searchParams = new URLSearchParams(search);
  const segments = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);

  let locale: 'en' | 'pl' = 'en';
  if (segments[0] === 'pl') {
    locale = 'pl';
    segments.shift();
  }

  const first = (segments[0] || '').toLowerCase();
  const second = (segments[1] || '').toLowerCase();

  // Root / or /pl
  if (!first) {
    return { type: 'home', locale, path: pathname, searchParams };
  }

  // Saved
  if (first === 'saved' || first === 'saved-apartments' || first === 'favorites') {
    return { type: 'saved', locale, path: pathname, searchParams };
  }

  // Listing detail: /listing/{id} or /listing/{id}-{slug}
  if (first === 'listing' || first === 'room') {
    const rawIdSegment = segments[1] || '';
    // Format could be rel-waw-01 or rel-waw-01-studio-in-upper-mokotow
    // Look for standard ID pattern or split by first 3 parts (rel-city-num)
    const match = rawIdSegment.match(/^(rel-[a-z]{3}-\d+)(?:-(.*))?$/i);
    const listingId = match ? match[1] : rawIdSegment.split('-').slice(0, 3).join('-');
    const listingSlug = match && match[2] ? match[2] : '';

    return {
      type: 'listing-detail',
      locale,
      listingId: listingId || rawIdSegment,
      listingSlug,
      path: pathname,
      searchParams
    };
  }

  // List your place
  if (first === 'list' || first === 'list-your-place' || first === 'list-a-room' || first === 'list-room') {
    return { type: 'list', locale, path: pathname, searchParams };
  }

  // Leave your lease
  if (first === 'leave-your-lease' || first === 'leave-lease') {
    return { type: 'leave-your-lease', locale, path: pathname, searchParams };
  }

  // Messages
  if (first === 'messages' || first === 'inbox') {
    return { type: 'messages', locale, path: pathname, searchParams };
  }

  // Dashboard
  if (first === 'dashboard' || first === 'my-listings') {
    return { type: 'dashboard', locale, path: pathname, searchParams };
  }

  // How it works
  if (first === 'how-it-works') {
    return { type: 'how-it-works', locale, path: pathname, searchParams };
  }

  // Savings calculator
  if (first === 'savings-calculator' || first === 'calculator') {
    return { type: 'savings-calculator', locale, path: pathname, searchParams };
  }

  // Help & articles: /help or /help/{article}
  if (first === 'help' || first === 'faq') {
    return {
      type: 'help',
      locale,
      helpArticle: segments[1],
      path: pathname,
      searchParams
    };
  }

  // Meldunek guide
  if (first === 'meldunek-guide' || first === 'meldunek' || first === 'address-registration') {
    return { type: 'meldunek-guide', locale, path: pathname, searchParams };
  }

  // Safety guide
  if (first === 'safety' || first === 'safety-tips' || first === 'safety-guide') {
    return { type: 'safety-guide', locale, path: pathname, searchParams };
  }

  // Cesja template
  if (first === 'cesja-template' || first === 'contract-template' || first === 'lease-takeover-template') {
    return { type: 'cesja-template', locale, path: pathname, searchParams };
  }

  // Legal
  if (first === 'legal') {
    if (second === 'terms') return { type: 'terms', locale, path: pathname, searchParams };
    if (second === 'privacy') return { type: 'privacy', locale, path: pathname, searchParams };
    if (second === 'cookies') return { type: 'cookies', locale, path: pathname, searchParams };
  }
  if (first === 'terms') return { type: 'terms', locale, path: pathname, searchParams };
  if (first === 'privacy') return { type: 'privacy', locale, path: pathname, searchParams };
  if (first === 'cookies') return { type: 'cookies', locale, path: pathname, searchParams };

  // City pages: /{city}/rooms or /{city}
  const cityMatch = getCityBySlug(first);
  if (cityMatch) {
    return {
      type: 'city',
      locale,
      citySlug: cityMatch.slug,
      cityName: cityMatch.name,
      path: pathname,
      searchParams
    };
  }

  return { type: 'home', locale, path: pathname, searchParams };
}

export function navigateTo(path: string, searchParams?: URLSearchParams | Record<string, string>) {
  let finalPath = path.startsWith('/') ? path : '/' + path;
  if (searchParams) {
    const params = searchParams instanceof URLSearchParams ? searchParams : new URLSearchParams(searchParams);
    const queryString = params.toString();
    if (queryString) {
      finalPath += (finalPath.includes('?') ? '&' : '?') + queryString;
    }
  }
  window.history.pushState({}, '', finalPath);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function navigateToCity(citySlug: string, locale?: string, searchParams?: Record<string, string>) {
  const prefix = locale === 'pl' ? '/pl' : '';
  const city = getCityBySlug(citySlug);
  const slug = city ? city.slug : citySlug.toLowerCase();
  navigateTo(`${prefix}/${slug}/rooms`, searchParams);
}

export function navigateToListing(listingId: string, title?: string, locale?: string) {
  const prefix = locale === 'pl' ? '/pl' : '';
  const slugPart = title ? `-${slugify(title)}` : '';
  navigateTo(`${prefix}/listing/${listingId}${slugPart}`);
}

export function switchLocale(newLocale: 'en' | 'pl', currentRoute: ParsedRoute) {
  // Replace or add /pl prefix while keeping same page & query params
  const segments = window.location.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  if (segments[0] === 'pl') {
    segments.shift();
  }
  if (newLocale === 'pl') {
    segments.unshift('pl');
  }
  const newPath = '/' + segments.join('/');
  const search = window.location.search;
  window.history.pushState({}, '', newPath + search);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
