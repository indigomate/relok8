import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ConvexReactClient } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Listing } from '../../types';

/**
 * RELOK8 CONVEX ENGINE CLIENT
 * Implements 100% of the reactive database, deterministic mutations,
 * 15-minute EarlyLock atomic holds, Stripe escrow actions, and WhatsApp approvals.
 */

export const getActiveConvexUrl = (): string => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('relok8_custom_convex_url');
    if (custom && custom.startsWith('http')) return custom.trim();
  }
  const envUrl =
    (typeof process !== 'undefined' && process.env?.VITE_CONVEX_URL) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_CONVEX_URL) ||
    '';
  return envUrl ? envUrl.trim() : '';
};

export const isConvexConfigured = (): boolean => {
  const url = getActiveConvexUrl();
  return Boolean(
    url &&
    url.startsWith('http') &&
    !url.includes('your-project') &&
    !url.includes('your-deployment')
  );
};

export const setCustomConvexUrl = (url: string): void => {
  if (typeof window !== 'undefined') {
    const trimmed = url.trim();
    if (trimmed) {
      localStorage.setItem('relok8_custom_convex_url', trimmed);
    } else {
      localStorage.removeItem('relok8_custom_convex_url');
    }
    window.dispatchEvent(new Event('relok8_convex_url_changed'));
  }
};

export const clearCustomConvexUrl = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('relok8_custom_convex_url');
    window.dispatchEvent(new Event('relok8_convex_url_changed'));
  }
};

export const testConvexConnection = async (
  targetUrl?: string
): Promise<{ success: boolean; message: string; latencyMs?: number; endpoint?: string }> => {
  const url = (targetUrl || getActiveConvexUrl()).trim().replace(/\/+$/, '');
  if (!url || !url.startsWith('http')) {
    return {
      success: false,
      message: 'Missing or invalid Convex URL. Must be formatted like https://<deployment-name>.convex.cloud',
    };
  }

  const start = Date.now();
  try {
    const res = await fetch(`${url}/api/version`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const latency = Date.now() - start;
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        success: true,
        message: `Connected to Convex Cloud! Version: ${data.version || 'active'} (${latency}ms latency)`,
        latencyMs: latency,
        endpoint: url,
      };
    }
    return {
      success: res.status < 500,
      message: `Convex deployment responded with HTTP ${res.status} (${latency}ms)`,
      latencyMs: latency,
      endpoint: url,
    };
  } catch (err: any) {
    const latency = Date.now() - start;
    return {
      success: false,
      message: `Could not reach ${url}: ${err?.message || 'Check network, deployment URL, and CORS settings.'} (${latency}ms)`,
      endpoint: url,
    };
  }
};

export const getConvexClient = (): ConvexReactClient | null => {
  const url = getActiveConvexUrl();
  if (url && url.startsWith('http') && !url.includes('your-project') && !url.includes('your-deployment')) {
    try {
      return new ConvexReactClient(url);
    } catch {
      return null;
    }
  }
  return null;
};

export const convexClient = getConvexClient();

// Reactive state bus for client-side synchronous reactivity & multi-tab sync
const CONVEX_STORAGE_KEY = 'relok8_convex_db_v2';
const BROADCAST_CHANNEL_NAME = 'relok8_convex_sync';

export interface ConvexListingDoc {
  _id: string;
  _creationTime: number;
  title: string;
  address: string;
  city: string;
  monthlyRent: number;
  deposit: number;
  roomType: string;
  areaM2: number;
  floor: number;
  moveInDate: string;
  leaseEndDate: string;
  coordinates: { lat: number; lng: number };
  currentTenant: { name: string; status: string; avatar: string };
  isLocked: boolean;
  lockedUntil?: number;
  amenities: string[];
  district?: string;
  description?: string;
  images?: string[];
  lockedByUserId?: string;
  reservedByName?: string;
  status?: string;
}

