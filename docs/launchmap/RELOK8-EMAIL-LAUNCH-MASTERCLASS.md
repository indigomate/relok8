# LaunchMap masterclass: Relok8 production email launch

**Project:** Relok8  
**Inferred session goal:** connect production transactional email delivery, record Resend delivery events in Convex, configure safe marketing preferences, and apply Clerk account-email branding.

> Publication note: the source screenshots remain private evidence. None are embedded here because the supplied dashboard captures contain unrelated browser tabs and, in several cases, masked secrets or private identifiers. Use the replacement-capture list in `RELOK8-SCREENSHOT-INVENTORY.md`. Do not publish a screenshot until the replacement is locally redacted, flattened, and reviewed.

## What this session proves

The captured evidence proves that one manually queued Relok8 product email travelled through the application, Resend, a test inbox, and the signed delivery webhook, and that its delivery ledger was updated to `delivered`.

It does **not** yet prove every automatic trigger. Welcome-after-Google-signup, unread summaries, expiry reminders, weekly digests, bounce suppression, complaint suppression, one-click unsubscribe, and saved Clerk custom templates each need their own test evidence.

## Prerequisites

- Owner or administrator access to the Relok8 GitHub repository, Convex deployment, Vercel project, Resend account, Clerk production instance, and DNS provider.
- A monitored support mailbox and a separate test inbox.
- A verified Resend sending subdomain.
- The safe brand files from `files.zip`:
  - Clerk logo: `logo/png/relok8-mark.png`
  - Clerk favicon: `favicons/favicon-32x32.png` or `favicons/favicon.ico`
  - App icon: `logo/png/relok8-app-icon.png`
- A local image editor that can crop and place solid opaque masks, then export a flattened PNG.

## Placeholder map

These values are project-specific. Learners must obtain their own values from the named provider.

| Placeholder | What it means | Where to get it |
|---|---|---|
| `{{production_url}}` | Public application origin | Vercel → project → Domains |
| `{{convex_site_url}}` | Convex HTTP Actions URL | Convex → Settings → General → HTTP Actions URL |
| `{{sending_subdomain}}` | Resend-verified mail subdomain | Resend → Domains |
| `{{from_address}}` | Branded sender on the verified subdomain | Your approved email-delivery plan |
| `{{support_email}}` | Monitored human reply address | Your mail provider/admin |
| `YOUR_RESEND_API_KEY` | Example only; Resend API credential | Generate in Resend → API Keys; paste only into the Convex secret field |
| `YOUR_RESEND_WEBHOOK_SECRET` | Example only; webhook signing credential | Reveal/copy only inside Resend → Webhooks; paste only into the Convex secret field |
| `YOUR_CONVEX_DEPLOY_KEY` | Example only; Convex deployment credential | Generate in Convex → Settings → General; paste only into Vercel's secret field |
| `YOUR_EMAIL_PREFERENCES_SECRET` | Example only; random signing secret of at least 32 random bytes | Generate locally with a cryptographically secure tool; paste only into Convex |

Never paste real credentials into chat, screenshots, tutorial notes, source code, JSON, or a `VITE_` environment variable.

---

## Module 1 — Prepare the sending identity

### Step 1. Verify the sending subdomain in Resend

**Provider:** Resend  
**Page:** Domains  
**Direct link:** `https://resend.com/domains`

1. Click **Domains** in the left navigation.
2. Click the control for adding a domain. Confirm its exact label in your current dashboard before capturing it.
3. Enter `{{sending_subdomain}}`. Use a dedicated sending subdomain rather than the human-inbox domain.
4. In the DNS provider, add every record Resend supplies. Copy full values with Resend's copy controls; do not copy shortened text from a screenshot.
5. For every TXT record, capture **Add New Record**, **Type**, **Host/Name/Prefix**, **Value/Content**, **TTL**, and **Save** as separate numbered callouts.
6. Check whether the DNS provider automatically appends the root domain. If it does, enter only the host prefix; do not duplicate the domain.
7. Return to Resend and wait for the domain status to show the provider's verified state.

