import { internalMutation, internalQuery, mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { requireIdentity } from './lib/auth';

const scope = v.union(v.literal('general'), v.literal('listing'), v.literal('application'), v.literal('thread'));
const locale = v.union(v.literal('en'), v.literal('pl'));
const source = v.object({
  id: v.string(), label: v.string(), url: v.optional(v.string()),
  kind: v.union(v.literal('official'), v.literal('internal')),
});

function clipped(value: string, maximum: number) {
  return value.trim().slice(0, maximum);
}

export const open = internalMutation({
  args: { userId: v.string(), scope, scopeId: v.optional(v.string()), locale },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('onloSessions').withIndex('by_user_scope', (q) =>
      q.eq('userId', args.userId).eq('scope', args.scope).eq('scopeId', args.scopeId),
    ).order('desc').first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { locale: args.locale, updatedAt: now });
      return existing._id;
    }
    return ctx.db.insert('onloSessions', { ...args, createdAt: now, updatedAt: now });
  },
});

export const context = internalQuery({
  args: { sessionId: v.id('onloSessions'), userId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== args.userId) return null;
    const preferences = await ctx.db.query('onloPreferences').withIndex('by_user', (q) => q.eq('userId', args.userId)).unique();
    const messages = await ctx.db.query('onloSessionMessages').withIndex('by_session', (q) => q.eq('sessionId', args.sessionId)).order('desc').take(8);
    return {
      session,
      messages: messages.reverse().map(({ role, content }) => ({ role, content })),
      preferences: preferences?.memoryEnabled ? {
        locale: preferences.locale,
        cities: preferences.cities,
        roomTypes: preferences.roomTypes,
        maxMonthlyRent: preferences.maxMonthlyRent,
      } : null,
    };
  },
});

export const recordExchange = internalMutation({
  args: {
    sessionId: v.id('onloSessions'), userId: v.string(), question: v.string(), answer: v.string(),
    sources: v.optional(v.array(source)), runId: v.optional(v.id('onloRuns')), intent: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== args.userId) throw new Error('Onlo session not found');
    const now = Date.now();
    await ctx.db.insert('onloSessionMessages', { sessionId: args.sessionId, userId: args.userId, role: 'user', content: clipped(args.question, 3000), createdAt: now });
    await ctx.db.insert('onloSessionMessages', { sessionId: args.sessionId, userId: args.userId, role: 'onlo', content: clipped(args.answer, 10000), sources: args.sources, runId: args.runId, createdAt: now + 1 });
    const summary = clipped(`User: ${args.question}\nOnlo: ${args.answer}`, 1600);
    await ctx.db.patch(args.sessionId, { summary, lastIntent: args.intent, updatedAt: now });
  },
});

export const recordRun = internalMutation({
  args: {
    userId: v.string(), sessionId: v.optional(v.id('onloSessions')), scope: v.string(), intent: v.string(),
    status: v.union(v.literal('completed'), v.literal('failed')), toolNames: v.array(v.string()), sourceIds: v.array(v.string()),
    model: v.optional(v.string()), latencyMs: v.number(), citationStatus: v.string(), confidence: v.string(), needsHuman: v.boolean(),
  },
  handler: async (ctx, args) => ctx.db.insert('onloRuns', { ...args, createdAt: Date.now() }),
});

export const saveDraft = internalMutation({
  args: { userId: v.string(), threadId: v.string(), content: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert('onloDrafts', { ...args, content: clipped(args.content, 10000), status: 'draft', createdAt: now, updatedAt: now });
  },
});

export const messages = query({
  args: { sessionId: v.id('onloSessions') },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== identity.subject) throw new Error('Onlo session not found');
    return ctx.db.query('onloSessionMessages').withIndex('by_session', (q) => q.eq('sessionId', args.sessionId)).order('asc').take(100);
  },
});

export const myPreferences = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    return ctx.db.query('onloPreferences').withIndex('by_user', (q) => q.eq('userId', identity.subject)).unique();
  },
});

export const updatePreferences = mutation({
  args: {
    memoryEnabled: v.boolean(), locale: v.optional(locale), cities: v.optional(v.array(v.string())),
    roomTypes: v.optional(v.array(v.string())), maxMonthlyRent: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const existing = await ctx.db.query('onloPreferences').withIndex('by_user', (q) => q.eq('userId', identity.subject)).unique();
    const clean = {
      ...args,
      cities: args.cities?.map((item) => clipped(item, 80)).slice(0, 10),
      roomTypes: args.roomTypes?.map((item) => clipped(item, 80)).slice(0, 10),
      maxMonthlyRent: args.maxMonthlyRent === undefined ? undefined : Math.max(0, Math.min(args.maxMonthlyRent, 100000)),
      updatedAt: Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, clean);
      return existing._id;
    }
    return ctx.db.insert('onloPreferences', { userId: identity.subject, ...clean, createdAt: Date.now() });
  },
});

export const rateRun = mutation({
  args: { runId: v.id('onloRuns'), feedback: v.union(v.literal('helpful'), v.literal('not_helpful')) },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const run = await ctx.db.get(args.runId);
    if (!run || run.userId !== identity.subject) throw new Error('Onlo run not found');
    await ctx.db.patch(args.runId, { feedback: args.feedback });
  },
});

export const deleteSession = mutation({
  args: { sessionId: v.id('onloSessions') },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== identity.subject) throw new Error('Onlo session not found');
    for (const message of await ctx.db.query('onloSessionMessages').withIndex('by_session', (q) => q.eq('sessionId', args.sessionId)).collect()) await ctx.db.delete(message._id);
    for (const run of await ctx.db.query('onloRuns').withIndex('by_session', (q) => q.eq('sessionId', args.sessionId)).collect()) await ctx.db.delete(run._id);
    await ctx.db.delete(args.sessionId);
  },
});
