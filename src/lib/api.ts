/**
 * Relok8 Client API Layer (Section 4)
 * Connects directly to server.ts Express REST endpoints, backed by persistent data/*.json.
 * Polling helper every 3s (no WebSockets).
 * Each function maps 1:1 to future Convex queries and mutations.
 */

import {
  Place,
  Thread,
  Message,
  Notification,
  SavedPlace,
  RewardEvent,
  Announcement,
  Invitation,
  Relok8User,
  UserRole,
  RewardConfig,
  InsurancePlanConfig,
  HandoverChecklist
} from '../types/relok8';

const BASE_URL = '/api';

/** Active user simulation for testing (synced with localStorage & role switcher) */
export const getActiveUserId = (): string => {
  return localStorage.getItem('r8_simulated_user_id') || 'user-mateo';
};

export const setActiveUserId = (userId: string): void => {
  localStorage.setItem('r8_simulated_user_id', userId);
};

const getHeaders = (): HeadersInit => {
  return {
    'Content-Type': 'application/json',
    'x-user-id': getActiveUserId(),
  };
};

// ==========================================
// 1. PLACES (Mapped to queries & mutations)
// ==========================================

export async function getPlaces(params?: {
  city?: string;
  status?: string;
  near?: string;
  maxCommute?: number;
}): Promise<Place[]> {
  const query = new URLSearchParams();
  if (params?.city) query.set('city', params.city);
  if (params?.status) query.set('status', params.status);
  if (params?.near) query.set('near', params.near);
  if (params?.maxCommute !== undefined) query.set('maxCommute', String(params.maxCommute));

  const res = await fetch(`${BASE_URL}/places?${query.toString()}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch places');
  return res.json();
}

export async function getPlace(id: string): Promise<Place | null> {
  const res = await fetch(`${BASE_URL}/places/${id}`, {
    headers: getHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch place ${id}`);
  return res.json();
}

export async function updatePlace(id: string, updates: Partial<Place>): Promise<Place> {
  const res = await fetch(`${BASE_URL}/places/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Failed to update place ${id}`);
  return res.json();
}

export async function deletePlace(id: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/places/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (res.status === 404) {
    const fallback = await fetch(`${BASE_URL}/listings/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return fallback.ok;
  }
  return res.ok;
}

export async function requestExit(
  placeId: string,
  leaveDate: string,
  notes?: string
): Promise<Place> {
  const res = await fetch(`${BASE_URL}/places/${placeId}/exit`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ leaveDate, notes }),
  });
  if (!res.ok) throw new Error('Failed to submit exit request');
  return res.json();
}

export async function cancelExit(placeId: string): Promise<Place> {
  const res = await fetch(`${BASE_URL}/places/${placeId}/exit/cancel`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to cancel exit request');
  return res.json();
}

export async function decideExit(
  placeId: string,
  decision: 'approve' | 'suggest_date' | 'decline',
  reasonOrDate?: string
): Promise<Place> {
  const res = await fetch(`${BASE_URL}/places/${placeId}/exit/decision`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ decision, reasonOrDate }),
  });
  if (!res.ok) throw new Error('Failed to process exit decision');
  return res.json();
}

export async function approveReplacement(
  placeId: string,
  prospectId: string
): Promise<Place> {
  const res = await fetch(`${BASE_URL}/places/${placeId}/approve-replacement`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ prospectId }),
  });
  if (!res.ok) throw new Error('Failed to approve replacement');
  return res.json();
}

export async function updateHandoverChecklist(
  placeId: string,
  checklist: Partial<HandoverChecklist>
): Promise<Place> {
  const res = await fetch(`${BASE_URL}/places/${placeId}/checklist`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(checklist),
  });
  if (!res.ok) throw new Error('Failed to update handover checklist');
  return res.json();
}

// ==========================================
// 2. THREADS & MESSAGING
// ==========================================

export async function getThreads(placeId?: string): Promise<Thread[]> {
  const url = placeId ? `${BASE_URL}/threads?placeId=${placeId}` : `${BASE_URL}/threads`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch threads');
  return res.json();
}

export async function getThread(id: string): Promise<Thread | null> {
  const res = await fetch(`${BASE_URL}/threads/${id}`, { headers: getHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch thread');
  return res.json();
}

export async function createOrGetThread(placeId: string): Promise<Thread> {
  const res = await fetch(`${BASE_URL}/threads`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ placeId }),
  });
  if (!res.ok) throw new Error('Failed to initiate thread');
  return res.json();
}

export async function getThreadMessages(threadId: string): Promise<Message[]> {
  const res = await fetch(`${BASE_URL}/threads/${threadId}/messages`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch thread messages');
  return res.json();
}

export async function sendThreadMessage(
  threadId: string,
  body: string
): Promise<{ message: Message; thread: Thread; onloReply?: Message }> {
  const res = await fetch(`${BASE_URL}/threads/${threadId}/messages`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

export async function takeOverThread(threadId: string): Promise<Thread> {
  const res = await fetch(`${BASE_URL}/threads/${threadId}/takeover`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to take over thread');
  return res.json();
}

export async function askOnloNow(threadId: string): Promise<{ reply: Message; thread: Thread }> {
  const res = await fetch(`${BASE_URL}/threads/${threadId}/ask-onlo`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to trigger Onlo');
  return res.json();
}

// ==========================================
// 3. PLACE ROOM (Private Tenant <-> Landlord)
// ==========================================

export async function getPlaceRoomMessages(placeId: string): Promise<Message[]> {
  const res = await fetch(`${BASE_URL}/place-room/${placeId}/messages`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch Place Room messages');
  return res.json();
}

export async function sendPlaceRoomMessage(
  placeId: string,
  body: string
): Promise<Message> {
  const res = await fetch(`${BASE_URL}/place-room/${placeId}/messages`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error('Failed to send Place Room message');
  return res.json();
}

// ==========================================
// 4. ONLO COMPOSER HELPERS (Suggest, Summarise, Translate)
// ==========================================

export async function onloSuggestReply(threadId: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/onlo/helper`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ threadId, action: 'suggest' }),
  });
  if (!res.ok) throw new Error('Failed to generate suggestion');
  const data = await res.json();
  return data.text;
}

