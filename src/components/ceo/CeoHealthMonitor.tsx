import React, { useMemo, useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { Database, HardDrive, AlertTriangle, CheckCircle2, Info, ChevronDown, ChevronUp, Store } from 'lucide-react';

export function CeoHealthMonitor() {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const {
    restaurants,
    staffList,
    tables,
    tableSessions,
    categories,
    menuItems,
    orders,
    feedbackList,
    callRequests,
    auditLogs,
    subscriptionHistory,
    paymentTransactions
  } = useSaaS();

  const metrics = useMemo(() => {
    // Average sizes in bytes per row (estimated based on column count and typical data size)
    const sizes = {
      restaurants: restaurants.length * 2048,
      staff: staffList.length * 1024,
      tables: tables.length * 512,
      sessions: tableSessions.length * 1024,
      categories: categories.length * 512,
      menuItems: menuItems.length * 1536,
      orders: orders.length * 3072, // Includes embedded JSON of items
      feedback: feedbackList.length * 1024,
      calls: callRequests.length * 512,
      audit: auditLogs.length * 1024,
      subHistory: subscriptionHistory.length * 1024,
      payments: paymentTransactions.length * 1024,
    };

    const totalBytes = Object.values(sizes).reduce((acc, curr) => acc + curr, 0);
    const totalMb = totalBytes / (1024 * 1024);
    const limitMb = 500; // Supabase Free Tier limit
    const percentage = (totalMb / limitMb) * 100;

    let status: 'safe' | 'warning' | 'danger' = 'safe';
    if (percentage > 85) status = 'danger';
    else if (percentage > 60) status = 'warning';

    // Image/Storage estimation (Avg 500kb per menu item + restaurant logos)
    const estimatedStorageBytes = (menuItems.length * 500 * 1024) + (restaurants.length * 1024 * 1024);
    const estimatedStorageMb = estimatedStorageBytes / (1024 * 1024);
    const storageLimitMb = 1000;
    const storagePercentage = (estimatedStorageMb / storageLimitMb) * 100;

    let storageStatus: 'safe' | 'warning' | 'danger' = 'safe';
    if (storagePercentage > 85) storageStatus = 'danger';
    else if (storagePercentage > 60) storageStatus = 'warning';

    const totalRows = restaurants.length + staffList.length + tables.length + tableSessions.length + categories.length + menuItems.length + orders.length + feedbackList.length + callRequests.length + auditLogs.length + subscriptionHistory.length + paymentTransactions.length;

    
    const restaurantBreakdown = restaurants.map(r => {
      const rOrders = orders.filter(o => o.restaurant_id === r.id).length;
      const rMenu = menuItems.filter(m => m.restaurant_id === r.id).length;
      const rStaff = staffList.filter(s => s.restaurant_id === r.id).length;
      const rTables = tables.filter(t => t.restaurant_id === r.id).length;
      const rSessions = tableSessions.filter(s => s.restaurant_id === r.id).length;
      const rFeedback = feedbackList.filter(f => f.restaurant_id === r.id).length;
      
      const rDbBytes = (rOrders * 3072) + (rMenu * 1536) + (rStaff * 1024) + (rTables * 512) + (rSessions * 1024) + (rFeedback * 1024) + 2048;
      const rDbMb = rDbBytes / (1024 * 1024);
      
      const rStorageBytes = (rMenu * 500 * 1024) + (1024 * 1024);
      const rStorageMb = rStorageBytes / (1024 * 1024);
      
      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        dbMb: rDbMb,
        storageMb: rStorageMb,
        totalMb: rDbMb + rStorageMb,
        rOrders,
        rMenu
      };
    }).sort((a, b) => b.totalMb - a.totalMb);

    return { totalMb, percentage, status, estimatedStorageMb, storagePercentage, storageStatus, totalRows, restaurantBreakdown };
  }, [
    restaurants, staffList, tables, tableSessions, categories, menuItems, orders, 
    feedbackList, callRequests, auditLogs, subscriptionHistory, paymentTransactions
  ]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-200 font-bold">
          <Database className="w-5 h-5 text-emerald-400" />
          <span>Realtime Supabase Quota Health</span>
        </div>
        {metrics.status === 'safe' ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
          </span>
        ) : metrics.status === 'warning' ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-500/30 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" /> Approaching Limit
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/80 text-red-400 border border-red-500/30 text-xs font-semibold animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" /> Critical Limit
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Database Progress */}
        <div className="space-y-2 p-3 rounded-xl bg-slate-950 border border-slate-800/60">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Database className="w-3.5 h-3.5" /> Postgres DB (Rows: {metrics.totalRows.toLocaleString()})
            </span>
            <span className={`font-bold ${metrics.status === 'safe' ? 'text-emerald-400' : metrics.status === 'warning' ? 'text-amber-400' : 'text-red-400'}`}>
              {metrics.totalMb.toFixed(2)} MB / 500 MB
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${metrics.status === 'safe' ? 'bg-emerald-500' : metrics.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: \`\${Math.min(100, metrics.percentage)}%\` }}
            />
          </div>
        </div>

        {/* Storage Progress */}
        <div className="space-y-2 p-3 rounded-xl bg-slate-950 border border-slate-800/60">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5" /> Media Storage (Estimated)
            </span>
            <span className={`font-bold ${metrics.storageStatus === 'safe' ? 'text-emerald-400' : metrics.storageStatus === 'warning' ? 'text-amber-400' : 'text-red-400'}`}>
              {metrics.estimatedStorageMb.toFixed(2)} MB / 1000 MB
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${metrics.storageStatus === 'safe' ? 'bg-emerald-500' : metrics.storageStatus === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: \`\${Math.min(100, metrics.storagePercentage)}%\` }}
            />
          </div>
        </div>
      </div>

      {(metrics.status !== 'safe' || metrics.storageStatus !== 'safe') && (
        <div className="p-3 bg-amber-950/30 border border-amber-900/50 rounded-xl flex items-start gap-3 mt-2">
          <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200 leading-relaxed">
            <strong>Action Required:</strong> You are approaching your free tier limits. To free up space without upgrading, use the <strong>"Delete {'>'} 6 Months Old Data"</strong> tool in the Analytics tab, or permanently delete inactive restaurants.
          </p>
        </div>
      )}

      {/* Restaurant Breakdown Toggle */}
      <div className="pt-2 border-t border-slate-800/80">
        <button 
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            <span>Per-Restaurant Data Usage Breakdown</span>
          </div>
          {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {showBreakdown && (
          <div className="mt-4 space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
            {metrics.restaurantBreakdown.map((r, i) => (
              <div key={r.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-xs shrink-0">
                    #{i + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">{r.name}</h4>
                    <p className="text-xs text-slate-500">/{r.slug} • {r.rOrders} Orders • {r.rMenu} Items</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <p className="text-slate-400 font-medium">DB Usage</p>
                    <p className="font-bold text-blue-400">{r.dbMb.toFixed(2)} MB</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 font-medium">Media Storage</p>
                    <p className="font-bold text-purple-400">{r.storageMb.toFixed(2)} MB</p>
                  </div>
                </div>
              </div>
            ))}
            {metrics.restaurantBreakdown.length === 0 && (
              <div className="text-center p-4 text-slate-500 text-sm">No restaurants found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
