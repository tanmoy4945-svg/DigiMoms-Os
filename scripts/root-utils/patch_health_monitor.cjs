const fs = require('fs');
let content = fs.readFileSync('src/components/ceo/CeoHealthMonitor.tsx', 'utf8');

// Ensure we have useState and other icons
content = content.replace("import React, { useMemo } from 'react';", "import React, { useMemo, useState } from 'react';");
content = content.replace("Database, HardDrive, AlertTriangle, CheckCircle2, Info } from 'lucide-react';", "Database, HardDrive, AlertTriangle, CheckCircle2, Info, ChevronDown, ChevronUp, Store } from 'lucide-react';");

const oldComponentStart = "export function CeoHealthMonitor() {";
const newComponentStart = `export function CeoHealthMonitor() {
  const [showBreakdown, setShowBreakdown] = useState(false);`;

content = content.replace(oldComponentStart, newComponentStart);

// We need to inject the restaurant breakdown calculation inside the metrics useMemo
const metricsReturn = "return { totalMb, percentage, status, estimatedStorageMb, storagePercentage, storageStatus, totalRows };";
const metricsReturnNew = `
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

    return { totalMb, percentage, status, estimatedStorageMb, storagePercentage, storageStatus, totalRows, restaurantBreakdown };`;

content = content.replace(metricsReturn, metricsReturnNew);

const uiAddition = `
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
}`;

content = content.replace("    </div>\n  );\n}", uiAddition);

fs.writeFileSync('src/components/ceo/CeoHealthMonitor.tsx', content);
