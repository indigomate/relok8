export interface CitySeoInfo {
  name: string;
  slug: string;
  heading: string;
  tagline: string;
  universities: string[];
  transit: string;
  averageRentPLN: number;
}

export const CITIES_SEO_INFO: Record<string, CitySeoInfo> = {
  Warsaw: {
    name: 'Warsaw',
    slug: 'warsaw',
    heading: 'Student housing Warsaw · Direct Lease Transfers',
    tagline: 'Direct lease transfers in Mokotów, Śródmieście, and Wola. 0 PLN broker commissions and rooms with Meldunek allowed.',
    universities: ['University of Warsaw (UW)', 'Warsaw School of Economics (SGH)', 'Warsaw Tech (PW)', 'Medical University (WUM)'],
    transit: 'Metro lines M1 & M2, direct tram network to campuses',
    averageRentPLN: 2200
  },
  'Kraków': {
    name: 'Kraków',
    slug: 'krakow',
    heading: 'No agency commission flats Krakow · Verified Student & Expat Rooms',
    tagline: 'Rooms and flats in Kazimierz, Stare Miasto, and Krowodrza. Zero agency commission flats Krakow with landlord-approved lease takeovers.',
    universities: ['Jagiellonian University (UJ)', 'AGH University of Science & Tech', 'Kraków Univ. of Economics (UEK)'],
    transit: 'Plac Wolnica / Teatr Słowackiego central tram corridors',
    averageRentPLN: 2100
  },
  'Wrocław': {
    name: 'Wrocław',
    slug: 'wroclaw',
    heading: 'Student & Expat Rooms in Wrocław · Lease Takeover Poland',
    tagline: 'Waterfront lofts and student rooms in Nadodrze, Śródmieście, and Grunwald with 0 broker fees.',
    universities: ['Wrocław Tech (PWr)', 'University of Wrocław (UWr)', 'Wrocław Medical University'],
    transit: 'Plac Grunwaldzki & Pomorska high-frequency tram junctions',
    averageRentPLN: 2000
  },
  'Gdańsk': {
    name: 'Gdańsk',
    slug: 'gdansk',
    heading: 'Rooms & Flats in Gdańsk & Tricity · Direct Handovers',
    tagline: 'Modern apartments in Wrzeszcz Garnizon, Oliwa, and Przymorze without broker fees.',
    universities: ['Gdańsk University of Technology (PG)', 'University of Gdańsk (UG)', 'Medical University of Gdańsk (GUMed)'],
    transit: 'SKM Fast City Train connecting Gdańsk, Sopot, and Gdynia',
    averageRentPLN: 2300
  },
  Lublin: {
    name: 'Lublin',
    slug: 'lublin',
    heading: 'Student housing Lublin · English Division & Expat Flats',
    tagline: 'Convenient student housing Lublin for international medicine, dentistry, and Erasmus students. Rooms with Meldunek allowed.',
    universities: ['Medical University of Lublin (UMLub)', 'Maria Curie-Skłodowska University (UMCS)', 'John Paul II Catholic Univ. (KUL)'],
    transit: 'Direct city bus routes 26, 31, and 40 to campus lecture halls',
    averageRentPLN: 1800
  }
};

export const SLUG_TO_CITY_MAP: Record<string, string> = {
  warsaw: 'Warsaw',
  warszawa: 'Warsaw',
  krakow: 'Kraków',
  cracow: 'Kraków',
  wroclaw: 'Wrocław',
  breslau: 'Wrocław',
  gdansk: 'Gdańsk',
  danzig: 'Gdańsk',
  lublin: 'Lublin'
};

export const CITY_TO_SLUG_MAP: Record<string, string> = {
  Warsaw: 'warsaw',
  'Kraków': 'krakow',
  'Wrocław': 'wroclaw',
  'Gdańsk': 'gdansk',
  Lublin: 'lublin'
};

export type RouteType = 'home' | 'city' | 'leave-your-lease' | 'list-room' | 'help' | 'room-detail' | 'how-it-works';

export interface ParsedRoute {
  type: RouteType;
  city?: string;
  listingId?: string;
  rawHash: string;
}

/**
 * Parses URL hash (e.g. "#/warsaw/rooms", "#/krakow/student-housing", "#/leave-your-lease")
 */
export function parseHashRoute(hashString: string): ParsedRoute {
  const cleanHash = (hashString || window.location.hash || '').replace(/^#\/?/, '').trim();

  if (!cleanHash || cleanHash === '/' || cleanHash === 'rooms') {
    return { type: 'home', rawHash: cleanHash };
  }

  const parts = cleanHash.split('/').filter(Boolean);
  const firstPart = parts[0]?.toLowerCase() || '';

  if (firstPart === 'leave-your-lease' || firstPart === 'cesja') {
    return { type: 'leave-your-lease', rawHash: cleanHash };
  }

  if (firstPart === 'list-a-room' || firstPart === 'list-your-room' || firstPart === 'add-room') {
    return { type: 'list-room', rawHash: cleanHash };
  }

  if (firstPart === 'help' || firstPart === 'faq' || firstPart === 'safety') {
    return { type: 'help', rawHash: cleanHash };
  }

  if (firstPart === 'how-it-works') {
    return { type: 'how-it-works', rawHash: cleanHash };
  }

  if (firstPart === 'room' && parts[1]) {
    return { type: 'room-detail', listingId: parts[1], rawHash: cleanHash };
  }

  // Check if it's a city route: e.g. "warsaw/rooms", "krakow/student-housing", "wroclaw"
  if (SLUG_TO_CITY_MAP[firstPart]) {
    return {
      type: 'city',
      city: SLUG_TO_CITY_MAP[firstPart],
      rawHash: cleanHash
    };
  }

  return { type: 'home', rawHash: cleanHash };
}

/**
 * Set the hash route cleanly
 */
export function navigateToCity(city: string, actionType: 'rooms' | 'student-housing' = 'rooms') {
  if (city === 'All Poland' || !city) {
    window.location.hash = '#/rooms';
  } else {
    const slug = CITY_TO_SLUG_MAP[city] || city.toLowerCase();
    window.location.hash = `#/${slug}/${actionType}`;
  }
}

export function navigateToRoute(path: string) {
  window.location.hash = path.startsWith('#') ? path : `#/${path.replace(/^\//, '')}`;
}
