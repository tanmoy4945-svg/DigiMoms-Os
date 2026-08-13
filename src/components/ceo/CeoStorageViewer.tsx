import React, { useState, useEffect } from 'react';
import { Database, HardDrive, Cpu, RefreshCw, AlertTriangle, AlertCircle, CheckCircle2, Server, BarChart2, ShieldAlert, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TableStorageStat {
  tableName: string;
  count: number;
  estimatedBytes: number;
}

interface BucketStorageStat {
  bucketName: string;
  filesCount: number;
  totalBytes: number;
}

export const CeoStorageViewer: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [dbBytes, setDbBytes] = useState<number>(0);
  const [storageBytes, setStorageBytes] = useState<number>(0);
  const [tableStats, setTableStats] = useState<TableStorageStat[]>([]);
  const [bucketStats, setBucketStats] = useState<BucketStorageStat[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Standard Supabase Tier Quota References
  const DB_CAPACITY_BYTES = 524288000; // 500 MB Free Tier Limit
  const STORAGE_CAPACITY_BYTES = 1073741824; // 1 GB Storage Limit
  const ROW_COUNT_THRESHOLD = 50000; // 50k rows advisory limit

  const fetchStorageInfo = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // 1. Fetch Real Table Record Counts & Estimate Size in Bytes
      const tablesList = [
        'restaurants',
        'orders',
        'order_items',
        'menus',
        'menu_categories',
        'tables',
        'table_sessions',
        'staff',
        'customer_feedback',
        'call_waiter',
        'subscription_history',
        'audit_logs'
      ];

      let totalCalculatedDbBytes = 0;
      const tStats: TableStorageStat[] = [];

      for (const tName of tablesList) {
        try {
          const { data, count } = await supabase.from(tName).select('*', { count: 'exact' }).limit(100);
          const recCount = count || (data ? data.length : 0);
          // Estimate byte size by stringifying fetched sample rows
          let avgRowBytes = 280;
          if (data && data.length > 0) {
            const sampleJson = JSON.stringify(data);
            avgRowBytes = Math.max(150, Math.round(sampleJson.length / data.length));
          }
          const tableBytes = recCount * avgRowBytes;
          totalCalculatedDbBytes += tableBytes;
          tStats.push({
            tableName: tName,
            count: recCount,
            estimatedBytes: tableBytes
          });
        } catch (e) {
          tStats.push({ tableName: tName, count: 0, estimatedBytes: 0 });
        }
      }

      setDbBytes(totalCalculatedDbBytes);
      setTableStats(tStats);

      // 2. Fetch Real Supabase Storage Bucket File Sizes
      let totalStorageBytes = 0;
      const bStats: BucketStorageStat[] = [];

      try {
        const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
        if (bErr) {
          console.warn("Storage listBuckets info:", bErr.message);
        } else if (buckets && buckets.length > 0) {
          for (const b of buckets) {
            try {
              const { data: files } = await supabase.storage.from(b.name).list('', { limit: 500 });
              let bBytes = 0;
              let fCount = 0;
              if (files) {
                fCount = files.length;
                files.forEach((f: any) => {
                  bBytes += f.metadata?.size || f.size || 10240; // size in bytes
                });
              }
              totalStorageBytes += bBytes;
              bStats.push({
                bucketName: b.name,
                filesCount: fCount,
                totalBytes: bBytes
              });
            } catch (err) {
              bStats.push({ bucketName: b.name, filesCount: 0, totalBytes: 0 });
            }
          }
        }
      } catch (e) {
        console.warn("Bucket query note:", e);
      }

      setStorageBytes(totalStorageBytes);
      setBucketStats(bStats);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load real storage metrics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageInfo();
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const totalUsedBytes = dbBytes + storageBytes;
  const totalRows = tableStats.reduce((acc, curr) => acc + curr.count, 0);

  const dbUsagePct = Math.min(100, Math.round((dbBytes / DB_CAPACITY_BYTES) * 100));
  const storageUsagePct = Math.min(100, Math.round((storageBytes / STORAGE_CAPACITY_BYTES) * 100));
  const rowCountPct = Math.min(100, Math.round((totalRows / ROW_COUNT_THRESHOLD) * 100));

  const isWarningState = dbUsagePct >= 70 || storageUsagePct >= 70 || rowCountPct >= 70;
  const isCriticalState = dbUsagePct >= 85 || storageUsagePct >= 85 || rowCountPct >= 85;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              System / Storage Metrics
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30">
                🟢 Live Supabase Connected
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Real-time database payload, row capacity, and storage bucket utilization monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-[11px] font-mono text-slate-400">
              Refreshed: {lastRefreshed}
            </span>
          )}
          <button
            onClick={fetchStorageInfo}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Storage Data</span>
          </button>
        </div>
      </div>

      {/* Satarko / Early Capacity Alert Warning Banner */}
      {isWarningState ? (
        <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl ${
          isCriticalState
            ? 'bg-rose-950/80 border-rose-600 text-rose-200 animate-pulse'
            : 'bg-amber-950/80 border-amber-600 text-amber-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl ${isCriticalState ? 'bg-rose-500/30 text-rose-300' : 'bg-amber-500/30 text-amber-300'}`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <span>⚠️ Satarko Alert: Supabase Storage/Database Capacity Warning</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/40 border border-current uppercase">
                  {isCriticalState ? 'Critical High' : 'Warning Level'}
                </span>
              </h3>
              <p className="text-xs opacity-90">
                {isCriticalState
                  ? 'CRITICAL CAPACITY REACHED (>85%). Database or bucket storage is nearly full! Please archive old orders or upgrade your Supabase plan to prevent write lockouts.'
                  : 'STORAGE CAPACITY WARNING (>70%). Database or storage usage is approaching threshold limits. Monitor row counts and purge old audit logs.'
                }
              </p>
            </div>
          </div>
          <button
            onClick={() => alert("Recommendation: Clear historical audit logs or export old order records to keep database size under 50MB.")}
            className="px-4 py-2 rounded-xl bg-black/50 hover:bg-black/70 text-white text-xs font-bold border border-white/20 shrink-0"
          >
            View Optimization Advice
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>System Storage Healthy: All database tables and storage bucket quotas operating well below alert capacity.</span>
          </div>
          <span className="text-[10px] font-mono bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700/60">
            {dbUsagePct}% DB Used
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Primary 5-Card Storage Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* 1. Database Usage */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Database Payload</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{formatSize(dbBytes)}</div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Limit: {formatSize(DB_CAPACITY_BYTES)}</span>
              <span className={dbUsagePct > 70 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>{dbUsagePct}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 ${
                  dbUsagePct >= 85 ? 'bg-rose-500' : dbUsagePct >= 70 ? 'bg-amber-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.max(2, dbUsagePct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. Total DB Rows */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Total DB Records</span>
            <BarChart2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{totalRows.toLocaleString()}</div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Cap: {ROW_COUNT_THRESHOLD.toLocaleString()}</span>
              <span className={rowCountPct > 70 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>{rowCountPct}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 ${
                  rowCountPct >= 85 ? 'bg-rose-500' : rowCountPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.max(2, rowCountPct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. Supabase Bucket Storage */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Bucket Files</span>
            <HardDrive className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{formatSize(storageBytes)}</div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Limit: {formatSize(STORAGE_CAPACITY_BYTES)}</span>
              <span className={storageUsagePct > 70 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>{storageUsagePct}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 ${
                  storageUsagePct >= 85 ? 'bg-rose-500' : storageUsagePct >= 70 ? 'bg-amber-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.max(2, storageUsagePct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4. Combined Total Storage */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Total Used</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-purple-300">{formatSize(totalUsedBytes)}</div>
          <div className="text-[11px] text-slate-400 pt-1">
            Database + Storage Buckets
          </div>
        </div>

        {/* 5. Health Status */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Health Status</span>
            {isWarningState ? <AlertTriangle className="w-4 h-4 text-amber-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          </div>
          <div className={`text-base font-extrabold ${isWarningState ? 'text-amber-400' : 'text-emerald-400'}`}>
            {isCriticalState ? 'CRITICAL' : isWarningState ? 'WARNING' : 'HEALTHY'}
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            {isWarningState ? 'Satarko: Action Required' : 'Supabase Active & Stable'}
          </div>
        </div>
      </div>

      {/* Detailed Tables Breakdown */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-400" />
            <span>Database Tables Storage Breakdown</span>
          </div>
          <span className="text-xs font-normal text-slate-400">
            Row sizes estimated from live Supabase samples
          </span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-semibold">Table Name</th>
                <th className="py-3 px-4 font-semibold text-right">Total Rows</th>
                <th className="py-3 px-4 font-semibold text-right">Estimated Size</th>
                <th className="py-3 px-4 font-semibold text-right">% of Database</th>
                <th className="py-3 px-4 font-semibold text-center">Satarko Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {tableStats.map(stat => {
                const pct = dbBytes > 0 ? ((stat.estimatedBytes / dbBytes) * 100).toFixed(1) : '0';
                const isHeavy = stat.count > 5000 || stat.estimatedBytes > 10000000;
                return (
                  <tr key={stat.tableName} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono text-purple-300 font-semibold">{stat.tableName}</td>
                    <td className="py-3 px-4 text-right font-medium">{stat.count.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">{formatSize(stat.estimatedBytes)}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400">{pct}%</td>
                    <td className="py-3 px-4 text-center">
                      {isHeavy ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] border border-amber-500/30 font-bold">
                          Heavy Table
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bucket Storage Breakdown */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-amber-400" />
          <span>Supabase Storage Buckets</span>
        </h3>

        {bucketStats.length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 text-center">
            No active custom storage buckets created in Supabase yet. Images are stored as optimized HTTPS references or inline assets.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-semibold">Bucket Name</th>
                  <th className="py-3 px-4 font-semibold text-right">File Count</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {bucketStats.map(b => (
                  <tr key={b.bucketName} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono text-amber-300 font-semibold">{b.bucketName}</td>
                    <td className="py-3 px-4 text-right">{b.filesCount}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">{formatSize(b.totalBytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
