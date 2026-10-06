import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { INITIAL_LISTINGS } from './src/data/mockListings';
import {
  sendResendEmail,
  isResendConfigured,
  buildInquiryEmailHtml,
  buildInquiryReplyHtml,
  buildContactSupportHtml
} from './src/lib/resend';
import {
  executeAIGateway,
  getAIRuns,
  getReviewQueue,
  resolveReviewQueueItem
} from './src/lib/aiGateway';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Enforce HTTPS and modern SEO security headers
app.use((req: Request, res: Response, next) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const host = req.headers.host || '';
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

  if (!isLocalhost && forwardedProto && forwardedProto !== 'https') {
    return res.redirect(301, `https://${host}${req.url}`);
  }
  
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (!isLocalhost) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});

// Explicit Sitemap.xml & Robots.txt Routes with Proper MIME Types for Google Crawler
app.get('/sitemap.xml', (_req: Request, res: Response) => {
  res.header('Content-Type', 'application/xml; charset=utf-8');
  try {
    const sitemapPath = path.join(__dirname, 'public', 'sitemap.xml');
    let xml = fs.readFileSync(sitemapPath, 'utf-8');

    if (Array.isArray(listings) && listings.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const listingUrls = listings
        .filter((l) => l && l.id)
        .map(
          (l) => `  <url>
    <loc>https://relok8.online/listing/${l.id}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://relok8.online/listing/${l.id}" />
    <xhtml:link rel="alternate" hreflang="pl" href="https://relok8.online/pl/listing/${l.id}" />
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://relok8.online/pl/listing/${l.id}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://relok8.online/listing/${l.id}" />
    <xhtml:link rel="alternate" hreflang="pl" href="https://relok8.online/pl/listing/${l.id}" />
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
        )
        .join('\n');

      xml = xml.replace('</urlset>', `${listingUrls}\n</urlset>`);
    }

    res.send(xml);
  } catch (err) {
    res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
  }
});

app.get('/robots.txt', (_req: Request, res: Response) => {
  res.header('Content-Type', 'text/plain; charset=utf-8');
  res.sendFile(path.join(__dirname, 'public', 'robots.txt'));
});

// Initial seed listings
interface DepartingTenant {
  name: string;
  nationality: string;
  role: string;
  avatar: string;
  verifiedDocs: string[];
  reasonForLeaving: string;
  joinedYear: string;
}

interface Listing {
  id: string;
  title: string;
  shortTitle?: string;
  city: 'Warsaw' | 'Kraków' | 'Wrocław' | 'Gdańsk' | 'Poznań' | 'Lublin';
  district: string;
  address: string;
  roomType: 'Studio' | '1-Bedroom' | '2-Bedroom' | 'Private Room';
  monthlyRentPLN: number;
  czynszAdminPLN: number;
  czynszIncluded: boolean;
  depositPLN: number;
  availableDate: string;
  leaseEndDate: string;
  remainingMonths: number;
  images: string[];
  isFireSale?: boolean;
  isGuestFavorite?: boolean;
  isVerifiedTransfer?: boolean;
  meldunekAllowed: boolean;
  isFurnished: boolean;
  flatmatesInfo: string;
  transitInfo: string;
  landlordConsentStatus: 'Guaranteed Consent' | 'Pre-Approved' | 'Consent in Progress';
  landlordName: string;
  landlordContactEmail: string;
  departingTenant: DepartingTenant;
  amenities: string[];
  universitiesNearby: string[];
  metroNearby?: string;
  description: string;
  squareMeters: number;
  floor: string;
  depositSettlementType: 'P2P Direct Clearing' | 'Escrow Guarded';
  likesCount?: number;
  lat?: number;
  lng?: number;
}

let listings_legacy: Listing[] = [
  {
    id: 'rel-waw-01',
    title: 'Student housing Warsaw · Furnished Studio in Upper Mokotów',
    shortTitle: 'Student housing Warsaw',
    city: 'Warsaw',
    district: 'Mokotów',
    address: 'ul. Rakowiecka 32, 02-521 Warszawa',
    roomType: 'Studio',
    monthlyRentPLN: 2400,
    czynszAdminPLN: 450,
    czynszIncluded: true,
    depositPLN: 2850,
    availableDate: '2026-10-15',
    leaseEndDate: '2027-06-30',
    remainingMonths: 8,
    images: [
      '/images/listing_warsaw_mokotow_1790621438299.jpg',
      '/images/listing_warsaw_center_1790621476399.jpg',
      '/images/listing_wroclaw_nordic_1790621466153.jpg'
    ],
    meldunekAllowed: true,
    isFurnished: true,
    flatmatesInfo: 'Private studio (no flatmates)',
    transitInfo: '6 min walk to SGH · 350m to M1 Metro',
    landlordConsentStatus: 'Guaranteed Consent',
    landlordName: 'Marek Wiśniewski',
    landlordContactEmail: 'm.wisniewski.nieruchomosci@gmail.com',
    likesCount: 34,
    departingTenant: {
      name: 'Matteo Rossi',
      nationality: 'Italian',
      role: 'SGH Masters Exchange Student',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      verifiedDocs: ['Italian Passport', 'SGH Student ID', 'Active Lease KC-2025'],
      reasonForLeaving: 'Returning to Milan after completing winter semester.',
      joinedYear: '2024'
    },
    amenities: [
      'High-Speed Fiber (600 Mbps)',
      'Floor-to-Ceiling Windows',
      'Bosch Dishwasher & Induction',
      'Balcony with Park View',
      'Underground Bicycle Storage'
    ],
    universitiesNearby: [
      'Warsaw School of Economics (SGH) - 6 min walk',
      'Warsaw University of Technology (PW) - 12 min tram',
      'University of Warsaw (UW) - 18 min direct metro'
    ],
    metroNearby: 'Metro Pole Mokotowskie (M1 line, 350m)',
    description: 'Quiet, bright studio with custom study desk and full furnishings. Direct handover from departing exchange student with landlord agreement in place. Address registration (meldunek) fully supported by landlord.',
    squareMeters: 34,
    floor: '4th floor (with elevator)',
    depositSettlementType: 'P2P Direct Clearing',
    lat: 52.2085,
    lng: 21.0068
  },
  {
    id: 'rel-krk-02',
    title: 'No agency commission flats Krakow · Industrial 1-Bed in Historic Kazimierz',
    shortTitle: 'No agency commission flats Krakow',
    city: 'Kraków',
    district: 'Kazimierz',
    address: 'ul. Józefa 18, 31-056 Kraków',
    roomType: '1-Bedroom',
    monthlyRentPLN: 3100,
    czynszAdminPLN: 520,
    czynszIncluded: true,
    depositPLN: 3600,
    availableDate: '2026-11-01',
    leaseEndDate: '2027-08-31',
    remainingMonths: 10,
    images: [
      '/images/listing_krakow_loft_1790621454348.jpg',
      '/images/listing_warsaw_mokotow_1790621438299.jpg'
    ],
    meldunekAllowed: true,
    isFurnished: true,
    flatmatesInfo: '1-bedroom flat (entire place)',
    transitInfo: '14 min walk to UJ · 120m to Plac Wolnica Tram',
    landlordConsentStatus: 'Pre-Approved',
    landlordName: 'Katarzyna Dąbrowska',
    landlordContactEmail: 'kasia.dabrowska.krk@onet.pl',
    likesCount: 29,
    departingTenant: {
      name: 'Elena Rostova',
      nationality: 'Ukrainian / EU Blue Card',
      role: 'Lead UI Designer at Cisco Kraków',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
      verifiedDocs: ['Passport', 'Employment Contract Cisco Poland', 'Registration PESEL'],
      reasonForLeaving: 'Transferred by employer to Zurich headquarters starting Nov 1.',
      joinedYear: '2023'
    },
    amenities: [
      'Exposed Red Brick Walls',
      'Air Conditioning (Daikin Dual)',
      'Pet Friendly (Cats & Dogs)',
      'Italian Rain Shower',
      'High-speed Fiber Wi-Fi'
    ],
    universitiesNearby: [
      'Jagiellonian University (UJ Collegium Maius) - 14 min walk',
      'AGH University of Science & Technology - 18 min direct tram 8'
    ],
    metroNearby: 'Plac Wolnica Tram Hub (120m)',
    description: 'Renovated heritage tenement apartment in central Kazimierz. High ceilings, silent internal courtyard facing, fully equipped kitchen. Direct transfer with landlord agreement.',
    squareMeters: 46,
    floor: '2nd floor',
    depositSettlementType: 'P2P Direct Clearing',
    lat: 50.0515,
    lng: 19.9452
  },
  {
    id: 'rel-wro-03',
    title: 'Waterfront 1-Bed in Nadodrze · Wrocław',
    shortTitle: 'Waterfront 1-Bed in Nadodrze',
    city: 'Wrocław',
    district: 'Nadodrze',
    address: 'ul. Drobnera 9, 50-257 Wrocław',
    roomType: '1-Bedroom',
    monthlyRentPLN: 2650,
    czynszAdminPLN: 480,
    czynszIncluded: true,
    depositPLN: 3000,
    availableDate: '2026-10-20',
    leaseEndDate: '2027-05-31',
    remainingMonths: 7,
    images: [
      '/images/listing_wroclaw_nordic_1790621466153.jpg',
      '/images/listing_warsaw_center_1790621476399.jpg'
    ],
    meldunekAllowed: true,
    isFurnished: true,
    flatmatesInfo: '1-bedroom flat (entire place)',
    transitInfo: '8 min walk to UWr · 10 min bike to PWr',
    landlordConsentStatus: 'Guaranteed Consent',
    landlordName: 'Piotr Zieliński',
    landlordContactEmail: 'zielinski.piotr.wroc@wp.pl',
    likesCount: 22,
    departingTenant: {
      name: 'Lars Lindqvist',
      nationality: 'Swedish',
      role: 'Erasmus Engineering Student at Wrocław Tech',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      verifiedDocs: ['Swedish Passport', 'Wrocław Tech Student Card', 'EU Health Card'],
      reasonForLeaving: 'Completing thesis project early to start internship in Gothenburg.',
      joinedYear: '2025'
    },
    amenities: [
      'Riverfront Balcony View',
      'Nordic Birch Dining Table',
      'Dishwasher & Washing Machine',
      'Underfloor Bathroom Heating',
      'Underground Parking Space Included'
    ],
    universitiesNearby: [
      'Wrocław University of Science & Technology (PWr) - 10 min bike',
      'University of Wrocław (UWr Main Building) - 8 min walk across bridge'
    ],
    metroNearby: 'Pomorska Tram Station (200m)',
    description: 'Sunny 2023 riverfront build in Nadodrze. Scandinavian furniture, floor-to-ceiling windows, and great community of students and young professionals. Current tenant relocating back to Sweden.',
    squareMeters: 41,
    floor: '3rd floor (with lift)',
    depositSettlementType: 'P2P Direct Clearing',
    lat: 51.1190,
    lng: 17.0345
  },
  {
    id: 'rel-waw-04',
    title: 'Sunny Private Room in Śródmieście · Warsaw',
    shortTitle: 'Sunny Private Room in Śródmieście',
    city: 'Warsaw',
    district: 'Śródmieście Południowe',
    address: 'ul. Koszykowa 45, 00-659 Warszawa',
    roomType: 'Private Room',
    monthlyRentPLN: 1850,
    czynszAdminPLN: 250,
    czynszIncluded: true,
    depositPLN: 2000,
    availableDate: '2026-10-10',
    leaseEndDate: '2027-09-30',
    remainingMonths: 11,
    images: [
      '/images/listing_warsaw_center_1790621476399.jpg',
      '/images/listing_warsaw_mokotow_1790621438299.jpg'
    ],
    meldunekAllowed: true,
    isFurnished: true,
    flatmatesInfo: 'Shared flat with 2 female grad students',
    transitInfo: '4 min walk to PW · 280m to Metro Politechnika',
    landlordConsentStatus: 'Guaranteed Consent',
    landlordName: 'Anna Kowalczyk',
    landlordContactEmail: 'anna.kowalczyk.waw@gmail.com',
    likesCount: 18,
    departingTenant: {
      name: 'Sofia Al-Mansoor',
      nationality: 'Jordanian / Student',
      role: 'Medical Student at Medical University of Warsaw (WUM)',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      verifiedDocs: ['Jordanian Passport', 'WUM Student ID', 'Residence Permit (Karta Pobytu)'],
      reasonForLeaving: 'Switching to clinical rotations in central hospital dorms.',
      joinedYear: '2024'
    },
    amenities: [
      'Huge 18m² Private Room with Lock',
      'Study Desk & Ergonomic Chair',
      'High-Speed 900 Mbps Wi-Fi',
      'Shared Kitchen with 2 Refrigerators',
      'Bi-weekly Cleaning of Common Areas'
    ],
    universitiesNearby: [
      'Warsaw University of Technology (PW) - 4 min walk',
      'Medical University of Warsaw (WUM) - 15 min direct bus 175',
      'University of Warsaw - 14 min direct tram'
    ],
    metroNearby: 'Metro Politechnika (M1, 280m)',
    description: 'Spacious room in a well-kept 3-bedroom apartment on Koszykowa. Shared with two quiet international master students. All utility bills and high-speed internet included.',
    squareMeters: 19,
    floor: '3rd floor',
    depositSettlementType: 'P2P Direct Clearing',
    lat: 52.2215,
    lng: 21.0110
  },
  {
    id: 'rel-lub-06',
    title: 'Student housing Lublin · Quiet Studio near Medical University',
    shortTitle: 'Student housing Lublin',
    city: 'Lublin',
    district: 'Śródmieście / Czechów',
    address: 'ul. Chodźki 14, 20-093 Lublin',
    roomType: 'Studio',
    monthlyRentPLN: 1900,
    czynszAdminPLN: 380,
    czynszIncluded: true,
    depositPLN: 2200,
    availableDate: '2026-10-25',
    leaseEndDate: '2027-06-30',
    remainingMonths: 8,
    images: [
      '/images/listing_warsaw_center_1790621476399.jpg',
      '/images/listing_krakow_loft_1790621454348.jpg'
    ],
    meldunekAllowed: true,
    isFurnished: true,
    flatmatesInfo: 'Private studio (no flatmates)',
    transitInfo: '3 min walk to UMLub English Division',
    landlordConsentStatus: 'Guaranteed Consent',
    landlordName: 'Wojciech Szymański',
    landlordContactEmail: 'wojtek.szymanski.lub@interia.pl',
    likesCount: 26,
    departingTenant: {
      name: 'Aisha Al-Hashimi',
      nationality: 'Omani / Medical Student',
      role: 'UMLub English Division 4th Year',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
      verifiedDocs: ['Passport', 'Medical University of Lublin ID', 'Certified Bank Proof'],
      reasonForLeaving: 'Switching to university hospital quarters for final internship.',
      joinedYear: '2022'
    },
    amenities: [
      '3 min walk to UMLub Lecture Halls',
      'Air Conditioning & Silent Heating',
      'Soundproof Double Glazed Windows',
      'Modern Kitchenette with Induction',
      'High-Speed Wi-Fi Included'
    ],
    universitiesNearby: [
      'Medical University of Lublin (UMLub) - 3 min walk',
      'Maria Curie-Skłodowska University (UMCS) - 12 min direct bus 26',
      'John Paul II Catholic University of Lublin (KUL) - 15 min bus'
    ],
    metroNearby: 'Chodźki Szpital Bus Hub (150m)',
    description: 'Tailored for English Division medical and dental students at UMLub. High desk, quiet internal view, elevator, all kitchen appliances provided.',
    squareMeters: 29,
    floor: '5th floor (with elevator)',
    depositSettlementType: 'P2P Direct Clearing',
    lat: 51.2610,
    lng: 22.5620
  }
];

let listings: any[] = [...listings_legacy];

// In-memory collections for Inquiries, Users, Agreements
interface Inquiry {
  id: string;
  listingId: string;
  tenantName: string;
  tenantEmail: string;
  message: string;
  createdAt: string;
  status?: 'pending' | 'viewing_scheduled' | 'handover_agreed';
  replies?: Array<{ sender: string; text: string; sentAt: string }>;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'expat' | 'host';
  university?: string;
  avatar: string;
  isVerified: boolean;
  savedListingIds: string[];
  createdAt: string;
}

const inquiries: Inquiry[] = [];

const users: UserRecord[] = [];

// Helper to extract user from token or header
function getAuthUser(req: Request): UserRecord | undefined {
  const authHeader = req.headers.authorization;
  if (!authHeader) return undefined;
  const token = authHeader.replace('Bearer ', '').trim();
  // token format: jwt-r8-<userId>-<timestamp>
  const match = token.match(/jwt-r8-([^-]+)/);
  if (match) {
    const userId = match[1];
    return users.find((u) => u.id === userId || u.id.includes(userId));
  }
  return users[0];
}

// API Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'relok8-backend',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
    database: {
      listingsCount: listings.length,
      usersCount: users.length,
      inquiriesCount: inquiries.length
    }
  });
});

// GET /api/stats - Public marketplace trust metrics
app.get('/api/stats', (_req: Request, res: Response) => {
  const totalRent = listings.reduce((acc, l) => acc + l.monthlyRentPLN, 0);
  const avgRent = Math.round(totalRent / (listings.length || 1));
  const estimatedBrokerSavingsPLN = totalRent * 1.23; // typical 1 month + 23% VAT broker fee saved per listing

  res.json({
    activeListings: listings.length,
    verifiedHandovers: 142,
    avgRentPLN: avgRent,
    totalBrokerSavingsPLN: Math.round(estimatedBrokerSavingsPLN + 184500),
    avgDaysToHandover: 3.8,
    meldunekComplianceRate: '100%',
    zeroDepositDisputeRate: '99.4%'
  });
});

// GET /api/listings
app.get('/api/listings', (req: Request, res: Response) => {
  const { city, roomType, maxRent, meldunek, q, sort } = req.query;
  let results = [...listings];

  if (city && city !== 'All Poland') {
    results = results.filter((l) => l.city.toLowerCase() === (city as string).toLowerCase());
  }

  if (roomType && roomType !== 'All Types') {
    results = results.filter((l) => l.roomType === roomType);
  }

  if (maxRent) {
    const rentNum = Number(maxRent);
    if (!isNaN(rentNum)) {
      results = results.filter((l) => l.monthlyRentPLN <= rentNum);
    }
  }

  if (meldunek === 'true') {
    results = results.filter((l) => l.meldunekAllowed);
  }

  if (q && typeof q === 'string') {
    const query = q.toLowerCase();
    results = results.filter(
      (l) =>
        l.title.toLowerCase().includes(query) ||
        l.district.toLowerCase().includes(query) ||
        l.city.toLowerCase().includes(query) ||
        l.address.toLowerCase().includes(query) ||
        l.description.toLowerCase().includes(query)
    );
  }

  // Sorting
  if (sort === 'price_asc') {
    results.sort((a, b) => a.monthlyRentPLN - b.monthlyRentPLN);
  } else if (sort === 'price_desc') {
    results.sort((a, b) => b.monthlyRentPLN - a.monthlyRentPLN);
  } else if (sort === 'likes') {
    results.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
  }

  res.json({
    count: results.length,
    listings: results
  });
});

// GET /api/listings/:id
app.get('/api/listings/:id', (req: Request, res: Response) => {
  const listing = listings.find((l) => l.id === req.params.id);
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }
  res.json(listing);
});

// POST /api/listings
app.post('/api/listings', (req: Request, res: Response) => {
  const body = req.body;
  if (!body.title || !body.city || !body.monthlyRentPLN) {
    return res.status(400).json({ error: 'Missing required listing fields' });
  }

  const newListing: Listing = {
    ...body,
    id: body.id || `rel-${body.city.substring(0, 3).toLowerCase()}-${Date.now().toString().slice(-4)}`,
    likesCount: 1,
    meldunekAllowed: body.meldunekAllowed ?? true,
    czynszIncluded: body.czynszIncluded ?? true,
    landlordConsentStatus: body.landlordConsentStatus ?? 'Guaranteed Consent'
  };

  listings.unshift(newListing);
  res.status(201).json({
    message: 'Listing successfully published',
    listing: newListing
  });
});

// DELETE /api/listings/:id
app.delete('/api/listings/:id', (req: Request, res: Response) => {
  const index = listings.findIndex((l) => l.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Listing not found' });
  }
  const [removed] = listings.splice(index, 1);
  res.json({
    message: 'Listing deleted successfully',
    listing: removed
  });
});

// POST /api/listings/:id/like
app.post('/api/listings/:id/like', (req: Request, res: Response) => {
  const listing = listings.find((l) => l.id === req.params.id);
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  listing.likesCount = (listing.likesCount || 0) + 1;
  res.json({
    id: listing.id,
    likesCount: listing.likesCount
  });
});

// Auth Routes
// POST /api/auth/signup
app.post('/api/auth/signup', (req: Request, res: Response) => {
  const { email, name, university, role } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    const isStudent = email.includes('.edu') || email.includes('student.') || !!university;
    user = {
      id: `usr-${Date.now().toString().slice(-5)}`,
      name: name || email.split('@')[0],
      email,
      role: role || (isStudent ? 'student' : 'expat'),
      university: university || (isStudent ? 'Verified Polish University' : undefined),
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80`,
      isVerified: true,
      savedListingIds: [],
      createdAt: new Date().toISOString()
    };
    users.push(user);
  }

  res.json({
    token: `jwt-r8-${user.id}-${Date.now()}`,
    user
  });
});

// POST /api/auth/login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    const isStudent = email.includes('.edu') || email.includes('student.');
    user = {
      id: `usr-${Date.now().toString().slice(-5)}`,
      name: email.split('@')[0],
      email,
      role: isStudent ? 'student' : 'expat',
      university: isStudent ? 'Verified Polish University' : undefined,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80`,
      isVerified: true,
      savedListingIds: [],
      createdAt: new Date().toISOString()
    };
    users.push(user);
  }

  res.json({
    token: `jwt-r8-${user.id}-${Date.now()}`,
    user
  });
});

// GET /api/auth/me
app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user });
});

// PUT /api/auth/profile
app.put('/api/auth/profile', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { name, university, role, avatar } = req.body;
  if (name) user.name = name;
  if (university !== undefined) user.university = university;
  if (role) user.role = role;
  if (avatar) user.avatar = avatar;

  res.json({ message: 'Profile updated successfully', user });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

// Favorites / Saved Listings Routes
// GET /api/favorites
app.get('/api/favorites', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const ids = user ? user.savedListingIds : [];
  const savedListings = listings.filter((l) => ids.includes(l.id));
  res.json({
    ids,
    listings: savedListings
  });
});

// POST /api/favorites/:listingId
app.post('/api/favorites/:listingId', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { listingId } = req.params;

  if (user) {
    if (!user.savedListingIds.includes(listingId)) {
      user.savedListingIds.push(listingId);
    }
    return res.json({ message: 'Saved to favorites', savedIds: user.savedListingIds });
  }

  res.json({ message: 'Saved to session', listingId });
});

// DELETE /api/favorites/:listingId
app.delete('/api/favorites/:listingId', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { listingId } = req.params;

  if (user) {
    user.savedListingIds = user.savedListingIds.filter((id) => id !== listingId);
    return res.json({ message: 'Removed from favorites', savedIds: user.savedListingIds });
  }

  res.json({ message: 'Removed from session', listingId });
});

// Inquiries Routes
// GET /api/inquiries
app.get('/api/inquiries', (req: Request, res: Response) => {
  const { listingId, email } = req.query;
  let results = [...inquiries];

  if (listingId) {
    results = results.filter((i) => i.listingId === listingId);
  }

  if (email) {
    results = results.filter((i) => i.tenantEmail.toLowerCase() === (email as string).toLowerCase());
  }

  res.json({
    count: results.length,
    inquiries: results
  });
});

// POST /api/inquiries
app.post('/api/inquiries', async (req: Request, res: Response) => {
  const { listingId, tenantName, tenantEmail, message } = req.body;
  if (!listingId || !message) {
    return res.status(400).json({ error: 'listingId and message are required' });
  }

  const targetListing = listings.find((l) => l.id === listingId);

  const newInquiry: Inquiry = {
    id: `inq-${Date.now()}`,
    listingId,
    tenantName: tenantName || 'Prospective Tenant',
    tenantEmail: tenantEmail || 'tenant@relok8.online',
    message,
    createdAt: new Date().toISOString(),
    status: 'pending',
    replies: [
      {
        sender: 'Relok8 Handover Coordinator',
        text: `We have notified ${targetListing ? targetListing.departingTenant.name : 'the tenant'} about your request. You will receive an email notification when they reply.`,
        sentAt: new Date().toISOString()
      }
    ]
  };

  inquiries.push(newInquiry);

  // Dispatch email notification to landlord/departing tenant via Resend
  const recipientEmail = targetListing?.landlordContactEmail || 'info@relok8.online';
  const listingTitle = targetListing?.title || 'Relok8 Housing Listing';
  const listingUrl = `https://relok8.online/listing/${listingId}`;

  const emailResult = await sendResendEmail({
    to: recipientEmail,
    reply_to: newInquiry.tenantEmail,
    subject: `New Tenant Inquiry: ${listingTitle}`,
    html: buildInquiryEmailHtml({
      listingTitle,
      studentName: newInquiry.tenantName,
      studentEmail: newInquiry.tenantEmail,
      message,
      listingUrl
    })
  });

  res.status(201).json({
    message: 'Inquiry successfully transmitted to outgoing tenant',
    inquiry: newInquiry,
    emailDelivery: emailResult
  });
});

