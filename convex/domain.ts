import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./lib/auth";
import { DEFAULT_REWARD_CONFIG, DEFAULT_INSURANCE_CONFIG } from "../src/types/relok8";

const text = (value: unknown, max = 10000): string => {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error('Invalid text');
  return value.trim();
};
const landlord = (lease: any, identity: any): boolean => lease.landlordUserId === identity.subject || (identity.emailVerified === true && !!identity.email && lease.landlordContactEmail?.toLowerCase() === identity.email.toLowerCase());
const owns = (lease: any, identity: any): boolean => lease.ownerId === identity.subject;
async function leaseFor(ctx: any, placeId: string) {
  const id = ctx.db.normalizeId('leases', placeId);
  const lease = id ? await ctx.db.get(id) : null;
  if (!lease) throw new Error('Place not found');
  return lease;
}
function allow(lease: any, identity: any, role?: string) {
  if (!(role === 'tenant' ? owns(lease, identity) : role === 'landlord' ? landlord(lease, identity) : owns(lease, identity) || landlord(lease, identity))) throw new Error('Forbidden');
}
async function record(ctx: any, kind: string, key: string) {
  return ctx.db.query('domainRecords').withIndex('by_key', (q: any) => q.eq('kind', kind).eq('key', key)).unique();
}
async function records(ctx: any, kind: string): Promise<any[]> {
  return ctx.db.query('domainRecords').withIndex('by_kind', (q: any) => q.eq('kind', kind)).collect();
}
async function put(ctx: any, kind: string, key: string, ownerId: string, data: any, placeId?: string) {
  const existing = await record(ctx, kind, key);
  if (existing) await ctx.db.patch(existing._id, { data });
  else await ctx.db.insert('domainRecords', { kind, key, ownerId, data, ...(placeId ? { placeId } : {}) });
  return data;
}
function toPlace(lease: any, identity: any) {
  const state = lease.placeState || {};
  return { id: lease._id, tenantId: lease.ownerId || '', landlordId: landlord(lease, identity) ? identity.subject : lease.landlordUserId || '', title: lease.title, city: lease.city, district: lease.district || '', address: lease.address, rentPLN: lease.monthlyRent, czynszPLN: lease.czynszAdmin || 0, depositPLN: lease.deposit, availableFrom: lease.moveInDate, roomType: lease.roomType, flatmates: lease.flatmatesCount || 0, furnished: !!lease.isFurnished, billsIncluded: !!lease.billsIncluded, meldunekOk: !!lease.meldunekAllowed, commuteNote: lease.distanceToCampus || '', nearInstitutions: lease.universitiesNearby || [], photos: lease.images || [], rules: lease.description || '', status: state.status || 'available_for_takeover', ...(owns(lease, identity) || landlord(lease, identity) ? state : {}) };
}
async function notify(ctx: any, recipient: string | undefined, placeId: string, body: string) {
  if (!recipient) return;
  const id = `${Date.now()}-${placeId}-${recipient}-${Math.random().toString(36).slice(2)}`;
  await put(ctx, 'notification', id, recipient, { id, userId: recipient, type: 'system', placeId, body, createdAt: Date.now() }, placeId);
}
async function authorizedThread(ctx: any, id: string, identity: any) {
  const row = await record(ctx, 'thread', id);
  if (!row) throw new Error('Thread not found');
  const lease = await leaseFor(ctx, row.placeId);
  if (row.ownerId !== identity.subject && !owns(lease, identity) && !landlord(lease, identity)) throw new Error('Forbidden');
  return { row, lease };
}
export async function consume(ctx: any, identity: any, operation: string, limit = 30) {
  const now = Date.now();
  const bucket = await ctx.db.query('rateLimits').withIndex('by_user_operation', (q: any) => q.eq('userId', identity.subject).eq('operation', operation)).unique();
  if (bucket && now - bucket.start < 60000 && bucket.count >= limit) throw new Error('Too many requests; please try again later');
  if (bucket) await ctx.db.patch(bucket._id, now - bucket.start >= 60000 ? { start: now, count: 1 } : { count: bucket.count + 1 });
  else await ctx.db.insert('rateLimits', { userId: identity.subject, operation, start: now, count: 1 });
}
export const quota = internalMutation({ args: { operation: v.string(), limit: v.number() }, handler: async (ctx, args) => { const identity = await requireIdentity(ctx); await consume(ctx, identity, args.operation, args.limit); } });

