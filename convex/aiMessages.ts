import { action, mutation, query, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { api } from './_generated/api';
import { requireIdentity } from './lib/auth';
const source = v.object({
  id: v.string(),
  label: v.string(),
  url: v.optional(v.string()),
  kind: v.union(v.literal('official'), v.literal('internal')),
});
const suggestedAction = v.object({
  id: v.string(), label: v.string(), kind: v.union(v.literal('ask'), v.literal('review'), v.literal('navigate')),
  prompt: v.optional(v.string()), href: v.optional(v.string()), requiresConfirmation: v.boolean(),
});
export const getListingMessages = query({ args: { listingId: v.string() }, handler: async (ctx, args) => {
  const identity = await requireIdentity(ctx);
  return ctx.db.query('aiMessages').filter(q => q.and(q.eq(q.field('listingId'), args.listingId), q.eq(q.field('userId'), identity.subject))).collect();
} });
export const sendMessage = mutation({ args: { listingId: v.string(), sender: v.string(), content: v.string(), functionExecuted: v.optional(v.string()) }, handler: async () => { throw new Error('Direct assistant message writes are disabled'); } });
export const generateAIProxyResponse = action({ args: { listingId: v.string(), userPrompt: v.string(), locale: v.optional(v.string()) }, handler: async (ctx, args): Promise<{ sender: string; content: string; timestamp: number; sources: Array<{ id: string; label: string; url?: string; kind: 'official' | 'internal' }> }> => {
  await requireIdentity(ctx);
  return ctx.runAction(api.services.listingAssistant, { listingId: args.listingId, userPrompt: args.userPrompt, locale: args.locale });
} });

export const mine = query({ args: {}, handler: async ctx => {
  const identity = await requireIdentity(ctx);
  return ctx.db.query('aiMessages').filter(q => q.eq(q.field('userId'), identity.subject)).collect();
} });
export const saveExchange = internalMutation({ args: {
  listingId: v.string(), prompt: v.string(), answer: v.string(), sources: v.optional(v.array(source)),
  runId: v.optional(v.id('onloRuns')),
  confidence: v.optional(v.union(v.literal('verified'), v.literal('partial'), v.literal('unverified'))),
  needsHuman: v.optional(v.boolean()),
  suggestedActions: v.optional(v.array(suggestedAction)),
}, handler: async (ctx, args) => {
  const identity = await requireIdentity(ctx);
  const timestamp = Date.now();
  await ctx.db.insert('aiMessages', { listingId: args.listingId, userId: identity.subject, sender: 'user', content: args.prompt, timestamp });
  await ctx.db.insert('aiMessages', { listingId: args.listingId, userId: identity.subject, sender: 'ai', content: args.answer, sources: args.sources, runId: args.runId, confidence: args.confidence, needsHuman: args.needsHuman, suggestedActions: args.suggestedActions, timestamp: timestamp + 1 });
} });