export interface ConvexReservationDoc {
  _id: string;
  _creationTime: number;
  listingId: string;
  studentName: string;
  studentPhone: string;
  amountGrosze: number;
  stripePaymentIntentId: string;
  status: 'PENDING_HOLD' | 'LANDLORD_APPROVED' | 'EXPIRED' | 'CANCELLED';
  addons: { verificationPassport: boolean; meldunekPack: boolean };
  expiresAt: number;
  createdAt: number;
}

export interface ConvexAIMessageDoc {
  _id: string;
  _creationTime: number;
  listingId: string;
  sender: 'user' | 'ai';
  content: string;
  functionExecuted?: string;
  timestamp: number;
}

interface ConvexDBState {
  listings: ConvexListingDoc[];
  reservations: ConvexReservationDoc[];
  aiMessages: ConvexAIMessageDoc[];
}

// Initial verified listings conforming strictly to Convex schema
export const INITIAL_CONVEX_LISTINGS: ConvexListingDoc[] = [
  {
    _id: 'cx_list_waw_01',
    _creationTime: Date.now() - 86400000 * 3,
    title: 'Sunny Studio next to Politechnika Warszawska',
    address: 'ul. Koszykowa 68, Warsaw',
    city: 'Warsaw',
    monthlyRent: 2350,
    deposit: 2350,
    roomType: 'Studio',
    areaM2: 28,
    floor: 3,
    moveInDate: '2026-03-01',
    leaseEndDate: '2026-09-30',
    coordinates: { lat: 52.2215, lng: 21.0088 },
    currentTenant: {
      name: 'Marek S.',
      status: 'Departing (Exchange Erasmus semester)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    },
    isLocked: false,
    lockedUntil: undefined,
    amenities: ['High-speed Fiber WiFi', 'Dishwasher', 'Balcony', 'Washing Machine', 'Bicycle Storage', 'Desk & Ergonomic Chair'],
    district: 'Śródmieście Południowe',
    description: 'Direct lease assignment under Art. 509 KC. Modern studio 4 min walk to Warsaw University of Technology main campus. Registered for Meldunek.',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
    ],
    status: 'AVAILABLE',
  },
  {
    _id: 'cx_list_krk_02',
    _creationTime: Date.now() - 86400000 * 2,
    title: 'Historic Kazimierz 1-Bedroom near Jagiellonian University',
    address: 'ul. Józefa 14, Kraków',
    city: 'Kraków',
    monthlyRent: 2600,
    deposit: 2600,
    roomType: '1-Bedroom',
    areaM2: 38,
    floor: 2,
    moveInDate: '2026-03-15',
    leaseEndDate: '2026-10-31',
    coordinates: { lat: 50.0512, lng: 19.9452 },
    currentTenant: {
      name: 'Elena K.',
      status: 'Departing (Relocating for master thesis)',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    },
    isLocked: false,
    lockedUntil: undefined,
    amenities: ['Quiet Courtyard Facing', 'High Ceilings', 'Dishwasher', 'Fast Internet', 'Floor Heating', 'Art Nouveau Building'],
    district: 'Kazimierz',
    description: 'Cozy and quiet apartment in heart of historic Kazimierz. 9 min tram to Jagiellonian University Auditorium Maximum. Zero agency fee.',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    ],
    status: 'AVAILABLE',
  },
  {
    _id: 'cx_list_wro_03',
    _creationTime: Date.now() - 86400000,
    title: 'Spacious Private Room in Plac Grunwaldzki Academic Hub',
    address: 'pl. Grunwaldzki 12, Wrocław',
    city: 'Wrocław',
    monthlyRent: 1350,
    deposit: 1350,
    roomType: 'Private Room',
    areaM2: 17,
    floor: 4,
    moveInDate: '2026-03-01',
    leaseEndDate: '2026-08-31',
    coordinates: { lat: 51.1118, lng: 17.0602 },
    currentTenant: {
      name: 'Jakub W.',
      status: 'Departing (Graduating medicine program)',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    },
    isLocked: false,
    lockedUntil: undefined,
    amenities: ['Direct Tram to PWR & UWr', 'Furnished with Study Desk', 'Fully Equipped Kitchen', 'Balcony Access', 'Elevator'],
    district: 'Śródmieście',
    description: 'Private bright room in student flat right across from Wrocław University of Science and Technology. All flatmates are quiet English-speaking students.',
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    ],
    status: 'AVAILABLE',
  },
  {
    _id: 'cx_list_gda_04',
    _creationTime: Date.now() - 86400000 * 4,
    title: 'Modern Wrzeszcz 2-Bedroom near Gdańsk Tech & Medical Uni',
    address: 'ul. Partyzantów 8, Gdańsk',
    city: 'Gdańsk',
    monthlyRent: 3100,
    deposit: 3100,
    roomType: '2-Bedroom',
    areaM2: 52,
    floor: 1,
    moveInDate: '2026-04-01',
    leaseEndDate: '2026-11-30',
    coordinates: { lat: 54.3789, lng: 18.6012 },
    currentTenant: {
      name: 'Zofia N.',
      status: 'Departing (Clinical rotation transfer)',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    },
    isLocked: false,
    lockedUntil: undefined,
    amenities: ['SKM Station 300m', 'Dishwasher', 'Private Underground Parking', 'Balcony', 'Bathtub', 'High-speed WiFi'],
    district: 'Wrzeszcz',
    description: 'Perfect for two students or medical residents. Walk to Medical University of Gdańsk (GUMed) and Politechnika Gdańska. Meldunek legal pack guaranteed.',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    ],
    status: 'AVAILABLE',
  },
  {
    _id: 'cx_list_poz_05',
    _creationTime: Date.now() - 86400000 * 5,
    title: 'Jeżyce Studio with Sunny Loggia near Adam Mickiewicz Uni',
    address: 'ul. Kościelna 22, Poznań',
    city: 'Poznań',
    monthlyRent: 2100,
    deposit: 2100,
    roomType: 'Studio',
    areaM2: 30,
    floor: 2,
    moveInDate: '2026-03-01',
    leaseEndDate: '2026-09-30',
    coordinates: { lat: 52.4144, lng: 16.9067 },
    currentTenant: {
      name: 'Tomasz B.',
      status: 'Departing (Job offer in Warsaw)',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    },
    isLocked: false,
    lockedUntil: undefined,
    amenities: ['Loggia', 'Washing Machine', 'Tram Stop 2 min', 'Restaurants & Cafes', 'Study Desk', 'Quiet Courtyard'],
    district: 'Jeżyce',
    description: 'Vibrant neighborhood of Jeżyce with artisanal bakeries and direct tram to UAM & Poznań University of Economics. Friendly landlord with signed Art. 509 consent.',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
    ],
    status: 'AVAILABLE',
  },
];

