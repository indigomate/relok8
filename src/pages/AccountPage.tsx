import React, { useState, useEffect } from 'react';
import { UserProfile as ClerkUserProfile } from '@clerk/react';
import { 
  ArrowLeft, User, Heart, Home, MessageSquare, Shield, 
  Settings, LogOut, CheckCircle2, AlertCircle, Mail, Phone, 
  Building2, GraduationCap, Calendar, MapPin, ExternalLink, 
  Trash2, Plus, Send, RefreshCw, Key
} from 'lucide-react';
import { Listing } from '../types';
import { SupportedLocale, formatPLN, formatDate } from '../utils/formatters';
import { UserProfile } from '../components/Navbar';
import { 
  updateUserProfile, 
  getUserListings, 
  getUserInquiries, 
  signOut, 
  supabase, 
  isSupabaseConfigured 
} from '../lib/supabase/client';

interface AccountPageProps {
  currentUser: UserProfile | null;
  onBack: () => void;
  locale: SupportedLocale;
  savedListings: Listing[];
  onSelectListing: (listing: Listing) => void;
  onRemoveSaved: (id: string) => void;
  onRequireLogin: () => void;
  onUpdateUser: (user: UserProfile) => void;
  onOpenListPlace: () => void;
  onLogout: () => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  currentUser,
  onBack,
  locale = 'en',
  savedListings,
  onSelectListing,
  onRemoveSaved,
  onRequireLogin,
  onUpdateUser,
  onOpenListPlace,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'saved' | 'listings' | 'inquiries' | 'security' | 'support'>('profile');

  // Edit profile state
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [university, setUniversity] = useState(currentUser?.university || '');
  const [userRole, setUserRole] = useState(currentUser?.role || 'student');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // My listings state
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(false);

  // Inquiries state
  const [inquiries, setInquiries] = useState<any[]>([]);

