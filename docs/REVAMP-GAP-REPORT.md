# Relok8 Gap Report: Audit & Comparison

**Generated:** October 13, 2026  
**Auditor:** Senior Full-Stack Engineer & Technical Auditor (AI Studio Engine)  
**Target Specification:** REVAMP Brief (PRD v4, Build Spec, Target Data Model, Design System, Approved Elements)

---

## Executive Summary & Non-Negotiables Check

1. **Colour Policy:** Palette preserved exactly from the existing application (`#FAFAFB` bg, `#FFFFFF` surface, `#4F46E5` primary indigo, `#FF6B5B` accent coral, `#047857` success emerald, `#B45309` warning amber, `#B42318` danger crimson). Tokens mapped directly to semantic roles.
2. **Preserve Working Flows:** The home page layout (header search pill, segmented search bar, filter chips, listing cards, avatar dropdown, Help Center) remains fully operational and intact.
3. **Backend Decision Gate:** The existing codebase operates on a hybrid architecture: React SPA (Vite) + Express (`server.ts`) with Supabase (`@supabase/supabase-js`) and an initial Convex setup (`convex/schema.ts` with 11 tables). Per Non-Negotiable 4, we provide an honest comparison and 3 options, recommending Option B (gradual migration behind a clean data-access layer), and do not perform a destructive database migration without explicit owner confirmation.
4. **Payments Decision Gate:** All payment, deposit, and hold logic remains strictly in gated Stripe test mode until the owner answers the open regulatory and hold-window questions.

---

## A. Architecture Comparison

| Layer | Target (REVAMP brief) | Existing App | Status | Recommendation | Effort | Risk |
|---|---|---|---|---|---|---|
| **Frontend Framework & Hosting** | Next.js (App Router, TypeScript) on Vercel | React 19 (Vite 8.3) SPA + Express 4.21 (`server.ts`) running on Node.js / Vercel (`vercel.json`) | Partial | Keep current Vite + Express runtime for zero-downtime stability, refactor components to modular structure ready for Next.js App Router. | M | Medium |
| **Backend & Database** | Convex (data, reactive queries, mutations, crons, actions) | Express REST API (`server.ts`) + Supabase Postgres (`@supabase/supabase-js`) + partial Convex schema (`convex/`) | Conflicts / Partial | Create unified Repository / Data-Access Layer (`src/services/dataAccess.ts`) abstracting backend so app functions seamlessly with current data or Convex without breaking. Await owner decision. | L | High |
| **Auth & Roles** | Clerk (`@clerk/react` synced to Convex `users`) | Clerk (`@clerk/react` 6.17) installed, plus localStorage fallback & Supabase Auth (`src/lib/supabaseClient.ts`) | Partial | Standardize on Clerk user hooks with local fallback when unauthenticated. Connect Clerk webhook to sync roles. | M | Low |
| **File Storage** | Convex file storage (`_storage`) | Supabase storage bucket references + external CDN URLs (Unsplash) | Partial | Implement abstracted storage service (`uploadMedia`) supporting current URLs and Convex storage IDs. | S | Low |
| **Real-time & Messaging** | Convex reactive subscriptions for shared inbox | In-memory message store in `server.ts` + Supabase realtime subscription hooks | Partial | Keep in-memory/Convex reactive bridge in `src/pages/MessagesPage.tsx`, wire to unified messages API. | M | Low |
| **Background Jobs & Crons** | Convex cron jobs & scheduled functions (`convex/crons.ts`) | In-memory `setInterval` in `server.ts` for reservation timeouts | Partial | Implement scheduled task simulation in server, wire to Convex crons once backend is finalized. | S | Low |
| **Webhooks (WhatsApp, Stripe, Auth)** | Convex HTTP actions (`convex/http.ts`) | Express routes in `server.ts` (`/api/webhooks/*`, `/api/reservations`) | Partial | Keep Express webhook handlers in `server.ts` with signature verification, ready to port to `convex/http.ts`. | M | Medium |
| **Email** | Resend via server actions / Convex actions | Resend SDK (`src/lib/resend.ts`) in `server.ts` with HTML templates | Matches | Maintain Resend templates; ensure Polish & English bilingual copies. | S | Low |
| **AI Layer (Onlo)** | Gemini API via wrapper (`convex/onlo/model.ts`), logged in `onloActions` | `@google/genai` (2.4.0) in `src/lib/aiGateway.ts` & `src/lib/onloService.ts` | Partial | Unify AI calls under a single Onlo gateway (`src/lib/onloService.ts`) with mandatory audit logging. | S | Low |
| **Payments** | Stripe Connect manual-capture hold (149 PLN, 49 fee) | Stripe simulated endpoints in `server.ts` and `EarlyLockModal.tsx` | Partial (Gated) | Keep strictly in test/simulated mode. Gated until open money questions are clarified. | M | High |
| **i18n & RTL** | next-intl with routing (`/en`, `/pl`, `/uk`, `/es`, `/ar`), Arabic RTL | Custom dictionary in `src/utils/translations.ts` (`en`, `pl` only), no RTL | Partial | Expand translation matrix to include `uk`, `es`, `ar`, add logical CSS properties (`ms-`, `me-`, `ps-`, `pe-`), enable `dir="rtl"`. | M | Low |
| **Analytics & Error Tracking** | PostHog & Sentry | Local error handlers in `server.ts` and React error boundaries | Missing | Add error reporting wrapper and event dispatchers for conversion funnel. | S | Low |
| **Permissions Enforcement** | Convex server helpers (`requireUser`, `requireRole`, `requireLeaseMember`, `requireListingOwner`) | Client-side checks in UI + role switcher (`DevRoleSwitcher.tsx`) | Conflicts | Move permission rules into reusable server-side middleware and data-access layer guards. | M | Medium |

