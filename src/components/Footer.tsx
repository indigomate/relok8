import React from 'react';
import { Relok8Logo } from './BrandLogo';
import { SupportedLocale } from '../utils/formatters';

interface FooterProps {
  onOpenLeaveYourLease: () => void;
  onOpenHelp: () => void;
  onOpenIntake: () => void;
  onSelectCity: (city: string) => void;
  locale?: SupportedLocale;
  theme?: 'dark' | 'light';
}

export const Footer: React.FC<FooterProps> = ({
  onOpenLeaveYourLease,
  onOpenHelp,
  onOpenIntake,
  onSelectCity,
  locale = 'en',
  theme = 'light'
}) => {
  return (
    <footer className="mt-20 bg-slate-50 border-t border-slate-200 text-[13px] text-slate-600 transition-colors">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-12 space-y-10">
        
        {/* Legal Disclaimer Card: Directly above the footer navigation columns */}
        <div className="bg-slate-50 border border-slate-200/80 text-slate-500 text-xs rounded-xl p-4 leading-relaxed">
          <strong className="text-slate-700">Legal notice: </strong>
          Relok8 is a housing platform that provides contract templates and connects outgoing tenants with prospective tenants. We do not act as a real estate broker or escrow bank. Lease transfers and address registrations are executed directly between tenants and property owners in accordance with Polish law.
        </div>

        {/* Main Footer Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8">
          
          {/* Col 1: Find a room */}
          <div className="space-y-3">
            <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-900">
              {locale === 'pl' ? 'Szukaj pokoju' : locale === 'uk' ? 'Пошук житла' : 'Find a room'}
            </h4>
            <ul className="space-y-2 text-[13px]">
              <li>
                <a
                  href="#/warsaw/rooms"
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectCity('Warsaw');
                  }}
                  className="hover:text-indigo-600 transition-colors text-left block"
                >
                  Warsaw / Warszawa
                </a>
              </li>
              <li>
                <a
                  href="#/krakow/rooms"
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectCity('Kraków');
                  }}
                  className="hover:text-indigo-600 transition-colors text-left block"
                >
                  Kraków
                </a>
              </li>
              <li>
                <a
                  href="#/wroclaw/rooms"
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectCity('Wrocław');
                  }}
                  className="hover:text-indigo-600 transition-colors text-left block"
                >
                  Wrocław
                </a>
              </li>
              <li>
                <a
                  href="#/gdansk/rooms"
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectCity('Gdańsk');
                  }}
                  className="hover:text-indigo-600 transition-colors text-left block"
                >
                  Gdańsk
                </a>
              </li>
              <li>
                <a
                  href="#/lublin/rooms"
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectCity('Lublin');
                  }}
                  className="hover:text-indigo-600 transition-colors text-left block"
                >
                  Lublin
                </a>
              </li>
            </ul>
          </div>

          {/* Col 2: Tenants & Landlords */}
          <div className="space-y-3">
            <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-900">
              {locale === 'pl' ? 'Dla najemców i właścicieli' : locale === 'uk' ? 'Для мешканців та власників' : 'Housing & Leases'}
            </h4>
            <ul className="space-y-2 text-[13px]">
              <li>
                <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">
                  {locale === 'pl' ? 'Jak to działa' : locale === 'uk' ? 'Як це працює' : 'How it works'}
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenIntake}
                  className="hover:text-indigo-600 transition-colors cursor-pointer text-left"
                >
                  {locale === 'pl' ? 'Dodaj swój pokój' : locale === 'uk' ? 'Додати кімнату' : 'List your room'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenLeaveYourLease}
                  className="hover:text-indigo-600 transition-colors cursor-pointer text-left"
                >
                  {locale === 'pl' ? 'Wyprowadzasz się? Przekaż najem' : locale === 'uk' ? 'Передати оренду без штрафів' : 'Leaving early? Transfer your lease'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenHelp}
                  className="hover:text-indigo-600 transition-colors cursor-pointer text-left"
                >
                  {locale === 'pl' ? 'Poradnik meldunkowy i PESEL' : 'Registration (Meldunek) guide'}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Trust & Safety */}
          <div className="space-y-3">
            <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-900">
              {locale === 'pl' ? 'Pomoc i bezpieczeństwo' : locale === 'uk' ? 'Безпека та допомога' : 'Trust & Safety'}
            </h4>
            <ul className="space-y-2 text-[13px]">
              <li>
                <button
                  type="button"
                  onClick={onOpenHelp}
                  className="hover:text-indigo-600 transition-colors cursor-pointer text-left"
                >
                  {locale === 'pl' ? 'Centrum pomocy / FAQ' : locale === 'uk' ? 'Довідковий центр' : 'Help Center & FAQ'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenHelp}
                  className="hover:text-indigo-600 transition-colors cursor-pointer text-left"
                >
                  {locale === 'pl' ? 'Ochrona przed oszustwami' : 'Rental safety & scam tips'}
                </button>
              </li>
              <li>
                <span className="text-slate-500">
                  {locale === 'pl' ? 'Pisemny protokół zdawczy' : 'Handover inspection protocol'}
                </span>
              </li>
              <li>
                <span className="text-slate-500">
                  {locale === 'pl' ? 'Weryfikacja tożsamości najemców' : 'Student & ID verification'}
                </span>
              </li>
            </ul>
          </div>

          {/* Col 4: About & Contact */}
          <div className="space-y-3">
            <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-900">
              {locale === 'pl' ? 'O Relok8' : 'About & Contact'}
            </h4>
            <p className="text-[12px] text-slate-500 leading-relaxed">
              {locale === 'pl'
                ? 'Relok8 to platforma łącząca zagranicznych studentów i specjalistów z pokojami bez prowizji agencji.'
                : 'Direct student & expat housing in Poland without broker commissions. Verified handovers with landlord approval.'}
            </p>
            <div className="pt-1 text-[13px]">
              <a href="mailto:hello@relok8.online" className="text-indigo-600 hover:underline font-medium">
                hello@relok8.online
              </a>
            </div>
          </div>

        </div>

        {/* Footer Row: Single border-separated row with legal links, copyright, and currency/language selector */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-3">
            <span>© 2026 Relok8</span>
            <span>•</span>
            <a href="#privacy" className="hover:text-slate-900 transition-colors">Privacy</a>
            <span>•</span>
            <a href="#terms" className="hover:text-slate-900 transition-colors">Terms</a>
            <span>•</span>
            <a href="#cookies" className="hover:text-slate-900 transition-colors">Cookies</a>
            <span>•</span>
            <span className="text-slate-400">relok8.online</span>
          </div>

          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <span>PLN (zł)</span>
            <span>•</span>
            <span>{locale === 'pl' ? 'Polski' : locale === 'uk' ? 'Українська' : 'English'}</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
