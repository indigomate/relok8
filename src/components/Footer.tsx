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
          <strong className="text-slate-700">Legal notice & Cesja umowy najmu wzór english: </strong>
          Relok8 is a peer-to-peer housing exchange platform providing bilingual lease transfer agreements (Cesja umowy najmu wzór english under Art. 509 KC of the Polish Civil Code) to connect departing expats and students with incoming renters. We do not act as an unlicensed real estate broker or escrow bank. Lease transfers and address registrations (Rooms with Meldunek allowed) are executed directly between tenants and property owners with written landlord consent.
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
                  Student housing Warsaw
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
                  No agency commission flats Krakow
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
                  Rooms in Wrocław
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
                  Apartments in Gdańsk
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
                  Student housing Lublin
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
                <a href="#/how-it-works" className="hover:text-indigo-600 transition-colors block">
                  {locale === 'pl' ? 'Jak działa cesja' : 'How Lease Takeover Works'}
                </a>
              </li>
              <li>
                <a
                  href="#/list-your-room"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.hash = '#/list-your-room';
                    onOpenIntake();
                  }}
                  className="hover:text-indigo-600 transition-colors cursor-pointer text-left block"
                >
                  {locale === 'pl' ? 'Dodaj swój pokój' : 'List your room (Free)'}
                </a>
              </li>
              <li>
                <a
                  href="#/leave-your-lease"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.hash = '#/leave-your-lease';
                    onOpenLeaveYourLease();
                  }}
                  className="hover:text-indigo-600 transition-colors cursor-pointer text-left block"
                >
                  {locale === 'pl' ? 'Wyprowadzasz się? Przekaż najem' : 'Leaving early? Transfer lease'}
                </a>
              </li>
              <li>
                <a
                  href="#/meldunek-guide"
                  className="hover:text-indigo-600 transition-colors cursor-pointer text-left block"
                >
                  {locale === 'pl' ? 'Poradnik meldunkowy i PESEL' : 'Rooms with Meldunek & PESEL Guide'}
                </a>
              </li>
              <li>
                <a
                  href="#/cesja-template"
                  className="hover:text-indigo-600 transition-colors cursor-pointer text-left font-medium text-slate-800 block"
                >
                  Cesja umowy najmu wzór english
                </a>
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
                <a
                  href="#/help"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.hash = '#/help';
                    onOpenHelp();
                  }}
                  className="hover:text-indigo-600 transition-colors cursor-pointer text-left block"
                >
                  {locale === 'pl' ? 'Centrum pomocy / FAQ' : 'Help Center & FAQ'}
                </a>
              </li>
              <li>
                <a
                  href="#/safety-guide"
                  className="hover:text-indigo-600 transition-colors cursor-pointer text-left block"
                >
                  {locale === 'pl' ? 'Ochrona przed oszustwami' : 'Rental safety & scam prevention'}
                </a>
              </li>
              <li>
                <a
                  href="#/saved"
                  className="hover:text-indigo-600 transition-colors cursor-pointer text-left block"
                >
                  {locale === 'pl' ? 'Zapisane pokoje' : 'Saved Apartments'}
                </a>
              </li>
              <li>
                <a
                  href="#/cesja-template"
                  className="hover:text-indigo-600 transition-colors cursor-pointer text-left block text-slate-500"
                >
                  {locale === 'pl' ? 'Pisemny protokół zdawczy' : 'Handover inspection protocol'}
                </a>
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
            <a href="#/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#/terms" className="hover:text-slate-900 transition-colors">Terms of Service</a>
            <span>•</span>
            <a href="#/how-it-works" className="hover:text-slate-900 transition-colors">Art. 509 KC</a>
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
