# Relok8 email system

Relok8 is WhatsApp-first for daily apartment discovery. Email should handle account access, high-trust lease-takeover events, support, and optional summaries. It should not duplicate every in-app or WhatsApp notification.

## Production automation status

The application now queues welcome, unread-message, listing-expiry, consented listing-invitation, and consented weekly-digest emails through the durable `emailDeliveries` ledger.

- Hourly at `:20`: unread-message summaries after a 30-minute wait
- Daily at `06:35 UTC`: listing reminders seven days and one day before lease end
- Daily at `09:40 UTC`: listing invitations for verified, opted-in members with no listing (day 3 and day 10 only)
- Monday at `07:10 UTC`: consented weekly property digest
- Preference center: `/email-preferences?token=...`
- RFC 8058 endpoint: `/email/unsubscribe?token=...` on the Convex site
- Resend event endpoint: `https://modest-anteater-459.convex.site/resend/webhook`

Recommended production environment variables:

- `EMAIL_PREFERENCES_SECRET`: at least 32 random bytes. Until configured, signed preference links use the production-only Resend key as a temporary fallback.
- `RESEND_WEBHOOK_SECRET`: the signing secret shown when the Resend webhook is created.

In Resend, subscribe the webhook to `email.delivered`, `email.bounced`, and `email.complained`. The endpoint verifies Svix signatures and timestamps, deduplicates events, updates `emailDeliveries`, and suppresses complained or bounced addresses without retaining raw provider payloads.

## 1. Addresses to create

### Human mailboxes on `relok8.online`

| Address | Purpose | Setup |
| --- | --- | --- |
| `info@relok8.online` | General enquiries and the public address already shown in the app | Shared inbox; keep for continuity |
| `support@relok8.online` | Account, listing, and takeover support | Shared inbox with at least two owners before launch |
| `privacy@relok8.online` | GDPR requests, consent, export, and deletion | Alias or restricted shared inbox |
| `security@relok8.online` | Vulnerability and account-security reports | Restricted shared inbox |

`legal@`, `billing@`, `landlords@`, and city-specific addresses are not needed yet. Add them only when a real team or workflow owns them. Forwarding an unused address creates the appearance of support without a reliable response process.

### Automated senders

Use separate sending subdomains so product mail cannot damage the reputation of the human inbox domain.

| Sender | Owner | Use |
| --- | --- | --- |
| `Relok8 <updates@send.relok8.online>` | Resend | Takeover, message, listing, and support emails |
| `Relok8 Account <account@auth.relok8.online>` | Clerk | Verification, sign-in, and password recovery |

Set `Reply-To: support@relok8.online` on product emails. Do not use a `no-reply@` address; replies should reach a monitored inbox.

## 2. Which emails Relok8 needs

### Launch-critical

1. **Clerk verification and password recovery** — account security; configured in Clerk, not Convex.
2. **Landlord invitation** — a departing tenant invites the landlord to the private handover workspace.
3. **New takeover request** — alerts the current tenant and connected landlord that a prospect applied.
4. **Takeover decision** — approved, declined, withdrawn, or cancelled; sends a clear status without implying payment or legal completion.
5. **Handover action required** — documents, deposit arrangement, or keys were updated and another participant must review.
6. **Handover completed** — all participants recorded completion; carefully states that Relok8 records participant confirmations and is not independently certifying the transaction.
7. **Support receipt** — confirms that a signed-in user’s support request reached Relok8.

### Add after launch

8. **Unread message summary** — one email after 10–15 quiet minutes, with no private message body in the email.
9. **Listing expiry reminder** — seven days and one day before the lease/listing becomes unavailable.
10. **Weekly saved-search digest** — optional marketing email for people who explicitly opt in. WhatsApp remains the daily channel.
11. **Welcome to Relok8** — a single onboarding email after verification, tailored to finding a room or leaving a lease.
12. **Invitation to list a place** — no more than two marketing messages, on day 3 and day 10, only for verified members who explicitly consented and still have no listing.

Do not send an email for every chat message, saved listing, page visit, Onlo response, or WhatsApp delivery. Relok8 does not currently support payments or escrow, so it must not send payment-received, deposit-held, refund, or payout emails.

## 3. Delivery ownership

| Email | System of record | Category | Can unsubscribe? |
| --- | --- | --- | --- |
| Verify email, sign in, reset password | Clerk | Security | No; controlled by account action |
| Invitation, request, decision, handover | Convex + Resend | Transactional | No; required for an active workflow |
| Support receipt | Convex + Resend | Transactional | No |
| Unread summary, expiry reminder | Convex + Resend | Product notification | Yes, through notification settings |
| Weekly digest, invitation to list | Convex + Resend | Marketing | Yes, one click; explicit opt-in required |

