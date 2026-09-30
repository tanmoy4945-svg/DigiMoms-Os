import React, { useState } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import { CeoStaffMember, CeoStaffPermissions } from '../../types';
import {
  Users, UserPlus, Shield, Check, X, Lock, Key, Trash2, Edit3, Smartphone,
  AlertTriangle, Building2, CreditCard, FileText, BarChart3, Database,
  Settings, ShieldCheck, Star, Sparkles, CheckCircle2, RotateCcw, Plus, Eye
} from 'lucide-react';

interface PermissionItem {
  key: keyof CeoStaffPermissions;
  label: string;
  description: string;
  type: 'view' | 'create' | 'edit' | 'setup' | 'delete';
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
      { key: 'can_view_restaurants', label: 'View Restaurants', description: 'View restaurant directory, tenant list, statistics and basic details', type: 'view' },
      { key: 'can_add_restaurants', label: 'Add New Restaurant', description: 'Create new restaurant tenant, assign initial slug & owner credentials', type: 'create' },
      { key: 'can_edit_restaurants', label: 'Edit Restaurants', description: 'Edit restaurant name, phone, address, fee, suspend and resume tenant', type: 'edit' },
      { key: 'can_setup_restaurants', label: 'Full Restaurant Setup (Tables, Menu, QR, Website)', description: 'Complete setup of tables, menu items, categories, QR codes, website & staff', type: 'setup' },
      { key: 'can_manage_free_plans', label: 'Free Access & Trial Extensions', description: 'Grant promotional free days, complimentary offers & trial extensions', type: 'edit' },
      { key: 'can_delete_restaurants', label: 'Archive / Delete / Reset Restaurant', description: 'Archive, permanently delete restaurant tenants and reset tenant data', type: 'delete' },
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
      { key: 'can_delete_subscriptions', label: 'Cancel / Terminate Subscriptions', description: 'Revoke active subscription packages or cancel plans', type: 'delete' },
    ]
  },
  {
    id: 'agreements',
    name: '3. Legal Agreements & Contracts',
    icon: FileText,
    description: 'Official restaurant service contracts and legal agreements',
    color: 'pink',
    items: [
      { key: 'can_view_agreements', label: 'View Agreements', description: 'View signed agreements, contract terms and legal contract status', type: 'view' },
      { key: 'can_create_agreements', label: 'Generate New Agreements', description: 'Generate new official contract/agreement document for a restaurant', type: 'create' },
      { key: 'can_edit_agreements', label: 'Edit Agreement Clauses', description: 'Customize contract clauses, post-trial fees and sign agreements', type: 'edit' },
      { key: 'can_delete_agreements', label: 'Revoke / Delete Agreements', description: 'Revoke or delete contract agreement documents', type: 'delete' },
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
      { key: 'can_delete_payments', label: 'Clear Transaction Logs', description: 'Clear demo/test transactions or transaction history records', type: 'delete' },
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
      { key: 'can_add_team', label: 'Add New Staff Member', description: 'Create new CEO staff members and configure access credentials', type: 'create' },
      { key: 'can_edit_team', label: 'Edit Staff & Permissions', description: 'Modify permissions, change staff passwords, enable/disable accounts', type: 'edit' },
      { key: 'can_delete_team', label: 'Delete Staff Member', description: 'Permanently remove staff members from CEO Control Center', type: 'delete' },
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
      { key: 'can_edit_reports', label: 'Filter & Export Reports Data', description: 'Filter custom date periods and export platform records to CSV/Excel/PDF', type: 'edit' },
      { key: 'can_delete_reports', label: 'Clear Analytics Cache', description: 'Clear or reset cached financial reports and analytics data', type: 'delete' },
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
      { key: 'can_delete_sql', label: 'Destructive SQL Operations', description: 'Drop tables, truncate collections and run destructive SQL commands', type: 'delete' },
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
      { key: 'can_edit_storage', label: 'Upload & Manage Assets', description: 'Upload system assets, configure storage buckets and edit files', type: 'edit' },
      { key: 'can_delete_storage', label: 'Purge Cache & Delete Media', description: 'Purge storage caches and permanently delete media files', type: 'delete' },
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
      { key: 'can_create_backup', label: 'Trigger Full System Backup', description: 'Create instant full system backup package and download JSON snapshot', type: 'create' },
      { key: 'can_edit_backup', label: 'Restore System Snapshot', description: 'Restore database and restore snapshot from uploaded package', type: 'edit' },
      { key: 'can_delete_backup', label: 'Delete Old Backups', description: 'Delete old backup snapshot records from database', type: 'delete' },
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
      { key: 'can_edit_feedback', label: 'Moderate & Respond to Reviews', description: 'Respond to customer reviews, mark resolved and moderate ratings', type: 'edit' },
      { key: 'can_delete_feedback', label: 'Delete Spam Reviews', description: 'Delete spam ratings and remove abusive feedback', type: 'delete' },
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
      { key: 'can_edit_logs', label: 'Filter & Export Audit Logs', description: 'Filter security events and export audit trail to CSV', type: 'edit' },
      { key: 'can_delete_logs', label: 'Purge Audit Logs', description: 'Clear or purge security activity history logs', type: 'delete' },
    ]
  },
];

