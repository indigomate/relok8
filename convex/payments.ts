import { action, mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { RELOK8_LAUNCH_PRICING } from '../src/config/pricing';
import { requireIdentity } from './lib/auth';

const unavailable = async (): Promise<never> => { throw new Error('Payments are not enabled. No funds have been charged, held, captured, or refunded.'); };

export const getLaunchPricing = query({
  args: {},
  handler: async () => ({
    ...RELOK8_LAUNCH_PRICING,
    tenantTrigger: 'after_landlord_approval',
    landlordBillingStarts: 'move_in',
    landlordBillingStops: 'tenancy_end',
    checkoutEnabled: false,
  }),
});

export const getReservationQuote = query({
  args: { applicationId: v.id('domainRecords') },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const application = await ctx.db.get(args.applicationId);
    if (!application || application.kind !== 'application' || application.ownerId !== identity.subject) {
      throw new Error('Reservation request unavailable');
    }
    if (application.data.status !== 'approved') {
      throw new Error('Landlord approval is required before a reservation fee can be quoted');
    }
    const snapshot = application.data.pricingSnapshot || {};
    return {
      currency: snapshot.currency || RELOK8_LAUNCH_PRICING.currency,
      tenantAmountGrosze: snapshot.tenantReservationConfirmationGrosze || RELOK8_LAUNCH_PRICING.tenantReservationConfirmationGrosze,
      landlordMonthlyAmountGrosze: snapshot.landlordActiveTenancyMonthlyGrosze || RELOK8_LAUNCH_PRICING.landlordActiveTenancyMonthlyGrosze,
      charged: false,
      checkoutEnabled: false,
      status: 'AWAITING_PAYMENT_PROVIDER',
    };
  },
});

export const createReservationRecord = mutation({ args: {}, handler: unavailable });
export const updateReservationStatus = mutation({ args: {}, handler: unavailable });
export const getReservations = query({ args: {}, handler: unavailable });
export const createEscrowIntent = action({ args: {}, handler: unavailable });
export const captureEscrow = mutation({ args: {}, handler: unavailable });
export const cancelEscrow = mutation({ args: {}, handler: unavailable });
