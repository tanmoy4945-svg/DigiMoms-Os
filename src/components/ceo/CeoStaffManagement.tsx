import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { CeoStaffMember, CeoStaffPermissions } from '../../types';
import {
  Users, UserPlus, Shield, Check, X, Lock, Key, Trash2, Edit3, Smartphone,
  AlertTriangle, Building2, CreditCard, FileText, BarChart3, Database,
  Settings, ShieldCheck, Star, Sparkles, CheckCircle2, RotateCcw, Wrench
} from 'lucide-react';

interface PermissionItem {
  key: keyof CeoStaffPermissions;
  label: string;
  description: string;
  type: 'view' | 'edit' | 'setup' | 'delete';
}

interface MenuCategory {
  id: string;
  name: string;
  icon: any;
  description: string;
  color: string;
  items: PermissionItem[];
}

const CEO_MENU_CATEGORIES: MenuCategory[] = [
  {
    id: 'restaurants',
    name: '1. Manage Tenants & Restaurants',
    icon: Building2,
    description: 'Tenant onboarding, profiles, live control & full restaurant setup',
    color: 'emerald',
    items: [
      { key: 'can_view_restaurants', label: 'View Restaurants', description: 'View restaurant directory, tenant list and basic details', type: 'view' },
      { key: 'can_edit_restaurants', label: 'Edit Restaurants', description: 'Edit restaurant profile, contact numbers, settings and credentials', type: 'edit' },
      { key: 'can_setup_restaurants', label: 'Full Restaurant Setup (Tables, Menu, QR, Website)', description: 'Complete setup of tables, menu items, categories, QR codes, website & staff', type: 'setup' },
      { key: 'can_manage_free_plans', label: 'Free Access & Trial Extensions', description: 'Grant promotional free days, complimentary offers & trial extensions', type: 'edit' },
      { key: 'can_delete_restaurants', label: 'Archive / Delete / Reset Restaurant', description: 'Archive, suspend, delete restaurant tenants and reset tenant data', type: 'delete' },
    ]
  },
  {
    id: 'subscriptions',
    name: '2. Subscriptions & Renewal Plans',
    icon: Sparkles,
    description: 'Manage SaaS monthly plans, renewals and expiry notifications',
    color: 'purple',
    items: [
      { key: 'can_view_subscriptions', label: 'View Subscriptions', description: 'View subscription statuses, tiers, renewal dates and expiry alerts', type: 'view' },
      { key: 'can_edit_subscriptions', label: 'Edit / Renew Subscriptions', description: 'Renew monthly plans, upgrade/downgrade subscription tiers', type: 'edit' },
    ]
  },
  {
    id: 'agreements',
    name: '3. Legal Agreements & Contracts',
    icon: FileText,
    description: 'Official restaurant service contracts and legal agreements',
    color: 'pink',
    items: [
      { key: 'can_view_agreements', label: 'View Agreements', description: 'View signed agreements, post-trial fees and terms of service', type: 'view' },
      { key: 'can_edit_agreements', label: 'Generate & Edit Agreements', description: 'Customize agreement clauses, generate official PDF agreements and sign', type: 'edit' },
    ]
  },
  {
    id: 'payments',
    name: '4. Subscription Gateway & Payments',
    icon: CreditCard,
    description: 'Configure Razorpay, PhonePe, PayU and review SaaS revenue',
    color: 'blue',
    items: [
      { key: 'can_view_payments', label: 'View Payments & Transactions', description: 'View incoming subscription transactions, revenue metrics and payment logs', type: 'view' },
      { key: 'can_edit_payments', label: 'Configure Payment Gateways', description: 'Edit Razorpay/PhonePe API keys, webhook secrets, live and demo modes', type: 'edit' },
    ]
  },
  {
    id: 'team',
    name: '5. CEO Team & Staff Management',
    icon: Users,
    description: 'Manage child administrative access and staff credentials',
    color: 'indigo',
    items: [
      { key: 'can_view_team', label: 'View Team Members', description: 'View CEO staff members, roles, contact numbers and login logs', type: 'view' },
      { key: 'can_manage_team', label: 'Manage Staff & Permissions', description: 'Create new CEO staff, change passwords, and configure permissions', type: 'edit' },
    ]
  },
  {
    id: 'reports',
    name: '6. Reports & Financial Analytics',
    icon: BarChart3,
    description: 'Platform turnover, monthly revenue graphs and tenant metrics',
    color: 'teal',
    items: [
      { key: 'can_view_reports', label: 'View Analytics & Reports', description: 'View SaaS income charts, restaurant turnover and growth graphs', type: 'view' },
      { key: 'can_edit_reports', label: 'Export Reports & Data', description: 'Export platform financial records to CSV, Excel and PDF', type: 'edit' },
    ]
  },
  {
    id: 'sql',
    name: '7. Supabase SQL Migrations & Database',
    icon: Database,
    description: 'Direct SQL execution, schema console and migrations',
    color: 'violet',
    items: [
      { key: 'can_view_sql', label: 'View SQL Console', description: 'View database tables, schema columns and migration statuses', type: 'view' },
      { key: 'can_edit_sql', label: 'Execute SQL Migrations', description: 'Execute SQL migrations, alter tables and run database queries', type: 'edit' },
    ]
  },
  {
    id: 'storage',
    name: '8. System Storage & Media Assets',
    icon: Settings,
    description: 'Supabase file buckets, media uploads and caching',
    color: 'cyan',
    items: [
      { key: 'can_view_storage', label: 'View Storage Statistics', description: 'View file buckets, storage capacity and uploaded media files', type: 'view' },
      { key: 'can_edit_storage', label: 'Manage Storage & Cache', description: 'Upload system assets, purge cache and remove unlinked media', type: 'edit' },
    ]
  },
  {
    id: 'backup',
    name: '9. System Snapshot & Backup',
    icon: ShieldCheck,
    description: 'Automated data backup, JSON exports and disaster recovery',
    color: 'amber',
    items: [
      { key: 'can_view_backup', label: 'View Backup Status', description: 'View system backup history, snapshot list and database status', type: 'view' },
      { key: 'can_edit_backup', label: 'Trigger Backup & Restore', description: 'Create instant full system backup, download JSON and restore', type: 'edit' },
    ]
  },
  {
    id: 'feedback',
    name: '10. Global Customer Feedback',
    icon: Star,
    description: 'Monitor multi-restaurant ratings, food reviews and complaints',
    color: 'yellow',
    items: [
      { key: 'can_view_feedback', label: 'View Customer Feedback', description: 'View customer ratings, dish reviews, feedback and complaints', type: 'view' },
      { key: 'can_edit_feedback', label: 'Moderate Feedback & Reviews', description: 'Respond to customer reviews, moderate feedback and hide spam', type: 'edit' },
    ]
  },
  {
    id: 'logs',
    name: '11. System Audit Trail Logs',
    icon: FileText,
    description: 'Real-time security logs, login attempts and actions',
    color: 'rose',
    items: [
      { key: 'can_view_logs', label: 'View Audit Trail Logs', description: 'View real-time event logs, system operations and security trail', type: 'view' },
      { key: 'can_edit_logs', label: 'Manage & Export Logs', description: 'Export security audit trail to CSV and manage activity logs', type: 'edit' },
    ]
  },
];

