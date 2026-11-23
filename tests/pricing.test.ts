import { describe, expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import schema from '../convex/schema';
import { api } from '../convex/_generated/api';
import {
  RELOK8_LAUNCH_PRICING,
  grossBilledPerTenancyPLN,
  illustrativeNetRevenueEUR,
} from '../src/config/pricing';

const modules = import.meta.glob('../convex/**/*.{ts,js}');
const identity = (subject: string) => ({
  subject,
  issuer: 'https://clerk.example.test',
  name: subject,
  email: `${subject}@example.test`,
  emailVerified: true,
});

describe('49 + 49 launch pricing', () => {
  test('uses one approved reservation plus active landlord months', () => {
    expect(RELOK8_LAUNCH_PRICING.tenantReservationConfirmationPLN).toBe(49);
    expect(RELOK8_LAUNCH_PRICING.landlordActiveTenancyMonthlyPLN).toBe(49);
    expect(grossBilledPerTenancyPLN(10)).toBe(539);
    expect(illustrativeNetRevenueEUR(10)).toBeCloseTo(101.91, 2);
  });

  test('quotes the fee only to the approved applicant and never reports a charge', async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity(identity('owner'));
    const landlord = t.withIdentity(identity('landlord'));
    const applicant = t.withIdentity(identity('applicant'));
    const listingId = await owner.mutation(api.leases.create, {
      title: 'Room', address: 'Test Street', city: 'Warsaw', monthlyRent: 2000,
      deposit: 2000, roomType: 'Studio', areaM2: 25, floor: 0,
      moveInDate: '2027-01-01', leaseEndDate: '2027-06-30', amenities: [], images: [],
      landlordContactEmail: 'landlord@example.test',
    });
    const applicationId = await applicant.mutation(api.workflow.request, {
      listingId, message: 'I would like to take over this tenancy.',
    });
    await expect(applicant.query(api.payments.getReservationQuote, { applicationId }))
      .rejects.toThrow('Landlord approval');
    await landlord.mutation(api.workflow.decide, { applicationId, decision: 'approved', reason: '' });
    await expect(owner.query(api.payments.getReservationQuote, { applicationId }))
      .rejects.toThrow('unavailable');
    await expect(applicant.query(api.payments.getReservationQuote, { applicationId }))
      .resolves.toMatchObject({ tenantAmountGrosze: 4900, landlordMonthlyAmountGrosze: 4900, charged: false, checkoutEnabled: false });
  });
});

