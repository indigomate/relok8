import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  listings: defineTable({
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
    isLocked: v.boolean(),
    lockedUntil: v.optional(v.number()), // Unix timestamp for 15-min hold
    amenities: v.array(v.string()),

    // Extended fields to preserve rich property presentation
    district: v.optional(v.string()),
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
    lockedByUserId: v.optional(v.string()),
    reservedByName: v.optional(v.string()),
    status: v.optional(v.string()),
  }),

  reservations: defineTable({
    listingId: v.string(), // ID reference to listings
    studentName: v.string(),
    studentPhone: v.string(),
    amountGrosze: v.number(),
    stripePaymentIntentId: v.string(),
    status: v.string(), // "PENDING_HOLD" | "LANDLORD_APPROVED" | "EXPIRED" | "CANCELLED"
    addons: v.object({
      verificationPassport: v.boolean(),
      meldunekPack: v.boolean(),
    }),
    expiresAt: v.number(), // Unix timestamp
    createdAt: v.number(),
  }),

  aiMessages: defineTable({
    listingId: v.string(), // ID reference to listings
    sender: v.string(), // "user" | "ai"
    content: v.string(),
    functionExecuted: v.optional(v.string()),
    timestamp: v.number(),
  }),
});
