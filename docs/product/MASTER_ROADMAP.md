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
- A: central Clerk verification helper and account sync integration committed on development branch; tests authored, execution unverified.
- B: profile synchronization and role normalization pending.
- C: landlord invitation and reassignment protection pending.
- D: signed Clerk lifecycle webhooks pending.
- E: public data projections and resource permissions pending.
- F: integration testing and release certification pending.

## Decisions
Preserve React, Convex, Clerk, Resend, Vercel and existing visual identity. Initial market Lublin, student distribution wedge, broader foreign-national rental market. Proposed commercial baseline: 49 PLN one-time tenant placement, 49 PLN monthly landlord acquisition per eligible tenancy, 1.5% gross rent processing; management separately priced and validated. Licensed payment partners first.

## Release gate
Separate branch, review, typecheck, tests, build, security/privacy review, user approval, then merge and production smoke tests. Development branch Vercel deployment disabled in vercel.json; restore production deployment configuration before merge. Confirm actual preview isolation with Vercel administrator. No production release authorized for A yet.
