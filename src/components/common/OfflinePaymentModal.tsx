import React, { useState, useEffect } from 'react';
import { Order, OfflinePaymentMethod } from '../../types';
import { useSaaS } from '../../context/SaaSContext';
import { 
  X, CreditCard, Banknote, QrCode, Plus, Trash2, 
  CheckCircle, AlertCircle, History, Clock, ArrowRight, ShieldCheck 
} from 'lucide-react';

interface OfflinePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  actorName?: string;
  actorType?: 'owner' | 'staff';
}

interface PaymentRow {
  id: string;
  method: OfflinePaymentMethod;
  amount: string;
  reference: string;
  note: string;
}

export const OfflinePaymentModal: React.FC<OfflinePaymentModalProps> = ({
  isOpen,
  onClose,
  order,
  actorName,
  actorType = 'staff'
}) => {
  const { recordOfflinePayment } = useSaaS();

  const [rows, setRows] = useState<PaymentRow[]>([
    { id: '1', method: 'cash', amount: '', reference: '', note: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Calculate current financials for the order
  const grandTotal = order ? order.grand_total : 0;
  const onlineAmount = order ? (order.online_amount || 0) : 0;
  const offlineAmount = order ? (order.cash_amount || 0) : 0;
  const totalPaid = Number((onlineAmount + offlineAmount).toFixed(2));
  const remainingDue = order ? (order.cash_due !== undefined ? order.cash_due : Math.max(0, Number((grandTotal - totalPaid).toFixed(2)))) : 0;

  useEffect(() => {
    if (order && isOpen) {
      setRows([
        { id: '1', method: 'cash', amount: remainingDue > 0 ? remainingDue.toString() : '', reference: '', note: '' }
      ]);
      setShowHistory(false);
    }
  }, [order, isOpen, remainingDue]);

  if (!isOpen || !order) return null;

  const totalEntering = rows.reduce((sum, r) => {
    const val = parseFloat(r.amount);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const balanceAfter = Number(Math.max(0, remainingDue - totalEntering).toFixed(2));
  const isOverpaying = totalEntering > remainingDue + 0.01;
  const isValid = totalEntering > 0 && !isOverpaying && !isSubmitting;

  const handleAddRow = () => {
    const remainingToAllocate = Math.max(0, remainingDue - totalEntering);
    setRows(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        method: 'upi',
        amount: remainingToAllocate > 0 ? remainingToAllocate.toString() : '',
        reference: '',
        note: ''
      }
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length === 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const handleRowChange = (id: string, field: keyof PaymentRow, value: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleQuickPay = async (method: OfflinePaymentMethod) => {
    if (remainingDue <= 0) return;
    setIsSubmitting(true);
    const success = await recordOfflinePayment(
      order.id,
      [{ method, amount: remainingDue, note: `Full quick ${method.toUpperCase()} collection` }],
      actorName,
      actorType
    );
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const payload = rows
      .filter(r => parseFloat(r.amount) > 0)
      .map(r => ({
        method: r.method,
        amount: parseFloat(r.amount),
        reference: r.reference.trim() || undefined,
        note: r.note.trim() || undefined
      }));

    if (payload.length === 0) return;

    setIsSubmitting(true);
    const success = await recordOfflinePayment(order.id, payload, actorName, actorType);
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  const pastOfflineRecords = order.offline_payments || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Record Offline Payment</h3>
              <p className="text-xs text-slate-400">
                Order <span className="text-white font-semibold">{order.order_number}</span> • Table <span className="text-white font-semibold">{order.table_number}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Financial Summary Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700/60 grid grid-cols-3 gap-3 text-center">
            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Grand Total</p>
              <p className="text-base font-bold text-slate-800 dark:text-slate-100">₹{grandTotal}</p>
            </div>
            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Paid So Far</p>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">₹{totalPaid}</p>
            </div>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800/40 shadow-sm">
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold">Remaining Due</p>
              <p className="text-base font-extrabold text-amber-600 dark:text-amber-300">₹{remainingDue}</p>
            </div>
          </div>

          {/* Quick 1-Tap Full Settlement Buttons */}
          {remainingDue > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Quick 1-Tap Settlement (Full ₹{remainingDue})
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickPay('cash')}
                  disabled={isSubmitting}
                  className="flex flex-col items-center justify-center p-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 transition-all font-medium text-xs active:scale-95 disabled:opacity-50"
                >
                  <Banknote className="w-4 h-4 mb-1 text-emerald-600 dark:text-emerald-400" />
                  <span>Full Cash</span>
                  <span className="text-[10px] text-emerald-600 font-bold">₹{remainingDue}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickPay('upi')}
                  disabled={isSubmitting}
                  className="flex flex-col items-center justify-center p-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-xl text-indigo-700 dark:text-indigo-300 transition-all font-medium text-xs active:scale-95 disabled:opacity-50"
                >
                  <QrCode className="w-4 h-4 mb-1 text-indigo-600 dark:text-indigo-400" />
                  <span>Counter UPI</span>
                  <span className="text-[10px] text-indigo-600 font-bold">₹{remainingDue}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickPay('card')}
                  disabled={isSubmitting}
                  className="flex flex-col items-center justify-center p-2.5 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 rounded-xl text-sky-700 dark:text-sky-300 transition-all font-medium text-xs active:scale-95 disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4 mb-1 text-sky-600 dark:text-sky-400" />
                  <span>Card / POS</span>
                  <span className="text-[10px] text-sky-600 font-bold">₹{remainingDue}</span>
                </button>
              </div>
            </div>
          )}

          {/* Mixed / Custom Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Split / Custom Payment Entry
              </span>
              <button
                type="button"
                onClick={handleAddRow}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Method</span>
              </button>
            </div>

            <div className="space-y-3">
              {rows.map((row, idx) => (
                <div key={row.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center gap-2">
                    {/* Method Selector */}
                    <div className="w-1/2">
                      <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">Method</label>
                      <select
                        value={row.method}
                        onChange={e => handleRowChange(row.id, 'method', e.target.value as OfflinePaymentMethod)}
                        className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      >
                        <option value="cash">💵 Cash</option>
                        <option value="upi">📱 UPI / QR</option>
                        <option value="card">💳 Card / POS</option>
                        <option value="other">📝 Other</option>
                      </select>
                    </div>

                    {/* Amount Input */}
                    <div className="w-1/2">
                      <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">Amount (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={row.amount}
                        onChange={e => handleRowChange(row.id, 'amount', e.target.value)}
                        className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Delete button for rows > 1 */}
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.id)}
                        className="p-1.5 mt-4 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Reference / Note row for non-cash or detail */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={row.method === 'upi' ? 'UPI UTR / Ref (optional)' : row.method === 'card' ? 'Card Ref / Last 4 Digits' : 'Reference / Trans ID'}
                      value={row.reference}
                      onChange={e => handleRowChange(row.id, 'reference', e.target.value)}
                      className="w-full text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Live Calculation Bar */}
            <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 flex items-center justify-between text-xs border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Total Entering: </span>
                <span className="font-bold text-slate-900 dark:text-white">₹{totalEntering.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Due After: </span>
                <span className={`font-bold ${balanceAfter === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  ₹{balanceAfter.toFixed(2)}
                </span>
              </div>
            </div>

            {isOverpaying && (
              <div className="flex items-center space-x-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Entered amount (₹{totalEntering}) exceeds remaining due (₹{remainingDue}).</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid}
                className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span>Recording...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm ₹{totalEntering.toFixed(2)} Collection</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Past Payments History Toggle */}
          {pastOfflineRecords.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => setShowHistory(prev => !prev)}
                className="w-full flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 py-1 font-medium"
              >
                <span className="flex items-center space-x-1.5">
                  <History className="w-3.5 h-3.5" />
                  <span>Previous Offline Payments ({pastOfflineRecords.length})</span>
                </span>
                <span className="text-[10px] underline">{showHistory ? 'Hide' : 'View'}</span>
              </button>

              {showHistory && (
                <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto">
                  {pastOfflineRecords.map(rec => (
                    <div key={rec.id} className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs flex items-center justify-between border border-slate-200 dark:border-slate-700/60">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{rec.method}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-2">₹{rec.amount}</span>
                        {rec.reference && <span className="text-[10px] text-slate-500 ml-1.5">({rec.reference})</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 text-right">
                        {rec.recorded_by && <div>{rec.recorded_by}</div>}
                        <div>{new Date(rec.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
