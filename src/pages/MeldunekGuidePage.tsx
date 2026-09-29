import React from 'react';
import { ArrowLeft, CheckCircle2, FileText, Building2, HelpCircle, Shield, Sparkles } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';

interface MeldunekGuidePageProps {
  onBack: () => void;
  onBrowseRooms: () => void;
  locale?: SupportedLocale;
}

export const MeldunekGuidePage: React.FC<MeldunekGuidePageProps> = ({
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Expat & Student Guide 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Rooms with Meldunek Allowed: Poland Address Registration & PESEL Guide
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Everything foreign students and working expats in Poland need to know about registering their residence (zameldowanie) and getting a PESEL number.
          </p>
        </div>

        {/* Core Notice */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-emerald-950 space-y-2">
          <h2 className="text-sm font-bold flex items-center gap-2 text-emerald-900">
            <Shield className="w-4 h-4 text-emerald-700" />
            <span>The Relok8 Guarantee</span>
          </h2>
          <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
            Many landlords in Poland refuse to let foreign tenants register their address due to misconceptions. On <strong className="text-emerald-900">Relok8</strong>, every listing is pre-cleared with landlord consent so you are legally guaranteed address registration (Meldunek) from Day 1 of your contract handover.
          </p>
        </div>

        {/* Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>What Documents Do You Need?</span>
            </h2>
            <ul className="text-xs text-slate-600 space-y-2.5">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Valid Passport or EU National ID</strong> (plus visa or Karta Pobytu if non-EU citizen).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Lease Agreement or Cesja Agreement</strong> proving your legal right to occupy the property.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Registration Form (Zgłoszenie pobytu czasowego)</strong> completed and printed or filled at the municipal office.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Landlord signature or confirmation</strong> (Relok8 provides this standard).</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Where Do You Go in Your City?</span>
            </h2>
            <ul className="text-xs text-slate-600 space-y-2.5">
              <li>
                <strong className="text-slate-900 block">Warsaw:</strong>
                Urząd Dzielnicy for your specific district (e.g. Mokotów: ul. Rakowiecka 25/27, Śródmieście: ul. Nowogrodzka 43).
              </li>
              <li>
                <strong className="text-slate-900 block">Kraków:</strong>
                Urząd Miasta Krakowa (al. Powstania Warszawskiego 10 or os. Zgody 2).
              </li>
              <li>
                <strong className="text-slate-900 block">Wrocław:</strong>
                Centrum Obsługi Mieszkańca (ul. Zapolskiej 4 or pl. Nowy Targ).
              </li>
              <li>
                <strong className="text-slate-900 block">Gdańsk & Lublin:</strong>
                Urząd Miejski w Gdańsku (ul. Nowe Ogrody 8/12) / Urząd Miasta Lublin (ul. Wieniawska 14).
              </li>
            </ul>
          </div>

        </div>

        {/* PESEL Number */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-bold text-slate-900">How Do You Get a PESEL Number with Meldunek?</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            When you complete your temporary address registration (zameldowanie na pobyt czasowy powyżej 30 dni) at the city office as a foreigner, the office automatically issues your official Polish PESEL number at the same appointment, free of charge. You do not need a separate legal basis petition when registering an address with an active lease.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={onBrowseRooms}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors cursor-pointer"
          >
            Browse Rooms with Meldunek Allowed →
          </button>
        </div>

      </div>
    </div>
  );
};
