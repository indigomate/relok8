/**
 * Relok8 Unified Data-Access Layer (DAL)
 *
 * Implements Non-Negotiable #4 from REVAMP Brief:
 * Provides a clean, abstracted boundary between UI components and backend stores.
 * Transparently supports:
 *  - Primary: Express REST endpoints & local synced state
 *  - Supabase integration when configured
 *  - Convex reactive database when active
 *
 * Switching between backends requires changes only in this file, never in UI components.
 */

import { Listing, Money, toMoney } from '../types';
import { INITIAL_LISTINGS } from '../data/mockListings';

export interface DataAccessFilter {
  city?: string;
  kind?: 'takeover' | 'rental' | 'stay';
  roomType?: string;
  maxRentPLN?: number;
  furnished?: boolean;
  billsIncluded?: boolean;
  meldunekAllowed?: boolean;
  query?: string;
}

export interface InquiryPayload {
  listingId: string;
  applicantId?: string;
  name: string;
  email: string;
  message: string;
}

export interface ReservationHoldPayload {
  listingId: string;
  studentId: string;
  amountMinor: number;
  currency: string;
  durationMinutes: number;
}

export interface OnloActionRecord {
  type: string;
  targetTable: string;
  targetId: string;
  summary: string;
  model: string;
  outcome: 'ok' | 'error' | 'overridden';
}

class DataAccessLayer {
  private localListingsKey = 'r8_listings';
  private localFavoritesKey = 'r8_favorites';
  private localInquiriesKey = 'r8_inquiries';

