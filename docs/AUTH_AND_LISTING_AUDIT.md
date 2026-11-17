# Authentication and listing consistency audit

Date: 17 November 2026. Scope: React/Vite frontend, Clerk integration, all Convex source modules, ownership helpers, legacy endpoints, invitation flows, prices and My Place edits. This is a source audit with isolated handler and UI tests, not a penetration test or certification of hosted configuration.

## Release status

Backend corrections were deployed successfully to `https://modest-anteater-459.convex.cloud` after the user connected Convex CLI. The production dry run, dedicated Convex type check, root type check, all 71 tests and the frontend build passed. Schema validation passed and no indexes were deleted. Frontend corrections are included in the accompanying Git release. A Vercel frontend build alone does not deploy Convex.

Live signup, real Clerk-to-Convex token claims and multi-browser authenticated journeys still require account-based verification. Handler integration tests use isolated test identities and the browser fixture uses simulated data; neither is a substitute for real Clerk sessions.

## Listing consistency

My Place updates the canonical `leases` record through `domain.write/updatePlace`. Public browse subscribes to `leases.get`; direct listing details subscribe to `leases.getById`. Both now use the same frontend mapper. There is no second editable listing copy to reconcile.

Confirmed/fixed:

- Saved listings previously showed base rent while browse/detail showed known monthly costs. All three now use the same calculation.
- Currency arithmetic now adds rounded integer grosze. Formatting preserves fractional PLN instead of rounding them away.
- Known monthly total = rent + administration + fixed bills when explicitly fixed. Included bills add zero; usage-based or unspecified bills remain additional/unknown. Deposit is displayed separately and never added to monthly cost.
- My Place rent inputs match creation limits: positive rent up to PLN 100,000. Backend edits reject negative, excessive, nonfinite and sub-grosz amounts atomically.
- Empty optional descriptions and zero administration fees can be saved.
- My Place exposes deposit editing, using the same canonical deposit field as listing detail.
- Old placeState snapshots no longer override the canonical current rent, administration or description when rendering private property details.
- A pause removes a property from public browse; republishing restores its latest values. Landlord advertising permission is projected from the saved landlord decision; private changes such as invitations and conversation messages remain private.

Tests exercise owner mutation → owner read → anonymous catalog/detail read → shared frontend mapper → exact total. Convex subscriptions are responsible for propagating committed changes; live multi-browser propagation remains to be verified with signed-in accounts.

## Authentication findings

| Priority | Finding | Source status |
| --- | --- | --- |
| High | Domain private-property and legacy inquiry/inventory endpoints allowed email fallback even after a landlord account ID was bound. A matching-email account could retain access contrary to the canonical workflow. | Fixed: shared isLandlord helper makes bound ID authoritative. Unverified email never grants fallback access. |
| High | Legacy tenant invitations could reassign listing ownership outside the three-party takeover workflow. | Fixed: new ownership-transfer invitations are rejected and existing tenant-role invitation acceptance is rejected. Landlord invitations remain supported. |
| Medium | Legacy reserve endpoint accepted paused listings and self-reservations. | Fixed: accepting states are explicit; owners/landlords cannot reserve their own property. |
| Medium | Dedicated sign-in routes accepted unchecked return destinations and lost query strings when parsing the return route. | Fixed: same-app paths only, no protocol-relative/external/backslash/auth-loop destinations, query parameters retained. |
| Medium | Clerk forms had no explicit return destination, risking loss of listing/inbox/invitation context through navigation. | Fixed: sign-in and sign-up both receive sanitized return destinations, including invite queries. |
| Medium | Custom password form assumed every account had a password and omitted Clerk's current-password/reverification flow. | Replaced with Clerk's secure account manager, supporting available email, password, connected-account and session controls. Actual enabled capabilities depend on Clerk settings. |
| Medium | Navbar swallowed sign-out failures then cleared UI state as though sign-out succeeded. | Fixed: report the failure and retain the signed-in state. |
| Acquisition | Anonymous Save displayed a toast without an entry into signup. | Fixed: contextual signup dialog. User selects Save again after signup; automatic action replay is not implemented. |
| Acquisition | Guests opening Messages saw a status message without a direct sign-in action. | Fixed: explicit contextual sign-in action. |
| Acquisition | Messaging opened its enquiry dialog behind the sign-in modal. | Fixed: unauthenticated click opens authentication first. |
| Accessibility | Login dialog lacked dialog semantics and focus trapping. | Fixed using existing dialog focus hook and accessible dialog markup. |

## Protections already present

