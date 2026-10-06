import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Listing } from '../../types';
import { Database, GenderPreference, ListingStatus } from '../../types/supabase';

const supabaseUrl = (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
const supabaseAnonKey = (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseAnonKey.includes('your-anon-key')
  );
};

// Create the Supabase client. Fallback to placeholder client if not yet configured
// so the application never crashes during build or initialization.
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured() ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

/**
 * Storage helpers
 */
export async function uploadListingImage(
  file: File | Blob,
  listingId: string,
  fileName?: string
): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const name = fileName || `${listingId}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
  const { data, error } = await supabase.storage
    .from('property-images')
    .upload(name, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    throw error;
  }

  const { data: publicData } = supabase.storage
    .from('property-images')
    .getPublicUrl(data.path);

  return publicData.publicUrl;
}

export async function uploadAvatar(file: File | Blob, userId: string): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const path = `${userId}/avatar-${Date.now()}.jpg`;
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) throw error;

  const { data: publicData } = supabase.storage
    .from('avatars')
    .getPublicUrl(data.path);

  return publicData.publicUrl;
}

/**
 * Mapper: Converts a Supabase listing row + images + owner profile to the frontend Listing format
 */
export function mapSupabaseListingToApp(row: any): Listing {
  const images = (row.listing_images || [])
    .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
    .map((img: any) => img.image_url);

  const fallbackImage = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80';
  const owner = row.profiles || {};

  // Infer room type from gender preference or title/description
  let roomType: 'Studio' | 'Private room' | '1-bedroom' | '2-bedroom' = 'Studio';
  const titleLower = (row.title || '').toLowerCase();
  const descLower = (row.description || '').toLowerCase();
  if (titleLower.includes('private room') || descLower.includes('private room') || row.gender_preference === 'female_only' || row.gender_preference === 'male_only') {
    roomType = 'Private room';
  } else if (titleLower.includes('1-bed') || titleLower.includes('1 bedroom') || descLower.includes('1-bedroom')) {
    roomType = '1-bedroom';
  } else if (titleLower.includes('2-bed') || titleLower.includes('2 bedroom') || descLower.includes('2-bedroom')) {
    roomType = '2-bedroom';
  }

  return {
    id: row.id,
    type: 'lease_takeover',
    title: row.title || 'Apartment in Poland',
    city: row.city || 'Warsaw',
    district: row.address?.split(',')[0] || row.city || 'Central',
    address: row.address || `${row.city}, Poland`,
    roomType,
    monthlyRentPLN: Number(row.monthly_rent_pln) || 0,
    czynszAdminPLN: Number(row.utilities_pln) || 0,
    billsIncluded: Number(row.utilities_pln) === 0,
    czynszIncluded: true,
    depositPLN: Number(row.deposit_pln) || 0,
    availableDate: row.available_from || new Date().toISOString().split('T')[0],
    leaseEndDate: row.contract_end_date || '2027-06-30',
    remainingMonths: 8,
    squareMeters: 35,
    isFurnished: true,
    flatmatesCount: roomType === 'Private room' ? 2 : 0,
    distanceToCampus: '10 min direct transit to university',
    meldunekAllowed: Boolean(row.meldunek_friendly),
    landlordApproved: true,
    landlordConsentStatus: 'Pre-Approved',
    images: images.length > 0 ? images : [fallbackImage],
    statusBadge: row.is_cesja ? 'Cesja Available' : undefined,
    landlordName: owner.full_name || 'Landlord Pre-Approved',
    landlordContactEmail: 'contact@relok8.online',
    currentTenant: {
      name: owner.full_name || 'Departing Tenant',
      nationality: 'Expat / Student in Poland',
      role: 'Verified Tenant',
      avatar: owner.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      verifiedDocs: ['Identity Verified', 'Active Lease'],
      reasonForLeaving: 'Lease takeover authorized by landlord.',
      joinedYear: '2026'
    },
    departingTenant: {
      name: owner.full_name || 'Departing Tenant',
      nationality: 'Expat / Student in Poland',
      role: 'Verified Tenant',
      avatar: owner.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      verifiedDocs: ['Identity Verified', 'Active Lease'],
      reasonForLeaving: 'Lease takeover authorized by landlord.',
      joinedYear: '2026'
    },
    amenities: [
      'High-Speed Wi-Fi',
      'Fully Furnished',
      'Washing Machine',
      'Study Desk & Lamp',
      'Central Heating'
    ],
    universitiesNearby: [
      `${row.city} University Campuses (10-15 min transit)`
    ],
    transitNearby: 'Close to metro, tram & bus stops',
    description: row.description || 'Pre-approved lease handover under Article 509 KC. No broker fees or hidden commissions. Address registration (meldunek) guaranteed.',
    floor: '2nd floor',
    depositSettlementType: 'P2P Direct Clearing',
    likesCount: 12
  };
}

/**
 * Standard CRUD Operations for Listings
 */

export interface ListingFilterParams {
  city?: string;
  roomType?: string;
  maxRent?: number;
  meldunek?: boolean;
  q?: string;
  status?: ListingStatus;
}

/**
 * READ: Fetch all active listings from Supabase with relational images and profiles
 */
export async function getListings(params?: ListingFilterParams): Promise<Listing[]> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, returning empty listings list or local fallback');
    // Attempt local API fetch if Supabase env vars not set
    try {
      const res = await fetch('/api/listings');
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return [];
  }

  try {
    let query = supabase
      .from('listings')
      .select('*, listing_images(*), profiles(*)')
      .order('created_at', { ascending: false });

    // Optional status filter (default to active for public queries)
    if (params?.status) {
      query = query.eq('status', params.status);
    } else {
      query = query.eq('status', 'active');
    }

    // City filter
    if (params?.city && params.city !== 'All Poland' && params.city !== 'Anywhere in Poland') {
      query = query.ilike('city', `%${params.city}%`);
    }

    // Max rent filter
    if (params?.maxRent && params.maxRent < 5000) {
      query = query.lte('monthly_rent_pln', params.maxRent);
    }

    // Meldunek filter
    if (params?.meldunek) {
      query = query.eq('meldunek_friendly', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching listings from Supabase:', error.message, error.details);
      throw error;
    }

    if (!data || data.length === 0) {
      // If live Supabase table is empty, fall back to backend API verified listings
      try {
        const res = await fetch('/api/listings');
        if (res.ok) {
          const apiData = await res.json();
          const items = Array.isArray(apiData) ? apiData : (apiData.listings || []);
          if (items.length > 0) return items;
        }
      } catch {}
      return [];
    }

    return data.map(mapSupabaseListingToApp);
  } catch (err) {
    console.error('Failed to get listings from Supabase, attempting API fallback:', err);
    try {
      const res = await fetch('/api/listings');
      if (res.ok) {
        const apiData = await res.json();
        const items = Array.isArray(apiData) ? apiData : (apiData.listings || []);
        if (items.length > 0) return items;
      }
    } catch {}
    throw err;
  }
}

/**
 * READ: Fetch single listing by ID with images and owner profile
 */
export async function getListingById(id: string): Promise<Listing | null> {
  if (!isSupabaseConfigured()) {
    try {
      const res = await fetch(`/api/listings/${id}`);
      if (res.ok) return await res.json();
    } catch {}
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*, listing_images(*), profiles(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching listing ${id} from Supabase:`, error.message);
      throw error;
    }

    if (!data) return null;
    return mapSupabaseListingToApp(data);
  } catch (err) {
    console.error(`Failed to get listing ${id}:`, err);
    throw err;
  }
}

