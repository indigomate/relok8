import type { ConvexReactClient } from 'convex/react';
let client: ConvexReactClient | null = null;
export function configureBackend(value: ConvexReactClient) { client = value; }
export function backend(): ConvexReactClient { if (!client) throw new Error('Backend is not configured'); return client; }
