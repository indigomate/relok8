import { leaseHasEnded } from '../src/utils/leaseTiming';
import { action, internalAction, internalMutation, internalQuery, mutation, query } from './_generated/server';
import { internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import { requireIdentity } from './lib/auth';
import { v } from 'convex/values';

const CONSENT_VERSION = 'whatsapp-apartment-alerts-v1';
const DEFAULT_TIME_ZONE = 'Europe/Warsaw';
const MAX_DIGEST_LISTINGS = 5;

export function normalizeE164(value: string): string {
  const compact = value.trim().replace(/[\s().-]/g, '').replace(/^00/, '+');
  if (!/^\+[1-9]\d{7,14}$/.test(compact)) {
    throw new Error('Enter a WhatsApp number in international format, for example +48123456789');
  }
  return compact;
}

export function isStopKeyword(value: string): boolean {
  return /^(stop|stop all|unsubscribe|pause|wypisz|rezygnuję|rezygnuje)$/i.test(value.trim());
}

export function isStartKeyword(value: string): boolean {
  return /^(start|subscribe|resume|wznów|wznow)$/i.test(value.trim());
}

function cleanList(values: string[], maximum: number): string[] {
  const unique = [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  if (unique.length > maximum || unique.some((value) => value.length > 100)) throw new Error('Invalid alert filters');
  return unique;
}

function normalizeFilter(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

function localScheduleParts(timestamp: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(timestamp));
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || '';
  return {
    date: `${value('year')}-${value('month')}-${value('day')}`,
    hour: Number(value('hour')),
  };
}

function maskedPhone(phone: string): string {
  return `${phone.slice(0, Math.min(4, phone.length - 4))}${'•'.repeat(Math.max(3, phone.length - 7))}${phone.slice(-3)}`;
}

function totalMonthlyCost(listing: Doc<'leases'>): number {
  return listing.monthlyRent + (listing.czynszAdmin || 0) + (listing.billsMode === 'fixed' ? listing.fixedBillsPLN || 0 : 0);
}

export const getPreferences = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const subscription = await ctx.db
      .query('whatsappSubscriptions')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .unique();
    if (!subscription) return null;
    return {
      id: subscription._id,
      maskedPhone: maskedPhone(subscription.phoneE164),
      cities: subscription.cities,
      roomTypes: subscription.roomTypes,
      maxMonthlyRent: subscription.maxMonthlyRent,
      locale: subscription.locale,
      sendHourLocal: subscription.sendHourLocal,
      timeZone: subscription.timeZone,
      active: subscription.active,
      consentedAt: subscription.consentedAt,
      lastDigestAt: subscription.lastDigestAt,
    };
  },
});

export const configurePreferences = mutation({
  args: {
    phoneE164: v.optional(v.string()),
    cities: v.array(v.string()),
    roomTypes: v.array(v.string()),
    maxMonthlyRent: v.optional(v.number()),
    locale: v.union(v.literal('en'), v.literal('pl')),
    sendHourLocal: v.number(),
    consent: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    if (!args.consent) throw new Error('WhatsApp alerts require explicit consent');
    const cities = cleanList(args.cities, 5);
    const roomTypes = cleanList(args.roomTypes, 5);
    if (!Number.isInteger(args.sendHourLocal) || args.sendHourLocal < 6 || args.sendHourLocal > 21) {
      throw new Error('Choose a delivery time between 06:00 and 21:00');
    }
    if (args.maxMonthlyRent !== undefined && (!Number.isFinite(args.maxMonthlyRent) || args.maxMonthlyRent < 500 || args.maxMonthlyRent > 100000)) {
      throw new Error('Invalid maximum monthly rent');
    }

    const existing = await ctx.db
      .query('whatsappSubscriptions')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .unique();
    const phoneE164 = args.phoneE164?.trim()
      ? normalizeE164(args.phoneE164)
      : existing?.phoneE164;
    if (!phoneE164) throw new Error('Enter your WhatsApp number');

    const phoneOwner = await ctx.db
      .query('whatsappSubscriptions')
      .withIndex('by_phone', (q) => q.eq('phoneE164', phoneE164))
      .first();
    if (phoneOwner && phoneOwner.userId !== identity.subject) throw new Error('This WhatsApp number is already connected to another account');

    const now = Date.now();
    const values = {
      displayName: typeof identity.name === 'string' ? identity.name.slice(0, 80) : undefined,
      phoneE164,
      cities,
      roomTypes,
      maxMonthlyRent: args.maxMonthlyRent,
      locale: args.locale,
      timeZone: DEFAULT_TIME_ZONE,
      sendHourLocal: args.sendHourLocal,
      active: true,
      consentVersion: CONSENT_VERSION,
      consentedAt: now,
      consentSource: 'relok8_notification_settings',
      optedOutAt: undefined,
      updatedAt: now,
    } as const;

    if (existing) {
      await ctx.db.patch(existing._id, values);
      return { id: existing._id, active: true, maskedPhone: maskedPhone(phoneE164) };
    }
    const id = await ctx.db.insert('whatsappSubscriptions', {
      userId: identity.subject,
      ...values,
      createdAt: now,
    });
    return { id, active: true, maskedPhone: maskedPhone(phoneE164) };
  },
});

