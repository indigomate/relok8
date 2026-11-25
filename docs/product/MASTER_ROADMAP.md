# Relok8 master roadmap
Baseline: 2026-11-25. Statuses are preliminary; no feature is certified by source inspection alone.
| Phase | Scope | Status |
|---|---|---|
| 00 | Repository audit | In progress |
| 01 | Authentication, onboarding, roles | Partial |
| 02 | Persistent property registration and deduplication | Partial |
| 03 | Landlord authorization and rental lifecycle | Partial |
| 04 | Personalized housing discovery | Partial |
| 05 | Referrals and incoming tenant placement | Partial |
| 06 | Mobility Passport | Unverified |
| 07 | Licensed payment provider architecture | Pending |
| 08 | Relok8 Pay and family payments | Pending |
| 09 | Billing, reconciliation and analytics | Pending |
| 10 | Security, privacy, production readiness | Partial |
| 11 | Landlord portfolio workspace | Pending |
| 12 | Property management | Pending |
| 13 | Local services and worker workspace | Pending |
| 14 | Integrated operations and Onlo | Pending |

## R8-00.01 identity infrastructure
- A: implementation merged and production deployment reported successful for 0a82ed6; CI run #19 passed 204/204 tests, 19/19 suites, typecheck and frontend build. Preview deployment passed. Live public routes and authenticated acceptance checks remain unverified because direct site and Vercel API access are unavailable. Status: deployed, acceptance open.
- B: profile synchronization and role normalization pending.
- C: landlord invitation and reassignment protection pending.
- D: signed Clerk lifecycle webhooks pending.
- E: public data projections and resource permissions pending.
- F: integration testing and release certification pending.

## Decisions
Preserve React, Convex, Clerk, Resend, Vercel and existing visual identity. Initial market Lublin, student distribution wedge, broader foreign-national rental market. Proposed commercial baseline: 49 PLN one-time tenant placement, 49 PLN monthly landlord acquisition per eligible tenancy, 1.5% gross rent processing; management separately priced and validated. Licensed payment partners first.

## Release gate
Review, typecheck, tests, build, security/privacy review, user authorization, then merge and production smoke tests. Preview builds use existing development frontend configuration and do not invoke Convex deployment. Production backend deployment requires VERCEL_ENV=production, main branch, and production configuration. Connected Vercel API access remains unavailable; use dashboard evidence and GitHub checks.

## Verification history
- Run 45519689640: 198/204 passed; six legacy syncAccount references failed.
- Run 45519831653: 203/204 passed; one listing nudge fixture conflated platform and email verification. Fixed fixture and added negative assertion. No production changes.

- Run 45519960906 (110be8f): completed successfully, 204/204 tests, 19/19 files, typecheck and frontend build passed; npm reported zero known vulnerabilities. Nonblocking dependency/action deprecation warnings remain.
- Release audit 2026-11-25: Vercel project lookup returned 404 and scoped project search returned no matches. No merge or production deployment initiated. Confirm intended project access, production branch, build command and environment-scoped Convex deploy keys before release. Live Clerk/Convex integration remains unverified.

- Run 45522806537 (bcefaff): 204/204 passed, 19/19 suites, typecheck and frontend build passed. Vercel preview build rejected by production guard, confirmed by user screenshot. Corrected preview path in f0e645e; no production release yet.

- Run 45523346566 (342765c): completed successfully, 204/204 tests, 19/19 files, typecheck and frontend build passed; Vercel preview success. PR #1 merged as 0a82ed6982eca39d4250a153107bf9791f66a525; GitHub Vercel status success. Public route probes unavailable from verification environment; no authenticated test or production log inspection completed. Do not close A until live checks pass.
