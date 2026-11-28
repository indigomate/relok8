import { describe, expect, test } from 'vitest';
import {
  detectSupportedTranslationSource,
  parseOpusTranslationResponse,
  translateOpusBatchResiliently,
  translatePublicTextsWithFallback,
} from '../convex/services';

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

describe('Opus-MT English and Polish routing', () => {
  test('constrains unreliable short-text detection to supported languages', () => {
    expect(detectSupportedTranslationSource('Its okay')).toBe('en');
    expect(detectSupportedTranslationSource('Hi sorry I was busy')).toBe('en');
    expect(detectSupportedTranslationSource('Private room in Lublin')).toBe('en');
    expect(detectSupportedTranslationSource('Dzień dobry, czy pokój jest nadal dostępny?')).toBe('pl');
  });

  test('processes provider calls sequentially and preserves partial results', async () => {
    let active = 0;
    let maximumActive = 0;
    const translated = await translateOpusBatchResiliently(
      ['Pierwsza wiadomość', 'Druga wiadomość'],
      'en',
      async (_source, _target, text) => {
        active += 1;
        maximumActive = Math.max(maximumActive, active);
        await Promise.resolve();
        active -= 1;
        if (text.startsWith('Pierwsza')) throw new Error('temporary item failure');
        return 'Second message';
      },
    );

    expect(maximumActive).toBe(1);
    expect(translated).toEqual(['Pierwsza wiadomość', 'Second message']);
  });

  test('surfaces a complete provider outage', async () => {
    await expect(translateOpusBatchResiliently(
      ['Dzień dobry'],
      'en',
      async () => { throw new Error('provider unavailable'); },
    )).rejects.toThrow('provider unavailable');
  });
});
