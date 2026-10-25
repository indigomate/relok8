# Relok8 remediation status — 25 October 2026

## Result

Implemented and tested locally against the supplied export. This is not a production all-clear. Nothing has been pushed or deployed, and no live data or service settings have been changed.

The application now uses a Vite frontend for Vercel, Clerk authentication, and Convex as its only backend/database/storage. Removed the alternate database SDK, SQL schema/seed, client modules, types, environment settings, and dependency; removed the Express server, JSON persistence, browser database simulation, and duplicate listing backend. Existing remote Convex tables are retained by the schema to avoid destroying historical records; leases is the canonical active listing table.

## Implemented fixes

- Verified Clerk identity is passed into Convex using ConvexProviderWithClerk. Backend functions derive the caller from validated claims, require ownership/participants for private records, and reject caller-supplied user ID impersonation.
- Profiles cannot grant their own verification or privileged role. Public listing queries redact private contacts, owner/holder identities, and private place workflow state. Landlord access uses verified identity/email or a verified invitation.
- Messages, private landlord/tenant rooms, notifications, invitations, availability, and place/exit/checklist workflows now persist transactionally in Convex. Places derive from canonical lease records. Favorites use the same account-bound table across screens.
- Invitations are tied to a verified recipient, expire after seven days, and cannot be replayed. Notifications can only be read/updated by their intended recipient.
- Reservations are atomic, reject forged identities, cannot displace another holder, expire correctly, and cannot be extended by repeatedly reserving. Landlord decisions require the correct verified caller and a current request. Listing deletion removes dependent messages, favorites, and other records without breaking inboxes.
- Uploaded photos go to Convex storage with authentication, quotas, MIME/size validation, and ownership checks before listing attachment. Large base64 photos are no longer database documents. Unavailable AI review never fabricates approval.
- Removed arbitrary public email dispatch. Optional support email has a fixed configured recipient, verified reply-to identity, input limits, and per-user quotas. AI actions require authentication, quotas and configured credentials/model; they do not claim success during outages.
- Removed fake financial success and automated WhatsApp simulations. Payment endpoints fail explicitly. The UI can submit a real landlord approval request without payment; it does not claim money was held. Manual WhatsApp share links remain user-controlled.
- Publishing, inquiries, subscriptions, account edits, and deletion no longer turn backend failures into success. Removed test identity/email switching and fake document verification. Invalid listing links show a not-found state. Removed unconditional deposit-return marketing promises in the updated banner/copy.
- Added explicit environment setup, Vercel static build/SPA routing and basic security headers, Node 24 requirement, portable clean command, npm lockfile, and meaningful security regression tests. Corrected the Vite/esbuild dependency conflict.

## Validation

- 28 security regression tests passed using the actual Convex handlers and convex-test, including competing reservations, expiry, cross-account access, notification ownership, verified invitations, quotas, upload ownership, and deletion consistency.
- TypeScript check passed.
- Vite production build passed.
- npm dependency advisory scan: 0 known vulnerabilities across the resolved 260-package graph. This is not evidence that the entire app is secure.
- Source scan found no alternate database SDK/config references in current runtime source, package files, environment example, or Vercel configuration.

## Still needed before release

1. Authenticated GitHub, Convex, Clerk, and Vercel access. GitHub read access works, but the saved CLI token is invalid. Clerk in the Codex browser is at sign-in.
2. Configure an isolated development deployment and matching Clerk integration/issuer/verified email claims. Regenerate Convex artifacts against the linked project and deploy/test the new functions/schema. Codegen without a configured deployment failed, and selecting the supplied deployment for codegen reached a network/authentication blocker; no deployment occurred.
3. Verify actual Clerk tokens and two-account browser journeys on a Vercel Preview: publishing/uploading, saving, messaging, private room isolation, invitations, landlord approval, expiry/cancellation, account editing, deep links, and logout/account switching.
4. Verify and assign ownership of existing ownerless Convex listings. An admin-only assignment mutation is included; no ownership was guessed from display names and no remote records were changed. Review any legacy local records before importing them. The original Downloads export is unchanged.
5. Optional services need configured test credentials and real delivery checks. Alert preferences are stored securely; automated listing alert delivery/unsubscribe messaging still needs a defined production email workflow. AI needs an enabled model. Email needs a verified sender and support mailbox.
6. Real payments/escrow and automated WhatsApp are NOT implemented by this remediation. They remain explicitly disabled. They require selected provider/business behavior, test credentials, verified webhooks, idempotency/reconciliation and end-to-end tests before enabling. Ordinary reservation/landlord approval is separate and does not move money.
7. Review actual hosting settings, backup/restore, retention, provider grants, logs and browser-dependent security headers. Any previously deployed retired database project needs a separate exposure/retirement review; removing its local code does not change its hosted policies.

## Git identity and review

Commit identity is indigomate <judymissi@gmail.com>, as requested. Local changes are prepared for review; the original remote history has not been rewritten or force-pushed. The supplied download differs from the current GitHub checkout, so the review includes the supplied export's changes as well as these fixes. No secret keys or local data records belong in the source archive.
