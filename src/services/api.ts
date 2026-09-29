import { Listing } from '../types';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: string;
  university?: string;
  avatar?: string;
  isVerified?: boolean;
}

export interface InquiryRecord {
  id: string;
  listingId: string;
  tenantName: string;
  tenantEmail: string;
  message: string;
  createdAt: string;
  status?: 'pending' | 'viewing_scheduled' | 'handover_agreed';
  replies?: Array<{ sender: string; text: string; sentAt: string }>;
}

export interface MarketplaceStats {
  activeListings: number;
  verifiedHandovers: number;
  avgRentPLN: number;
  totalBrokerSavingsPLN: number;
  avgDaysToHandover: number;
  meldunekComplianceRate: string;
  zeroDepositDisputeRate: string;
}

export interface CesjaProtocolResult {
  protocolId: string;
  legalBasis: string;
  status: string;
  createdAt: string;
  summary: {
    departingTenant: string;
    incomingTenant: string;
    landlordName: string;
    address: string;
    rentPLN: number;
    depositPLN: number;
    handoverDate: string;
    addressRegistrationPermitted: boolean;
    downloadUrl?: string;
  };
}

const getAuthToken = (): string | null => {
  return localStorage.getItem('r8_token');
};

const getAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Authentication
  auth: {
    async signup(payload: { email: string; name?: string; university?: string; role?: string }) {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Sign up failed');
      const data = await res.json();
      if (data.token) localStorage.setItem('r8_token', data.token);
      return data.user as UserProfile;
    },

    async login(email: string) {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      if (data.token) localStorage.setItem('r8_token', data.token);
      return data.user as UserProfile;
    },

    async getMe(): Promise<UserProfile | null> {
      try {
        const res = await fetch('/api/auth/me', {
          headers: getAuthHeaders()
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.user;
      } catch {
        return null;
      }
    },

    async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const data = await res.json();
      return data.user;
    },

    logout() {
      localStorage.removeItem('r8_token');
      localStorage.removeItem('r8_user');
      fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    }
  },

  // Listings
  listings: {
    async getAll(params?: { city?: string; roomType?: string; maxRent?: number; meldunek?: boolean; q?: string; sort?: string }): Promise<Listing[]> {
      const query = new URLSearchParams();
      if (params?.city && params.city !== 'All Poland') query.append('city', params.city);
      if (params?.roomType && params.roomType !== 'All Types') query.append('roomType', params.roomType);
      if (params?.maxRent) query.append('maxRent', params.maxRent.toString());
      if (params?.meldunek) query.append('meldunek', 'true');
      if (params?.q) query.append('q', params.q);
      if (params?.sort) query.append('sort', params.sort);

      const res = await fetch(`/api/listings?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch listings');
      const data = await res.json();
      return data.listings;
    },

    async getById(id: string): Promise<Listing> {
      const res = await fetch(`/api/listings/${id}`);
      if (!res.ok) throw new Error('Listing not found');
      return res.json();
    },

    async create(listing: Partial<Listing>): Promise<Listing> {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(listing)
      });
      if (!res.ok) throw new Error('Failed to publish listing');
      const data = await res.json();
      return data.listing;
    },

    async like(id: string): Promise<{ id: string; likesCount: number }> {
      const res = await fetch(`/api/listings/${id}/like`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to like listing');
      return res.json();
    },

    async delete(id: string): Promise<void> {
      const res = await fetch(`/api/listings/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete listing');
    }
  },

  // Favorites / Saved
  favorites: {
    async get(): Promise<{ ids: string[]; listings: Listing[] }> {
      try {
        const res = await fetch('/api/favorites', { headers: getAuthHeaders() });
        if (!res.ok) return { ids: [], listings: [] };
        return res.json();
      } catch {
        return { ids: [], listings: [] };
      }
    },

    async add(listingId: string): Promise<void> {
      await fetch(`/api/favorites/${listingId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    },

    async remove(listingId: string): Promise<void> {
      await fetch(`/api/favorites/${listingId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    }
  },

  // Inquiries
  inquiries: {
    async getAll(params?: { listingId?: string; email?: string }): Promise<InquiryRecord[]> {
      const query = new URLSearchParams();
      if (params?.listingId) query.append('listingId', params.listingId);
      if (params?.email) query.append('email', params.email);

      const res = await fetch(`/api/inquiries?${query.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.inquiries || [];
    },

    async send(payload: { listingId: string; tenantName: string; tenantEmail: string; message: string }): Promise<InquiryRecord> {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to send inquiry');
      const data = await res.json();
      return data.inquiry;
    },

    async reply(inquiryId: string, replyText: string, senderName: string): Promise<void> {
      const res = await fetch(`/api/inquiries/${inquiryId}/reply`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ text: replyText, sender: senderName })
      });
      if (!res.ok) throw new Error('Failed to send reply');
    }
  },

  // Cesja Art. 509 KC
  cesja: {
    async getTemplates() {
      const res = await fetch('/api/cesja/templates');
      return res.json();
    },

    async generate(payload: {
      departingTenant: string;
      incomingTenant: string;
      landlordName: string;
      address: string;
      rentPLN: number;
      depositPLN: number;
      handoverDate: string;
    }): Promise<CesjaProtocolResult> {
      const res = await fetch('/api/cesja/generate', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to generate Cesja agreement');
      return res.json();
    }
  },

  // Penalty vs Takeover Savings Calculator
  calculator: {
    async calculateBreakFee(payload: { monthlyRentPLN: number; remainingMonths: number; depositPLN?: number }) {
      const res = await fetch('/api/calculator/break-fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.json();
    }
  },

  // Public Marketplace Stats
  stats: {
    async get(): Promise<MarketplaceStats> {
      const res = await fetch('/api/stats');
      return res.json();
    }
  }
};
