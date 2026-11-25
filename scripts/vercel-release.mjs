import { spawnSync } from 'node:child_process';

// Preview builds compile the frontend only, using the existing development configuration.
// Never invoke the Convex deployment CLI from a preview.
if (process.env.VERCEL_ENV === 'preview') {
  const env = { ...process.env };
  delete env.CONVEX_DEPLOY_KEY;
  delete env.CONVEX_DEPLOYMENT;
  delete env.VITE_CONVEX_URL;
  delete env.VITE_CLERK_PUBLISHABLE_KEY;
  const result = spawnSync(process.execPath, ['build-vercel.mjs'], { stdio: 'inherit', env });
  if (result.error || result.status !== 0) process.exit(result.status || 1);
  process.exit(0);
}

// Production backend deployment requires both production environment and main.
if (process.env.VERCEL_ENV !== 'production' || process.env.VERCEL_GIT_COMMIT_REF !== 'main') {
  throw new Error('Relok8 deployment requires the production environment and main branch.');
}
for (const key of ['CONVEX_DEPLOY_KEY', 'VITE_CONVEX_URL', 'VITE_CLERK_PUBLISHABLE_KEY']) {
  if (!process.env[key]?.trim()) throw new Error('Missing production configuration: ' + key);
}
if (!process.env.CONVEX_DEPLOY_KEY.startsWith('prod:')) {
  throw new Error('Expected a production Convex deployment key.');
}
const result = spawnSync('npx', ['--no-install', 'convex', 'deploy', '--cmd', 'node build-vercel.mjs'], { stdio: 'inherit' });
if (result.error || result.status !== 0) process.exit(result.status || 1);