**Success looks like:** the sending domain is verified and eligible to send.  
**Verification:** send only after Resend reports verification. A saved DNS row is configuration evidence; the verified Resend status is verification evidence.

**Missing capture:** sanitized Resend domain-verification page and sanitized DNS before/after rows.

### Step 2. Create the Resend API key

**Provider:** Resend  
**Page:** API Keys  
**Direct link:** `https://resend.com/api-keys`

1. Open **API Keys**.
2. Click the key-creation control.
3. Give the key a production-specific name that contains no personal data.
4. Select the least permission and domain scope required to send from `{{sending_subdomain}}`.
5. Create the key and copy it once.
6. Immediately paste it into the Convex environment variable described in Step 3. Never save it in notes.

**Field transfer:** Resend-generated credential → Convex secret field `RESEND_API_KEY`. Use `YOUR_RESEND_API_KEY` only as an example placeholder in documentation.

**Success looks like:** Resend lists the key by name while the real value is no longer exposed.  
**Missing capture:** sanitized key-list row with the value completely cropped out.

### Step 3. Add email secrets and addresses to Convex

**Provider:** Convex  
**Page:** Settings → Environment Variables  
**Direct link:** `https://dashboard.convex.dev`

1. Select the **Production** deployment.
2. Open **Settings**.
3. Open **Environment Variables**.
4. Click **Add**.
5. In **Name**, enter `RESEND_API_KEY`.
6. In **Value**, paste the real Resend key directly from Resend. The real value belongs only in this secret field.
7. Repeat **Add** with **Name** `RESEND_FROM_EMAIL` and **Value** `{{from_address}}`.
8. Repeat **Add** with **Name** `SUPPORT_EMAIL` and **Value** `{{support_email}}`.
9. Generate a new cryptographically random secret of at least 32 bytes locally. Add it as `EMAIL_PREFERENCES_SECRET`. Do not reuse an API key.
10. Confirm that the saved rows appear by name and that their values remain concealed.

**Success looks like:** four named variables exist in the production deployment.  
**Verification:** the rows prove that settings were saved; only a delivered test proves the values work.

---

## Module 2 — Connect Vercel deployment to Convex

### Step 4. Generate a production deploy key

**Provider:** Convex  
**Page:** Settings → General → Deploy Keys

1. Open the production deployment's **Settings**.
2. Open **General**.
3. In **Deploy Keys**, click **Create Deploy Key**.
4. In **Name**, enter a memorable deployment-only label.
5. In **Expiration**, select an expiry that matches the team's rotation policy. Avoid indefinite keys unless there is an explicit owner and rotation process.
6. Select only the permissions needed by the Vercel build to deploy this Convex project.
7. Click **Create**.
8. Copy the generated key once and move directly to Step 5. Do not reveal it in a screenshot.

**Success looks like:** a deploy-key row exists by name.  
**Important:** a saved key is configuration evidence, not proof that Vercel can deploy with it.

### Step 5. Save the deploy key in Vercel

**Provider:** Vercel  
**Page:** Project → Settings → Environment Variables  
**Direct link:** `https://vercel.com/dashboard`

1. Open the Relok8 project.
2. Open **Settings**.
3. Open **Environment Variables**.
4. Click **Add Environment Variable**.
5. In **Key**, enter `CONVEX_DEPLOY_KEY`.
6. In **Value**, paste the key generated by Convex. The real value belongs only in this Vercel secret field.
7. Select **Production**. Add Preview or Development only if those environments have separate, intentionally scoped deploy keys.
8. Save the variable.
9. Click **Redeploy** from the success prompt, or open **Deployments** and redeploy the latest reviewed `main` commit.