Transactional does not mean unlimited. Each email needs an idempotency key, a delivery record, retry limits, and a link to the exact Relok8 screen. Marketing consent must never be inferred from creating an account, saving a room, or accepting WhatsApp alerts.

### Listing-invitation rules

- Eligibility: verified account, deliverable email address, explicit Relok8 marketing consent, and no listing owned by that user.
- Timing: first message once the account is at least 3 days old; one follow-up once it is at least 10 days old.
- Stop conditions: a listing is published, marketing consent is withdrawn, the user unsubscribes, or Resend reports a bounce or complaint.
- Honest product boundaries: publishing is free; a listing can contain up to 8 photos, remains public only while the lease is current, and can be paused. These are real operating limits, not simulated scarcity.
- Visibility claim: public listings show the supplied name, full street address, avatar, and map position. Account IDs and direct landlord phone/email details remain hidden and available only in authorized workflows.

## 4. Shared design system

- Canvas: `#F6F8FC`
- Email card: `#FFFFFF`
- Primary text: `#101828`
- Secondary text: `#5D6B82`
- Relok8 violet: `#5138EE`
- Success: `#067647`
- Warning: `#B54708`
- Border: `#DCE3EE`
- Maximum content width: `600px`
- Logo as an externally hosted PNG with descriptive alt text; the word “Relok8” must remain visible as text if images are blocked.
- One primary button, followed by the full text URL as a fallback.
- Use table-based email HTML, inline styles, system fonts, and a plain-text alternative.
- Do not put private chat messages, landlord phone numbers, exact home addresses, access tokens, or legal documents in email.
- Footer: why the recipient received the message, `support@relok8.online`, privacy link, company identity, and preferences/unsubscribe link where applicable.

Recommended subject rules:

- Put the action first: `Review a takeover request for {{listing_title}}`
- Avoid urgency unless a real deadline exists.
- Never say “verified”, “secured”, “guaranteed”, “approved by Relok8”, or “deposit protected” unless the product can prove that exact claim.
- Keep subjects under about 55 characters when possible.

## 5. Bilingual templates

The variables below are the complete allow-list. Escape all user-supplied values before inserting them into HTML. URLs must use `https://relok8.online` and be generated server-side.

### A. Landlord invitation

**Trigger:** departing tenant creates a landlord invitation.  
**To:** invited verified email address.  
**Deduplication key:** `landlord-invitation:{invitation_id}`.  
**Expires:** seven days.

**English subject**

```text
Join the handover for {{listing_title}}
```

**English body**

```text
Hello,

{{tenant_name}} invited you to review the lease-takeover process for {{listing_title}} in {{city}}.

Relok8 gives the current tenant, prospective tenant, and landlord one private place to record decisions and coordinate the handover. Relok8 does not approve the lease transfer or handle the deposit.

[Review invitation]

This invitation expires on {{expiry_date}} and only works with {{invited_email}}. If you were not expecting it, you can ignore this email or contact support@relok8.online.
```

**Polish subject**

```text
Dołącz do procesu cesji: {{listing_title}}
```

**Polish body**

```text
Dzień dobry,

{{tenant_name}} zaprasza Cię do sprawdzenia procesu cesji najmu dla {{listing_title}} w {{city}}.

Relok8 zapewnia obecnemu najemcy, kandydatowi i wynajmującemu jedno prywatne miejsce do rejestrowania decyzji i koordynowania przekazania. Relok8 nie zatwierdza cesji ani nie obsługuje kaucji.

[Sprawdź zaproszenie]

Zaproszenie wygasa {{expiry_date}} i działa wyłącznie dla adresu {{invited_email}}. Jeśli nie oczekujesz tej wiadomości, zignoruj ją lub napisz na support@relok8.online.
```

### B. New takeover request

**Trigger:** prospect submits `workflow.request`.  
**To:** current tenant and connected landlord; one delivery per recipient.  
**Deduplication key:** `takeover-request:{application_id}:{recipient_id}`.

**English subject**

```text
Review a takeover request for {{listing_title}}
```

**English body**

```text
Hello {{recipient_name}},

{{applicant_name}} sent a takeover request for {{listing_title}} in {{city}}.

Open My Place to review the proposed timing, ask questions, and record a decision. The request expires on {{expiry_date}} if no decision is recorded.

[Review request]

No payment has been taken by Relok8. Confirm the applicant, contract terms, landlord consent, and deposit arrangements directly with the participants.
```

