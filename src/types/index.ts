export interface CurrentTenant {
  name: string;
  nationality: string;
  role: string;
  avatar: string;
  verifiedDocs: string[];
  reasonForLeaving: string;
  joinedYear: string;
}

export interface Listing {
  id: string;
  type: 'lease_takeover';
  title: string;
  city: 'Kraków' | 'Warsaw' | 'Wrocław' | 'Gdańsk' | 'Lublin' | string;
  district: string;
  address: string;
  roomType: 'Private room' | 'Studio' | '1-bedroom' | '2-bedroom' | string;
  monthlyRentPLN: number;
  czynszAdminPLN: number;
  billsIncluded: boolean;
  czynszIncluded?: boolean;
  depositPLN: number;
  availableDate: string;
  leaseEndDate: string;
  remainingMonths: number;
  squareMeters: number;
  isFurnished: boolean;
  flatmatesCount: number;
  distanceToCampus: string;
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
