import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowUp, LockKeyhole, X } from 'lucide-react';
import { backend } from '../lib/backend';
import { api } from '../../convex/_generated/api';
import { OnloAvatar, OnloState } from './OnloAvatar';
import { TypewriterText } from './TypewriterText';
import { SupportedLocale } from '../utils/formatters';

interface OnloGlobalWidgetProps {
  locale?: SupportedLocale;
  isOpen: boolean;
  compactMobile?: boolean;
  isAuthenticated: boolean;
  onOpenChange: (open: boolean) => void;
  onRequireLogin: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'onlo';
  text: string;
  timestamp: number;
  sources?: Array<{ id: string; label: string; url?: string; kind: 'official' | 'internal' }>;
  runId?: string;
  confidence?: 'verified' | 'partial' | 'unverified';
  suggestedActions?: Array<{ id: string; label: string; kind: 'ask' | 'review' | 'navigate'; prompt?: string; href?: string; requiresConfirmation: boolean }>;
  animate?: boolean;
}

const EXIT_DURATION = 190;

function greeting(locale: SupportedLocale): ChatMessage {
  return {
    id: 'init-global-onlo',
    sender: 'onlo',
    text: locale === 'pl'
      ? 'Cześć! Jestem Onlo. Pomagam w wynajmie i przejmowaniu umów w Polsce. Zapytaj mnie o czynsz, meldunek, kaucję lub cesję najmu.'
      : 'Hey! I’m Onlo, your guide to renting and lease takeovers in Poland. Ask me about czynsz, meldunek, deposits, or taking over a lease.',
    timestamp: Date.now(),
  };
}

