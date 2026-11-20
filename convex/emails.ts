import { internalAction, internalMutation, internalQuery } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import {
  renderRelok8Email,
  type EmailLocale,
  type EmailTemplateData,
  type EmailTemplateKind,
  type RenderedEmail,
} from '../src/emails/templates';

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [60_000, 5 * 60_000] as const;

const emailTemplate = v.union(
  v.literal('account_verification'),
  v.literal('sign_in_code'),
  v.literal('password_reset'),
  v.literal('welcome'),
  v.literal('landlord_invitation'),
  v.literal('takeover_request'),
  v.literal('takeover_approved'),
  v.literal('takeover_declined'),
  v.literal('handover_action'),
  v.literal('handover_complete'),
  v.literal('unread_message'),
  v.literal('listing_published'),
  v.literal('listing_expiry'),
  v.literal('support_received'),
  v.literal('weekly_digest'),
);

const categoryByTemplate: Record<EmailTemplateKind, RenderedEmail['category']> = {
  account_verification: 'security',
  sign_in_code: 'security',
  password_reset: 'security',
  welcome: 'product',
  landlord_invitation: 'transactional',
  takeover_request: 'transactional',
  takeover_approved: 'transactional',
  takeover_declined: 'transactional',
  handover_action: 'transactional',
  handover_complete: 'transactional',
  unread_message: 'product',
  listing_published: 'product',
  listing_expiry: 'product',
  support_received: 'transactional',
  weekly_digest: 'marketing',
};

function normalizeEmail(value: string): string {
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Invalid email recipient');
  }
  return email;
}

function cleanIdempotencyKey(value: string): string {
  const key = value.trim();
  if (!key || key.length > 256 || !/^[A-Za-z0-9:_./-]+$/.test(key)) {
    throw new Error('Invalid email idempotency key');
  }
  return key;
}

function cleanTemplateData(value: unknown): EmailTemplateData {
  if (value === undefined || value === null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid email template data');
  const serialized = JSON.stringify(value);
  if (serialized.length > 20_000) throw new Error('Email template data is too large');
  return JSON.parse(serialized) as EmailTemplateData;
}

export const queue = internalMutation({
  args: {
    idempotencyKey: v.string(),
    userId: v.optional(v.string()),
    recipient: v.string(),
    template: emailTemplate,
    locale: v.union(v.literal('en'), v.literal('pl')),
    templateData: v.optional(v.any()),
    relatedId: v.optional(v.string()),
    scheduleDelivery: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const idempotencyKey = cleanIdempotencyKey(args.idempotencyKey);
    const existing = await ctx.db
      .query('emailDeliveries')
      .withIndex('by_idempotency', (q) => q.eq('idempotencyKey', idempotencyKey))
      .unique();
    if (existing) return { deliveryId: existing._id, created: false };

    const now = Date.now();
    const deliveryId = await ctx.db.insert('emailDeliveries', {
      idempotencyKey,
      userId: args.userId,
      recipient: normalizeEmail(args.recipient),
      template: args.template,
      locale: args.locale,
      category: categoryByTemplate[args.template],
      templateData: cleanTemplateData(args.templateData),
      relatedId: args.relatedId?.slice(0, 500),
      status: 'queued',
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    });
    if (args.scheduleDelivery !== false) {
      await ctx.scheduler.runAfter(0, internal.emails.deliver, { deliveryId });
    }
    return { deliveryId, created: true };
  },
});

export const getDeliveryContext = internalQuery({
  args: { deliveryId: v.id('emailDeliveries') },
  handler: async (ctx, args) => ctx.db.get(args.deliveryId),
});

export const markSending = internalMutation({
  args: { deliveryId: v.id('emailDeliveries') },
  handler: async (ctx, args) => {
    const delivery = await ctx.db.get(args.deliveryId);
    if (!delivery || ['sent', 'delivered', 'bounced', 'complained', 'suppressed'].includes(delivery.status)) return null;
    if (delivery.attempts >= MAX_ATTEMPTS) return null;
    const attempts = delivery.attempts + 1;
    await ctx.db.patch(delivery._id, { status: 'sending', attempts, updatedAt: Date.now() });
    return { ...delivery, attempts };
  },
});

export const markSent = internalMutation({
  args: { deliveryId: v.id('emailDeliveries'), providerMessageId: v.string() },
  handler: async (ctx, args) => {
    const delivery = await ctx.db.get(args.deliveryId);
    if (!delivery) return;
    const now = Date.now();
    await ctx.db.patch(delivery._id, {
      status: 'sent',
      providerMessageId: args.providerMessageId.slice(0, 500),
      templateData: undefined,
      errorCode: undefined,
      errorMessage: undefined,
      sentAt: now,
      updatedAt: now,
    });
  },
});

export const markFailed = internalMutation({
  args: {
    deliveryId: v.id('emailDeliveries'),
    errorCode: v.string(),
    errorMessage: v.string(),
    attempts: v.number(),
  },
  handler: async (ctx, args) => {
    const delivery = await ctx.db.get(args.deliveryId);
    if (!delivery || ['sent', 'delivered'].includes(delivery.status)) return;
    const shouldRetry = args.attempts < MAX_ATTEMPTS;
    await ctx.db.patch(delivery._id, {
      status: shouldRetry ? 'queued' : 'failed',
      errorCode: args.errorCode.slice(0, 100),
      errorMessage: args.errorMessage.slice(0, 500),
      updatedAt: Date.now(),
    });
    if (shouldRetry) {
      const delay = RETRY_DELAYS_MS[Math.min(args.attempts - 1, RETRY_DELAYS_MS.length - 1)];
      await ctx.scheduler.runAfter(delay, internal.emails.deliver, { deliveryId: args.deliveryId });
    }
  },
});

export const deliver = internalAction({
  args: { deliveryId: v.id('emailDeliveries') },
  handler: async (ctx, args) => {
    const delivery = await ctx.runMutation(internal.emails.markSending, args);
    if (!delivery) return { sent: false, skipped: true };

    try {
      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.RESEND_FROM_EMAIL;
      if (!apiKey || !from) throw new Error('email_not_configured');

      const rendered = renderRelok8Email(
        delivery.template as EmailTemplateKind,
        delivery.locale as EmailLocale,
        cleanTemplateData(delivery.templateData),
      );
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': delivery.idempotencyKey,
        },
        body: JSON.stringify({
          from,
          to: [delivery.recipient],
          reply_to: 'support@relok8.online',
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
          tags: [
            { name: 'template', value: delivery.template },
            { name: 'category', value: rendered.category },
          ],
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { id?: string };
      if (!response.ok || !result.id) throw new Error(`resend_${response.status}`);

      await ctx.runMutation(internal.emails.markSent, {
        deliveryId: args.deliveryId,
        providerMessageId: result.id,
      });
      return { sent: true, providerMessageId: result.id };
    } catch (error) {
      const code = error instanceof Error && /^resend_\d+$/.test(error.message)
        ? error.message
        : error instanceof Error && error.message === 'email_not_configured'
          ? 'email_not_configured'
          : 'email_delivery_failed';
      await ctx.runMutation(internal.emails.markFailed, {
        deliveryId: args.deliveryId,
        attempts: delivery.attempts,
        errorCode: code,
        errorMessage: code === 'email_not_configured'
          ? 'Email delivery is not configured.'
          : 'Email provider rejected or could not accept the message.',
      });
      return { sent: false, skipped: false };
    }
  },
});
