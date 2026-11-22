import { describe, expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import schema from '../convex/schema';
import { api } from '../convex/_generated/api';
import { publicMemberAlias } from '../src/utils/privacy';

const modules = import.meta.glob('../convex/**/*.{ts,js}');

const identity = {
  subject: 'private-owner',
  issuer: 'https://clerk.example.test',
  name: 'Exact Private Name',
  email: 'private-owner@example.test',
  emailVerified: true,
};

describe('public identity and location privacy', () => {
  test('member aliases are stable, localized, and do not reveal the source identifier', () => {
    const first = publicMemberAlias('user_123', 'en');
    expect(first).toBe(publicMemberAlias('user_123', 'en'));
    expect(first).not.toContain('user_123');
    expect(publicMemberAlias('user_456', 'en')).not.toBe(first);
    expect(publicMemberAlias('user_123', 'pl')).toMatch(/^Użytkownik /);
  });

  test('public listing queries hide names, contact details, exact address, and precise coordinates', async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity(identity);
    const id = await owner.mutation((api as any).leases.create, {
      title: 'Private Warsaw room',
      address: 'ul. Sekretna 42 / 12',
      city: 'Warsaw',
      district: 'Mokotów',
      monthlyRent: 2500,
      deposit: 2500,
      roomType: 'Private room',
      areaM2: 18,
      moveInDate: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
      leaseEndDate: new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10),
      coordinates: { lat: 52.203456, lng: 21.012345 },
      currentTenant: { name: 'Exact Private Name', status: 'Departing tenant', avatar: 'https://example.test/me.jpg' },
      amenities: [],
      images: [],
      landlordName: 'Exact Landlord Name',
      landlordContactEmail: 'landlord@example.test',
      landlordContactPhone: '+48123456789',
      locale: 'en',
    });

    const listing = await t.query((api as any).leases.getById, { id });
    expect(listing.address).toBe('Mokotów, Warsaw');
    expect(listing.coordinates).toEqual({ lat: 52.2, lng: 21.01 });
    expect(listing.currentTenant.name).toMatch(/^Member /);
    expect(listing.currentTenant.name).not.toContain('Exact');
    expect(listing.currentTenant.avatar).toBe('');
    expect(listing.landlordName).toBe('Property owner');
    expect(listing.ownerId).toBeUndefined();
    expect(listing.landlordContactEmail).toBeUndefined();
    expect(listing.landlordContactPhone).toBeUndefined();
  });
});
