import { describe, expect, test } from 'vitest';
import { parseOpusTranslationResponse, translatePublicTextsWithFallback } from '../convex/services';

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

  test('keeps public source text available when the provider is unavailable', async () => {
    const source = ['Room in Warsaw', 'Available from May'];
    await expect(translatePublicTextsWithFallback(source, async () => {
      throw new Error('translation provider unavailable');
    })).resolves.toEqual(source);
  });

  test('uses public translations only when the complete batch succeeds', async () => {
    const source = ['Room in Warsaw', 'Available from May'];
    await expect(translatePublicTextsWithFallback(source, async () => ['Pokój w Warszawie', 'Dostępny od maja']))
      .resolves.toEqual(['Pokój w Warszawie', 'Dostępny od maja']);
    await expect(translatePublicTextsWithFallback(source, async () => ['Incomplete']))
      .resolves.toEqual(source);
  });
});