  // Password / Security state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityMsg, setSecurityMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Support / Contact state
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);
  const [isSendingContact, setIsSendingContact] = useState(false);

  // Sync title
  useEffect(() => {
    document.title = locale === 'pl' ? 'Konto Użytkownika | Relok8' : 'User Account & Profile | Relok8';
  }, [locale]);

  // Load user-specific data from Supabase / localStorage
  useEffect(() => {
    if (!currentUser) return;
    setFullName(currentUser.name || '');
    setPhone(currentUser.phone || '');
    setUniversity(currentUser.university || '');
    setUserRole(currentUser.role || 'student');

    // Fetch user's own listings
    setIsLoadingListings(true);
    getUserListings(currentUser.id)
      .then((data) => {
        setUserListings(data || []);
      })
      .catch(() => {
        // Fallback to local
        const localListings = localStorage.getItem('r8_listings');
        if (localListings) {
          try {
            const parsed: Listing[] = JSON.parse(localListings);
            setUserListings(parsed.filter((l) => l.currentTenant?.name === currentUser.name));
          } catch (e) {}
        }
      })
      .finally(() => setIsLoadingListings(false));

    // Fetch inquiries
    getUserInquiries(currentUser.id)
      .then((data) => {
        setInquiries(data || []);
      })
      .catch(() => {});
  }, [currentUser]);

  // Handle saving profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSavingProfile(true);
    setProfileSuccessMsg(null);

    try {
      if (isSupabaseConfigured()) {
        await updateUserProfile(currentUser.id, {
          full_name: fullName,
          phone_number: phone,
          whatsapp_number: phone
        });
      }

      const updatedUser: UserProfile = {
        ...currentUser,
        name: fullName,
        phone,
        university,
        role: userRole
      };

      localStorage.setItem('r8_user', JSON.stringify(updatedUser));
      onUpdateUser(updatedUser);
      setProfileSuccessMsg(locale === 'pl' ? 'Profil zaktualizowany pomyślnie!' : 'Profile details saved successfully!');
      setTimeout(() => setProfileSuccessMsg(null), 3500);
    } catch (err: any) {
      setProfileSuccessMsg(err?.message || 'Error updating profile');
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
        text: locale === 'pl' ? 'Hasło musi mieć co najmniej 6 znaków.' : 'Password must be at least 6 characters long.'
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityMsg({
        type: 'error',
        text: locale === 'pl' ? 'Hasła nie są identyczne.' : 'Passwords do not match.'
      });
      return;
    }

    setIsUpdatingPassword(true);
    setSecurityMsg(null);

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });
        if (error) throw error;
      }

      setSecurityMsg({
        type: 'success',
        text: locale === 'pl' ? 'Hasło zostało pomyślnie zaktualizowane!' : 'Password updated successfully!'
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

  // Handle contact support form tied to info@relok8.online
  const handleSendSupportMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage) return;

    setIsSendingContact(true);
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentUser?.name || 'Relok8 User',
          email: currentUser?.email || 'user@relok8.online',
          subject: contactSubject || 'Account & Lease Inquiry',
          message: contactMessage,
          topic: 'User Account Support'
        })
      });

      setContactSent(true);
      setContactSubject('');
      setContactMessage('');
    } catch (err) {
      // Fallback: mailto
      window.location.href = `mailto:info@relok8.online?subject=${encodeURIComponent(
        contactSubject || 'Relok8 Support Request'
      )}&body=${encodeURIComponent(contactMessage)}`;
      setContactSent(true);
    } finally {
      setIsSendingContact(false);
    }
  };

  // If user is not logged in, show prompt to sign in or register
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 text-left">
        <div className="max-w-2xl mx-auto px-4 pt-12 sm:pt-16 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
            <User className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {locale === 'pl' ? 'Zaloguj się do swojego konta' : 'Sign in to your Relok8 account'}
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              {locale === 'pl'
                ? 'Utwórz konto lub zaloguj się, aby zarządzać zapisanymi pokojami, przeglądać dodane ogłoszenia oraz kontaktować najemców.'
                : 'Sign in to access your saved shortlist, manage lease listings, view inquiries, and verify your student or expat status.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onRequireLogin}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              {locale === 'pl' ? 'Zaloguj lub zarejestruj się' : 'Sign In / Register'}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              {locale === 'pl' ? 'Wróć do przeglądania' : 'Back to explore'}
            </button>
          </div>

          <div className="pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="p-4 bg-white rounded-xl border border-slate-200/80">
              <span className="font-bold text-slate-900 block mb-1">0 PLN Agency Fees</span>
              <span>Direct lease transfer under Art. 509 KC without broker commissions.</span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200/80">
              <span className="font-bold text-slate-900 block mb-1">Meldunek Ready</span>
              <span>All listings support mandatory student address registration in Poland.</span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200/80">
              <span className="font-bold text-slate-900 block mb-1">Direct Contact</span>
              <span>Fast inquiries sent straight to outgoing tenants and verified hosts.</span>
            </div>
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
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-8">
        
        {/* Top Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{locale === 'pl' ? 'Wróć do ofert' : 'Back to listings'}</span>
          </button>

          <span className="text-xs text-slate-500">
            Relok8 ID: <span className="font-mono text-slate-700">{currentUser.id.slice(0, 8)}</span>
          </span>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-600 text-white font-bold text-2xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {currentUser.name}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Verified</span>
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  {currentUser.email}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600">
                  {currentUser.university && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{currentUser.university}</span>
                    </span>
                  )}
                  <span className="capitalize px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                    {currentUser.role || 'Student / Expat'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onOpenListPlace}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{locale === 'pl' ? 'Dodaj pokój' : 'List a place'}</span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-rose-600 font-medium text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{locale === 'pl' ? 'Wyloguj' : 'Log out'}</span>
              </button>
            </div>

          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{locale === 'pl' ? 'Profil i dane' : 'Profile & Details'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'saved'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>{locale === 'pl' ? 'Zapisane pokoje' : 'Saved Rooms'}</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
              activeTab === 'saved' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {savedListings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('listings')}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'listings'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>{locale === 'pl' ? 'Moje ogłoszenia' : 'My Listings'}</span>
            {userListings.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                activeTab === 'listings' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {userListings.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'security'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{locale === 'pl' ? 'Bezpieczeństwo' : 'Security & Login'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('support')}
            className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'support'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{locale === 'pl' ? 'Kontakt i pomoc' : 'Support & Contact'}</span>
          </button>
        </div>

        {/* TAB 1: Profile & Details */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs max-w-2xl">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">
                {locale === 'pl' ? 'Dane osobowe i kontaktowe' : 'Personal & Contact Information'}
              </h2>
              <p className="text-xs text-slate-500">
                {locale === 'pl'
                  ? 'Te dane są wykorzystywane do wstępnej weryfikacji tożsamości w porozumieniach cesji.'
                  : 'Used for identity verification on lease handover protocols and landlord communications.'}
              </p>
            </div>

            {profileSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {locale === 'pl' ? 'Imię i nazwisko' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {locale === 'pl' ? 'Adres e-mail' : 'Email Address'}
                  </label>
                  <input
                    type="email"
                    disabled
                    value={currentUser.email}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {locale === 'pl' ? 'Numer telefonu / WhatsApp' : 'Phone / WhatsApp'}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+48 123 456 789"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {locale === 'pl' ? 'Uczelnia lub firma w Polsce' : 'Polish University / Workplace'}
                  </label>
                  <input
                    type="text"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="e.g. University of Warsaw (UW)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {locale === 'pl' ? 'Rola na platformie' : 'Primary Role'}
                </label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900 bg-white"
                >
                  <option value="student">International / Polish Student</option>
                  <option value="expat">Working Professional / Expat</option>
                  <option value="tenant">Current Tenant looking to transfer lease</option>
                  <option value="landlord">Direct Property Owner / Landlord</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSavingProfile ? (locale === 'pl' ? 'Zapisywanie...' : 'Saving changes...') : (locale === 'pl' ? 'Zapisz zmiany' : 'Save profile')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: Saved Rooms */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {locale === 'pl' ? 'Zapisane pokoje i mieszkania' : 'Your Saved Shortlist'} ({savedListings.length})
              </h2>
            </div>

            {savedListings.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-4">
                <Heart className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800">
                    {locale === 'pl' ? 'Brak zapisanych ogłoszeń' : 'No saved apartments yet'}
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {locale === 'pl'
                      ? 'Kliknij ikonę serca na dowolnej ofercie, aby zachować ją na później.'
                      : 'Tap the heart icon on any room card to save it here for fast comparison.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onBack}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  {locale === 'pl' ? 'Przeglądaj pokoje' : 'Browse rooms in Poland'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => onRemoveSaved(listing.id)}
                          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-rose-600 flex items-center justify-center shadow-xs cursor-pointer"
                          title="Remove from saved"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-white/95 text-slate-900 text-[11px] font-bold shadow-xs">
                          {formatPLN(listing.monthlyRentPLN, locale)} / mo
                        </div>
                      </div>

                      <div className="p-4 space-y-2">
                        <h3 className="font-bold text-sm text-slate-900 line-clamp-1">
                          {listing.title}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{listing.district}, {listing.city}</span>
                        </p>
                        <div className="text-[11px] text-slate-600 pt-1">
                          <span>Available: {formatDate(listing.availableDate, locale)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <button
                        type="button"
                        onClick={() => onSelectListing(listing)}
                        className="w-full py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>{locale === 'pl' ? 'Zobacz szczegóły' : 'View full listing'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: My Listings */}
        {activeTab === 'listings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {locale === 'pl' ? 'Ogłoszenia dodane przez Ciebie' : 'Rooms Posted by You'}
                </h2>
                <p className="text-xs text-slate-500">
                  {locale === 'pl'
                    ? 'Pokoje i mieszkania dodane na potrzeby cesji umowy najmu.'
                    : 'Manage active lease transfer listings and incoming tenant inquiries.'}
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenListPlace}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{locale === 'pl' ? 'Dodaj nowe' : 'Post new room'}</span>
              </button>
            </div>

            {isLoadingListings ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                <span>Loading your listings...</span>
              </div>
            ) : userListings.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-4">
                <Home className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800">
                    {locale === 'pl' ? 'Nie masz jeszcze aktywnych ogłoszeń' : 'No active listings posted yet'}
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {locale === 'pl'
                      ? 'Wyprowadzasz się wcześniej? Dodaj ogłoszenie w 2 minuty i przekaż umowę bez utraty kaucji.'
                      : 'Leaving Poland or moving to a new flat early? List your lease takeover for free in under 2 minutes.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenListPlace}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  {locale === 'pl' ? 'Wystaw pokój na cesję' : 'Post a room for takeover'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          Active · Pre-Approved
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 mt-1 line-clamp-1">
                          {listing.title}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {listing.city} · {formatPLN(listing.monthlyRentPLN, locale)} / mo
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectListing(listing)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Preview
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-600 bg-slate-50 rounded-xl p-2.5 flex items-center justify-between">
                      <span>Article 509 KC Compliant</span>
                      <span>Meldunek: {listing.meldunekAllowed ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Security & Clerk Account Management */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-600" />
                  <span>{locale === 'pl' ? 'Bezpieczeństwo i konto Clerk' : 'Clerk Account & Security'}</span>
                </h2>
                <p className="text-xs text-slate-500">
                  {locale === 'pl'
                    ? 'Zarządzaj zabezpieczeniami konta, hasłem, urządzeniami i logowaniem dwuetapowym.'
                    : 'Manage your credentials, two-factor authentication, active sessions, and connected login methods.'}
                </p>
              </div>

              {/* Official Clerk User Profile UI */}
              <div className="pt-2 flex justify-center w-full">
                <ClerkUserProfile 
                  routing="hash"
                  appearance={{
                    elements: {
                      rootBox: 'w-full',
                      card: 'w-full shadow-none border border-slate-200 rounded-2xl p-2 sm:p-4',
                      navbar: 'border-r border-slate-200',
                      headerTitle: 'text-lg font-bold text-slate-900',
                      formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold'
                    }
                  }}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <span className="font-bold text-slate-700 block">GDPR & Data Protection</span>
                <p>
                  Under EU General Data Protection Regulation (RODO), you have the right to inspect or export your stored data. Email <a href="mailto:info@relok8.online" className="text-indigo-600 font-semibold underline">info@relok8.online</a> for data requests.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Support & Contact (Tied directly to info@relok8.online) */}
        {activeTab === 'support' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs max-w-xl">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                <span>{locale === 'pl' ? 'Formularz kontaktowy z Relok8' : 'Contact Relok8 Support'}</span>
              </h2>
              <p className="text-xs text-slate-500">
                {locale === 'pl'
                  ? 'Wiadomość trafia bezpośrednio na adres info@relok8.online do zespołu weryfikacji umów.'
                  : 'Delivered directly to info@relok8.online for lease agreement and support verification.'}
              </p>
            </div>

            {contactSent ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-emerald-900">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>
                    {locale === 'pl' ? 'Wiadomość została wysłana!' : 'Message delivered to info@relok8.online'}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-emerald-800">
                  {locale === 'pl'
                    ? 'Otrzymaliśmy Twoją wiadomość i odpowiemy na adres e-mail Twojego konta w ciągu 1-2 godzin w dni robocze.'
                    : 'Our lease coordinator will review your request and reply to your account email within 1-2 business hours.'}
                </p>
                <button
                  type="button"
                  onClick={() => setContactSent(false)}
                  className="mt-2 text-xs font-semibold text-emerald-700 underline cursor-pointer"
                >
                  {locale === 'pl' ? 'Wyślij kolejną wiadomość' : 'Send another inquiry'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendSupportMessage} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {locale === 'pl' ? 'Temat zapytania' : 'Subject'}
                  </label>
                  <input
                    type="text"
                    required
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    placeholder="e.g. Question about Art. 509 KC lease transfer in Warsaw"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {locale === 'pl' ? 'Wiadomość' : 'Your Message'}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder={
                      locale === 'pl'
                        ? 'Opisz swoją sytuację, numer ogłoszenia lub pytanie dotyczące kaucji...'
                        : 'Explain your lease situation, listing ID, or landlord question...'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs text-slate-900"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                  <span className="text-xs text-slate-500">
                    Direct email: <a href="mailto:info@relok8.online" className="text-indigo-600 font-semibold underline">info@relok8.online</a>
                  </span>

                  <button
                    type="submit"
                    disabled={isSendingContact}
                    className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingContact ? (locale === 'pl' ? 'Wysyłanie...' : 'Sending...') : (locale === 'pl' ? 'Wyślij wiadomość' : 'Send message')}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
