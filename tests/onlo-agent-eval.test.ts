import { describe, expect, test } from 'vitest';
import { routeOnloIntent, validateEvidenceAnswer, type OnloIntent, type OnloScope } from '../convex/lib/onloAgent';

const routingCases: Array<{ question: string; scope: OnloScope; intent: OnloIntent }> = [
  { question: 'The landlord wants money before I view the room', scope: 'listing', intent: 'safety' },
  { question: 'Czy to może być oszustwo?', scope: 'general', intent: 'safety' },
  { question: 'What will rent and fixed bills total?', scope: 'listing', intent: 'costs' },
  { question: 'Ile wynosi czynsz z rachunkami?', scope: 'listing', intent: 'costs' },
  { question: 'What happened to my takeover request?', scope: 'application', intent: 'application_status' },
  { question: 'Jaki jest status mojego wniosku?', scope: 'application', intent: 'application_status' },
  { question: 'Help me reply to the tenant', scope: 'thread', intent: 'conversation_help' },
  { question: 'Pomóż mi odpisać na wiadomość', scope: 'thread', intent: 'conversation_help' },
  { question: 'Does the landlord need to consent?', scope: 'general', intent: 'legal_process' },
  { question: 'Czy mogę zrobić meldunek?', scope: 'listing', intent: 'legal_process' },
  { question: 'Is this room furnished?', scope: 'listing', intent: 'listing_facts' },
  { question: 'Czy pokój jest dostępny?', scope: 'listing', intent: 'listing_facts' },
  { question: 'How do I change my profile?', scope: 'general', intent: 'account_help' },
  { question: 'Jak zmienić konto?', scope: 'general', intent: 'account_help' },
];

describe('Onlo intent and evidence evaluation', () => {
  test.each(routingCases)('$question', ({ question, scope, intent }) => {
    expect(routeOnloIntent(question, scope)).toBe(intent);
  });

  test('does not accept listing citation zero without listing context', () => {
    expect(validateEvidenceAnswer('It is available [0].', 2, 'en', true)).toMatchObject({ citationStatus: 'invalid' });
  });

  test('accepts listing citation zero only when listing context exists', () => {
    expect(validateEvidenceAnswer('The record says it is available [0].', 2, 'en', true, true)).toMatchObject({ citationStatus: 'valid', confidence: 'verified' });
  });

  test('marks unsupported answers as needing human confirmation', () => {
    expect(validateEvidenceAnswer('Please confirm this with the participant.', 0, 'en', false)).toMatchObject({ confidence: 'unverified', needsHuman: true });
  });
});
