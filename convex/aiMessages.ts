import { action, mutation, query, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { api } from './_generated/api';
import { requireIdentity } from './lib/auth';
export const getListingMessages = query({ args: { listingId: v.string() }, handler: async (ctx, args) => {
  const identity = await requireIdentity(ctx);
  return ctx.db.query('aiMessages').filter(q => q.and(q.eq(q.field('listingId'), args.listingId), q.eq(q.field('userId'), identity.subject))).collect();
} });
export const sendMessage = mutation({ args: { listingId: v.string(), sender: v.string(), content: v.string(), functionExecuted: v.optional(v.string()) }, handler: async () => { throw new Error('Direct assistant message writes are disabled'); } });
export const generateAIProxyResponse = action({ args: { listingId: v.string(), userPrompt: v.string(), listingContext: v.any() }, handler: async (ctx, args): Promise<{ sender: string; content: string; timestamp: number }> => {
  await requireIdentity(ctx);
  return ctx.runAction(api.services.listingAssistant, { listingId: args.listingId, userPrompt: args.userPrompt });
} });

export const mine = query({ args: {}, handler: async ctx => {
  const identity = await requireIdentity(ctx);
  return ctx.db.query('aiMessages').filter(q => q.eq(q.field('userId'), identity.subject)).collect();
} });
export const saveExchange = internalMutation({ args: { listingId: v.string(), prompt: v.string(), answer: v.string() }, handler: async (ctx, args) => {
  const identity = await requireIdentity(ctx);
  const timestamp = Date.now();
  await ctx.db.insert('aiMessages', { listingId: args.listingId, userId: identity.subject, sender: 'user', content: args.prompt, timestamp });
  await ctx.db.insert('aiMessages', { listingId: args.listingId, userId: identity.subject, sender: 'ai', content: args.answer, timestamp: timestamp + 1 });
} });