// POST /api/contact - Tied directly to info@relok8.online
app.post('/api/contact', async (req: Request, res: Response) => {
  const { name, email, subject, message, topic } = req.body;
  if (!email || !message) {
    return res.status(400).json({ error: 'Email and message are required' });
  }

  const contactRecord = {
    id: `contact-${Date.now()}`,
    targetEmail: 'info@relok8.online',
    senderName: name || email.split('@')[0],
    senderEmail: email,
    subject: subject || 'Direct Contact Form Inquiry',
    topic: topic || 'General Support',
    message,
    sentAt: new Date().toISOString(),
    status: 'delivered'
  };

  console.log('[Relok8 Dispatch] Email contact submitted for info@relok8.online:', contactRecord);

  // Store into inquiries queue as well so admins and support can query it
  inquiries.push({
    id: contactRecord.id,
    listingId: 'support-direct',
    tenantName: contactRecord.senderName,
    tenantEmail: contactRecord.senderEmail,
    message: `[${contactRecord.subject}] ${contactRecord.message}`,
    createdAt: contactRecord.sentAt,
    status: 'pending',
    replies: [
      {
        sender: 'Relok8 Support Desk (info@relok8.online)',
        text: 'Thank you for reaching out. We have logged your request and our lease specialists will follow up shortly.',
        sentAt: new Date().toISOString()
      }
    ]
  });

  // Dispatch email via Resend to info@relok8.online
  const emailResult = await sendResendEmail({
    to: 'info@relok8.online',
    reply_to: contactRecord.senderEmail,
    subject: `[Relok8 Help Center] ${contactRecord.subject}`,
    html: buildContactSupportHtml({
      name: contactRecord.senderName,
      email: contactRecord.senderEmail,
      subject: contactRecord.subject,
      topic: contactRecord.topic,
      message: contactRecord.message
    })
  });

  res.status(200).json({
    success: true,
    message: 'Your message has been delivered to info@relok8.online. We typically reply within 1-2 business hours.',
    record: contactRecord,
    emailDelivery: emailResult
  });
});

