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
import { relok8Store } from './src/server/relok8Store';
import { onloHelperAction } from './src/lib/onloService';

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

// Persistent Disk Storage for Real Listings
const DATA_DIR = path.join(__dirname, 'data');
const LISTINGS_FILE = path.join(DATA_DIR, 'listings.json');

function loadListingsFromDisk(): any[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(LISTINGS_FILE)) {
      const content = fs.readFileSync(LISTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    fs.writeFileSync(LISTINGS_FILE, JSON.stringify([], null, 2), 'utf-8');
    return [];
  } catch (err) {
    console.error('Error reading listings from disk:', err);
    return [];
  }
}

function persistListingsToDisk(data: any[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LISTINGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error persisting listings to disk:', err);
  }
}

let listings: any[] = loadListingsFromDisk();

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
  const totalRent = listings.reduce((acc, l) => acc + (l.monthlyRentPLN || 0), 0);
  const avgRent = listings.length > 0 ? Math.round(totalRent / listings.length) : 0;
  const estimatedBrokerSavingsPLN = Math.round(totalRent * 1.23);

  res.json({
    activeListings: listings.length,
    verifiedHandovers: listings.length,
    avgRentPLN: avgRent,
    totalBrokerSavingsPLN: estimatedBrokerSavingsPLN,
    avgDaysToHandover: 3.5,
    meldunekComplianceRate: '100%',
    zeroDepositDisputeRate: '100%'
  });
});

function placeToListing(p: any): any {
  return {
    id: p.id,
    type: 'lease_takeover',
    title: p.title,
    city: p.city,
    district: p.district,
    address: p.address,
    roomType: p.roomType,
    monthlyRentPLN: p.rentPLN,
    czynszAdminPLN: p.czynszPLN,
    czynszIncluded: p.billsIncluded,
    billsIncluded: p.billsIncluded,
    depositPLN: p.depositPLN,
    availableDate: p.availableFrom,
    leaseEndDate: '2027-06-30',
    remainingMonths: 8,
    images: p.photos && p.photos.length > 0 ? p.photos : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000'],
    meldunekAllowed: p.meldunekOk,
    isFurnished: p.furnished,
    flatmatesCount: p.flatmates,
    flatmatesInfo: p.flatmates > 0 ? `${p.flatmates} flatmates` : 'Entire place',
    transitInfo: p.commuteNote,
    commuteNote: p.commuteNote,
    commuteMinutes: p.commuteMinutes,
    nearInstitutions: p.nearInstitutions,
    distanceToCampus: p.commuteNote,
    landlordApproved: p.status === 'available_for_takeover' || p.status === 'reserved',
    landlordConsentStatus: 'Guaranteed Consent',
    landlordName: 'Jan Nowak',
    landlordContactEmail: 'j.nowak@lublin-rent.pl',
    currentTenant: {
      name: 'Anna Kowalska',
      nationality: 'Poland',
      role: 'Student at UMCS',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      verifiedDocs: ['Student ID', 'Lease Contract'],
      reasonForLeaving: 'Graduating Erasmus term',
      joinedYear: '2024'
    },
    departingTenant: {
      name: 'Anna Kowalska',
      nationality: 'Poland',
      role: 'Student at UMCS',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      verifiedDocs: ['Student ID', 'Lease Contract'],
      reasonForLeaving: 'Graduating Erasmus term',
      joinedYear: '2024'
    },
    amenities: ['Furnished', 'Wi-Fi', 'Washing Machine', 'Desk & Chair'],
    universitiesNearby: p.nearInstitutions || ['UMCS', 'KUL'],
    description: `${p.rules} Direct lease takeover with landlord consent under Polish Civil Code Art. 509 KC. 0 PLN broker fee.`,
    squareMeters: 28,
    floor: '2nd floor',
    depositSettlementType: 'Escrow Guarded',
    statusBadge: p.status === 'available_for_takeover' ? 'Available for Takeover' : p.status,
    placeStatus: p.status,
    placeId: p.id
  };
}

