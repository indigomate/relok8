import React, { useState } from 'react';
import { X, CheckCircle2, Check, Download, FileCheck } from 'lucide-react';
import { DepositClearingRecord, Listing } from '../types';
import { formatPLN, formatDate, SupportedLocale } from '../utils/formatters';

interface DepositClearingModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: DepositClearingRecord[];
  onUpdateRecord: (updated: DepositClearingRecord) => void;
  presetListing?: Listing | null;
  locale?: SupportedLocale;
}

export const DepositClearingModal: React.FC<DepositClearingModalProps> = ({
  isOpen,
  onClose,
  records,
  onUpdateRecord,
  presetListing,
  locale = 'en'
}) => {
  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    records[0]?.id || 'dep-settle-101'
  );
  const [certificateView, setCertificateView] = useState(false);

  if (!isOpen) return null;

  const currentRecord = records.find((r) => r.id === selectedRecordId) || records[0];

  const handleStepComplete = (stepKey: 'inspection' | 'consent' | 'transfer') => {
    if (!currentRecord) return;
    const updated = { ...currentRecord };

    if (stepKey === 'inspection') {
      updated.tenantInspectionSigned = true;
    } else if (stepKey === 'consent') {
      updated.landlordConsentSigned = true;
    } else if (stepKey === 'transfer') {
      updated.depositTransferred = true;
      updated.status = 'settled';
      updated.receiptIssuedDate = new Date().toISOString().split('T')[0];
    }

    onUpdateRecord(updated);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#0B1120]/80 backdrop-blur-sm flex justify-center p-3 sm:p-6 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-[820px] bg-[var(--r8-surface-1)] border border-[var(--r8-border)] rounded-[24px] r8-shadow-overlay overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="h-16 px-6 border-b border-[var(--r8-border)] flex items-center justify-between bg-[var(--r8-surface-1)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)] flex items-center justify-center text-[var(--r8-indigo-600)]">
              <FileCheck className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <span className="text-[13px] font-bold text-[var(--r8-text)]">
                {locale === 'pl' ? 'Rozliczenie kaucji P2P' : 'P2P Security Deposit Clearing'}
              </span>
              <span className="text-[11px] text-[var(--r8-text-3)] block">
                {locale === 'pl' ? 'Bezpośredni zwrot kaucji bez 30-dniowej blokady' : 'Direct subrogation without 30-day landlord lockup'}
              </span>
            </div>
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

        {/* Record Selector */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-[var(--r8-surface-2)] border-b border-[var(--r8-border)] overflow-x-auto text-xs">
          <span className="text-[var(--r8-text-3)] shrink-0 font-medium">Clearance:</span>
          {records.map((rec) => (
            <button
              key={rec.id}
              onClick={() => {
                setSelectedRecordId(rec.id);
                setCertificateView(false);
              }}
              className={`px-3 py-1.5 rounded-[8px] shrink-0 font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedRecordId === rec.id
                  ? 'bg-[var(--r8-surface-1)] text-[var(--r8-text)] border border-[var(--r8-border-strong)]'
                  : 'text-[var(--r8-text-2)] hover:text-[var(--r8-text)]'
              }`}
            >
              <span>{rec.departingTenantName} → {rec.incomingTenantName}</span>
              <span className="font-mono tnum">({formatPLN(rec.amountPLN, locale)})</span>
              {rec.status === 'settled' && <Check className="w-3.5 h-3.5 text-[var(--r8-success)]" strokeWidth={2.5} />}
            </button>
          ))}
        </div>

        {/* Modal Scroll Body */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[75vh]">
          {currentRecord && !certificateView && (
            <div className="space-y-6">
              
              {/* Summary Card */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-[16px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)]">
                <div>
                  <div className="text-[11px] font-semibold text-[var(--r8-text-3)] uppercase tracking-wider">
                    {locale === 'pl' ? 'Kwota kaucji' : 'Deposit Amount'}
                  </div>
                  <div className="text-xl font-bold text-[var(--r8-text)] mt-0.5 tnum font-mono">
                    {formatPLN(currentRecord.amountPLN, locale)}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-[var(--r8-text-3)] uppercase tracking-wider">
                    {locale === 'pl' ? 'Cedent (Zwrot)' : 'Departing (Refund)'}
                  </div>
                  <div className="text-sm font-semibold text-[var(--r8-text)] mt-0.5">
                    {currentRecord.departingTenantName}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-[var(--r8-text-3)] uppercase tracking-wider">
                    {locale === 'pl' ? 'Cesjonariusz' : 'Incoming Tenant'}
                  </div>
                  <div className="text-sm font-semibold text-[var(--r8-text)] mt-0.5">
                    {currentRecord.incomingTenantName}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-[var(--r8-text-3)] uppercase tracking-wider">
                    {locale === 'pl' ? 'Właściciel' : 'Landlord Sign-off'}
                  </div>
                  <div className="text-sm font-semibold text-[var(--r8-success)] mt-0.5">
                    {currentRecord.landlordName}
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-3">
                <div className="text-[12px] font-semibold text-[var(--r8-text-3)] uppercase tracking-wider">
                  {locale === 'pl' ? 'Etapy rozliczenia kaucji' : 'Settlement Checklist'}
                </div>

                {/* Step 1 */}
                <div className="p-4 rounded-[16px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)] flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      currentRecord.tenantInspectionSigned ? 'bg-[var(--r8-indigo-600)] text-white' : 'border border-[var(--r8-border-strong)] text-[var(--r8-text-3)]'
                    }`}>
                      {currentRecord.tenantInspectionSigned ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : '1'}
                    </div>
                    <div>
                      <h4 className="text-[13px] font-semibold text-[var(--r8-text)]">
                        {locale === 'pl' ? 'Protokół zdawczo-odbiorczy i stan liczników' : 'Handover Protocol & Meter Readings'}
                      </h4>
                      <p className="text-[12px] text-[var(--r8-text-2)] mt-0.5">
                        Electricity: {currentRecord.meterElectricity}, Water: {currentRecord.meterWater}, Heating: {currentRecord.meterHeating}.
                      </p>
                    </div>
                  </div>

                  {!currentRecord.tenantInspectionSigned && (
                    <button
                      type="button"
                      onClick={() => handleStepComplete('inspection')}
                      className="px-3 py-1.5 bg-[var(--r8-indigo-600)] hover:bg-[var(--r8-indigo-500)] text-white text-xs font-semibold rounded-[10px] shrink-0 cursor-pointer"
                    >
                      {locale === 'pl' ? 'Podpisz protokół' : 'Sign protocol'}
                    </button>
                  )}
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-[16px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)] flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      currentRecord.landlordConsentSigned ? 'bg-[var(--r8-indigo-600)] text-white' : 'border border-[var(--r8-border-strong)] text-[var(--r8-text-3)]'
                    }`}>
                      {currentRecord.landlordConsentSigned ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : '2'}
                    </div>
                    <div>
                      <h4 className="text-[13px] font-semibold text-[var(--r8-text)]">
                        {locale === 'pl' ? 'Oświadczenie właściciela o bezusterkowości' : 'Landlord Liability Release'}
                      </h4>
                      <p className="text-[12px] text-[var(--r8-text-2)] mt-0.5">
                        {locale === 'pl'
                          ? `Właściciel (${currentRecord.landlordName}) potwierdza brak potrąceń i przypisanie kaucji.`
                          : `Landlord (${currentRecord.landlordName}) confirms zero deductions and re-assigns deposit.`}
                      </p>
                    </div>
                  </div>

                  {!currentRecord.landlordConsentSigned && (
                    <button
                      type="button"
                      onClick={() => handleStepComplete('consent')}
                      className="px-3 py-1.5 bg-[var(--r8-indigo-600)] hover:bg-[var(--r8-indigo-500)] text-white text-xs font-semibold rounded-[10px] shrink-0 cursor-pointer"
                    >
                      {locale === 'pl' ? 'Potwierdź' : 'Verify sign-off'}
                    </button>
                  )}
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-[16px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)] flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      currentRecord.depositTransferred ? 'bg-[var(--r8-indigo-600)] text-white' : 'border border-[var(--r8-border-strong)] text-[var(--r8-text-3)]'
                    }`}>
                      {currentRecord.depositTransferred ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : '3'}
                    </div>
                    <div>
                      <h4 className="text-[13px] font-semibold text-[var(--r8-text)]">
                        {locale === 'pl'
                          ? `Bezpośredni przelew kaucji (${formatPLN(currentRecord.amountPLN, locale)})`
                          : `Direct Transfer (${formatPLN(currentRecord.amountPLN, locale)})`}
                      </h4>
                      <p className="text-[12px] text-[var(--r8-text-2)] mt-0.5">
                        {currentRecord.incomingTenantName} → {currentRecord.departingTenantName}
                      </p>
                    </div>
                  </div>

                  {!currentRecord.depositTransferred ? (
                    <button
                      type="button"
                      onClick={() => handleStepComplete('transfer')}
                      className="px-3 py-1.5 bg-[var(--r8-indigo-600)] hover:bg-[var(--r8-indigo-500)] text-white text-xs font-semibold rounded-[10px] shrink-0 cursor-pointer"
                    >
                      {locale === 'pl' ? 'Potwierdź przelew' : 'Confirm transfer'}
                    </button>
                  ) : (
                    <span className="text-xs text-[var(--r8-success)] font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                      <span>{locale === 'pl' ? 'Rozliczone' : 'Settled'}</span>
                    </span>
                  )}
                </div>

              </div>

              {currentRecord.status === 'settled' && (
                <div className="p-4 rounded-[16px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)] flex items-center justify-between">
                  <div>
                    <h5 className="text-[13px] font-semibold text-[var(--r8-text)]">
                      {locale === 'pl' ? 'Certyfikat rozliczenia kaucji' : 'Deposit Reassignment Certificate'}
                    </h5>
                    <p className="text-[12px] text-[var(--r8-text-2)]">
                      {locale === 'pl' ? 'Urzędowe potwierdzenie przekazania środków.' : 'Legal affirmation of deposit transfer.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCertificateView(true)}
                    className="px-4 py-2 bg-[var(--r8-surface-1)] hover:bg-[var(--r8-surface-3)] border border-[var(--r8-border-strong)] text-[var(--r8-text)] text-xs font-semibold rounded-[10px] cursor-pointer"
                  >
                    {locale === 'pl' ? 'Zobacz certyfikat' : 'View certificate'}
                  </button>
                </div>
              )}

            </div>
          )}

          {certificateView && currentRecord && (
            <div className="space-y-4">
              <div className="p-6 md:p-8 rounded-[16px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)] space-y-4 text-xs leading-relaxed">
                <div className="text-center pb-3 border-b border-[var(--r8-border)]">
                  <div className="text-[11px] font-mono text-[var(--r8-text-3)] uppercase tracking-wider">
                    RELOK8 CLEARINGHOUSE
                  </div>
                  <h3 className="text-base font-bold text-[var(--r8-text)] mt-0.5">
                    CERTYFIKAT ROZLICZENIA KAUCJI (P2P DEPOSIT CERTIFICATE)
                  </h3>
                  <div className="text-[11px] font-mono text-[var(--r8-indigo-400)]">
                    Ref: {currentRecord.id.toUpperCase()}-PLN-{currentRecord.amountPLN}
                  </div>
                </div>

                <p>
                  Niniejszym zaświadcza się, że w związku z cesją umowy najmu lokalu: <strong>{currentRecord.listingTitle}</strong>, kaucja gwarancyjna w wysokości <strong>{formatPLN(currentRecord.amountPLN, locale)}</strong> została w całości przekazana pomiędzy stronami.
                </p>

                <div className="p-3 bg-[var(--r8-surface-1)] rounded-[10px] border border-[var(--r8-border)] grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[var(--r8-text-3)] block text-[11px]">Cedent (Zwrot):</span>
                    <strong>{currentRecord.departingTenantName}</strong>
                  </div>
                  <div>
                    <span className="text-[var(--r8-text-3)] block text-[11px]">Cesjonariusz (Wpłacający):</span>
                    <strong>{currentRecord.incomingTenantName}</strong>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--r8-border)] flex items-center justify-between text-[11px] text-[var(--r8-text-3)]">
                  <span>Status: PRAWOMOCNE / BINDING</span>
                  <span>Data: {currentRecord.receiptIssuedDate || '2026-10-15'}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCertificateView(false)}
                  className="px-3 py-1.5 text-xs text-[var(--r8-text-2)] hover:text-[var(--r8-text)] cursor-pointer"
                >
                  ← {locale === 'pl' ? 'Wróć' : 'Back'}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-[var(--r8-indigo-600)] hover:bg-[var(--r8-indigo-500)] text-white text-xs font-semibold rounded-[10px] cursor-pointer"
                >
                  {locale === 'pl' ? 'Drukuj certyfikat' : 'Print certificate'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
