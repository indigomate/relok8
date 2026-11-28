import type { OnloLocale } from './onloAgent';

const listingFields = [
  '_id', 'title', 'city', 'district', 'monthlyRent', 'deposit', 'czynszAdmin', 'billsIncluded',
  'billsMode', 'fixedBillsPLN', 'roomType', 'areaM2', 'floor', 'moveInDate', 'leaseEndDate',
  'isFurnished', 'flatmatesCount', 'distanceToCampus', 'meldunekAllowed', 'universitiesNearby',
  'transitNearby', 'status', 'occupancyStatus', 'isLocked',
] as const;

export function verifiedListingFacts(listing: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!listing) return null;
  const facts: Record<string, unknown> = {};
  for (const field of listingFields) {
    const value = listing[field];
    if (value !== undefined && value !== null && value !== '') facts[field] = value;
  }
  return facts;
}

export function knownMonthlyCost(listing: Record<string, unknown> | null | undefined) {
  if (!listing) return null;
  const rent = Number(listing.monthlyRent || 0);
  const administration = Number(listing.czynszAdmin || 0);
  const fixedBills = listing.billsMode === 'fixed' ? Number(listing.fixedBillsPLN || 0) : 0;
  const knownTotal = rent + administration + fixedBills;
  return {
    currency: 'PLN',
    monthlyRent: rent,
    administration,
    fixedBills,
    knownTotal,
    usageBillsExcluded: listing.billsMode === 'usage' || (!listing.billsIncluded && listing.billsMode !== 'fixed'),
    depositSeparate: Number(listing.deposit || 0),
  };
}

export function listingContradictions(listing: Record<string, unknown> | null | undefined, locale: OnloLocale): string[] {
  if (!listing) return [];
  const pl = locale === 'pl';
  const warnings: string[] = [];
  if (listing.billsMode === 'fixed' && !Number(listing.fixedBillsPLN || 0)) {
    warnings.push(pl ? 'Rachunki są oznaczone jako stałe, ale kwota nie została podana.' : 'Bills are marked as fixed, but no fixed amount is provided.');
  }
  if (!listing.billsIncluded && !listing.billsMode) {
    warnings.push(pl ? 'Sposób naliczania rachunków nie został określony.' : 'The method for calculating bills is not specified.');
  }
  const start = Date.parse(String(listing.moveInDate || ''));
  const end = Date.parse(String(listing.leaseEndDate || ''));
  if (Number.isFinite(start) && Number.isFinite(end) && start > end) {
    warnings.push(pl ? 'Data wprowadzenia jest późniejsza niż data zakończenia umowy.' : 'The move-in date is later than the lease-end date.');
  }
  if (listing.meldunekAllowed === undefined) {
    warnings.push(pl ? 'Możliwość meldunku nie została potwierdzona.' : 'Meldunek availability has not been confirmed.');
  }
  return warnings;
}

export function handoverChecklist(locale: OnloLocale): string[] {
  return locale === 'pl'
    ? ['pisemna zgoda wynajmującego', 'podpisany dokument przejęcia', 'protokół i zdjęcia', 'stany liczników', 'lista kluczy', 'potwierdzenie kaucji i płatności']
    : ['written landlord consent', 'signed takeover document', 'handover report and photos', 'meter readings', 'key inventory', 'deposit and payment confirmation'];
}
