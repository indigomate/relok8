import React, { useState } from 'react';
import { X, Calculator, ArrowRight, Check, FileText, Download, ShieldCheck } from 'lucide-react';
import { SupportedLocale, formatPLN } from '../utils/formatters';

interface LeaveYourLeaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenIntake: () => void;
  onOpenCesja: () => void;
  locale: SupportedLocale;
}

export const LeaveYourLeaseModal: React.FC<LeaveYourLeaseModalProps> = ({
  isOpen,
  onClose,
  onOpenIntake,
  onOpenCesja,
  locale
}) => {
  const [rent, setRent] = useState<string>('2500');
  const [months, setMonths] = useState<string>('4');
  const numRent = Number(rent) || 0;
  const numMonths = Number(months) || 1;
  const penaltySaved = numRent * 2; // Typically 2 months break fee saved
  const depositSaved = numRent * 1; // 1 month deposit returned
  const totalSaved = penaltySaved + depositSaved;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-left max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-slate-900 font-bold text-[18px]">
              {locale === 'pl' ? 'Wyprowadzasz się przed końcem umowy?' : locale === 'uk' ? 'Виїжджаєте раніше терміну договору?' : 'Leaving your lease early?'}
            </h3>
            <p className="text-[13px] text-slate-500">
              {locale === 'pl' ? 'Przekaż umowę nowemu najemcy bez kar za zerwanie najmu' : 'Hand over your active lease to a verified replacement tenant without penalties'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Plain explanation */}
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[13px] text-indigo-950 space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-indigo-900 text-[14px]">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>{locale === 'pl' ? 'Jak to działa prawnie?' : 'How does a lease transfer work in Poland?'}</span>
            </h4>
            <p className="leading-relaxed">
              {locale === 'pl'
                ? 'Zgodnie z art. 509 i 519 Kodeksu Cywilnego możesz przenieść prawa i obowiązki z umowy najmu na nowego lokatora. Właściciel zachowuje ciągłość czynszu (0 dni pustostanu), a Ty odzyskujesz pełną kaucję od przejmującego pokój bez płacenia 2-3 miesięcznych kar.'
                : 'Under Polish Civil Code (Art. 509 & 519 KC), you can assign your rental contract to an incoming tenant with the landlord’s written agreement. The landlord gets continuous rent with zero vacancy, and you recover your full deposit without losing 2–3 months of break fees.'}
            </p>
          </div>

          {/* Interactive Savings Calculator */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-[15px] flex items-center gap-2">
                <Calculator className="w-4 h-4 text-slate-600" />
                <span>{locale === 'pl' ? 'Kalkulator oszczędności' : 'Penalty Savings Calculator'}</span>
              </h4>
              <span className="text-xs text-slate-500">
                {locale === 'pl' ? 'Szacunek oparty o polskie standardy umowne' : 'Estimated based on Polish rental standards'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-slate-700">
                  {locale === 'pl' ? 'Miesięczny czynsz (PLN)' : 'Monthly rent (PLN)'}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={rent}
                  onChange={(e) => setRent(e.target.value.replace(/\D/g, ''))}
                  placeholder="2500"
                  className="w-full h-11 px-3 bg-white border border-slate-300 rounded-xl text-[14px] font-bold text-slate-900 focus:outline-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-slate-700">
                  {locale === 'pl' ? 'Miesięcy do końca umowy' : 'Months remaining on lease'}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={months}
                  onChange={(e) => setMonths(e.target.value.replace(/\D/g, ''))}
                  placeholder="4"
                  className="w-full h-11 px-3 bg-white border border-slate-300 rounded-xl text-[14px] font-bold text-slate-900 focus:outline-indigo-600"
                />
              </div>
            </div>

            {/* Total Estimated Savings Box */}
            <div className="p-4 rounded-xl bg-white border border-emerald-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                  {locale === 'pl' ? 'Szacowane zaoszczędzone środki' : 'Estimated money saved'}
                </span>
                <div className="text-2xl font-extrabold text-emerald-600 mt-0.5 tnum">
                  {formatPLN(totalSaved, locale)}
                </div>
              </div>
              <div className="text-[12px] text-slate-500 sm:text-right">
                <div>~{formatPLN(penaltySaved, locale)} {locale === 'pl' ? 'unikniętej kary' : 'break fee avoided'}</div>
                <div>+{formatPLN(depositSaved, locale)} {locale === 'pl' ? 'odzyskanej kaucji' : 'deposit recovered'}</div>
              </div>
            </div>
          </div>

          {/* Simple 4-Step Checklist */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 text-[14px]">
              {locale === 'pl' ? 'Kroki do bezkarnego przekazania najmu' : '4 Simple steps to transfer your lease'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[13px]">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</div>
                <div>
                  <strong className="text-slate-900 block">{locale === 'pl' ? 'Dodaj swój pokój' : 'List your room'}</strong>
                  <span className="text-slate-500 text-xs">{locale === 'pl' ? 'Zdjęcia, czynsz i termin' : 'Photos, rent, and move-in date'}</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</div>
                <div>
                  <strong className="text-slate-900 block">{locale === 'pl' ? 'Poinformuj właściciela' : 'Notify your landlord'}</strong>
                  <span className="text-slate-500 text-xs">{locale === 'pl' ? 'Mamy gotowe maile i wzory' : 'We provide pre-written notice email'}</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</div>
                <div>
                  <strong className="text-slate-900 block">{locale === 'pl' ? 'Podpiszcie cesję' : 'Sign assignment (Cesja)'}</strong>
                  <span className="text-slate-500 text-xs">{locale === 'pl' ? 'Dwujęzyczny wzór PL/EN' : 'Bilingual standard contract'}</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">4</div>
                <div>
                  <strong className="text-slate-900 block">{locale === 'pl' ? 'Odbierz kaucję' : 'Collect your deposit'}</strong>
                  <span className="text-slate-500 text-xs">{locale === 'pl' ? 'Protokół zdawczo-odbiorczy' : 'Signed handover inspection protocol'}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCesja();
            }}
            className="w-full sm:w-auto px-4 py-2.5 text-slate-700 hover:bg-slate-200/60 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>{locale === 'pl' ? 'Zobacz wzór cesji (PDF)' : 'View assignment contract template'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenIntake();
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <span>{locale === 'pl' ? 'Dodaj swój pokój teraz' : 'List your room now'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