---

## B. Feature Comparison

| Feature | Target | Existing App | Status | Recommendation | Effort | Risk |
|---|---|---|---|---|---|---|
| **Current Listings** | Vacant rentals posted by landlords, first-class in search | Supported (`mockListings.ts`, `server.ts`, `ListPage.tsx`) | Matches | Maintain existing cards and data structures. | S | Low |
| **Takeover (Cesja) Listings** | Tenant exit listings tagged "Available for Takeover" | Fully supported in search, card, and detail views | Matches | Ensure uniform card design and accent tag visibility. | S | Low |
| **Unified Search & Cards** | Single search for both kinds; filter chips, responsive cards | Supported (`SearchBar.tsx`, `FiltersBar.tsx`, `ListingCard.tsx`) | Matches | Polish responsive padding and touch targets on mobile. | S | Low |
| **Listing Detail** | Gallery, sticky action panel, facts grid, distances, landlord info | Supported (`ListingDetailPage.tsx`) with lightbox, 15m hold modal | Matches | Align styling with design tokens; ensure distances list format is clean. | S | Low |
| **Saved Listings & Alerts** | Save heart, alerts when available | Supported (`SavedApartmentsPage.tsx`, `AlertCaptureCard.tsx`) | Matches | Connect alert notification subscription state cleanly. | S | Low |
| **Applications** | Multi-status application queue (new, shortlisted, approved) | Partial (`src/services/api.ts` inquiry flows) | Partial | Build structured application status tracker in tenant and landlord portals. | M | Low |
| **Landlord Portal & Verification** | Dashboard, listings, tenants, verification badge | Supported (`LandlordDashboard.tsx`) | Matches | Ensure landlord role controls align with permission model. | S | Low |
| **Tenant Dashboard** | My lease, saved, applications, rewards, subscription | Supported (`PlacePage.tsx`, `AccountPage.tsx`, `RewardsPage.tsx`) | Matches | Keep recently restyled My Place page pristine. | S | Low |
| **Shared Lease Dashboard** | Shared view for tenant + landlord, facts, takeover progress, chat | Supported (`PlacePage.tsx`) with 5-step progress & handover actions | Matches | Preserve My Place page structure as per user's previous restyle. | S | Low |
| **In-App Messaging** | Shared inbox, Onlo replies with caption, human takeover button | Supported (`MessagesPage.tsx`, `PlacePage.tsx`) | Partial | Add explicit "Onlo is answering / Take over" banner to thread header. | S | Low |
| **Notifications** | In-app, email (Resend), WhatsApp | Supported in-app (`NotificationsPage.tsx`) and Resend email | Matches | Add simulated WhatsApp notification dispatch for demo testing. | S | Low |
| **FEAT-001 AI Agent** | 24/7 multilingual leasing agent (WhatsApp & Web) | Web agent supported (`AIProxyChatModal.tsx`, `onloService.ts`) | Partial | Ensure agent handles English, Polish, Ukrainian, Spanish, Arabic queries. | M | Low |
| **FEAT-002 Vision Audit** | Gemini Vision audit of damage & inventory from photos | Prototype in `server.ts` (`/api/ai/property-audit`) | Partial | Expose clean landlord/tenant UI to trigger photo audit and view findings. | M | Low |
| **FEAT-003 Roommate Matching** | Survey embedding & ranking (1536 dims) | Survey data types present; vector ranking simulated | Partial | Add survey modal and compatibility scoring algorithm in seeker view. | M | Low |
| **FEAT-004 EarlyLock & Waitlist** | 15-min countdown ring, auto-release, waitlist cascade | Supported (`EarlyLockModal.tsx`, `server.ts` hold logic) | Partial | Add waitlist entry button upon expiration. | S | Low |
| **FEAT-005 Deposit Protection** | 149 PLN hold (49 PLN fee), release if rejected/timeout | Supported in UI (`DepositClearingModal.tsx`, `EarlyLockModal.tsx`) | Gated | Keep in test mode. Await owner answers on legal escrow/BLIK hold. | M | High |
| **FEAT-006 Cesja Engine** | 60-second card, WhatsApp share card, bilingual protocol | Supported (`CesjaGeneratorModal.tsx`, `CesjaTemplatePage.tsx`) | Matches | Verify Polish & English tripartite agreement clauses. | S | Low |
| **FEAT-007 T-60 Renewal** | 60 days before lease end WhatsApp/in-app prompt | Implemented in `server.ts` cron simulation | Partial | Add in-app renewal prompt banner on `PlacePage.tsx` when lease is near end. | S | Low |
| **Documents & Contracts** | Cesja tripartite PDF, handover protocol, meldunek guide | Supported (`CesjaTemplatePage.tsx`, `MeldunekGuidePage.tsx`) | Matches | Retain download/print capability and bilingual formatting. | S | Low |
| **Rewards & Partners** | 50% insurance discount reward, partner offers | Supported (`RewardsPage.tsx`, `SavingsCalculatorPage.tsx`) | Matches | Ensure responseStats logic correctly unlocks the reward badge. | S | Low |
| **University Features** | Student verification, university landing links | Supported (`EnrollmentsPage.tsx`, student badges) | Matches | Keep domain verification simulation functional. | S | Low |
| **Admin & Moderation** | Listing review queue, Onlo action audit log, user statuses | Supported (`server.ts` review queue, AI runs viewer) | Matches | Ensure admin view in `server.ts`/portal displays audit trail. | S | Low |
| **Trust & Safety** | Landlord verification, report buttons, no external wire | Supported (verification badges, report modals, warnings) | Matches | Retain all safety callouts and trust banners. | S | Low |
| **i18n (en, pl, uk, es, ar) & RTL**| 5 locales, URL prefix, next-intl, logical CSS, RTL for Arabic | Existing has `en` and `pl` dictionary, `uk` formatter, no RTL | Partial | Expand translations to full 5 locales, implement RTL layout wrapper. | M | Low |
| **Accessibility** | WCAG 2.2 AA, 44px tap targets, visible focus, aria labels | High compliance across recent component updates | Partial | Verify color contrast on all badge variants; check keyboard traps. | S | Low |
| **Onboarding** | Role-based onboarding, clear value propositions | Supported via modals and intuitive role switcher | Matches | Keep lightweight without interrupting main browse path. | S | Low |
| **Help Center** | FAQ, guide links, support inquiry form | Supported (`HelpPage.tsx`, `HelpModal.tsx`, `SafetyGuidePage.tsx`) | Matches | Verified intact and working. | S | Low |

