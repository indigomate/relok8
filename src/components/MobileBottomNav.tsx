import React from 'react';
import { Search, Heart, PlusCircle, MessageSquare, User } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';

interface MobileBottomNavProps {
  currentPath: string;
  savedCount: number;
  isLoggedIn?: boolean;
  onNavigateHome?: () => void;
  onNavigateSaved?: () => void;
  onNavigateAccount?: () => void;
  onNavigateMessages?: () => void;
  onOpenIntake?: () => void;
  onOpenListRoom?: () => void;
  onOpenHelp?: () => void;
  onOpenLogin: () => void;
  locale: SupportedLocale;
  currentUser?: any | null;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentPath,
  savedCount,
  onNavigateHome,
  onNavigateSaved,
  onNavigateAccount,
  onNavigateMessages,
  onOpenIntake,
  onOpenListRoom,
  onOpenLogin,
  locale,
  currentUser
}) => {
  const isExplore = currentPath === 'home' || currentPath === 'city';
  const isSaved = currentPath === 'saved';
  const isList = currentPath === 'list';
  const isMessages = currentPath === 'messages';
  const isProfile = currentPath === 'account';

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

  const handleMessagesClick = () => {
    if (onNavigateMessages) onNavigateMessages();
    else if (onNavigateAccount) onNavigateAccount();
    else window.location.pathname = locale === 'pl' ? '/pl/messages' : '/messages';
  };

  const handleProfileClick = () => {
    if (currentUser) {
      if (onNavigateAccount) onNavigateAccount();
      else window.location.pathname = locale === 'pl' ? '/pl/account' : '/account';
    } else {
      onOpenLogin();
    }
  };

  return (
    <nav 
      aria-label="Mobile navigation" 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-3 py-2 flex items-center justify-around shadow-sm pb-[max(0.6rem,env(safe-area-inset-bottom))]"
    >
      {/* 1. Explore */}
      <button
        type="button"
        onClick={handleHomeClick}
        className={`flex flex-col items-center gap-0.5 min-w-[50px] py-1 cursor-pointer transition-colors ${
          isExplore ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <Search className={`w-5 h-5 ${isExplore ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
        <span className="text-[10px] tracking-normal font-medium">{locale === 'pl' ? 'Szukaj' : 'Explore'}</span>
      </button>

      {/* 2. Saved */}
      <button
        type="button"
        onClick={handleSavedClick}
        className={`relative flex flex-col items-center gap-0.5 min-w-[50px] py-1 cursor-pointer transition-colors ${
          isSaved ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <div className="relative">
          <Heart className={`w-5 h-5 ${isSaved ? 'fill-indigo-600 text-indigo-600 stroke-[2.4]' : 'stroke-[1.8]'}`} />
          {savedCount > 0 && (
            <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-indigo-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {savedCount}
            </span>
          )}
        </div>
        <span className="text-[10px] tracking-normal font-medium">{locale === 'pl' ? 'Zapisane' : 'Saved'}</span>
      </button>

      {/* 3. List */}
      <button
        type="button"
        onClick={handleListClick}
        className={`flex flex-col items-center gap-0.5 min-w-[50px] py-1 cursor-pointer transition-colors ${
          isList ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <PlusCircle className={`w-5 h-5 ${isList ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
        <span className="text-[10px] tracking-normal font-medium">{locale === 'pl' ? 'Dodaj' : 'List'}</span>
      </button>

      {/* 4. Messages */}
      <button
        type="button"
        onClick={handleMessagesClick}
        className={`flex flex-col items-center gap-0.5 min-w-[50px] py-1 cursor-pointer transition-colors ${
          isMessages ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <MessageSquare className={`w-5 h-5 ${isMessages ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
        <span className="text-[10px] tracking-normal font-medium">{locale === 'pl' ? 'Wiadomości' : 'Messages'}</span>
      </button>

      {/* 5. Profile */}
      <button
        type="button"
        onClick={handleProfileClick}
        className={`flex flex-col items-center gap-0.5 min-w-[50px] py-1 cursor-pointer transition-colors ${
          isProfile ? 'text-indigo-600 font-semibold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <User className={`w-5 h-5 ${isProfile ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
        <span className="text-[10px] tracking-normal font-medium">{locale === 'pl' ? 'Profil' : 'Profile'}</span>
      </button>
    </nav>
  );
};
