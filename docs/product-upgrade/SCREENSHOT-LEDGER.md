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

## Required next captures

| Screenshot ID | Required screen/state | Status |
|---|---|---|
| S02-01 | Polish home after translation stability fix | missing |
| S02-02 | How it works with clean browser console | missing |
| S02-03 | List page mobile after clean-console verification | missing |
| S02-04 | Signed-in Messages with sanitized test users | missing |
| S02-05 | Messages collapsed list on mobile | missing |
| S02-06 | Messages with 10+ threads and internal scroll | missing |
| S02-07 | Message bubbles showing real participant names | missing |