export const read = query({
  args: { operation: v.string(), input: v.any() },
  handler: async (ctx, { operation, input }) => {
    const identity = await requireIdentity(ctx);
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid input');
    switch (operation) {
      case 'currentUser': {
        const settings = (await record(ctx, 'settings', identity.subject))?.data || {};
        const leases = await ctx.db.query('leases').collect();
        const role = leases.some(l => landlord(l, identity)) ? 'landlord' : leases.some(l => owns(l, identity)) ? 'tenant' : 'prospect';
        return { id: identity.subject, name: identity.name || 'User', email: identity.email || '', avatar: identity.pictureUrl || '', role, isVerified: false, isAvailable: true, ...settings };
      }
      case 'places': {
        const leases = await ctx.db.query('leases').collect();
        const prospectPlaces = input.includeProspects ? new Set((await ctx.db.query('domainRecords').withIndex('by_owner', q => q.eq('kind', 'thread').eq('ownerId', identity.subject)).collect()).map(r => r.placeId)) : new Set<string>();
        return leases.filter(l => owns(l, identity) || landlord(l, identity) || prospectPlaces.has(l._id)).map(l => toPlace(l, identity)).filter(p => (!input.city || p.city === input.city) && (!input.status || p.status === input.status));
      }
      case 'place': {
        const lease = await leaseFor(ctx, text(input.id, 100));
        allow(lease, identity);
        return toPlace(lease, identity);
      }
      case 'threads': {
        const rows = await records(ctx, 'thread');
        const result = [];
        for (const row of rows) {
          if (input.placeId && row.placeId !== input.placeId) continue;
          const lease = await leaseFor(ctx, row.placeId);
          if (row.ownerId === identity.subject || owns(lease, identity) || landlord(lease, identity)) result.push(row.data);
        }
        return result.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
      }
      case 'thread': return (await authorizedThread(ctx, text(input.id, 100), identity)).row.data;
      case 'messages': {
        const { row } = await authorizedThread(ctx, text(input.threadId, 100), identity);
        return (await records(ctx, 'message')).filter(r => r.data.threadId === row.key).map(r => r.data).sort((a, b) => a.createdAt - b.createdAt);
      }
      case 'roomMessages': {
        const lease = await leaseFor(ctx, text(input.placeId, 100)); allow(lease, identity);
        return (await records(ctx, 'message')).filter(r => r.data.threadId === `place-room-${lease._id}`).map(r => r.data).sort((a, b) => a.createdAt - b.createdAt);
      }
      case 'notifications': {
        const mine = await ctx.db.query('domainRecords').withIndex('by_owner', q => q.eq('kind', 'notification').eq('ownerId', identity.subject)).collect();
        const emailed = identity.emailVerified === true && identity.email ? await ctx.db.query('domainRecords').withIndex('by_owner', q => q.eq('kind', 'notification').eq('ownerId', `email:${identity.email!.toLowerCase()}`)).collect() : [];
        return [...mine, ...emailed].map(r => r.data);
      }
      case 'saved': return (await ctx.db.query('favorites').withIndex('by_userId', q => q.eq('userId', identity.subject)).collect()).map(f => ({ userId: identity.subject, placeId: f.listingId, notifyWhenAvailable: true, savedAt: f.createdAt }));
      case 'rewards': {
        if (input.userId && input.userId !== identity.subject) throw new Error('Forbidden');
        return { points: 0, unlocked: false, events: [], config: DEFAULT_REWARD_CONFIG, insuranceConfig: DEFAULT_INSURANCE_CONFIG };
      }
      case 'announcement': { const lease = await leaseFor(ctx, text(input.placeId, 100)); allow(lease, identity); return { id: `announcement-${lease._id}`, placeId: lease._id, text: `${lease.title} in ${lease.city}. Contact the tenant for availability and terms.`, channel: 'whatsapp', status: 'drafted', createdAt: lease.createdAt || lease._creationTime }; }
      default: throw new Error('Unknown query');
    }
  },
});

