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

export default crons;