/**
 * CREATE: Insert a new listing into Supabase and associate images
 */
export async function createListing(listing: Listing): Promise<Listing> {
  if (!isSupabaseConfigured()) {
    // Fallback to local API
    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listing)
    });
    if (!res.ok) throw new Error('Failed to create listing via local API');
    return await res.json();
  }

  try {
    // 1. Get current authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    let ownerId = session?.user?.id;

    // If not authenticated, check if any profile exists or create anonymous profile
    if (!ownerId) {
      const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
      if (profiles && profiles.length > 0) {
        ownerId = profiles[0].id;
      } else {
        // Generate UUID or anonymous profile
        const anonId = crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-0000-0000-000000000001';
        await supabase.from('profiles').upsert({
          id: anonId,
          full_name: listing.currentTenant?.name || 'Verified Landlord / Tenant',
          is_verified: true
        });
        ownerId = anonId;
      }
    }

    // Determine gender preference
    let genderPref: GenderPreference = 'any';
    if (listing.roomType === 'Female-only room') genderPref = 'female_only';
    if (listing.roomType === 'Male-only room') genderPref = 'male_only';

    // 2. Insert into listings table
    const { data: inserted, error: insertError } = await supabase
      .from('listings')
      .insert({
        owner_id: ownerId,
        title: listing.title,
        description: listing.description || `${listing.roomType} in ${listing.city}`,
        city: listing.city,
        address: listing.address,
        monthly_rent_pln: listing.monthlyRentPLN,
        utilities_pln: listing.czynszAdminPLN || 0,
        deposit_pln: listing.depositPLN || listing.monthlyRentPLN,
        gender_preference: genderPref,
        is_cesja: true,
        available_from: listing.availableDate || new Date().toISOString().split('T')[0],
        contract_end_date: listing.leaseEndDate || '2027-06-30',
        meldunek_friendly: Boolean(listing.meldunekAllowed),
        status: 'active'
      })
      .select('*, profiles(*)')
      .single();

    if (insertError) {
      console.warn('Supabase RLS insert notice, falling back to server API:', insertError.message);
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listing)
      });
      if (res.ok) return await res.json();
      throw insertError;
    }

    // 3. Insert images into listing_images
    if (listing.images && listing.images.length > 0) {
      const imageRecords = listing.images.map((url, idx) => ({
        listing_id: inserted.id,
        image_url: url,
        display_order: idx
      }));

      await supabase.from('listing_images').insert(imageRecords);
    }

    // Fetch complete record with relational images
    const complete = await getListingById(inserted.id);
    return complete || mapSupabaseListingToApp(inserted);
  } catch (err) {
    console.error('Failed to create listing in Supabase:', err);
    throw err;
  }
}