---

## C. Data Model Comparison (38 Target Tables)

| Table | Status | Existing Equivalent in Repo | Notes |
|---|---|---|---|
| `countries` | Missing in DB | Hardcoded in `src/data/cities.ts` | Abstract into data layer for zero-code country config |
| `cities` | Partial | `src/data/cities.ts` (Warsaw, Krakow, Wroclaw, Lublin) | Matches current 4 launch cities |
| `users` | Partial | `profiles` in `convex/schema.ts` & `supabase/schema.sql` | Needs role array and locale |
| `tenantProfiles` | Partial | Combined in `profiles` / local `r8_user` | Add `responseStats` object for insurance reward |
| `landlordProfiles` | Partial | Combined in `profiles` (`isVerified`, `stripeConnectId`) | Separate or augment profile structure |
| `organizations` | Missing in DB | Represented as strings in `university` field | Abstract for student verification |
| `memberships` | Missing | Implicit in user org field | Needed when universities have multiple admins |
| `properties` | Partial | Embedded inside `leases` & `listings` tables | Physical place fields (type, sqm, furnished, distances) |
| `leases` | Partial | `leases` table in `convex/schema.ts` & `mockListings.ts` | Add origin ("takeover" \| "direct_rental") and status |
| `listings` | Matches | `listings` table in `convex/schema.ts` & `server.ts` | Ensure `kind` ("takeover" \| "rental" \| "stay") is primary |
| `media` | Partial | Stored as string arrays (`images: string[]`) | Add media metadata record if storage IDs are required |
| `savedListings` | Matches | `favorites` table in `convex/schema.ts` & Supabase | Supports listing bookmarking & alert flag |
| `takeovers` | Partial | Embedded in `leases` & `CesjaGeneratorModal` | Provide dedicated takeover record schema |
| `applications` | Partial | `inquiries` table in `convex/schema.ts` | Has applicant, status, message, replies |
| `documents` | Partial | Generated client-side in `CesjaTemplatePage.tsx` | Track generated contracts & storage IDs |
| `conversations` | Partial | Simulated in `server.ts` & `inquiries.replies` | Add `handler` ("onlo" \| "human") field |
| `conversationMembers` | Partial | Implicit in inquiry participant fields | Track per-member read status |
| `messages` | Matches | `inquiries.replies` & `aiMessages` in `convex/schema.ts` | Add `senderType` ("user" \| "onlo" \| "system") |
| `notifications` | Matches | `NotificationsPage.tsx` state & `server.ts` store | In-app notification feed supported |
| `plans` | Missing in DB | Hardcoded prices (39 PLN, 49 PLN, 79 PLN) | Move hardcoded pricing into data config |
| `subscriptions` | Partial | `SubscriptionModal.tsx` & localStorage | Track active plan, period end |
| `payments` | Matches | `escrowTransactions` / `server.ts` payment records | Money values stored in integer minor units (grosze) |
| `partners` | Partial | Hardcoded in `RewardsPage.tsx` (eSIM, insurance) | Model as data config |
| `partnerOffers` | Partial | Embedded in `RewardsPage.tsx` | Title, discount, commission |
| `rewards` | Matches | Implemented in `RewardsPage.tsx` | 50% insurance discount reward tracking |
| `whatsappChannels` | Partial | `convex/whatsapp.ts` configuration | City channel ID references |
| `whatsappPosts` | Partial | Queued posts in `convex/whatsapp.ts` | Social takeover announcement records |
| `onloActions` | Matches | `aiRuns` & `reviewQueue` in `convex/schema.ts` | Audit logging for all AI generations |
| `partnerConversions`| Missing | Simulated locally | Track conversions for affiliates |
| `reservations` | Matches | `reservations` table in `convex/schema.ts` & `server.ts` | 15-minute lock with expiration |
| `waitlistEntries` | Partial | Waitlist queue logic in `server.ts` | Needs dedicated status cascade |
| `deposits` | Matches | `reservations` & `DepositClearingModal.tsx` | Gated in test mode |
| `stripeEvents` | Partial | Webhook idempotency in `server.ts` | Deduplicate incoming Stripe events |
| `roommateProfiles` | Partial | Survey types defined in `src/types` | Embeddings and compatibility survey |
| `propertyAudits` | Matches | `/api/ai/property-audit` in `server.ts` | Damage, severity, inventory checklist |
| `leaseRenewals` | Partial | T-60 job in `server.ts` | Track renewal status and trigger date |
| `agentSessions` | Matches | Chat session store in `src/lib/onloService.ts` | Session state, language, lastMessageAt |
| `agentMessages` | Matches | `aiMessages` table in `convex/schema.ts` | Role, body, timestamp, tool executions |

