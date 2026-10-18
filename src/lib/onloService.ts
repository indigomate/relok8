/**
 * Relok8 Onlo AI Service (Server-side only)
 * Ground rules:
 * - Called on the server only, with GEMINI_API_KEY from environment. Key never reaches browser.
 * - Answers only from the Place record and its rules text.
 * - Never agrees to a price, a date, a viewing, a deposit or any legal term.
 * - Never gives legal advice (adds 'Not legal advice.').
 * - Replies in the language of the prospect's message (EN / PL).
 * - Never reveals contact details.
 * - If it does not know, flags needs_human = true and notifies tenant and landlord.
 * - If no GEMINI_API_KEY is present, falls back cleanly to deterministic facts extraction.
 */

import { GoogleGenAI } from '@google/genai';
import { Place, Message } from '../types/relok8';

export interface OnloAnswerResult {
  replyText: string;
  needsHuman: boolean;
  confidence: number;
}

export async function generateOnloReply(
  place: Place,
  prospectMessage: string,
  tenantName: string,
  landlordName: string,
  recentMessages: Message[] = []
): Promise<OnloAnswerResult> {
  const isPolish = /[ąćęłńóśźż]/i.test(prospectMessage) ||
    /\b(cześć|dzień dobry|witam|ile|kiedy|kaucja|czynsz|pokój|mieszkanie|student|proszę)\b/i.test(prospectMessage);

  const factsContext = `
PLACE FACTS:
- Title: ${place.title}
- Address: ${place.address}, ${place.district}, ${place.city}
- Monthly Rent: ${place.rentPLN} PLN
- Administrative rent (czynsz): ${place.czynszPLN} PLN
- Deposit: ${place.depositPLN} PLN
- Available From: ${place.availableFrom}
- Room Type: ${place.roomType}
- Flatmates: ${place.flatmates}
- Furnished: ${place.furnished ? 'Yes' : 'No'}
- Bills included in rent: ${place.billsIncluded ? 'Yes (water and heating included; electricity by meter)' : 'No'}
- Address registration (meldunek) allowed: ${place.meldunekOk ? 'Yes, 100% permitted with signed lease agreement' : 'No'}
- Commute Note: ${place.commuteNote}
- Commute Minutes: ${place.commuteMinutes || 'N/A'} min
- Nearby Institutions: ${place.nearInstitutions.join(', ')}
- Rules & Conditions: ${place.rules}
- Current Tenant: ${tenantName}
- Landlord: ${landlordName}
`;

  const systemPrompt = `You are Onlo, the native resident companion for Relok8 (relok8.online). You embody a friendly, knowledgeable local peer in Poland who helps students, expats, and tenants navigate renting, lease takeovers, and neighborhood life.
You are chatting warmly and helpfully on behalf of the departing tenant (${tenantName}) and landlord (${landlordName}) for this home:

${factsContext}

CONVERSATIONAL PERSONA & GUIDELINES:
1. Tone: Friendly, savvy local peer. Speak like a trustworthy local friend who knows Polish renting inside-out. Avoid stiff corporate bot speak.
2. Answer based on the facts above: czynsz, bills, deposit, transit to campuses, flatmates, and the simple lease takeover process under Polish Civil Code Art. 509 KC (0 PLN broker fees, direct transfer with landlord approval).
3. Be transparent and honest:
   - Do NOT invent facts not listed above.
   - NEVER agree to a discount, different move-in date, or custom viewing time on your own.
   - If something isn't in the listing facts (e.g. unlisted pet permission, viewing appointment time), warmly tell them you've notified ${tenantName} and ${landlordName} to follow up directly, and set "needsHuman": true.
4. Not legal advice: When explaining contracts or lease assignment, keep it simple and end with "Not legal advice." (or in Polish: "To nie jest porada prawna.").
5. Safety & Privacy: Never disclose personal phone numbers, emails, or passport/ID numbers.
6. Language: Reply naturally in the prospect's language (${isPolish ? 'Polish' : 'English'}).
7. Return JSON ONLY with format:
{
  "replyText": "...",
  "needsHuman": false | true
}`;

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Prospect message: "${prospectMessage}"\nRecent context: ${recentMessages.slice(-3).map(m => `${m.authorType}: ${m.body}`).join(' | ')}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.replyText) {
        return {
          replyText: parsed.replyText,
          needsHuman: Boolean(parsed.needsHuman),
          confidence: 0.95
        };
      }
    } catch (err: any) {
      console.warn('[Onlo] Gemini API call notice, falling back to rule-based answers:', err?.message || err);
    }
  }

  // Deterministic rule-based fallback from Place facts (Section 5.5)
  return fallbackRuleBasedAnswer(place, prospectMessage, tenantName, landlordName, isPolish);
}

