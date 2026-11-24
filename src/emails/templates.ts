export const EMAIL_TEMPLATE_KINDS = [
  'account_verification',
  'sign_in_code',
  'password_reset',
  'welcome',
  'listing_nudge',
  'landlord_invitation',
  'takeover_request',
  'takeover_approved',
  'takeover_declined',
  'handover_action',
  'handover_complete',
  'unread_message',
  'listing_published',
  'listing_expiry',
  'support_received',
  'weekly_digest',
] as const;

export type EmailTemplateKind = (typeof EMAIL_TEMPLATE_KINDS)[number];
export type EmailLocale = 'en' | 'pl';

export interface EmailListing {
  title: string;
  location: string;
  price: string;
  imageUrl?: string;
  url: string;
  meta?: string;
}

export interface EmailTemplateData {
  recipientName?: string;
  actorName?: string;
  senderName?: string;
  applicantName?: string;
  listingTitle?: string;
  city?: string;
  date?: string;
  expiryDate?: string;
  code?: string;
  count?: number;
  reference?: string;
  subject?: string;
  decisionNote?: string;
  stepLabel?: string;
  ctaUrl?: string;
  preferencesUrl?: string;
  unsubscribeUrl?: string;
  listings?: EmailListing[];
}

export interface RenderedEmail {
  kind: EmailTemplateKind;
  locale: EmailLocale;
  category: 'security' | 'transactional' | 'product' | 'marketing';
  subject: string;
  preheader: string;
  html: string;
  text: string;
}

interface EmailContent {
  category: RenderedEmail['category'];
  eyebrow: string;
  subject: string;
  preheader: string;
  title: string;
  intro: string;
  paragraphs?: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  notice?: string;
  noticeTone?: 'neutral' | 'success' | 'warning' | 'danger';
  code?: string;
  details?: Array<[string, string]>;
  listings?: EmailListing[];
}

const APP_ORIGIN = 'https://relok8.online';

export function escapeEmailHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safeUrl(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' ? parsed.toString() : fallback;
  } catch {
    return fallback;
  }
}

function pick(locale: EmailLocale, en: string, pl: string): string {
  return locale === 'pl' ? pl : en;
}

function name(data: EmailTemplateData, locale: EmailLocale): string {
  return data.recipientName?.trim() || pick(locale, 'there', '');
}

function greeting(data: EmailTemplateData, locale: EmailLocale): string {
  const recipient = name(data, locale);
  return locale === 'pl'
    ? recipient ? `Cześć ${recipient},` : 'Dzień dobry,'
    : `Hello ${recipient},`;
}

function defaults(data: EmailTemplateData) {
  return {
    listingTitle: data.listingTitle || 'Bright room near Politechnika',
    city: data.city || 'Warsaw',
    actorName: data.actorName || 'Alex Morgan',
    senderName: data.senderName || '',
    applicantName: data.applicantName || 'Marta Kowalska',
    date: data.date || '28 November 2026',
    expiryDate: data.expiryDate || '27 November 2026',
    code: data.code || '482 913',
    count: data.count ?? 3,
    reference: data.reference || 'R8-24117',
    subject: data.subject || 'Question about a lease takeover',
    stepLabel: data.stepLabel || 'documents',
    decisionNote: data.decisionNote || '',
  };
}

const sampleListings: EmailListing[] = [
  {
    title: 'Sunny room in Mokotów',
    location: 'Mokotów, Warsaw',
    price: '2,450 PLN / month',
    meta: 'Available 1 December · Furnished',
    imageUrl: `${APP_ORIGIN}/images/listing_warsaw_mokotow_1790621438299.jpg`,
    url: `${APP_ORIGIN}/listing/sample-mokotow`,
  },
  {
    title: 'Calm studio near the Old Town',
    location: 'Stare Miasto, Kraków',
    price: '2,900 PLN / month',
    meta: 'Available now · Studio',
    imageUrl: `${APP_ORIGIN}/images/listing_krakow_loft_1790621454348.jpg`,
    url: `${APP_ORIGIN}/listing/sample-krakow`,
  },
  {
    title: 'Nordic room by the tram line',
    location: 'Śródmieście, Wrocław',
    price: '2,150 PLN / month',
    meta: 'Available 5 December · Private room',
    imageUrl: `${APP_ORIGIN}/images/listing_wroclaw_nordic_1790621466153.jpg`,
    url: `${APP_ORIGIN}/listing/sample-wroclaw`,
  },
];

