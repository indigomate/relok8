import { backend } from '../lib/backend';
import { api } from '../../convex/_generated/api';
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, ArrowUp, Sparkles, MessageSquare, ChevronRight, HelpCircle, Shield, CheckCircle2 } from 'lucide-react';
import { OnloAvatar, OnloState } from './OnloAvatar';
import { SupportedLocale } from '../utils/formatters';

interface OnloGlobalWidgetProps {
  locale?: SupportedLocale;
  onNavigateToListings?: () => void;
  onNavigateToIntake?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'onlo';
  text: string;
  timestamp: number;
}

export const OnloGlobalWidget: React.FC<OnloGlobalWidgetProps> = ({
  locale = 'en',
  onNavigateToListings,
  onNavigateToIntake
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Widget state machine: plays 'hello' once per browser session, then settles to 'idle'
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

  const initialGreeting: ChatMessage = {
    id: 'init-global-onlo',
    sender: 'onlo',
    text: locale === 'pl'
      ? 'Cześć! Jestem Onlo, Twoim lokalnym przewodnikiem na Relok8. Znam od podszewki polski rynek najmu dla studentów i ekspatów. Śmiało pytaj o czynsz, meldunek, cesję umowy (Art. 509 KC), rozliczenie kaucji czy najlepsze dzielnice!'
      : 'Hey! I\'m Onlo, your resident companion on Relok8. I know student and expat renting in Poland inside and out. Ask me about czynsz, meldunek, lease takeovers (Art. 509 KC), deposit protection, or student neighborhoods!',
    timestamp: Date.now()
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const handleSend = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await backend().action(api.services.ask, { question: trimmed, locale });
      {
        const onloMsg: ChatMessage = {
          id: `onlo-${Date.now()}`,
          sender: 'onlo',
          text: data.answer || (locale === 'pl' ? 'Jestem Onlo! W czym mogę Ci jeszcze pomóc?' : 'I am Onlo! How else can I help?'),
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, onloMsg]);
        setWidgetState('happy');
        setTimeout(() => setWidgetState('idle'), 2000);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { id: `error-${Date.now()}`, sender: 'onlo', text: error.message || 'The assistant is unavailable. Please sign in or contact the tenant directly.', timestamp: Date.now() }]);
      setWidgetState('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const suggestionChips = locale === 'pl' ? [
    'Co to jest czynsz?',
    'Jak działa cesja umowy?',
    'Czy dostanę meldunek?',
    'Jak chroniona jest kaucja?'
  ] : [
    'What is czynsz?',
    'How does lease takeover work?',
    'Can I register meldunek?',
    'How is deposit protected?'
  ];

  return (
    <>
      {/* Sitewide Floating Trigger Button */}
      <aside
        aria-label="Ask Onlo"
        className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-6 right-3 sm:right-4 md:right-6 z-40 select-none font-sans"
      >
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`h-10 sm:h-12 px-3 sm:px-4 rounded-full flex items-center gap-2 sm:gap-2.5 shadow-lg transition-all duration-200 cursor-pointer ${
            isOpen
              ? 'bg-slate-900 text-white hover:bg-slate-800'
              : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200/90 hover:shadow-xl hover:scale-105 active:scale-95'
          }`}
          title="Ask Onlo - Your local student housing guide in Poland"
        >
          <div className="relative">
            <OnloAvatar size={24} variant="avatar" state={widgetState} className="sm:w-7 sm:h-7" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-300" />
          </div>
          <span className="text-[11px] sm:text-xs font-bold tracking-tight">
            {isOpen ? (locale === 'pl' ? 'Zamknij' : 'Close') : (locale === 'pl' ? 'Zapytaj Onlo' : 'Ask Onlo')}
          </span>
        </button>
      </aside>

      {/* Global Onlo Chat Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-end sm:justify-end p-0 sm:p-6 bg-black/35 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div 
            className="w-full sm:max-w-md h-[82vh] sm:h-[580px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200 font-sans"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                  <OnloAvatar size={38} variant="avatar" state={isLoading ? 'thinking' : widgetState} />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-300" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-bold text-slate-900">Onlo</h2>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                      {locale === 'pl' ? 'Twój lokalny przewodnik' : 'Local guide'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight truncate">
                    {locale === 'pl' ? 'Pytania o wynajem, czynsz i cesje w Polsce' : 'Renting, czynsz & lease takeover companion'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close Onlo chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Suggestion Chips */}
            <div className="px-3.5 py-2 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
              {suggestionChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleSend(chip)}
                  disabled={isLoading}
                  className="h-7 px-3 rounded-full bg-white border border-slate-200 hover:border-slate-300 active:bg-slate-100 text-[11px] font-medium text-slate-700 shrink-0 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
              {messages.map((m) => {
                const isUser = m.sender === 'user';
                return (
                  <div key={m.id} className="space-y-1">
                    {isUser ? (
                      <div className="flex justify-end">
                        <div className="max-w-[85%] rounded-2xl rounded-br-xs px-3.5 py-2 bg-indigo-600 text-white text-xs leading-relaxed shadow-2xs">
                          {m.text}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2.5">
                        <OnloAvatar size={24} variant="avatar" state="static" className="mt-0.5 shrink-0" />
                        <div className="space-y-1 max-w-[85%]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-900">Onlo</span>
                            <span className="text-[10px] text-slate-400">· {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="rounded-2xl rounded-tl-xs px-3.5 py-2.5 bg-slate-100 text-slate-800 text-xs leading-relaxed">
                            {m.text}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-start gap-2.5 animate-in fade-in">
                  <OnloAvatar size={24} variant="avatar" state="thinking" className="mt-0.5 shrink-0" />
                  <div className="space-y-1 max-w-[85%]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-900">Onlo</span>
                      <span className="text-[10px] text-indigo-600 font-medium animate-pulse">
                        · {locale === 'pl' ? 'zastanawia się...' : 'thinking...'}
                      </span>
                    </div>
                    <div className="rounded-2xl rounded-tl-xs px-3.5 py-2.5 bg-indigo-50/70 border border-indigo-100 text-indigo-950 text-xs flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" />
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:120ms]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:240ms]" />
                      <span className="text-[11px] font-medium ml-1">
                        {locale === 'pl' ? 'Onlo przygotowuje odpowiedź...' : 'Onlo is drafting a reply...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Composer */}
            <div className="p-3 border-t border-slate-100 bg-white shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={locale === 'pl' ? 'Zapytaj Onlo o wynajem w Polsce...' : 'Ask Onlo about renting in Poland...'}
                  className="flex-1 h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  aria-label="Send message to Onlo"
                  className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer shadow-2xs"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.2]" />
                </button>
              </form>

              <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span>{locale === 'pl' ? 'Odpowiedzi w czasie rzeczywistym' : 'Real-time resident guide'}</span>
                <span>{locale === 'pl' ? '0 zł prowizji na Relok8' : '0 PLN broker fees'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
