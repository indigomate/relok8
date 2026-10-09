import React, { useState, useEffect } from 'react';
import { 
  X, Lock, ShieldCheck, Clock, CheckCircle2, AlertCircle, 
  CreditCard, ArrowRight, RefreshCw, FileText, Smartphone,
  Check, MessageSquare, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { Listing } from '../types';
import { formatPLN, SupportedLocale } from '../utils/formatters';
import { useConvex } from '../lib/convex/client';

interface EarlyLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
  locale: SupportedLocale;
  currentUser: any;
  onRequireLogin?: (reason: string) => void;
}

export const EarlyLockModal: React.FC<EarlyLockModalProps> = ({
  isOpen,
  onClose,
  listing,
  locale,
  currentUser,
  onRequireLogin
}) => {
  const convex = useConvex();
  const [secondsRemaining, setSecondsRemaining] = useState(900); // 15 mins
  const [isLocked, setIsLocked] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [escrowSuccess, setEscrowSuccess] = useState<any>(null);

  // Bundled add-ons per specification:
  // 149 PLN base hold + 39 PLN Verification Passport + 59 PLN Meldunek Pack
  const [verificationPassport, setVerificationPassport] = useState(true);
  const [meldunekPack, setMeldunekPack] = useState(true);

  // Interactive WhatsApp Landlord Approval simulator state
  const [whatsAppDispatched, setWhatsAppDispatched] = useState(false);
  const [landlordDecision, setLandlordDecision] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  // Fee calculation (149 base hold + 39 Passport + 59 Meldunek)
  const baseHoldPLN = 149.00;
  const verificationPLN = verificationPassport ? 39.00 : 0.00;
  const meldunekPLN = meldunekPack ? 59.00 : 0.00;
  const totalHoldPLN = baseHoldPLN + verificationPLN + meldunekPLN;

  // On modal open: acquire 15-minute atomic lock via Convex mutation
  useEffect(() => {
    if (!isOpen) {
      setEscrowSuccess(null);
      setLockError(null);
      setIsLocked(false);
      setSecondsRemaining(900);
      setWhatsAppDispatched(false);
      setLandlordDecision('PENDING');
      return;
    }

    if (!currentUser) {
      if (onRequireLogin) {
        onRequireLogin('Log in to authorize an EarlyLock atomic reservation hold.');
      }
      onClose();
      return;
    }

    const acquireLock = async () => {
      try {
        const lockRes = await convex.reserveListingAtomic(
          listing.id,
          currentUser.id || 'usr_temp',
          currentUser.name || 'Student'
        );

        if (lockRes.success) {
          setIsLocked(true);
          const remainingSecs = Math.max(1, Math.floor((lockRes.lockedUntil - Date.now()) / 1000));
          setSecondsRemaining(remainingSecs);
        }
      } catch (err: any) {
        setLockError(err.message || 'Room is currently held by another student in checkout.');
      }
    };

    acquireLock();
  }, [isOpen, currentUser, listing.id]);

  // Real-time countdown timer
  useEffect(() => {
    if (!isLocked || secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          setLockError('15-minute checkout window expired. EarlyLock hold released.');
          convex.releaseListingLock(listing.id).catch(() => {});
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, secondsRemaining, listing.id]);

  // Execute Stripe Escrow Action via Convex
  const handleConfirmEscrow = async () => {
    setIsAuthorizing(true);
    setLockError(null);
    try {
      const result = await convex.createEscrowIntent({
        listingId: listing.id,
        studentName: currentUser?.name || 'Student',
        studentPhone: '+48 500 123 456',
        verificationPassport,
        meldunekPack,
      });

      if (result.success) {
        setEscrowSuccess(result);

        // Dispatch interactive WhatsApp alert to landlord
        await convex.sendLandlordApprovalAlert({
          listingId: listing.id,
          listingTitle: listing.title,
          landlordPhone: '+48 601 987 654',
          studentName: currentUser?.name || 'Student',
          monthlyRent: listing.monthlyRentPLN,
          stripePaymentIntentId: result.stripePaymentIntentId,
        });

        setWhatsAppDispatched(true);
      } else {
        setLockError('Failed to authorize escrow hold.');
      }
    } catch (e: any) {
      setLockError(e?.message || 'Network error executing escrow authorization.');
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleLandlordApprove = async () => {
    if (!escrowSuccess) return;
    try {
      await convex.captureEscrow(escrowSuccess.stripePaymentIntentId);
      setLandlordDecision('APPROVED');
    } catch (err: any) {
      setLockError(err.message || 'Failed to capture escrow.');
    }
  };

  const handleLandlordReject = async () => {
    if (!escrowSuccess) return;
    try {
      await convex.cancelEscrow(escrowSuccess.stripePaymentIntentId, 'Landlord declined via WhatsApp quick reply');
      setLandlordDecision('REJECTED');
    } catch (err: any) {
      setLockError(err.message || 'Failed to cancel escrow.');
    }
  };

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4 sm:p-6 animate-in fade-in duration-150 text-left">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-slate-900 font-bold text-sm">
                  EarlyLock™ 15-Minute Atomic Hold
                </h3>
              </div>
              <p className="text-[11px] text-slate-500">
                Exclusive checkout hold with BLIK manual-capture escrow
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Scroll Area */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {lockError ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Room Hold Status</span>
              </div>
              <p>{lockError}</p>
            </div>
          ) : !escrowSuccess ? (
            /* Checkout & Configuration Drawer */
            <div className="space-y-5">
              
              {/* Atomic Lock Active Status */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-indigo-200 flex items-center justify-center text-indigo-600 font-mono font-bold text-sm">
                    <Clock className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <span>Row-Level Lock Active</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    </div>
                    <p className="text-[11px] text-indigo-700">
                      Other users cannot book while you complete checkout
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-base font-bold text-indigo-900 tnum">
                    {timeFormatted}
                  </div>
                  <div className="text-[10px] text-indigo-600 uppercase font-semibold">
                    Remaining
                  </div>
                </div>
              </div>

              {/* Property Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-900">{listing.title}</div>
                <div className="text-slate-600">{listing.address} • {listing.city}</div>
                <div className="text-indigo-600 font-semibold pt-1">
                  Monthly Rent: {listing.monthlyRentPLN} PLN / mo · Deposit: {listing.depositPLN} PLN
                </div>
              </div>

              {/* Bundled BLIK Fee Breakdown with Addons */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Bundled Checkout & Protection</span>
                  <span className="text-[11px] font-normal text-slate-500">BLIK / Polish Card</span>
                </div>

                <div className="space-y-2">
                  {/* Base EarlyLock Hold */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>EarlyLock™ Base Escrow Hold</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">Mandatory</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        49 PLN platform fee + 100 PLN deposit credit applied to your lease
                      </p>
                    </div>
                    <div className="font-bold text-slate-900 text-sm">
                      149.00 PLN
                    </div>
                  </div>

                  {/* Addon 1: Verification Passport */}
                  <label className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs cursor-pointer hover:border-indigo-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={verificationPassport}
                        onChange={(e) => setVerificationPassport(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">
                          Tenant Verification Passport
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Fast-track student ID & credit pre-screening certificate for landlord
                        </p>
                      </div>
                    </div>
                    <div className="font-bold text-indigo-900 text-sm">
                      +39.00 PLN
                    </div>
                  </label>

                  {/* Addon 2: Meldunek Pack */}
                  <label className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs cursor-pointer hover:border-indigo-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={meldunekPack}
                        onChange={(e) => setMeldunekPack(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">
                          Meldunek Registration Legal Pack
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Official municipal address registration paperwork & English landlord consent
                        </p>
                      </div>
                    </div>
                    <div className="font-bold text-indigo-900 text-sm">
                      +59.00 PLN
                    </div>
                  </label>
                </div>

                {/* Total Hold Banner */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">Total Conditional Hold (BLIK Escrow)</div>
                    <div className="text-lg font-bold text-white tnum">{totalHoldPLN.toFixed(2)} PLN</div>
                  </div>
                  <div className="text-right text-[11px] text-emerald-400 font-medium">
                    100% Refundable if Landlord Declines
                  </div>
                </div>
              </div>

              {/* Legal Art. 509 KC Guarantee */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  Funds are authorized via <strong>manual capture escrow</strong>. We only capture once the landlord approves via WhatsApp and the Art. 509 KC takeover protocol is finalized.
                </p>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleConfirmEscrow}
                disabled={isAuthorizing || secondsRemaining <= 0}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                {isAuthorizing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Authorizing Convex Escrow & Disagree WhatsApp Alert...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Authorize {totalHoldPLN.toFixed(2)} PLN BLIK EarlyLock Hold</span>
                  </>
                )}
              </button>

            </div>
          ) : (
            /* Post-Authorization State with WhatsApp Simulator */
            <div className="space-y-5">
              
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">
                    Escrow Authorization Successful!
                  </h4>
                  <p className="text-[11px] text-emerald-800">
                    Intent ID: <span className="font-mono font-bold">{escrowSuccess.stripePaymentIntentId}</span>
                  </p>
                </div>
              </div>

              {/* Interactive WhatsApp Landlord Approval Simulator */}
              <div className="p-4 rounded-2xl bg-emerald-900/5 border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Interactive WhatsApp Landlord Approval Simulator</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                    Live Webhook
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-500 text-[11px] border-b border-slate-100 pb-2">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Dispatched to Landlord (+48 601 987 654):</span>
                  </div>

                  <p className="text-slate-800 leading-relaxed font-sans text-xs">
                    "Dzień dobry! Student <strong>{currentUser?.name || 'Student'}</strong> has placed a verified 15-minute EarlyLock hold on <strong>{listing.title}</strong> ({listing.monthlyRentPLN} PLN/mo). ID and deposit pre-authorized. Do you approve the tenant takeover under Polish Civil Code Art. 509 KC?"
                  </p>

                  {/* Decision Actions */}
                  {landlordDecision === 'PENDING' ? (
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleLandlordApprove}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>APPROVE_LEASE</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLandlordReject}
                        className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>REJECT_LEASE</span>
                      </button>
                    </div>
                  ) : landlordDecision === 'APPROVED' ? (
                    <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700" />
                      <span>Landlord clicked [APPROVE_LEASE]! Escrow captured and contract generated.</span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-700" />
                      <span>Landlord clicked [REJECT_LEASE]. 100% of escrow hold released back to student.</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  Done
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
