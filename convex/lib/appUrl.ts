const DEFAULT_APP_ORIGIN = 'https://relok8.online';

export function appOrigin(): string {
  const configured = process.env.PUBLIC_APP_URL?.trim();
  if (!configured) return DEFAULT_APP_ORIGIN;
  try {
    const url = new URL(configured);
    if (url.protocol !== 'https:' && url.hostname !== 'localhost') return DEFAULT_APP_ORIGIN;
    return url.origin;
  } catch {
    return DEFAULT_APP_ORIGIN;
  }
}

export function convexSiteOrigin(): string {
  const configured = process.env.CONVEX_SITE_URL?.trim();
  if (!configured) return 'https://modest-anteater-459.convex.site';
  try {
    const url = new URL(configured);
    return url.protocol === 'https:' ? url.origin : 'https://modest-anteater-459.convex.site';
  } catch {
    return 'https://modest-anteater-459.convex.site';
  }
}
