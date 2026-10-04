import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';
import { SignIn, SignUp, useUser } from '@clerk/react';

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

export const LoginModal: React.FC<LoginModalProps> = ({ 
  isOpen, 
  onClose, 
  onLoginSuccess,
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

  const { isLoaded, isSignedIn, user } = useUser();

  // Listen to hash changes triggered by Clerk's internal switch links (Already have an account? Sign in / Sign up)
  useEffect(() => {
    const handleHashChange = () => {
      const h = window.location.hash.toLowerCase();
      if (h.includes('sign-up')) {
        setMode('signup');
      } else if (h.includes('sign-in')) {
        setMode('signin');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync initialMode when modal opens
  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen, initialMode]);

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
      if (h.includes('sign-')) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      } else if (p.includes('sign-up') || p.includes('sign-in') || p.includes('login') || p.includes('register')) {
        const homePath = window.location.pathname.startsWith('/pl') ? '/pl' : '/';
        history.replaceState(null, '', homePath + window.location.search);
      }
    }
    onClose();
  };

  // Automatically trigger success callback and close modal when Clerk authentication completes
  useEffect(() => {
    if (isOpen && isLoaded && isSignedIn && user) {
      const unsafeMeta = (user.unsafeMetadata || {}) as Record<string, any>;
      const publicMeta = (user.publicMetadata || {}) as Record<string, any>;

      const role = (publicMeta.role as string) || (unsafeMeta.role as string) || 'student';
      const isEmailVerified = user.primaryEmailAddress?.verification?.status === 'verified';
      const isVerified = Boolean(publicMeta.isVerified ?? (unsafeMeta.isVerified ?? isEmailVerified));
      const university = (unsafeMeta.university as string) || (publicMeta.university as string) || '';
      const phone = user.primaryPhoneNumber?.phoneNumber || (unsafeMeta.phone as string) || (publicMeta.phone as string) || '';
      const name = user.fullName || 
        [user.firstName, user.lastName].filter(Boolean).join(' ') || 
        user.primaryEmailAddress?.emailAddress?.split('@')[0] || 
        'User';

      const profile: UserProfile = {
        id: user.id,
        name,
        email: user.primaryEmailAddress?.emailAddress || '',
        avatar: user.imageUrl,
        role,
        isVerified,
        phone,
        university
      };
      onLoginSuccess(profile);
      handleDismiss();
    }
  }, [isOpen, isLoaded, isSignedIn, user, onLoginSuccess]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleDismiss();
        }
      }}
    >
      <div className="relative my-8 animate-in zoom-in-95 duration-150">
        {/* Floating close button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close"
          className="absolute -top-3 -right-3 z-20 w-8 h-8 rounded-full bg-white text-slate-500 hover:text-slate-900 shadow-lg border border-slate-200 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Pure Official Clerk UI Component - zero surrounding wrapper UI */}
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
  );
};
