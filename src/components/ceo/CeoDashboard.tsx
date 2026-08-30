import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { SmartImage } from '../common/SmartImage';
import {
  Building2, Plus, Search, ShieldCheck, DollarSign, Calendar,
  AlertTriangle, RefreshCw, Archive, RotateCcw, Power, Eye, LogOut,
  Database, Star, FileText, Phone, CreditCard, Edit3, Settings, Sparkles, CheckCircle2, Trash2, Loader2, Globe
} from 'lucide-react';
import { SqlSchemaViewer } from './SqlSchemaViewer';
import { CeoPaymentSettings } from './CeoPaymentSettings';
import { CeoStorageViewer } from './CeoStorageViewer';
import { CeoBackupManager } from './CeoBackupManager';
import { CeoAgreementGenerator } from './CeoAgreementGenerator';
import { AiHelpAssistant } from '../common/AiHelpAssistant';
import { RestaurantWebsiteManager } from '../owner/RestaurantWebsiteManager';
import { Restaurant } from '../../types';

export type RevenuePeriod = 'this_month' | 'today' | 'yesterday' | 'this_week' | 'last_month' | 'this_year' | 'lifetime';

export function isOrderInPeriod(orderCreatedAt: string, period: RevenuePeriod): boolean {
  if (!orderCreatedAt) return false;
  const orderDate = new Date(orderCreatedAt);
  if (isNaN(orderDate.getTime())) return false;
  const now = new Date();

  switch (period) {
    case 'today': {
      return (
        orderDate.getFullYear() === now.getFullYear() &&
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getDate() === now.getDate()
      );
    }
    case 'yesterday': {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return (
        orderDate.getFullYear() === yesterday.getFullYear() &&
        orderDate.getMonth() === yesterday.getMonth() &&
        orderDate.getDate() === yesterday.getDate()
      );
    }
    case 'this_week': {
      const startOfWeek = new Date(now);
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      return orderDate >= startOfWeek;
    }
    case 'this_month': {
      return (
        orderDate.getFullYear() === now.getFullYear() &&
        orderDate.getMonth() === now.getMonth()
      );
    }
    case 'last_month': {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return (
        orderDate.getFullYear() === lastMonth.getFullYear() &&
        orderDate.getMonth() === lastMonth.getMonth()
      );
    }
    case 'this_year': {
      return orderDate.getFullYear() === now.getFullYear();
    }
    case 'lifetime':
    default:
      return true;
  }
}