// Helper: All permissions preset
const ALL_PERMISSIONS_PRESET: CeoStaffPermissions = {
  can_view_restaurants: true,
  can_edit_restaurants: true,
  can_setup_restaurants: true,
  can_delete_restaurants: true,
  can_manage_free_plans: true,
  can_view_subscriptions: true,
  can_edit_subscriptions: true,
  can_view_agreements: true,
  can_edit_agreements: true,
  can_view_payments: true,
  can_edit_payments: true,
  can_view_team: true,
  can_manage_team: true,
  can_view_reports: true,
  can_edit_reports: true,
  can_view_sql: true,
  can_edit_sql: true,
  can_view_storage: true,
  can_edit_storage: true,
  can_view_backup: true,
  can_edit_backup: true,
  can_view_feedback: true,
  can_edit_feedback: true,
  can_view_logs: true,
  can_edit_logs: true,
};

// Helper: All restaurant permissions preset
const ALL_RESTAURANT_PRESET: CeoStaffPermissions = {
  can_view_restaurants: true,
  can_edit_restaurants: true,
  can_setup_restaurants: true,
  can_manage_free_plans: true,
  can_delete_restaurants: false,
  can_view_subscriptions: true,
  can_edit_subscriptions: true,
  can_view_agreements: true,
  can_edit_agreements: true,
  can_view_reports: true,
  can_edit_reports: true,
  can_view_storage: true,
  can_edit_storage: true,
  can_view_feedback: true,
  can_view_logs: true,
};