function contentFor(kind: EmailTemplateKind, locale: EmailLocale, data: EmailTemplateData): EmailContent {
  const d = defaults(data);
  const ctaUrl = safeUrl(data.ctaUrl, APP_ORIGIN);
  const hello = greeting(data, locale);

  switch (kind) {
    case 'account_verification':
      return {
        category: 'security',
        eyebrow: pick(locale, 'Account security', 'Bezpieczeństwo konta'),
        subject: pick(locale, 'Verify your Relok8 email', 'Potwierdź adres e-mail w Relok8'),
        preheader: pick(locale, `Your verification code is ${d.code}.`, `Twój kod weryfikacyjny to ${d.code}.`),
        title: pick(locale, 'Confirm it’s really you', 'Potwierdź, że to Ty'),
        intro: `${hello} ${pick(locale, 'Use this code to finish creating your Relok8 account.', 'Użyj tego kodu, aby dokończyć tworzenie konta Relok8.')}`,
        code: d.code,
        notice: pick(locale, 'This code expires in 10 minutes. Relok8 will never ask you to share it by phone, chat, or WhatsApp.', 'Kod wygasa za 10 minut. Relok8 nigdy nie poprosi o podanie go przez telefon, czat ani WhatsApp.'),
        noticeTone: 'neutral',
      };
    case 'sign_in_code':
      return {
        category: 'security',
        eyebrow: pick(locale, 'Secure sign-in', 'Bezpieczne logowanie'),
        subject: pick(locale, 'Your Relok8 sign-in code', 'Twój kod logowania do Relok8'),
        preheader: pick(locale, `Use ${d.code} to sign in.`, `Użyj kodu ${d.code}, aby się zalogować.`),
        title: pick(locale, 'Your sign-in code', 'Twój kod logowania'),
        intro: `${hello} ${pick(locale, 'Enter this one-time code on the Relok8 sign-in screen.', 'Wpisz ten jednorazowy kod na ekranie logowania Relok8.')}`,
        code: d.code,
        notice: pick(locale, 'If you did not request this code, you can safely ignore this email. Your password and account remain unchanged.', 'Jeśli nie prosisz o ten kod, możesz bezpiecznie zignorować tę wiadomość. Hasło i konto pozostają bez zmian.'),
      };
    case 'password_reset':
      return {
        category: 'security',
        eyebrow: pick(locale, 'Account recovery', 'Odzyskiwanie konta'),
        subject: pick(locale, 'Reset your Relok8 password', 'Zresetuj hasło do Relok8'),
        preheader: pick(locale, 'A password reset was requested for your account.', 'Otrzymaliśmy prośbę o zmianę hasła do Twojego konta.'),
        title: pick(locale, 'Choose a new password', 'Ustaw nowe hasło'),
        intro: `${hello} ${pick(locale, 'We received a request to reset your password.', 'Otrzymaliśmy prośbę o zresetowanie Twojego hasła.')}`,
        ctaLabel: pick(locale, 'Reset password', 'Zresetuj hasło'),
        ctaUrl,
        notice: pick(locale, 'This secure link expires in 30 minutes. If you did not request a reset, ignore this email and consider reviewing your account security.', 'Bezpieczny link wygasa za 30 minut. Jeśli nie prosisz o zmianę hasła, zignoruj tę wiadomość i sprawdź bezpieczeństwo konta.'),
      };
    case 'welcome':
      return {
        category: 'product',
        eyebrow: pick(locale, 'Welcome to Relok8', 'Witaj w Relok8'),
        subject: pick(locale, 'Your next place starts here', 'Twoje następne miejsce zaczyna się tutaj'),
        preheader: pick(locale, 'Find a room or hand over your lease with clear next steps.', 'Znajdź pokój albo przekaż najem według jasnych kroków.'),
        title: pick(locale, 'A clearer way to move', 'Prostszy sposób na przeprowadzkę'),
        intro: `${hello} ${pick(locale, 'Relok8 connects people looking for a room with tenants leaving a lease early—without broker commissions or invented guarantees.', 'Relok8 łączy osoby szukające pokoju z najemcami, którzy wcześniej opuszczają lokal—bez prowizji pośrednika i bez niepotwierdzonych obietnic.')}`,
        paragraphs: [pick(locale, 'Save places you like, speak directly with participants, request landlord approval, and keep the handover steps in one private workspace.', 'Zapisuj interesujące oferty, rozmawiaj bezpośrednio z uczestnikami, poproś o zgodę wynajmującego i prowadź etapy przekazania w jednym prywatnym miejscu.')],
        ctaLabel: pick(locale, 'Explore available rooms', 'Zobacz dostępne pokoje'),
        ctaUrl: safeUrl(data.ctaUrl, `${APP_ORIGIN}/`),
        notice: pick(locale, 'Relok8 is a coordination platform. Confirm identity, contract terms, landlord consent, and deposit arrangements directly with the participants.', 'Relok8 jest platformą koordynacyjną. Potwierdź tożsamość, warunki umowy, zgodę wynajmującego i ustalenia dotyczące kaucji bezpośrednio z uczestnikami.'),
      };
    case 'listing_nudge': {
      const followUp = d.count >= 2;
      return {
        category: 'marketing',
        eyebrow: pick(locale, 'List your place', 'Dodaj swoje ogłoszenie'),
        subject: followUp
          ? pick(locale, 'Your room could help someone move next', 'Twój pokój może pomóc komuś w przeprowadzce')
          : pick(locale, 'Have a room or lease to hand over?', 'Masz pokój lub najem do przekazania?'),
        preheader: pick(locale, 'Publish a private-by-default listing on Relok8 for free.', 'Opublikuj bezpłatne ogłoszenie Relok8 z ochroną prywatności.'),
        title: followUp
          ? pick(locale, 'Make your move easier for both sides', 'Ułatw przeprowadzkę obu stronom')
          : pick(locale, 'Turn your move-out into someone’s move-in', 'Twoja wyprowadzka może być czyjąś przeprowadzką'),
        intro: `${hello} ${pick(locale, 'If you are leaving a room or lease early, a Relok8 listing helps you find an interested person and coordinate the next steps in one place.', 'Jeśli wcześniej opuszczasz pokój lub najem, ogłoszenie Relok8 pomaga znaleźć zainteresowaną osobę i skoordynować kolejne kroki w jednym miejscu.')}`,
        paragraphs: [
          pick(locale, 'Publishing is free. Add up to 8 photos, keep the listing active until the current lease end date, and pause it whenever availability changes.', 'Publikacja jest bezpłatna. Dodaj maksymalnie 8 zdjęć, utrzymuj ogłoszenie do końca obecnego najmu i wstrzymaj je, gdy zmieni się dostępność.'),
          pick(locale, 'Your listing shows the name and full address you provide so interested people know who they are contacting and where the home is located. Phone numbers and email addresses stay private.', 'Ogłoszenie pokazuje podane imię i pełny adres, aby zainteresowane osoby wiedziały, z kim się kontaktują i gdzie znajduje się lokal. Numery telefonów i adresy e-mail pozostają prywatne.'),
        ],
        ctaLabel: pick(locale, 'List your place free', 'Dodaj bezpłatne ogłoszenie'),
        ctaUrl: safeUrl(data.ctaUrl, `${APP_ORIGIN}/list`),
        notice: pick(locale, 'Only list a place you are entitled to advertise. Relok8 does not charge a listing fee, approve the transfer, or handle deposits. Confirm landlord permission and contract terms directly.', 'Dodaj tylko lokal, który możesz zgodnie z prawem ogłaszać. Relok8 nie pobiera opłaty za ogłoszenie, nie zatwierdza cesji ani nie obsługuje kaucji. Potwierdź zgodę wynajmującego i warunki umowy bezpośrednio.'),
      };
    }
    case 'landlord_invitation':
      return {
        category: 'transactional',
        eyebrow: pick(locale, 'Landlord invitation', 'Zaproszenie dla wynajmującego'),
        subject: pick(locale, `Join the handover for ${d.listingTitle}`, `Dołącz do procesu cesji: ${d.listingTitle}`),
        preheader: pick(locale, `${d.actorName} invited you to a private handover workspace.`, `${d.actorName} zaprasza Cię do prywatnego procesu przekazania.`),
        title: pick(locale, 'Review the lease handover', 'Sprawdź proces przekazania najmu'),
        intro: `${hello} ${pick(locale, `${d.actorName} invited you to review the lease-takeover process for ${d.listingTitle} in ${d.city}.`, `${d.actorName} zaprasza Cię do sprawdzenia procesu cesji najmu dla ${d.listingTitle} w ${d.city}.`)}`,
        ctaLabel: pick(locale, 'Review invitation', 'Sprawdź zaproszenie'),
        ctaUrl,
        details: [
          [pick(locale, 'Place', 'Lokal'), d.listingTitle],
          [pick(locale, 'City', 'Miasto'), d.city],
          [pick(locale, 'Invitation expires', 'Zaproszenie wygasa'), d.expiryDate],
        ],
        notice: pick(locale, 'Relok8 gives the current tenant, prospective tenant, and landlord one private place to coordinate. It does not approve the transfer or handle the deposit.', 'Relok8 zapewnia najemcy, kandydatowi i wynajmującemu jedno prywatne miejsce do koordynacji. Relok8 nie zatwierdza cesji ani nie obsługuje kaucji.'),
      };
    case 'takeover_request':
      return {
        category: 'transactional',
        eyebrow: pick(locale, 'New takeover request', 'Nowy wniosek o cesję'),
        subject: pick(locale, `Review a request for ${d.listingTitle}`, `Sprawdź wniosek: ${d.listingTitle}`),
        preheader: pick(locale, `${d.applicantName} wants to discuss taking over this lease.`, `${d.applicantName} chce omówić przejęcie tego najmu.`),
        title: pick(locale, 'Someone is interested', 'Ktoś jest zainteresowany'),
        intro: `${hello} ${pick(locale, `${d.applicantName} sent a takeover request for ${d.listingTitle}.`, `${d.applicantName} przesłał(a) wniosek o przejęcie najmu dla ${d.listingTitle}.`)}`,
        ctaLabel: pick(locale, 'Review request', 'Sprawdź wniosek'),
        ctaUrl,
        details: [
          [pick(locale, 'Applicant', 'Kandydat'), d.applicantName],
          [pick(locale, 'Place', 'Lokal'), d.listingTitle],
          [pick(locale, 'Decision due', 'Termin decyzji'), d.expiryDate],
        ],
        notice: pick(locale, 'No payment has been taken by Relok8. Confirm the applicant, contract terms, landlord consent, and deposit arrangements directly.', 'Relok8 nie pobrał żadnej płatności. Potwierdź kandydata, warunki umowy, zgodę wynajmującego i ustalenia dotyczące kaucji bezpośrednio.'),
        noticeTone: 'warning',
      };
    case 'takeover_approved':
      return {
        category: 'transactional',
        eyebrow: pick(locale, 'Request approved', 'Wniosek zatwierdzony'),
        subject: pick(locale, `Your request was approved · ${d.listingTitle}`, `Twój wniosek został zatwierdzony · ${d.listingTitle}`),
        preheader: pick(locale, 'Continue with documents, deposit arrangements, and keys.', 'Przejdź do dokumentów, ustaleń dotyczących kaucji i kluczy.'),
        title: pick(locale, 'You can move to the next steps', 'Możecie przejść do kolejnych kroków'),
        intro: `${hello} ${pick(locale, `The takeover request for ${d.listingTitle} has been approved by the landlord participant.`, `Wniosek o cesję dla ${d.listingTitle} został zatwierdzony przez uczestniczącego wynajmującego.`)}`,
        paragraphs: d.decisionNote ? [d.decisionNote] : undefined,
        ctaLabel: pick(locale, 'Open handover workspace', 'Otwórz proces przekazania'),
        ctaUrl,
        details: [
          [pick(locale, 'Status', 'Status'), pick(locale, 'Approved', 'Zatwierdzony')],
          [pick(locale, 'Place', 'Lokal'), d.listingTitle],
          [pick(locale, 'Next', 'Dalej'), pick(locale, 'Documents', 'Dokumenty')],
        ],
        notice: pick(locale, 'Approval means the participants can continue coordinating. It does not mean Relok8 approved the contract, verified signatures, or received money.', 'Zatwierdzenie oznacza, że uczestnicy mogą kontynuować koordynację. Nie oznacza zatwierdzenia umowy, weryfikacji podpisów ani otrzymania środków przez Relok8.'),
        noticeTone: 'success',
      };
    case 'takeover_declined':
      return {
        category: 'transactional',
        eyebrow: pick(locale, 'Request update', 'Aktualizacja wniosku'),
        subject: pick(locale, `Request update · ${d.listingTitle}`, `Aktualizacja wniosku · ${d.listingTitle}`),
        preheader: pick(locale, 'The takeover request will not continue.', 'Wniosek o cesję nie będzie kontynuowany.'),
        title: pick(locale, 'This request was not approved', 'Ten wniosek nie został zatwierdzony'),
        intro: `${hello} ${pick(locale, `The takeover request for ${d.listingTitle} has been declined or cancelled.`, `Wniosek o cesję dla ${d.listingTitle} został odrzucony lub anulowany.`)}`,
        paragraphs: [d.decisionNote || pick(locale, 'The listing may remain visible if it is still accepting other requests.', 'Ogłoszenie może pozostać widoczne, jeśli nadal przyjmuje inne zgłoszenia.')],
        ctaLabel: pick(locale, 'View request status', 'Zobacz status wniosku'),
        ctaUrl,
        notice: pick(locale, 'A declined request does not affect your Relok8 account. You can continue exploring other available rooms.', 'Odrzucony wniosek nie wpływa na Twoje konto Relok8. Możesz dalej przeglądać inne dostępne pokoje.'),
        noticeTone: 'neutral',
      };
    case 'handover_action':
      return {
        category: 'transactional',
        eyebrow: pick(locale, 'Handover update', 'Aktualizacja przekazania'),
        subject: pick(locale, `Action needed for ${d.listingTitle}`, `Wymagane działanie: ${d.listingTitle}`),
        preheader: pick(locale, `${d.actorName} updated the ${d.stepLabel} step.`, `${d.actorName} zaktualizował(a) etap: ${d.stepLabel}.`),
        title: pick(locale, 'Review the latest handover step', 'Sprawdź najnowszy etap przekazania'),
        intro: `${hello} ${pick(locale, `${d.actorName} updated the ${d.stepLabel} step for ${d.listingTitle}.`, `${d.actorName} zaktualizował(a) etap „${d.stepLabel}” dla ${d.listingTitle}.`)}`,
        ctaLabel: pick(locale, 'Review handover', 'Sprawdź przekazanie'),
        ctaUrl,
        details: [
          [pick(locale, 'Current step', 'Bieżący etap'), d.stepLabel],
          [pick(locale, 'Updated by', 'Zaktualizował(a)'), d.actorName],
          [pick(locale, 'Place', 'Lokal'), d.listingTitle],
        ],
        notice: pick(locale, 'Only confirm a step after checking it directly with the other participants. Relok8 does not hold funds, validate signatures, or certify legal completion.', 'Potwierdź etap dopiero po bezpośrednim sprawdzeniu go z pozostałymi uczestnikami. Relok8 nie przechowuje środków, nie weryfikuje podpisów ani nie poświadcza prawnego zakończenia procesu.'),
        noticeTone: 'warning',
      };
    case 'handover_complete':
      return {
        category: 'transactional',
        eyebrow: pick(locale, 'Handover recorded', 'Przekazanie zarejestrowane'),
        subject: pick(locale, `Handover recorded · ${d.listingTitle}`, `Zarejestrowano przekazanie · ${d.listingTitle}`),
        preheader: pick(locale, 'All participants recorded the handover steps as complete.', 'Wszyscy uczestnicy oznaczyli etapy przekazania jako zakończone.'),
        title: pick(locale, 'The handover record is complete', 'Zapis przekazania jest kompletny'),
        intro: `${hello} ${pick(locale, `All participants have recorded the handover steps as complete for ${d.listingTitle}.`, `Wszyscy uczestnicy oznaczyli etapy przekazania jako zakończone dla ${d.listingTitle}.`)}`,
        ctaLabel: pick(locale, 'View handover record', 'Zobacz zapis przekazania'),
        ctaUrl,
        details: [
          [pick(locale, 'Documents', 'Dokumenty'), pick(locale, 'Confirmed', 'Potwierdzone')],
          [pick(locale, 'Deposit arrangement', 'Ustalenia kaucji'), pick(locale, 'Confirmed', 'Potwierdzone')],
          [pick(locale, 'Keys', 'Klucze'), pick(locale, 'Confirmed', 'Potwierdzone')],
        ],
        notice: pick(locale, 'Keep signed documents and payment evidence securely. Relok8 records participant confirmations; it does not independently certify the transfer, signatures, deposit, or key exchange.', 'Przechowuj podpisane dokumenty i dowody płatności w bezpiecznym miejscu. Relok8 rejestruje potwierdzenia uczestników; nie poświadcza niezależnie cesji, podpisów, kaucji ani przekazania kluczy.'),
        noticeTone: 'success',
      };
    case 'unread_message':
      return {
        category: 'product',
        eyebrow: pick(locale, 'New message', 'Nowa wiadomość'),
        subject: pick(locale, `${d.senderName || 'Someone'} messaged you · ${d.listingTitle}`, `${d.senderName || 'Ktoś'} napisał(a) do Ciebie · ${d.listingTitle}`),
        preheader: pick(locale, `You have ${d.count} unread messages in Relok8.`, `Masz ${d.count} nieprzeczytane wiadomości w Relok8.`),
        title: pick(locale, 'A conversation is waiting', 'Czeka na Ciebie rozmowa'),
        intro: `${hello} ${pick(locale, `${d.senderName || 'Someone'} sent you ${d.count === 1 ? 'a message' : `${d.count} messages`} in the conversation about ${d.listingTitle}.`, `${d.senderName || 'Ktoś'} wysłał(a) Ci ${d.count === 1 ? 'wiadomość' : `${d.count} wiadomości`} w rozmowie dotyczącej ${d.listingTitle}.`)}`,
        ctaLabel: pick(locale, 'Open Messages', 'Otwórz Wiadomości'),
        ctaUrl,
        notice: pick(locale, 'For privacy, message content is available only after you sign in to Relok8.', 'Ze względu na prywatność treść wiadomości jest dostępna dopiero po zalogowaniu do Relok8.'),
      };
    case 'listing_published':
      return {
        category: 'product',
        eyebrow: pick(locale, 'Listing published', 'Ogłoszenie opublikowane'),
        subject: pick(locale, `Your listing is live · ${d.listingTitle}`, `Twoje ogłoszenie jest aktywne · ${d.listingTitle}`),
        preheader: pick(locale, 'Your room is now visible to people browsing Relok8.', 'Twój pokój jest już widoczny dla osób przeglądających Relok8.'),
        title: pick(locale, 'Your listing is live', 'Twoje ogłoszenie jest aktywne'),
        intro: `${hello} ${pick(locale, `${d.listingTitle} in ${d.city} is now visible on Relok8.`, `${d.listingTitle} w ${d.city} jest już widoczne w Relok8.`)}`,
        ctaLabel: pick(locale, 'View listing', 'Zobacz ogłoszenie'),
        ctaUrl,
        details: [
          [pick(locale, 'Status', 'Status'), pick(locale, 'Accepting enquiries', 'Przyjmuje zapytania')],
          [pick(locale, 'City', 'Miasto'), d.city],
          [pick(locale, 'Lease end', 'Koniec najmu'), d.expiryDate],
        ],
        notice: pick(locale, 'Keep availability and lease dates current. Pause the listing as soon as the room is no longer available.', 'Dbaj o aktualność dostępności i dat najmu. Wstrzymaj ogłoszenie, gdy pokój przestanie być dostępny.'),
      };
    case 'listing_expiry':
      return {
        category: 'product',
        eyebrow: pick(locale, 'Listing reminder', 'Przypomnienie o ogłoszeniu'),
        subject: pick(locale, `Update your listing before ${d.expiryDate}`, `Zaktualizuj ogłoszenie przed ${d.expiryDate}`),
        preheader: pick(locale, `${d.listingTitle} reaches its current lease end date soon.`, `Dla ${d.listingTitle} zbliża się data zakończenia najmu.`),
        title: pick(locale, 'Is this place still available?', 'Czy ta oferta jest nadal aktualna?'),
        intro: `${hello} ${pick(locale, `${d.listingTitle} reaches its current lease end date on ${d.expiryDate}.`, `Dla ${d.listingTitle} obecna data zakończenia najmu to ${d.expiryDate}.`)}`,
        paragraphs: [pick(locale, 'Update the dates if the listing is still available, or pause it so people do not apply to an outdated offer.', 'Zaktualizuj daty, jeśli oferta jest nadal aktualna, albo wstrzymaj ją, aby nikt nie zgłaszał się do nieaktualnego ogłoszenia.')],
        ctaLabel: pick(locale, 'Review listing', 'Sprawdź ogłoszenie'),
        ctaUrl,
        notice: pick(locale, 'Relok8 automatically removes expired lease takeovers from public discovery.', 'Relok8 automatycznie usuwa wygasłe oferty cesji z publicznego wyszukiwania.'),
        noticeTone: 'warning',
      };
    case 'support_received':
      return {
        category: 'transactional',
        eyebrow: pick(locale, 'Support request received', 'Zgłoszenie przyjęte'),
        subject: pick(locale, `We received your request · ${d.reference}`, `Otrzymaliśmy Twoje zgłoszenie · ${d.reference}`),
        preheader: pick(locale, `Your Relok8 support reference is ${d.reference}.`, `Numer Twojego zgłoszenia Relok8 to ${d.reference}.`),
        title: pick(locale, 'We have your message', 'Mamy Twoją wiadomość'),
        intro: `${hello} ${pick(locale, `We received your request about “${d.subject}”.`, `Otrzymaliśmy zgłoszenie „${d.subject}”.`)}`,
        details: [
          [pick(locale, 'Reference', 'Numer zgłoszenia'), d.reference],
          [pick(locale, 'Topic', 'Temat'), d.subject],
          [pick(locale, 'Received', 'Otrzymano'), d.date],
        ],
        notice: pick(locale, 'Our team will reply to this email address. Do not send identity documents, full contracts, access codes, or payment-card details by email.', 'Nasz zespół odpowie na ten adres e-mail. Nie wysyłaj e-mailem dokumentów tożsamości, pełnych umów, kodów dostępu ani danych karty płatniczej.'),
      };
    case 'weekly_digest':
      return {
        category: 'marketing',
        eyebrow: pick(locale, 'Your weekly matches', 'Twoje cotygodniowe oferty'),
        subject: pick(locale, `${d.count} new Relok8 matches this week`, `${d.count} nowe oferty Relok8 w tym tygodniu`),
        preheader: pick(locale, 'Fresh rooms matching your city and budget.', 'Nowe pokoje dopasowane do Twojego miasta i budżetu.'),
        title: pick(locale, 'A few places worth a look', 'Kilka ofert wartych uwagi'),
        intro: `${hello} ${pick(locale, 'Here are new rooms matching your saved preferences.', 'Oto nowe pokoje pasujące do zapisanych preferencji.')}`,
        ctaLabel: pick(locale, 'See all matches', 'Zobacz wszystkie oferty'),
        ctaUrl,
        listings: data.listings?.length ? data.listings.slice(0, 5) : sampleListings,
        notice: pick(locale, 'Availability, identity, contract terms, landlord consent, and deposit arrangements must be confirmed directly with the participants.', 'Dostępność, tożsamość, warunki umowy, zgodę wynajmującego i ustalenia dotyczące kaucji należy potwierdzić bezpośrednio z uczestnikami.'),
      };
  }
}