// Helper: All permissions preset (Full Super Admin)
const ALL_PERMISSIONS_PRESET: CeoStaffPermissions = {
  can_view_restaurants: true,
  can_add_restaurants: true,
  can_edit_restaurants: true,
  can_setup_restaurants: true,
  can_delete_restaurants: true,
  can_manage_free_plans: true,

  can_view_subscriptions: true,
  can_edit_subscriptions: true,
  can_delete_subscriptions: true,

  can_view_agreements: true,
  can_create_agreements: true,
  can_edit_agreements: true,
  can_delete_agreements: true,

  can_view_payments: true,
  can_edit_payments: true,
  can_delete_payments: true,

  can_view_team: true,
  can_add_team: true,
  can_edit_team: true,
  can_delete_team: true,
  can_manage_team: true,

  can_view_reports: true,
  can_edit_reports: true,
  can_delete_reports: true,

  can_view_sql: true,
  can_edit_sql: true,
  can_delete_sql: true,

  can_view_storage: true,
  can_edit_storage: true,
  can_delete_storage: true,

  can_view_backup: true,
  can_create_backup: true,
  can_edit_backup: true,
  can_delete_backup: true,

  can_view_feedback: true,
  can_edit_feedback: true,
  can_delete_feedback: true,

  can_view_logs: true,
  can_edit_logs: true,
  can_delete_logs: true,
};

// Helper: All restaurant permissions preset (Puro Restaurant Setup Specialist)
const ALL_RESTAURANT_PRESET: CeoStaffPermissions = {
  can_view_restaurants: true,
  can_add_restaurants: true, // Explicitly enables Add New Restaurant!
  can_edit_restaurants: true,
  can_setup_restaurants: true,
  can_manage_free_plans: true,
  can_delete_restaurants: false, // Default false for safe operations

  can_view_subscriptions: true,
  can_edit_subscriptions: true,

  can_view_agreements: true,
  can_create_agreements: true,
  can_edit_agreements: true,

  can_view_reports: true,
  can_edit_reports: true,

  can_view_storage: true,
  can_edit_storage: true,

  can_view_feedback: true,
  can_edit_feedback: true,

  can_view_logs: true,
};

