import React, { useState, useEffect } from 'react';
import { ArrowLeft, Award, Shield, CheckCircle2, Clock, Sparkles, AlertCircle, Info } from 'lucide-react';
import { SupportedLocale } from '../utils/formatters';
import { RewardEvent, RewardConfig, InsurancePlanConfig } from '../types/relok8';
import { getRewards } from '../lib/api';

interface RewardsPageProps {
  onBack: () => void;
  locale?: SupportedLocale;
}

export const RewardsPage: React.FC<RewardsPageProps> = ({ onBack, locale = 'en' }) => {
  const [points, setPoints] = useState(1);
  const [unlocked, setUnlocked] = useState(false);
  const [events, setEvents] = useState<RewardEvent[]>([]);
  const [config, setConfig] = useState<RewardConfig | null>(null);
  const [insuranceConfig, setInsuranceConfig] = useState<InsurancePlanConfig | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getRewards();
        setPoints(data.points);
        setUnlocked(data.unlocked);
        setEvents(data.events);
        setConfig(data.config);
        setInsuranceConfig(data.insuranceConfig);
      } catch (e) {
        console.warn('Failed to load rewards:', e);
      }
    };
    load();
  }, []);

  const threshold = config?.thresholdPoints || 15;
  const progressPercent = Math.min(100, Math.round((points / threshold) * 100));

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] text-left pb-36 sm:pb-24 font-sans">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 text-slate-700 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {locale === 'pl' ? 'Program Nagród i Odznaki Aktywności' : 'Tenant Rewards & Response Badges'}
            </h1>
            <p className="text-[11px] text-slate-500">
              {locale === 'pl'
                ? 'Odpowiadaj sprawnie na pytania chętnych, aby zdobyć odznakę i wyróżnienie ogłoszenia.'
                : 'Answer prospects promptly to earn points and boost your room’s visibility.'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* REWARDS PROGRESS CARD */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-indigo-600 text-white shrink-0 mt-0.5">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  {locale === 'pl' ? 'Program Aktywności Lokatora' : 'Tenant Activity Program'}
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {points} / {threshold} Points Earned
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {locale === 'pl'
                    ? `Zdobądź ${threshold} punktów, aby odblokować odznakę Szybkiego Kontaktu i wyróżnienie pokoju.`
                    : `Reach ${threshold} points to unlock your Fast Responder Badge and top-rank your listing.`}
                </p>
              </div>
            </div>

            <div className="shrink-0 self-start sm:self-auto">
              {unlocked ? (
                <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{locale === 'pl' ? 'Odznaka Odblokowana' : 'Badge Unlocked'}</span>
                </span>
              ) : (
                <span className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                  {threshold - points} pts remaining
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>{locale === 'pl' ? 'Postęp do odznaki' : 'Progress towards badge'}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200/80">
              <div
                className={`h-full transition-all duration-700 rounded-full ${
                  unlocked ? 'bg-emerald-600' : 'bg-indigo-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Badge Benefit Tier */}
          <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>{locale === 'pl' ? 'Odznaka Szybkiego Kontaktu & Wyróżnienie' : 'Fast Responder Badge & Search Boost'}</span>
              </div>
              <p className="text-xs text-indigo-900/80 leading-relaxed">
                {locale === 'pl'
                  ? 'Ogłoszenia aktywnych lokatorów otrzymują zieloną odznakę i są wyświetlane na początku listy dla studentów.'
                  : 'Listings from responsive tenants receive a priority badge and are placed at the top of student searches.'}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-bold text-indigo-700 bg-white px-3 py-1 rounded-full border border-indigo-200 shadow-2xs">
                {unlocked ? (locale === 'pl' ? 'Aktywne na ogłoszeniu' : 'Active on listing') : (locale === 'pl' ? 'Wymaga 15 pkt' : '15 pts required')}
              </span>
            </div>
          </div>
        </div>

        {/* HOW TO EARN POINTS & ANTI-GAMING RULES (§8) */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">How You Earn Points</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-lg font-black text-slate-900">+1 Point</div>
              <div className="text-xs font-bold text-slate-800">Human reply</div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Reply to a verified prospect within 12 hours (min 20 characters). Max 3 points per thread.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-lg font-black text-slate-900">+3 Points</div>
              <div className="text-xs font-bold text-slate-800">Viewing arranged</div>
              <p className="text-[11px] text-slate-500 leading-snug">
                When a prospect books an in-person or video walk-through via your thread.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-lg font-black text-slate-900">+10 Points</div>
              <div className="text-xs font-bold text-slate-800">Handover completed</div>
              <p className="text-[11px] text-slate-500 leading-snug">
                When your replacement tenant signs the Cesja agreement and takes over the lease.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              <strong>Anti-gaming rules:</strong> Counted only on distinct prospect threads with verified users. Minimum 20 characters per reply. No points awarded for automated Onlo responses. Landlord accounts do not earn points.
            </span>
          </div>
        </div>

        {/* ACTIVITY LOG */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Activity Log</h3>
          <div className="divide-y divide-slate-100">
            {events.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No activity recorded yet.</p>
            ) : (
              events.map((e) => (
                <div key={e.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{e.description || e.kind}</div>
                    <div className="text-[10px] text-slate-400">{new Date(e.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    +{e.points} pts
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Platform Notice */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 leading-relaxed">
          {locale === 'pl'
            ? 'Relok8 to platforma łącząca studentów, ekspatów i wynajmujących. Nie świadczymy usług ubezpieczeniowych, depozytowych ani pośrednictwa finansowego.'
            : 'Relok8 is a peer-to-peer community platform connecting students, expats, and landlords. Relok8 does not provide insurance policies, depository escrow, or regulated financial services.'}
        </div>
      </main>
    </div>
  );
};