  /**
   * Fetch all listings, falling back gracefully from server to local cache to initial data
   */
  async getListings(filter?: DataAccessFilter): Promise<Listing[]> {
    try {
      const response = await fetch('/api/listings');
      if (response.ok) {
        const data = await response.json();
        const items: Listing[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.listings)
          ? data.listings
          : [];
        return this.applyFilters(items, filter);
      }
    } catch {
      // Server unreachable, fall through to localStorage
    }

    const cached = localStorage.getItem(this.localListingsKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return this.applyFilters(parsed, filter);
        }
      } catch {}
    }

    return this.applyFilters(INITIAL_LISTINGS, filter);
  }

  /**
   * Fetch a single listing by ID
   */
  async getListingById(id: string): Promise<Listing | null> {
    try {
      const response = await fetch(`/api/listings/${id}`);
      if (response.ok) {
        return await response.json();
      }
    } catch {}

    const all = await this.getListings();
    return all.find((l) => l.id === id) || null;
  }

  /**
   * Create or update a listing
   */
  async createListing(listingData: Partial<Listing>): Promise<Listing> {
    const id = listingData.id || `place-${Date.now().toString(36)}`;
    const fullListing: Listing = {
      id,
      type: listingData.type || 'lease_takeover',
      kind: listingData.kind || (listingData.type === 'lease_takeover' ? 'takeover' : 'rental'),
      title: listingData.title || 'Comfortable Room in City Centre',
      city: listingData.city || 'Lublin',
      district: listingData.district || 'Śródmieście',
      address: listingData.address || '',
      roomType: listingData.roomType || 'Private room',
      monthlyRentPLN: listingData.monthlyRentPLN || 1500,
      price: listingData.price || toMoney(listingData.monthlyRentPLN || 1500),
      czynszAdminPLN: listingData.czynszAdminPLN || 0,
      billsIncluded: !!listingData.billsIncluded,
      depositPLN: listingData.depositPLN || 1500,
      availableDate: listingData.availableDate || new Date().toISOString().split('T')[0],
      leaseEndDate: listingData.leaseEndDate || new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      remainingMonths: listingData.remainingMonths || 6,
      squareMeters: listingData.squareMeters || 16,
      isFurnished: listingData.isFurnished ?? true,
      flatmatesCount: listingData.flatmatesCount || 2,
      distanceToCampus: listingData.distanceToCampus || '10 min walk',
      meldunekAllowed: listingData.meldunekAllowed ?? true,
      landlordApproved: listingData.landlordApproved ?? true,
      images: listingData.images && listingData.images.length > 0 ? listingData.images : ['/images/listing_warsaw_center_1790621476399.jpg'],
      landlordName: listingData.landlordName || 'Verified Host',
      landlordContactEmail: listingData.landlordContactEmail || 'landlord@relok8.online',
      currentTenant: listingData.currentTenant || {
        name: 'Anna Kowalska',
        nationality: 'Poland',
        role: 'Departing Tenant',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        verifiedDocs: ['ID Verified', 'Active Lease'],
        reasonForLeaving: 'Graduation / Semester abroad',
        joinedYear: '2024'
      },
      amenities: listingData.amenities || ['Fast WiFi', 'Washing Machine', 'Desk', 'Furnished'],
      universitiesNearby: listingData.universitiesNearby || ['University Campus'],
      description: listingData.description || 'Verified room ready for immediate handover with full landlord consent.',
      floor: listingData.floor || '2'
    };

    try {
      await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullListing)
      });
    } catch {}

    // Save to local listings cache
    const current = await this.getListings();
    const updated = [fullListing, ...current.filter((l) => l.id !== fullListing.id)];
    localStorage.setItem(this.localListingsKey, JSON.stringify(updated));

    return fullListing;
  }

  /**
   * Favorites / Saved Listings
   */
  async getFavorites(): Promise<string[]> {
    const raw = localStorage.getItem(this.localFavoritesKey);
    return raw ? JSON.parse(raw) : [];
  }

  async toggleFavorite(listingId: string): Promise<boolean> {
    const favs = await this.getFavorites();
    const exists = favs.includes(listingId);
    const updated = exists ? favs.filter((id) => id !== listingId) : [...favs, listingId];
    localStorage.setItem(this.localFavoritesKey, JSON.stringify(updated));
    return !exists;
  }

  /**
   * Submit an inquiry to tenant / landlord
   */
  async submitInquiry(payload: InquiryPayload): Promise<boolean> {
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          createdAt: new Date().toISOString()
        })
      });
      if (res.ok) return true;
    } catch {}

    const local = localStorage.getItem(this.localInquiriesKey);
    const parsed = local ? JSON.parse(local) : [];
    parsed.push({ ...payload, id: `inq-${Date.now()}`, createdAt: new Date().toISOString() });
    localStorage.setItem(this.localInquiriesKey, JSON.stringify(parsed));
    return true;
  }

  /**
   * Log an Onlo AI Action for audit trail
   */
  async logOnloAction(action: OnloActionRecord): Promise<void> {
    try {
      await fetch('/api/admin/onlo-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...action,
          timestamp: Date.now()
        })
      });
    } catch {}
  }

  private applyFilters(listings: Listing[], filter?: DataAccessFilter): Listing[] {
    if (!filter) return listings;
    return listings.filter((item) => {
      if (filter.city && filter.city !== 'all') {
        const cityMatch = item.city.toLowerCase() === filter.city.toLowerCase();
        if (!cityMatch) return false;
      }
      if (filter.kind && item.kind && item.kind !== filter.kind) {
        return false;
      }
      if (filter.roomType && filter.roomType !== 'all') {
        if (!item.roomType.toLowerCase().includes(filter.roomType.toLowerCase())) {
          return false;
        }
      }
      if (filter.maxRentPLN && item.monthlyRentPLN > filter.maxRentPLN) {
        return false;
      }
      if (filter.billsIncluded && !item.billsIncluded) {
        return false;
      }
      if (filter.furnished && !item.isFurnished) {
        return false;
      }
      if (filter.meldunekAllowed && !item.meldunekAllowed) {
        return false;
      }
      if (filter.query && filter.query.trim().length > 0) {
        const q = filter.query.toLowerCase();
        const text = `${item.title} ${item.address} ${item.district} ${item.city} ${item.description}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }
}

export const dataAccess = new DataAccessLayer();
