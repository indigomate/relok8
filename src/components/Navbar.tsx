import React, { useState, useRef, useEffect, useId } from 'react';
import { User, Heart, HelpCircle, MessageSquare, Home, Settings, LogOut, Bell, Award } from 'lucide-react';
import { useClerk } from '@clerk/react';
import { Relok8Logo } from './BrandLogo';
import { SupportedLocale } from '../utils/formatters';
import { t } from '../utils/translations';
import { SearchBar, SearchState } from './SearchBar';
import { getNotifications, getRewards, getThreads } from '../lib/api';
import { IconButton } from './ui/IconButton';

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
  onOpenHelp: () => void;
  onOpenLogin: (mode?: 'signin' | 'signup') => void;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
  onNavigateSaved: () => void;
  searchState: SearchState;
  onSearchChange: (newState: Partial<SearchState>) => void;
  onExpandSearch?: () => void;
  isCompactSearchVisible?: boolean;
  currentPath?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenListPlace,
  savedCount,
  locale,
  onSelectLocale,
  theme,
  onOpenHelp,
  onOpenLogin,
  currentUser,
  onLogout,
  onNavigateSaved,
  searchState,
  onSearchChange,
  onExpandSearch,
  isCompactSearchVisible = true,
  currentPath,
}) => {
  const strings = t[locale === 'pl' ? 'pl' : 'en'];
  const clerk = useClerk();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const languageButtonRef = useRef<HTMLButtonElement>(null);
  const accountMenuId = useId();
  const languageMenuId = useId();

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [rewardsPoints, setRewardsPoints] = useState(1);

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [notifs, rew, ths] = await Promise.all([
          getNotifications().catch(() => []),
          getRewards().catch(() => null),
          getThreads().catch(() => []),
        ]);
        const unreadN = notifs.filter((n) => !n.readAt).length;
        setUnreadNotifications(unreadN);
        if (rew) setRewardsPoints(rew.points);
        const unreadT = ths.filter((t) => t.status === 'needs_human' || (t.unreadFor && t.unreadFor.length > 0)).length;
        setUnreadMessages(unreadT);
      } catch (e) {}
    };

    loadCounts();
    const interval = setInterval(loadCounts, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (isLangMenuOpen) {
        setIsLangMenuOpen(false);
        languageButtonRef.current?.focus();
      } else if (isDropdownOpen) {
        setIsDropdownOpen(false);
        accountButtonRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isDropdownOpen, isLangMenuOpen]);

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

  const prefix = locale === 'pl' ? '/pl' : '';
  const pl = locale === 'pl';
  const go = (path: string) => {
    setIsDropdownOpen(false);
    setIsLangMenuOpen(false);
    window.history.pushState({}, '', prefix + path || '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };
  const navClass = (active: boolean) => 'min-h-11 px-3 rounded-xl text-sm font-semibold whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ' + (active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50');
  const menuClass = 'w-full min-h-11 px-3 rounded-xl text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-indigo-600';
  return (
    <header className="sticky top-0 z-40 shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto h-[72px] px-3 sm:px-6 flex items-center justify-between gap-2">
        <a href={prefix || '/'} onClick={e => { if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {e.preventDefault();go('/');} }} className="shrink-0 rounded-lg focus-visible:ring-2 focus-visible:ring-indigo-600" aria-label="Relok8 Home"><Relok8Logo height={30} theme={theme}/></a>
        <nav aria-label={pl ? 'Nawigacja główna' : 'Main navigation'} className="hidden md:flex min-w-0 items-center gap-1">
          <button className={navClass(['home','city','saved','listing-detail'].includes(currentPath || ''))} onClick={()=>go('/')} aria-current={['home','city','saved','listing-detail'].includes(currentPath || '')?'page':undefined}>{pl?'Szukaj':'Explore'}</button>
          <button className={navClass(['place','dashboard','list'].includes(currentPath || ''))} onClick={()=>go('/place')} aria-current={['place','dashboard','list'].includes(currentPath || '')?'page':undefined}>{pl?'Moje miejsce':'My Place'}</button>
          <button className={navClass(currentPath==='services')} onClick={()=>go('/services')} aria-current={currentPath==='services'?'page':undefined}>{pl?'Usługi':'Services'}</button>
        </nav>
        <div className="flex items-center gap-1 shrink-0">
          <IconButton onClick={()=>{setIsDropdownOpen(false);onNavigateSaved();}} label={strings.saved+' ('+savedCount+')'} aria-current={currentPath==='saved'?'page':undefined} className="relative hidden sm:inline-flex"><Heart className="w-5 h-5"/>{savedCount>0&&<span className="absolute right-0 top-0 rounded-full bg-indigo-600 text-white text-[10px] px-1">{savedCount}</span>}</IconButton>
          <IconButton onClick={()=>go('/messages')} label={(pl?'Wiadomości':'Inbox')+' ('+unreadMessages+')'} aria-current={currentPath==='messages'?'page':undefined} className="relative"><MessageSquare className="w-5 h-5"/>{unreadMessages>0&&<span className="absolute right-1 top-1 w-2 h-2 rounded-full bg-indigo-600"/>}</IconButton>
          <IconButton onClick={()=>go('/notifications')} label={(pl?'Powiadomienia':'Notifications')+' ('+unreadNotifications+')'} aria-current={currentPath==='notifications'?'page':undefined} className="relative"><Bell className="w-5 h-5"/>{unreadNotifications>0&&<span className="absolute right-1 top-1 w-2 h-2 rounded-full bg-indigo-600"/>}</IconButton>
          <div className="relative" ref={dropdownRef}>
            <button ref={accountButtonRef} type="button" onClick={()=>{setIsDropdownOpen(!isDropdownOpen);setIsLangMenuOpen(false);}} aria-label={pl?'Menu konta':'Account menu'} aria-expanded={isDropdownOpen} aria-controls={accountMenuId} className="w-11 h-11 rounded-full border border-slate-200 flex items-center justify-center hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-indigo-600">
              {currentUser?.avatar?<img src={currentUser.avatar} alt="" className="w-8 h-8 rounded-full object-cover"/>:<User className="w-5 h-5 text-indigo-600"/>}
            </button>
            {isDropdownOpen&&<div id={accountMenuId} className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-1.5rem)] max-h-[calc(100dvh-90px)] overflow-y-auto overscroll-contain bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50">
              {currentUser?<div className="px-3 py-3 border-b border-slate-100 mb-1"><p className="font-bold truncate">{currentUser.name}</p><p className="text-xs text-slate-500 truncate">{currentUser.email}</p></div>:<><button className={menuClass} onClick={()=>{setIsDropdownOpen(false);onOpenLogin('signin')}}>{strings.logIn}</button><button className={menuClass} onClick={()=>{setIsDropdownOpen(false);onOpenLogin('signup')}}>{strings.signUp}</button></>}
              <button className={menuClass} onClick={()=>{setIsDropdownOpen(false);onNavigateSaved()}}><Heart size={17}/>{strings.saved}</button>
              <button className={menuClass} onClick={()=>go('/place')}><Home size={17}/>{pl?'Moje miejsce':'My Place'}</button>
              <button className={menuClass} onClick={()=>{setIsDropdownOpen(false);onOpenListPlace()}}>{strings.listYourPlace}</button>
              <button className={menuClass} onClick={()=>go('/services')}>{pl?'Usługi':'Services'}</button>
              {currentUser&&<><button className={menuClass} onClick={()=>go('/rewards')}><Award size={17}/>{pl?'Program nagród':'Tenant rewards'} · {rewardsPoints}</button><button className={menuClass} onClick={()=>go('/account')}><Settings size={17}/>{strings.accountSettings}</button></>}
              <button className={menuClass} onClick={()=>{setIsDropdownOpen(false);onOpenHelp()}}><HelpCircle size={17}/>{strings.help}</button>
              <div className="flex gap-2 p-2 border-t border-slate-100" aria-label={pl?'Język':'Language'}>{(['en','pl'] as const).map(code=><button key={code} aria-pressed={locale===code} className={navClass(locale===code)} onClick={()=>{onSelectLocale(code);setIsDropdownOpen(false)}}>{code==='en'?'English':'Polski'}</button>)}</div>
              {logoutError&&<p role="alert" className="text-xs text-rose-700 p-2">{logoutError}</p>}
              {currentUser&&onLogout&&<button className={menuClass+' text-rose-600'} onClick={async()=>{try{await clerk.signOut();setLogoutError('');setIsDropdownOpen(false);onLogout();}catch{setLogoutError(pl?'Nie udało się wylogować.':'Could not sign out. Try again.');}}}><LogOut size={17}/>{strings.logOut}</button>}
            </div>}
          </div>
        </div>
      </div>
      {isCompactSearchVisible&&<div className="hidden md:flex justify-center px-4 pb-3"><div className="w-full max-w-md"><SearchBar mode="compact" searchState={searchState} onSearchChange={onSearchChange} locale={locale} onExpandClick={onExpandSearch}/></div></div>}
    </header>
  );
};
