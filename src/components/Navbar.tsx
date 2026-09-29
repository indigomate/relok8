import React, { useState, useRef, useEffect } from 'react';
import { 
  Globe, Menu, User, Bookmark, Sun, Moon, HelpCircle, FileText, 
  ArrowRight, Check, MapPin, Shield, Sparkles, LogOut, CheckCircle2,
  GraduationCap
} from 'lucide-react';
import { Relok8Logo } from './BrandLogo';
import { SupportedLocale } from '../utils/formatters';
import { t } from '../utils/translations';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: string;
  university?: string;
  avatar?: string;
}

interface NavbarProps {
  onOpenIntake: () => void;
  onOpenLeaveYourLease: () => void;
  savedCount: number;
  locale: SupportedLocale;
  setLocale: (l: SupportedLocale) => void;
  theme: 'dark' | 'light';
  setTheme: (th: 'dark' | 'light') => void;
  onOpenHelp: () => void;
  onOpenLogin: () => void;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
  onSelectCity?: (city: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenIntake,
  onOpenLeaveYourLease,
  savedCount,
  locale,
  setLocale,
  theme,
  setTheme,
  onOpenHelp,
  onOpenLogin,
  currentUser,
  onLogout,
  onSelectCity
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

  const handleCityClick = (city: string) => {
    setIsDropdownOpen(false);
    if (onSelectCity) {
      onSelectCity(city);
    } else {
      window.location.hash = city === 'All Poland' ? '#/rooms' : `#/${city.toLowerCase()}/rooms`;
    }
  };

  return (
    <header className="sticky top-0 z-50 h-[76px] backdrop-blur-md bg-white/95 border-b border-slate-200/80 transition-colors">
      <div className="max-w-[1280px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo */}
        <a
          href="#/rooms"
          className="shrink-0 flex items-center focus-visible:outline-none"
          aria-label="Relok8 Home"
        >
          <Relok8Logo height={32} theme={theme} />
        </a>

        {/* Center: Airbnb-style Search Capsule (Scrolls directly to Search/Filters) */}
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('rooms');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="hidden md:flex items-center gap-2.5 pl-4 pr-2 py-1.5 rounded-full border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 text-xs font-medium text-slate-700 bg-white cursor-pointer hover:border-slate-300"
          aria-label="Quick search rooms"
        >
          <span className="font-bold text-slate-900">Anywhere in Poland</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">Any room</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">0 PLN fee</span>
          <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </button>

        {/* Right Nav Actions (Per user instructions: Saved, List a room, Language, and Account Dropdown ONLY) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* 1. "List a room" button */}
          <button
            type="button"
            onClick={() => {
              window.location.hash = '#/list-your-room';
              onOpenIntake();
            }}
            className="hidden sm:inline-flex items-center text-[13px] font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 px-3.5 py-2 rounded-full transition-colors cursor-pointer border border-transparent hover:border-slate-200"
          >
            {strings.listYourRoom}
          </button>

          {/* 2. Saved Apartments Link Pill */}
          <button
            type="button"
            onClick={() => {
              window.location.hash = '#/saved';
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-200 hover:border-indigo-300 bg-white text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-all cursor-pointer shadow-xs"
            title="Saved apartments"
          >
            <Bookmark className={`w-4 h-4 ${savedCount > 0 ? 'text-indigo-600 fill-indigo-600' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Saved</span>
            {savedCount > 0 && (
              <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
                {savedCount}
              </span>
            )}
          </button>

          {/* 3. Language Selector Dropdown */}
          <div className="relative" ref={langRef}>
            <button
              type="button"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              aria-label="Change language"
              className="p-2 sm:px-3 sm:py-2 rounded-full text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-200/80"
            >
              <Globe className="w-4 h-4 text-slate-500" strokeWidth={1.8} />
              <span className="text-[12px] font-bold uppercase">{locale}</span>
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in duration-100 text-left">
                <div className="px-3.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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
                  <span>English (EN)</span>
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
                  <span>Polski (PL)</span>
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
                  <span>Українська (UK)</span>
                  {locale === 'uk' && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* 4. Airbnb-style Dropdown Pill Button (Hosts ALL other sections) */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
              aria-label="Main menu"
              className="flex items-center gap-2 pl-3 pr-1.5 py-1.5 border border-slate-300 hover:border-slate-400 hover:shadow-md rounded-full bg-white transition-all duration-150 cursor-pointer text-slate-700"
            >
              <Menu className="w-4 h-4 text-slate-700" strokeWidth={2} />
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover border border-indigo-200"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                  {currentUser ? currentUser.name.slice(0, 1).toUpperCase() : <User className="w-3.5 h-3.5" />}
                </div>
              )}
            </button>

            {/* Comprehensive Airbnb-Style Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-[calc(100vw-28px)] sm:w-[330px] max-w-[340px] max-h-[85vh] overflow-y-auto bg-white border border-slate-200/90 rounded-[22px] shadow-2xl py-3 z-50 text-left animate-in fade-in duration-150 scrollbar-none">
                
                {/* 1. User Auth Header */}
                {currentUser ? (
                  <div className="px-4 py-3 mx-2 mb-2 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                        {currentUser.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                      </div>
                    </div>
                    {currentUser.university && (
                      <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 font-medium bg-indigo-50 px-2 py-0.5 rounded-md">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span className="truncate">{currentUser.university}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        if (onLogout) onLogout();
                      }}
                      className="w-full text-left text-xs font-semibold text-rose-600 hover:text-rose-700 pt-1 flex items-center gap-1 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log out</span>
                    </button>
                  </div>
                ) : (
                  <div className="px-3 pb-2 border-b border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenLogin();
                      }}
                      className="w-full p-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-left transition-all hover:shadow-md cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] font-bold">Sign up or Log in</span>
                        <ArrowRight className="w-4 h-4 text-indigo-200 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="text-[11px] text-indigo-100 mt-1 leading-snug">
                        0 PLN broker fees · Instant tenant contact & lease handover
                      </p>
                    </button>
                  </div>
                )}

                {/* 2. SECTION: Explore Rooms & Cities */}
                <div className="py-2 border-b border-slate-100">
                  <div className="px-4 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Explore Student & Expat Rooms
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCityClick('All Poland')}
                    className="w-full px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>All Available Rooms (Poland)</span>
                    <span className="text-[11px] text-indigo-600 font-semibold">0 fee</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCityClick('Warsaw')}
                    className="w-full px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>Student housing Warsaw</span>
                    <span className="text-[11px] text-slate-400">UW / SGH</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCityClick('Kraków')}
                    className="w-full px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>No agency commission flats Krakow</span>
                    <span className="text-[11px] text-slate-400">UJ / AGH</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCityClick('Wrocław')}
                    className="w-full px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>Rooms in Wrocław</span>
                    <span className="text-[11px] text-slate-400">PWr / UWr</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCityClick('Gdańsk')}
                    className="w-full px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>Apartments in Gdańsk</span>
                    <span className="text-[11px] text-slate-400">PG / SKM</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCityClick('Lublin')}
                    className="w-full px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>Student housing Lublin</span>
                    <span className="text-[11px] text-slate-400">UMLub Med</span>
                  </button>
                </div>

                {/* 3. SECTION: How It Works & Legal Guides */}
                <div className="py-2 border-b border-slate-100">
                  <div className="px-4 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    How it Works & Legal Guides
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      window.location.hash = '#/how-it-works';
                    }}
                    className="w-full px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>How Lease Takeover Works (Art. 509 KC)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      window.location.hash = '#/meldunek-guide';
                    }}
                    className="w-full px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Rooms with Meldunek & PESEL Guide</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      window.location.hash = '#/cesja-template';
                    }}
                    className="w-full px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span>Cesja umowy najmu wzór english</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      window.location.hash = '#/safety-guide';
                    }}
                    className="w-full px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-slate-500" />
                    <span>Rental Safety & Scams Guide</span>
                  </button>
                </div>

                {/* 4. SECTION: Tenants & Hosts */}
                <div className="py-2 border-b border-slate-100">
                  <div className="px-4 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    For Outgoing Tenants & Hosts
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      window.location.hash = '#/list-your-room';
                      onOpenIntake();
                    }}
                    className="w-full px-4 py-2 text-[13px] text-slate-900 font-semibold hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>List a room (Free Handover)</span>
                    <span className="text-[11px] font-normal text-emerald-600">Active</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      window.location.hash = '#/leave-your-lease';
                      onOpenLeaveYourLease();
                    }}
                    className="w-full px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Leaving early? Calculate Penalty Savings</span>
                  </button>
                </div>

                {/* 5. SECTION: Preferences & Support */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      window.location.hash = '#/help';
                      onOpenHelp();
                    }}
                    className="w-full px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span>Help Center & FAQ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTheme(theme === 'dark' ? 'light' : 'dark');
                    }}
                    className="w-full px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {theme === 'dark' ? (
                        <Sun className="w-4 h-4 text-slate-400" />
                      ) : (
                        <Moon className="w-4 h-4 text-slate-400" />
                      )}
                      <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
                    </div>
                  </button>

                  <div className="mt-2 pt-2 border-t border-slate-100 px-4 flex items-center gap-3 text-[11px] text-slate-400">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        window.location.hash = '#/terms';
                      }}
                      className="hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      Terms of Service
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        window.location.hash = '#/privacy';
                      }}
                      className="hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      Privacy & RODO
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