export const CeoDashboard: React.FC = () => {
  const {
    ceoAuthenticated,
    restaurants,
    addRestaurant,
    updateRestaurant,
    suspendRestaurant,
    resumeRestaurant,
    grantTrial,
    endTrial,
    extendTrial,
    grantFreeOffer,
    endFreeOffer,
    extendFreeOffer,
    grantFreeExtension,
    renewSubscription,
    renewRestaurantMonthly,
    archiveRestaurant,
    deleteRestaurantPermanently,
    factoryResetRestaurant,
    executeProductionReset,
    logoutCeo,
    orders,
    feedbackList,
    activityLogs,
    subscriptionHistory,
    setActiveView,
    setActiveSlug,
    ceoRazorpayConfig,
    updateCeoRazorpayConfig,
    showToast
  } = useSaaS();

  const [activeTab, setActiveTab] = useState<'restaurants' | 'agreement' | 'payment-settings' | 'sql' | 'storage' | 'backup' | 'feedback' | 'logs'>('restaurants');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [managingWebsiteRest, setManagingWebsiteRest] = useState<Restaurant | null>(null);
  const [showResetModal, setShowResetModal] = useState<string | null>(null);
  const [showProdResetModal, setShowProdResetModal] = useState(false);
  const [prodResetPasswordInput, setProdResetPasswordInput] = useState('');
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);

  // New trial, free offer & extension modals state
  const [showTrialModal, setShowTrialModal] = useState<Restaurant | null>(null);
  const [trialDaysInput, setTrialDaysInput] = useState<number>(7);

  const [showFreeOfferModal, setShowFreeOfferModal] = useState<Restaurant | null>(null);
  const [freeOfferDaysInput, setFreeOfferDaysInput] = useState<number>(7);

  const [showExtensionModal, setShowExtensionModal] = useState<Restaurant | null>(null);
  const [extensionDaysInput, setExtensionDaysInput] = useState<number>(10);
  const [extensionReasonInput, setExtensionReasonInput] = useState<string>('CEO Special Complimentary Extension');

  const [showHistoryModal, setShowHistoryModal] = useState<Restaurant | null>(null);

  // Controlled Delete / Archive Modal state
  const [showDeleteModal, setShowDeleteModal] = useState<Restaurant | null>(null);
  const [deleteMode, setDeleteMode] = useState<'archive' | 'permanent'>('archive');
  const [deleteConfirmInput, setDeleteConfirmInput] = useState<string>('');

  const handleConfirmProdReset = async () => {
    const success = await executeProductionReset(prodResetPasswordInput);
    if (success) {
      setShowProdResetModal(false);
      setProdResetPasswordInput('');
    }
  };

  // Razorpay form state
  const [rzpForm, setRzpForm] = useState({
    keyId: ceoRazorpayConfig?.razorpay_key_id || '',
    keySecret: ceoRazorpayConfig?.razorpay_key_secret || '',
    mode: ceoRazorpayConfig?.mode || 'demo'
  });

  // Add Wizard Form
  const [newRest, setNewRest] = useState({
    name: '',
    slug: '',
    owner_name: '',
    owner_mobile: '',
    contact_mobile: '',
    password: '',
    address: '',
    monthly_fee: 999,
    trial_days: 14
  });

  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('this_month');

  const periodLabelMap: Record<RevenuePeriod, string> = {
    this_month: 'This Month',
    today: 'Today',
    yesterday: 'Yesterday',
    this_week: 'This Week',
    last_month: 'Last Month',
    this_year: 'This Year',
    lifetime: 'Lifetime All-Time'
  };

  const restaurantRevenueMap = React.useMemo(() => {
    const map = new Map<string, { totalRevenue: number; paidOrdersCount: number }>();

    for (const r of restaurants) {
      map.set(r.id, { totalRevenue: 0, paidOrdersCount: 0 });
    }

    for (const ord of orders) {
      if (ord.order_status === 'cancelled') continue;
      if (!isOrderInPeriod(ord.created_at, revenuePeriod)) continue;

      const pStatus = ord.payment_status;
      const isPaid = pStatus === 'paid' || pStatus === 'paid_live' || pStatus === 'paid_cash' || pStatus === 'paid_demo';
      const isPartial = pStatus === 'partially_paid' || pStatus === 'partial';

      if (isPaid || isPartial) {
        let amountToAdd = 0;
        if (isPaid) {
          amountToAdd = Number(ord.grand_total || 0);
        } else {
          const onlineAmt = Number(ord.online_amount || 0);
          const cashAmt = Number(ord.cash_amount || 0);
          amountToAdd = onlineAmt + cashAmt;
        }

        if (amountToAdd > 0) {
          const entry = map.get(ord.restaurant_id) || { totalRevenue: 0, paidOrdersCount: 0 };
          entry.totalRevenue += amountToAdd;
          entry.paidOrdersCount += 1;
          map.set(ord.restaurant_id, entry);
        }
      }
    }

    return map;
  }, [restaurants, orders, revenuePeriod]);

  const totalCustomerSales = React.useMemo(() => {
    let sum = 0;
    for (const val of restaurantRevenueMap.values()) {
      sum += val.totalRevenue;
    }
    return Math.round(sum);
  }, [restaurantRevenueMap]);

  // Calculate Metrics
  const platformRevenue = subscriptionHistory
    .filter(s => (s.payment_status?.toLowerCase() === 'paid' || s.payment_status?.toLowerCase() === 'completed') && Number(s.amount) > 0)
    .reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const paidSubscriptionsCount = subscriptionHistory
    .filter(s => (s.payment_status?.toLowerCase() === 'paid' || s.payment_status?.toLowerCase() === 'completed') && Number(s.amount) > 0).length;

  const activeCount = restaurants.filter(r => r.status === 'active' || r.status === 'trial').length;
  const trialCount = restaurants.filter(r => r.status === 'trial').length;
  const avgOverallRating = feedbackList.length > 0
    ? (feedbackList.reduce((acc, f) => acc + f.overall_rating, 0) / feedbackList.length).toFixed(1)
    : '5.0';

  const filteredRestaurants = restaurants.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.owner_mobile.includes(searchTerm) ||
    r.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const expiringTenants = restaurants.filter(r => {
    const subEnd = new Date(r.subscription_end || r.trial_end).getTime();
    const days = Math.ceil((subEnd - Date.now()) / (1000 * 60 * 60 * 24));
    return days <= 7;
  });

  const [isSubmittingRest, setIsSubmittingRest] = useState(false);
  const [createRestError, setCreateRestError] = useState<{ code?: string; message?: string; details?: string } | null>(null);

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateRestError(null);
    if (!newRest.name || !newRest.owner_mobile) return;

    try {
      setIsSubmittingRest(true);
      await addRestaurant({
        name: newRest.name,
        slug: newRest.slug || newRest.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        owner_name: newRest.owner_name,
        owner_mobile: newRest.owner_mobile,
        password_hash: newRest.password || 'owner123',
        address: newRest.address,
        monthly_subscription_fee: Number(newRest.monthly_fee) || 999,
        trial_days: Number(newRest.trial_days) || 14
      });

      setNewRest({ name: '', slug: '', owner_name: '', owner_mobile: '', contact_mobile: '', password: '', address: '', monthly_fee: 999, trial_days: 14 });
      setCreateRestError(null);
      setShowAddModal(false);
    } catch (err: any) {
      console.error("Failed to create restaurant:", err);
      setCreateRestError({
        code: err?.code || 'ERROR',
        message: err?.message || String(err),
        details: err?.details || ''
      });
    } finally {
      setIsSubmittingRest(false);
    }
  };

  const handleSaveEditRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRestaurant) return;

    const feeNum = Number(editingRestaurant.monthly_subscription_fee);
    if (editingRestaurant.monthly_subscription_fee === undefined || (editingRestaurant.monthly_subscription_fee as any) === '' || isNaN(feeNum) || feeNum <= 0) {
      showToast('Please enter a valid Monthly Subscription Price (> 0, e.g. 999 or 1099)', 'error');
      return;
    }

    try {
      const trialDaysNum = Number(editingRestaurant.trial_days || 0);
      const trialStatus = editingRestaurant.trial_status || 'off';
      let trialStart = editingRestaurant.trial_start || new Date().toISOString();
      let trialEnd = editingRestaurant.trial_end || new Date().toISOString();

      if (trialStatus === 'active' && trialDaysNum > 0) {
        const nowMs = Date.now();
        trialStart = new Date(nowMs).toISOString();
        trialEnd = new Date(nowMs + trialDaysNum * 24 * 3600 * 1000).toISOString();
      }

      await updateRestaurant(editingRestaurant.id, {
        name: editingRestaurant.name,
        slug: editingRestaurant.slug,
        owner_name: editingRestaurant.owner_name,
        owner_mobile: editingRestaurant.owner_mobile,
        contact_mobile: editingRestaurant.contact_mobile,
        password_hash: editingRestaurant.password_hash,
        logo: editingRestaurant.logo,
        banner: editingRestaurant.banner,
        address: editingRestaurant.address,
        gst: editingRestaurant.gst,
        fssai: editingRestaurant.fssai,
        business_hours: editingRestaurant.business_hours,
        payment_mode: editingRestaurant.payment_mode,
        theme: editingRestaurant.theme,
        language: editingRestaurant.language,
        timezone: editingRestaurant.timezone,
        monthly_subscription_fee: feeNum,
        trial_status: trialStatus,
        trial_days: trialStatus === 'active' ? trialDaysNum : 0,
        trial_start: trialStart,
        trial_end: trialEnd,
        subscription_start: editingRestaurant.subscription_start,
        subscription_end: editingRestaurant.subscription_end,
        status: editingRestaurant.status
      });
      setEditingRestaurant(null);
    } catch (err: any) {
      console.error("Failed to edit restaurant:", err);
      showToast(`Save Failed: ${err.message || 'Error updating database'}`, 'error');
    }
  };

  const handleSaveRazorpayConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateCeoRazorpayConfig({
      razorpay_key_id: rzpForm.keyId,
      razorpay_key_secret: rzpForm.keySecret,
      mode: rzpForm.mode
    });
    setShowRazorpayModal(false);
  };

  const handleConfirmReset = (id: string) => {
    if (factoryResetRestaurant(id, resetPasswordInput)) {
      setShowResetModal(null);
      setResetPasswordInput('');
    }
  };

  if (!ceoAuthenticated) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-purple-600/20 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/30">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Authentication Required</h2>
        <p className="text-xs text-slate-400">Please authenticate with Master CEO credentials to access this control center.</p>
        <button
          onClick={() => setActiveView('ceo-login')}
          className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
        >
          Go to CEO Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white">CEO Control Center</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold uppercase border border-purple-500/30">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-400">Global SaaS Multi-Tenant Infrastructure Manager</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRazorpayModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center gap-2 transition-all shadow-md"
          >
            <CreditCard className="w-4 h-4 text-emerald-400" /> Razorpay Account ({(ceoRazorpayConfig?.mode || 'demo').toUpperCase()})
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Restaurant
          </button>

          <button
            onClick={() => setShowProdResetModal(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 font-bold text-xs border border-rose-800 flex items-center gap-2 transition-all shadow-md"
          >
            <Trash2 className="w-4 h-4 text-rose-400" /> Production Reset
          </button>

          <button
            onClick={logoutCeo}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all"
          >
            <LogOut className="w-4 h-4" /> Logout CEO
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>Total Restaurants</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{restaurants.length}</div>
          <div className="text-[11px] text-emerald-400 font-medium">{activeCount} Active / In Trial</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>Platform Revenue</span>
            <DollarSign className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">₹{platformRevenue.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-purple-300 font-medium">{paidSubscriptionsCount} verified SaaS fees</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 bg-emerald-950/10 space-y-1">
          <div className="text-xs font-semibold text-emerald-400 flex items-center justify-between">
            <span>Restaurant Sales ({periodLabelMap[revenuePeriod]})</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-300">₹{totalCustomerSales.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-emerald-400/80 font-medium">Settled customer payments</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>Active Free Trials</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400">{trialCount}</div>
          <div className="text-[11px] text-slate-400 font-medium">15-day trial period</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>Average Satisfaction</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{avgOverallRating} / 5.0</div>
          <div className="text-[11px] text-slate-400 font-medium">{feedbackList.length} total reviews</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('restaurants')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'restaurants' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" /> Manage Tenants ({restaurants.length})
        </button>

        <button
          onClick={() => setActiveTab('agreement')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'agreement' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 text-pink-400" /> Restaurant Agreement
        </button>

        <button
          onClick={() => setActiveTab('payment-settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'payment-settings' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-400" /> Subscription Gateway & Payments
        </button>

        <button
          onClick={() => setActiveTab('sql')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'sql' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" /> Supabase SQL Migrations
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'storage' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4 text-blue-400" /> System / Storage
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'backup' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-400" /> System / Backup
        </button>

        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'feedback' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Star className="w-4 h-4" /> Global Customer Feedback
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'logs' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" /> System Audit Trail
        </button>
      </div>      {/* TAB 1: RESTAURANT TENANT MANAGEMENT */}
      {activeTab === 'restaurants' && (
        <div className="space-y-6">
          {/* 7-DAY EXPIRY RENEWAL ALERTS BOX FOR CEO */}
          {expiringTenants.length > 0 && (
            <div className="p-6 rounded-3xl bg-amber-950/60 border-2 border-amber-500/40 space-y-4 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-amber-300">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <AlertTriangle className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Upcoming Subscription Expiry Notifications ({expiringTenants.length})</h3>
                    <p className="text-xs text-amber-200/80">These restaurants expire within 7 days. Contact owners via Mobile to collect monthly renewal fee.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {expiringTenants.map(r => {
                  const subEnd = new Date(r.subscription_end || r.trial_end).getTime();
                  const daysLeft = Math.ceil((subEnd - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={r.id} className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{r.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                          {daysLeft <= 0 ? 'EXPIRED' : `${daysLeft} Days Left`}
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <div className="text-slate-300 flex items-center justify-between">
                          <span>Owner Name:</span>
                          <strong className="text-white">{r.owner_name}</strong>
                        </div>
                        <div className="text-slate-300 flex items-center justify-between">
                          <span>Owner Mobile:</span>
                          <a href={`tel:${r.owner_mobile}`} className="text-amber-400 font-mono font-bold flex items-center gap-1 hover:underline">
                            <Phone className="w-3 h-3" /> {r.owner_mobile}
                          </a>
                        </div>
                        <div className="text-slate-300 flex items-center justify-between">
                          <span>Monthly Rate:</span>
                          <strong className="text-emerald-400 font-extrabold">₹{r.monthly_subscription_fee || 999}/mo</strong>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => renewRestaurantMonthly(r.id, 1)}
                          className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Renew 1 Mo
                        </button>
                        <button
                          onClick={() => setEditingRestaurant(r)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] border border-slate-700"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search restaurant, owner, mobile, slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-purple-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-slate-400">Revenue Period:</span>
              <select
                value={revenuePeriod}
                onChange={(e) => setRevenuePeriod(e.target.value as RevenuePeriod)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-bold outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="this_month">This Month ({new Date().toLocaleString('en-IN', { month: 'short', year: 'numeric' })})</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">This Week</option>
                <option value="last_month">Last Month</option>
                <option value="this_year">This Year ({new Date().getFullYear()})</option>
                <option value="lifetime">Lifetime All-Time</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-4">Restaurant / Slug</th>
                    <th className="p-4">Owner & Mobile</th>
                    <th className="p-4">Status & Monthly Rate</th>
                    <th className="p-4">Trial / Sub Expiry</th>
                    <th className="p-4 text-right">Customer Revenue ({periodLabelMap[revenuePeriod]})</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRestaurants.map((rest) => {
                    const revInfo = restaurantRevenueMap.get(rest.id) || { totalRevenue: 0, paidOrdersCount: 0 };
                    return (
                    <tr key={rest.id} className="hover:bg-slate-800/40 transition-all">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <SmartImage src={rest.logo} alt={rest.name} className="w-10 h-10 rounded-xl object-cover border border-slate-700" />
                          <div>
                            <div className="font-bold text-white text-sm">{rest.name}</div>
                            <div className="text-purple-400 font-mono text-[11px]">/r/{rest.slug}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-slate-200">{rest.owner_name}</div>
                        <a href={`tel:${rest.owner_mobile}`} className="text-slate-400 font-mono hover:text-purple-300 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-purple-400" /> {rest.owner_mobile}
                        </a>
                      </td>

                      <td className="p-4">
                        <div className="space-y-1">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            rest.status === 'active' ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' :
                            rest.status === 'trial' ? 'bg-amber-950 text-amber-400 border-amber-500/30' :
                            rest.status === 'suspended' ? 'bg-rose-950 text-rose-400 border-rose-500/30' :
                            'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {rest.status}
                          </span>
                          <div className="font-extrabold text-emerald-400 text-xs">
                            ₹{rest.monthly_subscription_fee || 999}/mo
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-slate-400 text-[11px] space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-300">Trial:</span>
                          {rest.trial_status === 'active' && new Date(rest.trial_end).getTime() > Date.now() ? (
                            <span className="text-amber-400 font-bold bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.2 rounded text-[10px]">
                              ACTIVE ({new Date(rest.trial_end).toLocaleDateString()})
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono text-[10px]">OFF</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-300">Free Offer:</span>
                          {rest.free_offer_status === 'active' && new Date(rest.free_offer_end).getTime() > Date.now() ? (
                            <span className="text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.2 rounded text-[10px]">
                              ACTIVE ({new Date(rest.free_offer_end).toLocaleDateString()})
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono text-[10px]">OFF</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-300">Sub Expiry:</span>
                          <span className="text-purple-300 font-bold font-mono">
                            {new Date(rest.subscription_end).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="font-extrabold text-emerald-400 text-sm font-mono">
                          ₹{revInfo.totalRevenue.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {revInfo.paidOrdersCount} {revInfo.paidOrdersCount === 1 ? 'settled order' : 'settled orders'}
                        </div>
                      </td>

                      <td className="p-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => setEditingRestaurant(rest)}
                          className="px-2 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs inline-flex items-center gap-1"
                          title="Edit Details"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>

                        <button
                          onClick={() => setShowTrialModal(rest)}
                          title="CEO Trial Control"
                          className="px-2 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-300 font-medium text-xs border border-amber-500/30"
                        >
                          🎁 Trial
                        </button>

                        <button
                          onClick={() => setShowFreeOfferModal(rest)}
                          title="CEO Free Offer Control"
                          className="px-2 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-medium text-xs border border-emerald-500/30"
                        >
                          🎉 Free Offer
                        </button>

                        <button
                          onClick={() => setShowExtensionModal(rest)}
                          title="Give Extra Free Days (No Payment)"
                          className="px-2 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 text-purple-300 font-medium text-xs border border-purple-500/30"
                        >
                          ✨ Extension
                        </button>

                        <button
                          onClick={() => renewRestaurantMonthly(rest.id, 1)}
                          title="Renew Subscription 1 Month"
                          className="px-2 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 text-blue-300 font-medium text-xs border border-blue-500/30"
                        >
                          💳 Renew 1Mo
                        </button>

                        <button
                          onClick={() => setShowHistoryModal(rest)}
                          title="View Lifetime Renewal & Trial History"
                          className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700"
                        >
                          📜 History
                        </button>

                        <button
                          onClick={() => setManagingWebsiteRest(rest)}
                          title="Manage Public Website & Portfolio"
                          className="px-2.5 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-500/30 font-medium text-xs inline-flex items-center gap-1"
                        >
                          <Globe className="w-3.5 h-3.5 text-blue-400" /> Website
                        </button>

                        <button
                          onClick={() => {
                            setActiveSlug(rest.slug);
                            setActiveView('public-restaurant');
                          }}
                          title="View Public Site"
                          className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs"
                        >
                          <Eye className="w-3.5 h-3.5 inline" />
                        </button>

                        {rest.status === 'suspended' ? (
                          <button
                            onClick={() => resumeRestaurant(rest.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-medium text-xs"
                          >
                            Resume
                          </button>
                        ) : (
                          <button
                            onClick={() => suspendRestaurant(rest.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 text-rose-300 hover:bg-rose-900 font-medium text-xs border border-rose-500/30"
                          >
                            Suspend
                          </button>
                        )}

                        <button
                          onClick={() => setShowResetModal(rest.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs"
                        >
                          Reset
                        </button>

                        <button
                          onClick={() => {
                            setShowDeleteModal(rest);
                            setDeleteMode('archive');
                            setDeleteConfirmInput('');
                          }}
                          title="Archive or Permanently Delete Restaurant"
                          className="px-2.5 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-200 border border-red-700/50 font-medium text-xs inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" /> Delete / Archive
                        </button>
                      </td>
                    </tr>
                  ); })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: RESTAURANT AGREEMENT PDF GENERATOR */}
      {activeTab === 'agreement' && <CeoAgreementGenerator restaurants={restaurants} showToast={showToast} />}

      {/* TAB 1.5: CEO SUBSCRIPTION PAYMENT GATEWAY SETTINGS */}
      {activeTab === 'payment-settings' && <CeoPaymentSettings />}

      {/* TAB 2: SQL SCHEMA */}
      {activeTab === 'sql' && <SqlSchemaViewer />}

      {/* TAB 3: GLOBAL FEEDBACK */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Global Customer Feedback Stream</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedbackList.map(fb => (
                <div key={fb.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{fb.table_number}</span>
                    <span className="text-amber-400 font-bold flex items-center gap-1 text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> {fb.overall_rating} / 5
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 italic">"{fb.comment || 'No written comment'}"</p>
                  <div className="text-[10px] text-slate-500">{new Date(fb.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: SYSTEM / STORAGE */}
      {activeTab === 'storage' && <CeoStorageViewer />}

      {/* TAB: SYSTEM / BACKUP */}
      {activeTab === 'backup' && <CeoBackupManager />}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">System Activity Trail</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
            {activityLogs.map(log => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between text-slate-300">
                <div>
                  <span className="font-bold text-purple-400 uppercase mr-2">[{log.action}]</span>
                  <span>{log.details}</span>
                </div>
                <div className="text-slate-500 text-[10px] shrink-0">{new Date(log.created_at).toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Help Assistant */}
      <AiHelpAssistant
        role="ceo"
        currentView={`CEO Dashboard (${activeTab})`}
        restaurantName="DigiMoms SaaS Platform"
      />

      {/* ADD RESTAURANT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Add New Restaurant Tenant</h3>
              <button onClick={() => { setShowAddModal(false); setCreateRestError(null); }} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {createRestError && (
              <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-xs text-rose-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-300">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Supabase Error ({createRestError.code})</span>
                </div>
                <div className="text-[11px] font-mono leading-relaxed">{createRestError.message}</div>
                {createRestError.details && (
                  <div className="text-[10px] text-rose-400 font-mono mt-0.5">{createRestError.details}</div>
                )}
              </div>
            )}

            <form onSubmit={handleCreateRestaurant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Restaurant Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amber Palace"
                  value={newRest.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    setNewRest({ ...newRest, name, slug });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Slug</label>
                <input
                  type="text"
                  placeholder="amber-palace"
                  value={newRest.slug}
                  onChange={(e) => setNewRest({ ...newRest, slug: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-purple-400 font-mono outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Owner Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={newRest.owner_name}
                    onChange={(e) => setNewRest({ ...newRest, owner_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Owner Mobile *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10 digit mobile"
                    value={newRest.owner_mobile}
                    onChange={(e) => setNewRest({ ...newRest, owner_mobile: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Monthly Renewal Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={newRest.monthly_fee}
                    onChange={(e) => setNewRest({ ...newRest, monthly_fee: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-emerald-400 font-extrabold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Free Trial Days *</label>
                  <input
                    type="number"
                    required
                    value={newRest.trial_days}
                    onChange={(e) => setNewRest({ ...newRest, trial_days: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Public Contact Mobile (for QR PDF)</label>
                <input
                  type="tel"
                  placeholder="Optional (defaults to owner mobile)"
                  value={newRest.contact_mobile}
                  onChange={(e) => setNewRest({ ...newRest, contact_mobile: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Owner Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Set owner password (min 6 chars)"
                  value={newRest.password}
                  onChange={(e) => setNewRest({ ...newRest, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingRest}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
              >
                {isSubmittingRest ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Inserting into Supabase...
                  </>
                ) : (
                  'Provision Tenant & Launch Trial'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT RESTAURANT DETAILS MODAL */}
      {editingRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Edit Restaurant Details</h3>
              </div>
              <button onClick={() => setEditingRestaurant(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveEditRestaurant} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Restaurant Name</label>
                  <input
                    type="text"
                    required
                    value={editingRestaurant.name}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Slug (/r/...)</label>
                  <input
                    type="text"
                    required
                    value={editingRestaurant.slug}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, slug: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-purple-400 font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Owner Name</label>
                  <input
                    type="text"
                    required
                    value={editingRestaurant.owner_name}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, owner_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Owner Mobile (Login ID)</label>
                  <input
                    type="tel"
                    required
                    value={editingRestaurant.owner_mobile}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, owner_mobile: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Public Contact Mobile</label>
                  <input
                    type="tel"
                    value={editingRestaurant.contact_mobile || ''}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, contact_mobile: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Owner Password</label>
                  <input
                    type="text"
                    value={editingRestaurant.password_hash}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, password_hash: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Monthly Subscription Fee (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="999"
                    value={editingRestaurant.monthly_subscription_fee ?? ''}
                    onChange={(e) => setEditingRestaurant({
                      ...editingRestaurant,
                      monthly_subscription_fee: e.target.value === '' ? ('' as any) : Number(e.target.value)
                    })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-emerald-400 font-extrabold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Free Trial Settings</label>
                  <select
                    value={editingRestaurant.trial_status || 'off'}
                    onChange={(e) => {
                      const newStatus = e.target.value as 'off' | 'active';
                      setEditingRestaurant({
                        ...editingRestaurant,
                        trial_status: newStatus,
                        trial_days: newStatus === 'off' ? 0 : (editingRestaurant.trial_days || 7)
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none"
                  >
                    <option value="off">Free Trial: OFF (No Trial)</option>
                    <option value="active">Free Trial: ON (Grant Days)</option>
                  </select>
                </div>
              </div>

              {editingRestaurant.trial_status === 'active' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Free Trial Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="7"
                    value={editingRestaurant.trial_days || 7}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, trial_days: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-amber-300 font-bold outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subscription End Date</label>
                  <input
                    type="date"
                    value={editingRestaurant.subscription_end ? new Date(editingRestaurant.subscription_end).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, subscription_end: new Date(e.target.value).toISOString() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Account Status</label>
                  <select
                    value={editingRestaurant.status}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none"
                  >
                    <option value="active">Active (Full Access)</option>
                    <option value="trial">Trial Period</option>
                    <option value="suspended">Suspended</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRestaurant(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
                >
                  Save Restaurant Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CEO COMPANY RAZORPAY CONFIG MODAL */}
      {showRazorpayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Company Razorpay Account</h3>
              </div>
              <button onClick={() => setShowRazorpayModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-400">
              Configure company Razorpay credentials. When restaurant owners renew their monthly subscription from their panel, payments will be processed through this Razorpay account.
            </p>

            <form onSubmit={handleSaveRazorpayConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Razorpay Key ID *</label>
                <input
                  type="text"
                  required
                  placeholder="rzp_live_xxxxxxxxxxxx"
                  value={rzpForm.keyId}
                  onChange={(e) => setRzpForm({ ...rzpForm, keyId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Razorpay Key Secret *</label>
                <input
                  type="password"
                  required
                  placeholder="Secret Key"
                  value={rzpForm.keySecret}
                  onChange={(e) => setRzpForm({ ...rzpForm, keySecret: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Gateway Mode / Test Switch</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRzpForm({ ...rzpForm, mode: 'demo' })}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                      rzpForm.mode === 'demo'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    🧪 Demo Mode (Off)
                    <span className="block text-[10px] font-normal text-slate-400 mt-0.5">Allows 1-click test renewals</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRzpForm({ ...rzpForm, mode: 'live' })}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                      rzpForm.mode === 'live'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-lg'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    ⚡ Live Mode
                    <span className="block text-[10px] font-normal text-slate-400 mt-0.5">Real Razorpay processing</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRazorpayModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30"
                >
                  Save Gateway Config
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FACTORY RESET CONFIRMATION MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-rose-500/50 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-8 h-8" />
              <h3 className="text-lg font-bold text-white">Danger Zone: Factory Reset</h3>
            </div>
            <p className="text-xs text-slate-300">
              This action will clear all active orders, bills, and call waiter logs for this restaurant. Re-enter CEO Password to confirm.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Re-enter CEO Password</label>
              <input
                type="password"
                required
                placeholder="Enter CEO password to confirm"
                value={resetPasswordInput}
                onChange={(e) => setResetPasswordInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowResetModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmReset(showResetModal)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30"
              >
                Execute Factory Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL PRODUCTION RESET CONFIRMATION MODAL */}
      {showProdResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-rose-600 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="text-lg font-black text-white">SYSTEM PRODUCTION RESET</h3>
                <p className="text-xs text-rose-400 font-medium">Delete ALL application data across all restaurants</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-900 text-xs text-slate-300 space-y-2">
              <p className="font-semibold text-rose-200">This action will clear:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] grid grid-cols-2 gap-1">
                <li>All Restaurants</li>
                <li>All Owners & Staff</li>
                <li>All Tables & Sessions</li>
                <li>All Categories & Items</li>
                <li>All Orders & Items</li>
                <li>All Feedback & Call Requests</li>
              </ul>
              <p className="text-[11px] text-slate-400 pt-1">
                Note: Database schema, tables, indexes, RLS policies, and Master CEO credentials will remain intact.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Enter Master CEO Password to Confirm Reset</label>
              <input
                type="password"
                required
                placeholder="Enter CEO Password"
                value={prodResetPasswordInput}
                onChange={(e) => setProdResetPasswordInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowProdResetModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmProdReset}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/40"
              >
                WIPE ALL DATA (PRODUCTION RESET)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CEO GRANT TRIAL MODAL */}
      {showTrialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">CEO Trial Management</h3>
              </div>
              <button onClick={() => setShowTrialModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-white">{showTrialModal.name} (<span className="text-purple-400 font-mono">/r/{showTrialModal.slug}</span>)</p>
              <p className="text-slate-400">Current Status: <span className="font-bold text-amber-300 uppercase">{showTrialModal.trial_status || 'OFF'}</span></p>
              {showTrialModal.trial_end && (
                <p className="text-slate-400 text-[11px]">Trial Expiry: {new Date(showTrialModal.trial_end).toLocaleString()}</p>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">Select or Enter Trial Duration (Days)</label>
              <div className="grid grid-cols-4 gap-2">
                {[7, 10, 15, 30].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setTrialDaysInput(d)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      trialDaysInput === d
                        ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-amber-500/50'
                    }`}
                  >
                    {d} Days
                  </button>
                ))}
              </div>

              <div>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={trialDaysInput}
                  onChange={(e) => setTrialDaysInput(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-amber-500"
                  placeholder="Custom days..."
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              {showTrialModal.trial_status === 'active' ? (
                <button
                  type="button"
                  onClick={async () => {
                    await endTrial(showTrialModal.id);
                    setShowTrialModal(null);
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 font-bold text-xs"
                >
                  End Active Trial
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTrialModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await grantTrial(showTrialModal.id, trialDaysInput);
                    setShowTrialModal(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20"
                >
                  Grant {trialDaysInput}-Day Trial
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CEO GRANT FREE OFFER MODAL */}
      {showFreeOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">CEO Free Offer Management</h3>
              </div>
              <button onClick={() => setShowFreeOfferModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-white">{showFreeOfferModal.name} (<span className="text-purple-400 font-mono">/r/{showFreeOfferModal.slug}</span>)</p>
              <p className="text-slate-400">Current Status: <span className="font-bold text-emerald-300 uppercase">{showFreeOfferModal.free_offer_status || 'OFF'}</span></p>
              {showFreeOfferModal.free_offer_end && (
                <p className="text-slate-400 text-[11px]">Offer Expiry: {new Date(showFreeOfferModal.free_offer_end).toLocaleString()}</p>
              )}
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">Select or Enter Free Offer Duration (Days)</label>
              <div className="grid grid-cols-4 gap-2">
                {[7, 10, 14, 30].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setFreeOfferDaysInput(d)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      freeOfferDaysInput === d
                        ? 'bg-emerald-500 text-black border-emerald-400 shadow-md'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-emerald-500/50'
                    }`}
                  >
                    {d} Days
                  </button>
                ))}
              </div>

              <div>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={freeOfferDaysInput}
                  onChange={(e) => setFreeOfferDaysInput(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  placeholder="Custom days..."
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              {showFreeOfferModal.free_offer_status === 'active' ? (
                <button
                  type="button"
                  onClick={async () => {
                    await endFreeOffer(showFreeOfferModal.id);
                    setShowFreeOfferModal(null);
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 font-bold text-xs"
                >
                  Cancel Free Offer
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFreeOfferModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await grantFreeOffer(showFreeOfferModal.id, freeOfferDaysInput);
                    setShowFreeOfferModal(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20"
                >
                  Give {freeOfferDaysInput}-Day Free Offer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CEO FREE EXTENSION MODAL */}
      {showExtensionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-purple-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Grant Free Extra Days</h3>
              </div>
              <button onClick={() => setShowExtensionModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-white">{showExtensionModal.name}</p>
              <p className="text-slate-400">Current Subscription Expiry: <span className="font-mono text-purple-300 font-bold">{new Date(showExtensionModal.subscription_end || Date.now()).toLocaleDateString()}</span></p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">Free Extra Days</label>
              <div className="grid grid-cols-4 gap-2">
                {[7, 10, 15, 30].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setExtensionDaysInput(d)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      extensionDaysInput === d
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-purple-500/50'
                    }`}
                  >
                    +{d} Days
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Reason / Note for Record</label>
                <input
                  type="text"
                  value={extensionReasonInput}
                  onChange={(e) => setExtensionReasonInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-purple-500"
                  placeholder="e.g. CEO Complimentary Extension"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowExtensionModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await grantFreeExtension(showExtensionModal.id, extensionDaysInput, extensionReasonInput);
                  setShowExtensionModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-lg shadow-purple-600/30"
              >
                Grant +{extensionDaysInput} Free Days
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIFETIME SUBSCRIPTION RENEWAL HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-bold text-white">Lifetime Subscription History</h3>
                <p className="text-xs text-purple-400 font-medium">{showHistoryModal.name} (/r/{showHistoryModal.slug})</p>
              </div>
              <button onClick={() => setShowHistoryModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="overflow-y-auto custom-scrollbar grow">
              {subscriptionHistory.filter(s => s.restaurant_id === showHistoryModal.id).length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No previous renewal or trial transaction history found for this restaurant.
                </div>
              ) : (
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Type / Plan</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Payment ID / Mode</th>
                      <th className="p-3">New Expiry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {subscriptionHistory
                      .filter(s => s.restaurant_id === showHistoryModal.id)
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((h) => (
                        <tr key={h.id} className="hover:bg-slate-800/40">
                          <td className="p-3 text-slate-400">{new Date(h.created_at).toLocaleDateString()}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                              h.subscription_type === 'RENEWAL' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                              h.subscription_type === 'TRIAL' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                              'bg-purple-950 text-purple-300 border border-purple-800'
                            }`}>
                              {h.subscription_type || 'RENEWAL'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-200">{h.duration_months ? `${h.duration_months}Mo` : `${h.days_added} Days`}</td>
                          <td className="p-3 text-emerald-400 font-bold">₹{h.amount || 0}</td>
                          <td className="p-3 text-slate-400">
                            <div>{h.razorpay_payment_id || h.payment_id || 'N/A'}</div>
                            <div className="text-[10px] text-purple-400 uppercase">{h.payment_mode}</div>
                          </td>
                          <td className="p-3 text-purple-300 font-bold">{new Date(h.end_date || h.new_expiry).toLocaleDateString()}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex items-center justify-end border-t border-slate-800 pt-3 shrink-0">
              <button
                onClick={() => setShowHistoryModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTROLLED DELETE / ARCHIVE RESTAURANT MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Delete or Archive Restaurant</h3>
                  <p className="text-xs text-slate-400">CEO Multi-Step Confirmation Procedure</p>
                </div>
              </div>
              <button onClick={() => setShowDeleteModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs text-slate-400 font-semibold uppercase">Selected Restaurant Tenant</div>
              <div className="text-xl font-extrabold text-white">{showDeleteModal.name}</div>
              <div className="text-xs text-blue-400 font-mono">/r/{showDeleteModal.slug} • Owner: {showDeleteModal.owner_name}</div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">Select Operation Type:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteMode('archive')}
                  className={`p-4 rounded-2xl border text-left transition-all space-y-1 ${
                    deleteMode === 'archive'
                      ? 'bg-amber-950/40 border-amber-500/60 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm text-amber-300">📦 Archive Restaurant</div>
                  <div className="text-[11px] text-slate-400">Soft disable. All data retained safely in database.</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteMode('permanent')}
                  className={`p-4 rounded-2xl border text-left transition-all space-y-1 ${
                    deleteMode === 'permanent'
                      ? 'bg-rose-950/40 border-rose-500/60 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm text-rose-400">💥 Permanent Delete</div>
                  <div className="text-[11px] text-slate-400">Destructive removal of restaurant & all dependent records.</div>
                </button>
              </div>
            </div>

            {deleteMode === 'permanent' && (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 space-y-3">
                <div className="text-xs text-rose-300 leading-relaxed">
                  ⚠️ <strong>Permanent Deletion Confirmation Required:</strong> To prevent accidental deletion, please type the exact restaurant name <strong className="text-white font-mono">{showDeleteModal.name}</strong> or <strong className="text-white font-mono">DELETE</strong> below.
                </div>
                <input
                  type="text"
                  placeholder={`Type "${showDeleteModal.name}" or "DELETE"`}
                  value={deleteConfirmInput}
                  onChange={(e) => setDeleteConfirmInput(e.target.value)}
                  className="w-full bg-slate-950 border border-rose-800/80 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-rose-500 font-mono"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>

              {deleteMode === 'archive' ? (
                <button
                  onClick={async () => {
                    await archiveRestaurant(showDeleteModal.id);
                    setShowDeleteModal(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition-all"
                >
                  Confirm Archive Restaurant
                </button>
              ) : (
                <button
                  disabled={
                    deleteConfirmInput.trim() !== showDeleteModal.name.trim() &&
                    deleteConfirmInput.trim().toUpperCase() !== 'DELETE'
                  }
                  onClick={async () => {
                    await deleteRestaurantPermanently(showDeleteModal.id);
                    setShowDeleteModal(null);
                  }}
                  className={`px-6 py-2.5 rounded-xl text-white font-bold text-xs transition-all ${
                    deleteConfirmInput.trim() === showDeleteModal.name.trim() ||
                    deleteConfirmInput.trim().toUpperCase() === 'DELETE'
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  Confirm Permanent Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CEO WEBSITE MANAGER MODAL */}
      {managingWebsiteRest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">
                  Managing Public Website: <span className="text-blue-400">{managingWebsiteRest.name}</span>
                </h3>
              </div>
              <button onClick={() => setManagingWebsiteRest(null)} className="text-slate-400 hover:text-white font-bold p-1">✕</button>
            </div>

            <RestaurantWebsiteManager restaurantId={managingWebsiteRest.id} />
          </div>
        </div>
      )}

      {/* CEO AI Help Assistant */}
      <AiHelpAssistant role="ceo" currentView={`CEO Dashboard (${activeTab})`} />
    </div>
  );
};