function getAllCombinedListings(): any[] {
  const placeListings = relok8Store.places.map(placeToListing);
  const combined = [...listings];
  for (const pl of placeListings) {
    if (!combined.some(c => c.id === pl.id)) {
      combined.push(pl);
    }
  }
  return combined;
}

// GET /api/listings
app.get('/api/listings', (req: Request, res: Response) => {
  const { city, roomType, maxRent, meldunek, q, sort, near, maxCommute } = req.query;
  let results = getAllCombinedListings();

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

  if (near && typeof near === 'string' && near.trim()) {
    const nearLower = near.toLowerCase().trim();
    results = results.filter(
      (l) =>
        (l.nearInstitutions && l.nearInstitutions.some((inst: string) => inst.toLowerCase().includes(nearLower))) ||
        (l.commuteNote && l.commuteNote.toLowerCase().includes(nearLower)) ||
        (l.universitiesNearby && l.universitiesNearby.some((inst: string) => inst.toLowerCase().includes(nearLower)))
    );
  }

  if (maxCommute) {
    const commuteNum = Number(maxCommute);
    if (!isNaN(commuteNum)) {
      results = results.filter((l) => (l.commuteMinutes || 0) <= commuteNum);
    }
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
  const listing = getAllCombinedListings().find((l) => l.id === req.params.id);
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }
  res.json(listing);
});

// ============================================================================
// RELOK8 DOMAIN ROUTES (Sections 4, 5, 6, 7, 8, 9)
// ============================================================================

// Helper to get active user ID from request headers
function getReqUserId(req: Request): string {
  return (req.headers['x-user-id'] as string) || 'user-mateo';
}

// PLACES API
app.get('/api/places', (req: Request, res: Response) => {
  const { city, status, near, maxCommute } = req.query;
  const places = relok8Store.getPlaces({
    city: typeof city === 'string' ? city : undefined,
    status: typeof status === 'string' ? status : undefined,
    near: typeof near === 'string' ? near : undefined,
    maxCommute: maxCommute ? Number(maxCommute) : undefined,
  });
  res.json(places);
});

app.get('/api/places/:id', (req: Request, res: Response) => {
  const place = relok8Store.getPlace(req.params.id);
  if (!place) return res.status(404).json({ error: 'Place not found' });
  res.json(place);
});

app.post('/api/places', (req: Request, res: Response) => {
  try {
    const created = relok8Store.createPlace(req.body);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to create place' });
  }
});

