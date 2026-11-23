# Relok8 LaunchMap screenshot inventory

## Review outcome

- **Publishable screenshots supplied:** 0
- **Private evidence screenshots reviewed:** 29
- **Approved non-screenshot assets:** the logo and favicon files listed below

All dashboard screenshots include unrelated browser tabs or browser/account chrome. Several also show masked credential inputs or private identifiers. UI password dots and eye icons are not publication-grade redaction: the replacement must crop the secret area or cover the entire value with a solid opaque mask and then be flattened.

The IDs below follow the screenshots' chronological order in the build session. Never publish the private source captures.

## Screenshot inventory

| ID | Provider/page | Linked masterclass step | Status | Private or sensitive location | Exact replacement capture |
|---|---|---:|---|---|---|
| IMG-001 | Convex → Environment Variables, initial rows | 3 | Exclude; replace | Value column for environment rows; deployment header; browser tabs | Crop to the variables card, solid-mask the complete Value column, remove deployment/account header and browser chrome. |
| IMG-002 | Convex → Environment Variables, support row added | 3 | Exclude; replace | Value column; deployment header; browser tabs | Same crop and opaque masking as IMG-001; preserve only safe field names and Add button. |
| IMG-003 | Convex → Create Deploy Key | 4 | Replace after crop | Deployment identifier; browser tabs; account avatar | Capture only the drawer from title through Create button before any generated key is shown; crop all project/account chrome. |
| IMG-004 | Vercel → Environment Variables | 5 | Exclude; replace | Secret variable row/value control; project/team identity; browser tabs | Crop to the saved row, place an opaque mask over the entire value area, retain Key and Production scope. |
| IMG-005 | Vercel → Production deployment before redeploy | 5 | Replace after crop | Project/deployment identifiers; account identity; browser tabs | Capture only the production card and redeploy prompt; mask unique deployment identifiers. |
| IMG-006 | Vercel → Production deployment, Ready | 5 | Replace after crop | Project/deployment identifiers; account identity; browser tabs | Capture Ready status, reviewed commit label, and production domain area; replace project-specific values with opaque masks where required. |
| IMG-007 | Convex → Functions list | 12 | Replace after crop | Deployment identifier; browser tabs | Crop to Functions navigation and the `emails` group; remove all browser/project chrome. |
| IMG-008 | Convex → `emails:queue`, successful mutation | 12 | Exclude; replace | Test recipient in Arguments; delivery identifier in Output; deployment header; browser tabs | Re-run with a disposable documentation alias. Crop Arguments to safe fixture fields and mask the delivery identifier in Output. |
| IMG-009 | Convex → `emailDeliveries`, sent row | 13 | Exclude; replace | Recipient, provider message ID, delivery/internal ID, idempotency value | Capture only status/attempts/category/created time; crop or opaque-mask every identifier and recipient column. |
| IMG-010 | Gmail → received product email | 14 | Exclude; replace | Inbox account, sender/recipient details, browser tabs, other mailbox content | Use a dedicated documentation inbox and crop to the email canvas; mask sender/recipient if not public test aliases. |
| IMG-011 | Gmail → message details popover | 14 | Exclude; replace | Sender, reply-to, recipient, mail routing details, browser tabs | Capture only authentication/status rows needed for the lesson; mask all addresses and routing identifiers. |
| IMG-012 | Clerk → Email templates, unavailable waitlist tab | 9 | Replace after crop | Application/account identity; browser tabs | Capture only the template panel showing availability state; crop navigation identity and browser chrome. |
| IMG-013 | Clerk → User & authentication → Email | 9 | Replace after crop | Application/account identity; browser tabs | Crop to verification-method settings only; retain labels and toggles. |
| IMG-014 | Clerk → Email templates list | 9 | Replace after crop | Application/account identity; browser tabs | Crop to Available templates and remove tenant/account chrome. |
| IMG-015 | Clerk → Email link, sign-up settings | 9 | Replace after crop | Application domain/sender details; project/account chrome; browser tabs | Crop to Mailing info and Delivered by Clerk; replace project-specific domains with opaque masks if publication policy requires. |
| IMG-016 | Clerk → default email body | 9 | Replace after crop | Application/account identity; browser tabs | Capture only the editor body and variable placeholders. |
| IMG-017 | Clerk → edited sign-up body, unsaved | 9 | Private evidence only | Unsaved state; application/account identity; browser tabs | Do not use as success evidence. Recapture only after a successful Save on an eligible plan. |
| IMG-018 | Clerk → Insert Link modal | 9 | Replace after correction | Browser/account chrome; empty URL field | Create a new capture showing the variable-picker result, not a fixed URL; crop to modal and nearby text. |
| IMG-019 | Clerk → email preview | 9 | Exclude; replace | Sample personal name/address, reply-to, account/project chrome, browser tabs | Preview with documentation-safe fixture identity, crop to the message, and mask any generated action URL. |
| IMG-020 | Clerk → Upgrade plan dialog | 9 | Replace after crop | Account/project chrome; browser tabs | Crop tightly to the plan-limit dialog. Use as evidence that custom templates were not saved. |
| IMG-021 | Clerk → Application Settings before branding | 8 | Exclude; replace | Application ID; account/project identity; browser tabs | Capture the Application details and Branding cards without the Application ID/right rail or browser chrome. |
| IMG-022 | Clerk → Branding after first upload | 8 | Exclude; obsolete | Application ID; account/project identity; incorrect/intermediate logo preview | Do not publish. Use only the final correct-brand state. |
| IMG-023 | Clerk → Branding with mark and favicon | 8 | Exclude; replace | Application ID; account/project identity; browser tabs | Crop tightly to Logo and Favicon previews; exclude the right rail and all browser chrome. |
| IMG-024 | Resend → Webhook, enabled/no events | 6–7 | Exclude; replace | Signing Secret field; project-specific endpoint; account identity; browser tabs | Crop to endpoint/status/event types. Completely crop the Signing Secret region or apply a solid opaque mask over the entire value area. |
| IMG-025 | Convex → Environment Variables with webhook secret | 7 | Exclude; replace | Entire Value column; deployment identifier; browser tabs | Crop to variable names, opaque-mask the entire Value column, remove project/account/browser chrome. |
| IMG-026 | Convex → `emails:queue`, second successful mutation | 12 | Exclude; replace | Test recipient, delivery identifier, deployment identifier, browser tabs | Re-run with a documentation alias; mask all output identifiers and crop browser chrome. |
| IMG-027 | Resend → `email.delivered` webhook event | 15 | Exclude; replace | Event/message IDs, payload sender/recipient/header data, endpoint identifier, browser tabs | Crop to event type, Success badge, HTTP `200 - OK`, and Attempts. Exclude the Message payload and all IDs. |
| IMG-028 | Convex → `emails:deliver` action metrics | 12–15 | Exclude; replace | Delivery identifier in Output; deployment identifier; browser tabs | Crop to function title, one successful call, zero errors, and execution time; omit the Output panel entirely. |
| IMG-029 | Convex → `emailDeliveries`, delivered row | 13–15 | Exclude; replace | Recipient, provider message ID, internal IDs, idempotency value, deployment identifier | Capture only status `delivered`, attempts, category, and timestamps; crop/mask all identifiers and recipient values. |

