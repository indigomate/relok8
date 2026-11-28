export async function invitationKey(token: string): Promise<string> {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error('Invalid or expired invitation');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return 'sha256:' + Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}
export async function findInvitation(ctx: any, token: string) {
  const key = await invitationKey(token);
  const find = (value: string) => ctx.db.query('domainRecords').withIndex('by_key', (q: any) => q.eq('kind', 'invitation').eq('key', value)).unique();
  return await find(key) || await find(token);
}
