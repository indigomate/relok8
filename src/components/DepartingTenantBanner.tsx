import React from 'react';
import { Calculator, ArrowRight, Check, Coins, ShieldCheck } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';

interface DepartingTenantBannerProps {
  onOpenLeaveLease: () => void;
  onOpenIntake: () => void;
  locale: SupportedLocale;
}

const BANNER_TEXTS = {
  en: {
    kicker: 'Departing Tenants',
    subKicker: 'Legal Lease Transfer',
    title: 'Moving out before your lease ends?',
    highlightTitle: 'Pay 0 PLN penalty and recover your full deposit.',
    sub: 'Find a replacement student or expat to take over your active contract. We prepare official Polish assignment agreements (Art. 509 KC) with guaranteed landlord approval.',
    benefit1: '0 PLN landlord break penalties',
    benefit2: '100% deposit returned directly',
    benefit3: 'Official landlord pre-approval',
    calculateBtn: 'Calculate savings',
    listBtn: 'List your room (Free)',
    savingsTag: 'Save up to 4,800 PLN'
  },
  pl: {
    kicker: 'Dla wyjeżdżających',
    subKicker: 'Legalna cesja umowy',
    title: 'Wyprowadzasz się przed końcem umowy?',
    highlightTitle: 'Zapłać 0 zł kar i odzyskaj 100% kaucji.',
    sub: 'Przekaż umowę nowemu lokatorowi za zgodą właściciela. Przygotowujemy oficjalną cesję (art. 509 KC), abyś nie tracił 2–3 miesięcy czynszu za wcześniejsze zerwanie.',
    benefit1: '0 zł kar za wcześniejsze odejście',
    benefit2: '100% zwrotu wpłaconej kaucji',
    benefit3: 'Gotowe wzory zgody właściciela i umowy',
    calculateBtn: 'Oblicz oszczędności',
    listBtn: 'Dodaj pokój (Bezpłatnie)',
    savingsTag: 'Śr. oszczędność: ~4 800 PLN'
  },
  uk: {
    kicker: 'Для орендарів',
    subKicker: 'Офіційна передача оренди',
    title: 'Виїжджаєте раніше терміну договору?',
    highlightTitle: 'Уникніть штрафів та поверніть 100% депозиту.',
    sub: 'Знайдіть нового мешканця на ваше житло. Ми підготуємо всі офіційні документи для орендодавця (Art. 509 KC), щоб ви повернули заставу без жодних переплат.',
    benefit1: '0 грн / зл штрафів за розірвання',
    benefit2: '100% повернення заставного депозиту',
    benefit3: 'Офіційне погодження орендодавця',
    calculateBtn: 'Розрахувати економію',
    listBtn: 'Додати кімнату (Безкоштовно)',
    savingsTag: 'Економія до 4 800 PLN'
  }
};

export const DepartingTenantBanner: React.FC<DepartingTenantBannerProps> = ({
  onOpenLeaveLease,
  onOpenIntake,
  locale
}) => {
  const content = BANNER_TEXTS[locale] || BANNER_TEXTS.en;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-slate-50/90 border border-slate-200/90 p-6 sm:p-8 md:p-10 shadow-xs transition-all text-left">
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:gap-10">
        
        {/* Left Column: Heading, Subtitle & Key Benefits */}
        <div className="space-y-4 max-w-2xl">
          
          {/* Top Category Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-indigo-700 text-xs font-bold border border-slate-200/90 shadow-2xs uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>{content.kicker} · {content.subKicker}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/80 shadow-2xs">
              <Coins className="w-3.5 h-3.5 text-emerald-600" />
              <span>{content.savingsTag}</span>
            </span>
          </div>

          {/* Main Title */}
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              {content.title}
            </h3>
            <p className="text-lg sm:text-xl font-bold text-indigo-600 leading-snug">
              {content.highlightTitle}
            </p>
          </div>

          {/* High-contrast readable Subtitle */}
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            {content.sub}
          </p>

          {/* 3 Clear Benefit Checkpoint Cards */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-800">
            <span className="inline-flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.5} />
              <span>{content.benefit1}</span>
            </span>
            <span className="inline-flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.5} />
              <span>{content.benefit2}</span>
            </span>
            <span className="inline-flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-2xs">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2.5} />
              <span>{content.benefit3}</span>
            </span>
          </div>
        </div>

        {/* Right Column: Clean, high-contrast action buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 shrink-0 w-full lg:w-auto pt-2 lg:pt-0">
          
          {/* Secondary Action: Calculate Savings */}
          <button
            type="button"
            onClick={onOpenLeaveLease}
            className="h-12 px-6 rounded-xl bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-bold text-sm flex items-center justify-center gap-2.5 cursor-pointer transition border border-slate-300 shadow-2xs whitespace-nowrap w-full sm:w-auto"
          >
            <Calculator className="w-4 h-4 text-indigo-600 shrink-0" strokeWidth={2.2} />
            <span>{content.calculateBtn}</span>
          </button>

          {/* Primary Action: List Your Room */}
          <button
            type="button"
            onClick={onOpenIntake}
            className="h-12 px-7 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm shadow-sm hover:shadow transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap w-full sm:w-auto"
          >
            <span>{content.listBtn}</span>
            <ArrowRight className="w-4 h-4 shrink-0" strokeWidth={2.2} />
          </button>

        </div>

      </div>
    </section>
  );
};
