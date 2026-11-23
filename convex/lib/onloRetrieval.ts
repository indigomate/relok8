export type KnowledgeLocale = 'en' | 'pl';

export interface OnloKnowledgeRecord {
  slug: string;
  category: string;
  jurisdiction: string;
  titleEn: string;
  titlePl: string;
  answerEn: string;
  answerPl: string;
  keywords: string[];
  sourceLabelEn: string;
  sourceLabelPl: string;
  sourceUrl?: string;
  sourceKind: 'official' | 'internal';
  legalDisclaimer: boolean;
  lastVerifiedAt: number;
  active: boolean;
  version: number;
  ragVersion?: number;
  ragEntryId?: string;
  ragSyncedAt?: number;
}

export interface OnloSource {
  id: string;
  label: string;
  url?: string;
  kind: 'official' | 'internal';
}

const STOP_WORDS = new Set([
  'about', 'after', 'also', 'and', 'are', 'can', 'czy', 'dla', 'does', 'from', 'have', 'how', 'jak', 'jest',
  'mieć', 'nie', 'oraz', 'się', 'that', 'the', 'this', 'what', 'when', 'where', 'with', 'your', 'żeby',
]);

export function normalizeKnowledgeText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('pl-PL')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function tokens(value: string): string[] {
  return normalizeKnowledgeText(value)
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function recordSearchText(record: OnloKnowledgeRecord): string {
  return normalizeKnowledgeText([
    record.slug,
    record.category,
    record.titleEn,
    record.titlePl,
    record.answerEn,
    record.answerPl,
    ...record.keywords,
  ].join(' '));
}

export function scoreKnowledgeRecord(question: string, record: OnloKnowledgeRecord): number {
  if (!record.active) return 0;
  const normalizedQuestion = normalizeKnowledgeText(question);
  if (!normalizedQuestion) return 0;
  const questionTokens = [...new Set(tokens(question))];
  const searchText = recordSearchText(record);
  const searchTokens = new Set(tokens(searchText));
  let score = 0;

  for (const keyword of record.keywords) {
    const normalizedKeyword = normalizeKnowledgeText(keyword);
    if (!normalizedKeyword) continue;
    if (normalizedQuestion.includes(normalizedKeyword)) score += normalizedKeyword.includes(' ') ? 10 : 6;
  }
  for (const token of questionTokens) {
    if (searchTokens.has(token)) score += 1.5;
  }
  const titleEn = normalizeKnowledgeText(record.titleEn);
  const titlePl = normalizeKnowledgeText(record.titlePl);
  if (titleEn.includes(normalizedQuestion) || titlePl.includes(normalizedQuestion)) score += 8;
  return score;
}

export function rankKnowledge(question: string, records: OnloKnowledgeRecord[], limit = 4, includeFallback = true): OnloKnowledgeRecord[] {
  const ranked = records
    .map((record) => ({ record, score: scoreKnowledgeRecord(question, record) }))
    .filter(({ score }) => score >= 3)
    .sort((a, b) => b.score - a.score || b.record.lastVerifiedAt - a.record.lastVerifiedAt)
    .slice(0, limit)
    .map(({ record }) => record);

  if (ranked.length || !includeFallback) return ranked;
  const fallback = records.find((record) => record.active && record.slug === 'onlo-verified-scope');
  return fallback ? [fallback] : [];
}

export function knowledgeSources(records: OnloKnowledgeRecord[], locale: KnowledgeLocale): OnloSource[] {
  const seen = new Set<string>();
  const output: OnloSource[] = [];
  for (const record of records) {
    const key = record.sourceUrl || `${record.sourceKind}:${record.sourceLabelEn}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push({
      id: record.slug,
      label: locale === 'pl' ? record.sourceLabelPl : record.sourceLabelEn,
      url: record.sourceUrl,
      kind: record.sourceKind,
    });
  }
  return output;
}

export function knowledgePrompt(records: OnloKnowledgeRecord[], locale: KnowledgeLocale): string {
  return records.map((record, index) => {
    const title = locale === 'pl' ? record.titlePl : record.titleEn;
    const answer = locale === 'pl' ? record.answerPl : record.answerEn;
    const label = locale === 'pl' ? record.sourceLabelPl : record.sourceLabelEn;
    const warning = record.legalDisclaimer
      ? (locale === 'pl' ? 'To ogólna informacja, nie porada prawna.' : 'This is general information, not legal advice.')
      : '';
    return `[${index + 1}] ${title}\nVerified guidance: ${answer}\nSource: ${label}${record.sourceUrl ? ` — ${record.sourceUrl}` : ''}\nLast verified: ${new Date(record.lastVerifiedAt).toISOString().slice(0, 10)}${warning ? `\nCaution: ${warning}` : ''}`;
  }).join('\n\n');
}
