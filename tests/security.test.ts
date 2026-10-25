import { describe, test, expect } from 'vitest';
import { convexTest } from 'convex-test';
import schema from '../convex/schema';
import { api } from '../convex/_generated/api';
const modules = import.meta.glob('../convex/**/*.{ts,js}');
const identity = (subject: string, email = `${subject}@example.test`, verified = true) => ({ subject, issuer: 'https://clerk.example.test', name: subject, email, emailVerified: verified });
const listing = { title: 'Student room', address: 'Test Street 1', city: 'Warsaw', monthlyRent: 2000, deposit: 2000, roomType: 'Studio', areaM2: 25, floor: 2, moveInDate: '2027-01-01', leaseEndDate: '2027-06-30', amenities: [], images: [], landlordContactEmail: 'landlord@example.test' };
function setup() { const t = convexTest(schema, modules); return { t, owner: t.withIdentity(identity('owner')), a: t.withIdentity(identity('a')), b: t.withIdentity(identity('b')), landlord: t.withIdentity(identity('landlord')) }; }
const read = (client: any, operation: string, input: any = {}) => client.query(api.domain.read, { operation, input });
const write = (client: any, operation: string, input: any = {}) => client.mutation(api.domain.write, { operation, input });

describe('authentication and ownership', () => {
  test('public catalog remains readable but anonymous writes are rejected', async () => {
    const { t } = setup();
    expect(await t.query(api.leases.get, {})).toEqual([]);
    await expect(t.mutation(api.leases.create, listing)).rejects.toThrow('Authentication required');
    await expect(read(t, 'threads')).rejects.toThrow('Authentication required');
  });
  test('only the creator can delete a lease', async () => {
    const { owner, a } = setup(); const id = await owner.mutation(api.leases.create, listing);
    await expect(a.mutation(api.leases.deleteLease, { id })).rejects.toThrow('Forbidden');
    expect((await owner.mutation(api.leases.deleteLease, { id })).success).toBe(true);
  });
  test('caller cannot impersonate another user in favorites or profiles', async () => {
    const { a } = setup();
    await expect(a.mutation(api.favorites.addFavorite, { userId: 'b', listingId: 'x' })).rejects.toThrow('Forbidden');
    await expect(a.mutation(api.profiles.upsertProfile, { userId: 'b', isVerified: true, role: 'landlord' })).rejects.toThrow('Forbidden');
  });
  test('profile writes cannot grant verification or privileged roles', async () => {
    const { a } = setup();
    await a.mutation(api.profiles.upsertProfile, { userId: 'a', isVerified: true, role: 'landlord', email: 'victim@example.test' });
    const profile = await a.query(api.profiles.getProfile, { userId: 'a' });
    expect(profile).toMatchObject({ isVerified: false, role: 'student', email: 'a@example.test' });
  });
  test('public catalog redacts private contact, ownership and workflow fields', async () => {
    const { t, owner } = setup(); const id = await owner.mutation(api.leases.create, listing);
    await t.run(async ctx => { await ctx.db.patch(id, { placeState: { exitNotes: 'private' } }); });
    const doc = await t.query(api.leases.getById, { id });
    expect(doc).not.toHaveProperty('ownerId'); expect(doc).not.toHaveProperty('landlordContactEmail'); expect(doc).not.toHaveProperty('placeState');
  });
  test('an arbitrary email cannot read landlord inventory', async () => {
    const { owner, a } = setup(); await owner.mutation(api.leases.create, listing);
    expect(await a.query(api.leases.getByLandlordEmail, { email: 'landlord@example.test' })).toEqual([]);
  });
});

