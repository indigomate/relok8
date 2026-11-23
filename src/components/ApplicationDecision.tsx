import { useState } from 'react';
import type { SupportedLocale } from '../utils/formatters';
import { RELOK8_LAUNCH_PRICING } from '../config/pricing';
type Decision = 'approved' | 'declined' | 'withdrawn' | 'cancelled';
export function ApplicationDecision({ landlord, applicant, status, busy, locale, onDecide }: {
  landlord: boolean; applicant: boolean; status: string; busy: boolean; locale: SupportedLocale;
  onDecide: (decision: Decision, reason: string) => Promise<unknown>;
}) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [reason, setReason] = useState('');
  const say = (en: string, pl: string) => locale === 'pl' ? pl : en;
  const labels = {approved: say('Approve applicant', 'Zatwierdź kandydata'), declined: say('Decline application', 'Odrzuć wniosek'), withdrawn: say('Withdraw application', 'Wycofaj wniosek'), cancelled: say('Cancel approval', 'Anuluj zgodę')};
  const choices: Decision[] = landlord && status === 'requested' ? ['approved', 'declined'] : landlord && status === 'approved' ? ['cancelled'] : applicant && ['requested', 'approved'].includes(status) ? ['withdrawn'] : [];
  if (!choices.length) return null;
  return <div className="space-y-3">
    <div className="flex flex-wrap gap-3">{choices.map(choice => <button key={choice} type="button" disabled={busy} className={`min-h-11 rounded-lg px-4 text-sm font-semibold disabled:opacity-50 ${choice === 'approved' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'}`} onClick={() => {setDecision(choice);setReason('');}}>{labels[choice]}</button>)}</div>
    {decision && <form className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-3" onSubmit={async e => {e.preventDefault();await onDecide(decision, reason.trim()); /* Keep the form on errors; server state removes it on success. */}}>
      <p className="font-semibold">{labels[decision]}?</p>
      {decision === 'approved' ? <p className="text-sm text-slate-600">{say(
        `Approval makes the applicant eligible for the ${RELOK8_LAUNCH_PRICING.tenantReservationConfirmationPLN} PLN reservation confirmation fee. Your ${RELOK8_LAUNCH_PRICING.landlordActiveTenancyMonthlyPLN} PLN monthly active-tenancy charge starts only at move-in. This does not record a payment or signed agreement.`,
        `Akceptacja umożliwia kandydatowi opłacenie ${RELOK8_LAUNCH_PRICING.tenantReservationConfirmationPLN} PLN za potwierdzenie rezerwacji. Twoja miesięczna opłata ${RELOK8_LAUNCH_PRICING.landlordActiveTenancyMonthlyPLN} PLN za aktywny najem zaczyna się dopiero przy wprowadzeniu. To nie potwierdza płatności ani podpisania umowy.`,
      )}</p> : <label className="grid gap-2 text-sm">{say('Explain your decision', 'Wyjaśnij decyzję')}<textarea required maxLength={2000} value={reason} onChange={e=>setReason(e.target.value)} className="w-full rounded-lg border border-slate-300 p-3" /></label>}
      <div className="flex flex-wrap gap-3"><button disabled={busy || (decision !== 'approved' && !reason.trim())} className="min-h-11 rounded-lg bg-indigo-600 px-4 text-sm text-white font-semibold disabled:opacity-50">{busy ? say('Saving…', 'Zapisywanie…') : say('Confirm decision', 'Potwierdź decyzję')}</button><button type="button" disabled={busy} className="min-h-11 px-4 font-semibold text-slate-600" onClick={() => setDecision(null)}>{say('Keep current status', 'Zachowaj obecny status')}</button></div>
    </form>}
  </div>;
}
