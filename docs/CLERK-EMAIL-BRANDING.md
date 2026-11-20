# Relok8 Clerk email branding

Clerk remains the sender for identity emails (verification, sign-in codes, and password recovery). Resend sends product, transactional, and consented marketing messages.

## Brand settings

- Application name: `Relok8`
- Primary color: `#4F46E5`
- Text color: `#0F172A`
- Muted text: `#5B6678`
- Background: `#F5F6F8`
- Logo: `https://relok8.online/email/relok8-email-logo.png`
- Support address: `support@relok8.online`
- Home URL: `https://relok8.online`

In Clerk Dashboard, open **Customization → Emails**. Apply the logo, colors, sender name, and footer globally. For each template, insert Clerk's code or action-link variable using the dashboard variable picker; do not replace it with a hard-coded value.

## Verification code

Subject: `Verify your Relok8 email`

Preheader: `Use your one-time code to finish creating your Relok8 account.`

Heading: `Confirm it’s really you`

Body:

> Use the one-time code below to verify your email and finish creating your Relok8 account. The code expires shortly and can be used only once.

Security note:

> If you did not create a Relok8 account, you can safely ignore this message. Never share this code with another person.

## Sign-in code

Subject: `Your Relok8 sign-in code`

Preheader: `Use this one-time code to sign in securely.`

Heading: `Your sign-in code`

Body:

> Enter the one-time code below on the Relok8 sign-in screen. The code expires shortly and can be used only once.

Security note:

> If you did not request this code, you can safely ignore this message. Your password and account remain unchanged.

## Password reset

Subject: `Reset your Relok8 password`

Preheader: `A password reset was requested for your account.`

Heading: `Choose a new password`

Body:

> We received a request to reset your Relok8 password. Use the secure action below to choose a new password.

Button label: `Reset password`

Security note:

> If you did not request a reset, ignore this email and review your active sessions in Relok8 account settings.

## Footer

> Relok8 helps people coordinate peer-to-peer lease takeovers in Poland. Relok8 does not approve contracts, verify signatures, or hold deposits. Need help? support@relok8.online

Do not add marketing copy or an unsubscribe link to Clerk identity emails. They are strictly necessary security messages.
