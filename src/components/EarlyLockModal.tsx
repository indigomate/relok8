import { canRequestTakeover } from '../utils/leaseTiming';
import {useDialogFocus} from '../utils/useDialogFocus';
import { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Listing } from '../types';
import type { SupportedLocale } from '../utils/formatters';
interface Props { isOpen: boolean; onClose: () => void; listing: Listing; locale: SupportedLocale; currentUser: any; onRequireLogin?: (reason: string) => void }
export function EarlyLockModal({ isOpen, onClose, locale, currentUser, listing, onRequireLogin }: Props) {
  const dialogRef=useDialogFocus(isOpen,onClose);
  const request = useMutation(api.workflow.request);
  const [status, setStatus] = useState('');
  const [pending, setPending] = useState(false);
  useEffect(() => { setStatus(''); }, [isOpen, listing.id]);
  const submit = async () => {
    if (!canRequestTakeover(listing)) {setStatus(locale === 'pl' ? 'Ogłoszenie nie przyjmuje teraz wniosków. Zapytaj najemcę o aktualny status.' : 'This listing is not accepting applications. Ask the tenant for updated timing.'); return;}
    if (!currentUser) { onRequireLogin?.('Sign in to request landlord approval.'); return; }
    setPending(true);
    try {
      await request({ listingId: listing.id, message: locale==='pl'?'Proszę o rozpatrzenie wniosku o przejęcie najmu. Warunki do uzgodnienia.':'Please review my takeover request. Dates and terms are to be agreed.', locale: locale === 'pl' ? 'pl' : 'en' });
      setStatus(locale==='pl'?'Wniosek otrzymany. Właściciel ma 7 dni na decyzję. Śledź wniosek w My Place. Nie dokonano rezerwacji ani płatności.':'Request received. The landlord has 7 days to review it. Track it in My Place. No reservation or payment has been made.');
    } catch (error: any) { setStatus(error.message || 'Could not send your request.'); }
    finally { setPending(false); }
  };
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" role="presentation" onClick={onClose}>
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="payment-status-title" className="bg-white text-slate-900 rounded-2xl p-6 max-w-md" onClick={e => e.stopPropagation()}>
      <h2 id="payment-status-title" className="text-xl font-bold">{locale === 'pl' ? 'Wniosek o przejęcie najmu' : 'Request a lease takeover'}</h2>
      <p className="my-4">{locale === 'pl' ? 'Nie pobraliśmy żadnych środków. Skontaktuj się z najemcą, aby ustalić warunki przejęcia najmu i kaucji.' : 'No money has been charged or held. Contact the tenant to discuss the lease takeover and deposit arrangements.'}</p>
      {!canRequestTakeover(listing) && <p className="mb-3 text-sm text-amber-800">{locale === 'pl' ? 'Zaktualizowane daty są wymagane przed złożeniem wniosku.' : 'Updated dates or an open listing are required before applying.'}</p>}
      <p role="status" className="my-3 text-sm">{status}</p>
      <button disabled={!canRequestTakeover(listing) || pending || (status.startsWith("Request received") || status.startsWith("Wniosek otrzymany"))} onClick={submit} className="px-4 py-2 rounded-lg bg-indigo-600 text-white mr-2">{pending ? (locale==='pl'?'Wysyłanie…':'Sending…') : (locale==='pl'?'Poproś właściciela o zgodę':'Request landlord approval')}</button>
      <button className="px-4 py-2 rounded-lg border border-slate-300" onClick={onClose} autoFocus>{locale === 'pl' ? 'Zamknij' : 'Close'}</button>
    </section>
  </div>;
}
