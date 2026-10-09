import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calculator, CheckCircle2, Shield, ArrowRight, 
  DollarSign, FileCheck, HelpCircle 
} from 'lucide-react';
import { SupportedLocale, formatPLN } from '../utils/formatters';
import { navigateTo } from '../utils/router';

interface SavingsCalculatorPageProps {
  onBack: () => void;
  locale?: SupportedLocale;
  onOpenIntake?: () => void;
}

export const SavingsCalculatorPage: React.FC<SavingsCalculatorPageProps> = ({
  onBack,
  locale = 'en',
  onOpenIntake
}) => {
  const [rentPLN, setRentPLN] = useState<string>('2500');
  const [penaltyMonths, setPenaltyMonths] = useState(2);
  const [depositPLN, setDepositPLN] = useState<string>('2800');

  const numRent = Number(rentPLN) || 0;
  const numDeposit = Number(depositPLN) || 0;
  const traditionalPenaltyCost = numRent * penaltyMonths;
  const totalTraditionalLoss = traditionalPenaltyCost + numDeposit;
  const brokerCommissionSaved = numRent; // 1 month rent typically charged by agencies in Poland
  const relok8Fee = 0; // 0 PLN agency fee
  const netSavings = totalTraditionalLoss - relok8Fee + brokerCommissionSaved;

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
          <span className="text-slate-700 font-medium">{locale === 'pl' ? 'Kalkulator oszczędności' : 'Savings calculator'}</span>
        </div>

        {/* Hero Section */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <Calculator className="w-3.5 h-3.5" />
            <span>{locale === 'pl' ? 'Symulator Finansowy Najmu' : 'Rental Financial Simulator'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {locale === 'pl'
              ? 'Ile zaoszczędzisz przekazując umowę najmu z Relok8?'
              : 'Calculate How Much You Save with a Lease Takeover'}
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            {locale === 'pl'
              ? 'Wcześniejsze zerwanie umowy najmu na czas oznaczony w Polsce wiąże się ze stratą kaucji i koniecznością opłacenia kary za okres wypowiedzenia. Sprawdź dokładną różnicę:'
              : 'Breaking a fixed-term tenancy early in Poland typically costs 2–3 months of rent penalties plus forfeiture of the security deposit. Compare the numbers below:'}
          </p>
        </div>

        {/* Calculator Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Inputs Column */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-indigo-600" />
              <span>{locale === 'pl' ? 'Twoje parametry umowy' : 'Your Lease Contract Details'}</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {locale === 'pl' ? 'Miesięczny czynsz najmu (PLN)' : 'Monthly rent in Poland (PLN)'}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={rentPLN}
                  onChange={(e) => setRentPLN(e.target.value.replace(/\D/g, ''))}
                  placeholder="2500"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {locale === 'pl' ? 'Żądanie kary właściciela' : 'Landlord penalty demand'}
                  </label>
                  <select
                    value={penaltyMonths}
                    onChange={(e) => setPenaltyMonths(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                  >
                    <option value={1}>{locale === 'pl' ? '1 miesiąc wypowiedzenia' : '1 month notice'}</option>
                    <option value={2}>{locale === 'pl' ? '2 miesiące kary umownej' : '2 months penalty fee'}</option>
                    <option value={3}>{locale === 'pl' ? '3 miesiące kary umownej' : '3 months penalty fee'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {locale === 'pl' ? 'Wpłacona kaucja (PLN)' : 'Security deposit paid (PLN)'}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={depositPLN}
                    onChange={(e) => setDepositPLN(e.target.value.replace(/\D/g, ''))}
                    placeholder="2800"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>{locale === 'pl' ? 'Zasada zero prowizji' : 'Zero Agency Commission Policy'}</span>
                </div>
                <p className="leading-relaxed">
                  {locale === 'pl'
                    ? 'Agencje nieruchomości w Polsce pobierają zazwyczaj 100% jednomiesięcznego czynszu + 23% VAT od najemcy lub właściciela. Na Relok8 cesja jest bezpośrednia (P2P) bez pośredników.'
                    : 'Real estate agencies in Poland charge up to 100% of one month’s rent (+23% VAT) as commission. On Relok8, transfer is 100% peer-to-peer with zero broker fee.'}
                </p>
              </div>
            </div>
          </div>

          {/* Results Comparison Column */}
          <div className="lg:col-span-5 bg-gradient-to-b from-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl text-left">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                {locale === 'pl' ? 'Łączne Oszczędności' : 'Total Net Savings with Relok8'}
              </span>
              <div className="text-4xl sm:text-5xl font-extrabold text-white mt-1">
                {formatPLN(netSavings, locale)}
              </div>
              <p className="text-xs text-indigo-200 mt-2">
                {locale === 'pl'
                  ? 'Zamiast tracić środki, odzyskujesz pełną kaucję i płacisz 0 zł za zerwanie umowy.'
                  : 'Instead of losing money, you walk away with your full deposit and zero contract penalties.'}
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-indigo-900/60 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>{locale === 'pl' ? 'Uniknięta kara za wypowiedzenie:' : 'Avoided lease break penalty:'}</span>
                <span className="font-bold text-emerald-400 font-mono">+{formatPLN(traditionalPenaltyCost, locale)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>{locale === 'pl' ? 'Odzyskana kaucja gwarancyjna:' : 'Preserved deposit return:'}</span>
                <span className="font-bold text-emerald-400 font-mono">+{formatPLN(numDeposit, locale)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>{locale === 'pl' ? 'Prowizja pośrednika (uniknięta):' : 'Avoided agency commission:'}</span>
                <span className="font-bold text-emerald-400 font-mono">+{formatPLN(brokerCommissionSaved, locale)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 pt-2 border-t border-indigo-900/60">
                <span>{locale === 'pl' ? 'Opłata Relok8:' : 'Relok8 fee:'}</span>
                <span className="font-bold text-white font-mono">0 PLN</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onOpenIntake) onOpenIntake();
                  else navigateTo(locale === 'pl' ? '/pl/list' : '/list');
                }}
                className="w-full py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>{locale === 'pl' ? 'Wystaw swój pokój do cesji' : 'List your room for takeover'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => navigateTo(locale === 'pl' ? '/pl/cesja-template' : '/cesja-template')}
                className="w-full py-3 rounded-xl bg-indigo-900/50 hover:bg-indigo-900/80 border border-indigo-700/50 text-indigo-100 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>{locale === 'pl' ? 'Pobierz wzór cesji (Art. 509 KC)' : 'Bilingual Cesja template (Art. 509 KC)'}</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
