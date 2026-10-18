# Relok8 Revamp Plan

**Version:** 1.0  
**Status:** Approved for Implementation (Safe Phases)  
**Strategy:** Quick wins first (tokens, shared UI, i18n, responsive polish), followed by data-access abstraction, core marketplace flows, and advanced Onlo features. Gated backend and payment migrations remain paused awaiting owner decisions.

---

## Phase 0: Quick Wins & Foundation (Immediate)

### 0.1 Design System Tokens & Semantic Role Mapping
- **Goal:** Standardize CSS variables in `src/index.css` to match Part 5 role tokens (`--color-primary`, `--color-accent`, `--color-bg`, `--color-surface`, `--color-border`, `--color-text`, `--color-text-muted`, `--color-success`, `--color-warning`, `--color-danger`). Enforce control radius `10px`, card radius `16px`, dialog radius `20px`.
- **Files to change:** `src/index.css`, `src/components/ui/index.ts`, `src/components/Card.tsx`, `src/components/Button.tsx`.
- **How to test:** Inspect buttons, cards, badges, and modals across light and dark modes. Verify WCAG AA contrast.
- **How to roll back:** Revert `src/index.css` to previous commit.

### 0.2 Internationalization Expansion & RTL Foundation
- **Goal:** Support 5 launch locales: English (`en`), Polish (`pl`), Ukrainian (`uk`), Spanish (`es`), Arabic (`ar`). Implement RTL layout direction (`dir="rtl"`) for Arabic with logical Tailwind CSS classes (`ms-`, `me-`, `ps-`, `pe-`).
- **Files to change:** `src/utils/translations.ts`, `src/utils/formatters.ts`, `src/components/Navbar.tsx`, `src/App.tsx`.
- **How to test:** Switch languages using navbar selector; select Arabic and verify layout mirroring and LTR numbers/prices.
- **How to roll back:** Restore previous `translations.ts` and language switcher state.

### 0.3 Server-Side Permission Helpers & Guards
- **Goal:** Create centralized permission assertion functions (`requireUser`, `requireRole`, `requireLeaseMember`, `requireListingOwner`) in a dedicated module `src/lib/permissions.ts`.
- **Files to change:** `src/lib/permissions.ts`, `server.ts`.
- **How to test:** Invoke endpoint or action with non-matching role and verify standard permission denial.
- **How to roll back:** Remove `src/lib/permissions.ts`.

### 0.4 Responsive Layout & Button Polish Across All Devices
- **Goal:** Ensure all pages and modals (especially `ListingDetailPage`, `PlacePage`, `MessagesPage`, `SavedApartmentsPage`, and mobile bottom bar) look impeccable and touch-friendly (44px min targets) across 360px mobile, 768px tablet, and 1280px desktop.
- **Files to change:** `src/App.tsx`, `src/pages/ListingDetailPage.tsx`, `src/pages/PlacePage.tsx`, `src/components/Navbar.tsx`, `src/components/MobileBottomNav.tsx`.
- **How to test:** Resize browser viewport from 360px to 1440px; test touch navigation and form submissions.
- **How to roll back:** `git restore` affected UI files.

---

## Phase 1: Clean Data-Access Layer & Abstraction

### 1.1 Unified Repository / Data-Access Layer (`src/services/dataAccess.ts`)
- **Goal:** Build an abstraction layer that seamlessly routes calls to Convex or the existing Express API / Supabase store, ensuring future Convex migration requires zero changes to UI components.
- **Files to change:** `src/services/dataAccess.ts`, `src/services/api.ts`.
- **How to test:** Verify all listing queries, favorites, inquiries, and profile updates succeed through the unified access layer.
- **How to roll back:** Direct `src/services/api.ts` imports back to original functions.

### 1.2 Integer Minor Units for Money Representation
- **Goal:** Enforce `amountMinor` (integer grosze) + `currency` ("PLN") across models, eliminating raw floats and ensuring data consistency with target schema.
- **Files to change:** `src/types/index.ts`, `src/utils/formatters.ts`, `src/data/mockListings.ts`.
- **How to test:** Check all price tags, deposit breakdowns, and calculations format accurately (e.g. `1 850 zł / month`).
- **How to roll back:** Revert types to number.

---

## Phase 2: Marketplace & Core Flows Enhancement

### 2.1 Unified Search & Distances List
- **Goal:** Ensure listing cards and details handle user-entered distances (`properties.distances`) cleanly without relying on external map APIs.
- **Files to change:** `src/components/ListingCard.tsx`, `src/pages/ListingDetailPage.tsx`.
- **How to test:** View listing details in Lublin and Warsaw; confirm distance badges (e.g. "7 min to KUL by bus") render cleanly.
- **How to roll back:** Revert card meta display.

### 2.2 Takeover (Cesja) Engine & WhatsApp Share Card
- **Goal:** Perfect the 60-second tenant exit flow (`LeaveYourLeaseModal.tsx`) and tripartite agreement generator (`CesjaTemplatePage.tsx`), including WhatsApp-style share bubble.
- **Files to change:** `src/components/CesjaGeneratorModal.tsx`, `src/pages/PlacePage.tsx`, `src/pages/CesjaTemplatePage.tsx`.
- **How to test:** Trigger "I'm moving out" on PlacePage; verify agreement preview and share link generation.
- **How to roll back:** Revert modal logic.

---

## Phase 3: In-App Messaging & Onlo Integration

### 3.1 Shared Inbox with Onlo Handover Banner
- **Goal:** Add thread header banner: "Onlo is answering" with a "Take over" button, and "You are answering" with "Hand back to Onlo". Add subtle "Onlo" caption to AI-generated messages.
- **Files to change:** `src/pages/MessagesPage.tsx`, `src/pages/PlacePage.tsx`.
- **How to test:** Open conversation thread, toggle handler between Onlo and human, observe badge and input updates.
- **How to roll back:** Remove handler banner component.

### 3.2 Audit Logging for AI Actions (`onloActions`)
- **Goal:** Every message, draft, and audit created by Onlo is recorded in an audit table/store with model name, summary, and override option.
- **Files to change:** `src/lib/onloService.ts`, `server.ts`.
- **How to test:** Ask Onlo a question in chat; verify action appears in `/api/admin/onlo-actions` or admin log.
- **How to roll back:** Revert `onloService.ts`.

---

## Phase 4: EarlyLock Waitlist & Renewal Protocols

### 4.1 EarlyLock 15-Minute Expiry & Waitlist Cascade
- **Goal:** Upon 15-minute timer expiration in `EarlyLockModal`, present calm notification and one-click "Join the waitlist" action.
- **Files to change:** `src/components/EarlyLockModal.tsx`, `server.ts`.
- **How to test:** Simulate timer reaching 00:00; verify waitlist button appears and records entry.
- **How to roll back:** Revert countdown expiration handler.

### 4.2 T-60 Lease Renewal Prompt
- **Goal:** Show proactive renewal prompt banner on `PlacePage.tsx` when tenancy has under 60 days remaining (Auto-generate *aneks* or initiate takeover).
- **Files to change:** `src/pages/PlacePage.tsx`.
- **How to test:** View place with end date near current date; confirm renewal actions display.
- **How to roll back:** Revert banner markup.

---

## Phase 5: Gated Decisions (Held Pending Confirmation)

- **Decision 1: Full Backend Migration to Convex** (Decision Gate 1)
- **Decision 2: Live Stripe Connect Deposit Capture & BLIK Hold Policy** (Decision Gate 2)