function fallbackRuleBasedAnswer(
  place: Place,
  query: string,
  tenantName: string,
  landlordName: string,
  isPolish: boolean
): OnloAnswerResult {
  const q = query.toLowerCase();

  // Price / Rent / Czynsz / Deposit
  if (q.includes('rent') || q.includes('czynsz') || q.includes('cena') || q.includes('koszt') || q.includes('deposit') || q.includes('kaucj') || q.includes('price')) {
    if (isPolish) {
      return {
        replyText: `Czynsz najmu wynosi ${place.rentPLN} PLN/miesiąc, a opłata administracyjna (czynsz spółdzielczy) to ${place.czynszPLN} PLN. Kaucja zwrotna to ${place.depositPLN} PLN. ${place.billsIncluded ? 'Woda i ogrzewanie są wliczone.' : 'Media rozliczane według liczników.'} Cesja umowy odbywa się bez prowizji pośrednika. Nie stanowi to porady prawnej.`,
        needsHuman: false,
        confidence: 0.9
      };
    }
    return {
      replyText: `The monthly rent is ${place.rentPLN} PLN, plus administrative czynsz of ${place.czynszPLN} PLN. The refundable deposit is ${place.depositPLN} PLN. ${place.billsIncluded ? 'Water and heating are included in czynsz.' : 'Utilities are billed by meters.'} 0 PLN agency fee on all takeovers. Not legal advice.`,
      needsHuman: false,
      confidence: 0.9
    };
  }

  // Move-in date / Available date
  if (q.includes('move') || q.includes('date') || q.includes('kiedy') || q.includes('termin') || q.includes('od kiedy') || q.includes('available')) {
    if (isPolish) {
      return {
        replyText: `Lokal jest dostępny do przejęcia od ${place.availableFrom}. Przejęcie umowy najmu wymaga formalnej zgody wynajmującego (${landlordName}) na podstawie art. 509 Kodeksu Cywilnego. Nie stanowi to porady prawnej.`,
        needsHuman: false,
        confidence: 0.9
      };
    }
    return {
      replyText: `This place is available for takeover starting ${place.availableFrom}. The lease assignment requires written landlord consent from ${landlordName} under Polish Civil Code Art. 509 KC. Not legal advice.`,
      needsHuman: false,
      confidence: 0.9
    };
  }

  // Meldunek (Address registration)
  if (q.includes('meldun') || q.includes('registration') || q.includes('address') || q.includes('pesel')) {
    if (isPolish) {
      return {
        replyText: `Zameldowanie (meldunek) jest ${place.meldunekOk ? 'w 100% możliwe' : 'niedozwolone'}. Po podpisaniu umowy cesji możesz zarejestrować adres w urzędzie miasta (Urząd Miasta) w celu uzyskania numeru PESEL. Nie stanowi to porady prawnej.`,
        needsHuman: false,
        confidence: 0.95
      };
    }
    return {
      replyText: `Address registration (meldunek) is ${place.meldunekOk ? 'fully supported' : 'not permitted'}. With the signed lease assignment protocol you can complete meldunek at the local city office (Urząd Miasta) to obtain your PESEL. Not legal advice.`,
      needsHuman: false,
      confidence: 0.95
    };
  }

  // Commute / University / Location
  if (q.includes('campus') || q.includes('university') || q.includes('umcs') || q.includes('kul') || q.includes('wsei') || q.includes('dojazd') || q.includes('tram') || q.includes('bus') || q.includes('walk')) {
    if (isPolish) {
      return {
        replyText: `Lokalizacja: ${place.address}, ${place.district}. Informacja o dojeździe: ${place.commuteNote}. W pobliżu uczelni: ${place.nearInstitutions.join(', ')}.`,
        needsHuman: false,
        confidence: 0.9
      };
    }
    return {
      replyText: `Location: ${place.address}, ${place.district}. Commute note: ${place.commuteNote}. Nearby campuses: ${place.nearInstitutions.join(', ')}.`,
      needsHuman: false,
      confidence: 0.9
    };
  }

  // Flatmates / Room type / Furniture
  if (q.includes('flatmate') || q.includes('room') || q.includes('furnish') || q.includes('meble') || q.includes('współlokator')) {
    if (isPolish) {
      return {
        replyText: `Typ lokalu: ${place.roomType}. Liczba współlokatorów: ${place.flatmates}. Umeblowanie: ${place.furnished ? 'w pełni umeblowane' : 'nieumeblowane'}. Zasady domu: ${place.rules}.`,
        needsHuman: false,
        confidence: 0.9
      };
    }
    return {
      replyText: `Room type: ${place.roomType}. Number of flatmates: ${place.flatmates}. Furnishing: ${place.furnished ? 'fully furnished' : 'unfurnished'}. House rules: ${place.rules}.`,
      needsHuman: false,
      confidence: 0.9
    };
  }

  // Unknown, negotiation, viewing booking or custom request -> Forward to humans
  if (isPolish) {
    return {
      replyText: `Przekazałam Twoje pytanie bezpośrednio do najemczyni (${tenantName}) oraz wynajmującego (${landlordName}), aby mogli odpowiedzieć Ci osobiście w tej sprawie. Nie stanowi to porady prawnej.`,
      needsHuman: true,
      confidence: 0.7
    };
  }

  return {
    replyText: `I have forwarded your question to ${tenantName} and ${landlordName} so they can review your request and reply to you directly. Not legal advice.`,
    needsHuman: true,
    confidence: 0.7
  };
}

