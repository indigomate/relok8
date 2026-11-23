# Step 02 — Production Stability and Release Hygiene

**Verification date:** 2026-11-23  
**Production domain:** `https://relok8.online`  
**Code deployment:** `DvG5J1jQDxU9jJqJoDP1vm8vYeas`  
**Commit:** `44644d865a554454bafc09b66777fbe4bb60528b`  
**Status:** Public production stability verified; signed-in Messages visual evidence pending

## Problem reproduced

Before this release, the public smoke test passed only the English home route. `/how-it-works`, `/list`, `/messages`, and `/help` emitted a Convex server error from `services:translatePublicListings`. The action was being invoked on routes that did not display listing content, and an unavailable translation provider could turn optional translation into a public runtime error.

## Changes shipped

1. Public listing translation now runs only on routes that render listing content.
2. Public browsing falls back to the original listing text if the optional translation provider is unavailable or returns an incomplete batch.
3. Explicit authenticated translation requests still surface provider failures so they are not silently hidden.
4. The Messages thread list is retractable on mobile and internally scrollable for higher thread counts.
5. Messages search and status filtering were clarified.
6. Real profile names are attached to authorized messages; generated person aliases and hard-coded names were removed.
7. Profile lookup is limited to authors in the authorized conversation rather than scanning all profiles.
8. `npm run smoke:production` now checks critical routes, browser console errors, page errors, navigation failures, and HTTP 5xx responses.

## Automated verification

| Check | Result |
|---|---|
| TypeScript | Passed |
| Test files | 17 passed |
| Tests | 186 passed |
| Vite production build | Passed |
| Public production routes | 6 of 6 passed |
| Unexpected console errors after deployment | 0 |

Verified routes:

- `/`
- `/pl`
- `/how-it-works`
- `/list`
- `/messages` while signed out
- `/help`

## Environment-variable check

The production Convex dashboard evidence shows these configured names with values masked:

- `CLERK_JWT_ISSUER_DOMAIN`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_WEBHOOK_SECRET`
- `SUPPORT_EMAIL`

No value was copied into this report. The local workspace is intentionally not linked to the production Convex deployment, so provider secrets were not fetched into the development environment.

The Opus/Gemini translation-provider variables are documented in `.env.example`, but their presence in production has not been proven. Public browsing is now stable without them; provider-backed live translation still belongs to Step 08 and must not be described as verified yet.

## Deployment and rollback

- Vercel reported `Deployment has completed` for commit `44644d8`.
- Previous known-good deployment: `HBushbaocb8xVNBcoPPNS3EiRqMj` for commit `d5e7b40`.
- Rollback options: promote the previous Vercel deployment or revert commit `44644d8` and redeploy.

## Evidence

- `evidence/step-02-stability/S02-01-home-desktop.png`
- `evidence/step-02-stability/S02-02-home-polish-mobile.png`
- `evidence/step-02-stability/S02-03-how-it-works-desktop.png`
- `evidence/step-02-stability/S02-04-list-place-mobile.png`
- `evidence/step-02-stability/S02-05-messages-signed-out-mobile.png`
- `evidence/step-02-stability/S02-06-help-desktop.png`

These images contain only public content and are approved for internal evidence. They do not contain credentials or private conversations.

## Remaining manual evidence

Use a controlled production test account to capture the signed-in Messages screen at 390×844, 768×1024, and 1440×1000. Required states:

1. Retractable thread list open and collapsed.
2. At least ten test threads demonstrating internal list scrolling.
3. Message bubbles showing controlled test participants' real profile names.
4. Search result, unread filter, and no-result state.

Do not capture real conversations, email addresses, addresses belonging to private test users, or unrelated browser tabs.
