import React from 'react';
import { Search, Bookmark, PlusCircle, User, FileText } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';

interface MobileBottomNavProps {
  currentPath: string;
  savedCount: number;
  isLoggedIn: boolean;
  onOpenIntake: () => void;
  onOpenLogin: () => void;
  locale: SupportedLocale;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentPath,
  savedCount,
  isLoggedIn,
  onOpenIntake,
  onOpenLogin,
  locale
}) => {
  const isExplore = currentPath === 'home' || currentPath === 'city' || currentPath === 'rooms';
  const isSaved = currentPath === 'saved';
  const isHowItWorks = currentPath === 'how-it-works';

  return (
    <nav 
      aria-label="Mobile navigation" 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 px-4 py-2 flex items-center justify-around shadow-lg pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      {/* 1. Explore */}
      <button
        type="button"
        onClick={() => {
          window.location.hash = '#/rooms';
        }}
        className={`flex flex-col items-center gap-1 min-w-[56px] py-1 cursor-pointer transition-colors ${
          isExplore ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <Search className={`w-5 h-5 ${isExplore ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className="text-[10px] tracking-tight">{locale === 'pl' ? 'Szukaj' : 'Explore'}</span>
      </button>

      {/* 2. Saved */}
      <button
        type="button"
        onClick={() => {
          window.location.hash = '#/saved';
        }}
        className={`relative flex flex-col items-center gap-1 min-w-[56px] py-1 cursor-pointer transition-colors ${
          isSaved ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <div className="relative">
          <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-indigo-600 stroke-[2.5]' : 'stroke-[1.8]'}`} />
          {savedCount > 0 && (
            <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-indigo-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {savedCount}
            </span>
          )}
        </div>
        <span className="text-[10px] tracking-tight">{locale === 'pl' ? 'Zapisane' : 'Saved'}</span>
      </button>

      {/* 3. List a Room (CTA) */}
      <button
        type="button"
        onClick={() => {
          window.location.hash = '#/list-your-room';
          onOpenIntake();
        }}
        className="flex flex-col items-center gap-1 min-w-[56px] py-1 cursor-pointer text-slate-700 hover:text-indigo-600 transition-colors"
      >
        <PlusCircle className="w-5 h-5 text-indigo-600 stroke-[2.2]" />
        <span className="text-[10px] font-semibold text-slate-800">{locale === 'pl' ? 'Dodaj' : 'List Room'}</span>
      </button>

      {/* 4. How It Works */}
      <button
        type="button"
        onClick={() => {
          window.location.hash = '#/how-it-works';
        }}
        className={`flex flex-col items-center gap-1 min-w-[56px] py-1 cursor-pointer transition-colors ${
          isHowItWorks ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <FileText className={`w-5 h-5 ${isHowItWorks ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className="text-[10px] tracking-tight">{locale === 'pl' ? 'Zasady' : 'How it works'}</span>
      </button>

      {/* 5. Account / Log In */}
      <button
        type="button"
        onClick={onOpenLogin}
        className="flex flex-col items-center gap-1 min-w-[56px] py-1 cursor-pointer text-slate-500 hover:text-slate-900 transition-colors"
      >
        <div className="relative">
          <User className="w-5 h-5 stroke-[1.8]" />
          {isLoggedIn && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white" />
          )}
        </div>
        <span className="text-[10px] tracking-tight">
          {isLoggedIn ? (locale === 'pl' ? 'Konto' : 'Profile') : (locale === 'pl' ? 'Zaloguj' : 'Log in')}
        </span>
      </button>
    </nav>
  );
};
