import { requireSelf } from "./lib/auth";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

function optionalText(value: string | undefined, maximum: number, label: string): string | undefined {
  if (value === undefined) return undefined;
  const cleaned = value.trim();
  if (cleaned.length > maximum) throw new Error(`Invalid ${label}`);
  return cleaned || undefined;
}

function optionalPhone(value: string | undefined): string | undefined {
  const cleaned = optionalText(value, 25, 'phone number');
  if (cleaned && !/^\+?[0-9 ()-]{7,25}$/.test(cleaned)) throw new Error('Invalid phone number');
  return cleaned;
}

function optionalAvatar(value: string | undefined): string | undefined {
  const cleaned = optionalText(value, 2_000, 'avatar URL');
  if (!cleaned) return undefined;
  try {
    const url = new URL(cleaned);
    if (url.protocol !== 'https:') throw new Error();
    return url.toString();
  } catch {
    throw new Error('Invalid avatar URL');
  }
}

/**
 * Get a user profile by Clerk or custom userId.
 */
export const getProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    await requireSelf(ctx, args.userId);
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
    const fullName = optionalText(args.fullName, 150, 'name');
    const avatarUrl = optionalAvatar(args.avatarUrl);
    const phoneNumber = optionalPhone(args.phoneNumber);
    const whatsappNumber = optionalPhone(args.whatsappNumber);
    const university = optionalText(args.university, 200, 'institution');
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...(args.fullName !== undefined ? { fullName } : {}),
        ...(identity.emailVerified === true && identity.email ? { email: identity.email.trim().toLowerCase() } : {}),
        ...(args.avatarUrl !== undefined ? { avatarUrl } : {}),
        ...(args.phoneNumber !== undefined ? { phoneNumber } : {}),
        ...(args.whatsappNumber !== undefined ? { whatsappNumber } : {}),


        ...(args.university !== undefined ? { university } : {}),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("profiles", {
        userId: args.userId,
        fullName,
        ...(identity.emailVerified === true && identity.email ? { email: identity.email.trim().toLowerCase() } : {}),
        avatarUrl,
        phoneNumber,
        whatsappNumber,
        isVerified: false,
        role: "student",
        university,
        createdAt: Date.now(),
      });
    }
  },
});
