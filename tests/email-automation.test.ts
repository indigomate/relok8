import { describe, expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import schema from '../convex/schema';
import { api, internal } from '../convex/_generated/api';

const modules = import.meta.glob('../convex/**/*.{ts,js}');
const identity = (subject: string) => ({
  subject,
  issuer: 'https://clerk.example.test',
  name: `User ${subject}`,
  email: `${subject}@example.test`,
  emailVerified: true,
});

function isoDate(daysFromNow: number): string {
  const date = new Date(Date.now() + daysFromNow * 86_400_000);
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
    expect((await user.mutation(emailApi.syncAccount, { locale: 'en' })).synced).toBe(true);
    await user.mutation(emailApi.syncAccount, { locale: 'en' });
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
    await seeker.mutation(emailApi.syncAccount, { locale: 'en' });
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

  test('queues listing reminders at seven days and unread summaries after thirty minutes', async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity(identity('owner'));
    const prospect = t.withIdentity(identity('prospect'));
    const emailApi = (api as any).emailPreferences;
    await owner.mutation(emailApi.syncAccount, { locale: 'en' });
    await prospect.mutation(emailApi.syncAccount, { locale: 'en' });
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