// POST /api/inquiries/:id/reply
app.post('/api/inquiries/:id/reply', async (req: Request, res: Response) => {
  const inquiry = inquiries.find((i) => i.id === req.params.id);
  if (!inquiry) {
    return res.status(404).json({ error: 'Inquiry not found' });
  }

  const { sender, text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Reply text is required' });
  }

  if (!inquiry.replies) inquiry.replies = [];
  const replyObj = {
    sender: sender || 'User',
    text,
    sentAt: new Date().toISOString()
  };
  inquiry.replies.push(replyObj);

  // Dispatch notification email to prospective tenant via Resend
  let emailDelivery = null;
  if (inquiry.tenantEmail) {
    const targetListing = listings.find((l) => l.id === inquiry.listingId);
    emailDelivery = await sendResendEmail({
      to: inquiry.tenantEmail,
      subject: `Reply to your inquiry on Relok8 (${targetListing?.title || 'Listing'})`,
      html: buildInquiryReplyHtml({
        listingTitle: targetListing?.title || 'Your inquiry on Relok8',
        senderName: replyObj.sender,
        replyText: text
      })
    });
  }

  res.status(201).json({
    message: 'Reply posted',
    reply: replyObj,
    inquiry,
    emailDelivery
  });
});

// GET /api/email/status - Check Resend configuration & readiness
app.get('/api/email/status', (_req: Request, res: Response) => {
  res.json({
    provider: 'Resend',
    configured: isResendConfigured(),
    defaultFrom: process.env.RESEND_FROM_EMAIL || 'Relok8 <notifications@relok8.online>',
    mode: isResendConfigured() ? 'live' : 'simulation',
    hint: isResendConfigured()
      ? 'Resend API key is active and ready for live email dispatch'
      : 'Set RESEND_API_KEY in .env to enable live delivery. In simulation mode, emails are logged and receipts generated.'
  });
});

