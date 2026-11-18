import { leaseHasEnded } from '../../utils/leaseTiming';
import React, { createContext, useContext, useMemo } from 'react';
import { useConvex as useRemoteConvex, useQuery as useRemoteQuery, useConvexAuth } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Listing } from '../../types';
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
  occupancyStatus?: 'occupied' | 'vacant';
  moveInDate: string;
  leaseEndDate: string;
  coordinates: { lat: number; lng: number };
  currentTenant: { name: string; status: string; avatar: string };
  isLocked: boolean;
  lockedUntil?: number;
  amenities: string[];
  district?: string;
  universitiesNearby?: string[];
  description?: string;
  images?: string[];
  lockedByUserId?: string;
  reservedByName?: string;
  status?: string;
  landlordContactEmail?: string;
  landlordName?: string;
  czynszAdmin?: number;
  billsIncluded?: boolean;
  billsMode?: "included" | "fixed" | "usage";
  fixedBillsPLN?: number;
  isFurnished?: boolean;
  flatmatesCount?: number;
  distanceToCampus?: string;
  meldunekAllowed?: boolean;
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
  aiMessages: ConvexAIMessageDoc[];
}

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
    billsIncluded: !!doc.billsIncluded, billsMode: doc.billsMode, fixedBillsPLN: doc.fixedBillsPLN,
    czynszIncluded: true,
    depositPLN: doc.deposit,
    occupancyStatus: doc.occupancyStatus,
    publicationStatus: doc.status,
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
      reasonForLeaving: '',
      joinedYear: '',
    },
    amenities: doc.amenities,
    universitiesNearby: doc.universitiesNearby || [],
    description: doc.description || '',
    floor: doc.floor === undefined ? '' : String(doc.floor),
    lat: doc.coordinates?.lat,
    lng: doc.coordinates?.lng,
    statusBadge: leaseHasEnded(doc.leaseEndDate) ? 'Current lease ended' : doc.status === 'PAUSED' ? 'Listing paused' : doc.status === 'TRANSFERRED' ? 'Handover complete' : ['APPROVED', 'LEASED'].includes(doc.status || '') ? 'Handover in progress' : doc.isLocked ? 'Temporarily reserved' : 'Accepting takeover enquiries',
  };
}

// Reactive Convex Context
interface ConvexContextValue {
  db: ConvexDBState;
  sendAIMessage: (listingId: string, userPrompt: string) => Promise<{
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
  const value = useMemo<ConvexContextValue>(() => ({
    db: { listings: listings as any, aiMessages: history as any },
    sendAIMessage: async (listingId, userPrompt) => {
      if (!isAuthenticated) throw new Error('Sign in to use the listing assistant.');
      const result = await client.action(api.aiMessages.generateAIProxyResponse, { listingId, userPrompt });
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
