import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Send, Sparkles, ShieldCheck, Clock,
  Bot, CheckCircle2, Lock, UserCheck, AlertCircle,
  MessageSquare, Globe, Home, Shield, ExternalLink,
  MapPin, Check
} from 'lucide-react';
import { SupportedLocale, formatPLN } from '../utils/formatters';
import {
  Thread,
  Message,
  Place,
  Relok8User,
  HandledBy
} from '../types/relok8';
import {
  getThreads,
  getThreadMessages,
  sendThreadMessage,
  takeOverThread,
  askOnloNow,
  getPlaces,
  getCurrentDevUser,
  updateUserAvailability,
  onloSuggestReply,
  onloTranslate,
  getPlaceRoomMessages,
  sendPlaceRoomMessage,
  startPolling,
  approveReplacement
} from '../lib/api';

interface MessagesPageProps {
  onBack: () => void;
  locale?: SupportedLocale;
  currentUser?: { name: string; email: string; avatar?: string } | null;
  onOpenListing?: (id: string) => void;
  initialThreadId?: string;
  initialPlaceId?: string;
}

// Deterministic initials avatar generator (No generic person icons)
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarStyle = (name: string): string => {
  const palettes = [
    'bg-indigo-100 text-indigo-700 border-indigo-200',
    'bg-emerald-100 text-emerald-700 border-emerald-200',
    'bg-amber-100 text-amber-700 border-amber-200',
    'bg-sky-100 text-sky-700 border-sky-200',
    'bg-rose-100 text-rose-700 border-rose-200',
    'bg-violet-100 text-violet-700 border-violet-200',
    'bg-teal-100 text-teal-700 border-teal-200'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
  }
  return palettes[Math.abs(hash) % palettes.length];
};

