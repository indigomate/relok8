/**
 * Relok8 Persistent Store & Seed Data (Section 4 & 12)
 * Manages JSON file persistence in data/*.json and initial Lublin seed data.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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
  DEFAULT_REWARD_CONFIG,
  DEFAULT_INSURANCE_CONFIG,
  ONLO_COVER_TIMEOUT_MS,
} from '../types/relok8';
import { generateOnloReply } from '../lib/onloService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');
const DATA_DIR = path.join(ROOT_DIR, 'data');

// File paths
const PLACES_FILE = path.join(DATA_DIR, 'places.json');
const THREADS_FILE = path.join(DATA_DIR, 'threads.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json');
const SAVED_PLACES_FILE = path.join(DATA_DIR, 'saved_places.json');
const REWARDS_FILE = path.join(DATA_DIR, 'rewards.json');
const ANNOUNCEMENTS_FILE = path.join(DATA_DIR, 'announcements.json');
const INVITATIONS_FILE = path.join(DATA_DIR, 'invitations.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    ensureDir(DATA_DIR);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    ensureDir(DATA_DIR);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// ============================================================================
// SEED DATA (Section 12: realistic placeholder content in Lublin)
// ============================================================================

/* Sample users per Section 12 */
export const SEED_USERS: Relok8User[] = [
  {
    id: 'user-anna',
    name: 'Anna Kowalska',
    email: 'anna@student.umcs.pl',
    role: 'tenant',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    isVerified: true,
    university: 'UMCS Lublin',
    isAvailable: true,
    quietHours: { enabled: true, start: '23:00', end: '07:00' },
    whatsappAlertsOptIn: true,
  },
  {
    id: 'user-nowak',
    name: 'Jan Nowak',
    email: 'j.nowak@lublin-rent.pl',
    role: 'landlord',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    isVerified: true,
    isAvailable: true,
    quietHours: { enabled: false, start: '22:00', end: '08:00' },
    whatsappAlertsOptIn: true,
  },
  {
    id: 'user-mateo',
    name: 'Mateo Rossi',
    email: 'mateo@erasmus.org',
    role: 'prospect',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    isVerified: true,
    university: 'UMCS Erasmus Exchange',
    isAvailable: true,
    whatsappAlertsOptIn: true,
  },
  {
    id: 'user-priya',
    name: 'Priya Sharma',
    email: 'priya@student.wsei.pl',
    role: 'prospect',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    isVerified: true,
    university: 'WSEI Lublin',
    isAvailable: true,
    whatsappAlertsOptIn: false,
  },
];

/* Live places, threads, messages, and announcements are populated by real users */
export const SEED_PLACES: Place[] = [];
export const SEED_THREADS: Thread[] = [];
export const SEED_MESSAGES: Message[] = [];
export const SEED_ANNOUNCEMENTS: Announcement[] = [];
export const SEED_REWARDS: RewardEvent[] = [];

// ============================================================================
// DATA STORE CLASS
// ============================================================================

class Relok8DataStore {
  places: Place[];
  threads: Thread[];
  messages: Message[];
  notifications: Notification[];
  savedPlaces: SavedPlace[];
  rewards: RewardEvent[];
  announcements: Announcement[];
  invitations: Invitation[];
  users: Relok8User[];

  constructor() {
    this.users = readJsonFile<Relok8User[]>(USERS_FILE, SEED_USERS);
    this.places = readJsonFile<Place[]>(PLACES_FILE, SEED_PLACES);
    this.threads = readJsonFile<Thread[]>(THREADS_FILE, SEED_THREADS);
    this.messages = readJsonFile<Message[]>(MESSAGES_FILE, SEED_MESSAGES);
    this.announcements = readJsonFile<Announcement[]>(ANNOUNCEMENTS_FILE, SEED_ANNOUNCEMENTS);
    this.rewards = readJsonFile<RewardEvent[]>(REWARDS_FILE, SEED_REWARDS);
    this.notifications = readJsonFile<Notification[]>(NOTIFICATIONS_FILE, []);
    this.savedPlaces = readJsonFile<SavedPlace[]>(SAVED_PLACES_FILE, []);
    this.invitations = readJsonFile<Invitation[]>(INVITATIONS_FILE, []);

    // Ensure initial disk files exist
    this.saveAll();
  }

