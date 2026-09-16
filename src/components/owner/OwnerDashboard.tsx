import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { SmartImage } from '../common/SmartImage';
import {
  Building2, Utensils, QrCode, Users, CreditCard, BarChart3,
  Star, Settings, LogOut, CheckCircle2, Clock, PhoneCall, ShoppingBag, Bell, AlertTriangle, ShieldCheck, Sparkles,
  FileText, Printer, Download, Globe, Banknote, Lock, History, AlertCircle, RefreshCw,
  KeyRound, Eye, EyeOff, MessageCircle, Phone, Mail, Info, Calendar, Gift
} from 'lucide-react';
import { MenuManagement } from './MenuManagement';
import { TableManagement } from './TableManagement';
import { StaffManagement } from './StaffManagement';
import { PaymentSettings } from './PaymentSettings';
import { ReportsAnalytics } from './ReportsAnalytics';
import { FeedbackViewer } from './FeedbackViewer';
import { SettingsManagement } from './SettingsManagement';
import { RestaurantWebsiteManager } from './RestaurantWebsiteManager';
import { BillModal } from '../common/BillModal';
import { OfflinePaymentModal } from '../common/OfflinePaymentModal';
import { AiHelpAssistant } from '../common/AiHelpAssistant';
import { RealtimeStatusBadge } from '../common/RealtimeStatusBadge';
import { PayUCheckoutModal } from '../common/PayUCheckoutModal';
import { PhonePeCheckoutModal } from '../common/PhonePeCheckoutModal';
import { RazorpayCheckoutModal } from '../common/RazorpayCheckoutModal';
import { generateInvoicePdf, generateSubscriptionInvoicePdf } from '../../utils/pdfGenerator';
import { getRestaurantSubscriptionDetails } from '../../utils/subscriptionUtils';
import { Order } from '../../types';

