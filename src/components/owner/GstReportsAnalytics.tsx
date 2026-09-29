import React, { useState, useMemo } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import {
  Receipt, Download, Printer, FileSpreadsheet, ShieldCheck,
  Calendar, Search, Filter, AlertCircle, ArrowUpRight,
  TrendingUp, CheckCircle2, ChevronRight, FileText, ExternalLink
} from 'lucide-react';
import { Order } from '../../types';
import { BillModal } from '../common/BillModal';
import { generateMonthlyGstReportPdf, formatTableNumber } from '../../utils/pdfGenerator';

interface GstReportsAnalyticsProps {
  onOpenSettings?: () => void;
}

export const GstReportsAnalytics: React.FC<GstReportsAnalyticsProps> = ({ onOpenSettings }) => {
  const { currentOwner, orders, showToast } = useSaaS();

  const [selectedBillOrder, setSelectedBillOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'online' | 'cash'>('all');

  // Generate current month key e.g. "2026-09"
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);

  if (!currentOwner) return null;

  // Filter restaurant orders (non-cancelled)
  const restOrders = useMemo(() => {
    return orders.filter(o => o.restaurant_id === currentOwner.id && o.order_status !== 'cancelled');
  }, [orders, currentOwner.id]);

  // Extract all unique months from orders
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    // Always include current month
    monthsSet.add(currentMonthKey);

    restOrders.forEach(o => {
      if (o.created_at) {
        const d = new Date(o.created_at);
        const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthsSet.add(mKey);
      }
    });

    return Array.from(monthsSet).sort().reverse();
  }, [restOrders, currentMonthKey]);

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

        {/* Action Buttons: Export & Print */}
        <div className="flex items-center gap-2">
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
    </div>
  );
};
