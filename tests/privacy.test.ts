import { describe, expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import schema from '../convex/schema';
import { api } from '../convex/_generated/api';

const modules = import.meta.glob('../convex/**/*.{ts,js}');

const identity = {
  subject: 'private-owner',
  issuer: 'https://clerk.example.test',
  name: 'Exact Private Name',
  email: 'private-owner@example.test',
  emailVerified: true,
};

describe('public listing identity and contact privacy', () => {
  test('public listings show supplied names and addresses while hiding direct contact and account identifiers', async () => {
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
    expect(listing.address).toBe('ul. Sekretna 42 / 12');
    expect(listing.coordinates).toEqual({ lat: 52.203456, lng: 21.012345 });
    expect(listing.currentTenant.name).toBe('Exact Private Name');
    expect(listing.currentTenant.avatar).toBe('https://example.test/me.jpg');
    expect(listing.landlordName).toBe('Exact Landlord Name');
    expect(listing.ownerId).toBeUndefined();
    expect(listing.landlordContactEmail).toBeUndefined();
    expect(listing.landlordContactPhone).toBeUndefined();
  });

  test('conversation participants see the prospect profile name even on an older aliased thread', async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity(identity);
    const prospectIdentity = {
      ...identity,
      subject: 'named-prospect',
      name: 'Interested Person',
      email: 'named-prospect@example.test',
    };
    const prospect = t.withIdentity(prospectIdentity);
    const id = await owner.mutation((api as any).leases.create, {
      title: 'Named Warsaw room', address: 'ul. Jawna 8', city: 'Warsaw', monthlyRent: 2500,
      deposit: 2500, roomType: 'Private room', areaM2: 18,
      moveInDate: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
      leaseEndDate: new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10),
      currentTenant: { name: 'Exact Private Name', status: 'Departing tenant', avatar: '' },
      amenities: [], images: [], locale: 'en',
    });
    await prospect.mutation((api as any).emailPreferences.syncAccount, { locale: 'en' });
    const thread = await prospect.mutation((api as any).domain.write, { operation: 'createThread', input: { placeId: id } });
    await t.run(async (ctx) => {
      const row = await ctx.db.query('domainRecords').withIndex('by_key', (q) => q.eq('kind', 'thread').eq('key', thread.id)).unique();
      await ctx.db.patch(row!._id, { data: { ...row!.data, prospectName: 'Member OLD1' } });
    });

    const threads = await owner.query((api as any).domain.read, { operation: 'threads', input: { placeId: id } });
    expect(threads[0].prospectName).toBe('Interested Person');
  });
});
