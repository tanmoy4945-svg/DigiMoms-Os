import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { CreditCard, Smartphone, ShieldCheck, Key, CheckCircle2, AlertTriangle, RefreshCw, Layers, Zap } from 'lucide-react';
import { verifyCeoGatewayConfig } from '../../lib/paymentAdapters';
import { CeoPaymentConfig } from '../../types';

export const CeoPaymentSettings: React.FC = () => {
  const { ceoPaymentConfig, updateCeoPaymentConfig, subscriptionHistory } = useSaaS();

  const [primaryGateway, setPrimaryGateway] = useState<'phonepe' | 'razorpay' | 'payu' | 'demo'>(
    ceoPaymentConfig?.primary_gateway || 'payu'
  );
  const [mode, setMode] = useState<'demo' | 'live'>(ceoPaymentConfig?.mode || 'demo');

  // PhonePe credentials
  const [phonepeMerchantId, setPhonepeMerchantId] = useState(ceoPaymentConfig?.phonepe_merchant_id || '');
  const [phonepeSaltKey, setPhonepeSaltKey] = useState(ceoPaymentConfig?.phonepe_salt_key || '');
  const [phonepeSaltIndex, setPhonepeSaltIndex] = useState(ceoPaymentConfig?.phonepe_salt_index || '1');
  const [phonepeEnv, setPhonepeEnv] = useState<'SANDBOX' | 'PRODUCTION'>(ceoPaymentConfig?.phonepe_env || 'SANDBOX');
  const [phonepeVerified, setPhonepeVerified] = useState(ceoPaymentConfig?.phonepe_verified || false);

  // Razorpay credentials
  const [razorpayKeyId, setRazorpayKeyId] = useState(ceoPaymentConfig?.razorpay_key_id || '');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState(ceoPaymentConfig?.razorpay_key_secret || '');
  const [razorpayVerified, setRazorpayVerified] = useState(ceoPaymentConfig?.razorpay_verified || false);

  // PayU credentials
  const [payuMerchantKey, setPayuMerchantKey] = useState(ceoPaymentConfig?.payu_merchant_key || '');
  const [payuMerchantSalt, setPayuMerchantSalt] = useState(ceoPaymentConfig?.payu_merchant_salt || '');
  const [payuEnv, setPayuEnv] = useState<'TEST' | 'LIVE'>(ceoPaymentConfig?.payu_env || 'TEST');
  const [payuVerified, setPayuVerified] = useState(ceoPaymentConfig?.payu_verified || false);

  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState('');

  // Synchronize local input state when ceoPaymentConfig loads from server/database
  React.useEffect(() => {
    if (ceoPaymentConfig) {
      setPrimaryGateway(ceoPaymentConfig.primary_gateway || 'payu');
      setMode(ceoPaymentConfig.mode || 'demo');
      setPhonepeMerchantId(ceoPaymentConfig.phonepe_merchant_id || '');
      setPhonepeSaltKey(ceoPaymentConfig.phonepe_salt_key || '');
      setPhonepeSaltIndex(ceoPaymentConfig.phonepe_salt_index || '1');
      setPhonepeEnv(ceoPaymentConfig.phonepe_env || 'SANDBOX');
      setPhonepeVerified(ceoPaymentConfig.phonepe_verified || false);
      setRazorpayKeyId(ceoPaymentConfig.razorpay_key_id || '');
      setRazorpayKeySecret(ceoPaymentConfig.razorpay_key_secret || '');
      setRazorpayVerified(ceoPaymentConfig.razorpay_verified || false);
      setPayuMerchantKey(ceoPaymentConfig.payu_merchant_key || '');
      setPayuMerchantSalt(ceoPaymentConfig.payu_merchant_salt || '');
      setPayuEnv(ceoPaymentConfig.payu_env || 'TEST');
      setPayuVerified(ceoPaymentConfig.payu_verified || false);
    }
  }, [ceoPaymentConfig]);

  const handleVerifyPhonePe = async () => {
    setIsVerifying(true);
    setVerifyMessage('Running PhonePe SHA-256 Checksum Signature Verification test...');

    const res = await verifyCeoGatewayConfig(
      {
        phonepe_merchant_id: phonepeMerchantId,
        phonepe_salt_key: phonepeSaltKey,
        phonepe_salt_index: phonepeSaltIndex,
        phonepe_env: phonepeEnv
      },
      'phonepe'
    );

    setIsVerifying(false);
    setPhonepeVerified(res.success);
    setVerifyMessage(res.message);

    await updateCeoPaymentConfig({
      phonepe_merchant_id: phonepeMerchantId,
      phonepe_salt_key: phonepeSaltKey,
      phonepe_salt_index: phonepeSaltIndex,
      phonepe_env: phonepeEnv,
      phonepe_verified: res.success,
      phonepe_verified_at: res.verifiedAt
    });
  };

  const handleVerifyRazorpay = async () => {
    setIsVerifying(true);
    setVerifyMessage('Running Razorpay Key & Secret format verification test...');

    const res = await verifyCeoGatewayConfig(
      {
        razorpay_key_id: razorpayKeyId,
        razorpay_key_secret: razorpayKeySecret
      },
      'razorpay'
    );

    setIsVerifying(false);
    setRazorpayVerified(res.success);
    setVerifyMessage(res.message);

    await updateCeoPaymentConfig({
      razorpay_key_id: razorpayKeyId,
      razorpay_key_secret: razorpayKeySecret,
      razorpay_verified: res.success,
      razorpay_verified_at: res.verifiedAt
    });
  };

  const handleVerifyPayU = async () => {
    setIsVerifying(true);
    setVerifyMessage('Running PayU SHA-512 Hash Generation and format verification test...');

    const res = await verifyCeoGatewayConfig(
      {
        payu_merchant_key: payuMerchantKey,
        payu_merchant_salt: payuMerchantSalt,
        payu_env: payuEnv
      },
      'payu'
    );

    setIsVerifying(false);
    setPayuVerified(res.success);
    setVerifyMessage(res.message);

    await updateCeoPaymentConfig({
      payu_merchant_key: payuMerchantKey,
      payu_merchant_salt: payuMerchantSalt,
      payu_env: payuEnv,
      payu_verified: res.success,
      payu_verified_at: res.verifiedAt
    });
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();

    let isPhonepeValid = phonepeVerified;
    let isRazorpayValid = razorpayVerified;
    let isPayuValid = payuVerified;

    if (mode === 'live') {
      if (primaryGateway === 'phonepe' && !isPhonepeValid) {
        setIsVerifying(true);
        const res = await verifyCeoGatewayConfig(
          { phonepe_merchant_id: phonepeMerchantId, phonepe_salt_key: phonepeSaltKey, phonepe_salt_index: phonepeSaltIndex, phonepe_env: phonepeEnv },
          'phonepe'
        );
        setIsVerifying(false);
        if (res.success) {
          isPhonepeValid = true;
          setPhonepeVerified(true);
        } else {
          alert(`⚠️ PhonePe Verification Failed:\n${res.message}\n\nPlease check your credentials before enabling Live Mode.`);
          return;
        }
      }

      if (primaryGateway === 'razorpay' && !isRazorpayValid) {
        setIsVerifying(true);
        const res = await verifyCeoGatewayConfig(
          { razorpay_key_id: razorpayKeyId, razorpay_key_secret: razorpayKeySecret },
          'razorpay'
        );
        setIsVerifying(false);
        if (res.success) {
          isRazorpayValid = true;
          setRazorpayVerified(true);
        } else {
          alert(`⚠️ Razorpay Verification Failed:\n${res.message}\n\nPlease check your credentials before enabling Live Mode.`);
          return;
        }
      }

      if (primaryGateway === 'payu' && !isPayuValid) {
        setIsVerifying(true);
        const res = await verifyCeoGatewayConfig(
          { payu_merchant_key: payuMerchantKey, payu_merchant_salt: payuMerchantSalt, payu_env: payuEnv },
          'payu'
        );
        setIsVerifying(false);
        if (res.success) {
          isPayuValid = true;
          setPayuVerified(true);
        } else {
          alert(`⚠️ PayU Verification Failed:\n${res.message}\n\nPlease check your credentials before enabling Live Mode.`);
          return;
        }
      }
    }

    try {
      await updateCeoPaymentConfig({
        primary_gateway: primaryGateway,
        mode: mode,
        phonepe_merchant_id: phonepeMerchantId,
        phonepe_salt_key: phonepeSaltKey,
        phonepe_salt_index: phonepeSaltIndex,
        phonepe_env: phonepeEnv,
        phonepe_verified: isPhonepeValid,
        razorpay_key_id: razorpayKeyId,
        razorpay_key_secret: razorpayKeySecret,
        razorpay_verified: isRazorpayValid,
        payu_merchant_key: payuMerchantKey,
        payu_merchant_salt: payuMerchantSalt,
        payu_env: payuEnv,
        payu_verified: isPayuValid
      });
      alert('✅ DigiMoms CEO Payment Configuration saved successfully!');
    } catch (err: any) {
      alert(`❌ Failed to save CEO payment configuration: ${err?.message || String(err)}`);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-purple-400" /> DigiMoms OS Subscription Payment Gateway
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure DigiMoms master merchant gateway for restaurant monthly OS renewals. <strong className="text-purple-300">Primary Gateway: PhonePe Business</strong>. This configuration is kept strictly isolated from restaurant customer payments.
        </p>
      </div>

      <form onSubmit={handleSaveAll} className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-8 shadow-2xl">
        {/* Gateway Selection */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Primary DigiMoms Subscription Gateway
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => setPrimaryGateway('phonepe')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-2 ${
                primaryGateway === 'phonepe'
                  ? 'border-purple-500 bg-purple-950/30 text-white shadow-lg shadow-purple-500/10'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm text-purple-400 flex items-center gap-2">
                  <Smartphone className="w-4 h-4" /> PhonePe (Primary)
                </div>
                {primaryGateway === 'phonepe' && <CheckCircle2 className="w-5 h-5 text-purple-400" />}
              </div>
              <p className="text-xs text-slate-400">
                PhonePe Business UPI & QR integration for OS renewals.
              </p>
            </div>

            <div
              onClick={() => setPrimaryGateway('razorpay')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-2 ${
                primaryGateway === 'razorpay'
                  ? 'border-indigo-500 bg-indigo-950/30 text-white shadow-lg shadow-indigo-500/10'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm text-indigo-400 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Razorpay Gateway
                </div>
                {primaryGateway === 'razorpay' && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
              </div>
              <p className="text-xs text-slate-400">
                Cards, UPI and NetBanking subscription payments.
              </p>
            </div>

            <div
              onClick={() => setPrimaryGateway('payu')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-2 ${
                primaryGateway === 'payu'
                  ? 'border-emerald-500 bg-emerald-950/30 text-white shadow-lg shadow-emerald-500/10'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> PayU India
                </div>
                {primaryGateway === 'payu' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              </div>
              <p className="text-xs text-slate-400">
                PayU Money & merchant gateway for monthly subscriptions.
              </p>
            </div>

            <div
              onClick={() => setPrimaryGateway('demo')}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-2 ${
                primaryGateway === 'demo'
                  ? 'border-blue-500 bg-blue-950/30 text-white shadow-lg shadow-blue-500/10'
                  : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm text-blue-400 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> CEO Demo Mode
                </div>
                {primaryGateway === 'demo' && <CheckCircle2 className="w-5 h-5 text-blue-400" />}
              </div>
              <p className="text-xs text-slate-400">
                Simulated 1-click test renewals for development & testing.
              </p>
            </div>
          </div>
        </div>

        {/* Operating Mode Toggle */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Subscription Operating Mode
          </label>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMode('demo')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                mode === 'demo'
                  ? 'bg-blue-950/40 border-blue-500 text-white font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="font-bold text-sm text-blue-300">🧪 Demo / Test Mode</div>
              <div className="text-xs text-slate-400 mt-1">
                Allows testing subscription renewals instantly without live money transactions.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode('live')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                mode === 'live'
                  ? 'bg-emerald-950/40 border-emerald-500 text-white font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="font-bold text-sm text-emerald-300">⚡ Live Production Gateway</div>
              <div className="text-xs text-slate-400 mt-1">
                Processes real subscription payments via verified {primaryGateway.toUpperCase()} gateway.
              </div>
            </button>
          </div>
        </div>

        {/* PhonePe Config Section */}
        <div className="space-y-4 p-6 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2">
              <Smartphone className="w-4 h-4" /> PhonePe Business Gateway Settings (Primary)
            </h3>

            <div className="flex items-center gap-2">
              {phonepeVerified ? (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Verified
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Unverified
                </span>
              )}

              <button
                type="button"
                onClick={handleVerifyPhonePe}
                disabled={isVerifying}
                className="px-3 py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-bold border border-purple-500/40 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} /> Verify PhonePe
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">DigiMoms PhonePe Merchant ID *</label>
              <input
                type="text"
                placeholder="DIGIMOMS_ONLINE"
                value={phonepeMerchantId}
                onChange={(e) => {
                  setPhonepeMerchantId(e.target.value);
                  setPhonepeVerified(false);
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-mono outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Salt Key *</label>
              <input
                type="password"
                placeholder="••••••••••••••••••••••••"
                value={phonepeSaltKey}
                onChange={(e) => {
                  setPhonepeSaltKey(e.target.value);
                  setPhonepeVerified(false);
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-mono outline-none focus:border-purple-500"
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
                  setPhonepeVerified(false);
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-mono outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Environment</label>
              <select
                value={phonepeEnv}
                onChange={(e) => {
                  setPhonepeEnv(e.target.value as any);
                  setPhonepeVerified(false);
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-purple-500"
              >
                <option value="SANDBOX">UAT / Sandbox</option>
                <option value="PRODUCTION">Production (Live)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Razorpay Config Section */}
        <div className="space-y-4 p-6 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
              <Key className="w-4 h-4" /> Razorpay Company Credentials
            </h3>

            <div className="flex items-center gap-2">
              {razorpayVerified ? (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Verified
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Unverified
                </span>
              )}

              <button
                type="button"
                onClick={handleVerifyRazorpay}
                disabled={isVerifying}
                className="px-3 py-1.5 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 text-xs font-bold border border-indigo-500/40 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} /> Verify Razorpay
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Razorpay Key ID *</label>
              <input
                type="text"
                placeholder="rzp_live_xxxxxxxxxxxx"
                value={razorpayKeyId}
                onChange={(e) => {
                  setRazorpayKeyId(e.target.value);
                  setRazorpayVerified(false);
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-mono outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Razorpay Key Secret *</label>
              <input
                type="password"
                placeholder="••••••••••••••••••••••••"
                value={razorpayKeySecret}
                onChange={(e) => {
                  setRazorpayKeySecret(e.target.value);
                  setRazorpayVerified(false);
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-mono outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* PayU India Config Section */}
        <div className="space-y-4 p-6 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <Zap className="w-4 h-4" /> PayU India Company Credentials
            </h3>

            <div className="flex items-center gap-2">
              {payuVerified ? (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Verified
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Unverified
                </span>
              )}

              <button
                type="button"
                onClick={handleVerifyPayU}
                disabled={isVerifying}
                className="px-3 py-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-xs font-bold border border-emerald-500/40 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} /> Verify PayU
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">PayU Merchant Key *</label>
              <input
                type="text"
                placeholder="Merchant Key"
                value={payuMerchantKey}
                onChange={(e) => {
                  setPayuMerchantKey(e.target.value);
                  setPayuVerified(false);
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-mono outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">PayU Merchant Salt *</label>
              <input
                type="password"
                placeholder="Merchant Salt"
                value={payuMerchantSalt}
                onChange={(e) => {
                  setPayuMerchantSalt(e.target.value);
                  setPayuVerified(false);
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-mono outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">PayU Environment</label>
              <select
                value={payuEnv}
                onChange={(e) => {
                  setPayuEnv(e.target.value as any);
                  setPayuVerified(false);
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-emerald-500"
              >
                <option value="TEST">Test / Sandbox (test.payu.in)</option>
                <option value="LIVE">Live / Production (secure.payu.in)</option>
              </select>
            </div>
          </div>
        </div>

        {verifyMessage && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/30 text-xs font-mono text-purple-200">
            {verifyMessage}
          </div>
        )}

        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all"
        >
          Save DigiMoms Gateway Configuration
        </button>
      </form>

      {/* Subscription Payment Records (Separated from customer order payments) */}
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-400" /> Subscription Financial History ({subscriptionHistory.length})
        </h3>
        <p className="text-xs text-slate-400">
          Dedicated record of DigiMoms OS subscription renewals across all tenant restaurants.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] font-bold text-slate-400 uppercase bg-slate-950/60">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Restaurant ID</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Payment ID</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {subscriptionHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500 italic">
                    No subscription renewals recorded yet.
                  </td>
                </tr>
              ) : (
                subscriptionHistory.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/50 transition-all">
                    <td className="p-3 font-mono text-slate-400">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-3 font-mono text-purple-300">
                      {s.restaurant_id.substring(0, 8)}...
                    </td>
                    <td className="p-3 font-medium text-white">{s.plan_name || 'OS Subscription'}</td>
                    <td className="p-3 font-bold text-emerald-400">₹{s.amount}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-300">
                      {s.payment_id || s.razorpay_payment_id || 'N/A'}
                    </td>
                    <td className="p-3 uppercase text-[10px] font-bold">
                      <span className={`px-2 py-0.5 rounded-full border ${
                        s.payment_mode === 'live' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' : 'bg-blue-950 text-blue-300 border-blue-500/40'
                      }`}>
                        {s.payment_mode || 'demo'}
                      </span>
                    </td>
                    <td className="p-3 font-bold uppercase text-emerald-400">
                      {s.payment_status || 'PAID'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
