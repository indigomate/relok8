import { internalMutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';

const locale = v.union(v.literal('en'), v.literal('pl'));
const cacheKey = v.object({ sourceHash: v.string(), targetLocale: locale });

export const getMany = internalQuery({
  args: { items: v.array(cacheKey) },
  handler: async (ctx, args) => {
    const results: Array<{ sourceHash: string; targetLocale: 'en' | 'pl'; translatedText: string }> = [];
    for (const item of args.items) {
      const row = await ctx.db
        .query('translationCache')
        .withIndex('by_hash_locale', (q) => q.eq('sourceHash', item.sourceHash).eq('targetLocale', item.targetLocale))
        .unique();
      if (row) results.push({ sourceHash: row.sourceHash, targetLocale: row.targetLocale, translatedText: row.translatedText });
    }
    return results;
  },
});

export const putMany = internalMutation({
  args: {
    items: v.array(v.object({
      sourceHash: v.string(),
      targetLocale: locale,
      translatedText: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const item of args.items) {
      const existing = await ctx.db
        .query('translationCache')
        .withIndex('by_hash_locale', (q) => q.eq('sourceHash', item.sourceHash).eq('targetLocale', item.targetLocale))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, { translatedText: item.translatedText, updatedAt: now });
      } else {
        await ctx.db.insert('translationCache', { ...item, createdAt: now, updatedAt: now });
      }
    }
  },
});
