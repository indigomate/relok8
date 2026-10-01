import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Search, HelpCircle, Shield, FileCheck, CheckCircle2, 
  AlertCircle, Mail, Phone, ExternalLink, ChevronDown, ChevronUp,
  Sparkles, BookOpen, MessageSquare, Send
} from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';
import { navigateTo } from '../utils/router';

interface HelpPageProps {
  onBack: () => void;
  locale?: SupportedLocale;
  onOpenLeaveYourLease?: () => void;
  onOpenIntake?: () => void;
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
      en: 'A Cesja umowy najmu (lease assignment) is a legal agreement pursuant to Article 509 of the Polish Civil Code (Kodeks Cywilny). It transfers the active lease rights and tenant obligations from the departing tenant to a replacement tenant with the landlord’s explicit written consent. The lease continues under the exact same financial terms and deposit amount, eliminating early cancellation penalties.',
      pl: 'Cesja umowy najmu to prawnie wiążące porozumienie na podstawie art. 509 Kodeksu Cywilnego. Przenosi prawa i obowiązki wynikające z umowy najmu z dotychczasowego najemcy na nowego za pisemną zgodą wynajmującego. Umowa trwa na tych samych warunkach, bez konieczności ponoszenia kar za wcześniejsze rozwiązanie.'
    },
    relatedLink: {
      text: { en: 'Read full Cesja guide & bilingual template', pl: 'Zobacz przewodnik i wzór cesji' },
      path: '/cesja-template'
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
      en: 'Yes. Under Polish Civil Code Art. 509, lease transfers legally require the landlord’s written consent (zgoda wynajmującego). On Relok8, all listings are pre-approved or verified with landlords, and our generated Cesja contract provides dedicated signature lines for all three parties (Departing Tenant, Incoming Tenant, and Landlord).',
      pl: 'Tak. Zgodnie z art. 509 Kodeksu Cywilnego cesja wymaga zgody wynajmującego w formie pisemnej. Na Relok8 ułatwiamy uzyskanie tej zgody, a nasz wzór porozumienia zawiera miejsce na podpisy wszystkich trzech stron.'
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
      en: 'Yes! Polish law (Ustawa o ewidencji ludności) obligates every foreign citizen staying in Poland over 30 days to register their temporary residence (meldunek czasowy). Registration is completely free at your local Urząd Dzielnicy or Urząd Miasta and automatically assigns you a PESEL number. Every listing on Relok8 confirms landlord consent for Meldunek.',
      pl: 'Tak! Zgodnie z Ustawą o ewidencji ludności każdy cudzoziemiec przebywający w Polsce ponad 30 dni ma prawny obowiązek zameldowania się. Meldunek w urzędzie dzielnicy lub miasta jest bezpłatny i automatycznie nadaje numer PESEL. Na Relok8 wymagamy deklaracji właściciela w tej kwestii.'
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
      en: 'In a standard peer-to-peer lease handover, the incoming tenant reimburses the outgoing tenant for the security deposit upon signing the tripartite handover protocol (protokół zdawczo-odbiorczy). The landlord retains the original deposit held in their escrow/bank account until the natural end of the assigned lease term, ensuring zero disruption or double fees.',
      pl: 'W standardowej cesji nowy najemca zwraca kaucję dotychczasowemu najemcy w momencie podpisania protokołu zdawczo-odbiorczego lokalu. Właściciel zachowuje pierwotną kaucję na swoim koncie aż do zakończenia okresu najmu, eliminując zbędne opłaty i prowizje.'
    }
  },
  {
    id: 'scam-prevention',
    category: 'scams',
    question: {
      en: 'How does Relok8 protect students and expats from rental scams?',
      pl: 'Jak Relok8 chroni najemców przed oszustwami mieszkaniowymi?'
    },
    answer: {
      en: '1) We never charge agency commissions or upfront reservation deposits. 2) Every outgoing tenant is verified with identity documents and active lease proof. 3) You never transfer money to private unverified foreign bank accounts before an in-person or live video walk-through and signed handover protocol. 4) All Cesja contracts require formal landlord counter-signature.',
      pl: '1) Nie pobieramy żadnych prowizji agencyjnych. 2) Weryfikujemy tożsamość najemców i dokument umowy najmu. 3) Przestrzegamy przed przelewaniem środków na niezweryfikowane konta przed weryfikacją lokalu. 4) Wszystkie umowy cesji wymagają podpisu właściciela nieruchomości.'
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
      en: 'Most rooms in major university hubs like Warsaw, Kraków, and Wrocław receive multiple inquiries within 48 to 72 hours, especially near universities (UW, SGH, PW, UJ, PWr). Listing takes under 2 minutes and is completely free of charge.',
      pl: 'Większość pokoi w głównych miastach akademickich (Warszawa, Kraków, Wrocław) znajduje zainteresowanych w ciągu 48-72 godzin, szczególnie w pobliżu uczelni. Dodanie oferty zajmuje 2 minuty i jest w 100% bezpłatne.'
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
      en: 'Fixed-term leases (umowa najmu na czas oznaczony) in Poland cannot be terminated early by the tenant without a specific contractual clause or legal grounds. Simply breaking the lease often causes forfeiture of the entire security deposit plus liability for remaining months. By executing a Cesja (lease transfer), the landlord incurs zero vacancy, and you walk away with your deposit intact and 0 PLN in penalties.',
      pl: 'Umowy najmu na czas oznaczony w Polsce nie mogą być wypowiedziane bez wyraźnego postanowienia w umowie. Zerwanie umowy grozi utratą kaucji i roszczeniami o czynsz. Cesja pozwala wprowadzić nowego najemcę bez jakichkolwiek kar.'
    },
    relatedLink: {
      text: { en: 'Calculate your avoided penalties with our calculator', pl: 'Oblicz oszczędności w kalkulatorze kar' },
      path: '/savings-calculator'
    }
  }
];

