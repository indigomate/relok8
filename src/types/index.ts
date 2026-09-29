export interface DepartingTenant {
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
  title: string;
  shortTitle?: string;
  city: 'Warsaw' | 'Kraków' | 'Wrocław' | 'Gdańsk' | 'Poznań' | 'Lublin';
  district: string;
  address: string;
  roomType: 'Studio' | '1-Bedroom' | '2-Bedroom' | 'Private Room';
  monthlyRentPLN: number;
  czynszAdminPLN: number;
  czynszIncluded: boolean;
  depositPLN: number; // Kaucja
  availableDate: string;
  leaseEndDate: string;
  remainingMonths: number;
  images: string[];
  isFireSale?: boolean;
  isGuestFavorite?: boolean;
  isVerifiedTransfer?: boolean;
  meldunekAllowed: boolean; // Address registration allowed for PESEL / TRC
  isFurnished: boolean;
  flatmatesInfo: string; // e.g. "Entire apartment" or "Shared with 2 students"
  transitInfo: string; // e.g. "6 min walk to SGH · Metro M1"
  landlordConsentStatus: 'Guaranteed Consent' | 'Pre-Approved' | 'Consent in Progress';
  landlordName: string;
  landlordContactEmail: string;
  departingTenant: DepartingTenant;
  amenities: string[];
  universitiesNearby: string[];
  metroNearby?: string;
  description: string;
  squareMeters: number;
  floor: string;
  depositSettlementType: 'P2P Direct Clearing' | 'Escrow Guarded';
  likesCount?: number;
  lat?: number;
  lng?: number;
}

export interface DepositClearingRecord {
  id: string;
  listingId: string;
  listingTitle: string;
  amountPLN: number;
  departingTenantName: string;
  incomingTenantName: string;
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
  departingName: string;
  departingPassport: string;
  departingAddress: string;
  departingIban: string;
  incomingName: string;
  incomingPassport: string;
  incomingAddress: string;
  incomingAffiliation: string;
  propertyAddress: string;
  originalLeaseDate: string;
  monthlyRentPLN: number;
  depositPLN: number;
  inspectionProtocolDate: string;
}

export type SubscriptionTier = 'student' | 'expat' | 'corporate';
