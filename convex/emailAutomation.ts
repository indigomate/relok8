import { internalMutation } from './_generated/server';
import { queueEmailDelivery } from './emails';
import { appOrigin } from './lib/appUrl';
import { v } from 'convex/values';

const DAY_MS = 86_400_000;

function warsawDate(now = Date.now()): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Europe/Warsaw',
  }).format(new Date(now));
}

function daysUntil(date: string, now = Date.now()): number {
  const today = Date.parse(`${warsawDate(now)}T12:00:00Z`);
  const target = Date.parse(`${date}T12:00:00Z`);
  return Math.round((target - today) / DAY_MS);
}

function localizedDate(value: string, locale: 'en' | 'pl'): string {
  return new Intl.DateTimeFormat(locale === 'pl' ? 'pl-PL' : 'en-GB', {
    dateStyle: 'long', timeZone: 'Europe/Warsaw',
  }).format(new Date(`${value}T12:00:00Z`));
}

function weekKey(now = Date.now()): string {
  const date = new Date(`${warsawDate(now)}T12:00:00Z`);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / DAY_MS) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function emailLocale(value: unknown): 'en' | 'pl' {
  return value === 'pl' ? 'pl' : 'en';
}

function keyPart(value: unknown): string {
  return String(value).replace(/[^A-Za-z0-9_.-]/g, '_').slice(0, 180);
}

async function queueUnreadForThread(ctx: any, threadRow: any, now: number, minimumAgeMs: number): Promise<number> {
  const thread = threadRow.data || {};
  const stale = now - 7 * DAY_MS;
  if (
    !Array.isArray(thread.unreadFor) ||
    !thread.unreadFor.length ||
    typeof thread.lastMessageAt !== 'number' ||
    thread.lastMessageAt > now - minimumAgeMs ||
    thread.lastMessageAt < stale
  ) return 0;

  const messages = (await ctx.db.query('domainRecords').withIndex('by_kind', (q: any) => q.eq('kind', 'message')).collect())
    .filter((row: any) => row.data?.threadId === threadRow.key && typeof row.data?.createdAt === 'number');
  const leaseId = threadRow.placeId ? ctx.db.normalizeId('leases', threadRow.placeId) : null;
  const lease = leaseId ? await ctx.db.get(leaseId) : null;
  const readAtByUser = thread.readAtByUser && typeof thread.readAtByUser === 'object' ? thread.readAtByUser : {};
  let queued = 0;

  for (const userId of thread.unreadFor) {
    if (typeof userId !== 'string') continue;
    const profile = await ctx.db.query('profiles').withIndex('by_userId', (q: any) => q.eq('userId', userId)).unique();
    if (!profile?.email || profile.emailUnreadMessages === false) continue;
    const readAt = typeof readAtByUser[userId] === 'number' ? readAtByUser[userId] : 0;
    const unread = messages.filter((row: any) => row.data.authorId !== userId && row.data.createdAt > readAt);
    if (!unread.length) continue;
    const latest = unread.sort((left: any, right: any) => right.data.createdAt - left.data.createdAt)[0]?.data;
    const senderProfile = latest?.authorId && latest.authorId !== 'onlo'
      ? await ctx.db.query('profiles').withIndex('by_userId', (q: any) => q.eq('userId', latest.authorId)).unique()
      : null;
    const locale = emailLocale(profile.locale);
    const result = await queueEmailDelivery(ctx, {
      idempotencyKey: `unread-message:${keyPart(threadRow.key)}:${keyPart(userId)}:${readAt}`,
      userId,
      recipient: profile.email,
      template: 'unread_message',
      locale,
      templateData: {
        recipientName: profile.fullName,
        actorName: latest?.authorName || senderProfile?.fullName || (latest?.authorId === 'onlo' ? 'Onlo' : undefined),
        listingTitle: lease?.title || (locale === 'pl' ? 'ogłoszenia Relok8' : 'a Relok8 listing'),
        count: unread.length,
        ctaUrl: `${appOrigin()}${locale === 'pl' ? '/pl' : ''}/messages?thread=${encodeURIComponent(threadRow.key)}`,
      },
      relatedId: threadRow.key,
      scheduleDelivery: !profile.email.endsWith('.test'),
    });
    if (result.created) queued += 1;
  }
  return queued;
}

export const queueThreadMessageNotifications = internalMutation({
  args: { threadId: v.string() },
  handler: async (ctx, args) => {
    const threadRow = await ctx.db.query('domainRecords').withIndex('by_key', (q) => q.eq('kind', 'thread').eq('key', args.threadId)).unique();
    if (!threadRow) return { queued: 0 };
    return { queued: await queueUnreadForThread(ctx, threadRow, Date.now(), 2 * 60_000) };
  },
});

export const queueUnreadMessageSummaries = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const threads = await ctx.db.query('domainRecords').withIndex('by_kind', (q) => q.eq('kind', 'thread')).collect();
    let queued = 0;
    for (const threadRow of threads) {
      queued += await queueUnreadForThread(ctx, threadRow, now, 30 * 60_000);
    }
    return { queued };
  },
});

