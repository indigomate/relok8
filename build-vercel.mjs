import { build } from 'vite';

// Public development identifiers only. Production requires Vercel configuration.
if (process.env.VERCEL_ENV === 'preview') {
  process.env.VITE_CONVEX_URL ||= 'https://chatty-seahorse-914.convex.cloud';
  process.env.VITE_CLERK_PUBLISHABLE_KEY ||= 'pk_test_aW4tcGVsaWNhbi00NjY0LmNsZXJrLmFjY291bnRzLmRldiQ';
}
for (const name of ['VITE_CONVEX_URL', 'VITE_CLERK_PUBLISHABLE_KEY']) {
  if (!process.env[name]) throw new Error(`Missing Vercel build setting: ${name}`);
}
await build();
