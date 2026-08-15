import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { CreditCard, ShieldCheck, Zap, Key, Smartphone, CheckCircle2, AlertTriangle, RefreshCw, Percent, Receipt, Tag, Trash2, Plus, Ticket, Banknote } from 'lucide-react';
import { verifyRestaurantGateway } from '../../lib/paymentAdapters';
import { CouponConfig } from '../../types';

export const PaymentSettings: React.FC = () => {
  const { currentOwner, updateOwnerProfile } = useSaaS();

  const [mode, setMode] = useState<'demo' | 'live'>(currentOwner?.payment_mode || 'demo');
  const [liveGateway, setLiveGateway] = useState<'razorpay' | 'phonepe' | 'payu'>(currentOwner?.live_gateway || 'razorpay');

  // Razorpay credentials
  const [razorpayKey, setRazorpayKey] = useState(currentOwner?.razorpay_key || '');
  const [razorpaySecret, setRazorpaySecret] = useState(currentOwner?.razorpay_secret || '');

  // PhonePe credentials
  const [phonepeMerchantId, setPhonepeMerchantId] = useState(currentOwner?.phonepe_merchant_id || '');
  const [phonepeSaltKey, setPhonepeSaltKey] = useState(currentOwner?.phonepe_salt_key || '');
  const [phonepeSaltIndex, setPhonepeSaltIndex] = useState(currentOwner?.phonepe_salt_index || '1');
  const [phonepeEnv, setPhonepeEnv] = useState<'SANDBOX' | 'PRODUCTION'>(currentOwner?.phonepe_env || 'SANDBOX');

  // PayU credentials
  const [payuMerchantKey, setPayuMerchantKey] = useState(currentOwner?.payu_merchant_key || '');
  const [payuMerchantSalt, setPayuMerchantSalt] = useState(currentOwner?.payu_merchant_salt || '');
  const [payuEnv, setPayuEnv] = useState<'TEST' | 'LIVE'>(currentOwner?.payu_env || 'TEST');

  // Customer Payment Methods Allowed (Cash, Online, Split)
  const [enableCashPayment, setEnableCashPayment] = useState<boolean>(currentOwner?.enable_cash_payment ?? true);
  const [enableOnlinePayment, setEnableOnlinePayment] = useState<boolean>(currentOwner?.enable_online_payment ?? true);
  const [enableSplitPayment, setEnableSplitPayment] = useState<boolean>(currentOwner?.enable_split_payment ?? true);

  // Tax & Charges State
  const [enableGst, setEnableGst] = useState<boolean>(currentOwner?.enable_gst ?? true);
  const [gstPercentage, setGstPercentage] = useState<string>(String(currentOwner?.gst_percentage ?? 5));

  const [enablePackaging, setEnablePackaging] = useState<boolean>(currentOwner?.enable_packaging_charge ?? false);
  const [packagingAmount, setPackagingAmount] = useState<string>(String(currentOwner?.packaging_charge_amount ?? 10));

  const [enableServiceCharge, setEnableServiceCharge] = useState<boolean>(currentOwner?.enable_service_charge ?? false);
  const [serviceChargePercentage, setServiceChargePercentage] = useState<string>(String(currentOwner?.service_charge_percentage ?? 2.5));

  // Online Discount State
  const [enableOnlineDiscount, setEnableOnlineDiscount] = useState<boolean>(currentOwner?.enable_online_discount ?? true);
  const [onlineDiscountPercentage, setOnlineDiscountPercentage] = useState<string>(String(currentOwner?.online_discount_percentage ?? 5));

  // Coupons State
  const [enableCoupons, setEnableCoupons] = useState<boolean>(currentOwner?.enable_coupons ?? true);
  const [coupons, setCoupons] = useState<CouponConfig[]>(
    currentOwner?.coupons && currentOwner.coupons.length > 0
      ? currentOwner.coupons
      : [
          { id: '1', code: 'DIGI10', discount_type: 'percent', discount_value: 10, min_order_amount: 100, is_active: true },
          { id: '2', code: 'WELCOME50', discount_type: 'flat', discount_value: 50, min_order_amount: 300, is_active: true }
        ]
  );

  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percent' | 'flat'>('percent');
  const [newCouponVal, setNewCouponVal] = useState('10');
  const [newCouponMin, setNewCouponMin] = useState('100');

  // Verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState<boolean>(currentOwner?.gateway_verified || false);
  const [verificationMessage, setVerificationMessage] = useState<string>(
    currentOwner?.gateway_status_message || ''
  );

  if (!currentOwner) return null;

  const handleAddCoupon = () => {
    if (!newCouponCode.trim()) return;
    const codeUpper = newCouponCode.trim().toUpperCase();
    if (coupons.some(c => c.code.toUpperCase() === codeUpper)) {
      alert('Coupon code already exists.');
      return;
    }
    const newC: CouponConfig = {
      id: crypto.randomUUID(),
      code: codeUpper,
      discount_type: newCouponType,
      discount_value: Number(newCouponVal) || 0,
      min_order_amount: Number(newCouponMin) || 0,
      is_active: true
    };
    setCoupons(prev => [...prev, newC]);
    setNewCouponCode('');
  };

  const handleToggleCoupon = (id: string) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c));
  };

  const handleDeleteCoupon = (id: string) => {
    setCoupons(prev => prev.filter(c => c.id !== id));
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerificationMessage('Executing gateway credential verification test...');

    const res = await verifyRestaurantGateway(
      {
        razorpay_key: razorpayKey,
        razorpay_secret: razorpaySecret,
        phonepe_merchant_id: phonepeMerchantId,
        phonepe_salt_key: phonepeSaltKey,
        phonepe_salt_index: phonepeSaltIndex,
        phonepe_env: phonepeEnv,
        payu_merchant_key: payuMerchantKey,
        payu_merchant_salt: payuMerchantSalt,
        payu_env: payuEnv
      },
      liveGateway
    );

    setIsVerifying(false);
    setVerified(res.success);
    setVerificationMessage(res.message);

    if (res.success) {
      await updateOwnerProfile({
        gateway_verified: true,
        gateway_verified_at: res.verifiedAt,
        gateway_status_message: res.message
      });
    } else {
      await updateOwnerProfile({
        gateway_verified: false,
        gateway_status_message: res.message
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent turning on 'live' mode if gateway isn't verified
    if (mode === 'live' && !verified) {
      alert('⚠️ Verification Required: You must verify your Live Gateway credentials before activating Live mode. Falling back to Demo mode until verified.');
      setMode('demo');
      return;
    }

    try {
      await updateOwnerProfile({
        payment_mode: mode,
        live_gateway: liveGateway,
        razorpay_key: razorpayKey,
        razorpay_secret: razorpaySecret,
        phonepe_merchant_id: phonepeMerchantId,
        phonepe_salt_key: phonepeSaltKey,
        phonepe_salt_index: phonepeSaltIndex,
        phonepe_env: phonepeEnv,
        payu_merchant_key: payuMerchantKey,
        payu_merchant_salt: payuMerchantSalt,
        payu_env: payuEnv,
        gateway_verified: verified,
        gateway_status_message: verificationMessage,
        enable_gst: enableGst,
        gst_percentage: Number(gstPercentage) || 0,
        enable_packaging_charge: enablePackaging,
        packaging_charge_amount: Number(packagingAmount) || 0,
        enable_service_charge: enableServiceCharge,
        service_charge_percentage: Number(serviceChargePercentage) || 0,
        enable_online_discount: enableOnlineDiscount,
        online_discount_percentage: Number(onlineDiscountPercentage) || 0,
        enable_coupons: enableCoupons,
        coupons: coupons,
        enable_cash_payment: enableCashPayment,
        enable_online_payment: enableOnlinePayment,
        enable_split_payment: enableSplitPayment
      });
      alert('✅ Payment settings saved successfully!');
    } catch (err: any) {
      console.error("Save payment settings error:", err);
      alert(`❌ Failed to save payment settings: ${err?.message || String(err)}`);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Payment Gateway & Operating Mode</h2>
        <p className="text-xs text-slate-400">
          Configure customer checkout mode for <strong className="text-white">{currentOwner.name}</strong>. Demo payment mode remains available permanently for testing.
        </p>
      </div>

      <form onSubmit={handleSave} className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-8 shadow-2xl">
        {/* 1. Mode Selector */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Customer Payment Mode
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => setMode('demo')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-2 ${
                mode === 'demo'
                  ? 'border-blue-500 bg-blue-950/30 text-white shadow-lg shadow-blue-500/10'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm text-blue-400 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-400" /> Demo Payment Mode (Active Test)
                </div>
                {mode === 'demo' && <CheckCircle2 className="w-5 h-5 text-blue-400" />}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Simulates instant successful online payments. Ideal for testing, staff training, and initial onboarding without requiring live bank/gateway API keys.
              </p>
            </div>

            <div
              onClick={() => {
                if (!verified) {
                  alert('Please enter and verify your live gateway credentials below first before selecting Live Mode.');
                } else {
                  setMode('live');
                }
              }}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-2 ${
                mode === 'live'
                  ? 'border-emerald-500 bg-emerald-950/30 text-white shadow-lg shadow-emerald-500/10'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Live Gateway Mode ({liveGateway.toUpperCase()})
                </div>
                {mode === 'live' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Processes real online customer payments via your restaurant's verified gateway adapter ({liveGateway === 'phonepe' ? 'PhonePe' : 'Razorpay'}).
              </p>
            </div>
          </div>
        </div>

        {/* 2. Live Gateway Adapter Selection */}
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Select Live Payment Gateway Adapter
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => {
                setLiveGateway('razorpay');
                setVerified(false);
              }}
              className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                liveGateway === 'razorpay'
                  ? 'bg-indigo-950/40 border-indigo-500 text-white font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-indigo-400" />
                <div className="text-left">
                  <div className="text-sm">Razorpay Checkout</div>
                  <div className="text-[11px] text-slate-400">Cards, UPI, NetBanking</div>
                </div>
              </div>
              {liveGateway === 'razorpay' && <div className="w-2 h-2 rounded-full bg-indigo-400"></div>}
            </button>

            <button
              type="button"
              onClick={() => {
                setLiveGateway('phonepe');
                setVerified(false);
              }}
              className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                liveGateway === 'phonepe'
                  ? 'bg-purple-950/40 border-purple-500 text-white font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-purple-400" />
                <div className="text-left">
                  <div className="text-sm">PhonePe Business</div>
                  <div className="text-[11px] text-slate-400">Official Merchant UPI & QR</div>
                </div>
              </div>
              {liveGateway === 'phonepe' && <div className="w-2 h-2 rounded-full bg-purple-400"></div>}
            </button>

            <button
              type="button"
              onClick={() => {
                setLiveGateway('payu');
                setVerified(false);
              }}
              className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                liveGateway === 'payu'
                  ? 'bg-emerald-950/40 border-emerald-500 text-white font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-emerald-400" />
                <div className="text-left">
                  <div className="text-sm">PayU India</div>
                  <div className="text-[11px] text-slate-400">PayU Money / Gateway</div>
                </div>
              </div>
              {liveGateway === 'payu' && <div className="w-2 h-2 rounded-full bg-emerald-400"></div>}
            </button>
          </div>
        </div>

        {/* 3. Credentials Form */}
        {liveGateway === 'razorpay' ? (
          <div className="space-y-4 p-5 rounded-2xl bg-slate-950 border border-slate-800">
            <h3 className="text-xs font-bold uppercase text-indigo-400 flex items-center gap-2">
              <Key className="w-4 h-4" /> Razorpay Merchant Credentials (Restaurant Specific)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Razorpay Key ID *</label>
                <input
                  type="text"
                  placeholder="rzp_live_xxxxxxxxxxxx"
                  value={razorpayKey}
                  onChange={(e) => {
                    setRazorpayKey(e.target.value);
                    setVerified(false);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Razorpay Key Secret *</label>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••"
                  value={razorpaySecret}
                  onChange={(e) => {
                    setRazorpaySecret(e.target.value);
                    setVerified(false);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        ) : liveGateway === 'phonepe' ? (
          <div className="space-y-4 p-5 rounded-2xl bg-slate-950 border border-slate-800">
            <h3 className="text-xs font-bold uppercase text-purple-400 flex items-center gap-2">
              <Smartphone className="w-4 h-4" /> PhonePe Merchant Credentials (Restaurant Specific)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">PhonePe Merchant ID (MID) *</label>
                <input
                  type="text"
                  placeholder="PGMERCXXXXXXXX"
                  value={phonepeMerchantId}
                  onChange={(e) => {
                    setPhonepeMerchantId(e.target.value);
                    setVerified(false);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">PhonePe Salt Key *</label>
                <input
                  type="password"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={phonepeSaltKey}
                  onChange={(e) => {
                    setPhonepeSaltKey(e.target.value);
                    setVerified(false);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Salt Index *</label>
                <input
                  type="text"
                  placeholder="1"
                  value={phonepeSaltIndex}
                  onChange={(e) => {
                    setPhonepeSaltIndex(e.target.value);
                    setVerified(false);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Gateway Environment</label>
                <select
                  value={phonepeEnv}
                  onChange={(e) => {
                    setPhonepeEnv(e.target.value as any);
                    setVerified(false);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                >
                  <option value="SANDBOX">UAT / Sandbox (Testing)</option>
                  <option value="PRODUCTION">Production (Live Payments)</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-5 rounded-2xl bg-slate-950 border border-slate-800">
            <h3 className="text-xs font-bold uppercase text-emerald-400 flex items-center gap-2">
              <Zap className="w-4 h-4" /> PayU Merchant Credentials (Restaurant Specific)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">PayU Merchant Key *</label>
                <input
                  type="text"
                  placeholder="Merchant Key provided by PayU"
                  value={payuMerchantKey}
                  onChange={(e) => {
                    setPayuMerchantKey(e.target.value);
                    setVerified(false);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">PayU Merchant Salt *</label>
                <input
                  type="password"
                  placeholder="Merchant Salt provided by PayU"
                  value={payuMerchantSalt}
                  onChange={(e) => {
                    setPayuMerchantSalt(e.target.value);
                    setVerified(false);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">PayU Gateway Environment</label>
                <select
                  value={payuEnv}
                  onChange={(e) => {
                    setPayuEnv(e.target.value as any);
                    setVerified(false);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                >
                  <option value="TEST">Test / Sandbox (test.payu.in)</option>
                  <option value="LIVE">Live / Production (secure.payu.in)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 4. Gateway Verification & Status Box */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {verified ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              )}
              <span className="text-xs font-bold text-white">
                Gateway Status: {verified ? 'VERIFIED & READY' : 'NOT VERIFIED'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              {isVerifying ? 'Verifying...' : 'Verify Gateway Credentials'}
            </button>
          </div>

          {verificationMessage && (
            <div className={`p-3 rounded-xl text-xs font-mono border ${
              verified ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
            }`}>
              {verificationMessage}
            </div>
          )}
        </div>

        {/* 4.5 Payment Options Configuration */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <CreditCard className="w-5 h-5" /> Allowed Customer Payment Options
          </div>
          <p className="text-xs text-slate-400">
            Control which payment modes customers can choose during checkout on their devices. Disabling an option will hide it on the checkout screen.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Cash Payment Option */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-400" /> Cash Payment
                </span>
                <input
                  type="checkbox"
                  checked={enableCashPayment}
                  onChange={(e) => setEnableCashPayment(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Allow customers to pay cash at the counter or to the waiter.
              </p>
            </div>

            {/* Online Payment Option */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-400" /> Full Online Payment
                </span>
                <input
                  type="checkbox"
                  checked={enableOnlinePayment}
                  onChange={(e) => setEnableOnlinePayment(e.target.checked)}
                  className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Allow customers to pay 100% online via UPI / Cards / NetBanking.
              </p>
            </div>

            {/* Split / Partial Payment Option */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Percent className="w-4 h-4 text-purple-400" /> Split / Partial Payment
                </span>
                <input
                  type="checkbox"
                  checked={enableSplitPayment}
                  onChange={(e) => setEnableSplitPayment(e.target.checked)}
                  className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Allow customers to split payment (e.g., pay ₹100 online and rest in cash).
              </p>
            </div>
          </div>
        </div>

        {/* 5. Tax & Extra Charges Configuration */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Receipt className="w-5 h-5" /> Tax & Extra Charges Settings
          </div>
          <p className="text-xs text-slate-400">
            Set custom GST percentage and optional packaging or service charges. These will appear dynamically on customer checkout and final bills.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* GST Tax */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">GST Tax</span>
                <input
                  type="checkbox"
                  checked={enableGst}
                  onChange={(e) => setEnableGst(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>
              {enableGst && (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">GST Percentage (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={gstPercentage}
                    onChange={(e) => setGstPercentage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-amber-500"
                    placeholder="5"
                  />
                </div>
              )}
            </div>

            {/* Packaging Charge */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Packaging Charge</span>
                <input
                  type="checkbox"
                  checked={enablePackaging}
                  onChange={(e) => setEnablePackaging(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>
              {enablePackaging && (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Flat Amount (₹)</label>
                  <input
                    type="number"
                    value={packagingAmount}
                    onChange={(e) => setPackagingAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-amber-500"
                    placeholder="10"
                  />
                </div>
              )}
            </div>

            {/* Service Charge */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Service Charge</span>
                <input
                  type="checkbox"
                  checked={enableServiceCharge}
                  onChange={(e) => setEnableServiceCharge(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>
              {enableServiceCharge && (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Service Charge (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={serviceChargePercentage}
                    onChange={(e) => setServiceChargePercentage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-amber-500"
                    placeholder="2.5"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 6. Full Online Payment Discount */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Percent className="w-5 h-5" /> Online Payment Discount Settings
            </div>
            <input
              type="checkbox"
              checked={enableOnlineDiscount}
              onChange={(e) => setEnableOnlineDiscount(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </div>
          <p className="text-xs text-slate-400">
            Encourage customers to pay fully online by providing an instant discount at checkout. Applied automatically when customer selects 'Full Online'.
          </p>

          {enableOnlineDiscount && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 max-w-xs space-y-2">
              <label className="block text-[11px] font-bold text-slate-300">Online Discount Percentage (%)</label>
              <input
                type="number"
                step="0.5"
                value={onlineDiscountPercentage}
                onChange={(e) => setOnlineDiscountPercentage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500"
                placeholder="5"
              />
            </div>
          )}
        </div>

        {/* 7. Coupon & Promo Codes Configuration */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
              <Ticket className="w-5 h-5" /> Coupon & Promo Codes Management
            </div>
            <input
              type="checkbox"
              checked={enableCoupons}
              onChange={(e) => setEnableCoupons(e.target.checked)}
              className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
            />
          </div>
          <p className="text-xs text-slate-400">
            Create coupon codes that customers can apply at checkout to receive flat or percentage discounts.
          </p>

          {enableCoupons && (
            <div className="space-y-4 pt-2">
              {/* Add New Coupon Form */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-blue-400" /> Create New Coupon
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="CODE (e.g. FESTIVE20)"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white uppercase outline-none focus:border-blue-500 font-mono"
                  />
                  <select
                    value={newCouponType}
                    onChange={(e) => setNewCouponType(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Discount Value"
                    value={newCouponVal}
                    onChange={(e) => setNewCouponVal(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500 font-mono"
                  />
                  <input
                    type="number"
                    placeholder="Min Order ₹"
                    value={newCouponMin}
                    onChange={(e) => setNewCouponMin(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddCoupon}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Coupon
                </button>
              </div>

              {/* Existing Coupons List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300">Active Coupons List</span>
                {coupons.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No coupons created yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {coupons.map((c) => (
                      <div key={c.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
                              {c.code}
                            </span>
                            <span className="text-slate-300 font-semibold">
                              {c.discount_type === 'percent' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Min Order: ₹{c.min_order_amount || 0}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleCoupon(c.id)}
                            className={`px-2 py-1 rounded text-[10px] font-bold ${
                              c.is_active ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {c.is_active ? 'Active' : 'Disabled'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(c.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 8. Save Button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <p className="text-[11px] text-slate-400">
            🔒 Credentials are bound specifically to restaurant ID <span className="text-slate-200 font-mono">{currentOwner.id.substring(0, 8)}...</span>
          </p>

          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all"
          >
            Save Payment Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