**Polish subject**

```text
Sprawdź wniosek o cesję: {{listing_title}}
```

**Polish body**

```text
Cześć {{recipient_name}},

{{applicant_name}} przesłał(a) wniosek o przejęcie najmu dla {{listing_title}} w {{city}}.

Otwórz Moje Miejsce, aby sprawdzić proponowany termin, zadać pytania i zarejestrować decyzję. Wniosek wygasa {{expiry_date}}, jeśli nie zostanie podjęta decyzja.

[Sprawdź wniosek]

Relok8 nie pobrał żadnej płatności. Potwierdź uczestników, warunki umowy, zgodę wynajmującego i ustalenia dotyczące kaucji bezpośrednio z uczestnikami.
```

### C. Takeover decision

**Trigger:** application becomes approved, declined, withdrawn, or cancelled.  
**To:** affected participants.  
**Deduplication key:** `takeover-decision:{application_id}:{status}:{recipient_id}`.

**English subject**

```text
Takeover request {{status_label}} · {{listing_title}}
```

**English body**

```text
Hello {{recipient_name}},

The takeover request for {{listing_title}} is now {{status_label}}.

{{decision_note}}

[View status and next steps]

An approved request means the participants can continue coordinating documents, the deposit arrangement, and key handover. It does not mean that Relok8 has approved the contract or received money.
```

**Polish subject**

```text
Wniosek o cesję: {{status_label}} · {{listing_title}}
```

**Polish body**

```text
Cześć {{recipient_name}},

Wniosek o cesję dla {{listing_title}} ma teraz status: {{status_label}}.

{{decision_note}}

[Zobacz status i kolejne kroki]

Zatwierdzony wniosek oznacza, że uczestnicy mogą dalej koordynować dokumenty, ustalenia dotyczące kaucji i przekazanie kluczy. Nie oznacza to zatwierdzenia umowy ani otrzymania środków przez Relok8.
```

### D. Handover action required

**Trigger:** a participant updates documents, deposit arrangement, or keys.  
**To:** other participants who have not confirmed the current step.  
**Deduplication key:** `handover-step:{application_id}:{step}:{version}:{recipient_id}`.

**English subject**

```text
Action needed for {{listing_title}}
```

**English body**

```text
Hello {{recipient_name}},

{{actor_name}} updated the {{step_label}} step for {{listing_title}}.

Review the update in My Place. Only confirm a step after checking it directly with the other participants.

[Review handover]

Relok8 records participant confirmations but does not hold funds, validate signatures, or certify legal completion.
```

**Polish subject**

```text
Wymagane działanie: {{listing_title}}
```

**Polish body**

```text
Cześć {{recipient_name}},

{{actor_name}} zaktualizował(a) etap „{{step_label}}” dla {{listing_title}}.

Sprawdź aktualizację w Moim Miejscu. Potwierdź etap dopiero po bezpośrednim sprawdzeniu go z pozostałymi uczestnikami.

[Sprawdź przekazanie]

Relok8 rejestruje potwierdzenia uczestników, ale nie przechowuje środków, nie weryfikuje podpisów ani nie poświadcza prawnego zakończenia procesu.
```

### E. Handover completed

**Trigger:** all three roles confirm documents, deposit arrangement, and keys.  
**To:** all participants.  
**Deduplication key:** `handover-complete:{application_id}:{recipient_id}`.

**English subject**

```text
Handover recorded for {{listing_title}}
```

**English body**

```text
Hello {{recipient_name}},

All participants have recorded the handover steps as complete for {{listing_title}}.

[View handover record]

Keep your signed documents and payment evidence in a secure place. Relok8 records the status reported by participants; it does not independently certify the lease transfer, signatures, deposit, or key exchange.
```

**Polish subject**

```text
Zarejestrowano przekazanie: {{listing_title}}
```

**Polish body**

```text
Cześć {{recipient_name}},

Wszyscy uczestnicy oznaczyli etapy przekazania jako zakończone dla {{listing_title}}.

[Zobacz zapis przekazania]

Przechowuj podpisane dokumenty i dowody płatności w bezpiecznym miejscu. Relok8 rejestruje status zgłoszony przez uczestników; nie poświadcza niezależnie cesji, podpisów, kaucji ani przekazania kluczy.
```

### F. Unread message summary