// Helper: Billing preset
const BILLING_PRESET: CeoStaffPermissions = {
  can_view_restaurants: true,
  can_view_subscriptions: true,
  can_edit_subscriptions: true,
  can_view_agreements: true,
  can_create_agreements: true,
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
  can_create_backup: true,
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
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const CeoStaffManagement: React.FC<CeoStaffManagementProps> = ({
  canAdd = true,
  canEdit = true,
  canDelete = true
}) => {
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
  const userCanAdd = isMasterCeo || canAdd;
  const userCanEdit = isMasterCeo || canEdit;
  const userCanDelete = isMasterCeo || canDelete;

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
    if (!userCanAdd) {
      showToast('Access Denied: You do not have permission to add CEO staff members.', 'error');
      return;
    }
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
    } catch (err: any) {
      console.error("Create staff error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    if (!userCanEdit) {
      showToast('Access Denied: You do not have permission to edit CEO staff members.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await updateCeoStaffMember(editingStaff.id, {
        name: editingStaff.name.trim(),
        mobile: editingStaff.mobile.trim(),
        role: editingStaff.role,
        permissions: { ...(editingStaff.permissions || {}) }
      });
      setEditingStaff(null);
    } catch (err: any) {
      console.error("Save edit error:", err);
      showToast(`Error saving staff permissions: ${err?.message || 'Unknown error'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPasswordModal || !passwordInput.trim()) return;
    if (!userCanEdit) {
      showToast('Access Denied: You do not have permission to change staff passwords.', 'error');
      return;
    }
    if (passwordInput.trim().length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await updateCeoStaffPassword(showPasswordModal.id, passwordInput.trim());
      setShowPasswordModal(null);
      setPasswordInput('');
    } catch (err: any) {
      console.error("Change password error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Instant 1-Click: Grant All Restaurant Permissions to a staff member
  const handleGrantAllRestaurantPermissions = async (staff: CeoStaffMember) => {
    if (!userCanEdit) {
      showToast('Access Denied: Only Master CEO or authorized manager can modify permissions.', 'error');
      return;
    }
    try {
      const mergedPerms: CeoStaffPermissions = {
        ...(staff.permissions || {}),
        ...ALL_RESTAURANT_PRESET,
        can_view_restaurants: true,
        can_add_restaurants: true, // Enables Add Restaurant
        can_edit_restaurants: true,
        can_setup_restaurants: true,
        can_manage_free_plans: true,
      };
      await updateCeoStaffMember(staff.id, { permissions: mergedPerms });
      showToast(`✅ All Restaurant Setup & Add permissions granted to ${staff.name}!`, 'success');
    } catch (e: any) {
      showToast(`Error updating permissions: ${e.message}`, 'error');
    }
  };

  // Toggle single permission helper
  const togglePermission = (
    key: keyof CeoStaffPermissions,
    currentPerms: CeoStaffPermissions,
    setter: (newPerms: CeoStaffPermissions) => void
  ) => {
    const nextVal = !currentPerms[key];
    const updated: CeoStaffPermissions = {
      ...currentPerms,
      [key]: nextVal
    };
    setter(updated);
  };

  // Set permissions for a specific category
  const setCategoryPermissions = (
    category: MenuCategory,
    mode: 'all' | 'view_only' | 'view_edit' | 'none',
    current: CeoStaffPermissions,
    setter: (p: CeoStaffPermissions) => void
  ) => {
    const updated: CeoStaffPermissions = { ...current };
    category.items.forEach(item => {
      if (mode === 'all') {
        updated[item.key] = true;
      } else if (mode === 'view_only') {
        updated[item.key] = item.type === 'view';
      } else if (mode === 'view_edit') {
        updated[item.key] = item.type === 'view' || item.type === 'create' || item.type === 'edit' || item.type === 'setup';
      } else {
        updated[item.key] = false;
      }
    });
    setter(updated);
  };

  // Render permissions checklist matrix (with 100% reliable interactive cards and SVG checkmarks)
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
              title="Grant Add Restaurant, Full Restaurant Setup, Menu, QRs, Tables, Free Access & Reports"
            >
              🏪 All Restaurant Permissions (Add + Setup + Edit)
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
        <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-1 custom-scrollbar">
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-slate-900 text-purple-400 border border-slate-800">
                      <CatIcon className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        {category.name}
                        {categoryActiveCount > 0 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                            {categoryActiveCount}/{category.items.length} Active
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-400">{category.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 flex-wrap">
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
                      onClick={() => setCategoryPermissions(category, 'view_edit', perms, setPerms)}
                      className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-blue-300 text-[10px] font-bold border border-blue-500/30 cursor-pointer"
                      title="Grant View, Add & Edit (without Delete)"
                    >
                      View + Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryPermissions(category, allChecked ? 'none' : 'all', perms, setPerms)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        allChecked
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-slate-900 hover:bg-slate-800 text-purple-300 border-purple-500/30'
                      }`}
                      title="Grant all permissions (including delete) for this menu"
                    >
                      {allChecked ? 'Revoke All' : 'Full Access'}
                    </button>
                  </div>
                </div>

                {/* Granular Items for this menu - 100% Reliable Custom Card Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {category.items.map(item => {
                    const isChecked = !!perms[item.key];
                    const isCreate = item.type === 'create';
                    const isSetup = item.type === 'setup';
                    const isDelete = item.type === 'delete';
                    const isView = item.type === 'view';

                    return (
                      <div
                        key={item.key}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          togglePermission(item.key, perms, setPerms);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            togglePermission(item.key, perms, setPerms);
                          }
                        }}
                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all select-none ${
                          isChecked
                            ? isCreate
                              ? 'bg-emerald-950/40 border-emerald-500/60 text-white ring-1 ring-emerald-500/20'
                              : isSetup
                              ? 'bg-indigo-950/40 border-indigo-500/50 text-white'
                              : isDelete
                              ? 'bg-rose-950/40 border-rose-500/50 text-white'
                              : isView
                              ? 'bg-blue-950/40 border-blue-500/40 text-white'
                              : 'bg-purple-950/40 border-purple-500/40 text-white'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Custom SVG Checkbox (Impossible to double-fire or miss clicks) */}
                        <div
                          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            isChecked
                              ? isCreate
                                ? 'bg-emerald-600 border-emerald-500 text-white'
                                : isDelete
                                ? 'bg-rose-600 border-rose-500 text-white'
                                : isSetup
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'bg-purple-600 border-purple-500 text-white'
                              : 'border-slate-600 bg-slate-900'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="text-xs font-bold flex items-center gap-1.5 flex-wrap">
                            <span className={isChecked ? 'text-white font-extrabold' : 'text-slate-300'}>
                              {item.label}
                            </span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-bold ${
                              item.type === 'create'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : item.type === 'setup'
                                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                : item.type === 'view'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : item.type === 'delete'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            }`}>
                              {item.type === 'create' ? '+ CREATE / ADD' : item.type}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            {item.description}
                          </p>
                        </div>
                      </div>
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
            <h2 className="text-xl font-extrabold text-white">CEO Control Center Team & Granular Permissions</h2>
            <p className="text-xs text-slate-400">
              Grant customized View, Add/Create, Edit, and Delete permissions for every single menu of the CEO Control Center. Staff can ONLY perform the exact actions you authorize.
            </p>
          </div>
        </div>

        {userCanAdd ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Add CEO Staff Member
          </button>
        ) : (
          <button
            onClick={() => showToast('Access Denied: You do not have permission to add CEO staff members.', 'error')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-500 font-bold text-xs border border-slate-800 flex items-center gap-2 cursor-not-allowed opacity-60 shrink-0"
            title="Add Staff Locked"
          >
            <Lock className="w-4 h-4 text-slate-500" /> Add CEO Staff (Locked)
          </button>
        )}
      </div>

      {/* Staff List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ceoStaffList.map(staff => {
          const activeCount = countActivePermissions(staff.permissions);
          const hasAddRest = staff.permissions?.can_add_restaurants === true;
          const hasSetupRest = staff.permissions?.can_setup_restaurants === true;
          const hasDeleteRest = staff.permissions?.can_delete_restaurants === true;
          const hasFullSuperAdmin = activeCount >= 25;

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

                {/* Highlights Badges for Restaurant Operations */}
                <div className="flex flex-wrap gap-1.5">
                  {hasFullSuperAdmin && (
                    <span className="px-2.5 py-1 rounded-xl bg-purple-950/60 border border-purple-500/40 text-[10px] font-bold text-purple-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Super Admin
                    </span>
                  )}
                  {hasAddRest && (
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5 text-emerald-400" /> Add Rest. Allowed
                    </span>
                  )}
                  {hasSetupRest && (
                    <span className="px-2.5 py-1 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-[10px] font-bold text-indigo-300 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Setup Rest. Allowed
                    </span>
                  )}
                  {hasDeleteRest && (
                    <span className="px-2.5 py-1 rounded-xl bg-rose-950/60 border border-rose-500/40 text-[10px] font-bold text-rose-300 flex items-center gap-1">
                      <Trash2 className="w-3 h-3 text-rose-400" /> Delete Allowed
                    </span>
                  )}
                </div>

                {/* Quick 1-Click Action: Grant All Restaurant Permissions */}
                {(!hasAddRest || !hasSetupRest) && userCanEdit && (
                  <button
                    type="button"
                    onClick={() => handleGrantAllRestaurantPermissions(staff)}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold text-xs border border-emerald-500/40 flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    title="Enable Add Restaurant + Full Restaurant Setup in 1-Click"
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
                      const hasCreate = catActive.some(i => i.type === 'create');
                      const hasEdit = catActive.some(i => i.type === 'edit' || i.type === 'setup');
                      const hasDelete = catActive.some(i => i.type === 'delete');

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
                          className={`flex items-center justify-between gap-1 px-2 py-0.5 rounded border text-[10px] ${
                            hasCreate || hasEdit
                              ? 'bg-purple-950/40 text-purple-300 border-purple-500/30'
                              : 'bg-blue-950/40 text-blue-300 border-blue-500/30'
                          }`}
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                            <span className="truncate font-semibold">{cat.name.replace(/^\d+\.\s*/, '')}</span>
                          </div>
                          <span className="text-[9px] font-mono opacity-80 shrink-0">({catActive.length})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                {userCanEdit ? (
                  <>
                    <button
                      onClick={() => setEditingStaff({ ...staff, permissions: { ...(staff.permissions || {}) } })}
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
                  </>
                ) : (
                  <div className="text-[11px] text-slate-500 italic py-1 text-center w-full">
                    View-Only Access (Editing Locked)
                  </div>
                )}

                {userCanDelete && (
                  <button
                    onClick={() => deleteCeoStaffMember(staff.id)}
                    className="p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white transition-all border border-rose-500/30 cursor-pointer"
                    title="Delete Staff Member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
                  <p className="text-xs text-slate-400">Configure credentials & granular View, Add/Create, Edit and Delete permissions for each menu</p>
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
                  Configure Permissions for All 11 CEO Menus (View, Add, Edit, Delete):
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
                  <p className="text-xs text-slate-400">Configure exact View, Add, Edit and Delete permissions across all menus for this staff member</p>
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
                  Configure Permissions for All 11 CEO Menus (View, Add, Edit, Delete):
                </label>
                {renderPermissionsSelector(
                  editingStaff.permissions || {},
                  (newPerms) => setEditingStaff(prev => prev ? ({ ...prev, permissions: newPerms }) : null)
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
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 disabled:opacity-50 cursor-pointer"
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