**Success looks like:** the variable row is saved for Production and the new deployment reaches **Ready**.  
**Verification:** inspect the build log and confirm the Convex deployment command completed successfully. Do not publish logs containing environment values.

---

## Module 3 — Configure signed Resend webhooks

### Step 6. Create the webhook

**Provider:** Resend  
**Page:** Webhooks  
**Direct link:** `https://resend.com/webhooks`

1. Open **Webhooks**.
2. Click the webhook-creation control.
3. In the endpoint field, enter `{{convex_site_url}}/resend/webhook`.
4. Select `email.delivered`.
5. Select `email.bounced`.
6. Select `email.complained`.
7. Save the webhook.
8. Confirm its status is enabled and all three event types are listed.

**Success looks like:** an enabled webhook row with the correct HTTPS endpoint and three subscribed event types.  
**Verification:** this proves configuration only; Step 9 proves a real event reached the app.

### Step 7. Store the webhook signing secret

**Provider transfer:** Resend → Convex

1. In the saved Resend webhook, use the copy control next to **Signing Secret** without revealing the value for a screenshot.
2. In Convex, open **Settings → Environment Variables**.
3. Click **Add**.
4. In **Name**, enter `RESEND_WEBHOOK_SECRET`.
5. In **Value**, paste the real signing secret. Use `YOUR_RESEND_WEBHOOK_SECRET` only as an example placeholder.
6. Save it and confirm the named row exists with its value concealed.

**Success looks like:** `RESEND_WEBHOOK_SECRET` exists in the production Convex deployment.  
**Security:** if a signing secret has ever appeared unmasked in a screenshot or note, rotate it in Resend and update Convex before further testing.

---

## Module 4 — Configure account-email branding in Clerk

### Step 8. Apply global application branding

**Provider:** Clerk  
**Page:** Production instance → Application → Settings  
**Direct link:** `https://dashboard.clerk.com`

1. Confirm the instance selector says **Production**.
2. Open **Application → Settings**.
3. In **Application name**, enter `Relok8`.
4. In **Support email**, enter `{{support_email}}`.
5. Under **Branding → Logo**, click **Upload image** or **Replace image** and select `logo/png/relok8-mark.png`.
6. Under **Branding → Favicon**, click **Upload image** or **Replace image** and select `favicons/favicon-32x32.png` or `favicons/favicon.ico`.
7. Confirm both previews are sharp, centered, and not clipped.

**Success looks like:** the Relok8 mark appears in both Logo and Favicon previews and the support address is saved.  
**Evidence captured:** global logo, favicon, and support settings were saved. The screenshots must be recaptured without the application ID.

### Step 9. Understand the custom-template plan limit

**Provider:** Clerk  
**Page:** Configure → Customization → Emails

1. Open **Customization**.
2. Open **Emails**.
3. Open each active authentication template, such as the sign-up or verification link template.
4. Use Clerk's variable picker for the action URL. Never paste a fixed URL into the secure link.
5. Preview the template.
6. Save only if the production plan supports custom email templates.

**Observed result:** the production Hobby plan displayed an upgrade requirement when saving a custom template. Therefore the edited custom body is **not proven saved**. Global logo/favicon branding is saved; custom body branding remains pending unless the plan is upgraded.

**Do not do:** do not disable **Delivered by Clerk** unless a complete `email.created` webhook sender has been built and tested.

---

## Module 5 — Marketing consent and user control

### Step 10. Verify the preference centre

**Provider:** Relok8 application + Convex  
**Page:** `{{production_url}}/email-preferences` for a signed-in user

1. Sign in with a test user whose email is verified.
2. Open **Email preferences** from the account/notification interface.
3. Confirm unread-message and listing-reminder settings are separate from marketing.
4. Confirm the weekly digest cannot be enabled unless **Marketing consent** is explicitly enabled.
5. Save a digest city, room type, and optional maximum rent.
6. Reload the page and confirm the values persist.
7. Turn marketing consent off and verify the weekly digest turns off as well.