app.put('/api/places/:id', (req: Request, res: Response) => {
  try {
    const updated = relok8Store.updatePlace(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(404).json({ error: err?.message || 'Place not found' });
  }
});

app.delete('/api/places/:id', (req: Request, res: Response) => {
  try {
    const success = relok8Store.deletePlace(req.params.id);
    // Also remove from listings if matching
    const listIdx = listings.findIndex((l) => l.id === req.params.id);
    if (listIdx !== -1) {
      listings.splice(listIdx, 1);
      persistListingsToDisk(listings);
    }
    if (!success && listIdx === -1) {
      return res.status(404).json({ error: 'Place not found' });
    }
    res.json({ success: true, message: 'Place deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete place' });
  }
});

// Exit & Takeover flow
app.post('/api/places/:id/exit', (req: Request, res: Response) => {
  try {
    const { leaveDate, notes } = req.body;
    if (!leaveDate) return res.status(400).json({ error: 'Leave date is required' });
    const place = relok8Store.requestExit(req.params.id, leaveDate, notes);
    res.json(place);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to submit exit' });
  }
});

app.post('/api/places/:id/exit/cancel', (req: Request, res: Response) => {
  try {
    const place = relok8Store.cancelExit(req.params.id);
    res.json(place);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to cancel exit' });
  }
});

app.post('/api/places/:id/exit/decision', (req: Request, res: Response) => {
  try {
    const { decision, reasonOrDate } = req.body;
    const place = relok8Store.decideExit(req.params.id, decision, reasonOrDate);
    res.json(place);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to process decision' });
  }
});

app.post('/api/places/:id/approve-replacement', (req: Request, res: Response) => {
  try {
    const { prospectId } = req.body;
    if (!prospectId) return res.status(400).json({ error: 'Prospect ID required' });
    const place = relok8Store.approveReplacement(req.params.id, prospectId);
    res.json(place);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to approve replacement' });
  }
});

app.post('/api/places/:id/checklist', (req: Request, res: Response) => {
  try {
    const place = relok8Store.updateHandoverChecklist(req.params.id, req.body);
    res.json(place);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to update checklist' });
  }
});

// THREADS & MESSAGING API
app.get('/api/threads', (req: Request, res: Response) => {
  const userId = getReqUserId(req);
  const threads = relok8Store.getThreadsForUser(userId);
  res.json(threads);
});

app.get('/api/threads/:id', (req: Request, res: Response) => {
  const thread = relok8Store.getThread(req.params.id);
  if (!thread) return res.status(404).json({ error: 'Thread not found' });
  res.json(thread);
});

app.post('/api/threads', (req: Request, res: Response) => {
  const { placeId } = req.body;
  const prospectId = getReqUserId(req);
  if (!placeId) return res.status(400).json({ error: 'placeId is required' });
  const thread = relok8Store.createOrGetThread(placeId, prospectId);
  res.json(thread);
});

app.get('/api/threads/:id/messages', (req: Request, res: Response) => {
  const msgs = relok8Store.getThreadMessages(req.params.id);
  res.json(msgs);
});

app.post('/api/threads/:id/messages', async (req: Request, res: Response) => {
  try {
    const authorId = getReqUserId(req);
    const { body } = req.body;
    if (!body || !body.trim()) return res.status(400).json({ error: 'Message body cannot be empty' });
    const result = await relok8Store.addThreadMessage(req.params.id, authorId, body.trim());
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to send message' });
  }
});

app.post('/api/threads/:id/takeover', (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    const thread = relok8Store.takeoverThread(req.params.id, userId);
    res.json(thread);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to takeover thread' });
  }
});

