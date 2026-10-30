import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  uploads: defineTable({ storageId: v.id('_storage'), ownerId: v.string(), url: v.string() }).index('by_storage', ['storageId']).index('by_url', ['url']),
  domainRecords: defineTable({
    kind: v.string(), key: v.string(), ownerId: v.string(), placeId: v.optional(v.string()), data: v.any(),
  }).index("by_kind", ["kind"]).index("by_key", ["kind", "key"]).index("by_owner", ["kind", "ownerId"]).index("by_place", ["kind", "placeId"]),
  rateLimits: defineTable({ userId: v.string(), operation: v.string(), start: v.number(), count: v.number() }).index("by_user_operation", ["userId", "operation"]),
  // Tasks table (quick queries and mutations)
  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
  }),

  // Relok8 Leases table (for live lease takeover listings)
  leases: defineTable({
    landlordUserId: v.optional(v.string()),
    placeState: v.optional(v.any()),
    ownerId: v.optional(v.string()),
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
    isLocked: v.boolean(),
    lockedUntil: v.optional(v.number()),
    lockedByUserId: v.optional(v.string()),
    reservedByName: v.optional(v.string()),
    status: v.string(), // "AVAILABLE" | "PENDING_HOLD" | "TRANSFERRED"
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
    createdAt: v.optional(v.number()),
  }),

  // Relok8 Listings table (atomic holds and real-time reactive sync)
  listings: defineTable({
    ownerId: v.optional(v.string()),
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

// Convex is the only data backend.
  profiles: defineTable({
    userId: v.string(), // Clerk ID or custom user identifier
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    whatsappNumber: v.optional(v.string()),
    isVerified: v.boolean(),
    role: v.optional(v.string()), // 'student' | 'departing_tenant' | 'landlord'
    university: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  }).index("by_userId", ["userId"]),

// Convex is the only data backend.
  inquiries: defineTable({
    listingId: v.string(),
    userId: v.optional(v.string()),
    tenantName: v.string(),
    tenantEmail: v.string(),
    message: v.string(),
    status: v.string(), // "pending" | "viewing_scheduled" | "handover_agreed"
    replies: v.optional(
      v.array(
        v.object({
          sender: v.string(),
          text: v.string(),
          sentAt: v.string(),
        })
      )
    ),
    createdAt: v.number(),
  })
    .index("by_listingId", ["listingId"])
    .index("by_userId", ["userId"]),

// Convex is the only data backend.
  favorites: defineTable({
    userId: v.string(),
    listingId: v.string(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_listingId", ["listingId"])
    .index("by_user_listing", ["userId", "listingId"]),

  // Reservations table (early lock and deposit holding)
  reservations: defineTable({
    listingId: v.string(),
    studentName: v.string(),
    studentPhone: v.string(),
    amountGrosze: v.number(),
    stripePaymentIntentId: v.string(),
    status: v.string(), // "PENDING_HOLD" | "LANDLORD_APPROVED" | "EXPIRED" | "CANCELLED"
    addons: v.object({
      verificationPassport: v.boolean(),
      meldunekPack: v.boolean(),
    }),
    expiresAt: v.number(),
    createdAt: v.number(),
  }),

// Convex is the only data backend.
  escrowTransactions: defineTable({
    listingId: v.string(),
    studentUserId: v.string(),
    amountPLN: v.number(),
    status: v.string(), // "HELD_IN_ESCROW" | "RELEASED_TO_LANDLORD" | "REFUNDED"
    stripePaymentIntentId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_listingId", ["listingId"]),

  // AI Moderation Runs and Chat Messages
  aiMessages: defineTable({
    userId: v.optional(v.string()),
    listingId: v.string(),
    sender: v.string(), // "user" | "ai"
    content: v.string(),
    functionExecuted: v.optional(v.string()),
    timestamp: v.number(),
  }),

  aiRuns: defineTable({
    listingId: v.optional(v.string()),
    runType: v.string(),
    status: v.string(),
    result: v.optional(v.string()),
    score: v.optional(v.number()),
    createdAt: v.number(),
  }),

  reviewQueue: defineTable({
    listingId: v.string(),
    reason: v.string(),
    status: v.string(),
    createdAt: v.number(),
  }),

  // Email Alert Subscribers table (for filtered city notifications)
  subscribers: defineTable({
    email: v.string(),
    city: v.string(), // "All Poland", "Warsaw", "Kraków", etc.
    active: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_city", ["city"])
    .index("by_email_city", ["email", "city"]),
});
