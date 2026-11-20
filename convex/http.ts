import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import { verifyEmailPreferenceToken } from './lib/emailPreferenceTokens';

const http = httpRouter();

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function hmacHex(secret: string, payload: ArrayBuffer): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, payload);
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function base64Bytes(value: string): Uint8Array {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function verifyResendSignature(request: Request, body: string): Promise<boolean> {
  const configured = process.env.RESEND_WEBHOOK_SECRET;
  if (!configured) return false;
  const eventId = request.headers.get('svix-id') || '';
  const timestamp = request.headers.get('svix-timestamp') || '';
  const signatures = request.headers.get('svix-signature') || '';
  const seconds = Number(timestamp);
  if (!eventId || !Number.isFinite(seconds) || Math.abs(Date.now() / 1000 - seconds) > 5 * 60) return false;
  let secret: Uint8Array;
  try {
    secret = base64Bytes(configured.startsWith('whsec_') ? configured.slice(6) : configured);
  } catch {
    return false;
  }
  const key = await crypto.subtle.importKey('raw', new Uint8Array(secret).buffer as ArrayBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${eventId}.${timestamp}.${body}`)));
  let expectedBinary = '';
  for (const byte of expected) expectedBinary += String.fromCharCode(byte);
  const expectedBase64 = btoa(expectedBinary);
  return signatures.split(' ').some((entry) => {
    const [version, signature] = entry.split(',');
    return version === 'v1' && Boolean(signature) && safeEqual(signature, expectedBase64);
  });
}

const verifyWebhook = httpAction(async (_ctx, request) => {
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (!verifyToken) return new Response('Webhook verification is not configured', { status: 503 });
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  if (mode !== 'subscribe' || !token || !challenge || !safeEqual(token, verifyToken)) {
    return new Response('Forbidden', { status: 403 });
  }
  return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
});

const receiveWebhook = httpAction(async (ctx, request) => {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) return new Response('Webhook signing is not configured', { status: 503 });
  const signatureHeader = request.headers.get('x-hub-signature-256') || '';
  const payload = await request.arrayBuffer();
  if (payload.byteLength > 1_000_000) return new Response('Payload too large', { status: 413 });
  const expected = `sha256=${await hmacHex(appSecret, payload)}`;
  if (!safeEqual(signatureHeader, expected)) return new Response('Invalid signature', { status: 401 });

  let body: any;
  try {
    body = JSON.parse(new TextDecoder().decode(payload));
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  for (const entry of Array.isArray(body?.entry) ? body.entry : []) {
    for (const change of Array.isArray(entry?.changes) ? entry.changes : []) {
      const value = change?.value || {};
      for (const status of Array.isArray(value.statuses) ? value.statuses : []) {
        const providerMessageId = typeof status?.id === 'string' ? status.id : undefined;
        const eventType = ['sent', 'delivered', 'read', 'failed'].includes(status?.status) ? status.status : 'unknown';
        const eventId = `status:${providerMessageId || 'unknown'}:${eventType}:${String(status?.timestamp || '')}`;
        await ctx.runMutation(internal.whatsapp.recordWebhookEvent, {
          eventId,
          eventType,
          providerMessageId,
          errorCode: status?.errors?.[0]?.code === undefined ? undefined : String(status.errors[0].code),
          errorMessage: typeof status?.errors?.[0]?.title === 'string' ? status.errors[0].title : undefined,
        });
      }
      for (const message of Array.isArray(value.messages) ? value.messages : []) {
        if (typeof message?.id !== 'string' || typeof message?.from !== 'string') continue;
        await ctx.runMutation(internal.whatsapp.recordWebhookEvent, {
          eventId: `message:${message.id}`,
          eventType: 'inbound_message',
          phoneE164: `+${message.from.replace(/^\+/, '')}`,
          text: typeof message?.text?.body === 'string' ? message.text.body.slice(0, 100) : undefined,
        });
      }
    }
  }

  return new Response('EVENT_RECEIVED', { status: 200 });
});

http.route({ path: '/whatsapp/webhook', method: 'GET', handler: verifyWebhook });
http.route({ path: '/whatsapp/webhook', method: 'POST', handler: receiveWebhook });

const receiveResendWebhook = httpAction(async (ctx, request) => {
  const body = await request.text();
  if (body.length > 1_000_000) return new Response('Payload too large', { status: 413 });
  if (!await verifyResendSignature(request, body)) return new Response('Invalid signature', { status: 401 });
  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }
  const eventId = request.headers.get('svix-id');
  const eventType = typeof event?.type === 'string' ? event.type : '';
  const providerMessageId = typeof event?.data?.email_id === 'string' ? event.data.email_id : undefined;
  const recipient = Array.isArray(event?.data?.to) && typeof event.data.to[0] === 'string' ? event.data.to[0] : undefined;
  if (!eventId || !eventType) return new Response('Invalid event', { status: 400 });
  await ctx.runMutation((internal as any).emailWebhooks.recordResendEvent, {
    eventId,
    eventType,
    providerMessageId,
    recipient,
  });
  return new Response('OK', { status: 200 });
});

const emailUnsubscribeGet = httpAction(async (_ctx, request) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  try {
    const payload = await verifyEmailPreferenceToken(token);
    const prefix = 'https://relok8.online/email-preferences';
    return Response.redirect(`${prefix}?token=${encodeURIComponent(token)}&email=${encodeURIComponent(payload.email)}`, 303);
  } catch {
    return new Response('This email preference link is invalid or has expired.', { status: 400 });
  }
});

const emailUnsubscribePost = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  try {
    const payload = await verifyEmailPreferenceToken(token);
    await ctx.runMutation((internal as any).emailPreferences.updateByTokenInternal, {
      userId: payload.userId,
      email: payload.email,
      marketingConsent: false,
      weeklyDigest: false,
      source: 'one_click_unsubscribe',
    });
    return new Response('Unsubscribed', { status: 200 });
  } catch {
    return new Response('Invalid or expired unsubscribe link', { status: 400 });
  }
});

http.route({ path: '/resend/webhook', method: 'POST', handler: receiveResendWebhook });
http.route({ path: '/email/unsubscribe', method: 'GET', handler: emailUnsubscribeGet });
http.route({ path: '/email/unsubscribe', method: 'POST', handler: emailUnsubscribePost });

export default http;
