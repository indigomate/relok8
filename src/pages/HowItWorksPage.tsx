import React from 'react';
import { ArrowLeft, CheckCircle2, Shield, FileCheck, Key, HelpCircle, ArrowRight, Sparkles } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';

interface HowItWorksPageProps {
  onBack: () => void;
  onOpenLeaveYourLease: () => void;
  onOpenBrowse: () => void;
  locale?: SupportedLocale;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({
  onBack,
  onOpenLeaveYourLease,
  onOpenBrowse,
  locale = 'en'
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 text-left">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 pt-8 space-y-10">
        
        {/* Back navigation */}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to marketplace</span>
        </button>

        {/* Hero Section */}
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100/70 text-indigo-800 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Official Guide · Art. 509 KC</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            How Lease Takeover Poland Works on Relok8
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Take over an active rental contract directly from outgoing international students and expats with 100% legal landlord approval, zero broker commissions, and guaranteed address registration (Meldunek).
          </p>
        </div>

        {/* 3 Step Deep Dive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-extrabold flex items-center justify-center border border-indigo-100">
              1
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Browse Pre-Vetted Rooms
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Explore furnished studios and rooms in Warsaw, Kraków, Wrocław, Gdańsk, and Lublin. Review photos, transit times to universities, exact monthly rent, and deposit amounts.
            </p>
            <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>0 PLN agency fees</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Real verified outgoing tenants</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-extrabold flex items-center justify-center border border-indigo-100">
              2
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Landlord Approval & Cesja
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              We generate the standardized bilingual Polish-English assignment contract (Cesja umowy najmu wzór english under Art. 509 KC). The landlord signs pre-approval, eliminating contract break penalties.
            </p>
            <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Guaranteed tenant legal rights</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>No arbitrary rent increases</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-extrabold flex items-center justify-center border border-indigo-100">
              3
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Handover & Address Registration
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Complete the inspection protocol (protokół zdawczo-odbiorczy), clear the deposit directly or via escrow, collect the keys, and register your residency (Meldunek) for your PESEL or Karta Pobytu.
            </p>
            <ul className="text-xs text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Address registration (meldunek) OK</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Official keys handover</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Legal Protections Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-base">
            <Shield className="w-5 h-5" />
            <span>Why is Lease Takeover (Cesja) 100% Legal in Poland?</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Under Article 509 of the Polish Civil Code (Kodeks Cywilny), a tenant may transfer their contractual rights and claims to a third party with the landlord's consent. This is known legally as <strong className="text-slate-900">cesja praw i obowiązków z umowy najmu</strong>. It guarantees that the incoming tenant enters into the existing valid agreement under the exact same financial terms, while releasing the departing tenant from future rent liabilities without penalty.
          </p>
        </div>

        {/* Dual CTA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={onOpenBrowse}
            className="p-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-left transition-colors flex items-center justify-between cursor-pointer"
          >
            <div>
              <div className="text-base font-bold">Find a room now</div>
              <div className="text-xs text-indigo-200 mt-1">Browse Warsaw, Kraków, Wrocław, Gdańsk, Lublin</div>
            </div>
            <ArrowRight className="w-5 h-5 text-indigo-200" />
          </button>

          <button
            type="button"
            onClick={onOpenLeaveYourLease}
            className="p-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-left transition-colors flex items-center justify-between cursor-pointer"
          >
            <div>
              <div className="text-base font-bold">Leaving your lease early?</div>
              <div className="text-xs text-slate-400 mt-1">Transfer your lease & calculate penalty savings</div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400" />
          </button>
        </div>

      </div>
    </div>
  );
};