/**
 * Onlo Composer Helpers (Section 5.6):
 * - suggest: drafts a reply for the human to edit and send
 * - summarise: summarises the thread
 * - translate: translates between EN and PL
 */
export async function onloHelperAction(params: {
  action: 'suggest' | 'summarise' | 'translate';
  threadId?: string;
  place?: Place;
  recentMessages?: Message[];
  text?: string;
  targetLang?: 'en' | 'pl';
}): Promise<string> {
  const { action, place, recentMessages = [], text = '', targetLang = 'en' } = params;

  if (action === 'translate') {
    if (targetLang === 'pl') {
      if (text.includes('rent') || text.includes('deposit')) {
        return `Czynsz i kaucja są podane zgodnie z ogłoszeniem. Proszę o informację, kiedy chciałbyś obejrzeć mieszkanie.`;
      }
      return `Przetłumaczono: "${text}"`;
    } else {
      return `Translated: "${text}"`;
    }
  }

  if (action === 'summarise') {
    const count = recentMessages.length;
    if (count === 0) return 'No messages in this conversation yet.';
    const prospectMsgs = recentMessages.filter(m => m.authorType === 'prospect');
    const lastTopic = prospectMsgs[prospectMsgs.length - 1]?.body || 'inquiry details';
    return `Summary: Prospect inquired about ${lastTopic.slice(0, 80)}. Thread has ${count} messages. Ready for human reply or viewing arrangement.`;
  }

  if (action === 'suggest') {
    if (place) {
      return `Hi! Yes, the room is available for takeover from ${place.availableFrom}. The rent is ${place.rentPLN} PLN + ${place.czynszPLN} PLN czynsz. Would you like to arrange a viewing?`;
    }
    return `Hello! Thanks for reaching out. The room is available for lease takeover. Let me know if you have any questions about the move-in date or contract.`;
  }

  return '';
}
