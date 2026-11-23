import { requireSelf } from "./lib/auth";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { leaseHasEnded, validLeaseDates } from '../src/utils/leaseTiming';

/**
 * Get all listing IDs saved/favorited by a user.
 */
export const getUserFavorites = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    await requireSelf(ctx, args.userId);
    const favs = await ctx.db
      .query("favorites")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return favs.map((f) => f.listingId);
  },
});

/**
 * Save/favorite a listing.
 */
export const addFavorite = mutation({
  args: {
    userId: v.string(),
    listingId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireSelf(ctx, args.userId);
    const listingId = ctx.db.normalizeId('leases', args.listingId);
    const listing = listingId ? await ctx.db.get(listingId) : null;
    if (!listing || !validLeaseDates(listing.moveInDate, listing.leaseEndDate) || leaseHasEnded(listing.leaseEndDate) || ['PAUSED', 'APPROVED', 'TRANSFERRED', 'LEASED'].includes(listing.status)) throw new Error('Listing unavailable');
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_listing", (q) =>
        q.eq("userId", args.userId).eq("listingId", args.listingId)
      )
      .first();

    if (!existing) {
      await ctx.db.insert("favorites", {
        userId: args.userId,
        listingId: args.listingId,
        createdAt: Date.now(),
      });
    }
    return true;
  },
});

/**
 * Remove a saved listing from favorites.
 */
export const removeFavorite = mutation({
  args: {
    userId: v.string(),
    listingId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireSelf(ctx, args.userId);
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_listing", (q) =>
        q.eq("userId", args.userId).eq("listingId", args.listingId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return true;
  },
});
