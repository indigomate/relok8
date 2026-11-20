# Relok8 WhatsApp Cloud API setup

Relok8 sends daily apartment digests through Meta's official WhatsApp Cloud API. Convex owns consent, matching, scheduling, retries, delivery state, and the signed webhook. Do not put WhatsApp secrets in Vite, Vercel browser variables, source code, or chat.

## 1. Create the Meta assets

1. Open Meta Business Manager and use the verified business portfolio that will own Relok8.
2. Create a **Business** Meta app and add the **WhatsApp** product.
3. Create or select a WhatsApp Business Account.
4. Add the production sending number. Confirm whether the number can use WhatsApp Business App coexistence before moving an existing number.
5. Record the **Phone number ID** shown under WhatsApp → API Setup.
6. Create a Meta system user with the minimum required access to the Relok8 app and WhatsApp Business Account.
7. Generate a long-lived system-user token with `whatsapp_business_messaging` and `whatsapp_business_management` permissions.
8. Copy the Meta app secret from App settings. Rotate any token or secret that is accidentally shared.

## 2. Submit the message templates

Daily listing alerts are normally a **Marketing** use case. Submit both templates in WhatsApp Manager and wait until their status is **Approved**.

English template name: `relok8_daily_apartment_digest_en`

Language: English (US)

```text
Hi {{1}}, your Relok8 daily apartment update has {{2}} new matches:

{{3}}

View the first match: {{4}}

Reply STOP to pause alerts.
```

Polish template name: `relok8_daily_apartment_digest_pl`

Language: Polish

```text
Cześć {{1}}, Twój codzienny przegląd Relok8 zawiera {{2}} nowych ofert:

{{3}}

Zobacz pierwszą ofertę: {{4}}

Odpowiedz STOP, aby wstrzymać alerty.
```

Template parameters are:

1. Relok8 display name or a neutral greeting.
2. Number of matching listings.
3. A short list containing title, monthly cost, and city.
4. A Relok8 link to the first current listing.

Use representative, non-sensitive sample values during Meta review. Do not claim that a listing, landlord, identity, deposit, or legal outcome has been verified.

## 3. Configure Convex production secrets

Set these in the Convex production deployment, not in `.env` committed to Git:

```bash
npx convex env set PUBLIC_APP_URL https://relok8.online
npx convex env set WHATSAPP_PHONE_NUMBER_ID '<phone-number-id>'
npx convex env set WHATSAPP_GRAPH_VERSION '<current-supported-version>'
npx convex env set WHATSAPP_ACCESS_TOKEN '<system-user-token>'
npx convex env set WHATSAPP_APP_SECRET '<meta-app-secret>'
npx convex env set WHATSAPP_WEBHOOK_VERIFY_TOKEN '<long-random-value>'
npx convex env set WHATSAPP_DAILY_TEMPLATE_EN relok8_daily_apartment_digest_en
npx convex env set WHATSAPP_DAILY_TEMPLATE_PL relok8_daily_apartment_digest_pl
```

Use the production deployment key or authenticate the Convex CLI before running these commands. Confirm the current supported Graph API version in Meta's official documentation rather than copying an old version number.

## 4. Connect the signed webhook

In Meta → WhatsApp → Configuration, configure:

- Callback URL: `https://modest-anteater-459.convex.site/whatsapp/webhook`
- Verify token: the exact value stored in `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- Webhook field: `messages`

Meta first calls the GET verification route. Subsequent POST events are accepted only when `x-hub-signature-256` matches `WHATSAPP_APP_SECRET`. Relok8 stores only an idempotency key and delivery metadata, not raw webhook bodies.

## 5. Deploy and test

1. Run `npm run check`.
2. Run `npx convex deploy --dry-run` and confirm schema/index changes.
3. Deploy Convex, then deploy the Vercel frontend.
4. In Relok8, sign in and open **Notifications & Alerts**.
5. Enter a test recipient in E.164 format, choose filters and a Warsaw-local delivery hour, explicitly consent, and save.
6. With Meta's test number, add the recipient to the allowed test-recipient list.
7. Trigger `internal.whatsapp.queueDueDigests` from the Convex dashboard with a test `now` value whose Warsaw-local hour matches the saved preference. Do not set `scheduleDelivery: false` outside automated tests.
8. Confirm a `whatsappDeliveries` row progresses through `queued` → `sent` → `delivered` or `read`.
9. Reply `STOP` and confirm the subscription becomes inactive. Reply `START` to reactivate an existing subscription.

## Operational behavior

- The Convex cron runs hourly at minute 05 and selects subscriptions whose configured hour matches `Europe/Warsaw`, including daylight-saving changes.
- Only newly published, currently available listings since the last successful digest are included after the first digest.
- Deliveries are unique per subscription and Warsaw calendar date.
- Transient provider failures retry after approximately 1, 5, and 30 minutes.
- Missing provider configuration fails visibly without claiming delivery.
- Users can pause in Relok8 or reply STOP in WhatsApp.
- Listing alerts remain template messages; a user reply opens Meta's normal 24-hour service window for conversational responses, but Relok8 does not yet automate free-form replies.

## Before public launch

- Complete Meta business verification and display-name review.
- Publish a privacy-policy section covering WhatsApp alerts, retention, processor/provider, and opt-out.
- Confirm Polish/EU consent wording with qualified counsel.
- Set an owner for delivery failures and monitor failed delivery rows.
- Establish access-token and app-secret rotation procedures.
- Test opt-in, phone changes, STOP/START, template rejection, expired tokens, rate limiting, and deleted listings.
