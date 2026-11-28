import { describe, expect, test } from 'vitest';
import { cleanOnloText, proactiveActions, routeOnloIntent, toolsForIntent, validateEvidenceAnswer } from '../convex/lib/onloAgent';
import { knownMonthlyCost, listingContradictions, verifiedListingFacts } from '../convex/lib/onloTools';

describe('Onlo bounded agent architecture', () => {
  test('routes bilingual safety and cost intents deterministically', () => {
    expect(routeOnloIntent('Should I pay before viewing? Is this a scam?', 'general')).toBe('safety');
    expect(routeOnloIntent('Jaki jest pełny czynsz i rachunki?', 'listing')).toBe('costs');
  });

  test('selects only bounded allowlisted tools', () => {
    expect(toolsForIntent('costs', true)).toEqual([
      'search_verified_knowledge', 'get_listing_facts', 'find_listing_contradictions', 'calculate_known_monthly_cost',
    ]);
  });

  test('rejects citations outside the supplied evidence', () => {
    expect(validateEvidenceAnswer('This is guaranteed [9].', 2, 'en', true)).toMatchObject({
      confidence: 'unverified', citationStatus: 'invalid', needsHuman: true,
    });
  });

  test('redacts listing-authored contact and description fields', () => {
    const facts = verifiedListingFacts({ _id: '1', title: 'Room', monthlyRent: 800, landlordContactPhone: 'secret', description: 'untrusted' });
    expect(facts).toEqual({ _id: '1', title: 'Room', monthlyRent: 800 });
  });

  test('calculates only known costs and detects incomplete listing data', () => {
    expect(knownMonthlyCost({ monthlyRent: 800, czynszAdmin: 200, billsMode: 'fixed', fixedBillsPLN: 100 })).toMatchObject({ knownTotal: 1100, depositSeparate: 0 });
    expect(listingContradictions({ billsMode: 'fixed', fixedBillsPLN: 0 }, 'en')).toContain('Bills are marked as fixed, but no fixed amount is provided.');
  });

  test('offers proactive suggestions without pretending to execute them', () => {
    expect(proactiveActions('safety', 'en', true).every((action) => action.requiresConfirmation === false)).toBe(true);
  });

  test('turns model formatting into clean readable text', () => {
    expect(cleanOnloText('## **Answer**\n- The rent is `800 PLN` [1]. 😀', true)).toBe('Answer\nThe rent is 800 PLN.');
    expect(cleanOnloText('Cześć\u200B!\n\n\nJak mogę pomóc?')).toBe('Cześć!\n\nJak mogę pomóc?');
  });
});
