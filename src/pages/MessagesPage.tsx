import { useConvexAuth } from 'convex/react';
import { billsLabel } from '../utils/listingFlow';
import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { ArrowLeft, Send, Sparkles, Clock, CheckCircle2, Lock, MessageSquare, Globe, Shield, ExternalLink, MapPin, Search, ChevronUp, ChevronDown, House, Pin } from 'lucide-react';
import { SupportedLocale, formatPLN } from '../utils/formatters';
import { Thread, Message, Place, Relok8User } from '../types/relok8';
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
  getPlaceRoomMessages,
  sendPlaceRoomMessage,
  startPolling
} from '../lib/api';
import { OnloAvatar } from '../components/OnloAvatar';
import { useLiveTranslations } from '../hooks/useLiveTranslations';
import { StatusMessage } from '../components/ui/StatusMessage';

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

export const MessagesPage: React.FC<MessagesPageProps> = ({
  onBack,
  locale = 'en',
  currentUser,
  onOpenListing,
  initialThreadId,
  initialPlaceId,
}) => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [inboxError, setInboxError] = useState('');
  const [devUser, setDevUser] = useState<Relok8User | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(initialThreadId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'prospects' | 'place_room'>('prospects');
  const [filter, setFilter] = useState<'all' | 'unread' | 'needs_human' | 'onlo'>('all');
  const [roomPlaceId, setRoomPlaceId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [threadSearch, setThreadSearch] = useState('');
  const [isThreadListExpanded, setIsThreadListExpanded] = useState(true);
  const [isComposerToolsExpanded, setIsComposerToolsExpanded] = useState(false);

  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});

  // Composer state
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isHelperLoading, setIsHelperLoading] = useState(false);
  const [composerStatus, setComposerStatus] = useState<{ tone: 'error' | 'success'; message: string } | null>(null);

  // Mobile responsive pane state ('list' vs 'chat')
  const [mobilePane, setMobilePane] = useState<'list' | 'chat'>(initialThreadId ? 'chat' : 'list');

  const composerRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isUserNearBottomRef = useRef<boolean>(true);
  const prevMessageCountRef = useRef<number>(0);
  const activeThreadOrTabRef = useRef<string>('');

  // Fit the draft to its content, with a bounded height on small screens.
  useLayoutEffect(() => {
    const field = composerRef.current;
    if (!field) return;
    const resize = () => {
      const keepBottom = isUserNearBottomRef.current;
      field.style.height = '44px';
      field.style.overflowY = 'hidden';
      const maxHeight = Math.min(168, Math.max(44, window.innerHeight * 0.28));
      const height = field.value ? Math.max(44, Math.min(field.scrollHeight + 2, maxHeight)) : 44;
      field.style.height = `${height}px`;
      field.style.overflowY = field.value && field.scrollHeight + 2 > height ? 'auto' : 'hidden';
      const messages = messagesContainerRef.current;
      if (keepBottom && messages) messages.scrollTop = messages.scrollHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [inputText, activeTab, activeThreadId, mobilePane]);

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

  useEffect(() => {
    if (initialThreadId) {
      setActiveThreadId(initialThreadId);
      setActiveTab('prospects');
      setMobilePane('chat');
    }
  }, [initialThreadId]);

  const activeThread = threads.find(t => t.id === activeThreadId);
  const activePlace = places.find(p => p.id === (activeTab === 'place_room' ? roomPlaceId : activeThread?.placeId));
  const privatePlaces = places.filter(p => devUser && (p.tenantId === devUser.id || p.landlordId === devUser.id));
  const translationItems = useMemo(() => [
    ...messages.map((message) => ({ key: `message:${message.id}`, text: message.body })),
    ...(activePlace?.title ? [{ key: `place:${activePlace.id}:title`, text: activePlace.title }] : []),
    ...(activePlace?.rules ? [{ key: `place:${activePlace.id}:rules`, text: activePlace.rules }] : []),
    ...(activePlace?.commuteNote ? [{ key: `place:${activePlace.id}:commute`, text: activePlace.commuteNote }] : []),
  ], [messages, activePlace?.id, activePlace?.title, activePlace?.rules, activePlace?.commuteNote]);
  const { translations: liveTranslations, isTranslating } = useLiveTranslations(translationItems, locale, isAuthenticated);
  const activePlaceTitle = activePlace
    ? liveTranslations[`place:${activePlace.id}:title`] || activePlace.title
    : '';

  useEffect(() => {
    if (!isAuthenticated) return;
    let current = true;
    const refresh = async () => {
      try {
        const [user, listings, conversations] = await Promise.all([
          getCurrentDevUser(), getPlaces({ includeProspects: true }), getThreads()
        ]);
        if (!current) return;
        setDevUser(user);
        setPlaces(listings);
        setThreads(conversations);
        setActiveThreadId(id => conversations.some(t => t.id === id) ? id : conversations[0]?.id || null);
        const selected = activeTab === 'prospects' && activeThreadId
          ? conversations.find(t => t.id === activeThreadId)
          : undefined;
        if (selected || (activeTab === 'place_room' && activePlace)) {
          const history = selected ? await getThreadMessages(selected.id) : await getPlaceRoomMessages(activePlace!.id);
          if (current) setMessages(history);
        }
        if (current) setInboxError('');
      } catch {
        if (current) setInboxError(locale === 'pl' ? 'Nie udało się wczytać wiadomości. Ponawiamy próbę.' : 'Could not load messages. Retrying…');
      }
    };
    setMessages([]);
    void refresh();
    const cancel = startPolling(refresh, 3000);
    return () => { current = false; cancel(); };
  }, [isAuthenticated, activeThreadId, activeTab, activePlace?.id, locale]);

  // Scoped scrolling: Only scroll when user changes thread/tab, or when new message arrives and user is at bottom
  useEffect(() => {
    const threadKey = `${activeTab}:${activeTab === 'place_room' ? roomPlaceId : activeThreadId || ''}`;
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
  }, [messages, isHelperLoading, activeThreadId, activeTab, roomPlaceId]);

  const isLandlord = Boolean(devUser && activePlace?.landlordId === devUser.id);
  const isTenant = Boolean(devUser && activePlace?.tenantId === devUser.id);

  const unavailableName = locale === 'pl' ? 'Imię niedostępne' : 'Name unavailable';
  const tenantName = activePlace?.tenantName || (isTenant ? currentUser?.name || devUser?.name : '') || unavailableName;
  const landlordName = activePlace?.landlordName || (isLandlord ? currentUser?.name || devUser?.name : '') || unavailableName;
  const placeRoomMemberNames = [...new Set([tenantName, landlordName].filter((name) => name !== unavailableName))];

  // Resolve the person's profile name rather than displaying a generated alias.
  const getProspectName = (prospectId: string): string => threads.find((thread) => thread.prospectId === prospectId)?.prospectName?.trim() || unavailableName;
  const getMessageAuthorName = (message: Message): string => {
    if (message.authorName?.trim()) return message.authorName.trim();
    if (message.authorId === devUser?.id) return currentUser?.name || devUser.name || unavailableName;
    if (message.authorType === 'prospect') return getProspectName(activeThread?.prospectId || message.authorId);
    if (message.authorType === 'tenant') return tenantName;
    if (message.authorType === 'landlord') return landlordName;
    if (message.authorType === 'system') return 'Relok8';
    return unavailableName;
  };
  const getThreadPreview = (thread: Thread): string => {
    if (thread.status === 'needs_human') return locale === 'pl' ? 'Czeka na Twoją odpowiedź' : 'Waiting for your reply';
    if (thread.handledBy === 'onlo') return locale === 'pl' ? 'Onlo pomógł w rozmowie' : 'Onlo helped in this conversation';
    if (thread.status === 'reserved') return locale === 'pl' ? 'Następca wybrany' : 'Replacement selected';
    return locale === 'pl' ? 'Otwórz rozmowę' : 'Open conversation';
  };

  // Filtered threads list
  const unreadThreadCount = useMemo(
    () => threads.filter((thread) => Boolean(devUser && thread.unreadFor?.includes(devUser.id))).length,
    [threads, devUser],
  );
  const filteredThreads = useMemo(() => {
    const query = threadSearch.trim().toLocaleLowerCase(locale === 'pl' ? 'pl-PL' : 'en-US');
    return threads
      .filter((thread) => {
        if (filter === 'unread' && !(devUser && thread.unreadFor?.includes(devUser.id))) return false;
        if (filter === 'needs_human' && thread.status !== 'needs_human') return false;
        if (filter === 'onlo' && thread.handledBy !== 'onlo') return false;
        if (!query) return true;
        const place = places.find((item) => item.id === thread.placeId);
        const prospectName = thread.prospectName?.trim() || unavailableName;
        return `${prospectName} ${place?.title || ''} ${place?.address || ''}`.toLocaleLowerCase(locale === 'pl' ? 'pl-PL' : 'en-US').includes(query);
      })
      .sort((left, right) => right.lastMessageAt - left.lastMessageAt);
  }, [threads, filter, devUser, threadSearch, places, locale, unavailableName]);

  // Handle Send Message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending || (activeTab === 'place_room' ? !activePlace || !(isTenant || isLandlord) : !activeThread)) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);
    setComposerStatus(null);

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
      setInputText(text);
      setComposerStatus({
        tone: 'error',
        message: typeof err?.data === 'string' ? err.data : (err instanceof Error ? err.message : (locale === 'pl' ? 'Nie wysłano wiadomości. Spróbuj ponownie.' : 'Your message was not sent. Please try again.')),
      });
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
      setComposerStatus(null);
      const res = await askOnloNow(activeThread.id, locale === 'pl' ? 'pl' : 'en');
      setMessages((prev) => [...prev, res.reply]);
      setThreads((prev) => prev.map((t) => (t.id === res.thread.id ? res.thread : t)));
    } catch (err) {
      setComposerStatus({ tone: 'error', message: err instanceof Error ? err.message : (locale === 'pl' ? 'Onlo nie może teraz odpowiedzieć. Napisz bezpośrednio do uczestnika.' : 'Onlo cannot answer right now. Message the participant directly.') });
    } finally {
      setIsHelperLoading(false);
    }
  };

  // Handle Suggest a Reply
  const handleSuggestReply = async () => {
    if (!activeThread) return;
    try {
      setIsHelperLoading(true);
      setComposerStatus(null);
      const suggestion = await onloSuggestReply(activeThread.id);
      setInputText(suggestion);
    } catch (e) {
      setComposerStatus({ tone: 'error', message: e instanceof Error ? e.message : (locale === 'pl' ? 'Nie udało się przygotować propozycji.' : 'Could not prepare a suggested reply.') });
    } finally {
      setIsHelperLoading(false);
    }
  };

  // Landlord: Approve as replacement
  const handleApproveReplacement = () => { window.location.assign('/landlord'); };

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
    <div className="r8-messages min-h-dvh md:h-screen bg-[#f8fafc] text-[#0f172a] text-left flex flex-col font-sans md:overflow-hidden">
      {/* 1. Compact Title Row */}
      <header className="px-4 sm:px-6 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 bg-transparent">
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
            <h1 className="font-bold text-slate-900 tracking-tight">
              {locale === 'pl' ? 'Wiadomości' : 'Messages'}
            </h1>
            <div className="text-xs leading-4 text-slate-500 truncate">
              {isTenant || isLandlord
                ? 'Shared inbox for your home. You and the landlord see prospect threads together.'
                : 'Direct messaging with verified tenants and landlords · Powered by Onlo.'}
            </div>
          </div>
        </div>

        {/* Right: Availability Toggle & Inquiries/Place room Segmented Control */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0">
          {devUser && (isTenant || isLandlord) && (
            <button
              type="button"
              onClick={async () => {
                const updated = await updateUserAvailability(!devUser.isAvailable, devUser.quietHours);
                setDevUser(updated);
              }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors cursor-pointer flex items-center gap-1.5 ${
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

        </div>
      </header>

      {/* 2. Main Rounded-3xl Card (holds the 3 panes and fills viewport height) */}
      {(!isAuthenticated || inboxError) && <div role="status" className="px-6 py-2 text-sm">{inboxError || (isLoading ? 'Loading inbox…' : 'Sign in to see your messages.')}</div>}
      <main className="flex-1 px-3 sm:px-6 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6 overflow-y-auto md:overflow-hidden min-h-0">
        <div className="h-auto md:h-full bg-white rounded-2xl md:rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-row">
          
          {/* PANE 1: Thread List (340px) */}
          <section
            aria-label="Thread list"
            className={`w-full md:w-[340px] shrink-0 md:border-r border-slate-200/90 flex flex-col h-auto md:h-full bg-white ${
              mobilePane === 'chat' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Filter chips on top */}
            <div className="border-b border-slate-100 bg-slate-50/60">
              <div className="min-h-14 px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <span>{locale === 'pl' ? 'Rozmowy' : 'Conversations'}</span>
                    {unreadThreadCount > 0 && (
                      <span className="min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded-full bg-[#F2705A] text-[10px] font-bold text-white" aria-label={`${unreadThreadCount} unread threads`}>
                        {unreadThreadCount > 99 ? '99+' : unreadThreadCount}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] leading-4 text-slate-500">
                    {threads.length} {locale === 'pl' ? (threads.length === 1 ? 'rozmowa' : 'rozmowy') : (threads.length === 1 ? 'conversation' : 'conversations')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsThreadListExpanded((expanded) => !expanded)}
                  className="md:hidden min-w-11 h-9 px-3 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                  aria-expanded={isThreadListExpanded}
                  aria-controls="mobile-thread-list"
                >
                  <span>{isThreadListExpanded ? (locale === 'pl' ? 'Zwiń' : 'Collapse') : (locale === 'pl' ? 'Rozwiń' : 'Expand')}</span>
                  {isThreadListExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
              <div className={`${isThreadListExpanded ? 'block' : 'hidden'} md:block px-3 pb-3 space-y-2`}>
              {true && (
                <label className="relative block">
                  <span className="sr-only">{locale === 'pl' ? 'Szukaj rozmów' : 'Search conversations'}</span>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="search"
                    value={threadSearch}
                    onChange={(event) => setThreadSearch(event.target.value)}
                    placeholder={locale === 'pl' ? 'Szukaj osoby lub mieszkania' : 'Search person or place'}
                    className="w-full h-9 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </label>
              )}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar" aria-label={locale === 'pl' ? 'Filtry rozmów' : 'Conversation filters'}>
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer shrink-0 text-xs ${
                    filter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {locale === 'pl' ? 'Wszystkie' : 'All'}
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
                  {locale === 'pl' ? 'Nieprzeczytane' : 'Unread'}
                </button>
              </div>
              </div>
            </div>

            {/* Thread Rows */}
            <div id="mobile-thread-list" className={`${isThreadListExpanded ? 'block' : 'hidden'} md:block md:flex-1 max-h-[min(58dvh,34rem)] md:max-h-none overflow-y-auto divide-y divide-slate-100 overscroll-contain`}>
              {filter === 'all' && privatePlaces.filter(p => !threadSearch.trim() || (p.title + ' ' + p.address + ' My Home Chat Rozmowa domowa').toLowerCase().includes(threadSearch.trim().toLowerCase())).map(p => (
                <button key={p.id} type="button" disabled={isSending || isHelperLoading} onClick={() => { setInputText(''); setComposerStatus(null); setIsComposerToolsExpanded(false); setShowDetails(false); setRoomPlaceId(p.id); setActiveTab('place_room'); setMobilePane('chat'); }} className={`w-full px-4 py-3 flex items-center gap-3 text-left border-l-[3px] ${activeTab === 'place_room' && roomPlaceId === p.id ? 'bg-indigo-100 border-indigo-600' : 'bg-indigo-50/80 border-indigo-300 hover:bg-indigo-100'}`}>
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0"><House className="w-5 h-5" /></div>
                  <div className="min-w-0 flex-1"><div className="font-semibold text-sm text-indigo-950 truncate">{locale === 'pl' ? 'Rozmowa domowa' : 'My Home Chat'}</div><div className="text-xs text-slate-600 truncate">{p.title}</div><div className="text-xs text-indigo-700">{locale === 'pl' ? 'Najemca i wynajmujący' : 'Tenant & landlord'}</div></div><Pin className="w-4 h-4 text-indigo-600 shrink-0" aria-label="Pinned" />
                </button>
              ))}
              {filteredThreads.length === 0 && (filter !== 'all' || privatePlaces.length === 0) ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                  <div className="text-xs font-medium">No threads matching filter.</div>
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
                      disabled={isSending || isHelperLoading}
                      onClick={() => {
                        setInputText(''); setComposerStatus(null); setIsComposerToolsExpanded(false); setShowDetails(false);
                        setActiveThreadId(t.id);
                        setActiveTab('prospects');
                        setMobilePane('chat');
                      }}
                      aria-current={isSelected ? 'true' : undefined}
                      className={`w-full px-4 py-3 text-left transition-colors flex items-start gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600 ${
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
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900 truncate">
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
                        <div className="text-xs font-medium text-indigo-600 truncate mt-0.5">
                          {place?.title || 'Place in Lublin'}
                        </div>

                        {/* One-line preview */}
                        <div className={`text-xs truncate mt-0.5 leading-snug ${isNeedsHuman ? 'font-medium text-amber-700' : 'text-slate-500'}`}>
                          {preview}
                        </div>

                        {/* Badges: unread count, Needs a human, Onlo */}
                        {(isUnread || isNeedsHuman || isOnlo || t.status === 'reserved') && <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {isUnread && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F2705A] text-white">
                              {locale === 'pl' ? 'Nowa' : 'New'}
                            </span>
                          )}

                          {isNeedsHuman && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              {locale === 'pl' ? 'Wymaga odpowiedzi' : 'Needs a human'}
                            </span>
                          )}

                          {isOnlo && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                              <OnloAvatar size={13} variant="icon" state="idle" />
                              <span>Onlo</span>
                            </span>
                          )}

                          {t.status === 'reserved' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {locale === 'pl' ? 'Wybrano następcę' : 'Replacement selected'}
                            </span>
                          )}
                        </div>}
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
            className={`flex-1 min-w-0 flex flex-col h-auto md:h-full bg-white ${
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
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs" aria-hidden="true">
                      <House className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {locale === 'pl' ? 'Rozmowa domowa' : 'My Home Chat'}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {activePlace?.address || 'Lublin'} · {locale === 'pl' ? 'Najemca i wynajmujący' : 'Tenant & landlord'}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Profile avatar and real name */}
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
                        about <span className="font-medium text-slate-700">{activePlaceTitle || 'Place in Lublin'}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {activePlace && <button type="button" onClick={() => setShowDetails(v => !v)} aria-expanded={showDetails} className="p-2 rounded-full hover:bg-slate-100 text-slate-600" aria-label="Property details"><MapPin className="w-5 h-5" /></button>}
                {activeTab === 'place_room' && <Lock className="w-4 h-4 text-slate-500" />}
                {isLandlord && activeTab === 'prospects' && activeThread && activeThread.status !== 'reserved' && <button type="button" onClick={handleApproveReplacement} aria-label="Review requests" className="p-2 rounded-full text-emerald-700"><CheckCircle2 className="w-5 h-5" /></button>}
              </div>
            </div>

            {/* Messages Scroll Area (container-scoped, scroll-stabilized) */}
            <div
              ref={messagesContainerRef}
              onScroll={handleContainerScroll}
              className="min-h-40 max-h-[calc(100dvh-22rem)] md:min-h-0 md:max-h-none md:flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/30 overscroll-contain transition-[min-height] duration-200"
            >
              {messages.length === 0 ? (
                <div className="min-h-32 flex flex-col items-center justify-center text-center text-slate-400 space-y-2.5 px-4 py-5">
                  {activeTab === 'place_room' ? (
                    <div className="w-11 h-11 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center" aria-hidden="true">
                      <Lock className="w-5 h-5" />
                    </div>
                  ) : (
                    <OnloAvatar size={48} variant="avatar" state="hello" title="Start the conversation! Onlo is ready to assist" />
                  )}
                  <div className="space-y-1 max-w-sm">
                    <div className="text-sm leading-5 font-bold text-slate-800">
                      {activeTab === 'place_room'
                        ? (locale === 'pl' ? 'Brak prywatnych wiadomości' : 'No private messages yet')
                        : (locale === 'pl' ? 'Rozpocznij rozmowę' : 'Start the conversation')}
                    </div>
                    <div className="text-xs leading-[1.125rem] text-slate-500">
                      {activeTab === 'place_room'
                        ? (locale === 'pl'
                          ? `Tylko ${placeRoomMemberNames.join(' i ') || 'uczestnicy domu'} mogą czytać ten kanał.`
                          : `Only ${placeRoomMemberNames.join(' and ') || 'the people in this home'} can read this channel.`)
                        : (locale === 'pl'
                          ? 'Napisz pierwszą wiadomość. Onlo może pomóc, gdy jesteś niedostępny.'
                          : 'Send the first message. Onlo can help when you are unavailable.')}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isMe = m.authorId === devUser?.id;
                  const isOnlo = m.authorType === 'onlo';
                  const authorName = getMessageAuthorName(m);
                  const translatedBody = liveTranslations[`message:${m.id}`];
                  const hasTranslation = Boolean(translatedBody && translatedBody !== m.body);
                  const visibleBody = hasTranslation && !showOriginal[m.id] ? translatedBody : m.body;
                  const prevMsg = idx > 0 ? messages[idx - 1] : null;
                  const showDayDivider =
                    !prevMsg ||
                    getDayDividerLabel(m.createdAt) !== getDayDividerLabel(prevMsg.createdAt);

                  return (
                    <React.Fragment key={m.id}>
                      {/* Day divider */}
                      {showDayDivider && (
                        <div className="flex items-center justify-center my-3">
                          <span className="text-[11px] font-medium text-slate-500">
                            {getDayDividerLabel(m.createdAt)}
                          </span>
                        </div>
                      )}

                      <div
                        className={`flex flex-col ${
                          isMe ? 'items-end' : 'items-start'
                        } max-w-xl ${isMe ? 'ml-auto' : 'mr-auto'}`}
                      >
                        {/* Onlo Author label with animated Onlo avatar on replies */}
                        {isOnlo && (
                          <div className="flex items-center gap-2 text-[12px] font-semibold text-indigo-700 mb-1.5 px-1">
                            <OnloAvatar size={20} variant="avatar" state="idle" className="shrink-0 shadow-xs" />
                            <span>Onlo · {locale === 'pl' ? 'Asystent mieszkaniowy AI' : 'AI housing assistant'}</span>
                          </div>
                        )}

                        {!isOnlo && !isMe && (showDayDivider || prevMsg?.authorId !== m.authorId) && (
                          <div className={`text-[10px] font-semibold text-slate-500 mb-1 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                            <span className="text-slate-700">{authorName}</span>
                          </div>
                        )}

                        {/* Message Bubble:
                            - Other participants on left in white
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
                          <div className="whitespace-pre-wrap break-words">{visibleBody}</div>
                        </div>

                        {/* Timestamp & In-bubble Translate trigger */}
                        <div className="flex items-center gap-2 mt-1 px-1 text-[9px] text-slate-400">
                          <span>
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>

                          {hasTranslation && (
                            <button
                              type="button"
                              onClick={() => setShowOriginal((current) => ({ ...current, [m.id]: !current[m.id] }))}
                              className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <Globe className="w-2.5 h-2.5" />
                              <span>{showOriginal[m.id]
                                ? (locale === 'pl' ? 'Pokaż tłumaczenie' : 'Show translation')
                                : (locale === 'pl' ? 'Tłumaczenie Opus-MT · Oryginał' : 'Opus-MT translation · Original')}
                              </span>
                            </button>
                          )}
                          {!hasTranslation && isTranslating && (
                            <span>{locale === 'pl' ? 'Tłumaczenie…' : 'Translating…'}</span>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}

              {/* Typing indicator */}
              {/* Placement 2: While Onlo writes */}
              {isHelperLoading && (
                <div className="flex flex-col items-start mr-auto max-w-md animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 mb-1 px-1">
                    <OnloAvatar size={20} variant="avatar" state="thinking" className="shrink-0" />
                    <span className="animate-pulse">Onlo is drafting a reply...</span>
                  </div>
                  <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-indigo-50 border border-indigo-150 text-slate-800 text-xs shadow-2xs">
                    <div className="flex items-center gap-1.5 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                      <span className="text-[11px] text-indigo-700 ml-1">Checking lease facts</span>
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
              {composerStatus && (
                <StatusMessage tone={composerStatus.tone} title={composerStatus.tone === 'error' ? (locale === 'pl' ? 'Nie wysłano' : 'Not sent') : undefined}>
                  {composerStatus.message}
                </StatusMessage>
              )}
              {/* Inquiry helpers stay collapsed until requested and never act on the private room. */}
              {activeTab === 'prospects' && (
                <div className="text-xs space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsComposerToolsExpanded((expanded) => !expanded)}
                    className="min-h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                    aria-label="Onlo writing tools"
                    aria-expanded={isComposerToolsExpanded}
                    aria-controls="message-writing-tools"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    
                    {isComposerToolsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  {isComposerToolsExpanded && (
                    <div id="message-writing-tools" className="flex items-center gap-2 flex-wrap" role="group" aria-label={locale === 'pl' ? 'Narzędzia pisania wiadomości' : 'Message writing tools'}>
                      {(isTenant || isLandlord) && activeThread?.handledBy === 'onlo' && <button type="button" onClick={handleTakeOver} className="px-3 py-2 rounded-full bg-slate-100">Reply myself</button>}
                      <button
                        type="button"
                        disabled={isHelperLoading}
                        onClick={handleSuggestReply}
                        className="min-h-8 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{locale === 'pl' ? 'Zaproponuj odpowiedź' : 'Suggest a reply'}</span>
                      </button>
                      <button
                        type="button"
                        disabled={isHelperLoading}
                        onClick={handleAskOnloNow}
                        className="min-h-8 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <OnloAvatar size={16} variant="avatar" state="idle" />
                        <span>{locale === 'pl' ? 'Poproś Onlo' : 'Ask Onlo now'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Pill input with round indigo send button */}
              <form onSubmit={handleSend} className="flex items-end gap-2">
                <label htmlFor="conversation-message" className="sr-only">{locale === 'pl' ? 'Wiadomość' : 'Message'}</label>
                <textarea
                  ref={composerRef}
                  id="conversation-message"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={locale === 'pl' ? 'Wiadomość…' : 'Message…'}
                  className="flex-1 min-w-0 min-h-11 box-border resize-none px-4 py-[11px] rounded-[22px] border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-base md:text-sm leading-5 text-slate-900 bg-slate-50 focus:bg-white transition-colors break-words"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  aria-busy={isSending}
                  className="w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors shadow-2xs shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              {/* One-line safety/privacy note follows the active conversation type. */}
              <div className={`${activeTab === 'place_room' || isComposerToolsExpanded ? 'flex' : 'hidden'} text-[11px] text-slate-600 text-center items-center justify-center gap-1.5`}>
                {activeTab === 'place_room' ? <Lock className="w-3 h-3 text-slate-600 shrink-0" /> : <Shield className="w-3 h-3 text-slate-600 shrink-0" />}
                <span>{activeTab === 'place_room'
                  ? (locale === 'pl' ? 'Prywatna rozmowa najemcy i wynajmującego.' : 'Private conversation between tenant and landlord.')
                  : (locale === 'pl' ? 'Onlo nie uzgadnia cen, terminów ani oględzin.' : 'Onlo never agrees to prices, dates or viewings.')}</span>
              </div>
            </div>
          </section>

          {/* PANE 3: Place Context (300px, hidden below 1180px) */}
          <section
            aria-label="Place context"
            className={`${showDetails && activePlace ? 'flex' : 'hidden'} fixed inset-0 z-50 md:static md:z-auto md:w-[300px] shrink-0 border-l border-slate-200/90 flex-col h-full bg-white overflow-y-auto p-4 space-y-4`}
          >
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Place details <button type="button" onClick={() => setShowDetails(false)} className="float-right text-indigo-600">Close</button>
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
                  {billsLabel(activePlace?.billsMode || (activePlace?.billsIncluded ? 'included' : undefined), activePlace?.fixedBillsPLN, locale)}
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
                {locale === 'pl' ? 'Osoby w tym domu' : 'People in this home'}
              </div>
              <div className="bg-white rounded-2xl border border-slate-200/80 p-3 space-y-2 text-xs">
                {[
                  {
                    name: tenantName,
                    role: locale === 'pl' ? 'Obecny najemca' : 'Current tenant',
                    avatarClass: 'bg-emerald-100 text-emerald-700',
                    badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                  },
                  {
                    name: landlordName,
                    role: locale === 'pl' ? 'Wynajmujący' : 'Landlord',
                    avatarClass: 'bg-amber-100 text-amber-700',
                    badgeClass: 'text-amber-700 bg-amber-50 border-amber-200',
                  },
                ].map((person) => (
                  <div key={person.role} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-6 h-6 rounded-full font-bold text-[10px] flex items-center justify-center shrink-0 ${person.avatarClass}`} aria-hidden="true">
                        {getInitials(person.name)}
                      </div>
                      <span className="font-semibold text-slate-800 truncate">{person.name}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${person.badgeClass}`}>
                      {person.role}
                    </span>
                  </div>
                ))}
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
