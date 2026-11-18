import React from 'react';
import { Bell, ArrowRight, Mail } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';
import { t } from '../utils/translations';

interface AlertCaptureCardProps {
  locale?: SupportedLocale;
}

export const AlertCaptureCard: React.FC<AlertCaptureCardProps> = ({
  locale = 'en',
}) => {
  const strings = t[locale === 'pl' ? 'pl' : 'en'];
  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl bg-indigo-50/70 border border-indigo-100 p-6 sm:p-8 text-center my-6 shadow-xs font-sans">
      <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4 shadow-sm">
        <Bell className="w-6 h-6 stroke-[2.2]" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold uppercase tracking-wider mb-2">
        <Mail className="w-3.5 h-3.5 text-indigo-600" />
        <span>{locale === 'pl' ? 'Więcej możliwości' : 'More options'}</span>
      </div>

      <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 tracking-tight">
        {strings.getAlertsTitle}
      </h3>
      <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mb-5 leading-relaxed">
        {strings.getAlertsDesc}
      </p>

      <a
        href={locale === 'pl' ? '/pl?city=Anywhere%20in%20Poland' : '/?city=Anywhere%20in%20Poland'}
        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
      >
        {strings.getAlertsButton}
        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
      </a>
    </div>
  );
};
