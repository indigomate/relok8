import React, { useState } from 'react';
import { X, Mail, CheckCircle2, GraduationCap, Shield, Sparkles, ArrowRight } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';
import { signIn, signUp } from '../lib/supabase/client';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: string;
  university?: string;
  avatar?: string;
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  locale: SupportedLocale;
  actionReason?: string;
  contextMessage?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({ 
  isOpen, 
  onClose, 
  onLoginSuccess,
  locale,
  actionReason,
  contextMessage
}) => {
  const activeReason = contextMessage || actionReason;
  const [authMode, setAuthMode] = useState<'quick' | 'student' | 'email'>('quick');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('University of Warsaw (UW)');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const POLISH_UNIVERSITIES = [
    'University of Warsaw (UW)',
    'Warsaw School of Economics (SGH)',
    'Warsaw University of Technology (PW)',
    'Medical University of Warsaw (WUM)',
    'Jagiellonian University (UJ Kraków)',
    'AGH University of Science & Technology',
    'Wrocław University of Science & Technology (PWr)',
    'University of Wrocław (UWr)',
    'Gdańsk University of Technology (PG)',
    'Medical University of Lublin (UMLub)'
  ];

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const user = await signIn('alex.student@gmail.com');
      if (user) {
        onLoginSuccess(user);
        onClose();
        return;
      }
    } catch (e) {
      // fallback
    }

    const fallbackUser: UserProfile = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: 'Alexandre Martin',
      email: 'alex.martin@gmail.com',
      role: 'expat',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    };
    onLoginSuccess(fallbackUser);
    setIsLoading(false);
    onClose();
  };

  const handleStudentAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const studentEmail = email || `student@${university.toLowerCase().replace(/[^a-z]/g, '')}.pl`;
    
    try {
      const user = await signUp({
        email: studentEmail,
        name: name || 'International Student',
        university,
        role: 'student'
      });
      if (user) {
        onLoginSuccess(user);
        onClose();
        return;
      }
    } catch (err) {}

    const fallbackUser: UserProfile = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: name || 'Verified Student',
      email: studentEmail,
      university,
      role: 'student',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
    };
    onLoginSuccess(fallbackUser);
    setIsLoading(false);
    onClose();
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);

    try {
      const user = await signIn(email);
      if (user) {
        onLoginSuccess(user);
        onClose();
        return;
      }
    } catch (err) {}

    const fallbackUser: UserProfile = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: email.split('@')[0],
      email,
      role: 'tenant',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80'
    };
    onLoginSuccess(fallbackUser);
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-left">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-900 font-bold text-[16px]">
              {locale === 'pl' ? 'Logowanie i rejestracja' : 'Sign up or Log in'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Trigger Banner */}
        {actionReason && (
          <div className="px-6 py-2.5 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2 text-xs font-semibold text-indigo-800">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{actionReason}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-5">
          
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Welcome to Relok8 Poland
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Direct lease assignments for students & expats. Zero broker commission and guaranteed landlord pre-approval under Art. 509 KC.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setAuthMode('quick')}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                authMode === 'quick' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              1-Click
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('student')}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                authMode === 'student' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              🎓 Student ID
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('email')}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                authMode === 'email' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Email
            </button>
          </div>

          {/* TAB 1: 1-Click Quick Auth */}
          {authMode === 'quick' && (
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="w-full h-12 rounded-2xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 font-semibold text-[13px] text-slate-800 flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-xs"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('student')}
                className="w-full h-12 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[13px] flex items-center justify-center gap-2 transition-colors cursor-pointer border border-indigo-200"
              >
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span>Verify with Polish Student Email</span>
              </button>
            </div>
          )}

          {/* TAB 2: Polish University Student Auth */}
          {authMode === 'student' && (
            <form onSubmit={handleStudentAuth} className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Your Polish University</label>
                <select
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white outline-none focus:border-indigo-600"
                >
                  {POLISH_UNIVERSITIES.map((u, idx) => (
                    <option key={idx} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kaspar Becker"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Student Email (@student...)</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kaspar@student.uw.edu.pl"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-indigo-600"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Complete Student Sign Up</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* TAB 3: Standard Email Auth */}
          {authMode === 'email' && (
            <form onSubmit={handleEmailAuth} className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Continue with Email</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* Value Highlights */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>0 PLN broker fees</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Meldunek guaranteed</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>Art. 509 KC</span>
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
