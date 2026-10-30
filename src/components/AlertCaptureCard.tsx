import {navigateTo} from '../utils/router';
import React, { useState } from 'react';
import { Bell, CheckCircle2, ArrowRight, Loader2, Sparkles, Mail } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';
import { t } from '../utils/translations';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Convex mutation for 'subscribers' table
  const subscribeConvex = useMutation(api.subscribers?.subscribe);

  const handleSubmit = (e:React.FormEvent) => {e.preventDefault();window.location.assign((locale==='pl'?'/pl':'/')+'?city=Anywhere%20in%20Poland');};

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

      {submitted ? (
        <div className="p-4 bg-white rounded-2xl border border-emerald-200 text-emerald-800 text-xs font-semibold animate-in fade-in space-y-1 shadow-xs">
          <div className="flex items-center justify-center gap-2 text-sm text-emerald-900 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{strings.alertSuccess}</span>
          </div>
          <p className="text-[11px] text-emerald-700/90 font-normal">
            {locale === 'pl'
              ? `Powiadomienia e-mail dla miasta ${city || 'Polska'} są aktywne. Wyślemy wiadomość natychmiast, gdy pojawi się nowa oferta.`
              : `Real-time alerts for ${city || 'Poland'} are active. You will get an email via Resend the moment a new listing is published.`}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2 max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-2">

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{locale === 'pl' ? 'Zapisywanie...' : 'Subscribing...'}</span>
                </>
              ) : (
                <>
                  <span>{strings.getAlertsButton}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
          {errorMsg && (
            <p className="text-[11px] text-rose-600 text-left font-medium px-1">
              {errorMsg}
            </p>
          )}
        </form>
      )}
    </div>
  );
};
