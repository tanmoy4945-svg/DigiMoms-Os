import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Zap, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, X, Lock, CreditCard, Smartphone, Building2 } from 'lucide-react';

export interface PayUCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentData: { txnid: string; mihpayid?: string; hash?: string; amount: number }) => void;
  amount: number;
  title: string;
  subtitle?: string;
  orderId?: string;
  restaurantId?: string;
  restaurantName?: string;
  customerName?: string;
  customerMobile?: string;
  customerEmail?: string;
  payuKey?: string;
  payuSalt?: string;
  env?: 'TEST' | 'LIVE';
  isSubscription?: boolean;
}

export const PayUCheckoutModal: React.FC<PayUCheckoutModalProps> = ({
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
  payuKey,
  payuSalt,
  env = 'TEST',
  isSubscription = false,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [paymentInitiated, setPaymentInitiated] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [payuParams, setPayuParams] = useState<any>(null);
  const [actionUrl, setActionUrl] = useState<string>('');
  const [txnid, setTxnid] = useState<string>('');
  const [hash, setHash] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [paymentWindowOpened, setPaymentWindowOpened] = useState<boolean>(false);
  const popupRef = useRef<Window | null>(null);

  // Initialize PayU payment request when modal opens
  useEffect(() => {
    if (!isOpen) {
      setPaymentInitiated(false);
      setPaymentWindowOpened(false);
      setPayuParams(null);
      setErrorMessage('');
      return;
    }

    let isMounted = true;
    async function initPayU() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const res = await fetch('/api/payu/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            restaurant_id: restaurantId,
            restaurant_name: restaurantName || 'DigiMoms Restaurant',
            order_id: orderId,
            customer_name: customerName || 'Customer',
            customer_email: customerEmail || 'customer@digimoms.in',
            mobile: customerMobile || '9999999999',
            payu_key: payuKey,
            payu_salt: payuSalt,
            env,
            product_info: isSubscription
              ? `DigiMoms OS Monthly Subscription (${restaurantName || 'Restaurant'})`
              : `Restaurant Food Order #${orderId || ''}`,
            surl: `${window.location.origin}/api/payu/callback`,
            furl: `${window.location.origin}/api/payu/callback`,
            udf1: restaurantId || '',
            udf2: orderId || ''
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to initialize PayU payment gateway.');
        }

        if (isMounted) {
          setPayuParams(data.params);
          setActionUrl(data.actionUrl);
          setTxnid(data.txnid);
          setHash(data.hash);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('PayU Init Error:', err);
        if (isMounted) {
          setErrorMessage(err.message || 'Could not connect to PayU Gateway.');
          setIsLoading(false);
        }
      }
    }

    initPayU();

    return () => {
      isMounted = false;
    };
  }, [isOpen, amount, orderId, restaurantId, restaurantName, customerName, customerMobile, customerEmail, payuKey, payuSalt, env, isSubscription]);

  // Listen for PayU Callback PostMessage from child/popup window
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data && event.data.type === 'PAYU_PAYMENT_CALLBACK') {
        const { status, txnid: callbackTxnid, mihpayid, hash: callbackHash, amount: callbackAmount } = event.data;
        if (status === 'success') {
          setIsVerifying(true);
          await verifyAndComplete(callbackTxnid || txnid, mihpayid, callbackHash || hash);
        } else {
          setErrorMessage(`Payment ${status || 'failed'}. Please try again.`);
          setIsVerifying(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [txnid, hash]);

  // Launch PayU standard Form POST to PayU Gateway
  const handleLaunchPayU = () => {
    if (!payuParams || !actionUrl) return;

    setPaymentInitiated(true);
    setPaymentWindowOpened(true);
    setErrorMessage('');

    // Programmatically construct and submit standard HTML form to PayU gateway
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = actionUrl;
    form.target = '_blank'; // Opens in secure PayU Tab / Window

    Object.entries(payuParams).forEach(([key, val]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = String(val ?? '');
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  // Verify transaction status with server
  const verifyAndComplete = async (customTxnId?: string, mihpayid?: string, customHash?: string) => {
    setIsVerifying(true);
    setErrorMessage('');

    try {
      const verifyRes = await fetch('/api/payu/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txnid: customTxnId || txnid,
          amount,
          status: 'success',
          hash: customHash || hash,
          mihpayid: mihpayid || `mih_${Date.now()}`,
          payu_key: payuKey,
          payu_salt: payuSalt,
          env,
          mode: env === 'LIVE' ? 'live' : 'demo'
        })
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.verified) {
        throw new Error(verifyData.error || 'Payment verification failed with PayU.');
      }

      // Success
      setIsVerifying(false);
      onSuccess({
        txnid: verifyData.txnid || txnid,
        mihpayid: verifyData.mihpayid,
        hash: customHash || hash,
        amount
      });
    } catch (err: any) {
      console.error('PayU Verification Error:', err);
      setErrorMessage(err.message || 'Payment verification pending. Please verify after completing transaction.');
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative overflow-hidden">
        
        {/* Decorative ambient glow */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/10">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-white text-base">PayU India Gateway</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  env === 'LIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                }`}>
                  {env === 'LIVE' ? 'LIVE GATEWAY' : 'TEST SANDBOX'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Payment Summary Box */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 relative z-10">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Beneficiary / Merchant</span>
            <span className="font-bold text-white text-right max-w-[200px] truncate">
              {isSubscription ? 'DigiMoms Marketing Agency (Tanmoy Jana)' : (restaurantName || 'DigiMoms Restaurant')}
            </span>
          </div>

          {orderId && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Order Reference</span>
              <span className="font-mono text-[11px] text-slate-300 font-semibold">{orderId.substring(0, 14)}</span>
            </div>
          )}

          {txnid && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">PayU Txn ID</span>
              <span className="font-mono text-[11px] text-emerald-400 truncate max-w-[180px]">{txnid}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-300">Total Payable Amount</span>
            <span className="text-xl font-black text-emerald-400">₹{Number(amount).toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Methods Supported */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-around text-[11px] text-slate-400 font-medium">
          <span className="flex items-center gap-1"><Smartphone className="w-3.5 h-3.5 text-emerald-400" /> UPI (GPay/PhonePe/Paytm)</span>
          <span className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5 text-blue-400" /> Cards</span>
          <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-purple-400" /> Net Banking</span>
        </div>

        {/* Error message alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 relative z-10">
          {!paymentWindowOpened ? (
            <button
              disabled={isLoading || !payuParams}
              onClick={handleLaunchPayU}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Preparing PayU Secure Gateway...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" /> Open PayU Payment Gateway (₹{amount})
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs text-center space-y-1">
                <div className="font-bold flex items-center justify-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" /> PayU Gateway Opened in Secure Tab
                </div>
                <p className="text-[11px] text-emerald-400/80">
                  Please complete the payment on the PayU page. Once done, click below to confirm.
                </p>
              </div>

              <button
                disabled={isVerifying}
                onClick={() => verifyAndComplete()}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Payment with PayU...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> I Have Completed Payment (Verify & Confirm)
                  </>
                )}
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleLaunchPayU}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Reopen PayU Page
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 font-bold text-xs transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="text-center text-[10px] text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> 256-Bit SSL Encrypted • RBI & PCI-DSS Compliant PayU Checkout
          </div>
        </div>

      </div>
    </div>
  );
};
