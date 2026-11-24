import { backend } from '../lib/backend';
import { api } from '../../convex/_generated/api';
import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Search, HelpCircle, FileCheck, Mail, ExternalLink, ChevronDown, ChevronUp, ShieldCheck, BookOpen, Send, Bot, Sparkles } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';
import { navigateTo } from '../utils/router';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { FormField } from '../components/ui/FormField';
import { StatusMessage } from '../components/ui/StatusMessage';

interface HelpPageProps {
  onBack: () => void;
  onOpenOnlo: () => void;
  locale?: SupportedLocale;
}

interface FAQItem {
  id: string;
  category: 'all' | 'cesja' | 'deposit' | 'meldunek' | 'scams' | 'listing';
  question: { en: string; pl: string };
  answer: { en: string; pl: string };
  relatedLink?: { text: { en: string; pl: string }; path: string };
}

const FAQS: FAQItem[] = [
  {
    id: 'cesja-what-is',
    category: 'cesja',
    question: {
      en: 'What is a lease transfer (Cesja umowy najmu) under Polish law?',
      pl: 'Czym jest cesja umowy najmu na gruncie polskiego prawa?'
    },
    answer: {
      en: "A lease takeover lets a new tenant take over under arrangements agreed with the landlord. Confirm the agreement, dates, charges and deposit terms directly. Relok8 records requests and decisions; it does not guarantee legal outcomes.",
      pl: "Przejęcie najmu pozwala nowemu najemcy wejść na warunkach uzgodnionych z właścicielem. Potwierdź umowę, daty, opłaty i kaucję bezpośrednio. Relok8 zapisuje wnioski i decyzje; nie gwarantuje skutków prawnych."
    },
    relatedLink: {
      text: { en: 'Read full lease handover guide', pl: 'Zobacz przewodnik przekazania najmu' },
      path: '/leave-your-lease'
    }
  },
  {
    id: 'landlord-consent',
    category: 'cesja',
    question: {
      en: 'Does my landlord have to approve the replacement tenant?',
      pl: 'Czy wynajmujący musi wyrazić zgodę na nowego najemcę?'
    },
    answer: {
      en: "Ask the landlord to approve the applicant. Permission to advertise is a separate decision. Listings can be published before the landlord joins and are not automatically verified. Invite the landlord from My Place using their email-bound link.",
      pl: "Poproś właściciela o zatwierdzenie kandydata. Zgoda na ogłoszenie jest osobna. Ogłoszenie można opublikować przed dołączeniem właściciela; nie jest automatycznie zweryfikowane. Zaproś właściciela z My Place linkiem przypisanym do emaila."
    }
  },
  {
    id: 'meldunek-pesel',
    category: 'meldunek',
    question: {
      en: 'Can foreign students and expats register their address (Meldunek) to get a PESEL?',
      pl: 'Czy obcokrajowcy mogą zameldować się (Meldunek) i otrzymać numer PESEL?'
    },
    answer: {
      en: "Registration requirements depend on your circumstances and documents. A listing is not proof of eligibility or landlord consent. Confirm the requirements with the relevant office and discuss documents with the landlord.",
      pl: "Wymogi meldunkowe zależą od Twojej sytuacji i dokumentów. Ogłoszenie nie potwierdza uprawnień ani zgody właściciela. Sprawdź wymagania we właściwym urzędzie i ustal dokumenty z właścicielem."
    },
    relatedLink: {
      text: { en: 'Step-by-step Meldunek & PESEL registration guide', pl: 'Instrukcja meldunku i PESEL krok po kroku' },
      path: '/meldunek-guide'
    }
  },
  {
    id: 'security-deposit-settlement',
    category: 'deposit',
    question: {
      en: 'How is the security deposit (kaucja) settled during a lease transfer?',
      pl: 'Jak rozliczana jest kaucja podczas cesji umowy najmu?'
    },
    answer: {
      en: "Agree the deposit amount, recipient, timing, deductions and return directly. Relok8 does not collect or hold money. Handover checkmarks are participant reports, not independent verification of payment.",
      pl: "Ustalcie bezpośrednio kwotę kaucji, odbiorcę, termin, potrącenia i zwrot. Relok8 nie pobiera ani nie przechowuje pieniędzy. Potwierdzenia przekazania są oświadczeniami uczestników, nie niezależną weryfikacją płatności."
    }
  },
  {
    id: 'scam-prevention',
    category: 'scams',
    question: {
      en: 'How does Relok8 help local and international renters avoid rental scams?',
      pl: 'Jak Relok8 chroni najemców przed oszustwami mieszkaniowymi?'
    },
    answer: {
      en: '1) We do not charge agency commissions. The 49 PLN reservation confirmation fee becomes due only after landlord approval. 2) Outgoing tenants supply active lease and landlord contact details for formal transfer. 3) Never transfer rent or deposits to an unverified private account before a viewing and signed handover protocol. 4) Every lease assignment requires formal landlord consent.',
      pl: '1) Nie pobieramy prowizji agencyjnych. Opłata 49 PLN za potwierdzenie rezerwacji jest należna dopiero po akceptacji właściciela. 2) Najemcy przekazują dane aktualnej umowy oraz kontakt do właściciela. 3) Nie przelewaj czynszu ani kaucji na niezweryfikowane konto przed obejrzeniem lokalu i podpisaniem protokołu. 4) Każda cesja wymaga formalnej zgody właściciela.'
    },
    relatedLink: {
      text: { en: 'Read Relok8 tenant safety rules & checklist', pl: 'Zasady bezpieczeństwa i weryfikacji lokalu' },
      path: '/safety-guide'
    }
  },
  {
    id: 'listing-a-room',
    category: 'listing',
    question: {
      en: 'How quickly can I find someone to take over my room?',
      pl: 'Jak szybko znajdę kogoś na przejęcie mojego pokoju?'
    },
    answer: {
      en: "Response times depend on demand and your listing. We cannot promise a match or response time. Complete the four-step form and review your details before publishing. Drafts are saved in this browser on this device, including photos.",
      pl: "Czas odpowiedzi zależy od popytu i ogłoszenia. Nie obiecujemy dopasowania ani czasu odpowiedzi. Uzupełnij cztery etapy i sprawdź dane przed publikacją. Szkic wraz ze zdjęciami zapisuje się w tej przeglądarce na tym urządzeniu."
    },
    relatedLink: {
      text: { en: 'List your room for lease transfer', pl: 'Dodaj swój pokój do bazy' },
      path: '/list'
    }
  },
  {
    id: 'penalty-calculator',
    category: 'cesja',
    question: {
      en: 'Can my landlord fine me for moving out early?',
      pl: 'Czy wynajmujący może naliczyć karę za wcześniejszą wyprowadzkę?'
    },
    answer: {
      en: "Charges and deposit return depend on your agreement and circumstances. Discuss an early exit with your landlord and seek qualified advice where needed. A Relok8 approval is not a signed agreement or a guarantee of a refund.",
      pl: "Opłaty i zwrot kaucji zależą od umowy i okoliczności. Ustal wcześniejszą wyprowadzkę z właścicielem i w razie potrzeby skorzystaj z profesjonalnej porady. Akceptacja w Relok8 nie jest podpisaną umową ani gwarancją zwrotu."
    },
    relatedLink: {
      text: { en: 'Calculate your avoided penalties with our calculator', pl: 'Oblicz oszczędności w kalkulatorze kar' },
      path: '/savings-calculator'
    }
  }
];

