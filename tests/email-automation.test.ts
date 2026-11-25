import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { convexTest } from 'convex-test';
import schema from '../convex/schema';
import { api, internal } from '../convex/_generated/api';

const modules = import.meta.glob('../convex/**/*.{ts,js}');
beforeEach(() => {
  vi.stubEnv('CLERK_SECRET_KEY', 'test-only-key');
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const endpoint = new URL(url);
    if (endpoint.origin !== 'https://api.clerk.com' || !endpoint.pathname.startsWith('/v1/users/')) throw new Error('Unexpected network call');
    const subject = decodeURIComponent(endpoint.pathname.slice('/v1/users/'.length));
    return Response.json({
      id: subject, primary_email_address_id: 'primary',
      email_addresses: [{ id: 'primary', email_address: subject + '@example.test', verification: { status: 'verified' } }],
    });
  }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const identity = (subject: string) => ({
  subject,
  issuer: 'https://clerk.example.test',
  name: `User ${subject}`,
  email: `${subject}@example.test`,
  emailVerified: true,
});

function isoDate(daysFromNow: number): string {
  const todayInWarsaw = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Europe/Warsaw',
  }).format(new Date());
  const date = new Date(`${todayInWarsaw}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

const listing = (leaseEndDate = isoDate(30)) => ({
  title: 'Warsaw test studio',
  address: 'Test Street 1',
  city: 'Warsaw',
  monthlyRent: 2400,
  deposit: 2400,
  roomType: 'Studio',
  areaM2: 24,
  moveInDate: isoDate(2),
  leaseEndDate,
  amenities: [],
  images: [],
  locale: 'en' as const,
});

describe('email automation and consent', () => {
  test('verified account sync sends one welcome and initializes privacy-safe defaults', async () => {
    const t = convexTest(schema, modules);
    const user = t.withIdentity(identity('welcome'));
    const emailApi = (api as any).emailPreferences;
    expect((await user.action(emailApi.syncAccountVerified, { locale: 'en' })).synced).toBe(true);
    await user.action(emailApi.syncAccountVerified, { locale: 'en' });
    const deliveries = await t.run((ctx) => ctx.db.query('emailDeliveries').collect());
    expect(deliveries.filter((row) => row.template === 'welcome')).toHaveLength(1);
    expect(await user.query(emailApi.getMine, {})).toMatchObject({
      unreadMessages: true,
      listingReminders: true,
      weeklyDigest: false,
      marketingConsent: false,
    });
  });

  test('weekly digest is impossible without explicit consent and queues once with consent', async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity(identity('owner'));
    const seeker = t.withIdentity(identity('seeker'));
    const emailApi = (api as any).emailPreferences;
    await owner.mutation((api as any).leases.create, listing());
    await seeker.action(emailApi.syncAccountVerified, { locale: 'en' });
    await expect(seeker.mutation(emailApi.updateMine, {
      locale: 'en', unreadMessages: true, listingReminders: true,
      weeklyDigest: true, marketingConsent: false, digestCities: [], digestRoomTypes: [],
    })).rejects.toThrow('consent');
    await seeker.mutation(emailApi.updateMine, {
      locale: 'en', unreadMessages: true, listingReminders: true,
      weeklyDigest: true, marketingConsent: true, digestCities: ['Warsaw'], digestRoomTypes: ['Studio'],
    });
    const automation = (internal as any).emailAutomation;
    expect((await t.mutation(automation.queueWeeklyDigests, {})).queued).toBe(1);
    expect((await t.mutation(automation.queueWeeklyDigests, {})).queued).toBe(0);
    const digests = (await t.run((ctx) => ctx.db.query('emailDeliveries').collect())).filter((row) => row.template === 'weekly_digest');
    expect(digests).toHaveLength(1);
    expect((digests[0].templateData as any).listings).toHaveLength(1);
  });

  test('listing invitations require consent, stop after two sends, and stop when a listing exists', async () => {
    const t = convexTest(schema, modules);
    const candidate = t.withIdentity(identity('listing-candidate'));
    const withoutConsent = t.withIdentity(identity('listing-no-consent'));
    const alreadyListed = t.withIdentity(identity('listing-owner'));
    const emailApi = (api as any).emailPreferences;
    const automation = (internal as any).emailAutomation;

    await candidate.action(emailApi.syncAccountVerified, { locale: 'en' });
    await candidate.mutation(emailApi.updateMine, {
      locale: 'en', unreadMessages: true, listingReminders: true,
      weeklyDigest: false, marketingConsent: true, digestCities: [], digestRoomTypes: [],
    });
    await withoutConsent.action(emailApi.syncAccountVerified, { locale: 'en' });
    await alreadyListed.action(emailApi.syncAccountVerified, { locale: 'en' });
    await alreadyListed.mutation(emailApi.updateMine, {
      locale: 'en', unreadMessages: true, listingReminders: true,
      weeklyDigest: false, marketingConsent: true, digestCities: [], digestRoomTypes: [],
    });
    await alreadyListed.mutation((api as any).leases.create, listing());

    await t.run(async (ctx) => {
      const profiles = await ctx.db.query('profiles').collect();
      for (const profile of profiles) {
        await ctx.db.patch(profile._id, {
          createdAt: Date.now() - (profile.userId === 'listing-candidate' ? 4 : 20) * 86_400_000,
          isVerified: true, // Explicitly establish platform verification, separate from verified email.
        });
      }
    });

    // Verified email and marketing consent alone must not grant platform verification.
    await t.run(async (ctx) => {
      const profile = await ctx.db.query('profiles').withIndex('by_userId', q => q.eq('userId', 'listing-candidate')).unique();
      await ctx.db.patch(profile!._id, { isVerified: false });
    });
    expect((await t.mutation(automation.queueListingNudges, {})).queued).toBe(0);
    await t.run(async (ctx) => {
      const profile = await ctx.db.query('profiles').withIndex('by_userId', q => q.eq('userId', 'listing-candidate')).unique();
      await ctx.db.patch(profile!._id, { isVerified: true });
    });
    expect((await t.mutation(automation.queueListingNudges, {})).queued).toBe(1);
    expect((await t.mutation(automation.queueListingNudges, {})).queued).toBe(0);

    await t.run(async (ctx) => {
      const profile = await ctx.db.query('profiles').filter((q) => q.eq(q.field('userId'), 'listing-candidate')).unique();
      await ctx.db.patch(profile!._id, { createdAt: Date.now() - 11 * 86_400_000 });
    });

    expect((await t.mutation(automation.queueListingNudges, {})).queued).toBe(1);
    expect((await t.mutation(automation.queueListingNudges, {})).queued).toBe(0);

    const invitations = (await t.run((ctx) => ctx.db.query('emailDeliveries').collect()))
      .filter((row) => row.template === 'listing_nudge');
    expect(invitations).toHaveLength(2);
    expect(invitations.every((row) => row.recipient === 'listing-candidate@example.test')).toBe(true);
    expect(invitations.every((row) => row.category === 'marketing')).toBe(true);
  });

  test('queues listing reminders at seven days and unread summaries after thirty minutes', async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity(identity('owner'));
    const prospect = t.withIdentity(identity('prospect'));
    const emailApi = (api as any).emailPreferences;
    await owner.action(emailApi.syncAccountVerified, { locale: 'en' });
    await prospect.action(emailApi.syncAccountVerified, { locale: 'en' });
    const leaseId = await owner.mutation((api as any).leases.create, listing(isoDate(7)));
    const thread = await prospect.mutation((api as any).domain.write, { operation: 'createThread', input: { placeId: leaseId } });
    await prospect.mutation((api as any).domain.write, { operation: 'sendMessage', input: { threadId: thread.id, body: 'Is this still available?' } });
    await t.run(async (ctx) => {
      const threadRow = await ctx.db.query('domainRecords').withIndex('by_key', (q) => q.eq('kind', 'thread').eq('key', thread.id)).unique();
      await ctx.db.patch(threadRow!._id, { data: { ...threadRow!.data, lastMessageAt: Date.now() - 31 * 60_000 } });
      const messageRows = await ctx.db.query('domainRecords').withIndex('by_kind', (q) => q.eq('kind', 'message')).collect();
      for (const row of messageRows) await ctx.db.patch(row._id, { data: { ...row.data, createdAt: Date.now() - 31 * 60_000 } });
    });
    const automation = (internal as any).emailAutomation;
    expect((await t.mutation(automation.queueListingExpiryReminders, {})).queued).toBe(1);
    expect((await t.mutation(automation.queueUnreadMessageSummaries, {})).queued).toBe(1);
    const deliveries = await t.run((ctx) => ctx.db.query('emailDeliveries').collect());
    expect(deliveries.some((row) => row.template === 'listing_expiry')).toBe(true);
    expect(deliveries.some((row) => row.template === 'unread_message')).toBe(true);
  });

  test('queues one private email alert per unread cycle and names the sender without copying message content', async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity(identity('message-owner'));
    const prospect = t.withIdentity(identity('message-prospect'));
    const emailApi = (api as any).emailPreferences;
    await owner.action(emailApi.syncAccountVerified, { locale: 'en', fullName: 'Olivia Owner' });
    await prospect.action(emailApi.syncAccountVerified, { locale: 'en', fullName: 'Peter Prospect' });
    const leaseId = await owner.mutation((api as any).leases.create, listing());
    const thread = await prospect.mutation((api as any).domain.write, { operation: 'createThread', input: { placeId: leaseId } });
    const privateBody = 'My private viewing details are 18:30 on Tuesday.';
    await prospect.mutation((api as any).domain.write, { operation: 'sendMessage', input: { threadId: thread.id, body: privateBody } });
    await t.run(async (ctx) => {
      const row = await ctx.db.query('domainRecords').withIndex('by_key', (q) => q.eq('kind', 'thread').eq('key', thread.id)).unique();
      await ctx.db.patch(row!._id, { data: { ...row!.data, lastMessageAt: Date.now() - 3 * 60_000 } });
    });
    const automation = (internal as any).emailAutomation;
    expect((await t.mutation(automation.queueThreadMessageNotifications, { threadId: thread.id })).queued).toBe(1);
    expect((await t.mutation(automation.queueThreadMessageNotifications, { threadId: thread.id })).queued).toBe(0);
    const delivery = (await t.run((ctx) => ctx.db.query('emailDeliveries').collect())).find((row) => row.template === 'unread_message');
    expect(delivery?.templateData).toMatchObject({ senderName: 'Peter Prospect', listingTitle: 'Warsaw test studio', count: 1 });
    expect(JSON.stringify(delivery?.templateData)).not.toContain(privateBody);
  });

  test('Resend events are idempotent and complaints suppress the address', async () => {
    const t = convexTest(schema, modules);
    const deliveryId = (await t.mutation((internal as any).emails.queue, {
      idempotencyKey: 'webhook:test:one', recipient: 'person@example.com', template: 'support_received', locale: 'en', scheduleDelivery: false,
    })).deliveryId;
    await t.mutation((internal as any).emails.markSent, { deliveryId, providerMessageId: 'email_provider_1' });
    const event = { eventId: 'evt_1', eventType: 'email.complained', providerMessageId: 'email_provider_1', recipient: 'person@example.com' };
    expect((await t.mutation((internal as any).emailWebhooks.recordResendEvent, event)).duplicate).toBe(false);
    expect((await t.mutation((internal as any).emailWebhooks.recordResendEvent, event)).duplicate).toBe(true);
    const delivery = await t.run((ctx) => ctx.db.get(deliveryId));
    expect((delivery as any)?.status).toBe('complained');
    const suppressions = await t.run((ctx) => ctx.db.query('emailSuppressions').collect());
    expect(suppressions).toMatchObject([{ email: 'person@example.com', reason: 'complaint' }]);
  });
});
