import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { SmartImage } from '../common/SmartImage';
import {
  Building2, Utensils, QrCode, Users, CreditCard, BarChart3,
  Star, Settings, LogOut, CheckCircle2, Clock, PhoneCall, ShoppingBag, Bell, AlertTriangle, ShieldCheck, Sparkles,
  FileText, Printer, Download, Globe, Banknote
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
import { generateInvoicePdf } from '../../utils/pdfGenerator';
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
    showToast
  } = useSaaS();

  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'tables' | 'staff' | 'payments' | 'reports' | 'feedback' | 'settings' | 'public-website'>('overview');
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [showPayUSubscriptionModal, setShowPayUSubscriptionModal] = useState(false);
  const [showPhonePeSubscriptionModal, setShowPhonePeSubscriptionModal] = useState(false);
  const [showRazorpaySubscriptionModal, setShowRazorpaySubscriptionModal] = useState(false);
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

  // Filter confirmed & active orders (excluding cancelled)
  const confirmedRestOrders = restOrders.filter(o => o.order_status !== 'cancelled');

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

  const now = Date.now();
  const isTrialActive = currentOwner.trial_status === 'active' && new Date(currentOwner.trial_end).getTime() > now;
  const isFreeActive = currentOwner.free_offer_status === 'active' && new Date(currentOwner.free_offer_end).getTime() > now;
  const isSubActive = currentOwner.status === 'active' && new Date(currentOwner.subscription_end).getTime() > now;

  let subEndDate = new Date(currentOwner.subscription_end || now).getTime();
  if (isTrialActive) {
    subEndDate = Math.max(subEndDate, new Date(currentOwner.trial_end).getTime());
  }
  if (isFreeActive) {
    subEndDate = Math.max(subEndDate, new Date(currentOwner.free_offer_end).getTime());
  }

  const daysLeft = Math.ceil((subEndDate - now) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysLeft <= 7;
  const monthlyFee = currentOwner.monthly_subscription_fee || 999;

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

        <div className="flex flex-wrap items-center gap-3">
          <RealtimeStatusBadge />

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

      {/* Subscription Expiry Alert Banner (triggers when 7 days or less remaining) */}
      {isExpiringSoon && (
        <div className="p-5 rounded-3xl bg-amber-950/60 border-2 border-amber-500/40 text-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl backdrop-blur-md animate-pulse">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                ⚠️ Subscription Expiry Warning!
                <span className="text-xs bg-amber-500/20 px-2 py-0.5 rounded-full text-amber-300 border border-amber-500/30 font-mono">
                  {daysLeft <= 0 ? 'Expired Today' : `${daysLeft} Days Remaining`}
                </span>
              </h3>
              <p className="text-xs text-amber-200/80 mt-1">
                Your monthly plan ends on <strong>{new Date(subEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>.
                Pay <strong>₹{monthlyFee}</strong> via Razorpay to keep your digital menu & QR ordering active without interruption.
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
                    {ceoPaymentConfig?.primary_gateway === 'payu'
                      ? 'PayU India Gateway'
                      : ceoPaymentConfig?.primary_gateway === 'razorpay'
                      ? 'Razorpay Gateway'
                      : 'PhonePe Business Gateway'}
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
                <span className="font-mono text-slate-300">{new Date(subEndDate).toLocaleDateString()}</span>
              </div>
              <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
                <span className="text-sm font-bold text-white">Total Amount Due:</span>
                <span className="text-xl font-extrabold text-emerald-400">₹{monthlyFee}</span>
              </div>
            </div>

            {(ceoPaymentConfig?.mode || 'demo') === 'demo' ? (
              <div className="p-3.5 rounded-xl bg-purple-950/50 border border-purple-500/30 text-xs text-purple-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-purple-300">
                  <Sparkles className="w-4 h-4 text-purple-400" />{' '}
                  {ceoPaymentConfig?.primary_gateway === 'payu'
                    ? 'PayU'
                    : ceoPaymentConfig?.primary_gateway === 'razorpay'
                    ? 'Razorpay'
                    : 'PhonePe'}{' '}
                  Demo / Sandbox Mode
                </div>
                <p className="text-[11px] text-purple-200/80">
                  {ceoPaymentConfig?.primary_gateway === 'payu'
                    ? 'PayU India'
                    : ceoPaymentConfig?.primary_gateway === 'razorpay'
                    ? 'Razorpay'
                    : 'PhonePe Business'}{' '}
                  gateway is active in Demo mode. Proceeding will execute server-side verification and extend subscription by 1 calendar month instantly.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-xs text-emerald-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />{' '}
                  {ceoPaymentConfig?.primary_gateway === 'payu'
                    ? 'PayU India Live'
                    : ceoPaymentConfig?.primary_gateway === 'razorpay'
                    ? 'Razorpay Live'
                    : 'PhonePe Live Business'}
                </div>
                <p className="text-[11px] text-emerald-200/80">
                  Payment will be routed via{' '}
                  {ceoPaymentConfig?.primary_gateway === 'payu'
                    ? `PayU Merchant Key: ${ceoPaymentConfig?.payu_merchant_key || 'Configured'}`
                    : ceoPaymentConfig?.primary_gateway === 'razorpay'
                    ? `Razorpay Key ID: ${ceoPaymentConfig?.razorpay_key_id || 'Configured'}`
                    : `PhonePe Business Merchant ID: ${ceoPaymentConfig?.phonepe_merchant_id || 'DIGIMOMS_ONLINE'}`}.
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
                    💳 Pay ₹{monthlyFee} via{' '}
                    {ceoPaymentConfig?.primary_gateway === 'payu'
                      ? 'PayU'
                      : ceoPaymentConfig?.primary_gateway === 'razorpay'
                      ? 'Razorpay'
                      : 'PhonePe'}
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
          showToast('🎉 DigiMoms OS subscription successfully extended by 1 month via PayU!', 'success');
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
          showToast('🎉 DigiMoms OS subscription successfully extended by 1 month via PhonePe!', 'success');
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
          showToast('🎉 DigiMoms OS subscription successfully extended by 1 month via Razorpay!', 'success');
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
    </div>
  );
};
