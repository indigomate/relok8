-- ==============================================================================
-- RELOK8 (relok8.online) - DATABASE SEED DATA
-- Run this in your Supabase SQL Editor to populate verified housing listings
-- across Poland's student hubs (Warsaw, Kraków, Wrocław, Gdańsk, Poznań, Lublin).
-- ==============================================================================

-- 0. PREPARATION: Remove foreign key to auth.users so seed data & external auth (Clerk) run smoothly
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- (Optional) Ensure seed users exist in auth.users as well
DO $$
BEGIN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES 
        ('a0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'piotr.kaminski@relok8.online', '$2a$10$dummyhashedpasswordforrelok8seeduser0001', NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Piotr Kamiński"}'::jsonb, NOW(), NOW()),
        ('a0000002-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'matteo.rossi@relok8.online', '$2a$10$dummyhashedpasswordforrelok8seeduser0002', NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Matteo Rossi"}'::jsonb, NOW(), NOW()),
        ('a0000003-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sofia.lindqvist@relok8.online', '$2a$10$dummyhashedpasswordforrelok8seeduser0003', NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Sofia Lindqvist"}'::jsonb, NOW(), NOW()),
        ('a0000004-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lucas.dupont@relok8.online', '$2a$10$dummyhashedpasswordforrelok8seeduser0004', NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Lucas Dupont"}'::jsonb, NOW(), NOW()),
        ('a0000005-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'amina.almansoor@relok8.online', '$2a$10$dummyhashedpasswordforrelok8seeduser0005', NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Amina Al-Mansoor"}'::jsonb, NOW(), NOW()),
        ('a0000006-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'marta.wisniewska@relok8.online', '$2a$10$dummyhashedpasswordforrelok8seeduser0006', NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Marta Wiśniewska"}'::jsonb, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 1. SEED PROFILES (Host / Landlord / Departing Tenants)
INSERT INTO public.profiles (id, full_name, avatar_url, phone_number, whatsapp_number, is_verified)
VALUES
    ('a0000001-0000-0000-0000-000000000001', 'Piotr Kamiński', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', '+48 601 234 567', '+48601234567', true),
    ('a0000002-0000-0000-0000-000000000002', 'Matteo Rossi', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', '+48 602 345 678', '+48602345678', true),
    ('a0000003-0000-0000-0000-000000000003', 'Sofia Lindqvist', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80', '+48 603 456 789', '+48603456789', true),
    ('a0000004-0000-0000-0000-000000000004', 'Lucas Dupont', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', '+48 604 567 890', '+48604567890', true),
    ('a0000005-0000-0000-0000-000000000005', 'Amina Al-Mansoor', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', '+48 605 678 901', '+48605678901', true),
    ('a0000006-0000-0000-0000-000000000006', 'Marta Wiśniewska', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80', '+48 606 789 012', '+48606789012', true)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    is_verified = EXCLUDED.is_verified;

-- 2. SEED LISTINGS
INSERT INTO public.listings (
    id, owner_id, title, description, city, address, 
    monthly_rent_pln, utilities_pln, deposit_pln, gender_preference, 
    is_cesja, available_from, contract_end_date, meldunek_friendly, status
)
VALUES
    (
        'b0000001-0000-0000-0000-000000000001',
        'a0000001-0000-0000-0000-000000000001',
        'Furnished Room near AGH and UJ Campus',
        'Quiet 19 m² private room in a comfortable 3-room student flat in Krowodrza. Double bed, desk, high-speed fiber internet, and pre-approved landlord takeover protocol under Art. 509 KC. Address registration (meldunek) guaranteed.',
        'Kraków',
        'ul. Czarnowiejska 52, 30-054 Kraków',
        1650, 280, 1800, 'any', true, CURRENT_DATE, '2027-06-30', true, 'active'
    ),
    (
        'b0000002-0000-0000-0000-000000000002',
        'a0000002-0000-0000-0000-000000000002',
        'Bright Studio in Upper Mokotów near SGH',
        'Modern 34 m² studio apartment with park view balcony, custom study workspace, dishwasher, and underground bike storage. Direct lease takeover with landlord consent in place. 6 min walk to SGH.',
        'Warsaw',
        'ul. Rakowiecka 32, 02-521 Warszawa',
        2400, 450, 2850, 'any', true, CURRENT_DATE, '2027-06-30', true, 'active'
    ),
    (
        'b0000003-0000-0000-0000-000000000003',
        'a0000003-0000-0000-0000-000000000003',
        'Nordic Style Room in Historic Nadodrze',
        'High ceilings (3.2m), triple-glazed quiet windows, wooden floors, and Scandinavian furniture. Walking distance to University of Wrocław main campus. Meldunek supported.',
        'Wrocław',
        'ul. Chrobrego 14, 50-254 Wrocław',
        1550, 240, 1600, 'female_only', true, CURRENT_DATE, '2027-07-31', true, 'active'
    ),
    (
        'b0000004-0000-0000-0000-000000000004',
        'a0000004-0000-0000-0000-000000000004',
        'Modern 1-Bedroom Flat near Gdańsk Tech',
        'Chic 42 m² 1-bedroom flat in Wrzeszcz. Quiet courtyard balcony, open kitchen with island, and dedicated underground parking. 7 min walk to Gdańsk University of Technology.',
        'Gdańsk',
        'ul. Grunwaldzka 102, 80-244 Gdańsk',
        2600, 480, 2900, 'any', true, CURRENT_DATE, '2027-08-31', true, 'active'
    ),
    (
        'b0000005-0000-0000-0000-000000000005',
        'a0000005-0000-0000-0000-000000000005',
        'Quiet Study Room near Medical University',
        'Air-conditioned private room in central Lublin. Dedicated study desk, fast WiFi, and walking distance to UMLub clinical hospital. Shared with one quiet senior medical student.',
        'Lublin',
        'ul. Spokojna 12, 20-072 Lublin',
        1350, 220, 1400, 'any', true, CURRENT_DATE, '2027-06-30', true, 'active'
    ),
    (
        'b0000006-0000-0000-0000-000000000006',
        'a0000006-0000-0000-0000-000000000006',
        'Sunny Room by Jeżyce Market & UAM',
        'Spacious room in bohemian Jeżyce. Close to Adam Mickiewicz University (UAM) and Poznań University of Medical Sciences. Landlord supports address registration and deposit protocol.',
        'Poznań',
        'ul. Dąbrowskiego 45, 60-842 Poznań',
        1450, 250, 1500, 'any', true, CURRENT_DATE, '2027-06-30', true, 'active'
    )
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    monthly_rent_pln = EXCLUDED.monthly_rent_pln,
    utilities_pln = EXCLUDED.utilities_pln,
    deposit_pln = EXCLUDED.deposit_pln,
    status = EXCLUDED.status;

-- 3. SEED LISTING IMAGES
INSERT INTO public.listing_images (id, listing_id, image_url, display_order)
VALUES
    ('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80', 0),
    ('c0000002-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80', 1),
    ('c0000003-0000-0000-0000-000000000002', 'b0000002-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80', 0),
    ('c0000004-0000-0000-0000-000000000002', 'b0000002-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80', 1),
    ('c0000005-0000-0000-0000-000000000003', 'b0000003-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80', 0),
    ('c0000006-0000-0000-0000-000000000003', 'b0000003-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80', 1),
    ('c0000007-0000-0000-0000-000000000004', 'b0000004-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80', 0),
    ('c0000008-0000-0000-0000-000000000005', 'b0000005-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80', 0),
    ('c0000009-0000-0000-0000-000000000006', 'b0000006-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80', 0)
ON CONFLICT (id) DO NOTHING;