export const pausePreferences = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const subscription = await ctx.db
      .query('whatsappSubscriptions')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .unique();
    if (!subscription) return { success: false };
    await ctx.db.patch(subscription._id, { active: false, optedOutAt: Date.now(), updatedAt: Date.now() });
    return { success: true };
  },
});

export const getRecentDeliveries = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const rows = await ctx.db
      .query('whatsappDeliveries')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .order('desc')
      .take(10);
    return rows.map(({ errorMessage: _privateError, ...row }) => row);
  },
});

export const queueDueDigests = internalMutation({
  args: { now: v.optional(v.number()), scheduleDelivery: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const now = args.now ?? Date.now();
    const subscriptions = await ctx.db
      .query('whatsappSubscriptions')
      .withIndex('by_active', (q) => q.eq('active', true))
      .collect();
    const available = await ctx.db
      .query('leases')
      .withIndex('by_status', (q) => q.eq('status', 'AVAILABLE'))
      .collect();
    let queued = 0;

    for (const subscription of subscriptions) {
      const local = localScheduleParts(now, subscription.timeZone);
      if (local.hour !== subscription.sendHourLocal) continue;
      const existing = await ctx.db
        .query('whatsappDeliveries')
        .withIndex('by_subscription_date', (q) => q.eq('subscriptionId', subscription._id).eq('digestDate', local.date))
        .unique();
      if (existing) continue;

      const cities = subscription.cities.map(normalizeFilter);
      const roomTypes = subscription.roomTypes.map(normalizeFilter);
      const matches = available
        .filter((listing) => !leaseHasEnded(listing.leaseEndDate))
        .filter((listing) => !subscription.lastDigestAt || (listing.createdAt || listing._creationTime) > subscription.lastDigestAt)
        .filter((listing) => !cities.length || cities.includes('all poland') || cities.includes('poland') || cities.includes(normalizeFilter(listing.city)))
        .filter((listing) => !roomTypes.length || roomTypes.includes(normalizeFilter(listing.roomType)))
        .filter((listing) => subscription.maxMonthlyRent === undefined || totalMonthlyCost(listing) <= subscription.maxMonthlyRent)
        .sort((a, b) => (b.createdAt || b._creationTime) - (a.createdAt || a._creationTime))
        .slice(0, MAX_DIGEST_LISTINGS);

      const createdAt = Date.now();
      const deliveryId = await ctx.db.insert('whatsappDeliveries', {
        subscriptionId: subscription._id,
        userId: subscription.userId,
        kind: 'daily_apartment_digest',
        digestDate: local.date,
        listingIds: matches.map((listing) => String(listing._id)),
        status: matches.length ? 'queued' : 'skipped',
        attempts: 0,
        createdAt,
        updatedAt: createdAt,
      });

      if (matches.length) {
        if (args.scheduleDelivery !== false) await ctx.scheduler.runAfter(0, internal.whatsapp.sendDelivery, { deliveryId });
        queued += 1;
      } else {
        await ctx.db.patch(subscription._id, { lastDigestAt: now, updatedAt: now });
      }
    }
    return { queued };
  },
});

