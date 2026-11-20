import type { MutationCtx } from '../_generated/server';
import type { EmailLocale } from '../../src/emails/templates';

export type EmailContact = {
  userId: string;
  email: string;
  name: string;
  locale: EmailLocale;
};

export function emailLocale(value: unknown): EmailLocale {
  return value === 'pl' ? 'pl' : 'en';
}

export async function rememberEmailContact(
  ctx: MutationCtx,
  identity: { subject: string; email?: string; emailVerified?: boolean; name?: string },
  localeValue?: unknown,
): Promise<EmailContact | null> {
  if (identity.emailVerified !== true || !identity.email) return null;
  const email = identity.email.trim().toLowerCase();
  if (!email || email.length > 254) return null;
  const locale = emailLocale(localeValue);
  const existing = await ctx.db
    .query('profiles')
    .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
    .first();
  const name = identity.name?.trim() || existing?.fullName?.trim() || 'Relok8 member';
  if (existing) {
    await ctx.db.patch(existing._id, { email, fullName: name, locale });
  } else {
    await ctx.db.insert('profiles', {
      userId: identity.subject,
      fullName: name,
      email,
      locale,
      isVerified: false,
      role: 'student',
      createdAt: Date.now(),
    });
  }
  return { userId: identity.subject, email, name, locale };
}

export async function getEmailContact(ctx: MutationCtx, userId?: string): Promise<EmailContact | null> {
  if (!userId) return null;
  const profile = await ctx.db
    .query('profiles')
    .withIndex('by_userId', (q) => q.eq('userId', userId))
    .first();
  if (!profile?.email) return null;
  return {
    userId,
    email: profile.email.trim().toLowerCase(),
    name: profile.fullName?.trim() || 'Relok8 member',
    locale: emailLocale(profile.locale),
  };
}
