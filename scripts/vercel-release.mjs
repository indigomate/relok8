import { spawnSync } from 'node:child_process';

// Git deployments are intentionally restricted to main. Never deploy a backend
// from a preview, an unknown environment, or an unrecognized source branch.
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
