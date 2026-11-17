import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { SupportedLocale } from '../utils/formatters';
import type { Message, Place } from '../types/relok8';

export function PropertySettings({ listingId, owner, landlord, locale, onDeleteListing }: {
  listingId: string; owner: boolean; landlord: boolean; locale: SupportedLocale;
  onDeleteListing?: (id: string) => Promise<boolean | void> | void;
}) {
  const place = useQuery(api.domain.read, { operation: 'place', input: { id: listingId } }) as Place | null | undefined;
  const write = useMutation(api.domain.write);
  const [roomOpen, setRoomOpen] = useState(false);
  const roomMessages = useQuery(api.domain.read, roomOpen ? {operation: 'roomMessages', input: {placeId: listingId}} : 'skip') as Message[] | undefined;
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [deleting, setDeleting] = useState(false);
  const say = (en: string, pl: string) => locale === 'pl' ? pl : en;
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true); setError(''); setNotice('');
    try { await action(); setNotice(say('Changes saved.', 'Zmiany zapisane.')); }
    catch (e) { setError(e instanceof Error ? e.message : say('Could not save.', 'Nie udało się zapisać.')); }
    finally { setBusy(false); }
  };
  const mutate = (operation: string, input: Record<string, unknown> = {}) => write({ operation, input: { placeId: listingId, ...input } });
  if (!place) return <p role="status">{say('Loading property settings…', 'Wczytywanie ustawień lokalu…')}</p>;
  return <div className="space-y-4">
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
    {owner && <details className="border-t border-slate-100 pt-3">
      <summary className="cursor-pointer min-h-11 py-2 font-semibold">{say('Edit property details', 'Edytuj dane lokalu')}</summary>
      <form className="grid gap-4 pt-3" onSubmit={e => {e.preventDefault(); const form = new FormData(e.currentTarget); void run(() => mutate('updatePlace', { updates: { rules: form.get('rules'), rentPLN: Number(form.get('rent')), czynszPLN: Number(form.get('admin')) } }));}}>
        <label className="grid gap-2 text-sm">{say('Monthly rent (PLN)', 'Miesięczny czynsz (PLN)')}<input className="border rounded-lg p-3 w-full" name="rent" type="number" min="0" max="1000000" step="0.01" defaultValue={place.rentPLN} required /></label>
        <label className="grid gap-2 text-sm">{say('Administration fee (PLN)', 'Czynsz administracyjny (PLN)')}<input className="border rounded-lg p-3 w-full" name="admin" type="number" min="0" max="1000000" step="0.01" defaultValue={place.czynszPLN} required /></label>
        <label className="grid gap-2 text-sm">{say('Description and house rules', 'Opis i zasady lokalu')}<textarea className="border rounded-lg p-3 w-full" name="rules" maxLength={10000} rows={3} defaultValue={place.rules} /></label>
        <button disabled={busy} className="justify-self-start min-h-11 rounded-lg bg-indigo-600 px-4 text-white font-semibold disabled:opacity-50">{say('Save details', 'Zapisz dane')}</button>
      </form>
    </details>}
    {(place.status === 'occupied' || place.status === 'exit_requested') && <details className="border-t border-slate-100 pt-3">
      <summary className="cursor-pointer min-h-11 py-2 font-semibold">{say('Early lease exit', 'Wcześniejsze zakończenie najmu')}</summary>
      {place.leaveDate && <p className="text-sm my-3">{say('Proposed departure: ', 'Proponowana wyprowadzka: ')}{place.leaveDate}</p>}
      {place.exitNotes && <p className="text-sm whitespace-pre-wrap break-words">{place.exitNotes}</p>}
      {owner && place.status === 'occupied' && <form className="grid gap-3" onSubmit={e => {e.preventDefault();const form = new FormData(e.currentTarget);void run(() => mutate('requestExit', { leaveDate: form.get('date'), notes: form.get('notes') }));}}>
        <label className="grid gap-2 text-sm">{say('Departure date', 'Data wyprowadzki')}<input className="border rounded-lg p-3" type="date" name="date" required /></label>
        <label className="grid gap-2 text-sm">{say('Notes for the landlord', 'Uwagi dla właściciela')}<textarea className="border rounded-lg p-3" name="notes" maxLength={2000} /></label>
        <button disabled={busy} className="min-h-11 rounded-lg border px-4 font-semibold disabled:opacity-50">{say('Request early exit', 'Poproś o wcześniejsze zakończenie')}</button>
      </form>}
      {owner && place.status === 'exit_requested' && <button disabled={busy} className="min-h-11 rounded-lg border px-4 mt-3" onClick={() => void run(() => mutate('cancelExit'))}>{say('Cancel exit request', 'Anuluj wniosek')}</button>}
      {landlord && place.status === 'exit_requested' && <form className="grid gap-3 mt-3" onSubmit={e => {e.preventDefault();const form = new FormData(e.currentTarget);void run(() => mutate('decideExit', {decision: form.get('decision'), reasonOrDate: form.get('reason')}));}}>
        <label className="grid gap-2">{say('Decision', 'Decyzja')}<select className="border rounded-lg p-3" name="decision"><option value="approve">{say('Approve exit', 'Zatwierdź wyprowadzkę')}</option><option value="decline">{say('Decline exit', 'Odrzuć')}</option><option value="suggest_date">{say('Suggest another date', 'Zaproponuj inną datę')}</option></select></label>
        <label className="grid gap-2">{say('Reason or proposed date (YYYY-MM-DD)', 'Powód lub proponowana data (RRRR-MM-DD)')}<input className="border rounded-lg p-3" name="reason" maxLength={2000} /></label>
        <button disabled={busy} className="min-h-11 border rounded-lg font-semibold">{say('Save exit decision', 'Zapisz decyzję')}</button>
      </form>}
    </details>}
    <details className="border-t border-slate-100 pt-3" onToggle={e => setRoomOpen(e.currentTarget.open)}>
      <summary className="cursor-pointer min-h-11 py-2 font-semibold">{say('Private property conversation', 'Prywatna rozmowa o lokalu')}</summary>
      <p className="text-xs text-slate-500 py-2">{say('For the listing author and landlord. Applicant enquiries are in Messages.', 'Dla autora ogłoszenia i właściciela. Zapytania kandydatów znajdziesz w Wiadomościach.')}</p>
      <div className="max-h-60 overflow-y-auto space-y-3 py-3" role="log" aria-label={say('Property messages', 'Wiadomości o lokalu')}>
        {roomMessages === undefined ? <p role="status">{say('Loading messages…', 'Wczytywanie wiadomości…')}</p> : roomMessages.length === 0 ? <p className="text-sm text-slate-500">{say('No messages yet.', 'Brak wiadomości.')}</p> : roomMessages.map(m => <p key={m.id} className="text-sm whitespace-pre-wrap break-words border-l-2 border-slate-200 pl-3"><span className="block text-xs text-slate-500">{m.authorType === 'landlord' ? say('Landlord', 'Właściciel') : say('Listing author', 'Autor ogłoszenia')}</span>{m.body}</p>)}
      </div>
      <form className="space-y-3" onSubmit={e => {e.preventDefault();void run(async () => {await mutate('roomMessage', {body: message.trim()});setMessage('');});}}>
        <label className="grid gap-2 text-sm">{say('Message', 'Wiadomość')}<textarea required maxLength={5000} value={message} onChange={e => setMessage(e.target.value)} className="w-full rounded-lg border p-3" /></label>
        <button disabled={busy || !message.trim()} className="min-h-11 rounded-lg border px-4 font-semibold disabled:opacity-50">{say('Send message', 'Wyślij wiadomość')}</button>
      </form>
    </details>
    {owner && <div className="border-t border-slate-100 pt-3">
      {!deleting ? <button type="button" className="min-h-11 text-sm font-semibold text-rose-700" onClick={() => setDeleting(true)}>{say('Delete listing…', 'Usuń ogłoszenie…')}</button> : <div className="space-y-3 rounded-lg border border-rose-200 bg-rose-50 p-4">
        <p className="font-semibold">{say('Delete this listing?', 'Usunąć to ogłoszenie?')}</p><p className="text-sm">{say('The listing and its related conversations and activity will be removed. This cannot be undone.', 'Ogłoszenie oraz powiązane rozmowy i aktywność zostaną usunięte. Tej operacji nie można cofnąć.')}</p>
        <div className="flex flex-wrap gap-3"><button type="button" disabled={busy} className="min-h-11 rounded-lg bg-rose-700 text-white px-4 font-semibold disabled:opacity-50" onClick={() => void run(async () => {const result = onDeleteListing ? await onDeleteListing(listingId) : await mutate('deletePlace'); if (result === false) throw new Error(say('Listing was not deleted.', 'Ogłoszenie nie zostało usunięte.'));})}>{busy ? say('Deleting…', 'Usuwanie…') : say('Delete permanently', 'Usuń trwale')}</button><button type="button" disabled={busy} className="min-h-11 px-4 font-semibold" onClick={() => setDeleting(false)}>{say('Keep listing', 'Zachowaj ogłoszenie')}</button></div>
      </div>}
    </div>}
  </div>;
}
