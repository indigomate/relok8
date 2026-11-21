import { useState } from 'react';
import { Globe } from 'lucide-react';
import type { SupportedLocale } from '../utils/formatters';

export function LiveTranslatedText({ original, translated, locale, className = '' }: {
  original: string;
  translated?: string;
  locale: SupportedLocale;
  className?: string;
}) {
  const [showOriginal, setShowOriginal] = useState(false);
  const hasTranslation = Boolean(translated?.trim() && translated.trim() !== original.trim());
  const visibleText = hasTranslation && !showOriginal ? translated : original;

  return (
    <span className={className}>
      <span className="whitespace-pre-wrap break-words">{visibleText}</span>
      {hasTranslation && (
        <button
          type="button"
          onClick={() => setShowOriginal((value) => !value)}
          className="mt-1 flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
        >
          <Globe className="h-3 w-3" aria-hidden="true" />
          {showOriginal
            ? (locale === 'pl' ? 'Pokaż tłumaczenie' : 'Show translation')
            : (locale === 'pl' ? 'Tłumaczenie Opus-MT · Oryginał' : 'Opus-MT translation · Original')}
        </button>
      )}
    </span>
  );
}