export const getDeliveryContext = internalQuery({
  args: { deliveryId: v.id('whatsappDeliveries') },
  handler: async (ctx, args) => {
    const delivery = await ctx.db.get(args.deliveryId);
    if (!delivery) return null;
    const subscription = await ctx.db.get(delivery.subscriptionId);
    if (!subscription || !subscription.active) return null;
    const listings: Doc<'leases'>[] = [];
    for (const id of delivery.listingIds) {
      const listing = await ctx.db.get(id as Id<'leases'>);
      if (listing && listing.status === 'AVAILABLE' && !leaseHasEnded(listing.leaseEndDate)) listings.push(listing);
    }
    return { delivery, subscription, listings };
  },
});

export const markSending = internalMutation({
  args: { deliveryId: v.id('whatsappDeliveries') },
  handler: async (ctx, args) => {
    const delivery = await ctx.db.get(args.deliveryId);
    if (!delivery || ['sent', 'delivered', 'read', 'skipped'].includes(delivery.status)) return null;
    const attempts = delivery.attempts + 1;
    await ctx.db.patch(delivery._id, { status: 'sending', attempts, updatedAt: Date.now(), errorCode: undefined, errorMessage: undefined });
    return { attempts };
  },
});

export const recordSent = internalMutation({
  args: { deliveryId: v.id('whatsappDeliveries'), providerMessageId: v.string() },
  handler: async (ctx, args) => {
    const delivery = await ctx.db.get(args.deliveryId);
    if (!delivery) return;
    const now = Date.now();
    await ctx.db.patch(delivery._id, { status: 'sent', providerMessageId: args.providerMessageId, sentAt: now, updatedAt: now });
    await ctx.db.patch(delivery.subscriptionId, { lastDigestAt: now, updatedAt: now });
  },
});

export const recordFailure = internalMutation({
  args: { deliveryId: v.id('whatsappDeliveries'), errorCode: v.string(), errorMessage: v.string() },
  handler: async (ctx, args) => {
    const delivery = await ctx.db.get(args.deliveryId);
    if (!delivery) return null;
    await ctx.db.patch(delivery._id, {
      status: 'failed',
      errorCode: args.errorCode.slice(0, 100),
      errorMessage: args.errorMessage.slice(0, 500),
      updatedAt: Date.now(),
    });
    return { attempts: delivery.attempts };
  },
});

export const sendDelivery = internalAction({
  args: { deliveryId: v.id('whatsappDeliveries') },
  handler: async (ctx, args): Promise<void> => {
    const attempt = await ctx.runMutation(internal.whatsapp.markSending, args);
    if (!attempt) return;
    const context = await ctx.runQuery(internal.whatsapp.getDeliveryContext, args);
    if (!context || !context.listings.length) {
      await ctx.runMutation(internal.whatsapp.recordFailure, { ...args, errorCode: 'NO_ACTIVE_MATCHES', errorMessage: 'No active listings remained at send time' });
      return;
    }

    let errorCode = 'DELIVERY_FAILED';
    let errorMessage = 'WhatsApp delivery failed';
    try {
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const graphVersion = process.env.WHATSAPP_GRAPH_VERSION;
      const templateName = context.subscription.locale === 'pl'
        ? process.env.WHATSAPP_DAILY_TEMPLATE_PL
        : process.env.WHATSAPP_DAILY_TEMPLATE_EN;
      if (!accessToken || !phoneNumberId || !graphVersion || !templateName || !/^v\d+\.\d+$/.test(graphVersion)) {
        errorCode = 'CONFIGURATION_MISSING';
        throw new Error('WhatsApp Cloud API environment variables are incomplete');
      }

      const summary = context.listings.map((listing, index) =>
        `${index + 1}. ${listing.title.slice(0, 80)} — ${Math.round(totalMonthlyCost(listing))} PLN, ${listing.city}`
      ).join('\n').slice(0, 900);
      const appOrigin = (process.env.PUBLIC_APP_URL || 'https://relok8.online').replace(/\/$/, '');
      const firstListingUrl = `${appOrigin}/listing/${context.listings[0]._id}`;
      const response = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: context.subscription.phoneE164.slice(1),
          type: 'template',
          template: {
            name: templateName,
            language: { code: context.subscription.locale === 'pl' ? 'pl' : 'en_US' },
            components: [{
              type: 'body',
              parameters: [
                { type: 'text', text: context.subscription.displayName || (context.subscription.locale === 'pl' ? 'Cześć' : 'there') },
                { type: 'text', text: String(context.listings.length) },
                { type: 'text', text: summary },
                { type: 'text', text: firstListingUrl },
              ],
            }],
          },
        }),
      });
      const result = await response.json().catch(() => ({})) as any;
      if (!response.ok) {
        errorCode = String(result?.error?.code || `HTTP_${response.status}`);
        errorMessage = String(result?.error?.message || 'WhatsApp Cloud API rejected the message');
        throw new Error(errorMessage);
      }
      const providerMessageId = result?.messages?.[0]?.id;
      if (typeof providerMessageId !== 'string' || !providerMessageId) throw new Error('WhatsApp Cloud API returned no message ID');
      await ctx.runMutation(internal.whatsapp.recordSent, { ...args, providerMessageId });
      return;
    } catch (error) {
      if (error instanceof Error && error.message) errorMessage = error.message;
      await ctx.runMutation(internal.whatsapp.recordFailure, { ...args, errorCode, errorMessage });
      if (errorCode !== 'CONFIGURATION_MISSING' && attempt.attempts < 3) {
        const retryDelay = [60_000, 5 * 60_000, 30 * 60_000][attempt.attempts - 1] || 30 * 60_000;
        await ctx.scheduler.runAfter(retryDelay, internal.whatsapp.sendDelivery, args);
      }
    }
  },
});

