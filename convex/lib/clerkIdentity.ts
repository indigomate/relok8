// Server-side Clerk identity lookup. Never accept a caller-supplied email.
export type VerifiedContact = { subject: string; email: string; emailVerified: true };
export type LookupResult = { ok: true; contact: VerifiedContact } | { ok: false; reason: 'missing_clerk_key' | 'clerk_api_error' | 'clerk_primary_not_verified' };

export function normalizeVerifiedEmail(email: unknown, verified: unknown): string | null {
  if (verified !== true || typeof email !== 'string') return null;
  const value = email.trim().toLowerCase();
  return value.length <= 254 && /^[^\s@]+@[^\s@]+$/.test(value) ? value : null;
}

export function parseClerkContact(subject: string, payload: unknown): VerifiedContact | null {
  if (!payload || typeof payload !== 'object') return null;
  const user = payload as Record<string, unknown>;
  if (user.id !== subject || typeof user.primary_email_address_id !== 'string' || !Array.isArray(user.email_addresses)) return null;
  const primary = user.email_addresses.find(entry => entry && typeof entry === 'object' && entry.id === user.primary_email_address_id);
  const email = normalizeVerifiedEmail(primary?.email_address, primary?.verification?.status === 'verified');
  return email ? { subject, email, emailVerified: true } : null;
}

export async function lookupClerkContact(subject: string, key: string | undefined, request: typeof fetch = fetch): Promise<LookupResult> {
  if (!key?.trim()) return { ok: false, reason: 'missing_clerk_key' };
  try {
    const response = await request('https://api.clerk.com/v1/users/' + encodeURIComponent(subject), {
      headers: { Authorization: 'Bearer ' + key.trim() },
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return { ok: false, reason: 'clerk_api_error' };
    const contact = parseClerkContact(subject, await response.json());
    return contact ? { ok: true, contact } : { ok: false, reason: 'clerk_primary_not_verified' };
  } catch {
    return { ok: false, reason: 'clerk_api_error' };
  }
}