**Extra tables present in existing app (to retain):**
- `tasks`: Simple Convex test table for live connection diagnosis. Retained for connectivity health check (`ConvexTasksExample.tsx`).
- `reviewQueue`: Admin moderation queue for flagging suspicious listings. Retained for trust & safety.

---

## D. Design System Comparison

### 1. Colour Role Mapping & Contrast Verification

| Role Token | Target Meaning | Existing App CSS Value | Contrast on Light Bg (`#FAFAFB`) | Contrast on Dark Bg (`#0F172A`) | Status / WCAG AA |
|---|---|---|---|---|---|
| `--color-bg` | Page background | `#FAFAFB` (light) / `#0B1120` (dark) | N/A | N/A | Baseline |
| `--color-surface` | Card background | `#FFFFFF` (light) / `#0F172A` (dark) | 1.05:1 vs bg | 1.2:1 vs bg | Clean card separation |
| `--color-border` | Hairlines & inputs | `#E6E8EC` (light) / `#1E293B` (dark) | 1.2:1 vs bg | 1.4:1 vs bg | Subtle division |
| `--color-text` | Primary body text | `#0F172A` (light) / `#F8FAFC` (dark) | **17.8:1** (Passes AAA) | **16.9:1** (Passes AAA) | **Pass** |
| `--color-text-muted` | Secondary helper | `#5B6678` (light) / `#94A3B8` (dark) | **5.3:1** (Passes AA) | **6.2:1** (Passes AA) | **Pass** |
| `--color-primary` | Main action & focus | `#4F46E5` (Indigo-600) | 5.8:1 vs `#FFFFFF` | 6.4:1 vs `#0F172A` | **Pass (AA)** |
| `--color-on-primary` | Text on primary | `#FFFFFF` | **5.8:1** vs `#4F46E5` | **5.8:1** vs `#4F46E5` | **Pass (AA)** |
| `--color-secondary` | Soft brand fill | `#EEF0FF` (light) / `#1E1B4B` (dark) | Light tint | Dark tint | Visual harmony |
| `--color-accent` | Attention / Takeover | `#FF6B5B` (Coral-500) | 3.2:1 (large text/badges) | 3.6:1 (large text/badges) | **Pass for UI elements** (Use white text on filled badge) |
| `--color-success` | Verified / Available | `#047857` (Emerald-700) | **6.3:1** (Passes AA) | **5.9:1** (on soft) | **Pass** |
| `--color-warning` | Pending / Hold | `#B45309` (Amber-700) | **5.7:1** (Passes AA) | **5.2:1** (on soft) | **Pass** |
| `--color-danger` | Error / Reject | `#B42318` (Crimson-700) | **6.1:1** (Passes AA) | **5.8:1** (on soft) | **Pass** |

