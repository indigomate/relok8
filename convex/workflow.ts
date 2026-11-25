import { validLeaseDates, leaseHasEnded } from '../src/utils/leaseTiming';
import { query, mutation, action, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { lookupClerkContact } from "./lib/clerkIdentity";
import { findInvitation } from "./lib/invitations";
import {
  requireIdentity,
  isLandlord,
  requireOwner,
  requireLandlord,
  requireAdmin,
} from "./lib/auth";
import { consume } from "./domain";
import { queueEmailDelivery } from './emails';
import {
  emailLocale,
  getEmailContact,
  rememberEmailContact,
  type EmailContact,
} from './lib/emailContacts';
import { RELOK8_LAUNCH_PRICING } from '../src/config/pricing';
import { appOrigin } from './lib/appUrl';

const APP_ORIGIN = appOrigin();

function emailDate(timestamp: number, locale: 'en' | 'pl') {
  return new Intl.DateTimeFormat(locale === 'pl' ? 'pl-PL' : 'en-GB', {
    dateStyle: 'long',
    timeZone: 'Europe/Warsaw',
  }).format(new Date(timestamp));
}

async function queueWorkflowEmail(ctx: any, args: Parameters<typeof queueEmailDelivery>[1]) {
  return queueEmailDelivery(ctx, {
    ...args,
    // Reserved test recipients never leave the test runner.
    scheduleDelivery: !args.recipient.endsWith('.test'),
  });
}

async function workflowContacts(ctx: any, l: any, application: any, fallbackLocale: unknown) {
  const locale = emailLocale(fallbackLocale);
  const applicant = application ? await getEmailContact(ctx, application.ownerId) : null;
  const tenant = await getEmailContact(ctx, l.ownerId);
  const landlordProfile = await getEmailContact(ctx, l.landlordUserId);
  const landlord: EmailContact | null = landlordProfile || (l.landlordContactEmail ? {
    userId: l.landlordUserId || `landlord:${l._id}`,
    email: l.landlordContactEmail.trim().toLowerCase(),
    name: l.landlordName?.trim() || (locale === 'pl' ? 'Wynajmujący' : 'Landlord'),
    locale,
  } : null);
  return [
    { role: 'applicant', contact: applicant },
    { role: 'tenant', contact: tenant },
    { role: 'landlord', contact: landlord },
  ].filter((entry): entry is { role: string; contact: EmailContact } => !!entry.contact);
}
const expired = (r: any) =>
  r.data.status === "requested" && r.data.expiresAt < Date.now();
async function rows(ctx: any, kind: string) {
  return ctx.db
    .query("domainRecords")
    .withIndex("by_kind", (q: any) => q.eq("kind", kind))
    .collect();
}
async function lease(ctx: any, id: string) {
  const key = ctx.db.normalizeId("leases", id);
  const l = key ? await ctx.db.get(key) : null;
  if (!l) throw new Error("Listing unavailable");
  return l;
}
async function event(ctx: any, placeId: string, uid: string, action: string) {
  await ctx.db.insert("domainRecords", {
    kind: "workflow-event",
    key: crypto.randomUUID(),
    ownerId: uid,
    placeId,
    data: { action, at: Date.now(), actor: uid },
  });
}
async function notify(
  ctx: any,
  recipient: string | undefined,
  placeId: string,
  body: string,
) {
  if (!recipient) return;
  const id = crypto.randomUUID();
  await ctx.db.insert("domainRecords", {
    kind: "notification",
    key: id,
    ownerId: recipient,
    placeId,
    data: {
      id,
      userId: recipient,
      placeId,
      body,
      type: "system",
      createdAt: Date.now(),
    },
  });
}
export const activity = query({
  args: {},
  handler: async (ctx) => {
    const u = await requireIdentity(ctx);
    const applications = await rows(ctx, "application");
    const leases = await ctx.db.query("leases").collect();
    const profiles = await ctx.db.query('profiles').collect();
    const names = new Map(profiles.map((profile) => [profile.userId, profile.fullName]));
    return leases
      .filter(
        (l) =>
          l.ownerId === u.subject ||
          isLandlord(l, u) ||
          applications.some(
            (r: any) => r.placeId === l._id && r.ownerId === u.subject,
          ),
      )
      .map((l) => {
        const owner = l.ownerId === u.subject,
          landlord = isLandlord(l, u);
        const apps = applications.filter(
          (r: any) =>
            r.placeId === l._id &&
            (owner || landlord || r.ownerId === u.subject),
        );
        return {
          id: l._id,
          occupancyStatus: l.occupancyStatus,
          moveInDate: l.moveInDate,
          leaseEndDate: l.leaseEndDate,
          title: l.title,
          city: l.city,
          status: l.status,
          permission: (l.placeState as any)?.advertisingPermission === true,
          owner,
          landlord,
          landlordPhone: owner ? l.landlordContactPhone : undefined,
          landlordEmail: owner ? l.landlordContactEmail : undefined,
          applications: apps.map((r: any) => ({
            id: r._id,
            applicantId: r.ownerId,
            ...r.data,
            name: names.get(r.ownerId) || r.data.name,
            status: expired(r) ? "expired" : r.data.status,
          })),
          events: [],
        };
      });
  },
});
export const request = mutation({
  args: {
    listingId: v.string(),
    message: v.string(),
    locale: v.optional(v.union(v.literal('en'), v.literal('pl'))),
  },
  handler: async (ctx, a) => {
    const u = await requireIdentity(ctx);
    await rememberEmailContact(ctx, u, a.locale);
    await consume(ctx, u, "application", 10);
    const l = await lease(ctx, a.listingId);
    if (!validLeaseDates(l.moveInDate, l.leaseEndDate) || leaseHasEnded(l.leaseEndDate)) throw new Error("Current lease has ended or its dates need updating");
    if (l.ownerId === u.subject || isLandlord(l, u))
      throw new Error("You cannot apply to your own listing");
    if (!["AVAILABLE", "PENDING_HOLD", "RESERVED_PENDING"].includes(l.status))
      throw new Error("Listing is not accepting applications");
    if (!a.message.trim() || a.message.length > 3000)
      throw new Error(
        "Describe your proposed move-in and viewing arrangements",
      );
    const existing = (await rows(ctx, "application")).find(
      (r: any) =>
        r.placeId === l._id &&
        r.ownerId === u.subject &&
        ["requested", "approved", "completed"].includes(r.data.status) &&
        !expired(r),
    );
    if (existing) return existing._id;
    const threadId = l._id + ':' + u.subject;
    const thread = await ctx.db.query('domainRecords').withIndex('by_key', q => q.eq('kind','thread').eq('key',threadId)).unique();
    const now = Date.now();
    if(!thread) await ctx.db.insert('domainRecords',{kind:'thread',key:threadId,ownerId:u.subject,placeId:l._id,data:{id:threadId,placeId:l._id,prospectId:u.subject,prospectName:u.name||'Name unavailable',status:'open',handledBy:'tenant',lastMessageAt:now,unreadFor:[l.ownerId,l.landlordUserId].filter(Boolean)}});
    if(thread) await ctx.db.patch(thread._id, {data:{...thread.data,lastMessageAt:now,unreadFor:[l.ownerId,l.landlordUserId].filter(Boolean)}});
    const messageId=crypto.randomUUID();
    await ctx.db.insert('domainRecords',{kind:'message',key:messageId,ownerId:u.subject,placeId:l._id,data:{id:messageId,threadId,authorId:u.subject,authorType:'prospect',body:a.message.trim(),createdAt:now}});
    const applicationKey = crypto.randomUUID();
    const id = await ctx.db.insert("domainRecords", {
      kind: "application",
      key: applicationKey,
      ownerId: u.subject,
      placeId: l._id,
      data: {
        threadId,
        name: u.name || "Name unavailable",
        message: a.message.trim(),
        status: "requested",
        createdAt: now,
        updatedAt: now,
        expiresAt: now + 7 * 86400000,
        confirmations: {},
      },
    });
    await event(ctx, l._id, u.subject, "application requested");
    await notify(
      ctx,
      l.ownerId,
      l._id,
      "A takeover request is ready in My Place.",
    );
    await notify(
      ctx,
      l.landlordUserId ||
        (l.landlordContactEmail
          ? "email:" + l.landlordContactEmail.toLowerCase()
          : undefined),
      l._id,
      "Review a takeover request in My Place.",
    );
    const locale = emailLocale(a.locale);
    const recipients = await workflowContacts(ctx, l, null, locale);
    const seen = new Set<string>();
    for (const { role, contact } of recipients) {
      if (seen.has(contact.email)) continue;
      seen.add(contact.email);
      await queueWorkflowEmail(ctx, {
        idempotencyKey: `takeover-request:${applicationKey}:${role}`,
        userId: contact.userId,
        recipient: contact.email,
        template: 'takeover_request',
        locale: contact.locale,
        templateData: {
          recipientName: contact.name,
          applicantName: u.name || 'Name unavailable',
          listingTitle: l.title,
          city: l.city,
          expiryDate: emailDate(now + 7 * 86400000, contact.locale),
          ctaUrl: `${APP_ORIGIN}${contact.locale === 'pl' ? '/pl' : ''}/place`,
        },
        relatedId: String(id),
      });
    }
    return id;
  },
});
export const decide = mutation({
  args: {
    applicationId: v.id("domainRecords"),
    decision: v.union(
      v.literal("approved"),
      v.literal("declined"),
      v.literal("withdrawn"),
      v.literal("cancelled"),
    ),
    reason: v.string(),
    locale: v.optional(v.union(v.literal('en'), v.literal('pl'))),
  },
  handler: async (ctx, a) => {
    const u = await requireIdentity(ctx);
    await rememberEmailContact(ctx, u, a.locale);
    await consume(ctx, u, "application-decision", 20);
    const r = await ctx.db.get(a.applicationId);
    if (!r || r.kind !== "application" || !r.placeId)
      throw new Error("Request unavailable");
    const l = await lease(ctx, r.placeId);
    if (a.reason.length > 2000) throw new Error("Reason too long");
    if (a.decision === "withdrawn") {
      if (r.ownerId !== u.subject) throw new Error("Forbidden");
    } else {
      await requireLandlord(ctx, l);
    }
    if (!["requested", "approved"].includes(r.data.status) || expired(r))
      throw new Error("Request is no longer active");
    if (a.decision === "approved" && r.data.status !== "requested")
      throw new Error("Already decided");
    if (a.decision === "declined" && r.data.status !== "requested")
      throw new Error("Use cancellation for an approved request");
    if (a.decision === "cancelled" && r.data.status !== "approved")
      throw new Error("Only approved requests can be cancelled");
    if (a.decision !== "approved" && !a.reason.trim())
      throw new Error("Please explain the decision");
    if (a.decision === "approved") {
      if (!validLeaseDates(l.moveInDate, l.leaseEndDate) || leaseHasEnded(l.leaseEndDate)) throw new Error("Update the lease dates before approving a takeover");
      if (l.status === "APPROVED" || l.status === "TRANSFERRED")
        throw new Error("Another request has already been approved");
      await ctx.db.patch(l._id, {
        status: "APPROVED",
        isLocked: false,
        lockedUntil: undefined,
        lockedByUserId: undefined,
        reservedByName: undefined,
        placeState: {
          ...l.placeState,
          status: "reserved",
          workflowManaged: true,
          replacementProspectId: r.ownerId,
        },
      });
      for (const other of await rows(ctx, "application"))
        if (
          other.placeId === l._id &&
          other._id !== r._id &&
          other.data.status === "requested"
        ) {
          await ctx.db.patch(other._id, {
            data: {
              ...other.data,
              status: "declined",
              reason: "Another applicant was approved.",
              updatedAt: Date.now(),
            },
          });
          await notify(
            ctx,
            other.ownerId,
            l._id,
            "Another applicant was approved. See My Place.",
          );
        }
    } else if (r.data.status === "approved") {
      await ctx.db.patch(l._id, {
        status: "AVAILABLE",
        isLocked: false,
        placeState: {
          ...l.placeState,
          status: "available_for_takeover",
          replacementProspectId: null,
        },
      });
    }
    await ctx.db.patch(r._id, {
      data: {
        ...r.data,
        status: a.decision,
        reason: a.reason.trim(),
        updatedAt: Date.now(),
        decidedBy: u.subject,
        ...(a.decision === 'approved' ? {
          pricingSnapshot: {
            currency: RELOK8_LAUNCH_PRICING.currency,
            tenantReservationConfirmationGrosze: RELOK8_LAUNCH_PRICING.tenantReservationConfirmationGrosze,
            landlordActiveTenancyMonthlyGrosze: RELOK8_LAUNCH_PRICING.landlordActiveTenancyMonthlyGrosze,
            tenantTrigger: 'after_landlord_approval',
            landlordBillingStarts: 'move_in',
            capturedAt: Date.now(),
          },
        } : {}),
      },
    });
    await event(ctx, l._id, u.subject, "application " + a.decision);
    for (const who of new Set([r.ownerId, l.ownerId, l.landlordUserId]))
      await notify(
        ctx,
        who,
        l._id,
        "Takeover request updated. See My Place for the decision and next steps.",
      );
    const recipients = await workflowContacts(ctx, l, r, a.locale);
    const seen = new Set<string>();
    for (const { role, contact } of recipients) {
      if (seen.has(contact.email)) continue;
      seen.add(contact.email);
      await queueWorkflowEmail(ctx, {
        idempotencyKey: `takeover-decision:${r.key}:${a.decision}:${role}`,
        userId: contact.userId,
        recipient: contact.email,
        template: a.decision === 'approved' ? 'takeover_approved' : 'takeover_declined',
        locale: contact.locale,
        templateData: {
          recipientName: contact.name,
          listingTitle: l.title,
          city: l.city,
          decisionNote: a.reason.trim(),
          ctaUrl: `${APP_ORIGIN}${contact.locale === 'pl' ? '/pl' : ''}/place`,
        },
        relatedId: String(r._id),
      });
    }
  },
});
export const confirm = mutation({
  args: {
    applicationId: v.id("domainRecords"),
    step: v.union(
      v.literal("documents"),
      v.literal("deposit"),
      v.literal("keys"),
    ),
    confirmed: v.boolean(),
    locale: v.optional(v.union(v.literal('en'), v.literal('pl'))),
  },
  handler: async (ctx, a) => {
    const u = await requireIdentity(ctx);
    await rememberEmailContact(ctx, u, a.locale);
    const r = await ctx.db.get(a.applicationId);
    if (
      !r ||
      r.kind !== "application" ||
      !r.placeId ||
      r.data.status !== "approved"
    )
      throw new Error("An approved request is required");
    const l = await lease(ctx, r.placeId);
    const role =
      r.ownerId === u.subject
        ? "applicant"
        : isLandlord(l, u)
          ? "landlord"
          : l.ownerId === u.subject
            ? "tenant"
            : null;
    if (!role) throw new Error("Forbidden");
    const now = Date.now();
    const confirmations = { ...r.data.confirmations };
    if (confirmations[a.step]?.[role]?.confirmed === a.confirmed) return;
    const sequence = ["documents", "deposit", "keys"];
    const complete = (s: string) =>
      ["tenant", "landlord", "applicant"].every(
        (role) => confirmations[s]?.[role]?.confirmed,
      );
    if (
      a.confirmed &&
      sequence.slice(0, sequence.indexOf(a.step)).some((s) => !complete(s))
    )
      throw new Error(
        "All three participants must confirm the previous step first",
      );
    if (
      !a.confirmed &&
      sequence
        .slice(sequence.indexOf(a.step) + 1)
        .some((s) =>
          Object.values(confirmations[s] || {}).some((v: any) => v.confirmed),
        )
    )
      throw new Error("Correct later confirmations first");
    confirmations[a.step] = {
      ...confirmations[a.step],
      [role]: { confirmed: a.confirmed, at: now, actor: u.subject },
    };
    const completed = sequence.every(complete);
    await ctx.db.patch(r._id, {
      data: {
        ...r.data,
        confirmations,
        status: completed ? "completed" : "approved",
        updatedAt: now,
      },
    });
    if (completed)
      await ctx.db.patch(l._id, {
        status: "TRANSFERRED",
        placeState: { ...l.placeState, status: "handed_over" },
      });
    await event(
      ctx,
      l._id,
      u.subject,
      "participant reported " + a.step + " " + a.confirmed,
    );
    for (const who of new Set([r.ownerId, l.ownerId, l.landlordUserId]))
      await notify(
        ctx,
        who,
        l._id,
        completed
          ? "All participants reported handover complete."
          : "A participant updated handover confirmations in My Place.",
      );
    const recipients = await workflowContacts(ctx, l, r, a.locale);
    const seen = new Set<string>();
    for (const { role: recipientRole, contact } of recipients) {
      if (!completed && contact.email === u.email?.trim().toLowerCase()) continue;
      if (seen.has(contact.email)) continue;
      seen.add(contact.email);
      const stepLabel = contact.locale === 'pl'
        ? ({ documents: 'dokumenty', deposit: 'ustalenia kaucji', keys: 'klucze' } as const)[a.step]
        : ({ documents: 'documents', deposit: 'deposit arrangement', keys: 'keys' } as const)[a.step];
      await queueWorkflowEmail(ctx, {
        idempotencyKey: completed
          ? `handover-complete:${r.key}:${recipientRole}`
          : `handover-step:${r.key}:${a.step}:${role}:${a.confirmed}:${now}:${recipientRole}`,
        userId: contact.userId,
        recipient: contact.email,
        template: completed ? 'handover_complete' : 'handover_action',
        locale: contact.locale,
        templateData: {
          recipientName: contact.name,
          actorName: u.name || 'Relok8 member',
          listingTitle: l.title,
          city: l.city,
          stepLabel,
          ctaUrl: `${APP_ORIGIN}${contact.locale === 'pl' ? '/pl' : ''}/place`,
        },
        relatedId: String(r._id),
      });
    }
  },
});
export const publication = mutation({
  args: { listingId: v.string(), published: v.boolean() },
  handler: async (ctx, a) => {
    const l = await lease(ctx, a.listingId);
    const u = await requireOwner(ctx, l);
    if (!["AVAILABLE", "PAUSED"].includes(l.status))
      throw new Error(
        "Resolve the active handover before changing publication",
      );
    if (a.published && (!validLeaseDates(l.moveInDate, l.leaseEndDate) || leaseHasEnded(l.leaseEndDate))) throw new Error("Update the lease dates before publishing");
    await ctx.db.patch(l._id, { status: a.published ? "AVAILABLE" : "PAUSED" });
    await event(
      ctx,
      l._id,
      u.subject,
      a.published ? "listing published" : "listing paused",
    );
  },
});
export const permission = mutation({
  args: { listingId: v.string(), approved: v.boolean() },
  handler: async (ctx, a) => {
    const l = await lease(ctx, a.listingId);
    const u = await requireLandlord(ctx, l);
    await ctx.db.patch(l._id, {
      placeState: {
        ...l.placeState,
        advertisingPermission: a.approved,
        permissionAt: Date.now(),
        permissionBy: u.subject,
      },
    });
    await event(ctx, l._id, u.subject, "advertising permission " + a.approved);
    await notify(
      ctx,
      l.ownerId,
      l._id,
      "The landlord updated permission to advertise.",
    );
  },
});
export const report = mutation({
  args: { listingId: v.string(), reason: v.string() },
  handler: async (ctx, a) => {
    const u = await requireIdentity(ctx);
    await consume(ctx, u, "report", 5);
    await lease(ctx, a.listingId);
    if (a.reason.trim().length < 10 || a.reason.length > 3000)
      throw new Error("Describe the problem in 10–3000 characters");
    return ctx.db.insert("domainRecords", {
      kind: "report",
      key: crypto.randomUUID(),
      ownerId: u.subject,
      placeId: a.listingId,
      data: {
        reason: a.reason.trim(),
        status: "received",
        createdAt: Date.now(),
      },
    });
  },
});
export const myReports = query({
  args: {},
  handler: async (ctx) => {
    const u = await requireIdentity(ctx);
    return (await rows(ctx, "report"))
      .filter((r: any) => r.ownerId === u.subject)
      .map((r: any) => ({ id: r._id, listingId: r.placeId, ...r.data }));
  },
});
export const reviewReports = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return rows(ctx, "report");
  },
});
export const resolveReport = mutation({
  args: { id: v.id("domainRecords"), resolution: v.string() },
  handler: async (ctx, a) => {
    const u = await requireAdmin(ctx);
    const r = await ctx.db.get(a.id);
    if (
      !r ||
      r.kind !== "report" ||
      !a.resolution.trim() ||
      a.resolution.length > 3000
    )
      throw new Error("Invalid report resolution");
    await ctx.db.patch(r._id, {
      data: {
        ...r.data,
        status: "reviewed",
        resolution: a.resolution,
        reviewedAt: Date.now(),
        reviewedBy: u.subject,
      },
    });
  },
});

