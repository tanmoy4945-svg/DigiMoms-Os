import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { ChefHat, Plus, KeyRound, Trash2, UserCheck, ShieldOff, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Staff } from '../../types';

export const StaffManagement: React.FC = () => {
  const { currentOwner, staffList, addStaffMember, toggleStaffStatus, deleteStaffMember, updateStaffPassword } = useSaaS();

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    password: '',
    role: 'waiter' as 'waiter' | 'kitchen'
  });

  // Toggle reveal password for specific staff card
  const [revealedStaffIds, setRevealedStaffIds] = useState<Record<string, boolean>>({});

  const togglePasswordReveal = (staffId: string) => {
    setRevealedStaffIds(prev => ({ ...prev, [staffId]: !prev[staffId] }));
  };

  // Password Change State
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Delete Staff State
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);

  if (!currentOwner) return null;

  const restStaff = staffList.filter(s => s.restaurant_id === currentOwner.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.mobile.trim() && formData.password.trim()) {
      addStaffMember(formData.name.trim(), formData.mobile.trim(), formData.password.trim(), formData.role);
      setShowAddModal(false);
      setFormData({ name: '', mobile: '', password: '', role: 'waiter' });
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaff && newPassword.trim()) {
      updateStaffPassword(editingStaff.id, newPassword.trim());
      setEditingStaff(null);
      setNewPassword('');
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingStaff) {
      deleteStaffMember(deletingStaff.id);
      setDeletingStaff(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Staff Credentials & Terminal Roles</h2>
          <p className="text-xs text-slate-400">Manage credentials, change passwords, or delete staff terminals for Waiters and Kitchen KDS staff</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Staff Member
        </button>
      </div>

      {/* Staff List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restStaff.map(staff => (
          <div key={staff.id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white ${
                  staff.role === 'kitchen' ? 'bg-amber-600' : 'bg-blue-600'
                }`}>
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{staff.name}</h3>
                  <span className="text-[10px] uppercase font-bold text-slate-400">{staff.role} Terminal</span>
                </div>
              </div>

              <button
                onClick={() => toggleStaffStatus(staff.id)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                  staff.status === 'active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900' : 'bg-rose-950 text-rose-400 border border-rose-500/30 hover:bg-rose-900'
                }`}
                title="Click to toggle account status"
              >
                {staff.status}
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span>Login Mobile:</span>
                <strong className="text-white font-mono">{staff.mobile}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Password:</span>
                <div className="flex items-center gap-2">
                  <strong className="text-emerald-400 font-mono">
                    {revealedStaffIds[staff.id] ? staff.password_hash : '••••••••'}
                  </strong>
                  <button
                    type="button"
                    onClick={() => togglePasswordReveal(staff.id)}
                    className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                    title={revealedStaffIds[staff.id] ? 'Hide password' : 'Show password'}
                  >
                    {revealedStaffIds[staff.id] ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  setEditingStaff(staff);
                  setNewPassword('');
                }}
                className="py-2 px-3 rounded-xl bg-blue-950/60 hover:bg-blue-900 text-blue-300 font-bold text-xs border border-blue-500/30 flex items-center justify-center gap-1.5 transition-all"
                title="Change staff password"
              >
                <KeyRound className="w-3.5 h-3.5 text-blue-400" /> Change Pass
              </button>

              <button
                onClick={() => setDeletingStaff(staff)}
                className="py-2 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-bold text-xs border border-rose-500/30 flex items-center justify-center gap-1.5 transition-all"
                title="Delete staff member permanently"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Delete
              </button>
            </div>

            <div>
              {staff.status === 'active' ? (
                <button
                  onClick={() => toggleStaffStatus(staff.id)}
                  className="w-full py-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center justify-center gap-2 transition-all"
                >
                  <ShieldOff className="w-3.5 h-3.5 text-amber-400" /> Disable Account
                </button>
              ) : (
                <button
                  onClick={() => toggleStaffStatus(staff.id)}
                  className="w-full py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center justify-center gap-2 transition-all"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Enable Account
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Add Staff Member</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Staff Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Singh"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number (Login ID) *</label>
                <input
                  type="tel"
                  required
                  placeholder="10 digit mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Terminal Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'waiter' | 'kitchen' })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                >
                  <option value="waiter">Waiter (Floor & Cash Verification)</option>
                  <option value="kitchen">Kitchen Staff (KDS Preparation Queue)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Login Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter staff login password (min 4 chars)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all">Create Credentials</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Change Staff Password</h3>
                <p className="text-xs text-slate-400">Updating credentials for <strong className="text-white">{editingStaff.name}</strong> ({editingStaff.mobile})</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Password *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter new password (min 4 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-emerald-400 font-mono focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingStaff(null);
                    setNewPassword('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Staff Member</h3>
                <p className="text-xs text-rose-400 font-semibold">Permanent Action Cannot Be Undone</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete staff member <strong className="text-white">{deletingStaff.name}</strong> ({deletingStaff.mobile})? They will no longer be able to log in to the Waiter or Kitchen terminals.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStaff(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all"
              >
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
