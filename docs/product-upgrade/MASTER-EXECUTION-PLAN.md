# Relok8 Platform Upgrade — Master Execution Plan

**Created:** 2026-11-23  
**Execution rule:** Complete, test, capture evidence, review, and approve one step before starting the next.  
**Current step:** Step 01 — Baseline and evidence system  
**Primary stack:** React/Vite, Convex, Clerk, Vercel, Resend, Google AI, WhatsApp/Meta, Stripe (planned)

## Definition of done for every step

No task is complete because code was written. Every task must satisfy all of the following:

1. The user problem and affected roles are stated.
2. Existing behaviour is reproduced and captured where possible.
3. Acceptance criteria are written before implementation.
4. Changes are scoped so unrelated working behaviour is preserved.
5. Type checking, relevant tests, and the production build pass.
6. Mobile, tablet, and desktop layouts are checked at 390×844, 768×1024, and 1440×1000.
7. Keyboard navigation, focus visibility, labels, loading, empty, error, and reduced-motion states are checked.
8. A before and after screenshot is recorded without credentials or private user information.
9. Provider webhooks or external flows are verified with sandbox evidence, not only a saved setting.
10. The step is marked `verified` only after its acceptance evidence is recorded.
11. Production deployment is a separate recorded action with rollback information.

## Screenshot and evidence standard

- Asset ID format: `S{step}-{sequence}-{screen}-{viewport}-{state}`.
- Store captures under `docs/product-upgrade/evidence/step-XX-name/`.
- Required states when applicable: default, loading, empty, validation error, provider error, success, reduced motion.
- Capture both English and Polish for any changed customer-facing copy.
- Never capture API keys, webhook secrets, payment credentials, private messages, personal documents, or unrelated browser tabs.
- Use opaque redaction or a fresh test account if personal information would otherwise appear.
- The screenshot ledger must state whether evidence is public, test-account-only, or still missing.

## Ordered execution roadmap

### Step 01 — Baseline, audit, and evidence system

**Goal:** Establish the current production state and create a single source of truth for the upgrade.

**Tasks**

- Inventory public, authenticated, landlord, tenant, applicant, payer, and support journeys.
- Capture current production home, Polish home, listing intake, messages signed-out, help, and how-it-works screens.
- Record console errors and evidence gaps.
- Establish the screenshot ledger, severity scale, and per-step definition of done.

**Acceptance evidence:** Baseline screenshots, audit, screenshot ledger, and this plan.

### Step 02 — Production stability and release hygiene

**Goal:** Remove known runtime errors before redesigning surfaces.

**Tasks**

- Diagnose and fix `services:translatePublicListings` production failures.
- Re-run public route checks with zero unexpected console errors.
- Reconcile and verify the pending Messages identity/retractable-list changes.
- Confirm production environment variables without revealing values.
- Add a repeatable smoke-test command for critical routes.

**Acceptance evidence:** Error reproduction, passing test/build output, clean console captures, deployment ID, and rollback reference.

### Step 03 — Design system, navigation, and accessibility foundation

**Goal:** Make every later feature use the same reliable visual and interaction language.

**Tasks**

- Audit and normalize typography, spacing, radii, shadows, semantic colours, icons, form fields, dialogs, cards, status badges, and focus states.
- Establish reusable button, field, status, empty-state, skeleton, stepper, and success-state components.
- Improve mobile header and bottom navigation touch targets.
- Reduce cookie-banner obstruction while preserving consent requirements.
- Add reduced-motion behaviour and accessibility checks.

**Acceptance evidence:** Component states at all three viewports, keyboard traversal, contrast results, and before/after navigation screenshots.

### Step 04 — Discovery, search, listing cards, and availability

**Goal:** Make it immediately clear what is available, when, where, and at what total monthly cost.

**Tasks**

- Clarify `Available now`, `Available from`, `Upcoming takeover`, `Replacement found`, `Temporarily held`, and `Lease ended` states.
- Improve search, filters, city browsing, zero-results recovery, saved listings, and alert capture.
- Show rent, administration fee, fixed/usage bills, deposit, and availability without ambiguity.
- Verify English/Polish content and responsive card hierarchy.

**Acceptance evidence:** Search and filter flows, every availability tag, empty results, saved state, and mobile/desktop screenshots.

### Step 05 — Listing details and conversion flow

**Goal:** Give applicants enough trustworthy information to message or apply without confusion.

**Tasks**

- Refine gallery, facts, costs, address, current tenant, landlord-supplied information, commute, rules, and safety disclosures.
- Make primary actions adapt to signed-out, owner, applicant, unavailable, held, and approved states.
- Improve the application/request modal and confirmation state.
- Preserve transparent statements about verification, deposits, and payments.

**Acceptance evidence:** Listing detail states for each role and status, including validation/error/success captures.

### Step 06 — Authentication, onboarding, profiles, and consent

**Goal:** Turn sign-up into a clear role-aware onboarding experience.

**Tasks**

- Verify email, Google sign-up, welcome email, profile name, locale, avatar, and role initialization.
- Add applicant, tenant, landlord, family payer, and sponsor onboarding paths.
- Capture marketing consent separately and keep it disabled by default.
- Confirm account settings, email preferences, one-click unsubscribe, and deletion/export paths.

**Acceptance evidence:** Test accounts for each role, auth-email receipt, consent history, and onboarding screenshots.

### Step 07 — Listing creation and landlord activation

**Goal:** Make listing a home understandable, quick, and trustworthy for local and international users.

**Tasks**

- Break the long form into resumable, clearly labelled stages.
- Validate address, occupancy, availability, lease dates, fees, landlord contact, photos, and consent.
- Preserve drafts and prevent accidental duplicate publication.
- Add signed-up-but-no-listing lifecycle reminders with useful reasons to list early.

