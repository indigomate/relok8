import { describe, expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import schema from '../convex/schema';
import { api, internal } from '../convex/_generated/api';

const modules = import.meta.glob('../convex/**/*.{ts,js}');

describe('Relok8 email delivery ledger', () => {
  test('queues a sanitized, idempotent email delivery', async () => {
    const t = convexTest(schema, modules);
    const args = {
      idempotencyKey: 'welcome:user_123:v1',
      userId: 'user_123',
      recipient: ' Marta@Example.com ',
      template: 'welcome' as const,
      locale: 'en' as const,
      templateData: { recipientName: 'Marta' },
      scheduleDelivery: false,
    };

    expect((await t.mutation(internal.emails.queue, args)).created).toBe(true);
    expect((await t.mutation(internal.emails.queue, args)).created).toBe(false);

    const rows = await t.run((ctx) => ctx.db.query('emailDeliveries').collect());
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      recipient: 'marta@example.com',
      template: 'welcome',
      category: 'product',
      status: 'queued',
      attempts: 0,
    });
  });

  test('rejects invalid recipients and oversized payloads', async () => {
    const t = convexTest(schema, modules);
    const base = {
      idempotencyKey: 'support:user_123:one',
      recipient: 'not-an-email',
      template: 'support_received' as const,
      locale: 'pl' as const,
      scheduleDelivery: false,
    };
    await expect(t.mutation(internal.emails.queue, base)).rejects.toThrow('Invalid email recipient');
    await expect(t.mutation(internal.emails.queue, {
      ...base,
      recipient: 'marta@example.com',
      idempotencyKey: 'support:user_123:two',
      templateData: { subject: 'x'.repeat(20_001) },
    })).rejects.toThrow('too large');
  });
});

async function invitationFixture() {
  const t = convexTest(schema, modules);
  const owner = t.withIdentity({ subject: 'owner', issuer: 'https://clerk.example.test', email: 'owner@example.test', emailVerified: true });
  const placeId = await owner.mutation(api.leases.create, { title: 'Room', address: 'Test Street', city: 'Warsaw', monthlyRent: 2000, deposit: 2000, roomType: 'Studio', areaM2: 25, moveInDate: '2027-01-01', leaseEndDate: '2027-06-30', images: [], amenities: [] });
  const { token } = await owner.mutation(api.domain.write, { operation: 'invitation', input: { placeId, email: 'landlord@example.test', role: 'landlord', scheduleDelivery: false } });
  const delivery = (await t.run(ctx => ctx.db.query('emailDeliveries').collect())).find(row => row.template === 'landlord_invitation')!;
  return { t, owner, placeId, token, deliveryId: delivery._id };
}
describe('Property Connect email retention', () => {
  test('valid invitation is eligible for delivery and payload clears after sending', async () => {
    const {t, deliveryId} = await invitationFixture();
    expect(await t.mutation(internal.emails.markSending, {deliveryId})).toMatchObject({attempts: 1});
    await t.mutation(internal.emails.markSent, {deliveryId, providerMessageId: 'test-message'});
    expect((await t.run(ctx => ctx.db.get(deliveryId)))?.templateData).toBeUndefined();
  });
  test('revoked invitation is suppressed and payload removed', async () => {
    const {t, owner, placeId, token, deliveryId} = await invitationFixture();
    await owner.mutation(api.domain.write, {operation: 'revokeInvitation', input: {placeId, token}});
    expect(await t.mutation(internal.emails.markSending, {deliveryId})).toBeNull();
    const row = await t.run(ctx => ctx.db.get(deliveryId));
    expect(row?.status).toBe('suppressed');
    expect(row?.templateData).toBeUndefined();
  });
  test('expired invitation is suppressed and payload removed', async () => {
    const {t, deliveryId} = await invitationFixture();
    await t.run(async ctx => {
      const rows = await ctx.db.query('domainRecords').collect();
      const row = rows.find(r => r.kind === 'invitation')!;
      await ctx.db.patch(row._id, {data: {...row.data, createdAt: Date.now() - 8 * 86400000}});
    });
    expect(await t.mutation(internal.emails.markSending, {deliveryId})).toBeNull();
    const row = await t.run(ctx => ctx.db.get(deliveryId));
    expect(row?.status).toBe('suppressed');
    expect(row?.templateData).toBeUndefined();
  });
  test('terminal invitation delivery failure clears sensitive payload', async () => {
    const {t, deliveryId} = await invitationFixture();
    await t.run(ctx => ctx.db.patch(deliveryId, {attempts: 3, status: 'sending'}));
    await t.mutation(internal.emails.markFailed, {deliveryId, attempts: 3, errorCode: 'test_failure', errorMessage: 'Test failure'});
    const row = await t.run(ctx => ctx.db.get(deliveryId));
    expect(row?.status).toBe('failed');
    expect(row?.templateData).toBeUndefined();
  });
});
