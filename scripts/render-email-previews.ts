import { mkdir, writeFile } from 'node:fs/promises';
import { EMAIL_TEMPLATE_KINDS, renderRelok8Email, type EmailTemplateKind } from '../src/emails/templates';

const outputDirectory = new URL('../email-previews/', import.meta.url);
await mkdir(outputDirectory, { recursive: true });

const titles: Record<EmailTemplateKind, string> = {
  account_verification: 'Account verification',
  sign_in_code: 'Sign-in code',
  password_reset: 'Password reset',
  welcome: 'Welcome',
  landlord_invitation: 'Landlord invitation',
  takeover_request: 'New takeover request',
  takeover_approved: 'Takeover approved',
  takeover_declined: 'Takeover declined',
  handover_action: 'Handover action required',
  handover_complete: 'Handover complete',
  unread_message: 'Unread message summary',
  listing_published: 'Listing published',
  listing_expiry: 'Listing expiry reminder',
  support_received: 'Support receipt',
  weekly_digest: 'Weekly apartment digest',
};

for (const locale of ['en', 'pl'] as const) {
  for (const kind of EMAIL_TEMPLATE_KINDS) {
    const email = renderRelok8Email(kind, locale, {
      recipientName: locale === 'pl' ? 'Marta' : 'Marta',
      ctaUrl: 'https://relok8.online/my-place',
      preferencesUrl: 'https://relok8.online/notifications',
      unsubscribeUrl: 'https://relok8.online/notifications?unsubscribe=email',
    });
    const previewHtml = email.html
      .replaceAll(
        'https://relok8.online/email/relok8-email-logo.png',
        '../public/email/relok8-email-logo.png',
      )
      .replaceAll('https://relok8.online/images/', '../public/images/');

    await writeFile(new URL(`${kind}-${locale}.html`, outputDirectory), previewHtml);
  }
}

const cards = EMAIL_TEMPLATE_KINDS.map((kind, index) => {
  const email = renderRelok8Email(kind, 'en', { recipientName: 'Marta', ctaUrl: 'https://relok8.online/my-place' });
  return `<article class="card" data-kind="${kind}">
    <div class="meta"><span>${String(index + 1).padStart(2, '0')}</span><span>${email.category}</span></div>
    <h2>${titles[kind]}</h2>
    <p>${email.subject}</p>
    <div class="actions"><a href="./${kind}-en.html">English</a><a href="./${kind}-pl.html">Polski</a></div>
  </article>`;
}).join('');

const gallery = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Relok8 email system</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f4f5f7;color:#0f172a;font-family:Inter,Arial,sans-serif}.wrap{max-width:1180px;margin:auto;padding:64px 28px 90px}.brand{width:124px}.kicker{margin-top:70px;color:#4f46e5;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.hero{display:grid;grid-template-columns:1.5fr .7fr;gap:80px;align-items:end;margin-top:16px;padding-bottom:44px;border-bottom:1px solid #d5d9e0}.hero h1{font-size:56px;line-height:1.02;letter-spacing:-.045em;margin:0;max-width:760px}.hero p{color:#5b6678;font-size:16px;line-height:1.65;margin:0}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:#dfe3e8;border:1px solid #dfe3e8;margin-top:42px}.card{min-height:250px;background:#fff;padding:27px;display:flex;flex-direction:column}.meta{display:flex;justify-content:space-between;color:#8a94a6;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.card h2{font-size:22px;line-height:1.2;margin:54px 0 10px;letter-spacing:-.025em}.card p{font-size:13px;line-height:1.55;color:#5b6678;margin:0}.actions{display:flex;gap:8px;margin-top:auto;padding-top:26px}.actions a{border:1px solid #d5d9e0;border-radius:9px;color:#3428b8;text-decoration:none;font-size:12px;font-weight:700;padding:9px 12px}.actions a:first-child{background:#4f46e5;border-color:#4f46e5;color:#fff}@media(max-width:850px){.hero{grid-template-columns:1fr;gap:24px}.hero h1{font-size:42px}.grid{grid-template-columns:1fr 1fr}}@media(max-width:560px){.wrap{padding:36px 16px 60px}.hero h1{font-size:36px}.grid{grid-template-columns:1fr}.kicker{margin-top:48px}}
</style></head><body><main class="wrap"><img class="brand" src="../public/email/relok8-email-logo.png" alt="Relok8"><div class="kicker">Production email system · v1</div><section class="hero"><h1>Useful, calm emails for every step of the move.</h1><p>15 responsive templates. English and Polish. Designed around Relok8’s real account, discovery, takeover, handover, listing, and support flows.</p></section><section class="grid">${cards}</section></main></body></html>`;

await writeFile(new URL('index.html', outputDirectory), gallery);

