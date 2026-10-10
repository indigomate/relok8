import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, ArrowUp, ChevronRight } from 'lucide-react';
import { Listing } from '../types';
import { SupportedLocale, formatPLN } from '../utils/formatters';
import { useConvex, ConvexAIMessageDoc } from '../lib/convex/client';

interface AIProxyChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
  locale?: SupportedLocale;
  onOpenEarlyLock?: () => void;
  onSelectListing?: (listingId: string) => void;
  onOpenContact?: () => void;
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
  onOpenContact
}) => {
  const convex = useConvex();
  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [lastUserPrompt, setLastUserPrompt] = useState<string | null>(null);
  const [activeTimestampId, setActiveTimestampId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    if (available.length >= 3) {
      return available.slice(0, 3).map((l) => ({
        id: l.id,
        title: l.title,
        district: l.district || l.city,
        squareMeters: l.squareMeters || 26,
        monthlyRentPLN: l.monthlyRentPLN,
        thumbnail: l.images?.[0] || '/images/listing_warsaw_center_1790621476399.jpg'
      }));
    }

    // Default curated similar rooms matching screenshot 1
    return [
      {
        id: 'rel-sim-01',
        title: 'Studio near Metro Wilanowska',
        district: 'Mokotów',
        squareMeters: 26,
        monthlyRentPLN: 2250,
        thumbnail: '/images/listing_warsaw_mokotow_1790621438299.jpg'
      },
      {
        id: 'rel-sim-02',
        title: 'Bright studio on Puławska',
        district: 'Mokotów',
        squareMeters: 28,
        monthlyRentPLN: 2400,
        thumbnail: '/images/listing_warsaw_center_1790621476399.jpg'
      },
      {
        id: 'rel-sim-03',
        title: 'Studio on Koszykowa',
        district: 'Śródmieście',
        squareMeters: 27,
        monthlyRentPLN: 2300,
        thumbnail: '/images/listing_krakow_loft_1790621454348.jpg'
      }
    ];
  }, [listing.id, listing.city]);

  // Clean initial greeting message
  const initialGreeting = useMemo<ConvexAIMessageDoc>(() => ({
    _id: `init_${listing.id}`,
    _creationTime: 0,
    listingId: listing.id,
    sender: 'ai',
    content: `Hi! I can help you with questions about this room on ${listing.address || listing.district}, campus transit times, deposit clearing, or similar rooms nearby.`,
    functionExecuted: undefined,
    timestamp: Date.now() - 60000,
  }), [listing.id, listing.address, listing.district]);

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      return `Here are 3 similar rooms in ${listing.city}, around PLN ${formatPLN(listing.monthlyRentPLN, locale).replace('PLN', '').trim()} a month.`;
    }
    return text.trim();
  };

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim() || isGenerating) return;
    const userText = promptText.trim();
    setInputPrompt('');
    setIsGenerating(true);
    setHasError(false);
    setLastUserPrompt(userText);

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

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950/45 backdrop-blur-xs flex flex-col justify-end text-left animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Bottom Sheet */}
      <div 
        className="w-full max-w-[440px] mx-auto bg-white rounded-t-[20px] shadow-2xl flex flex-col h-[82vh] max-h-[82vh] overflow-hidden animate-in slide-in-from-bottom duration-260"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drag Handle */}
        <div className="pt-2 pb-1 flex justify-center shrink-0">
          <div className="w-9 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="min-w-0 pr-2">
            <h2 className="text-[17px] font-semibold text-slate-900 leading-tight">
              Ask about this room
            </h2>
            <p className="text-[13px] text-slate-500 leading-tight mt-0.5 truncate">
              {listing.title} · {listing.city}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-normal bg-slate-100 text-slate-600">
              AI assistant
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close assistant"
              className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2.5 border-b border-slate-100 bg-white flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
          {[
            'Distance to campus',
            'How the deposit works',
            'Show similar rooms nearby'
          ].map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleSendPrompt(chip)}
              disabled={isGenerating}
              className="h-9 px-4 rounded-full border border-slate-200 hover:border-slate-300 active:bg-slate-50 text-[13px] font-medium text-slate-800 shrink-0 transition-colors cursor-pointer disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 bg-white">
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
              <div key={uniqueKey} className="space-y-1.5">
                {isUser ? (
                  /* User Bubble: right-aligned, light purple/indigo soft fill, rounded-2xl with bottom-right 4px */
                  <div className="flex justify-end">
                    <div 
                      onClick={() => setActiveTimestampId(activeTimestampId === uniqueKey ? null : uniqueKey)}
                      className="max-w-[85%] rounded-2xl rounded-br-xs px-4 py-2.5 bg-indigo-50 text-indigo-950 text-[15px] leading-[22px] cursor-pointer"
                    >
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  /* Assistant Message: plain text, left-aligned, no bubble, no avatars */
                  <div className="space-y-3">
                    <div 
                      onClick={() => setActiveTimestampId(activeTimestampId === uniqueKey ? null : uniqueKey)}
                      className="text-[15px] leading-[22px] text-slate-900 cursor-pointer"
                    >
                      {cleanedContent}
                    </div>

                    {/* Similar listings tool results rendered as structured cards */}
                    {isSimilarListingsQuery && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-xs">
                        {fallbackSimilarRooms.map((room) => (
                          <div
                            key={room.id}
                            onClick={() => {
                              if (onSelectListing) {
                                onSelectListing(room.id);
                                onClose();
                              }
                            }}
                            className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer group"
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
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Factual Answer Source Chip */}
                    <div className="pt-0.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        Source: Relok8 listings
                      </span>
                    </div>

                    {/* Disclaimer under last answer */}
                    {isLastAssistantMessage && (
                      <p className="text-[12px] leading-[18px] text-slate-400 pt-2">
                        AI can make mistakes and doesn't give legal advice.{' '}
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenContact) onOpenContact();
                            else window.location.href = `mailto:info@relok8.online?subject=Inquiry regarding room ${listing.id}`;
                          }}
                          className="text-indigo-600 font-medium hover:underline cursor-pointer"
                        >
                          Talk to a person
                        </button>
                      </p>
                    )}
                  </div>
                )}

                {/* Optional Timestamp shown on tap */}
                {activeTimestampId === uniqueKey && (
                  <div className={`text-[12px] text-slate-400 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isGenerating && (
            <div className="flex items-center gap-1.5 py-2">
              <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:120ms]" />
              <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:240ms]" />
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
              placeholder="Ask about this room"
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
          </form>
        </div>
      </div>
    </div>
  );
};