describe('private messaging and invitations', () => {
  test('prospect and owner can message; an unrelated user cannot read or send', async () => {
    const { owner, a, b } = setup(); const placeId = await owner.mutation(api.leases.create, listing);
    const thread = await write(a, 'createThread', { placeId });
    await write(a, 'sendMessage', { threadId: thread.id, body: 'Can I view the room?' });
    expect((await read(owner, 'messages', { threadId: thread.id }))[0].body).toBe('Can I view the room?');
    await expect(read(b, 'messages', { threadId: thread.id })).rejects.toThrow('Forbidden');
    await expect(write(b, 'sendMessage', { threadId: thread.id, body: 'Spoof' })).rejects.toThrow('Forbidden');
  });
  test('private room uses the actual place ID and excludes prospects', async () => {
    const { owner, landlord, a } = setup(); const placeId = await owner.mutation(api.leases.create, listing);
    await write(owner, 'roomMessage', { placeId, body: 'Private contract question' });
    expect((await read(landlord, 'roomMessages', { placeId }))[0].body).toBe('Private contract question');
    await expect(read(a, 'roomMessages', { placeId })).rejects.toThrow('Forbidden');
  });
  test('tenant cannot perform landlord approval decisions', async () => {
    const { owner, landlord } = setup(); const placeId = await owner.mutation(api.leases.create, listing);
    await write(owner, 'requestExit', { placeId, leaveDate: '2027-02-01' });
    await expect(write(owner, 'decideExit', { placeId, decision: 'approve' })).rejects.toThrow('Forbidden');
    expect((await write(landlord, 'decideExit', { placeId, decision: 'approve' })).status).toBe('available_for_takeover');
  });
  test('invitation is bound to verified recipient and cannot be replayed', async () => {
    const { owner, a, landlord } = setup(); const placeId = await owner.mutation(api.leases.create, listing); const token = 'a'.repeat(64);
    await write(owner, 'invitation', { placeId, email: 'landlord@example.test', role: 'landlord', token });
    await expect(write(a, 'acceptInvitation', { token })).rejects.toThrow('Invalid or expired');
    expect((await write(landlord, 'acceptInvitation', { token })).success).toBe(true);
    await expect(write(landlord, 'acceptInvitation', { token })).rejects.toThrow('Invalid or expired');
  });
  test('only the notification recipient can mark it read', async () => {
    const { owner, a, b } = setup(); const placeId = await owner.mutation(api.leases.create, listing);
    const thread = await write(a, 'createThread', { placeId }); await write(a, 'sendMessage', { threadId: thread.id, body: 'Hello' });
    const [notification] = await read(owner, 'notifications');
    await expect(write(b, 'markRead', { id: notification.id })).rejects.toThrow('Forbidden');
    await write(owner, 'markRead', { id: notification.id });
    expect((await read(owner, 'notifications'))[0].readAt).toBeTypeOf('number');
  });
});

describe('reservations and unavailable services', () => {
  test('reservation identity is verified, holders cannot be displaced or extended', async () => {
    const { owner, a, b } = setup(); const leaseId = await owner.mutation(api.leases.create, listing);
    await expect(a.mutation(api.leases.reserve, { leaseId, userId: 'b' })).rejects.toThrow('Forbidden');
    const first = await a.mutation(api.leases.reserve, { leaseId, userId: 'a' });
    await expect(b.mutation(api.leases.reserve, { leaseId, userId: 'b' })).rejects.toThrow('held');
    await expect(b.mutation(api.leases.release, { leaseId })).rejects.toThrow('Forbidden');
    expect((await a.mutation(api.leases.reserve, { leaseId, userId: 'a' })).lockedUntil).toBe(first.lockedUntil);
    expect(await a.mutation(api.leases.release, { leaseId })).toBe(true);
  });
  test('landlord approval requires verified identity and an unexpired request', async () => {
    const { t, owner, a, landlord } = setup(); const leaseId = await owner.mutation(api.leases.create, listing);
    await a.mutation(api.leases.requestTakeover, { leaseId, studentName: 'A' });
    await expect(a.mutation(api.leases.approveTakeover, { leaseId })).rejects.toThrow('Forbidden');
    const unverified = t.withIdentity(identity('landlord', 'landlord@example.test', false));
    await expect(unverified.mutation(api.leases.approveTakeover, { leaseId })).rejects.toThrow('Forbidden');
    expect((await landlord.mutation(api.leases.approveTakeover, { leaseId })).success).toBe(true);
    await expect(a.mutation(api.leases.release, { leaseId })).rejects.toThrow('Forbidden');
  });
  test('invalid listings and destructive admin calls fail', async () => {
    const { owner, a } = setup();
    await expect(owner.mutation(api.leases.create, { ...listing, monthlyRent: -1 })).rejects.toThrow('Invalid');
    await expect(a.mutation(api.leases.clearAllLeases, {})).rejects.toThrow('Forbidden');
  });
  test('payment and WhatsApp endpoints never fabricate success', async () => {
    const { a } = setup();
    await expect(a.action(api.payments.createEscrowIntent, {})).rejects.toThrow('not enabled');
    await expect(a.mutation(api.payments.captureEscrow, {})).rejects.toThrow('not enabled');
    await expect(a.action(api.whatsapp.handleWebhookReply, {})).rejects.toThrow('not enabled');
  });
  test('subscriptions require the verified account email and cannot leak subscribers', async () => {
    const { a } = setup();
    await expect(a.mutation(api.subscribers.subscribe, { email: 'victim@example.test', city: 'Warsaw' })).rejects.toThrow('verified account');
    await a.mutation(api.subscribers.subscribe, { email: 'a@example.test', city: 'Warsaw' });
    await expect(a.query(api.subscribers.getAllSubscribers, {})).rejects.toThrow('Forbidden');
  });
});

