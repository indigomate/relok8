import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity, requireSelf, isLandlord } from "./lib/auth";
import { consume } from './domain';
import { leaseHasEnded, validLeaseDates } from '../src/utils/leaseTiming';
async function canRead(ctx: any, identity: any, inquiry: any) {
  if (inquiry.userId === identity.subject) return true;
  const id = ctx.db.normalizeId("leases", inquiry.listingId);
  const lease = id ? await ctx.db.get(id) : null;
  return lease?.ownerId === identity.subject || isLandlord(lease, identity);
}
export const getInquiries = query({
  args: { listingId: v.optional(v.string()), userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await requireSelf(ctx, args.userId);
    const records = args.listingId ? await ctx.db.query("inquiries").withIndex("by_listingId", q => q.eq("listingId", args.listingId!)).collect() : await ctx.db.query("inquiries").collect();
    const allowed = await Promise.all(records.map(async r => await canRead(ctx, identity, r) ? r : null));
    return allowed.filter(r => r !== null);
  },
});
export const sendInquiry = mutation({
  args: { listingId: v.string(), userId: v.optional(v.string()), tenantName: v.string(), tenantEmail: v.string(), message: v.string() },
  handler: async (ctx, args) => {
    const identity = await requireSelf(ctx, args.userId);
    await consume(ctx, identity, 'legacy-inquiry', 10);
    if (!args.message.trim() || args.message.length > 10_000 || !args.tenantName.trim() || args.tenantName.length > 150) throw new Error("Invalid inquiry");
    const id = ctx.db.normalizeId("leases", args.listingId);
    const lease = id ? await ctx.db.get(id) : null;
    if (!lease) throw new Error("Listing not found");
    if (lease.ownerId === identity.subject || isLandlord(lease, identity)) throw new Error('You cannot inquire about your own listing');
    if (!validLeaseDates(lease.moveInDate, lease.leaseEndDate) || leaseHasEnded(lease.leaseEndDate) || ['PAUSED', 'APPROVED', 'TRANSFERRED', 'LEASED'].includes(lease.status)) throw new Error('Listing unavailable');
    return ctx.db.insert("inquiries", { ...args, tenantName: args.tenantName.trim(), message: args.message.trim(), userId: identity.subject, tenantEmail: identity.email || "", status: "pending", replies: [], createdAt: Date.now() });
  },
});
export const replyToInquiry = mutation({
  args: { inquiryId: v.id("inquiries"), sender: v.string(), text: v.string() },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const inquiry = await ctx.db.get(args.inquiryId);
    if (!inquiry || !await canRead(ctx, identity, inquiry)) throw new Error("Forbidden");
    if (!args.text.trim() || args.text.length > 10000) throw new Error("Invalid reply");
    const replies = [...(inquiry.replies || []), { sender: identity.subject, text: args.text, sentAt: new Date().toISOString() }];
    await ctx.db.patch(inquiry._id, { replies });
    return true;
  },
});
