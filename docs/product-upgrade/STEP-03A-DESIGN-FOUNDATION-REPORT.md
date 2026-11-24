# Step 03A — Design, Navigation, and Accessibility Foundation

**Status:** verified and deployed  
**Date:** 2026-11-24  
**Primary commit:** `171d79b`  
**Narrow-header correction:** `e5ed0f9`  
**Vercel deployment:** `Am2kKcWgvtfp9JYabzc64uw3jFjz`  
**Production URL:** `https://relok8.online`

## Scope completed

- Added reusable `Button`, `IconButton`, `Badge`, `Surface`, `EmptyState`, and `FormField` primitives.
- Added semantic spacing, control-height, and raised-surface tokens.
- Normalized mobile navigation targets to at least 44px and exposed active pages with `aria-current`.
- Added accessible popup state and Escape-to-close/focus-return behaviour to the language and account menus.
- Replaced the obstructive mobile cookie notice with a compact consent panel above the bottom navigation.
- Kept the Polish and English consent actions readable at narrow widths.
- Hid the duplicate top-level Saved action below 360px, where Saved remains available in the bottom navigation, preventing header overflow without removing the destination.
- Documented usage and governance in `docs/design-system/FOUNDATIONS.md`.
- Expanded the public smoke matrix to 320, 390, 768, 1024, and 1440px viewports.

## Verification performed

| Check | Result |
|---|---|
| TypeScript | passed |
| Automated tests | 17 files, 186 tests passed |
| Production build | passed |
| Production deployment | Vercel success |
| Public production smoke routes | 9 of 9 passed |
| English mobile at 320px | visually verified; header fits and consent panel clears bottom navigation |
| Polish mobile at 390px | visually verified; navigation and consent labels fit |
| Tablet and desktop route captures | captured at 768, 1024, and 1440px |
| Unexpected console or page errors | none in the smoke run |

The smoke checks cover `/`, `/pl`, `/how-it-works`, `/list`, `/messages`, and `/help`. A passing public smoke check proves the route rendered without an HTTP 4xx/5xx response, unexpected console error, or uncaught page error. It does not replace signed-in journey testing.

## Evidence

- `S03-01-home-mobile-320.png` — English home, 320×700, approved public evidence.
- `S03-02-home-polish-mobile-390.png` — Polish home, 390×844, approved public evidence.
- `S03-03-home-tablet-768.png` — English home, 768×1024, approved public evidence.
- `S03-04-home-desktop-1024.png` — English home, 1024×900, approved public evidence.
- `S03-05-home-desktop-1440.png` — English home, 1440×1000, approved public evidence.
- `S03-06-how-it-works-desktop-1440.png` — public route evidence.
- `S03-07-list-place-mobile-390.png` — signed-out list route evidence.
- `S03-08-messages-signed-out-mobile-390.png` — signed-out Messages access evidence.
- `S03-09-help-desktop-1440.png` — public Help route evidence.

All assets are stored under `docs/product-upgrade/evidence/step-03-design-foundation/` and contain no credentials or private account content.

## Rollback reference

- Roll back `e5ed0f9` to restore the Step 03A header before its narrow-width correction.
- Roll back `171d79b` to remove the complete Step 03A foundation.

## Evidence boundary and next controlled scope

Step 03A establishes the primitives and navigation foundation; it does not imply every existing screen has been migrated to those primitives. Step 03B should migrate the highest-use forms and operational panels to shared field, status, empty, loading, and error states, followed by keyboard and contrast checks. Signed-in Messages screenshots deferred from Step 02 remain a separate controlled-account evidence requirement.
