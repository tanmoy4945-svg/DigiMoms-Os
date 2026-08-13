import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { SmartImage } from '../common/SmartImage';
import {
  Building2, Utensils, QrCode, Users, CreditCard, BarChart3,
  Star, Settings, LogOut, CheckCircle2, Clock, PhoneCall, ShoppingBag, Bell, AlertTriangle, ShieldCheck, Sparkles,
  FileText, Printer, Download, Globe
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
import { AiHelpAssistant } from '../common/AiHelpAssistant';
import { RealtimeStatusBadge } from '../common/RealtimeStatusBadge';
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
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedBillOrder, setSelectedBillOrder] = useState<Order | null>(null);

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

  const todaySales = restOrders.reduce((sum, o) => sum + o.grand_total, 0);
  const pendingOrders = restOrders.filter(o => o.order_status === 'pending');
  const cookingOrders = restOrders.filter(o => o.order_status === 'cooking' || o.order_status === 'accepted');
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
            <h3 className="text-lg font-bold text-white">Live Orders Stream ({restOrders.length})</h3>

            <div className="space-y-3">
              {restOrders.map(order => (
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
                    </div>

                    <p className="text-xs text-slate-400">
                      {order.items.map(i => `${i.quantity}x ${i.menu_name}`).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 flex-wrap">
                    <div className="text-right">
                      <div className="font-bold text-white text-base">₹{order.grand_total}</div>
                      <div className="text-[10px] text-slate-400 uppercase">{order.payment_mode} ({order.payment_status})</div>
                    </div>

                    {/* Operational Override Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {(order.cash_due ?? (order.grand_total - (order.online_amount || 0) - (order.cash_amount || 0))) > 0 &&
                       order.payment_status !== 'paid_live' && order.payment_status !== 'paid' && order.payment_status !== 'paid_demo' && order.payment_status !== 'paid_cash' && (
                        <button
                          onClick={() => verifyCashOrder(order.id, currentOwner.owner_name, 'owner')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md"
                        >
                          [Mark Cash Paid]
                        </button>
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
              ))}
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
                  <h3 className="font-extrabold text-white text-base">PhonePe Business Gateway</h3>
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
                  <Sparkles className="w-4 h-4 text-purple-400" /> PhonePe Sandbox / Demo Mode
                </div>
                <p className="text-[11px] text-purple-200/80">
                  PhonePe Business gateway is active in Demo mode. Proceeding will execute server-side verification and extend subscription by 1 calendar month instantly.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-xs text-emerald-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> PhonePe Live Business Verified
                </div>
                <p className="text-[11px] text-emerald-200/80">
                  Payment will be routed via PhonePe Business Merchant ID: {ceoPaymentConfig?.phonepe_merchant_id || 'DIGIMOMS_ONLINE'}.
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
                onClick={handleProcessPhonePeRenewal}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
              >
                {isProcessingPayment ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" /> Verifying PhonePe...
                  </>
                ) : (
                  <>
                    💳 Pay ₹{monthlyFee} via PhonePe
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
    </div>
  );
};
