import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { CeoStaffMember, CeoStaffPermissions } from '../../types';
import { Users, UserPlus, Shield, Check, X, Lock, Key, Trash2, Edit3, Smartphone, AlertTriangle } from 'lucide-react';

export const CeoStaffManagement: React.FC = () => {
  const {
    ceoStaffList,
    currentCeoStaff,
    addCeoStaffMember,
    updateCeoStaffMember,
    toggleCeoStaffStatus,
    deleteCeoStaffMember,
    updateCeoStaffPassword,
    showToast
  } = useSaaS();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<CeoStaffMember | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState<CeoStaffMember | null>(null);

  const [newName, setNewName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newPassword, setNewPassword] = useState('ceoStaff123');
  const [newRole, setNewRole] = useState<'manager' | 'support' | 'billing'>('manager');
  const [newPermissions, setNewPermissions] = useState<CeoStaffPermissions>({
    can_view_restaurants: true,
    can_edit_restaurants: false,
    can_view_subscriptions: true,
    can_edit_subscriptions: false,
    can_view_payments: true,
    can_edit_payments: false,
    can_view_reports: true,
    can_view_sql: false,
    can_view_storage: true,
    can_view_backup: false,
    can_view_feedback: true,
    can_view_logs: true
  });

  const [passwordInput, setPasswordInput] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newMobile.trim() || !newPassword.trim()) {
      showToast('Please fill all required fields for CEO staff.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await addCeoStaffMember(newName.trim(), newMobile.trim(), newPassword.trim(), newRole, newPermissions);
      setNewName('');
      setNewMobile('');
      setNewPassword('ceoStaff123');
      setShowAddModal(false);
    } catch (err) {
      // Error toast is handled inside addCeoStaffMember
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    setIsSubmitting(true);
    try {
      await updateCeoStaffMember(editingStaff.id, {
        name: editingStaff.name.trim(),
        mobile: editingStaff.mobile.trim(),
        role: editingStaff.role,
        permissions: editingStaff.permissions
      });
      setEditingStaff(null);
    } catch (err) {
      // Error toast handled inside updateCeoStaffMember
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPasswordModal || !passwordInput.trim()) return;
    if (passwordInput.trim().length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await updateCeoStaffPassword(showPasswordModal.id, passwordInput.trim());
      setShowPasswordModal(null);
      setPasswordInput('');
    } catch (err) {
      // Error toast handled inside updateCeoStaffMember
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">CEO Control Center Team & Member Access</h2>
            <p className="text-xs text-slate-400">
              Add staff members to the CEO dashboard and configure granular View vs Edit permissions. Staff cannot change Master CEO password.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Add CEO Staff Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ceoStaffList.map(staff => (
          <div key={staff.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white">{staff.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-purple-400 font-mono mt-0.5">
                  <Smartphone className="w-3.5 h-3.5" /> {staff.mobile}
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                staff.status === 'active' ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' : 'bg-rose-950 text-rose-400 border-rose-500/30'
              }`}>
                {staff.status}
              </span>
            </div>

            <div className="space-y-1.5 text-xs bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Role:</span>
                <strong className="text-white uppercase font-mono">{staff.role}</strong>
              </div>
              <div className="text-slate-400 flex items-center justify-between">
                <span>Created:</span>
                <span className="text-slate-300 font-mono">{new Date(staff.created_at).toLocaleDateString()}</span>
              </div>
              <div className="text-slate-400 flex items-center justify-between">
                <span>Last Password Change:</span>
                <span className="text-amber-300 font-mono">
                  {staff.last_password_change ? new Date(staff.last_password_change).toLocaleDateString() : 'Never'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Granular Permissions:</span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${staff.permissions?.can_edit_restaurants ? 'bg-purple-950/40 text-purple-300 border-purple-500/30' : staff.permissions?.can_view_restaurants ? 'bg-blue-950/40 text-blue-300 border-blue-500/30' : 'bg-slate-950 text-slate-500 border-slate-800'}`}>
                  {staff.permissions?.can_edit_restaurants ? <Check className="w-3 h-3 text-purple-400" /> : staff.permissions?.can_view_restaurants ? <Check className="w-3 h-3 text-blue-400" /> : <X className="w-3 h-3" />}
                  <span>Restaurants</span>
                </div>

                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${staff.permissions?.can_edit_subscriptions ? 'bg-purple-950/40 text-purple-300 border-purple-500/30' : staff.permissions?.can_view_subscriptions ? 'bg-blue-950/40 text-blue-300 border-blue-500/30' : 'bg-slate-950 text-slate-500 border-slate-800'}`}>
                  {staff.permissions?.can_edit_subscriptions ? <Check className="w-3 h-3 text-purple-400" /> : staff.permissions?.can_view_subscriptions ? <Check className="w-3 h-3 text-blue-400" /> : <X className="w-3 h-3" />}
                  <span>Subscriptions</span>
                </div>

                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${staff.permissions?.can_edit_payments ? 'bg-purple-950/40 text-purple-300 border-purple-500/30' : staff.permissions?.can_view_payments ? 'bg-blue-950/40 text-blue-300 border-blue-500/30' : 'bg-slate-950 text-slate-500 border-slate-800'}`}>
                  {staff.permissions?.can_edit_payments ? <Check className="w-3 h-3 text-purple-400" /> : staff.permissions?.can_view_payments ? <Check className="w-3 h-3 text-blue-400" /> : <X className="w-3 h-3" />}
                  <span>Payments</span>
                </div>

                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${staff.permissions?.can_view_reports ? 'bg-blue-950/40 text-blue-300 border-blue-500/30' : 'bg-slate-950 text-slate-500 border-slate-800'}`}>
                  {staff.permissions?.can_view_reports ? <Check className="w-3 h-3 text-blue-400" /> : <X className="w-3 h-3" />}
                  <span>Reports</span>
                </div>

                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${staff.permissions?.can_view_sql ? 'bg-blue-950/40 text-blue-300 border-blue-500/30' : 'bg-slate-950 text-slate-500 border-slate-800'}`}>
                  {staff.permissions?.can_view_sql ? <Check className="w-3 h-3 text-blue-400" /> : <X className="w-3 h-3" />}
                  <span>SQL Console</span>
                </div>

                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${staff.permissions?.can_view_storage ? 'bg-blue-950/40 text-blue-300 border-blue-500/30' : 'bg-slate-950 text-slate-500 border-slate-800'}`}>
                  {staff.permissions?.can_view_storage ? <Check className="w-3 h-3 text-blue-400" /> : <X className="w-3 h-3" />}
                  <span>Storage & System</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setEditingStaff(staff)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>

              <button
                onClick={() => setShowPasswordModal(staff)}
                className="px-3 py-2 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center gap-1 transition-all"
                title="Change Password"
              >
                <Key className="w-3.5 h-3.5" /> Password
              </button>

              <button
                onClick={() => toggleCeoStaffStatus(staff.id)}
                className={`px-3 py-2 rounded-xl font-bold text-xs transition-all ${
                  staff.status === 'active' ? 'bg-rose-950 text-rose-300 border border-rose-500/30 hover:bg-rose-900' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900'
                }`}
              >
                {staff.status === 'active' ? 'Disable' : 'Enable'}
              </button>

              <button
                onClick={() => deleteCeoStaffMember(staff.id)}
                className="p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white transition-all border border-rose-500/30"
                title="Delete Staff"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {ceoStaffList.length === 0 && (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/30">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No CEO Staff Members Added Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click "Add CEO Staff Member" above to create restricted team access for your DigiMoms Super Admin infrastructure.
          </p>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Add CEO Staff Member</h3>
                  <p className="text-xs text-slate-400">Grant scoped administrative permissions for CEO Control Center</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Staff Member Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number (Login ID)</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={newMobile}
                  onChange={(e) => setNewMobile(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Password</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ceoStaff123"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-bold outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="manager">CEO Operations Manager</option>
                  <option value="support">Customer Support Lead</option>
                  <option value="billing">Billing & Subscription Manager</option>
                </select>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Granular Feature Permissions</label>
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={newPermissions.can_view_restaurants}
                      onChange={(e) => setNewPermissions({ ...newPermissions, can_view_restaurants: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                    />
                    <span>View Restaurants</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={newPermissions.can_edit_restaurants}
                      onChange={(e) => setNewPermissions({ ...newPermissions, can_edit_restaurants: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                    />
                    <span>Edit Restaurants</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={newPermissions.can_view_subscriptions}
                      onChange={(e) => setNewPermissions({ ...newPermissions, can_view_subscriptions: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                    />
                    <span>View Subscriptions</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={newPermissions.can_edit_subscriptions}
                      onChange={(e) => setNewPermissions({ ...newPermissions, can_edit_subscriptions: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                    />
                    <span>Edit Subscriptions</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={newPermissions.can_view_payments}
                      onChange={(e) => setNewPermissions({ ...newPermissions, can_view_payments: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                    />
                    <span>View Payments</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={newPermissions.can_edit_payments}
                      onChange={(e) => setNewPermissions({ ...newPermissions, can_edit_payments: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                    />
                    <span>Edit Payments</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={newPermissions.can_view_reports}
                      onChange={(e) => setNewPermissions({ ...newPermissions, can_view_reports: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                    />
                    <span>View Reports</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={newPermissions.can_view_sql}
                      onChange={(e) => setNewPermissions({ ...newPermissions, can_view_sql: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                    />
                    <span>SQL Console</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={newPermissions.can_view_storage}
                      onChange={(e) => setNewPermissions({ ...newPermissions, can_view_storage: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                    />
                    <span>Storage & System</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={newPermissions.can_view_logs}
                      onChange={(e) => setNewPermissions({ ...newPermissions, can_view_logs: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                    />
                    <span>Audit Trail Logs</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30"
                >
                  Create Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Edit CEO Staff Permissions</h3>
              <button onClick={() => setEditingStaff(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Staff Name</label>
                <input
                  type="text"
                  required
                  value={editingStaff.name}
                  onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  required
                  value={editingStaff.mobile}
                  onChange={(e) => setEditingStaff({ ...editingStaff, mobile: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Role</label>
                <select
                  value={editingStaff.role}
                  onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-bold outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="manager">CEO Operations Manager</option>
                  <option value="support">Customer Support Lead</option>
                  <option value="billing">Billing & Subscription Manager</option>
                </select>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Granular Feature Permissions</label>
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={editingStaff.permissions?.can_view_restaurants || false}
                      onChange={(e) => setEditingStaff({
                        ...editingStaff,
                        permissions: { ...editingStaff.permissions, can_view_restaurants: e.target.checked }
                      })}
                      className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                    />
                    <span>View Restaurants</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={editingStaff.permissions?.can_edit_restaurants || false}
                      onChange={(e) => setEditingStaff({
                        ...editingStaff,
                        permissions: { ...editingStaff.permissions, can_edit_restaurants: e.target.checked }
                      })}
                      className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                    />
                    <span>Edit Restaurants</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={editingStaff.permissions?.can_view_subscriptions || false}
                      onChange={(e) => setEditingStaff({
                        ...editingStaff,
                        permissions: { ...editingStaff.permissions, can_view_subscriptions: e.target.checked }
                      })}
                      className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                    />
                    <span>View Subscriptions</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={editingStaff.permissions?.can_edit_subscriptions || false}
                      onChange={(e) => setEditingStaff({
                        ...editingStaff,
                        permissions: { ...editingStaff.permissions, can_edit_subscriptions: e.target.checked }
                      })}
                      className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                    />
                    <span>Edit Subscriptions</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={editingStaff.permissions?.can_view_payments || false}
                      onChange={(e) => setEditingStaff({
                        ...editingStaff,
                        permissions: { ...editingStaff.permissions, can_view_payments: e.target.checked }
                      })}
                      className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                    />
                    <span>View Payments</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={editingStaff.permissions?.can_edit_payments || false}
                      onChange={(e) => setEditingStaff({
                        ...editingStaff,
                        permissions: { ...editingStaff.permissions, can_edit_payments: e.target.checked }
                      })}
                      className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                    />
                    <span>Edit Payments</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={editingStaff.permissions?.can_view_reports || false}
                      onChange={(e) => setEditingStaff({
                        ...editingStaff,
                        permissions: { ...editingStaff.permissions, can_view_reports: e.target.checked }
                      })}
                      className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                    />
                    <span>View Reports</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={editingStaff.permissions?.can_view_sql || false}
                      onChange={(e) => setEditingStaff({
                        ...editingStaff,
                        permissions: { ...editingStaff.permissions, can_view_sql: e.target.checked }
                      })}
                      className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                    />
                    <span>SQL Console</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={editingStaff.permissions?.can_view_storage || false}
                      onChange={(e) => setEditingStaff({
                        ...editingStaff,
                        permissions: { ...editingStaff.permissions, can_view_storage: e.target.checked }
                      })}
                      className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                    />
                    <span>Storage & System</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={editingStaff.permissions?.can_view_logs || false}
                      onChange={(e) => setEditingStaff({
                        ...editingStaff,
                        permissions: { ...editingStaff.permissions, can_view_logs: e.target.checked }
                      })}
                      className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                    />
                    <span>Audit Trail Logs</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Change Staff Password</h3>
              <button onClick={() => setShowPasswordModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Terminal Password</label>
                <input
                  type="text"
                  required
                  placeholder="Enter new password (min 6 chars)"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-purple-500 outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