**Success looks like:** marketing starts off, requires an explicit action, records the consent source/time/version, and can be withdrawn.  
**Missing capture:** sanitized preference page before opt-in, after opt-in, and after withdrawal.

### Step 11. Verify one-click unsubscribe

1. Opt in with a dedicated test account.
2. Send a weekly digest to that account.
3. In the received email, click **Unsubscribe**.
4. Confirm the browser shows a successful unsubscribe result.
5. Return to Email preferences and confirm marketing consent and the weekly digest are off.
6. In Convex, confirm the unsubscribe timestamp was recorded.
7. Attempt another weekly digest run and confirm no marketing email is delivered.

**Success looks like:** one click disables future marketing while transactional account/workflow email remains enabled.  
**Pending:** no supplied screenshot proves this flow yet.

---

## Module 6 — Prove delivery end to end

### Step 12. Queue a controlled product-email test

**Provider:** Convex  
**Page:** Functions → `emails:queue`

1. Use a dedicated test inbox, never a real customer.
2. Open **Functions** and select `emails:queue`.
3. Enter test arguments using non-sensitive fixture data.
4. Keep scheduled delivery enabled so the normal delivery action runs.
5. Click **Run mutation**.
6. Confirm the output reports that a delivery record was created. Do not publish its delivery ID.

**Success looks like:** the mutation succeeds and a new row appears in `emailDeliveries`.

### Step 13. Check the delivery ledger

**Provider:** Convex  
**Page:** Data → `emailDeliveries`

1. Open **Data**.
2. Select `emailDeliveries`.
3. Find the test row by creation time and non-sensitive idempotency prefix.
4. Confirm `attempts` increased to `1`.
5. Confirm the initial status becomes `sent`.
6. After the webhook arrives, refresh and confirm the status becomes `delivered`.

**Success looks like:** one row progresses from created/sending to sent and then delivered.  
**Privacy:** crop or solid-mask recipient, internal IDs, provider message ID, and full idempotency key in publication captures.

### Step 14. Confirm inbox receipt

1. Open the dedicated test inbox.
2. Confirm the message appears from the intended branded sender.
3. Confirm the subject, logo, body, button, full fallback URL, reply address, and footer render correctly.
4. Open the message details and check authentication results if available.
5. Click the primary CTA and confirm it opens the intended Relok8 page.

**Success looks like:** the test inbox receives and renders the expected product email, and the CTA works.  
**Privacy:** use a disposable test alias in the replacement capture and crop the inbox account identity and unrelated mail.

### Step 15. Confirm the signed delivery webhook

**Provider:** Resend + Convex

1. Return to **Resend → Webhooks** and open the webhook.
2. Find the new `email.delivered` event.
3. Confirm **HTTP Status Code** is `200 - OK`.
4. Confirm **Attempts** is `1`.
5. In Convex, confirm the same delivery row now shows `delivered`.
6. In Convex Data, confirm a deduplicated webhook-event record exists without retaining the raw provider payload.

**Success looks like:** Resend reports a successful 200 response and Convex records `delivered`.  
**Evidence captured:** this exact happy-path test ran successfully.

---

## Module 7 — Test each automation separately

### Step 16. Welcome email after verification or Google signup

1. Create a brand-new test account with Google.
2. Complete the Clerk verification/sign-in flow.
3. Confirm the app syncs the verified account once.
4. Confirm exactly one `welcome` delivery row is created.
5. Confirm the test inbox receives the welcome message.
6. Sign out and sign in again; confirm no duplicate welcome email is created.

**Pending:** no supplied screenshot proves this trigger.

### Step 17. Unread-message summary

1. Send a message from test user A to test user B.
2. Leave it unread for more than the configured quiet period.
3. Wait for the hourly automation run at minute `:20`.
4. Confirm one `unread_message` delivery is queued, contains no private message body, and links to Messages.
5. Read the conversation and confirm a later run does not send a stale summary.

