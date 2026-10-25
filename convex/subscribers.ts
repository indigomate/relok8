import { requireAdmin, requireIdentity } from "./lib/auth";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Register or re-activate an email subscriber for city-specific room alerts
 */
export const subscribe = mutation({
  args: {
    email: v.string(),
    city: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    if (identity.emailVerified !== true || identity.email?.toLowerCase() !== args.email.trim().toLowerCase()) throw new Error("Use your verified account email");
    if (args.email.length > 254 || args.city.length > 100) throw new Error("Invalid subscription");
    const cleanEmail = args.email.trim().toLowerCase();
    const cleanCity = args.city.trim() || "Poland";

    // Check if subscription already exists
    const existing = await ctx.db
      .query("subscribers")
      .withIndex("by_email_city", (q) =>
        q.eq("email", cleanEmail).eq("city", cleanCity)
      )
      .first();

    if (existing) {
      if (!existing.active) {
        await ctx.db.patch(existing._id, { active: true });
      }
      return { id: existing._id, email: cleanEmail, city: cleanCity, isNew: false };
    }

    const id = await ctx.db.insert("subscribers", {
      email: cleanEmail,
      city: cleanCity,
      active: true,
      createdAt: Date.now(),
    });

    return { id, email: cleanEmail, city: cleanCity, isNew: true };
  },
});

/**
 * Unsubscribe an email from a city alert
 */
export const unsubscribe = mutation({
  args: {
    email: v.string(),
    city: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    if (identity.emailVerified !== true || identity.email?.toLowerCase() !== args.email.trim().toLowerCase()) throw new Error("Use your verified account email");
    if (args.email.length > 254 || args.city.length > 100) throw new Error("Invalid subscription");
    const cleanEmail = args.email.trim().toLowerCase();
    const cleanCity = args.city.trim();

    const existing = await ctx.db
      .query("subscribers")
      .withIndex("by_email_city", (q) =>
        q.eq("email", cleanEmail).eq("city", cleanCity)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { active: false });
      return { success: true };
    }

    return { success: false, message: "Subscription not found" };
  },
});

/**
 * Get all active subscribers for a specific city or sitewide alert
 */
export const getSubscribersForCity = query({
  args: {
    city: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const targetCity = args.city.trim().toLowerCase();

    const all = await ctx.db
      .query("subscribers")
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    // Match subscribers for this specific city or subscribers for all Poland
    return all.filter((s) => {
      const subCity = s.city.trim().toLowerCase();
      return (
        subCity === targetCity ||
        subCity === "poland" ||
        subCity === "all poland" ||
        subCity === "anywhere in poland"
      );
    });
  },
});

/**
 * List all subscribers (for admin / monitoring)
 */
export const getAllSubscribers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("subscribers").collect();
  },
});
