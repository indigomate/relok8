# Relok8 — production configuration

Relok8 uses Clerk for identity, Convex for application data and server work, Vercel for the Vite frontend, Resend for product email, Gemini for Onlo, an independently hosted Opus-MT service for dynamic translation, and Meta's WhatsApp Cloud API for consented alerts.

## Current product boundary

- Listings, authenticated messaging, private place rooms, invitations, email automation, Onlo, and notification preferences are implemented.
- Payment checkout is deliberately disabled. Relok8 does not collect, hold, capture, refund, or pay out rent, deposits, or service fees.
- WhatsApp delivery code is implemented, but a feature is not operational until Meta approves its templates, all production secrets are configured, and a signed delivery webhook plus receipt on a test phone are confirmed.
- Opus-MT translation requires a separately hosted HTTPS model service. The GitHub model repository is not a hosted API.
- There is no local-storage or in-browser backend fallback. Missing production configuration fails visibly.

## Browser variables — Vercel

Set these in the Vercel project for Production and Preview as appropriate:

| Variable | Required | Value source |
| --- | --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Clerk → API keys. This is the publishable browser key, never the Clerk secret key. |
| `VITE_CONVEX_URL` | Yes | Convex production deployment URL ending in `.convex.cloud`. |

Do not put any API token or secret in a variable beginning with `VITE_`; Vite exposes those values to the browser bundle.

## Server variables — Convex production

Set these in Convex Dashboard → Production → Settings → Environment Variables. Keep real values out of chat, screenshots, source control, and documentation.

### Core

| Variable | Required | Purpose |
| --- | --- | --- |
| `CLERK_JWT_ISSUER_DOMAIN` | Yes | Exact Clerk issuer for the production instance. |
| `PUBLIC_APP_URL` | Yes | `https://relok8.online` |
| `ADMIN_USER_IDS` | For admin tools | Comma-separated Clerk user IDs with the minimum necessary access. |

### Email

| Variable | Required | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | Yes for product email | Resend API key. |
| `RESEND_FROM_EMAIL` | Yes for product email | Verified sender, for example `Relok8 <updates@send.relok8.online>`. |
| `SUPPORT_EMAIL` | Yes for support forms | Monitored support mailbox. |
| `EMAIL_PREFERENCES_SECRET` | Yes for durable preference links | A separate random secret of at least 32 bytes. |
| `RESEND_WEBHOOK_SECRET` | Yes for delivery events | Signing secret for the Resend webhook. |

Webhook: `https://modest-anteater-459.convex.site/resend/webhook`

Subscribe to `email.delivered`, `email.bounced`, and `email.complained`. See `docs/EMAIL-SETUP.md` for the end-to-end test.

### Onlo and translation

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes for Onlo | Server-side Gemini key. |
| `GEMINI_MODEL` | Yes for Onlo | An enabled model name for that key/project. |
| `OPUS_MT_API_URL` | Yes for live dynamic translation | Private HTTPS Opus-MT endpoint. |
| `OPUS_MT_API_TOKEN` | Recommended | Bearer token enforced by the translation service proxy. |
| `OPUS_MT_CACHE_VERSION` | Optional | Cache namespace; change when replacing translation models. |

See `docs/AI-TRANSLATION-SETUP.md`.

### WhatsApp

| Variable | Required for delivery | Purpose |
| --- | --- | --- |
| `WHATSAPP_ACCESS_TOKEN` | Yes | Meta system-user token. |
| `WHATSAPP_PHONE_NUMBER_ID` | Yes | WhatsApp Business phone number ID. |
| `WHATSAPP_GRAPH_VERSION` | Yes | A currently supported Meta Graph API version. |
| `WHATSAPP_APP_SECRET` | Yes | Verifies signed POST webhooks. |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Yes | Random token used only for Meta's GET verification. |
| `WHATSAPP_DAILY_TEMPLATE_EN` / `WHATSAPP_DAILY_TEMPLATE_PL` | For daily digests | Approved template names. |
| `WHATSAPP_MESSAGE_TEMPLATE_EN` / `WHATSAPP_MESSAGE_TEMPLATE_PL` | For unread-message alerts | Approved template names. |

Webhook: `https://modest-anteater-459.convex.site/whatsapp/webhook`

See `docs/WHATSAPP-SETUP.md` and `docs/WHATSAPP-MESSAGE-NOTIFICATIONS.md`.

## Deploy and verify

1. Run `npm run check` locally. It must finish with type checks, every test, and the Vite production build passing.
2. Push to `main`. Vercel runs `npx convex deploy --cmd 'node build-vercel.mjs'`, so a successful production deployment covers both the Convex functions/schema and frontend build.
3. Run `npm run smoke:production`.
4. Test with two separate Clerk accounts: create a listing, open an inquiry, exchange messages, and confirm neither account can open the other's unrelated threads.
5. Verify each external delivery independently. A saved setting proves configuration only; a provider delivery event and receipt in the real inbox/device prove the delivery path.
6. Keep payment wording disabled until a regulated payment architecture, provider onboarding, legal review, and complete test flow exist.

## Secret handling

- Generate credentials in the owning provider and paste them directly into the destination secret field.
- Never reveal or copy real secret values into support chat or screenshots.
- Rotate a credential immediately if it appears in a repository, screenshot, terminal recording, URL, or message.
- Use separate development and production credentials, least privilege, and provider-side access logs where available.
