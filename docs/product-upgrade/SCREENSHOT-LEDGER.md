# Relok8 Upgrade Screenshot Ledger

## Publication rules

- `approved-public`: contains only public production content and no private account data.
- `approved-test`: contains controlled test-account data suitable for internal evidence.
- `replacement-needed`: private or unclear content must be replaced with a sanitized capture.
- `missing`: required evidence has not yet been captured.

## Step 01 baseline inventory

| Screenshot ID | Route/screen | Viewport | State | Publication status | Evidence/notes |
|---|---|---:|---|---|---|
| S01-01 | Home `/` | 1440×1000 | Public default | approved-public | HTTP 200; no console errors during this capture. |
| S01-02 | Home `/` | 390×844 | Public default | approved-public | Cookie banner overlaps lower mobile content. |
| S01-03 | Polish home `/pl` | 390×844 | Public default | approved-public | Convex translation action error observed in console. |
| S01-04 | How it works `/how-it-works` | 1440×1000 | Public default | approved-public | Large unused desktop canvas; translation action error observed. |
| S01-05 | List your place `/list` | 390×844 | Signed out, draft start | approved-public | Cookie banner competes with form; translation action error observed. |
| S01-06 | Messages `/messages` | 390×844 | Signed out | approved-public | Excess empty space; translation action error observed. |
| S01-07 | Help `/help` | 1440×1000 | Public default | approved-public | Translation action error observed. |
| S01-CS | Baseline contact sheet | 760×1160 | Summary | approved-public | Collates S01-01 through S01-07. |

## Files

- `evidence/step-01-baseline/S01-01-home-desktop.png`
- `evidence/step-01-baseline/S01-02-home-mobile.png`
- `evidence/step-01-baseline/S01-03-home-polish-mobile.png`
- `evidence/step-01-baseline/S01-04-how-it-works-desktop.png`
- `evidence/step-01-baseline/S01-05-list-place-mobile.png`
- `evidence/step-01-baseline/S01-06-messages-signed-out-mobile.png`
- `evidence/step-01-baseline/S01-07-help-desktop.png`
- `evidence/step-01-baseline/S01-contact-sheet.jpg`

## Step 02 production stability evidence

| Screenshot ID | Route/screen | Viewport | State | Publication status | Evidence/notes |
|---|---|---:|---|---|---|
| S02-01 | Home `/` | 1440×1000 | Public default | approved-public | Post-deployment capture; smoke check passed with zero unexpected console errors. |
| S02-02 | Polish home `/pl` | 390×844 | Public default | approved-public | Source-language fallback remains available when the translation provider is unavailable; no runtime error. |
| S02-03 | How it works `/how-it-works` | 1440×1000 | Public default | approved-public | Post-deployment capture; smoke check passed. |
| S02-04 | List your place `/list` | 390×844 | Signed out, draft start | approved-public | Post-deployment capture; smoke check passed. |
| S02-05 | Messages `/messages` | 390×844 | Signed out | approved-public | Post-deployment capture; private data remains inaccessible. |
| S02-06 | Help `/help` | 1440×1000 | Public default | approved-public | Post-deployment capture; smoke check passed. |

## Remaining Step 02 captures

| Screenshot ID | Required screen/state | Status |
|---|---|---|
| S02-07 | Signed-in Messages with sanitized test users, desktop | missing |
| S02-08 | Messages collapsed list, mobile | missing |
| S02-09 | Messages with 10+ test threads and internal scroll | missing |
| S02-10 | Message bubbles showing controlled test participants' real names | missing |
| S02-11 | Signed-in Messages, tablet | missing |

## Step 03A design foundation evidence

| Screenshot ID | Route/screen | Viewport | State | Publication status | Evidence/notes |
|---|---|---:|---|---|---|
| S03-01 | Home `/` | 320×700 | Public default, consent open | approved-public | Narrow header fits after `e5ed0f9`; compact cookie panel clears the bottom navigation. |
| S03-02 | Polish home `/pl` | 390×844 | Public default, consent open | approved-public | Polish navigation and consent labels fit; no horizontal clipping. |
| S03-03 | Home `/` | 768×1024 | Public default | approved-public | Tablet evidence from the verified production deployment. |
| S03-04 | Home `/` | 1024×900 | Public default | approved-public | Small-desktop evidence from the verified production deployment. |
| S03-05 | Home `/` | 1440×1000 | Public default | approved-public | Desktop evidence from the verified production deployment. |
| S03-06 | How it works `/how-it-works` | 1440×1000 | Public default | approved-public | Production smoke check passed. |
| S03-07 | List your place `/list` | 390×844 | Signed out | approved-public | Production smoke check passed; no private data. |
| S03-08 | Messages `/messages` | 390×844 | Signed out | approved-public | Production smoke check passed; private data remains inaccessible. |
| S03-09 | Help `/help` | 1440×1000 | Public default | approved-public | Production smoke check passed. |

## Step 03A files

- `evidence/step-03-design-foundation/S03-01-home-mobile-320.png`
- `evidence/step-03-design-foundation/S03-02-home-polish-mobile-390.png`
- `evidence/step-03-design-foundation/S03-03-home-tablet-768.png`
- `evidence/step-03-design-foundation/S03-04-home-desktop-1024.png`
- `evidence/step-03-design-foundation/S03-05-home-desktop-1440.png`
- `evidence/step-03-design-foundation/S03-06-how-it-works-desktop-1440.png`
- `evidence/step-03-design-foundation/S03-07-list-place-mobile-390.png`
- `evidence/step-03-design-foundation/S03-08-messages-signed-out-mobile-390.png`
- `evidence/step-03-design-foundation/S03-09-help-desktop-1440.png`

## Step 03B accessible-state evidence — slice 1

| Screenshot ID | Route/screen | Viewport | State | Publication status | Evidence/notes |
|---|---|---:|---|---|---|
| S03B-01 | Help `/help` | 390×844 | Public default | approved-public | Deployed accessible Help layout; production smoke check passed. |
| S03B-02 | Polish Help `/pl/help` | 390×844 | Public default | approved-public | Polish labels and controls fit; production smoke check passed. |
| S03B-03 | Help `/help` | 1440×1000 | Public default | approved-public | Desktop production smoke check passed. |
| S03B-04 | Help contact form `/help` | 390×844 | Empty-submit validation | approved-public | Two invalid controls and two linked English error messages; no message sent. |
| S03B-05 | Polish Help contact form `/pl/help` | 390×844 | Empty-submit validation | approved-public | Two invalid controls and two linked Polish error messages; no message sent. |

## Step 03B files — slice 1

- `evidence/step-03b-accessible-states/S03B-01-help-mobile-390.png`
- `evidence/step-03b-accessible-states/S03B-02-help-polish-mobile-390.png`
- `evidence/step-03b-accessible-states/S03B-03-help-desktop-1440.png`
- `evidence/step-03b-accessible-states/S03B-04-help-validation-en-390.png`
- `evidence/step-03b-accessible-states/S03B-05-help-validation-pl-390.png`
