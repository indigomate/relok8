import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';
import { navigateTo } from '../utils/router';
import { RELOK8_LAUNCH_PRICING } from '../config/pricing';

interface HowItWorksPageProps {
  onBack: () => void;
  onOpenLeaveYourLease: () => void;
  onOpenBrowse: () => void;
  locale?: SupportedLocale;
}

export const HowItWorksPage = ({ onBack, onOpenLeaveYourLease, onOpenBrowse, locale = 'en' }: HowItWorksPageProps) => {
  const [path, setPath] = useState<'find' | 'leave' | 'landlord'>('find');
  const pl = locale === 'pl';
  const say = (en: string, po: string) => pl ? po : en;
  const journeys = {
    find: {
      label: say('Find a home', 'Znajdź mieszkanie'),
      intro: say('From your first search to collecting the keys.', 'Od pierwszego wyszukiwania do odbioru kluczy.'),
      action: say('Explore available homes', 'Przeglądaj dostępne lokale'),
      run: onOpenBrowse,
      steps: [
        [say('Explore and compare', 'Przeglądaj i porównuj'), say('Choose your city, budget and dates. Check rent, bills, deposit and registration information on each listing.', 'Wybierz miasto, budżet i daty. Sprawdź czynsz, opłaty, kaucję i informacje o meldunku.')],
        [say('Talk to the departing tenant', 'Porozmawiaj z dotychczasowym najemcą'), say('Sign in to save homes or send a message. Arrange a viewing and discuss dates and terms in Messages.', 'Zaloguj się, aby zapisywać lokale i wysyłać wiadomości. W Wiadomościach ustal oglądanie, daty i warunki.')],
        [say('Request landlord approval', 'Poproś właściciela o zgodę'), say(`Apply for free and follow the decision in My Place. Only after approval, pay ${RELOK8_LAUNCH_PRICING.tenantReservationConfirmationPLN} PLN to confirm the reservation.`, `Złóż bezpłatny wniosek i śledź decyzję w Moim miejscu. Dopiero po akceptacji zapłać ${RELOK8_LAUNCH_PRICING.tenantReservationConfirmationPLN} PLN, aby potwierdzić rezerwację.`)],
        [say('Complete the handover together', 'Wspólnie zakończcie przekazanie'), say('After approval, all three people confirm documents, deposit arrangements, then inspection and keys in My Place.', 'Po akceptacji wszystkie trzy strony potwierdzają w Moim miejscu dokumenty, rozliczenie kaucji, a następnie odbiór lokalu i kluczy.')],
      ],
    },
    leave: {
      label: say('Leave my lease', 'Przekaż mój najem'),
      intro: say('Find a replacement and coordinate a clear handover.', 'Znajdź następcę i sprawnie ustal przekazanie.'),
      action: say('Start my listing', 'Utwórz ogłoszenie'),
      run: onOpenLeaveYourLease,
      steps: [
        [say('Prepare your listing', 'Przygotuj ogłoszenie'), say('Add location, room details, costs and dates, then photos and consent details. Your draft stays on this device.', 'Dodaj lokalizację, szczegóły lokalu, koszty i daty, a następnie zdjęcia i informacje o zgodach. Szkic pozostaje na tym urządzeniu.')],
        [say('Review, sign in and publish', 'Sprawdź, zaloguj się i opublikuj'), say('Check your details before publishing. A published listing does not mean the landlord has approved it or a replacement.', 'Sprawdź dane przed publikacją. Publikacja nie oznacza zgody właściciela na ogłoszenie ani na następcę.')],
        [say('Invite your landlord', 'Zaproś właściciela'), say('Create an invitation in My Place using their email. Relok8 emails the secure link automatically, and you can copy it as a fallback. They must accept using that verified email within seven days.', 'Utwórz zaproszenie w Moim miejscu, podając email właściciela. Relok8 automatycznie wyśle bezpieczny link emailem, a Ty możesz skopiować go awaryjnie. Właściciel musi go przyjąć ze zweryfikowanym emailem w ciągu siedmiu dni.')],
        [say('Coordinate the replacement', 'Ustal przekazanie następcy'), say('Answer Messages while the landlord reviews applications. After approval, all three participants confirm documents, deposit arrangements and keys in order.', 'Odpowiadaj na Wiadomości, gdy właściciel rozpatruje wnioski. Po akceptacji wszystkie strony kolejno potwierdzają dokumenty, rozliczenie kaucji i klucze.')],
      ],
    },
    landlord: {
      label: say('Review as a landlord', 'Sprawdź jako właściciel'),
      intro: say('Join through your invitation and manage decisions for your property.', 'Dołącz przez zaproszenie i zarządzaj decyzjami dotyczącymi swojego lokalu.'),
      action: say('Open My Place', 'Otwórz Moje miejsce'),
      run: () => navigateTo(pl ? '/pl/place' : '/place'),
      steps: [
        [say('Accept your invitation', 'Przyjmij zaproszenie'), say('Open the link from the listing author and sign in with the intended verified email. Ask for a new link if yours has expired.', 'Otwórz link od autora ogłoszenia i zaloguj się właściwym zweryfikowanym emailem. Jeśli link wygasł, poproś o nowy.')],
        [say('Confirm advertising permission', 'Potwierdź zgodę na ogłoszenie'), say('Review the property in My Place. Permission to advertise is separate from accepting an applicant.', 'Sprawdź lokal w Moim miejscu. Zgoda na ogłoszenie jest niezależna od akceptacji kandydata.')],
        [say('Review the applicant', 'Rozpatrz wniosek kandydata'), say(`Approve or decline the takeover request. The tenant pays ${RELOK8_LAUNCH_PRICING.tenantReservationConfirmationPLN} PLN only after approval; your ${RELOK8_LAUNCH_PRICING.landlordActiveTenancyMonthlyPLN} PLN monthly charge starts at move-in.`, `Zatwierdź lub odrzuć wniosek. Najemca płaci ${RELOK8_LAUNCH_PRICING.tenantReservationConfirmationPLN} PLN dopiero po akceptacji; Twoja miesięczna opłata ${RELOK8_LAUNCH_PRICING.landlordActiveTenancyMonthlyPLN} PLN zaczyna się przy wprowadzeniu.`)],
        [say('Confirm the handover', 'Potwierdź przekazanie'), say('Alongside both tenants, confirm documents, deposit arrangements and inspection with keys. My Place shows who still needs to act.', 'Wraz z oboma najemcami potwierdź dokumenty, rozliczenie kaucji i odbiór lokalu z kluczami. Moje miejsce pokazuje, kto powinien działać.')],
      ],
    },
  };
  const journey = journeys[path];
  return (
    <main className="r8-motion-page min-h-screen bg-slate-50 text-slate-900 pb-36 sm:pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 min-h-11 text-sm font-semibold text-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-4"><ArrowLeft size={16} aria-hidden="true" />{say('Back to listings', 'Wróć do ogłoszeń')}</button>
        <header className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{say('Your housing journey, step by step', 'Twoja droga do mieszkania, krok po kroku')}</h1>
          <p className="text-slate-600">{say('Choose what you want to do. Follow your listings, requests and handover in My Place.', 'Wybierz swój cel. Śledź ogłoszenia, wnioski i przekazanie w Moim miejscu.')}</p>
        </header>
        <section aria-labelledby="pricing-heading" className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 sm:p-6 space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">{say('Simple launch pricing', 'Prosty cennik startowy')}</p>
            <h2 id="pricing-heading" className="mt-1 text-2xl font-bold text-slate-950">{say('49 once. 49 monthly.', '49 raz. 49 miesięcznie.')}</h2>
            <p className="mt-2 text-sm text-slate-600">{say('Nothing else is mandatory. Searching, listing, messaging and live translation are included.', 'Nic więcej nie jest obowiązkowe. Wyszukiwanie, ogłoszenia, wiadomości i tłumaczenie na żywo są w cenie.')}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white border border-indigo-100 p-4"><p className="text-xs font-bold uppercase tracking-wider text-indigo-700">{say('Incoming tenant', 'Nowy najemca')}</p><p className="mt-1 text-xl font-bold">{RELOK8_LAUNCH_PRICING.tenantReservationConfirmationPLN} PLN {say('once', 'raz')}</p><p className="mt-1 text-sm text-slate-600">{say('Only after landlord approval. No approval, no charge.', 'Tylko po akceptacji właściciela. Bez akceptacji nie ma opłaty.')}</p></div>
            <div className="rounded-xl bg-white border border-indigo-100 p-4"><p className="text-xs font-bold uppercase tracking-wider text-indigo-700">{say('Landlord', 'Właściciel')}</p><p className="mt-1 text-xl font-bold">{RELOK8_LAUNCH_PRICING.landlordActiveTenancyMonthlyPLN} PLN / {say('month', 'miesiąc')}</p><p className="mt-1 text-sm text-slate-600">{say('Per active tenancy, from move-in until the tenancy ends.', 'Za aktywny najem, od wprowadzenia do zakończenia najmu.')}</p></div>
          </div>
        </section>
        <fieldset className="space-y-3">
          <legend className="font-semibold mb-3">{say('What brings you here?', 'Co chcesz zrobić?')}</legend>
          <div className="flex flex-wrap gap-3">{(Object.keys(journeys) as Array<keyof typeof journeys>).map(key => (
            <label key={key} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer ${path === key ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-200 bg-white'}`}>
              <input type="radio" name="housing-journey" value={key} checked={path === key} onChange={() => setPath(key)} className="accent-indigo-600" />{journeys[key].label}
            </label>
          ))}</div>
        </fieldset>
        <section aria-labelledby="journey-heading" className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 space-y-6">
          <div><h2 id="journey-heading" className="text-xl font-bold">{journey.label}</h2><p className="text-slate-600 mt-2">{journey.intro}</p></div>
          <ol className="space-y-6">{journey.steps.map(([title, body], index) => (
            <li key={title} className="flex gap-4"><span aria-hidden="true" className="shrink-0 w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">{index + 1}</span><div><h3 className="font-semibold">{title}</h3><p className="text-sm text-slate-600 leading-relaxed mt-1">{body}</p></div></li>
          ))}</ol>
          <button type="button" onClick={journey.run} className="inline-flex items-center gap-2 rounded-xl px-5 py-3 bg-indigo-600 text-white font-semibold focus-visible:outline-2 focus-visible:outline-offset-4">{journey.action}<ArrowRight size={16} aria-hidden="true" /></button>
        </section>
        <aside className="text-sm text-slate-600 space-y-2">
          <h2 className="font-semibold text-slate-900">{say('What each confirmation means', 'Co oznaczają potwierdzenia')}</h2>
          <p>{say('Published → visible listing. Advertising permission → landlord agrees to advertise. Applicant approved → landlord accepts that candidate. Handover complete → all three participants reported every stage complete.', 'Opublikowane → widoczne ogłoszenie. Zgoda na ogłoszenie → właściciel zezwala na publikację. Kandydat zatwierdzony → właściciel akceptuje kandydata. Przekazanie zakończone → wszystkie trzy strony zgłosiły zakończenie każdego etapu.')}</p>
          <p>{say('Relok8 records your updates. Rent, deposits and contract payments remain directly between participants; the two Relok8 platform charges are separate. Payment checkout is not yet enabled, and Relok8 does not hold escrow or independently verify documents and payments.', 'Relok8 zapisuje aktualizacje. Czynsz, kaucja i płatności umowne pozostają bezpośrednio między stronami; dwie opłaty platformowe Relok8 są oddzielne. Moduł płatności nie jest jeszcze aktywny, a Relok8 nie prowadzi escrow ani nie weryfikuje niezależnie dokumentów i płatności.')}</p>
        </aside>
      </div>
    </main>
  );
};
