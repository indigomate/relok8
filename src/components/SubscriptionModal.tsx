import React, { useState } from 'react';
import { X, Check, Lock, CreditCard, ArrowRight } from 'lucide-react';
import { SubscriptionTier } from '../types';
import { SupportedLocale, formatPLN } from '../utils/formatters';
import { t } from '../utils/translations';
import { LoopingSpinner } from './BrandLogo';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTier: SubscriptionTier | null;
  onSelectTier: (tier: SubscriptionTier) => void;
  locale?: SupportedLocale;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  activeTier,
  onSelectTier,
  locale = 'en'
}) => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier>(activeTier || 'student');
  const [step, setStep] = useState<'plans' | 'checkout' | 'success'>('plans');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const strings = (t[locale === 'pl' ? 'pl' : 'en'] as any);

  if (!isOpen) return null;

  const PLANS = [
    {
      id: 'student' as SubscriptionTier,
      name: strings.studentPass,
      pricePLN: 39,
      interval: locale === 'pl' ? 'mies.' : 'month',
      description: locale === 'pl' 
        ? 'Dla studentów Erasmusa i obcokrajowców kończących semestr wcześniej.'
        : 'For foreign students ending semester early or moving university.',
      features: [
        locale === 'pl' ? 'Wzory dwujęzycznej cesji (art. 509 KC)' : 'Bilingual Cesja contract engine',
        locale === 'pl' ? 'Bezpośrednie rozliczenie kaucji P2P' : 'Direct P2P security deposit clearing',
        locale === 'pl' ? 'Weryfikacja legitymacji i paszportu' : 'Verified university & passport badge',
        locale === 'pl' ? 'Wsparcie w kontakcie z właścicielem' : 'Landlord notification template'
      ]
    },
    {
      id: 'expat' as SubscriptionTier,
      name: strings.expatPass,
      pricePLN: 89,
      interval: locale === 'pl' ? 'mies.' : 'month',
      popular: true,
      description: locale === 'pl'
        ? 'Dla pracujących expatów zmieniających kontrakt lub relokujących się.'
        : 'For working expats moving jobs or relocating to a new city.',
      features: [
        locale === 'pl' ? 'Wszystko co w pakiecie Student' : 'Everything in Student Pass',
        locale === 'pl' ? 'Priorytetowe wyświetlanie na liście' : 'Priority top-of-feed placement',
        locale === 'pl' ? 'Asysta prawna w mediacji po polsku' : 'Mediation assistance with landlord in Polish',
        locale === 'pl' ? 'Szybkie powiadomienia o nowych cesjach' : 'Instant takeover alert notifications',
        locale === 'pl' ? 'Wsparcie w procedurze cesji Art. 509 KC' : 'Step-by-step Art. 509 KC transfer guidance'
      ]
    },
    {
      id: 'corporate' as SubscriptionTier,
      name: strings.corporatePass,
      pricePLN: 249,
      interval: locale === 'pl' ? 'jednorazowo' : 'single transfer',
      description: locale === 'pl'
        ? 'Dla działów HR i mobility relokujących pracowników do Polski.'
        : 'For HR & mobility managers relocating corporate personnel.',
      features: [
        locale === 'pl' ? 'Dedykowany opiekun cesji' : 'Dedicated relocation manager',
        locale === 'pl' ? 'Protokół stanu lokalu z audytem' : 'Condition handover audit protocol',
        locale === 'pl' ? 'Faktura VAT 23%' : 'VAT invoice (Faktura 23%)',
        locale === 'pl' ? 'Kompletne przejęcie kontaktu z właścicielem' : 'Direct landlord representation'
      ]
    }
  ];

  const handleStartCheckout = (tier: SubscriptionTier) => {
    setSelectedPlan(tier);
    setStep('checkout');
  };

  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSelectTier(selectedPlan);
      setStep('success');
    }, 1200);
  };

  const currentPlanObj = PLANS.find((p) => p.id === selectedPlan) || PLANS[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#0B1120]/80 backdrop-blur-sm flex justify-center p-3 sm:p-6 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-[760px] bg-[var(--r8-surface-1)] border border-[var(--r8-border)] rounded-[24px] r8-shadow-overlay overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="h-16 px-6 border-b border-[var(--r8-border)] flex items-center justify-between bg-[var(--r8-surface-1)]">
          <div className="text-[13px] font-semibold text-[var(--r8-text)]">
            {strings.pricingTitle}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-[10px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)] text-[var(--r8-text-2)] hover:text-[var(--r8-text)] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[78vh]">
          
          {step === 'plans' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl md:text-2xl font-bold text-[var(--r8-text)] tracking-tight">
                  {locale === 'pl' ? 'Uniknij opłat za zerwanie umowy.' : 'Never pay 2–3 months of break fees.'}
                </h3>
                <p className="text-[13px] text-[var(--r8-text-2)] leading-relaxed max-w-xl">
                  {strings.pricingSub}
                </p>
              </div>

              {/* Three Plans Grid per §6.8 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PLANS.map((plan) => {
                  const isCurrentActive = activeTier === plan.id;
                  return (
                    <div
                      key={plan.id}
                      className={`relative p-5 rounded-[20px] bg-[var(--r8-surface-1)] border flex flex-col justify-between transition-colors ${
                        plan.popular
                          ? 'border-[var(--r8-indigo-400)] bg-[var(--r8-surface-2)]/40'
                          : 'border-[var(--r8-border)]'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[var(--r8-surface-3)] border border-[var(--r8-border-strong)] text-[11px] font-semibold text-[var(--r8-text)]">
                          {strings.mostPopular}
                        </div>
                      )}

                      <div className="space-y-3">
                        <div>
                          <h4 className="text-[15px] font-bold text-[var(--r8-text)]">{plan.name}</h4>
                          <p className="text-[12px] text-[var(--r8-text-2)] mt-0.5 min-h-[34px] leading-snug">
                            {plan.description}
                          </p>
                        </div>

                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold text-[var(--r8-text)] tnum">
                              {formatPLN(plan.pricePLN, locale)}
                            </span>
                            <span className="text-[12px] text-[var(--r8-text-3)]">/{plan.interval}</span>
                          </div>
                          {/* Plain text cancellation terms directly under price per §6.8 */}
                          <div className="text-[11px] text-[var(--r8-text-3)] mt-0.5">
                            {strings.cancelAnytime}
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-[var(--r8-border)]">
                          {plan.features.map((feat, i) => (
                            <div key={i} className="text-[12px] text-[var(--r8-text-2)] flex items-start gap-1.5">
                              <Check className="w-3.5 h-3.5 text-[var(--r8-success)] shrink-0 mt-0.5" strokeWidth={2.5} />
                              <span className="leading-snug">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-5">
                        {isCurrentActive ? (
                          <div className="w-full py-2.5 bg-[var(--r8-surface-3)] text-[var(--r8-text)] text-xs font-semibold rounded-[12px] text-center border border-[var(--r8-border)]">
                            {locale === 'pl' ? '✓ Aktywny pakiet' : '✓ Active plan'}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartCheckout(plan.id)}
                            className={`w-full py-2.5 text-[13px] font-semibold rounded-[12px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              plan.popular
                                ? 'bg-[var(--r8-indigo-600)] hover:bg-[var(--r8-indigo-500)] active:translate-y-[1px] text-white shadow-none'
                                : 'bg-[var(--r8-surface-2)] hover:bg-[var(--r8-surface-3)] text-[var(--r8-text)] border border-[var(--r8-border-strong)]'
                            }`}
                          >
                            <span>{locale === 'pl' ? 'Wybierz pakiet' : 'Select plan'}</span>
                            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Plain footer guarantee */}
              <div className="p-3.5 rounded-[12px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)] text-[12px] text-[var(--r8-text-2)] leading-normal">
                <strong>{locale === 'pl' ? 'Podstawa prawna:' : 'Legal basis:'}</strong>{' '}
                {locale === 'pl'
                  ? 'Zapewniamy kompletne wzory zgodne z Kodeksem Cywilnym (Art. 509 i 519 KC) oraz wsparcie w komunikacji z właścicielem.'
                  : 'We supply standardized bilingual contract assignment agreements under the Polish Civil Code (Art. 509 & 519 KC).'}
              </div>
            </div>
          )}

          {step === 'checkout' && (
            <div className="max-w-md mx-auto space-y-5 animate-in fade-in">
              <div className="space-y-1">
                <div className="text-[12px] font-semibold text-[var(--r8-text-3)] uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[var(--r8-indigo-400)]" strokeWidth={1.75} />
                  <span>Stripe 256-Bit SSL Checkout</span>
                </div>
                <h3 className="text-lg font-bold text-[var(--r8-text)]">
                  {currentPlanObj.name}
                </h3>
                <div className="text-base font-bold text-[var(--r8-text)] tnum">
                  {formatPLN(currentPlanObj.pricePLN, locale)} / {currentPlanObj.interval}
                </div>
              </div>

              <form onSubmit={handleSimulatePayment} className="space-y-4">
                <div>
                  <label className="text-[13px] font-medium text-[var(--r8-text-2)] block mb-1">
                    {locale === 'pl' ? 'Numer karty' : 'Card number'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="•••• •••• •••• 4242"
                      className="w-full h-11 bg-[var(--r8-surface-2)] border border-[var(--r8-border-strong)] rounded-[12px] px-3.5 text-[13px] text-[var(--r8-text)] placeholder:text-[var(--text-3)] font-mono outline-none focus:border-indigo-600"
                      required
                    />
                    <CreditCard className="w-4 h-4 text-[var(--r8-text-3)] absolute right-3.5 top-3.5" strokeWidth={1.75} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[13px] font-medium text-[var(--r8-text-2)] block mb-1">
                      {locale === 'pl' ? 'Ważność' : 'Expires'}
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full h-11 bg-[var(--r8-surface-2)] border border-[var(--r8-border-strong)] rounded-[12px] px-3.5 text-[13px] text-[var(--r8-text)] placeholder:text-[var(--text-3)] font-mono outline-none focus:border-indigo-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-[var(--r8-text-2)] block mb-1">
                      CVC / CVV
                    </label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      placeholder="CVC"
                      className="w-full h-11 bg-[var(--r8-surface-2)] border border-[var(--r8-border-strong)] rounded-[12px] px-3.5 text-[13px] text-[var(--r8-text)] placeholder:text-[var(--text-3)] font-mono outline-none focus:border-indigo-600"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full h-11 bg-[var(--r8-indigo-600)] hover:bg-[var(--r8-indigo-500)] active:translate-y-[1px] text-white text-[13px] font-semibold rounded-[12px] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-none disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <LoopingSpinner size={16} />
                      <span>{locale === 'pl' ? 'Autoryzacja płatności...' : 'Authorizing with Stripe...'}</span>
                    </>
                  ) : (
                    <span>
                      {locale === 'pl'
                        ? `Aktywuj za ${formatPLN(currentPlanObj.pricePLN, locale)}`
                        : `Activate for ${formatPLN(currentPlanObj.pricePLN, locale)}`}
                    </span>
                  )}
                </button>

                <div className="text-[11px] text-center text-[var(--r8-text-3)]">
                  {strings.cancelAnytime}
                </div>
              </form>

              <button
                type="button"
                onClick={() => setStep('plans')}
                className="w-full text-center text-[12px] text-[var(--r8-text-2)] hover:text-[var(--r8-text)] cursor-pointer"
              >
                ← {locale === 'pl' ? 'Wróć do wyboru pakietów' : 'Back to plan choices'}
              </button>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-6 space-y-4 max-w-sm mx-auto animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-[var(--r8-surface-2)] border border-[var(--r8-success)] text-[var(--r8-success)] flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" strokeWidth={2.5} />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-bold text-[var(--r8-text)]">
                  {locale === 'pl' ? 'Pakiet aktywowany' : 'Relocation Pass Active'}
                </h4>
                <p className="text-[13px] text-[var(--r8-text-2)] leading-relaxed">
                  {locale === 'pl'
                    ? 'Twój pokój jest teraz chroniony przed karami za zerwanie umowy. Wzory cesji są gotowe do pobrania.'
                    : 'Your room is now protected against early exit penalties under Polish Civil Code Art. 509.'}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-[var(--r8-indigo-600)] hover:bg-[var(--r8-indigo-500)] text-white text-[13px] font-semibold rounded-[12px] transition-colors cursor-pointer"
              >
                {locale === 'pl' ? 'Przejdź do ogłoszeń' : 'Return to marketplace'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
