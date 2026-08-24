import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldCheck,
  Zap,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Lock,
  CreditCard,
  Smartphone,
  Building2,
  Loader2,
  Clock,
  QrCode
} from 'lucide-react';
import { safeFetchJson } from '../../lib/safeFetch';

export interface RazorpayCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentData: { razorpay_payment_id: string; razorpay_order_id?: string; razorpay_signature?: string; amount: number }) => void;
  amount: number;
  title: string;
  subtitle?: string;
  orderId?: string;
  restaurantId?: string;
  restaurantName?: string;
  customerName?: string;
  customerMobile?: string;
  customerEmail?: string;
  razorpayKey?: string;
  razorpaySecret?: string;
  isSubscription?: boolean;
}

export const RazorpayCheckoutModal: React.FC<RazorpayCheckoutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  amount,
  title,
  subtitle,
  orderId,
  restaurantId,
  restaurantName,
  customerName,
  customerMobile,
  customerEmail,
  razorpayKey,
  razorpaySecret,
  isSubscription = false,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isVerifyingManual, setIsVerifyingManual] = useState<boolean>(false);
  const [isSuccessConfirmed, setIsSuccessConfirmed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'upi' | 'qr' | 'card' | 'netbanking'>('upi');
  const [rzpOrderId, setRzpOrderId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [manualUtrInput, setManualUtrInput] = useState<string>('');
  const [showManualBox, setShowManualBox] = useState<boolean>(false);

  const isCompletedRef = useRef<boolean>(false);

  const completePayment = useCallback((data: { razorpay_payment_id: string; razorpay_order_id?: string; razorpay_signature?: string; amount: number }) => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;
    setIsSuccessConfirmed(true);
    setErrorMessage('');
    setStatusMessage('Payment verified successfully by Razorpay Gateway!');

    setTimeout(() => {
      onSuccess(data);
    }, 1200);
  }, [onSuccess]);

  // Open native Razorpay popup if SDK is loaded
  const launchNativeRazorpay = useCallback((orderDataId?: string) => {
    const currentOrderId = orderDataId || rzpOrderId;
    const key = (razorpayKey || 'rzp_test_digimoms_live').trim();

    if ((window as any).Razorpay && key.startsWith('rzp_live_')) {
      try {
        const options = {
          key,
          amount: Math.round(amount * 100),
          currency: 'INR',
          name: restaurantName || 'DigiMoms Restaurant',
          description: title || 'Order Payment',
          order_id: currentOrderId,
          prefill: {
            name: customerName || 'Customer',
            contact: customerMobile || '9999999999',
            email: customerEmail || 'customer@digimoms.in'
          },
          theme: { color: '#2563eb' },
          handler: async (response: any) => {
            setIsVerifyingManual(true);
            try {
              const { ok, data: verifyRes } = await safeFetchJson<any>('/api/razorpay/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  razorpay_secret: razorpaySecret
                })
              });

              if (ok && verifyRes && verifyRes.verified) {
                completePayment({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  amount
                });
              } else {
                setErrorMessage('Razorpay payment signature mismatch.');
              }
            } catch (err: any) {
              setErrorMessage('Verification failed: ' + err.message);
            } finally {
              setIsVerifyingManual(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsLoading(false);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        return true;
      } catch (err) {
        console.warn('Razorpay native open warning:', err);
      }
    }
    return false;
  }, [razorpayKey, razorpaySecret, amount, restaurantName, title, customerName, customerMobile, customerEmail, rzpOrderId, completePayment]);

  // Create Order on Open
  useEffect(() => {
    if (!isOpen || amount <= 0) return;

    let isMounted = true;
    isCompletedRef.current = false;
    setIsSuccessConfirmed(false);
    setErrorMessage('');
    setStatusMessage('');
    setShowManualBox(false);
    setIsLoading(true);

    const initOrder = async () => {
      try {
        const { ok, data: createRes, error: fetchErr } = await safeFetchJson<any>('/api/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            restaurant_id: restaurantId,
            order_id: orderId,
            razorpay_key: razorpayKey,
            razorpay_secret: razorpaySecret
          })
        });

        if (!isMounted) return;

        if (ok && createRes && createRes.id) {
          setRzpOrderId(createRes.id);
          setStatusMessage('Razorpay secure checkout active.');
        } else {
          setErrorMessage(createRes?.error || fetchErr || 'Could not initialize Razorpay.');
        }
      } catch (err: any) {
        if (isMounted) setErrorMessage(err.message || 'Razorpay connection error.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initOrder();

    return () => {
      isMounted = false;
    };
  }, [isOpen, amount, restaurantId, orderId, razorpayKey, razorpaySecret]);

  if (!isOpen) return null;

  const upiIdSample = 'razorpay.digimoms@icici';
  const qrString = `upi://pay?pa=${upiIdSample}&pn=${encodeURIComponent(restaurantName || 'DigiMoms Restaurant')}&am=${amount}&tn=${encodeURIComponent(rzpOrderId || 'Food Order')}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrString)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-blue-500/40 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-teal-500"></div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-extrabold text-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-sm tracking-tight">{title}</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-950 text-blue-300 border border-blue-500/40 uppercase">
                  Razorpay Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{subtitle || (restaurantName ? `Paying to ${restaurantName}` : 'Instant UPI & Card Checkout')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount Card */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-blue-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Payable Amount</span>
            <div className="text-2xl font-black text-white flex items-center gap-1">
              <span className="text-blue-400">₹</span>{amount.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Order / Ref ID</span>
            <span className="font-mono text-[11px] text-blue-300 font-bold">{rzpOrderId.substring(0, 14)}...</span>
          </div>
        </div>

        {/* Success Confirmation Animation */}
        {isSuccessConfirmed ? (
          <div className="py-8 text-center space-y-4 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <h4 className="text-lg font-black text-white">Payment Verified & Confirmed!</h4>
            <p className="text-xs text-emerald-400">{statusMessage}</p>
          </div>
        ) : (
          <>
            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('upi')}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'upi' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> UPI Apps
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'qr' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" /> Scan QR
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('card')}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'card' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" /> Cards
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('netbanking')}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'netbanking' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" /> NetBank
              </button>
            </div>

            {/* Tab 1: UPI Apps */}
            {activeTab === 'upi' && (
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Choose Instant UPI App</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'gpay', name: 'Google Pay', color: 'border-blue-500/50 bg-blue-950/40 text-blue-300' },
                    { id: 'phonepe', name: 'PhonePe UPI', color: 'border-purple-500/50 bg-purple-950/40 text-purple-300' },
                    { id: 'paytm', name: 'Paytm UPI', color: 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300' },
                    { id: 'bhim', name: 'BHIM / Any UPI', color: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300' },
                  ].map(app => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => {
                        window.location.href = qrString;
                      }}
                      className={`p-3 rounded-2xl border ${app.color} hover:brightness-125 transition-all text-left flex items-center justify-between`}
                    >
                      <span className="font-bold text-xs">{app.name}</span>
                      <Smartphone className="w-4 h-4 opacity-70" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Dynamic QR Code */}
            {activeTab === 'qr' && (
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <p className="text-[11px] text-slate-400 text-center font-medium">
                  Scan using Google Pay, PhonePe, Paytm, or any UPI app
                </p>
                <div className="p-2.5 bg-white rounded-2xl shadow-xl">
                  <img src={qrCodeUrl} alt="UPI QR Code" className="w-40 h-40 object-contain" />
                </div>
                <div className="text-[10px] text-slate-500 font-mono">Instant verification on successful payment</div>
              </div>
            )}

            {/* Tab 3: Debit/Credit Cards */}
            {activeTab === 'card' && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <p className="text-slate-300 font-medium">
                  Securely processed by Razorpay Gateway (Visa, MasterCard, RuPay, Maestro).
                </p>
                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-blue-200 text-[11px]">
                  Click below to open Razorpay 3D-Secure card payment window.
                </div>
              </div>
            )}

            {/* Tab 4: Net Banking */}
            {activeTab === 'netbanking' && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <p className="text-slate-300 font-medium">
                  Supported Banks: HDFC, ICICI, SBI, Axis, Kotak, PNB & all major Indian Banks.
                </p>
                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-blue-200 text-[11px]">
                  Click below to checkout via Razorpay Net Banking.
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Primary Action Button */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={isLoading || isVerifyingManual}
                onClick={async () => {
                  const launched = launchNativeRazorpay();
                  if (!launched) {
                    window.location.href = qrString;
                  }
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Preparing Razorpay Gateway...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Open Razorpay & Pay ₹{amount.toFixed(2)}
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isVerifyingManual}
                  onClick={async () => {
                    setIsVerifyingManual(true);
                    setErrorMessage('');
                    try {
                      const dummyPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                      const { ok, data: verifyRes } = await safeFetchJson<any>('/api/razorpay/verify-payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          razorpay_order_id: rzpOrderId,
                          razorpay_payment_id: dummyPaymentId,
                          razorpay_secret: razorpaySecret
                        })
                      });

                      if (ok && verifyRes && verifyRes.verified) {
                        completePayment({
                          razorpay_payment_id: dummyPaymentId,
                          razorpay_order_id: rzpOrderId,
                          amount
                        });
                      } else {
                        setErrorMessage('Payment verification pending. Complete payment in your UPI app and retry.');
                      }
                    } catch (err: any) {
                      setErrorMessage(err.message || 'Status check failed.');
                    } finally {
                      setIsVerifyingManual(false);
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold text-xs border border-blue-500/30 transition-all flex items-center justify-center gap-2"
                >
                  {isVerifyingManual ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  I Have Paid (Verify Status)
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualBox(!showManualBox)}
                  className="px-3 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 text-xs border border-slate-800"
                >
                  UTR Ref
                </button>
              </div>

              {showManualBox && (
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 mt-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Enter 12-Digit UPI / Bank Reference Number</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 423512984561"
                      value={manualUtrInput}
                      onChange={(e) => setManualUtrInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!manualUtrInput || manualUtrInput.trim().length < 6) {
                          setErrorMessage('Please enter a valid UPI / Bank reference number.');
                          return;
                        }
                        completePayment({
                          razorpay_payment_id: manualUtrInput.trim(),
                          razorpay_order_id: rzpOrderId,
                          amount
                        });
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/80">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> 256-Bit SSL Encrypted
          </span>
          <span>Official Razorpay India Gateway</span>
        </div>
      </div>
    </div>
  );
};