export const HelpPage: React.FC<HelpPageProps> = ({
  onBack,
  onOpenOnlo,
  locale = 'en',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'cesja' | 'deposit' | 'meldunek' | 'scams' | 'listing'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('cesja-what-is');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportCity, setSupportCity] = useState('');
  const [ticketStatus, setTicketStatus] = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle');
  const [ticketError, setTicketError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; message?: string }>({});

  // Sync document title and meta description for SEO
  useEffect(() => {
    document.title = locale === 'pl'
      ? 'Centrum Pomocy i FAQ · Cesja Umowy Najmu i Bezpieczny Wynajem | Relok8'
      : 'Help Center & Renter FAQ · Lease Transfers & Housing in Poland | Relok8';

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        locale === 'pl'
          ? 'Odpowiedzi na najczęstsze pytania o przejęcie najmu w Polsce, uzgodnienia dotyczące kaucji, meldunek oraz planowanie wcześniejszej wyprowadzki.'
          : 'Answers to frequently asked questions about lease takeovers in Poland, security deposit arrangements, address registration (meldunek), and planning an early move.'
      );
    }
  }, [locale]);

  const filteredFaqs = useMemo(() => {
    return FAQS.filter((faq) => {
      if (selectedCategory !== 'all' && faq.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const questionText = faq.question[locale === 'pl' ? 'pl' : 'en'].toLowerCase();
        const answerText = faq.answer[locale === 'pl' ? 'pl' : 'en'].toLowerCase();
        return questionText.includes(q) || answerText.includes(q);
      }
      return true;
    });
  }, [selectedCategory, searchQuery, locale]);

  // Schema.org FAQPage structured data for rich Google snippets
  const faqSchema = useMemo(() => {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': FAQS.map((faq) => ({
        '@type': 'Question',
        'name': faq.question[locale === 'pl' ? 'pl' : 'en'],
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer[locale === 'pl' ? 'pl' : 'en']
        }
      }))
    };
  }, [locale]);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = supportEmail.trim();
    const message = supportMessage.trim();
    const errors: { email?: string; message?: string } = {};
    if (!email) {
      errors.email = locale === 'pl' ? 'Wpisz adres e-mail.' : 'Enter your email address.';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = locale === 'pl' ? 'Wpisz prawidłowy adres e-mail.' : 'Enter a valid email address.';
    }
    if (!message) {
      errors.message = locale === 'pl' ? 'Opisz, w czym możemy pomóc.' : 'Describe how we can help.';
    } else if (message.length < 10) {
      errors.message = locale === 'pl' ? 'Wpisz co najmniej 10 znaków.' : 'Enter at least 10 characters.';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setTicketStatus('submitting');
    setTicketError('');
    try {
      const city = supportCity.trim();
      const contextualMessage = city
        ? `${locale === 'pl' ? 'Miasto / uczelnia' : 'City / university'}: ${city}\n\n${message}`
        : message;
      await backend().action(api.services.contact, { name: email.split('@')[0], email, subject: 'Help Center Inquiry', message: contextualMessage, topic: selectedCategory, locale: locale === 'pl' ? 'pl' : 'en' });
      setTicketStatus('sent');
      setSupportMessage('');
      setSupportCity('');
    } catch {
      setTicketStatus('error');
      setTicketError(
        locale === 'pl'
          ? 'Wiadomość nie została wysłana. Spróbuj ponownie.'
          : 'Your message was not sent. Please try again.',
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-36 sm:pb-24 text-left font-sans">
      
      {/* Schema.org FAQPage JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }}
      />

      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 pt-4 sm:pt-8 space-y-6 sm:space-y-10">
        
        {/* Breadcrumb & Back */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            type="button"
            onClick={onBack}
            className="min-h-11 inline-flex items-center gap-1.5 font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{locale === 'pl' ? 'Wróć do ogłoszeń' : 'Back to rooms'}</span>
          </button>
          <span>/</span>
          <span className="text-slate-700 font-medium">{locale === 'pl' ? 'Centrum pomocy' : 'Help Center'}</span>
        </div>

        {/* Hero Section */}
        <div className="space-y-2.5 sm:space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{locale === 'pl' ? 'Baza wiedzy & Wsparcie' : 'Knowledge Base & Support'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {locale === 'pl'
              ? 'Jak możemy Ci dzisiaj pomóc?'
              : 'How can we help you today?'}
          </h1>
          <p className="text-xs sm:text-base text-slate-600 leading-relaxed">
            {locale === 'pl'
              ? 'Praktyczne informacje o przejęciu najmu, meldunku, uzgodnieniach dotyczących kaucji i planowaniu wcześniejszej wyprowadzki.'
              : 'Practical information about lease takeovers, meldunek address registration, deposit arrangements and planning an early move.'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl">
          <label htmlFor="help-search" className="sr-only">
            {locale === 'pl' ? 'Szukaj w centrum pomocy' : 'Search the help center'}
          </label>
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            id="help-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={locale === 'pl' ? 'Szukaj pytań (np. cesja, kaucja, meldunek, kary)...' : 'Search questions (e.g. cesja, deposit, meldunek, penalties)...'}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm text-sm placeholder:text-slate-400 text-slate-900"
          />
        </div>

        {/* Use the real Onlo assistant rather than a scripted imitation. */}
        <div className="max-w-2xl rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-xl bg-white border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Bot className="w-4.5 h-4.5" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">
                {locale === 'pl' ? 'Nie widzisz swojej odpowiedzi?' : 'Can’t find your answer?'}
              </p>
              <p className="text-xs leading-5 text-slate-600">
                {locale === 'pl' ? 'Zapytaj Onlo o meldunek, czynsz, kaucję lub przejęcie najmu.' : 'Ask Onlo about meldunek, czynsz, deposits, or taking over a lease.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenOnlo}
            className="min-h-11 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-[background-color,transform] shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {locale === 'pl' ? 'Zapytaj Onlo' : 'Ask Onlo'}
          </button>
        </div>


        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { id: 'all', label: locale === 'pl' ? 'Wszystkie tematy' : 'All Topics' },
            { id: 'cesja', label: locale === 'pl' ? 'Cesja umowy najmu' : 'Lease Transfers (Cesja)' },
            { id: 'deposit', label: locale === 'pl' ? 'Kaucja & Rozliczenia' : 'Security Deposits' },
            { id: 'meldunek', label: locale === 'pl' ? 'Meldunek & PESEL' : 'Meldunek & PESEL' },
            { id: 'scams', label: locale === 'pl' ? 'Bezpieczeństwo & Weryfikacja' : 'Safety & Verification' },
            { id: 'listing', label: locale === 'pl' ? 'Dodawanie ogłoszenia' : 'Listing a Room' }
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id as any)}
              aria-pressed={selectedCategory === cat.id}
              className={`min-h-11 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQs Accordion List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {locale === 'pl' ? 'Często zadawane pytania' : 'Frequently asked questions'}
          </h2>
          <div className="space-y-3">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = expandedId === faq.id;
              const qText = faq.question[locale === 'pl' ? 'pl' : 'en'];
              const aText = faq.answer[locale === 'pl' ? 'pl' : 'en'];

              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition-colors hover:border-slate-300"
                >
                  <button
                    id={`faq-trigger-${faq.id}`}
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : faq.id)}
                    className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${faq.id}`}
                  >
                    <span className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                      {qText}
                    </span>
                    <span className="shrink-0 mt-0.5 text-slate-400">
                      {isOpen ? <ChevronUp className="w-5 h-5 text-indigo-600" /> : <ChevronDown className="w-5 h-5" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      id={`faq-panel-${faq.id}`}
                      role="region"
                      aria-labelledby={`faq-trigger-${faq.id}`}
                      className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-600 space-y-4 border-t border-slate-100 animate-in fade-in duration-150 motion-reduce:animate-none"
                    >
                      <p className="leading-relaxed whitespace-pre-line">{aText}</p>
                      
                      {faq.relatedLink && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              const prefix = locale === 'pl' ? '/pl' : '';
                              navigateTo(prefix + faq.relatedLink!.path);
                            }}
                            className="min-h-11 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                          >
                            <span>{faq.relatedLink.text[locale === 'pl' ? 'pl' : 'en']}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <EmptyState
              icon={<HelpCircle className="h-8 w-8" />}
              title={locale === 'pl' ? 'Brak pytań pasujących do wyszukiwania' : 'No matching questions found'}
              description={locale === 'pl' ? 'Spróbuj innych słów kluczowych lub wyślij wiadomość do zespołu poniżej.' : 'Try different keywords or submit an inquiry directly below.'}
              className="rounded-2xl border border-slate-200 bg-white"
            />
          )}
          </div>
        </div>

        {/* Quick Resource Cards */}
        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {locale === 'pl' ? 'Wzory dokumentów i przewodniki' : 'Templates and guides'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => navigateTo(locale === 'pl' ? '/pl/safety-guide' : '/safety-guide')}
              className="w-full p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer space-y-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileCheck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                {locale === 'pl' ? 'Bezpieczny Przekaz Najmu' : 'Safe Handover Guide'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {locale === 'pl' ? 'Wskazówki krok po kroku jak bezpiecznie przekazać pokój za zgodą właściciela.' : 'Step-by-step guidance on agreeing a smooth room handover with your landlord.'}
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigateTo(locale === 'pl' ? '/pl/meldunek-guide' : '/meldunek-guide')}
              className="w-full p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer space-y-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                {locale === 'pl' ? 'Przewodnik po Meldunku' : 'Meldunek & PESEL Guide'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {locale === 'pl' ? 'Jak zarejestrować pobyt w urzędzie dzielnicy w 15 minut.' : 'How to register your temporary address and get a PESEL number in 15 minutes.'}
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigateTo(locale === 'pl' ? '/pl/savings-calculator' : '/savings-calculator')}
              className="w-full p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer space-y-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                {locale === 'pl' ? 'Kalkulator Oszczędności' : 'Penalty Calculator'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {locale === 'pl' ? 'Oblicz ile zaoszczędzisz przekazując umowę zamiast jej zrywania.' : 'Calculate exact deposit and rent liabilities saved by executing a lease takeover.'}
              </p>
            </button>
          </div>
        </div>

        {/* Contact Support Direct Ticket Box */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-600" />
              <span>{locale === 'pl' ? 'Nadal potrzebujesz pomocy?' : 'Still have a question?'}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              {locale === 'pl'
                ? 'Nasz zespół pomaga lokalnym i zagranicznym najemcom w przekazaniu najmu, pytaniach dotyczących umowy i komunikacji z właścicielem.'
                : 'Our team assists local and international renters with lease handovers, contract questions and landlord communication.'}
            </p>
          </div>

          {ticketStatus === 'sent' ? (
            <StatusMessage
              tone="success"
              title={locale === 'pl' ? 'Wiadomość wysłana' : 'Message received'}
            >
              {locale === 'pl'
                ? 'Odpowiemy na podany adres e-mail.'
                : 'Our support team will reply to your email shortly.'}
            </StatusMessage>
          ) : (
            <form onSubmit={handleSubmitTicket} noValidate aria-busy={ticketStatus === 'submitting'} className="space-y-4">
              {ticketStatus === 'error' && (
                <StatusMessage tone="error" title={locale === 'pl' ? 'Nie udało się wysłać' : 'Message not sent'}>
                  {ticketError}
                </StatusMessage>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label={locale === 'pl' ? 'Twój adres e-mail' : 'Your email address'}
                  htmlFor="support-email"
                  required
                  error={fieldErrors.email}
                >
                  <input
                    id="support-email"
                    type="email"
                    required
                    value={supportEmail}
                    onChange={(e) => {
                      setSupportEmail(e.target.value);
                      setFieldErrors((current) => ({ ...current, email: undefined }));
                      if (ticketStatus === 'error') setTicketStatus('idle');
                    }}
                    autoComplete="email"
                    placeholder="student@university.edu"
                    className="min-h-11 w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-slate-900 placeholder:text-slate-400"
                  />
                </FormField>
                <FormField
                  label={locale === 'pl' ? 'Miasto / uczelnia (opcjonalnie)' : 'City / university (optional)'}
                  htmlFor="support-city"
                  hint={locale === 'pl' ? 'Pomaga nam skierować pytanie do właściwej osoby.' : 'Helps us route your question to the right person.'}
                >
                  <input
                    id="support-city"
                    type="text"
                    value={supportCity}
                    onChange={(e) => {
                      setSupportCity(e.target.value);
                      if (ticketStatus === 'error') setTicketStatus('idle');
                    }}
                    autoComplete="address-level2"
                    placeholder="e.g. Warsaw, Kraków, Wrocław, Gdańsk"
                    className="min-h-11 w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </FormField>
              </div>

              <FormField
                label={locale === 'pl' ? 'Twoje pytanie lub opis sytuacji' : 'Your question or issue'}
                htmlFor="support-message"
                required
                error={fieldErrors.message}
                hint={locale === 'pl' ? 'Nie wpisuj numerów dokumentów ani danych płatniczych.' : 'Do not include identity-document numbers or payment details.'}
              >
                <textarea
                  id="support-message"
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={3}
                  value={supportMessage}
                  onChange={(e) => {
                    setSupportMessage(e.target.value);
                    setFieldErrors((current) => ({ ...current, message: undefined }));
                    if (ticketStatus === 'error') setTicketStatus('idle');
                  }}
                  placeholder={locale === 'pl' ? 'Opisz swoje pytanie dotyczące cesji, kaucji lub właściciela lokalu...' : 'Describe your question about the lease takeover, landlord consent, or deposit settlement...'}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm text-slate-900 placeholder:text-slate-400"
                />
              </FormField>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <span className="text-xs text-slate-500">
                  Direct contact: <a href="mailto:info@relok8.online" className="text-indigo-600 font-semibold underline">info@relok8.online</a>
                </span>
                <Button
                  type="submit"
                  disabled={ticketStatus === 'submitting'}
                  aria-busy={ticketStatus === 'submitting'}
                  fullWidth
                  leadingIcon={<Send className="h-4 w-4" />}
                  className="sm:w-auto"
                >
                  <span>{ticketStatus === 'submitting' ? (locale === 'pl' ? 'Wysyłanie...' : 'Sending...') : (locale === 'pl' ? 'Wyślij zapytanie' : 'Send message')}</span>
                </Button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