function detailTable(rows: Array<[string, string]>): string {
  const rendered = rows.map(([label, value], index) => `
    <tr>
      <td style="padding:${index ? '13px 0 0' : '0'};font-family:Arial,'Helvetica Neue',sans-serif;font-size:12px;line-height:18px;color:#8A94A6;width:38%;vertical-align:top;">${escapeEmailHtml(label)}</td>
      <td style="padding:${index ? '13px 0 0' : '0'};font-family:Arial,'Helvetica Neue',sans-serif;font-size:14px;line-height:20px;font-weight:600;color:#0F172A;text-align:right;vertical-align:top;">${escapeEmailHtml(value)}</td>
    </tr>`).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:#F8F9FC;border:1px solid #E6E8EC;border-radius:14px;"><tr><td style="padding:18px 20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rendered}</table></td></tr></table>`;
}

function codeBlock(code: string, locale: EmailLocale): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0;"><tr><td align="center" style="padding:22px 16px;background:#F1F0FF;border:1px solid #D9D6FE;border-radius:14px;"><div style="font-family:'Courier New',monospace;font-size:32px;line-height:40px;font-weight:700;letter-spacing:7px;color:#3428B8;">${escapeEmailHtml(code)}</div><div style="margin-top:7px;font-family:Arial,'Helvetica Neue',sans-serif;font-size:11px;line-height:16px;color:#6F6A99;text-transform:uppercase;letter-spacing:1.2px;">${pick(locale, 'One-time code', 'Kod jednorazowy')}</div></td></tr></table>`;
}

