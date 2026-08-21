import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import {
  CreditCard, ShieldCheck, Zap, Key, Smartphone, CheckCircle2,
  AlertTriangle, RefreshCw, Percent, Receipt, Tag, Trash2, Plus,
  Ticket, Banknote, QrCode, Upload, Eye, Link as LinkIcon, Check, Copy
} from 'lucide-react';
import { verifyRestaurantGateway } from '../../lib/paymentAdapters';
import { CouponConfig } from '../../types';

export const PaymentSettings: React.FC = () => {
  const { currentOwner, updateOwnerProfile } = useSaaS();

  const [mode, setMode] = useState<'demo' | 'live'>(currentOwner?.payment_mode || 'demo');
  const [liveGateway, setLiveGateway] = useState<'razorpay' | 'phonepe' | 'payu'>(currentOwner?.live_gateway || 'payu');

  // Master Online Payment Toggle
  const [enableOnlinePayment, setEnableOnlinePayment] = useState<boolean>(currentOwner?.enable_online_payment ?? true);

  // Scan & Pay (UPI QR) Configuration
  const [enableUpiQr, setEnableUpiQr] = useState<boolean>(currentOwner?.enable_upi_qr ?? true);
  const [upiId, setUpiId] = useState<string>(currentOwner?.upi_id || '');
  const [upiName, setUpiName] = useState<string>(currentOwner?.upi_name || currentOwner?.name || '');
  const [upiQrImage, setUpiQrImage] = useState<string>(currentOwner?.upi_qr_image || '');
  const [customQrUrlInput, setCustomQrUrlInput] = useState<string>('');

  // Payment Gateway Configuration
  const [enableGatewayPayment, setEnableGatewayPayment] = useState<boolean>(currentOwner?.enable_gateway_payment ?? true);

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

  // Customer Payment Methods Allowed
  const [enableCashPayment, setEnableCashPayment] = useState<boolean>(currentOwner?.enable_cash_payment ?? true);
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
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Synchronize local states when currentOwner updates from server/database
  React.useEffect(() => {
    if (currentOwner) {
      setMode(currentOwner.payment_mode || 'demo');
      setLiveGateway(currentOwner.live_gateway || 'payu');
      setEnableOnlinePayment(currentOwner.enable_online_payment ?? true);
      setEnableUpiQr(currentOwner.enable_upi_qr ?? true);
      setUpiId(currentOwner.upi_id || '');
      setUpiName(currentOwner.upi_name || currentOwner.name || '');
      setUpiQrImage(currentOwner.upi_qr_image || '');
      setEnableGatewayPayment(currentOwner.enable_gateway_payment ?? true);
      setRazorpayKey(currentOwner.razorpay_key || '');
      setRazorpaySecret(currentOwner.razorpay_secret || '');
      setPhonepeMerchantId(currentOwner.phonepe_merchant_id || '');
      setPhonepeSaltKey(currentOwner.phonepe_salt_key || '');
      setPhonepeSaltIndex(currentOwner.phonepe_salt_index || '1');
      setPhonepeEnv(currentOwner.phonepe_env || 'SANDBOX');
      setPayuMerchantKey(currentOwner.payu_merchant_key || '');
      setPayuMerchantSalt(currentOwner.payu_merchant_salt || '');
      setPayuEnv(currentOwner.payu_env || 'TEST');
      setEnableCashPayment(currentOwner.enable_cash_payment ?? true);
      setEnableSplitPayment(currentOwner.enable_split_payment ?? true);
      setEnableGst(currentOwner.enable_gst ?? true);
      setGstPercentage(String(currentOwner.gst_percentage ?? 5));
      setEnablePackaging(currentOwner.enable_packaging_charge ?? false);
      setPackagingAmount(String(currentOwner.packaging_charge_amount ?? 10));
      setEnableServiceCharge(currentOwner.enable_service_charge ?? false);
      setServiceChargePercentage(String(currentOwner.service_charge_percentage ?? 2.5));
      setEnableOnlineDiscount(currentOwner.enable_online_discount ?? true);
      setOnlineDiscountPercentage(String(currentOwner.online_discount_percentage ?? 5));
      setVerified(currentOwner.gateway_verified || false);
      setVerificationMessage(currentOwner.gateway_status_message || '');
      if (currentOwner.coupons && currentOwner.coupons.length > 0) {
        setCoupons(currentOwner.coupons);
      }
    }
  }, [currentOwner]);

  if (!currentOwner) return null;

  // Auto-generated QR code preview URL
  const generatedUpiString = upiId.trim()
    ? `upi://pay?pa=${encodeURIComponent(upiId.trim())}&pn=${encodeURIComponent(upiName.trim() || currentOwner.name)}&cu=INR`
    : '';

  const activeQrPreviewUrl = upiQrImage || (generatedUpiString
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generatedUpiString)}`
    : '');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Please choose an image under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUpiQrImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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

    let isGatewayVerified = verified;
    if (mode === 'live' && enableGatewayPayment) {
      // If not marked verified yet, auto-verify with current credentials
      if (!isGatewayVerified) {
        setIsVerifying(true);
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
        if (res.success) {
          isGatewayVerified = true;
          setVerified(true);
          setVerificationMessage(res.message);
        } else {
          alert(`⚠️ Verification Failed for ${liveGateway.toUpperCase()}:\n${res.message}\n\nPlease check your credentials.`);
          return;
        }
      }
    }

    try {
      await updateOwnerProfile({
        payment_mode: mode,
        live_gateway: liveGateway,
        enable_online_payment: enableOnlinePayment,
        enable_upi_qr: enableUpiQr,
        upi_id: upiId.trim(),
        upi_name: upiName.trim(),
        upi_qr_image: upiQrImage,
        enable_gateway_payment: enableGatewayPayment,
        razorpay_key: razorpayKey,
        razorpay_secret: razorpaySecret,
        phonepe_merchant_id: phonepeMerchantId,
        phonepe_salt_key: phonepeSaltKey,
        phonepe_salt_index: phonepeSaltIndex,
        phonepe_env: phonepeEnv,
        payu_merchant_key: payuMerchantKey,
        payu_merchant_salt: payuMerchantSalt,
        payu_env: payuEnv,
        gateway_verified: isGatewayVerified,
        gateway_status_message: verificationMessage,
        enable_cash_payment: enableCashPayment,
        enable_split_payment: enableSplitPayment,
        enable_gst: enableGst,
        gst_percentage: Number(gstPercentage) || 0,
        enable_packaging_charge: enablePackaging,
        packaging_charge_amount: Number(packagingAmount) || 0,
        enable_service_charge: enableServiceCharge,
        service_charge_percentage: Number(serviceChargePercentage) || 0,
        enable_online_discount: enableOnlineDiscount,
        online_discount_percentage: Number(onlineDiscountPercentage) || 0,
        enable_coupons: enableCoupons,
        coupons: coupons
      });
      alert('✅ Restaurant Payment & Tax settings saved successfully!');
    } catch (err: any) {
      console.error("Save payment settings error:", err);
      alert(`❌ Failed to save payment settings: ${err?.message || String(err)}`);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Restaurant Payment Configuration</h2>
        <p className="text-xs text-slate-400">
          Configure direct UPI Scan & Pay, Online Payment Gateways, and Customer Checkout rules for <strong className="text-white">{currentOwner.name}</strong>.
        </p>
      </div>

      <form onSubmit={handleSave} className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-8 shadow-2xl">
        
        {/* 1. MASTER ONLINE PAYMENT TOGGLE */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Zap className="w-5 h-5 text-blue-400" />
              <span>Online Payments Master Switch</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                enableOnlinePayment ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
              }`}>
                {enableOnlinePayment ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              When turned ON, guests can pay digitally via UPI Scan & Pay or Payment Gateway. When turned OFF, checkout defaults exclusively to Cash.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enableOnlinePayment}
              onChange={(e) => setEnableOnlinePayment(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-14 h-8 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* 2. SCAN & PAY (UPI QR CODE) SECTION */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Direct UPI Scan & Pay (No Gateway Fees)
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-extrabold uppercase">
                    Zero Commission
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Customers scan your restaurant's UPI QR code to pay directly to your bank account. Staff verifies upon confirmation.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableUpiQr}
                onChange={(e) => setEnableUpiQr(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {enableUpiQr && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Restaurant UPI ID (VPA) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. restaurantname@upi or 9876543210@okaxis"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-purple-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Customer UPI apps (GPay, PhonePe, Paytm, BHIM) will send money directly to this ID.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Payee / Restaurant Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Royal Spice Family Restaurant"
                    value={upiName}
                    onChange={(e) => setUpiName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Custom UPI QR Code Image (Optional)
                  </label>
                  
                  <div className="space-y-2">
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-800 hover:border-purple-500/50 rounded-xl cursor-pointer bg-slate-900/50 transition-all">
                      <Upload className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-xs text-slate-300 font-semibold">Upload QR Image File</span>
                      <span className="text-[10px] text-slate-500">PNG, JPG, WebP up to 2MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Or paste QR Code Image URL"
                        value={customQrUrlInput}
                        onChange={(e) => setCustomQrUrlInput(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customQrUrlInput.trim()) {
                            setUpiQrImage(customQrUrlInput.trim());
                            setCustomQrUrlInput('');
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                      >
                        Set URL
                      </button>
                    </div>

                    {upiQrImage && (
                      <button
                        type="button"
                        onClick={() => setUpiQrImage('')}
                        className="text-[11px] text-rose-400 hover:underline font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Custom QR (Use Auto-Generated UPI QR)
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Live UPI QR Preview Box */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <Eye className="w-4 h-4 text-purple-400" /> Customer Scan & Pay Preview
                </div>

                {activeQrPreviewUrl ? (
                  <div className="p-3 bg-white rounded-2xl shadow-lg border border-slate-700">
                    <img
                      src={activeQrPreviewUrl}
                      alt="UPI QR Code Preview"
                      className="w-44 h-44 object-contain mx-auto rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="w-44 h-44 rounded-2xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center p-4 text-slate-500">
                    <QrCode className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-[11px]">Enter UPI ID on the left to generate QR Code</span>
                  </div>
                )}

                <div className="space-y-0.5 text-xs">
                  <div className="font-bold text-white">{upiName || currentOwner.name}</div>
                  <div className="text-purple-400 font-mono font-semibold text-[11px] flex items-center justify-center gap-1">
                    {upiId || 'upi_id_not_set@bank'}
                    {upiId && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(upiId);
                          setCopiedUpi(true);
                          setTimeout(() => setCopiedUpi(false), 2000);
                        }}
                        className="text-slate-400 hover:text-white"
                        title="Copy UPI ID"
                      >
                        {copiedUpi ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/20 text-[10px] text-purple-300 leading-snug">
                  🛡️ <strong>Manual Staff Verification Flow:</strong> When a customer scans & taps "Payment Completed", the order is marked <em>"Verification Pending"</em> until confirmed by floor waiter or cash counter staff.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. PAYMENT GATEWAYS CONFIGURATION */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Automated Payment Gateway (Razorpay / PhonePe / PayU)
                </h3>
                <p className="text-xs text-slate-400">
                  Instant automated order confirmation via Cards, NetBanking, and Gateway UPI.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableGatewayPayment}
                onChange={(e) => setEnableGatewayPayment(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {enableGatewayPayment && (
            <div className="space-y-6 pt-2">
              {/* Operating Mode Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Gateway Operating Mode
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    onClick={() => setMode('demo')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-1.5 ${
                      mode === 'demo'
                        ? 'border-blue-500 bg-blue-950/30 text-white shadow-lg shadow-blue-500/10'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-blue-400 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-400" /> Demo Payment Mode (Testing)
                      </div>
                      {mode === 'demo' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Simulates instant successful online payments. Ideal for testing and staff training without live API keys.
                    </p>
                  </div>

                  <div
                    onClick={() => {
                      setMode('live');
                    }}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-1.5 ${
                      mode === 'live'
                        ? 'border-emerald-500 bg-emerald-950/30 text-white shadow-lg shadow-emerald-500/10'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-emerald-400 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" /> Live Production Gateway
                      </div>
                      {mode === 'live' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Collects real payments into your bank account. Requires verified merchant credentials below.
                    </p>
                  </div>
                </div>
              </div>

              {/* Gateway Provider Selection Tabs */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Select Gateway Provider
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setLiveGateway('razorpay');
                      setVerified(false);
                    }}
                    className={`p-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                      liveGateway === 'razorpay'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <Key className="w-4 h-4" /> Razorpay
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLiveGateway('phonepe');
                      setVerified(false);
                    }}
                    className={`p-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                      liveGateway === 'phonepe'
                        ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" /> PhonePe
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLiveGateway('payu');
                      setVerified(false);
                    }}
                    className={`p-3 rounded-xl border font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                      liveGateway === 'payu'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <Zap className="w-4 h-4" /> PayU
                  </button>
                </div>
              </div>

              {/* Gateway Credentials Inputs */}
              {liveGateway === 'razorpay' ? (
                <div className="space-y-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <h4 className="text-xs font-bold uppercase text-blue-400 flex items-center gap-2">
                    <Key className="w-4 h-4" /> Razorpay API Credentials
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Razorpay Key ID *</label>
                      <input
                        type="text"
                        placeholder="rzp_live_xxxxxxxxxxxxxx"
                        value={razorpayKey}
                        onChange={(e) => {
                          setRazorpayKey(e.target.value);
                          setVerified(false);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Razorpay Key Secret *</label>
                      <input
                        type="password"
                        placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                        value={razorpaySecret}
                        onChange={(e) => {
                          setRazorpaySecret(e.target.value);
                          setVerified(false);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ) : liveGateway === 'phonepe' ? (
                <div className="space-y-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <h4 className="text-xs font-bold uppercase text-purple-400 flex items-center gap-2">
                    <Smartphone className="w-4 h-4" /> PhonePe API Credentials
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Merchant ID (MID) *</label>
                      <input
                        type="text"
                        placeholder="PGMERCXXXXXXXX"
                        value={phonepeMerchantId}
                        onChange={(e) => {
                          setPhonepeMerchantId(e.target.value);
                          setVerified(false);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Salt Key *</label>
                      <input
                        type="password"
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        value={phonepeSaltKey}
                        onChange={(e) => {
                          setPhonepeSaltKey(e.target.value);
                          setVerified(false);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-purple-500"
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
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Environment</label>
                      <select
                        value={phonepeEnv}
                        onChange={(e) => {
                          setPhonepeEnv(e.target.value as any);
                          setVerified(false);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                      >
                        <option value="SANDBOX">UAT / Sandbox (Testing)</option>
                        <option value="PRODUCTION">Production (Live)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <h4 className="text-xs font-bold uppercase text-emerald-400 flex items-center gap-2">
                    <Zap className="w-4 h-4" /> PayU API Credentials
                  </h4>
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
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-emerald-500"
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
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">PayU Environment</label>
                      <select
                        value={payuEnv}
                        onChange={(e) => {
                          setPayuEnv(e.target.value as any);
                          setVerified(false);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                      >
                        <option value="TEST">Test / Sandbox (test.payu.in)</option>
                        <option value="LIVE">Live / Production (secure.payu.in)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Gateway Verification Action */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
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
          )}
        </div>

        {/* 4. CUSTOMER CHECKOUT OPTIONS TOGGLES */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <CreditCard className="w-5 h-5" /> Allowed Customer Payment Options at Checkout
          </div>
          <p className="text-xs text-slate-400">
            Control which payment modes customers can choose during checkout on their mobile devices.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Cash Payment Option */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-400" /> Cash at Table / Counter
                </span>
                <input
                  type="checkbox"
                  checked={enableCashPayment}
                  onChange={(e) => setEnableCashPayment(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Allow customers to pay cash directly to waiter or at counter.
              </p>
            </div>

            {/* Direct Scan & Pay */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-purple-400" /> Scan & Pay (UPI QR)
                </span>
                <input
                  type="checkbox"
                  checked={enableUpiQr && enableOnlinePayment}
                  onChange={(e) => {
                    setEnableUpiQr(e.target.checked);
                    if (e.target.checked && !enableOnlinePayment) setEnableOnlinePayment(true);
                  }}
                  className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Show restaurant UPI QR for direct zero-fee payments with staff verification.
              </p>
            </div>

            {/* Split / Partial Payment Option */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Percent className="w-4 h-4 text-blue-400" /> Split / Partial Pay
                </span>
                <input
                  type="checkbox"
                  checked={enableSplitPayment}
                  onChange={(e) => setEnableSplitPayment(e.target.checked)}
                  className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Allow customers to deposit part amount online and balance in cash.
              </p>
            </div>
          </div>
        </div>

        {/* 5. TAX & EXTRA CHARGES */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Receipt className="w-5 h-5" /> Tax & Extra Charges Settings
          </div>
          <p className="text-xs text-slate-400">
            Set custom GST percentage, packaging fee, or service charges. Applied automatically on checkout and bills.
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

        {/* 6. ONLINE PAYMENT DISCOUNT */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Percent className="w-5 h-5" /> Online Payment Instant Discount
            </div>
            <input
              type="checkbox"
              checked={enableOnlineDiscount}
              onChange={(e) => setEnableOnlineDiscount(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </div>
          <p className="text-xs text-slate-400">
            Incentivize customers to pay online / UPI by offering an instant percentage discount at checkout.
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

        {/* 7. COUPON & PROMO CODES */}
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

        {/* 8. SAVE BUTTON */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <p className="text-[11px] text-slate-400">
            🔒 Configuration is saved securely for restaurant <span className="text-slate-200 font-mono">{currentOwner.name}</span>.
          </p>

          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Save Payment Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