**Pending:** no trigger evidence supplied.

### Step 18. Listing-expiry reminders

1. Use a test listing with an end date seven days ahead.
2. Wait for or safely invoke the daily reminder job at `06:35 UTC` in a non-customer test context.
3. Confirm exactly one seven-day reminder.
4. Repeat with a listing one day from expiry and confirm exactly one one-day reminder.
5. Confirm expired, removed, or ineligible listings do not generate reminders.

**Pending:** no trigger evidence supplied.

### Step 19. Weekly marketing digest

1. Use a test user who has explicitly opted in and saved matching filters.
2. Use a matching available listing.
3. Wait for or safely invoke the Monday job at `07:10 UTC`.
4. Confirm exactly one `weekly_digest` email, a visible preference link, and one-click unsubscribe headers/link.
5. Repeat with a non-consented user and confirm no delivery is sent; the ledger should show suppression rather than success.

**Pending:** no digest evidence supplied.

### Step 20. Bounce, complaint, and replay safety

1. Use Resend's documented test-event mechanism; never send deliberately to an uninvolved address.
2. Generate an `email.bounced` test event and confirm the endpoint returns 200, records one event, and suppresses the test recipient.
3. Generate an `email.complained` test event and confirm the same suppression behavior.
4. Replay the same signed event and confirm it does not create a duplicate effect.
5. Attempt a later product/marketing delivery to the suppressed test address and confirm it is skipped.

**Pending:** only `email.delivered` is evidenced in the supplied captures.

---

## Troubleshooting

| Symptom | Check |
|---|---|
| Delivery action says email is unavailable | Confirm `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `SUPPORT_EMAIL` exist in the Convex **Production** deployment. |
| Resend rejects the sender | Confirm the exact sending subdomain is verified and the From address uses it. |
| Webhook returns 400/401 | Re-copy the webhook's signing secret into `RESEND_WEBHOOK_SECRET`; confirm there are no extra spaces and the endpoint is the Convex HTTP Actions URL. Rotate the secret if exposure is possible. |
| Webhook shows no event | Confirm the event types are selected, the webhook is enabled, and a real Resend delivery occurred after creation. |
| Ledger remains `sent` | Inspect sanitized Convex logs for signature or event-ID matching errors; compare timestamps without exposing payloads. |
| Welcome email duplicates | Check the idempotency key and that account synchronization runs once per verified user. |
| Weekly digest sends without a deliberate opt-in | Stop the job and verify both `marketingConsent === true` and `emailWeeklyDigest === true` are required. |
| Clerk custom email cannot save | The observed production plan requires an upgrade for custom templates. Keep global branding and default Clerk delivery, or upgrade before claiming the template is customized. |

## Launch verification checklist

- [x] Production app deployment completed successfully.
- [x] A controlled email queue mutation created a delivery.
- [x] Resend accepted and delivered the test email.
- [x] The dedicated inbox received the email.
- [x] Resend delivered-event webhook returned `200 - OK`.
- [x] Convex delivery ledger updated to `delivered`.
- [x] Clerk global logo, favicon, and support address were saved.
- [ ] Resend domain/DNS verification publication capture added.
- [ ] Google-signup welcome trigger tested once and deduplication retested.
- [ ] Unread summary trigger tested.
- [ ] Seven-day and one-day expiry reminders tested.
- [ ] Weekly digest tested for opted-in and non-consented users.
- [ ] Preference save/reload/withdrawal tested.
- [ ] One-click unsubscribe tested end to end.
- [ ] Bounce suppression tested.
- [ ] Complaint suppression tested.
- [ ] Duplicate webhook replay tested.
- [ ] Clerk custom template either saved on an eligible plan or explicitly documented as default.
- [ ] Every publishable screenshot replaced with a locally redacted, flattened, cropped copy.
