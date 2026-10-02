import React from 'react';
import { X, Shield, FileCheck, HelpCircle, Check, AlertCircle } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: SupportedLocale;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, locale }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-left">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-[17px]">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <span>{locale === 'pl' ? 'Centrum pomocy i bezpieczeństwo' : locale === 'uk' ? 'Довідковий центр та безпека' : 'Help Center & Safety Tips'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-[14px] text-slate-600 max-h-[75vh] overflow-y-auto">
          
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>{locale === 'pl' ? 'Jak uniknąć oszustw mieszkaniowych?' : 'How to avoid rental scams in Poland?'}</span>
            </h4>
            <p className="leading-relaxed">
              {locale === 'pl'
                ? 'Nigdy nie płać kaucji na prywatne zagraniczne konta przed obejrzeniem lokalu i podpisaniem protokołu zdawczo-odbiorczego. W Relok8 każda cesja wymaga pisemnej zgody właściciela.'
                : 'Never send security deposits to unverified foreign bank accounts before viewing or signing an inspection protocol. On Relok8, lease handovers require explicit written landlord approval.'}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-600" />
              <span>{locale === 'pl' ? 'Cesja umowy najmu wzór english & Art. 509 KC' : 'Cesja umowy najmu wzór english (Lease Takeover Poland)'}</span>
            </h4>
            <p className="leading-relaxed">
              {locale === 'pl'
                ? 'Cesja umowy najmu wzór english to oficjalne dwujęzyczne porozumienie cesji praw i obowiązków z dotychczasowego najemcy na nowego najemcę na tych samych warunkach (Art. 509 KC). Wzór chroni obie strony i eliminuje kary umowne za wcześniejsze rozwiązanie najmu.'
                : 'Cesja umowy najmu wzór english is our official bilingual (Polish-English) lease takeover agreement pursuant to Article 509 of the Polish Civil Code. It transfers active lease rights and tenant obligations directly to the replacement tenant with written landlord pre-approval.'}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{locale === 'pl' ? 'Meldunek i numer PESEL' : 'Address Registration (Meldunek) & PESEL'}</span>
            </h4>
            <p className="leading-relaxed">
              {locale === 'pl'
                ? 'Jako obcokrajowiec masz ustawowy obowiązek meldunku. Wszystkie pokoje na Relok8 mają potwierdzoną zgodę właściciela na rejestrację pobytu w urzędzie dzielnicy/miasta.'
                : 'Foreign students and workers in Poland are legally entitled to register their address (meldunek) to obtain a PESEL number. Our landlords support formal registration.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-[13px] leading-relaxed">
              <strong>{locale === 'pl' ? 'Pytania lub pomoc?' : 'Questions or need assistance?'}</strong>
              <div className="text-slate-500 mt-0.5">
                {locale === 'pl'
                  ? 'Napisz do nas bezpośrednio: info@relok8.online'
                  : 'Contact our team directly: info@relok8.online'}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white text-[13px] font-semibold rounded-xl hover:bg-slate-800 cursor-pointer"
          >
            {locale === 'pl' ? 'Rozumiem' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
