import { Listing } from '../types';
import { supabase, isSupabaseConfigured, mapSupabaseListingToApp } from '../lib/supabaseClient';

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
      if (isSupabaseConfigured()) {
        try {
          const generatedPassword = 'R8_' + Math.random().toString(36).slice(2) + '!2026';
          const { data, error } = await supabase.auth.signUp({
            email: payload.email,
            password: generatedPassword,
            options: {
              data: {
                full_name: payload.name || payload.email.split('@')[0],
                university: payload.university || '',
                role: payload.role || 'student'
              }
            }
          });
          if (!error && data.user) {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              full_name: payload.name || payload.email.split('@')[0],
              is_verified: true
            });
            const userProf: UserProfile = {
              id: data.user.id,
              name: payload.name || payload.email.split('@')[0],
              email: payload.email,
              university: payload.university,
              role: payload.role,
              isVerified: true
            };
            localStorage.setItem('r8_user', JSON.stringify(userProf));
            return userProf;
          }
        } catch (e) {
          console.warn('Supabase signup fallback:', e);
        }
      }

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
      if (isSupabaseConfigured()) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email === email) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            const userProf: UserProfile = {
              id: session.user.id,
              name: profile?.full_name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email || email,
              avatar: profile?.avatar_url || undefined,
              isVerified: profile?.is_verified ?? true
            };
            localStorage.setItem('r8_user', JSON.stringify(userProf));
            return userProf;
          }

          const { error } = await supabase.auth.signInWithOtp({ email });
          if (!error) {
            const userProf: UserProfile = {
              id: 'supa-' + Math.random().toString(36).substring(7),
              name: email.split('@')[0],
              email,
              isVerified: true
            };
            localStorage.setItem('r8_user', JSON.stringify(userProf));
            return userProf;
          }
        } catch (e) {
          console.warn('Supabase login fallback:', e);
        }
      }

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
      if (isSupabaseConfigured()) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
            return {
              id: session.user.id,
              name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              email: session.user.email || '',
              avatar: profile?.avatar_url || session.user.user_metadata?.avatar_url,
              isVerified: profile?.is_verified ?? false,
              role: session.user.user_metadata?.role || 'student'
            };
          }
        } catch (e) {}
      }

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
      if (isSupabaseConfigured()) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await supabase.from('profiles').update({
              full_name: updates.name,
              avatar_url: updates.avatar
            }).eq('id', session.user.id);
          }
        } catch (e) {}
      }

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
      if (isSupabaseConfigured()) {
        supabase.auth.signOut().catch(() => {});
      }
      localStorage.removeItem('r8_token');
      localStorage.removeItem('r8_user');
      fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    }
  },

  // Listings - Powered by Convex Engine
  listings: {
    async getAll(params?: { city?: string; roomType?: string; maxRent?: number; meldunek?: boolean; q?: string; sort?: string }): Promise<Listing[]> {
      try {
        const rawLocal = typeof window !== 'undefined' ? localStorage.getItem('relok8_convex_db_v2') : null;
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal);
          if (Array.isArray(parsed.listings) && parsed.listings.length > 0) {
            const { mapConvexListingToAppListing } = await import('../lib/convex/client');
            let list = parsed.listings.map(mapConvexListingToAppListing);
            if (params?.city && params.city !== 'All Poland' && params.city !== 'Anywhere in Poland') {
              list = list.filter((l: Listing) => l.city.toLowerCase() === params.city?.toLowerCase());
            }
            if (params?.roomType && params.roomType !== 'All room types' && params.roomType !== 'All Types') {
              list = list.filter((l: Listing) => l.roomType.toLowerCase() === params.roomType?.toLowerCase());
            }
            if (params?.maxRent) {
              list = list.filter((l: Listing) => l.monthlyRentPLN <= params.maxRent!);
            }
            return list;
          }
        }
      } catch (e) {}

      const { INITIAL_CONVEX_LISTINGS, mapConvexListingToAppListing } = await import('../lib/convex/client');
      let list = INITIAL_CONVEX_LISTINGS.map(mapConvexListingToAppListing);
      if (params?.city && params.city !== 'All Poland' && params.city !== 'Anywhere in Poland') {
        list = list.filter((l: Listing) => l.city.toLowerCase() === params.city?.toLowerCase());
      }
      if (params?.roomType && params.roomType !== 'All room types' && params.roomType !== 'All Types') {
        list = list.filter((l: Listing) => l.roomType.toLowerCase() === params.roomType?.toLowerCase());
      }
      if (params?.maxRent) {
        list = list.filter((l: Listing) => l.monthlyRentPLN <= params.maxRent!);
      }
      return list;
    },

    async getById(id: string): Promise<Listing> {
      try {
        const rawLocal = typeof window !== 'undefined' ? localStorage.getItem('relok8_convex_db_v2') : null;
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal);
          const found = parsed.listings?.find((l: any) => l._id === id || l.id === id);
          if (found) {
            const { mapConvexListingToAppListing } = await import('../lib/convex/client');
            return mapConvexListingToAppListing(found);
          }
        }
      } catch (e) {}

      const { INITIAL_CONVEX_LISTINGS, mapConvexListingToAppListing } = await import('../lib/convex/client');
      const fallback = INITIAL_CONVEX_LISTINGS.find((l) => l._id === id);
      if (fallback) {
        return mapConvexListingToAppListing(fallback);
      }

      const res = await fetch(`/api/listings/${id}`);
      if (!res.ok) throw new Error('Listing not found');
      return res.json();
    },

    async create(listing: Partial<Listing>): Promise<Listing> {
      const { mapConvexListingToAppListing } = await import('../lib/convex/client');
      const newDoc: any = {
        _id: `cx_list_${Date.now()}`,
        _creationTime: Date.now(),
        title: listing.title || 'Apartment in Poland',
        address: listing.address || `${listing.city || 'Warsaw'}, Poland`,
        city: listing.city || 'Warsaw',
        monthlyRent: listing.monthlyRentPLN || 2200,
        deposit: listing.depositPLN || 2200,
        roomType: listing.roomType || 'Studio',
        areaM2: listing.squareMeters || 30,
        floor: Number(listing.floor) || 2,
        moveInDate: listing.availableDate || new Date().toISOString().split('T')[0],
        leaseEndDate: listing.leaseEndDate || '2026-10-31',
        coordinates: { lat: listing.lat || 52.2297, lng: listing.lng || 21.0122 },
        currentTenant: {
          name: listing.currentTenant?.name || 'Departing Student',
          status: 'Direct assignment',
          avatar: listing.currentTenant?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        },
        isLocked: false,
        amenities: listing.amenities || ['Fast WiFi', 'Washing Machine'],
        district: listing.district,
        description: listing.description,
        images: listing.images,
        status: 'AVAILABLE'
      };

      try {
        const rawLocal = localStorage.getItem('relok8_convex_db_v2');
        const dbState = rawLocal ? JSON.parse(rawLocal) : { listings: [], reservations: [], aiMessages: [] };
        dbState.listings = [newDoc, ...(dbState.listings || [])];
        localStorage.setItem('relok8_convex_db_v2', JSON.stringify(dbState));
        window.dispatchEvent(new CustomEvent('convex_db_update', { detail: dbState }));
      } catch (e) {}

      return mapConvexListingToAppListing(newDoc);
    },

    async like(id: string): Promise<{ id: string; likesCount: number }> {
      const res = await fetch(`/api/listings/${id}/like`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!res.ok) return { id, likesCount: 1 };
      return res.json();
    },

    async delete(id: string): Promise<void> {
      try {
        const rawLocal = localStorage.getItem('relok8_convex_db_v2');
        if (rawLocal) {
          const dbState = JSON.parse(rawLocal);
          dbState.listings = (dbState.listings || []).filter((l: any) => l._id !== id && l.id !== id);
          localStorage.setItem('relok8_convex_db_v2', JSON.stringify(dbState));
          window.dispatchEvent(new CustomEvent('convex_db_update', { detail: dbState }));
        }
      } catch (e) {}

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
      if (isSupabaseConfigured()) {
        try {
          let query = supabase
            .from('matches_and_inquiries')
            .select('*, profiles(*)');

          if (params?.listingId) {
            query = query.eq('listing_id', params.listingId);
          }

          const { data, error } = await query;
          if (!error && data && data.length > 0) {
            return data.map((item: any) => ({
              id: item.id,
              listingId: item.listing_id,
              tenantName: item.profiles?.full_name || 'Interested Student',
              tenantEmail: item.profiles?.whatsapp_number || 'student@relok8.online',
              message: item.admin_notes || 'Inquiry sent via Relok8 platform.',
              createdAt: item.created_at,
              status: item.payment_status === 'paid' ? 'handover_agreed' : 'pending'
            }));
          }
        } catch (e) {}
      }

      const query = new URLSearchParams();
      if (params?.listingId) query.append('listingId', params.listingId);
      if (params?.email) query.append('email', params.email);

      const res = await fetch(`/api/inquiries?${query.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.inquiries || [];
    },

    async send(payload: { listingId: string; tenantName: string; tenantEmail: string; message: string }): Promise<InquiryRecord> {
      if (isSupabaseConfigured()) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const userId = sessionData?.session?.user?.id;
          if (userId) {
            const { data, error } = await supabase
              .from('matches_and_inquiries')
              .insert({
                listing_id: payload.listingId,
                student_user_id: userId,
                admin_notes: `Inquiry from ${payload.tenantName} (${payload.tenantEmail}): ${payload.message}`,
                payment_status: 'pending'
              })
              .select()
              .single();

            if (!error && data) {
              return {
                id: data.id,
                listingId: data.listing_id,
                tenantName: payload.tenantName,
                tenantEmail: payload.tenantEmail,
                message: payload.message,
                createdAt: data.created_at,
                status: 'pending'
              };
            }
          }
        } catch (e) {
          console.warn('Supabase inquiry send fallback:', e);
        }
      }

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
