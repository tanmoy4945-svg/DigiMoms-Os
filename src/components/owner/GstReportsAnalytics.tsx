import React, { useState, useMemo } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import {
  Receipt, Download, Printer, FileSpreadsheet, ShieldCheck,
  Calendar, Search, Filter, AlertCircle, ArrowUpRight,
  TrendingUp, CheckCircle2, ChevronRight, FileText, ExternalLink,
  Trash2, AlertTriangle, X, Database
} from 'lucide-react';
import { Order } from '../../types';
import { BillModal } from '../common/BillModal';
import { generateMonthlyGstReportPdf, formatTableNumber } from '../../utils/pdfGenerator';

interface GstReportsAnalyticsProps {
  onOpenSettings?: () => void;
}

export const GstReportsAnalytics: React.FC<GstReportsAnalyticsProps> = ({ onOpenSettings }) => {
  const { currentOwner, orders, showToast, deleteOrdersByMonth } = useSaaS();

  const [selectedBillOrder, setSelectedBillOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'online' | 'cash'>('all');

  // Generate current & previous month keys e.g. "2026-09" & "2026-08"
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [targetMonthToDelete, setTargetMonthToDelete] = useState<string>(prevMonthKey);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  if (!currentOwner) return null;

  // Filter restaurant orders (non-cancelled)
  const restOrders = useMemo(() => {
    return orders.filter(o => o.restaurant_id === currentOwner.id && o.order_status !== 'cancelled');
  }, [orders, currentOwner.id]);

  // Current and Last Month separated orders for 2-month summary
  const currentMonthOrders = useMemo(() => {
    return restOrders.filter(o => {
      const d = new Date(o.created_at);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return mKey === currentMonthKey;
    });
  }, [restOrders, currentMonthKey]);

  const prevMonthOrders = useMemo(() => {
    return restOrders.filter(o => {
      const d = new Date(o.created_at);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return mKey === prevMonthKey;
    });
  }, [restOrders, prevMonthKey]);

  const currentMonthSummary = useMemo(() => {
    let gst = 0;
    let taxable = 0;
    currentMonthOrders.forEach(o => {
      gst += Number(o.tax || 0);
      taxable += Number(o.subtotal || 0);
    });
    return { count: currentMonthOrders.length, gst: Number(gst.toFixed(2)), taxable: Number(taxable.toFixed(2)) };
  }, [currentMonthOrders]);

  const prevMonthSummary = useMemo(() => {
    let gst = 0;
    let taxable = 0;
    prevMonthOrders.forEach(o => {
      gst += Number(o.tax || 0);
      taxable += Number(o.subtotal || 0);
    });
    return { count: prevMonthOrders.length, gst: Number(gst.toFixed(2)), taxable: Number(taxable.toFixed(2)) };
  }, [prevMonthOrders]);

  // Orders to delete based on targetMonthToDelete
  const targetOrdersToDelete = useMemo(() => {
    return restOrders.filter(o => {
      const d = new Date(o.created_at);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return mKey === targetMonthToDelete;
    });
  }, [restOrders, targetMonthToDelete]);

  // Strictly limit GST reporting to the Last 2 Months only (Current Month & Last Month)
  const availableMonths = useMemo(() => {
    return [currentMonthKey, prevMonthKey];
  }, [currentMonthKey, prevMonthKey]);

  // Month label helper e.g. "September 2026"
  const formatMonthLabel = (mKey: string): string => {
    if (mKey === 'all') return 'All Time / Full Financial Year';
    const [year, month] = mKey.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  };

  // Filter orders by selected month
  const monthOrders = useMemo(() => {
    return restOrders.filter(o => {
      if (selectedMonth !== 'all') {
        const d = new Date(o.created_at);
        const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (mKey !== selectedMonth) return false;
      }

      // Payment filter
      if (paymentFilter === 'paid') {
        const isPaid = ['paid_live', 'paid', 'paid_cash', 'paid_demo', 'paid_online'].includes(o.payment_status);
        if (!isPaid) return false;
      } else if (paymentFilter === 'online') {
        if (o.payment_mode !== 'online' && o.payment_mode !== 'upi_qr') return false;
      } else if (paymentFilter === 'cash') {
        if (o.payment_mode !== 'cash') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const ordNum = (o.order_number || '').toLowerCase();
        const tbl = (o.table_number || '').toLowerCase();
        const mob = (o.customer_mobile || '').toLowerCase();
        if (!ordNum.includes(q) && !tbl.includes(q) && !mob.includes(q)) return false;
      }

      return true;
    });
  }, [restOrders, selectedMonth, paymentFilter, searchQuery]);

  // Financial summary for selected month
  const summary = useMemo(() => {
    let totalTaxableSales = 0;
    let totalGst = 0;
    let grossBilled = 0;

    monthOrders.forEach(o => {
      const taxable = Number(o.subtotal || 0);
      const tax = Number(o.tax || 0);
      const grand = Number(o.grand_total || 0);

      totalTaxableSales += taxable;
      totalGst += tax;
      grossBilled += grand;
    });

    const totalCgst = Number((totalGst / 2).toFixed(2));
    const totalSgst = Number((totalGst / 2).toFixed(2));
    const orderCount = monthOrders.length;
    const avgGstPerOrder = orderCount > 0 ? Number((totalGst / orderCount).toFixed(2)) : 0;

    return {
      totalTaxableSales: Number(totalTaxableSales.toFixed(2)),
      totalCgst,
      totalSgst,
      totalGst: Number(totalGst.toFixed(2)),
      grossBilled: Number(grossBilled.toFixed(2)),
      orderCount,
      avgGstPerOrder
    };
  }, [monthOrders]);

  // Annual / Monthly historical comparison
  const monthlyHistory = useMemo(() => {
    const map = new Map<string, {
      monthKey: string;
      label: string;
      taxable: number;
      cgst: number;
      sgst: number;
      gst: number;
      gross: number;
      count: number;
    }>();

    availableMonths.forEach(mKey => {
      map.set(mKey, {
        monthKey: mKey,
        label: formatMonthLabel(mKey),
        taxable: 0,
        cgst: 0,
        sgst: 0,
        gst: 0,
        gross: 0,
        count: 0
      });
    });

    restOrders.forEach(o => {
      const d = new Date(o.created_at);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const entry = map.get(mKey);
      if (entry) {
        const taxable = Number(o.subtotal || 0);
        const tax = Number(o.tax || 0);
        const grand = Number(o.grand_total || 0);

        entry.taxable += taxable;
        entry.gst += tax;
        entry.gross += grand;
        entry.count += 1;
      }
    });

    return Array.from(map.values()).map(e => ({
      ...e,
      taxable: Number(e.taxable.toFixed(2)),
      cgst: Number((e.gst / 2).toFixed(2)),
      sgst: Number((e.gst / 2).toFixed(2)),
      gst: Number(e.gst.toFixed(2)),
      gross: Number(e.gross.toFixed(2))
    }));
  }, [restOrders, availableMonths]);

  // Export to CSV
  const handleExportCsv = () => {
    if (monthOrders.length === 0) {
      showToast('No orders found in this month to export.', 'info');
      return;
    }

    const headers = [
      'Sl No',
      'Invoice / Bill Ref',
      'Order No',
      'Date & Time (IST)',
      'Table',
      'Customer Mobile',
      'Payment Status',
      'Payment Mode',
      'Taxable Value / Food Sales (Rs)',
      'CGST (2.5%) (Rs)',
      'SGST (2.5%) (Rs)',
      'Total GST (5%) (Rs)',
      'Packaging Charge (Rs)',
      'Service Charge (Rs)',
      'Discount (Rs)',
      'Grand Total (Rs)'
    ];

    const rows = monthOrders.map((o, idx) => {
      const ordYear = new Date(o.created_at).getFullYear();
      const cleanNum = (o.order_number || '000').replace('#', '');
      const billRef = `INV-DGM-${ordYear}-${cleanNum}`;
      const dateStr = new Date(o.created_at).toLocaleString('en-IN');
      const cleanTbl = formatTableNumber(o.table_number);
      const taxAmt = Number(o.tax || 0);
      const halfTax = (taxAmt / 2).toFixed(2);
      const discount = Number((o.online_discount || 0) + (o.coupon_discount || 0) + (o.discount || 0));

      return [
        idx + 1,
        `"${billRef}"`,
        `"${o.order_number || ''}"`,
        `"${dateStr}"`,
        `"${cleanTbl}"`,
        `"${o.customer_mobile || ''}"`,
        `"${o.payment_status || 'pending'}"`,
        `"${o.payment_mode || 'cash'}"`,
        Number(o.subtotal || 0).toFixed(2),
        halfTax,
        halfTax,
        taxAmt.toFixed(2),
        Number(o.packaging_charge || 0).toFixed(2),
        Number(o.service_charge || 0).toFixed(2),
        discount.toFixed(2),
        Number(o.grand_total || 0).toFixed(2)
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `GST_Register_${currentOwner.name.replace(/\s+/g, '_')}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('GST register exported to CSV successfully!', 'success');
  };

  // Download PDF
  const handleDownloadPdf = () => {
    generateMonthlyGstReportPdf(
      currentOwner,
      formatMonthLabel(selectedMonth),
      summary,
      monthOrders
    );
    showToast('Monthly GST Report PDF downloaded to your device!', 'success');
  };

  // Purge selected month orders to free up database storage
  const handleDeleteMonthOrders = async () => {
    const monthKey = targetMonthToDelete || selectedMonth;
    if (!currentOwner || monthKey === 'all') return;
    setIsDeleting(true);
    const res = await deleteOrdersByMonth(currentOwner.id, monthKey);
    setIsDeleting(false);
    setShowDeleteModal(false);
    if (res.success) {
      showToast(`🎉 Cleaned ${res.count} orders from ${formatMonthLabel(monthKey)}! Database storage freed.`, 'success');
      setSelectedMonth(currentMonthKey);
    } else {
      showToast(`Error deleting orders: ${res.error || 'Failed'}`, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner / Compliance Status */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Receipt className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-white">Monthly GST Collection & Tax Accounting</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Track total GST collected from customers each month (CGST 2.5% + SGST 2.5%), generate Chartered Accountant (CA) filing reports, and monitor taxable turnover for GSTR-3B / GSTR-1 compliance.
          </p>
        </div>

        {/* GSTIN Badge or Prompt */}
        <div className="flex items-center gap-3 shrink-0">
          {currentOwner.gst ? (
            <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-right">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 justify-end">
                <ShieldCheck className="w-4 h-4" /> GSTIN Verified & Active
              </div>
              <div className="font-mono text-xs font-black text-white mt-0.5 tracking-wider">
                {currentOwner.gst}
              </div>
              <div className="text-[10px] text-slate-400">Rate: 5% (CGST 2.5% + SGST 2.5%)</div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-right">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 justify-end">
                <AlertCircle className="w-4 h-4" /> GSTIN Not Configured
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">GST is optional. Add in Settings to print on bills.</div>
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="mt-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                >
                  Configure GSTIN Now →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2-Month GST Ledger & Storage Optimization Banner */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-emerald-500/40 space-y-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-2">
                2-Month GST Ledger & Storage Optimization
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                  Last 2 Months Hisab
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                গত ২ মাসের জিএসটি হিসাব মনিটর করুন। বিগত মাসের ডাটা ডাউনলোড করে ডাটাবেজ থেকে ডিলিট করতে পারেন যাতে স্টোরেজের চাপ কমে যায়।
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Month 1: Current Month */}
          <div
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedMonth === currentMonthKey
                ? 'bg-slate-950 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
            onClick={() => setSelectedMonth(currentMonthKey)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> মাস ১: {formatMonthLabel(currentMonthKey)} (Current Active)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                চলতি মাস (Active)
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mt-3 pt-2 border-t border-slate-800/80">
              <div>
                <div className="text-[10px] text-slate-400 font-medium">Orders Count</div>
                <div className="text-base font-extrabold text-white font-mono">{currentMonthSummary.count}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-medium">Taxable Sales</div>
                <div className="text-base font-extrabold text-blue-400 font-mono">₹{currentMonthSummary.taxable}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-medium">Total GST (5%)</div>
                <div className="text-base font-extrabold text-emerald-400 font-mono">₹{currentMonthSummary.gst}</div>
              </div>
            </div>
          </div>

          {/* Month 2: Previous Month (with 1-Click Delete Storage Option) */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              selectedMonth === prevMonthKey
                ? 'bg-slate-950 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
                onClick={() => setSelectedMonth(prevMonthKey)}
              >
                <Calendar className="w-3.5 h-3.5 text-blue-400" /> মাস ২: {formatMonthLabel(prevMonthKey)} (Last Month)
              </span>
              {prevMonthSummary.count > 0 ? (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  Audit Ready
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Storage Cleaned
                </span>
              )}
            </div>

            <div
              className="grid grid-cols-3 gap-2 text-center mt-3 pt-2 border-t border-slate-800/80 cursor-pointer"
              onClick={() => setSelectedMonth(prevMonthKey)}
            >
              <div>
                <div className="text-[10px] text-slate-400 font-medium">Orders Count</div>
                <div className="text-base font-extrabold text-white font-mono">{prevMonthSummary.count}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-medium">Taxable Sales</div>
                <div className="text-base font-extrabold text-blue-400 font-mono">₹{prevMonthSummary.taxable}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-medium">Total GST (5%)</div>
                <div className="text-base font-extrabold text-emerald-400 font-mono">₹{prevMonthSummary.gst}</div>
              </div>
            </div>

            {/* Storage Clean & Delete Action for Last Month */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <button
                onClick={() => setSelectedMonth(prevMonthKey)}
                className="text-[11px] font-bold text-slate-300 hover:text-white underline cursor-pointer"
              >
                View {formatMonthLabel(prevMonthKey)} Bills →
              </button>

              {prevMonthSummary.count > 0 ? (
                <button
                  onClick={() => {
                    setTargetMonthToDelete(prevMonthKey);
                    setShowDeleteModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                  title="Delete last month's orders to save cloud database storage"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Last Month ({prevMonthSummary.count} Orders)
                </button>
              ) : (
                <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Storage Free
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Month Selector & Filters */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector Dropdown */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-300">Reporting Period:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:border-emerald-500 outline-none cursor-pointer"
            >
              {availableMonths.map(mKey => (
                <option key={mKey} value={mKey}>
                  {formatMonthLabel(mKey)} {mKey === currentMonthKey ? '(Current Month)' : ''}
                </option>
              ))}
              <option value="all">All Time / Full Financial Year</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:border-emerald-500 outline-none cursor-pointer"
            >
              <option value="all">All Payment Statuses</option>
              <option value="paid">Fully Settled / Paid Only</option>
              <option value="online">Online / UPI Orders</option>
              <option value="cash">Cash Counter Orders</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search Invoice #, Table, Mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:border-emerald-500 outline-none w-52"
            />
          </div>
        </div>

        {/* Action Buttons: Export & Storage Cleanup */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedMonth !== 'all' && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-bold text-xs border border-rose-500/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Delete this month's orders to save database storage"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Free Up Storage
            </button>
          )}

          <button
            onClick={handleDownloadPdf}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download official PDF report for CA / Accountant"
          >
            <Download className="w-3.5 h-3.5" /> Monthly GST Report (PDF)
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Export full order register to Excel / CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Excel / CSV
          </button>
        </div>
      </div>

      {/* Quick Last 2 Months Period Switcher */}
      <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-bold text-slate-300">Quick 2-Month GST Periods:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedMonth(currentMonthKey)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedMonth === currentMonthKey
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Current Month ({formatMonthLabel(currentMonthKey)})</span>
            </button>

            <button
              onClick={() => setSelectedMonth(prevMonthKey)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedMonth === prevMonthKey
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Last Month ({formatMonthLabel(prevMonthKey)})</span>
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-400">
          Showing <span className="font-bold text-white">{monthOrders.length}</span> orders for <strong className="text-emerald-400">{formatMonthLabel(selectedMonth)}</strong>
        </div>
      </div>

      {/* KPI Cards for the Selected Month */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total GST Collected */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-2">
            <span>Total GST Collected</span>
            <Receipt className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ₹{summary.totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[11px] text-slate-300">
            <span>CGST (2.5%): <strong className="font-mono text-emerald-400">₹{summary.totalCgst}</strong></span>
            <span>SGST (2.5%): <strong className="font-mono text-emerald-400">₹{summary.totalSgst}</strong></span>
          </div>
        </div>

        {/* Taxable Food Sales */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
            <span>Taxable Food Sales</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ₹{summary.totalTaxableSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            Food Sales Subtotal before tax
          </div>
        </div>

        {/* Gross Customer Billing */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
            <span>Gross Customer Billing</span>
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ₹{summary.grossBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            Food sales + GST + packaging charges
          </div>
        </div>

        {/* Orders Count & Average */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
            <span>GST Invoiced Orders</span>
            <FileText className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {summary.orderCount} <span className="text-xs text-slate-400 font-normal">Bills</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            Avg GST: <strong className="font-mono text-purple-300">₹{summary.avgGstPerOrder}</strong> / order
          </div>
        </div>
      </div>

      {/* Itemized Orders GST Tax Register Table */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Detailed GST Tax Register — {formatMonthLabel(selectedMonth)}
            </h3>
            <p className="text-xs text-slate-400">
              Complete invoice-by-invoice breakdown of taxable food value, CGST, SGST, and total billing.
            </p>
          </div>

          <span className="text-xs font-bold text-slate-400">
            Showing <strong className="text-white">{monthOrders.length}</strong> Invoices
          </span>
        </div>

        {monthOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No orders found for this selected period or filter.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-bold uppercase tracking-wider bg-slate-950/60">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Invoice Ref</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Table / Guest</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Taxable (Rs)</th>
                  <th className="py-3 px-3 text-right">CGST (2.5%)</th>
                  <th className="py-3 px-3 text-right">SGST (2.5%)</th>
                  <th className="py-3 px-3 text-right">Total GST</th>
                  <th className="py-3 px-3 text-right">Invoice Total</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {monthOrders.map((ord, idx) => {
                  const ordYear = new Date(ord.created_at).getFullYear();
                  const cleanNum = (ord.order_number || '000').replace('#', '');
                  const billRef = `INV-DGM-${ordYear}-${cleanNum}`;
                  const tax = Number(ord.tax || 0);
                  const half = (tax / 2).toFixed(2);
                  const isPaid = ['paid_live', 'paid', 'paid_cash', 'paid_demo', 'paid_online'].includes(ord.payment_status);

                  return (
                    <tr key={ord.id || idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 text-slate-500 font-sans">{idx + 1}</td>
                      <td className="py-3 px-3 font-bold text-white">
                        {billRef}
                        <span className="block text-[10px] text-slate-500 font-normal font-sans">
                          Order {ord.order_number}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-sans">
                        {new Date(ord.created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-sans">
                        {formatTableNumber(ord.table_number)}
                        {ord.customer_mobile && (
                          <span className="block text-[10px] text-slate-500 font-mono">
                            {ord.customer_mobile}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase inline-block border ${
                          isPaid ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' :
                          'bg-amber-950 text-amber-400 border-amber-500/30'
                        }`}>
                          {isPaid ? 'Paid' : 'Pending'} ({ord.payment_mode || 'cash'})
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300">
                        ₹{Number(ord.subtotal || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400">
                        ₹{half}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400">
                        ₹{half}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        ₹{tax.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-white">
                        ₹{Number(ord.grand_total || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setSelectedBillOrder(ord)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition-all border border-slate-700 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3 h-3 text-blue-400" /> Bill
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-slate-700 bg-slate-950 font-bold text-xs text-white">
                <tr>
                  <td colSpan={5} className="py-3 px-3 text-slate-300">
                    TOTALS ({monthOrders.length} Invoices):
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    ₹{summary.totalTaxableSales.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    ₹{summary.totalCgst.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    ₹{summary.totalSgst.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-400">
                    ₹{summary.totalGst.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-white">
                    ₹{summary.grossBilled.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Month-by-Month Historical Annual Comparison Table */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              Monthly Historical GST Breakdown (CA Filing Ready)
            </h3>
            <p className="text-xs text-slate-400">
              Aggregated monthly tax returns summary for quick quarterly (GSTR-3B) and annual (GSTR-9) audit.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-bold uppercase tracking-wider bg-slate-950/60">
                <th className="py-3 px-3">Reporting Month</th>
                <th className="py-3 px-3 text-center">Orders</th>
                <th className="py-3 px-3 text-right">Taxable Turnover (Rs)</th>
                <th className="py-3 px-3 text-right">CGST (2.5%) (Rs)</th>
                <th className="py-3 px-3 text-right">SGST (2.5%) (Rs)</th>
                <th className="py-3 px-3 text-right">Total GST Collected (Rs)</th>
                <th className="py-3 px-3 text-right">Gross Sales (Rs)</th>
                <th className="py-3 px-3 text-center">Select Period</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {monthlyHistory.map(row => {
                const isSelected = row.monthKey === selectedMonth;
                return (
                  <tr
                    key={row.monthKey}
                    className={`transition-colors ${isSelected ? 'bg-emerald-950/30' : 'hover:bg-slate-800/30'}`}
                  >
                    <td className="py-3 px-3 font-sans font-bold text-white flex items-center gap-2">
                      {row.label}
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-300 font-sans">{row.count}</td>
                    <td className="py-3 px-3 text-right text-slate-300">₹{row.taxable.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right text-slate-400">₹{row.cgst.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right text-slate-400">₹{row.sgst.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-400">₹{row.gst.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-bold text-white">₹{row.gross.toFixed(2)}</td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setSelectedMonth(row.monthKey)}
                        className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {isSelected ? 'Viewing' : 'View Month'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill View / Print Modal */}
      {selectedBillOrder && (
        <BillModal
          order={selectedBillOrder}
          restaurant={currentOwner}
          onClose={() => setSelectedBillOrder(null)}
          actorName={currentOwner.owner_name}
        />
      )}

      {/* Storage Cleanup Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/40 rounded-3xl p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Free Up Database Storage</h3>
                <p className="text-xs text-rose-300 font-medium">Delete Orders from {formatMonthLabel(targetMonthToDelete || selectedMonth)}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Permanent Database Deletion Notice</span>
              </div>
              <p className="leading-relaxed text-[11px] text-slate-300">
                You are about to permanently delete <strong>{targetOrdersToDelete.length} orders</strong> from <strong>{formatMonthLabel(targetMonthToDelete || selectedMonth)}</strong> from your database.
              </p>
              <p className="text-[11px] text-amber-300">
                💡 <strong>Important:</strong> We strongly recommend downloading your GST Excel / CSV report first so you retain permanent offline tax and audit records.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedMonth(targetMonthToDelete);
                  handleExportCsv();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Download Excel Backup First (Recommended)</span>
              </button>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDeleteMonthOrders}
                  disabled={isDeleting || targetOrdersToDelete.length === 0}
                  className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <span>Purging from DB...</span>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Confirm & Free Storage</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
