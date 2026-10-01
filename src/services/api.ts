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

  // Listings
  listings: {
    async getAll(params?: { city?: string; roomType?: string; maxRent?: number; meldunek?: boolean; q?: string; sort?: string }): Promise<Listing[]> {
      if (isSupabaseConfigured()) {
        try {
          let query = supabase
            .from('listings')
            .select('*, listing_images(*), profiles(*)');

          if (params?.city && params.city !== 'All Poland' && params.city !== 'Anywhere in Poland') {
            query = query.ilike('city', `%${params.city}%`);
          }
          if (params?.maxRent) {
            query = query.lte('monthly_rent_pln', params.maxRent);
          }
          if (params?.meldunek) {
            query = query.eq('meldunek_friendly', true);
          }

          const { data, error } = await query;
          if (!error && data) {
            return data.map(mapSupabaseListingToApp);
          }
        } catch (e) {
          console.warn('Supabase fetch listings fallback:', e);
        }
      }

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
      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase
            .from('listings')
            .select('*, listing_images(*), profiles(*)')
            .eq('id', id)
            .maybeSingle();

          if (!error && data) {
            return mapSupabaseListingToApp(data);
          }
        } catch (e) {}
      }

      const res = await fetch(`/api/listings/${id}`);
      if (!res.ok) throw new Error('Listing not found');
      return res.json();
    },

    async create(listing: Partial<Listing>): Promise<Listing> {
      if (isSupabaseConfigured()) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const userId = sessionData?.session?.user?.id;
          if (userId) {
            const { data: newListing, error } = await supabase
              .from('listings')
              .insert({
                owner_id: userId,
                title: listing.title || 'Apartment in Poland',
                description: listing.description || '',
                city: listing.city || 'Warsaw',
                address: listing.address || `${listing.city || 'Warsaw'}, Poland`,
                monthly_rent_pln: listing.monthlyRentPLN || 2000,
                utilities_pln: listing.czynszAdminPLN || 0,
                deposit_pln: listing.depositPLN || 2000,
                meldunek_friendly: Boolean(listing.meldunekAllowed),
                is_cesja: true,
                available_from: listing.availableDate || new Date().toISOString().split('T')[0],
                contract_end_date: listing.leaseEndDate || '2027-06-30',
                status: 'active'
              })
              .select()
              .single();

            if (newListing) {
              if (listing.images && listing.images.length > 0) {
                await supabase.from('listing_images').insert(
                  listing.images.map((url, idx) => ({
                    listing_id: newListing.id,
                    image_url: url,
                    display_order: idx
                  }))
                );
              }
              return mapSupabaseListingToApp({
                ...newListing,
                listing_images: listing.images?.map(img => ({ image_url: img }))
              });
            }
          }
        } catch (e) {
          console.warn('Supabase create listing fallback:', e);
        }
      }

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
      if (isSupabaseConfigured()) {
        try {
          await supabase.from('listings').delete().eq('id', id);
        } catch (e) {}
      }

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
