import React from 'react';
import { Order, Restaurant } from '../../types';
import { generateInvoicePdf } from '../../utils/pdfGenerator';
import { Printer, Download, X, CheckCircle2, ShieldCheck, CreditCard, Building2, Smartphone } from 'lucide-react';
import { SmartImage } from './SmartImage';

interface BillModalProps {
  order: Order;
  restaurant: Restaurant;
  onClose: () => void;
  actorName?: string;
}

export const BillModal: React.FC<BillModalProps> = ({ order, restaurant, onClose, actorName }) => {
  const billNumber = `BILL-DGM-${new Date(order.created_at).getFullYear()}-${(order.order_number || '000').replace('#', '')}`;
  const onlineAmt = Number(order.online_amount || 0);
  const cashAmt = Number(order.cash_amount || 0);
  const totalPaid = onlineAmt + cashAmt;
  const grandTotal = Number(order.grand_total || 0);
  const cashDue = Number(order.cash_due ?? Math.max(0, grandTotal - totalPaid));

  const isPaid = order.payment_status === 'paid_live' || order.payment_status === 'paid' || order.payment_status === 'paid_cash' || order.payment_status === 'paid_demo' || (totalPaid >= grandTotal && grandTotal > 0);
  const isPartiallyPaid = !isPaid && (order.payment_status === 'partially_paid' || order.payment_status === 'partial' || totalPaid > 0);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    generateInvoicePdf(order, restaurant);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in no-print-bg">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Top Action Bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-xs">{billNumber}</h3>
              <p className="text-[10px] text-slate-400">Order {order.order_number} • Table {order.table_number}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              title="Print to thermal receipt or A4 printer"
            >
              <Printer className="w-3.5 h-3.5" /> Print Bill
            </button>

            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              title="Download PDF Receipt"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Printable Bill Container */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          <div
            id="printable-bill"
            className="bg-white text-slate-950 p-6 md:p-8 rounded-2xl shadow-xl font-sans text-xs space-y-4 max-w-md mx-auto border border-slate-200"
          >
            {/* Header / Restaurant Info */}
            <div className="text-center space-y-1 pb-3 border-b border-slate-300">
              <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">
                DigiMoms Smart Restaurant OS
              </div>

              {restaurant.logo && (
                <SmartImage
                  src={restaurant.logo}
                  alt={restaurant.name}
                  className="w-12 h-12 rounded-xl object-cover mx-auto my-1.5 border border-slate-200"
                />
              )}

              <h2 className="text-base font-extrabold text-slate-900 tracking-tight uppercase">
                {restaurant.name}
              </h2>

              {restaurant.address && (
                <p className="text-[11px] text-slate-600 leading-tight">
                  {restaurant.address}
                </p>
              )}

              {(restaurant.contact_mobile || restaurant.owner_mobile || restaurant.contact_email) && (
                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-medium pt-0.5">
                  {(restaurant.contact_mobile || restaurant.owner_mobile) && (
                    <span>Ph: <strong>{restaurant.contact_mobile || restaurant.owner_mobile}</strong></span>
                  )}
                  {restaurant.contact_email && (
                    <span>Email: <strong>{restaurant.contact_email}</strong></span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500 font-medium pt-0.5">
                {restaurant.gst && <span>GSTIN: <strong>{restaurant.gst}</strong></span>}
                {restaurant.fssai && <span>FSSAI Lic: <strong>{restaurant.fssai}</strong></span>}
              </div>
            </div>

            {/* Invoice Meta Bar */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Bill Reference</span>
                <strong className="text-slate-900 font-mono text-xs">{billNumber}</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Order & Table</span>
                <strong className="text-slate-900 font-mono text-xs">{order.order_number} • Table {order.table_number}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Date & Time</span>
                <span className="text-slate-700 font-medium">{new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[9px] uppercase font-bold">Payment Status</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase inline-block border ${
                  isPaid ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                  isPartiallyPaid ? 'bg-purple-100 text-purple-800 border-purple-300' :
                  'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  {isPaid ? 'PAID' : isPartiallyPaid ? 'PARTIALLY PAID' : 'PENDING'}
                </span>
              </div>
              {order.customer_mobile && (
                <div className="col-span-2 pt-1 border-t border-slate-200 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Guest Contact:</span>
                  <strong className="text-slate-900">{order.customer_mobile}</strong>
                </div>
              )}
            </div>

            {/* Food Items Table */}
            <div className="space-y-1">
              <div className="grid grid-cols-12 gap-1 font-bold text-[10px] text-slate-500 uppercase pb-1 border-b border-slate-300">
                <div className="col-span-6">Food Item</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>

              <div className="divide-y divide-slate-100">
                {(order.items || []).map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-1 py-1.5 text-[11px] text-slate-800 items-center">
                    <div className="col-span-6 font-semibold">
                      {item.menu_name}
                      {item.special_instructions && (
                        <span className="block text-[9px] text-slate-500 italic">Note: {item.special_instructions}</span>
                      )}
                    </div>
                    <div className="col-span-2 text-center font-mono font-bold">{item.quantity}</div>
                    <div className="col-span-2 text-right font-mono text-slate-600">₹{item.price}</div>
                    <div className="col-span-2 text-right font-mono font-bold text-slate-900">₹{(item.quantity * item.price).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="pt-2 border-t border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono font-semibold">₹{(order.subtotal || 0).toFixed(2)}</span>
              </div>

              {(order.tax || 0) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST Tax</span>
                  <span className="font-mono font-semibold">₹{(order.tax || 0).toFixed(2)}</span>
                </div>
              )}

              {(order.packaging_charge || 0) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Packaging Charge</span>
                  <span className="font-mono font-semibold">₹{(order.packaging_charge || 0).toFixed(2)}</span>
                </div>
              )}

              {(order.service_charge || 0) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Service Charge</span>
                  <span className="font-mono font-semibold">₹{(order.service_charge || 0).toFixed(2)}</span>
                </div>
              )}

              {(order.online_discount || 0) > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>⚡ Online Pay Discount</span>
                  <span className="font-mono">-₹{(order.online_discount || 0).toFixed(2)}</span>
                </div>
              )}

              {(order.coupon_discount || 0) > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>🎟️ Coupon Discount ({order.coupon_code || 'PROMO'})</span>
                  <span className="font-mono">-₹{(order.coupon_discount || 0).toFixed(2)}</span>
                </div>
              )}

              {!order.online_discount && !order.coupon_discount && (order.discount || 0) > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount</span>
                  <span className="font-mono">-₹{(order.discount || 0).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-300">
                <span>GRAND TOTAL</span>
                <span className="font-mono text-emerald-700 text-base">₹{(order.grand_total || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Settlement Breakdown */}
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 space-y-1 text-[10.5px]">
              <div className="font-bold text-slate-700 text-[10px] uppercase border-b border-slate-200 pb-1">
                Payment Settlement Breakdown
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Online Paid (Razorpay Gateway)</span>
                <strong className="font-mono text-blue-700">₹{onlineAmt.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Cash Paid</span>
                <strong className="font-mono text-emerald-700">₹{cashAmt.toFixed(2)}</strong>
              </div>
              {cashDue > 0 && (
                <div className="flex justify-between text-amber-800 font-bold">
                  <span>Cash Pending / Due</span>
                  <strong className="font-mono">₹{cashDue.toFixed(2)}</strong>
                </div>
              )}

              {order.razorpay_payment_id && (
                <div className="text-[9.5px] font-mono text-slate-500 pt-1 border-t border-slate-200">
                  Razorpay Txn ID: {order.razorpay_payment_id}
                </div>
              )}

              {(actorName || order.verified_by) && (
                <div className="text-[9.5px] text-slate-500">
                  Payment Verified By: <strong>{actorName || order.verified_by}</strong>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-3 border-t border-slate-200 space-y-0.5">
              <p className="font-serif italic text-slate-600 text-[11px]">Thank you for dining with us!</p>
              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                Powered by DigiMoms Smart Restaurant OS
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
