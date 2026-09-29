import React, { useState } from 'react';
import { X, Mail, CheckCircle2 } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: SupportedLocale;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, locale }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-left">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-slate-900 font-bold text-[17px]">
            {locale === 'pl' ? 'Zaloguj się lub zarejestruj' : locale === 'uk' ? 'Увійти або зареєструватися' : 'Log in or sign up'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                {locale === 'pl' ? 'Sprawdź skrzynkę odbiorczą' : 'Check your inbox'}
              </h4>
              <p className="text-[13px] text-slate-600 max-w-xs mx-auto">
                {locale === 'pl'
                  ? `Wysłaliśmy link logowania na adres ${email}.`
                  : `We sent a magic login link to ${email}.`}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-5 py-2.5 bg-slate-900 text-white text-[13px] font-semibold rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                {locale === 'pl' ? 'Gotowe' : 'Done'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <h4 className="text-[18px] font-bold text-slate-900">
                  {locale === 'pl' ? 'Witaj w Relok8' : 'Welcome to Relok8'}
                </h4>
                <p className="text-[13px] text-slate-500">
                  {locale === 'pl'
                    ? 'Zaloguj się za pomocą uczelnianego lub prywatnego adresu e-mail.'
                    : 'Log in with your university or personal email to contact tenants and save rooms.'}
                </p>
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-[12px] font-semibold text-slate-700">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@student.uw.edu.pl"
                    className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-300 text-[14px] text-slate-900 focus:outline-indigo-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[14px] rounded-xl transition-colors cursor-pointer"
              >
                {locale === 'pl' ? 'Kontynuuj z e-mailem' : 'Continue with email'}
              </button>

              <p className="text-[11px] text-slate-400 text-center pt-2">
                {locale === 'pl'
                  ? 'Kontynuując, akceptujesz Regulamin i Politykę Prywatności Relok8.'
                  : 'By continuing, you agree to Relok8’s Terms of Service and Privacy Policy.'}
              </p>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
