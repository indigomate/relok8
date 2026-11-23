import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';

interface LegalTermsPrivacyPageProps {
  view: 'terms' | 'privacy';
  onBack: () => void;
  locale?: SupportedLocale;
}

export const LegalTermsPrivacyPage: React.FC<LegalTermsPrivacyPageProps> = ({
  view,
  onBack,
  locale = 'en'
}) => {
  const isTerms = view === 'terms';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-36 sm:pb-24 text-left font-sans">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 pt-4 sm:pt-8 space-y-6 sm:space-y-8">
        
        {/* Back navigation */}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer p-1 -ml-1 rounded-md hover:bg-indigo-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{locale === 'pl' ? 'Wróć do ogłoszeń' : 'Back to marketplace'}</span>
        </button>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {isTerms ? 'Terms of Service & Lease Assignment Policy' : 'Privacy Policy & RODO / GDPR Compliance'}
          </h1>
          <p className="text-xs text-slate-500">
            Last updated: 23 November 2026 · Polish law applies where specified below
          </p>
        </div>

        {/* Body content */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
          {isTerms ? (
            <>
              <section className="space-y-2">
                <h2 className="text-base font-bold text-slate-900">1. Nature of the Platform</h2>
                <p>
                  Relok8 (relok8.online) is a technology platform that helps outgoing tenants, prospective replacement tenants and landlords communicate about a possible lease takeover in Poland. Relok8 is not a party to the lease, does not provide legal advice, does not act as a real estate agency and does not hold deposits or other client funds.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-slate-900">2. Landlord Consent Requirement</h2>
                <p>
                  Users must review their lease and obtain the written approval required from the landlord or an authorised representative before relying on any takeover arrangement. The legal form and effect of an arrangement depend on the contract and circumstances; users should obtain professional advice when unsure.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-slate-900">3. Security Deposits & Inspection Protocol</h2>
                <p>
                  Participants should document the property condition, keys, utility readings and their agreed deposit arrangement. Relok8 does not guarantee a deposit refund or decide any dispute between participants.
                </p>
              </section>
            </>
          ) : (
            <>
              <section className="space-y-2">
                <h2 className="text-base font-bold text-slate-900">1. Data Controller (Administrator Danych Osobowych)</h2>
                <p>
                  Relok8 (relok8.online) operates as an independent peer-to-peer web service connecting incoming renters, outgoing tenants and landlords in Poland. The platform is open to local and international users. This notice explains how the service is designed to handle personal data under Regulation (EU) 2016/679 (GDPR / RODO) and applicable Polish law.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-slate-900">2. Data Processed for Tenant & Landlord Matching</h2>
                <p>
                  Depending on the features you use, we process account identifiers, name, verified email, optional phone and profile details, listing descriptions and addresses, uploaded listing photos, messages, preferences, consent records and technical security logs. We use this information to operate, secure and improve the service and do not sell it to advertising brokers.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-slate-900">3. Your Rights Under RODO</h2>
                <p>
                  Subject to the conditions and exceptions in applicable law, you may request access, correction, export, restriction, objection or erasure by contacting privacy@relok8.online. We may need to verify your identity and retain limited records where law or security requirements apply.
                </p>
              </section>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
