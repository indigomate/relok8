import React, { useState, useEffect, useRef, useMemo, useId } from 'react';
import { X, ArrowUp, ChevronRight, LockKeyhole } from 'lucide-react';
import { useConvexAuth } from 'convex/react';
import { Listing } from '../types';
import { SupportedLocale } from '../utils/formatters';
import { useConvex, ConvexAIMessageDoc } from '../lib/convex/client';
import { OnloAvatar } from './OnloAvatar';

interface AIProxyChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
  locale?: SupportedLocale;
  onSelectListing?: (listingId: string) => void;
  onOpenContact?: () => void;
  onRequireLogin?: () => void;
}

interface SimilarRoomItem {
  id: string;
  title: string;
  district: string;
  squareMeters: number;
  monthlyRentPLN: number;
  thumbnail: string;
}

export const AIProxyChatModal: React.FC<AIProxyChatModalProps> = ({
  isOpen,
  onClose,
  listing,
  locale = 'en',
  onSelectListing,
  onOpenContact,
  onRequireLogin,
}) => {
  const convex = useConvex();
  const { isAuthenticated } = useConvexAuth();
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [lastUserPrompt, setLastUserPrompt] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(isOpen);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  const requestClose = (afterClose?: () => void) => {
    setIsVisible(false);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setIsRendered(false);
      onClose();
      afterClose?.();
    }, 190);
  };

  useEffect(() => {
    let frame = 0;
    let timer = 0;
    if (isOpen) {
      setIsRendered(true);
      frame = window.requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      timer = window.setTimeout(() => setIsRendered(false), 190);
    }
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [isOpen]);

  useEffect(() => () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => {
      if (isAuthenticated) inputRef.current?.focus();
      else panelRef.current?.querySelector<HTMLButtonElement>('[data-onlo-login]')?.focus();
    }, 220);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        requestClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      ));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isAuthenticated, isOpen]);

  // Available sample/live similar rooms for high-affinity matches
  const fallbackSimilarRooms = useMemo<SimilarRoomItem[]>(() => {
    // Check if other listings exist in convex memory or localStorage
    const stored = localStorage.getItem('r8_listings');
    let fromStorage: Listing[] = [];
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) fromStorage = parsed;
      } catch {}
    }

    const available = fromStorage.filter((l) => l.id !== listing.id && l.city === listing.city);
    if (available.length > 0) {
      return available.slice(0, 3).map((l) => ({
        id: l.id,
        title: l.title,
        district: l.district || l.city,
        squareMeters: l.squareMeters || 26,
        monthlyRentPLN: l.monthlyRentPLN,
        thumbnail: l.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200'
      }));
    }

    return [];
  }, [listing.id, listing.city]);

  // Clean initial greeting message from Onlo as friendly local peer
  const initialGreeting = useMemo<ConvexAIMessageDoc>(() => ({
    _id: `init_${listing.id}`,
    _creationTime: 0,
    listingId: listing.id,
    sender: 'ai',
    content: locale === 'pl'
      ? `Cześć! Jestem Onlo. Znam ten pokój na ${listing.address || listing.district || listing.city} od podszewki. Śmiało pytaj o czynsz, rachunki, dojazd na uczelnię, współlokatorów, meldunek czy zasady cesji umowy!`
      : `Hey! I'm Onlo, your local friend on Relok8. I can help explain the listing, but its details have not been independently verified. Ask me about czynsz, bills, campus transit, flatmates, meldunek, or how taking over the lease works!`,
    functionExecuted: undefined,
    timestamp: Date.now() - 60000,
  }), [listing.id, listing.address, listing.district, listing.city, locale]);

  // Reactive message history derived from Convex state with strict deduplication
  const messages = useMemo(() => {
    const history = convex.db.aiMessages.filter((m) => m.listingId === listing.id);
    if (history.length > 0) {
      const seen = new Set<string>();
      return history.filter((m) => {
        if (!m || !m._id) return true;
        if (seen.has(m._id)) return false;
        seen.add(m._id);
        return true;
      });
    }
    return [initialGreeting];
  }, [convex.db.aiMessages, listing.id, initialGreeting]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
      });
    }
  }, [messages, isGenerating]);

  // Helper to strip any developer function names, brackets, JSON, or cosine metrics
  const cleanAssistantContent = (raw: string): string => {
    if (!raw) return '';
    let text = raw;
    // Remove [function: ...] or fx: tags
    text = text.replace(/\[function:[^\]]+\]/gi, '');
    text = text.replace(/fx:\s*\w+/gi, '');
    text = text.replace(/📍 Proximity Calculation:?/gi, '');
    text = text.replace(/🔍 Embedding Similarity Query:?/gi, '');
    text = text.replace(/📄 Landlord Approval Workflow:?/gi, '');
    text = text.replace(/Retrieved cosine similarity.*94\.6%/gi, '');
    text = text.replace(/High affinity match score:[^.\n]+/gi, '');
    // If it's a similar listings answer, return clean summary line
    if (text.toLowerCase().includes('embedding') || text.toLowerCase().includes('similar') || text.toLowerCase().includes('match')) {
      return text.trim();
    }
    return text.trim();
  };

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim() || isGenerating) return;
    if (!isAuthenticated) {
      onRequireLogin?.();
      return;
    }
    const userText = promptText.trim();
    setInputPrompt('');
    setIsGenerating(true);
    setHasError(false);
    setLastUserPrompt(userText);

    try {
      await convex.sendAIMessage(listing.id, userText, locale === 'pl' ? 'pl' : 'en');
    } catch (err) {
      console.error('Error generating AI response:', err);
      setHasError(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetry = () => {
    if (lastUserPrompt) {
      handleSendPrompt(lastUserPrompt);
    }
  };

  if (!isRendered) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="onlo-overlay fixed inset-0 z-50 overflow-hidden bg-slate-950/45 backdrop-blur-xs flex flex-col justify-end sm:items-end text-left sm:p-6"
      data-state={isVisible ? 'open' : 'closed'}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      {/* Bottom Sheet */}
      <div
        ref={panelRef}
        className="onlo-panel w-full sm:w-[440px] bg-white rounded-t-[24px] sm:rounded-[24px] shadow-[0_24px_80px_rgba(15,23,42,0.28)] border border-slate-200 flex flex-col h-[82dvh] sm:h-[min(680px,calc(100dvh-3rem))] overflow-hidden"
      >
        {/* Top Drag Handle */}
        <div className="pt-2 pb-1 flex justify-center shrink-0">
          <div className="w-9 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="relative">
              <OnloAvatar size={38} variant="avatar" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id={titleId} className="text-[17px] font-bold text-slate-900 leading-tight">
                  Onlo
                </h2>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                  {locale === 'pl' ? 'Twój lokalny przewodnik' : 'Local guide'}
                </span>
              </div>
              <p id={descriptionId} className="text-[12px] text-slate-500 leading-tight mt-0.5 truncate">
                {listing.title} · {listing.city}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => requestClose()}
              aria-label="Close Onlo chat"
              className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
          {(locale === 'pl' ? [
            'Co zawiera czynsz?',
            'Dojazd na uczelnię',
            'Czy jest meldunek?',
            'Jak działa przejęcie umowy?'
          ] : [
            'What is in czynsz?',
            'Commute to campus',
            'Is meldunek allowed?',
            'How does lease takeover work?'
          ]).map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleSendPrompt(chip)}
              disabled={isGenerating}
              className="h-8 px-3.5 rounded-full bg-white border border-slate-200 hover:border-slate-300 active:bg-slate-100 text-[12px] font-medium text-slate-700 shrink-0 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Messages Stream */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-5 bg-white overscroll-contain" aria-live="polite" aria-busy={isGenerating}>
          {messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            const uniqueKey = msg._id ? `${msg._id}_${idx}` : `msg_${idx}`;
            const cleanedContent = isUser ? msg.content : cleanAssistantContent(msg.content);
            const isSimilarListingsQuery = !isUser && (
              msg.functionExecuted === 'query_listing_embeddings' ||
              cleanedContent.toLowerCase().includes('similar rooms') ||
              cleanedContent.toLowerCase().includes('around pln')
            );
            const isLastAssistantMessage = !isUser && idx === messages.length - 1;

            return (
              <div key={uniqueKey} className="onlo-message-entry space-y-1.5">
                {isUser ? (
                  /* User Bubble: right-aligned, light purple/indigo soft fill, rounded-2xl with bottom-right 4px */
                  <div className="flex justify-end">
                    <div className="max-w-[85%] space-y-1">
                      <div className="rounded-2xl rounded-br-md px-4 py-2.5 bg-indigo-600 text-white text-[15px] leading-[22px] shadow-xs">
                        {msg.content}
                      </div>
                      <time className="block text-right text-[10px] text-slate-400 px-1" dateTime={new Date(msg.timestamp || Date.now()).toISOString()}>
                        {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                  </div>
                ) : (
                  /* Assistant Message: Onlo response with avatar */
                  <div className="flex items-start gap-3">
                    <OnloAvatar size={28} variant="avatar" className="mt-0.5 shrink-0" />
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">Onlo</span>
                        <span className="text-[11px] text-slate-400 font-medium">· {locale === 'pl' ? 'lokalny przewodnik' : 'local guide'}</span>
                      </div>
                      <div className="whitespace-pre-wrap text-[15px] leading-[22px] text-slate-900">
                        {cleanedContent}
                      </div>

                      {msg.confidence && (
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${msg.confidence === 'verified' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : msg.confidence === 'partial' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                          {msg.confidence === 'verified'
                            ? (locale === 'pl' ? 'Oparte na źródłach' : 'Source-backed')
                            : msg.confidence === 'partial'
                              ? (locale === 'pl' ? 'Częściowo potwierdzone' : 'Partially verified')
                              : (locale === 'pl' ? 'Wymaga potwierdzenia' : 'Needs confirmation')}
                        </span>
                      )}

                      {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {msg.suggestedActions.map((action) => action.prompt && (
                            <button key={action.id} type="button" onClick={() => handleSendPrompt(action.prompt!)} disabled={isGenerating} className="min-h-8 rounded-full border border-indigo-200 bg-indigo-50 px-3 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50">
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Similar listings tool results rendered as structured cards */}
                      {isSimilarListingsQuery && (
                        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-xs">
                          {fallbackSimilarRooms.map((room) => (
                            <button
                              type="button"
                              key={room.id}
                              onClick={() => {
                                if (onSelectListing) {
                                  requestClose(() => onSelectListing(room.id));
                                }
                              }}
                              className="w-full p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer group text-left"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={room.thumbnail}
                                  alt={room.title}
                                  className="w-[52px] h-[52px] rounded-lg object-cover bg-slate-100 shrink-0"
                                  onError={(e) => {
                                    e.currentTarget.src = '/images/listing_warsaw_center_1790621476399.jpg';
                                  }}
                                />
                                <div className="min-w-0">
                                  <h4 className="text-[14px] font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                                    {room.title}
                                  </h4>
                                  <p className="text-[13px] text-slate-500 mt-0.5 truncate">
                                    {room.district} · {room.squareMeters} m² · PLN {room.monthlyRentPLN.toLocaleString()}/mo
                                  </p>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Sources used for this answer */}
                      <div className="pt-0.5 flex flex-wrap gap-1.5" aria-label={locale === 'pl' ? 'Źródła odpowiedzi' : 'Answer sources'}>
                        {(msg.sources?.length ? msg.sources : [{ id: 'listing', label: locale === 'pl' ? 'Dane ogłoszenia Relok8' : 'Relok8 listing data', kind: 'internal' as const }]).map((source, sourceIndex) => source.url ? (
                          <a key={`${source.id}-${sourceIndex}`} href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-indigo-700 hover:bg-indigo-50">
                            [{sourceIndex}] {source.label}
                          </a>
                        ) : (
                          <span key={`${source.id}-${sourceIndex}`} className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                            [{sourceIndex}] {source.label}
                          </span>
                        ))}
                      </div>

                      {/* Disclaimer under last answer */}
                      {isLastAssistantMessage && (
                        <p className="text-[12px] leading-[18px] text-slate-400 pt-2">
                          {locale === 'pl'
                            ? 'Onlo udziela wskazówek sąsiedzkich i nie świadczy formalnych porad prawnych. '
                            : 'Onlo provides local guidance and does not provide formal legal advice. '}
                          <button
                            type="button"
                            onClick={() => {
                              requestClose(() => {
                                if (onOpenContact) onOpenContact();
                                else window.location.href = `mailto:info@relok8.online?subject=Inquiry regarding room ${listing.id}`;
                              });
                            }}
                            className="text-indigo-600 font-medium hover:underline cursor-pointer"
                          >
                            Talk to a person
                          </button>
                        </p>
                      )}
                    </div>
                  </div>
                )}

              </div>
            );
          })}

          {/* Typing Indicator with Onlo Thinking Avatar */}
          {isGenerating && (
            <div className="onlo-message-entry flex items-start gap-3 py-1" role="status">
              <OnloAvatar size={28} variant="avatar" state="thinking" className="mt-0.5 shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900">Onlo</span>
                  <span className="text-[11px] text-indigo-600 font-medium">
                    · {locale === 'pl' ? 'zastanawia się...' : 'thinking...'}
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl rounded-tl-xs bg-indigo-50/70 border border-indigo-100 text-indigo-950 text-xs shadow-2xs">
                  <span className="onlo-typing-dot" />
                  <span className="onlo-typing-dot [animation-delay:140ms]" />
                  <span className="onlo-typing-dot [animation-delay:280ms]" />
                  <span className="text-[12px] font-medium ml-1">
                    {locale === 'pl' ? 'Onlo przygotowuje odpowiedź...' : 'Onlo is answering...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Inline Error State */}
          {hasError && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between gap-3">
              <span>Couldn't answer that. Try again.</span>
              <button
                type="button"
                onClick={handleRetry}
                className="text-indigo-600 font-semibold hover:underline cursor-pointer shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Composer pinned at the bottom */}
        <div className="p-4 border-t border-slate-100 bg-white pb-[max(1rem,env(safe-area-inset-bottom))] shrink-0">
          {isAuthenticated ? <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt(inputPrompt);
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={locale === 'pl' ? 'Zapytaj Onlo o ten pokój...' : 'Ask Onlo anything about this room...'}
              className="flex-1 h-11 px-4 rounded-xl border border-slate-200 bg-white text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isGenerating}
              aria-label="Send message"
              className="w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            >
              <ArrowUp className="w-5 h-5 stroke-[2.2]" />
            </button>
          </form> : (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-white border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <LockKeyhole className="w-4 h-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900">{locale === 'pl' ? 'Zaloguj się, aby zapytać o ten pokój' : 'Sign in to ask about this room'}</p>
                <p className="text-[11px] text-slate-500">{locale === 'pl' ? 'Onlo korzysta z aktualnych danych ogłoszenia.' : 'Onlo uses the current listing details.'}</p>
              </div>
              <button data-onlo-login type="button" onClick={() => requestClose(onRequireLogin)} className="min-h-10 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer">
                {locale === 'pl' ? 'Zaloguj' : 'Sign in'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