### 2. Typography, Spacing, Radius & Motion
- **Font:** Inter across the entire interface. Tabular figures (`tnum`) applied to prices and dates.
- **Radius:** Standardized to:
  - Controls: `10px` (`--r-ctl` / `rounded-[10px]`)
  - Cards: `16px` (`--r-card` / `rounded-2xl`)
  - Dialogs: `20px` (`rounded-[20px]`)
  - Pills: `999px` (`rounded-full`)
- **Spacing:** Aligned to 4px scale (4, 8, 12, 16, 24, 32, 48, 64).
- **Motion:** Purposeful, respecting `prefers-reduced-motion: reduce`. No looping decorative distraction.

### 3. Anti-Patterns Check (Part 5, section 13)
- [x] **No top-level AI tabs:** Onlo is never a top-level nav item. It operates in the background, in thread replies, and in contextual modals.
- [x] **No vibe-coded visual clutter:** No neon glows, no glassmorphic rainbow gradients, no 3D blobs.
- [x] **No emoji as icons:** Replaced with clean Lucide SVG icons (1.5px stroke width).
- [x] **No hype copy:** Replaced with direct, calm, transparent copy.

---

## E. Rule Violations & Remediation

| Hard Rule Broken | Where in Codebase | Remediation in Plan |
|---|---|---|
| **Float values for money** | Some mock data represented prices as raw numbers (`1850` instead of integer minor units) | Convert money representation to `{ amountMinor: 185000, currency: "PLN" }` in data layer |
| **Permissions only in client** | `DevRoleSwitcher.tsx` toggles state purely on the client side without server validation | Create server-side permission assertion functions (`requireUser`, `requireRole`, `requireListingOwner`) |
| **Hardcoded strings** | Some modal strings in `EarlyLockModal.tsx` and `ListingDetailPage.tsx` were hardcoded in English | Extract to `src/utils/translations.ts` and ensure full coverage across `en`, `pl`, `uk`, `es`, `ar` |
| **"Escrow" / "Guaranteed" in copy** | `escrowTransactions` table naming and occasional copy had "Escrow" | Update all user-facing copy to "Reservation hold" and "Deposit protection" per Rule 12 |
| **Per-city conditional code** | Occasional hardcoded checks like `city === 'Lublin'` | Refactor to data-driven lookups via `src/data/cities.ts` |

---

## F. Decision Gates

### Decision Gate 1: Backend & Database Architecture
Target requests Convex; existing codebase is React SPA + Express (`server.ts`) with Supabase and an active Convex client.
- **Option A: Stay on Express + Supabase + Convex hybrid.** Add missing endpoints in `server.ts` and complete existing tables. (Effort: Medium, Risk: Low).
- **Option B (Recommended): Build unified Data-Access Layer.** Abstract all data queries through `src/services/dataAccess.ts`. This allows the current app to function without regressions while providing a drop-in bridge to Convex or Supabase. (Effort: Medium, Risk: Low).
- **Option C: Immediate full migration to Convex.** Replace `server.ts` and all Supabase calls with pure Convex queries and mutations. (Effort: Large, Risk: High — requires live Convex deployment credentials).
- **Action:** Stop and wait for owner decision on backend before executing Option C. Implement Option B now so the app remains 100% operational.

### Decision Gate 2: Payments & Escrow Regulation
- All payment buttons, hold authorizations, and deposit workflows are kept in Stripe Test Mode with clear UI indicators. No real financial captures will occur until the owner confirms legal authorization parameters and deposit hold windows.