function button(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 10px;"><tr><td bgcolor="#4F46E5" style="border-radius:11px;"><a href="${escapeEmailHtml(url)}" style="display:inline-block;padding:14px 22px;font-family:Arial,'Helvetica Neue',sans-serif;font-size:14px;line-height:20px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:11px;">${escapeEmailHtml(label)}&nbsp;&nbsp;→</a></td></tr></table>`;
}

function noticeBox(message: string, tone: EmailContent['noticeTone'] = 'neutral'): string {
  const palette = {
    neutral: ['#F8F9FC', '#E6E8EC', '#5B6678', '#4F46E5'],
    success: ['#ECFDF5', '#A7F3D0', '#047857', '#059669'],
    warning: ['#FFFBEB', '#FDE68A', '#92400E', '#D97706'],
    danger: ['#FEF3F2', '#FECDCA', '#B42318', '#D92D20'],
  }[tone];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0 0;background:${palette[0]};border:1px solid ${palette[1]};border-radius:12px;"><tr><td style="width:4px;background:${palette[3]};border-radius:12px 0 0 12px;font-size:0;line-height:0;">&nbsp;</td><td style="padding:15px 17px;font-family:Arial,'Helvetica Neue',sans-serif;font-size:12px;line-height:19px;color:${palette[2]};">${escapeEmailHtml(message)}</td></tr></table>`;
}