export const HelpPage: React.FC<HelpPageProps> = ({
  onBack,
  locale = 'en',
  onOpenLeaveYourLease,
  onOpenIntake
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'cesja' | 'deposit' | 'meldunek' | 'scams' | 'listing'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('cesja-what-is');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [ticketStatus, setTicketStatus] = useState<'idle' | 'submitting' | 'sent'>('idle');

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
          ? 'Odpowiedzi na najczęstsze pytania o cesję umowy najmu w Polsce (Art. 509 KC), rozliczanie kaucji, meldunek dla obcokrajowców oraz uniknięcie kar za wcześniejsze rozwiązanie umowy.'
          : 'Answers to frequently asked questions about lease transfers in Poland (Art. 509 KC), security deposit settlement, address registration (meldunek), and zero-penalty early exits.'
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
    if (!supportMessage || !supportEmail) return;
    setTicketStatus('submitting');
    try {
      await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: 'support-inquiry',
          tenantName: supportEmail.split('@')[0],
          tenantEmail: supportEmail,
          message: supportMessage
        })
      });
    } catch (e) {}
    setTimeout(() => {
      setTicketStatus('sent');
      setSupportMessage('');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 text-left">
      
      {/* Schema.org FAQPage JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 pt-8 space-y-10">
        
        {/* Breadcrumb & Back */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{locale === 'pl' ? 'Wróć do ogłoszeń' : 'Back to rooms'}</span>
          </button>
          <span>/</span>
          <span className="text-slate-700 font-medium">{locale === 'pl' ? 'Centrum pomocy' : 'Help Center'}</span>
        </div>

        {/* Hero Section */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{locale === 'pl' ? 'Baza wiedzy & Wsparcie' : 'Knowledge Base & Support'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {locale === 'pl'
              ? 'Jak możemy Ci dzisiaj pomóc?'
              : 'How can we help you today?'}
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            {locale === 'pl'
              ? 'Wszystko o cesji umowy najmu (Art. 509 KC), legalnym meldunku dla obcokrajowców, rozliczeniach kaucji oraz unikaniu kar za wcześniejszą wyprowadzkę.'
              : 'Everything you need to know about peer-to-peer lease transfers in Poland (Art. 509 KC), meldunek address registration, security deposit handovers, and avoiding lease penalties.'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={locale === 'pl' ? 'Szukaj pytań (np. cesja, kaucja, meldunek, kary)...' : 'Search questions (e.g. cesja, deposit, meldunek, penalties)...'}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm text-sm placeholder:text-slate-400 text-slate-900"
          />
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
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : faq.id)}
                    className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                    aria-expanded={isOpen}
                  >
                    <span className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                      {qText}
                    </span>
                    <span className="shrink-0 mt-0.5 text-slate-400">
                      {isOpen ? <ChevronUp className="w-5 h-5 text-indigo-600" /> : <ChevronDown className="w-5 h-5" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-600 space-y-4 border-t border-slate-100 animate-in fade-in duration-150">
                      <p className="leading-relaxed whitespace-pre-line">{aText}</p>
                      
                      {faq.relatedLink && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              const prefix = locale === 'pl' ? '/pl' : '';
                              navigateTo(prefix + faq.relatedLink!.path);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
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
            <div className="text-center py-12 px-4 rounded-2xl bg-white border border-slate-200 space-y-2">
              <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">
                {locale === 'pl' ? 'Brak pytań pasujących do wyszukiwania' : 'No matching questions found'}
              </h3>
              <p className="text-xs text-slate-500">
                {locale === 'pl' ? 'Spróbuj innych słów kluczowych lub wyślij wiadomość do zespołu poniżej.' : 'Try different keywords or submit an inquiry directly below.'}
              </p>
            </div>
          )}
        </div>

        {/* Quick Resource Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div
            onClick={() => navigateTo(locale === 'pl' ? '/pl/cesja-template' : '/cesja-template')}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer space-y-2 text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">
              {locale === 'pl' ? 'Wzór Umowy Cesji' : 'Bilingual Cesja Template'}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {locale === 'pl' ? 'Oficjalny polsko-angielski wzór porozumienia pod Art. 509 KC.' : 'Standardized Polish-English contract template pre-formatted for landlords.'}
            </p>
          </div>

          <div
            onClick={() => navigateTo(locale === 'pl' ? '/pl/meldunek-guide' : '/meldunek-guide')}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer space-y-2 text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">
              {locale === 'pl' ? 'Przewodnik po Meldunku' : 'Meldunek & PESEL Guide'}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {locale === 'pl' ? 'Jak zarejestrować pobyt w urzędzie dzielnicy w 15 minut.' : 'How to register your temporary address and get a PESEL number in 15 minutes.'}
            </p>
          </div>

          <div
            onClick={() => navigateTo(locale === 'pl' ? '/pl/savings-calculator' : '/savings-calculator')}
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer space-y-2 text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">
              {locale === 'pl' ? 'Kalkulator Oszczędności' : 'Penalty Calculator'}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {locale === 'pl' ? 'Oblicz ile zaoszczędzisz przekazując umowę zamiast jej zrywania.' : 'Calculate exact deposit and rent liabilities saved by executing a lease takeover.'}
            </p>
          </div>
        </div>

        {/* Contact Support Direct Ticket Box */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-600" />
              <span>{locale === 'pl' ? 'Nadal potrzebujesz pomocy?' : 'Still have a question?'}</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              {locale === 'pl'
                ? 'Nasz zespół odpowiada na zapytania studentów i ekspatów w ciągu 1-2 godzin w godzinach roboczych.'
                : 'Our team assists international students and expats with lease handovers, contract questions, and landlord communications.'}
            </p>
          </div>

          {ticketStatus === 'sent' ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs sm:text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                {locale === 'pl'
                  ? 'Twoja wiadomość została wysłana! Odpowiemy na podany adres e-mail.'
                  : 'Message received! Our support team will reply to your email shortly.'}
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {locale === 'pl' ? 'Twój adres e-mail' : 'Your email address'}
                  </label>
                  <input
                    type="email"
                    required
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {locale === 'pl' ? 'Dotyczy miasta' : 'City / University'}
                  </label>
                  <input
                    type="text"
                    defaultValue="Warsaw, Kraków, Wrocław, Gdańsk, Lublin"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {locale === 'pl' ? 'Twoje pytanie lub opis sytuacji' : 'Your question or issue'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder={locale === 'pl' ? 'Opisz swoje pytanie dotyczące cesji, kaucji lub właściciela lokalu...' : 'Describe your question about the lease takeover, landlord consent, or deposit settlement...'}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <span className="text-xs text-slate-500">
                  Direct founder contact: <a href="mailto:help@relok8.online" className="text-indigo-600 font-semibold underline">help@relok8.online</a>
                </span>
                <button
                  type="submit"
                  disabled={ticketStatus === 'submitting'}
                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{ticketStatus === 'submitting' ? (locale === 'pl' ? 'Wysyłanie...' : 'Sending...') : (locale === 'pl' ? 'Wyślij zapytanie' : 'Send message')}</span>
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
