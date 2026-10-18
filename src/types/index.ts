export interface CurrentTenant {
  name: string;
  nationality: string;
  role: string;
  avatar: string;
  verifiedDocs: string[];
  reasonForLeaving: string;
  joinedYear: string;
}

export interface Money {
  amountMinor: number; // integer minor units (grosze / cents)
  currency: string;    // "PLN"
}

export function toMoney(pln: number, currency = 'PLN'): Money {
  return {
    amountMinor: Math.round(pln * 100),
    currency
  };
}

export function fromMoney(m: Money | undefined, fallbackPln = 0): number {
  if (!m) return fallbackPln;
  return Math.round(m.amountMinor / 100);
}

export interface DistanceItem {
  label: string;
  minutes: number;
  mode: 'walk' | 'bus' | 'tram' | 'metro' | 'bike' | string;
}

export interface Listing {
  id: string;
  type: 'lease_takeover' | string;
  kind?: 'takeover' | 'rental' | 'stay'; // Target schema (§4.2)
  source?: 'landlord' | 'tenant_exit' | 'university';
  title: string;
  city: 'Kraków' | 'Warsaw' | 'Wrocław' | 'Gdańsk' | 'Lublin' | string;
  district: string;
  address: string;
  roomType: 'Private room' | 'Studio' | '1-bedroom' | '2-bedroom' | string;
  monthlyRentPLN: number;
  price?: Money; // Structured integer minor unit
  czynszAdminPLN: number;
  utilities?: Money;
  billsIncluded: boolean;
  czynszIncluded?: boolean;
  depositPLN: number;
  deposit?: Money;
  availableDate: string;
  leaseEndDate: string;
  remainingMonths: number;
  squareMeters: number;
  isFurnished: boolean;
  flatmatesCount: number;
  distanceToCampus: string;
  distances?: DistanceItem[]; // User-entered distances (§1.3 Rule 11)
  commuteNote?: string;
  commuteMinutes?: number;
  nearInstitutions?: string[];
  meldunekAllowed: boolean;
  landlordApproved: boolean;
  landlordConsentStatus?: string;
  images: string[];
  statusBadge?: string;
  landlordName: string;
  landlordContactEmail: string;
  currentTenant: CurrentTenant;
  departingTenant?: CurrentTenant;
  amenities: string[];
  universitiesNearby: string[];
  transitNearby?: string;
  transitInfo?: string;
  metroNearby?: string;
  description: string;
  floor: string;
  depositSettlementType?: string;
  likesCount?: number;
  lat?: number;
  lng?: number;
  isExample?: boolean;
}

/**
 * Checks if a listing is a sample/demo/mock listing per Truth Rules.
 */
export function isExampleListing(listing: { id?: string; isExample?: boolean }): boolean {
  if (listing.isExample === true) return true;
  if (!listing.id) return false;
  // If explicitly uploaded by the user in this session, it's not an example listing
  try {
    const rawMy = localStorage.getItem('r8_my_listing_ids');
    if (rawMy) {
      const myIds: string[] = JSON.parse(rawMy);
      if (myIds.includes(listing.id)) return false;
    }
  } catch {}
  return (
    listing.id.startsWith('cx_list_') ||
    listing.id.startsWith('mock_') ||
    listing.id.startsWith('demo_') ||
    listing.id.startsWith('place-') ||
    listing.id.startsWith('rel-sim-')
  );
}

export interface DepositClearingRecord {
  id: string;
  listingId: string;
  listingTitle: string;
  amountPLN: number;
  currentTenantName: string;
  departingTenantName?: string;
  newTenantName: string;
  incomingTenantName?: string;
  landlordName: string;
  status: 'protocol_pending' | 'landlord_consent' | 'escrow_locked' | 'settled';
  inspectionDate: string;
  meterElectricity: string;
  meterWater: string;
  meterHeating: string;
  landlordConsentSigned: boolean;
  tenantInspectionSigned: boolean;
  depositTransferred: boolean;
  receiptIssuedDate?: string;
}

export interface CesjaAgreementData {
  contractNumber: string;
  city: string;
  date: string;
  effectiveDate: string;
  landlordName: string;
  landlordId: string;
  landlordAddress: string;
  currentTenantName?: string;
  departingName?: string;
  currentTenantPassport?: string;
  departingPassport?: string;
  currentTenantAddress?: string;
  departingAddress?: string;
  currentTenantIban?: string;
  departingIban?: string;
  newTenantName?: string;
  incomingName?: string;
  newTenantPassport?: string;
  incomingPassport?: string;
  newTenantAddress?: string;
  incomingAddress?: string;
  newTenantAffiliation?: string;
  incomingAffiliation?: string;
  propertyAddress: string;
  originalLeaseDate: string;
  monthlyRentPLN: number;
  depositPLN: number;
  inspectionProtocolDate: string;
}

export type SubscriptionTier = 'student' | 'expat' | 'corporate';
