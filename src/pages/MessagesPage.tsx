import React, { useState } from 'react';
import { ArrowLeft, MessageSquare, Send, User, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';

interface MessagesPageProps {
  onBack: () => void;
  locale?: SupportedLocale;
  currentUser?: { name: string; email: string; avatar?: string } | null;
  onOpenListing?: (id: string) => void;
}

interface ChatThread {
  id: string;
  listingTitle: string;
  tenantName: string;
  tenantAvatar: string;
  lastMessage: string;
  lastTime: string;
  unread: boolean;
  messages: { sender: 'me' | 'them'; text: string; time: string }[];
}

export const MessagesPage: React.FC<MessagesPageProps> = ({
  onBack,
  locale = 'en',
  currentUser
}) => {
  const [threads, setThreads] = useState<ChatThread[]>([
    {
      id: 't1',
      listingTitle: 'Studio near Politechnika Warszawska',
      tenantName: 'Marek S.',
      tenantAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      lastMessage: 'Hi! Yes, the studio is available from 1 Nov and the landlord approved the takeover.',
      lastTime: '10:42 AM',
      unread: false,
      messages: [
        { sender: 'me', text: 'Hi Marek! I am interested in taking over your lease on ul. Koszykowa 68 from 1 Nov. Could we schedule a viewing?', time: '10:30 AM' },
        { sender: 'them', text: 'Hi! Yes, the studio is available from 1 Nov and the landlord approved the takeover.', time: '10:42 AM' },
        { sender: 'them', text: 'Are you available this Thursday afternoon for a quick walk-through?', time: '10:43 AM' }
      ]
    }
  ]);

  const [activeThreadId, setActiveThreadId] = useState<string>('t1');
  const [inputText, setInputText] = useState('');

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      sender: 'me' as const,
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? {
              ...t,
              lastMessage: newMsg.text,
              lastTime: newMsg.time,
              messages: [...t.messages, newMsg]
            }
          : t
      )
    );

    setInputText('');
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-24 text-left">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1 -ml-1 text-slate-800 hover:text-slate-950 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="text-base sm:text-lg font-bold text-slate-900">
            {locale === 'pl' ? 'Wiadomości' : 'Messages'}
          </h1>
        </div>
      </header>

      {/* Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col h-[75vh]">
          {/* Thread header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0">
                MS
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900">{activeThread.tenantName}</div>
                <div className="text-xs text-slate-500 truncate max-w-[240px] sm:max-w-md">
                  {activeThread.listingTitle}
                </div>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
              Active Takeover
            </span>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {activeThread.messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'me' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    m.sender === 'me'
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : 'bg-slate-100 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {m.time}
                </span>
              </div>
            ))}
          </div>

          {/* Input box */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 flex items-center gap-2 bg-white">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={locale === 'pl' ? 'Napisz wiadomość...' : 'Type a message...'}
              className="flex-1 text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
