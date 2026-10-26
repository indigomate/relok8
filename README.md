# Relok8

React/Vite frontend on Vercel, Clerk authentication, and Convex database, file storage, queries, mutations, and actions. There is no Express server, browser database, or alternate database SDK.

## Local development

Use Node 24 and npm. Copy `.env.example` to `.env.local` and set the public Clerk key and the matching Convex `.convex.cloud` URL. The `.convex.site` URL is for Convex HTTP actions and is not the React client endpoint.

```sh
npm ci
npm run dev
npm run check
```

The app shows a setup screen when browser configuration is missing. Backend secrets belong in the Convex deployment environment, never in VITE_ variables or committed files.

## Authentication

Configure Clerk's Convex integration/JWT template with application ID `convex`, including the verified email claims. Set `CLERK_JWT_ISSUER_DOMAIN` in the corresponding Convex development deployment. The issuer and publishable key must belong to the same Clerk instance. `ConvexProviderWithClerk` supplies and refreshes authenticated tokens. The backend derives identity from validated tokens and checks resource ownership/participants on private operations. Self-selected UI roles do not grant permissions.

Documentation: https://docs.convex.dev/auth/clerk

## Backend development and deployment

```sh
npx convex dev
```

Use an isolated development deployment for testing. Existing leases without ownerId remain publicly readable but cannot be edited/deleted by ordinary users until an administrator verifies and assigns ownership. Do not infer ownership from a display name or import demo users as real identities.

`domainRecords` holds messaging, notifications, invitations and user availability in Convex transactions. Places derive from the canonical leases table. Favorites use one shared table across screens. Photos use Convex storage, with authenticated upload quotas and validation.

Payment capture, escrow, and automated WhatsApp approvals are disabled because no verified production integration exists. Their API endpoints return explicit failures and do not fabricate financial status. WhatsApp share links prepare a message for the user to send themselves.

## Optional services

Set GEMINI_API_KEY and GEMINI_MODEL in Convex for the assistant. Set RESEND_API_KEY, RESEND_FROM_EMAIL and SUPPORT_EMAIL for support mail. These actions authenticate callers and enforce per-user quotas. No email or AI success is fabricated when a service is unavailable. Listing alert preferences are stored only for the authenticated account's verified email; production alert delivery still requires a verified mail sender and a delivery/unsubscribe workflow.

## Vercel

Use the Vite framework, Node 24, build command `npm run build`, and output directory `dist`. Set VITE_CLERK_PUBLISHABLE_KEY and VITE_CONVEX_URL for each Preview/Production environment separately. Deploy and verify the matching Convex backend before releasing its frontend. Build does not deploy Convex. Inspect the preview deployment and two-account journeys before promoting production.

## Tests

`npm run lint` type checks the code. `npm test` exercises the real Convex handlers against convex-test, including anonymous requests, forged IDs, cross-account message reads/writes, private rooms, landlord approval, invitation binding/replay, notification ownership, reservation locks, subscriber privacy, and disabled financial integrations. `npm run build` produces the static frontend. Live Clerk tokens, email delivery, hosted settings, and device/browser journeys require separate staging verification.

### Vercel preview builds

`build-vercel.mjs` supplies the public Clerk development publishable key and Convex development URL only when Vercel identifies the deployment as Preview. Explicit Vercel values take precedence. Production builds require both variables in Vercel and fail if either is missing. No secret keys are stored in this file.
