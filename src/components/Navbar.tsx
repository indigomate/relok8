import React, { useState, useRef, useEffect } from 'react';
import { 
  Globe, Menu, User, Heart, HelpCircle, 
  MessageSquare, Home, Settings, LogOut, Check, LogIn
} from 'lucide-react';
import { Show, useClerk } from '@clerk/react';
import { Relok8Logo } from './BrandLogo';
import { SupportedLocale } from '../utils/formatters';
import { t } from '../utils/translations';
import { SearchBar, SearchState } from './SearchBar';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
  phone?: string;
  university?: string;
  isVerified?: boolean;
}

interface NavbarProps {
  onOpenListPlace: () => void;
  savedCount: number;
  locale: SupportedLocale;
  onSelectLocale: (locale: SupportedLocale) => void;
  theme?: 'dark' | 'light';
  setTheme?: (th: 'dark' | 'light') => void;
  onOpenHelp: () => void;
  onOpenLogin: (mode?: 'signin' | 'signup') => void;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
  onNavigateSaved: () => void;
  searchState: SearchState;
  onSearchChange: (newState: Partial<SearchState>) => void;
  onExpandSearch?: () => void;
  isCompactSearchVisible?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenListPlace,
  savedCount,
  locale,
  onSelectLocale,
  theme,
  setTheme,
  onOpenHelp,
  onOpenLogin,
  currentUser,
  onLogout,
  onNavigateSaved,
  searchState,
  onSearchChange,
  onExpandSearch,
  isCompactSearchVisible = true
}) => {
  const strings = t[locale === 'pl' ? 'pl' : 'en'];
  const clerk = useClerk();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 h-[72px] bg-white/95 backdrop-blur-md border-b border-slate-200 transition-colors">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo */}
        <a
          href={locale === 'pl' ? '/pl' : '/'}
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState({}, '', locale === 'pl' ? '/pl' : '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          className="shrink-0 flex items-center focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none rounded-lg"
          aria-label="Relok8 Home"
        >
          <Relok8Logo height={30} theme={theme} />
        </a>

        {/* Centre: Search bar (§4.2 compact state) */}
        {isCompactSearchVisible && (
          <div className="hidden md:flex flex-1 justify-center max-w-xs md:max-w-sm lg:max-w-md mx-2">
            <SearchBar
              mode="compact"
              searchState={searchState}
              onSearchChange={onSearchChange}
              locale={locale}
              onExpandClick={onExpandSearch}
            />
          </div>
        )}

        {/* Right: List your place · Saved · Language · Account menu */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          
          {/* List your place (hidden on mobile where MobileBottomNav has primary CTA) */}
          <button
            type="button"
            onClick={onOpenListPlace}
            className="hidden sm:inline-flex items-center text-xs sm:text-sm font-semibold text-slate-800 hover:text-indigo-600 hover:bg-slate-50 px-3 py-2 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none cursor-pointer whitespace-nowrap"
          >
            {strings.listYourPlace}
          </button>

          {/* Saved (with count only if > 0) */}
          <button
            type="button"
            onClick={onNavigateSaved}
            aria-label={`${strings.saved} (${savedCount})`}
            className="relative min-w-[40px] min-h-[40px] p-2 text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-colors flex items-center justify-center focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none"
          >
            <Heart className="w-5 h-5" />
            {savedCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-scale-in">
                {savedCount}
              </span>
            )}
          </button>

          {/* Language Switch */}
          <div className="relative" ref={langRef}>
            <button
              type="button"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="min-w-[40px] min-h-[40px] p-2 text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-colors flex items-center justify-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none"
              aria-label="Change language"
            >
              <Globe className="w-5 h-5" />
              <span className="text-xs font-bold uppercase">{locale}</span>
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-36 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelectLocale('en');
                    setIsLangMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between hover:bg-slate-50 ${
                    locale === 'en' ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-700'
                  }`}
                >
                  <span>English (EN)</span>
                  {locale === 'en' && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectLocale('pl');
                    setIsLangMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between hover:bg-slate-50 ${
                    locale === 'pl' ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-slate-700'
                  }`}
                >
                  <span>Polski (PL)</span>
                  {locale === 'pl' && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
              </div>
            )}
          </div>

          <Show when="signed-out">
            <button
              type="button"
              onClick={() => onOpenLogin('signin')}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-full transition-all shadow-xs cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{strings.logIn}</span>
            </button>
          </Show>

          {/* Account Menu (Dropdown) */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border border-slate-200 hover:shadow-md transition-all text-slate-700 hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none cursor-pointer"
              aria-label="Account menu"
            >
              <Menu className="w-4 h-4" />
              <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 overflow-hidden">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
            </button>

            {/* Dropdown panel - account items only (§4.5) */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-2xl py-2 z-50 divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 text-left">
                {/* User section */}
                {!currentUser ? (
                  /* GUEST MENU (§4.5): Log in · Sign up · Saved · Help · Theme */
                  <div className="p-2 space-y-1">
                    {/* Sign-up promo card with WCAG AA contrast (light text on dark indigo) */}
                    <div className="p-3 rounded-xl bg-indigo-900 text-white mb-2">
                      <div className="text-xs font-bold text-white">
                        {locale === 'pl' ? 'Wprowadź się bez prowizji' : 'Move in with 0 PLN fee'}
                      </div>
                      <div className="text-[11px] text-indigo-200 mt-0.5 leading-snug">
                        {locale === 'pl' ? 'Zaloguj się, aby kontaktować najemców.' : 'Sign in to contact tenants and save listings.'}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onOpenLogin('signup');
                        }}
                        className="mt-2.5 w-full py-1.5 text-center text-xs font-bold bg-white text-indigo-900 rounded-lg hover:bg-slate-100 transition-colors shadow-xs"
                      >
                        {strings.signUp}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenLogin('signin');
                      }}
                      className="w-full px-3 py-2 rounded-lg text-left text-xs font-semibold text-slate-800 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span>{strings.logIn}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenLogin('signup');
                      }}
                      className="w-full px-3 py-2 rounded-lg text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span>{strings.signUp}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onNavigateSaved();
                      }}
                      className="w-full px-3 py-2 rounded-lg text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span>{strings.saved}</span>
                      {savedCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {savedCount}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenHelp();
                      }}
                      className="w-full px-3 py-2 rounded-lg text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span>{strings.help}</span>
                    </button>
                  </div>
                ) : (
                  /* LOGGED IN MENU (§4.5): Messages · Saved · My listings · Account settings · Help · Log out */
                  <div className="p-2 space-y-1">
                    <div className="px-3 py-2 mb-1">
                      <div className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        window.history.pushState({}, '', locale === 'pl' ? '/pl/messages' : '/messages');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      className="w-full px-3 py-2 rounded-lg text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                      <span>{strings.messages}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onNavigateSaved();
                      }}
                      className="w-full px-3 py-2 rounded-lg text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-slate-400" />
                        <span>{strings.saved}</span>
                      </div>
                      {savedCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {savedCount}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        window.history.pushState({}, '', locale === 'pl' ? '/pl/dashboard' : '/dashboard');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      className="w-full px-3 py-2 rounded-lg text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Home className="w-4 h-4 text-slate-400" />
                      <span>{strings.myListings}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        window.history.pushState({}, '', locale === 'pl' ? '/pl/account' : '/account');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      className="w-full px-3 py-2 rounded-lg text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>{strings.accountSettings}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        clerk.openUserProfile();
                      }}
                      className="w-full px-3 py-2 rounded-lg text-left text-xs font-medium text-indigo-600 hover:bg-indigo-50 flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4 text-indigo-600" />
                      <span>{locale === 'pl' ? 'Bezpieczeństwo i profil Clerk' : 'Manage Clerk Account'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenHelp();
                      }}
                      className="w-full px-3 py-2 rounded-lg text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <HelpCircle className="w-4 h-4 text-slate-400" />
                      <span>{strings.help}</span>
                    </button>
                  </div>
                )}

                {/* Logout (§4.1) */}
                {currentUser && onLogout && (
                  <div className="p-2 space-y-1">
                    <button
                      type="button"
                      onClick={async () => {
                        setIsDropdownOpen(false);
                        try {
                          await clerk.signOut();
                        } catch (e) {}
                        onLogout();
                      }}
                      className="w-full px-3 py-2 rounded-lg text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{strings.logOut}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