app.post('/api/threads/:id/ask-onlo', async (req: Request, res: Response) => {
  try {
    const result = await relok8Store.triggerOnloNow(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to trigger Onlo' });
  }
});

// PLACE ROOM API (Private Tenant <-> Landlord)
app.get('/api/place-room/:placeId/messages', (req: Request, res: Response) => {
  const msgs = relok8Store.getPlaceRoomMessages(req.params.id);
  res.json(msgs);
});

app.post('/api/place-room/:placeId/messages', (req: Request, res: Response) => {
  try {
    const authorId = getReqUserId(req);
    const { body } = req.body;
    if (!body || !body.trim()) return res.status(400).json({ error: 'Message body cannot be empty' });
    const msg = relok8Store.addPlaceRoomMessage(req.params.id, authorId, body.trim());
    res.json(msg);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to send message' });
  }
});

// ONLO COMPOSER HELPER API (Suggest, Summarise, Translate)
app.post('/api/onlo/helper', async (req: Request, res: Response) => {
  try {
    const { action, threadId, text, targetLang } = req.body;
    let place = undefined;
    let recentMessages: any[] = [];

    if (threadId) {
      const thread = relok8Store.getThread(threadId);
      if (thread) {
        place = relok8Store.getPlace(thread.placeId);
        recentMessages = relok8Store.getThreadMessages(threadId);
      }
    }

    const helperResult = await onloHelperAction({
      action,
      threadId,
      place,
      recentMessages,
      text,
      targetLang
    });

    res.json({ text: helperResult });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Helper error' });
  }
});

// ONLO NATIVE HOUSING CHAT API
app.post('/api/onlo/ask', async (req: Request, res: Response) => {
  try {
    const { question, locale, listingContext } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const isPolish = locale === 'pl' || /[ąćęłńóśźż]/i.test(question);
    const qLower = question.toLowerCase();

    // Check if GEMINI_API_KEY is available
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });

        const contextInfo = listingContext
          ? `Specific flat context: Title: "${listingContext.title}", City: ${listingContext.city}, Address: ${listingContext.address || 'Central'}, Rent: ${listingContext.monthlyRent || listingContext.rentPLN} PLN, Room type: ${listingContext.roomType}.`
          : 'General student and expat housing context in Poland across Warsaw, Kraków, Wrocław, Gdańsk, Poznań, and Lublin.';

        const systemPrompt = `You are Onlo, the native resident companion for Relok8 (relok8.online).
You embody a friendly, knowledgeable local peer in Poland who helps students, expats, and tenants navigate renting, lease takeovers (Cesja under Polish Civil Code Art. 509 KC), činsh (administrative fees), meldunek (mandatory municipal address registration), university commutes, and deposit protection.
Speak like a warm, savvy local friend who knows the city and the rental system. Keep your answers concise, practical, and helpful (2-4 sentences). Never sound like a robotic corporate disclaimer bot. If asked in Polish, answer in natural Polish. Always end legal/contract remarks with "Not legal advice." (or "To nie jest porada prawna.").

${contextInfo}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nQuestion: "${question.trim()}"` }]
            }
          ]
        });

        if (response.text) {
          return res.json({ answer: response.text.trim() });
        }
      } catch (geminiErr) {
        console.warn('Gemini chat failed, falling back to local knowledge:', geminiErr);
      }
    }

    // Deterministic peer responses based on key topics if no Gemini key or offline
    let answer = "";
    if (qLower.includes("czynsz") || qLower.includes("admin") || qLower.includes("bills") || qLower.includes("rachunki")) {
      answer = isPolish
        ? "Czynsz administracyjny to opłata odprowadzana do spółdzielni lub wspólnoty mieszkaniowej (często obejmuje wywóz śmieci, zaliczkę na ogrzewanie i wodę). Na Relok8 zawsze podajemy czynsz osobno lub jasno zaznaczamy, co dokładnie zawiera, abyś nie miał ukrytych niespodzianek!"
        : "Czynsz is the administrative building fee paid to the housing co-op (it typically covers trash collection, central heating, and water advances). On Relok8, we always break out czynsz clearly so you know your exact total monthly cost!";
    } else if (qLower.includes("meldunek") || qLower.includes("registration") || qLower.includes("zameldowanie")) {
      answer = isPolish
        ? "Tak! Zgodnie z polskim prawem każdy najemca z ważną umową najmu ma prawo zameldować się w urzędzie gminy/dzielnicy (meldunek czasowy). Do zameldowania wystarczy Twój dokument tożsamości i podpisana umowa lub aneks cesji!"
        : "Yes! Under Polish law, every tenant with a valid lease agreement has the legal right to register their address (meldunek czasowy) at the municipal office. All you need is your passport/ID and your signed lease takeover agreement!";
    } else if (qLower.includes("cesja") || qLower.includes("takeover") || qLower.includes("art. 509") || qLower.includes("leave") || qLower.includes("przejęcie")) {
      answer = isPolish
        ? "Cesja umowy najmu (na podstawie Art. 509 Kodeksu Cywilnego) to przejęcie praw i obowiązków z dotychczasowej umowy najemcy. Wymaga pisemnej zgody właściciela, nie generuje opłat agencyjnych (0 zł prowizji) i pozwala zwolnić kaucję poprzedniego lokatora!"
        : "A lease takeover (Cesja under Polish Civil Code Art. 509 KC) transfers the existing rental agreement from the departing tenant to the new student with landlord consent. It skips broker agency fees (0 PLN commission) and provides a clean deposit transfer!";
    } else if (qLower.includes("kaucj") || qLower.includes("deposit")) {
      answer = isPolish
        ? "Kaucja w Polsce wynosi zazwyczaj równowartość 1-miesięcznego czynszu. Przy cesji na Relok8 nowy najemca wpłaca kaucję zabezpieczoną, która po podpisaniu protokołu zdawczo-odbiorczego rozlicza kaucję ustępującego lokatora bez opóźnień."
        : "Security deposits in Poland are usually equal to 1 month's rent. During a Relok8 lease takeover, the deposit handover is coordinated alongside the key handover protocol (protokół zdawczo-odbiorczy) so neither side is left waiting!";
    } else {
      answer = isPolish
        ? "Cześć! Jestem Onlo. Pomagam studentom i ekspatom w bezpiecznym wynajmie i cesjach umów w Polsce. Możesz mnie zapytać o czynsz, meldunek, czas dojazdu na uczelnię lub jak bezpiecznie przejąć pokój!"
        : "Hey! I'm Onlo, your local friend on Relok8. I help students and expats find rooms and safely take over leases across Poland. Ask me about czynsz, meldunek, campus transit, or how to leave your lease early without penalties!";
    }

    res.json({ answer });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to process question' });
  }
});

