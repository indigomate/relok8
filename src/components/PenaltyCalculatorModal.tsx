import React, { useState } from 'react';
import { X, ArrowRight, Calculator } from 'lucide-react';
import { formatPLN, SupportedLocale } from '../utils/formatters';

interface PenaltyCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenIntake: () => void;
  locale?: SupportedLocale;
}

export const PenaltyCalculatorModal: React.FC<PenaltyCalculatorModalProps> = ({
  isOpen,
  onClose,
  onOpenIntake,
  locale = 'en'
}) => {
  const [rentPLN, setRentPLN] = useState('2500');
  const [penaltyMonths, setPenaltyMonths] = useState(2);
  const [depositPLN, setDepositPLN] = useState('2800');

  if (!isOpen) return null;

  const numRent = Number(rentPLN) || 0;
  const numDeposit = Number(depositPLN) || 0;
  const traditionalPenaltyCost = numRent * penaltyMonths;
  const totalTraditionalLoss = traditionalPenaltyCost + numDeposit;
  const relok8Cost = 39;
  const netSavings = Math.max(0, totalTraditionalLoss - relok8Cost);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#0B1120]/80 backdrop-blur-sm flex justify-center p-3 sm:p-6 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-[540px] bg-[var(--r8-surface-1)] border border-[var(--r8-border)] rounded-[24px] r8-shadow-overlay overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-16 px-6 border-b border-[var(--r8-border)] flex items-center justify-between bg-[var(--r8-surface-1)]">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[var(--r8-indigo-400)]" strokeWidth={1.75} />
            <span className="text-[13px] font-bold text-[var(--r8-text)]">
              {locale === 'pl' ? 'Kalkulator kar umownych' : 'Lease Break Penalty Calculator'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[10px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)] text-[var(--r8-text-2)] hover:text-[var(--r8-text)] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-5">
          <div className="space-y-4">
            <div>
              <label className="text-[13px] font-medium text-[var(--r8-text-2)] block mb-1">
                {locale === 'pl' ? 'Twój miesięczny czynsz (PLN)' : 'Monthly rent in Poland (PLN)'}
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={rentPLN}
                onChange={(e) => setRentPLN(e.target.value.replace(/\D/g, ''))}
                placeholder="2500"
                className="w-full h-11 bg-[var(--r8-surface-2)] border border-[var(--r8-border-strong)] rounded-[12px] px-3.5 text-sm text-[var(--r8-text)] font-mono tnum outline-none focus:border-indigo-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[13px] font-medium text-[var(--r8-text-2)] block mb-1">
                  {locale === 'pl' ? 'Żądanie właściciela' : 'Landlord penalty demand'}
                </label>
                <select
                  value={penaltyMonths}
                  onChange={(e) => setPenaltyMonths(Number(e.target.value))}
                  className="w-full h-11 bg-[var(--r8-surface-2)] border border-[var(--r8-border-strong)] rounded-[12px] px-3 text-[13px] text-[var(--r8-text)] outline-none"
                >
                  <option value={1}>1 month notice</option>
                  <option value={2}>2 months penalty</option>
                  <option value={3}>3 months penalty</option>
                </select>
              </div>

              <div>
                <label className="text-[13px] font-medium text-[var(--r8-text-2)] block mb-1">
                  {locale === 'pl' ? 'Kaucja gwarancyjna' : 'Deposit (Kaucja)'}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={depositPLN}
                  onChange={(e) => setDepositPLN(e.target.value.replace(/\D/g, ''))}
                  placeholder="2800"
                  className="w-full h-11 bg-[var(--r8-surface-2)] border border-[var(--r8-border-strong)] rounded-[12px] px-3.5 text-sm text-[var(--r8-text)] font-mono tnum outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Breakdown Card */}
          <div className="p-4 rounded-[16px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)] space-y-3">
            <div className="text-[12px] font-semibold text-[var(--r8-text-3)] uppercase tracking-wider">
              {locale === 'pl' ? 'Porównanie finansowe' : 'Financial comparison'}
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[var(--r8-text-2)]">
                <span>{locale === 'pl' ? 'Koszt kary za zerwanie umowy:' : 'Break penalty without replacement:'}</span>
                <span className="font-mono tnum line-through text-[var(--r8-danger)]">
                  -{formatPLN(traditionalPenaltyCost, locale)}
                </span>
              </div>
              <div className="flex justify-between text-[var(--r8-text-2)]">
                <span>{locale === 'pl' ? 'Kaucja zamrożona na 30 dni:' : 'Deposit locked for 30 days:'}</span>
                <span className="font-mono tnum line-through text-[var(--r8-danger)]">
                  -{formatPLN(depositPLN, locale)}
                </span>
              </div>
              <div className="flex justify-between text-[var(--r8-text)] pt-2 border-t border-[var(--r8-border)]">
                <span className="font-medium">Relok8 Pass:</span>
                <span className="font-mono tnum font-semibold text-[var(--r8-success)]">
                  {formatPLN(relok8Cost, locale)} /mo
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--r8-border)] flex items-baseline justify-between">
              <div>
                <span className="text-[11px] font-semibold text-[var(--r8-text-3)] uppercase tracking-wider block">
                  {locale === 'pl' ? 'Zaorana strata' : 'Net capital preserved'}
                </span>
                <div className="text-xl font-bold text-[var(--r8-text)] font-mono tnum">
                  +{formatPLN(netSavings, locale)}
                </div>
              </div>
              <span className="text-[12px] text-[var(--r8-success)] font-semibold">
                0 PLN break fee
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenIntake();
            }}
            className="w-full h-11 bg-[var(--r8-indigo-600)] hover:bg-[var(--r8-indigo-500)] text-white text-[13px] font-semibold rounded-[12px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-none"
          >
            <span>{locale === 'pl' ? 'Dodaj pokój i uniknij kary' : 'List room & prevent penalty'}</span>
            <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
};
