/**
 * Relok8 Core Domain Types (Section 4)
 * Shared place model where the current tenant and landlord look at the same home.
 */

export type PlaceStatus =
  | 'occupied'
  | 'exit_requested'
  | 'available_for_takeover'
  | 'reserved'
  | 'handed_over';

export interface HandoverChecklist {
  agreementSigned: boolean;
  depositTransferred: boolean;
  keysHandedOver: boolean;
  meldunekCompleted: boolean;
}

export interface Place {
  id: string;
  landlordId: string;
  tenantId: string;
  title: string;
  city: string;
  district: string;
  address: string;
  rentPLN: number;
  czynszPLN: number;
  depositPLN: number;
  availableFrom: string;
  roomType: string;
  flatmates: number;
  furnished: boolean;
  billsIncluded: boolean;
  meldunekOk: boolean;
  commuteNote: string; // e.g. '12 min tram to UMCS, checked on Google Maps'
  commuteMinutes?: number;
  nearInstitutions: string[];
  photos: string[];
  status: PlaceStatus;
  leaveDate?: string;
  rules: string; // free text for Onlo to answer from
  exitNotes?: string;
  replacementProspectId?: string;
  handoverChecklist?: HandoverChecklist;
  landlordBedPricePLN?: number; // 39 PLN per bed per month (display only)
}

export type ThreadStatus = 'open' | 'needs_human' | 'reserved' | 'closed';
export type HandledBy = 'tenant' | 'landlord' | 'onlo';

export interface Thread {
  id: string;
  placeId: string;
  prospectId: string;
  status: ThreadStatus;
  handledBy: HandledBy;
  lastMessageAt: number;
  unreadFor: string[]; // array of user IDs
}

export type MessageAuthorType = 'prospect' | 'tenant' | 'landlord' | 'onlo' | 'system';

export interface Message {
  id: string;
  threadId: string;
  authorType: MessageAuthorType;
  authorId: string;
  onBehalfOf?: 'tenant' | 'landlord'; // only when authorType === 'onlo'
  body: string;
  createdAt: number;
}

export type NotificationType =
  | 'message'
  | 'saved_available'
  | 'price_change'
  | 'exit_request'
  | 'reward'
  | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  placeId?: string;
  body: string;
  readAt?: number;
  createdAt: number;
}

export interface SavedPlace {
  userId: string;
  placeId: string;
  notifyWhenAvailable: boolean; // default true
  savedAt?: number;
}

export type RewardKind = 'reply' | 'viewing_booked' | 'handover_completed';

export interface RewardEvent {
  id: string;
  userId: string;
  placeId: string;
  threadId?: string;
  kind: RewardKind;
  points: number;
  createdAt: number;
  description?: string;
}

export interface Announcement {
  id: string;
  placeId: string;
  text: string;
  channel: 'whatsapp';
  status: 'drafted' | 'shared' | 'failed';
  createdAt: number;
}

export interface Invitation {
  id: string;
  placeId: string;
  role: 'tenant' | 'landlord';
  email: string;
  token: string;
  acceptedAt?: number;
  createdAt?: number;
}

export type UserRole = 'prospect' | 'tenant' | 'landlord';

export interface Relok8User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  isVerified: boolean;
  university?: string;
  isAvailable: boolean;
  quietHours?: {
    enabled: boolean;
    start: string; // e.g. "22:00"
    end: string;   // e.g. "07:00"
  };
  whatsappAlertsOptIn?: boolean;
}

export interface RewardConfig {
  replyPoints: number;
  viewingPoints: number;
  handoverPoints: number;
  thresholdPoints: number;
  discountPercent: number;
  maxPointsPerThread: number;
  minReplyLength: number;
  replyWindowHours: number;
}

export const DEFAULT_REWARD_CONFIG: RewardConfig = {
  replyPoints: 1,
  viewingPoints: 3,
  handoverPoints: 10,
  thresholdPoints: 15,
  discountPercent: 50,
  maxPointsPerThread: 3,
  minReplyLength: 20,
  replyWindowHours: 12,
};

export interface InsurancePlanConfig {
  name: string;
  basePricePLN: number | null | '[SET BY BUSINESS]';
  partnerName: string;
}

export const DEFAULT_INSURANCE_CONFIG: InsurancePlanConfig = {
  name: 'Relok8 Tenant Deposit & Contents Shield',
  basePricePLN: null, // [SET BY BUSINESS] placeholder
  partnerName: 'Relok8 Insurance Partner',
};

// Onlo cover timeout in milliseconds (2 minutes as specified in Section 5.4)
export const ONLO_COVER_TIMEOUT_MS = 2 * 60 * 1000;
