import React from 'react';
import { ArrowLeft, Shield, AlertTriangle, CheckCircle2, FileText, Lock } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';

interface SafetyGuidePageProps {
  onBack: () => void;
  onBrowseRooms: () => void;
  locale?: SupportedLocale;
}

export const SafetyGuidePage: React.FC<SafetyGuidePageProps> = ({
  onBack,
  onBrowseRooms,
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

        {/* Hero */}
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-xs font-bold uppercase tracking-wider border border-rose-200">
            <Shield className="w-3.5 h-3.5 text-rose-600" />
            <span>Expat Safety Protocol</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Trust, Safety & Rental Scam Prevention in Poland
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Essential guidelines for international students, Erasmus participants, and expats to avoid housing scams, phantom landlords, and illegal deposit withholding in Polish cities.
          </p>
        </div>

        {/* Red Flags Card */}
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-950 space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2 text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-700" />
            <span>Top 4 Rental Scam Red Flags in Warsaw, Kraków & Wrocław</span>
          </h2>
          <ul className="text-xs text-rose-900 space-y-2 leading-relaxed">
            <li><strong>1. "I am out of the country, wire money first":</strong> Any seller claiming to be a doctor or missionary abroad asking for Western Union or Revolut transfers before you see the apartment or meet the departing tenant is an immediate scam.</li>
            <li><strong>2. Refusal of written Meldunek:</strong> Landlords who forbid address registration (meldunek) are often evading tax or sub-leasing illegally.</li>
            <li><strong>3. Missing Handover Protocol:</strong> Never move in without signing a detailed *protokół zdawczo-odbiorczy* documenting utility meter numbers and existing scuffs.</li>
            <li><strong>4. Unofficial broker upfront viewing fees:</strong> In Poland, legitimate agencies only charge upon signing a lease, never upfront just to show a property.</li>
          </ul>
        </div>

        {/* Handover Inspection Protocol */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>The Handover Inspection Protocol (Protokół Zdawczo-Odbiorczy)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            The inspection protocol is the legal document in Poland that records the condition of the apartment, the number of keys handed over, and the exact electricity, water, and heating meter readings on the date of handover. Relok8 generates this document automatically to protect your security deposit.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={onBrowseRooms}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors cursor-pointer"
          >
            Explore Verified Safe Rooms on Relok8 →
          </button>
        </div>

      </div>
    </div>
  );
};