## Possible credential rotation flags

No raw credential can be confirmed from the visible captures because the dashboards conceal their values. However, IMG-001, IMG-002, IMG-004, IMG-024, and IMG-025 contain credential fields without publication-grade opaque redaction. If any original or earlier capture ever showed a revealed value, rotate that specific credential at its issuing provider and update only its destination secret field.

## Approved brand assets

These files contain no account or credential data and are approved for tutorial use as source assets. Keep them separate from private screenshots.

| Asset ID | Archive reference | Intended use | Status |
|---|---|---|---|
| ASSET-001 | `files.zip → relok8-logo-pack.zip → logo/png/relok8-mark.png` | Clerk logo mark | Approved |
| ASSET-002 | `files.zip → relok8-favicons.zip → favicons/favicon-32x32.png` | Clerk favicon | Approved |
| ASSET-003 | `files.zip → relok8-favicons.zip → favicons/favicon.ico` | Alternative favicon | Approved |
| ASSET-004 | `files.zip → relok8-logo-pack.zip → logo/png/relok8-logo-for-light.png` | Light-background wordmark | Approved |
| ASSET-005 | `files.zip → relok8-logo-pack.zip → logo/png/relok8-logo-for-dark.png` | Dark-background wordmark | Approved |

## Missing capture set

