import { useAction } from 'convex/react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../convex/_generated/api';
import type { SupportedLocale } from '../utils/formatters';

export interface LiveTranslationItem {
  key: string;
  text: string;
}

export function useLiveTranslations(items: LiveTranslationItem[], locale: SupportedLocale, enabled = true) {
  const translateBatch = useAction((api as any).services.translateBatch);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const normalized = useMemo(
    () => items
      .filter((item) => item.key && item.text.trim())
      .map((item) => ({ key: item.key, text: item.text.trim() })),
    [JSON.stringify(items.map((item) => [item.key, item.text]))],
  );
  const signature = useMemo(() => JSON.stringify(normalized), [normalized]);

  useEffect(() => {
    let cancelled = false;
    setTranslations({});
    if (!enabled || normalized.length === 0) return () => { cancelled = true; };

    const run = async () => {
      setIsTranslating(true);
      try {
        const next: Record<string, string> = {};
        for (let start = 0; start < normalized.length; start += 25) {
          const batch = normalized.slice(start, start + 25);
          const translated = await translateBatch({
            texts: batch.map((item) => item.text),
            targetLocale: locale === 'pl' ? 'pl' : 'en',
          });
          if (cancelled) return;
          batch.forEach((item, index) => {
            const value = translated[index]?.trim();
            if (value) next[item.key] = value;
          });
        }
        if (!cancelled) setTranslations(next);
      } catch {
        if (!cancelled) setTranslations({});
      } finally {
        if (!cancelled) setIsTranslating(false);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [enabled, locale, signature, translateBatch]);

  return { translations, isTranslating };
}