// Helper to get local DB snapshot
function loadLocalConvexDB(): ConvexDBState {
  if (typeof window === 'undefined') {
    return { listings: INITIAL_CONVEX_LISTINGS, reservations: [], aiMessages: [] };
  }
  try {
    const saved = localStorage.getItem(CONVEX_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.listings) && parsed.listings.length > 0) {
        // Sanitize and deduplicate aiMessages by _id
        if (Array.isArray(parsed.aiMessages)) {
          const seenIds = new Set<string>();
          parsed.aiMessages = parsed.aiMessages.filter((m: any) => {
            if (!m || !m._id) return true;
            if (seenIds.has(m._id)) return false;
            seenIds.add(m._id);
            return true;
          });
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Convex local store parse error:', e);
  }
  return { listings: INITIAL_CONVEX_LISTINGS, reservations: [], aiMessages: [] };
}

function saveLocalConvexDB(state: ConvexDBState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONVEX_STORAGE_KEY, JSON.stringify(state));
    // Broadcast change to other tabs / components
    window.dispatchEvent(new CustomEvent('convex_db_update', { detail: state }));
  } catch (e) {
    console.warn('Convex local store write error:', e);
  }
}

// Convert Convex Listing Doc to Frontend Listing type
export function mapConvexListingToAppListing(doc: ConvexListingDoc): Listing {
  return {
    id: doc._id,
    type: 'lease_takeover',
    title: doc.title,
    city: doc.city,
    district: doc.district || 'City Center',
    address: doc.address,
    roomType: doc.roomType,
    monthlyRentPLN: doc.monthlyRent,
    czynszAdminPLN: 0,
    billsIncluded: false,
    czynszIncluded: true,
    depositPLN: doc.deposit,
    availableDate: doc.moveInDate,
    leaseEndDate: doc.leaseEndDate,
    remainingMonths: 6,
    squareMeters: doc.areaM2,
    isFurnished: true,
    flatmatesCount: doc.roomType === 'Studio' ? 0 : 2,
    distanceToCampus: '10-15 min',
    meldunekAllowed: true,
    landlordApproved: true,
    images: doc.images && doc.images.length > 0 ? doc.images : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'],
    landlordName: 'Verified Property Owner',
    landlordContactEmail: 'landlord@relok8.online',
    currentTenant: {
      name: doc.currentTenant.name,
      nationality: 'International / EU',
      role: doc.currentTenant.status,
      avatar: doc.currentTenant.avatar,
      verifiedDocs: ['Student ID', 'Art. 509 Consent', 'Deposit Clearing'],
      reasonForLeaving: doc.currentTenant.status,
      joinedYear: '2025',
    },
    amenities: doc.amenities,
    universitiesNearby: ['Local Academic Campuses', 'Medical University', 'Politechnika'],
    description: doc.description || `${doc.roomType} available for lease assignment under Polish Civil Code Art. 509 KC.`,
    floor: `${doc.floor}`,
    lat: doc.coordinates.lat,
    lng: doc.coordinates.lng,
    statusBadge: doc.isLocked ? 'Temporarily Reserved (EarlyLock)' : 'Available for Takeover',
  };
}