// Strips redundant "Translated:", "Translation:", and surrounding quotes
const cleanTranslation = (text: string): string => {
  return text
    .replace(/^(translated|translation|tłumaczenie):\s*/i, '')
    .replace(/^["'“](.*)["'”]$/, '$1')
    .trim();
};

export const MessagesPage: React.FC<MessagesPageProps> = ({
  onBack,
  locale = 'en',
  currentUser,
  onOpenListing,
  initialThreadId,
  initialPlaceId,
}) => {
  const [devUser, setDevUser] = useState<Relok8User | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(initialThreadId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'prospects' | 'place_room'>('prospects');
  const [filter, setFilter] = useState<'all' | 'unread' | 'needs_human' | 'onlo'>('all');

  // In-bubble translation state (msgId -> translated text)
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translatingMsgId, setTranslatingMsgId] = useState<string | null>(null);

  // Composer state
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isHelperLoading, setIsHelperLoading] = useState(false);

  // Mobile responsive pane state ('list' vs 'chat')
  const [mobilePane, setMobilePane] = useState<'list' | 'chat'>('list');

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isUserNearBottomRef = useRef<boolean>(true);
  const prevMessageCountRef = useRef<number>(0);
  const activeThreadOrTabRef = useRef<string>('');

  // Track container scroll position to prevent disruptive jumps while reading earlier messages
  const handleContainerScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    isUserNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 90;
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (!messagesContainerRef.current) return;
    messagesContainerRef.current.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior
    });
  };

  // Load user & places
  const initData = async () => {
    try {
      const [u, p] = await Promise.all([
        getCurrentDevUser(),
        getPlaces()
      ]);
      setDevUser(u);
      setPlaces(p);
      const ths = await getThreads();
      setThreads(ths);
      if (ths.length > 0 && !activeThreadId) {
        setActiveThreadId(ths[0].id);
      }
    } catch (e) {
      console.warn('Error loading initial message data:', e);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    const cancel = startPolling(async () => {
      try {
        const ths = await getThreads();
        setThreads(ths);
        if (activeThreadId && activeTab === 'prospects') {
          const msgs = await getThreadMessages(activeThreadId);
          setMessages(msgs);
        } else if (activeTab === 'place_room' && activePlace) {
          const prMsgs = await getPlaceRoomMessages(activePlace.id);
          setMessages(prMsgs);
        }
      } catch (e) {}
    }, 3000);

    return cancel;
  }, [activeThreadId, activeTab]);

  // Load messages when thread or tab changes
  useEffect(() => {
    const loadMsgs = async () => {
      if (activeTab === 'prospects' && activeThreadId) {
        try {
          const msgs = await getThreadMessages(activeThreadId);
          setMessages(msgs);
        } catch (e) {}
      } else if (activeTab === 'place_room' && activePlace) {
        try {
          const msgs = await getPlaceRoomMessages(activePlace.id);
          setMessages(msgs);
        } catch (e) {}
      }
    };
    loadMsgs();
  }, [activeThreadId, activeTab]);

  // Scoped scrolling: Only scroll when user changes thread/tab, or when new message arrives and user is at bottom
  useEffect(() => {
    const threadKey = `${activeTab}:${activeThreadId || ''}`;
    const isNewThread = activeThreadOrTabRef.current !== threadKey;
    activeThreadOrTabRef.current = threadKey;

    if (isNewThread) {
      // Switched thread or tab: snap to bottom inside container
      scrollToBottom('auto');
      isUserNearBottomRef.current = true;
      prevMessageCountRef.current = messages.length;
      return;
    }

    const messageCountChanged = messages.length !== prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;

    // Background 3s polling must NOT jump screen if user scrolled up
    if (messageCountChanged || isHelperLoading) {
      if (isUserNearBottomRef.current) {
        scrollToBottom('smooth');
      }
    }
  }, [messages, isHelperLoading, activeThreadId, activeTab]);

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];
  const activePlace = places.find((p) => p.id === (activeThread?.placeId || initialPlaceId)) || places[0];
  const isLandlord = devUser?.role === 'landlord';
  const isTenant = devUser?.role === 'tenant';

  // Covered tenant name for Onlo banner
  const tenantCoveredName = 'Anna';

  // Resolve prospect names
  const getProspectName = (prospectId: string): string => {
    if (prospectId === 'user-mateo') return 'Mateo (Erasmus)';
    if (prospectId === 'user-priya') return 'Priya (WSEI)';
    return 'Prospect Inquiry';
  };

  // Preview snippet for threads
  const getThreadPreview = (t: Thread): string => {
    if (t.prospectId === 'user-mateo') return 'Hi, is the room still available for the spring semester?';
    if (t.prospectId === 'user-priya') return 'Hello! Can I register my meldunek at this address?';
    return 'Inquiry regarding lease takeover';
  };

  // Filtered threads list
  const filteredThreads = threads.filter((t) => {
    if (filter === 'unread') {
      return t.unreadFor && devUser && t.unreadFor.includes(devUser.id);
    }
    if (filter === 'needs_human') {
      return t.status === 'needs_human';
    }
    if (filter === 'onlo') {
      return t.handledBy === 'onlo';
    }
    return true;
  });

  // Handle Send Message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      if (activeTab === 'place_room' && activePlace) {
        const newMsg = await sendPlaceRoomMessage(activePlace.id, text);
        setMessages((prev) => [...prev, newMsg]);
        isUserNearBottomRef.current = true;
        scrollToBottom('smooth');
      } else if (activeThread) {
        const res = await sendThreadMessage(activeThread.id, text);
        setMessages((prev) => {
          const list = [...prev, res.message];
          if (res.onloReply) list.push(res.onloReply);
          return list;
        });
        setThreads((prev) => prev.map((t) => (t.id === res.thread.id ? res.thread : t)));
        isUserNearBottomRef.current = true;
        scrollToBottom('smooth');
      }
    } catch (err: any) {
      console.warn('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Handle Human Takeover
  const handleTakeOver = async () => {
    if (!activeThread) return;
    try {
      const updated = await takeOverThread(activeThread.id);
      setThreads((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      console.warn('Takeover error:', err);
    }
  };

  // Handle Ask Onlo Now
  const handleAskOnloNow = async () => {
    if (!activeThread) return;
    try {
      setIsHelperLoading(true);
      const res = await askOnloNow(activeThread.id);
      setMessages((prev) => [...prev, res.reply]);
      setThreads((prev) => prev.map((t) => (t.id === res.thread.id ? res.thread : t)));
    } catch (err) {
      console.warn('Ask Onlo error:', err);
    } finally {
      setIsHelperLoading(false);
    }
  };

  // Handle Suggest a Reply
  const handleSuggestReply = async () => {
    if (!activeThread) return;
    try {
      setIsHelperLoading(true);
      const suggestion = await onloSuggestReply(activeThread.id);
      setInputText(suggestion);
    } catch (e) {
      console.warn('Suggest reply error:', e);
    } finally {
      setIsHelperLoading(false);
    }
  };

  // In-bubble translation handler: translates once, in reader's language, no banners
  const handleTranslateMessage = async (msg: Message) => {
    try {
      setTranslatingMsgId(msg.id);
      const targetLang = locale === 'pl' ? 'pl' : 'en';
      const rawTranslation = await onloTranslate(msg.body, targetLang);
      const cleaned = cleanTranslation(rawTranslation);
      setTranslations((prev) => ({
        ...prev,
        [msg.id]: cleaned,
      }));
    } catch (e) {
      console.warn('Translation failed:', e);
    } finally {
      setTranslatingMsgId(null);
    }
  };

  // Landlord: Approve as replacement
  const handleApproveReplacement = async () => {
    if (!activeThread || !activePlace) return;
    try {
      await approveReplacement(activePlace.id, activeThread.prospectId);
      const updatedThs = await getThreads();
      setThreads(updatedThs);
    } catch (e: any) {
      console.warn('Approval failed:', e);
    }
  };

  // Day divider formatting
  const getDayDividerLabel = (timestamp: number): string => {
    const d = new Date(timestamp);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return locale === 'pl' ? 'Dzisiaj' : 'Today';
    }
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return locale === 'pl' ? 'Wczoraj' : 'Yesterday';
    }
    return d.toLocaleDateString(locale === 'pl' ? 'pl-PL' : 'en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="h-screen bg-[#f8fafc] text-[#0f172a] text-left flex flex-col font-sans overflow-hidden">
      {/* 1. Compact Title Row */}
      <header className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 bg-transparent">
        {/* Left: Back button + Title + Subtitle */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
              {locale === 'pl' ? 'Wiadomości' : 'Messages'}
            </h1>
            <p className="text-xs text-slate-500 truncate">
              {isTenant || isLandlord
                ? 'Shared inbox for your home. You and the landlord see prospect threads together.'
                : 'Direct messaging with verified tenants and landlords · Powered by Onlo.'}
            </p>
          </div>
        </div>

        {/* Right: Availability Toggle & Prospects/Place room Segmented Control */}
        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
          {devUser && (isTenant || isLandlord) && (
            <button
              type="button"
              onClick={async () => {
                const updated = await updateUserAvailability(!devUser.isAvailable, devUser.quietHours);
                setDevUser(updated);
              }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                devUser.isAvailable
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
              }`}
              title={devUser.isAvailable ? "Available · Onlo auto-covers after 2m" : "Away · Onlo auto-covers immediately"}
            >
              <span className={`w-2 h-2 rounded-full ${devUser.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span>{devUser.isAvailable ? "I'm available" : "Away (Covered)"}</span>
            </button>
          )}

          {/* Prospects / Place room segmented control */}
          {(isTenant || isLandlord) && (
            <div className="flex rounded-full bg-slate-200/70 p-1 border border-slate-300/60 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('prospects');
                  setMobilePane('chat');
                }}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  activeTab === 'prospects'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Prospects
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('place_room');
                  setMobilePane('chat');
                }}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'place_room'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Lock className="w-3 h-3 text-indigo-600" />
                <span>Place room</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 2. Main Rounded-3xl Card (holds the 3 panes and fills viewport height) */}
      <main className="flex-1 px-3 sm:px-6 pb-4 sm:pb-6 overflow-hidden min-h-0">
        <div className="h-full bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-row">
          
          {/* PANE 1: Thread List (340px) */}
          <section
            aria-label="Thread list"
            className={`w-full md:w-[340px] shrink-0 border-r border-slate-200/90 flex flex-col h-full bg-white ${
              mobilePane === 'chat' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Filter chips on top */}
            <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>{locale === 'pl' ? 'Wątki zapytań' : 'Inquiries'}</span>
                <span className="text-[11px] font-medium text-slate-400">{filteredThreads.length} threads</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer shrink-0 text-xs ${
                    filter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer shrink-0 text-xs ${
                    filter === 'unread'
                      ? 'bg-[#F2705A] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Unread
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('needs_human')}
                  className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer shrink-0 text-xs ${
                    filter === 'needs_human'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Needs a human
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('onlo')}
                  className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer shrink-0 text-xs ${
                    filter === 'onlo'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Onlo
                </button>
              </div>
            </div>

            {/* Thread Rows */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredThreads.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">No threads matching filter.</p>
                </div>
              ) : (
                filteredThreads.map((t) => {
                  const isSelected = t.id === activeThreadId && activeTab === 'prospects';
                  const place = places.find((p) => p.id === t.placeId);
                  const prospectName = getProspectName(t.prospectId);
                  const preview = getThreadPreview(t);
                  const isUnread = t.unreadFor && devUser && t.unreadFor.includes(devUser.id);
                  const isNeedsHuman = t.status === 'needs_human';
                  const isOnlo = t.handledBy === 'onlo';

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setActiveThreadId(t.id);
                        setActiveTab('prospects');
                        setMobilePane('chat');
                      }}
                      className={`w-full p-3.5 text-left transition-colors flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/70 border-l-[3px] border-indigo-600'
                          : 'hover:bg-slate-50 border-l-[3px] border-transparent'
                      }`}
                    >
                      {/* Colored Initials Avatar (No generic person icons) */}
                      <div
                        className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 select-none ${getAvatarStyle(
                          prospectName
                        )}`}
                      >
                        {getInitials(prospectName)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {prospectName}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(t.lastMessageAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {/* Place name in small indigo */}
                        <div className="text-[11px] font-semibold text-indigo-600 truncate mt-0.5">
                          {place?.title || 'Place in Lublin'}
                        </div>

                        {/* One-line preview */}
                        <div className="text-xs text-slate-500 truncate mt-0.5 leading-snug">
                          {preview}
                        </div>

                        {/* Badges: unread count, Needs a human, Onlo */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {isUnread && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#F2705A] text-white">
                              1
                            </span>
                          )}

                          {isNeedsHuman && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              Needs a human
                            </span>
                          )}

                          {isOnlo && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                              <Bot className="w-3 h-3 text-indigo-600" />
                              <span>Onlo</span>
                            </span>
                          )}

                          {t.status === 'reserved' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Reserved
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* PANE 2: Conversation (Flexible) */}
          <section
            aria-label="Conversation"
            className={`flex-1 min-w-0 flex flex-col h-full bg-white ${
              mobilePane === 'list' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Conversation Header */}
            <div className="p-3 sm:p-4 border-b border-slate-100 bg-white flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {/* Mobile Back Button */}
                <button
                  type="button"
                  onClick={() => setMobilePane('list')}
                  className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                {activeTab === 'place_room' ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      PR
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        Private Place Room
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        about {activePlace?.address || 'Lublin'} · Tenant & Landlord Channel
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Prospect Avatar & Name */}
                    <div
                      className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 select-none ${getAvatarStyle(
                        getProspectName(activeThread?.prospectId || '')
                      )}`}
                    >
                      {getInitials(getProspectName(activeThread?.prospectId || ''))}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {getProspectName(activeThread?.prospectId || '')}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        about <span className="font-medium text-slate-700">{activePlace?.title || 'Place in Lublin'}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Status pill & Landlord Approve button */}
              <div className="flex items-center gap-2 shrink-0">
                {activeTab === 'place_room' ? (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Private channel
                  </span>
                ) : (
                  <>
                    {activeThread?.status === 'reserved' ? (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Reserved
                      </span>
                    ) : activeThread?.status === 'needs_human' ? (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        Needs a human
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        Open inquiry
                      </span>
                    )}

                    {/* Landlord only: Approve as replacement */}
                    {isLandlord && activeThread?.status !== 'reserved' && (
                      <button
                        type="button"
                        onClick={handleApproveReplacement}
                        className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve as replacement</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* When Onlo is handling: Soft indigo banner with Take over button */}
            {activeTab === 'prospects' && activeThread?.handledBy === 'onlo' && (
              <div className="bg-indigo-50/90 border-b border-indigo-100 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-indigo-900 shrink-0">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    Onlo is answering for <span className="font-bold">{tenantCoveredName}</span>. Take over to reply yourself.
                  </span>
                </div>
                {(isTenant || isLandlord) && (
                  <button
                    type="button"
                    onClick={handleTakeOver}
                    className="text-xs font-bold px-3 py-1 rounded-full bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-2xs transition-colors cursor-pointer shrink-0"
                  >
                    Take over
                  </button>
                )}
              </div>
            )}

            {/* When Human is handling: Soft slate banner with Hand back to Onlo button */}
            {activeTab === 'prospects' && activeThread && activeThread.handledBy !== 'onlo' && (
              <div className="bg-slate-50 border-b border-slate-200/80 px-4 py-2 flex items-center justify-between gap-3 text-xs text-slate-700 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>You are answering. Hand back to Onlo to handle incoming questions automatically.</span>
                </div>
                {(isTenant || isLandlord) && (
                  <button
                    type="button"
                    onClick={handleAskOnloNow}
                    disabled={isHelperLoading}
                    className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-slate-300 text-indigo-600 hover:bg-indigo-50 shadow-2xs transition-colors cursor-pointer shrink-0"
                  >
                    {isHelperLoading ? 'Connecting...' : 'Hand back to Onlo'}
                  </button>
                )}
              </div>
            )}

            {/* Messages Scroll Area (container-scoped, scroll-stabilized) */}
            <div
              ref={messagesContainerRef}
              onScroll={handleContainerScroll}
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/30"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                  <Bot className="w-8 h-8 text-indigo-400" />
                  <p className="text-xs font-medium text-slate-600">
                    {activeTab === 'place_room'
                      ? 'Private Place Room between tenant and landlord.'
                      : 'Start the conversation! Onlo is ready to assist if you are away.'}
                  </p>
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isMe = m.authorId === devUser?.id;
                  const isOnlo = m.authorType === 'onlo';
                  const prevMsg = idx > 0 ? messages[idx - 1] : null;
                  const showDayDivider =
                    !prevMsg ||
                    getDayDividerLabel(m.createdAt) !== getDayDividerLabel(prevMsg.createdAt);

                  return (
                    <React.Fragment key={m.id}>
                      {/* Day divider */}
                      {showDayDivider && (
                        <div className="flex items-center justify-center my-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-full border border-slate-200/60 shadow-2xs">
                            {getDayDividerLabel(m.createdAt)}
                          </span>
                        </div>
                      )}

                      <div
                        className={`flex flex-col ${
                          isMe ? 'items-end' : 'items-start'
                        } max-w-xl ${isMe ? 'ml-auto' : 'mr-auto'}`}
                      >
                        {/* Onlo Author label: 'Onlo for [Name] · AI assistant' */}
                        {isOnlo && (
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 mb-1 px-1">
                            <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                              O
                            </div>
                            <span>Onlo for {tenantCoveredName} · AI assistant</span>
                          </div>
                        )}

                        {!isOnlo && !isMe && (
                          <div className="text-[10px] font-semibold text-slate-400 mb-1 px-1">
                            {m.authorType === 'tenant'
                              ? 'Current tenant'
                              : m.authorType === 'landlord'
                              ? 'Landlord'
                              : 'Prospect'}
                          </div>
                        )}

                        {/* Message Bubble:
                            - Prospect on left in white
                            - Current user on right in indigo
                            - Onlo in light indigo
                        */}
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-br-sm'
                              : isOnlo
                              ? 'bg-indigo-50 border border-indigo-150 text-slate-900 rounded-bl-sm'
                              : 'bg-white border border-slate-200 text-slate-900 rounded-bl-sm'
                          }`}
                        >
                          <div>{m.body}</div>

                          {/* In-bubble translation: shown once, in reader's language, no banners or quotes */}
                          {translations[m.id] && (
                            <div
                              className={`mt-2 pt-2 border-t text-[11px] leading-relaxed ${
                                isMe
                                  ? 'border-indigo-400/50 text-indigo-100'
                                  : 'border-slate-200/80 text-slate-600'
                              }`}
                            >
                              {translations[m.id]}
                            </div>
                          )}
                        </div>

                        {/* Timestamp & In-bubble Translate trigger */}
                        <div className="flex items-center gap-2 mt-1 px-1 text-[9px] text-slate-400">
                          <span>
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>

                          {!isMe && !isOnlo && !translations[m.id] && (
                            <button
                              type="button"
                              disabled={translatingMsgId === m.id}
                              onClick={() => handleTranslateMessage(m)}
                              className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-0.5 cursor-pointer disabled:opacity-50"
                            >
                              <Globe className="w-2.5 h-2.5" />
                              <span>{translatingMsgId === m.id ? 'Translating...' : 'Translate'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}

              {/* Typing indicator */}
              {isHelperLoading && (
                <div className="flex flex-col items-start mr-auto max-w-md animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 mb-1 px-1">
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      O
                    </div>
                    <span>Onlo is drafting a reply...</span>
                  </div>
                  <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-indigo-50 border border-indigo-150 text-slate-800 text-xs shadow-2xs">
                    <div className="flex items-center gap-1.5 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}

              {isSending && (
                <div className="flex flex-col items-end ml-auto max-w-md animate-in fade-in">
                  <div className="px-4 py-2.5 rounded-2xl rounded-br-sm bg-indigo-600 text-white text-xs shadow-2xs">
                    <div className="flex items-center gap-1.5 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* 3. Composer (Always docked at the bottom, never covered by any floating panel) */}
            <div className="p-3 sm:p-4 border-t border-slate-200/90 bg-white space-y-2.5 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {/* Chips above input: 'Suggest a reply' and 'Ask Onlo now' */}
              <div className="flex items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    disabled={isHelperLoading}
                    onClick={handleSuggestReply}
                    className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Suggest a reply</span>
                  </button>

                  <button
                    type="button"
                    disabled={isHelperLoading}
                    onClick={handleAskOnloNow}
                    className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Bot className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Ask Onlo now</span>
                  </button>
                </div>
              </div>

              {/* Pill input with round indigo send button */}
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    activeTab === 'place_room'
                      ? 'Write a private message to the landlord or tenant...'
                      : 'Type a message to the place...'
                  }
                  className="flex-1 px-4 py-2.5 rounded-full border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900 bg-slate-50 focus:bg-white transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors shadow-2xs shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              {/* One-line note: Onlo never agrees to prices, dates or viewings */}
              <div className="text-[11px] text-slate-600 text-center flex items-center justify-center gap-1.5">
                <Shield className="w-3 h-3 text-slate-600 shrink-0" />
                <span>Onlo never agrees to prices, dates or viewings.</span>
              </div>
            </div>
          </section>

          {/* PANE 3: Place Context (300px, hidden below 1180px) */}
          <section
            aria-label="Place context"
            className="w-[300px] shrink-0 border-l border-slate-200/90 hidden min-[1180px]:flex flex-col h-full bg-slate-50/50 overflow-y-auto p-4 space-y-4"
          >
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Place details
            </div>

            {/* Thumbnail photo */}
            {activePlace?.photos?.[0] && (
              <div className="relative rounded-2xl overflow-hidden aspect-4/3 border border-slate-200/80 shadow-2xs">
                <img
                  src={activePlace.photos[0]}
                  alt={activePlace.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold">
                  {formatPLN(activePlace.rentPLN, locale)} / mo
                </div>
              </div>
            )}

            {/* Title & Address */}
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-snug">
                {activePlace?.title || 'Relok8 Place'}
              </h2>
              <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{activePlace?.address || 'Lublin, Poland'}</span>
              </div>
            </div>

            {/* Financials & Dates Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Rent</span>
                <span className="font-bold text-slate-900">
                  {activePlace ? formatPLN(activePlace.rentPLN, locale) : ''}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Utilities / czynsz</span>
                <span className="font-semibold text-slate-700">
                  {activePlace?.billsIncluded ? 'Bills included' : '+ utilities & czynsz'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Available from</span>
                <span className="font-semibold text-slate-700">
                  {activePlace?.availableFrom || 'Immediate'}
                </span>
              </div>
            </div>

            {/* University Commute Note */}
            {activePlace?.commuteNote && (
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3 text-xs text-indigo-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-indigo-700">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Commute</span>
                </div>
                <div className="text-[11px] leading-relaxed text-indigo-900">
                  {activePlace.commuteNote}
                </div>
              </div>
            )}

            {/* People in this home */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                People in this home
              </div>
              <div className="bg-white rounded-2xl border border-slate-200/80 p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center justify-center">
                      AK
                    </div>
                    <span className="font-semibold text-slate-800">Anna (Current tenant)</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                    Verified
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px] flex items-center justify-center">
                      JM
                    </div>
                    <span className="font-semibold text-slate-800">Judy M. (Landlord)</span>
                  </div>
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                    Verified
                  </span>
                </div>
              </div>
            </div>

            {/* View full listing link */}
            {onOpenListing && activePlace && (
              <button
                type="button"
                onClick={() => onOpenListing(activePlace.id)}
                className="w-full py-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <span>View listing</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </button>
            )}
          </section>

        </div>
      </main>
    </div>
  );
};
