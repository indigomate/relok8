import React from 'react';
import { Search, Heart, PlusCircle, User, HelpCircle } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';

interface MobileBottomNavProps {
  currentPath: string;
  savedCount: number;
  isLoggedIn?: boolean;
  onNavigateHome?: () => void;
  onNavigateSaved?: () => void;
  onOpenIntake?: () => void;
  onOpenListRoom?: () => void;
  onOpenLogin: () => void;
  onOpenHelp?: () => void;
  locale: SupportedLocale;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentPath,
  savedCount,
  onNavigateHome,
  onNavigateSaved,
  onOpenIntake,
  onOpenListRoom,
  onOpenLogin,
  onOpenHelp,
  locale
}) => {
  const isExplore = currentPath === 'home' || currentPath === 'city';
  const isSaved = currentPath === 'saved';
  const isHelp = currentPath === 'help';
  const isList = currentPath === 'list';

  const handleListClick = () => {
    if (onOpenListRoom) onOpenListRoom();
    else if (onOpenIntake) onOpenIntake();
    else window.location.pathname = locale === 'pl' ? '/pl/list' : '/list';
  };

  const handleHomeClick = () => {
    if (onNavigateHome) onNavigateHome();
    else window.location.pathname = locale === 'pl' ? '/pl' : '/';
  };

  const handleSavedClick = () => {
    if (onNavigateSaved) onNavigateSaved();
    else window.location.pathname = locale === 'pl' ? '/pl/saved' : '/saved';
  };

  const handleHelpClick = () => {
    if (onOpenHelp) onOpenHelp();
    else window.location.pathname = locale === 'pl' ? '/pl/help' : '/help';
  };

  return (
    <nav 
      aria-label="Mobile navigation" 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 sm:px-4 py-2 flex items-center justify-around shadow-lg pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      {/* 1. Explore */}
      <button
        type="button"
        onClick={handleHomeClick}
        className={`flex flex-col items-center gap-1 min-w-[48px] sm:min-w-[56px] py-1 cursor-pointer transition-colors ${
          isExplore ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <Search className={`w-5 h-5 ${isExplore ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className="text-[10px] tracking-tight">{locale === 'pl' ? 'Szukaj' : 'Explore'}</span>
      </button>

      {/* 2. Saved */}
      <button
        type="button"
        onClick={handleSavedClick}
        className={`relative flex flex-col items-center gap-1 min-w-[48px] sm:min-w-[56px] py-1 cursor-pointer transition-colors ${
          isSaved ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <div className="relative">
          <Heart className={`w-5 h-5 ${isSaved ? 'fill-rose-500 text-rose-500 stroke-[2.5]' : 'stroke-[1.8]'}`} />
          {savedCount > 0 && (
            <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {savedCount}
            </span>
          )}
        </div>
        <span className="text-[10px] tracking-tight">{locale === 'pl' ? 'Zapisane' : 'Saved'}</span>
      </button>

      {/* 3. List your place (CTA) */}
      <button
        type="button"
        onClick={handleListClick}
        className={`flex flex-col items-center gap-1 min-w-[52px] sm:min-w-[64px] py-1 cursor-pointer transition-colors ${
          isList ? 'text-indigo-600 font-bold' : 'text-indigo-600 hover:text-indigo-700 font-semibold'
        }`}
      >
        <PlusCircle className={`w-5 h-5 ${isList ? 'stroke-[2.8]' : 'stroke-[2.2]'}`} />
        <span className="text-[10px] tracking-tight">{locale === 'pl' ? 'Dodaj lokal' : 'List place'}</span>
      </button>

      {/* 4. Help */}
      <button
        type="button"
        onClick={handleHelpClick}
        className={`flex flex-col items-center gap-1 min-w-[48px] sm:min-w-[56px] py-1 cursor-pointer transition-colors ${
          isHelp ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <HelpCircle className={`w-5 h-5 ${isHelp ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span className="text-[10px] tracking-tight">{locale === 'pl' ? 'Pomoc' : 'Help'}</span>
      </button>

      {/* 5. Account */}
      <button
        type="button"
        onClick={onOpenLogin}
        className="flex flex-col items-center gap-1 min-w-[48px] sm:min-w-[56px] py-1 cursor-pointer text-slate-500 hover:text-slate-900 transition-colors"
      >
        <User className="w-5 h-5 stroke-[1.8]" />
        <span className="text-[10px] tracking-tight">{locale === 'pl' ? 'Profil' : 'Profile'}</span>
      </button>
    </nav>
  );
};