export const recordWebhookEvent = internalMutation({
  args: {
    eventId: v.string(),
    eventType: v.string(),
    providerMessageId: v.optional(v.string()),
    phoneE164: v.optional(v.string()),
    text: v.optional(v.string()),
    errorCode: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const duplicate = await ctx.db
      .query('whatsappWebhookEvents')
      .withIndex('by_event', (q) => q.eq('eventId', args.eventId))
      .unique();
    if (duplicate) return { duplicate: true };
    await ctx.db.insert('whatsappWebhookEvents', { eventId: args.eventId, eventType: args.eventType, receivedAt: Date.now() });

    if (args.providerMessageId) {
      const delivery = await ctx.db
        .query('whatsappDeliveries')
        .withIndex('by_provider_message', (q) => q.eq('providerMessageId', args.providerMessageId))
        .unique();
      if (delivery && ['sent', 'delivered', 'read', 'failed'].includes(args.eventType)) {
        const rank: Record<string, number> = { queued: 0, sending: 1, sent: 2, delivered: 3, read: 4, failed: 2 };
        if ((rank[args.eventType] ?? 0) < (rank[delivery.status] ?? 0)) return { duplicate: false };
        await ctx.db.patch(delivery._id, {
          status: args.eventType as 'sent' | 'delivered' | 'read' | 'failed',
          errorCode: args.errorCode?.slice(0, 100),
          errorMessage: args.errorMessage?.slice(0, 500),
          updatedAt: Date.now(),
        });
      }
    }

    if (args.phoneE164 && args.text) {
      let phone: string;
      try { phone = normalizeE164(args.phoneE164); } catch { return { duplicate: false }; }
      if (isStopKeyword(args.text)) {
        const subscriptions = await ctx.db.query('whatsappSubscriptions').withIndex('by_phone', (q) => q.eq('phoneE164', phone)).collect();
        for (const subscription of subscriptions) {
          if (subscription.active) await ctx.db.patch(subscription._id, { active: false, optedOutAt: Date.now(), updatedAt: Date.now() });
        }
      } else if (isStartKeyword(args.text)) {
        const subscription = await ctx.db.query('whatsappSubscriptions').withIndex('by_phone', (q) => q.eq('phoneE164', phone)).order('desc').first();
        if (subscription) await ctx.db.patch(subscription._id, {
          active: true,
          consentVersion: CONSENT_VERSION,
          consentedAt: Date.now(),
          consentSource: 'inbound_whatsapp_start',
          optedOutAt: undefined,
          updatedAt: Date.now(),
        });
      }
    }
    return { duplicate: false };
  },
});

// These public actions intentionally cannot be used to spoof a provider webhook
// or report delivery without Meta's signed callback.
export const handleWebhookReply = action({
  args: {},
  handler: async (): Promise<never> => { throw new Error('Use the signed WhatsApp webhook endpoint'); },
});

export const sendLandlordApprovalAlert = action({
  args: {},
  handler: async (): Promise<never> => { throw new Error('Landlord WhatsApp alerts are not enabled yet'); },
});
