import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// Run hourly because Europe/Warsaw changes between CET and CEST. The dispatcher
// checks each subscriber's local hour and an idempotent per-day delivery key.
crons.hourly(
  'queue due WhatsApp apartment digests',
  { minuteUTC: 5 },
  internal.whatsapp.queueDueDigests,
  {}
);

crons.hourly(
  'queue unread email summaries',
  { minuteUTC: 20 },
  (internal as any).emailAutomation.queueUnreadMessageSummaries,
  {}
);

crons.daily(
  'queue listing expiry reminders',
  { hourUTC: 6, minuteUTC: 35 },
  (internal as any).emailAutomation.queueListingExpiryReminders,
  {}
);

crons.daily(
  'invite consented members without a listing',
  { hourUTC: 9, minuteUTC: 40 },
  (internal as any).emailAutomation.queueListingNudges,
  {}
);

crons.weekly(
  'queue consented weekly property digests',
  { dayOfWeek: 'monday', hourUTC: 7, minuteUTC: 10 },
  (internal as any).emailAutomation.queueWeeklyDigests,
  {}
);

export default crons;
