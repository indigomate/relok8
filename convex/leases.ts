import { consume, removeLease } from "./domain";
import { requireIdentity, requireSelf, requireOwner, requireLandlord, requireAdmin, publicListing, validateListing } from "./lib/auth";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Fetch all lease takeover listings, with optional city & roomType filtering.
 */
export const get = query({
  args: {
    city: v.optional(v.string()),
    roomType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let leases = await ctx.db.query("leases").collect();

    // Auto-release expired locks reactively
    const now = Date.now();
    for (const lease of leases) {
      if (["PENDING_HOLD", "RESERVED_PENDING", "AVAILABLE"].includes(lease.status) && lease.isLocked && lease.lockedUntil && lease.lockedUntil < now) {
        lease.isLocked = false;
        lease.lockedUntil = undefined;
        lease.status = "AVAILABLE";
      }
    }

    if (args.city && args.city !== "All Poland" && args.city !== "Anywhere in Poland") {
      leases = leases.filter(
        (l) => l.city.toLowerCase() === args.city?.toLowerCase()
      );
    }

    if (args.roomType && args.roomType !== "All room types") {
      leases = leases.filter(
        (l) => l.roomType.toLowerCase() === args.roomType?.toLowerCase()
      );
    }

    return leases.filter(l => !["PAUSED","TRANSFERRED","APPROVED","LEASED"].includes(l.status)).map(publicListing);
  },
});

/**
 * Fetch a single lease takeover listing by ID.
 */
export const getById = query({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    const lease = await ctx.db
      .query("leases")
      .filter((q) => q.eq(q.field("_id"), args.id))
      .first();
    return lease ? publicListing(lease) : null;
  },
});

/**
 * Create a new lease takeover listing.
 */
export const create = mutation({
  args: {
    title: v.string(),
    address: v.string(),
    city: v.string(),
    district: v.optional(v.string()),
    monthlyRent: v.number(),
    deposit: v.number(),
    roomType: v.string(),
    areaM2: v.number(),
    floor: v.optional(v.number()),
    moveInDate: v.string(),
    leaseEndDate: v.string(),
    coordinates: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
      })
    ),
    currentTenant: v.optional(
      v.object({
        name: v.string(),
        status: v.string(),
        avatar: v.string(),
      })
    ),
    amenities: v.array(v.string()),
    description: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    czynszAdmin: v.optional(v.number()),
    billsIncluded: v.optional(v.boolean()),
    isFurnished: v.optional(v.boolean()),
    flatmatesCount: v.optional(v.number()),
    distanceToCampus: v.optional(v.string()),
    meldunekAllowed: v.optional(v.boolean()),
    landlordName: v.optional(v.string()),
    landlordContactEmail: v.optional(v.string()),
    universitiesNearby: v.optional(v.array(v.string())),
    transitNearby: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    await consume(ctx, identity, "listing-create", 5);
    validateListing(args);
    for (const url of args.images || []) {
      const upload = await ctx.db.query('uploads').withIndex('by_url', q => q.eq('url', url)).unique();
      if (!upload || upload.ownerId !== identity.subject) throw new Error('Use your own uploaded photos');
    }
    const leaseId = await ctx.db.insert("leases", {
      ...args,
      ownerId: identity.subject,
      isLocked: false,
      status: "AVAILABLE",
      createdAt: Date.now(),
    });
    return leaseId;
  },
});

/**
 * Place an atomic 15-minute EarlyLock hold on a lease.
 */
export const reserve = mutation({
  args: {
    leaseId: v.string(),
    userId: v.string(),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireSelf(ctx, args.userId);
    await consume(ctx, identity, "reserve", 10);
    const lease = await ctx.db
      .query("leases")
      .filter((q) => q.eq(q.field("_id"), args.leaseId))
      .first();

    if (!lease) {
      throw new Error(`Lease ${args.leaseId} not found`);
    }

    if (["APPROVED", "TRANSFERRED", "LEASED"].includes(lease.status || "")) throw new Error("Listing unavailable");
    const now = Date.now();
    if (lease.isLocked && lease.lockedUntil && lease.lockedUntil > now) {
      if (lease.lockedByUserId !== args.userId) {
        throw new Error("This room is currently being held by another student");
      }
    }

    const lockedUntil = lease.lockedByUserId === identity.subject && lease.lockedUntil && lease.lockedUntil! > now ? lease.lockedUntil! : now + 15 * 60 * 1000;
    await ctx.db.patch(lease._id, {
      isLocked: true,
      lockedUntil,
      lockedByUserId: args.userId,
      reservedByName: args.userName || "Verified Student",
      status: "PENDING_HOLD",
    });

    return {
      success: true,
      lockedUntil,
      leaseId: lease._id,
    };
  },
});

