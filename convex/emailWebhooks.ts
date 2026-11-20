import { internalMutation } from './_generated/server';
import { v } from 'convex/values';

function normalizeEmail(value: string | undefined): string | undefined {
  const email = value?.trim().toLowerCase();
  return email && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined;
}

export const recordResendEvent = internalMutation({
  args: {
    eventId: v.string(),
    eventType: v.string(),
    providerMessageId: v.optional(v.string()),
    recipient: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('emailWebhookEvents').withIndex('by_event', (q) => q.eq('eventId', args.eventId)).unique();
    if (existing) return { duplicate: true };
    const now = Date.now();
    await ctx.db.insert('emailWebhookEvents', {
      eventId: args.eventId.slice(0, 500),
      eventType: args.eventType.slice(0, 100),
      providerMessageId: args.providerMessageId?.slice(0, 500),
      receivedAt: now,
    });

    const delivery = args.providerMessageId
      ? await ctx.db.query('emailDeliveries').withIndex('by_provider_message', (q) => q.eq('providerMessageId', args.providerMessageId)).unique()
      : null;
    const status = args.eventType === 'email.delivered' ? 'delivered'
      : args.eventType === 'email.bounced' ? 'bounced'
        : args.eventType === 'email.complained' ? 'complained'
          : args.eventType === 'email.suppressed' ? 'suppressed'
            : undefined;
    if (delivery && status) {
      await ctx.db.patch(delivery._id, {
        status,
        updatedAt: now,
        ...(status === 'bounced' ? { errorCode: 'provider_bounce', errorMessage: 'The receiving mail server rejected this address.' } : {}),
        ...(status === 'complained' ? { errorCode: 'provider_complaint', errorMessage: 'The recipient marked this message as spam.' } : {}),
      });
    }

    const recipient = normalizeEmail(args.recipient || delivery?.recipient);
    const reason = args.eventType === 'email.bounced' ? 'bounce' : args.eventType === 'email.complained' ? 'complaint' : undefined;
    if (recipient && reason) {
      const suppression = await ctx.db.query('emailSuppressions').withIndex('by_email', (q) => q.eq('email', recipient)).unique();
      if (suppression) await ctx.db.patch(suppression._id, { reason, providerMessageId: args.providerMessageId, updatedAt: now });
      else await ctx.db.insert('emailSuppressions', { email: recipient, reason, providerMessageId: args.providerMessageId, createdAt: now, updatedAt: now });
    }
    return { duplicate: false };
  },
});
