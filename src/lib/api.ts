import { backend } from './backend';
import { api } from '../../convex/_generated/api';
import type { Place, Thread, Message, Notification, Relok8User } from '../types/relok8';
const read = (operation: string, input: any = {}): Promise<any> => backend().query(api.domain.read, { operation, input });
const write = (operation: string, input: any = {}): Promise<any> => backend().mutation(api.domain.write, { operation, input });
export const getPlaces = (params?: any): Promise<Place[]> => read('places', params || {});
export const getThreads = (placeId?: string): Promise<Thread[]> => read('threads', placeId ? { placeId } : {});
export const createOrGetThread = (placeId: string): Promise<Thread> => write('createThread', { placeId });
export const getThreadMessages = async (threadId: string): Promise<Message[]> => { const messages = await read('messages', { threadId }); await write('markThreadRead', { threadId }).catch(() => {}); return messages; };
export const sendThreadMessage = (threadId: string, body: string): Promise<{ message: Message; thread: Thread; onloReply?: Message }> => write('sendMessage', { threadId, body });
export const takeOverThread = (threadId: string): Promise<Thread> => write('takeover', { threadId });
export const askOnloNow = (threadId: string, locale: 'en' | 'pl' = 'en'): Promise<{ draft: { id: string; content: string }; thread: Thread }> => backend().action((api as any).services.threadAssistant, { threadId, locale });
export const getPlaceRoomMessages = (placeId: string): Promise<Message[]> => read('roomMessages', { placeId });
export const sendPlaceRoomMessage = (placeId: string, body: string): Promise<Message> => write('roomMessage', { placeId, body });
export const onloTranslate = (text: string, targetLang: 'en' | 'pl'): Promise<string> => backend().action(api.services.helper, { action: 'translate', text, targetLang });
export const getNotifications = (): Promise<Notification[]> => read('notifications');
export const markNotificationRead = (id: string): Promise<void> => write('markRead', { id });
export const getRewards = (userId?: string): Promise<any> => read('rewards', userId ? { userId } : {});
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