/**
 * Release an active hold on a lease.
 */
export const release = mutation({
  args: {
    leaseId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    await consume(ctx, identity, "takeover", 10);
    const lease = await ctx.db
      .query("leases")
      .filter((q) => q.eq(q.field("_id"), args.leaseId))
      .first();

    if (!lease) return false;

    if (lease.lockedByUserId !== identity.subject || !["AVAILABLE", "PENDING_HOLD", "RESERVED_PENDING"].includes(lease.status || "AVAILABLE")) throw new Error("Forbidden");
    await ctx.db.patch(lease._id, {
      isLocked: false,
      lockedUntil: undefined,
      lockedByUserId: undefined,
      reservedByName: undefined,
      status: "AVAILABLE",
    });

    return true;
  },
});

/**
 * Delete a lease takeover listing by ID.
 */
export const deleteLease = mutation({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    const lease = await ctx.db
      .query("leases")
      .filter((q) => q.eq(q.field("_id"), args.id))
      .first();

    if (lease) {
      await requireOwner(ctx, lease);
      await removeLease(ctx, lease);
      return { success: true };
    }
    return { success: false, message: "Not found" };
  },
});

/**
 * Fetch listings associated with a specific landlord's email address.
 */
export const getByLandlordEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    if (identity.emailVerified !== true || !identity.email || identity.email.toLowerCase() !== args.email.trim().toLowerCase()) return [];
    if (!args.email) return [];
    const targetEmail = args.email.toLowerCase().trim();
    const leases = await ctx.db.query("leases").collect();
    return leases.filter(
      (l) => l.landlordContactEmail && l.landlordContactEmail.toLowerCase().trim() === targetEmail
    );
  },
});

/**
 * Landlord approves a pending takeover for a lease.
 */
export const approveTakeover = mutation({
  args: {
    leaseId: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const lease = await ctx.db
      .query("leases")
      .filter((q) => q.eq(q.field("_id"), args.leaseId))
      .first();

    if (!lease) {
      throw new Error(`Lease ${args.leaseId} not found`);
    }

    await requireLandlord(ctx, lease);
    if (lease.status !== "PENDING_HOLD" && lease.status !== "RESERVED_PENDING") throw new Error("No pending takeover");
    if (!lease.lockedUntil || lease.lockedUntil <= Date.now()) throw new Error("Takeover request expired");
    await ctx.db.patch(lease._id, {
      status: "APPROVED",
      isLocked: true,
      lockedUntil: undefined,
    });

    // Also update any matching reservation for this lease
    const reservation = await ctx.db
      .query("reservations")
      .filter((q) => q.eq(q.field("listingId"), args.leaseId))
      .first();

    if (reservation) {
      await ctx.db.patch(reservation._id, {
        status: "LANDLORD_APPROVED",
      });
    }

    // Also update pending inquiries for this listing to handover_agreed
    const inquiries = await ctx.db
      .query("inquiries")
      .filter((q) => q.eq(q.field("listingId"), args.leaseId))
      .collect();

    for (const inq of inquiries) {
      if (inq.status === "pending" && inq.userId === lease.lockedByUserId) {
        await ctx.db.patch(inq._id, {
          status: "handover_agreed",
        });
      }
    }

    return {
      success: true,
      status: "APPROVED",
      leaseId: lease._id,
      message: "Takeover approved. No funds have been moved; arrange the agreement and deposit directly.",
    };
  },
});

/**
 * Landlord rejects a pending takeover, releasing the room back to available.
 */