  saveAll() {
    writeJsonFile(USERS_FILE, this.users);
    writeJsonFile(PLACES_FILE, this.places);
    writeJsonFile(THREADS_FILE, this.threads);
    writeJsonFile(MESSAGES_FILE, this.messages);
    writeJsonFile(ANNOUNCEMENTS_FILE, this.announcements);
    writeJsonFile(REWARDS_FILE, this.rewards);
    writeJsonFile(NOTIFICATIONS_FILE, this.notifications);
    writeJsonFile(SAVED_PLACES_FILE, this.savedPlaces);
    writeJsonFile(INVITATIONS_FILE, this.invitations);
  }

  // Users
  getUser(id: string): Relok8User | undefined {
    return this.users.find((u) => u.id === id);
  }

  getUsers(): Relok8User[] {
    return this.users;
  }

  updateUser(id: string, updates: Partial<Relok8User>): Relok8User {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this.users[idx] = { ...this.users[idx], ...updates };
      writeJsonFile(USERS_FILE, this.users);
      return this.users[idx];
    }
    throw new Error('User not found');
  }

  // Places
  getPlaces(filters?: { city?: string; status?: string; near?: string; maxCommute?: number }): Place[] {
    let result = [...this.places];
    if (filters?.city && filters.city !== 'All Poland') {
      result = result.filter((p) => p.city.toLowerCase() === filters.city!.toLowerCase());
    }
    if (filters?.status) {
      result = result.filter((p) => p.status === filters.status);
    }
    if (filters?.near) {
      const nearLower = filters.near.toLowerCase();
      result = result.filter((p) =>
        p.nearInstitutions.some((inst) => inst.toLowerCase().includes(nearLower)) ||
        p.commuteNote.toLowerCase().includes(nearLower)
      );
    }
    if (filters?.maxCommute !== undefined) {
      result = result.filter((p) => (p.commuteMinutes || 0) <= filters.maxCommute!);
    }
    return result;
  }

  getPlace(id: string): Place | undefined {
    return this.places.find((p) => p.id === id);
  }

  updatePlace(id: string, updates: Partial<Place>): Place {
    const idx = this.places.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.places[idx] = { ...this.places[idx], ...updates };
      writeJsonFile(PLACES_FILE, this.places);
      return this.places[idx];
    }
    throw new Error('Place not found');
  }

  deletePlace(id: string): boolean {
    const idx = this.places.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.places.splice(idx, 1);
      writeJsonFile(PLACES_FILE, this.places);
      return true;
    }
    return false;
  }

  createPlace(placeData: Partial<Place>): Place {
    const newPlace: Place = {
      id: placeData.id || `place-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      landlordId: placeData.landlordId || 'user-landlord',
      tenantId: placeData.tenantId,
      title: placeData.title || 'Apartment / Room',
      city: placeData.city || 'Warsaw',
      district: placeData.district || 'City Center',
      address: placeData.address || '',
      rentPLN: placeData.rentPLN || 0,
      czynszPLN: placeData.czynszPLN || 0,
      depositPLN: placeData.depositPLN || 0,
      availableFrom: placeData.availableFrom || new Date().toISOString().split('T')[0],
      roomType: placeData.roomType || 'Private room',
      flatmates: placeData.flatmates || 0,
      furnished: placeData.furnished ?? true,
      billsIncluded: placeData.billsIncluded ?? false,
      meldunekOk: placeData.meldunekOk ?? true,
      commuteNote: placeData.commuteNote,
      commuteMinutes: placeData.commuteMinutes,
      nearInstitutions: placeData.nearInstitutions,
      photos: placeData.photos || [],
      status: placeData.status || 'available_for_takeover',
      leaveDate: placeData.leaveDate,
      rules: placeData.rules || '',
      landlordBedPricePLN: placeData.landlordBedPricePLN,
    };
    this.places.unshift(newPlace);
    writeJsonFile(PLACES_FILE, this.places);
    return newPlace;
  }

  // Exit flow (Section 6)
  requestExit(placeId: string, leaveDate: string, notes?: string): Place {
    const place = this.getPlace(placeId);
    if (!place) throw new Error('Place not found');
    place.status = 'exit_requested';
    place.leaveDate = leaveDate;
    place.exitNotes = notes;

    // Notify landlord
    this.addNotification({
      userId: place.landlordId,
      type: 'exit_request',
      placeId: place.id,
      body: `Tenant requested lease exit for ${place.title}. Requested leave date: ${leaveDate}.`,
    });

    writeJsonFile(PLACES_FILE, this.places);
    return place;
  }

  cancelExit(placeId: string): Place {
    const place = this.getPlace(placeId);
    if (!place) throw new Error('Place not found');
    if (place.status === 'reserved' || place.status === 'handed_over') {
      throw new Error('Cannot cancel exit after reservation or handover');
    }
    place.status = 'occupied';
    place.leaveDate = undefined;
    place.exitNotes = undefined;
    writeJsonFile(PLACES_FILE, this.places);
    return place;
  }

  decideExit(placeId: string, decision: 'approve' | 'suggest_date' | 'decline', reasonOrDate?: string): Place {
    const place = this.getPlace(placeId);
    if (!place) throw new Error('Place not found');

    if (decision === 'approve') {
      place.status = 'available_for_takeover';

      // 1. Create Announcement (Section 7)
      this.createAnnouncement(place);

      // 2. Notify saved users
      const savedUsers = this.savedPlaces.filter((s) => s.placeId === place.id && s.notifyWhenAvailable);
      for (const save of savedUsers) {
        this.addNotification({
          userId: save.userId,
          type: 'saved_available',
          placeId: place.id,
          body: `Good news! ${place.title} is now available for lease takeover.`,
        });
      }

      // 3. Notify tenant
      this.addNotification({
        userId: place.tenantId,
        type: 'system',
        placeId: place.id,
        body: `Landlord approved your exit request! Your place is now listed as Available for Takeover.`,
      });
    } else if (decision === 'suggest_date') {
      place.leaveDate = reasonOrDate || place.leaveDate;
      this.addNotification({
        userId: place.tenantId,
        type: 'system',
        placeId: place.id,
        body: `Landlord suggested an alternate leave date: ${reasonOrDate}.`,
      });
    } else if (decision === 'decline') {
      place.status = 'occupied';
      this.addNotification({
        userId: place.tenantId,
        type: 'system',
        placeId: place.id,
        body: `Landlord declined the exit request. Reason: ${reasonOrDate || 'Standard lease term required'}.`,
      });
    }

    writeJsonFile(PLACES_FILE, this.places);
    return place;
  }

  approveReplacement(placeId: string, prospectId: string): Place {
    const place = this.getPlace(placeId);
    if (!place) throw new Error('Place not found');

    place.status = 'reserved';
    place.replacementProspectId = prospectId;
    place.handoverChecklist = {
      agreementSigned: false,
      depositTransferred: false,
      keysHandedOver: false,
      meldunekCompleted: false,
    };

    // Update prospect thread to reserved
    const thread = this.threads.find((t) => t.placeId === placeId && t.prospectId === prospectId);
    if (thread) {
      thread.status = 'reserved';
      writeJsonFile(THREADS_FILE, this.threads);
    }

    // Notify prospect and tenant
    this.addNotification({
      userId: prospectId,
      type: 'system',
      placeId: place.id,
      body: `Congratulations! Landlord approved you as the replacement for ${place.title}. Next step: sign the Cesja agreement.`,
    });

    this.addNotification({
      userId: place.tenantId,
      type: 'system',
      placeId: place.id,
      body: `Landlord approved the replacement tenant! Check your handover checklist.`,
    });

    writeJsonFile(PLACES_FILE, this.places);
    return place;
  }

  updateHandoverChecklist(placeId: string, checklistUpdates: Partial<Place['handoverChecklist']>): Place {
    const place = this.getPlace(placeId);
    if (!place) throw new Error('Place not found');

    place.handoverChecklist = {
      agreementSigned: false,
      depositTransferred: false,
      keysHandedOver: false,
      meldunekCompleted: false,
      ...place.handoverChecklist,
      ...checklistUpdates,
    };

    // Check if all are ticked -> handed_over
    const allTicked =
      place.handoverChecklist.agreementSigned &&
      place.handoverChecklist.depositTransferred &&
      place.handoverChecklist.keysHandedOver &&
      place.handoverChecklist.meldunekCompleted;

    if (allTicked) {
      const prevTenantId = place.tenantId;
      place.status = 'handed_over';
      if (place.replacementProspectId) {
        place.tenantId = place.replacementProspectId;
      }

      // Award 10 points to leaving tenant for handover completed (Section 8)
      this.addRewardEvent({
        userId: prevTenantId,
        placeId: place.id,
        kind: 'handover_completed',
        points: DEFAULT_REWARD_CONFIG.handoverPoints,
        description: 'Completed handover with replacement tenant (Art. 509 KC)',
      });

      this.addNotification({
        userId: prevTenantId,
        type: 'reward',
        placeId: place.id,
        body: `Handover complete! You earned 10 points towards your Relok8 insurance discount.`,
      });
    }

    writeJsonFile(PLACES_FILE, this.places);
    return place;
  }

  // Announcements & WhatsApp (Section 7)
  createAnnouncement(place: Place): Announcement {
    const existing = this.announcements.find((a) => a.placeId === place.id);
    if (existing) return existing;

    const ann: Announcement = {
      id: `ann-${place.id}`,
      placeId: place.id,
      text: `Lease takeover in ${place.city} (${place.district})! ${place.rentPLN} PLN/mo + ${place.czynszPLN} czynsz. ${place.roomType} near ${place.nearInstitutions.join(', ')}. Direct handover with landlord consent (0 PLN broker fee): https://relok8.online/listing/${place.id}`,
      channel: 'whatsapp',
      status: 'drafted',
      createdAt: Date.now(),
    };

    this.announcements.push(ann);
    writeJsonFile(ANNOUNCEMENTS_FILE, this.announcements);
    return ann;
  }

  getAnnouncement(placeId: string): Announcement | undefined {
    return this.announcements.find((a) => a.placeId === placeId);
  }

  shareAnnouncementWhatsApp(placeId: string): { channelUrl: string; announcement: Announcement } {
    let ann = this.getAnnouncement(placeId);
    if (!ann) {
      const place = this.getPlace(placeId);
      if (place) ann = this.createAnnouncement(place);
    }

    if (!ann) throw new Error('Announcement not found');

    ann.status = 'shared';
    writeJsonFile(ANNOUNCEMENTS_FILE, this.announcements);

    const encodedText = encodeURIComponent(ann.text);
    const channelUrl = `https://wa.me/?text=${encodedText}`;
    return { channelUrl, announcement: ann };
  }

  // Threads & Messaging (Section 5)
  getThreadsForUser(userId: string): Thread[] {
    const user = this.getUser(userId);
    if (!user) return [];

    if (user.role === 'prospect') {
      return this.threads.filter((t) => t.prospectId === userId);
    }

    // If tenant or landlord, return threads for their places
    const userPlaces = this.places.filter(
      (p) => p.tenantId === userId || p.landlordId === userId
    );
    const placeIds = userPlaces.map((p) => p.id);
    return this.threads.filter((t) => placeIds.includes(t.placeId));
  }

  getThread(id: string): Thread | undefined {
    return this.threads.find((t) => t.id === id);
  }

  createOrGetThread(placeId: string, prospectId: string): Thread {
    let thread = this.threads.find((t) => t.placeId === placeId && t.prospectId === prospectId);
    if (!thread) {
      thread = {
        id: `thread-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        placeId,
        prospectId,
        status: 'open',
        handledBy: 'onlo',
        lastMessageAt: Date.now(),
        unreadFor: [],
      };
      this.threads.unshift(thread);
      writeJsonFile(THREADS_FILE, this.threads);
    }
    return thread;
  }

  getThreadMessages(threadId: string): Message[] {
    return this.messages.filter((m) => m.threadId === threadId);
  }

  async addThreadMessage(
    threadId: string,
    authorId: string,
    body: string
  ): Promise<{ message: Message; thread: Thread; onloReply?: Message }> {
    const thread = this.getThread(threadId);
    if (!thread) throw new Error('Thread not found');

    const author = this.getUser(authorId);
    const place = this.getPlace(thread.placeId);
    if (!place) throw new Error('Place not found');

    let authorType: Message['authorType'] = 'prospect';
    if (author?.role === 'tenant') authorType = 'tenant';
    if (author?.role === 'landlord') authorType = 'landlord';

    const message: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      threadId,
      authorType,
      authorId,
      body,
      createdAt: Date.now(),
    };

    this.messages.push(message);
    thread.lastMessageAt = Date.now();

    // Section 5.2: If human replies, badge switches to that person and Onlo steps back
    if (authorType === 'tenant' || authorType === 'landlord') {
      thread.handledBy = authorType;

      // Anti-gaming Reward check (Section 8)
      if (authorType === 'tenant' && body.trim().length >= DEFAULT_REWARD_CONFIG.minReplyLength) {
        this.checkAndAwardReplyPoints(authorId, place.id, threadId);
      }
    }

    let onloReply: Message | undefined;

    // Section 5.4: If prospect sends a message, check Onlo auto-cover condition
    if (authorType === 'prospect') {
      const tenant = this.getUser(place.tenantId);
      const landlord = this.getUser(place.landlordId);
      const bothUnavailable =
        (!tenant || !tenant.isAvailable) && (!landlord || !landlord.isAvailable);

      if (thread.handledBy === 'onlo' || bothUnavailable) {
        const tenantName = tenant?.name || 'Current Tenant';
        const landlordName = landlord?.name || 'Landlord';
        const recentMsgs = this.getThreadMessages(threadId);

        const onloResult = await generateOnloReply(place, body, tenantName, landlordName, recentMsgs);

        onloReply = {
          id: `msg-onlo-${Date.now()}`,
          threadId,
          authorType: 'onlo',
          authorId: 'onlo',
          onBehalfOf: 'tenant',
          body: onloResult.replyText,
          createdAt: Date.now() + 500,
        };

        this.messages.push(onloReply);
        thread.lastMessageAt = onloReply.createdAt;

        if (onloResult.needsHuman) {
          thread.status = 'needs_human';
          this.addNotification({
            userId: place.tenantId,
            type: 'message',
            placeId: place.id,
            body: `Onlo flagged a prospect question that needs human assistance for ${place.title}.`,
          });
          this.addNotification({
            userId: place.landlordId,
            type: 'message',
            placeId: place.id,
            body: `Onlo flagged a prospect question that needs human assistance for ${place.title}.`,
          });
        }
      }
    }

    this.saveAll();
    return { message, thread, onloReply };
  }

  takeoverThread(threadId: string, userId: string): Thread {
    const thread = this.getThread(threadId);
    if (!thread) throw new Error('Thread not found');
    const user = this.getUser(userId);
    if (user?.role === 'tenant' || user?.role === 'landlord') {
      thread.handledBy = user.role;
      if (thread.status === 'needs_human') {
        thread.status = 'open';
      }
      writeJsonFile(THREADS_FILE, this.threads);
    }
    return thread;
  }

  async triggerOnloNow(threadId: string): Promise<{ reply: Message; thread: Thread }> {
    const thread = this.getThread(threadId);
    if (!thread) throw new Error('Thread not found');
    const place = this.getPlace(thread.placeId);
    if (!place) throw new Error('Place not found');

    const recent = this.getThreadMessages(threadId);
    const lastProspectMsg = [...recent].reverse().find((m) => m.authorType === 'prospect')?.body ||
      'Can you tell me about the lease takeover process for this room?';

    const tenant = this.getUser(place.tenantId);
    const landlord = this.getUser(place.landlordId);
    const onloResult = await generateOnloReply(
      place,
      lastProspectMsg,
      tenant?.name || 'Current Tenant',
      landlord?.name || 'Landlord',
      recent
    );

    const reply: Message = {
      id: `msg-onlo-${Date.now()}`,
      threadId,
      authorType: 'onlo',
      authorId: 'onlo',
      onBehalfOf: 'tenant',
      body: onloResult.replyText,
      createdAt: Date.now(),
    };

    this.messages.push(reply);
    thread.lastMessageAt = reply.createdAt;
    thread.handledBy = 'onlo';

    if (onloResult.needsHuman) {
      thread.status = 'needs_human';
    }

    this.saveAll();
    return { reply, thread };
  }

  // Place Room (Section 5.3)
  getPlaceRoomMessages(placeId: string): Message[] {
    const threadId = `place-room-${placeId}`;
    return this.messages.filter((m) => m.threadId === threadId);
  }

  addPlaceRoomMessage(placeId: string, authorId: string, body: string): Message {
    const place = this.getPlace(placeId);
    if (!place) throw new Error('Place not found');

    const author = this.getUser(authorId);
    let authorType: Message['authorType'] = 'tenant';
    if (author?.role === 'landlord') authorType = 'landlord';

    const message: Message = {
      id: `msg-pr-${Date.now()}`,
      threadId: `place-room-${placeId}`,
      authorType,
      authorId,
      body,
      createdAt: Date.now(),
    };

    this.messages.push(message);
    writeJsonFile(MESSAGES_FILE, this.messages);
    return message;
  }

  // Saved Places & Notifications (Section 7)
  getSavedPlaces(userId: string): SavedPlace[] {
    return this.savedPlaces.filter((s) => s.userId === userId);
  }

  toggleSavedPlace(userId: string, placeId: string): { saved: boolean } {
    const idx = this.savedPlaces.findIndex((s) => s.userId === userId && s.placeId === placeId);
    if (idx !== -1) {
      this.savedPlaces.splice(idx, 1);
      writeJsonFile(SAVED_PLACES_FILE, this.savedPlaces);
      return { saved: false };
    } else {
      this.savedPlaces.push({
        userId,
        placeId,
        notifyWhenAvailable: true,
        savedAt: Date.now(),
      });
      writeJsonFile(SAVED_PLACES_FILE, this.savedPlaces);
      return { saved: true };
    }
  }

  getNotifications(userId: string): Notification[] {
    return this.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  addNotification(n: Omit<Notification, 'id' | 'createdAt'>): Notification {
    const notif: Notification = {
      ...n,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
    };
    this.notifications.unshift(notif);
    writeJsonFile(NOTIFICATIONS_FILE, this.notifications);
    return notif;
  }

  markNotificationRead(id: string): void {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) {
      notif.readAt = Date.now();
      writeJsonFile(NOTIFICATIONS_FILE, this.notifications);
    }
  }

  // Rewards & Insurance (Section 8)
  getRewardsForUser(userId: string) {
    const events = this.rewards.filter((r) => r.userId === userId);
    const points = events.reduce((acc, e) => acc + e.points, 0);
    const unlocked = points >= DEFAULT_REWARD_CONFIG.thresholdPoints;

    return {
      points,
      unlocked,
      events,
      config: DEFAULT_REWARD_CONFIG,
      insuranceConfig: DEFAULT_INSURANCE_CONFIG,
    };
  }

  addRewardEvent(event: Omit<RewardEvent, 'id' | 'createdAt'>): RewardEvent {
    const ev: RewardEvent = {
      ...event,
      id: `rew-${Date.now()}`,
      createdAt: Date.now(),
    };
    this.rewards.push(ev);
    writeJsonFile(REWARDS_FILE, this.rewards);
    return ev;
  }

  private checkAndAwardReplyPoints(userId: string, placeId: string, threadId: string) {
    const threadEvents = this.rewards.filter(
      (r) => r.userId === userId && r.threadId === threadId && r.kind === 'reply'
    );
    if (threadEvents.length >= DEFAULT_REWARD_CONFIG.maxPointsPerThread) return;

    this.addRewardEvent({
      userId,
      placeId,
      threadId,
      kind: 'reply',
      points: DEFAULT_REWARD_CONFIG.replyPoints,
      description: 'Quick human reply to prospect inquiry',
    });
  }

  // Invitations (Section 9)
  createInvitation(placeId: string, email: string, role: 'tenant' | 'landlord'): Invitation {
    const inv: Invitation = {
      id: `inv-${Date.now()}`,
      placeId,
      email,
      role,
      token: `token-${Math.random().toString(36).substring(2, 10)}`,
      createdAt: Date.now(),
    };
    this.invitations.push(inv);
    writeJsonFile(INVITATIONS_FILE, this.invitations);
    return inv;
  }

  acceptInvitation(token: string, userId: string): { success: boolean; place: Place } {
    const inv = this.invitations.find((i) => i.token === token);
    if (!inv) throw new Error('Invalid or expired invitation token');

    const place = this.getPlace(inv.placeId);
    if (!place) throw new Error('Place not found');

    if (inv.role === 'tenant') place.tenantId = userId;
    if (inv.role === 'landlord') place.landlordId = userId;

    inv.acceptedAt = Date.now();
    this.saveAll();
    return { success: true, place };
  }
}

export const relok8Store = new Relok8DataStore();