- Clerk/Convex authentication is authoritative; localStorage profile data and UI roles do not authorize backend access.
- Favorites and profile operations enforce the caller's own user ID. Profiles cannot grant roles or verification.
- Owner edits/deletions, landlord decisions, private rooms, individual threads/messages, notifications and administrative queries check identity and resource access on the backend.
- Invitations are random, expire after seven days, bind to the recipient's verified email and reject replay.
- Assistant actions authenticate, enforce quotas and retrieve authorized conversation data. Payment and WhatsApp automation endpoints explicitly fail instead of inventing success.
- Public listing projections redact private landlord contact, owner IDs and private workflow state.

## Required hosted auth parameters: not verified here

Check production and development separately. Public identifiers in the built frontend are not proof of these settings.

1. Frontend Clerk publishable key belongs to the intended Clerk instance; production uses its live instance.
2. Frontend VITE_CONVEX_URL points to the matching intended Convex deployment.
3. Convex CLERK_JWT_ISSUER_DOMAIN exactly matches the Clerk token issuer. The configured application ID and JWT audience are `convex`.
4. Clerk's Convex token integration/template provides the real user's email and a boolean verified-email claim (received by Convex as emailVerified). Invitation, email fallback, support mail and alert subscription rely on these claims.
5. The production app origin and supported authentication/callback destinations are configured in Clerk. Check both direct email flows and configured social providers. Do not enable arbitrary redirect origins.
6. Confirm the instance's email verification, password recovery, bot protection, session duration, sensitive-action reverification and available MFA settings. These are provider settings, not established by a successful frontend build.

## Remaining gaps / prioritized follow-up

- High: deleting the Clerk account currently does not run a verified account lifecycle webhook to pause/remove its public listings, clean up private records or manage data retention. Design and implement verified, idempotent account-deletion/suspension handling before broad acquisition. Do not delete other participants' records blindly.
- Medium: there are still legacy hold/approval APIs alongside the new workflow. The authority checks are tightened, but a migration/removal plan is needed so old state transitions cannot compete with canonical applications.
- Medium: upload ownership is bound when an upload is claimed, not through a per-user upload-intent record before storage upload. Add intent-to-file binding and cleanup for unclaimed files; quotas and image validation already exist. This audit has not established an exploitable storage-ID discovery path.
- Medium: some legacy user-write APIs have no operation-specific quotas or consistently bounded profile fields. Expand abuse controls before paid acquisition, while avoiding extra signup requirements for legitimate users.
- Acquisition: email alert copy still suggests a delivery service, but the current card redirects to browse and no production delivery/unsubscribe pipeline is verified. Replace the promise or complete that service before using it as an acquisition CTA.
- Acquisition: preserve intentional actions after authentication (save, application/message drafts). Current redirect continuity preserves context, but some actions require a second click. Do not automatically publish, send messages or approve a takeover after sign-in.
- Acquisition: add privacy-conscious signup funnel measurements: entry action, auth opened/completed/cancelled, backend-ready failure and first successful save/message/listing. Never log JWTs, invitation tokens, credentials or message contents.
- Do not require a phone number, university or permanent tenant/landlord role just to browse or create an account. Those are optional profile/context fields; verified identity and property-specific permissions govern sensitive actions.

## Release verification

Run npm run check. After deploying Convex, test with isolated owner, landlord and applicant accounts: signup → verified-email invitation → authenticated backend query → owner edit → second browser observes exact costs → message/application → landlord decision → handover. Include wrong-email invitation, bound-ID/email mismatch, session expiry, passwordless account, account recovery and sign-out failure. Avoid changing real listings to perform these checks.

## Public production Clerk configuration observed

Read from the public frontend environment endpoint at clerk.relok8.online (no user credentials or private account records accessed): Google OAuth enabled; email verification at signup and email-link authentication enabled; public signup and smart CAPTCHA enabled. User attribute settings mark first name, last name and password required, with a 15-character password minimum. The auth config advertises both password and email-link first factors; verify the actual progressive email-signup journey before deciding which required fields to remove. MFA factors are not currently advertised. Privacy-policy URL, terms URL and support email are unset in Clerk display settings.

For acquisition, consider a Google/email-link path with optional last name and deferred profile completion. If retaining password signup, keep Clerk's password and breached-password checks rather than weakening password policy. Set policy and support links in Clerk to the app's existing destinations. These dashboard changes were not performed by this source audit. Token template claims, private session settings and lifecycle webhooks remain unverified.

A dedicated convex/tsconfig.json was added because the deployment CLI previously skipped its own backend type-check step when that file was absent. The corrected production deployment ran that check successfully.
