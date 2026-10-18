import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all inquiries, optionally filtered by listingId or userId.
 */
export const getInquiries = query({
  args: {
    listingId: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.listingId) {
      return await ctx.db
        .query("inquiries")
        .withIndex("by_listingId", (q) => q.eq("listingId", args.listingId!))
        .collect();
    }
    if (args.userId) {
      return await ctx.db
        .query("inquiries")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId!))
        .collect();
    }
    return await ctx.db.query("inquiries").collect();
  },
});

/**
 * Submit a tenant inquiry for a listing.
 */
export const sendInquiry = mutation({
  args: {
    listingId: v.string(),
    userId: v.optional(v.string()),
    tenantName: v.string(),
    tenantEmail: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("inquiries", {
      listingId: args.listingId,
      userId: args.userId,
      tenantName: args.tenantName,
      tenantEmail: args.tenantEmail,
      message: args.message,
      status: "pending",
      replies: [],
      createdAt: Date.now(),
    });
  },
});

/**
 * Add a reply to an inquiry thread.
 */
export const replyToInquiry = mutation({
  args: {
    inquiryId: v.id("inquiries"),
    sender: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const inquiry = await ctx.db.get(args.inquiryId);
    if (!inquiry) throw new Error("Inquiry not found");

    const replies = inquiry.replies || [];
    replies.push({
      sender: args.sender,
      text: args.text,
      sentAt: new Date().toISOString(),
    });

    await ctx.db.patch(args.inquiryId, { replies });
    return true;
  },
});