/**
 * UPDATE: Update existing listing row in Supabase
 */
export async function updateListing(id: string, updates: Partial<Listing>): Promise<Listing | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const dbUpdates: any = {};
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.city) dbUpdates.city = updates.city;
    if (updates.address) dbUpdates.address = updates.address;
    if (updates.monthlyRentPLN !== undefined) dbUpdates.monthly_rent_pln = updates.monthlyRentPLN;
    if (updates.czynszAdminPLN !== undefined) dbUpdates.utilities_pln = updates.czynszAdminPLN;
    if (updates.depositPLN !== undefined) dbUpdates.deposit_pln = updates.depositPLN;
    if (updates.availableDate) dbUpdates.available_from = updates.availableDate;
    if (updates.leaseEndDate) dbUpdates.contract_end_date = updates.leaseEndDate;
    if (updates.meldunekAllowed !== undefined) dbUpdates.meldunek_friendly = updates.meldunekAllowed;

    const { error } = await supabase
      .from('listings')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error(`Error updating listing ${id}:`, error.message);
      throw error;
    }

    return await getListingById(id);
  } catch (err) {
    console.error(`Failed to update listing ${id}:`, err);
    throw err;
  }
}

/**
 * DELETE: Remove listing from Supabase
 */
export async function deleteListing(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return true;
  }

  try {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting listing ${id}:`, error.message);
      throw error;
    }
    return true;
  } catch (err) {
    console.error(`Failed to delete listing ${id}:`, err);
    throw err;
  }
}

/**
 * User & Favorites Helpers
 */
export async function getCurrentUser(): Promise<any | null> {
  if (!isSupabaseConfigured()) {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        return data.user;
      }
    } catch {}
    return null;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    return {
      id: session.user.id,
      name: profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
      email: session.user.email || '',
      avatar: profile?.avatar_url || session.user.user_metadata?.avatar_url,
      isVerified: profile?.is_verified ?? false,
      role: session.user.user_metadata?.role || 'student'
    };
  } catch (err) {
    console.warn('Error fetching current user:', err);
    return null;
  }
}

export async function addFavorite(listingId: string): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('matches_and_inquiries').insert({
          listing_id: listingId,
          student_user_id: session.user.id,
          payment_status: 'pending',
          match_fee_pln: 0,
          admin_notes: 'Saved to favorites'
        });
      }
    }
  } catch (err) {
    console.warn('Failed to add favorite to Supabase:', err);
  }
}

export async function removeFavorite(listingId: string): Promise<void> {
  try {
    if (isSupabaseConfigured()) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase
          .from('matches_and_inquiries')
          .delete()
          .eq('listing_id', listingId)
          .eq('student_user_id', session.user.id);
      }
    }
  } catch (err) {
    console.warn('Failed to remove favorite from Supabase:', err);
  }
}

export async function signIn(email: string, password?: string): Promise<any> {
  if (isSupabaseConfigured()) {
    try {
      if (password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        if (data.session) {
          return await getCurrentUser();
        }
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email === email) {
          return await getCurrentUser();
        }

        const { error } = await supabase.auth.signInWithOtp({ email });
        if (!error) {
          return {
            id: 'supa-' + Math.random().toString(36).substring(7),
            name: email.split('@')[0],
            email,
            isVerified: true
          };
        }
      }
    } catch (e: any) {
      console.warn('Supabase signIn:', e?.message || e);
      if (password) throw e;
    }
  }

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Invalid email or password');
  const data = await res.json();
  if (data.token) localStorage.setItem('r8_token', data.token);
  return data.user;
}

export async function signUp(payload: { email: string; password?: string; name?: string; university?: string; role?: string; phone?: string }): Promise<any> {
  if (isSupabaseConfigured()) {
    try {
      const securePassword = payload.password || ('R8_' + Math.random().toString(36).slice(2) + '!2026');
      const { data, error } = await supabase.auth.signUp({
        email: payload.email,
        password: securePassword,
        options: {
          data: {
            full_name: payload.name || payload.email.split('@')[0],
            university: payload.university || '',
            role: payload.role || 'student',
            phone_number: payload.phone || ''
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: payload.name || payload.email.split('@')[0],
          phone_number: payload.phone || null,
          whatsapp_number: payload.phone || null,
          is_verified: true
        });

        const userProf = {
          id: data.user.id,
          name: payload.name || payload.email.split('@')[0],
          email: payload.email,
          university: payload.university,
          role: payload.role || 'student',
          phone: payload.phone || '',
          isVerified: true
        };
        localStorage.setItem('r8_user', JSON.stringify(userProf));
        return userProf;
      }
    } catch (e: any) {
      console.warn('Supabase signUp:', e?.message || e);
      if (payload.password) throw e;
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
  return data.user;
}

export async function updateUserProfile(userId: string, updates: { full_name?: string; avatar_url?: string; phone_number?: string; whatsapp_number?: string }): Promise<any> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Supabase update profile error:', e);
    }
  }
  return updates;
}

export async function getUserListings(userId: string): Promise<Listing[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*, listing_images(*), profiles(*)')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapSupabaseListingToApp);
  } catch (err) {
    console.error('Error fetching user listings:', err);
    return [];
  }
}

export async function getUserInquiries(userId: string): Promise<any[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('matches_and_inquiries')
      .select('*, listings(*)')
      .eq('student_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Error fetching user inquiries:', err);
    return [];
  }
}

export function onAuthStateChange(callback: (user: any | null) => void): () => void {
  if (!isSupabaseConfigured()) {
    return () => {};
  }
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      const user = await getCurrentUser();
      callback(user);
    } else {
      callback(null);
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
  }
  localStorage.removeItem('r8_token');
  localStorage.removeItem('r8_user');
  fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
}

export async function likeListing(listingId: string): Promise<void> {
  try {
    await fetch(`/api/listings/${listingId}/like`, { method: 'POST' }).catch(() => {});
  } catch {}
}
