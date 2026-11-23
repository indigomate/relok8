import { describe, expect, test } from 'vitest';
import { DEFAULT_ONLO_KNOWLEDGE } from '../convex/onloKnowledge';
import {
  knowledgePrompt,
  knowledgeSources,
  rankKnowledge,
  type OnloKnowledgeRecord,
} from '../convex/lib/onloRetrieval';

const records: OnloKnowledgeRecord[] = DEFAULT_ONLO_KNOWLEDGE.map((article) => ({
  ...article,
  keywords: [...article.keywords],
  active: true,
  lastVerifiedAt: Date.parse('2026-11-23T00:00:00.000Z'),
}));

describe('Onlo verified knowledge retrieval', () => {
  test('finds the canonical 49 + 49 pricing and payment limitation', () => {
    const result = rankKnowledge('Do I pay 49 PLN and does Relok8 hold my deposit?', records);
    expect(result[0].slug).toBe('relok8-pricing-and-payments');
    expect(result[0].answerEn).toContain('Checkout is not enabled yet');
    expect(result[0].answerEn).toContain('does not hold escrow');
  });

  test('matches Polish questions without requiring Polish diacritics', () => {
    const result = rankKnowledge('Czy cudzoziemiec dostanie PESEL po zameldowaniu?', records);
    expect(result.some((article) => article.slug === 'poland-pesel-foreigners')).toBe(true);
  });

  test('uses the limitations article when no verified topic matches', () => {
    const result = rankKnowledge('Who will win the football match tomorrow?', records);
    expect(result.map((article) => article.slug)).toEqual(['onlo-verified-scope']);
  });

  test('returns source metadata separately and numbers the model context', () => {
    const selected = rankKnowledge('How does a lease takeover need landlord consent?', records);
    const sources = knowledgeSources(selected, 'en');
    expect(sources[0]).toMatchObject({ kind: 'official' });
    expect(sources[0].url).toMatch(/^https:\/\//);
    expect(knowledgePrompt(selected, 'en')).toContain('[1]');
    expect(knowledgePrompt(selected, 'en')).toContain('Last verified: 2026-11-23');
  });
});