export const OnloGlobalWidget: React.FC<OnloGlobalWidgetProps> = ({
  locale = 'en',
  compactMobile = false,
  isOpen,
  isAuthenticated,
  onOpenChange,
  onRequireLogin,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [greeting(locale)]);
  const [sessionId, setSessionId] = useState<string | null>(() => {
    try { return localStorage.getItem('r8_onlo_general_session'); } catch { return null; }
  });
  const [ratedRuns, setRatedRuns] = useState<Set<string>>(() => new Set());
  const [memoryEnabled, setMemoryEnabled] = useState(false);
  const [typedMessageIds, setTypedMessageIds] = useState<Set<string>>(() => new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const sessionCreatedLocallyRef = useRef(false);

  const [widgetState, setWidgetState] = useState<OnloState>(() => {
    try {
      const hasSeenHello = sessionStorage.getItem('r8_onlo_hello_shown');
      if (!hasSeenHello) {
        sessionStorage.setItem('r8_onlo_hello_shown', 'true');
        return 'hello';
      }
    } catch {}
    return 'idle';
  });

  useEffect(() => {
    setMessages((previous) => previous.length === 1 && previous[0].id === 'init-global-onlo'
      ? [greeting(locale)]
      : previous);
  }, [locale]);

  useEffect(() => {
    if (!isAuthenticated || !sessionId) return;
    if (sessionCreatedLocallyRef.current) {
      sessionCreatedLocallyRef.current = false;
      return;
    }
    let cancelled = false;
    backend().query((api as any).onloSessions.messages, { sessionId }).then((history: any[]) => {
      if (cancelled || !history.length) return;
      setMessages(history.map((message) => ({
        id: String(message._id),
        sender: message.role === 'user' ? 'user' : 'onlo',
        text: message.content,
        timestamp: message.createdAt,
        sources: message.sources,
        runId: message.runId ? String(message.runId) : undefined,
      })));
    }).catch(() => {
      try { localStorage.removeItem('r8_onlo_general_session'); } catch {}
      setSessionId(null);
    });
    return () => { cancelled = true; };
  }, [isAuthenticated, sessionId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    backend().query((api as any).onloSessions.myPreferences, {}).then((preferences: any) => {
      setMemoryEnabled(Boolean(preferences?.memoryEnabled));
    }).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    let frame = 0;
    let timer = 0;
    if (isOpen) {
      setIsMounted(true);
      frame = window.requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      timer = window.setTimeout(() => setIsMounted(false), EXIT_DURATION);
    }
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => {
      if (isAuthenticated) inputRef.current?.focus();
      else panelRef.current?.querySelector<HTMLButtonElement>('[data-onlo-login]')?.focus();
    }, 220);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onOpenChange(false);
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
      (previousFocus || triggerRef.current)?.focus();
    };
  }, [isAuthenticated, isOpen, onOpenChange]);

  useEffect(() => {
    if (!isOpen || !messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'nearest',
    });
  }, [messages, isOpen, isLoading]);

  const handleSend = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isLoading) return;
    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }

    const userMsg: ChatMessage = {
      id: `usr-${crypto.randomUUID()}`,
      sender: 'user',
      text: trimmed,
      timestamp: Date.now(),
    };
    setMessages((previous) => [...previous, userMsg]);
    setInput('');
    setIsLoading(true);
    setWidgetState('thinking');

    try {
      const data: any = await backend().action((api as any).services.ask, { question: trimmed, locale, ...(sessionId ? { sessionId } : {}) });
      if (data.sessionId && data.sessionId !== sessionId) {
        sessionCreatedLocallyRef.current = true;
        setSessionId(data.sessionId);
        try { localStorage.setItem('r8_onlo_general_session', data.sessionId); } catch {}
      }
      setMessages((previous) => [...previous, {
        id: `onlo-${crypto.randomUUID()}`,
        sender: 'onlo',
        text: data.answer || (locale === 'pl' ? 'W czym mogę jeszcze pomóc?' : 'What else can I help with?'),
        timestamp: Date.now(),
        sources: data.sources,
        runId: data.runId,
        confidence: data.confidence,
        suggestedActions: data.suggestedActions,
        animate: true,
      }]);
      setWidgetState('happy');
      window.setTimeout(() => setWidgetState('idle'), 1800);
    } catch {
      setMessages((previous) => [...previous, {
        id: `error-${crypto.randomUUID()}`,
        sender: 'onlo',
        text: locale === 'pl'
          ? 'Nie udało mi się teraz odpowiedzieć. Spróbuj ponownie za chwilę.'
          : 'I couldn’t answer just now. Please try again in a moment.',
        timestamp: Date.now(),
        animate: true,
      }]);
      setWidgetState('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const rateAnswer = async (runId: string, feedback: 'helpful' | 'not_helpful') => {
    if (ratedRuns.has(runId)) return;
    await backend().mutation((api as any).onloSessions.rateRun, { runId, feedback });
    setRatedRuns((previous) => new Set(previous).add(runId));
  };

  const toggleMemory = async () => {
    const next = !memoryEnabled;
    await backend().mutation((api as any).onloSessions.updatePreferences, { memoryEnabled: next, locale });
    setMemoryEnabled(next);
  };

  const clearConversation = async () => {
    if (sessionId) await backend().mutation((api as any).onloSessions.deleteSession, { sessionId });
    try { localStorage.removeItem('r8_onlo_general_session'); } catch {}
    setSessionId(null);
    setMessages([greeting(locale)]);
  };

  const suggestionChips = locale === 'pl'
    ? ['Co zawiera czynsz?', 'Jak działa cesja?', 'Czy mogę mieć meldunek?', 'Jak chronić kaucję?']
    : ['What is in czynsz?', 'How does takeover work?', 'Can I register meldunek?', 'How do I protect my deposit?'];

  return (
    <>
      <aside
        aria-label={locale === 'pl' ? 'Asystent Onlo' : 'Onlo assistant'}
        className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-6 right-3 sm:right-4 md:right-6 z-40 select-none font-sans"
      >
        <button
          ref={triggerRef}
          type="button"
          onClick={() => onOpenChange(!isOpen)}
          className={`onlo-launcher min-h-11 rounded-full flex items-center justify-center gap-2.5 bg-slate-950 hover:bg-slate-800 text-white border border-white/10 shadow-[0_12px_32px_rgba(15,23,42,0.22)] cursor-pointer ${compactMobile ? 'w-12 h-12 p-0 md:w-auto md:h-auto md:px-4' : 'px-3.5 sm:px-4'}`}
          aria-label={locale === 'pl' ? 'Zapytaj Onlo' : 'Ask Onlo'}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls="onlo-global-dialog"
        >
          <span className="relative">
            <OnloAvatar size={28} variant="avatar" state={widgetState} title="" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950" />
          </span>
          <span className={`text-xs font-bold tracking-tight ${compactMobile ? 'hidden md:inline' : ''}`}>
            {locale === 'pl' ? 'Zapytaj Onlo' : 'Ask Onlo'}
          </span>
        </button>
      </aside>

      {isMounted && (
        <div
          className="onlo-overlay fixed inset-0 z-50 flex items-end justify-end bg-slate-950/40 backdrop-blur-[2px] sm:p-5 md:p-6"
          data-state={isVisible ? 'open' : 'closed'}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onOpenChange(false);
          }}
        >
          <div
            ref={panelRef}
            id="onlo-global-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="onlo-panel w-full sm:w-[420px] h-[min(82dvh,680px)] sm:h-[min(680px,calc(100dvh-3rem))] bg-white rounded-t-[24px] sm:rounded-[24px] shadow-[0_24px_80px_rgba(15,23,42,0.28)] border border-slate-200 flex flex-col overflow-hidden font-sans"
          >
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <span className="relative shrink-0">
                  <OnloAvatar size={40} variant="avatar" state={isLoading ? 'thinking' : widgetState} title="" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 id={titleId} className="text-base font-extrabold text-slate-950">Onlo</h2>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                      {locale === 'pl' ? 'Lokalny przewodnik' : 'Local guide'}
                    </span>
                  </div>
                  <p id={descriptionId} className="text-xs text-slate-500 leading-tight truncate">
                    {locale === 'pl' ? 'Wynajem i przejmowanie umów w Polsce' : 'Renting and lease takeovers in Poland'}
                  </p>
                  {isAuthenticated && (
                    <div className="mt-1 flex items-center gap-2 text-[10px]">
                      <button type="button" onClick={toggleMemory} className="font-semibold text-indigo-700 hover:underline">
                        {memoryEnabled
                          ? (locale === 'pl' ? 'Pamięć osobista: włączona' : 'Personal memory: on')
                          : (locale === 'pl' ? 'Pamięć osobista: wyłączona' : 'Personal memory: off')}
                      </button>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <button type="button" onClick={clearConversation} className="font-semibold text-slate-500 hover:text-rose-700">
                        {locale === 'pl' ? 'Wyczyść rozmowę' : 'Clear chat'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-10 h-10 rounded-full hover:bg-slate-100 active:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                aria-label={locale === 'pl' ? 'Zamknij czat Onlo' : 'Close Onlo chat'}
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/80 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0" aria-label={locale === 'pl' ? 'Sugerowane pytania' : 'Suggested questions'}>
              {suggestionChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleSend(chip)}
                  disabled={isLoading}
                  className="onlo-chip min-h-8 px-3 rounded-full bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-700 active:bg-indigo-50 text-[11px] font-semibold text-slate-700 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-white overscroll-contain" aria-live="polite" aria-busy={isLoading}>
              {messages.map((message) => {
                const isUser = message.sender === 'user';
                const shouldType = !isUser && Boolean(message.animate);
                const revealDetails = !shouldType || typedMessageIds.has(message.id);
                return (
                  <div key={message.id} className={`onlo-message-entry flex ${isUser ? 'justify-end' : 'items-start gap-2.5'}`}>
                    {!isUser && <OnloAvatar size={26} variant="avatar" state="static" title="" className="mt-0.5" />}
                    <div className={`max-w-[84%] ${isUser ? '' : 'space-y-1'}`}>
                      {!isUser && (
                        <div className="flex items-center gap-1.5 px-0.5">
                          <span className="text-[11px] font-bold text-slate-900">Onlo</span>
                          <time className="text-[10px] text-slate-400" dateTime={new Date(message.timestamp).toISOString()}>
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </time>
                        </div>
                      )}
                      <div className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-5 ${isUser
                        ? 'rounded-br-md bg-indigo-600 text-white shadow-xs'
                        : 'rounded-tl-md border border-slate-200 border-l-2 border-l-indigo-500 bg-slate-50 text-slate-800 shadow-xs'
                      }`}>
                        {isUser ? message.text : (
                          <TypewriterText
                            text={message.text}
                            animate={shouldType}
                            onProgress={shouldType ? () => messagesEndRef.current?.scrollIntoView({ block: 'nearest' }) : undefined}
                            onComplete={shouldType ? () => setTypedMessageIds((previous) => new Set(previous).add(message.id)) : undefined}
                          />
                        )}
                      </div>
                      {revealDetails && !isUser && message.sources && message.sources.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1" aria-label={locale === 'pl' ? 'Źródła odpowiedzi' : 'Answer sources'}>
                          {message.sources.map((source, index) => source.url ? (
                            <a
                              key={`${source.id}-${index}`}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex min-h-7 items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50"
                            >
                              {source.label}
                            </a>
                          ) : (
                            <span key={`${source.id}-${index}`} className="inline-flex min-h-7 items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                              {source.label}
                            </span>
                          ))}
                        </div>
                      )}
                      {revealDetails && !isUser && message.confidence && (
                        <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500">
                          <span className={`rounded-full border px-2 py-0.5 font-semibold ${message.confidence === 'verified' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : message.confidence === 'partial' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                            {message.confidence === 'verified'
                              ? (locale === 'pl' ? 'Oparte na źródłach' : 'Source-backed')
                              : message.confidence === 'partial'
                                ? (locale === 'pl' ? 'Częściowo potwierdzone' : 'Partially verified')
                                : (locale === 'pl' ? 'Wymaga potwierdzenia' : 'Needs confirmation')}
                          </span>
                        </div>
                      )}
                      {revealDetails && !isUser && message.suggestedActions && message.suggestedActions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {message.suggestedActions.map((action) => action.prompt && (
                            <button key={action.id} type="button" onClick={() => handleSend(action.prompt!)} disabled={isLoading} className="min-h-8 rounded-full border border-indigo-200 bg-indigo-50 px-3 text-[10px] font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50">
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                      {revealDetails && !isUser && message.runId && (
                        <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400">
                          {ratedRuns.has(message.runId) ? (
                            <span>{locale === 'pl' ? 'Dziękujemy za opinię' : 'Thanks for the feedback'}</span>
                          ) : (
                            <>
                              <span>{locale === 'pl' ? 'Pomocne?' : 'Helpful?'}</span>
                              <button type="button" onClick={() => rateAnswer(message.runId!, 'helpful')} className="min-h-7 px-2 font-semibold text-slate-600 hover:text-indigo-700">{locale === 'pl' ? 'Tak' : 'Yes'}</button>
                              <button type="button" onClick={() => rateAnswer(message.runId!, 'not_helpful')} className="min-h-7 px-2 font-semibold text-slate-600 hover:text-indigo-700">{locale === 'pl' ? 'Nie' : 'No'}</button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="onlo-message-entry flex items-start gap-2.5" role="status">
                  <OnloAvatar size={26} variant="avatar" state="thinking" title="" className="mt-0.5" />
                  <div className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl rounded-tl-md bg-indigo-50 border border-indigo-100 text-indigo-950 text-xs">
                    <span className="onlo-typing-dot" />
                    <span className="onlo-typing-dot [animation-delay:140ms]" />
                    <span className="onlo-typing-dot [animation-delay:280ms]" />
                    <span className="font-medium ml-1">{locale === 'pl' ? 'Przygotowuję odpowiedź' : 'Preparing a reply'}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3.5 border-t border-slate-100 bg-white pb-[max(0.875rem,env(safe-area-inset-bottom))] shrink-0">
              {isAuthenticated ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSend(input);
                  }}
                  className="flex items-center gap-2"
                >
                  <label htmlFor="onlo-global-input" className="sr-only">
                    {locale === 'pl' ? 'Wiadomość do Onlo' : 'Message Onlo'}
                  </label>
                  <input
                    ref={inputRef}
                    id="onlo-global-input"
                    type="text"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={locale === 'pl' ? 'Zapytaj o wynajem w Polsce…' : 'Ask about renting in Poland…'}
                    maxLength={3000}
                    className="flex-1 min-w-0 h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    aria-label={locale === 'pl' ? 'Wyślij wiadomość' : 'Send message'}
                    className="w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-40 disabled:active:scale-100 text-white flex items-center justify-center shrink-0 cursor-pointer transition-[background-color,transform]"
                  >
                    <ArrowUp className="w-4.5 h-4.5 stroke-[2.2]" />
                  </button>
                </form>
              ) : (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 flex items-center gap-3">
                  <span className="w-9 h-9 rounded-lg bg-white border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <LockKeyhole className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900">{locale === 'pl' ? 'Zaloguj się, aby porozmawiać' : 'Sign in to chat with Onlo'}</p>
                    <p className="text-[11px] text-slate-500">{locale === 'pl' ? 'Historia rozmowy pozostanie przypisana do Ciebie.' : 'Your assistant history stays connected to you.'}</p>
                  </div>
                  <button
                    data-onlo-login
                    type="button"
                    onClick={onRequireLogin}
                    className="min-h-10 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                  >
                    {locale === 'pl' ? 'Zaloguj' : 'Sign in'}
                  </button>
                </div>
              )}
              <p className="pt-2 px-1 text-[10px] leading-4 text-slate-400">
                {locale === 'pl' ? 'Wskazówki informacyjne — potwierdź warunki w umowie.' : 'General guidance — confirm important terms in your agreement.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