**Acceptance evidence:** First listing, draft recovery, validation failure, photo upload, publication, and reminder-email receipt.

### Step 08 — Messaging, participant identity, and live translation

**Goal:** Deliver a scalable shared inbox where people always know who is speaking and can read in their chosen language.

**Tasks**

- Finish and deploy the retractable/scrolling conversation list.
- Display real profile names and remove generated person aliases.
- Verify unread, needs-reply, Onlo, search, empty, and high-volume thread states.
- Stabilize English/Polish live translation, original-text reveal, failure recovery, and language preference.
- Keep participant authorization enforced by Convex.

**Acceptance evidence:** Two-party and three-party test conversations, translation evidence, unauthorized-access tests, and responsive screenshots.

### Step 09 — My Place and the all-in-one relocation timeline

**Goal:** Turn an accepted application into a guided move from approval through keys and settling in.

**Tasks**

- Unify application approval, tenant confirmation, documents, deposit arrangement, inspection, keys, move-in, and tenancy status.
- Show owner, tenant, landlord, and payer responsibilities separately.
- Add move-in checklist items for internet, utilities, insurance, cleaning, movers, meldunek guidance, and local setup.
- Add renewal, end-of-tenancy, and relisting pathways.

**Acceptance evidence:** Complete sandbox relocation from application to handover, with every milestone and reversal state captured.

### Step 10 — Payment foundation in Stripe sandbox

**Goal:** Introduce a safe provider-backed payment ledger without enabling live charging.

**Tasks**

- Add server-only Stripe configuration and signed Convex webhook endpoint.
- Replace legacy escrow assumptions with payment obligations, transactions, subscriptions, and idempotent provider events.
- Implement the provider adapter, audit log, receipts, refunds, and failure states.
- Keep rent and deposit flows separate from Relok8 platform fees.

**Acceptance evidence:** Stripe sandbox events, duplicate webhook test, failed payment, refund, signed webhook rejection, and ledger screenshots.

### Step 11 — Tenant 49 PLN and landlord 49 PLN billing

**Goal:** Charge the approved launch model exactly when promised.

**Tasks**

- Charge the incoming tenant 49 PLN once, only after landlord approval.
- Start the landlord 49 PLN monthly subscription only at recorded move-in.
- Stop billing at tenancy end or cancellation.
- Add payment method management, receipts, invoices, retry/dunning, and transparent tax copy.
- Keep core safety and receipt access available during billing problems.

**Acceptance evidence:** Sandbox success, cancellation, duplicate, failed renewal, retry, refund, move-in start, and tenancy-end cancellation.

### Step 12 — International payer and landlord rent rail

**Goal:** Let family members, sponsors, and tenants pay from abroad while landlords receive PLN through a licensed provider.

**Tasks**

- Add secure payer invitations with limited access.
- Display payer currency, PLN obligation, exchange/provider fees, and landlord settlement amount.
- Onboard eligible landlords with the licensed provider.
- Record rent status in Relok8 without storing card/bank credentials or holding funds.
- Gate production activation on provider eligibility, tax, payments, refund, and regulatory review.

**Acceptance evidence:** Sandbox family payer, expired invitation, FX disclosure, landlord onboarding, payout status, refund/dispute, and access-control tests.

### Step 13 — Transactional email, marketing, WhatsApp, and notifications

**Goal:** Give users timely information without spam or contradictory messages.

**Tasks**

- Verify welcome, unread summary, listing expiry, landlord invitation, application, handover, payment, failure, and receipt emails.
- Verify weekly digest only for explicit marketing consent.
- Process delivery, bounce, and complaint webhooks.
- Align in-app, email, and WhatsApp status language.

**Acceptance evidence:** Provider delivery events plus receipt in controlled inboxes; saved settings alone are insufficient.

### Step 14 — Onlo knowledge, assistance, and safety

**Goal:** Make Onlo useful, current, multilingual, and unable to invent sensitive facts or perform unauthorized actions.

**Tasks**

- Expand curated housing, relocation, payment, and product knowledge.
- Test citations, uncertainty, translations, escalation, and prompt-injection resistance.
- Add landlord and tenant contextual assistance without exposing private data.
- Record model actions and human takeovers.

**Acceptance evidence:** Evaluation suite, adversarial tests, citation checks, and UI captures for answer, uncertainty, failure, and escalation.

### Step 15 — Analytics, operations, performance, and launch gate

**Goal:** Make the platform measurable and supportable before distribution.

**Tasks**

- Add privacy-respecting funnel events for browse, save, message, apply, approve, pay, move-in, and relist.
- Add error monitoring and operational dashboards.
- Audit Core Web Vitals, bundle size, image loading, accessibility, security headers, rate limits, backups, and recovery.
- Run end-to-end role-based regression and production smoke tests.
- Produce a go/no-go launch report with remaining manual/provider steps.

**Acceptance evidence:** Analytics events, performance report, accessibility results, security tests, deployment evidence, and signed launch checklist.

## Priority rules

1. Security, authorization, money correctness, and runtime stability outrank visual polish.
2. A provider dashboard setting is configuration, not end-to-end proof.
3. Payment success is established by a verified webhook, never by a browser redirect.
4. No live charge or rent flow is enabled without the corresponding legal/provider decision gate.
5. Existing user data and unrelated working changes are preserved.
6. New features must support English and Polish at launch and must not block future locales.

## Immediate next step after Step 01 approval

Begin Step 02 by reproducing and fixing the production `services:translatePublicListings` error, then capture the same routes again to prove the error is gone.