**Trigger:** recipient has unread messages after a 10–15 minute quiet period; send at most one per thread per four hours.  
**To:** participant with unread messages.  
**Privacy:** never include message text.

**English subject**

```text
New message about {{listing_title}}
```

**English body**

```text
Hello {{recipient_name}},

You have {{message_count}} unread {{message_word}} in the conversation about {{listing_title}}.

[Open Messages]

For privacy, the message content is available only after you sign in to Relok8.
```

**Polish subject**

```text
Nowa wiadomość: {{listing_title}}
```

**Polish body**

```text
Cześć {{recipient_name}},

Masz {{message_count}} {{message_word}} w rozmowie dotyczącej {{listing_title}}.

[Otwórz Wiadomości]

Ze względu na prywatność treść wiadomości jest dostępna dopiero po zalogowaniu do Relok8.
```

### G. Listing expiry reminder

**Trigger:** seven days and one day before `leaseEndDate`; only for an active listing.  
**To:** listing owner.  
**Deduplication key:** `listing-expiry:{listing_id}:{days_remaining}`.

**English subject**

```text
Update your Relok8 listing before {{expiry_date}}
```

**English body**

```text
Hello {{owner_name}},

{{listing_title}} reaches its current lease end date in {{days_remaining}} {{day_word}}.

Update the dates if the listing is still available, or pause it so people do not apply to an outdated offer.

[Review listing]
```

**Polish subject**

```text
Zaktualizuj ogłoszenie przed {{expiry_date}}
```

**Polish body**

```text
Cześć {{owner_name}},

Dla {{listing_title}} pozostało {{days_remaining}} {{day_word}} do obecnej daty zakończenia najmu.

Zaktualizuj daty, jeśli oferta jest nadal aktualna, albo wstrzymaj ją, aby nikt nie zgłaszał się do nieaktualnego ogłoszenia.

[Sprawdź ogłoszenie]
```

### H. Support receipt

**Trigger:** the existing authenticated support action is accepted by Resend.  
**To:** requesting user.  
**Deduplication key:** `support-receipt:{support_request_id}`.

**English subject**

```text
We received your Relok8 support request
```

**English body**

```text
Hello {{name}},

We received your request about “{{subject}}”. Your reference is {{reference}}.

Our team will reply to this email address. Do not send identity documents, complete contracts, access codes, or payment-card details by email.

If you need to add context, reply to this message and keep the reference in the subject.
```

**Polish subject**

```text
Otrzymaliśmy Twoje zgłoszenie do Relok8
```

**Polish body**

```text
Cześć {{name}},

Otrzymaliśmy zgłoszenie „{{subject}}”. Numer referencyjny: {{reference}}.

Nasz zespół odpowie na ten adres e-mail. Nie wysyłaj e-mailem dokumentów tożsamości, pełnych umów, kodów dostępu ani danych karty płatniczej.

Jeśli chcesz dodać informacje, odpowiedz na tę wiadomość i pozostaw numer referencyjny w temacie.
```

### I. Weekly apartment digest (optional marketing)

**Trigger:** weekly, only after explicit email-marketing consent.  
**To:** active email subscriber.  
**Deduplication key:** `weekly-digest:{subscription_id}:{warsaw_week}`.  
**Required headers:** `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click`.

**English subject**

```text
{{match_count}} new Relok8 matches this week
```

**English body**

```text
Hello {{name}},

Here are new rooms matching {{filter_summary}}.

{{listing_cards}}

[See all matches]

Availability, identity, contract terms, landlord consent, and deposit arrangements must be confirmed directly with the participants.

You received this because you opted in to weekly email matches. [Manage preferences] · [Unsubscribe]
```

**Polish subject**

```text
{{match_count}} nowych ofert Relok8 w tym tygodniu
```

**Polish body**

```text
Cześć {{name}},

Oto nowe pokoje pasujące do: {{filter_summary}}.

{{listing_cards}}

[Zobacz wszystkie oferty]

Dostępność, tożsamość, warunki umowy, zgodę wynajmującego i ustalenia dotyczące kaucji należy potwierdzić bezpośrednio z uczestnikami.

Otrzymujesz tę wiadomość, ponieważ wyraziłeś(-aś) zgodę na cotygodniowe oferty e-mail. [Zarządzaj ustawieniami] · [Wypisz się]
```

## 6. Provider setup

### Human inboxes

Use Google Workspace, Microsoft 365, or Zoho Mail for the four human addresses. Google Workspace is the simplest default for shared inbox ownership and account recovery; Zoho is the lower-cost option. Whichever provider is selected:

