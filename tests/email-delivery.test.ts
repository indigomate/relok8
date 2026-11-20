import { describe, expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import schema from '../convex/schema';
import { internal } from '../convex/_generated/api';

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
