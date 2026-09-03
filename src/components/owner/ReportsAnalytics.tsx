import React, { useState, useMemo } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import {
  BarChart3, Download, TrendingUp, DollarSign, ShoppingBag,
  CreditCard, Shield, Clock, Users, FileText, CheckCircle2,
  AlertCircle, Printer, Search, Filter, Layers, RefreshCw,
  ArrowRight, Phone, Check, X
} from 'lucide-react';
import { generateInvoicePdf } from '../../utils/pdfGenerator';
import { BillModal } from '../common/BillModal';
import { Order } from '../../types';

export const ReportsAnalytics: React.FC = () => {
  const { currentOwner, orders, auditLogs, paymentTransactions, showToast } = useSaaS();

  const [activeTab, setActiveTab] = useState<'sales' | 'transactions' | 'audit'>('sales');
  
  // Sales Filters
  const [salesFilterMode, setSalesFilterMode] = useState<'all' | 'cash' | 'demo' | 'online' | 'partial'>('all');
  
  // Transactions Filters
  const [txFilterMethod, setTxFilterMethod] = useState<'all' | 'online' | 'cash' | 'split' | 'demo'>('all');
  const [txFilterStatus, setTxFilterStatus] = useState<'all' | 'paid' | 'pending' | 'partially_paid' | 'failed'>('all');
  const [txSearchQuery, setTxSearchQuery] = useState<string>('');

  // Audit Filters
  const [auditDaysFilter, setAuditDaysFilter] = useState<number>(45); // Default 45 days retention
  const [auditRoleFilter, setAuditRoleFilter] = useState<'all' | 'owner' | 'waiter' | 'kitchen' | 'staff' | 'customer'>('all');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('all');
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');

  const [selectedBillOrder, setSelectedBillOrder] = useState<Order | null>(null);

  if (!currentOwner) return null;

  // --- SALES DATA & REVENUE CALCULATION ---
  const restOrders = useMemo(() => {
    return orders.filter(o => o.restaurant_id === currentOwner.id);
  }, [orders, currentOwner.id]);

  // Valid non-cancelled orders that are either placed (cash/split/upi) or verified paid (online)
  const validOrders = useMemo(() => {
    return restOrders.filter(o => {
      if (o.order_status === 'cancelled') return false;
      // If payment mode is online and payment has not been verified/paid, ignore as uncompleted gateway checkout
      if (o.payment_mode === 'online' && !['paid_live', 'paid', 'paid_demo', 'paid_online'].includes(o.payment_status)) {
        return false;
      }
      return true;
    });
  }, [restOrders]);

  const filteredOrders = useMemo(() => {
    return validOrders.filter(o => salesFilterMode === 'all' || o.payment_mode === salesFilterMode);
  }, [validOrders, salesFilterMode]);

  // 1. Online Revenue: All auto-verified online transactions (Razorpay, PayU, PhonePe, Demo, verified UPI)
  const onlineSales = useMemo(() => {
    return restOrders.reduce((sum, o) => {
      if (o.order_status === 'cancelled') return sum;
      if (o.payment_mode === 'online' && ['paid_live', 'paid', 'paid_demo', 'paid_online'].includes(o.payment_status)) {
        return sum + Number(o.online_amount || o.grand_total);
      }
      if (o.payment_mode === 'demo') {
        return sum + Number(o.online_amount || o.grand_total);
      }
      if (o.payment_mode === 'partial') {
        if (['paid_live', 'paid', 'paid_demo', 'paid_online', 'partially_paid'].includes(o.payment_status) || (o.online_amount || 0) > 0) {
          return sum + Number(o.online_amount || 0);
        }
      }
      if (o.payment_mode === 'upi_qr' && ['paid_live', 'paid', 'paid_demo', 'paid_online'].includes(o.payment_status)) {
        return sum + Number(o.online_amount || o.grand_total);
      }
      return sum;
    }, 0);
  }, [restOrders]);

  // 2. Cash Revenue: Confirmed cash payments received and marked by Owner or Staff
  const cashSales = useMemo(() => {
    return restOrders.reduce((sum, o) => {
      if (o.order_status === 'cancelled') return sum;
      if (o.payment_mode === 'cash') {
        if (['paid_cash', 'paid', 'paid_live', 'paid_demo', 'paid_online'].includes(o.payment_status)) {
          return sum + Number(o.cash_amount || o.grand_total);
        } else if ((o.cash_amount || 0) > 0) {
          return sum + Number(o.cash_amount || 0);
        }
      }
      if (o.payment_mode === 'partial') {
        if (['paid', 'paid_cash'].includes(o.payment_status)) {
          const onlinePaid = Number(o.online_amount || 0);
          return sum + Number(o.cash_amount || (o.grand_total - onlinePaid));
        } else if ((o.cash_amount || 0) > 0) {
          return sum + Number(o.cash_amount || 0);
        }
      }
      return sum;
    }, 0);
  }, [restOrders]);

  // 3. Total Realized Revenue: Strictly the actual collected money (Online Auto + Confirmed Cash)
  const totalSales = useMemo(() => {
    return onlineSales + cashSales;
  }, [onlineSales, cashSales]);

  // 4. Pending Payment: Real uncollected cash due on active placed orders (excludes cancelled and abandoned online)
  const pendingSales = useMemo(() => {
    return validOrders.reduce((sum, o) => {
      if (['paid', 'paid_live', 'paid_cash', 'paid_demo', 'paid_online'].includes(o.payment_status)) {
        return sum; // Fully paid
      }
      if (o.payment_mode === 'online' || o.payment_mode === 'demo') {
        return sum; // Online orders do not have pending cash collection
      }
      const onlinePaid = Number(o.online_amount || 0);
      const cashPaid = Number(o.cash_amount || 0);
      const remainingDue = Math.max(0, o.grand_total - (onlinePaid + cashPaid));
      return sum + remainingDue;
    }, 0);
  }, [validOrders]);

  const totalOrdersCount = validOrders.length;

  // --- DERIVED PAYMENT TRANSACTIONS (Guaranteed Complete Real Data) ---
  const derivedTransactions = useMemo(() => {
    const explicitTxs = (paymentTransactions || []).filter(pt => pt.restaurant_id === currentOwner.id);
    const txMap = new Map<string, any>();

    // First add explicit transaction records from payment_transactions table in Supabase
    explicitTxs.forEach(pt => {
      txMap.set(pt.id, {
        id: pt.id,
        order_id: pt.order_id,
        order_number: pt.order_number || '#000',
        table_number: pt.table_number || '-',
        customer_mobile: (pt as any).customer_mobile || undefined,
        payment_method: pt.payment_method || 'cash',
        total_amount: Number(pt.amount || 0),
        online_amount: pt.payment_method === 'online' ? Number(pt.amount || 0) : 0,
        cash_amount: pt.payment_method === 'cash' ? Number(pt.amount || 0) : 0,
        cash_due: 0,
        status: pt.status || 'paid',
        transaction_id: pt.transaction_id || '-',
        confirmed_by: pt.actor_name ? `${pt.actor_name} (${pt.actor_type || 'staff'})` : 'Staff / Owner',
        created_at: pt.created_at
      });
    });

    // Next derive transactions from valid orders to ensure every single order is tracked
    validOrders.forEach(ord => {
      const hasExplicit = explicitTxs.some(pt => pt.order_id === ord.id);
      if (hasExplicit) return; // avoid duplication if explicit transaction row exists

      const isSplit = ord.payment_mode === 'partial' || ((ord.online_amount || 0) > 0 && (ord.cash_amount || 0) > 0);
      const method = isSplit ? 'split' : (ord.payment_mode === 'online' ? 'online' : (ord.payment_mode === 'demo' ? 'demo' : (ord.payment_mode === 'upi_qr' ? 'upi_qr' : 'cash')));

      let statusNormalized: 'paid' | 'pending' | 'partially_paid' | 'failed' = 'pending';
      if (['paid', 'paid_live', 'paid_cash', 'paid_demo'].includes(ord.payment_status)) {
        statusNormalized = 'paid';
      } else if (['partially_paid', 'partial'].includes(ord.payment_status)) {
        statusNormalized = 'partially_paid';
      } else if (ord.payment_status === 'failed') {
        statusNormalized = 'failed';
      } else {
        statusNormalized = 'pending';
      }

      const txId = ord.razorpay_payment_id || ord.razorpay_order_id || ord.upi_ref_number || (statusNormalized === 'paid' ? `TXN_${ord.order_number.replace('#', '')}` : '-');

      const confirmedBy = ord.verified_by
        ? ord.verified_by
        : (ord.payment_actor_name
            ? `${ord.payment_actor_name} (${ord.payment_actor_type || 'staff'})`
            : (['paid_live', 'paid_demo'].includes(ord.payment_status) || method === 'online' ? 'Online Gateway (Auto Verified)' : (statusNormalized === 'paid' ? 'Staff / Owner' : 'Awaiting Cash Collection'))
          );

      const derivedId = `ord_tx_${ord.id}`;
      const onlineAmt = ['paid_live', 'paid_demo'].includes(ord.payment_status) && method === 'online'
        ? Number(ord.grand_total)
        : Number(ord.online_amount || 0);
      const cashAmt = statusNormalized === 'paid' && method === 'cash'
        ? Number(ord.grand_total)
        : Number(ord.cash_amount || 0);
      const cashDue = Math.max(0, Number(ord.grand_total) - (onlineAmt + cashAmt));

      txMap.set(derivedId, {
        id: derivedId,
        order_id: ord.id,
        order_number: ord.order_number,
        table_number: ord.table_number,
        customer_mobile: ord.customer_mobile || undefined,
        payment_method: method,
        total_amount: Number(ord.grand_total || 0),
        online_amount: onlineAmt,
        cash_amount: cashAmt,
        cash_due: statusNormalized === 'paid' ? 0 : cashDue,
        status: statusNormalized,
        transaction_id: txId,
        confirmed_by: confirmedBy,
        created_at: ord.payment_confirmed_at || ord.verified_at || ord.created_at,
        raw_order: ord
      });
    });

    const result = Array.from(txMap.values());
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, paymentTransactions, currentOwner.id, validOrders]);

  const filteredTransactions = useMemo(() => {
    return derivedTransactions.filter(tx => {
      // Method Filter
      if (txFilterMethod !== 'all' && tx.payment_method !== txFilterMethod) return false;
      // Status Filter
      if (txFilterStatus !== 'all' && tx.status !== txFilterStatus) return false;
      // Search Query
      if (txSearchQuery.trim()) {
        const q = txSearchQuery.toLowerCase();
        const matchOrd = tx.order_number.toLowerCase().includes(q);
        const matchTbl = tx.table_number.toLowerCase().includes(q);
        const matchMob = (tx.customer_mobile || '').toLowerCase().includes(q);
        const matchTxId = (tx.transaction_id || '').toLowerCase().includes(q);
        const matchActor = (tx.confirmed_by || '').toLowerCase().includes(q);
        if (!matchOrd && !matchTbl && !matchMob && !matchTxId && !matchActor) return false;
      }
      return true;
    });
  }, [derivedTransactions, txFilterMethod, txFilterStatus, txSearchQuery]);

  // --- STAFF AUDIT LOGS (Filtered by Restaurant & 45-Day Retention) ---
  const restAudits = useMemo(() => {
    return auditLogs.filter(a => a.restaurant_id === currentOwner.id);
  }, [auditLogs, currentOwner.id]);

  const filteredAudits = useMemo(() => {
    let list = restAudits;

    // 45 Days Time Retention Cutoff
    if (auditDaysFilter > 0) {
      const cutoffTime = Date.now() - (auditDaysFilter * 24 * 3600 * 1000);
      list = list.filter(a => new Date(a.created_at).getTime() >= cutoffTime);
    }

    // Role Filter
    if (auditRoleFilter !== 'all') {
      list = list.filter(a => {
        const type = (a.actor_type || '').toLowerCase();
        const role = (a.actor_role || '').toLowerCase();
        if (auditRoleFilter === 'staff') return type === 'staff';
        return type === auditRoleFilter || role === auditRoleFilter;
      });
    }

    // Action Category Filter
    if (auditActionFilter !== 'all') {
      list = list.filter(a => {
        const act = (a.action || '').toUpperCase();
        if (auditActionFilter === 'order') return act.includes('ORDER');
        if (auditActionFilter === 'payment') return act.includes('PAYMENT') || act.includes('CASH') || act.includes('RAZORPAY');
        if (auditActionFilter === 'menu') return act.includes('MENU') || act.includes('CATEGORY');
        if (auditActionFilter === 'table') return act.includes('TABLE');
        if (auditActionFilter === 'staff') return act.includes('STAFF');
        return true;
      });
    }

    // Search Query
    if (auditSearchQuery.trim()) {
      const q = auditSearchQuery.toLowerCase();
      list = list.filter(a => {
        const name = (a.actor_name || '').toLowerCase();
        const act = (a.action || '').toLowerCase();
        const desc = (a.description || '').toLowerCase();
        const ord = (a.order_id || '').toLowerCase();
        return name.includes(q) || act.includes(q) || desc.includes(q) || ord.includes(q);
      });
    }

    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [restAudits, auditDaysFilter, auditRoleFilter, auditActionFilter, auditSearchQuery]);

  // --- CSV EXPORTS ---
  const exportCsv = () => {
    let csv = 'Order Number,Table,Payment Mode,Payment Status,Order Status,Total (INR),Online Paid,Cash Paid,Cash Due,Date\n';
    filteredOrders.forEach(o => {
      csv += `${o.order_number},${o.table_number},${o.payment_mode},${o.payment_status},${o.order_status},${o.grand_total},${o.online_amount || 0},${o.cash_amount || 0},${o.cash_due || 0},${new Date(o.created_at).toLocaleString()}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sales_Report_${currentOwner.slug}.csv`;
    a.click();
    showToast('Sales CSV Report Downloaded!', 'success');
  };

  const exportTransactionsCsv = () => {
    let csv = 'Date & Time,Order Number,Table,Customer Mobile,Method,Total Amount,Online Amount,Cash Amount,Cash Due,Status,Transaction ID,Confirmed By\n';
    filteredTransactions.forEach(tx => {
      csv += `"${new Date(tx.created_at).toLocaleString()}","${tx.order_number}","${tx.table_number}","${tx.customer_mobile || 'N/A'}","${tx.payment_method}","${tx.total_amount}","${tx.online_amount}","${tx.cash_amount}","${tx.cash_due}","${tx.status}","${tx.transaction_id}","${tx.confirmed_by}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payment_Transactions_${currentOwner.slug}.csv`;
    a.click();
    showToast('Payment Transactions CSV Downloaded!', 'success');
  };

  const exportAuditCsv = () => {
    let csv = 'Timestamp,Actor Name,Actor Type,Role,Action,Description,Previous Status,New Status\n';
    filteredAudits.forEach(a => {
      csv += `"${new Date(a.created_at).toLocaleString()}","${a.actor_name}","${a.actor_type || ''}","${a.actor_role || ''}","${a.action}","${(a.description || '').replace(/"/g, '""')}","${a.previous_status || ''}","${a.new_status || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Staff_Audit_Log_45Days_${currentOwner.slug}.csv`;
    a.click();
    showToast('Staff Audit Log CSV Downloaded!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Owner Reports & Audit Logs
          </h2>
          <p className="text-xs text-slate-400">Sales breakdown, payment settlement history & staff audit operational trail</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-900 p-1 rounded-2xl border border-slate-800 flex items-center text-xs">
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'sales' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-4 h-4" /> Lifetime Sales
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'transactions' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" /> Payment Transactions ({derivedTransactions.length})
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'audit' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" /> Staff Audit Log (45 Days)
            </button>
          </div>

          {activeTab === 'sales' ? (
            <button
              onClick={exportCsv}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Export Sales CSV
            </button>
          ) : activeTab === 'transactions' ? (
            <button
              onClick={exportTransactionsCsv}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Export Transactions CSV
            </button>
          ) : (
            <button
              onClick={exportAuditCsv}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Export Audit CSV
            </button>
          )}
        </div>
      </div>

      {/* --- TAB 1: LIFETIME SALES REPORT --- */}
      {activeTab === 'sales' && (
        <>
          {/* Revenue Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                <span>Total Business Volume</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-white">₹{totalSales.toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-emerald-400 font-medium">{totalOrdersCount} Total Orders</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                <span>Online Revenue (Razorpay)</span>
                <CreditCard className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-extrabold text-blue-400">₹{onlineSales.toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-slate-400 font-medium">Verified Online Payments</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                <span>Cash Revenue Collected</span>
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-400">₹{cashSales.toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-slate-400 font-medium">Confirmed Cash Received</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/40 bg-amber-950/20 space-y-1">
              <div className="text-xs font-semibold text-amber-300 flex items-center justify-between">
                <span>Pending / Cash Due</span>
                <AlertCircle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-extrabold text-amber-400">₹{pendingSales.toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-amber-300/80 font-medium">Uncollected Cash Due</div>
            </div>
          </div>

          {/* Mode Filters */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium mr-1">Filter Payment Mode:</span>
            {(['all', 'cash', 'online', 'partial', 'demo'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setSalesFilterMode(mode)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                  salesFilterMode === mode ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Sales Orders Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-4">Order #</th>
                    <th className="p-4">Table</th>
                    <th className="p-4">Mode</th>
                    <th className="p-4">Payment Status</th>
                    <th className="p-4">Online Paid</th>
                    <th className="p-4">Cash Paid</th>
                    <th className="p-4">Cash Due</th>
                    <th className="p-4">Grand Total</th>
                    <th className="p-4 text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        No sales orders found for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-800/40 transition-all">
                        <td className="p-4 font-bold text-white font-mono">{order.order_number}</td>
                        <td className="p-4 text-slate-200">{order.table_number}</td>
                        <td className="p-4">
                          <span className="uppercase font-semibold text-[11px] text-blue-400">{order.payment_mode}</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                            order.payment_status === 'paid_live' || order.payment_status === 'paid' || order.payment_status === 'paid_cash' || order.payment_status === 'paid_demo' ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' :
                            order.payment_status === 'partially_paid' || order.payment_status === 'partial' ? 'bg-purple-950 text-purple-300 border-purple-500/30' :
                            'bg-amber-950 text-amber-400 border-amber-500/30'
                          }`}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="p-4 text-blue-400 font-bold">₹{order.online_amount || 0}</td>
                        <td className="p-4 text-emerald-400 font-bold">₹{order.cash_amount || 0}</td>
                        <td className="p-4 text-amber-400 font-bold">₹{order.cash_due || 0}</td>
                        <td className="p-4 font-extrabold text-white text-sm">₹{order.grand_total}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedBillOrder(order)}
                              className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white font-bold text-xs border border-blue-500/30 transition-all flex items-center gap-1"
                              title="View Digital Bill"
                            >
                              <FileText className="w-3 h-3" /> View
                            </button>
                            <button
                              onClick={() => generateInvoicePdf(order, currentOwner)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
                              title="Download PDF Bill"
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-400" />
                            </button>
                            <button
                              onClick={() => setSelectedBillOrder(order)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
                              title="Print Thermal / A4 Bill"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* --- TAB 2: GRANULAR PAYMENT TRANSACTIONS REPORT --- */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* Summary Stat Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] font-medium text-slate-400">Total Transactions</div>
              <div className="text-xl font-black text-white mt-0.5">{derivedTransactions.length}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] font-medium text-slate-400">Online Transactions</div>
              <div className="text-xl font-black text-blue-400 mt-0.5">
                {derivedTransactions.filter(t => t.payment_method === 'online' || t.payment_method === 'demo').length}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] font-medium text-slate-400">Cash Transactions</div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">
                {derivedTransactions.filter(t => t.payment_method === 'cash').length}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] font-medium text-slate-400">Split / Partial Payments</div>
              <div className="text-xl font-black text-purple-400 mt-0.5">
                {derivedTransactions.filter(t => t.payment_method === 'split').length}
              </div>
            </div>
          </div>

          {/* Filter & Search Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-emerald-400" /> Method:
              </span>
              {(['all', 'online', 'cash', 'split', 'demo'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setTxFilterMethod(m)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold uppercase transition-all ${
                    txFilterMethod === m ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {m}
                </button>
              ))}

              <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

              <span className="text-slate-400 font-semibold">Status:</span>
              {(['all', 'paid', 'pending', 'partially_paid', 'failed'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setTxFilterStatus(s)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold uppercase transition-all ${
                    txFilterStatus === s ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Order #, Table, Mobile, ID..."
                value={txSearchQuery}
                onChange={e => setTxSearchQuery(e.target.value)}
                className="w-full bg-slate-950 text-white placeholder-slate-500 text-xs pl-9 pr-3 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 font-bold text-white text-xs flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Real-Time Payment Settlement Records ({filteredTransactions.length} Entries)
              </span>
              <span className="text-slate-400 text-[11px] font-normal">Scoped to {currentOwner.name}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Order #</th>
                    <th className="p-3.5">Table</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Method</th>
                    <th className="p-3.5">Payment Breakdown</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Transaction ID / Reference</th>
                    <th className="p-3.5">Confirmed By</th>
                    <th className="p-3.5 text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500">
                        No payment transactions recorded for this filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition-all">
                        <td className="p-3.5 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                          {new Date(tx.created_at).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                          })}
                        </td>
                        <td className="p-3.5 font-bold text-white font-mono text-xs">{tx.order_number}</td>
                        <td className="p-3.5 text-slate-200 font-medium">{tx.table_number}</td>
                        <td className="p-3.5 text-slate-300 font-mono text-[11px]">
                          {tx.customer_mobile ? (
                            <span className="flex items-center gap-1 text-slate-300">
                              <Phone className="w-3 h-3 text-slate-500" /> {tx.customer_mobile}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            tx.payment_method === 'online' ? 'bg-blue-950 text-blue-300 border-blue-500/30' :
                            tx.payment_method === 'cash' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30' :
                            tx.payment_method === 'split' ? 'bg-purple-950 text-purple-300 border-purple-500/30' :
                            'bg-amber-950 text-amber-300 border-amber-500/30'
                          }`}>
                            {tx.payment_method}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {tx.payment_method === 'split' ? (
                            <div className="space-y-0.5 text-[11px]">
                              <div className="font-extrabold text-white">Total: ₹{tx.total_amount}</div>
                              <div className="text-blue-400">Online: ₹{tx.online_amount}</div>
                              <div className="text-emerald-400">Cash: ₹{tx.cash_amount}</div>
                              {tx.cash_due > 0 && <div className="text-amber-400">Due: ₹{tx.cash_due}</div>}
                            </div>
                          ) : (
                            <div className="font-extrabold text-white text-sm">₹{tx.total_amount}</div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            tx.status === 'paid' ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' :
                            tx.status === 'partially_paid' ? 'bg-purple-950 text-purple-300 border-purple-500/30' :
                            tx.status === 'failed' ? 'bg-rose-950 text-rose-400 border-rose-500/30' :
                            'bg-amber-950 text-amber-400 border-amber-500/30'
                          }`}>
                            {tx.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-400 max-w-[160px] truncate" title={tx.transaction_id}>
                          {tx.transaction_id}
                        </td>
                        <td className="p-3.5 text-slate-200 font-medium text-[11px]">{tx.confirmed_by}</td>
                        <td className="p-3.5 text-right">
                          {tx.raw_order ? (
                            <button
                              onClick={() => setSelectedBillOrder(tx.raw_order)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white transition-all"
                              title="View Order Bill"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          ) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: STAFF AUDIT LOG (45 DAYS RETENTION) --- */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Header Banner & Retention Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-purple-950/30 border border-purple-500/30 p-4 rounded-2xl gap-3">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
              <Clock className="w-4 h-4 text-purple-400" /> Showing Operational Audit Trail for last <span className="text-white font-black">{auditDaysFilter} Days</span> (45-Day Standard Retention)
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 text-[11px]">Time Horizon:</span>
              {[7, 15, 30, 45, 90, 0].map(days => (
                <button
                  key={days}
                  onClick={() => setAuditDaysFilter(days)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    auditDaysFilter === days ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {days === 0 ? 'All Time' : `${days}D`}
                </button>
              ))}
            </div>
          </div>

          {/* Filters & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Role Filter */}
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-purple-400" /> Role:
              </span>
              {(['all', 'owner', 'waiter', 'kitchen', 'staff'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setAuditRoleFilter(r)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold uppercase transition-all ${
                    auditRoleFilter === r ? 'bg-purple-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {r}
                </button>
              ))}

              <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

              {/* Category Filter */}
              <span className="text-slate-400 font-semibold">Action:</span>
              {(['all', 'order', 'payment', 'menu', 'table', 'staff'] as const).map(c => (
                <button
                  key={c}
                  onClick={() => setAuditActionFilter(c)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold uppercase transition-all ${
                    auditActionFilter === c ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff, action, order..."
                value={auditSearchQuery}
                onChange={e => setAuditSearchQuery(e.target.value)}
                className="w-full bg-slate-950 text-white placeholder-slate-500 text-xs pl-9 pr-3 py-1.5 rounded-xl border border-slate-800 focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>
          </div>

          {/* Audit Trail Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 font-bold text-white text-xs flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                Activity Log Records ({filteredAudits.length} Records)
              </span>
              <span className="text-slate-400 text-[11px]">Real-Time Security Audit</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Actor / User</th>
                    <th className="p-3.5">Role / Type</th>
                    <th className="p-3.5">Action Performed</th>
                    <th className="p-3.5">Activity Description</th>
                    <th className="p-3.5">Status Transition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAudits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No staff audit records found matching the active filters in the last {auditDaysFilter} days.
                      </td>
                    </tr>
                  ) : (
                    filteredAudits.map(log => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-all">
                        <td className="p-3.5 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                          {new Date(log.created_at).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                          })}
                        </td>
                        <td className="p-3.5 font-bold text-white text-xs">{log.actor_name}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            log.actor_type === 'staff' ? 'bg-blue-950 text-blue-400 border-blue-500/30' :
                            log.actor_type === 'owner' ? 'bg-amber-950 text-amber-400 border-amber-500/30' :
                            log.actor_type === 'ceo' ? 'bg-purple-950 text-purple-400 border-purple-500/30' :
                            'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {log.actor_role || log.actor_type}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-purple-300 font-mono text-[11px]">{log.action}</td>
                        <td className="p-3.5 text-slate-200">{log.description || '-'}</td>
                        <td className="p-3.5 text-xs font-mono">
                          {log.previous_status && <span className="text-slate-500">{log.previous_status} → </span>}
                          {log.new_status && <span className="text-emerald-400 font-bold">{log.new_status}</span>}
                          {!log.previous_status && !log.new_status && <span className="text-slate-600">-</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Bill View Modal */}
      {selectedBillOrder && (
        <BillModal
          order={selectedBillOrder}
          restaurant={currentOwner}
          onClose={() => setSelectedBillOrder(null)}
          actorName={currentOwner.owner_name}
        />
      )}
    </div>
  );
};