export const write = mutation({
  args: { operation: v.string(), input: v.any() },
  handler: async (ctx, { operation, input }) => {
    const identity = await requireIdentity(ctx);
    if (!input || typeof input !== 'object' || Array.isArray(input) || JSON.stringify(input).length > 100000) throw new Error('Invalid input');
    await consume(ctx, identity, operation, 30);
    const uid = identity.subject;
    const now = Date.now();
    if (operation === 'createThread') {
      const lease = await leaseFor(ctx, text(input.placeId, 100));
      if (owns(lease, identity) || landlord(lease, identity)) throw new Error('Use your place room to contact the other participant');
      const key = `${lease._id}:${uid}`;
      const existing = await record(ctx, 'thread', key);
      if (existing) return existing.data;
      return put(ctx, 'thread', key, uid, { id: key, placeId: lease._id, prospectId: uid, prospectName: identity.name || 'Prospect', status: 'open', handledBy: 'tenant', lastMessageAt: now, unreadFor: [] }, lease._id);
    }
    if (operation === 'sendMessage' || operation === 'takeover' || operation === 'askOnlo' || operation === 'markThreadRead') {
      const { row, lease } = await authorizedThread(ctx, text(input.threadId, 200), identity);
      if (operation === 'markThreadRead') { await put(ctx, 'thread', row.key, row.ownerId, { ...row.data, unreadFor: row.data.unreadFor.filter((id: string) => id !== uid) }, lease._id); return null; }
      if (operation === 'takeover') {
        allow(lease, identity);
        const thread = { ...row.data, handledBy: landlord(lease, identity) ? 'landlord' : 'tenant' };
        return put(ctx, 'thread', row.key, row.ownerId, thread, lease._id);
      }
      const isAssistant = operation === 'askOnlo';
      const body = isAssistant ? 'Please confirm availability, landlord consent, and deposit terms directly with the tenant or landlord. No payment has been taken through Relok8.' : text(input.body);
      const message = { id: `${now}-${row.key}-${Math.random().toString(36).slice(2)}`, threadId: row.key, authorId: isAssistant ? 'onlo' : uid, authorType: isAssistant ? 'onlo' : owns(lease, identity) ? 'tenant' : landlord(lease, identity) ? 'landlord' : 'prospect', body, createdAt: now };
      await put(ctx, 'message', message.id, uid, message, lease._id);
      const thread = { ...row.data, lastMessageAt: now, unreadFor: [lease.ownerId, lease.landlordUserId, row.ownerId].filter(id => id && id !== uid) };
      await put(ctx, 'thread', row.key, row.ownerId, thread, lease._id);
      for (const recipient of thread.unreadFor) {
        const notification = { id: `${message.id}:${recipient}`, userId: recipient, type: 'message', placeId: lease._id, body: 'You have a new message', createdAt: now };
        await put(ctx, 'notification', notification.id, recipient, notification, lease._id);
      }
      return isAssistant ? { reply: message, thread } : { message, thread };
    }
    if (operation === 'roomMessage') {
      const lease = await leaseFor(ctx, text(input.placeId, 100)); allow(lease, identity);
      const message = { id: `${now}-${uid}-${Math.random().toString(36).slice(2)}`, threadId: `place-room-${lease._id}`, authorId: uid, authorType: landlord(lease, identity) ? 'landlord' : 'tenant', body: text(input.body), createdAt: now };
      return put(ctx, 'message', message.id, uid, message, lease._id);
    }
    if (operation === 'markRead') {
      const row = await record(ctx, 'notification', text(input.id, 400));
      if (!row || (row.ownerId !== uid && !(identity.emailVerified === true && identity.email && row.ownerId === `email:${identity.email.toLowerCase()}`))) throw new Error('Forbidden');
      await put(ctx, 'notification', row.key, row.ownerId, { ...row.data, readAt: now }, row.placeId); return null;
    }
    if (operation === 'toggleSaved') {
      const lease = await leaseFor(ctx, text(input.placeId, 100));
      const existing = await ctx.db.query('favorites').withIndex('by_user_listing', q => q.eq('userId', uid).eq('listingId', lease._id)).unique();
      if (existing) { await ctx.db.delete(existing._id); return { saved: false }; }
      await ctx.db.insert('favorites', { userId: uid, listingId: lease._id, createdAt: now }); return { saved: true };
    }
    if (operation === 'availability') {
      if (typeof input.isAvailable !== 'boolean') throw new Error('Invalid availability');
      const quiet = input.quietHours;
      if (quiet && (typeof quiet.enabled !== 'boolean' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(quiet.start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(quiet.end))) throw new Error('Invalid quiet hours');
      const settings = { isAvailable: input.isAvailable, ...(quiet ? { quietHours: { enabled: quiet.enabled, start: quiet.start, end: quiet.end } } : {}) };
      await put(ctx, 'settings', uid, uid, settings);
      return { id: uid, name: identity.name || 'User', email: identity.email || '', role: 'prospect', avatar: identity.pictureUrl || '', isVerified: false, ...settings };
    }
    if (operation === 'acceptInvitation') {
      const token = text(input.token, 200);
      const row = await record(ctx, 'invitation', token);
      if (!row || row.data.acceptedAt || now - row.data.createdAt > 7 * 86400000 || identity.emailVerified !== true || identity.email?.toLowerCase() !== row.data.email.toLowerCase()) throw new Error('Invalid or expired invitation');
      const lease = await leaseFor(ctx, row.placeId);
      if (row.data.role === 'landlord') await ctx.db.patch(lease._id, { landlordUserId: uid, landlordContactEmail: identity.email });
      else await ctx.db.patch(lease._id, { ownerId: uid });
      await ctx.db.patch(row._id, { data: { ...row.data, acceptedAt: now } });
      return { success: true, place: toPlace(await ctx.db.get(lease._id), identity) };
    }
    const lease = await leaseFor(ctx, text(input.placeId, 100));
    if (operation === 'invitation') {
      allow(lease, identity, input.role === 'landlord' ? 'tenant' : 'landlord');
      if (!['tenant','landlord'].includes(input.role) || typeof input.email !== 'string' || input.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) throw new Error('Invalid invitation');
      // Random token generated by the browser CSPRNG; bound to verified recipient email and expires after 7 days.
      if (typeof input.token !== 'string' || !/^[a-f0-9]{64}$/.test(input.token)) throw new Error('Invalid invitation token');
      if (await record(ctx, 'invitation', input.token)) throw new Error('Token already used');
      return put(ctx, 'invitation', input.token, uid, { id: input.token, placeId: lease._id, role: input.role, email: input.email.toLowerCase(), token: input.token, createdAt: now }, lease._id);
    }
    if (operation === 'deletePlace') {
      allow(lease, identity, 'tenant');
      await removeLease(ctx, lease);
      return true;
    }
    const state = { ...(lease.placeState || {}) };
    if (operation === 'requestExit') { allow(lease, identity, 'tenant'); if (!/^\d{4}-\d{2}-\d{2}$/.test(input.leaveDate) || Number.isNaN(Date.parse(input.leaveDate))) throw new Error('Invalid leave date'); if (state.status === 'exit_requested') throw new Error('Exit already requested'); state.status = 'exit_requested'; state.leaveDate = input.leaveDate; state.exitNotes = typeof input.notes === 'string' ? text(input.notes, 2000) : ''; }
    else if (operation === 'cancelExit') { allow(lease, identity, 'tenant'); if (state.status !== 'exit_requested') throw new Error('No pending exit'); state.status = 'occupied'; }
    else if (operation === 'decideExit') { allow(lease, identity, 'landlord'); if (state.status !== 'exit_requested') throw new Error('No pending exit'); if (!['approve','decline','suggest_date'].includes(input.decision)) throw new Error('Invalid decision'); state.status = input.decision === 'approve' ? 'available_for_takeover' : 'occupied'; if (input.decision === 'suggest_date') { if (!/^\d{4}-\d{2}-\d{2}$/.test(input.reasonOrDate)) throw new Error('Invalid date'); state.leaveDate = input.reasonOrDate; } }
    else if (operation === 'approveReplacement') { allow(lease, identity, 'landlord'); const thread = (await records(ctx, 'thread')).find(r => r.placeId === lease._id && r.ownerId === input.prospectId); if (!thread) throw new Error('Prospect has not requested this place'); state.replacementProspectId = thread.ownerId; state.status = 'reserved'; }
    else if (operation === 'checklist') { allow(lease, identity); const checks = { ...(state.handoverChecklist || {}) }; for (const key of ['agreementSigned','depositTransferred','keysHandedOver','meldunekCompleted']) if (key in input.checklist) { if (typeof input.checklist[key] !== 'boolean') throw new Error('Invalid checklist'); checks[key] = input.checklist[key]; } state.handoverChecklist = checks; }
    else if (operation === 'updatePlace') {
      allow(lease, identity, 'tenant'); const data = input.updates;
      const patch: any = {};
      const mapping: any = { title: 'title', address: 'address', district: 'district', city: 'city', rules: 'description', roomType: 'roomType', commuteNote: 'distanceToCampus', availableFrom: 'moveInDate' };
      for (const [source, target] of Object.entries(mapping)) if (source in data) patch[target as string] = text(data[source], source === 'rules' ? 10000 : 500);
      for (const [source, target] of Object.entries({ rentPLN: 'monthlyRent', czynszPLN: 'czynszAdmin', depositPLN: 'deposit' })) if (source in data) { if (typeof data[source] !== 'number' || !Number.isFinite(data[source]) || data[source] < 0 || data[source] > 1000000) throw new Error('Invalid amount'); patch[target] = data[source]; }
      await ctx.db.patch(lease._id, patch);
      return toPlace(await ctx.db.get(lease._id), identity);
    }
    else if (operation === 'shareAnnouncement') { allow(lease, identity); const announcement = { id: `announcement-${lease._id}`, placeId: lease._id, text: `${lease.title} in ${lease.city}. Contact the tenant for availability and terms.`, channel: 'whatsapp', status: 'drafted', createdAt: now }; return { channelUrl: `https://wa.me/?text=${encodeURIComponent(announcement.text)}`, announcement }; }
    else throw new Error('Unknown mutation');
    await ctx.db.patch(lease._id, { placeState: state });
    if (operation === 'requestExit') await notify(ctx, lease.landlordUserId || (lease.landlordContactEmail ? `email:${lease.landlordContactEmail.toLowerCase()}` : undefined), lease._id, 'The tenant requested an early exit. Review the request in My Place.');
    if (operation === 'decideExit') await notify(ctx, lease.ownerId, lease._id, 'Your landlord responded to your exit request. Review the decision in My Place.');
    if (operation === 'approveReplacement') await notify(ctx, state.replacementProspectId, lease._id, 'The landlord approved your replacement request. Confirm the agreement and deposit arrangements directly.');
    return toPlace(await ctx.db.get(lease._id), identity);
  },
});

export async function removeLease(ctx: any, lease: any) {
  await ctx.db.delete(lease._id);
  for (const row of await ctx.db.query('domainRecords').withIndex('by_place', (q: any) => q.eq('kind', 'thread').eq('placeId', lease._id)).collect()) await ctx.db.delete(row._id);
  for (const row of await ctx.db.query('domainRecords').collect()) if (row.placeId === lease._id) await ctx.db.delete(row._id);
  for (const row of await ctx.db.query('favorites').withIndex('by_listingId', (q: any) => q.eq('listingId', lease._id)).collect()) await ctx.db.delete(row._id);
  for (const row of await ctx.db.query('inquiries').withIndex('by_listingId', (q: any) => q.eq('listingId', lease._id)).collect()) await ctx.db.delete(row._id);
  for (const row of await ctx.db.query('aiMessages').collect()) if (row.listingId === lease._id) await ctx.db.delete(row._id);
  const remaining = await ctx.db.query('leases').collect();
  for (const url of lease.images || []) {
    if (remaining.some((other: any) => other.images?.includes(url))) continue;
    const upload = await ctx.db.query('uploads').withIndex('by_url', (q: any) => q.eq('url', url)).unique();
    if (upload && upload.ownerId === lease.ownerId) { await ctx.storage.delete(upload.storageId); await ctx.db.delete(upload._id); }
  }
}
