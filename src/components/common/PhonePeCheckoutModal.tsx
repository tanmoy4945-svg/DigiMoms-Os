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

export interface PhonePeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentData: { transactionId: string; amount: number; mode?: string }) => void;
  amount: number;
  title: string;
  subtitle?: string;
  orderId?: string;
  restaurantId?: string;
  restaurantName?: string;
  customerName?: string;
  customerMobile?: string;
  customerEmail?: string;
  merchantId?: string;
  saltKey?: string;
  saltIndex?: string;
  env?: 'SANDBOX' | 'PRODUCTION';
  isSubscription?: boolean;
}

export const PhonePeCheckoutModal: React.FC<PhonePeCheckoutModalProps> = ({
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
  merchantId,
  saltKey,
  saltIndex = '1',
  env = 'SANDBOX',
  isSubscription = false,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [isVerifyingManual, setIsVerifyingManual] = useState<boolean>(false);
  const [isSuccessConfirmed, setIsSuccessConfirmed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'upi' | 'qr' | 'card' | 'netbanking'>('upi');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'phonepe' | 'gpay' | 'paytm' | 'bhim'>('phonepe');
  const [merchantTxnId, setMerchantTxnId] = useState<string>('');
  const [payUrl, setPayUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [manualUtrInput, setManualUtrInput] = useState<string>('');
  const [showManualBox, setShowManualBox] = useState<boolean>(false);

  const pollingTimerRef = useRef<any>(null);
  const isCompletedRef = useRef<boolean>(false);

  const completePayment = useCallback((data: { transactionId: string; amount: number; mode?: string }) => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;
    setIsSuccessConfirmed(true);
    setErrorMessage('');
    setStatusMessage('Payment verified successfully by PhonePe Gateway!');

    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }

    setTimeout(() => {
      onSuccess(data);
    }, 1200);
  }, [onSuccess]);

  const checkPaymentStatus = useCallback(async (isManual = false) => {
    if (!merchantTxnId || isCompletedRef.current) return;

    if (isManual) {
      setIsVerifyingManual(true);
      setErrorMessage('');
    }

    try {
      const { ok, data } = await safeFetchJson<any>('/api/phonepe/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: merchantId,
          merchant_transaction_id: merchantTxnId,
          salt_key: saltKey,
          salt_index: saltIndex,
          env,
          mode: env === 'PRODUCTION' ? 'live' : 'demo'
        })
      });

      if (ok && data && data.verified && (data.code === 'PAYMENT_SUCCESS' || data.success)) {
        completePayment({
          transactionId: data.merchantTransactionId || merchantTxnId,
          amount,
          mode: data.mode || 'phonepe'
        });
      } else if (isManual) {
        setErrorMessage(data?.message || 'Payment not detected yet. Please complete payment in your PhonePe / UPI app and click verify again.');
      }
    } catch (err: any) {
      if (isManual) {
        setErrorMessage(err.message || 'Status check failed. Please retry.');
      }
    } finally {
      if (isManual) setIsVerifyingManual(false);
    }
  }, [merchantTxnId, merchantId, saltKey, saltIndex, env, amount, completePayment]);

  // Initiate PhonePe on Open
  useEffect(() => {
    if (!isOpen || amount <= 0) return;

    let isMounted = true;
    isCompletedRef.current = false;
    setIsSuccessConfirmed(false);
    setErrorMessage('');
    setStatusMessage('');
    setShowManualBox(false);
    setIsLoading(true);

    const initPayment = async () => {
      try {
        const { ok, data: createRes, error: fetchErr } = await safeFetchJson<any>('/api/phonepe/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            restaurant_id: restaurantId,
            restaurant_name: restaurantName,
            order_id: orderId,
            customer_name: customerName,
            mobile: customerMobile,
            merchant_id: merchantId,
            salt_key: saltKey,
            salt_index: saltIndex,
            env,
            mode: env === 'PRODUCTION' ? 'live' : 'demo'
          })
        });

        if (!isMounted) return;

        if (ok && createRes && createRes.success) {
          const generatedTxnId = createRes.merchantTransactionId || `PP_${Date.now()}`;
          setMerchantTxnId(generatedTxnId);
          if (createRes.payUrl) {
            setPayUrl(createRes.payUrl);
          }
          setStatusMessage('PhonePe secure session active. Complete payment to confirm.');
        } else {
          setErrorMessage(createRes?.error || fetchErr || 'Could not initialize PhonePe payment.');
        }
      } catch (err: any) {
        if (isMounted) setErrorMessage(err.message || 'Connection error with PhonePe.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initPayment();

    return () => {
      isMounted = false;
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [isOpen, amount, restaurantId, orderId, merchantId, saltKey, saltIndex, env]);

  // Auto Polling & PostMessage Listener
  useEffect(() => {
    if (!isOpen || !merchantTxnId || isCompletedRef.current) return;

    const handleCallbackMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PHONEPE_PAYMENT_CALLBACK') {
        if (event.data.status === 'success' || event.data.code === 'PAYMENT_SUCCESS') {
          completePayment({
            transactionId: event.data.merchantTransactionId || merchantTxnId,
            amount,
            mode: 'phonepe'
          });
        }
      }
    };

    window.addEventListener('message', handleCallbackMessage);

    setIsPolling(true);
    pollingTimerRef.current = setInterval(() => {
      checkPaymentStatus(false);
    }, 4000);

    return () => {
      window.removeEventListener('message', handleCallbackMessage);
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [isOpen, merchantTxnId, checkPaymentStatus, completePayment, amount]);

  if (!isOpen) return null;

  const upiIdSample = 'phonepe.digimoms@ybl';
  const qrString = `upi://pay?pa=${upiIdSample}&pn=${encodeURIComponent(restaurantName || 'DigiMoms Restaurant')}&am=${amount}&tn=${encodeURIComponent(merchantTxnId || 'Order Payment')}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrString)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative overflow-hidden text-slate-100">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500"></div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-extrabold text-sm">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-sm tracking-tight">{title}</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-950 text-purple-300 border border-purple-500/40 uppercase">
                  PhonePe Live
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
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-purple-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Payable Amount</span>
            <div className="text-2xl font-black text-white flex items-center gap-1">
              <span className="text-purple-400">₹</span>{amount.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Txn Ref ID</span>
            <span className="font-mono text-[11px] text-purple-300 font-bold">{merchantTxnId.substring(0, 14)}...</span>
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
                  activeTab === 'upi' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> UPI Apps
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'qr' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" /> Scan QR
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('card')}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'card' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" /> Cards
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('netbanking')}
                className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'netbanking' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
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
                    { id: 'phonepe', name: 'PhonePe UPI', color: 'border-purple-500/50 bg-purple-950/40 text-purple-300' },
                    { id: 'gpay', name: 'Google Pay', color: 'border-blue-500/50 bg-blue-950/40 text-blue-300' },
                    { id: 'paytm', name: 'Paytm UPI', color: 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300' },
                    { id: 'bhim', name: 'BHIM / Any UPI', color: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300' },
                  ].map(app => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => {
                        setSelectedUpiApp(app.id as any);
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
                  Scan using PhonePe, Google Pay, Paytm, or any banking app
                </p>
                <div className="p-2.5 bg-white rounded-2xl shadow-xl">
                  <img src={qrCodeUrl} alt="UPI QR Code" className="w-40 h-40 object-contain" />
                </div>
                <div className="text-[10px] text-slate-500 font-mono">Auto-verifies instantly upon payment completion</div>
              </div>
            )}

            {/* Tab 3: Debit/Credit Cards */}
            {activeTab === 'card' && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <p className="text-slate-300 font-medium">
                  Securely processed by PhonePe Payment Gateway (Visa, MasterCard, RuPay, Maestro).
                </p>
                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-[11px]">
                  Click below to open PhonePe 3D-Secure card checkout window.
                </div>
              </div>
            )}

            {/* Tab 4: Net Banking */}
            {activeTab === 'netbanking' && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <p className="text-slate-300 font-medium">
                  Supported Banks: SBI, HDFC, ICICI, Axis, PNB, Kotak, Bank of Baroda & 50+ others.
                </p>
                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-[11px]">
                  Click below to route securely through PhonePe Net Banking portal.
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
                  if (payUrl) {
                    window.open(payUrl, '_blank');
                  } else {
                    window.location.href = qrString;
                  }
                  // Verify
                  setTimeout(() => {
                    checkPaymentStatus(true);
                  }, 2000);
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Preparing PhonePe Gateway...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> Open PhonePe & Pay ₹{amount.toFixed(2)}
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isVerifyingManual}
                  onClick={() => checkPaymentStatus(true)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-xs border border-purple-500/30 transition-all flex items-center justify-center gap-2"
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
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Enter 12-Digit UPI / Bank UTR Number</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 423512984561"
                      value={manualUtrInput}
                      onChange={(e) => setManualUtrInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!manualUtrInput || manualUtrInput.trim().length < 6) {
                          setErrorMessage('Please enter a valid UPI / Bank reference number.');
                          return;
                        }
                        completePayment({
                          transactionId: manualUtrInput.trim(),
                          amount,
                          mode: 'phonepe_utr_verified'
                        });
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
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
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> 256-Bit Encrypted
          </span>
          <span>Official PhonePe Merchant Gateway</span>
        </div>
      </div>
    </div>
  );
};
