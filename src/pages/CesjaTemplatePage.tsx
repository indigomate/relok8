import React, { useState } from 'react';
import { ArrowLeft, FileCheck, Shield, Copy, Check, Download, Sparkles } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';

interface CesjaTemplatePageProps {
  onBack: () => void;
  onOpenCesjaModal: () => void;
  locale?: SupportedLocale;
}

export const CesjaTemplatePage: React.FC<CesjaTemplatePageProps> = ({
  onBack,
  onOpenCesjaModal,
  locale = 'en'
}) => {
  const [copied, setCopied] = useState(false);

  const sampleBilingualClause = `UMOWA CESJI PRAW I OBOWIĄZKÓW Z UMOWY NAJMU
(AGREEMENT ON ASSIGNMENT OF RIGHTS AND OBLIGATIONS UNDER LEASE AGREEMENT)
zawarta w trybie art. 509 i nast. Kodeksu Cywilnego

1. Dotychczasowy Najemca (Departing Tenant) z dniem przekazania przenosi na Nowego Najemcę (Incoming Tenant) wszelkie prawa i obowiązki wynikające z Umowy Najmu z dnia [Data Umowy Pierwotnej].
(The Departing Tenant hereby assigns and transfers to the Incoming Tenant all rights and obligations arising from the Lease Agreement dated [Date]).

2. Nowy Najemca oświadcza, że zapoznał się ze stanem technicznym Lokalu oraz treścią Umowy Pierwotnej i akceptuje jej warunki bez zastrzeżeń.
(The Incoming Tenant declares that they have inspected the premises and original lease terms, accepting them without reservation).

3. Wynajmujący (Landlord) niniejszym wyraża pełną i bezwarunkową zgodę na dokonanie powyższej cesji.
(The Landlord hereby grants full and unconditional consent to the assignment).

4. Kaucja zwrotna (Security Deposit) w kwocie [Kwota PLN] zostaje rozliczona bezpośrednio pomiędzy Dotychczasowym a Nowym Najemcą.
(The Security Deposit in the amount of [Amount PLN] is settled directly between the Departing and Incoming Tenants upon handover protocol).`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleBilingualClause);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 text-xs font-bold uppercase tracking-wider border border-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Legal Document · Art. 509 KC</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Cesja umowy najmu wzór english: Bilingual Lease Assignment Template
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            Free, legally verified Polish-English contract template to transfer active residential leases in Poland without breaking penalties or broker fees.
          </p>
        </div>

        {/* Action Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200">
          <div>
            <div className="text-sm font-bold text-slate-900">Need a customized agreement with your data?</div>
            <div className="text-xs text-slate-500">Auto-fill tenant, landlord, rent and deposit parameters in seconds.</div>
          </div>
          <button
            type="button"
            onClick={onOpenCesjaModal}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            Launch Interactive Cesja Generator →
          </button>
        </div>

        {/* Clause Preview Card */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs text-indigo-200">
              <FileCheck className="w-4 h-4 text-indigo-400" />
              <span>cesja_umowy_najmu_wzor_english.txt</span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy text</span>
                </>
              )}
            </button>
          </div>

          <div className="p-6 overflow-x-auto bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed whitespace-pre-wrap">
            {sampleBilingualClause}
          </div>
        </div>

        {/* Key Legal Clauses breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Clause 1: Art. 509 KC Assignment</h3>
            <p>
              Transfers all existing lease rights (occupancy, key possession, rental price freeze) directly to the incoming renter without signing an expensive new lease from scratch.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Clause 2: Landlord Written Consent</h3>
            <p>
              In accordance with Polish law, the assignment must have explicit written consent from the property owner to legally release the outgoing tenant from future liability.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Clause 3: Security Deposit (Kaucja) Settlement</h3>
            <p>
              Standardizes the P2P direct refund between incoming and departing tenants following the meter readings and inspection protocol.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Clause 4: Address Registration (Meldunek)</h3>
            <p>
              Confirms the incoming tenant’s legal basis to register at the municipal district office (Urząd Dzielnicy) for their PESEL.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
