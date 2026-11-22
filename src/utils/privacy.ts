function stableCode(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).toUpperCase().padStart(4, '0').slice(-4);
}

export function publicMemberAlias(stableId: string, locale = 'en'): string {
  const label = locale === 'pl' ? 'Użytkownik' : 'Member';
  return `${label} ${stableCode(stableId || 'relok8-member')}`;
}
