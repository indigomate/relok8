import React from 'react';
import { ArrowLeft, Shield, FileCheck, Lock } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 text-left">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 pt-8 space-y-8">
        
        {/* Back navigation */}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to marketplace</span>
        </button>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isTerms ? 'Terms of Service & Lease Assignment Policy' : 'Privacy Policy & RODO / GDPR Compliance'}
          </h1>
          <p className="text-xs text-slate-500">
            Last updated: September 2026 · Governed under Polish Civil Code (Kodeks Cywilny)
          </p>
        </div>

        {/* Body content */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
          {isTerms ? (
            <>
              <section className="space-y-2">
                <h2 className="text-base font-bold text-slate-900">1. Nature of the Platform</h2>
                <p>
                  Relok8 (relok8.online) is a technological platform facilitating peer-to-peer lease assignments (cesja umowy najmu) between outgoing tenants and replacement tenants in Poland under Article 509 of the Polish Civil Code (Kodeks Cywilny). Relok8 does not act as an unlicensed real estate agency or depository escrow bank.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-slate-900">2. Landlord Consent Requirement</h2>
                <p>
                  All lease assignments require explicit written consent from the legal property owner or their authorized property management representative. No lease transfer is legally binding on the landlord without this mutual tri-party agreement.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-slate-900">3. Security Deposits & Inspection Protocol</h2>
                <p>
                  Tenants are obligated to execute a formal handover inspection protocol (protokół zdawczo-odbiorczy) recording utility meters and state of furnishings prior to the settlement or release of the security deposit (kaucja).
                </p>
              </section>
            </>
          ) : (
            <>
              <section className="space-y-2">
                <h2 className="text-base font-bold text-slate-900">1. Data Controller (Administrator Danych Osobowych)</h2>
                <p>
                  The data administrator is Relok8 Sp. z o.o. (in formation), operating in compliance with Regulation (EU) 2016/679 (GDPR / RODO) and the Polish Personal Data Protection Act.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-slate-900">2. Data Processed for Tenant & Landlord Matching</h2>
                <p>
                  We collect strictly necessary verification data, including tenant name, university or employment credentials, contact email, and active tenancy documentation solely for executing the lease transfer protocol. Data is never sold to third-party advertising brokers.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-slate-900">3. Your Rights Under RODO</h2>
                <p>
                  You retain the right to inspect, correct, export, or request the immediate deletion of your personal data by contacting privacy@relok8.online.
                </p>
              </section>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
