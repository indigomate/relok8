import React, { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/react';
import { 
  ArrowLeft, User, Shield, LogOut, CheckCircle2, 
  AlertCircle, Mail, Phone, GraduationCap, Lock, 
  Trash2, Heart, Globe, ExternalLink
} from 'lucide-react';
import { Listing } from '../types';
import { SupportedLocale } from '../utils/formatters';
import { UserProfile } from '../components/Navbar';
import { 
  updateUserProfile, 
  supabase, 
  isSupabaseConfigured 
} from '../lib/supabase/client';

interface AccountPageProps {
  currentUser: UserProfile | null;
  onBack: () => void;
  locale: SupportedLocale;
  savedListings?: Listing[];
  onSelectListing?: (listing: Listing) => void;
  onRemoveSaved?: (id: string) => void;
  onRequireLogin: () => void;
  onUpdateUser: (user: UserProfile) => void;
  onOpenListPlace?: () => void;
  onLogout: () => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  currentUser,
  onBack,
  locale = 'en',
  savedListings = [],
  onRequireLogin,
  onUpdateUser,
  onLogout
}) => {
  const { user: clerkUser } = useUser();
  const clerk = useClerk();

  // Profile editing state
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [university, setUniversity] = useState(currentUser?.university || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Security / Password update state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityMsg, setSecurityMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Account deletion state
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Set page title
  useEffect(() => {
    document.title = locale === 'pl' ? 'Ustawienia konta | Relok8' : 'Account settings | Relok8';
  }, [locale]);

  // Sync state if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setUniversity(currentUser.university || '');
    }
  }, [currentUser]);

  // Handle saving personal details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSavingProfile(true);
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    try {
      // 1. Sync to Clerk if authenticated session
      if (clerkUser) {
        const parts = fullName.trim().split(/\s+/);
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';

        await clerkUser.update({
          firstName,
          lastName
        }).catch(() => {
          // Ignore if name updates restricted in Clerk dashboard
        });

        await clerkUser.updateMetadata({
          unsafeMetadata: {
            ...(clerkUser.unsafeMetadata || {}),
            university,
            phone
          }
        }).catch((err) => {
          console.warn('Clerk metadata sync notice:', err);
        });
      }

      // 2. Sync to Supabase if configured
      if (isSupabaseConfigured()) {
        await updateUserProfile(currentUser.id, {
          full_name: fullName,
          phone_number: phone,
          whatsapp_number: phone
        }).catch((err) => {
          console.warn('Supabase sync notice:', err);
        });
      }

      // 3. Update current user state in application
      const updatedUser: UserProfile = {
        ...currentUser,
        name: fullName,
        phone,
        university
      };

      try {
        localStorage.setItem('r8_user', JSON.stringify(updatedUser));
      } catch (err) {}

      onUpdateUser(updatedUser);
      setProfileSuccessMsg(
        locale === 'pl' ? 'Ustawienia konta zostały zapisane pomyślnie.' : 'Account details saved successfully.'
      );
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (err: any) {
      setProfileErrorMsg(
        err?.message || (locale === 'pl' ? 'Wystąpił błąd podczas zapisywania.' : 'Error updating profile details.')
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setSecurityMsg({
        type: 'error',
        text: locale === 'pl' ? 'Hasło musi zawierać co najmniej 6 znaków.' : 'Password must be at least 6 characters long.'
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityMsg({
        type: 'error',
        text: locale === 'pl' ? 'Podane hasła nie są identyczne.' : 'Passwords do not match.'
      });
      return;
    }

    setIsUpdatingPassword(true);
    setSecurityMsg(null);

    try {
      if (clerkUser && typeof (clerkUser as any).updatePassword === 'function') {
        await (clerkUser as any).updatePassword({ newPassword });
      } else if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });
        if (error) throw error;
      }

      setSecurityMsg({
        type: 'success',
        text: locale === 'pl' ? 'Twoje hasło zostało zaktualizowane.' : 'Your password has been updated successfully.'
      });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setSecurityMsg({
        type: 'error',
        text: err?.message || (locale === 'pl' ? 'Nie udało się zmienić hasła.' : 'Failed to update password.')
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handle direct account deletion
  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    setDeleteError(null);
    try {
      if (clerkUser) {
        await clerkUser.delete();
      }
      try {
        await clerk.signOut();
      } catch (e) {}
      localStorage.removeItem('r8_user');
      onLogout();
    } catch (err: any) {
      setDeleteError(
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        (locale === 'pl' ? 'Nie udało się usunąć konta.' : 'Failed to delete account.')
      );
      setIsDeletingAccount(false);
    }
  };

  // Switch interface language
  const handleLanguageSwitch = (targetLocale: SupportedLocale) => {
    if (targetLocale === locale) return;
    const target = targetLocale === 'pl' ? '/pl/account' : '/account';
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Non-authenticated view
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 text-left">
        <div className="max-w-xl mx-auto px-4 pt-16 sm:pt-20 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
            <User className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {locale === 'pl' ? 'Ustawienia konta' : 'Account settings'}
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              {locale === 'pl'
                ? 'Zaloguj się do swojego konta, aby zarządzać danymi osobowymi, preferencjami i ustawieniami bezpieczeństwa.'
                : 'Sign in to your account to manage your profile details, contact preferences, and security settings.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onRequireLogin}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              {locale === 'pl' ? 'Zaloguj się' : 'Sign in to account'}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              {locale === 'pl' ? 'Wróć do przeglądania' : 'Back to explore'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const initials = currentUser.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 text-left">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        
        {/* Navigation & Back link */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{locale === 'pl' ? 'Wróć do przeglądania' : 'Back to explore'}</span>
          </button>

          {/* Quick link to Saved Rooms if any */}
          <button
            type="button"
            onClick={() => {
              const target = locale === 'pl' ? '/pl/saved' : '/saved';
              window.history.pushState({}, '', target);
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>{locale === 'pl' ? 'Zapisane pokoje' : 'Saved rooms'}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
              {savedListings.length}
            </span>
          </button>
        </div>

        {/* User Overview Banner */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {currentUser.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  {currentUser.email}
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>{locale === 'pl' ? 'Konto aktywne' : 'Account active'}</span>
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{locale === 'pl' ? 'Wyloguj się' : 'Sign out'}</span>
            </button>
          </div>
        </div>

        {/* 1. Personal Information */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 space-y-5 shadow-xs">
          <div className="space-y-1 pb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              <span>{locale === 'pl' ? 'Dane osobowe' : 'Personal information'}</span>
            </h2>
            <p className="text-xs text-slate-500">
              {locale === 'pl'
                ? 'Twoje podstawowe dane kontaktowe widoczne przy zgłoszeniach do cesji umowy najmu.'
                : 'Your contact details used when submitting lease takeover requests or contacting tenants.'}
            </p>
          </div>

          {profileSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {locale === 'pl' ? 'Imię i nazwisko' : 'Full name'}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Maria Kowalska"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>{locale === 'pl' ? 'Adres e-mail' : 'Email address'}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {locale === 'pl' ? 'Główny login' : 'Primary login'}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={currentUser.email}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500 cursor-not-allowed"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {locale === 'pl' ? 'Numer telefonu / WhatsApp' : 'Phone / WhatsApp'}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9+ ]/g, ''))}
                    placeholder="+48 123 456 789"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900 placeholder:text-slate-400"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {locale === 'pl' ? 'Uczelnia lub miejsce pracy' : 'University or workplace'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="e.g. University of Warsaw"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900 placeholder:text-slate-400"
                  />
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSavingProfile
                  ? (locale === 'pl' ? 'Zapisywanie...' : 'Saving changes...')
                  : (locale === 'pl' ? 'Zapisz zmiany' : 'Save changes')}
              </button>
            </div>
          </form>
        </div>

        {/* 2. Language & Preferences */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 space-y-4 shadow-xs">
          <div className="space-y-1 pb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>{locale === 'pl' ? 'Język platformy' : 'Language preference'}</span>
            </h2>
            <p className="text-xs text-slate-500">
              {locale === 'pl'
                ? 'Wybierz język, w którym przeglądasz oferty i umowy.'
                : 'Choose the interface language for browsing listings and legal guides.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <button
              type="button"
              onClick={() => handleLanguageSwitch('en')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                locale === 'en'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-xs text-slate-900">English</div>
              <div className="text-[11px] text-slate-500">Default interface</div>
            </button>

            <button
              type="button"
              onClick={() => handleLanguageSwitch('pl')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                locale === 'pl'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="font-bold text-xs text-slate-900">Polski</div>
              <div className="text-[11px] text-slate-500">Polska wersja</div>
            </button>
          </div>
        </div>

        {/* 3. Account Security */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 space-y-5 shadow-xs">
          <div className="space-y-1 pb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>{locale === 'pl' ? 'Bezpieczeństwo i hasło' : 'Account security'}</span>
            </h2>
            <p className="text-xs text-slate-500">
              {locale === 'pl'
                ? 'Zarządzaj swoim hasłem logowania i zabezpieczeniami konta.'
                : 'Update your password and manage security credentials.'}
            </p>
          </div>

          {/* Password Update Form */}
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            {securityMsg && (
              <div className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                securityMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}>
                {securityMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{securityMsg.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {locale === 'pl' ? 'Nowe hasło' : 'New password'}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {locale === 'pl' ? 'Potwierdź nowe hasło' : 'Confirm new password'}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                {locale === 'pl' ? 'Minimum 6 znaków' : 'Minimum 6 characters'}
              </span>
              <button
                type="submit"
                disabled={isUpdatingPassword || !newPassword}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-40"
              >
                {isUpdatingPassword
                  ? (locale === 'pl' ? 'Zmienianie...' : 'Updating...')
                  : (locale === 'pl' ? 'Zmień hasło' : 'Update password')}
              </button>
            </div>
          </form>

          {/* Manage Passkeys / Devices via Clerk if available */}
          {clerkUser && (
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 p-4 rounded-2xl">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  {locale === 'pl' ? 'Klucze dostępu i urządzenia' : 'Passkeys & devices'}
                </div>
                <div className="text-[11px] text-slate-500">
                  {locale === 'pl'
                    ? 'Zarządzaj uwierzytelnianiem biometrycznym i aktywnymi sesjami logowania.'
                    : 'Manage biometric passkeys and review active sessions via identity provider.'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => clerk.openUserProfile()}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto shrink-0"
              >
                {locale === 'pl' ? 'Zarządzaj urządzeniami' : 'Manage devices'}
              </button>
            </div>
          )}
        </div>

        {/* 4. Danger Zone / Delete Account */}
        <div className="bg-white rounded-3xl border border-rose-200/80 p-6 sm:p-7 space-y-4 shadow-xs">
          <div className="space-y-1 pb-2 border-b border-rose-100">
            <h2 className="text-base font-bold text-rose-900 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>{locale === 'pl' ? 'Usuwanie konta' : 'Delete account'}</span>
            </h2>
            <p className="text-xs text-slate-500">
              {locale === 'pl'
                ? 'Trwałe usunięcie konta z platformy. Wszystkie Twoje dane sesji zostaną bezpowrotnie skasowane.'
                : 'Permanently remove your account and stored profile information from Relok8.'}
            </p>
          </div>

          {showDeleteConfirm ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
              <div className="text-xs font-bold text-rose-900">
                {locale === 'pl'
                  ? 'Czy na pewno chcesz usunąć swoje konto? Tej operacji nie można cofnąć.'
                  : 'Are you sure you want to delete your account? This action cannot be undone.'}
              </div>

              {deleteError && (
                <div className="text-xs text-rose-700 font-semibold">{deleteError}</div>
              )}

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={isDeletingAccount}
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isDeletingAccount
                    ? (locale === 'pl' ? 'Usuwanie konta...' : 'Deleting account...')
                    : (locale === 'pl' ? 'Tak, usuń bezpowrotnie' : 'Yes, delete permanently')}
                </button>
                <button
                  type="button"
                  disabled={isDeletingAccount}
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteError(null);
                  }}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  {locale === 'pl' ? 'Anuluj' : 'Cancel'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500">
                {locale === 'pl'
                  ? 'RODO / GDPR: Masz prawo do usunięcia wszystkich powiązanych danych.'
                  : 'GDPR compliance: You have the right to permanent deletion of all stored data.'}
              </span>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs rounded-xl border border-rose-300 transition-colors cursor-pointer"
              >
                {locale === 'pl' ? 'Usuń konto' : 'Delete account'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
