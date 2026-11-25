import { describe, it, expect, vi } from 'vitest';
import { lookupClerkContact, parseClerkContact, normalizeVerifiedEmail } from '../convex/lib/clerkIdentity';
const subject = 'user_test';
const payload = { id: subject, primary_email_address_id: 'primary', email_addresses: [{ id: 'primary', email_address: ' Test@example.test ', verification: { status: 'verified' } }] };
describe('Clerk contact verification', () => {
  it('normalizes verified primary contact', () => expect(parseClerkContact(subject, payload)).toEqual({ subject, email: 'test@example.test', emailVerified: true }));
  it('rejects mismatched user', () => expect(parseClerkContact('other', payload)).toBeNull());
  it('rejects missing primary', () => expect(parseClerkContact(subject, { ...payload, primary_email_address_id: 'missing' })).toBeNull());
  it('rejects unverified primary', () => expect(parseClerkContact(subject, { ...payload, email_addresses: [{ ...payload.email_addresses[0], verification: { status: 'unverified' } }] })).toBeNull());
  it('rejects malformed payloads', () => { for (const value of [null, {}, [], 'text']) expect(parseClerkContact(subject, value)).toBeNull(); });
  it('requires boolean verification', () => expect(normalizeVerifiedEmail('test@example.test', 'true')).toBeNull());
  it('rejects invalid email', () => expect(normalizeVerifiedEmail('not-an-email', true)).toBeNull());
  it('does not request without key', async () => { const request = vi.fn<typeof fetch>(); expect(await lookupClerkContact(subject, undefined, request)).toEqual({ ok: false, reason: 'missing_clerk_key' }); expect(request).not.toHaveBeenCalled(); });
  it('fails closed on API error', async () => { const request = vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 403 })); expect(await lookupClerkContact(subject, 'test-key', request)).toEqual({ ok: false, reason: 'clerk_api_error' }); });
  it('fails closed on network error', async () => { const request = vi.fn<typeof fetch>().mockRejectedValue(new Error('network')); expect(await lookupClerkContact(subject, 'test-key', request)).toEqual({ ok: false, reason: 'clerk_api_error' }); });
  it('returns verified contact on success', async () => { const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json(payload)); expect(await lookupClerkContact(subject, 'test-key', request)).toEqual({ ok: true, contact: { subject, email: 'test@example.test', emailVerified: true } }); });
});
