import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { Bell, CheckCircle2, RotateCcw, Utensils, LogOut, PhoneCall, ShoppingBag, ShieldCheck, QrCode, XCircle, Banknote } from 'lucide-react';
import { AiHelpAssistant } from '../common/AiHelpAssistant';
import { RealtimeStatusBadge } from '../common/RealtimeStatusBadge';
import { OfflinePaymentModal } from '../common/OfflinePaymentModal';
import { Order } from '../../types';

export const WaiterTerminal: React.FC = () => {
  const [selectedOfflineOrder, setSelectedOfflineOrder] = useState<Order | null>(null);
  const {
    currentStaff,
    logoutStaff,
    callRequests,
    acceptCallRequest,
    completeCallRequest,
    orders,
    verifyCashOrder,
    verifyUpiPayment,
    rejectUpiPayment,
    serveOrder,
    completeOrder,
    tables,
    clearTableSession,
    restaurants,
    setActiveView
  } = useSaaS();

  if (!currentStaff) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-white">Please log in as Waiter Staff.</h2>
        <button onClick={() => setActiveView('staff-login')} className="px-6 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-sm">
          Go to Staff Login
        </button>
      </div>
    );
  }

  const restaurant = restaurants.find(r => r.id === currentStaff.restaurant_id);
  if (!restaurant) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-white">Restaurant profile not found for this staff member.</h2>
      </div>
    );
  }
  const pendingCalls = callRequests.filter(c => c.restaurant_id === currentStaff.restaurant_id && c.status === 'pending');
  const myAcceptedCalls = callRequests.filter(c => c.restaurant_id === currentStaff.restaurant_id && c.status === 'accepted' && c.accepted_by_name === currentStaff.name);

  // Filter pending UPI verification orders
  const pendingUpiOrders = orders.filter(o =>
    o.restaurant_id === currentStaff.restaurant_id &&
    o.payment_status === 'payment_verification_pending'
  );

  // Strictly filter cash-due orders (exclude orders that are online/demo, paid, or UPI verification pending)
  const pendingCashOrders = orders.filter(o => {
    if (o.restaurant_id !== currentStaff.restaurant_id) return false;
    if (o.order_status === 'cancelled') return false;
    if (o.payment_mode === 'online' || o.payment_mode === 'demo') return false;
    if (['paid_live', 'paid', 'paid_demo', 'paid_cash', 'paid_online', 'payment_verification_pending'].includes(o.payment_status)) return false;
    const due = o.cash_due ?? (o.grand_total - (o.online_amount || 0) - (o.cash_amount || 0));
    return due > 0;
  });

  const readyOrders = orders.filter(o => {
    if (o.restaurant_id !== currentStaff.restaurant_id) return false;
    if (o.order_status !== 'ready') return false;
    if (o.payment_mode === 'online' && !['paid_live', 'paid', 'paid_demo', 'paid_online'].includes(o.payment_status)) {
      return false;
    }
    return true;
  });
  const restTables = tables.filter(t => t.restaurant_id === currentStaff.restaurant_id);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white">Waiter Terminal</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase">
                {currentStaff.name}
              </span>
            </div>
            <p className="text-xs text-slate-400">{restaurant.name} • Floor Operations</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RealtimeStatusBadge />
          <button
            onClick={logoutStaff}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-xs border border-slate-700 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Logout Staff
          </button>
        </div>
      </div>

      {/* Realtime Call Waiter Requests */}
      <div className="p-6 rounded-3xl bg-amber-950/40 border border-amber-500/40 space-y-4">
        <div className="flex items-center gap-3 text-amber-300">
          <Bell className="w-6 h-6 animate-bounce" />
          <h3 className="text-lg font-bold">Guest Assistance Requests (Pending: {pendingCalls.length} | Assigned to me: {myAcceptedCalls.length})</h3>
        </div>

        {pendingCalls.length === 0 && myAcceptedCalls.length === 0 ? (
          <p className="text-xs text-slate-400">No active guest calls on the floor.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingCalls.map(call => {
              const matchedOrd = orders.find(o => o.restaurant_id === currentStaff.restaurant_id && o.table_number === call.table_number && (o.cash_due || 0) > 0);
              return (
                <div key={call.id} className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white text-lg">Table #{call.table_number}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${call.request_type === 'payment' ? 'bg-amber-500 text-slate-950' : 'bg-amber-500/20 text-amber-300'}`}>
                      {call.request_type === 'payment' ? '🔔 PAYMENT REQUEST' : call.request_type}
                    </span>
                  </div>

                  {call.request_type === 'payment' ? (
                    <div className="text-xs space-y-1 bg-amber-950/50 p-2.5 rounded-xl border border-amber-500/30">
                      <div className="font-bold text-amber-300">Order #{matchedOrd?.order_number || 'N/A'} • Cash Due: ₹{matchedOrd?.cash_due ?? matchedOrd?.grand_total ?? '0'}</div>
                      <p className="text-slate-200">"Customer is ready to make cash payment."</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Guest requested assistance at table.</p>
                  )}

                  <button
                    onClick={() => acceptCallRequest(call.id, currentStaff.name)}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition-all"
                  >
                    Accept Request
                  </button>
                </div>
              );
            })}

            {myAcceptedCalls.map(call => {
              const matchedOrd = orders.find(o => 
                o.restaurant_id === currentStaff.restaurant_id && 
                o.table_number === call.table_number && 
                o.payment_status !== 'paid_live' && 
                o.payment_status !== 'paid' && 
                o.payment_status !== 'paid_demo' && 
                o.payment_status !== 'paid_cash' && 
                (o.cash_due ?? (o.grand_total - (o.online_amount || 0) - (o.cash_amount || 0))) > 0
              );
              return (
                <div key={call.id} className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white text-lg">Table #{call.table_number}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase">
                      {call.request_type === 'payment' ? 'Payment Collection — Accepted' : `Attending: ${call.request_type}`}
                    </span>
                  </div>

                  {call.request_type === 'payment' && matchedOrd && (
                    <div className="text-xs space-y-1 bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-500/30">
                      <div className="font-bold text-emerald-300">Order #{matchedOrd.order_number} • Collect Cash: ₹{matchedOrd.cash_due ?? matchedOrd.grand_total}</div>
                      <p className="text-slate-200">Collect cash from guest at table.</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {call.request_type === 'payment' && matchedOrd && (
                      <button
                        onClick={() => {
                          const dueAmt = matchedOrd.cash_due ?? (matchedOrd.grand_total - (matchedOrd.online_amount || 0));
                          verifyCashOrder(matchedOrd.id, currentStaff.name, 'staff');
                          completeCallRequest(call.id);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all"
                      >
                        [Mark Cash Paid]
                      </button>
                    )}
                    <button
                      onClick={() => completeCallRequest(call.id)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all"
                    >
                      Complete Call
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* UPI Scan & Pay Pending Verification Banner */}
      {pendingUpiOrders.length > 0 && (
        <div className="p-6 rounded-3xl bg-purple-950/40 border border-purple-500/50 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-purple-300">
              <QrCode className="w-6 h-6 animate-pulse text-purple-400" />
              <h3 className="text-lg font-bold">
                UPI Scan & Pay Verifications Required ({pendingUpiOrders.length})
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold uppercase border border-purple-500/30">
              Staff Confirmation Pending
            </span>
          </div>

          <p className="text-xs text-slate-300">
            Customers scanned the UPI QR code and submitted payment. Please check your bank notification / soundbox / UPI app and click <strong>Verify</strong> to approve and send the order to the kitchen.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingUpiOrders.map(order => (
              <div key={order.id} className="p-4 rounded-2xl bg-slate-950 border border-purple-500/40 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-extrabold uppercase">
                    UPI SCAN & PAY
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div>
                    <span className="font-extrabold text-white font-mono text-sm">Order {order.order_number}</span>
                    <span className="text-xs text-purple-300 ml-2 font-bold">Table #{order.table_number}</span>
                  </div>
                  <span className="text-sm font-extrabold font-mono text-emerald-400">₹{order.grand_total}</span>
                </div>

                {/* UPI Ref / UTR number if provided */}
                <div className="bg-purple-950/40 p-2.5 rounded-xl border border-purple-500/20 text-xs space-y-1">
                  <div className="text-slate-400 text-[10px]">Customer Submitted Reference:</div>
                  <div className="font-mono font-bold text-white text-xs">
                    {order.upi_ref_number || (order.notes?.startsWith('UPI_REF:') ? order.notes.replace('UPI_REF:', '') : 'Direct UPI Scan (No Ref Provided)')}
                  </div>
                </div>

                <div className="text-xs text-slate-300">
                  {order.items.map(i => `${i.quantity}x ${i.menu_name}`).join(', ')}
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => verifyUpiPayment(order.id, currentStaff.name, 'staff')}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verify & Send to Kitchen
                  </button>

                  <button
                    onClick={() => rejectUpiPayment(order.id, currentStaff.name, 'staff')}
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 font-bold text-xs transition-all border border-slate-700"
                    title="Decline and request cash payment"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders to Verify or Serve */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Pending Cash Verification */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" /> NEW CASH ORDERS — COLLECTION PENDING ({pendingCashOrders.length})
          </h3>

          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
            {pendingCashOrders.map(order => {
              const dueAmt = order.cash_due ?? (order.grand_total - (order.online_amount || 0));
              return (
                <div key={order.id} className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase">
                      NEW CASH ORDER
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div>
                      <span className="font-extrabold text-white font-mono text-sm">Order {order.order_number}</span>
                      <span className="text-xs text-slate-400 ml-2">Table #{order.table_number}</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-300">{restaurant.name}</span>
                  </div>

                  <div className="text-xs text-slate-300">
                    {order.items.map(i => `${i.quantity}x ${i.menu_name}`).join(', ')}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <div>
                      <div className="text-xs text-slate-400">Total Amount: <strong className="text-white">₹{order.grand_total}</strong></div>
                      <div className="text-[10px] text-amber-400 font-bold uppercase">Payment Status: CASH PAYMENT PENDING (Due: ₹{dueAmt})</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedOfflineOrder(order)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 flex items-center gap-1 transition-all"
                        title="Record Cash, Counter UPI, Card or Mixed payment"
                      >
                        <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Record / Split</span>
                      </button>

                      <button
                        onClick={() => verifyCashOrder(order.id, currentStaff.name, 'staff')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Full Cash (₹{dueAmt})</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ready Orders From Kitchen */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-400" /> Kitchen Ready - Serve Food ({readyOrders.length})
          </h3>

          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
            {readyOrders.map(order => (
              <div key={order.id} className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-mono">{order.order_number}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">{order.table_number}</span>
                </div>

                <div className="text-xs text-slate-300">
                  {order.items.map(i => `${i.quantity}x ${i.menu_name}`).join(', ')}
                </div>

                <button
                  onClick={() => serveOrder(order.id, currentStaff.name, 'staff')}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30"
                >
                  Mark Served at Table
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table Clearing Control */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white">Occupied Table Control</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {restTables.map(t => (
            <div key={t.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">{t.table_number}</div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">{t.status}</div>
              </div>
              {t.status === 'occupied' && (
                <button
                  onClick={() => clearTableSession(t.id)}
                  className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all"
                  title="Clear Table"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Help Assistant */}
      <AiHelpAssistant
        role="waiter"
        currentView="Waiter Terminal"
        restaurantName={restaurant.name}
      />

      {/* Offline Payment Modal */}
      <OfflinePaymentModal
        isOpen={!!selectedOfflineOrder}
        onClose={() => setSelectedOfflineOrder(null)}
        order={selectedOfflineOrder}
        actorName={currentStaff.name}
        actorType="staff"
      />
    </div>
  );
};
