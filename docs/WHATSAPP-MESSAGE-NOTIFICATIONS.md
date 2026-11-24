# WhatsApp message notifications

Relok8 can queue privacy-safe WhatsApp notifications when an authorized participant has not opened a new message after two minutes. This is separate from the daily apartment digest and is disabled until the user explicitly selects **New messages** in Notifications.

The WhatsApp notification contains only:

- the sender's profile name;
- the listing title;
- a secure link to the authenticated Relok8 thread.

It never contains the private message body, email address, phone number, exact listing address, or authentication token. Multiple messages in one unread cycle produce one notification. Opening the thread resets the cycle.

## Meta template setup

Create two Utility templates in WhatsApp Manager. Meta controls the final category and approval.

English template name: `relok8_new_message_en`

```text
Hi {{1}}, {{2}} sent you a new message about {{3}}. Open the private conversation in Relok8: {{4}}
```

Polish template name: `relok8_new_message_pl`

```text
Cześć {{1}}, {{2}} wysłał(a) Ci nową wiadomość dotyczącą {{3}}. Otwórz prywatną rozmowę w Relok8: {{4}}
```

Use safe sample values during Meta review; never use real user data or a real private thread URL in the sample.

## Convex production environment variables

After Meta approves both templates, add these values in Convex Dashboard → Production → Settings → Environment Variables:

- `WHATSAPP_ACCESS_TOKEN`: a Meta system-user access token stored only as a secret.
- `WHATSAPP_PHONE_NUMBER_ID`: the WhatsApp Business phone number ID from Meta.
- `WHATSAPP_GRAPH_VERSION`: a supported Graph API version such as `v24.0`; confirm the current supported version in Meta documentation.
- `WHATSAPP_MESSAGE_TEMPLATE_EN`: `relok8_new_message_en`
- `WHATSAPP_MESSAGE_TEMPLATE_PL`: `relok8_new_message_pl`
- `PUBLIC_APP_URL`: `https://relok8.online`

The daily digest continues to use `WHATSAPP_DAILY_TEMPLATE_EN` and `WHATSAPP_DAILY_TEMPLATE_PL`.

Do not paste tokens into chat, source code, screenshots, documentation, or JSON. If a token appears in any of those places, revoke and replace it.

## Verification

1. In a test account, open Notifications and enable **New messages**, enter a WhatsApp number, accept the consent text, and save.
2. From a second isolated account, send a message about a listing.
3. Leave the recipient's thread unread for at least two minutes.
4. In Convex Data → `whatsappDeliveries`, confirm one `new_message` row appears.
5. Confirm its status advances from `queued` to `sent`, then `delivered` after Meta's signed webhook arrives.
6. Confirm the WhatsApp message names the sender and listing, links to the correct authenticated thread, and does not contain the private message body.
7. Send two more messages without opening the thread and confirm no second delivery is created.
8. Open the thread, send another message from the second account, wait two minutes, and confirm a new delivery is created for the new unread cycle.

If the row fails with `CONFIGURATION_MISSING`, the code is deployed but one or more Meta/Convex variables or approved template names are missing. A saved setting is configuration evidence; a `delivered` webhook plus receipt on the test phone is the end-to-end result.
