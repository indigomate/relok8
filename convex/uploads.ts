import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { requireIdentity } from './lib/auth';
import { consume } from './domain';
export const generateUploadUrl = mutation({ args: {}, handler: async ctx => {
  const identity = await requireIdentity(ctx);
  await consume(ctx, identity, 'upload', 20);
  return ctx.storage.generateUploadUrl();
} });
export const claim = mutation({ args: { storageId: v.id('_storage') }, handler: async (ctx, args) => {
  const identity = await requireIdentity(ctx);
  const metadata = await ctx.db.system.get(args.storageId);
  if (!metadata || !['image/jpeg','image/png','image/webp'].includes(metadata.contentType || '') || metadata.size > 1500000) throw new Error('Unsupported or oversized image');
  const existing = await ctx.db.query('uploads').withIndex('by_storage', q => q.eq('storageId', args.storageId)).unique();
  if (existing && existing.ownerId !== identity.subject) throw new Error('Forbidden');
  const url = await ctx.storage.getUrl(args.storageId);
  if (!url) throw new Error('Upload not found');
  if (!existing) await ctx.db.insert('uploads', { ...args, ownerId: identity.subject, url });
  return url;
} });