export const queueListingExpiryReminders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const leases = await ctx.db.query('leases').collect();
    const profiles = await ctx.db.query('profiles').collect();
    const profilesByUser = new Map(profiles.map((profile) => [profile.userId, profile]));
    let queued = 0;
    for (const lease of leases) {
      if (!lease.ownerId || ['PAUSED', 'TRANSFERRED', 'APPROVED', 'LEASED'].includes(lease.status)) continue;
      const remaining = daysUntil(lease.leaseEndDate);
      if (remaining !== 7 && remaining !== 1) continue;
      const profile = profilesByUser.get(lease.ownerId);
      if (!profile?.email || profile.emailListingReminders === false) continue;
      const locale = emailLocale(profile.locale);
      const result = await queueEmailDelivery(ctx, {
        idempotencyKey: `listing-expiry:${keyPart(lease._id)}:${remaining}d`,
        userId: lease.ownerId,
        recipient: profile.email,
        template: 'listing_expiry',
        locale,
        templateData: {
          recipientName: profile.fullName,
          listingTitle: lease.title,
          expiryDate: localizedDate(lease.leaseEndDate, locale),
          ctaUrl: `${appOrigin()}${locale === 'pl' ? '/pl' : ''}/place`,
        },
        relatedId: String(lease._id),
        scheduleDelivery: !profile.email.endsWith('.test'),
      });
      if (result.created) queued += 1;
    }
    return { queued };
  },
});

export const queueWeeklyDigests = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const currentWeek = weekKey(now);
    const profiles = await ctx.db.query('profiles').collect();
    const leases = (await ctx.db.query('leases').collect()).filter((lease) =>
      !['PAUSED', 'TRANSFERRED', 'APPROVED', 'LEASED'].includes(lease.status) &&
      daysUntil(lease.leaseEndDate, now) >= 0 &&
      (lease.createdAt || lease._creationTime) >= now - 7 * DAY_MS
    );
    let queued = 0;
    for (const profile of profiles) {
      if (!profile.email || profile.marketingConsent !== true || profile.emailWeeklyDigest !== true) continue;
      const cities = (profile.digestCities || []).map((value) => value.toLowerCase());
      const roomTypes = (profile.digestRoomTypes || []).map((value) => value.toLowerCase());
      const matches = leases.filter((lease) =>
        (!cities.length || cities.includes(lease.city.toLowerCase())) &&
        (!roomTypes.length || roomTypes.includes(lease.roomType.toLowerCase())) &&
        (!profile.digestMaxMonthlyRent || lease.monthlyRent <= profile.digestMaxMonthlyRent)
      ).sort((a, b) => (b.createdAt || b._creationTime) - (a.createdAt || a._creationTime)).slice(0, 5);
      if (!matches.length) continue;
      const locale = emailLocale(profile.locale);
      const result = await queueEmailDelivery(ctx, {
        idempotencyKey: `weekly-digest:${keyPart(profile.userId)}:${currentWeek}`,
        userId: profile.userId,
        recipient: profile.email,
        template: 'weekly_digest',
        locale,
        templateData: {
          recipientName: profile.fullName,
          count: matches.length,
          ctaUrl: `${appOrigin()}${locale === 'pl' ? '/pl' : ''}/`,
          listings: matches.map((lease) => ({
            title: lease.title,
            location: [lease.district, lease.city].filter(Boolean).join(', '),
            price: `${new Intl.NumberFormat(locale === 'pl' ? 'pl-PL' : 'en-GB').format(lease.monthlyRent)} PLN / ${locale === 'pl' ? 'miesiąc' : 'month'}`,
            meta: `${locale === 'pl' ? 'Dostępne od' : 'Available'} ${localizedDate(lease.moveInDate, locale)}`,
            imageUrl: lease.images?.[0],
            url: `${appOrigin()}${locale === 'pl' ? '/pl' : ''}/listing/${lease._id}`,
          })),
        },
        relatedId: currentWeek,
        scheduleDelivery: !profile.email.endsWith('.test'),
      });
      if (result.created) queued += 1;
    }
    return { queued };
  },
});

export const queueListingNudges = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const profiles = await ctx.db.query('profiles').collect();
    const leases = await ctx.db.query('leases').collect();
    const owners = new Set(leases.map((lease) => lease.ownerId).filter(Boolean));
    const stages = [
      { day: 3, number: 1 },
      { day: 10, number: 2 },
    ] as const;
    let queued = 0;

    for (const profile of profiles) {
      if (
        !profile.email ||
        profile.isVerified !== true ||
        profile.marketingConsent !== true ||
        owners.has(profile.userId) ||
        typeof profile.createdAt !== 'number'
      ) continue;
      const ageDays = Math.floor((now - profile.createdAt) / DAY_MS);
      for (const stage of stages) {
        if (ageDays < stage.day) continue;
        const locale = emailLocale(profile.locale);
        const result = await queueEmailDelivery(ctx, {
          idempotencyKey: `listing-nudge:${keyPart(profile.userId)}:v1:${stage.number}`,
          userId: profile.userId,
          recipient: profile.email,
          template: 'listing_nudge',
          locale,
          templateData: {
            recipientName: profile.fullName,
            count: stage.number,
            ctaUrl: `${appOrigin()}${locale === 'pl' ? '/pl' : ''}/list`,
          },
          relatedId: profile.userId,
          scheduleDelivery: !profile.email.endsWith('.test'),
        });
        if (result.created) {
          queued += 1;
          break;
        }
      }
    }
    return { queued };
  },
});
