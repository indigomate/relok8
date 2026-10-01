-- ==============================================================================
-- RELOK8 (relok8.online) - PRODUCTION SUPABASE DATABASE SCHEMA
-- Only run this file in the Supabase SQL Editor.
-- (Do NOT paste TypeScript code here)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- In Supabase, install PostGIS in the 'extensions' schema.
-- This keeps internal system tables like 'spatial_ref_sys' out of 'public',
-- preventing false-positive RLS warnings and ownership errors.
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE gender_preference_type AS ENUM ('any', 'female_only', 'male_only');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE listing_status_type AS ENUM ('draft', 'active', 'reserved', 'rented');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_type AS ENUM ('pending', 'paid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    phone_number TEXT,
    whatsapp_number TEXT,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Trigger to automatically create a profile row when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Restrict execution so anon/authenticated users cannot invoke trigger function directly via PostgREST RPC
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. LISTINGS TABLE
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    location GEOGRAPHY(Point, 4326),
    monthly_rent_pln INTEGER NOT NULL CHECK (monthly_rent_pln >= 0),
    utilities_pln INTEGER DEFAULT 0 NOT NULL CHECK (utilities_pln >= 0),
    deposit_pln INTEGER DEFAULT 0 NOT NULL CHECK (deposit_pln >= 0),
    gender_preference gender_preference_type DEFAULT 'any' NOT NULL,
    is_cesja BOOLEAN DEFAULT FALSE NOT NULL,
    available_from DATE DEFAULT CURRENT_DATE NOT NULL,
    contract_end_date DATE,
    meldunek_friendly BOOLEAN DEFAULT FALSE NOT NULL,
    status listing_status_type DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. LISTING IMAGES TABLE
CREATE TABLE IF NOT EXISTS public.listing_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. MATCHES AND INQUIRIES TABLE
CREATE TABLE IF NOT EXISTS public.matches_and_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    student_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_notes TEXT,
    payment_status payment_status_type DEFAULT 'pending' NOT NULL,
    match_fee_pln INTEGER DEFAULT 0 NOT NULL CHECK (match_fee_pln >= 0),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. MESSAGES TABLE (Realtime communication)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Realtime publication for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 8. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_listings_city ON public.listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_owner_id ON public.listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON public.listing_images(listing_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_listing_id ON public.matches_and_inquiries(listing_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_student ON public.matches_and_inquiries(student_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(sender_id, recipient_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches_and_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- LISTINGS POLICIES
DROP POLICY IF EXISTS "Active listings viewable by everyone" ON public.listings;
CREATE POLICY "Active listings viewable by everyone"
    ON public.listings FOR SELECT
    USING (status = 'active' OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "Authenticated users can create listings" ON public.listings;
CREATE POLICY "Authenticated users can create listings"
    ON public.listings FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update own listings" ON public.listings;
CREATE POLICY "Owners can update own listings"
    ON public.listings FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete own listings" ON public.listings;
CREATE POLICY "Owners can delete own listings"
    ON public.listings FOR DELETE
    USING (auth.uid() = owner_id);

-- LISTING IMAGES POLICIES
DROP POLICY IF EXISTS "Listing images are viewable with listing" ON public.listing_images;
CREATE POLICY "Listing images are viewable with listing"
    ON public.listing_images FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.listings
            WHERE public.listings.id = public.listing_images.listing_id
            AND (public.listings.status = 'active' OR public.listings.owner_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Listing owners can insert images" ON public.listing_images;
CREATE POLICY "Listing owners can insert images"
    ON public.listing_images FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.listings
            WHERE public.listings.id = public.listing_images.listing_id
            AND public.listings.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Listing owners can update images" ON public.listing_images;
CREATE POLICY "Listing owners can update images"
    ON public.listing_images FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.listings
            WHERE public.listings.id = public.listing_images.listing_id
            AND public.listings.owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Listing owners can delete images" ON public.listing_images;
CREATE POLICY "Listing owners can delete images"
    ON public.listing_images FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.listings
            WHERE public.listings.id = public.listing_images.listing_id
            AND public.listings.owner_id = auth.uid()
        )
    );

-- MATCHES AND INQUIRIES POLICIES
DROP POLICY IF EXISTS "Students can create inquiries" ON public.matches_and_inquiries;
CREATE POLICY "Students can create inquiries"
    ON public.matches_and_inquiries FOR INSERT
    WITH CHECK (auth.uid() = student_user_id);

DROP POLICY IF EXISTS "Inquiries viewable by student or listing owner" ON public.matches_and_inquiries;
CREATE POLICY "Inquiries viewable by student or listing owner"
    ON public.matches_and_inquiries FOR SELECT
    USING (
        auth.uid() = student_user_id
        OR EXISTS (
            SELECT 1 FROM public.listings
            WHERE public.listings.id = public.matches_and_inquiries.listing_id
            AND public.listings.owner_id = auth.uid()
        )
    );

-- MESSAGES POLICIES
DROP POLICY IF EXISTS "Users can read own messages" ON public.messages;
CREATE POLICY "Users can read own messages"
    ON public.messages FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can send messages as sender" ON public.messages;
CREATE POLICY "Users can send messages as sender"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- ==============================================================================
-- STORAGE BUCKETS SETUP
-- ==============================================================================

-- Create buckets in storage schema
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('property-images', 'property-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic']),
    ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS Policies:
-- In Supabase, buckets marked public=true automatically serve all objects via public CDN URL
-- without needing a SELECT policy on storage.objects.
-- Removing broad SELECT policies prevents unauthorized enumeration/listing of the entire bucket.
DROP POLICY IF EXISTS "Public can view property images" ON storage.objects;
DROP POLICY IF EXISTS "Property images are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;

-- Authenticated upload policies
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
CREATE POLICY "Authenticated users can upload property images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can upload own avatar" ON storage.objects;
CREATE POLICY "Authenticated users can upload own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
