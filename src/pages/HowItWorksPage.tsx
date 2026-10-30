import React from 'react';
import { ArrowLeft, CheckCircle2, Shield, ShieldCheck, FileCheck, Key, HelpCircle, ArrowRight } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';

interface HowItWorksPageProps {
  onBack: () => void;
  onOpenLeaveYourLease: () => void;
  onOpenBrowse: () => void;
  locale?: SupportedLocale;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({
  onBack,
  onOpenLeaveYourLease,
  onOpenBrowse,
  locale = 'en'
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-36 sm:pb-24 text-left font-sans">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 pt-4 sm:pt-8 space-y-6 sm:space-y-10">
        
        {/* Back navigation */}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer p-1 -ml-1 rounded-md hover:bg-indigo-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{locale === 'pl' ? 'Wróć do ogłoszeń' : 'Back to marketplace'}</span>
        </button>

        {/* Hero Section */}
        <div className="space-y-2.5 sm:space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100/70 text-indigo-800 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Official Guide · Art. 509 KC</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            How Lease Takeover Poland Works on Relok8
          </h1>
          <p className="text-xs sm:text-base text-slate-600 leading-relaxed">
            Take over an active rental contract directly from outgoing international students and expats with formal landlord approval, zero broker commissions, and clear address registration status (Meldunek).
          </p>
        </div>

        {/* 3 Step Deep Dive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-extrabold flex items-center justify-center border border-indigo-100">
              1
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {locale === 'pl' ? 'Przeglądaj ogłoszenia pokoi' : 'Browse room listings'}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Explore furnished studios and rooms in Warsaw, Kraków, Wrocław, Gdańsk, and Lublin. Review photos, transit times to universities, exact monthly rent, and deposit amounts.
            </p>
            <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>0 PLN agency fees</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Direct peer-to-peer contact</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-extrabold flex items-center justify-center border border-indigo-100">
              2
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Landlord Approval & Cesja
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {locale === 'pl' ? 'Wyślij wniosek o przejęcie najmu. Właściciel ma 7 dni na decyzję. Śledź wniosek w My Place. Zgoda nie potwierdza podpisania dokumentów ani płatności.' : 'Request a takeover. The landlord has 7 days to review it. Track the request in My Place. Approval does not confirm signed paperwork or payment.'}
            </p>
            <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Civil Code tenant rights (Art. 509 KC)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{locale === 'pl' ? 'Potwierdź warunki z właścicielem' : 'Confirm terms with the landlord'}</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-extrabold flex items-center justify-center border border-indigo-100">
              3
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Handover & Address Registration
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Complete the inspection protocol (protokół zdawczo-odbiorczy), settle the deposit directly peer-to-peer with the departing tenant or landlord, collect the keys, and register your residency (Meldunek) for your PESEL or Karta Pobytu.
            </p>
            <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{locale === 'pl' ? 'Sprawdź wymogi meldunkowe' : 'Check address registration requirements'}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{locale === 'pl' ? 'Potwierdzenia uczestników' : 'Participant confirmations'}</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Legal Protections Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-base">
            <Shield className="w-5 h-5" />
            <span>{locale === 'pl' ? 'Co potwierdza Relok8?' : 'What does Relok8 confirm?'}</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {locale === 'pl' ? 'Relok8 zapisuje wnioski, decyzje i potwierdzenia uczestników. Dane i zdjęcia pochodzą od autorów. Nie weryfikujemy niezależnie lokali, nie obsługujemy płatności i nie gwarantujemy zwrotu kaucji. Sprawdź umowę i w razie potrzeby uzyskaj profesjonalną poradę.' : 'Relok8 records requests, decisions and participant confirmations. Facts and photos come from listing authors. We do not independently verify properties, process payments or guarantee deposit returns. Check your agreement and obtain qualified advice when needed.'}
          </p>
        </div>

        {/* Dual CTA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={onOpenBrowse}
            className="p-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-left transition-colors flex items-center justify-between cursor-pointer"
          >
            <div>
              <div className="text-base font-bold">Find a room now</div>
              <div className="text-xs text-indigo-200 mt-1">Browse Warsaw, Kraków, Wrocław, Gdańsk, Lublin</div>
            </div>
            <ArrowRight className="w-5 h-5 text-indigo-200" />
          </button>

          <button
            type="button"
            onClick={onOpenLeaveYourLease}
            className="p-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-left transition-colors flex items-center justify-between cursor-pointer"
          >
            <div>
              <div className="text-base font-bold">Leaving your lease early?</div>
              <div className="text-xs text-slate-400 mt-1">{locale === 'pl' ? 'Znajdź nowego najemcę za zgodą właściciela' : 'Find a replacement with landlord approval'}</div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400" />
          </button>
        </div>

      </div>
    </div>
  );
};
