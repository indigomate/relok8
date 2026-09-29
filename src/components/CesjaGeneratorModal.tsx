import React, { useState } from 'react';
import { X, Printer, Copy, Check, Download, FileText, Scale } from 'lucide-react';
import { Listing, CesjaAgreementData } from '../types';
import { formatPLN, formatDate, SupportedLocale } from '../utils/formatters';

interface CesjaGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  presetListing?: Listing | null;
  locale?: SupportedLocale;
}

export const CesjaGeneratorModal: React.FC<CesjaGeneratorModalProps> = ({
  isOpen,
  onClose,
  presetListing,
  locale = 'en'
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Contract form state
  const [data, setData] = useState<CesjaAgreementData>({
    contractNumber: `CESJA-${presetListing?.city.toUpperCase().slice(0, 3) || 'WAW'}-${Date.now().toString().slice(-4)}`,
    city: presetListing?.city || 'Warsaw',
    date: new Date().toISOString().split('T')[0],
    effectiveDate: presetListing?.availableDate || '2026-10-15',
    landlordName: presetListing?.landlordName || 'Marek Wiśniewski',
    landlordId: 'PESEL: 78041209871 / ID: ABE 129841',
    landlordAddress: presetListing?.address || 'ul. Marszałkowska 10, Warszawa',
    departingName: presetListing?.departingTenant.name || 'Matteo Rossi',
    departingPassport: 'Passport: YA8921041 (Italy)',
    departingAddress: presetListing?.address || 'ul. Rakowiecka 32, Warszawa',
    departingIban: 'PL 42 1050 1445 1000 0098 7654 3210 (Santander Bank Polska)',
    incomingName: 'Alexander Novak',
    incomingPassport: 'Passport: C90481249 (Germany)',
    incomingAddress: 'ul. Koszykowa 12, Warszawa',
    incomingAffiliation: 'University of Warsaw / Erasmus Exchange 2026',
    propertyAddress: presetListing?.address || 'ul. Rakowiecka 32, Warszawa',
    originalLeaseDate: '2025-09-01',
    monthlyRentPLN: presetListing?.monthlyRentPLN || 2400,
    depositPLN: presetListing?.depositPLN || 2850,
    inspectionProtocolDate: presetListing?.availableDate || '2026-10-15'
  });

  const [activeTab, setActiveTab] = useState<'bilingual' | 'fields'>('bilingual');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = document.getElementById('cesja-print-area')?.innerText || '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = document.getElementById('cesja-print-area')?.innerText || '';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.contractNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#0B1120]/80 backdrop-blur-sm flex justify-center p-3 sm:p-6 md:p-8 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-[920px] bg-[var(--r8-surface-1)] border border-[var(--r8-border)] rounded-[24px] r8-shadow-overlay overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="h-16 px-6 border-b border-[var(--r8-border)] flex items-center justify-between bg-[var(--r8-surface-1)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)] flex items-center justify-center text-[var(--r8-indigo-400)]">
              <FileText className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-[var(--r8-text)]">
                  {locale === 'pl' ? 'Wzór cesji umowy najmu' : 'Bilingual Cesja Agreement'}
                </span>
                <span className="text-[11px] font-mono text-[var(--r8-success)] bg-[var(--r8-surface-2)] px-2 py-0.5 rounded-[6px] border border-[var(--r8-border)]">
                  Art. 509 & 519 KC
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-[10px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)] text-[var(--r8-text-2)] hover:text-[var(--r8-text)] transition-colors flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span className="hidden sm:inline">PDF / Print</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-[10px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)] text-[var(--r8-text-2)] hover:text-[var(--r8-text)] transition-colors flex items-center gap-1.5 text-xs cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[var(--r8-success)]" /> : <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-[10px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)] text-[var(--r8-text-2)] hover:text-[var(--r8-text)] transition-colors flex items-center gap-1.5 text-xs cursor-pointer"
            >
              {downloadSuccess ? <Check className="w-3.5 h-3.5 text-[var(--r8-success)]" /> : <Download className="w-3.5 h-3.5" strokeWidth={1.75} />}
              <span className="hidden sm:inline">Text</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-[10px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)] text-[var(--r8-text-2)] hover:text-[var(--r8-text)] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Tab switcher: Dual Preview vs Edit Fields */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-[var(--r8-surface-2)] border-b border-[var(--r8-border)] text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('bilingual')}
            className={`px-3 py-1.5 rounded-[8px] font-medium transition-colors cursor-pointer ${
              activeTab === 'bilingual'
                ? 'bg-[var(--r8-surface-1)] text-[var(--r8-text)] border border-[var(--r8-border-strong)]'
                : 'text-[var(--r8-text-2)] hover:text-[var(--r8-text)]'
            }`}
          >
            {locale === 'pl' ? 'Podgląd polsko-angielski' : 'Bilingual Contract Document'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fields')}
            className={`px-3 py-1.5 rounded-[8px] font-medium transition-colors cursor-pointer ${
              activeTab === 'fields'
                ? 'bg-[var(--r8-surface-1)] text-[var(--r8-text)] border border-[var(--r8-border-strong)]'
                : 'text-[var(--r8-text-2)] hover:text-[var(--r8-text)]'
            }`}
          >
            {locale === 'pl' ? 'Edytuj dane stron i IBAN' : 'Edit Parties & Bank IBAN'}
          </button>
        </div>

        {/* Modal Scroll Body */}
        <div className="p-6 md:p-8 overflow-y-auto max-h-[75vh]">
          {activeTab === 'fields' ? (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="p-4 rounded-[16px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)] space-y-3">
                <div className="text-[12px] font-semibold text-[var(--r8-text-3)] uppercase tracking-wider">
                  Wynajmujący (Landlord)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[var(--r8-text-2)] block mb-1">Full Legal Name</label>
                    <input
                      type="text"
                      value={data.landlordName}
                      onChange={(e) => setData({ ...data, landlordName: e.target.value })}
                      className="w-full bg-[var(--r8-surface-1)] border border-[var(--r8-border-strong)] rounded-[10px] p-2 text-[var(--r8-text)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[var(--r8-text-2)] block mb-1">PESEL / ID Number</label>
                    <input
                      type="text"
                      value={data.landlordId}
                      onChange={(e) => setData({ ...data, landlordId: e.target.value })}
                      className="w-full bg-[var(--r8-surface-1)] border border-[var(--r8-border-strong)] rounded-[10px] p-2 text-[var(--r8-text)] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-[16px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)] space-y-3">
                <div className="text-[12px] font-semibold text-[var(--r8-text-3)] uppercase tracking-wider">
                  Cedent (Outgoing Tenant) & Bank Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[var(--r8-text-2)] block mb-1">Tenant Name</label>
                    <input
                      type="text"
                      value={data.departingName}
                      onChange={(e) => setData({ ...data, departingName: e.target.value })}
                      className="w-full bg-[var(--r8-surface-1)] border border-[var(--r8-border-strong)] rounded-[10px] p-2 text-[var(--r8-text)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[var(--r8-text-2)] block mb-1">Passport / ID</label>
                    <input
                      type="text"
                      value={data.departingPassport}
                      onChange={(e) => setData({ ...data, departingPassport: e.target.value })}
                      className="w-full bg-[var(--r8-surface-1)] border border-[var(--r8-border-strong)] rounded-[10px] p-2 text-[var(--r8-text)] outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[var(--r8-text-2)] block mb-1">Bank IBAN (Receiving Deposit Transfer)</label>
                    <input
                      type="text"
                      value={data.departingIban}
                      onChange={(e) => setData({ ...data, departingIban: e.target.value })}
                      className="w-full bg-[var(--r8-surface-1)] border border-[var(--r8-border-strong)] rounded-[10px] p-2 text-[var(--r8-text)] font-mono outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-[16px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)] space-y-3">
                <div className="text-[12px] font-semibold text-[var(--r8-text-3)] uppercase tracking-wider">
                  Cesjonariusz (Replacement Tenant)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[var(--r8-text-2)] block mb-1">Incoming Tenant Name</label>
                    <input
                      type="text"
                      value={data.incomingName}
                      onChange={(e) => setData({ ...data, incomingName: e.target.value })}
                      className="w-full bg-[var(--r8-surface-1)] border border-[var(--r8-border-strong)] rounded-[10px] p-2 text-[var(--r8-text)] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[var(--r8-text-2)] block mb-1">Passport / Student ID</label>
                    <input
                      type="text"
                      value={data.incomingPassport}
                      onChange={(e) => setData({ ...data, incomingPassport: e.target.value })}
                      className="w-full bg-[var(--r8-surface-1)] border border-[var(--r8-border-strong)] rounded-[10px] p-2 text-[var(--r8-text)] outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('bilingual')}
                className="w-full py-2.5 bg-[var(--r8-indigo-600)] hover:bg-[var(--r8-indigo-500)] text-white text-[13px] font-semibold rounded-[12px] cursor-pointer"
              >
                {locale === 'pl' ? 'Zobacz zaktualizowany dokument' : 'Update contract preview'}
              </button>
            </div>
          ) : (
            <div id="cesja-print-area" className="p-6 md:p-8 rounded-[16px] bg-[var(--r8-surface-2)] border border-[var(--r8-border)] text-[var(--r8-text)] text-xs md:text-sm leading-relaxed space-y-5">
              
              <div className="text-center pb-4 border-b border-[var(--r8-border)] space-y-1">
                <div className="text-[11px] font-mono tracking-widest text-[var(--r8-text-3)] uppercase">
                  USTAWA Z DNIA 23 KWIETNIA 1964 R. KODEKS CYWILNY (ART. 509 & 519 KC)
                </div>
                <h2 className="text-base md:text-lg font-bold text-[var(--r8-text)]">
                  POROZUMIENIE O CESJI PRAW I OBOWIĄZKÓW Z UMOWY NAJMU
                </h2>
                <h3 className="text-xs text-[var(--r8-text-2)] italic">
                  AGREEMENT ON THE ASSIGNMENT OF RIGHTS AND OBLIGATIONS UNDER LEASE AGREEMENT
                </h3>
                <div className="text-[11px] font-mono text-[var(--r8-indigo-400)] pt-1">
                  Document Ref: {data.contractNumber}
                </div>
              </div>

              {/* Parties */}
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-[var(--r8-surface-1)] rounded-[10px] border border-[var(--r8-border)]">
                  <strong>1. WYNAJMUJĄCY / LANDLORD:</strong> {data.landlordName}, {data.landlordId}, adres: {data.landlordAddress}
                </div>
                <div className="p-3 bg-[var(--r8-surface-1)] rounded-[10px] border border-[var(--r8-border)]">
                  <strong>2. CEDENT / OUTGOING TENANT:</strong> {data.departingName}, {data.departingPassport}. Rachunek bankowy / IBAN: <code className="font-mono text-[var(--r8-success)]">{data.departingIban}</code>
                </div>
                <div className="p-3 bg-[var(--r8-surface-1)] rounded-[10px] border border-[var(--r8-border)]">
                  <strong>3. CESJONARIUSZ / INCOMING TENANT:</strong> {data.incomingName}, {data.incomingPassport}, {data.incomingAffiliation}
                </div>
              </div>

              {/* Clauses */}
              <div className="space-y-3 pt-2 text-xs">
                <div className="p-3.5 bg-[var(--r8-surface-1)] rounded-[10px] border border-[var(--r8-border)] space-y-1.5">
                  <div className="font-bold text-[var(--r8-text)]">§ 1 Przedmiot umowy / Subject of the Assignment</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-[var(--r8-text-2)]">
                    <p><strong>[PL]</strong> Na podstawie art. 509 i art. 519 Kodeksu Cywilnego, Cedent – za uprzednią zgodą Wynajmującego – przenosi na Cesjonariusza ogół praw i obowiązków wynikających z Umowy Najmu lokalu położonego przy: {data.propertyAddress}.</p>
                    <p className="italic"><strong>[EN]</strong> Pursuant to Articles 509 and 519 of the Polish Civil Code, the Assignor, with the prior express consent of the Landlord, hereby assigns to the Assignee all rights and obligations arising from the Lease Agreement for premises at: {data.propertyAddress}.</p>
                  </div>
                </div>

                <div className="p-3.5 bg-[var(--r8-surface-1)] rounded-[10px] border border-[var(--r8-border)] space-y-1.5">
                  <div className="font-bold text-[var(--r8-text)]">§ 2 Data przejęcia / Effective Date</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-[var(--r8-text-2)]">
                    <p><strong>[PL]</strong> Przejęcie lokalu i praw następuje z dniem {data.effectiveDate}. Od tej daty Cesjonariusz zobowiązany jest do regularnego uiszczania czynszu w kwocie {data.monthlyRentPLN} PLN.</p>
                    <p className="italic"><strong>[EN]</strong> The assumption of rights and obligations takes legal effect on {data.effectiveDate}. Starting from this date, the Assignee is obligated to make rental payments of PLN {data.monthlyRentPLN}.</p>
                  </div>
                </div>

                <div className="p-3.5 bg-[var(--r8-surface-1)] rounded-[10px] border border-[var(--r8-border)] space-y-1.5">
                  <div className="font-bold text-[var(--r8-text)]">§ 3 Rozliczenie kaucji / P2P Deposit Clearing</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-[var(--r8-text-2)]">
                    <p><strong>[PL]</strong> Kaucja w wysokości {data.depositPLN} PLN zostaje rozliczona bezpośrednio: Cesjonariusz zwraca Cedentowi kwotę {data.depositPLN} PLN na wskazany rachunek bankowy. Wynajmujący przypisuje zatrzymaną kaucję na zabezpieczenie roszczeń Cesjonariusza.</p>
                    <p className="italic"><strong>[EN]</strong> The security deposit of PLN {data.depositPLN} is settled directly: Assignee pays PLN {data.depositPLN} directly to Assignor's IBAN. The Landlord confirms the held deposit henceforth secures the Assignee's lease obligations.</p>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-6 border-t border-[var(--r8-border)] grid grid-cols-3 gap-4 text-center text-xs">
                <div className="space-y-6">
                  <div className="border-b border-dashed border-[var(--r8-border-strong)] pb-1 text-[11px] text-[var(--r8-text-3)]">
                    Cedent (Assignor)
                  </div>
                  <span className="font-medium text-[var(--r8-text)] block">{data.departingName}</span>
                </div>
                <div className="space-y-6">
                  <div className="border-b border-dashed border-[var(--r8-border-strong)] pb-1 text-[11px] text-[var(--r8-text-3)]">
                    Cesjonariusz (Assignee)
                  </div>
                  <span className="font-medium text-[var(--r8-text)] block">{data.incomingName}</span>
                </div>
                <div className="space-y-6">
                  <div className="border-b border-dashed border-[var(--r8-border-strong)] pb-1 text-[11px] text-[var(--r8-text-3)]">
                    Wynajmujący (Landlord)
                  </div>
                  <span className="font-medium text-[var(--r8-text)] block">{data.landlordName}</span>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Modal Bottom info */}
        <div className="px-6 py-3 bg-[var(--r8-surface-1)] border-t border-[var(--r8-border)] flex items-center justify-between text-[11px] text-[var(--r8-text-3)]">
          <div className="flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-[var(--r8-indigo-400)]" strokeWidth={1.75} />
            <span>Enforceable under Polish Civil Code. Relok8 provides tools, not legal counsel.</span>
          </div>
          <span className="font-mono">v1.1</span>
        </div>

      </div>
    </div>
  );
};
