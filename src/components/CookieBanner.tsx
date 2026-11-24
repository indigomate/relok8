import React, { useState, useEffect } from 'react';
import { SupportedLocale } from '../utils/formatters';
import { t } from '../utils/translations';
import { Button } from './ui/Button';

export const CookieBanner: React.FC<{ locale: SupportedLocale }> = ({ locale }) => {
  const [isVisible, setIsVisible] = useState(false);
  const strings = t[locale === 'pl' ? 'pl' : 'en'];

  useEffect(() => {
    const consent = localStorage.getItem('r8_cookie_consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('r8_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('r8_cookie_consent', 'essential_only');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <section
      aria-labelledby="cookie-consent-title"
      className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] md:bottom-4 inset-x-2 sm:left-auto sm:right-4 sm:max-w-sm z-50 bg-white border border-slate-200 shadow-[var(--shadow-float)] rounded-[var(--radius-card)] p-3 text-left animate-in slide-in-from-bottom-2 duration-200"
    >
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div id="cookie-consent-title" role="heading" aria-level={2} className="text-sm leading-5 font-bold text-slate-900">
              {locale === 'pl' ? 'Prywatność i pliki cookies' : locale === 'uk' ? 'Конфіденційність та файли cookie' : 'Privacy & Cookie Settings'}
            </div>
            <div className="mt-0.5 text-xs leading-[1.125rem] text-slate-600 line-clamp-2 sm:line-clamp-none">
              {strings.cookieNotice}
            </div>
          </div>
          <a
            href={`${locale === 'pl' ? '/pl' : ''}/legal/cookies`}
            className="shrink-0 rounded-md px-1 py-0.5 text-[11px] font-semibold text-indigo-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            {locale === 'pl' ? 'Szczegóły' : 'Details'}
          </a>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleDecline}
            variant="secondary"
            size="md"
            fullWidth
            className="px-2 text-xs"
          >
            {strings.cookieDecline}
          </Button>
          <Button
            onClick={handleAccept}
            size="md"
            fullWidth
            className="px-2 text-xs"
          >
            {strings.cookieAccept}
          </Button>
        </div>
      </div>
    </section>
  );
};