describe('expiry, quotas, and data integrity', () => {
  test('an expired reservation can be acquired by a different user', async () => {
    const { t, owner, a, b } = setup(); const leaseId = await owner.mutation(api.leases.create, listing);
    await a.mutation(api.leases.reserve, { leaseId, userId: 'a' });
    await t.run(ctx => ctx.db.patch(leaseId, { lockedUntil: Date.now() - 1 }));
    expect((await b.mutation(api.leases.reserve, { leaseId, userId: 'b' })).success).toBe(true);
  });
  test('landlord cannot approve an expired request', async () => {
    const { t, owner, a, landlord } = setup(); const leaseId = await owner.mutation(api.leases.create, listing);
    await a.mutation(api.leases.requestTakeover, { leaseId, studentName: 'A' });
    await t.run(ctx => ctx.db.patch(leaseId, { lockedUntil: Date.now() - 1 }));
    await expect(landlord.mutation(api.leases.approveTakeover, { leaseId })).rejects.toThrow('expired');
  });
  test('takeover requests cannot displace another active holder', async () => {
    const { owner, a, b } = setup(); const leaseId = await owner.mutation(api.leases.create, listing);
    await a.mutation(api.leases.reserve, { leaseId, userId: 'a' });
    await expect(b.mutation(api.leases.requestTakeover, { leaseId, studentName: 'B' })).rejects.toThrow('unavailable');
  });
  test('expired invitations are rejected even for the correct recipient', async () => {
    const { t, owner, landlord } = setup(); const placeId = await owner.mutation(api.leases.create, listing); const token = 'b'.repeat(64);
    await write(owner, 'invitation', { placeId, email: 'landlord@example.test', role: 'landlord', token });
    await t.run(async ctx => { const row = await ctx.db.query('domainRecords').withIndex('by_key', q => q.eq('kind', 'invitation').eq('key', token)).unique(); await ctx.db.patch(row!._id, { data: { ...row!.data, createdAt: Date.now() - 8 * 86400000 } }); });
    await expect(write(landlord, 'acceptInvitation', { token })).rejects.toThrow('Invalid or expired');
  });
  test('place edits cannot overwrite ownership or identity', async () => {
    const { t, owner, a } = setup(); const placeId = await owner.mutation(api.leases.create, listing);
    await write(owner, 'updatePlace', { placeId, updates: { title: 'Updated room', ownerId: 'a', landlordUserId: 'a' } });
    const lease = await t.run(ctx => ctx.db.get(placeId));
    expect(lease?.ownerId).toBe('owner'); expect(lease?.landlordUserId).toBeUndefined();
    await expect(write(a, 'updatePlace', { placeId, updates: { title: 'Hijack' } })).rejects.toThrow('Forbidden');
  });
  test('listing creation is rate limited in a durable transaction', async () => {
    const { owner } = setup(); for (let i = 0; i < 5; i++) await owner.mutation(api.leases.create, listing);
    await expect(owner.mutation(api.leases.create, listing)).rejects.toThrow('Too many requests');
  });
  test('anonymous AI and upload actions are rejected before provider work', async () => {
    const { t } = setup();
    await expect(t.action(api.services.ask, { question: 'Hello' })).rejects.toThrow('Authentication required');
    await expect(t.mutation(api.uploads.generateUploadUrl, {})).rejects.toThrow('Authentication required');
  });
  test('listing photos must be uploaded by the listing owner', async () => {
    const { owner } = setup();
    await expect(owner.mutation(api.leases.create, { ...listing, images: ['https://example.test/other-user-photo.jpg'] })).rejects.toThrow('own uploaded photos');
  });
  test('saved listings are account bound and shared by both client paths', async () => {
    const { owner, a, b } = setup(); const placeId = await owner.mutation(api.leases.create, listing);
    await write(a, 'toggleSaved', { placeId });
    expect(await a.query(api.favorites.getUserFavorites, { userId: 'a' })).toEqual([placeId]);
    expect(await read(b, 'saved')).toEqual([]);
  });
  test('exit notifications are visible only to the verified landlord recipient', async () => {
    const { owner, a, landlord } = setup(); const placeId = await owner.mutation(api.leases.create, listing);
    await write(owner, 'requestExit', { placeId, leaveDate: '2027-02-01' });
    expect((await read(landlord, 'notifications')).length).toBe(1);
    expect(await read(a, 'notifications')).toEqual([]);
  });
});

describe('concurrent holds and deletion consistency', () => {
  test('competing reservations have exactly one successful holder', async () => {
    const { owner, a, b } = setup(); const leaseId = await owner.mutation(api.leases.create, listing);
    const results = await Promise.allSettled([a.mutation(api.leases.reserve, { leaseId, userId: 'a' }), b.mutation(api.leases.reserve, { leaseId, userId: 'b' })]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(r => r.status === 'rejected')).toHaveLength(1);
  });
  test('deleting a listing removes dependent messages and favorites without breaking the inbox', async () => {
    const { owner, a } = setup(); const placeId = await owner.mutation(api.leases.create, listing);
    const thread = await write(a, 'createThread', { placeId }); await write(a, 'sendMessage', { threadId: thread.id, body: 'Hello' });
    await write(a, 'toggleSaved', { placeId });
    await owner.mutation(api.leases.deleteLease, { id: placeId });
    expect(await read(a, 'threads')).toEqual([]);
    expect(await a.query(api.favorites.getUserFavorites, { userId: 'a' })).toEqual([]);
  });
});
