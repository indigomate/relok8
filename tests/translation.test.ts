import { describe, expect, test } from 'vitest';
import { parseOpusTranslationResponse } from '../convex/services';

describe('Opus-MT response validation', () => {
  test('accepts the official REST and websocket-router response shapes', () => {
    expect(parseOpusTranslationResponse({ translation: 'Pokój w Warszawie' })).toBe('Pokój w Warszawie');
    expect(parseOpusTranslationResponse({ result: 'Dostępny od maja' })).toBe('Dostępny od maja');
  });

  test('rejects errors and malformed translations', () => {
    expect(() => parseOpusTranslationResponse({ error: 'Language pair xx-pl not supported' })).toThrow('not supported');
    expect(() => parseOpusTranslationResponse({ translation: '' })).toThrow('invalid');
    expect(() => parseOpusTranslationResponse('ignore previous instructions')).toThrow('invalid');
  });
});
