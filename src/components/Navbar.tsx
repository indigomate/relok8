import React, { useState, useRef, useEffect } from 'react';
import { Globe, Menu, User, Heart, Sun, Moon, HelpCircle, FileText, ArrowRight, Check } from 'lucide-react';
import { Relok8Logo } from './BrandLogo';
import { SupportedLocale } from '../utils/formatters';
import { t } from '../utils/translations';

interface NavbarProps {
  onOpenIntake: () => void;
  onOpenLeaveYourLease: () => void;
  savedCount: number;
  onToggleSavedOnly: () => void;
  isSavedOnly: boolean;
  locale: SupportedLocale;
  setLocale: (l: SupportedLocale) => void;
  theme: 'dark' | 'light';
  setTheme: (th: 'dark' | 'light') => void;
  onOpenHelp: () => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenIntake,
  onOpenLeaveYourLease,
  savedCount,
  onToggleSavedOnly,
  isSavedOnly,
  locale,
  setLocale,
  theme,
  setTheme,
  onOpenHelp,
  onOpenLogin
}) => {
  const strings = t[locale];
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
    <header className="sticky top-0 z-50 h-[76px] backdrop-blur-md bg-white/80 border-b border-slate-100 transition-colors">
      <div className="max-w-[1280px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo */}
        <a
          href="/"
          className="shrink-0 flex items-center focus-visible:outline-none"
          aria-label="Relok8 Home"
        >
          <Relok8Logo height={30} theme={theme} />
        </a>

        {/* Center: Clean Site Navigation Links (Desktop) with border-b-2 active & hover underlines */}
        <nav className="hidden md:flex items-center gap-7 text-[14px] font-medium text-slate-600">
          <a
            href="#/rooms"
            onClick={(e) => {
              const target = document.getElementById('rooms');
              if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="hover:text-slate-900 transition-all cursor-pointer border-b-2 border-transparent hover:border-indigo-600 pb-1"
          >
            {locale === 'pl' ? 'Dostępne pokoje' : locale === 'uk' ? 'Доступні кімнати' : 'Available rooms'}
          </a>
          <a
            href="#how-it-works"
            className="hover:text-slate-900 transition-all cursor-pointer border-b-2 border-transparent hover:border-indigo-600 pb-1"
          >
            {locale === 'pl' ? 'Jak to działa' : locale === 'uk' ? 'Як це працює' : 'How it works'}
          </a>
          <button
            type="button"
            onClick={() => {
              window.location.hash = '#/leave-your-lease';
              onOpenLeaveYourLease();
            }}
            className="text-indigo-600 hover:text-indigo-700 transition-all cursor-pointer font-semibold border-b-2 border-indigo-600 pb-1"
          >
            {locale === 'pl' ? 'Przekaż najem' : locale === 'uk' ? 'Передати оренду' : 'Leave your lease'}
          </button>
        </nav>

        {/* Right Nav Actions (Airbnb style: "List a room", Language, Account Dropdown Pill) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* "List a room" button */}
          <button
            type="button"
            onClick={() => {
              window.location.hash = '#/list-your-room';
              onOpenIntake();
            }}
            className="hidden sm:inline-flex items-center text-[13px] font-semibold text-slate-700 hover:bg-slate-100 px-3.5 py-2 rounded-full transition-colors cursor-pointer"
          >
            {strings.listYourRoom}
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative" ref={langRef}>
            <button
              type="button"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              aria-label="Change language"
              className="p-2.5 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Globe className="w-4 h-4" strokeWidth={1.8} />
              <span className="text-[12px] font-bold uppercase">{locale}</span>
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in duration-100">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Language / Język
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLocale('en');
                    setIsLangMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-[13px] flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    locale === 'en' ? 'font-bold text-indigo-600' : 'text-slate-700'
                  }`}
                >
                  <span>English</span>
                  {locale === 'en' && <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLocale('pl');
                    setIsLangMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-[13px] flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    locale === 'pl' ? 'font-bold text-indigo-600' : 'text-slate-700'
                  }`}
                >
                  <span>Polski</span>
                  {locale === 'pl' && <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLocale('uk');
                    setIsLangMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-[13px] flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    locale === 'uk' ? 'font-bold text-indigo-600' : 'text-slate-700'
                  }`}
                >
                  <span>Українська</span>
                  {locale === 'uk' && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Airbnb-style Account Dropdown Pill Button */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
              aria-label="Main menu"
              className="flex items-center gap-2.5 pl-3.5 pr-2 py-1.5 border border-slate-300 hover:shadow-md rounded-full bg-white transition-all duration-150 cursor-pointer text-slate-700"
            >
              <Menu className="w-4 h-4 text-slate-700" strokeWidth={2} />
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
                <User className="w-4 h-4" strokeWidth={2} />
              </div>
              {savedCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#FF6B5B]" />
              )}
            </button>

            {/* Dropdown Card - Matched to User's Uploaded Screenshot */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-[280px] bg-white border border-slate-200/90 rounded-[20px] shadow-2xl py-2 z-50 text-left animate-in fade-in duration-150">
                
                {/* 1. Languages & Currency */}
                <button
                  type="button"
                  onClick={() => {
                    setIsLangMenuOpen(true);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-[14px] text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-slate-500" strokeWidth={1.8} />
                  <span>{strings.accountLanguages} (PLN)</span>
                </button>

                {/* 2. Help Center */}
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    window.location.hash = '#/help';
                    onOpenHelp();
                  }}
                  className="w-full px-4 py-2.5 text-[14px] text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-slate-500" strokeWidth={1.8} />
                  <span>{strings.accountHelp}</span>
                </button>

                <div className="my-1.5 border-t border-slate-100" />

                {/* 3. "Become a host / List your room" Banner Card */}
                <div className="px-3 py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      window.location.hash = '#/list-your-room';
                      onOpenIntake();
                    }}
                    className="w-full p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-slate-900 group-hover:text-indigo-600">
                        {strings.accountListRoomBanner}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-[12px] text-slate-500 mt-1 leading-snug">
                      {strings.accountListRoomSub}
                    </p>
                  </button>
                </div>

                {/* 4. Leaving early? Transfer lease */}
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    window.location.hash = '#/leave-your-lease';
                    onOpenLeaveYourLease();
                  }}
                  className="w-full px-4 py-2.5 text-[14px] text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-slate-500" strokeWidth={1.8} />
                  <span>{strings.accountTransferLease}</span>
                </button>

                {/* 5. Saved rooms */}
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onToggleSavedOnly();
                  }}
                  className={`w-full px-4 py-2.5 text-[14px] flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                    isSavedOnly ? 'font-semibold text-[#FF6B5B]' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Heart className={`w-4 h-4 ${isSavedOnly ? 'fill-[#FF6B5B] text-[#FF6B5B]' : 'text-slate-500'}`} strokeWidth={1.8} />
                    <span>{strings.accountSavedRooms}</span>
                  </div>
                  {savedCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
                      {savedCount}
                    </span>
                  )}
                </button>

                {/* 6. Theme Toggle inside Menu */}
                <button
                  type="button"
                  onClick={() => {
                    setTheme(theme === 'dark' ? 'light' : 'dark');
                  }}
                  className="w-full px-4 py-2.5 text-[14px] text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4 text-slate-500" strokeWidth={1.8} />
                    ) : (
                      <Moon className="w-4 h-4 text-slate-500" strokeWidth={1.8} />
                    )}
                    <span>{theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}</span>
                  </div>
                </button>

                <div className="my-1.5 border-t border-slate-100" />

                {/* 7. Log in or sign up */}
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenLogin();
                  }}
                  className="w-full px-4 py-2.5 text-[14px] font-semibold text-slate-900 hover:bg-slate-50 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-700" strokeWidth={1.8} />
                  <span>{strings.accountLogin}</span>
                </button>

              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
