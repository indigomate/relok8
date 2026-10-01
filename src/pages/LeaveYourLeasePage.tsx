import React, { useState } from 'react';
import { 
  ArrowLeft, FileText, CheckCircle2, ShieldCheck, ArrowRight, 
  Sparkles, Download, HelpCircle, AlertCircle, Building2, Users 
} from 'lucide-react';
import { SupportedLocale, formatPLN } from '../utils/formatters';
import { navigateTo } from '../utils/router';

interface LeaveYourLeasePageProps {
  onBack: () => void;
  locale?: SupportedLocale;
  onOpenIntake?: () => void;
  onOpenCesja?: () => void;
}

export const LeaveYourLeasePage: React.FC<LeaveYourLeasePageProps> = ({
  onBack,
  locale = 'en',
  onOpenIntake,
  onOpenCesja
}) => {
  const [rent, setRent] = useState<number>(2500);
  const [monthsRemaining, setMonthsRemaining] = useState<number>(5);

  const penaltySaved = rent * 2; // typically 2 months break fee saved
  const depositSaved = rent * 1; // 1 month deposit returned
  const totalSaved = penaltySaved + depositSaved;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 text-left">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 pt-8 space-y-10">
        
        {/* Back navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{locale === 'pl' ? 'Wróć do ogłoszeń' : 'Back to rooms'}</span>
          </button>
          <span>/</span>
          <span className="text-slate-700 font-medium">{locale === 'pl' ? 'Wcześniejsza wyprowadzka' : 'Leave your lease early'}</span>
        </div>

        {/* Hero Section */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{locale === 'pl' ? 'Art. 509 Kodeksu Cywilnego · 100% Legalne' : 'Art. 509 Civil Code · 100% Legal'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {locale === 'pl'
              ? 'Wyprowadź się przed końcem umowy bez utraty kaucji i kar'
              : 'Exit Your Rental Lease Early in Poland with Zero Penalties'}
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            {locale === 'pl'
              ? 'Większość umów najmu na czas oznaczony w Polsce nie pozwala na wcześniejsze zerwanie umowy bez utraty całej kaucji lub opłat za pozostałe miesiące. Cesja umowy (przekazanie najmu) rozwiązuje ten problem całkowicie legalnie.'
              : 'In Poland, fixed-term rental agreements (umowa najmu na czas oznaczony) cannot simply be cancelled early without forfeiting your deposit or facing heavy penalties. A Cesja (lease transfer) allows you to hand over the contract seamlessly.'}
          </p>
        </div>

        {/* 4-Step Process Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              step: '1',
              title: locale === 'pl' ? 'Zgoda właściciela' : 'Landlord Consent',
              desc: locale === 'pl' ? 'Poinformuj wynajmującego, że znajdziesz godnego zaufania następcę na identycznych warunkach.' : 'Confirm with your landlord that you will introduce a replacement tenant on the exact same terms.'
            },
            {
              step: '2',
              title: locale === 'pl' ? 'Dodaj pokój' : 'List on Relok8',
              desc: locale === 'pl' ? 'Wstaw darmowe ogłoszenie w 2 minuty i odbieraj zapytania od zweryfikowanych studentów.' : 'Post your room for free in 2 minutes to reach verified students and expats looking to move in.'
            },
            {
              step: '3',
              title: locale === 'pl' ? 'Porozumienie Cesji' : 'Sign Cesja Protocol',
              desc: locale === 'pl' ? 'Wygeneruj trójstronne porozumienie (Art. 509 KC) chroniące Ciebie, nowego najemcę i właściciela.' : 'Generate the bilingual tripartite agreement ensuring you are fully released from all future liabilities.'
            },
            {
              step: '4',
              title: locale === 'pl' ? 'Zwrot kaucji' : 'Deposit Return',
              desc: locale === 'pl' ? 'Nowy najemca przekazuje Ci kaucję w dniu protokołu zdawczo-odbiorczego. Zero kar.' : 'The incoming tenant reimburses your deposit upon protocol inspection handover. Zero fees lost.'
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 font-extrabold flex items-center justify-center text-xs">
                {item.step}
              </div>
              <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Built-in Interactive Calculator */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900">
              {locale === 'pl' ? 'Kalkulator oszczędności przy cesji' : 'Lease Transfer Savings Calculator'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              {locale === 'pl' ? 'Sprawdź ile zaoszczędzisz przekazując umowę zamiast jej jednostronnego zerwania:' : 'Calculate how much money you save by finding a replacement tenant rather than breaking the lease:'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {locale === 'pl' ? 'Twój miesięczny czynsz (PLN)' : 'Your monthly rent (PLN)'}
                </label>
                <input
                  type="number"
                  min={500}
                  max={15000}
                  step={50}
                  value={rent}
                  onChange={(e) => setRent(Number(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {locale === 'pl' ? 'Miesięcy pozostałych do końca umowy' : 'Months remaining on your contract'}
                </label>
                <input
                  type="range"
                  min={1}
                  max={12}
                  value={monthsRemaining}
                  onChange={(e) => setMonthsRemaining(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-slate-500 pt-1 font-semibold">
                  <span>1 month</span>
                  <span className="text-indigo-600 font-bold">{monthsRemaining} months</span>
                  <span>12 months</span>
                </div>
              </div>
            </div>

            {/* Result Box */}
            <div className="p-6 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  {locale === 'pl' ? 'Szacowane oszczędności' : 'Total Saved with Relok8'}
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-indigo-950 mt-1">
                  {formatPLN(totalSaved, locale)}
                </div>
                <p className="text-xs text-indigo-800 mt-2 leading-relaxed">
                  {locale === 'pl'
                    ? `Odzyskujesz ${formatPLN(depositSaved, locale)} kaucji oraz unikasz ${formatPLN(penaltySaved, locale)} kar za zerwanie najmu.`
                    : `You protect ${formatPLN(depositSaved, locale)} in deposit returns and prevent ${formatPLN(penaltySaved, locale)} in typical lease break liability.`}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenIntake) onOpenIntake();
                    else navigateTo(locale === 'pl' ? '/pl/list' : '/list');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{locale === 'pl' ? 'Dodaj swój pokój teraz' : 'List your room now'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenCesja) onOpenCesja();
                    else navigateTo(locale === 'pl' ? '/pl/cesja-template' : '/cesja-template');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{locale === 'pl' ? 'Pobierz wzór cesji' : 'Cesja template'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ crosslink */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <h4 className="font-bold text-sm text-slate-900">
              {locale === 'pl' ? 'Masz pytania dotyczące zgody właściciela lub protokołu?' : 'Have questions regarding landlord approval or the handover protocol?'}
            </h4>
            <p className="text-xs text-slate-500">
              {locale === 'pl' ? 'Zobacz szczegółowe odpowiedzi w naszym Centrum Pomocy.' : 'Read detailed explanations in our dedicated Help Center.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo(locale === 'pl' ? '/pl/help' : '/help')}
            className="px-5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            {locale === 'pl' ? 'Centrum Pomocy & FAQ' : 'Help Center & FAQ'} &rarr;
          </button>
        </div>

      </div>
    </div>
  );
};