function listingCards(listings: EmailListing[], locale: EmailLocale): string {
  return listings.map((listing) => {
    const url = safeUrl(listing.url, APP_ORIGIN);
    const image = listing.imageUrl ? `<td width="118" style="padding:0;vertical-align:top;"><img src="${escapeEmailHtml(safeUrl(listing.imageUrl, `${APP_ORIGIN}/relok8-og-image.png`))}" width="118" height="112" alt="" style="display:block;width:118px;height:112px;object-fit:cover;border:0;border-radius:12px 0 0 12px;" /></td>` : '';
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;background:#FFFFFF;border:1px solid #E6E8EC;border-radius:13px;"><tr>${image}<td style="padding:16px 17px;vertical-align:middle;"><div style="font-family:Arial,'Helvetica Neue',sans-serif;font-size:15px;line-height:21px;font-weight:700;color:#0F172A;">${escapeEmailHtml(listing.title)}</div><div style="margin-top:3px;font-family:Arial,'Helvetica Neue',sans-serif;font-size:12px;line-height:18px;color:#5B6678;">${escapeEmailHtml(listing.location)}</div><div style="margin-top:8px;font-family:Arial,'Helvetica Neue',sans-serif;font-size:13px;line-height:18px;font-weight:700;color:#4F46E5;">${escapeEmailHtml(listing.price)}</div>${listing.meta ? `<div style="margin-top:3px;font-family:Arial,'Helvetica Neue',sans-serif;font-size:11px;line-height:16px;color:#8A94A6;">${escapeEmailHtml(listing.meta)}</div>` : ''}<div style="margin-top:9px;"><a href="${escapeEmailHtml(url)}" style="font-family:Arial,'Helvetica Neue',sans-serif;font-size:12px;line-height:18px;font-weight:700;color:#4F46E5;text-decoration:none;">${pick(locale, 'View place', 'Zobacz ofertę')} →</a></div></td></tr></table>`;
  }).join('');
}