// POST /api/email/send - Direct transactional email dispatch
app.post('/api/email/send', async (req: Request, res: Response) => {
  const { to, subject, html, text, from, reply_to } = req.body;
  if (!to || !subject || (!html && !text)) {
    return res.status(400).json({ error: 'Missing required parameters: to, subject, and either html or text' });
  }

  const result = await sendResendEmail({
    to,
    subject,
    html,
    text,
    from,
    reply_to
  });

  res.status(result.status === 'error' ? 500 : 200).json(result);
});

// Cesja Legal Protocol & Templates
// GET /api/cesja/templates
app.get('/api/cesja/templates', (_req: Request, res: Response) => {
  res.json({
    legalBasis: 'Art. 509 Kodeksu Cywilnego (Polish Civil Code)',
    description: 'Bilingual Lease Assignment Protocol (Cesja umowy najmu) compliant with Polish tenancy regulations.',
    requiredElements: [
      'Identification of Outgoing Tenant (Dotychczasowy Najemca)',
      'Identification of Incoming Tenant (Nowy Najemca)',
      'Written Landlord Approval (Pisemna zgoda Wynajmującego)',
      'Original Lease Contract Identifier (Data i numer umowy pierwotnej)',
      'Security Deposit Settlement Protocol (Protokół rozliczenia kaucji)',
      'Meter Reading Handover Checklist (Stan liczników: prąd, woda, gaz, ogrzewanie)',
      'Confirmation of Address Registration Rights (Zgoda na zameldowanie na pobyt czasowy)'
    ],
    sampleClauses: {
      assignmentClausePl: 'Z dniem wskazanym w Protokole Nowy Najemca wstępuje we wszelkie prawa i obowiązki Dotychczasowego Najemcy wynikające z Umowy Najmu (Art. 509 KC).',
      assignmentClauseEn: 'As of the handover date specified herein, the Incoming Tenant assumes all rights and obligations of the Departing Tenant arising from the Lease Agreement (Art. 509 of the Polish Civil Code).',
      depositClausePl: 'Kaucja gwarancyjna wpłacona przez Dotychczasowego Najemcę zostaje rozliczona bezpośrednio lub przeniesiona za zgodą Wynajmującego.',
      depositClauseEn: 'The security deposit paid by the Departing Tenant is settled directly between parties or transferred under landlord supervision.'
    }
  });
});