export async function onloSummariseChat(threadId: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/onlo/helper`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ threadId, action: 'summarise' }),
  });
  if (!res.ok) throw new Error('Failed to summarise conversation');
  const data = await res.json();
  return data.text;
}

export async function onloTranslate(text: string, targetLang: 'en' | 'pl'): Promise<string> {
  const res = await fetch(`${BASE_URL}/onlo/helper`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ text, targetLang, action: 'translate' }),
  });
  if (!res.ok) throw new Error('Failed to translate text');
  const data = await res.json();
  return data.text;
}

// ==========================================
// 5. SAVED PLACES & NOTIFICATIONS
// ==========================================

export async function getSavedPlaces(): Promise<SavedPlace[]> {
  const res = await fetch(`${BASE_URL}/saved-places`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch saved places');
  return res.json();
}

export async function toggleSavedPlace(placeId: string): Promise<{ saved: boolean }> {
  const res = await fetch(`${BASE_URL}/saved-places`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ placeId }),
  });
  if (!res.ok) throw new Error('Failed to toggle save');
  return res.json();
}

export async function getNotifications(): Promise<Notification[]> {
  const res = await fetch(`${BASE_URL}/notifications`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

export async function markNotificationRead(id: string): Promise<void> {
  await fetch(`${BASE_URL}/notifications/${id}/read`, {
    method: 'POST',
    headers: getHeaders(),
  });
}

// ==========================================
// 6. REWARDS & INSURANCE
// ==========================================

export async function getRewards(userId?: string): Promise<{
  points: number;
  unlocked: boolean;
  events: RewardEvent[];
  config: RewardConfig;
  insuranceConfig: InsurancePlanConfig;
}> {
  const targetId = userId || getActiveUserId();
  const res = await fetch(`${BASE_URL}/rewards/${targetId}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch rewards');
  return res.json();
}

// ==========================================
// 7. ANNOUNCEMENTS & WHATSAPP
// ==========================================

export async function getAnnouncement(placeId: string): Promise<Announcement | null> {
  const res = await fetch(`${BASE_URL}/announcements/${placeId}`, {
    headers: getHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch announcement');
  return res.json();
}

export async function shareAnnouncementWhatsApp(
  placeId: string
): Promise<{ channelUrl: string; announcement: Announcement }> {
  const res = await fetch(`${BASE_URL}/announcements/${placeId}/share-whatsapp`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to share announcement');
  return res.json();
}

// ==========================================
// 8. INVITATIONS (Linking Tenant <-> Landlord)
// ==========================================

export async function createInvitation(
  placeId: string,
  email: string,
  role: 'tenant' | 'landlord'
): Promise<Invitation> {
  const res = await fetch(`${BASE_URL}/invitations`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ placeId, email, role }),
  });
  if (!res.ok) throw new Error('Failed to create invitation');
  return res.json();
}

export async function acceptInvitation(token: string): Promise<{ success: boolean; place: Place }> {
  const res = await fetch(`${BASE_URL}/invitations/${token}/accept`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to accept invitation');
  return res.json();
}

// ==========================================
// 9. USERS & DEVELOPER ROLE SWITCHER
// ==========================================

export async function getDevUsers(): Promise<Relok8User[]> {
  const res = await fetch(`${BASE_URL}/dev/users`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch dev users');
  return res.json();
}

export async function getCurrentDevUser(): Promise<Relok8User | null> {
  const res = await fetch(`${BASE_URL}/dev/current-user`, { headers: getHeaders() });
  if (!res.ok) return null;
  return res.json();
}

export async function updateUserAvailability(
  isAvailable: boolean,
  quietHours?: { enabled: boolean; start: string; end: string }
): Promise<Relok8User> {
  const res = await fetch(`${BASE_URL}/dev/availability`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ isAvailable, quietHours }),
  });
  if (!res.ok) throw new Error('Failed to update availability');
  return res.json();
}

// ==========================================
// 10. POLLING HELPER (Section 4: 3-second poll)
// ==========================================

export function startPolling(callback: () => void | Promise<void>, intervalMs = 3000): () => void {
  const timer = setInterval(() => {
    callback();
  }, intervalMs);

  return () => clearInterval(timer);
}
