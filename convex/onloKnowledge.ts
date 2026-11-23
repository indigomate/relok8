import { internalMutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';

const VERIFIED_AT = Date.parse('2026-11-23T00:00:00.000Z');
const VERSION = 2;

export const DEFAULT_ONLO_KNOWLEDGE = [
  {
    slug: 'onlo-verified-scope', category: 'platform', jurisdiction: 'PL', version: VERSION,
    titleEn: 'What Onlo can verify', titlePl: 'Co Onlo może potwierdzić',
    answerEn: 'Onlo explains Relok8 product rules and selected Polish rental topics from curated sources. It cannot verify a person, property, document, payment, landlord decision, legal status, or future availability. If the verified knowledge does not answer a question, Onlo should say so and point the user to the relevant participant, authority, or qualified adviser.',
    answerPl: 'Onlo wyjaśnia zasady Relok8 i wybrane zagadnienia najmu w Polsce na podstawie sprawdzonych źródeł. Nie może zweryfikować osoby, lokalu, dokumentu, płatności, decyzji właściciela, sytuacji prawnej ani przyszłej dostępności. Jeśli baza wiedzy nie odpowiada na pytanie, Onlo powinno to powiedzieć i skierować użytkownika do właściwej strony, urzędu lub wykwalifikowanego doradcy.',
    keywords: ['Onlo', 'what can Onlo do', 'verify', 'guarantee', 'legal advice', 'co potrafi Onlo', 'weryfikacja', 'gwarancja', 'porada prawna'],
    sourceLabelEn: 'Relok8 assistant policy', sourceLabelPl: 'Zasady asystenta Relok8', sourceKind: 'internal' as const,
    sourceUrl: 'https://relok8.online/help', legalDisclaimer: false,
  },
  {
    slug: 'relok8-pricing-and-payments', category: 'platform', jurisdiction: 'PL', version: VERSION,
    titleEn: 'Relok8 launch pricing and payment status', titlePl: 'Cennik startowy Relok8 i status płatności',
    answerEn: 'Searching, listing, applying, messaging, translation and handover coordination are included. The planned launch model is 49 PLN once for the incoming tenant, only after landlord approval, and 49 PLN per active tenancy month for the landlord from move-in until the tenancy ends. Checkout is not enabled yet. Relok8 does not collect rent or deposits and does not hold escrow.',
    answerPl: 'Wyszukiwanie, publikowanie ogłoszeń, składanie wniosków, wiadomości, tłumaczenia i koordynacja przekazania są wliczone. Planowany model startowy to jednorazowe 49 PLN od nowego najemcy dopiero po akceptacji właściciela oraz 49 PLN miesięcznie od właściciela za aktywny najem od wprowadzenia do zakończenia najmu. Płatności nie są jeszcze aktywne. Relok8 nie pobiera czynszu ani kaucji i nie prowadzi escrow.',
    keywords: ['price', 'pricing', 'cost', 'fee', '49 PLN', 'payment', 'checkout', 'escrow', 'deposit held', 'cena', 'cennik', 'opłata', 'płatność', 'kaucja'],
    sourceLabelEn: 'Relok8 — How it works', sourceLabelPl: 'Relok8 — Jak to działa', sourceKind: 'internal' as const,
    sourceUrl: 'https://relok8.online/how-it-works', legalDisclaimer: false,
  },
  {
    slug: 'relok8-listing-availability', category: 'listings', jurisdiction: 'PL', version: VERSION,
    titleEn: 'Listing availability labels', titlePl: 'Oznaczenia dostępności ogłoszeń',
    answerEn: '“Available now” means the author marked the home vacant and the advertised move-in date has arrived. “Available from” means vacant with a future move-in date. “Upcoming takeover” means the current tenant is seeking a replacement for a proposed future date. “Confirm takeover timing” means occupancy or dates need confirmation. Paused, temporarily held, replacement found and lease ended are separate states. Always confirm timing with the tenant and landlord.',
    answerPl: '„Dostępne teraz” oznacza, że autor oznaczył lokal jako wolny i nadeszła podana data wprowadzenia. „Dostępne od” oznacza wolny lokal z przyszłą datą. „Nadchodzące przejęcie najmu” oznacza, że obecny najemca szuka następcy na proponowany termin. „Potwierdź termin przejęcia” oznacza, że stan lub daty wymagają potwierdzenia. Wstrzymane, tymczasowo zarezerwowane, następca wybrany i umowa zakończona to osobne statusy. Termin zawsze potwierdź z najemcą i właścicielem.',
    keywords: ['available now', 'available from', 'upcoming takeover', 'confirm timing', 'vacant', 'occupied', 'move in date', 'availability', 'dostępne teraz', 'dostępne od', 'nadchodzące przejęcie', 'wolne', 'zamieszkane', 'termin'],
    sourceLabelEn: 'Relok8 listing status rules', sourceLabelPl: 'Zasady statusów ogłoszeń Relok8', sourceKind: 'internal' as const,
    sourceUrl: 'https://relok8.online/', legalDisclaimer: false,
  },
  {
    slug: 'relok8-landlord-confirmation', category: 'workflow', jurisdiction: 'PL', version: VERSION,
    titleEn: 'Landlord confirmation in Relok8', titlePl: 'Potwierdzenie właściciela w Relok8',
    answerEn: 'Publishing a listing or receiving an application is not landlord approval. Relok8 records participant updates and a landlord decision inside the workflow, but it does not independently verify identity, ownership, signatures, documents, or legal effectiveness. Important terms should be confirmed in writing by the participants.',
    answerPl: 'Publikacja ogłoszenia ani otrzymanie wniosku nie oznacza zgody właściciela. Relok8 zapisuje aktualizacje uczestników i decyzję właściciela w procesie, ale nie weryfikuje niezależnie tożsamości, własności, podpisów, dokumentów ani skuteczności prawnej. Ważne warunki strony powinny potwierdzić na piśmie.',
    keywords: ['landlord approval', 'landlord confirmation', 'owner consent', 'approved', 'permission', 'zgoda właściciela', 'akceptacja właściciela', 'akceptację właściciela', 'potwierdzenie'],
    sourceLabelEn: 'Relok8 — How it works', sourceLabelPl: 'Relok8 — Jak to działa', sourceKind: 'internal' as const,
    sourceUrl: 'https://relok8.online/how-it-works', legalDisclaimer: false,
  },
  {
    slug: 'relok8-public-listing-data', category: 'privacy', jurisdiction: 'PL', version: VERSION,
    titleEn: 'Names, addresses and contact details on listings', titlePl: 'Nazwy, adresy i dane kontaktowe w ogłoszeniach',
    answerEn: 'Relok8 listings show the property address and the current tenant name supplied for the listing so users can understand the offer. Public listing responses exclude private landlord email, phone, internal ownership IDs and private workflow state. A visible name or address is author-supplied information, not independent identity, ownership or property verification. Use private messaging for contact details and do not post identity documents or access credentials.',
    answerPl: 'Ogłoszenia Relok8 pokazują adres lokalu i imię obecnego najemcy podane w ogłoszeniu, aby użytkownicy rozumieli ofertę. Publiczne dane ogłoszenia nie obejmują prywatnego e-maila i telefonu właściciela, wewnętrznych identyfikatorów właściciela ani prywatnego stanu procesu. Widoczne imię lub adres to informacja podana przez autora, a nie niezależna weryfikacja tożsamości, własności lub lokalu. Dane kontaktowe przekazuj w prywatnych wiadomościach i nie publikuj dokumentów tożsamości ani danych dostępowych.',
    keywords: ['name', 'address', 'contact details', 'phone', 'email', 'privacy', 'public listing', 'imię', 'nazwisko', 'adres', 'dane kontaktowe', 'telefon', 'prywatność', 'publiczne ogłoszenie'],
    sourceLabelEn: 'Relok8 privacy and public-catalog rules', sourceLabelPl: 'Zasady prywatności i publicznego katalogu Relok8', sourceKind: 'internal' as const,
    sourceUrl: 'https://relok8.online/legal/privacy', legalDisclaimer: false,
  },
  {
    slug: 'poland-lease-takeover-consent', category: 'legal', jurisdiction: 'PL', version: VERSION,
    titleEn: 'Consent for a lease takeover in Poland', titlePl: 'Zgoda na przejęcie najmu w Polsce',
    answerEn: 'A listing alone does not transfer a lease. Polish Civil Code Article 688² restricts subletting or giving a residential unit to another person without the landlord’s consent, subject to a statutory exception. Article 519 states that assuming another person’s debt requires an agreement involving the creditor or the creditor’s consent. The correct structure depends on the existing contract and facts; obtain written participant agreement and qualified advice when needed.',
    answerPl: 'Samo ogłoszenie nie przenosi umowy najmu. Art. 688² Kodeksu cywilnego ogranicza podnajem lub oddanie lokalu mieszkalnego innej osobie bez zgody wynajmującego, z ustawowym wyjątkiem. Art. 519 wskazuje, że przejęcie długu wymaga umowy z udziałem wierzyciela albo jego zgody. Właściwa konstrukcja zależy od umowy i okoliczności; w razie potrzeby uzyskaj pisemne ustalenia stron i fachową poradę.',
    keywords: ['lease takeover', 'assignment', 'cesja', 'sublet', 'sublease', 'landlord consent', 'article 519', 'article 688', 'przejęcie najmu', 'podnajem', 'zgoda wynajmującego'],
    sourceLabelEn: 'Polish Civil Code — consolidated text (27 May 2026)', sourceLabelPl: 'Kodeks cywilny — tekst jednolity z 27 maja 2026 r.', sourceKind: 'official' as const,
    sourceUrl: 'https://eli.gov.pl/eli/DU/2026/795/ogl/pol', legalDisclaimer: true,
  },
  {
    slug: 'poland-rental-deposit-return', category: 'legal', jurisdiction: 'PL', version: VERSION,
    titleEn: 'Rental deposit return', titlePl: 'Zwrot kaucji najmu',
    answerEn: 'For residential tenancies governed by the Polish tenant-protection act, the deposit is generally returnable within one month after the tenant vacates, after deductions the landlord is legally entitled to make. The agreement, tenancy type, damage evidence and settlement can affect the result. Record meter readings, condition, keys and agreed deductions in a signed handover protocol and seek advice for a dispute.',
    answerPl: 'W przypadku najmu mieszkalnego objętego ustawą o ochronie praw lokatorów kaucja co do zasady podlega zwrotowi w ciągu miesiąca od opróżnienia lokalu, po potrąceniu należności przysługujących wynajmującemu. Znaczenie mogą mieć umowa, rodzaj najmu, dowody uszkodzeń i rozliczenie. W podpisanym protokole zdawczo-odbiorczym zapisz liczniki, stan lokalu, klucze i uzgodnione potrącenia, a przy sporze skorzystaj z porady.',
    keywords: ['deposit', 'deposit return', 'one month', 'deduction', 'damage', 'handover protocol', 'kaucja', 'zwrot kaucji', 'zwrócić kaucję', 'potrącenie', 'potrącić uszkodzenia', 'uszkodzenie', 'protokół'],
    sourceLabelEn: 'Act on the Protection of Tenants’ Rights — official consolidated text', sourceLabelPl: 'Ustawa o ochronie praw lokatorów — urzędowy tekst jednolity', sourceKind: 'official' as const,
    sourceUrl: 'https://isap.sejm.gov.pl/isap.nsf/download.xsp/WDU20230000725/O/D20230725.pdf', legalDisclaimer: true,
  },
  {
    slug: 'poland-meldunek-foreigners', category: 'administration', jurisdiction: 'PL', version: VERSION,
    titleEn: 'Residence registration (meldunek) for foreigners', titlePl: 'Meldunek cudzoziemca',
    answerEn: 'A foreigner living in Poland can register a permanent or temporary residence. The office, deadline and required documents depend on nationality, residence status and the legal right to occupy the address. A listing’s “meldunek allowed” field is only information supplied by the listing author; check the current Gov.pl procedure and confirm documents with the local municipal office.',
    answerPl: 'Cudzoziemiec mieszkający w Polsce może zameldować się na pobyt stały lub czasowy. Urząd, termin i wymagane dokumenty zależą od obywatelstwa, statusu pobytowego i tytułu prawnego do lokalu. Pole „meldunek dozwolony” w ogłoszeniu jest tylko informacją autora; sprawdź aktualną procedurę na Gov.pl i potwierdź dokumenty w urzędzie gminy lub miasta.',
    keywords: ['meldunek', 'register address', 'residence registration', 'temporary residence registration', 'permanent residence registration', 'zameldowanie', 'adres zamieszkania', 'foreigner', 'cudzoziemiec'],
    sourceLabelEn: 'Gov.pl — Register permanent or temporary residence as a foreigner', sourceLabelPl: 'Gov.pl — Zameldowanie cudzoziemca na pobyt stały lub czasowy', sourceKind: 'official' as const,
    sourceUrl: 'https://www.gov.pl/web/gov/zamelduj-sie-na-pobyt-staly-dla-cudzoziemcow', legalDisclaimer: true,
  },
  {
    slug: 'poland-pesel-foreigners', category: 'administration', jurisdiction: 'PL', version: VERSION,
    titleEn: 'PESEL number for foreigners', titlePl: 'Numer PESEL dla cudzoziemców',
    answerEn: 'Gov.pl states that a foreigner who registers residence in Poland for a stay longer than 30 days receives a PESEL number automatically. If residence registration is not possible but another authority requires PESEL, a separate application route may apply. Use the current Gov.pl instructions and the municipal office for the applicant’s circumstances.',
    answerPl: 'Gov.pl podaje, że cudzoziemiec meldujący się w Polsce na pobyt dłuższy niż 30 dni otrzymuje numer PESEL automatycznie. Jeśli meldunek nie jest możliwy, ale inny urząd wymaga PESEL, może mieć zastosowanie osobny wniosek. Skorzystaj z aktualnej instrukcji Gov.pl i informacji urzędu właściwego dla danej sytuacji.',
    keywords: ['PESEL', 'PESEL foreigner', 'identification number', 'numer PESEL', 'cudzoziemiec PESEL', 'zameldowanie PESEL'],
    sourceLabelEn: 'Gov.pl — Get a PESEL ID for foreigners', sourceLabelPl: 'Gov.pl — Uzyskaj numer PESEL dla cudzoziemców', sourceKind: 'official' as const,
    sourceUrl: 'https://www.gov.pl/web/gov/uzyskaj-numer-pesel-dla-cudzoziemcow', legalDisclaimer: true,
  },
  {
    slug: 'poland-rental-scam-safety', category: 'safety', jurisdiction: 'PL', version: VERSION,
    titleEn: 'Rental scam warning signs', titlePl: 'Sygnały ostrzegawcze oszustwa przy najmie',
    answerEn: 'Polish Police advise renters to verify the listing and the person offering the property, view the property before paying, avoid transferring money “blind”, and keep a traceable bank-transfer record that identifies the address and purpose. Be cautious about urgent payment demands, prices far below the market, copied photos, refusal to show the home, or links asking for credentials. Relok8 cannot guarantee a listing or recover funds.',
    answerPl: 'Policja radzi sprawdzić ogłoszenie i osobę oferującą lokal, obejrzeć nieruchomość przed płatnością, nie przelewać pieniędzy „w ciemno” oraz zachować identyfikowalny przelew z adresem i celem płatności. Uważaj na presję szybkiej zapłaty, cenę znacznie poniżej rynku, skopiowane zdjęcia, odmowę pokazania lokalu lub linki żądające danych logowania. Relok8 nie gwarantuje ogłoszenia ani odzyskania środków.',
    keywords: ['scam', 'fraud', 'safe payment', 'verify listing', 'too cheap', 'urgent transfer', 'pay before viewing', 'phishing', 'oszustwo', 'bezpieczny najem', 'przelew', 'płacić przed obejrzeniem', 'fałszywe ogłoszenie', 'wyłudzenie'],
    sourceLabelEn: 'Polish Police — rental listing fraud warning', sourceLabelPl: 'Policja — ostrzeżenie przed oszustwami w ogłoszeniach najmu', sourceKind: 'official' as const,
    sourceUrl: 'https://wroclaw.policja.gov.pl/dwr/aktualnosci/bieza/155392%2CWroclawscy-policjanci-ostrzegaja-przed-falszywymi-ogloszeniami-dotyczacymi-wynaj.html', legalDisclaimer: false,
  },
  {
    slug: 'poland-energy-certificate-rental', category: 'documents', jurisdiction: 'PL', version: VERSION,
    titleEn: 'Energy performance certificate for a rental', titlePl: 'Świadectwo charakterystyki energetycznej przy najmie',
    answerEn: 'Ministry guidance says an energy performance certificate is generally prepared for the building or the part being rented, and a copy or printout is provided to the tenant when the rental agreement is concluded. Exact duties and exceptions depend on the property and transaction. Use the current Ministry guidance or ask a qualified professional.',
    answerPl: 'Ministerstwo wskazuje, że świadectwo charakterystyki energetycznej sporządza się zasadniczo dla budynku lub wynajmowanej części, a kopię lub wydruk przekazuje najemcy przy zawarciu umowy. Dokładne obowiązki i wyjątki zależą od lokalu i transakcji. Sprawdź aktualne wytyczne ministerstwa lub zapytaj specjalistę.',
    keywords: ['energy certificate', 'energy performance', 'certificate rental', 'świadectwo energetyczne', 'charakterystyka energetyczna', 'najem świadectwo'],
    sourceLabelEn: 'Ministry of Development and Technology — energy performance certificates', sourceLabelPl: 'Ministerstwo Rozwoju i Technologii — świadectwa charakterystyki energetycznej', sourceKind: 'official' as const,
    sourceUrl: 'https://www.gov.pl/web/rozwoj-technologia/Swiadectwa-charakterystyki-energetycznej', legalDisclaimer: true,
  },
  {
    slug: 'relok8-czynsz-and-bills', category: 'listings', jurisdiction: 'PL', version: VERSION,
    titleEn: 'Understanding czynsz and bills', titlePl: 'Jak rozumieć czynsz i rachunki',
    answerEn: 'In Polish rental listings, “czynsz” can be used ambiguously for rent, the building administration charge, or both. Relok8 separates monthly rent, administration charge and bills when the author supplies them. Check whether utilities are included, fixed, or usage-based and ask for the latest breakdown before agreeing.',
    answerPl: 'W polskich ogłoszeniach „czynsz” bywa używany niejednoznacznie: jako najem, opłata administracyjna albo oba składniki. Relok8 rozdziela miesięczny najem, czynsz administracyjny i rachunki, jeśli autor je poda. Sprawdź, czy media są wliczone, stałe czy rozliczane według zużycia, i poproś o aktualne zestawienie przed uzgodnieniem warunków.',
    keywords: ['czynsz', 'rent', 'administration fee', 'admin fee', 'utilities', 'bills', 'included', 'fixed bills', 'usage', 'rachunki', 'media', 'opłata administracyjna'],
    sourceLabelEn: 'Relok8 listing field definitions', sourceLabelPl: 'Definicje pól ogłoszenia Relok8', sourceKind: 'internal' as const,
    sourceUrl: 'https://relok8.online/help', legalDisclaimer: false,
  },
  {
    slug: 'relok8-handover-checklist', category: 'workflow', jurisdiction: 'PL', version: VERSION,
    titleEn: 'Practical handover checklist', titlePl: 'Praktyczna lista przekazania lokalu',
    answerEn: 'Before handover, participants should confirm the written agreement, landlord decision, move-in date, rent and bill breakdown, deposit settlement, inventory, property condition, meter readings, number of keys and contact details. Relok8 can record coordination updates, but participants remain responsible for checking and signing their documents.',
    answerPl: 'Przed przekazaniem strony powinny potwierdzić pisemne ustalenia, decyzję właściciela, datę wprowadzenia, rozbicie czynszu i rachunków, rozliczenie kaucji, wyposażenie, stan lokalu, liczniki, liczbę kluczy i dane kontaktowe. Relok8 może zapisywać aktualizacje koordynacyjne, ale strony odpowiadają za sprawdzenie i podpisanie dokumentów.',
    keywords: ['handover', 'move in checklist', 'keys', 'meter readings', 'inventory', 'protocol', 'przekazanie', 'przekazaniu kluczy', 'protokół zdawczo odbiorczy', 'klucze', 'liczniki', 'wyposażenie'],
    sourceLabelEn: 'Relok8 handover guidance', sourceLabelPl: 'Wskazówki przekazania Relok8', sourceKind: 'internal' as const,
    sourceUrl: 'https://relok8.online/how-it-works', legalDisclaimer: false,
  },
] as const;

export const ensureDefaults = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let changed = 0;
    for (const article of DEFAULT_ONLO_KNOWLEDGE) {
      const payload = { ...article, keywords: [...article.keywords] };
      const existing = await ctx.db.query('onloKnowledge').withIndex('by_slug', (q) => q.eq('slug', article.slug)).unique();
      if (!existing) {
        await ctx.db.insert('onloKnowledge', { ...payload, active: true, lastVerifiedAt: VERIFIED_AT, createdAt: now, updatedAt: now });
        changed += 1;
      } else if (existing.version < article.version) {
        await ctx.db.patch(existing._id, { ...payload, active: true, lastVerifiedAt: VERIFIED_AT, updatedAt: now });
        changed += 1;
      }
    }
    return { changed, total: DEFAULT_ONLO_KNOWLEDGE.length };
  },
});

export const listActive = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query('onloKnowledge').withIndex('by_active', (q) => q.eq('active', true)).collect(),
});

export const markRagSynced = internalMutation({
  args: {
    slug: v.string(),
    version: v.number(),
    entryId: v.string(),
  },
  handler: async (ctx, args) => {
    const article = await ctx.db.query('onloKnowledge').withIndex('by_slug', (q) => q.eq('slug', args.slug)).unique();
    if (!article || article.version !== args.version) return false;
    await ctx.db.patch(article._id, {
      ragVersion: args.version,
      ragEntryId: args.entryId,
      ragSyncedAt: Date.now(),
    });
    return true;
  },
});