export const invitationPreviewVerified = action({
  args: { token: v.string() },
  handler: async (ctx, args): Promise<any> => {
    const identity = await requireIdentity(ctx);
    const result = await lookupClerkContact(identity.subject, process.env.CLERK_SECRET_KEY);
    if (!result.ok) return { error: 'Sign in with the intended verified email.' };
    return ctx.runQuery((internal as any).workflow.invitationPreviewInternal, { token: args.token, subject: identity.subject, email: result.contact.email });
  },
});
export const invitationPreviewInternal = internalQuery({
  args: { token: v.string(), subject: v.string(), email: v.string() },
  handler: async (ctx, a) => {
    const u = await requireIdentity(ctx);
    if (u.subject !== a.subject) throw new Error('Forbidden');
    const r = await findInvitation(ctx, a.token);
    if (!r || r.data.role !== 'landlord' || r.data.revokedAt || r.data.acceptedAt || Date.now() - r.data.createdAt > 7 * 86400000 || r.data.email.toLowerCase() !== a.email)
      return { error: 'This invitation is unavailable, expired or addressed to another account.' };
    const l = await lease(ctx, r.placeId!);
    if (r.ownerId !== l.ownerId || u.subject === l.ownerId || (l.landlordUserId && l.landlordUserId !== u.subject)) return { error: 'This invitation is unavailable or requires review.' };
    return { title: l.title, address: l.address, city: l.city, role: r.data.role };
  },
});