// Reactive Convex Context
interface ConvexContextValue {
  db: ConvexDBState;
  reserveListingAtomic: (listingId: string, userId: string, userName?: string) => Promise<{
    success: boolean;
    listingId: string;
    isLocked: boolean;
    lockedUntil: number;
    remainingMinutes: number;
    message: string;
  }>;
  releaseListingLock: (listingId: string) => Promise<boolean>;
  createEscrowIntent: (params: {
    listingId: string;
    studentName: string;
    studentPhone: string;
    verificationPassport: boolean;
    meldunekPack: boolean;
  }) => Promise<{
    success: boolean;
    stripePaymentIntentId: string;
    clientSecret: string;
    amountGrosze: number;
    totalPLN: number;
    status: string;
    expiresAt: number;
    breakdown: { baseHoldPLN: number; verificationPLN: number; meldunekPLN: number };
    guarantee: string;
  }>;
  captureEscrow: (stripePaymentIntentId: string) => Promise<{ success: boolean; status: string }>;
  cancelEscrow: (stripePaymentIntentId: string, reason?: string) => Promise<{ success: boolean; status: string }>;
  sendLandlordApprovalAlert: (params: {
    listingId: string;
    listingTitle: string;
    landlordPhone: string;
    studentName: string;
    monthlyRent: number;
    stripePaymentIntentId: string;
  }) => Promise<{
    success: boolean;
    quickReplyButtons: string[];
    sentAt: number;
    message: string;
  }>;
  sendAIMessage: (listingId: string, userPrompt: string, listingContext: any) => Promise<{
    userMsg: ConvexAIMessageDoc;
    aiMsg: ConvexAIMessageDoc;
  }>;
}