export const rejectTakeover = mutation({
  args: {
    leaseId: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const lease = await ctx.db
      .query("leases")
      .filter((q) => q.eq(q.field("_id"), args.leaseId))
      .first();

    if (!lease) {
      throw new Error(`Lease ${args.leaseId} not found`);
    }

    await requireLandlord(ctx, lease);
    if (lease.status !== "PENDING_HOLD" && lease.status !== "RESERVED_PENDING") throw new Error("No pending takeover");
    if (!lease.lockedUntil || lease.lockedUntil <= Date.now()) throw new Error("Takeover request expired");
    await ctx.db.patch(lease._id, {
      status: "AVAILABLE",
      isLocked: false,
      lockedUntil: undefined,
      lockedByUserId: undefined,
      reservedByName: undefined,
    });

    // Update reservation if exists
    const reservation = await ctx.db
      .query("reservations")
      .filter((q) => q.eq(q.field("listingId"), args.leaseId))
      .first();

    if (reservation) {
      await ctx.db.patch(reservation._id, {
        status: "CANCELLED",
      });
    }

    return {
      success: true,
      status: "AVAILABLE",
      leaseId: lease._id,
      message: "Takeover declined. Room unlocked and returned to active search catalog.",
    };
  },
});

/**
 * Request or simulate a takeover on a lease for testing the landlord approval workflow.
 */
export const requestTakeover = mutation({
  args: {
    leaseId: v.string(),
    studentName: v.string(),
    studentEmail: v.optional(v.string()),
    studentPhone: v.optional(v.string()),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    await consume(ctx, identity, "takeover", 10);
    const lease = await ctx.db
      .query("leases")
      .filter((q) => q.eq(q.field("_id"), args.leaseId))
      .first();

    if (!lease) throw new Error("Lease not found");

    const now = Date.now();
    if (lease.ownerId === identity.subject || ["APPROVED", "TRANSFERRED", "LEASED"].includes(lease.status) || (lease.isLocked && lease.lockedUntil && lease.lockedUntil > now && lease.lockedByUserId !== identity.subject)) throw new Error("Listing unavailable");
    await ctx.db.patch(lease._id, {
      status: "PENDING_HOLD",
      isLocked: true,
      lockedUntil: lease.lockedByUserId === identity.subject && lease.lockedUntil && lease.lockedUntil > now ? lease.lockedUntil : now + 15 * 60 * 1000,
      reservedByName: args.studentName,
      lockedByUserId: identity.subject,
    });

    // Record an inquiry for the landlord to review
    await ctx.db.insert("inquiries", {
      listingId: args.leaseId,
      tenantName: args.studentName,
      tenantEmail: identity.email || "",
      userId: identity.subject,
      message: args.message || "Requesting lease assignment pursuant to Art. 509 KC. Verified student documentation ready.",
      status: "pending",
      createdAt: now,
    });

    return { success: true, leaseId: lease._id, status: "PENDING_HOLD" };
  },
});

/**
 * Assign an existing listing to a landlord email.
 */
export const claimListingAsLandlord = mutation({
  args: {
    leaseId: v.string(),
    landlordEmail: v.string(),
    landlordName: v.optional(v.string()),
  },
  handler: async () => { throw new Error("Demo data and self-service landlord claims are disabled; use a verified invitation.");
  },
});

/**
 * Seed a demo lease takeover listing directly for the landlord's email so testing is instant.
 */
export const seedLandlordDemoListing = mutation({
  args: {
    landlordEmail: v.string(),
    landlordName: v.optional(v.string()),
    withPendingTakeover: v.optional(v.boolean()),
  },
  handler: async () => { throw new Error("Demo data and self-service landlord claims are disabled; use a verified invitation.");
  },
});

/**
 * Clear all leases completely for a clean zero-listing state.
 */
export const clearAllLeases = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("leases").collect();
    for (const lease of all) {
      await removeLease(ctx, lease);
    }
    return { deleted: all.length };
  },
});



export const mine = query({ args: {}, handler: async (ctx) => {
  const identity = await requireIdentity(ctx);
  return (await ctx.db.query('leases').collect()).filter(lease => lease.ownerId === identity.subject).map(publicListing);
} });

export const assignOwner = mutation({ args: { leaseId: v.id('leases'), ownerId: v.string() }, handler: async (ctx, args) => {
  await requireAdmin(ctx);
  if (!/^user_[a-zA-Z0-9]+$/.test(args.ownerId)) throw new Error('Use a verified Clerk user ID');
  const lease = await ctx.db.get(args.leaseId);
  if (!lease || lease.ownerId) throw new Error('Only ownerless legacy listings can be assigned');
  await ctx.db.patch(lease._id, { ownerId: args.ownerId });
} });
