import React, { useState, useMemo } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { Restaurant, SubscriptionHistory } from '../../types';
import {
  Calendar, Search, Phone, MessageSquare, CheckCircle2,
  Clock, ArrowUpDown, Download, DollarSign, Building2,
  ShieldCheck, RefreshCw, Sparkles, Filter, ChevronRight,
  TrendingUp, Users, ExternalLink
} from 'lucide-react';

interface RenewalItem {
  id: string;
  restaurantId: string;
  restaurantName: string;
  ownerName: string;
  mobile: string;
  renewalDate: Date;
  renewalDateFormatted: string;
  validUntil: string;
  amount: number;
  paymentMode: string;
  paymentStatus: string;
  planName: string;
  transactionId?: string;
  isFreeGrant?: boolean;
  status: string;
}

export const CeoRenewalHistory: React.FC = () => {
  const {
    restaurants,
    subscriptionHistory,
    renewRestaurantMonthly,
    grantFreePlan,
    showToast
  } = useSaaS();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'early_first' | 'recent_first'>('early_first');
  const [filterType, setFilterType] = useState<'all' | 'paid' | 'free'>('all');
  const [isRenewingId, setIsRenewingId] = useState<string | null>(null);

  // Map restaurant lookup
  const restMap = useMemo(() => {
    const map = new Map<string, Restaurant>();
    restaurants.forEach(r => map.set(r.id, r));
    return map;
  }, [restaurants]);

  // Aggregate all renewal records from subscriptionHistory + restaurant subscriptions
  const allRenewals = useMemo(() => {
    const items: RenewalItem[] = [];
    const seenKeys = new Set<string>();

    // 1. From subscriptionHistory
    subscriptionHistory.forEach(sh => {
      const rest = restMap.get(sh.restaurant_id);
      const dateStr = sh.payment_date || sh.created_at || '';
      const d = dateStr ? new Date(dateStr) : new Date();
      if (isNaN(d.getTime())) return;

      const restName = rest?.name || sh.plan_name || 'Restaurant';
      const ownerName = rest?.owner_name || 'Owner';
      const mobile = rest?.owner_mobile || rest?.contact_mobile || 'N/A';
      const isFree = sh.subscription_type?.includes('free') || sh.plan_name?.toLowerCase().includes('free') || sh.amount === 0;

      const dedupeKey = `${sh.restaurant_id}-${d.toISOString().slice(0, 10)}-${sh.transactionId || sh.id}`;
      seenKeys.add(dedupeKey);

      items.push({
        id: sh.id,
        restaurantId: sh.restaurant_id,
        restaurantName: restName,
        ownerName: ownerName,
        mobile: mobile,
        renewalDate: d,
        renewalDateFormatted: d.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        validUntil: sh.end_date || sh.new_expiry || (rest?.subscription_end ? new Date(rest.subscription_end).toLocaleDateString('en-IN') : '1 Month'),
        amount: Number(sh.amount_paid || sh.amount || rest?.monthly_subscription_fee || 0),
        paymentMode: sh.payment_mode || 'online',
        paymentStatus: sh.payment_status || 'paid',
        planName: sh.plan_name || 'Monthly Subscription',
        transactionId: sh.transaction_id || sh.payment_id || sh.razorpay_payment_id,
        isFreeGrant: isFree,
        status: rest?.status || 'active'
      });
    });

    // 2. Fallback: Include restaurants with active subscriptions if not already recorded in history
    restaurants.forEach(rest => {
      if (rest.subscription_start) {
        const d = new Date(rest.subscription_start);
        if (!isNaN(d.getTime())) {
          const dedupeKey = `${rest.id}-${d.toISOString().slice(0, 10)}`;
          if (!seenKeys.has(dedupeKey) && items.every(it => it.restaurantId !== rest.id)) {
            items.push({
              id: `init-${rest.id}`,
              restaurantId: rest.id,
              restaurantName: rest.name,
              ownerName: rest.owner_name,
              mobile: rest.owner_mobile || rest.contact_mobile || 'N/A',
              renewalDate: d,
              renewalDateFormatted: d.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }),
              validUntil: rest.subscription_end ? new Date(rest.subscription_end).toLocaleDateString('en-IN') : 'N/A',
              amount: Number(rest.monthly_subscription_fee || 999),
              paymentMode: 'subscription_start',
              paymentStatus: 'paid',
              planName: 'Initial Subscription',
              isFreeGrant: false,
              status: rest.status
            });
          }
        }
      }
    });

    return items;
  }, [subscriptionHistory, restaurants, restMap]);

  // Extract unique months list sorted newest first (e.g. "2026-10", "2026-09")
  const availableMonths = useMemo(() => {
    const monthMap = new Map<string, { label: string; year: number; month: number; count: number; totalAmount: number }>();

    allRenewals.forEach(item => {
      const y = item.renewalDate.getFullYear();
      const m = item.renewalDate.getMonth(); // 0-11
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      const monthName = item.renewalDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const label = `${monthName} ${y}`; // e.g. "OCT 2026"

      if (!monthMap.has(key)) {
        monthMap.set(key, { label, year: y, month: m, count: 0, totalAmount: 0 });
      }
      const entry = monthMap.get(key)!;
      entry.count += 1;
      entry.totalAmount += item.amount;
    });

    // Also guarantee current month exists in tabs
    const now = new Date();
    const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const curMonthName = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    if (!monthMap.has(curKey)) {
      monthMap.set(curKey, {
        label: `${curMonthName} ${now.getFullYear()}`,
        year: now.getFullYear(),
        month: now.getMonth(),
        count: 0,
        totalAmount: 0
      });
    }

    // Sort descending by date
    return Array.from(monthMap.entries())
      .map(([key, data]) => ({ key, ...data }))
      .sort((a, b) => b.key.localeCompare(a.key));
  }, [allRenewals]);

  // Determine active month
  const activeMonthKey = selectedMonthKey || (availableMonths.length > 0 ? availableMonths[0].key : '');

  // Filter items for the selected month
  const monthRenewals = useMemo(() => {
    if (!activeMonthKey) return [];

    let filtered = allRenewals.filter(item => {
      const y = item.renewalDate.getFullYear();
      const m = item.renewalDate.getMonth();
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      return key === activeMonthKey;
    });

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(item =>
        item.restaurantName.toLowerCase().includes(q) ||
        item.ownerName.toLowerCase().includes(q) ||
        item.mobile.includes(q) ||
        (item.transactionId && item.transactionId.toLowerCase().includes(q))
      );
    }

    // Type filter
    if (filterType === 'paid') {
      filtered = filtered.filter(item => !item.isFreeGrant && item.amount > 0);
    } else if (filterType === 'free') {
      filtered = filtered.filter(item => item.isFreeGrant || item.amount === 0);
    }

    // Sorting:
    // 'early_first' = who renewed first comes first (chronological: B renewed on Oct 2 before A on Oct 5 -> B, A)
    // 'recent_first' = latest renewal first
    filtered.sort((a, b) => {
      const diff = a.renewalDate.getTime() - b.renewalDate.getTime();
      return sortOrder === 'early_first' ? diff : -diff;
    });

    return filtered;
  }, [allRenewals, activeMonthKey, searchTerm, filterType, sortOrder]);

  // Active month statistics
  const currentMonthStats = useMemo(() => {
    const totalRenewals = monthRenewals.length;
    const totalRevenue = monthRenewals.reduce((sum, item) => sum + item.amount, 0);
    const uniqueRestaurants = new Set(monthRenewals.map(item => item.restaurantId)).size;
    const freeGrants = monthRenewals.filter(item => item.isFreeGrant).length;

    return {
      totalRenewals,
      totalRevenue,
      uniqueRestaurants,
      freeGrants
    };
  }, [monthRenewals]);

  // Handle Quick Renewal
  const handleQuickRenew = async (restaurantId: string, restaurantName: string) => {
    try {
      setIsRenewingId(restaurantId);
      await renewRestaurantMonthly(restaurantId, 1, { mode: 'ceo_manual' });
      showToast(`✅ Successfully renewed 1 Month for ${restaurantName}!`, 'success');
    } catch (e: any) {
      showToast(`Renewal failed: ${e?.message || 'Error'}`, 'error');
    } finally {
      setIsRenewingId(null);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (monthRenewals.length === 0) {
      showToast('No renewal data to export for this month.', 'info');
      return;
    }

    const headers = ['Sequence #', 'Restaurant Name', 'Owner Name', 'Owner Mobile', 'Renewal Date & Time', 'Valid Till', 'Amount (INR)', 'Payment Mode', 'Status', 'Transaction ID'];
    const rows = monthRenewals.map((r, idx) => [
      idx + 1,
      `"${r.restaurantName.replace(/"/g, '""')}"`,
      `"${r.ownerName.replace(/"/g, '""')}"`,
      r.mobile,
      `"${r.renewalDateFormatted}"`,
      `"${r.validUntil}"`,
      r.amount,
      r.paymentMode,
      r.status,
      r.transactionId || 'N/A'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Renewal_History_${activeMonthKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📥 Downloaded Renewal History CSV successfully!', 'success');
  };

  const activeMonthData = availableMonths.find(m => m.key === activeMonthKey);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-purple-800/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Month-wise Renewal Track Record</span>
            </div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
              <span>📅 Restaurant Renewal History (রিনিউয়াল হিস্ট্রি)</span>
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              প্রতিটি মাসের রিনিউয়াল ক্রম অনুযায়ী রেস্টুরেন্টের তালিকা ও মোবাইল নম্বর (যে আগে রিনিউ করেছে সে প্রথমে)।
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
              title="Download Excel / CSV"
            >
              <Download className="w-4 h-4 text-emerald-400" /> Export CSV
            </button>
          </div>
        </div>

        {/* Month Selector Tabs */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="text-xs font-bold text-slate-400 mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              Select Month (মাস নির্বাচন করুন):
            </span>
            <span className="text-purple-400 text-[11px]">
              Viewing: {activeMonthData?.label || activeMonthKey}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-purple-800 scrollbar-track-transparent">
            {availableMonths.map(m => {
              const isActive = m.key === activeMonthKey;
              return (
                <button
                  key={m.key}
                  onClick={() => setSelectedMonthKey(m.key)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 whitespace-nowrap shadow-sm ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-900/30 ring-2 ring-purple-400/50 scale-[1.02]'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700/60'
                  }`}
                >
                  <span className="tracking-wide">{m.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-black/30 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {m.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Metric Cards for Selected Month */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Total Renewals</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2">{currentMonthStats.totalRenewals}</p>
          <p className="text-[11px] text-slate-500 mt-1">In {activeMonthData?.label}</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Total Collection</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">₹{currentMonthStats.totalRevenue.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-slate-500 mt-1">Subscription Revenue</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Active Tenants</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2">{currentMonthStats.uniqueRestaurants}</p>
          <p className="text-[11px] text-slate-500 mt-1">Restaurants Renewed</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Order Sequence</span>
            <ArrowUpDown className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-sm font-black text-amber-300 mt-2">
            {sortOrder === 'early_first' ? '🥇 First Renewed First' : '⏱️ Latest First'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {sortOrder === 'early_first' ? 'যে আগে করেছে সে প্রথমে' : 'সাম্প্রতিক রিনিউয়াল আগে'}
          </p>
        </div>
      </div>

      {/* Search, Filter & Sequence Sort Controls */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by Restaurant Name, Owner Name, or Mobile Number..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Type */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterType === 'all' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({monthRenewals.length})
            </button>
            <button
              onClick={() => setFilterType('paid')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterType === 'paid' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Paid Only
            </button>
            <button
              onClick={() => setFilterType('free')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterType === 'free' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Free Offers
            </button>
          </div>

          {/* Sort Order Selector (Early Renewals First vs Latest First) */}
          <button
            onClick={() => setSortOrder(prev => prev === 'early_first' ? 'recent_first' : 'early_first')}
            className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Toggle Sort Sequence"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" />
            <span>
              {sortOrder === 'early_first' ? 'Sort: Earliest First (Default)' : 'Sort: Latest First'}
            </span>
          </button>
        </div>
      </div>

      {/* Renewal History List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-black text-white">
              {activeMonthData?.label} Renewal List
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold border border-purple-500/20">
              {monthRenewals.length} Entries
            </span>
          </div>

          <div className="text-xs text-slate-400">
            Showing in order of renewal timestamp
          </div>
        </div>

        {monthRenewals.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
              <Calendar className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">No Renewals Found in {activeMonthData?.label}</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              এই মাসে এখনও কোনো রেস্টুরেন্ট রিনিউ করেনি অথবা আপনার সার্চ ফিল্টারের সাথে মিলছে না।
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {monthRenewals.map((item, index) => {
              const sequenceNum = index + 1;
              const rest = restMap.get(item.restaurantId);
              const cleanMobile = item.mobile.replace(/\D/g, '');

              return (
                <div
                  key={item.id}
                  className="p-4 hover:bg-slate-850/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left: Sequence + Restaurant Info + Mobile */}
                  <div className="flex items-start gap-3.5">
                    {/* Renewal Sequence Badge (#1, #2, #3...) */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex flex-col items-center justify-center shrink-0 shadow-md">
                      <span className="text-[9px] text-purple-200 font-bold uppercase leading-none">Order</span>
                      <span className="text-base font-black text-white leading-tight">#{sequenceNum}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-black text-white hover:text-purple-300 transition-colors">
                          {item.restaurantName}
                        </h4>

                        {item.isFreeGrant ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold">
                            🎁 Free Extension
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                            ₹{item.amount} Paid
                          </span>
                        )}

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {item.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Owner & Contact Phone Details */}
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1 text-slate-300 font-semibold">
                          <Users className="w-3.5 h-3.5 text-purple-400" />
                          Owner: {item.ownerName}
                        </span>

                        <span className="flex items-center gap-1.5 text-slate-200 font-bold bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span>{item.mobile}</span>
                        </span>

                        {cleanMobile.length >= 10 && (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${cleanMobile}`}
                              className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                              title="Call Owner"
                            >
                              <Phone className="w-3 h-3" />
                            </a>
                            <a
                              href={`https://wa.me/${cleanMobile.startsWith('91') ? cleanMobile : '91' + cleanMobile}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded-md bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                              title="WhatsApp Owner"
                            >
                              <MessageSquare className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Renewal Timestamp & Validity & Quick Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:self-center pl-13 lg:pl-0">
                    <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl text-right">
                      <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-purple-300">
                        <Clock className="w-3.5 h-3.5 text-purple-400" />
                        <span>Renewed: {item.renewalDateFormatted}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Valid till: <span className="text-slate-200 font-semibold">{item.validUntil}</span>
                      </div>
                      {item.transactionId && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[200px]" title={item.transactionId}>
                          Txn: {item.transactionId}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuickRenew(item.restaurantId, item.restaurantName)}
                        disabled={isRenewingId === item.restaurantId}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                        title="Renew +1 Month"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRenewingId === item.restaurantId ? 'animate-spin' : ''}`} />
                        <span>+1 Month</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Helpful Instructions Box for CEO */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-300">
            রিনিউয়াল ট্র্যাকিং নিয়ম (Renewal Tracking System):
          </p>
          <p>
            ১. যে রেস্টুরেন্ট মাসের শুরুতে আগে রিনিউ করে (যেমন B যদি ২রা অক্টোবর রিনিউ করে এবং A যদি ৫ই অক্টোবর করে), তাদের নাম Order #1, Order #2 হিসেবে ক্রমানুসারে থাকবে।
          </p>
          <p>
            ২. যদি সেপ্টেম্বর মাসে C রিনিউ করেছিল কিন্তু অক্টোবর মাসে এখনো রিনিউ করেনি, তবে সেপ্টেম্বর মাসের ট্যাবে C-এর নাম দেখাবে, আর অক্টোবর মাসে শুধু B ও A দেখাবে।
          </p>
        </div>
      </div>
    </div>
  );
};
