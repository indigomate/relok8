# Relok8 production security audit — 2026-11-27

## Scope

Repository and production-release review covering authentication, authorization, identity integrity, public-data exposure, browser storage, webhooks, email preferences, upload controls, dependency risk, security headers, unfinished feature boundaries, tests, build, and public-route smoke checks.

This is an engineering hardening review, not a guarantee that no vulnerability exists and not a substitute for an independent penetration test before handling payments or identity documents.

## Verified controls

- Clerk identity is required for private reads and writes.
- Ownership, participant, landlord, and administrator checks are enforced server-side.
- Public listing responses remove owner IDs, landlord phone/email, reservation holder, and private workflow state.
- Exact listing addresses and supplied participant names remain public by deliberate product choice. Listing publication must clearly explain that visibility and obtain the publisher's confirmation.
- Upload URLs require authentication; photos are restricted to JPEG, PNG, or WebP, bounded in size, and ownership-checked before listing publication.
- Resend events require a current Svix signature and are deduplicated. Bounce and complaint events suppress future delivery.
- WhatsApp POST events require Meta's HMAC signature; GET verification uses a separate constant-time compared token. Webhook payloads are size-limited.
- Marketing email and WhatsApp delivery require explicit channel-specific consent. Payment endpoints fail closed and never fabricate a charge.
- AI instructions treat user/listing text as untrusted and prohibit unsupported claims or state-changing actions.
- No committed production credential was found by the repository pattern scan.
- `npm audit --omit=dev --audit-level=moderate` reported zero vulnerabilities.

## Fixes in this release

- Inquiry, reservation, and takeover-request names now come from the authenticated Clerk/profile identity. Client-supplied display names are retained only for API compatibility and cannot change the stored identity.
- Account name, email, phone, institution, role, and avatar are no longer copied into `localStorage`. Clerk remains the browser session authority.
- Added a Content Security Policy restricting scripts, connections, frames, fonts, forms, objects, and embedding. The static JSON-LD block is authorized by an exact SHA-256 hash.
- Added `Cross-Origin-Opener-Policy: same-origin-allow-popups` to isolate the page while preserving Google/Clerk sign-in popups.
- Added `Cross-Origin-Resource-Policy`, `Origin-Agent-Cluster`, and disabled DNS prefetching.
- Removed outdated setup claims that described disabled payment/escrow and browser fallback behavior as operational.
- Replaced secret-shaped documentation examples with explicit placeholders.

## Automated evidence

- TypeScript check: passed.
- Vitest: 20 files, 210 tests passed.
- Vite production build: passed.
- Dependency audit: zero moderate-or-higher production vulnerabilities.
- `git diff --check`: passed.

Production deployment status and post-deploy route/header smoke evidence should be added to this section after the release commit is live.

## Manual production checks still required

1. In Clerk, require email verification, enable appropriate bot protection, review session lifetime, and enable MFA/passkeys for the founder/admin account.
2. In Convex, confirm `ADMIN_USER_IDS` contains only the intended production Clerk user ID(s).
3. Generate and set a dedicated `EMAIL_PREFERENCES_SECRET` of at least 32 random bytes. The current Resend-key fallback preserves availability but couples link validity to Resend-key rotation.
4. Complete a two-account authorization test on production for inquiry, messaging, private place room, listing edit, invitation, and account deletion.
5. Test Google sign-up, email sign-up, sign-out, expired session, and account deletion on mobile and desktop.
6. Confirm CSP produces no blocked Clerk, Convex, image, font, translation, or upload requests in the browser console.
7. For WhatsApp, require approved Meta templates, all production environment variables, a signed `delivered` webhook, and receipt on a test phone before calling the feature live.
8. For Opus-MT, verify TLS, token enforcement, request timeouts, service logs, model licensing/attribution, and English↔Polish end-to-end translation.
9. Keep payments disabled until provider onboarding, Polish/EU legal review, fraud controls, charge/refund webhooks, reconciliation, and an independent security review are complete.
10. Arrange an external penetration test before storing identity documents or processing money.

## Operational rules

- Never paste secrets into chat, issues, screenshots, tutorial assets, or JSON.
- Rotate any credential that may have been exposed, then invalidate old sessions where the provider supports it.
- Review failed email/WhatsApp deliveries and webhook signature failures without logging raw private messages.
- Back up Convex data, test restore procedures, and document incident contacts before broad public distribution.
