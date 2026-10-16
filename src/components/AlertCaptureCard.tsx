import React, { useState } from 'react';
import { Bell, CheckCircle2, ArrowRight } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';
import { t } from '../utils/translations';

interface AlertCaptureCardProps {
  city: string;
  locale?: SupportedLocale;
  onAlertRegistered?: (email: string, city: string) => void;
}

export const AlertCaptureCard: React.FC<AlertCaptureCardProps> = ({
  city,
  locale = 'en',
  onAlertRegistered
}) => {
  const strings = t[locale === 'pl' ? 'pl' : 'en'];
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      if (onAlertRegistered) {
        onAlertRegistered(email, city);
      }
    }, 400);
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl bg-indigo-50/70 border border-indigo-100 p-6 sm:p-8 text-center my-6">
      <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4 shadow-sm">
        <Bell className="w-6 h-6" />
      </div>

      <h3 className="text-lg font-bold text-slate-900 mb-1">
        {strings.getAlertsTitle}
      </h3>
      <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mb-6">
        {strings.getAlertsDesc}{' '}
        <strong className="text-slate-900 font-semibold">{city || 'Poland'}</strong>.
      </p>

      {submitted ? (
        <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-xl border border-emerald-200 text-emerald-800 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{strings.alertSuccess}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={strings.alertEmailPlaceholder}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs shrink-0 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>{strings.getAlertsButton}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  );
};
