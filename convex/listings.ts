import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Convex Listings Backend Module
 * Implements deterministic atomic locks (15-min EarlyLock hold) and reactive queries.
 */

export const getListings = query({
  args: {
    city: v.optional(v.string()),
    roomType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let listings = await ctx.db.query("listings").collect();

    // Clean up expired locks reactively
    const now = Date.now();
    for (const listing of listings) {
      if (listing.isLocked && listing.lockedUntil && listing.lockedUntil < now) {
        listing.isLocked = false;
        listing.lockedUntil = undefined;
      }
    }

    if (args.city && args.city !== "All Poland" && args.city !== "Anywhere in Poland") {
      listings = listings.filter((l) => l.city.toLowerCase() === args.city?.toLowerCase());
    }
    if (args.roomType && args.roomType !== "All room types") {
      listings = listings.filter((l) => l.roomType.toLowerCase() === args.roomType?.toLowerCase());
    }

    return listings;
  },
});

export const getListingById = query({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db
      .query("listings")
      .filter((q) => q.eq(q.field("_id"), args.id))
      .first();

    if (!listing) return null;

    // Check expiration
    if (listing.isLocked && listing.lockedUntil && listing.lockedUntil < Date.now()) {
      return {
        ...listing,
        isLocked: false,
        lockedUntil: undefined,
      };
    }

    return listing;
  },
});

/**
 * Atomic Hold Mutation (reserveListingAtomic)
 * Spec:
 * - Checks if isLocked is true and lockedUntil > Date.now().
 * - If locked, throws an error ("Listing currently reserved").
 * - If unlocked, sets isLocked = true and lockedUntil = Date.now() + 15 * 60 * 1000.
 * - Returns reservation lock status and timestamp.
 */
export const reserveListingAtomic = mutation({
  args: {
    listingId: v.string(),
    userId: v.string(),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db
      .query("listings")
      .filter((q) => q.eq(q.field("_id"), args.listingId))
      .first();

    if (!listing) {
      throw new Error("Listing not found");
    }

    const now = Date.now();
    const isActivelyLocked =
      listing.isLocked &&
      listing.lockedUntil !== undefined &&
      listing.lockedUntil > now;

    // If actively locked by someone else
    if (isActivelyLocked && listing.lockedByUserId && listing.lockedByUserId !== args.userId) {
      const remainingMinutes = Math.max(1, Math.ceil((listing.lockedUntil! - now) / 60000));
      throw new Error(`Listing currently reserved (held for another student for ${remainingMinutes} more minutes)`);
    }

    const lockedUntil = now + 15 * 60 * 1000; // 15-minute hold

    await ctx.db.patch(listing._id, {
      isLocked: true,
      lockedUntil,
      lockedByUserId: args.userId,
      reservedByName: args.userName || "Student",
      status: "RESERVED_PENDING",
    });

    return {
      success: true,
      listingId: args.listingId,
      isLocked: true,
      lockedUntil,
      remainingMinutes: 15,
      reservedByUserId: args.userId,
      message: "15-minute exclusive checkout hold confirmed via Convex atomic mutation.",
    };
  },
});

export const releaseListingLock = mutation({
  args: {
    listingId: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db
      .query("listings")
      .filter((q) => q.eq(q.field("_id"), args.listingId))
      .first();

    if (!listing) return { success: false, message: "Listing not found" };

    await ctx.db.patch(listing._id, {
      isLocked: false,
      lockedUntil: undefined,
      lockedByUserId: undefined,
      reservedByName: undefined,
      status: "AVAILABLE",
    });

    return {
      success: true,
      listingId: args.listingId,
      isLocked: false,
    };
  },
});

export const createListing = mutation({
  args: {
    title: v.string(),
    address: v.string(),
    city: v.string(),
    monthlyRent: v.number(),
    deposit: v.number(),
    roomType: v.string(),
    areaM2: v.number(),
    floor: v.number(),
    moveInDate: v.string(),
    leaseEndDate: v.string(),
    coordinates: v.object({
      lat: v.number(),
      lng: v.number(),
    }),
    currentTenant: v.object({
      name: v.string(),
      status: v.string(),
      avatar: v.string(),
    }),
    amenities: v.array(v.string()),
    district: v.optional(v.string()),
    description: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("listings", {
      ...args,
      isLocked: false,
      lockedUntil: undefined,
      status: "AVAILABLE",
    });
    return id;
  },
});

export const deleteListing = mutation({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    const listing = await ctx.db
      .query("listings")
      .filter((q) => q.eq(q.field("_id"), args.id))
      .first();

    if (listing) {
      await ctx.db.delete(listing._id);
      return { success: true };
    }
    return { success: false, message: "Not found" };
  },
});
