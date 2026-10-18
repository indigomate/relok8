import React, { useState } from 'react';
import { ArrowLeft, Copy, Check, Download, AlertCircle, FileText, ChevronRight } from 'lucide-react';
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
  const [langTab, setLangTab] = useState<'both' | 'polish' | 'english'>('both');
  const [isEditMode, setIsEditMode] = useState(false);
  const [leaseDate, setLeaseDate] = useState('');
  const [showNeedsAttention, setShowNeedsAttention] = useState(true);

  const fullText = `§ 1 Subject · Przedmiot umowy
Dotychczasowy Najemca (Cedent) przenosi na Nowego Najemcę (Cesjonariusza) prawa i obowiązki z umowy najmu z dnia ${leaseDate || '[data umowy]'}.

The outgoing tenant (Assignor) assigns to the incoming tenant (Assignee) the rights and obligations under the lease dated ${leaseDate || '[date of original lease]'}.

§ 2 Landlord consent · Zgoda
Wynajmujący wyraził uprzednią, pisemną zgodę na przejęcie.

The landlord has given prior written consent to the takeover.

§ 3 Effective date · Data przejęcia
Przejęcie następuje z dniem 15 października 2026 r.

The takeover takes effect on 15 October 2026.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `takeover_agreement_relok8.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-28 text-left">
      {/* Top Header Bar matching Screenshot 5 & 7 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1 -ml-1 text-slate-800 hover:text-slate-950 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="text-base sm:text-lg font-bold text-slate-900">
            {isEditMode ? 'Takeover agreement' : 'Agreement template'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="p-2 text-slate-700 hover:text-slate-900 cursor-pointer"
            aria-label="Copy"
            title="Copy agreement"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5 stroke-[1.8]" />}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 text-slate-700 hover:text-slate-900 cursor-pointer"
            aria-label="Download"
            title="Download agreement"
          >
            <Download className="w-5 h-5 stroke-[1.8]" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        {!isEditMode ? (
          /* TEMPLATE OVERVIEW VIEW (Screenshot 5) */
          <>
            {/* Title & Description */}
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Lease takeover agreement template
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                A bilingual template to hand a lease to a new tenant, with the landlord's consent. Fill in the details, then send it for approval.
              </p>
              <p className="text-[11px] text-slate-400">
                Document tools only, not legal advice. Have a lawyer review it before signing.
              </p>
            </div>

            {/* Segmented language selector: Both | Polish | English */}
            <div className="p-1 bg-slate-100 rounded-xl flex items-center text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setLangTab('both')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  langTab === 'both' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Both
              </button>
              <button
                type="button"
                onClick={() => setLangTab('polish')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  langTab === 'polish' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Polish
              </button>
              <button
                type="button"
                onClick={() => setLangTab('english')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  langTab === 'english' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                English
              </button>
            </div>

            {/* Agreement Card (Screenshot 5) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-6 shadow-xs">
              {/* § 1 Subject */}
              <div className="space-y-2 text-xs leading-relaxed">
                <div className="font-bold text-slate-900 text-sm">
                  § 1 Subject <span className="text-slate-400 font-normal">· Przedmiot umowy</span>
                </div>
                {(langTab === 'both' || langTab === 'polish') && (
                  <p className="text-slate-800">
                    Dotychczasowy Najemca (Cedent) przenosi na Nowego Najemcę (Cesjonariusza) prawa i obowiązki z umowy najmu z dnia{' '}
                    <span className="inline-block px-2 py-0.5 rounded border border-dashed border-amber-500 bg-amber-50/70 text-amber-800 font-medium">
                      data umowy
                    </span>.
                  </p>
                )}
                {(langTab === 'both' || langTab === 'english') && (
                  <div className="pl-3 border-l-2 border-slate-200 text-slate-600 space-y-1">
                    <p>
                      The outgoing tenant (Assignor) assigns to the incoming tenant (Assignee) the rights and obligations under the lease dated{' '}
                      <span className="inline-block px-1.5 py-0.2 rounded border border-dashed border-amber-500 bg-amber-50/70 text-amber-800 font-medium">
                        date of original lease
                      </span>.
                    </p>
                  </div>
                )}
              </div>

              {/* § 2 Landlord consent */}
              <div className="space-y-2 text-xs leading-relaxed">
                <div className="font-bold text-slate-900 text-sm">
                  § 2 Landlord consent <span className="text-slate-400 font-normal">· Zgoda</span>
                </div>
                {(langTab === 'both' || langTab === 'polish') && (
                  <p className="text-slate-800">
                    Wynajmujący wyraził uprzednią, pisemną zgodę na przejęcie.
                  </p>
                )}
                {(langTab === 'both' || langTab === 'english') && (
                  <div className="pl-3 border-l-2 border-slate-200 text-slate-600">
                    <p>
                      The landlord has given prior written consent to the takeover.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* EDIT / DETAIL VIEW (Screenshot 7) */
          <>
            {/* Segmented Tabs: Preview | Edit details */}
            <div className="p-1 bg-slate-100 rounded-xl flex items-center text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setIsEditMode(false)}
                className="flex-1 py-1.5 rounded-lg text-center hover:text-slate-900 cursor-pointer"
              >
                Preview
              </button>
              <button
                type="button"
                className="flex-1 py-1.5 rounded-lg text-center bg-white text-slate-900 shadow-xs cursor-pointer"
              >
                Edit details
              </button>
            </div>

            {/* Amber Alert Banner: 1 detail needs your attention (Screenshot 7) */}
            {showNeedsAttention && (
              <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-900 block">1 detail needs your attention</span>
                    <span className="text-amber-800 text-[11px]">
                      Add the original lease date before you send this.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('lease-date-input');
                    if (el) el.focus();
                  }}
                  className="text-indigo-600 hover:underline font-bold text-xs shrink-0 cursor-pointer"
                >
                  Review
                </button>
              </div>
            )}

            {/* Interactive Contract Card with Editable Badges (Screenshot 7) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-6 shadow-xs">
              {/* § 1 Subject with interactive chips */}
              <div className="space-y-2 text-xs leading-relaxed">
                <div className="font-bold text-slate-900 text-sm">
                  § 1 Subject <span className="text-slate-400 font-normal">· Przedmiot umowy</span>
                </div>
                <p className="text-slate-800 leading-relaxed">
                  Cedent, za uprzednią zgodą Wynajmującego, przenosi na Cesjonariusza prawa i obowiązki z umowy najmu lokalu przy{' '}
                  <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                    ul. Koszykowa 68, Warszawa
                  </span>{' '}
                  z dnia{' '}
                  <span className="inline-block px-2 py-0.5 rounded border border-dashed border-amber-500 bg-amber-50/80 text-amber-800 font-medium">
                    {leaseDate || 'dodaj datę'}
                  </span>.
                </p>

                <div className="pl-3 border-l-2 border-slate-200 text-slate-600 space-y-1">
                  <p>
                    With the landlord's prior consent, the Assignor assigns to the Assignee the rights and obligations under the lease of the premises at{' '}
                    <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                      ul. Koszykowa 68, Warsaw
                    </span>{' '}
                    dated{' '}
                    <span className="inline-block px-1.5 py-0.2 rounded border border-dashed border-amber-500 bg-amber-50/80 text-amber-800 font-medium">
                      {leaseDate || 'add date'}
                    </span>.
                  </p>
                </div>

                {/* Inline Date Field Input */}
                <div className="pt-2">
                  <input
                    id="lease-date-input"
                    type="date"
                    value={leaseDate}
                    onChange={(e) => {
                      setLeaseDate(e.target.value);
                      if (e.target.value) setShowNeedsAttention(false);
                    }}
                    className="text-xs p-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50"
                  />
                </div>
              </div>

              {/* § 2 Effective date */}
              <div className="space-y-2 text-xs leading-relaxed">
                <div className="font-bold text-slate-900 text-sm">
                  § 2 Effective date <span className="text-slate-400 font-normal">· Data przejęcia</span>
                </div>
                <p className="text-slate-800">
                  Przejęcie następuje z dniem{' '}
                  <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                    15 października 2026 r.
                  </span>
                </p>

                <div className="pl-3 border-l-2 border-slate-200 text-slate-600">
                  <p>
                    The takeover takes effect on{' '}
                    <span className="inline-block px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                      15 October 2026
                    </span>.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Fixed Sticky Bottom Button (Screenshot 5: [Use this template] / Screenshot 7: [Send to landlord for approval]) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex flex-col items-center justify-center shadow-lg pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="w-full max-w-xl">
          {!isEditMode ? (
            <button
              type="button"
              onClick={() => setIsEditMode(true)}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-99 text-white font-semibold text-sm transition-all shadow-sm cursor-pointer"
            >
              Use this template
            </button>
          ) : (
            <div className="space-y-1 text-center">
              <button
                type="button"
                onClick={() => {
                  if (!leaseDate) {
                    alert('Please select the original lease date first.');
                    return;
                  }
                  onOpenCesjaModal();
                }}
                className={`w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all shadow-sm cursor-pointer ${
                  !leaseDate ? 'bg-indigo-400 hover:bg-indigo-500' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-99'
                }`}
              >
                Send to landlord for approval
              </button>
              {!leaseDate && (
                <span className="text-[11px] text-slate-500 block">
                  Complete 1 detail to send
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
