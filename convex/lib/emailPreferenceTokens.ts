const encoder = new TextEncoder();

export type EmailPreferenceTokenPayload = {
  userId: string;
  email: string;
  expiresAt: number;
};

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function tokenSecret(): string {
  // A dedicated secret is preferred. RESEND_API_KEY is a secure production-only
  // fallback so preference links keep working during the first deployment.
  const secret = process.env.EMAIL_PREFERENCES_SECRET || process.env.RESEND_API_KEY;
  if (!secret || secret.length < 32) throw new Error('email_preferences_not_configured');
  return `relok8-email-preferences-v1:${secret}`;
}

async function signature(input: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(tokenSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(input)));
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

export async function createEmailPreferenceToken(payload: EmailPreferenceTokenPayload): Promise<string> {
  const encoded = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  return `${encoded}.${base64UrlEncode(await signature(encoded))}`;
}

export async function verifyEmailPreferenceToken(token: string): Promise<EmailPreferenceTokenPayload> {
  if (!token || token.length > 2_000) throw new Error('invalid_email_preference_token');
  const [encoded, suppliedSignature, extra] = token.split('.');
  if (!encoded || !suppliedSignature || extra) throw new Error('invalid_email_preference_token');
  const expected = await signature(encoded);
  let supplied: Uint8Array;
  try {
    supplied = base64UrlDecode(suppliedSignature);
  } catch {
    throw new Error('invalid_email_preference_token');
  }
  if (!equalBytes(expected, supplied)) throw new Error('invalid_email_preference_token');
  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(encoded)));
  } catch {
    throw new Error('invalid_email_preference_token');
  }
  if (
    !payload || typeof payload !== 'object' ||
    typeof (payload as any).userId !== 'string' ||
    typeof (payload as any).email !== 'string' ||
    typeof (payload as any).expiresAt !== 'number' ||
    (payload as any).expiresAt < Date.now()
  ) throw new Error('invalid_email_preference_token');
  return payload as EmailPreferenceTokenPayload;
}
