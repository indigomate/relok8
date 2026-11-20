import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowUp, LockKeyhole, Sparkles, X } from 'lucide-react';
import { backend } from '../lib/backend';
import { api } from '../../convex/_generated/api';
import { OnloAvatar, OnloState } from './OnloAvatar';
import { SupportedLocale } from '../utils/formatters';

interface OnloGlobalWidgetProps {
  locale?: SupportedLocale;
  isOpen: boolean;
  isAuthenticated: boolean;
  onOpenChange: (open: boolean) => void;
  onRequireLogin: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'onlo';
  text: string;
  timestamp: number;
}

const EXIT_DURATION = 190;

function greeting(locale: SupportedLocale): ChatMessage {
  return {
    id: 'init-global-onlo',
    sender: 'onlo',
    text: locale === 'pl'
      ? 'Cześć! Jestem Onlo — przewodnikiem po wynajmie i przejmowaniu umów w Polsce. Zapytaj mnie o czynsz, meldunek, kaucję lub cesję najmu.'
      : 'Hey! I’m Onlo, your guide to renting and lease takeovers in Poland. Ask me about czynsz, meldunek, deposits, or taking over a lease.',
    timestamp: Date.now(),
  };
}

export const OnloGlobalWidget: React.FC<OnloGlobalWidgetProps> = ({
  locale = 'en',
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

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
      const data = await backend().action(api.services.ask, { question: trimmed, locale });
      setMessages((previous) => [...previous, {
        id: `onlo-${crypto.randomUUID()}`,
        sender: 'onlo',
        text: data.answer || (locale === 'pl' ? 'W czym mogę jeszcze pomóc?' : 'What else can I help with?'),
        timestamp: Date.now(),
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
      }]);
      setWidgetState('idle');
    } finally {
      setIsLoading(false);
    }
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
          className="onlo-launcher min-h-11 px-3.5 sm:px-4 rounded-full flex items-center gap-2.5 bg-slate-950 hover:bg-slate-800 text-white border border-white/10 shadow-[0_12px_32px_rgba(15,23,42,0.22)] cursor-pointer"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls="onlo-global-dialog"
        >
          <span className="relative">
            <OnloAvatar size={28} variant="avatar" state={widgetState} title="" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950" />
          </span>
          <span className="text-xs font-bold tracking-tight">
            {locale === 'pl' ? 'Zapytaj Onlo' : 'Ask Onlo'}
          </span>
          <Sparkles className="w-3.5 h-3.5 text-indigo-300" aria-hidden="true" />
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
                      <div className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-5 ${isUser
                        ? 'rounded-br-md bg-indigo-600 text-white shadow-xs'
                        : 'rounded-tl-md bg-slate-100 text-slate-800 border border-slate-200/60'
                      }`}>
                        {message.text}
                      </div>
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
                    <span className="font-medium ml-1">{locale === 'pl' ? 'Onlo odpowiada…' : 'Onlo is answering…'}</span>
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