Use stable IDs for the replacements so LaunchMap annotations can be added without renumbering the lesson.

| Replacement ID | Capture required | Must visibly prove |
|---|---|---|
| CAP-001 | Resend verified domain summary | Domain verified status; no DNS values or account identity |
| CAP-002 | DNS TXT before Save | Add New Record, Type, Host/Name/Prefix, Value/Content fully opaque-masked, TTL, Save |
| CAP-003 | DNS record after Save | Saved row and provider success state; Value fully opaque-masked |
| CAP-004 | Convex email environment names | Variable names and Add; entire Value column opaque-masked |
| CAP-005 | Convex deploy-key form | Name, Expiration, minimal permissions, Create; no generated key |
| CAP-006 | Vercel saved deploy-key row | Key name, Production scope, value area opaque-masked |
| CAP-007 | Vercel deployment Ready | Ready status and reviewed commit; identifiers masked |
| CAP-008 | Resend webhook configuration | Endpoint label, three event types, Enabled; secret area excluded |
| CAP-009 | Convex webhook secret row | Variable name only; entire value area opaque-masked |
| CAP-010 | Clerk final global branding | Support email label, correct logo and favicon; Application ID excluded |
| CAP-011 | Clerk plan-limit dialog | Custom templates unavailable on current production plan |
| CAP-012 | Controlled queue result | Created=true; recipient and delivery ID masked |
| CAP-013 | Delivery ledger sent state | Attempts=1 and status=sent; all identifiers/recipient masked |
| CAP-014 | Test inbox receipt | Rendered email and CTA; documentation-safe test identity |
| CAP-015 | Resend delivery webhook result | Event type, Success, 200 OK, Attempts=1; payload excluded |
| CAP-016 | Delivery ledger delivered state | Status=delivered; all identifiers/recipient masked |
| CAP-017 | Email preferences before consent | Marketing off by default and separate product controls |
| CAP-018 | Email preferences after consent | Explicit consent, weekly digest, saved filters |
| CAP-019 | One-click unsubscribe result | Success page and preferences disabled after click |
| CAP-020 | Google signup welcome evidence | One welcome ledger row and safe test inbox receipt |
| CAP-021 | Unread summary evidence | Qualifying unread state, scheduled run, one safe receipt |
| CAP-022 | Expiry reminder evidence | Seven-day and one-day rows/receipts using fixture listing |
| CAP-023 | Weekly digest evidence | Opted-in delivery plus non-consented suppression evidence |
| CAP-024 | Bounce test evidence | Test event 200 response plus suppression state |
| CAP-025 | Complaint test evidence | Test event 200 response plus suppression state |
| CAP-026 | Duplicate replay evidence | Same event replayed with no duplicate state change |

## Annotation policy for replacements

The current private images are not eligible for LaunchMap overlays, so normalized coordinates are intentionally omitted. On each flattened replacement:

1. Draw one tight box or arrow per click, field, or status.
2. Number controls in interaction order.
3. Use the same number on source and destination screenshots only for safe values.
4. For credentials, point to the source copy control and destination field label; never box or reveal the value.
5. Record normalized coordinates as `{x, y, width, height}` in a 0–1 coordinate system after the final crop, not before it.
