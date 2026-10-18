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
      if (lease.isLocked && lease.lockedUntil && lease.lockedUntil < now) {
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

    return leases;
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
    return lease;
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
    floor: v.number(),
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
    const leaseId = await ctx.db.insert("leases", {
      ...args,
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
    const lease = await ctx.db
      .query("leases")
      .filter((q) => q.eq(q.field("_id"), args.leaseId))
      .first();

    if (!lease) {
      throw new Error(`Lease ${args.leaseId} not found`);
    }

    const now = Date.now();
    if (lease.isLocked && lease.lockedUntil && lease.lockedUntil > now) {
      if (lease.lockedByUserId !== args.userId) {
        throw new Error("This room is currently being held by another student");
      }
    }

    const lockedUntil = now + 15 * 60 * 1000;
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
    const lease = await ctx.db
      .query("leases")
      .filter((q) => q.eq(q.field("_id"), args.leaseId))
      .first();

    if (!lease) return false;

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
      await ctx.db.delete(lease._id);
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

    await ctx.db.patch(lease._id, {
      status: "APPROVED",
      isLocked: true,
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
      if (inq.status === "pending") {
        await ctx.db.patch(inq._id, {
          status: "handover_agreed",
        });
      }
    }

    return {
      success: true,
      status: "APPROVED",
      leaseId: lease._id,
      message: "Takeover approved under Polish Civil Code Art. 509 KC. Escrow released for final contract handover.",
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
    const lease = await ctx.db
      .query("leases")
      .filter((q) => q.eq(q.field("_id"), args.leaseId))
      .first();

    if (!lease) throw new Error("Lease not found");

    const now = Date.now();
    await ctx.db.patch(lease._id, {
      status: "PENDING_HOLD",
      isLocked: true,
      lockedUntil: now + 15 * 60 * 1000,
      reservedByName: args.studentName,
    });

    // Record an inquiry for the landlord to review
    await ctx.db.insert("inquiries", {
      listingId: args.leaseId,
      tenantName: args.studentName,
      tenantEmail: args.studentEmail || "student@university.pl",
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
  handler: async (ctx, args) => {
    const lease = await ctx.db
      .query("leases")
      .filter((q) => q.eq(q.field("_id"), args.leaseId))
      .first();

    if (!lease) throw new Error("Lease not found");

    await ctx.db.patch(lease._id, {
      landlordContactEmail: args.landlordEmail.toLowerCase().trim(),
      landlordName: args.landlordName || "Verified Landlord",
    });

    return { success: true };
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
  handler: async (ctx, args) => {
    const email = args.landlordEmail.toLowerCase().trim();
    const now = Date.now();
    const hasTakeover = args.withPendingTakeover ?? true;

    const leaseId = await ctx.db.insert("leases", {
      title: "Student Studio near University of Warsaw",
      address: "ul. Krakowskie Przedmieście 26/28, Apt 4",
      city: "Warsaw",
      district: "Śródmieście",
      monthlyRent: 2400,
      deposit: 2400,
      roomType: "Entire studio",
      areaM2: 26,
      floor: 2,
      moveInDate: "2026-11-01",
      leaseEndDate: "2027-06-30",
      amenities: ["Furnished", "High-speed Wi-Fi", "Washing Machine", "Dishwasher", "Desk"],
      description: "Quiet studio apartment pre-approved for official student lease transfer (Art. 509 KC). Landlord registered for meldunek.",
      czynszAdmin: 450,
      billsIncluded: false,
      isFurnished: true,
      flatmatesCount: 0,
      meldunekAllowed: true,
      landlordName: args.landlordName || "Verified Landlord",
      landlordContactEmail: email,
      isLocked: hasTakeover,
      lockedUntil: hasTakeover ? now + 15 * 60 * 1000 : undefined,
      status: hasTakeover ? "PENDING_HOLD" : "AVAILABLE",
      reservedByName: hasTakeover ? "Kacper Kowalski (UW Student)" : undefined,
      createdAt: now,
    });

    if (hasTakeover) {
      await ctx.db.insert("inquiries", {
        listingId: leaseId,
        tenantName: "Kacper Kowalski",
        tenantEmail: "kacper.kowalski@student.uw.edu.pl",
        message: "Hello! I am an exchange student at University of Warsaw. My documentation and escrow hold are ready. Requesting takeover consent pursuant to Art. 509 KC.",
        status: "pending",
        createdAt: now,
      });
    }

    return leaseId;
  },
});

/**
 * Clear all leases completely for a clean zero-listing state.
 */
export const clearAllLeases = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("leases").collect();
    for (const lease of all) {
      await ctx.db.delete(lease._id);
    }
    return { deleted: all.length };
  },
});


