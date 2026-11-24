import { describe, expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import schema from '../convex/schema';
import { api, internal } from '../convex/_generated/api';
import { isStartKeyword, isStopKeyword, normalizeE164 } from '../convex/whatsapp';

const modules = import.meta.glob('../convex/**/*.{ts,js}');
const identity = (subject: string) => ({
  subject,
  issuer: 'https://clerk.example.test',
  name: `User ${subject}`,
  email: `${subject}@example.test`,
  emailVerified: true,
});
const preferences = {
  phoneE164: '+48 123 456 789',
  cities: ['Warsaw'],
  roomTypes: ['Studio'],
  maxMonthlyRent: 3000,
  locale: 'en' as const,
  sendHourLocal: 8,
  consent: true,
};
const listing = {
  title: 'New Warsaw studio',
  address: 'Test Street 1',
  city: 'Warsaw',
  monthlyRent: 2200,
  deposit: 2200,
  roomType: 'Studio',
  areaM2: 25,
  floor: 2,
  moveInDate: '2027-01-01',
  leaseEndDate: '2027-06-30',
  amenities: [],
  images: [],
};

describe('WhatsApp apartment alerts', () => {
  test('normalizes E.164 numbers and recognizes opt-out commands', () => {
    expect(normalizeE164('0048 123-456-789')).toBe('+48123456789');
    expect(() => normalizeE164('12345')).toThrow('international format');
    expect(isStopKeyword(' WYPISZ ')).toBe(true);
    expect(isStartKeyword('resume')).toBe(true);
    expect(isStopKeyword('show apartments')).toBe(false);
  });

  test('requires authentication and explicit consent without exposing the stored phone', async () => {
    const t = convexTest(schema, modules);
    const a = t.withIdentity(identity('a'));
    const b = t.withIdentity(identity('b'));
    await expect(t.mutation(api.whatsapp.configurePreferences, preferences)).rejects.toThrow('Authentication required');
    await expect(a.mutation(api.whatsapp.configurePreferences, { ...preferences, consent: false })).rejects.toThrow('explicit consent');
    await a.mutation(api.whatsapp.configurePreferences, preferences);
    const mine = await a.query(api.whatsapp.getPreferences, {});
    expect(mine).toMatchObject({ active: true, cities: ['Warsaw'], maskedPhone: expect.stringContaining('•') });
    expect(mine).not.toHaveProperty('phoneE164');
    expect(await b.query(api.whatsapp.getPreferences, {})).toBeNull();
    expect((await a.mutation(api.whatsapp.pausePreferences, {})).success).toBe(true);
    expect((await a.query(api.whatsapp.getPreferences, {}))?.active).toBe(false);
  });

  test('queues at most one matching digest per local calendar day', async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity(identity('owner'));
    const a = t.withIdentity(identity('a'));
    await owner.mutation(api.leases.create, listing);
    await a.mutation(api.whatsapp.configurePreferences, preferences);
    const now = Date.parse('2026-11-19T07:05:00.000Z'); // 08:05 in Europe/Warsaw
    expect((await t.mutation(internal.whatsapp.queueDueDigests, { now, scheduleDelivery: false })).queued).toBe(1);
    expect((await t.mutation(internal.whatsapp.queueDueDigests, { now, scheduleDelivery: false })).queued).toBe(0);
    const deliveries = await t.run((ctx) => ctx.db.query('whatsappDeliveries').collect());
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]).toMatchObject({ digestDate: '2026-11-19', listingIds: expect.any(Array) });
    expect(deliveries[0].listingIds).toHaveLength(1);
  });

  test('signed webhook processing honors STOP and START idempotently', async () => {
    const t = convexTest(schema, modules);
    const a = t.withIdentity(identity('a'));
    await a.mutation(api.whatsapp.configurePreferences, preferences);
    const stopped = {
      eventId: 'message-stop-1',
      eventType: 'inbound_message',
      phoneE164: '+48123456789',
      text: 'STOP',
    };
    expect((await t.mutation(internal.whatsapp.recordWebhookEvent, stopped)).duplicate).toBe(false);
    expect((await t.mutation(internal.whatsapp.recordWebhookEvent, stopped)).duplicate).toBe(true);
    expect((await a.query(api.whatsapp.getPreferences, {}))?.active).toBe(false);
    await t.mutation(internal.whatsapp.recordWebhookEvent, {
      ...stopped,
      eventId: 'message-start-1',
      text: 'START',
    });
    expect((await a.query(api.whatsapp.getPreferences, {}))?.active).toBe(true);
  });

  test('new-message alerts require explicit opt-in, deduplicate, and never store the message body', async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity(identity('message-owner'));
    const prospect = t.withIdentity(identity('message-prospect'));
    const leaseId = await owner.mutation(api.leases.create, listing);
    await owner.mutation(api.whatsapp.configurePreferences, {
      ...preferences,
      phoneE164: '+48 987 654 321',
      dailyDigestEnabled: false,
      messageNotificationsEnabled: true,
    });
    const thread = await prospect.mutation((api as any).domain.write, { operation: 'createThread', input: { placeId: leaseId } });
    const privateBody = 'Please call me about private documents.';
    await prospect.mutation((api as any).domain.write, { operation: 'sendMessage', input: { threadId: thread.id, body: privateBody } });
    await t.run(async (ctx) => {
      const row = await ctx.db.query('domainRecords').withIndex('by_key', (q) => q.eq('kind', 'thread').eq('key', thread.id)).unique();
      await ctx.db.patch(row!._id, { data: { ...row!.data, lastMessageAt: Date.now() - 3 * 60_000 } });
    });
    const whatsapp = (internal as any).whatsapp;
    expect((await t.mutation(whatsapp.queueThreadMessageNotifications, { threadId: thread.id, scheduleDelivery: false })).queued).toBe(1);
    expect((await t.mutation(whatsapp.queueThreadMessageNotifications, { threadId: thread.id, scheduleDelivery: false })).queued).toBe(0);
    const deliveries = await t.run((ctx) => ctx.db.query('whatsappDeliveries').collect());
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]).toMatchObject({ kind: 'new_message', senderName: 'User message-prospect', listingTitle: 'New Warsaw studio' });
    expect(JSON.stringify(deliveries[0])).not.toContain(privateBody);
  });
});
