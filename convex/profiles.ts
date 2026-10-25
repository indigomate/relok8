import { requireSelf } from "./lib/auth";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get a user profile by Clerk or custom userId.
 */
export const getProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await requireSelf(ctx, args.userId);
    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

/**
// Convex is the only data backend.
 */
export const upsertProfile = mutation({
  args: {
    userId: v.string(),
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    whatsappNumber: v.optional(v.string()),
    isVerified: v.optional(v.boolean()),
    role: v.optional(v.string()),
    university: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireSelf(ctx, args.userId);
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...(args.fullName !== undefined ? { fullName: args.fullName } : {}),
        email: identity.email,
        ...(args.avatarUrl !== undefined ? { avatarUrl: args.avatarUrl } : {}),
        ...(args.phoneNumber !== undefined ? { phoneNumber: args.phoneNumber } : {}),
        ...(args.whatsappNumber !== undefined ? { whatsappNumber: args.whatsappNumber } : {}),


        ...(args.university !== undefined ? { university: args.university } : {}),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("profiles", {
        userId: args.userId,
        fullName: args.fullName,
        email: identity.email,
        avatarUrl: args.avatarUrl,
        phoneNumber: args.phoneNumber,
        whatsappNumber: args.whatsappNumber,
        isVerified: false,
        role: "student",
        university: args.university,
        createdAt: Date.now(),
      });
    }
  },
});
