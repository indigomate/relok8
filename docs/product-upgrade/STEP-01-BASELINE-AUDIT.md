# Step 01 — Production Baseline Audit

**Audit date:** 2026-11-23  
**Environment:** `https://relok8.online`  
**Status:** Evidence captured; authenticated-state evidence pending

## Scope and evidence

Seven public production routes were captured without account credentials or private user information:

- English home — desktop and mobile
- Polish home — mobile
- How it works — desktop
- List your place — mobile
- Messages signed-out — mobile
- Help — desktop

All routes returned HTTP 200. The English home capture produced no browser console errors. The other capture run exposed repeated Convex failures from `services:translatePublicListings`.

## UX scorecard

| Area | Score | Evidence-based observation |
|---|---:|---|
| Status visibility | 6/10 | Core pages communicate their purpose, but translation failure is invisible to users and payment functionality is not yet represented as a real state machine. |
| Real-world language | 7/10 | Pricing and takeover language is substantially clearer than earlier versions. Some dense explanatory copy remains hard to scan on mobile. |
| User control | 6/10 | Navigation exists, but cookie consent obscures important controls and signed-out messages offers a weak recovery path after the single sign-in CTA. |
| Consistency | 6/10 | Brand and core components are recognizable, but page width, title hierarchy, spacing, and card density vary between routes. |
| Error prevention/recovery | 5/10 | Forms contain guidance, but the production translation failure lacks a visible fallback/retry state. |
| Mobile usability | 5/10 | The app is responsive, but header icons and dense hero/form content need stronger touch and reading hierarchy. |
| Accessibility | 6/10 | Semantic headings and visible controls are present; full keyboard, contrast, dialog, and reduced-motion verification is still required. |
| Trust/transparency | 8/10 | The platform clearly states current payment limitations and avoids presenting unverified provider actions as completed. |

## Prioritized findings

| ID | Finding | Heuristic | Severity | Effort | Required fix |
|---|---|---|---|---|---|
| B-01 | `services:translatePublicListings` throws production Convex errors across multiple routes. | Error prevention/recovery | Critical | Medium | Diagnose server action/provider configuration, add safe fallback, and re-run route smoke tests. |
| B-02 | Cookie banner covers meaningful mobile and desktop content, including form space and bottom navigation context. | User control/minimal design | Major | Small | Reduce footprint, preserve keyboard access, and prevent overlap with safe areas and primary actions. |
| B-03 | Mobile header controls appear visually small and crowded. | Accessibility/consistency | Major | Medium | Normalize 44px targets, spacing, labels, and overflow behaviour. |
| B-04 | Mobile hero and listing intake are text-dense, pushing key content/actions below the fold. | Recognition/minimal design | Major | Medium | Tighten content hierarchy and use progressive disclosure without removing required explanations. |
| B-05 | Signed-out Messages leaves excessive empty space and does not preview the value of the inbox or offer sign-up alongside sign-in. | Match/conversion | Major | Small | Add concise value explanation, sign-in/sign-up actions, and a purposeful empty-state layout. |
| B-06 | How-it-works uses a narrow content column on desktop, leaving a large unused canvas. | Visual hierarchy | Minor | Small | Improve max-width and supporting visual rhythm while retaining readability. |
| B-07 | Authenticated, landlord, tenant, applicant, payment, and relocation success states have no current sanitized screenshot baseline. | Visibility/evidence | Major | Medium | Capture through controlled test accounts or seeded local state before changing those flows. |

## What already works

- Production routes return HTTP 200.
- English and Polish landing content is present.
- The 49 PLN once / 49 PLN monthly model is communicated on How it works.
- The public visual identity is consistent enough to refine rather than replace.
- The listing form explains that draft state is local and that publishing requires sign-in.
- Signed-out Messages correctly prevents access to private conversation data.

## Missing evidence

- Authenticated account and onboarding
- Listing submission success and validation errors
- Landlord dashboard and application decisions
- Applicant, tenant, and landlord message threads
- Translation success, failure, and original-text states
- My Place takeover timeline
- Notifications and email preferences
- Payment sandbox states
- Reduced-motion variants
- Tablet layout
- Keyboard-only and screen-reader checks

## Step 01 result

The baseline is sufficient to begin Step 02. The first implementation task must be production translation stability, followed by capture of the same public routes with a clean console.
