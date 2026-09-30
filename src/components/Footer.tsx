import React from 'react';
import { ENABLED_CITIES } from '../data/cities';
import { SupportedLocale } from '../utils/formatters';
import { t } from '../utils/translations';
import { navigateTo, navigateToCity } from '../utils/router';

interface FooterProps {
  onOpenLeaveYourLease: () => void;
  onOpenHelp: () => void;
  onOpenSavingsCalculator?: () => void;
  onOpenReportListing?: () => void;
  locale?: SupportedLocale;
  theme?: 'dark' | 'light';
}

export const Footer: React.FC<FooterProps> = ({
  onOpenLeaveYourLease,
  onOpenHelp,
  onOpenSavingsCalculator,
  onOpenReportListing,
  locale = 'en'
}) => {
  const strings = t[locale === 'pl' ? 'pl' : 'en'];

  const handleLink = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    const prefix = locale === 'pl' ? '/pl' : '';
    navigateTo(prefix + (path.startsWith('/') ? path : '/' + path));
  };

  return (
    <footer className="mt-20 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        
        {/* Four Columns (§4.6) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          
          {/* Column 1: Find a room (one link per enabled city, "Rooms in {City}") */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {strings.footerColFindRoom}
            </h4>
            <ul className="space-y-2">
              {ENABLED_CITIES.map((city) => (
                <li key={city.slug}>
                  <a
                    href={`/${locale === 'pl' ? 'pl/' : ''}${city.slug}/rooms`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigateToCity(city.slug, locale);
                    }}
                    className="text-slate-600 hover:text-indigo-600 transition-colors block text-left"
                  >
                    {locale === 'pl' ? `Pokoje w ${city.name === 'Warsaw' ? 'Warszawie' : city.name === 'Kraków' ? 'Krakowie' : city.name === 'Wrocław' ? 'Wrocławiu' : city.name === 'Gdańsk' ? 'Gdańsku' : 'Lublinie'}` : `Rooms in ${city.name}`}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Leaving early? */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {strings.footerColLeaving}
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/how-it-works"
                  onClick={(e) => handleLink('/how-it-works', e)}
                  className="text-slate-600 hover:text-indigo-600 transition-colors block text-left"
                >
                  {strings.footerHowItWorks}
                </a>
              </li>
              <li>
                <a
                  href="/leave-your-lease"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenLeaveYourLease();
                  }}
                  className="text-slate-600 hover:text-indigo-600 transition-colors block text-left"
                >
                  {strings.footerLeaveLease}
                </a>
              </li>
              <li>
                <a
                  href="/savings-calculator"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenSavingsCalculator) {
                      onOpenSavingsCalculator();
                    } else {
                      handleLink('/savings-calculator', e);
                    }
                  }}
                  className="text-slate-600 hover:text-indigo-600 transition-colors block text-left"
                >
                  {strings.footerSavingsCalc}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Help and safety */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {strings.footerColHelp}
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/help"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenHelp();
                  }}
                  className="text-slate-600 hover:text-indigo-600 transition-colors block text-left"
                >
                  {strings.footerFaq}
                </a>
              </li>
              <li>
                <a
                  href="/safety"
                  onClick={(e) => handleLink('/safety', e)}
                  className="text-slate-600 hover:text-indigo-600 transition-colors block text-left"
                >
                  {strings.footerSafetyTips}
                </a>
              </li>
              <li>
                <a
                  href="#report"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onOpenReportListing) onOpenReportListing();
                  }}
                  className="text-slate-600 hover:text-indigo-600 transition-colors block text-left"
                >
                  {strings.footerReportListing}
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@relok8.online"
                  className="text-slate-600 hover:text-indigo-600 transition-colors block text-left"
                >
                  {strings.footerContact}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Company */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {strings.footerColCompany}
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/about"
                  onClick={(e) => handleLink('/about', e)}
                  className="text-slate-600 hover:text-indigo-600 transition-colors block text-left"
                >
                  {strings.footerAbout}
                </a>
              </li>
              <li>
                <a
                  href="mailto:contact@relok8.online"
                  className="text-slate-600 hover:text-indigo-600 transition-colors block text-left"
                >
                  {strings.footerContact}
                </a>
              </li>
              <li>
                <a
                  href="/legal/terms"
                  onClick={(e) => handleLink('/legal/terms', e)}
                  className="text-slate-600 hover:text-indigo-600 transition-colors block text-left"
                >
                  {strings.footerTerms}
                </a>
              </li>
              <li>
                <a
                  href="/legal/privacy"
                  onClick={(e) => handleLink('/legal/privacy', e)}
                  className="text-slate-600 hover:text-indigo-600 transition-colors block text-left"
                >
                  {strings.footerPrivacy}
                </a>
              </li>
              <li>
                <a
                  href="/legal/cookies"
                  onClick={(e) => handleLink('/legal/cookies', e)}
                  className="text-slate-600 hover:text-indigo-600 transition-colors block text-left"
                >
                  {strings.footerCookies}
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Short Legal Notice (§4.6 and §9) */}
        <div className="pt-6 border-t border-slate-200/80 text-[11px] text-slate-500 leading-relaxed">
          <p>{strings.footerLegalNotice}</p>
          <p className="mt-1 text-slate-400">
            Relok8 Sp. z o.o. (w organizacji) · Al. Jerozolimskie 81, 02-001 Warszawa · NIP/KRS w toku rejestracji · contact@relok8.online
          </p>
        </div>

        {/* Bottom Bar: Copyright, Language, Currency */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            © 2026 Relok8. {strings.allRightsReserved}
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-700">PLN (zł)</span>
            <span className="text-slate-300">·</span>
            <span className="font-semibold text-slate-700">
              {locale === 'pl' ? 'Polski' : 'English'}
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};