// Helper: Billing preset
const BILLING_PRESET: CeoStaffPermissions = {
  can_view_restaurants: true,
  can_view_subscriptions: true,
  can_edit_subscriptions: true,
  can_view_agreements: true,
  can_edit_agreements: true,
  can_view_payments: true,
  can_edit_payments: true,
  can_view_reports: true,
  can_edit_reports: true,
};

// Helper: Tech & Database preset
const TECH_PRESET: CeoStaffPermissions = {
  can_view_restaurants: true,
  can_view_sql: true,
  can_edit_sql: true,
  can_view_storage: true,
  can_edit_storage: true,
  can_view_backup: true,
  can_edit_backup: true,
  can_view_logs: true,
  can_edit_logs: true,
};

// Helper: View-only preset
const VIEW_ONLY_PRESET: CeoStaffPermissions = {
  can_view_restaurants: true,
  can_view_subscriptions: true,
  can_view_agreements: true,
  can_view_payments: true,
  can_view_team: true,
  can_view_reports: true,
  can_view_sql: true,
  can_view_storage: true,
  can_view_backup: true,
  can_view_feedback: true,
  can_view_logs: true,
};

interface CeoStaffManagementProps {
  canManage?: boolean;
}

export const CeoStaffManagement: React.FC<CeoStaffManagementProps> = ({ canManage = true }) => {
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

  const isMasterCeo = !currentCeoStaff;
  const userCanManage = isMasterCeo || canManage;

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<CeoStaffMember | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState<CeoStaffMember | null>(null);

  const [newName, setNewName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newPassword, setNewPassword] = useState('ceoStaff123');
  const [newRole, setNewRole] = useState<'manager' | 'support' | 'billing'>('manager');
  const [newPermissions, setNewPermissions] = useState<CeoStaffPermissions>({ ...ALL_RESTAURANT_PRESET });

  const [passwordInput, setPasswordInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Count active permissions for a member
  const countActivePermissions = (perms: CeoStaffPermissions | undefined): number => {
    if (!perms) return 0;
    return Object.values(perms).filter(Boolean).length;
  };

  const totalPossiblePermissions = CEO_MENU_CATEGORIES.reduce((acc, cat) => acc + cat.items.length, 0);

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
      setNewPermissions({ ...ALL_RESTAURANT_PRESET });
      setShowAddModal(false);
    } catch (err) {
      // Toast handled inside addCeoStaffMember
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
      // Toast handled inside updateCeoStaffMember
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
      // Toast handled inside updateCeoStaffMember
    } finally {
      setIsSubmitting(false);
    }
  };

  // Instant 1-Click: Grant All Restaurant Permissions to a staff member
  const handleGrantAllRestaurantPermissions = async (staff: CeoStaffMember) => {
    if (!userCanManage) {
      showToast('Access Denied: Only Master CEO or authorized manager can modify permissions.', 'error');
      return;
    }
    try {
      const mergedPerms: CeoStaffPermissions = {
        ...staff.permissions,
        ...ALL_RESTAURANT_PRESET,
        can_setup_restaurants: true,
        can_edit_restaurants: true,
        can_view_restaurants: true,
        can_manage_free_plans: true,
      };
      await updateCeoStaffMember(staff.id, { permissions: mergedPerms });
      showToast(`✅ All Restaurant Setup & Management permissions granted to ${staff.name}!`, 'success');
    } catch (e: any) {
      showToast(`Error updating permissions: ${e.message}`, 'error');
    }
  };

  // Toggle single permission helper
  const togglePermission = (
    perms: CeoStaffPermissions,
    key: keyof CeoStaffPermissions,
    setter: (p: CeoStaffPermissions) => void
  ) => {
    setter({
      ...perms,
      [key]: !perms[key]
    });
  };

  // Set all permissions in a specific category
  const setCategoryPermissions = (
    category: MenuCategory,
    mode: 'all' | 'view_only' | 'none',
    current: CeoStaffPermissions,
    setter: (p: CeoStaffPermissions) => void
  ) => {
    const updated = { ...current };
    category.items.forEach(item => {
      if (mode === 'all') {
        updated[item.key] = true;
      } else if (mode === 'view_only') {
        updated[item.key] = item.type === 'view';
      } else {
        updated[item.key] = false;
      }
    });
    setter(updated);
  };

  // Render permissions checklist matrix
  const renderPermissionsSelector = (
    perms: CeoStaffPermissions,
    setPerms: (p: CeoStaffPermissions) => void
  ) => {
    const activeCount = countActivePermissions(perms);

    return (
      <div className="space-y-4">
        {/* Preset Quick Actions Bar */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Quick Permission Presets:
            </span>
            <span className="text-[11px] font-mono font-bold text-purple-300">
              {activeCount} of {totalPossiblePermissions} Active
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPerms({ ...ALL_PERMISSIONS_PRESET })}
              className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              👑 All Permissions (Super Admin)
            </button>

            <button
              type="button"
              onClick={() => setPerms({ ...ALL_RESTAURANT_PRESET })}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Grant full restaurant setup, tables, menu, QR codes, agreements & reports"
            >
              🏪 All Restaurant Permissions (Full Setup)
            </button>

            <button
              type="button"
              onClick={() => setPerms({ ...BILLING_PRESET })}
              className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 text-blue-200 border border-blue-500/30 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              💳 Billing & Finance
            </button>

            <button
              type="button"
              onClick={() => setPerms({ ...TECH_PRESET })}
              className="px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/40 text-violet-200 border border-violet-500/30 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              🛠️ Tech & Database
            </button>

            <button
              type="button"
              onClick={() => setPerms({ ...VIEW_ONLY_PRESET })}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              👁️ View-Only (All Menus)
            </button>

            <button
              type="button"
              onClick={() => setPerms({})}
              className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Clear All
            </button>
          </div>
        </div>

        {/* 11 Granular Menu Categories */}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
          {CEO_MENU_CATEGORIES.map(category => {
            const CatIcon = category.icon;
            const categoryActiveCount = category.items.filter(item => !!perms[item.key]).length;
            const allChecked = categoryActiveCount === category.items.length;

            return (
              <div
                key={category.id}
                className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 transition-all hover:border-slate-700"
              >
                {/* Category Header with Quick Toggles */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-slate-900 text-purple-400 border border-slate-800">
                      <CatIcon className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        {category.name}
                        {categoryActiveCount > 0 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {categoryActiveCount}/{category.items.length}
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-400">{category.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setCategoryPermissions(category, 'view_only', perms, setPerms)}
                      className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-800 cursor-pointer"
                      title="Grant View Only for this menu"
                    >
                      View Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryPermissions(category, allChecked ? 'none' : 'all', perms, setPerms)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        allChecked
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-slate-900 hover:bg-slate-800 text-purple-300 border-purple-500/30'
                      }`}
                      title="Grant all permissions for this menu"
                    >
                      {allChecked ? 'Revoke All' : 'Grant All'}
                    </button>
                  </div>
                </div>

                {/* Granular Items for this menu */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {category.items.map(item => {
                    const isChecked = !!perms[item.key];
                    const isSetup = item.type === 'setup';
                    const isDelete = item.type === 'delete';
                    const isEdit = item.type === 'edit';

                    return (
                      <label
                        key={item.key}
                        onClick={() => togglePermission(perms, item.key, setPerms)}
                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                          isChecked
                            ? isSetup
                              ? 'bg-emerald-950/40 border-emerald-500/50 text-white'
                              : isDelete
                              ? 'bg-rose-950/40 border-rose-500/50 text-white'
                              : 'bg-purple-950/40 border-purple-500/40 text-white'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by label click
                          className="mt-0.5 w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900 shrink-0 pointer-events-none"
                        />
                        <div className="space-y-0.5 min-w-0">
                          <div className="text-xs font-bold flex items-center gap-1.5 flex-wrap">
                            <span className={isChecked ? 'text-white' : 'text-slate-300'}>
                              {item.label}
                            </span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-bold ${
                              item.type === 'setup'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : item.type === 'view'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : item.type === 'delete'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            }`}>
                              {item.type}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            {item.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">CEO Control Center Team & Granular Menu Access</h2>
            <p className="text-xs text-slate-400">
              Grant customized View and Edit permissions for every single menu of the CEO Control Center, or assign full restaurant setup rights in 1 click.
            </p>
          </div>
        </div>

        {userCanManage && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Add CEO Staff Member
          </button>
        )}
      </div>

      {/* Staff List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ceoStaffList.map(staff => {
          const activeCount = countActivePermissions(staff.permissions);
          const hasFullRestaurantSetup = staff.permissions?.can_setup_restaurants === true;
          const hasFullSuperAdmin = activeCount >= 20;

          return (
            <div key={staff.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-white">{staff.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-purple-400 font-mono mt-0.5">
                      <Smartphone className="w-3.5 h-3.5" /> {staff.mobile}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      staff.status === 'active' ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' : 'bg-rose-950 text-rose-400 border-rose-500/30'
                    }`}>
                      {staff.status}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {activeCount} / {totalPossiblePermissions} Perms
                    </span>
                  </div>
                </div>

                {/* Role & Status Box */}
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

                {/* Highlights Badge */}
                {hasFullSuperAdmin ? (
                  <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-[11px] font-bold text-purple-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>👑 Full Super Admin Access (All Menus View + Edit)</span>
                  </div>
                ) : hasFullRestaurantSetup ? (
                  <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>🏪 Full Restaurant Setup Authorized (Menu, QRs, Tables)</span>
                  </div>
                ) : null}

                {/* Quick 1-Click Action: Grant All Restaurant Permissions */}
                {!hasFullRestaurantSetup && userCanManage && (
                  <button
                    type="button"
                    onClick={() => handleGrantAllRestaurantPermissions(staff)}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold text-xs border border-emerald-500/40 flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    title="Grant All Restaurant Setup & Management permissions in 1 click"
                  >
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    Grant All Restaurant Permissions (1-Click)
                  </button>
                )}

                {/* Menu Access Summary Chips */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Authorized Menus ({activeCount} Permissions):
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    {CEO_MENU_CATEGORIES.map(cat => {
                      const catActive = cat.items.filter(i => !!staff.permissions?.[i.key]);
                      const hasEdit = catActive.some(i => i.type === 'edit' || i.type === 'setup' || i.type === 'delete');
                      const hasView = catActive.some(i => i.type === 'view');

                      if (catActive.length === 0) {
                        return (
                          <div key={cat.id} className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/60 text-slate-600 border border-slate-900 text-[10px]">
                            <X className="w-2.5 h-2.5" />
                            <span className="truncate">{cat.name.replace(/^\d+\.\s*/, '')}</span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={cat.id}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] ${
                            hasEdit
                              ? 'bg-purple-950/40 text-purple-300 border-purple-500/30'
                              : 'bg-blue-950/40 text-blue-300 border-blue-500/30'
                          }`}
                        >
                          <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                          <span className="truncate font-semibold">{cat.name.replace(/^\d+\.\s*/, '')}</span>
                          <span className="text-[9px] font-mono opacity-80">({catActive.length})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                {userCanManage ? (
                  <>
                    <button
                      onClick={() => setEditingStaff(staff)}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Permissions
                    </button>

                    <button
                      onClick={() => setShowPasswordModal(staff)}
                      className="px-2.5 py-2 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center gap-1 transition-all cursor-pointer"
                      title="Change Password"
                    >
                      <Key className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => toggleCeoStaffStatus(staff.id)}
                      className={`px-2.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        staff.status === 'active' ? 'bg-rose-950 text-rose-300 border border-rose-500/30 hover:bg-rose-900' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900'
                      }`}
                      title={staff.status === 'active' ? 'Disable Account' : 'Enable Account'}
                    >
                      {staff.status === 'active' ? 'Disable' : 'Enable'}
                    </button>

                    <button
                      onClick={() => deleteCeoStaffMember(staff.id)}
                      className="p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white transition-all border border-rose-500/30 cursor-pointer"
                      title="Delete Staff"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-[11px] text-slate-500 italic py-1 text-center w-full">
                    View-Only access. Contact Master CEO to edit staff.
                  </div>
                )}
              </div>
            </div>
          );
        })}
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Add CEO Staff Member</h3>
                  <p className="text-xs text-slate-400">Configure credentials & granular View vs Edit permissions for each menu</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              </div>

              {/* Granular Menu Permissions Selector */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Configure Permissions for All 11 CEO Menus:
                </label>
                {renderPermissionsSelector(newPermissions, setNewPermissions)}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Edit CEO Staff Permissions — {editingStaff.name}</h3>
                  <p className="text-xs text-slate-400">Toggle View and Edit permissions across all menus for this staff member</p>
                </div>
              </div>
              <button onClick={() => setEditingStaff(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              </div>

              {/* Granular Menu Permissions Selector */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Configure Permissions for All 11 CEO Menus:
                </label>
                {renderPermissionsSelector(
                  editingStaff.permissions || {},
                  (newPerms) => setEditingStaff({ ...editingStaff, permissions: newPerms })
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Save Permissions'}
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
              <h3 className="text-lg font-bold text-white">Change Staff Password — {showPasswordModal.name}</h3>
              <button onClick={() => setShowPasswordModal(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
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
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