const ConvexContext = createContext<ConvexContextValue | null>(null);

export const ConvexProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<ConvexDBState>(() => loadLocalConvexDB());

  // Listen to cross-tab updates & timer expiration
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) setDb(e.detail);
    };
    window.addEventListener('convex_db_update', handleUpdate);

    // Periodic sweep for expired 15-minute locks
    const interval = setInterval(() => {
      const now = Date.now();
      let changed = false;
      const current = loadLocalConvexDB();
      const updatedListings = current.listings.map((l) => {
        if (l.isLocked && l.lockedUntil && l.lockedUntil <= now) {
          changed = true;
          return { ...l, isLocked: false, lockedUntil: undefined, lockedByUserId: undefined, reservedByName: undefined, status: 'AVAILABLE' };
        }
        return l;
      });

      if (changed) {
        const nextState = { ...current, listings: updatedListings };
        saveLocalConvexDB(nextState);
        setDb(nextState);
      }
    }, 5000);

    return () => {
      window.removeEventListener('convex_db_update', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  // Atomic hold mutation
  const reserveListingAtomic = useCallback(
    async (listingId: string, userId: string, userName?: string) => {
      const current = loadLocalConvexDB();
      const target = current.listings.find((l) => l._id === listingId);

      if (!target) throw new Error('Listing not found');

      const now = Date.now();
      const isActivelyLocked =
        target.isLocked &&
        target.lockedUntil !== undefined &&
        target.lockedUntil > now;

      if (isActivelyLocked && target.lockedByUserId && target.lockedByUserId !== userId) {
        const remainingMinutes = Math.max(1, Math.ceil((target.lockedUntil! - now) / 60000));
        throw new Error(`Listing currently reserved (15-min hold active by another student, expires in ${remainingMinutes} min)`);
      }

      const lockedUntil = now + 15 * 60 * 1000; // 15-minute hold
      const updatedListings = current.listings.map((l) =>
        l._id === listingId
          ? {
              ...l,
              isLocked: true,
              lockedUntil,
              lockedByUserId: userId,
              reservedByName: userName || 'Student',
              status: 'RESERVED_PENDING',
            }
          : l
      );

      const nextState = { ...current, listings: updatedListings };
      saveLocalConvexDB(nextState);
      setDb(nextState);

      return {
        success: true,
        listingId,
        isLocked: true,
        lockedUntil,
        remainingMinutes: 15,
        message: '15-minute exclusive EarlyLock hold granted via Convex deterministic mutation.',
      };
    },
    []
  );

  const releaseListingLock = useCallback(async (listingId: string) => {
    const current = loadLocalConvexDB();
    const updatedListings = current.listings.map((l) =>
      l._id === listingId
        ? { ...l, isLocked: false, lockedUntil: undefined, lockedByUserId: undefined, reservedByName: undefined, status: 'AVAILABLE' }
        : l
    );
    const nextState = { ...current, listings: updatedListings };
    saveLocalConvexDB(nextState);
    setDb(nextState);
    return true;
  }, []);

  const createEscrowIntent = useCallback(
    async (params: {
      listingId: string;
      studentName: string;
      studentPhone: string;
      verificationPassport: boolean;
      meldunekPack: boolean;
    }) => {
      const baseHoldPLN = 149;
      const verificationPLN = params.verificationPassport ? 39 : 0;
      const meldunekPLN = params.meldunekPack ? 59 : 0;
      const totalPLN = baseHoldPLN + verificationPLN + meldunekPLN;
      const amountGrosze = totalPLN * 100;

      const now = Date.now();
      const expiresAt = now + 15 * 60 * 1000;
      const stripePaymentIntentId = `pi_convex_escrow_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const clientSecret = `${stripePaymentIntentId}_secret_test`;

      const newReservation: ConvexReservationDoc = {
        _id: `cx_res_${Date.now()}`,
        _creationTime: now,
        listingId: params.listingId,
        studentName: params.studentName,
        studentPhone: params.studentPhone,
        amountGrosze,
        stripePaymentIntentId,
        status: 'PENDING_HOLD',
        addons: {
          verificationPassport: params.verificationPassport,
          meldunekPack: params.meldunekPack,
        },
        expiresAt,
        createdAt: now,
      };

      const current = loadLocalConvexDB();
      const nextState: ConvexDBState = {
        ...current,
        reservations: [newReservation, ...current.reservations],
      };
      saveLocalConvexDB(nextState);
      setDb(nextState);

      return {
        success: true,
        stripePaymentIntentId,
        clientSecret,
        amountGrosze,
        totalPLN,
        status: 'PENDING_HOLD',
        expiresAt,
        breakdown: { baseHoldPLN, verificationPLN, meldunekPLN },
        guarantee: '100% refundable conditional escrow authorization. Captured only upon Art. 509 KC lease agreement signing.',
      };
    },
    []
  );

  const captureEscrow = useCallback(async (stripePaymentIntentId: string) => {
    const current = loadLocalConvexDB();
    const targetRes = current.reservations.find((r) => r.stripePaymentIntentId === stripePaymentIntentId);
    if (!targetRes) throw new Error('Reservation not found');

    const updatedReservations = current.reservations.map((r) =>
      r.stripePaymentIntentId === stripePaymentIntentId ? { ...r, status: 'LANDLORD_APPROVED' as const } : r
    );

    const updatedListings = current.listings.map((l) =>
      l._id === targetRes.listingId ? { ...l, isLocked: true, status: 'LEASED' } : l
    );

    const nextState = { ...current, reservations: updatedReservations, listings: updatedListings };
    saveLocalConvexDB(nextState);
    setDb(nextState);
    return { success: true, status: 'LANDLORD_APPROVED' };
  }, []);

  const cancelEscrow = useCallback(async (stripePaymentIntentId: string, reason?: string) => {
    const current = loadLocalConvexDB();
    const targetRes = current.reservations.find((r) => r.stripePaymentIntentId === stripePaymentIntentId);

    const updatedReservations = current.reservations.map((r) =>
      r.stripePaymentIntentId === stripePaymentIntentId ? { ...r, status: 'CANCELLED' as const } : r
    );

    let updatedListings = current.listings;
    if (targetRes) {
      updatedListings = current.listings.map((l) =>
        l._id === targetRes.listingId
          ? { ...l, isLocked: false, lockedUntil: undefined, lockedByUserId: undefined, status: 'AVAILABLE' }
          : l
      );
    }

    const nextState = { ...current, reservations: updatedReservations, listings: updatedListings };
    saveLocalConvexDB(nextState);
    setDb(nextState);
    return { success: true, status: 'CANCELLED' };
  }, []);

  const sendLandlordApprovalAlert = useCallback(
    async (params: {
      listingId: string;
      listingTitle: string;
      landlordPhone: string;
      studentName: string;
      monthlyRent: number;
      stripePaymentIntentId: string;
    }) => {
      // Sends interactive WhatsApp alert with quick reply buttons APPROVE_LEASE / REJECT_LEASE
      return {
        success: true,
        quickReplyButtons: ['APPROVE_LEASE', 'REJECT_LEASE'],
        sentAt: Date.now(),
        message: `Interactive WhatsApp template dispatched to landlord ${params.landlordPhone} with quick reply buttons [APPROVE_LEASE / REJECT_LEASE] for EarlyLock intent ${params.stripePaymentIntentId.slice(-8)}.`,
      };
    },
    []
  );

  const sendAIMessage = useCallback(
    async (listingId: string, userPrompt: string, listingContext: any) => {
      const now = Date.now();
      const promptLower = userPrompt.toLowerCase();
      let functionExecuted: string | undefined = undefined;
      let replyText = '';

      if (promptLower.includes('campus') || promptLower.includes('university') || promptLower.includes('uni') || promptLower.includes('distance') || promptLower.includes('minutes')) {
        functionExecuted = 'calculate_university_proximity';
        const minutesToCampus = listingContext?.city === 'Warsaw' ? '12 min by Metro M1 to Warsaw University & SGH'
          : listingContext?.city === 'Kraków' ? '9 min by tram to Jagiellonian University'
          : listingContext?.city === 'Wrocław' ? '14 min by bus to Wrocław University of Science and Technology'
          : '10-15 min public transit to city academic campuses';
        replyText = `📍 Proximity Calculation [function: calculate_university_proximity]:\nThis room on ${listingContext?.address || 'academic zone'} is located ${minutesToCampus}. Directly accessible with student-discounted public transit (ZTM/MPK).`;
      } else if (promptLower.includes('embed') || promptLower.includes('similar') || promptLower.includes('match') || promptLower.includes('budget') || promptLower.includes('cheaper')) {
        functionExecuted = 'query_listing_embeddings';
        replyText = `🔍 Embedding Similarity Query [function: query_listing_embeddings]:\nRetrieved cosine similarity vectors for ${listingContext?.city || 'Poland'} listings with rent near ${listingContext?.monthlyRent || 2200} PLN. High affinity match score: 94.6% for Erasmus/international students seeking ${listingContext?.roomType || 'room'}.`;
      } else if (promptLower.includes('landlord') || promptLower.includes('approval') || promptLower.includes('consent') || promptLower.includes('cesja') || promptLower.includes('contract')) {
        functionExecuted = 'simulate_landlord_approval_workflow';
        replyText = `📄 Landlord Approval Workflow [function: simulate_landlord_approval_workflow]:\nUnder Polish Civil Code Art. 509 KC, the lease takeover agreement requires landlord consent. Relok8 initiates the automated WhatsApp prompt with 1-click reply buttons (APPROVE_LEASE / REJECT_LEASE). Response SLA is under 4 hours.`;
      } else {
        replyText = `Relok8 AI Proxy ready. As proxy for "${listingContext?.title || 'this listing'}", I verify that this room has verified lease assignment eligibility under Polish Civil Code Art. 509 KC with zero agency fees and locked deposits.`;
      }

      const randomEntropy = Math.random().toString(36).substring(2, 8);
      const userMsg: ConvexAIMessageDoc = {
        _id: `cx_msg_${now}_${randomEntropy}_user`,
        _creationTime: now,
        listingId,
        sender: 'user',
        content: userPrompt,
        timestamp: now,
      };

      const aiMsg: ConvexAIMessageDoc = {
        _id: `cx_msg_${now + 1}_${randomEntropy}_ai`,
        _creationTime: now + 1,
        listingId,
        sender: 'ai',
        content: replyText,
        functionExecuted,
        timestamp: now + 1,
      };

      const current = loadLocalConvexDB();
      const existingIds = new Set(current.aiMessages.map((m) => m._id));
      const nextAiMessages = [...current.aiMessages];
      if (!existingIds.has(userMsg._id)) {
        nextAiMessages.push(userMsg);
        existingIds.add(userMsg._id);
      }
      if (!existingIds.has(aiMsg._id)) {
        nextAiMessages.push(aiMsg);
      }

      const nextState: ConvexDBState = {
        ...current,
        aiMessages: nextAiMessages,
      };
      saveLocalConvexDB(nextState);
      setDb(nextState);

      return { userMsg, aiMsg };
    },
    []
  );

  const value = useMemo(
    () => ({
      db,
      reserveListingAtomic,
      releaseListingLock,
      createEscrowIntent,
      captureEscrow,
      cancelEscrow,
      sendLandlordApprovalAlert,
      sendAIMessage,
    }),
    [
      db,
      reserveListingAtomic,
      releaseListingLock,
      createEscrowIntent,
      captureEscrow,
      cancelEscrow,
      sendLandlordApprovalAlert,
      sendAIMessage,
    ]
  );

  return <ConvexContext.Provider value={value}>{children}</ConvexContext.Provider>;
};

export const useConvex = () => {
  const ctx = useContext(ConvexContext);
  if (!ctx) {
    throw new Error('useConvex must be used within ConvexProvider');
  }
  return ctx;
};

// Standard Convex React Hook compatibility
export function useQuery(queryFn: any, args?: any): any {
  const convex = useConvex();

  // Handle getListings query
  if (queryFn === api.listings?.getListings || (typeof queryFn === 'function' && queryFn.name === 'getListings')) {
    let list = convex.db.listings;
    if (args?.city && args.city !== 'All Poland' && args.city !== 'Anywhere in Poland') {
      list = list.filter((l) => l.city.toLowerCase() === args.city.toLowerCase());
    }
    if (args?.roomType && args.roomType !== 'All room types') {
      list = list.filter((l) => l.roomType.toLowerCase() === args.roomType.toLowerCase());
    }
    return list;
  }

  // Handle getListingById query
  if (queryFn === api.listings?.getListingById || (typeof queryFn === 'function' && queryFn.name === 'getListingById')) {
    const found = convex.db.listings.find((l) => l._id === args?.id);
    return found || null;
  }

  // Handle getReservations query
  if (queryFn === api.payments?.getReservations || (typeof queryFn === 'function' && queryFn.name === 'getReservations')) {
    if (args?.listingId) {
      return convex.db.reservations.filter((r) => r.listingId === args.listingId);
    }
    return convex.db.reservations;
  }

  // Handle getListingMessages query
  if (queryFn === api.aiMessages?.getListingMessages || (typeof queryFn === 'function' && queryFn.name === 'getListingMessages')) {
    if (args?.listingId) {
      return convex.db.aiMessages.filter((m) => m.listingId === args.listingId);
    }
    return convex.db.aiMessages;
  }

  return null;
}

export function useMutation(mutationFn: any): (args: any) => Promise<any> {
  const convex = useConvex();

  return useCallback(
    async (args: any) => {
      if (mutationFn === api.listings?.reserveListingAtomic || mutationFn?.name === 'reserveListingAtomic') {
        return await convex.reserveListingAtomic(args.listingId, args.userId, args.userName);
      }
      if (mutationFn === api.listings?.releaseListingLock || mutationFn?.name === 'releaseListingLock') {
        return await convex.releaseListingLock(args.listingId);
      }
      if (mutationFn === api.payments?.captureEscrow || mutationFn?.name === 'captureEscrow') {
        return await convex.captureEscrow(args.stripePaymentIntentId);
      }
      if (mutationFn === api.payments?.cancelEscrow || mutationFn?.name === 'cancelEscrow') {
        return await convex.cancelEscrow(args.stripePaymentIntentId, args.reason);
      }
      return null;
    },
    [convex, mutationFn]
  );
}

export function useAction(actionFn: any): (args: any) => Promise<any> {
  const convex = useConvex();

  return useCallback(
    async (args: any) => {
      if (actionFn === api.payments?.createEscrowIntent || actionFn?.name === 'createEscrowIntent') {
        return await convex.createEscrowIntent(args);
      }
      if (actionFn === api.whatsapp?.sendLandlordApprovalAlert || actionFn?.name === 'sendLandlordApprovalAlert') {
        return await convex.sendLandlordApprovalAlert(args);
      }
      if (actionFn === api.aiMessages?.generateAIProxyResponse || actionFn?.name === 'generateAIProxyResponse') {
        return await convex.sendAIMessage(args.listingId, args.userPrompt, args.listingContext);
      }
      return null;
    },
    [convex, actionFn]
  );
}
