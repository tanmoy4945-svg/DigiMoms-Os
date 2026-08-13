import React from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { ChefHat, Clock, CheckCircle2, LogOut, Flame, Utensils } from 'lucide-react';
import { AiHelpAssistant } from '../common/AiHelpAssistant';
import { RealtimeStatusBadge } from '../common/RealtimeStatusBadge';
import { t } from '../../utils/i18n';

export const KitchenTerminal: React.FC = () => {
  const {
    currentStaff,
    logoutStaff,
    orders,
    acceptOrder,
    startCookingOrder,
    markOrderReady,
    restaurants,
    setActiveView
  } = useSaaS();

  if (!currentStaff) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-white">Please log in as Kitchen Staff.</h2>
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
  const restOrders = orders.filter(o => o.restaurant_id === currentStaff.restaurant_id && o.order_status !== 'completed' && o.order_status !== 'cancelled');

  const incomingOrders = restOrders.filter(o => o.order_status === 'pending' || o.order_status === 'received' || o.order_status === 'accepted');
  const cookingOrders = restOrders.filter(o => o.order_status === 'cooking');
  const readyOrders = restOrders.filter(o => o.order_status === 'ready' || o.order_status === 'served');

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 space-y-8">
      {/* KDS Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold">
            <ChefHat className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Kitchen Display Screen (KDS)</h1>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase border border-amber-500/30">
                Chef Terminal
              </span>
            </div>
            <p className="text-xs text-slate-400">{restaurant.name} • Live Ticket Preparation Queue</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RealtimeStatusBadge />
          <button
            onClick={logoutStaff}
            className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-xs border border-slate-700 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Exit KDS
          </button>
        </div>
      </div>

      {/* Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: New / Incoming Queue */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <Clock className="w-5 h-5" /> Incoming Queue ({incomingOrders.length})
            </h2>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {incomingOrders.map(order => (
              <div key={order.id} className="p-5 rounded-2xl bg-slate-950 border-2 border-amber-500/50 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold text-white font-mono">{order.order_number}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-950 text-amber-300 border border-amber-500/30">
                      {order.order_status}
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 text-sm font-extrabold">{order.table_number}</span>
                </div>

                <div className="space-y-2 py-2 border-y border-slate-800 text-sm">
                  {order.items.map(i => (
                    <div key={i.id} className="flex items-center justify-between">
                      <span className="font-extrabold text-white text-base">{i.quantity}x {i.menu_name}</span>
                      {i.special_instructions && (
                        <span className="text-xs text-amber-300 bg-amber-950 px-2 py-0.5 rounded-md">Note: {i.special_instructions}</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  {(order.order_status === 'pending' || order.order_status === 'received') && (
                    <button
                      onClick={() => acceptOrder(order.id, currentStaff.name, 'staff')}
                      className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg transition-all"
                    >
                      Accept Order
                    </button>
                  )}
                  <button
                    onClick={() => startCookingOrder(order.id, currentStaff.name, 'staff')}
                    className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5"
                  >
                    <Flame className="w-4 h-4" /> Start Cooking
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Cooking in Progress */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-blue-400 flex items-center gap-2">
              <Flame className="w-5 h-5 text-blue-400" /> Cooking ({cookingOrders.length})
            </h2>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {cookingOrders.map(order => (
              <div key={order.id} className="p-5 rounded-2xl bg-slate-950 border-2 border-blue-500/50 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-extrabold text-white font-mono">{order.order_number}</span>
                  <span className="px-3 py-1 rounded-xl bg-blue-500 text-slate-950 text-sm font-extrabold">{order.table_number}</span>
                </div>

                <div className="space-y-2 py-2 border-y border-slate-800 text-sm">
                  {order.items.map(i => (
                    <div key={i.id} className="flex items-center justify-between">
                      <span className="font-extrabold text-white text-base">{i.quantity}x {i.menu_name}</span>
                      {i.special_instructions && (
                        <span className="text-xs text-amber-300 bg-amber-950 px-2 py-0.5 rounded-md">Note: {i.special_instructions}</span>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => markOrderReady(order.id)}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" /> Mark Ready to Serve!
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Ready & Served */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Ready / Served ({readyOrders.length})
            </h2>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {readyOrders.map(order => (
              <div key={order.id} className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 space-y-2 opacity-80">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-white font-mono">{order.order_number}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase">{order.table_number}</span>
                </div>
                <div className="text-xs text-slate-400">
                  {order.items.map(i => `${i.quantity}x ${i.menu_name}`).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Help Assistant */}
      <AiHelpAssistant
        role="kitchen"
        currentView="Kitchen Display System"
        restaurantName={restaurant.name}
      />
    </div>
  );
};