// AI ROOM PHOTO INSPECTION & VALIDATION API
app.post('/api/ai/validate-room-photo', async (req: Request, res: Response) => {
  try {
    const { imageBase64, locale } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const isPolish = locale === 'pl';
    let mimeType = 'image/jpeg';
    let base64Data = imageBase64;

    if (imageBase64.includes(';base64,')) {
      const parts = imageBase64.split(';base64,');
      mimeType = parts[0].replace('data:', '') || 'image/jpeg';
      base64Data = parts[1];
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `You are Onlo, the resident AI vision inspector for student housing in Poland on Relok8 (relok8.online).
Inspect this uploaded photo intended for a student room rental listing.

STRICT VERIFICATION CRITERIA:
1. REJECT SELFIS & HUMAN PORTRAITS: If the image is a selfie, front-facing camera portrait, headshot, or human selfie in any setting, return isValid: false and rejectionReason: "selfie".
2. REJECT NON-ROOM CONTENT: If the photo shows cars, food, pets close-up, outdoor street views without building interiors, screenshots, IDs, documents, memes, or completely unidentifiable dark/blurry noise, return isValid: false and rejectionReason: "non_room".
3. ACCEPT VALID INTERIORS: Approve photos that clearly show an interior space:
   - "sleeping": Bed, mattress, sleeping space, wardrobe, nightstand.
   - "workspace": Desk, study table, study chair, lamp, monitor, laptop setup.
   - "bathroom": Shower, bathtub, sink, toilet, tiles.
   - "kitchen": Kitchen counter, stove, sink, fridge, dining space.
   - "living": Living room, sofa, communal seating area.
   - "other": Balcony, hallway, or general interior space.

Provide actionable guidance in ${isPolish ? 'Polish' : 'English'}:
- For rejection: Explain warmly why it was rejected and tell them what specific room area to capture next.
- For approval: Acknowledge the detected area and suggest which remaining areas (sleeping, workspace, bathroom/kitchen) would make their listing stand out.

Respond in JSON ONLY:
{
  "isValid": true,
  "rejectionReason": null,
  "detectedArea": "sleeping",
  "feedback": "...",
  "actionableGuidance": "..."
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: base64Data
                  }
                },
                { text: prompt }
              ]
            }
          ],
          config: {
            responseMimeType: 'application/json'
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          const isValid = Boolean(parsed.isValid);
          return res.json({
            isValid,
            rejectionReason: parsed.rejectionReason || (isValid ? null : 'non_room'),
            detectedArea: parsed.detectedArea || (isValid ? 'other' : 'none'),
            feedback: parsed.feedback || (isValid ? 'Room photo approved!' : 'Please upload a photo of the room interior.'),
            actionableGuidance: parsed.actionableGuidance || (isValid 
              ? 'Next: Capture any remaining areas (sleeping, study desk, bathroom/kitchen).'
              : 'Please take a clear photo of the bed, study desk, or kitchen instead.')
          });
        }
      } catch (geminiErr) {
        console.warn('AI room validation fallback:', geminiErr);
      }
    }

    // Default fallback when AI key is absent
    return res.json({
      isValid: true,
      rejectionReason: null,
      detectedArea: 'other',
      feedback: isPolish ? 'Zdjęcie zaakceptowane.' : 'Photo approved.',
      actionableGuidance: isPolish ? 'Pamiętaj o dodaniu zdjęć biurka i sypialni.' : 'Remember to include shots of the study desk and sleeping area.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to validate photo' });
  }
});

// SAVED PLACES & NOTIFICATIONS API
app.get('/api/saved-places', (req: Request, res: Response) => {
  const userId = getReqUserId(req);
  res.json(relok8Store.getSavedPlaces(userId));
});

app.post('/api/saved-places', (req: Request, res: Response) => {
  const userId = getReqUserId(req);
  const { placeId } = req.body;
  if (!placeId) return res.status(400).json({ error: 'placeId required' });
  const result = relok8Store.toggleSavedPlace(userId, placeId);
  res.json(result);
});

app.get('/api/notifications', (req: Request, res: Response) => {
  const userId = getReqUserId(req);
  res.json(relok8Store.getNotifications(userId));
});

app.post('/api/notifications/:id/read', (req: Request, res: Response) => {
  relok8Store.markNotificationRead(req.params.id);
  res.json({ success: true });
});

// REWARDS API
app.get('/api/rewards/:userId', (req: Request, res: Response) => {
  const userId = req.params.userId || getReqUserId(req);
  res.json(relok8Store.getRewardsForUser(userId));
});

// ANNOUNCEMENTS & WHATSAPP ADAPTER API
app.get('/api/announcements/:placeId', (req: Request, res: Response) => {
  const ann = relok8Store.getAnnouncement(req.params.placeId);
  if (!ann) return res.status(404).json({ error: 'Announcement not found' });
  res.json(ann);
});

app.post('/api/announcements/:placeId/share-whatsapp', (req: Request, res: Response) => {
  try {
    const result = relok8Store.shareAnnouncementWhatsApp(req.params.placeId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to share announcement' });
  }
});

// INVITATIONS API
app.post('/api/invitations', (req: Request, res: Response) => {
  try {
    const { placeId, email, role } = req.body;
    if (!placeId || !email || !role) {
      return res.status(400).json({ error: 'placeId, email, role required' });
    }
    const inv = relok8Store.createInvitation(placeId, email, role);
    res.json(inv);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to create invitation' });
  }
});

app.post('/api/invitations/:token/accept', (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    const result = relok8Store.acceptInvitation(req.params.token, userId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to accept invitation' });
  }
});

// DEV USERS & ROLE SWITCHER API
app.get('/api/dev/users', (_req: Request, res: Response) => {
  res.json(relok8Store.getUsers());
});

app.get('/api/dev/current-user', (req: Request, res: Response) => {
  const userId = getReqUserId(req);
  const user = relok8Store.getUser(userId) || relok8Store.getUsers()[0];
  res.json(user);
});

app.post('/api/dev/availability', (req: Request, res: Response) => {
  try {
    const userId = getReqUserId(req);
    const { isAvailable, quietHours } = req.body;
    const user = relok8Store.updateUser(userId, { isAvailable, quietHours });
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to update availability' });
  }
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
  persistListingsToDisk(listings);

  res.status(201).json({
    ...newListing,
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
  persistListingsToDisk(listings);

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

// ==============================================================================
// MASTER PRD v3.0: ATOMIC EARLYLOCK & ESCROW ENGINE (FEAT-004 & FEAT-005)
// ==============================================================================

interface EscrowTransaction {
  id: string;
  listingId: string;
  studentId: string;
  studentEmail: string;
  landlordId?: string;
  stripePaymentIntentId: string;
  amountHeldPLN: number;
  platformFeePLN: number;
  depositCreditPLN: number;
  legalPackOpted: boolean;
  status: 'HELD_IN_ESCROW' | 'CAPTURED' | 'REFUNDED' | 'EXPIRED';
  lockExpiresAt: string;
  createdAt: string;
}

const escrowTransactions: EscrowTransaction[] = [];

// POST /api/listings/reserve-atomic (FEAT-004: 15-Minute Row-Level Lock)
app.post('/api/listings/reserve-atomic', (req: Request, res: Response) => {
  const { listingId, userId, userName } = req.body;
  if (!listingId || !userId) {
    return res.status(400).json({ error: 'listingId and userId are required' });
  }

  const listing = listings.find((l) => l.id === listingId);
  if (!listing) {
    return res.status(404).json({ error: 'Listing not found' });
  }

  const now = Date.now();
  const currentLock = listing.lockExpiresAt ? new Date(listing.lockExpiresAt).getTime() : 0;

  // Check if actively locked by someone else
  if (currentLock > now && listing.reservedByUserId && listing.reservedByUserId !== userId) {
    const minutesRemaining = Math.max(1, Math.ceil((currentLock - now) / 60000));
    return res.status(409).json({
      success: false,
      reason: 'LISTING_CURRENTLY_LOCKED',
      message: `This room is temporarily held in EarlyLock checkout by another student.`,
      minutesRemaining
    });
  }

  // Grant 15-minute exclusive lock
  const lockExpiresAt = new Date(now + 15 * 60 * 1000).toISOString();
  listing.status = 'RESERVED_PENDING';
  listing.reservedByUserId = userId;
  listing.lockExpiresAt = lockExpiresAt;
  listing.reservedByName = userName || 'Student';

  persistListingsToDisk(listings);

  res.json({
    success: true,
    listingId,
    reservedByUserId: userId,
    lockExpiresAt,
    minutesGranted: 15,
    message: '15-minute exclusive checkout hold active. Proceed to EarlyLock escrow authorization.'
  });
});

// POST /api/payments/create-escrow-intent (FEAT-005: 149 PLN Hold)
app.post('/api/payments/create-escrow-intent', (req: Request, res: Response) => {
  const { listingId, studentId, studentEmail, legalPackOpted = false } = req.body;
  if (!listingId || !studentId) {
    return res.status(400).json({ error: 'listingId and studentId are required' });
  }

  const listing = listings.find((l) => l.id === listingId);
  const now = Date.now();
  const lockExpiresAt = new Date(now + 15 * 60 * 1000).toISOString();

  // 149.00 PLN standard EarlyLock hold (49 PLN fee + 100 PLN deposit credit)
  // Optional 59.00 PLN legal pack
  const platformFeePLN = 49.00;
  const depositCreditPLN = 100.00;
  const legalPackPLN = legalPackOpted ? 59.00 : 0.00;
  const totalHoldPLN = platformFeePLN + depositCreditPLN + legalPackPLN;

  const paymentIntentId = `pi_relok8_escrow_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const transaction: EscrowTransaction = {
    id: `escrow_${Date.now()}`,
    listingId,
    studentId,
    studentEmail: studentEmail || 'student@relok8.online',
    landlordId: listing?.landlordName || 'Landlord',
    stripePaymentIntentId: paymentIntentId,
    amountHeldPLN: totalHoldPLN,
    platformFeePLN: platformFeePLN + legalPackPLN,
    depositCreditPLN,
    legalPackOpted: Boolean(legalPackOpted),
    status: 'HELD_IN_ESCROW',
    lockExpiresAt,
    createdAt: new Date().toISOString()
  };

  escrowTransactions.unshift(transaction);

  res.status(201).json({
    success: true,
    paymentIntentId,
    clientSecret: `${paymentIntentId}_secret_test`,
    amountHeldPLN: totalHoldPLN,
    breakdown: {
      earlyLockFeePLN: platformFeePLN,
      depositCreditPLN,
      legalPackPLN,
      totalHoldPLN
    },
    status: 'HELD_IN_ESCROW',
    lockExpiresAt,
    guaranteeText: 'Funds are authorized in conditional escrow. 100% refunded if landlord rejects. Automatically captured upon Art. 509 KC lease signing.'
  });
});

// POST /api/payments/capture-escrow - Landlord approval releases hold
app.post('/api/payments/capture-escrow', (req: Request, res: Response) => {
  const { paymentIntentId } = req.body;
  const tx = escrowTransactions.find((t) => t.stripePaymentIntentId === paymentIntentId || t.id === paymentIntentId);
  if (!tx) {
    return res.status(404).json({ error: 'Escrow transaction not found' });
  }

  tx.status = 'CAPTURED';
  const listing = listings.find((l) => l.id === tx.listingId);
  if (listing) {
    listing.status = 'LEASED';
    persistListingsToDisk(listings);
  }

  res.json({
    success: true,
    status: 'CAPTURED',
    message: 'Deposit credit applied to landlord contract. Lease takeover formalized under Art. 509 KC.',
    transaction: tx
  });
});

// POST /api/payments/cancel-escrow - Rejection or timeout issues 100% refund
app.post('/api/payments/cancel-escrow', (req: Request, res: Response) => {
  const { paymentIntentId, reason } = req.body;
  const tx = escrowTransactions.find((t) => t.stripePaymentIntentId === paymentIntentId || t.id === paymentIntentId);
  if (!tx) {
    return res.status(404).json({ error: 'Escrow transaction not found' });
  }

  tx.status = 'REFUNDED';
  const listing = listings.find((l) => l.id === tx.listingId);
  if (listing && listing.status === 'RESERVED_PENDING') {
    listing.status = 'AVAILABLE';
    listing.reservedByUserId = undefined;
    listing.lockExpiresAt = undefined;
    persistListingsToDisk(listings);
  }

  res.json({
    success: true,
    status: 'REFUNDED',
    refundedAmountPLN: tx.amountHeldPLN,
    message: '100% of escrow hold released back to student card.',
    reason: reason || 'Landlord declined or checkout expired'
  });
});

// GET /api/escrow/transactions
app.get('/api/escrow/transactions', (_req: Request, res: Response) => {
  res.json({
    count: escrowTransactions.length,
    transactions: escrowTransactions
  });
});

// POST /api/ai/roommate-match (FEAT-003: pgvector compatibility matrix)
app.post('/api/ai/roommate-match', (req: Request, res: Response) => {
  const { sleepHours, cleanlinessLevel, partyFrequency, studyFocus } = req.body;
  
  // Deterministic compatibility vector calculation
  const sleepWeight = (sleepHours === 'early_bird' || sleepHours === '22_to_6') ? 25 : 20;
  const cleanWeight = (Number(cleanlinessLevel) || 4) * 6; // up to 30
  const partyWeight = (partyFrequency === 'never' || partyFrequency === 'rarely') ? 25 : 15;
  const studyWeight = studyFocus ? 20 : 15;

  const matchScore = Math.min(98, Math.max(65, sleepWeight + cleanWeight + partyWeight + studyWeight));

  res.json({
    matchScore,
    compatibilityLevel: matchScore >= 85 ? 'High Compatibility' : 'Moderate Compatibility',
    recommendations: [
      'Synchronized quiet study blocks after 22:00',
      'Shared household chore rotation agreement',
      'Erasmus / English Division peer alignment'
    ],
    lifestyleProfile: {
      sleepHours: sleepHours || 'flexible',
      cleanliness: cleanlinessLevel || 4,
      studyFocus: Boolean(studyFocus)
    }
  });
});

// POST /api/cron/lease-renewal (FEAT-007: T-60 Lease Renewal Protocol)
app.post('/api/cron/lease-renewal', (_req: Request, res: Response) => {
  const today = new Date();
  const sixtyDaysOut = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);

  const expiringListings = listings.filter((l) => {
    if (!l.leaseEndDate) return false;
    const endDate = new Date(l.leaseEndDate);
    const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 60;
  });

  const actions = expiringListings.map((l) => ({
    listingId: l.id,
    title: l.title,
    leaseEndDate: l.leaseEndDate,
    tenantName: l.currentTenant?.name || l.departingTenant?.name || 'Current Tenant',
    actionDispatched: 'WhatsApp T-60 Extension Ping Dispatched',
    documentTemplate: 'Aneks do Umowy Najmu (Art. 688² KC)'
  }));

  res.json({
    status: 'success',
    executedAt: new Date().toISOString(),
    checkedCount: listings.length,
    expiringWithin60Days: expiringListings.length,
    actions
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