export const OwnerDashboard: React.FC = () => {
  const {
    currentOwner,
    logoutOwner,
    orders,
    tables,
    callRequests,
    acceptCallRequest,
    completeCallRequest,
    verifyCashOrder,
    verifyUpiPayment,
    rejectUpiPayment,
    acceptOrder,
    startCookingOrder,
    markOrderReady,
    serveOrder,
    completeOrder,
    staffList,
    currentStaff,
    setActiveView,
    ceoRazorpayConfig,
    ceoPaymentConfig,
    renewRestaurantMonthly,
    subscriptionHistory,
    updateOwnerPassword,
    showToast
  } = useSaaS();

  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'tables' | 'staff' | 'payments' | 'reports' | 'feedback' | 'settings' | 'public-website'>('overview');
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [showPayUSubscriptionModal, setShowPayUSubscriptionModal] = useState(false);
  const [showPhonePeSubscriptionModal, setShowPhonePeSubscriptionModal] = useState(false);
  const [showRazorpaySubscriptionModal, setShowRazorpaySubscriptionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyFilterTab, setHistoryFilterTab] = useState<'all' | 'paid' | 'free'>('all');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showAdminContactModal, setShowAdminContactModal] = useState(false);
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedBillOrder, setSelectedBillOrder] = useState<Order | null>(null);
  const [selectedOfflineOrder, setSelectedOfflineOrder] = useState<Order | null>(null);

  if (!currentOwner) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-white">Please log in as a Restaurant Owner first.</h2>
        <button
          onClick={() => setActiveView('owner-login')}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm"
        >
          Go to Owner Login
        </button>
      </div>
    );
  }

  const restOrders = orders.filter(o => o.restaurant_id === currentOwner.id);
  const restTables = tables.filter(t => t.restaurant_id === currentOwner.id);
  const restCalls = callRequests.filter(c => c.restaurant_id === currentOwner.id && c.status === 'pending');

  // Helper to accurately get effective cash due
  const getEffectiveCashDue = (o: Order): number => {
    const isPaid = ['paid_live', 'paid', 'paid_demo', 'paid_cash', 'paid_online'].includes(o.payment_status);
    if (isPaid) return 0;
    if (o.payment_mode === 'online' || o.payment_mode === 'demo') return 0;
    if (o.cash_due !== undefined && o.cash_due !== null && Number(o.cash_due) >= 0) {
      return Number(o.cash_due);
    }
    return Math.max(0, Number(o.grand_total || 0) - Number(o.online_amount || 0) - Number(o.cash_amount || 0));
  };

  // Filter confirmed & active orders (excluding cancelled and unverified online checkout attempts)
  const confirmedRestOrders = restOrders.filter(o => {
    if (o.order_status === 'cancelled') return false;
    // Online order must NOT appear in Owner Live Orders before successful gateway + server-side payment verification
    if (o.payment_mode === 'online' && !['paid_live', 'paid', 'paid_demo', 'paid_online'].includes(o.payment_status)) {
      return false;
    }
    // Partial order must have its online advance verified before appearing in live orders
    if (o.payment_mode === 'partial' && !['paid_live', 'paid', 'paid_demo', 'paid_online', 'partially_paid'].includes(o.payment_status) && (o.online_amount || 0) <= 0) {
      return false;
    }
    return true;
  });

  // Total Realized Revenue: Increases ONLY when customer pays online (auto) or cash is confirmed by staff/owner
  const todaySales = restOrders.reduce((sum, o) => {
    if (o.order_status === 'cancelled') return sum;
    if (o.payment_mode === 'online' && ['paid_live', 'paid', 'paid_demo', 'paid_online'].includes(o.payment_status)) {
      return sum + Number(o.online_amount || o.grand_total);
    }
    if (o.payment_mode === 'demo') {
      return sum + Number(o.online_amount || o.grand_total);
    }
    if (o.payment_mode === 'partial') {
      let paidAmt = 0;
      if (['paid_live', 'paid', 'paid_demo', 'paid_online', 'partially_paid'].includes(o.payment_status) || (o.online_amount || 0) > 0) {
        paidAmt += Number(o.online_amount || 0);
      }
      if (['paid', 'paid_cash'].includes(o.payment_status)) {
        paidAmt += Number(o.cash_amount || (o.grand_total - (o.online_amount || 0)));
      } else if ((o.cash_amount || 0) > 0) {
        paidAmt += Number(o.cash_amount || 0);
      }
      return sum + Math.min(o.grand_total, paidAmt);
    }
    if (o.payment_mode === 'upi_qr' && ['paid_live', 'paid', 'paid_demo', 'paid_online'].includes(o.payment_status)) {
      return sum + Number(o.online_amount || o.grand_total);
    }
    // Cash payment
    if (['paid', 'paid_cash', 'paid_live', 'paid_demo'].includes(o.payment_status)) {
      return sum + Number(o.cash_amount || o.grand_total);
    }
    return sum + Number(o.cash_amount || 0);
  }, 0);

  const pendingOrders = confirmedRestOrders.filter(o => {
    if (['paid', 'paid_live', 'paid_cash', 'paid_demo', 'paid_online'].includes(o.payment_status)) return false;
    return getEffectiveCashDue(o) > 0 || o.payment_status === 'payment_verification_pending';
  });
  const cookingOrders = confirmedRestOrders.filter(o => o.order_status === 'cooking' || o.order_status === 'accepted');
  const occupiedTables = restTables.filter(t => t.status === 'occupied').length;

  const subDetails = getRestaurantSubscriptionDetails(currentOwner);
  const {
    subEndDate,
    formattedEndDate,
    isTrialActive,
    isFreeActive,
    isSubActive,
    isSuspended,
    isExpired,
    diffDays,
    daysAgo,
    expiryBadgeText,
    expiryDescriptionText,
    isExpiringSoon,
    monthlyFee
  } = subDetails;
  const daysLeft = diffDays;

  const handleProcessPhonePeRenewal = async () => {
    setIsProcessingPayment(true);

    try {
      // 1. Create PhonePe payment request via backend API
      const createRes = await fetch('/api/phonepe/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: monthlyFee,
          restaurant_id: currentOwner.id,
          restaurant_name: currentOwner.name,
          mobile: currentOwner.owner_mobile,
          merchant_id: ceoPaymentConfig?.phonepe_merchant_id,
          salt_key: ceoPaymentConfig?.phonepe_salt_key,
          salt_index: ceoPaymentConfig?.phonepe_salt_index,
          env: ceoPaymentConfig?.phonepe_env || 'SANDBOX'
        })
      });

      const createData = await createRes.json();

      if (!createRes.ok || !createData.success) {
        showToast(`PhonePe Payment Error: ${createData.error || 'Failed to initiate payment'}`, 'error');
        setIsProcessingPayment(false);
        return;
      }

      if (createData.payUrl) {
        window.location.href = createData.payUrl;
        return;
      }

      // 2. Server-side PhonePe status verification
      const verifyRes = await fetch('/api/phonepe/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: createData.merchantId,
          merchant_transaction_id: createData.merchantTransactionId,
          salt_key: ceoPaymentConfig?.phonepe_salt_key,
          salt_index: ceoPaymentConfig?.phonepe_salt_index,
          env: ceoPaymentConfig?.phonepe_env || 'SANDBOX',
          mode: createData.mode || ceoPaymentConfig?.mode || 'demo'
        })
      });

      const verifyData = await verifyRes.json();

      if (verifyRes.ok && verifyData.verified) {
        // 3. Extend subscription by 1 calendar month in Supabase and record transaction
        await renewRestaurantMonthly(currentOwner.id, 1, {
          transactionId: createData.merchantTransactionId,
          mode: createData.mode || ceoPaymentConfig?.mode || 'demo'
        });
        setIsProcessingPayment(false);
        setShowRenewalModal(false);
      } else {
        showToast(`Verification Failed: ${verifyData.message || 'Payment could not be verified server-side.'}`, 'error');
        setIsProcessingPayment(false);
      }
    } catch (err: any) {
      console.error('PhonePe renewal error:', err);
      showToast(`Renewal Payment Error: ${err.message || 'Server connection error during payment verification'}`, 'error');
      setIsProcessingPayment(false);
    }
  };

  const handleProcessPayURenewal = async () => {
    setIsProcessingPayment(true);

    try {
      // 1. Create PayU payment request via backend API
      const createRes = await fetch('/api/payu/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: monthlyFee,
          restaurant_id: currentOwner.id,
          restaurant_name: currentOwner.name,
          mobile: currentOwner.owner_mobile,
          merchant_key: ceoPaymentConfig?.payu_merchant_key,
          merchant_salt: ceoPaymentConfig?.payu_merchant_salt,
          env: ceoPaymentConfig?.payu_env || 'TEST'
        })
      });

      const createData = await createRes.json();

      if (!createRes.ok || !createData.success) {
        showToast(`PayU Payment Error: ${createData.error || 'Failed to initiate PayU payment'}`, 'error');
        setIsProcessingPayment(false);
        return;
      }

      // 2. Server-side PayU status verification
      const verifyRes = await fetch('/api/payu/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_key: ceoPaymentConfig?.payu_merchant_key || createData.merchantKey,
          txnid: createData.txnid,
          amount: monthlyFee,
          productinfo: createData.params?.productinfo || `DigiMoms OS Subscription (${currentOwner.name})`,
          firstname: createData.params?.firstname || currentOwner.name.substring(0, 15),
          email: createData.params?.email || 'owner@restaurant.local',
          status: 'success',
          hash: createData.hash,
          merchant_salt: ceoPaymentConfig?.payu_merchant_salt,
          env: ceoPaymentConfig?.payu_env || 'TEST',
          mode: createData.mode || ceoPaymentConfig?.mode || 'demo'
        })
      });

      const verifyData = await verifyRes.json();

      if (verifyRes.ok && verifyData.verified) {
        // 3. Extend subscription by 1 calendar month in Supabase and record transaction
        await renewRestaurantMonthly(currentOwner.id, 1, {
          transactionId: createData.txnid,
          mode: createData.mode || ceoPaymentConfig?.mode || 'demo'
        });
        setIsProcessingPayment(false);
        setShowRenewalModal(false);
        showToast('🎉 Subscription successfully extended by 1 month via PayU!', 'success');
      } else {
        showToast(`Verification Failed: ${verifyData.message || 'Payment could not be verified server-side.'}`, 'error');
        setIsProcessingPayment(false);
      }
    } catch (err: any) {
      console.error('PayU renewal error:', err);
      showToast(`Renewal Payment Error: ${err.message || 'Server connection error during payment verification'}`, 'error');
      setIsProcessingPayment(false);
    }
  };

  const handleProcessRazorpayRenewal = async () => {
    setIsProcessingPayment(true);
    try {
      const createRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: monthlyFee,
          restaurant_id: currentOwner.id,
          order_id: `sub_${Date.now()}`,
          razorpay_key: ceoPaymentConfig?.razorpay_key_id,
          razorpay_secret: ceoPaymentConfig?.razorpay_key_secret
        })
      });
      const orderData = await createRes.json();
      if (!createRes.ok || !orderData.id) {
        showToast('Failed to initialize Razorpay payment', 'error');
        setIsProcessingPayment(false);
        return;
      }

      if ((window as any).Razorpay && ceoPaymentConfig?.mode === 'live' && ceoPaymentConfig?.razorpay_key_id) {
        const options = {
          key: ceoPaymentConfig.razorpay_key_id,
          amount: orderData.amount,
          currency: 'INR',
          name: 'DigiMoms Smart Restaurant OS',
          description: `Subscription Renewal (1 Month) - ${currentOwner.name}`,
          order_id: orderData.id,
          prefill: {
            name: currentOwner.owner_name,
            contact: currentOwner.owner_mobile,
            email: currentOwner.owner_email || 'owner@restaurant.local'
          },
          theme: { color: '#10b981' },
          handler: async (response: any) => {
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                razorpay_secret: ceoPaymentConfig?.razorpay_key_secret
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.verified) {
              await renewRestaurantMonthly(currentOwner.id, 1, {
                transactionId: response.razorpay_payment_id,
                mode: 'live',
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });
              setShowRenewalModal(false);
              showToast('🎉 DigiMoms OS subscription successfully extended by 1 month via Razorpay!', 'success');
            } else {
              showToast('Razorpay payment verification failed', 'error');
            }
            setIsProcessingPayment(false);
          },
          modal: {
            ondismiss: () => {
              setIsProcessingPayment(false);
            }
          }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Simulated / Demo mode renewal
        await renewRestaurantMonthly(currentOwner.id, 1, {
          transactionId: `rzp_demo_${Date.now()}`,
          mode: 'demo'
        });
        setIsProcessingPayment(false);
        setShowRenewalModal(false);
        showToast('🎉 DigiMoms OS subscription extended by 1 month (Demo Mode)!', 'success');
      }
    } catch (err: any) {
      console.error('Razorpay renewal error:', err);
      showToast(`Razorpay Renewal Error: ${err.message || 'Payment failed'}`, 'error');
      setIsProcessingPayment(false);
    }
  };

  const handleRenewalClick = () => {
    setShowRenewalModal(false);
    if (ceoPaymentConfig?.primary_gateway === 'payu') {
      setShowPayUSubscriptionModal(true);
    } else if (ceoPaymentConfig?.primary_gateway === 'razorpay') {
      setShowRazorpaySubscriptionModal(true);
    } else {
      setShowPhonePeSubscriptionModal(true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-4">
          <SmartImage
            src={currentOwner.logo}
            alt={currentOwner.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-xl shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white">{currentOwner.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                isTrialActive ? 'bg-amber-950 text-amber-400 border-amber-500/30' :
                isFreeActive ? 'bg-teal-950 text-teal-400 border-teal-500/30' :
                isSubActive ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' :
                'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isTrialActive ? 'Trial Active' : isFreeActive ? 'Free Offer Active' : isSubActive ? 'Paid Active' : 'Inactive / Expired'}
              </span>
            </div>
            <p className="text-xs text-slate-400">Owner Portal • Registered to {currentOwner.owner_name} ({currentOwner.owner_mobile})</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <RealtimeStatusBadge />

          <button
            onClick={() => setShowHistoryModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 font-bold text-xs border border-purple-500/40 transition-all flex items-center gap-1.5 shadow-sm"
            title="View Renewal & Free History"
          >
            <History className="w-3.5 h-3.5 text-purple-400" /> Renewal & Free History
          </button>

          <button
            onClick={() => {
              setPasswordError('');
              setOldPasswordInput('');
              setNewPasswordInput('');
              setConfirmPasswordInput('');
              setShowChangePasswordModal(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/30 transition-all flex items-center gap-1.5 shadow-sm"
            title="Change Owner Password"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" /> Change Password
          </button>

          <button
            onClick={() => setShowRenewalModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" /> Renew Subscription (₹{monthlyFee}/mo)
          </button>

          <button
            onClick={logoutOwner}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-xs border border-slate-700 transition-all flex items-center gap-2 self-start md:self-auto"
          >
            <LogOut className="w-4 h-4" /> Logout Owner
          </button>
        </div>
      </div>

      {/* If Expired, Lock All Features */}
      {isExpired ? (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/95 border-2 border-rose-500/40 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 blur-3xl rounded-full pointer-events-none" />
            <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto shadow-xl">
                <Lock className="w-8 h-8 animate-pulse" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-500/40 text-xs font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  {expiryBadgeText}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Subscription Plan Expired — All Features Locked
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                  {expiryDescriptionText}
                </p>
              </div>

              {/* Plan & Expiry Summary */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-around gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Plan Status</span>
                  <span className="font-bold text-rose-400 uppercase">Inactive / Expired</span>
                </div>
                <div className="w-px h-8 bg-slate-800 hidden sm:block" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Expired Date</span>
                  <span className="font-mono text-slate-200 font-bold">{formattedEndDate}</span>
                </div>
                <div className="w-px h-8 bg-slate-800 hidden sm:block" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Reactivation Fee</span>
                  <span className="font-extrabold text-emerald-400 text-sm">₹{monthlyFee} / Month</span>
                </div>
              </div>

              {/* Feature Lock Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                    <QrCode className="w-4 h-4" /> Digital QR Menu & Ordering
                  </div>
                  <p className="text-[11px] text-slate-400">Customer table QR links are currently showing an inactive notice.</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                    <Utensils className="w-4 h-4" /> Menu & Category Management
                  </div>
                  <p className="text-[11px] text-slate-400">Adding, editing, or modifying dishes and prices is locked.</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                    <Users className="w-4 h-4" /> Kitchen & Waiter Terminals
                  </div>
                  <p className="text-[11px] text-slate-400">Staff logins and live order terminals are blocked until renewal.</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                    <CreditCard className="w-4 h-4" /> POS Billing & Reports
                  </div>
                  <p className="text-[11px] text-slate-400">Offline billing and financial exports are paused.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setShowRenewalModal(true)}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
                >
                  <CreditCard className="w-5 h-5" /> Pay ₹{monthlyFee} & Reactivate All Features
                </button>

                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 transition-all"
                >
                  <History className="w-4 h-4" /> Subscription Invoices
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Subscription Expiry Alert Banner (triggers when 7 days or less remaining and NOT expired) */}
          {isExpiringSoon && (
            <div className="p-5 rounded-3xl bg-amber-950/60 border-2 border-amber-500/40 text-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl backdrop-blur-md animate-pulse">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    ⚠️ Subscription Expiry Warning!
                    <span className="text-xs bg-amber-500/20 px-2.5 py-0.5 rounded-full text-amber-300 border border-amber-500/30 font-mono">
                      {diffDays === 0 ? 'Expires Today' : `${diffDays} Days Remaining`}
                    </span>
                  </h3>
                  <p className="text-xs text-amber-200/80 mt-1">
                    Your monthly plan ends on <strong>{formattedEndDate}</strong>.
                    Pay <strong>₹{monthlyFee}</strong> online to keep your digital menu & QR ordering active without interruption.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRenewalModal(true)}
                className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-xl shadow-amber-500/20 transition-all shrink-0 flex items-center gap-2"
              >
                💳 Pay ₹{monthlyFee} & Extend 1 Month
              </button>
            </div>
          )}

          {/* Tabs Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 custom-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'overview' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" /> Live Overview
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'menu' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Utensils className="w-4 h-4" /> Menu & Categories
        </button>

        <button
          onClick={() => setActiveTab('tables')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'tables' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4" /> Tables & QRs
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'staff' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" /> Staff Credentials
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'payments' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Payment Settings
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'reports' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Sales & Reports
        </button>

        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'feedback' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Star className="w-4 h-4" /> Guest Feedback
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'settings' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" /> Settings
        </button>

        <button
          onClick={() => setActiveTab('public-website')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'public-website' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4 text-blue-400" /> Public Website
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Operating Mode Banner */}
          {(() => {
            const activeStaff = staffList.filter(s => s.restaurant_id === currentOwner.id && s.status === 'active');
            const kitchenCount = activeStaff.filter(s => s.role === 'kitchen').length;
            const waiterCount = activeStaff.filter(s => s.role === 'waiter').length;

            return (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Owner Master Operational Control Mode</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">
                    Kitchen Accounts: <strong className="text-amber-400">{kitchenCount}</strong>
                  </span>
                  <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">
                    Waiter Accounts: <strong className="text-blue-400">{waiterCount}</strong>
                  </span>
                </div>
              </div>
            );
          })()}

          {/* SaaS Subscription Overview & Expiry Details Card */}
          {(() => {
            const ownerSubHist = subscriptionHistory.filter(s => s.restaurant_id === currentOwner.id);
            const lastPayment = ownerSubHist[0];
            const startDateFormatted = currentOwner.subscription_start
              ? new Date(currentOwner.subscription_start).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
              : new Date(currentOwner.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
            
            const endDateFormatted = subEndDate
              ? new Date(subEndDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
              : 'N/A';

            return (
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                        SaaS Subscription Overview
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                          currentOwner.status === 'active' ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' :
                          currentOwner.status === 'trial' ? 'bg-amber-950 text-amber-400 border-amber-500/30' :
                          'bg-rose-950 text-rose-400 border-rose-500/30'
                        }`}>
                          {currentOwner.status === 'active' ? 'Active' : currentOwner.status === 'trial' ? 'Free Trial' : currentOwner.status}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">Current Monthly Plan & Official Expiry Record</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowRenewalModal(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/20 flex items-center gap-1.5 transition-all"
                  >
                    💳 Pay ₹{monthlyFee} & Renew (+1 Month)
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-medium">Monthly Plan Price</div>
                    <div className="text-lg font-extrabold text-emerald-400 mt-0.5">₹{monthlyFee} / mo</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-medium">Subscription Start Date</div>
                    <div className="text-sm font-bold font-mono text-white mt-1">{startDateFormatted}</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-medium">Subscription Expiry Date</div>
                    <div className="text-sm font-bold font-mono text-amber-400 mt-1">{endDateFormatted}</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-medium">Days Remaining</div>
                    <div className="text-lg font-extrabold text-white mt-0.5">
                      {daysLeft <= 0 ? <span className="text-rose-400">0 Days (Expired)</span> : `${daysLeft} Days`}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-medium">Next Renewal Amount</div>
                    <div className="text-sm font-bold text-emerald-400 mt-1">₹{monthlyFee}</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-medium">Last Payment Amount</div>
                    <div className="text-sm font-bold text-white mt-1">
                      {lastPayment ? `₹${lastPayment.amount}` : `₹${monthlyFee}`}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-medium">Last Payment Date</div>
                    <div className="text-sm font-bold font-mono text-slate-300 mt-1">
                      {lastPayment ? new Date(lastPayment.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Initial Registration'}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-[11px] text-slate-400 font-medium">Payment Status</div>
                    <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      {lastPayment ? (lastPayment.payment_status?.toUpperCase() || 'PAID') : 'VERIFIED'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-xs font-semibold text-slate-400">Total Revenue</div>
              <div className="text-2xl font-extrabold text-emerald-400">₹{todaySales.toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-slate-400">{restOrders.length} total orders</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-xs font-semibold text-slate-400">Active Tables</div>
              <div className="text-2xl font-extrabold text-white">{occupiedTables} / {restTables.length}</div>
              <div className="text-[11px] text-emerald-400 font-medium">{restTables.length - occupiedTables} Available</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-xs font-semibold text-slate-400">Pending Verification</div>
              <div className="text-2xl font-extrabold text-amber-400">{pendingOrders.length}</div>
              <div className="text-[11px] text-slate-400">Cash orders</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-xs font-semibold text-slate-400">Kitchen Preparation</div>
              <div className="text-2xl font-extrabold text-blue-400">{cookingOrders.length}</div>
              <div className="text-[11px] text-slate-400">Active tickets</div>
            </div>
          </div>

          {/* Call Waiter Alerts Stream */}
          {restCalls.length > 0 && (
            <div className="p-6 rounded-3xl bg-amber-950/40 border border-amber-500/40 space-y-4">
              <div className="flex items-center gap-3 text-amber-300">
                <Bell className="w-6 h-6 animate-bounce" />
                <h3 className="text-lg font-bold">Guest Assistance Requests ({restCalls.length})</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {restCalls.map(call => {
                  const matchedOrd = restOrders.find(o => o.table_number === call.table_number && (o.cash_due || 0) > 0);
                  return (
                    <div key={call.id} className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-base flex items-center gap-2">
                          <span>Table #{call.table_number}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${call.request_type === 'payment' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-300'}`}>
                            {call.request_type === 'payment' ? '🔔 PAYMENT REQUEST' : call.request_type}
                          </span>
                        </div>
                        {call.request_type === 'payment' && matchedOrd ? (
                          <div className="text-xs text-amber-300 font-semibold mt-1">
                            Order #{matchedOrd.order_number} • Amount: ₹{matchedOrd.grand_total} (Due: ₹{matchedOrd.cash_due ?? matchedOrd.grand_total})
                            <p className="text-[11px] text-slate-300 font-normal">"Customer is ready to make cash payment."</p>
                          </div>
                        ) : (
                          <div className="text-xs text-amber-400 uppercase font-semibold mt-1">Status: {call.status}</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {call.status === 'pending' && (
                          <button
                            onClick={() => acceptCallRequest(call.id, currentOwner.owner_name)}
                            className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                          >
                            Accept
                          </button>
                        )}
                        {call.request_type === 'payment' && matchedOrd && (
                          <button
                            onClick={() => {
                              verifyCashOrder(matchedOrd.id, currentOwner.owner_name, 'owner');
                              completeCallRequest(call.id);
                            }}
                            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                          >
                            [Mark Cash Paid]
                          </button>
                        )}
                        {call.status === 'accepted' && call.request_type !== 'payment' && (
                          <button
                            onClick={() => completeCallRequest(call.id)}
                            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Orders Section */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Live Orders Stream ({confirmedRestOrders.length})</h3>
              <span className="text-xs text-slate-400">Auto-synced with Online Gateway & Floor Waiters</span>
            </div>

            <div className="space-y-3">
              {confirmedRestOrders.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 text-slate-500 text-xs">
                  No active orders at this moment. Placed cash and verified online orders will appear here automatically.
                </div>
              ) : (
                confirmedRestOrders.map(order => (
                  <div key={order.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold text-white text-base font-mono">{order.order_number}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 text-xs font-bold">{order.table_number}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          order.order_status === 'pending' ? 'bg-amber-950 text-amber-400 border-amber-500/30' :
                          order.order_status === 'accepted' ? 'bg-blue-950 text-blue-400 border-blue-500/30' :
                          order.order_status === 'cooking' ? 'bg-indigo-950 text-indigo-400 border-indigo-500/30' :
                          order.order_status === 'ready' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30' :
                          order.order_status === 'served' ? 'bg-purple-950 text-purple-300 border-purple-500/30' :
                          'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {order.order_status}
                        </span>

                        {['paid_live', 'paid', 'paid_demo', 'paid_online'].includes(order.payment_status) && (order.payment_mode === 'online' || order.payment_mode === 'demo' || order.payment_mode === 'upi_qr') ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-extrabold uppercase flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> PAID ONLINE (AUTO)
                          </span>
                        ) : ['paid_cash', 'paid'].includes(order.payment_status) || (order.payment_mode === 'cash' && ['paid_live', 'paid_cash', 'paid'].includes(order.payment_status)) ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-extrabold uppercase flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> PAID (CASH)
                          </span>
                        ) : order.payment_status === 'partially_paid' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/40 text-[10px] font-extrabold uppercase">
                            PARTIAL (DUE: ₹{getEffectiveCashDue(order)})
                          </span>
                        ) : order.payment_mode === 'online' || order.payment_mode === 'demo' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-500/40 text-[10px] font-extrabold uppercase flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> PAID ONLINE
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-500/40 text-[10px] font-bold uppercase">
                            CASH DUE: ₹{getEffectiveCashDue(order)}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400">
                        {order.items.map(i => `${i.quantity}x ${i.menu_name}`).join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 flex-wrap">
                      <div className="text-right">
                        <div className="font-bold text-white text-base font-mono">₹{order.grand_total}</div>
                        <div className="text-[10px] text-slate-400 uppercase">{order.payment_mode}</div>
                      </div>

                      {/* Operational Override Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {order.payment_status === 'payment_verification_pending' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => verifyUpiPayment(order.id, currentOwner.owner_name, 'owner')}
                              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-md flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> [Verify UPI Paid]
                            </button>
                            <button
                              onClick={() => rejectUpiPayment(order.id, currentOwner.owner_name, 'owner')}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-rose-300 font-bold text-xs border border-slate-700"
                              title="Decline UPI and request cash"
                            >
                              Decline
                            </button>
                          </div>
                        )}

                        {order.payment_mode !== 'online' &&
                         getEffectiveCashDue(order) > 0 &&
                         !['paid_live', 'paid', 'paid_demo', 'paid_cash', 'paid_online'].includes(order.payment_status) &&
                         order.payment_status !== 'payment_verification_pending' && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setSelectedOfflineOrder(order)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 flex items-center gap-1 transition-all"
                              title="Record Cash, Counter UPI, Card or Mixed payment"
                            >
                              <Banknote className="w-3 h-3 text-emerald-400" />
                              <span>Split / Pay</span>
                            </button>
                            <button
                              onClick={() => verifyCashOrder(order.id, currentOwner.owner_name, 'owner')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Mark Cash Paid</span>
                            </button>
                          </div>
                        )}

                      {(order.order_status === 'pending' || order.order_status === 'received') && (
                        <button
                          onClick={() => acceptOrder(order.id, currentOwner.owner_name, 'owner')}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                        >
                          Accept
                        </button>
                      )}

                      {order.order_status === 'accepted' && (
                        <button
                          onClick={() => startCookingOrder(order.id, currentOwner.owner_name, 'owner')}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                        >
                          Start Cooking
                        </button>
                      )}

                      {order.order_status === 'cooking' && (
                        <button
                          onClick={() => markOrderReady(order.id, currentOwner.owner_name, 'owner')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                        >
                          Mark Ready
                        </button>
                      )}

                      {order.order_status === 'ready' && (
                        <button
                          onClick={() => serveOrder(order.id, currentOwner.owner_name, 'owner')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                        >
                          Serve Food
                        </button>
                      )}

                      {/* Bill / Receipt Action Buttons */}
                      <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                        <button
                          onClick={() => setSelectedBillOrder(order)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all flex items-center gap-1"
                          title="View Digital Bill"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-400" /> View Bill
                        </button>

                        <button
                          onClick={() => generateInvoicePdf(order, currentOwner)}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                          title="Download PDF Receipt"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                        </button>

                        <button
                          onClick={() => setSelectedBillOrder(order)}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                          title="Print Thermal / A4 Bill"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                      </div>

                      {order.order_status === 'served' && (
                        <button
                          onClick={() => completeOrder(order.id, currentOwner.owner_name, 'owner')}
                          className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs"
                        >
                          Complete Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            </div>
          </div>
        </div>
      )}

      {/* Bill Preview & Print Modal */}
      {selectedBillOrder && (
        <BillModal
          order={selectedBillOrder}
          restaurant={currentOwner}
          onClose={() => setSelectedBillOrder(null)}
          actorName={currentOwner.owner_name}
        />
      )}

      {/* OTHER TABS */}
      {activeTab === 'menu' && <MenuManagement />}
      {activeTab === 'tables' && <TableManagement />}
      {activeTab === 'staff' && <StaffManagement />}
      {activeTab === 'payments' && <PaymentSettings />}
      {activeTab === 'reports' && <ReportsAnalytics />}
      {activeTab === 'feedback' && <FeedbackViewer />}
      {activeTab === 'settings' && <SettingsManagement />}
      {activeTab === 'public-website' && <RestaurantWebsiteManager restaurantId={currentOwner.id} />}
        </>
      )}

      {/* PhonePe Monthly Subscription Renewal Modal */}
      {showRenewalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-500"></div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    Secure Subscription Renewal
                  </h3>
                  <p className="text-[11px] text-slate-400">DigiMoms SaaS Official Renewal</p>
                </div>
              </div>
              <button
                onClick={() => setShowRenewalModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Restaurant Name:</span>
                <span className="font-bold text-white">{currentOwner.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Renewal Cycle:</span>
                <span className="font-bold text-emerald-400">1 Calendar Month Extension</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Current Expiry Date:</span>
                <span className="font-mono text-slate-300">{formattedEndDate}</span>
              </div>
              <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
                <span className="text-sm font-bold text-white">Total Amount Due:</span>
                <span className="text-xl font-extrabold text-emerald-400">₹{monthlyFee}</span>
              </div>
            </div>

            {(ceoPaymentConfig?.mode || 'demo') === 'demo' ? (
              <div className="p-3.5 rounded-xl bg-purple-950/50 border border-purple-500/30 text-xs text-purple-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-purple-300">
                  <Sparkles className="w-4 h-4 text-purple-400" /> Instant Verification Mode Active
                </div>
                <p className="text-[11px] text-purple-200/80">
                  Testing mode is active. Proceeding will verify the transaction and extend your restaurant subscription by 1 calendar month immediately.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-xs text-emerald-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> 256-Bit Encrypted Online Checkout
                </div>
                <p className="text-[11px] text-emerald-200/80">
                  Your payment is processed through a secure, encrypted online banking network. Digital QR services will be instantly reactivated upon successful payment.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowRenewalModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={handleRenewalClick}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
              >
                {isProcessingPayment ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" /> Verifying Payment...
                  </>
                ) : (
                  <>
                    💳 Pay ₹{monthlyFee} & Reactivate Plan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Help Assistant */}
      <AiHelpAssistant
        role="owner"
        currentView={`Owner Dashboard (${activeTab})`}
        restaurantName={currentOwner?.name || 'Restaurant'}
      />

      {/* Offline Payment Modal */}
      <OfflinePaymentModal
        isOpen={!!selectedOfflineOrder}
        onClose={() => setSelectedOfflineOrder(null)}
        order={selectedOfflineOrder}
        actorName={currentOwner.owner_name}
        actorType="owner"
      />

      {/* PayU Subscription Renewal Modal */}
      <PayUCheckoutModal
        isOpen={showPayUSubscriptionModal}
        onClose={() => setShowPayUSubscriptionModal(false)}
        onSuccess={async (paymentData) => {
          await renewRestaurantMonthly(currentOwner.id, 1, {
            transactionId: paymentData.txnid,
            mode: ceoPaymentConfig?.mode || 'demo'
          });
          setShowPayUSubscriptionModal(false);
          showToast('🎉 DigiMoms OS subscription successfully extended by 1 month!', 'success');
        }}
        amount={monthlyFee}
        title="DigiMoms Smart Restaurant OS Subscription"
        subtitle="Monthly Standard Plan Renewal (1 Calendar Month)"
        restaurantId={currentOwner.id}
        restaurantName={currentOwner.name}
        customerName={currentOwner.owner_name || currentOwner.name}
        customerMobile={currentOwner.owner_mobile}
        customerEmail={currentOwner.owner_email}
        payuKey={ceoPaymentConfig?.payu_merchant_key}
        payuSalt={ceoPaymentConfig?.payu_merchant_salt}
        env={ceoPaymentConfig?.payu_env || 'TEST'}
        isSubscription={true}
      />

      {/* PhonePe Subscription Renewal Modal */}
      <PhonePeCheckoutModal
        isOpen={showPhonePeSubscriptionModal}
        onClose={() => setShowPhonePeSubscriptionModal(false)}
        onSuccess={async (paymentData) => {
          await renewRestaurantMonthly(currentOwner.id, 1, {
            transactionId: paymentData.transactionId,
            mode: ceoPaymentConfig?.mode || 'demo'
          });
          setShowPhonePeSubscriptionModal(false);
          showToast('🎉 DigiMoms OS subscription successfully extended by 1 month!', 'success');
        }}
        amount={monthlyFee}
        title="DigiMoms Smart Restaurant OS Subscription"
        subtitle="Monthly Standard Plan Renewal (1 Calendar Month)"
        restaurantId={currentOwner.id}
        restaurantName={currentOwner.name}
        customerName={currentOwner.owner_name || currentOwner.name}
        customerMobile={currentOwner.owner_mobile}
        customerEmail={currentOwner.owner_email}
        merchantId={ceoPaymentConfig?.phonepe_merchant_id}
        saltKey={ceoPaymentConfig?.phonepe_salt_key}
        saltIndex={ceoPaymentConfig?.phonepe_salt_index}
        env={ceoPaymentConfig?.phonepe_env === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX'}
        isSubscription={true}
      />

      {/* Razorpay Subscription Renewal Modal */}
      <RazorpayCheckoutModal
        isOpen={showRazorpaySubscriptionModal}
        onClose={() => setShowRazorpaySubscriptionModal(false)}
        onSuccess={async (paymentData) => {
          await renewRestaurantMonthly(currentOwner.id, 1, {
            transactionId: paymentData.razorpay_payment_id,
            mode: 'live',
            razorpay_order_id: paymentData.razorpay_order_id,
            razorpay_payment_id: paymentData.razorpay_payment_id,
            razorpay_signature: paymentData.razorpay_signature
          });
          setShowRazorpaySubscriptionModal(false);
          showToast('🎉 DigiMoms OS subscription successfully extended by 1 month!', 'success');
        }}
        amount={monthlyFee}
        title="DigiMoms Smart Restaurant OS Subscription"
        subtitle="Monthly Standard Plan Renewal (1 Calendar Month)"
        restaurantId={currentOwner.id}
        restaurantName={currentOwner.name}
        customerName={currentOwner.owner_name || currentOwner.name}
        customerMobile={currentOwner.owner_mobile}
        customerEmail={currentOwner.owner_email}
        razorpayKey={ceoPaymentConfig?.razorpay_key_id}
        razorpaySecret={ceoPaymentConfig?.razorpay_key_secret}
        isSubscription={true}
      />

      {/* Subscription & Free Offer History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    Renewal & Free Offer History
                  </h3>
                  <p className="text-[11px] text-slate-400">Complete record of paid subscription renewals and complimentary free grants</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {(() => {
              const ownerSubHist = subscriptionHistory.filter(s => s.restaurant_id === currentOwner.id);
              const paidList = ownerSubHist.filter(s => {
                const amt = Number(s.amount ?? s.amount_paid ?? 0);
                const status = (s.payment_status || '').toLowerCase();
                return amt > 0 && status !== 'free' && status !== 'complimentary' && status !== 'not_required' && status !== 'free_granted';
              });
              const freeList = ownerSubHist.filter(s => {
                const amt = Number(s.amount ?? s.amount_paid ?? 0);
                const status = (s.payment_status || '').toLowerCase();
                const type = (s.subscription_type || '').toUpperCase();
                return amt === 0 || s.payment_mode === 'free' || status === 'free' || status === 'complimentary' || status === 'not_required' || status === 'free_granted' || ['TRIAL', 'FREE_OFFER', 'CEO_FREE_EXTENSION', 'FREE_GRANT', 'COMPLIMENTARY'].some(t => type.includes(t));
              });

              const displayedList = historyFilterTab === 'paid' ? paidList : (historyFilterTab === 'free' ? freeList : ownerSubHist);

              return (
                <div className="space-y-4">
                  {/* Filter Tabs */}
                  <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <button
                      onClick={() => setHistoryFilterTab('all')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        historyFilterTab === 'all'
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <History className="w-3.5 h-3.5" /> All History ({ownerSubHist.length})
                    </button>
                    <button
                      onClick={() => setHistoryFilterTab('paid')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        historyFilterTab === 'paid'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-emerald-300'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Paid Renewals ({paidList.length})
                    </button>
                    <button
                      onClick={() => setHistoryFilterTab('free')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        historyFilterTab === 'free'
                          ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-purple-300'
                      }`}
                    >
                      <Gift className="w-3.5 h-3.5" /> Free & Trial ({freeList.length})
                    </button>
                  </div>

                  {displayedList.length === 0 ? (
                    <div className="text-center py-12 space-y-2 text-slate-400 bg-slate-950/50 rounded-2xl border border-slate-800/60 p-6">
                      <History className="w-9 h-9 mx-auto text-slate-600" />
                      <p className="text-sm font-semibold text-slate-300">
                        {historyFilterTab === 'paid' ? 'No paid renewals found.' : historyFilterTab === 'free' ? 'No free offer / trial records found.' : 'No recorded renewal or free history yet.'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {historyFilterTab === 'paid' ? 'Your tax invoices and renewal receipts will appear here.' : 'Free trial, promotional offers, and admin extensions will be recorded here.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {displayedList.map((sub, idx) => {
                        const amt = Number(sub.amount ?? sub.amount_paid ?? 0);
                        const isFree = amt === 0 || sub.payment_mode === 'free' || ['TRIAL', 'FREE_OFFER', 'CEO_FREE_EXTENSION', 'FREE_GRANT'].some(t => (sub.subscription_type || '').includes(t));

                        return (
                          <div
                            key={sub.id || idx}
                            className={`p-4 rounded-2xl border transition-all text-xs space-y-2.5 ${
                              isFree
                                ? 'bg-gradient-to-r from-purple-950/30 to-slate-950 border-purple-800/40'
                                : 'bg-gradient-to-r from-emerald-950/30 to-slate-950 border-emerald-800/40'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                {isFree ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/40 text-[10px] font-bold flex items-center gap-1">
                                    <Gift className="w-3 h-3 text-purple-400" /> Free Offer / Trial
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Paid Renewal
                                  </span>
                                )}

                                <span className="font-extrabold text-white text-sm">
                                  {isFree ? (
                                    <span className="text-purple-300 font-bold">Free (₹0)</span>
                                  ) : (
                                    <span className="text-emerald-300 font-bold">₹{amt}</span>
                                  )}
                                </span>

                                {(sub.days_added || sub.duration_months) && (
                                  <span className="text-[11px] font-medium text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md">
                                    +{sub.days_added ? `${sub.days_added} Days` : `${sub.duration_months} Month(s)`}
                                  </span>
                                )}
                              </div>

                              <div className="text-right text-[11px] text-slate-400">
                                {new Date(sub.payment_date || sub.created_at).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                            </div>

                            {/* Details Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/80">
                              <div>
                                <span className="text-slate-500">Plan / Reason: </span>
                                <span className="text-slate-200 font-medium">{sub.reason || sub.plan_name || (isFree ? 'Promotional Free Period' : 'Monthly Subscription')}</span>
                              </div>
                              {sub.granted_by && (
                                <div>
                                  <span className="text-slate-500">Granted By: </span>
                                  <span className="text-slate-200 font-medium">{sub.granted_by}</span>
                                </div>
                              )}
                              {sub.new_expiry && (
                                <div>
                                  <span className="text-slate-500">Extended Validity To: </span>
                                  <span className="text-amber-300 font-medium">
                                    {new Date(sub.new_expiry).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                              )}
                              {sub.transaction_id && (
                                <div>
                                  <span className="text-slate-500">Txn / Ref ID: </span>
                                  <span className="font-mono text-slate-300">{sub.transaction_id}</span>
                                </div>
                              )}
                            </div>

                            {!isFree && (
                              <div className="pt-2 flex justify-end">
                                <button
                                  onClick={() => generateSubscriptionInvoicePdf(sub, currentOwner)}
                                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-all"
                                >
                                  <Download className="w-3.5 h-3.5" /> Download Tax Invoice
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Change Owner Password</h3>
                  <p className="text-[11px] text-slate-400">Secure credential update</p>
                </div>
              </div>
              <button
                onClick={() => setShowChangePasswordModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>
                <strong>নিরাপত্তা সতর্কতা:</strong> পাসওয়ার্ড পরিবর্তন করলে আপনার বর্তমান ডিভাইস সহ সমস্ত সক্রিয় ডিভাইস থেকে স্বয়ংক্রিয়ভাবে লগআউট হয়ে যাবে।
              </span>
            </div>

            {passwordError && (
              <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setPasswordError('');

                if (!oldPasswordInput.trim()) {
                  setPasswordError('অনুগ্রহ করে আপনার বর্তমান (পুরাতন) পাসওয়ার্ডটি প্রবেশ করান।');
                  return;
                }

                if (oldPasswordInput.trim() !== (currentOwner.password_hash || '').trim()) {
                  setPasswordError('বর্তমান পাসওয়ার্ড ভুল হয়েছে! পাসওয়ার্ড ভুলে গেলে নিচে CEO/Admin এর সাথে যোগাযোগ বাটনে চাপুন।');
                  return;
                }

                if (!newPasswordInput.trim() || newPasswordInput.trim().length < 4) {
                  setPasswordError('নতুন পাসওয়ার্ড অন্তত ৪ অক্ষরের হতে হবে।');
                  return;
                }

                if (newPasswordInput.trim() !== confirmPasswordInput.trim()) {
                  setPasswordError('নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড একই নয়।');
                  return;
                }

                if (newPasswordInput.trim() === oldPasswordInput.trim()) {
                  setPasswordError('নতুন পাসওয়ার্ড পুরাতন পাসওয়ার্ডের মতো হতে পারে না।');
                  return;
                }

                setIsChangingPass(true);
                const success = await updateOwnerPassword(oldPasswordInput.trim(), newPasswordInput.trim());
                setIsChangingPass(false);
                if (success) {
                  setShowChangePasswordModal(false);
                }
              }}
              className="space-y-4"
            >
              {/* Old Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Current (Old) Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    value={oldPasswordInput}
                    onChange={(e) => setOldPasswordInput(e.target.value)}
                    placeholder="Enter existing password"
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 pr-10 text-white text-xs outline-none transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  New Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Enter new strong password"
                    minLength={4}
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 pr-10 text-white text-xs outline-none transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm New Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Re-enter new password"
                    minLength={4}
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 pr-10 text-white text-xs outline-none transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setShowAdminContactModal(true);
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline font-medium"
                >
                  Forgot Password? Request CEO/Admin
                </button>

                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-amber-600/20 transition-all flex items-center gap-2"
                >
                  {isChangingPass ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                  Save & Logout All
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password Contact CEO/Admin Modal */}
      {showAdminContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Request Password Reset</h3>
                  <p className="text-[11px] text-slate-400">Direct CEO / Platform Admin Support</p>
                </div>
              </div>
              <button
                onClick={() => setShowAdminContactModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                আপনি যদি আপনার বর্তমান পাসওয়ার্ড সম্পূর্ণ ভুলে গিয়ে থাকেন, তবে সুরক্ষার জন্য প্ল্যাটফর্মের সিইও (CEO / Admin) সরাসরি আপনার সাথে যোগাযোগ করে নতুন পাসওয়ার্ড প্রদান করবেন।
              </p>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Restaurant:</span>
                  <span className="font-bold text-white">{currentOwner.name}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Registered Owner:</span>
                  <span className="font-bold text-white">{currentOwner.owner_name}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Registered Mobile:</span>
                  <span className="font-bold font-mono text-emerald-400">{currentOwner.owner_mobile}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <a
                href={`https://wa.me/919475388085?text=${encodeURIComponent(
                  `Hello CEO / Admin, I am the owner of ${currentOwner.name} (Owner: ${currentOwner.owner_name}, Mobile: ${currentOwner.owner_mobile}). I forgot my owner password and request a secure password reset.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp CEO Admin Directly
              </a>

              <a
                href="tel:+919475388085"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all"
              >
                <Phone className="w-4 h-4 text-blue-400" /> Direct Phone Call (+91 9475388085)
              </a>

              <button
                onClick={() => {
                  setShowAdminContactModal(false);
                  setShowChangePasswordModal(true);
                }}
                className="w-full py-2 text-center text-xs text-slate-400 hover:text-white"
              >
                Back to Password Form
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