1. Add and verify `relok8.online`.
2. Add the provider’s exact MX records.
3. Create `info@` and `support@` as shared inboxes.
4. Create `privacy@` and `security@` with restricted membership.
5. Enable MFA for every mailbox owner.
6. Add a recovery owner who is not dependent on the same mailbox.

### Resend

1. In Resend, add `send.relok8.online` as a sending domain.
2. Add the SPF and DKIM records exactly as generated by Resend. Do not copy example keys from documentation.
3. Set a custom return-path/bounce subdomain if Resend offers it for the account.
4. Verify the domain, then create a production API key restricted to sending.
5. Store the key only in Convex production environment variables.
6. Use `Relok8 <updates@send.relok8.online>` as the sender and `support@relok8.online` as Reply-To.

Current Relok8 environment variable names:

```bash
npx convex env set RESEND_API_KEY '<production-resend-key>'
npx convex env set RESEND_FROM_EMAIL 'Relok8 <updates@send.relok8.online>'
npx convex env set SUPPORT_EMAIL 'support@relok8.online'
npx convex env set PUBLIC_APP_URL 'https://relok8.online'
```

Never put `RESEND_API_KEY` in a `VITE_` variable, Vercel browser environment, Git, screenshots, or chat.

### Clerk

1. Add and verify `auth.relok8.online` in Clerk’s email configuration.
2. Set the sender to `Relok8 Account <account@auth.relok8.online>`.
3. Customize Clerk’s verification, sign-in-code, and password-recovery templates in English and Polish.
4. Keep the one-time code or secure link as the only primary action.
5. Add `security@relok8.online` to the security/help copy.

Clerk, not Convex, should own verification codes, sign-in links, session alerts, and password recovery.

## 7. DNS and reputation

Create DMARC for the root domain after SPF/DKIM are aligned. Start in monitoring mode, inspect reports, then tighten the policy.

```text
Host: _dmarc.relok8.online
Type: TXT
Value: v=DMARC1; p=none; rua=mailto:security@relok8.online; adkim=s; aspf=s; pct=100
```

After at least two weeks of clean aligned traffic, move to `p=quarantine`; later consider `p=reject`. Confirm that the inbox provider, Clerk, and Resend all pass alignment before tightening the policy.

Also:

- Do not warm the domain with purchased lists.
- Send only to verified account addresses or explicit subscribers.
- Suppress hard bounces and complaints immediately.
- Keep marketing and transactional preferences separate.
- Set daily and per-recipient rate limits.
- Configure Resend webhooks for delivered, bounced, complained, and suppressed events and verify webhook signatures before updating records.

## 8. Convex implementation requirements

Before enabling product email in the UI, add:

1. `emailPreferences`: user, verified email, locale, product-summary preferences, marketing consent version/time/source, and unsubscribe time.
2. `emailDeliveries`: idempotency key, recipient, template, category, related listing/application/thread, status, attempts, provider ID, sanitized error, and timestamps.
3. A server-only template renderer that HTML-escapes every variable and produces both HTML and plain text.
4. A queue mutation that creates a unique delivery record inside the same logical workflow event.
5. A Resend internal action with capped retries and no fabricated success.
6. A signed Resend webhook for delivery, bounce, complaint, and suppression state.
7. A signed one-click unsubscribe endpoint for marketing messages.
8. A preferences UI that distinguishes transactional workflow mail, product summaries, marketing email, and WhatsApp.

Recommended retry schedule: one minute, five minutes, and thirty minutes for transient provider or network failures. Do not retry invalid recipients, rejected senders, complaints, hard bounces, or missing configuration.

## 9. Launch checklist

- [ ] Human mail provider selected and domain ownership protected with MFA.
- [ ] `info@`, `support@`, `privacy@`, and `security@` monitored by named owners.
- [ ] `send.relok8.online` verified in Resend.
- [ ] `auth.relok8.online` verified in Clerk.
- [ ] SPF, DKIM, and DMARC alignment tested.
- [ ] English and Polish copies reviewed by a native speaker.
- [ ] Privacy policy explains transactional email, optional marketing, Resend, retention, and opt-out.
- [ ] Every CTA tested after sign-out, with the intended Clerk return URL.
- [ ] Duplicate event, retry, bounce, complaint, and one-click-unsubscribe tests pass.
- [ ] Gmail, Outlook, Apple Mail, and mobile rendering checked with images disabled.
- [ ] No email claims that Relok8 holds deposits, verifies identities, certifies contracts, or guarantees listings.

