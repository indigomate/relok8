import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  uploads: defineTable({ storageId: v.id('_storage'), ownerId: v.string(), url: v.string() }).index('by_storage', ['storageId']).index('by_url', ['url']),
  domainRecords: defineTable({
    kind: v.string(), key: v.string(), ownerId: v.string(), placeId: v.optional(v.string()), data: v.any(),
  }).index("by_kind", ["kind"]).index("by_key", ["kind", "key"]).index("by_owner", ["kind", "ownerId"]).index("by_place", ["kind", "placeId"]),
  rateLimits: defineTable({ userId: v.string(), operation: v.string(), start: v.number(), count: v.number() }).index("by_user_operation", ["userId", "operation"]),
  translationCache: defineTable({
    sourceHash: v.string(),
    targetLocale: v.union(v.literal("en"), v.literal("pl")),
    translatedText: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_hash_locale", ["sourceHash", "targetLocale"]),
  onloKnowledge: defineTable({
    slug: v.string(),
    category: v.string(),
    jurisdiction: v.string(),
    titleEn: v.string(),
    titlePl: v.string(),
    answerEn: v.string(),
    answerPl: v.string(),
    keywords: v.array(v.string()),
    sourceLabelEn: v.string(),
    sourceLabelPl: v.string(),
    sourceUrl: v.optional(v.string()),
    sourceKind: v.union(v.literal("official"), v.literal("internal")),
    legalDisclaimer: v.boolean(),
    lastVerifiedAt: v.number(),
    active: v.boolean(),
    version: v.number(),
    ragVersion: v.optional(v.number()),
    ragEntryId: v.optional(v.string()),
    ragSyncedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_active", ["active"])
    .index("by_category", ["category"]),
  onloSessions: defineTable({
    userId: v.string(),
    scope: v.union(v.literal("general"), v.literal("listing"), v.literal("application"), v.literal("thread")),
    scopeId: v.optional(v.string()),
    locale: v.union(v.literal("en"), v.literal("pl")),
    summary: v.optional(v.string()),
    lastIntent: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_scope", ["userId", "scope", "scopeId"]),
  onloSessionMessages: defineTable({
    sessionId: v.id("onloSessions"),
    userId: v.string(),
    role: v.union(v.literal("user"), v.literal("onlo")),
    content: v.string(),
    sources: v.optional(v.array(v.object({
      id: v.string(),
      label: v.string(),
      url: v.optional(v.string()),
      kind: v.union(v.literal("official"), v.literal("internal")),
    }))),
    runId: v.optional(v.id("onloRuns")),
    createdAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_user", ["userId"]),
  onloPreferences: defineTable({
    userId: v.string(),
    memoryEnabled: v.boolean(),
    locale: v.optional(v.union(v.literal("en"), v.literal("pl"))),
    cities: v.optional(v.array(v.string())),
    roomTypes: v.optional(v.array(v.string())),
    maxMonthlyRent: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
  onloRuns: defineTable({
    userId: v.string(),
    sessionId: v.optional(v.id("onloSessions")),
    scope: v.string(),
    intent: v.string(),
    status: v.union(v.literal("completed"), v.literal("failed")),
    toolNames: v.array(v.string()),
    sourceIds: v.array(v.string()),
    model: v.optional(v.string()),
    latencyMs: v.number(),
    citationStatus: v.string(),
    confidence: v.string(),
    needsHuman: v.boolean(),
    feedback: v.optional(v.union(v.literal("helpful"), v.literal("not_helpful"))),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"]),
  onloDrafts: defineTable({
    userId: v.string(),
    threadId: v.string(),
    content: v.string(),
    status: v.union(v.literal("draft"), v.literal("discarded")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_thread", ["threadId"]),
  // Relok8 Leases table (for live lease takeover listings)
  leases: defineTable({
    occupancyStatus: v.optional(v.union(v.literal("occupied"), v.literal("vacant"))),
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
    billsMode: v.optional(v.union(v.literal("included"), v.literal("fixed"), v.literal("usage"))),
    fixedBillsPLN: v.optional(v.number()),
    isFurnished: v.optional(v.boolean()),
    flatmatesCount: v.optional(v.number()),
    distanceToCampus: v.optional(v.string()),
    meldunekAllowed: v.optional(v.boolean()),
    landlordName: v.optional(v.string()),
    landlordContactEmail: v.optional(v.string()),
    landlordContactPhone: v.optional(v.string()),
    universitiesNearby: v.optional(v.array(v.string())),
    transitNearby: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  }).index("by_status", ["status"]),

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
    billsMode: v.optional(v.union(v.literal("included"), v.literal("fixed"), v.literal("usage"))),
    fixedBillsPLN: v.optional(v.number()),
    isFurnished: v.optional(v.boolean()),
    flatmatesCount: v.optional(v.number()),
    distanceToCampus: v.optional(v.string()),
    meldunekAllowed: v.optional(v.boolean()),
    landlordName: v.optional(v.string()),
    landlordContactEmail: v.optional(v.string()),
    landlordContactPhone: v.optional(v.string()),
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
    locale: v.optional(v.union(v.literal("en"), v.literal("pl"))),
    avatarUrl: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    whatsappNumber: v.optional(v.string()),
    isVerified: v.boolean(),
    role: v.optional(v.string()), // 'student' | 'departing_tenant' | 'landlord'
    university: v.optional(v.string()),
    emailUnreadMessages: v.optional(v.boolean()),
    emailListingReminders: v.optional(v.boolean()),
    emailWeeklyDigest: v.optional(v.boolean()),
    marketingConsent: v.optional(v.boolean()),
    marketingConsentVersion: v.optional(v.string()),
    marketingConsentedAt: v.optional(v.number()),
    marketingConsentSource: v.optional(v.string()),
    marketingUnsubscribedAt: v.optional(v.number()),
    digestCities: v.optional(v.array(v.string())),
    digestRoomTypes: v.optional(v.array(v.string())),
    digestMaxMonthlyRent: v.optional(v.number()),
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
    sources: v.optional(v.array(v.object({
      id: v.string(),
      label: v.string(),
      url: v.optional(v.string()),
      kind: v.union(v.literal("official"), v.literal("internal")),
    }))),
    functionExecuted: v.optional(v.string()),
    runId: v.optional(v.id("onloRuns")),
    confidence: v.optional(v.union(v.literal("verified"), v.literal("partial"), v.literal("unverified"))),
    needsHuman: v.optional(v.boolean()),
    suggestedActions: v.optional(v.array(v.object({
      id: v.string(),
      label: v.string(),
      kind: v.union(v.literal("ask"), v.literal("review"), v.literal("navigate")),
      prompt: v.optional(v.string()),
      href: v.optional(v.string()),
      requiresConfirmation: v.boolean(),
    }))),
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

  // Explicit WhatsApp opt-in and apartment-digest preferences.
  whatsappSubscriptions: defineTable({
    userId: v.string(),
    displayName: v.optional(v.string()),
    phoneE164: v.string(),
    cities: v.array(v.string()),
    roomTypes: v.array(v.string()),
    maxMonthlyRent: v.optional(v.number()),
    locale: v.union(v.literal("en"), v.literal("pl")),
    timeZone: v.string(),
    sendHourLocal: v.number(),
    dailyDigestEnabled: v.optional(v.boolean()),
    messageNotificationsEnabled: v.optional(v.boolean()),
    active: v.boolean(),
    consentVersion: v.string(),
    consentedAt: v.number(),
    consentSource: v.string(),
    optedOutAt: v.optional(v.number()),
    lastDigestAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_phone", ["phoneE164"])
    .index("by_active", ["active"]),

  // Durable, idempotent delivery ledger. Phone numbers stay on subscriptions;
  // delivery rows contain only the minimum provider metadata needed to retry.
  whatsappDeliveries: defineTable({
    subscriptionId: v.id("whatsappSubscriptions"),
    userId: v.string(),
    kind: v.union(v.literal("daily_apartment_digest"), v.literal("new_message"), v.literal("landlord_approval")),
    deliveryKey: v.optional(v.string()),
    threadId: v.optional(v.string()),
    senderName: v.optional(v.string()),
    listingTitle: v.optional(v.string()),
    digestDate: v.string(),
    listingIds: v.array(v.string()),
    status: v.union(
      v.literal("queued"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("read"),
      v.literal("failed"),
      v.literal("skipped")
    ),
    attempts: v.number(),
    providerMessageId: v.optional(v.string()),
    errorCode: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    sentAt: v.optional(v.number()),
  })
    .index("by_subscription_date", ["subscriptionId", "digestDate"])
    .index("by_subscription_kind_date", ["subscriptionId", "kind", "digestDate"])
    .index("by_subscription_delivery_key", ["subscriptionId", "deliveryKey"])
    .index("by_provider_message", ["providerMessageId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // Small idempotency ledger for Meta webhook events; raw webhook payloads and
  // message bodies are intentionally not retained.
  whatsappWebhookEvents: defineTable({
    eventId: v.string(),
    eventType: v.string(),
    receivedAt: v.number(),
  }).index("by_event", ["eventId"]),

  // Durable, idempotent application email delivery ledger. Template payloads
  // are removed after a successful handoff to Resend.
  emailDeliveries: defineTable({
    idempotencyKey: v.string(),
    userId: v.optional(v.string()),
    recipient: v.string(),
    template: v.union(
      v.literal("account_verification"),
      v.literal("sign_in_code"),
      v.literal("password_reset"),
      v.literal("welcome"),
      v.literal("listing_nudge"),
      v.literal("landlord_invitation"),
      v.literal("takeover_request"),
      v.literal("takeover_approved"),
      v.literal("takeover_declined"),
      v.literal("handover_action"),
      v.literal("handover_complete"),
      v.literal("unread_message"),
      v.literal("listing_published"),
      v.literal("listing_expiry"),
      v.literal("support_received"),
      v.literal("weekly_digest")
    ),
    locale: v.union(v.literal("en"), v.literal("pl")),
    category: v.union(
      v.literal("security"),
      v.literal("transactional"),
      v.literal("product"),
      v.literal("marketing")
    ),
    templateData: v.optional(v.any()),
    relatedId: v.optional(v.string()),
    status: v.union(
      v.literal("queued"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed"),
      v.literal("bounced"),
      v.literal("complained"),
      v.literal("suppressed")
    ),
    attempts: v.number(),
    providerMessageId: v.optional(v.string()),
    errorCode: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    sentAt: v.optional(v.number()),
  })
    .index("by_idempotency", ["idempotencyKey"])
    .index("by_provider_message", ["providerMessageId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // Minimal webhook idempotency ledger. Raw provider payloads are never retained.
  emailWebhookEvents: defineTable({
    eventId: v.string(),
    eventType: v.string(),
    providerMessageId: v.optional(v.string()),
    receivedAt: v.number(),
  }).index("by_event", ["eventId"]),

  // Provider complaints and hard bounces suppress future sends. This table keeps
  // only the normalized address and reason required to protect deliverability.
  emailSuppressions: defineTable({
    email: v.string(),
    reason: v.union(v.literal("bounce"), v.literal("complaint"), v.literal("manual")),
    providerMessageId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"]),
});
