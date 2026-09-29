import React from 'react';
import { Check } from 'lucide-react';
import { Relok8Mark } from './BrandLogo';
import { SupportedLocale } from '../utils/formatters';
import { t } from '../utils/translations';

interface TransferTrackerProps {
  currentStepIndex?: number; // 0 to 5
  locale?: SupportedLocale;
  className?: string;
  showTitle?: boolean;
}

export const TransferTracker: React.FC<TransferTrackerProps> = ({
  currentStepIndex = 2,
  locale = 'en',
  className = '',
  showTitle = true
}) => {
  const strings = t[locale];

  const steps = [
    { key: 'listed', label: strings.stepListed, sub: locale === 'pl' ? 'Dzień 1' : 'Day 1' },
    { key: 'matched', label: strings.stepMatched, sub: locale === 'pl' ? 'Kandydat' : 'Candidate' },
    { key: 'approved', label: strings.stepLandlordApproved, sub: locale === 'pl' ? 'Art. 509 KC' : 'Art. 509 KC' },
    { key: 'signed', label: strings.stepContractSigned, sub: locale === 'pl' ? 'PL / EN' : 'PL / EN' },
    { key: 'deposit', label: strings.stepDepositSettled, sub: locale === 'pl' ? 'P2P Kaucja' : 'P2P Escrow' },
    { key: 'handed', label: strings.stepHandedOver, sub: locale === 'pl' ? '0 dni pustostanu' : '0-day vacancy' }
  ];

  const progressPercentage = (currentStepIndex / (steps.length - 1)) * 100;

  return (
    <div className={`w-full ${className}`}>
      {showTitle && (
        <div className="mb-6 space-y-1">
          <div className="text-[12px] font-semibold text-[var(--r8-text-3)] tracking-[0.06em] uppercase">
            {strings.transferTrackerTitle}
          </div>
          <div className="text-sm text-[var(--r8-text-2)] max-w-xl">
            {strings.transferTrackerSub}
          </div>
        </div>
      )}

      {/* Desktop Horizontal Tracker */}
      <div className="hidden sm:block relative py-4">
        {/* Background track line */}
        <div className="absolute top-[21px] left-3 right-3 h-[2px] bg-[var(--r8-border-strong)] rounded-full -z-0" />
        
        {/* Filled loop-gradient line */}
        <div
          className="absolute top-[21px] left-3 h-[2px] rounded-full transition-all duration-700 ease-out -z-0"
          style={{
            width: `calc(${progressPercentage}% - 6px)`,
            background: 'var(--r8-loop-gradient)'
          }}
        />

        {/* Nodes */}
        <div className="relative z-10 flex items-center justify-between">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const isFinal = idx === steps.length - 1;

            return (
              <div key={step.key} className="flex flex-col items-center text-center max-w-[100px]">
                {/* Node icon / indicator */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isFinal && (isCompleted || isCurrent)
                      ? 'bg-[var(--r8-surface-1)] border border-[var(--r8-border)]'
                      : isCompleted
                      ? 'bg-[var(--r8-indigo-600)] text-white'
                      : isCurrent
                      ? 'bg-[var(--r8-surface-1)] border-2 border-[var(--r8-indigo-400)] text-[var(--r8-indigo-400)] shadow-[0_0_0_4px_rgba(99,102,241,0.15)]'
                      : 'bg-[var(--r8-surface-1)] border border-[var(--r8-border-strong)] text-[var(--r8-text-3)]'
                  }`}
                >
                  {isFinal ? (
                    <Relok8Mark size={16} gradientId={`tracker-end-${idx}`} />
                  ) : isCompleted ? (
                    <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                  ) : (
                    <span className="text-[11px] font-mono font-medium">{idx + 1}</span>
                  )}
                </div>

                {/* Node labels */}
                <div className="mt-2.5">
                  <div
                    className={`text-[12px] font-medium leading-tight ${
                      isCurrent || isCompleted
                        ? 'text-[var(--r8-text)] font-semibold'
                        : 'text-[var(--r8-text-3)]'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-[11px] text-[var(--r8-text-3)] mt-0.5 font-mono">
                    {step.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Vertical Tracker */}
      <div className="sm:hidden relative pl-6 space-y-5 border-l-2 border-[var(--r8-border-strong)] ml-3 my-2">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const isFinal = idx === steps.length - 1;

          return (
            <div key={step.key} className="relative flex items-start gap-3">
              <div
                className={`absolute -left-[31px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center ${
                  isFinal && (isCompleted || isCurrent)
                    ? 'bg-[var(--r8-surface-1)] border border-[var(--r8-border)]'
                    : isCompleted
                    ? 'bg-[var(--r8-indigo-600)] text-white'
                    : isCurrent
                    ? 'bg-[var(--r8-surface-1)] border-2 border-[var(--r8-indigo-400)] text-[var(--r8-indigo-400)]'
                    : 'bg-[var(--r8-surface-1)] border border-[var(--r8-border-strong)] text-[var(--r8-text-3)]'
                }`}
              >
                {isFinal ? (
                  <Relok8Mark size={14} gradientId={`m-tracker-end-${idx}`} />
                ) : isCompleted ? (
                  <Check className="w-3 h-3" strokeWidth={2.5} />
                ) : (
                  <span className="text-[10px] font-mono">{idx + 1}</span>
                )}
              </div>

              <div>
                <div className={`text-xs font-semibold ${isCurrent || isCompleted ? 'text-[var(--r8-text)]' : 'text-[var(--r8-text-3)]'}`}>
                  {step.label}
                </div>
                <div className="text-[11px] text-[var(--r8-text-3)]">
                  {step.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