// POST /api/cesja/generate
app.post('/api/cesja/generate', (req: Request, res: Response) => {
  const { departingTenant, incomingTenant, landlordName, address, rentPLN, depositPLN, handoverDate } = req.body;

  const protocolId = `CESJA-KC509-${Date.now().toString().slice(-6)}`;
  res.json({
    protocolId,
    legalBasis: 'Art. 509 Kodeksu Cywilnego (Polish Civil Code)',
    status: 'generated',
    createdAt: new Date().toISOString(),
    summary: {
      departingTenant,
      incomingTenant,
      landlordName,
      address,
      rentPLN,
      depositPLN,
      handoverDate,
      addressRegistrationPermitted: true,
      downloadUrl: `/api/cesja/download/${protocolId}`
    }
  });
});

// POST /api/calculator/break-fee
app.post('/api/calculator/break-fee', (req: Request, res: Response) => {
  const { monthlyRentPLN, remainingMonths, depositPLN } = req.body;
  const rent = Number(monthlyRentPLN) || 2500;
  const months = Number(remainingMonths) || 4;
  const deposit = Number(depositPLN) || rent;

  // Under typical Polish fixed-term lease (najem na czas oznaczony):
  // Breaking early without replacement tenant often leads to loss of deposit + 1-3 months rent compensation
  const standardPenaltyLoss = deposit + Math.min(months, 2) * rent;
  // With Relok8 assignment under Art. 509 KC:
  const feeThroughRelok8 = 0; // 100% free for outgoing tenant
  const netSavedPLN = standardPenaltyLoss - feeThroughRelok8;

  res.json({
    monthlyRentPLN: rent,
    remainingMonths: months,
    depositPLN: deposit,
    standardPenaltyLoss,
    feeThroughRelok8,
    netSavedPLN,
    recommendation: 'Transfer your active lease directly to incoming verified student or expat to recover 100% of your deposit and avoid landlord litigation.'
  });
});

