import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';
import { SignIn, SignUp, useUser, useAuth } from '@clerk/react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: string;
  university?: string;
  avatar?: string;
  phone?: string;
  isVerified?: boolean;
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  locale: SupportedLocale;
  actionReason?: string;
  contextMessage?: string;
  initialMode?: 'signin' | 'signup';
}

export const LoginModal: React.FC<LoginModalProps> = React.memo(({ 
  isOpen, 
  onClose, 
  onLoginSuccess,
  locale,
  contextMessage,
  initialMode = 'signin'
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      const h = window.location.hash.toLowerCase();
      if (p.includes('sign-up') || p.includes('register') || h.includes('sign-up')) {
        return 'signup';
      }
      if (p.includes('sign-in') || p.includes('login') || h.includes('sign-in')) {
        return 'signin';
      }
    }
    return initialMode;
  });

  const prevIsOpenRef = useRef(false);

  // Sync mode ONLY when modal transitions from closed to open.
  // Never reset or overwrite mode while user is actively filling in credentials.
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      const p = window.location.pathname.toLowerCase();
      const h = window.location.hash.toLowerCase();
      if (p.includes('sign-up') || p.includes('register') || h.includes('sign-up')) {
        setMode('signup');
      } else if (p.includes('sign-in') || p.includes('login') || h.includes('sign-in')) {
        setMode('signin');
      } else {
        setMode(initialMode);
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialMode]);

  const { isLoaded: isAuthLoaded, isSignedIn: isAuthSignedIn } = useAuth();
  const { isLoaded: isUserLoaded, isSignedIn: isUserSignedIn, user } = useUser();
  const isSignedIn = Boolean(isAuthSignedIn || isUserSignedIn);
  const isLoaded = Boolean(isAuthLoaded && isUserLoaded);

  // Listen to hash changes only for explicit sign-up / sign-in switch links (#/sign-up or #/sign-in)
  useEffect(() => {
    const handleHashChange = () => {
      const h = window.location.hash.toLowerCase();
      if (h === '#/sign-up' || h === '#sign-up') {
        setMode('signup');
      } else if (h === '#/sign-in' || h === '#sign-in') {
        setMode('signin');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      const h = window.location.hash.toLowerCase();
      if (h.includes('sign-') || h.includes('factor-')) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      if (p.includes('sign-up') || p.includes('sign-in') || p.includes('login') || p.includes('register') || p.includes('factor-')) {
        const homePath = window.location.pathname.startsWith('/pl') ? '/pl' : '/';
        history.replaceState(null, '', homePath + window.location.search);
      }
    }
    onClose();
  };

  // Automatically trigger success callback and close modal when Clerk authentication completes
  useEffect(() => {
    if (isOpen && isLoaded && isSignedIn && user) {
      const unsafeMeta = ((user.unsafeMetadata || (user as any).unsafe_metadata) || {}) as Record<string, any>;
      const publicMeta = ((user.publicMetadata || (user as any).public_metadata) || {}) as Record<string, any>;

      const rawRole = (publicMeta.role as string) || (unsafeMeta.role as string) || 'student';
      const role = (rawRole === 'member' || !['student', 'expat', 'landlord', 'tenant'].includes(rawRole)) ? 'student' : rawRole;

      const primaryEmail = user.primaryEmailAddress || 
        user.emailAddresses?.find(e => e.id === (user as any).primaryEmailAddressId || e.id === (user as any).primary_email_address_id) ||
        user.emailAddresses?.[0];
      const isEmailVerified = primaryEmail?.verification?.status === 'verified';
      const isVerified = Boolean(publicMeta.isVerified ?? (unsafeMeta.isVerified ?? isEmailVerified));

      const university = (unsafeMeta.university as string) || (publicMeta.university as string) || '';
      const phone = user.primaryPhoneNumber?.phoneNumber || 
        (user.phoneNumbers?.[0] as any)?.phoneNumber || 
        (user.phoneNumbers?.[0] as any)?.phone_number || 
        (unsafeMeta.phone as string) || (publicMeta.phone as string) || '';

      const name = user.fullName || 
        (user as any).name ||
        [user.firstName || (user as any).first_name, user.lastName || (user as any).last_name].filter(Boolean).join(' ') || 
        primaryEmail?.emailAddress?.split('@')[0] || 
        'User';

      const profile: UserProfile = {
        id: user.id,
        name,
        email: primaryEmail?.emailAddress || '',
        avatar: user.imageUrl || (user as any).image_url,
        role,
        isVerified,
        phone,
        university
      };
      onLoginSuccess(profile);
      handleDismiss();
    }
  }, [isOpen, isLoaded, isSignedIn, user, onLoginSuccess]);

  // If modal is not open, or user is already authenticated by ClerkProvider, prevent render
  if (!isOpen || isSignedIn) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleDismiss();
        }
      }}
    >
      <div className="relative my-8 animate-in zoom-in-95 duration-150 max-w-md w-full">
        {/* Floating close button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close"
          className="absolute -top-3 -right-3 z-20 w-8 h-8 rounded-full bg-white text-slate-500 hover:text-slate-900 shadow-lg border border-slate-200 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Tab switch header so user can easily toggle between Sign In and Sign Up */}
        <div className="flex items-center justify-center mb-3 bg-slate-100/90 p-1 rounded-xl shadow-xs border border-slate-200/80">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 py-1.5 px-4 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {locale === 'pl' ? 'Logowanie' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 py-1.5 px-4 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {locale === 'pl' ? 'Rejestracja' : 'Sign Up'}
          </button>
        </div>

        {contextMessage && (
          <div className="mb-3 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-700 text-center font-medium">
            {contextMessage}
          </div>
        )}

        {/* Official Clerk UI with hash routing and preserved multi-step state */}
        <div className="flex justify-center">
          {mode === 'signup' ? (
            <SignUp 
              routing="hash"
              signInUrl="#/sign-in"
            />
          ) : (
            <SignIn 
              routing="hash"
              signUpUrl="#/sign-up"
            />
          )}
        </div>
      </div>
    </div>
  );
});
