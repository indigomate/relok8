import React, { createContext, useContext, useMemo } from 'react';
import { useConvex as useRemoteConvex, useQuery as useRemoteQuery, useConvexAuth } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Listing } from '../../types';
export const getActiveConvexUrl = () => import.meta.env.VITE_CONVEX_URL || '';
export const isConvexConfigured = () => Boolean(getActiveConvexUrl());
export const setCustomConvexUrl = (_url: string) => { throw new Error('Change the development environment configuration and restart the app.'); };
export const clearCustomConvexUrl = () => {};
export async function testConvexConnection(targetUrl?: string): Promise<{ success: boolean; message: string; latencyMs?: number; endpoint?: string }> {
  const url = getActiveConvexUrl();
  if (targetUrl && targetUrl !== url) return { success: false, message: 'Only the configured deployment can be used.' };
  return { success: Boolean(url), message: url ? 'Deployment configured. Check the live subscription for connectivity.' : 'Deployment missing.', endpoint: url };
}
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
  landlordContactEmail?: string;
  landlordName?: string;
  czynszAdmin?: number;
  billsIncluded?: boolean;
  isFurnished?: boolean;
  flatmatesCount?: number;
  distanceToCampus?: string;
  meldunekAllowed?: boolean;
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

// Clean initial listings store - ready for real user-submitted listings
export const INITIAL_CONVEX_LISTINGS: ConvexListingDoc[] = [];

export function mapConvexListingToAppListing(doc: ConvexListingDoc): Listing {
  return {
    id: doc._id,
    type: 'lease_takeover',
    title: doc.title,
    city: doc.city,
    district: doc.district || '',
    address: doc.address,
    roomType: doc.roomType,
    monthlyRentPLN: doc.monthlyRent,
    czynszAdminPLN: doc.czynszAdmin || 0,
    billsIncluded: !!doc.billsIncluded,
    czynszIncluded: true,
    depositPLN: doc.deposit,
    availableDate: doc.moveInDate,
    leaseEndDate: doc.leaseEndDate,
    remainingMonths: Math.max(0,Math.round((Date.parse(doc.leaseEndDate)-Date.parse(doc.moveInDate))/2629800000)),
    squareMeters: doc.areaM2,
    isFurnished: !!doc.isFurnished,
    flatmatesCount: doc.flatmatesCount || 0,
    distanceToCampus: doc.distanceToCampus || '',
    meldunekAllowed: !!doc.meldunekAllowed,
    landlordApproved: (doc as any).advertisingPermission === true,
    images: doc.images || [],
    landlordName: doc.landlordName || 'Property owner',
    landlordContactEmail: '',
    currentTenant: {
      name: doc.currentTenant?.name || 'Tenant',
      nationality: '',
      role: doc.currentTenant?.status || 'Tenant',
      avatar: doc.currentTenant?.avatar || '',
      verifiedDocs: [],
      reasonForLeaving: doc.currentTenant?.status || 'Tenant',
      joinedYear: '',
    },
    amenities: doc.amenities,
    universitiesNearby: [],
    description: doc.description || '',
    floor: doc.floor === undefined ? '' : String(doc.floor),
    lat: doc.coordinates?.lat,
    lng: doc.coordinates?.lng,
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
  const client = useRemoteConvex();
  const { isAuthenticated } = useConvexAuth();
  const listings = useRemoteQuery(api.leases.get, {}) || [];
  const history = useRemoteQuery(api.aiMessages.mine, isAuthenticated ? {} : 'skip') || [];
  const unavailable = async (): Promise<any> => { throw new Error('Payments and WhatsApp approvals are not enabled. No funds have been moved.'); };
  const value = useMemo<ConvexContextValue>(() => ({
    db: { listings: listings as any, reservations: [], aiMessages: history as any },
    reserveListingAtomic: async (listingId, userId, userName) => {
      const result = await client.mutation(api.leases.reserve, { leaseId: listingId, userId, userName });
      return { ...result, listingId, isLocked: true, remainingMinutes: Math.ceil((result.lockedUntil - Date.now()) / 60000), message: 'Reservation recorded. No payment has been taken.' };
    },
    releaseListingLock: async listingId => client.mutation(api.leases.release, { leaseId: listingId }),
    createEscrowIntent: unavailable, captureEscrow: unavailable, cancelEscrow: unavailable, sendLandlordApprovalAlert: unavailable,
    sendAIMessage: async (listingId, userPrompt, listingContext) => {
      if (!isAuthenticated) throw new Error('Sign in to use the listing assistant.');
      const result = await client.action(api.aiMessages.generateAIProxyResponse, { listingId, userPrompt, listingContext });
      const now = Date.now();
      return { userMsg: { _id: crypto.randomUUID(), _creationTime: now, timestamp: now, listingId, sender: 'user', content: userPrompt }, aiMsg: { _id: crypto.randomUUID(), _creationTime: now, timestamp: now, listingId, sender: 'ai', content: (result as any).replyText || (result as any).content || 'Please contact the tenant for confirmation.' } };
    },
  }), [client, listings, isAuthenticated, history]);
  return <ConvexContext.Provider value={value}>{children}</ConvexContext.Provider>;
};
export function useConvex() {
  const value = useContext(ConvexContext);
  if (!value) throw new Error('Missing Convex adapter');
  return value;
}
export { useQuery, useMutation, useAction } from 'convex/react';