// ==============================================================================
// RELOK8 AI GATEWAY (Slice A)
// ==============================================================================

// POST /api/ai-gateway - Central model execution route
app.post('/api/ai-gateway', async (req: Request, res: Response) => {
  const { task, input, input_ref, entity_type, entity_id } = req.body;
  if (!task || !input) {
    return res.status(400).json({ error: 'Missing required parameters: task and input' });
  }

  const validTasks = [
    'extract_listing',
    'moderate_listing',
    'parse_search',
    'translate',
    'draft_reply',
    'parse_consent_reply'
  ];

  if (!validTasks.includes(task)) {
    return res.status(400).json({
      error: `Invalid task "${task}". Supported tasks: ${validTasks.join(', ')}`
    });
  }

  try {
    const result = await executeAIGateway({
      task,
      input,
      input_ref,
      entity_type,
      entity_id
    });
    res.json(result);
  } catch (err: any) {
    console.error('[AI Gateway Server Error]', err);
    res.status(500).json({ error: err.message || 'Internal AI Gateway error' });
  }
});

// GET /api/ai-gateway/runs - Audit log of all AI runs
app.get('/api/ai-gateway/runs', (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  res.json({
    count: getAIRuns().length,
    runs: getAIRuns(limit)
  });
});

// GET /api/ai-gateway/review-queue - Triage items requiring human review
app.get('/api/ai-gateway/review-queue', (req: Request, res: Response) => {
  const status = req.query.status as any;
  const items = getReviewQueue(status);
  res.json({
    count: items.length,
    items
  });
});

// POST /api/ai-gateway/review-queue/:id/resolve - Human approval/rejection/edit
app.post('/api/ai-gateway/review-queue/:id/resolve', (req: Request, res: Response) => {
  const { status, reviewer, final_decision } = req.body;
  if (!status || !reviewer) {
    return res.status(400).json({ error: 'status and reviewer are required' });
  }

  const updated = resolveReviewQueueItem(req.params.id, {
    status,
    reviewer,
    final_decision
  });

  if (!updated) {
    return res.status(404).json({ error: 'Review queue item not found' });
  }

  res.json({
    message: 'Review item resolved',
    item: updated
  });
});

// Vite middleware for dev or Static serve for production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.use(express.static(path.join(__dirname, 'public')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Relok8 Full-Stack Server running on port ${PORT}`);
  });
}

startServer();
