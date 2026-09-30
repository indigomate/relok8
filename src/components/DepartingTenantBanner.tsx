import React from 'react';
import { Calculator, ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';
import { t } from '../utils/translations';

interface DepartingTenantBannerProps {
  onOpenLeaveLease: () => void;
  onOpenIntake: () => void;
  locale: SupportedLocale;
}

export const DepartingTenantBanner: React.FC<DepartingTenantBannerProps> = ({
  onOpenLeaveLease,
  onOpenIntake,
  locale
}) => {
  const strings = t[locale === 'pl' ? 'pl' : 'en'];
  const isPl = locale === 'pl';

  return (
    <section className="relative overflow-hidden rounded-3xl bg-slate-50 border border-slate-200 p-5 sm:p-8 md:p-10 shadow-xs transition-all text-left">
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:gap-10">
        
        {/* Left Column: Heading & Key Points */}
        <div className="space-y-4 max-w-2xl">
          
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-indigo-700 text-xs font-bold border border-slate-200 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isPl ? 'Przejęcie umowy (lease takeover)' : 'Lease takeover'}</span>
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              {strings.leavingEarlyTitle}
            </h3>
            <p className="text-base sm:text-lg font-bold text-indigo-600">
              {isPl ? 'Odzyskaj kaucję i przekaż umowę bez opłat karnych.' : 'Recover your full deposit and exit without termination penalties.'}
            </p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed font-normal">
            {strings.leavingEarlyDesc}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-800">
            <span className="inline-flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.5} />
              <span>{isPl ? '0 zł prowizji i ukrytych opłat' : 'Zero broker commissions'}</span>
            </span>
            <span className="inline-flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.5} />
              <span>{isPl ? '100% zwrotu kaucji przy protokole' : '100% deposit returned'}</span>
            </span>
            <span className="inline-flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.5} />
              <span>{isPl ? 'Zgoda właściciela lokalu' : 'Landlord approved'}</span>
            </span>
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto pt-2 lg:pt-0">
          <button
            type="button"
            onClick={onOpenLeaveLease}
            className="h-12 px-6 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 cursor-pointer transition border border-slate-300 shadow-xs whitespace-nowrap"
          >
            <Calculator className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{strings.calculateSavings}</span>
          </button>

          <button
            type="button"
            onClick={onOpenIntake}
            className="h-12 px-7 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <span>{strings.listYourPlace}</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>

      </div>
    </section>
  );
};
