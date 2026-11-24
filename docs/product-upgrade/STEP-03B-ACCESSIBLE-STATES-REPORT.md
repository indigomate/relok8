# Step 03B — Accessible States, Slice 1

**Status:** slice 1 verified and deployed; Step 03B remains in progress  
**Date:** 2026-11-24  
**Commit:** `c7ee11d`  
**Vercel deployment:** `FvXQs6LcxuXv26rk4nmbEZMR2QT2`  
**Production URL:** `https://relok8.online`

## Problem and affected users

The public Help form used a browser alert for delivery failures, did not keep a persistent inline error state, and did not provide linked custom validation messages. The search control had no programmatic label, guide cards were clickable `div` elements rather than keyboard controls, and FAQ triggers did not identify their controlled panels. These issues affected keyboard users, screen-reader users, people using touch devices, and anyone needing clear recovery after a failed submission.

## Scope completed

- Added reusable `StatusMessage` states for success, error, warning, and information.
- Added a reusable `LoadingState` with visible text and reduced-motion support.
- Migrated the Help contact form to shared `FormField`, `Button`, and status components.
- Replaced browser alerts with persistent inline error feedback.
- Added custom English and Polish validation for email and message fields.
- Connected every form label, hint, and error to its control.
- Made the optional city/university field functional by including it in the support context.
- Prevented raw provider/server error text from being shown to users.
- Added an accessible label to Help search.
- Added selected-state semantics to category filters.
- Connected FAQ triggers and panels with `aria-controls`, `aria-labelledby`, and regions.
- Converted guide cards into native keyboard-operable buttons.
- Migrated the listing-report form to shared form, button, success, and error states.
- Added 44px targets and visible focus treatment to the migrated compact actions.

## Accessibility audit

| Issue | WCAG criterion | Severity | Resolution |
|---|---|---:|---|
| Browser alert was the only support-error feedback | 3.3.1 Error Identification; 4.1.3 Status Messages | High | Replaced with persistent `StatusMessage` using an assertive alert. |
| Help search had no programmatic label | 1.3.1 Info and Relationships; 3.3.2 Labels or Instructions | High | Added a connected, visually hidden label. |
| Guide cards were pointer-only clickable containers | 2.1.1 Keyboard | High | Replaced with native buttons and visible focus rings. |
| Field errors were not associated with inputs | 3.3.1; 3.3.2; 4.1.2 Name, Role, Value | High | Added `aria-describedby`, `aria-invalid`, and inline correction instructions. |
| FAQ triggers did not identify their panels | 4.1.2 Name, Role, Value | Medium | Added trigger/panel IDs, controls, labelled regions, and expanded state. |
| Small text actions lacked consistent touch area | 2.5.8 Target Size (Minimum) | Medium | Standardized migrated actions at 44px minimum height. |
| Loading animation needed a non-motion equivalent | 2.3.3 Animation from Interactions | Medium | Loading text stays visible and animation stops under reduced-motion preference. |

A full accessibility audit still requires manual testing with VoiceOver or NVDA, browser zoom at 200%, and authenticated screens.

## Verification performed

| Check | Result |
|---|---|
| TypeScript | passed |
| Automated tests | 18 files, 190 tests passed |
| Production build | passed |
| Vercel deployment | success |
| Public production smoke routes | 11 of 11 passed |
| English empty-submit validation | passed; two invalid controls and two linked alerts |
| Polish empty-submit validation | passed; two invalid controls and two linked alerts |
| Real support message sent during validation capture | no |
| Unexpected console/page errors | none |

The automated state tests cover live-region semantics, reduced-motion loading, form-field error associations, Help search labelling, filter selection semantics, and FAQ panel relationships.

## Evidence

- `S03B-01-help-mobile-390.png` — English Help default state.
- `S03B-02-help-polish-mobile-390.png` — Polish Help default state.
- `S03B-03-help-desktop-1440.png` — English Help desktop state.
- `S03B-04-help-validation-en-390.png` — English linked validation errors.
- `S03B-05-help-validation-pl-390.png` — Polish linked validation errors.

All evidence is stored under `docs/product-upgrade/evidence/step-03b-accessible-states/` and contains no account data, messages, credentials, or submitted support content.

## Evidence boundary and next slice

This slice verifies public Help and listing-report patterns. It does not prove successful support delivery, authenticated reporting, or assistive-technology behaviour. The next Step 03B slice should migrate Account and Property Settings to the shared states, then verify focus order, 200% zoom, loading, save success, save failure, and destructive confirmations with controlled accounts.
