import React from 'react';
import { Search, Home, LayoutGrid, MessageSquare, User } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';
import { classNames } from './ui/classNames';

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
  const isExplore = ['home', 'city', 'saved'].includes(currentPath);
  const isSaved = ['place','dashboard','list'].includes(currentPath);
  const isList = currentPath === 'services';
  const isMessages = currentPath === 'messages';
  const isProfile = currentPath === 'account';
  const itemClassName = (active: boolean) => classNames(
    'flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1 transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1',
    active ? 'font-semibold text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
  );

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
      aria-label={locale === 'pl' ? 'Nawigacja mobilna' : 'Mobile navigation'} 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 grid grid-cols-5 items-stretch shadow-[var(--shadow-raised)] pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      {/* 1. Explore */}
      <button
        type="button"
        onClick={handleHomeClick}
        className={itemClassName(isExplore)}
        aria-current={isExplore ? 'page' : undefined}
      >
        <Search aria-hidden="true" className={`w-5 h-5 ${isExplore ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
        <span className="text-[10px] leading-tight text-center break-words tracking-normal font-medium">{locale === 'pl' ? 'Szukaj' : 'Explore'}</span>
      </button>

      {/* 2. Saved */}
      <button
        type="button"
        onClick={() => { window.history.pushState({}, '', locale === 'pl' ? '/pl/place' : '/place'); window.dispatchEvent(new PopStateEvent('popstate')); }}
        className={classNames('relative', itemClassName(isSaved))}
        aria-current={isSaved ? 'page' : undefined}
        aria-label={locale === 'pl' ? 'Moje miejsce' : 'My Place'}
      >
        <div className="relative">
          <Home aria-hidden="true" className="w-5 h-5" />
          
        </div>
        <span className="text-[10px] leading-tight text-center break-words tracking-normal font-medium">{locale === 'pl' ? 'Moje miejsce' : 'My Place'}</span>
      </button>

      {/* 3. Inbox */}
      <button
        type="button"
        onClick={handleMessagesClick}
        className={itemClassName(isMessages)}
        aria-current={isMessages ? 'page' : undefined}
      >
        <MessageSquare aria-hidden="true" className={`w-5 h-5 ${isMessages ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
        <span className="text-[10px] leading-tight text-center break-words tracking-normal font-medium">{locale === 'pl' ? 'Skrzynka' : 'Inbox'}</span>
      </button>

      {/* 4. Services */}
      <button
        type="button"
        onClick={() => { window.history.pushState({}, '', locale === 'pl' ? '/pl/services' : '/services'); window.dispatchEvent(new PopStateEvent('popstate')); }}
        className={itemClassName(isList)}
        aria-current={isList ? 'page' : undefined}
      >
        <LayoutGrid aria-hidden="true" className={`w-5 h-5 ${isList ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
        <span className="text-[10px] leading-tight text-center break-words tracking-normal font-medium">{locale === 'pl' ? 'Usługi' : 'Services'}</span>
      </button>

      {/* 5. Profile */}
      <button
        type="button"
        onClick={handleProfileClick}
        className={itemClassName(isProfile)}
        aria-current={isProfile ? 'page' : undefined}
      >
        <User aria-hidden="true" className={`w-5 h-5 ${isProfile ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
        <span className="text-[10px] leading-tight text-center break-words tracking-normal font-medium">{locale === 'pl' ? 'Konto' : 'Account'}</span>
      </button>
    </nav>
  );
};
