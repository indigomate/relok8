export type OnloLocale = 'en' | 'pl';

export type OnloScope = 'general' | 'listing' | 'application' | 'thread';

export type OnloIntent =
  | 'listing_facts'
  | 'application_status'
  | 'conversation_help'
  | 'costs'
  | 'safety'
  | 'legal_process'
  | 'account_help'
  | 'general';

export type OnloConfidence = 'verified' | 'partial' | 'unverified';

export type OnloToolName =
  | 'search_verified_knowledge'
  | 'get_listing_facts'
  | 'get_application_status'
  | 'summarise_conversation'
  | 'calculate_known_monthly_cost'
  | 'get_handover_checklist'
  | 'find_listing_contradictions';

export interface OnloSuggestedAction {
  id: string;
  label: string;
  kind: 'ask' | 'review' | 'navigate';
  prompt?: string;
  href?: string;
  requiresConfirmation: boolean;
}

export interface OnloEvidenceValidation {
  answer: string;
  confidence: OnloConfidence;
  citationStatus: 'valid' | 'missing' | 'invalid' | 'not_required';
  needsHuman: boolean;
}

const patterns: Array<[OnloIntent, RegExp]> = [
  ['safety', /scam|fraud|safe|oszust|bezpiecz|pay before|money before|before (?:I )?view|przelew przed/i],
  ['costs', /cost|price|rent|deposit|bill|czynsz|koszt|cena|kaucj|rachun/i],
  ['application_status', /application|takeover request|status|wniosek|zgłoszen|aplikac/i],
  ['conversation_help', /reply|respond|message|conversation|odpis|wiadomo|rozmow/i],
  ['legal_process', /legal|law|consent|lease|meldunek|pesel|prawo|zgod|umow|najem/i],
  ['account_help', /account|profile|login|notification|konto|profil|logow|powiadom/i],
  ['listing_facts', /listing|room|flat|apartment|furnished|available|ogłoszen|pokój|mieszkan|umeblow/i],
];

export function routeOnloIntent(question: string, scope: OnloScope): OnloIntent {
  for (const [intent, pattern] of patterns) if (pattern.test(question)) return intent;
  if (scope === 'listing') return 'listing_facts';
  if (scope === 'application') return 'application_status';
  if (scope === 'thread') return 'conversation_help';
  return 'general';
}

export function toolsForIntent(intent: OnloIntent, hasListing: boolean): OnloToolName[] {
  const tools: OnloToolName[] = ['search_verified_knowledge'];
  if (hasListing) tools.push('get_listing_facts', 'find_listing_contradictions');
  if (intent === 'costs' && hasListing) tools.push('calculate_known_monthly_cost');
  if (intent === 'application_status') tools.push('get_application_status');
  if (intent === 'conversation_help') tools.push('summarise_conversation');
  if (intent === 'legal_process') tools.push('get_handover_checklist');
  return [...new Set(tools)].slice(0, 5);
}

export function validateEvidenceAnswer(
  rawAnswer: string,
  allowedCitationCount: number,
  locale: OnloLocale,
  hasVerifiedMaterial: boolean,
  allowListingCitation = false,
): OnloEvidenceValidation {
  const citations = [...rawAnswer.matchAll(/\[(\d+)]/g)].map((match) => Number(match[1]));
  const invalid = citations.some((citation) => citation < 0 || citation > allowedCitationCount || (citation === 0 && !allowListingCitation));
  const missing = hasVerifiedMaterial && citations.length === 0;
  if (invalid) {
    return {
      answer: locale === 'pl'
        ? 'Nie mogę bezpiecznie potwierdzić tej odpowiedzi na podstawie dostępnych źródeł. Sprawdź szczegóły w ogłoszeniu lub u właściwego uczestnika.'
        : 'I cannot safely confirm that answer from the available sources. Check the listing or confirm the details with the relevant participant.',
      confidence: 'unverified',
      citationStatus: 'invalid',
      needsHuman: true,
    };
  }
  return {
    answer: rawAnswer,
    confidence: missing ? 'partial' : hasVerifiedMaterial ? 'verified' : 'unverified',
    citationStatus: missing ? 'missing' : citations.length ? 'valid' : 'not_required',
    needsHuman: !hasVerifiedMaterial,
  };
}

export function proactiveActions(intent: OnloIntent, locale: OnloLocale, hasListing: boolean): OnloSuggestedAction[] {
  const polish = locale === 'pl';
  const actions: OnloSuggestedAction[] = [];
  if (hasListing) {
    actions.push({
      id: 'review-costs', kind: 'ask', requiresConfirmation: false,
      label: polish ? 'Sprawdź pełny koszt' : 'Check the full cost',
      prompt: polish ? 'Jaki jest pełny znany miesięczny koszt tego ogłoszenia?' : 'What is the full known monthly cost of this listing?',
    });
  }
  if (intent === 'safety' || intent === 'listing_facts') {
    actions.push({
      id: 'safety-check', kind: 'ask', requiresConfirmation: false,
      label: polish ? 'Pokaż kontrolę bezpieczeństwa' : 'Show safety checks',
      prompt: polish ? 'Jakie kontrole bezpieczeństwa mam wykonać przed zapłatą?' : 'What safety checks should I complete before paying?',
    });
  }
  if (intent === 'legal_process' || intent === 'application_status') {
    actions.push({
      id: 'next-steps', kind: 'ask', requiresConfirmation: false,
      label: polish ? 'Pokaż następne kroki' : 'Show next steps',
      prompt: polish ? 'Jakie są moje następne kroki i co wymaga potwierdzenia?' : 'What are my next steps and what still needs confirmation?',
    });
  }
  return actions.slice(0, 3);
}