function renderHtml(content: EmailContent, locale: EmailLocale, data: EmailTemplateData): string {
  const appUrl = safeUrl(content.ctaUrl, APP_ORIGIN);
  const preferencesUrl = safeUrl(data.preferencesUrl, `${APP_ORIGIN}/${locale === 'pl' ? 'pl/' : ''}notifications`);
  const unsubscribeUrl = safeUrl(data.unsubscribeUrl, preferencesUrl);
  const paragraphs = (content.paragraphs || []).map((paragraph) => `<p style="margin:16px 0 0;font-family:Arial,'Helvetica Neue',sans-serif;font-size:15px;line-height:24px;color:#5B6678;">${escapeEmailHtml(paragraph)}</p>`).join('');
  const isMarketing = content.category === 'marketing';
  const why = isMarketing
    ? pick(locale, 'You received this because you opted in to weekly Relok8 matches.', 'Otrzymujesz tę wiadomość, ponieważ wyraziłeś(-aś) zgodę na cotygodniowe oferty Relok8.')
    : pick(locale, 'You received this because it relates to your Relok8 account or activity.', 'Otrzymujesz tę wiadomość, ponieważ dotyczy ona Twojego konta lub aktywności w Relok8.');

  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeEmailHtml(content.subject)}</title>
  <style>
    html,body{margin:0!important;padding:0!important;width:100%!important;background:#F4F5F7!important}
    table{border-collapse:separate} img{border:0;line-height:100%;outline:none;text-decoration:none}
    a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important}
    @media only screen and (max-width:620px){.r8-shell{width:100%!important}.r8-pad{padding-left:22px!important;padding-right:22px!important}.r8-title{font-size:29px!important;line-height:35px!important}.r8-header{padding:25px 22px!important}.r8-footer{padding:24px 22px 34px!important}}
  </style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeEmailHtml(content.preheader)}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#F4F5F7">
    <tr><td align="center" style="padding:34px 14px 48px;">
      <table role="presentation" class="r8-shell" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;">
        <tr><td class="r8-header" style="padding:0 30px 22px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td><a href="${APP_ORIGIN}" style="text-decoration:none;"><img src="${APP_ORIGIN}/email/relok8-email-logo.png" width="124" height="31" alt="Relok8" style="display:block;width:124px;height:31px;" /></a></td>
            <td align="right" style="font-family:Arial,'Helvetica Neue',sans-serif;font-size:11px;line-height:16px;font-weight:700;color:#8A94A6;text-transform:uppercase;letter-spacing:1px;">${escapeEmailHtml(content.eyebrow)}</td>
          </tr></table>
        </td></tr>
        <tr><td style="background:#FFFFFF;border:1px solid #E6E8EC;border-radius:18px;overflow:hidden;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="height:5px;background:#4F46E5;font-size:0;line-height:0;">&nbsp;</td></tr>
            <tr><td class="r8-pad" style="padding:44px 48px 42px;">
              <div class="r8-title" style="font-family:Arial,'Helvetica Neue',sans-serif;font-size:34px;line-height:41px;font-weight:700;letter-spacing:-0.8px;color:#0F172A;">${escapeEmailHtml(content.title)}</div>
              <p style="margin:18px 0 0;font-family:Arial,'Helvetica Neue',sans-serif;font-size:15px;line-height:24px;color:#5B6678;">${escapeEmailHtml(content.intro)}</p>
              ${paragraphs}
              ${content.code ? codeBlock(content.code, locale) : ''}
              ${content.details ? detailTable(content.details) : ''}
              ${content.listings ? `<div style="margin-top:25px;">${listingCards(content.listings, locale)}</div>` : ''}
              ${content.ctaLabel ? button(content.ctaLabel, appUrl) : ''}
              ${content.ctaLabel ? `<div style="margin-top:9px;font-family:Arial,'Helvetica Neue',sans-serif;font-size:10px;line-height:16px;color:#8A94A6;word-break:break-all;">${escapeEmailHtml(appUrl)}</div>` : ''}
              ${content.notice ? noticeBox(content.notice, content.noticeTone) : ''}
            </td></tr>
          </table>
        </td></tr>
        <tr><td class="r8-footer" style="padding:25px 30px 38px;text-align:center;">
          <div style="font-family:Arial,'Helvetica Neue',sans-serif;font-size:11px;line-height:18px;color:#8A94A6;">${escapeEmailHtml(why)}</div>
          <div style="margin-top:8px;font-family:Arial,'Helvetica Neue',sans-serif;font-size:11px;line-height:18px;color:#8A94A6;"><a href="${escapeEmailHtml(preferencesUrl)}" style="color:#5B6678;text-decoration:underline;">${pick(locale, 'Email preferences', 'Ustawienia e-mail')}</a>${isMarketing ? `&nbsp;&nbsp;·&nbsp;&nbsp;<a href="${escapeEmailHtml(unsubscribeUrl)}" style="color:#5B6678;text-decoration:underline;">${pick(locale, 'Unsubscribe', 'Wypisz się')}</a>` : ''}&nbsp;&nbsp;·&nbsp;&nbsp;<a href="mailto:support@relok8.online" style="color:#5B6678;text-decoration:underline;">support@relok8.online</a></div>
          <div style="margin-top:10px;font-family:Arial,'Helvetica Neue',sans-serif;font-size:10px;line-height:16px;color:#A0A8B6;">Relok8 · Peer-to-peer lease takeovers in Poland<br />© ${new Date().getUTCFullYear()} Relok8</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function renderText(content: EmailContent, locale: EmailLocale, data: EmailTemplateData): string {
  const lines = [content.title, '', content.intro];
  if (content.paragraphs?.length) lines.push('', ...content.paragraphs);
  if (content.code) lines.push('', `${pick(locale, 'One-time code', 'Kod jednorazowy')}: ${content.code}`);
  if (content.details?.length) lines.push('', ...content.details.map(([label, value]) => `${label}: ${value}`));
  if (content.listings?.length) {
    lines.push('', ...content.listings.map((listing) => `${listing.title} — ${listing.price}, ${listing.location}\n${safeUrl(listing.url, APP_ORIGIN)}`));
  }
  if (content.ctaLabel) lines.push('', `${content.ctaLabel}: ${safeUrl(content.ctaUrl, APP_ORIGIN)}`);
  if (content.notice) lines.push('', content.notice);
  lines.push('', '—', 'Relok8', 'support@relok8.online', safeUrl(data.preferencesUrl, `${APP_ORIGIN}/notifications`));
  if (content.category === 'marketing') lines.push(`${pick(locale, 'Unsubscribe', 'Wypisz się')}: ${safeUrl(data.unsubscribeUrl, `${APP_ORIGIN}/notifications`)}`);
  return lines.join('\n');
}

export function renderRelok8Email(kind: EmailTemplateKind, locale: EmailLocale = 'en', data: EmailTemplateData = {}): RenderedEmail {
  const content = contentFor(kind, locale, data);
  return {
    kind,
    locale,
    category: content.category,
    subject: content.subject,
    preheader: content.preheader,
    html: renderHtml(content, locale, data),
    text: renderText(content, locale, data),
  };
}

