import { action, internalMutation, internalQuery, mutation, query } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import { requireIdentity } from './lib/auth';
import { emailLocale, rememberEmailContact } from './lib/emailContacts';
import { queueEmailDelivery } from './emails';
import { verifyEmailPreferenceToken } from './lib/emailPreferenceTokens';

const CONSENT_VERSION = 'email-marketing-v1-2026-11-20';

function cleanList(values: string[] | undefined, maximum = 20): string[] {
  return [...new Set((values || []).map((value) => value.trim()).filter(Boolean))].slice(0, maximum);
}

function publicPreferences(profile: any) {
  return {
    email: profile.email || '',
    locale: emailLocale(profile.locale),
    unreadMessages: profile.emailUnreadMessages !== false,
    listingReminders: profile.emailListingReminders !== false,
    weeklyDigest: profile.emailWeeklyDigest === true && profile.marketingConsent === true,
    marketingConsent: profile.marketingConsent === true,
    digestCities: profile.digestCities || [],
    digestRoomTypes: profile.digestRoomTypes || [],
    digestMaxMonthlyRent: profile.digestMaxMonthlyRent,
  };
}

async function profileForUser(ctx: any, userId: string) {
  return ctx.db.query('profiles').withIndex('by_userId', (q: any) => q.eq('userId', userId)).unique();
}

export const syncAccount = mutation({
  args: { locale: v.union(v.literal('en'), v.literal('pl')) },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    if (identity.emailVerified !== true || !identity.email) return { synced: false };
    const contact = await rememberEmailContact(ctx, identity, args.locale);
    if (!contact) return { synced: false };
    const profile = await profileForUser(ctx, identity.subject);
    if (!profile) return { synced: false };
    const defaults: Record<string, unknown> = {};
    if (profile.emailUnreadMessages === undefined) defaults.emailUnreadMessages = true;
    if (profile.emailListingReminders === undefined) defaults.emailListingReminders = true;
    if (profile.emailWeeklyDigest === undefined) defaults.emailWeeklyDigest = false;
    if (profile.marketingConsent === undefined) defaults.marketingConsent = false;
    if (profile.digestCities === undefined) defaults.digestCities = [];
    if (profile.digestRoomTypes === undefined) defaults.digestRoomTypes = [];
    if (profile.isVerified !== true) defaults.isVerified = true;
    if (Object.keys(defaults).length) await ctx.db.patch(profile._id, defaults);
    await queueEmailDelivery(ctx, {
      idempotencyKey: `welcome:${identity.subject}:v1`,
      userId: identity.subject,
      recipient: contact.email,
      template: 'welcome',
      locale: contact.locale,
      templateData: {
        recipientName: contact.name,
        ctaUrl: `https://relok8.online${contact.locale === 'pl' ? '/pl' : ''}/`,
      },
      relatedId: identity.subject,
      scheduleDelivery: !contact.email.endsWith('.test'),
    });
    return { synced: true };
  },
});

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const profile = await profileForUser(ctx, identity.subject);
    return profile ? publicPreferences(profile) : null;
  },
});

export const updateMine = mutation({
  args: {
    locale: v.union(v.literal('en'), v.literal('pl')),
    unreadMessages: v.boolean(),
    listingReminders: v.boolean(),
    weeklyDigest: v.boolean(),
    marketingConsent: v.boolean(),
    digestCities: v.array(v.string()),
    digestRoomTypes: v.array(v.string()),
    digestMaxMonthlyRent: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const contact = await rememberEmailContact(ctx, identity, args.locale);
    if (!contact) throw new Error('Use a verified account email');
    const profile = await profileForUser(ctx, identity.subject);
    if (!profile) throw new Error('Email profile not found');
    if (args.weeklyDigest && !args.marketingConsent) throw new Error('Marketing consent is required for the weekly digest');
    if (args.digestMaxMonthlyRent !== undefined && (!Number.isFinite(args.digestMaxMonthlyRent) || args.digestMaxMonthlyRent < 500 || args.digestMaxMonthlyRent > 100_000)) throw new Error('Invalid maximum rent');
    const now = Date.now();
    await ctx.db.patch(profile._id, {
      locale: args.locale,
      emailUnreadMessages: args.unreadMessages,
      emailListingReminders: args.listingReminders,
      emailWeeklyDigest: args.weeklyDigest && args.marketingConsent,
      marketingConsent: args.marketingConsent,
      marketingConsentVersion: args.marketingConsent ? CONSENT_VERSION : profile.marketingConsentVersion,
      marketingConsentedAt: args.marketingConsent && profile.marketingConsent !== true ? now : profile.marketingConsentedAt,
      marketingConsentSource: args.marketingConsent ? 'authenticated_preferences' : profile.marketingConsentSource,
      marketingUnsubscribedAt: args.marketingConsent ? undefined : now,
      digestCities: cleanList(args.digestCities),
      digestRoomTypes: cleanList(args.digestRoomTypes),
      digestMaxMonthlyRent: args.digestMaxMonthlyRent,
    });
    return publicPreferences(await ctx.db.get(profile._id));
  },
});

