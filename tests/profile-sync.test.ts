import { describe, expect, test } from 'vitest';
import { convexTest } from 'convex-test';
import schema from '../convex/schema';
import { api, internal } from '../convex/_generated/api';
const modules = import.meta.glob('../convex/**/*.{ts,js}');
const identity = { subject: 'member-a', issuer: 'https://clerk.example.test' };
const sync = { userId: identity.subject, email: 'member@example.test', locale: 'en' as const, fullName: 'Member Example' };
describe('Universal profile', () => {
  test('new accounts are neutral and synchronization is idempotent', async () => {
    const t = convexTest(schema, modules);
    await t.mutation((internal as any).emailPreferences.syncVerifiedContact, sync);
    await t.mutation((internal as any).emailPreferences.syncVerifiedContact, sync);
    const profiles = await t.run(ctx => ctx.db.query('profiles').collect());
    expect(profiles).toHaveLength(1);
    expect(profiles[0]).toMatchObject({ role: 'member', isVerified: false });
  });
  test('profile edits persist and synchronization preserves name, contact details, legacy roles and verification', async () => {
    const t = convexTest(schema, modules);
    const user = t.withIdentity(identity);
    const id = await user.mutation(api.profiles.upsertProfile, { userId: identity.subject, fullName: 'Edited Name', phoneNumber: '+48123456789', university: 'Example institution' });
    await t.run(ctx => ctx.db.patch(id, { role: 'landlord', isVerified: true }));
    await t.mutation((internal as any).emailPreferences.syncVerifiedContact, sync);
    expect(await user.query(api.profiles.getProfile, { userId: identity.subject })).toMatchObject({ _id: id, fullName: 'Edited Name', phoneNumber: '+48123456789', university: 'Example institution', role: 'landlord', isVerified: true });
  });
  test('authenticated preferences work without JWT email claims and preserve opt-out after synchronization', async () => {
    const t = convexTest(schema, modules);
    const user = t.withIdentity(identity);
    await t.mutation((internal as any).emailPreferences.syncVerifiedContact, sync);
    await user.mutation((api as any).emailPreferences.updateMine, { locale: 'en', unreadMessages: false, listingReminders: false, weeklyDigest: false, marketingConsent: false, digestCities: [], digestRoomTypes: [] });
    await t.mutation((internal as any).emailPreferences.syncVerifiedContact, sync);
    expect(await user.query((api as any).emailPreferences.getMine, {})).toMatchObject({ unreadMessages: false, listingReminders: false, marketingConsent: false });
  });
  test('another member cannot read or modify the profile', async () => {
    const t = convexTest(schema, modules);
    const other = t.withIdentity({ ...identity, subject: 'member-b' });
    await t.mutation((internal as any).emailPreferences.syncVerifiedContact, sync);
    await expect(other.query(api.profiles.getProfile, { userId: identity.subject })).rejects.toThrow('Forbidden');
    await expect(other.mutation(api.profiles.upsertProfile, { userId: identity.subject, fullName: 'Other Name' })).rejects.toThrow('Forbidden');
  });
});
