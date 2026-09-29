import React from 'react';
import { Calculator, ArrowRight, Check, Sparkles, Coins } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';

interface DepartingTenantBannerProps {
  onOpenLeaveLease: () => void;
  onOpenIntake: () => void;
  locale: SupportedLocale;
}

const BANNER_TEXTS = {
  en: {
    kicker: 'For Departing Tenants · Landlord-Approved Assignment',
    title: 'Leaving your lease early? Avoid costly termination penalties.',
    sub: 'Find a replacement student or expat to take over your active contract. We prepare official Polish assignment documents and help you recover your full deposit.',
    benefit1: '0 PLN landlord break penalties',
    benefit2: '100% deposit returned directly',
    benefit3: 'Official landlord pre-approval',
    calculateBtn: 'Calculate savings',
    listBtn: 'List your room',
    savingsTag: 'Avg. saved: ~4,800 PLN'
  },
  pl: {
    kicker: 'Dla wyjeżdżających lokatorów · Legalna cesja umowy',
    title: 'Kończysz najem przed czasem? Uniknij kar umownych.',
    sub: 'Przekaż umowę nowemu lokatorowi za zgodą właściciela. Przygotowujemy oficjalne dokumenty cesji (art. 509 KC), abyś odzyskał 100% kaucji bez utraty 2–3 miesięcy czynszu.',
    benefit1: '0 zł kar za wcześniejsze odejście',
    benefit2: '100% zwrotu wpłaconej kaucji',
    benefit3: 'Pisemna zgoda właściciela lokalu',
    calculateBtn: 'Oblicz oszczędności',
    listBtn: 'Dodaj swój pokój',
    savingsTag: 'Śr. oszczędność: ~4 800 PLN'
  },
  uk: {
    kicker: 'Для орендарів, що виїжджають · Офіційна передача найму',
    title: 'Виїжджаєте раніше терміну? Уникніть штрафів за розірвання.',
    sub: 'Передайте діючий договір оренди новому мешканцю за згодою орендодавця. Ми готуємо повний пакет документів та допомагаємо повернути депозит без переплат.',
    benefit1: '0 грн / зл штрафів за розірвання',
    benefit2: '100% повернення заставного депозиту',
    benefit3: 'Офіційне погодження орендодавця',
    calculateBtn: 'Розрахувати економію',
    listBtn: 'Додати кімнату',
    savingsTag: 'Сер. економія: ~4 800 PLN'
  }
};

export const DepartingTenantBanner: React.FC<DepartingTenantBannerProps> = ({
  onOpenLeaveLease,
  onOpenIntake,
  locale
}) => {
  const content = BANNER_TEXTS[locale] || BANNER_TEXTS.en;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 text-white p-6 sm:p-8 md:p-10 shadow-xl transition-all">
      {/* Decorative ambient radial glow */}
      <div 
        aria-hidden="true" 
        className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" 
      />
      <div 
        aria-hidden="true" 
        className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" 
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-10">
        
        {/* Left Column: Heading, Subtitle & Key Benefits */}
        <div className="space-y-3.5 max-w-2xl text-left">
          
          {/* Top Kicker & Savings Tag */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full border border-indigo-500/40 text-indigo-300 bg-indigo-500/10 text-[11px] font-bold uppercase tracking-wider inline-flex items-center">
              {content.kicker}
            </span>
            <span className="hidden sm:inline text-slate-600">·</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30">
              <Coins className="w-3 h-3 text-emerald-400" />
              <span>{content.savingsTag}</span>
            </span>
          </div>

          {/* Main Title */}
          <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
            {content.title}
          </h3>

          {/* High-contrast readable Subtitle */}
          <p className="text-[14px] sm:text-[15px] text-slate-300 leading-relaxed">
            {content.sub}
          </p>

          {/* Benefit Checkpoints Row */}
          <div className="pt-1.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] sm:text-[13px] text-slate-300 font-medium">
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2.5} />
              <span>{content.benefit1}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2.5} />
              <span>{content.benefit2}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" strokeWidth={2.5} />
              <span>{content.benefit3}</span>
            </span>
          </div>
        </div>

        {/* Right Column: Equal-height, perfectly aligned action buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto pt-2 lg:pt-0">
          
          {/* Secondary Action: Calculate Savings (Translucent frosted finish) */}
          <button
            type="button"
            onClick={onOpenLeaveLease}
            className="h-11 sm:h-12 px-5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 text-white border border-white/20 font-medium text-[13px] sm:text-[14px] flex items-center justify-center gap-2.5 cursor-pointer transition whitespace-nowrap w-full sm:w-auto"
          >
            <Calculator className="w-4 h-4 text-indigo-300 shrink-0" strokeWidth={2.2} />
            <span>{content.calculateBtn}</span>
          </button>

          {/* Primary Action: List Your Room (Glowing indigo gradient) */}
          <button
            type="button"
            onClick={onOpenIntake}
            className="h-11 sm:h-12 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold text-[13px] sm:text-[14px] shadow-lg shadow-indigo-500/25 hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap w-full sm:w-auto"
          >
            <span>{content.listBtn}</span>
            <ArrowRight className="w-4 h-4 shrink-0" strokeWidth={2.2} />
          </button>

        </div>

      </div>
    </section>
  );
};