export const getByTokenInternal = internalQuery({
  args: { userId: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    const profile = await profileForUser(ctx, args.userId);
    if (!profile?.email || profile.email.toLowerCase() !== args.email.toLowerCase()) return null;
    return publicPreferences(profile);
  },
});

export const updateByTokenInternal = internalMutation({
  args: {
    userId: v.string(),
    email: v.string(),
    unreadMessages: v.optional(v.boolean()),
    listingReminders: v.optional(v.boolean()),
    weeklyDigest: v.optional(v.boolean()),
    marketingConsent: v.optional(v.boolean()),
    digestCities: v.optional(v.array(v.string())),
    digestRoomTypes: v.optional(v.array(v.string())),
    digestMaxMonthlyRent: v.optional(v.number()),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await profileForUser(ctx, args.userId);
    if (!profile?.email || profile.email.toLowerCase() !== args.email.toLowerCase()) throw new Error('Email preferences not found');
    const marketingConsent = args.marketingConsent ?? profile.marketingConsent === true;
    const weeklyDigest = (args.weeklyDigest ?? profile.emailWeeklyDigest === true) && marketingConsent;
    const now = Date.now();
    await ctx.db.patch(profile._id, {
      ...(args.unreadMessages !== undefined ? { emailUnreadMessages: args.unreadMessages } : {}),
      ...(args.listingReminders !== undefined ? { emailListingReminders: args.listingReminders } : {}),
      emailWeeklyDigest: weeklyDigest,
      marketingConsent,
      ...(marketingConsent ? {
        marketingConsentVersion: CONSENT_VERSION,
        marketingConsentedAt: profile.marketingConsent === true ? profile.marketingConsentedAt : now,
        marketingConsentSource: args.source.slice(0, 100),
        marketingUnsubscribedAt: undefined,
      } : { marketingUnsubscribedAt: now }),
      ...(args.digestCities ? { digestCities: cleanList(args.digestCities) } : {}),
      ...(args.digestRoomTypes ? { digestRoomTypes: cleanList(args.digestRoomTypes) } : {}),
      ...(args.digestMaxMonthlyRent !== undefined ? { digestMaxMonthlyRent: args.digestMaxMonthlyRent } : {}),
    });
    return publicPreferences(await ctx.db.get(profile._id));
  },
});

export const getPublic = action({
  args: { token: v.string() },
  handler: async (ctx, args): Promise<any> => {
    const payload = await verifyEmailPreferenceToken(args.token);
    return ctx.runQuery((internal as any).emailPreferences.getByTokenInternal, { userId: payload.userId, email: payload.email });
  },
});

export const updatePublic = action({
  args: {
    token: v.string(),
    unreadMessages: v.boolean(),
    listingReminders: v.boolean(),
    weeklyDigest: v.boolean(),
    marketingConsent: v.boolean(),
    digestCities: v.array(v.string()),
    digestRoomTypes: v.array(v.string()),
    digestMaxMonthlyRent: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any> => {
    const payload = await verifyEmailPreferenceToken(args.token);
    return ctx.runMutation((internal as any).emailPreferences.updateByTokenInternal, {
      userId: payload.userId,
      email: payload.email,
      unreadMessages: args.unreadMessages,
      listingReminders: args.listingReminders,
      weeklyDigest: args.weeklyDigest,
      marketingConsent: args.marketingConsent,
      digestCities: args.digestCities,
      digestRoomTypes: args.digestRoomTypes,
      digestMaxMonthlyRent: args.digestMaxMonthlyRent,
      source: 'signed_preference_link',
    });
  },
});

export const getDeliveryPolicy = internalQuery({
  args: { userId: v.optional(v.string()), recipient: v.string() },
  handler: async (ctx, args) => {
    const suppression = await ctx.db.query('emailSuppressions').withIndex('by_email', (q) => q.eq('email', args.recipient.toLowerCase())).unique();
    const profile = args.userId ? await profileForUser(ctx, args.userId) : null;
    const emailMatchesUser = Boolean(profile?.email && profile.email.toLowerCase() === args.recipient.toLowerCase());
    return {
      suppressed: Boolean(suppression),
      preferenceLinkAllowed: emailMatchesUser,
      marketingAllowed: Boolean(emailMatchesUser && profile?.marketingConsent === true),
    };
  },
});
