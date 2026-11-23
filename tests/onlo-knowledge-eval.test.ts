import { describe, expect, test } from 'vitest';
import { DEFAULT_ONLO_KNOWLEDGE } from '../convex/onloKnowledge';
import { rankKnowledge, type OnloKnowledgeRecord } from '../convex/lib/onloRetrieval';

const records: OnloKnowledgeRecord[] = DEFAULT_ONLO_KNOWLEDGE.map((article) => ({
  ...article,
  keywords: [...article.keywords],
  active: true,
  lastVerifiedAt: Date.parse('2026-11-23T00:00:00.000Z'),
}));

const cases: Array<{ question: string; expected: string }> = [
  { question: 'How much does Relok8 cost for a tenant?', expected: 'relok8-pricing-and-payments' },
  { question: 'Is checkout available and do you hold rent in escrow?', expected: 'relok8-pricing-and-payments' },
  { question: 'What does available now mean on an apartment?', expected: 'relok8-listing-availability' },
  { question: 'What is an upcoming takeover?', expected: 'relok8-listing-availability' },
  { question: 'Why does the listing say confirm takeover timing?', expected: 'relok8-listing-availability' },
  { question: 'Does publishing a listing mean the landlord approved it?', expected: 'relok8-landlord-confirmation' },
  { question: 'How do I know whether the owner gave consent?', expected: 'relok8-landlord-confirmation' },
  { question: 'Will my name and apartment address be public?', expected: 'relok8-public-listing-data' },
  { question: 'Are the landlord phone number and email shown publicly?', expected: 'relok8-public-listing-data' },
  { question: 'Can I transfer my lease without landlord consent?', expected: 'poland-lease-takeover-consent' },
  { question: 'Is subletting allowed without permission in Poland?', expected: 'poland-lease-takeover-consent' },
  { question: 'When should my rental deposit be returned?', expected: 'poland-rental-deposit-return' },
  { question: 'Can damage be deducted from my deposit?', expected: 'poland-rental-deposit-return' },
  { question: 'How can a foreigner register their address in Poland?', expected: 'poland-meldunek-foreigners' },
  { question: 'Does meldunek allowed on a listing guarantee registration?', expected: 'poland-meldunek-foreigners' },
  { question: 'How does a foreigner get a PESEL number?', expected: 'poland-pesel-foreigners' },
  { question: 'Do I receive PESEL after registering for over 30 days?', expected: 'poland-pesel-foreigners' },
  { question: 'The owner wants an urgent transfer before viewing. Is this a scam?', expected: 'poland-rental-scam-safety' },
  { question: 'Should I pay before viewing the apartment?', expected: 'poland-rental-scam-safety' },
  { question: 'Do I need an energy performance certificate for a rental?', expected: 'poland-energy-certificate-rental' },
  { question: 'What is a świadectwo energetyczne?', expected: 'poland-energy-certificate-rental' },
  { question: 'Does czynsz include utilities and administration fees?', expected: 'relok8-czynsz-and-bills' },
  { question: 'Are the monthly bills fixed or based on usage?', expected: 'relok8-czynsz-and-bills' },
  { question: 'What should we record when handing over keys?', expected: 'relok8-handover-checklist' },
  { question: 'Do we need meter readings and an inventory at move-in?', expected: 'relok8-handover-checklist' },
  { question: 'Ile kosztuje Relok8 dla najemcy?', expected: 'relok8-pricing-and-payments' },
  { question: 'Czy płatność 49 PLN i escrow są już aktywne?', expected: 'relok8-pricing-and-payments' },
  { question: 'Co oznacza status dostępne teraz?', expected: 'relok8-listing-availability' },
  { question: 'Co oznacza nadchodzące przejęcie najmu?', expected: 'relok8-listing-availability' },
  { question: 'Dlaczego muszę potwierdzić termin przejęcia?', expected: 'relok8-listing-availability' },
  { question: 'Czy publikacja ogłoszenia oznacza zgodę właściciela?', expected: 'relok8-landlord-confirmation' },
  { question: 'Jak potwierdzić akceptację właściciela?', expected: 'relok8-landlord-confirmation' },
  { question: 'Czy moje imię i adres lokalu są publiczne?', expected: 'relok8-public-listing-data' },
  { question: 'Czy telefon i email właściciela są widoczne publicznie?', expected: 'relok8-public-listing-data' },
  { question: 'Czy mogę przejąć najem bez zgody wynajmującego?', expected: 'poland-lease-takeover-consent' },
  { question: 'Czy podnajem bez zgody jest dozwolony?', expected: 'poland-lease-takeover-consent' },
  { question: 'Kiedy właściciel powinien zwrócić kaucję?', expected: 'poland-rental-deposit-return' },
  { question: 'Czy można potrącić uszkodzenia z kaucji?', expected: 'poland-rental-deposit-return' },
  { question: 'Jak cudzoziemiec może zrobić meldunek?', expected: 'poland-meldunek-foreigners' },
  { question: 'Czy pole meldunek dozwolony gwarantuje zameldowanie?', expected: 'poland-meldunek-foreigners' },
  { question: 'Jak cudzoziemiec uzyskuje numer PESEL?', expected: 'poland-pesel-foreigners' },
  { question: 'Czy po zameldowaniu na ponad 30 dni dostanę PESEL?', expected: 'poland-pesel-foreigners' },
  { question: 'Właściciel żąda pilnego przelewu przed oglądaniem. Czy to oszustwo?', expected: 'poland-rental-scam-safety' },
  { question: 'Czy powinienem płacić przed obejrzeniem mieszkania?', expected: 'poland-rental-scam-safety' },
  { question: 'Czy przy najmie potrzebne jest świadectwo energetyczne?', expected: 'poland-energy-certificate-rental' },
  { question: 'Kto przekazuje świadectwo charakterystyki energetycznej?', expected: 'poland-energy-certificate-rental' },
  { question: 'Czy czynsz zawiera rachunki i opłatę administracyjną?', expected: 'relok8-czynsz-and-bills' },
  { question: 'Czy media są stałe czy według zużycia?', expected: 'relok8-czynsz-and-bills' },
  { question: 'Co zapisać przy przekazaniu kluczy?', expected: 'relok8-handover-checklist' },
  { question: 'Czy w protokole potrzebne są liczniki i wyposażenie?', expected: 'relok8-handover-checklist' },
];

describe('Onlo bilingual retrieval evaluation', () => {
  test.each(cases)('$question', ({ question, expected }) => {
    expect(rankKnowledge(question, records, 1)[0]?.slug).toBe(expected);
  });

  test('contains exactly 50 bilingual benchmark questions', () => {
    expect(cases).toHaveLength(50);
  });
});
