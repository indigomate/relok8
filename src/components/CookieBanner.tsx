import React, { useState, useEffect } from 'react';
import { SupportedLocale } from '../utils/formatters';
import { t } from '../utils/translations';

export const CookieBanner: React.FC<{ locale: SupportedLocale }> = ({ locale }) => {
  const [isVisible, setIsVisible] = useState(false);
  const strings = t[locale];

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
    <div className="fixed bottom-4 inset-x-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-white border border-slate-200/90 shadow-2xl rounded-2xl p-4 text-left animate-in slide-in-from-bottom-4 duration-200">
      <div className="space-y-2">
        <h4 className="text-[13px] font-bold text-slate-900">
          {locale === 'pl' ? 'Prywatność i pliki cookies' : locale === 'uk' ? 'Конфіденційність та файли cookie' : 'Privacy & Cookie Settings'}
        </h4>
        <p className="text-[12px] text-slate-500 leading-relaxed">
          {strings.cookieNotice}
        </p>
        <div className="pt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-semibold rounded-xl transition-colors cursor-pointer"
          >
            {strings.cookieAccept}
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-semibold rounded-xl transition-colors cursor-pointer"
          >
            {strings.cookieDecline}
          </button>
        </div>
      </div>
    </div>
  );
};
