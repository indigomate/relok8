import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get a user profile by Clerk or custom userId.
 */
export const getProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

/**
 * Upsert a user profile (replaces Supabase profiles upsert).
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
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...(args.fullName !== undefined ? { fullName: args.fullName } : {}),
        ...(args.email !== undefined ? { email: args.email } : {}),
        ...(args.avatarUrl !== undefined ? { avatarUrl: args.avatarUrl } : {}),
        ...(args.phoneNumber !== undefined ? { phoneNumber: args.phoneNumber } : {}),
        ...(args.whatsappNumber !== undefined ? { whatsappNumber: args.whatsappNumber } : {}),
        ...(args.isVerified !== undefined ? { isVerified: args.isVerified } : {}),
        ...(args.role !== undefined ? { role: args.role } : {}),
        ...(args.university !== undefined ? { university: args.university } : {}),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("profiles", {
        userId: args.userId,
        fullName: args.fullName,
        email: args.email,
        avatarUrl: args.avatarUrl,
        phoneNumber: args.phoneNumber,
        whatsappNumber: args.whatsappNumber,
        isVerified: args.isVerified ?? false,
        role: args.role ?? "student",
        university: args.university,
        createdAt: Date.now(),
      });
    }
  },
});
