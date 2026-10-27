import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { 
  Users, Search, Calendar, CheckCircle2, AlertCircle, Eye, 
  ExternalLink, Phone, DollarSign, ArrowRight, Filter,
  Building2, ShieldCheck, History
} from 'lucide-react';
import { Restaurant, SubscriptionHistory } from '../../types';

interface CeoPartnerCommissionsProps {
  canEdit?: boolean;
  canDelete?: boolean;
}

export const CeoPartnerCommissions: React.FC<CeoPartnerCommissionsProps> = ({
  canEdit = true,
  canDelete = true
}) => {
  const { 
    restaurants, 
    subscriptionHistory, 
    updateCommissionStatus,
    showToast,
    currentCeoStaff
  } = useSaaS();

  const isMasterCeo = !currentCeoStaff;
  const userCanEdit = isMasterCeo || canEdit;
  const userCanDelete = isMasterCeo || canDelete;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'cleared'>('all');
  const [viewDetails, setViewDetails] = useState<Restaurant | null>(null);
  const [adminMobile, setAdminMobile] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter restaurants that have a partner attached
  const partnerRestaurants = restaurants.filter(r => 
    r.partner_mobile && (
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.partner_mobile.includes(searchTerm)
    )
  );

  // Get commission status for each restaurant
  const getCommissionInfo = (restId: string) => {
    const history = subscriptionHistory.filter(h => h.restaurant_id === restId && h.commission_status);
    const pending = history.filter(h => h.commission_status === 'pending');
    const cleared = history.filter(h => h.commission_status === 'cleared');
    
    const totalPendingAmount = pending.length * (restaurants.find(r => r.id === restId)?.partner_commission_amount || 0);
    const totalClearedAmount = cleared.length * (restaurants.find(r => r.id === restId)?.partner_commission_amount || 0);

    return {
      history,
      pendingCount: pending.length,
      clearedCount: cleared.length,
      totalPendingAmount,
      totalClearedAmount,
      isAllCleared: pending.length === 0 && history.length > 0,
      hasPending: pending.length > 0
    };
  };

  const handleClearCommission = async (historyId: string) => {
    if (!userCanEdit) {
      showToast('Access Denied: You do not have permission to clear commissions.', 'error');
      return;
    }
    if (!adminMobile || adminMobile.length < 10) {
      showToast('Please enter a valid Admin Mobile Number to clear commission.', 'error');
      return;
    }

    try {
      setIsProcessing(true);
      await updateCommissionStatus(historyId, 'cleared', adminMobile);
    } catch (err) {
      console.error("Failed to clear commission:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetCommission = async (historyId: string) => {
    if (!userCanDelete) {
      showToast('Access Denied: You do not have permission to reset commissions.', 'error');
      return;
    }
    if (!adminMobile || adminMobile.length < 10) {
      showToast('Please enter a valid Admin Mobile Number to reset commission.', 'error');
      return;
    }

    try {
      setIsProcessing(true);
      await updateCommissionStatus(historyId, 'pending', adminMobile);
    } catch (err) {
      console.error("Failed to reset commission:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            পার্টনার কমিশন ম্যানেজমেন্ট (Partner Commissions)
          </h2>
          <p className="text-xs text-slate-400">Manage lifetime commissions for partners who brought restaurants to our platform.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search Partner Mobile / Restaurant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-purple-500 outline-none w-64"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-xs text-white outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="pending">Uncleared (Red)</option>
              <option value="cleared">All Cleared (Green)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {partnerRestaurants
          .filter(r => {
            const info = getCommissionInfo(r.id);
            if (statusFilter === 'pending') return info.hasPending;
            if (statusFilter === 'cleared') return info.isAllCleared;
            return true;
          })
          .map(rest => {
            const info = getCommissionInfo(rest.id);
            return (
              <div 
                key={rest.id} 
                className={`p-5 rounded-3xl border-2 transition-all ${
                  info.hasPending 
                    ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50' 
                    : info.history.length > 0
                      ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      info.hasPending ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                    }`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{rest.name}</h3>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">{rest.slug}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                    info.hasPending 
                      ? 'bg-rose-500/20 border-rose-500/30 text-rose-300' 
                      : info.history.length > 0
                        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    {info.hasPending ? 'Uncleared' : info.history.length > 0 ? 'All Cleared' : 'No Renewals'}
                  </div>
                </div>

                <div className="space-y-3 mb-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Partner Mobile:</span>
                    <span className="text-white font-mono font-bold flex items-center gap-1">
                      <Phone className="w-3 h-3 text-purple-400" /> {rest.partner_mobile}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Commission Rate:</span>
                    <span className="text-emerald-400 font-bold">₹{rest.partner_commission_amount || 0}/renewal</span>
                  </div>
                  
                  <div className="h-px bg-slate-800 my-2" />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-xl bg-slate-950/50 border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Pending</p>
                      <p className="text-sm font-extrabold text-rose-400">₹{info.totalPendingAmount}</p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/50 border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Cleared</p>
                      <p className="text-sm font-extrabold text-emerald-400">₹{info.totalClearedAmount}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setViewDetails(rest)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-700"
                >
                  <Eye className="w-4 h-4" /> View Renewal History
                </button>
              </div>
            );
          })}

        {partnerRestaurants.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4 bg-slate-900/50 rounded-3xl border border-dashed border-slate-800">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 text-slate-600" />
            </div>
            <div>
              <p className="text-white font-bold">No Partner-Linked Restaurants Found</p>
              <p className="text-xs text-slate-500">Add a partner mobile number to a restaurant to track commissions.</p>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {viewDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                  <DollarSign className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{viewDetails.name} - Commission History</h3>
                  <p className="text-xs text-slate-400">Partner Mobile: {viewDetails.partner_mobile}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setViewDetails(null);
                  setAdminMobile('');
                }}
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center transition-all"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Admin Auth for clearing */}
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                <div className="flex items-center gap-2 text-purple-300">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-sm font-bold">Admin Verification (Mandatory)</span>
                </div>
                <p className="text-[11px] text-purple-200/70">Enter your Admin/CEO Mobile Number to authorize marking commissions as cleared.</p>
                <input
                  type="tel"
                  placeholder="Your Admin Mobile Number (Required)"
                  value={adminMobile}
                  onChange={(e) => setAdminMobile(e.target.value)}
                  className="w-full bg-slate-950 border border-purple-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 outline-none font-mono"
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  Renewal & Commission Log
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-950/80 text-slate-500 uppercase font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Renewal Amount</th>
                        <th className="p-3">Commission Owed</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Cleared By</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {subscriptionHistory
                        .filter(h => h.restaurant_id === viewDetails.id && h.commission_status)
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map(item => (
                          <tr key={item.id} className="hover:bg-slate-800/30 transition-all">
                            <td className="p-3 text-white">
                              <div className="font-medium">{new Date(item.payment_date || item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                              <div className="text-[10px] text-slate-500 font-mono uppercase">{item.payment_id}</div>
                            </td>
                            <td className="p-3 font-bold text-emerald-400">₹{item.amount}</td>
                            <td className="p-3 font-extrabold text-white">₹{viewDetails.partner_commission_amount || 0}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                                item.commission_status === 'pending'
                                  ? 'bg-rose-500/20 border-rose-500/30 text-rose-300'
                                  : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                              }`}>
                                {item.commission_status}
                              </span>
                            </td>
                            <td className="p-3">
                              {item.commission_cleared_at ? (
                                <div className="space-y-0.5">
                                  <div className="text-white font-bold">{item.commission_cleared_by_mobile}</div>
                                  <div className="text-slate-500 text-[9px]">{new Date(item.commission_cleared_at).toLocaleString()}</div>
                                </div>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              {item.commission_status === 'pending' ? (
                                <button
                                  disabled={isProcessing}
                                  onClick={() => handleClearCommission(item.id)}
                                  className={`px-3 py-1.5 rounded-lg text-white text-[10px] font-bold shadow-lg transition-all flex items-center gap-1 ml-auto ${
                                    userCanEdit ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                                  }`}
                                >
                                  {!userCanEdit && <Lock className="w-3 h-3" />}
                                  Mark as Cleared
                                </button>
                              ) : (
                                <button
                                  disabled={isProcessing}
                                  onClick={() => handleResetCommission(item.id)}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ml-auto ${
                                    userCanDelete ? 'bg-slate-800 hover:bg-slate-700 text-rose-300 border-slate-700' : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-60'
                                  }`}
                                >
                                  {!userCanDelete && <Lock className="w-3 h-3" />}
                                  Reset to Pending
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      {subscriptionHistory.filter(h => h.restaurant_id === viewDetails.id && h.commission_status).length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-10 text-center text-slate-500 italic">
                            No commissionable renewals found for this restaurant yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Pending Amount</p>
                  <p className="text-lg font-extrabold text-rose-400">₹{getCommissionInfo(viewDetails.id).totalPendingAmount}</p>
                </div>
                <div className="w-px bg-slate-800 h-10 self-center" />
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Cleared Amount</p>
                  <p className="text-lg font-extrabold text-emerald-400">₹{getCommissionInfo(viewDetails.id).totalClearedAmount}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setViewDetails(null);
                  setAdminMobile('');
                }}
                className="px-8 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

