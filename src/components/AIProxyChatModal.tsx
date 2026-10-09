import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, Send, Bot, User, Sparkles, MapPin, Search, FileCheck, 
  CheckCircle2, Clock, ShieldCheck, ChevronRight 
} from 'lucide-react';
import { Listing } from '../types';
import { SupportedLocale } from '../utils/formatters';
import { useConvex, useAction, ConvexAIMessageDoc } from '../lib/convex/client';
import { api } from '../../convex/_generated/api';

interface AIProxyChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
  locale?: SupportedLocale;
  onOpenEarlyLock?: () => void;
}

export const AIProxyChatModal: React.FC<AIProxyChatModalProps> = ({
  isOpen,
  onClose,
  listing,
  locale = 'en',
  onOpenEarlyLock
}) => {
  const convex = useConvex();
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    // Seed initial greeting from AI Proxy
    const initialGreeting: ConvexAIMessageDoc = {
      _id: `init_${listing.id}`,
      _creationTime: 0,
      listingId: listing.id,
      sender: 'ai',
      content: `Cześć! I am Relok8's AI proxy for "${listing.title}". I hold verified details for this room in ${listing.city} (${listing.monthlyRentPLN} PLN/mo). Ask me about campus transit distance, roommate profiles, or initiate automated landlord consent under Art. 509 KC.`,
      functionExecuted: undefined,
      timestamp: 0,
    };
    return [initialGreeting];
  }, [convex.db.aiMessages, listing.id, listing.title, listing.city, listing.monthlyRentPLN]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim() || isGenerating) return;
    const userText = promptText.trim();
    setInputPrompt('');
    setIsGenerating(true);

    try {
      await convex.sendAIMessage(
        listing.id,
        userText,
        {
          title: listing.title,
          city: listing.city,
          address: listing.address,
          monthlyRent: listing.monthlyRentPLN,
          roomType: listing.roomType,
        }
      );
      // Reactive state automatically updates `messages` via useMemo with zero duplicate keys
    } catch (err) {
      console.error('Error generating AI proxy response:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex justify-center items-center p-3 sm:p-6 animate-in fade-in duration-200 text-left"
    >
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[650px] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-900 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <Bot className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-tight text-white">
                  Relok8 AI Proxy Chat
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Function-Calling
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate max-w-[280px] sm:max-w-md">
                {listing.title} • {listing.city}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Action Function Triggers */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0">Quick tools:</span>
          
          <button
            type="button"
            onClick={() => handleSendPrompt("Calculate proximity to university campuses")}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-indigo-500 hover:text-indigo-600 font-medium transition-all shrink-0 cursor-pointer shadow-xs"
          >
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
            <span>Campus Transit</span>
          </button>

          <button
            type="button"
            onClick={() => handleSendPrompt("Find similar listings via pgvector embedding search")}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-indigo-500 hover:text-indigo-600 font-medium transition-all shrink-0 cursor-pointer shadow-xs"
          >
            <Search className="w-3.5 h-3.5 text-indigo-500" />
            <span>Vector Match</span>
          </button>

          <button
            type="button"
            onClick={() => handleSendPrompt("Check landlord consent and Art. 509 KC status")}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-indigo-500 hover:text-indigo-600 font-medium transition-all shrink-0 cursor-pointer shadow-xs"
          >
            <FileCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>Art. 509 Consent</span>
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
          {messages.map((msg, idx) => {
            const isAI = msg.sender === 'ai';
            const uniqueKey = msg._id ? `${msg._id}_${idx}` : `msg_${idx}`;
            return (
              <div
                key={uniqueKey}
                className={`flex gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
              >
                {isAI && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                  isAI 
                    ? 'bg-white border border-slate-200/80 text-slate-800 shadow-xs' 
                    : 'bg-indigo-600 text-white shadow-xs'
                }`}>
                  {/* Function calling indicator pill if tool executed */}
                  {msg.functionExecuted && (
                    <div className="mb-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-[11px] font-mono font-medium text-indigo-700">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                      <span>fx: {msg.functionExecuted}</span>
                    </div>
                  )}

                  <div className="whitespace-pre-line font-sans">
                    {msg.content}
                  </div>

                  <div className={`text-[10px] mt-2 font-mono ${isAI ? 'text-slate-400' : 'text-indigo-200'}`}>
                    {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {!isAI && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isGenerating && (
            <div className="flex gap-3 items-center text-xs text-slate-500">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center gap-2 shadow-xs">
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] font-medium text-slate-600 ml-1">Executing Gemini function proxy...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Lock Drawer Banner */}
        {onOpenEarlyLock && (
          <div className="px-5 py-2.5 bg-indigo-50/70 border-t border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-indigo-900 font-medium">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Ready to secure this room? Place a 15-minute EarlyLock hold.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenEarlyLock();
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <span>EarlyLock Hold</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt(inputPrompt);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask about distance to your faculty, deposit, or landlord consent..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isGenerating}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-2xl transition-all cursor-pointer shrink-0 shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
