import { backend } from './backend';
import { api } from '../../convex/_generated/api';
import type { Place, Thread, Message, Notification, SavedPlace, Relok8User, HandoverChecklist, Invitation, Announcement } from '../types/relok8';
const read = (operation: string, input: any = {}): Promise<any> => backend().query(api.domain.read, { operation, input });
const write = (operation: string, input: any = {}): Promise<any> => backend().mutation(api.domain.write, { operation, input });
export const getActiveUserId = (): string => { try { return JSON.parse(localStorage.getItem('r8_user') || 'null')?.id || ''; } catch { return ''; } };
export const setActiveUserId = (_id: string): void => { throw new Error('Sign in with your own account; role simulation is disabled.'); };
export const getPlaces = (params?: any): Promise<Place[]> => read('places', params || {});
export const getPlace = (id: string): Promise<Place | null> => read('place', { id });
export const updatePlace = (placeId: string, updates: Partial<Place>): Promise<Place> => write('updatePlace', { placeId, updates });
export const deletePlace = (placeId: string): Promise<boolean> => write('deletePlace', { placeId });
export const requestExit = (placeId: string, leaveDate: string, notes?: string): Promise<Place> => write('requestExit', { placeId, leaveDate, ...(notes ? { notes } : {}) });
export const cancelExit = (placeId: string): Promise<Place> => write('cancelExit', { placeId });
export const decideExit = (placeId: string, decision: 'approve' | 'suggest_date' | 'decline', reasonOrDate?: string): Promise<Place> => write('decideExit', { placeId, decision, ...(reasonOrDate ? { reasonOrDate } : {}) });
export const approveReplacement = (placeId: string, prospectId: string): Promise<Place> => write('approveReplacement', { placeId, prospectId });
export const updateHandoverChecklist = (placeId: string, checklist: Partial<HandoverChecklist>): Promise<Place> => write('checklist', { placeId, checklist });
export const getThreads = (placeId?: string): Promise<Thread[]> => read('threads', placeId ? { placeId } : {});
export const getThread = (id: string): Promise<Thread | null> => read('thread', { id });
export const createOrGetThread = (placeId: string): Promise<Thread> => write('createThread', { placeId });
export const getThreadMessages = async (threadId: string): Promise<Message[]> => { const messages = await read('messages', { threadId }); await write('markThreadRead', { threadId }).catch(() => {}); return messages; };
export const sendThreadMessage = (threadId: string, body: string): Promise<{ message: Message; thread: Thread; onloReply?: Message }> => write('sendMessage', { threadId, body });
export const takeOverThread = (threadId: string): Promise<Thread> => write('takeover', { threadId });
export const askOnloNow = (threadId: string): Promise<{ reply: Message; thread: Thread }> => write('askOnlo', { threadId });
export const getPlaceRoomMessages = (placeId: string): Promise<Message[]> => read('roomMessages', { placeId });
export const sendPlaceRoomMessage = (placeId: string, body: string): Promise<Message> => write('roomMessage', { placeId, body });
export const onloSuggestReply = (threadId: string): Promise<string> => backend().action(api.services.helper, { action: 'suggest', threadId });
export const onloSummariseChat = (threadId: string): Promise<string> => backend().action(api.services.helper, { action: 'summarise', threadId });
export const onloTranslate = (text: string, targetLang: 'en' | 'pl'): Promise<string> => backend().action(api.services.helper, { action: 'translate', text, targetLang });
export const getSavedPlaces = (): Promise<SavedPlace[]> => read('saved');
export const toggleSavedPlace = (placeId: string): Promise<{ saved: boolean }> => write('toggleSaved', { placeId });
export const getNotifications = (): Promise<Notification[]> => read('notifications');
export const markNotificationRead = (id: string): Promise<void> => write('markRead', { id });
export const getRewards = (userId?: string): Promise<any> => read('rewards', userId ? { userId } : {});
export const getAnnouncement = (placeId: string): Promise<Announcement | null> => read('announcement', { placeId });
export const shareAnnouncementWhatsApp = (placeId: string): Promise<{ channelUrl: string; announcement: Announcement }> => write('shareAnnouncement', { placeId });
export const createInvitation = (placeId: string, email: string, role: 'tenant' | 'landlord'): Promise<Invitation> => {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, '0')).join('');
  return write('invitation', { placeId, email, role, token });
};
export const acceptInvitation = (token: string): Promise<{ success: boolean; place: Place }> => write('acceptInvitation', { token });
export const getDevUsers = async (): Promise<Relok8User[]> => { const user = await getCurrentDevUser(); return user ? [user] : []; };
export const getCurrentDevUser = (): Promise<Relok8User | null> => read('currentUser');
export const updateUserAvailability = (isAvailable: boolean, quietHours?: { enabled: boolean; start: string; end: string }): Promise<Relok8User> => write('availability', { isAvailable, ...(quietHours ? { quietHours } : {}) });
export function startPolling(callback: () => void | Promise<void>, intervalMs = 3000): () => void {
  let pending = false;
  const timer = setInterval(async () => { if (pending) return; pending = true; try { await callback(); } catch { /* Screens display their own load errors. */ } finally { pending = false; } }, intervalMs);
  return () => clearInterval(timer);
}

export async function uploadListingPhotos(images: string[]): Promise<string[]> {
  if (images.length > 12) throw new Error('Choose at most 12 photos.');
  const urls: string[] = [];
  for (const source of images) {
    if (!source.startsWith('data:image/')) throw new Error('Upload photos from your device.');
    const blob = await (await fetch(source)).blob();
    if (!['image/jpeg','image/png','image/webp'].includes(blob.type) || blob.size > 1500000) throw new Error('Choose JPEG, PNG, or WebP photos below 1.5 MB.');
    const uploadUrl = await backend().mutation(api.uploads.generateUploadUrl, {});
    const response = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': blob.type }, body: blob });
    if (!response.ok) throw new Error('Photo upload failed. Please try again.');
    const { storageId } = await response.json();
    urls.push(await backend().mutation(api.uploads.claim, { storageId }));
  }
  return urls;
}
