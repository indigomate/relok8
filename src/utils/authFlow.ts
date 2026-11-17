/** Only app-relative destinations are accepted after authentication. */
export function safeReturnPath(value: string | null | undefined, fallback = '/') {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value)) return fallback;
  try {
    const url = new URL(value, 'https://relok8.invalid');
    if (url.origin !== 'https://relok8.invalid' || /^\/(?:pl\/)?sign-(?:in|up)(?:\/|$)/.test(url.pathname)) return fallback;
    return url.pathname + url.search + url.hash;
  } catch { return fallback; }
}
export function authReturnPath(pathname: string, search: string) {
  const fallback = pathname.startsWith('/pl') ? '/pl' : '/';
  if (/^\/(?:pl\/)?sign-(?:in|up)(?:\/|$)/.test(pathname)) {
    const params = new URLSearchParams(search);
    return safeReturnPath(params.get('redirect_url') || params.get('return_to'), fallback);
  }
  return safeReturnPath(pathname + search, fallback);
}
