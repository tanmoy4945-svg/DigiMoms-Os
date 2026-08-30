import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Restaurant, Staff, Table, TableSession, MenuCategory, MenuItem, Order,
  CustomerFeedback, CallWaiterRequest, ActivityLog, AuditLog, Language,
  CeoRazorpayConfig, CeoPaymentConfig, DigiMomsSubscriptionPayment, PaymentTransaction, SubscriptionHistory,
  RestaurantWebsiteSettings, RestaurantServiceItem, RestaurantPricingItem, RestaurantLegalPages, RestaurantSocialLinks,
  AppNotification, NotificationEventType, OfflinePaymentRecord, OfflinePaymentMethod
} from '../types';
import { 
  playNotificationSound, unlockAudioContext, 
  isSoundEnabled, setSoundEnabled, 
  isNotificationsEnabled, setNotificationsEnabled, 
  getSoundVolume, setSoundVolume, SoundType 
} from '../utils/sound';
import { supabase } from '../lib/supabase';
import { normalizeImageUrl } from '../utils/imageUrl';
import { registerServiceWorker, triggerSystemNotification } from '../utils/notificationService';
import { safeFetchJson } from '../lib/safeFetch';
import { sanitizeSensitiveCredentials } from '../utils/productionSafety';

export type ActiveView = 
  | 'public-home' 
  | 'public-about'
  | 'public-pricing' 
  | 'public-contact' 
  | 'public-restaurant' 
  | 'ceo-login' 
  | 'ceo-dashboard' 
  | 'owner-login' 
  | 'owner-dashboard' 
  | 'staff-login' 
  | 'waiter-terminal' 
  | 'kitchen-terminal' 
  | 'customer-qr';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface SaaSContextType {
  // Navigation & View
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  activeSlug: string;
  setActiveSlug: (slug: string) => void;
  activeShortCode: string;
  setActiveShortCode: (code: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;

  // Toast & Realtime Status & Notifications
  toast: ToastState | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  realtimeStatus: 'connected' | 'connecting' | 'disconnected';
  reconnectRealtime: () => void;

  // Realtime Notifications & Sound
  notifications: AppNotification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  soundEnabled: boolean;
  setSoundEnabledState: (enabled: boolean) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabledState: (enabled: boolean) => void;
  soundVolume: number;
  setSoundVolumeState: (vol: number) => void;
  triggerRealtimeEventNotification: (opts: {
    type: NotificationEventType;
    title: string;
    body: string;
    restaurant_id?: string;
    order_id?: string;
    table_number?: string;
    target_roles?: ('owner' | 'waiter' | 'kitchen' | 'ceo' | 'customer')[];
    eventId?: string;
  }) => void;

  // Authentication State
  ceoAuthenticated: boolean;
  setCeoAuthenticated: (val: boolean) => void;
  currentOwner: Restaurant | null;
  setCurrentOwner: (rest: Restaurant | null) => void;
  currentStaff: Staff | null;
  setCurrentStaff: (staff: Staff | null) => void;

  // Core Data
  restaurants: Restaurant[];
  staffList: Staff[];
  tables: Table[];
  tableSessions: TableSession[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  orders: Order[];
  feedbackList: CustomerFeedback[];
  callRequests: CallWaiterRequest[];
  activityLogs: ActivityLog[];
  auditLogs: AuditLog[];
  subscriptionHistory: SubscriptionHistory[];

  // CEO Actions
  loginCeo: (mobile: string, pass: string, pin: string, rememberMe?: boolean) => boolean;
  logoutCeo: () => void;
  ceoRazorpayConfig: CeoRazorpayConfig;
  updateCeoRazorpayConfig: (config: Partial<CeoRazorpayConfig>) => void;
  ceoPaymentConfig: CeoPaymentConfig;
  updateCeoPaymentConfig: (config: Partial<CeoPaymentConfig>) => Promise<void>;
  addRestaurant: (newRest: Partial<Restaurant>) => Promise<Restaurant>;
  updateRestaurant: (id: string, updates: Partial<Restaurant>) => Promise<void>;
  suspendRestaurant: (id: string) => Promise<void>;
  resumeRestaurant: (id: string) => Promise<void>;
  grantTrial: (id: string, days: number) => Promise<void>;
  endTrial: (id: string) => Promise<void>;
  extendTrial: (id: string, days: number) => Promise<void>;
  grantFreeOffer: (id: string, days: number) => Promise<void>;
  endFreeOffer: (id: string) => Promise<void>;
  extendFreeOffer: (id: string, days: number) => Promise<void>;
  grantFreeExtension: (id: string, days: number, reason?: string) => Promise<void>;
  renewSubscription: (id: string, months: number) => Promise<void>;
  renewRestaurantMonthly: (id: string, months?: number, paymentDetails?: { transactionId?: string; mode?: string; razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string; payu_txnid?: string; payu_mihpayid?: string; payu_hash?: string }) => Promise<void>;
  archiveRestaurant: (id: string) => Promise<void>;
  deleteRestaurantPermanently: (id: string) => Promise<void>;
  factoryResetRestaurant: (id: string, ceoPass: string) => Promise<boolean>;
  executeProductionReset: (ceoPassword?: string) => Promise<boolean>;

  // Owner Actions
  loginOwner: (mobile: string, pass: string, rememberMe?: boolean) => Restaurant | null;
  logoutOwner: () => void;
  updateOwnerProfile: (updates: Partial<Restaurant>) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  updateCategory: (id: string, name: string, is_hidden: boolean) => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'id' | 'restaurant_id'>) => Promise<void>;
  updateMenuItem: (id: string, item: Partial<MenuItem>) => Promise<void>;
  toggleMenuItemAvailability: (id: string) => Promise<void>;
  addTable: (tableNumber: string) => Promise<void>;
  clearTableSession: (tableId: string) => Promise<void>;
  addStaffMember: (name: string, mobile: string, pass: string, role: 'waiter' | 'kitchen') => Promise<void>;
  toggleStaffStatus: (staffId: string) => Promise<void>;
  deleteStaffMember: (staffId: string) => Promise<void>;
  updateStaffPassword: (staffId: string, newPassword: string) => Promise<void>;

  // Staff Actions
  loginStaff: (mobile: string, pass: string) => Staff | null;
  logoutStaff: () => void;
  acceptCallRequest: (requestId: string, staffName: string) => Promise<void>;
  completeCallRequest: (requestId: string) => Promise<void>;
  verifyCashOrder: (orderId: string, actorName?: string, actorType?: 'owner' | 'staff') => Promise<void>;
  confirmCashPayment: (orderId: string, cashAmount: number, actorId: string, actorType: 'waiter' | 'owner' | 'staff', actorName: string) => Promise<void>;
  recordOfflinePayment: (orderId: string, payments: { method: OfflinePaymentMethod; amount: number; reference?: string; note?: string }[], actorName?: string, actorType?: 'owner' | 'staff') => Promise<boolean>;
  verifyUpiPayment: (orderId: string, actorName?: string, actorType?: 'owner' | 'staff') => Promise<void>;
  rejectUpiPayment: (orderId: string, actorName?: string, actorType?: 'owner' | 'staff') => Promise<void>;
  submitUpiPaymentConfirmation: (orderId: string, upiRef?: string) => Promise<boolean>;
  processRazorpayOnlinePayment: (orderId: string, onlineAmountToPay: number, razorpayResponse: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }, customerMobile?: string) => Promise<boolean>;
  processPayUOnlinePayment: (orderId: string, onlineAmountToPay: number, payuResponse: { txnid: string; mihpayid?: string; hash?: string; status?: string }, customerMobile?: string) => Promise<boolean>;
  processPhonePeOnlinePayment: (orderId: string, onlineAmountToPay: number, phonePeResponse: { transactionId: string; mode?: string }, customerMobile?: string) => Promise<boolean>;
  updateOrderPaymentMethod: (orderId: string, newMode: 'cash' | 'online' | 'partial' | 'upi_qr', partialOnlineAmount?: number) => Promise<void>;
  paymentTransactions: PaymentTransaction[];
  acceptOrder: (orderId: string, actorName?: string, actorType?: 'owner' | 'staff') => Promise<void>;
  startCookingOrder: (orderId: string, actorName?: string, actorType?: 'owner' | 'staff') => Promise<void>;
  markOrderReady: (orderId: string, actorName?: string, actorType?: 'owner' | 'staff') => Promise<void>;
  serveOrder: (orderId: string, actorName?: string, actorType?: 'owner' | 'staff') => Promise<void>;
  completeOrder: (orderId: string, actorName?: string, actorType?: 'owner' | 'staff') => Promise<void>;

  // Customer Actions
  placeOrder: (
    restaurantId: string,
    sessionId: string,
    tableId: string,
    tableNumber: string,
    items: { menu_id: string; menu_name: string; quantity: number; price: number; special_instructions?: string }[],
    paymentMode: 'cash' | 'demo' | 'online' | 'partial' | 'upi_qr',
    customerMobile?: string,
    partialDetails?: { online_amount: number; cash_amount: number },
    razorpayDetails?: { razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string },
    notes?: string,
    financialBreakdown?: {
      subtotal?: number;
      tax?: number;
      discount?: number;
      packaging_charge?: number;
      service_charge?: number;
      online_discount?: number;
      coupon_discount?: number;
      coupon_code?: string;
      grand_total?: number;
    }
  ) => Promise<Order>;
  logAudit: (audit: Omit<AuditLog, 'id' | 'created_at'>) => Promise<void>;
  sendCallWaiterRequest: (
    restaurantId: string,
    sessionId: string,
    tableNumber: string,
    requestType: 'call' | 'water' | 'spoon' | 'tissue' | 'cleaning' | 'bill' | 'help'
  ) => Promise<void>;
  submitCustomerFeedback: (feedback: Omit<CustomerFeedback, 'id' | 'created_at'>) => Promise<void>;
  getActiveTableSession: (restaurantId: string, tableId: string) => Promise<TableSession | null>;
  getOrCreateTableSession: (restaurantId: string, tableId: string, tableNumber: string, mobile?: string) => Promise<TableSession>;

  // Public Website & Portfolio Management
  websiteSettings: RestaurantWebsiteSettings[];
  restaurantServices: RestaurantServiceItem[];
  restaurantPricing: RestaurantPricingItem[];
  restaurantLegalPages: RestaurantLegalPages[];
  restaurantSocialLinks: RestaurantSocialLinks[];
  getWebsiteSettings: (restaurantId: string) => RestaurantWebsiteSettings;
  updateWebsiteSettings: (restaurantId: string, settings: Partial<RestaurantWebsiteSettings>) => Promise<void>;
  getServices: (restaurantId: string) => RestaurantServiceItem[];
  addService: (restaurantId: string, service: Omit<RestaurantServiceItem, 'id' | 'restaurant_id'>) => Promise<void>;
  updateService: (serviceId: string, updates: Partial<RestaurantServiceItem>) => Promise<void>;
  deleteService: (serviceId: string) => Promise<void>;
  getPricing: (restaurantId: string) => RestaurantPricingItem[];
  addPricingItem: (restaurantId: string, item: Omit<RestaurantPricingItem, 'id' | 'restaurant_id'>) => Promise<void>;
  updatePricingItem: (itemId: string, updates: Partial<RestaurantPricingItem>) => Promise<void>;
  deletePricingItem: (itemId: string) => Promise<void>;
  getLegalPages: (restaurantId: string) => RestaurantLegalPages;
  updateLegalPages: (restaurantId: string, pages: Partial<RestaurantLegalPages>) => Promise<void>;
  getSocialLinks: (restaurantId: string) => RestaurantSocialLinks;
  updateSocialLinks: (restaurantId: string, links: Partial<RestaurantSocialLinks>) => Promise<void>;
}

const SaaSContext = createContext<SaaSContextType | undefined>(undefined);

const parseRouteFromPath = (
  pathname: string,
  isCeoAuth: boolean,
  owner: Restaurant | null,
  staff: Staff | null
): { view: ActiveView; shortCode: string; slug: string } => {
  const cleanPath = pathname.trim().replace(/\/+$/, '') || '/';

  if (cleanPath === '/login-ceo' || cleanPath === '/ceo') {
    return { view: isCeoAuth ? 'ceo-dashboard' : 'ceo-login', shortCode: '', slug: '' };
  }
  if (cleanPath === '/login-owner' || cleanPath === '/owner' || cleanPath === '/login') {
    return { view: owner ? 'owner-dashboard' : 'owner-login', shortCode: '', slug: '' };
  }
  if (cleanPath === '/login-staff' || cleanPath === '/staff' || cleanPath === '/login-worker' || cleanPath === '/worker') {
    return {
      view: staff ? (staff.role === 'kitchen' ? 'kitchen-terminal' : 'waiter-terminal') : 'staff-login',
      shortCode: '',
      slug: ''
    };
  }
  if (cleanPath === '/ceo-dashboard' || cleanPath === '/ceo-settings') {
    return { view: isCeoAuth ? 'ceo-dashboard' : 'ceo-login', shortCode: '', slug: '' };
  }
  if (
    cleanPath === '/owner-dashboard' ||
    cleanPath === '/owner-payment' ||
    cleanPath === '/subscription' ||
    cleanPath === '/renew' ||
    cleanPath === '/billing' ||
    cleanPath === '/payment' ||
    cleanPath === '/pay' ||
    cleanPath === '/checkout' ||
    cleanPath === '/payment-success' ||
    cleanPath === '/payment-failure'
  ) {
    return { view: owner ? 'owner-dashboard' : 'owner-login', shortCode: '', slug: '' };
  }
  if (cleanPath === '/waiter-terminal' || cleanPath === '/waiter') {
    return { view: staff ? 'waiter-terminal' : 'staff-login', shortCode: '', slug: '' };
  }
  if (cleanPath === '/kitchen-terminal' || cleanPath === '/kitchen') {
    return { view: staff ? 'kitchen-terminal' : 'staff-login', shortCode: '', slug: '' };
  }
  if (cleanPath.startsWith('/q/')) {
    const rawCode = cleanPath.split('/q/')[1]?.split('/')[0]?.split('?')[0]?.split('#')[0] || '';
    return { view: 'customer-qr', shortCode: rawCode.trim(), slug: '' };
  }
  if (cleanPath.startsWith('/r/')) {
    const rawSlug = cleanPath.split('/r/')[1]?.split('/')[0]?.split('?')[0]?.split('#')[0] || '';
    return { view: 'public-restaurant', shortCode: '', slug: rawSlug.trim() };
  }
  if (cleanPath === '/about' || cleanPath === '/public-about') {
    return { view: 'public-about', shortCode: '', slug: '' };
  }
  if (cleanPath === '/pricing' || cleanPath === '/public-pricing') {
    return { view: 'public-pricing', shortCode: '', slug: '' };
  }
  if (cleanPath === '/contact' || cleanPath === '/public-contact') {
    return { view: 'public-contact', shortCode: '', slug: '' };
  }
  if (
    cleanPath === '/privacy-policy' ||
    cleanPath === '/terms-and-conditions' ||
    cleanPath === '/refund-policy' ||
    cleanPath === '/shipping-policy' ||
    cleanPath === '/legal'
  ) {
    return { view: 'public-about', shortCode: '', slug: '' };
  }

  return { view: 'public-home', shortCode: '', slug: '' };
};

export const SaaSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth State
  const [ceoAuthenticated, setCeoAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('digimoms_ceo_auth') === 'true' || localStorage.getItem('digimoms_ceo_auth') === 'true';
  });
  const [currentOwner, setCurrentOwner] = useState<Restaurant | null>(() => {
    const savedSession = sessionStorage.getItem('digimoms_current_owner');
    if (savedSession) return JSON.parse(savedSession);
    const savedLocal = localStorage.getItem('digimoms_current_owner');
    if (savedLocal) return JSON.parse(savedLocal);
    return null;
  });
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(() => {
    const savedSession = sessionStorage.getItem('digimoms_current_staff');
    if (savedSession) return JSON.parse(savedSession);
    return null;
  });

  // Initial Route calculation based on window.location.pathname
  const initialRoute = parseRouteFromPath(
    window.location.pathname,
    sessionStorage.getItem('digimoms_ceo_auth') === 'true' || localStorage.getItem('digimoms_ceo_auth') === 'true',
    (() => {
      try {
        const s = sessionStorage.getItem('digimoms_current_owner') || localStorage.getItem('digimoms_current_owner');
        return s ? JSON.parse(s) : null;
      } catch { return null; }
    })(),
    (() => {
      try {
        const s = sessionStorage.getItem('digimoms_current_staff');
        return s ? JSON.parse(s) : null;
      } catch { return null; }
    })()
  );

  // Navigation & View State
  const [activeView, setActiveViewRaw] = useState<ActiveView>(initialRoute.view);
  const [activeSlug, setActiveSlugState] = useState<string>(initialRoute.slug);
  const [activeShortCode, setActiveShortCodeRaw] = useState<string>(initialRoute.shortCode);

  // 15-Minute Inactivity Auto-Logout
  useEffect(() => {
    if (!ceoAuthenticated && !currentOwner && !currentStaff) return;

    let timeoutId: any = null;
    const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutes

    const resetInactivityTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (ceoAuthenticated) {
          setCeoAuthenticated(false);
          sessionStorage.removeItem('digimoms_ceo_auth');
          localStorage.removeItem('digimoms_ceo_auth');
          setActiveViewRaw('ceo-login');
          showToast('CEO session ended due to 15 minutes of inactivity.', 'info');
        }
        if (currentOwner) {
          setCurrentOwner(null);
          sessionStorage.removeItem('digimoms_current_owner');
          localStorage.removeItem('digimoms_current_owner');
          setActiveViewRaw('owner-login');
          showToast('Owner session ended due to 15 minutes of inactivity.', 'info');
        }
        if (currentStaff) {
          setCurrentStaff(null);
          sessionStorage.removeItem('digimoms_current_staff');
          setActiveViewRaw('staff-login');
          showToast('Staff session ended due to 15 minutes of inactivity.', 'info');
        }
      }, INACTIVITY_LIMIT_MS);
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(evt => window.addEventListener(evt, resetInactivityTimer, { passive: true }));
    resetInactivityTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach(evt => window.removeEventListener(evt, resetInactivityTimer));
    };
  }, [ceoAuthenticated, currentOwner, currentStaff]);

  const [language, setLanguageRaw] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('digimoms_lang');
      if (saved === 'bn' || saved === 'en' || saved === 'hi') return saved;
    } catch (e) {
      // ignore
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageRaw(lang);
    try {
      localStorage.setItem('digimoms_lang', lang);
    } catch (e) {
      // ignore
    }
  };

  // Custom setters that synchronize browser URL state
  const setActiveView = (view: ActiveView) => {
    setActiveViewRaw(view);
    let newPath = '/';
    if (view === 'ceo-login') newPath = '/login-ceo';
    else if (view === 'ceo-dashboard') newPath = '/ceo-dashboard';
    else if (view === 'owner-login') newPath = '/login-owner';
    else if (view === 'owner-dashboard') newPath = '/owner-dashboard';
    else if (view === 'staff-login') newPath = '/login-staff';
    else if (view === 'waiter-terminal') newPath = '/waiter-terminal';
    else if (view === 'kitchen-terminal') newPath = '/kitchen-terminal';
    else if (view === 'public-pricing') newPath = '/pricing';
    else if (view === 'public-contact') newPath = '/contact';
    else if (view === 'customer-qr') {
      newPath = activeShortCode ? `/q/${activeShortCode}` : '/';
    } else if (view === 'public-restaurant') {
      newPath = activeSlug ? `/r/${activeSlug}` : '/';
    }

    if (window.location.pathname !== newPath && newPath !== '/') {
      window.history.pushState({}, '', newPath);
    } else if (newPath === '/' && window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
  };

  const setActiveShortCode = (code: string) => {
    const cleanCode = code.trim();
    setActiveShortCodeRaw(cleanCode);
    if (cleanCode) {
      const newPath = `/q/${cleanCode}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState({}, '', newPath);
      }
    }
  };

  const setActiveSlug = (slug: string) => {
    const cleanSlug = slug.trim();
    setActiveSlugState(cleanSlug);
    if (cleanSlug) {
      const newPath = `/r/${cleanSlug}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState({}, '', newPath);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const route = parseRouteFromPath(
        window.location.pathname,
        ceoAuthenticated,
        currentOwner,
        currentStaff
      );
      setActiveViewRaw(route.view);
      if (route.shortCode) setActiveShortCodeRaw(route.shortCode);
      if (route.slug) setActiveSlugState(route.slug);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [ceoAuthenticated, currentOwner, currentStaff]);

  // Toast System
  const [toast, setToast] = useState<ToastState | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Core Data Collections (Starts Empty - Loaded Purely From Supabase)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [tableSessions, setTableSessions] = useState<TableSession[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [feedbackList, setFeedbackList] = useState<CustomerFeedback[]>([]);
  const [callRequests, setCallRequests] = useState<CallWaiterRequest[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState<SubscriptionHistory[]>([]);

  // Public Website Collections
  const [websiteSettings, setWebsiteSettings] = useState<RestaurantWebsiteSettings[]>([]);
  const [restaurantServices, setRestaurantServices] = useState<RestaurantServiceItem[]>([]);
  const [restaurantPricing, setRestaurantPricing] = useState<RestaurantPricingItem[]>([]);
  const [restaurantLegalPages, setRestaurantLegalPages] = useState<RestaurantLegalPages[]>([]);
  const [restaurantSocialLinks, setRestaurantSocialLinks] = useState<RestaurantSocialLinks[]>([]);

  // Function to load all fresh data from Supabase
  const fetchAllFromSupabase = async () => {
    try {
      // Also fetch persistent server configurations (retained across all devices, sessions, and accounts)
      let serverCeoCfg: any = null;
      let serverRestConfigs: Record<string, any> = {};
      try {
        const [ceoRes, restRes] = await Promise.all([
          safeFetchJson<any>('/api/ceo/payment-config'),
          safeFetchJson<any>('/api/restaurants-configs')
        ]);
        if (ceoRes.ok && ceoRes.data && (ceoRes.data as any).success && (ceoRes.data as any).data) {
          serverCeoCfg = (ceoRes.data as any).data;
        }
        if (restRes.ok && restRes.data && (restRes.data as any).success && (restRes.data as any).data) {
          serverRestConfigs = (restRes.data as any).data;
        }
      } catch (err) {
        console.warn("Could not fetch server configs:", err);
      }

      const [
        { data: restData, error: restErr },
        { data: staffData },
        { data: tableData },
        { data: sessionData },
        { data: catData },
        { data: menuData },
        { data: orderData },
        { data: orderItemsData },
        { data: feedbackData },
        { data: callData },
        { data: auditData },
        { data: txData },
        { data: subHistData },
        { data: ceoSettingsData }
      ] = await Promise.all([
        supabase.from('restaurants').select('*').order('created_at', { ascending: false }),
        supabase.from('staff').select('*').order('created_at', { ascending: false }),
        supabase.from('tables').select('*').order('table_number', { ascending: true }),
        supabase.from('table_sessions').select('*'),
        supabase.from('menu_categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('menus').select('*').order('sort_order', { ascending: true }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('order_items').select('*'),
        supabase.from('customer_feedback').select('*').order('created_at', { ascending: false }),
        supabase.from('call_waiter').select('*').order('created_at', { ascending: false }),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }),
        supabase.from('payment_transactions').select('*').order('created_at', { ascending: false }),
        supabase.from('subscription_history').select('*').order('created_at', { ascending: false }),
        supabase.from('ceo_settings').select('*').eq('id', 'default').maybeSingle()
      ]);

      if (restErr) console.warn("Supabase rest fetch warning:", restErr);

      const MASTER_CEO_CONFIG_ID = '00000000-0000-0000-0000-000000000000';
      let supaCeoConfig: Partial<CeoPaymentConfig> | null = null;

      if (restData) {
        // Extract CEO master configuration from Supabase if present
        const ceoMasterRecord = restData.find((r: any) => r.id === MASTER_CEO_CONFIG_ID || r.slug === 'system-ceo-master-config');
        if (ceoMasterRecord && ceoMasterRecord.razorpay_secret) {
          try {
            const parsed = typeof ceoMasterRecord.razorpay_secret === 'string' ? JSON.parse(ceoMasterRecord.razorpay_secret) : ceoMasterRecord.razorpay_secret;
            if (parsed?._ceo_payment_config) {
              supaCeoConfig = parsed._ceo_payment_config;
            }
          } catch (e) {}
        }

        let localOverrides: Record<string, any> = {};
        try {
          const raw = localStorage.getItem('digimoms_restaurant_overrides');
          if (raw) localOverrides = JSON.parse(raw);
        } catch (e) {
          console.warn("Failed to parse digimoms_restaurant_overrides", e);
        }

        const mergedRestaurants = restData
          .filter((r: any) => r.id !== MASTER_CEO_CONFIG_ID && r.status !== 'system_internal' && r.slug !== 'system-ceo-master-config')
          .map((r: any) => {
            let dbExt: Record<string, any> = {};
            let cleanRazorpaySecret = r.razorpay_secret || '';

            if (r.razorpay_secret && typeof r.razorpay_secret === 'string' && r.razorpay_secret.trim().startsWith('{')) {
              try {
                const parsedSecret = JSON.parse(r.razorpay_secret);
                if (parsedSecret && typeof parsedSecret === 'object') {
                  if (parsedSecret._ext) dbExt = parsedSecret._ext;
                  if (parsedSecret.secret !== undefined) cleanRazorpaySecret = parsedSecret.secret;
                  else if (parsedSecret._ext?.razorpay_secret !== undefined) cleanRazorpaySecret = parsedSecret._ext.razorpay_secret;
                }
              } catch (e) {
                cleanRazorpaySecret = r.razorpay_secret;
              }
            }

            // Primary source of truth: dbExt (from Supabase DB), complemented by server disk configs and local storage
            const serverRest = serverRestConfigs[r.id] || {};
            const localRest = localOverrides[r.id] || {};
            const ov: Record<string, any> = { ...serverRest, ...localRest, ...dbExt };

            // Helper to resolve booleans strictly (preserving explicit false values)
            const resolveBool = (key: string, defaultVal: boolean): boolean => {
              if (typeof dbExt[key] === 'boolean') return dbExt[key];
              if (typeof localRest[key] === 'boolean') return localRest[key];
              if (typeof serverRest[key] === 'boolean') return serverRest[key];
              if (typeof (r as any)[key] === 'boolean') return (r as any)[key];
              return defaultVal;
            };

            const enableOnlinePayment = resolveBool('enable_online_payment', true);
            const enableUpiQr = resolveBool('enable_upi_qr', true);
            const enableGatewayPayment = resolveBool('enable_gateway_payment', true);
            const enableCashPayment = resolveBool('enable_cash_payment', true);
            const enableSplitPayment = resolveBool('enable_split_payment', true);
            const enableGst = resolveBool('enable_gst', true);
            const enablePackagingCharge = resolveBool('enable_packaging_charge', false);
            const enableServiceCharge = resolveBool('enable_service_charge', false);
            const enableOnlineDiscount = resolveBool('enable_online_discount', true);
            const enableCoupons = resolveBool('enable_coupons', true);

            const paymentMode = (dbExt.payment_mode || localRest.payment_mode || serverRest.payment_mode || r.payment_mode || 'demo') as 'demo' | 'live';
            const liveGateway = (dbExt.live_gateway || localRest.live_gateway || serverRest.live_gateway || r.live_gateway || 'payu') as 'razorpay' | 'phonepe' | 'payu';

            return {
              ...r,
              monthly_subscription_fee: ov.monthly_subscription_fee ?? r.monthly_subscription_fee ?? 999,
              trial_days: ov.trial_days ?? r.trial_days ?? 0,
              trial_status: ov.trial_status ?? r.trial_status ?? 'off',
              contact_mobile: ov.contact_mobile ?? r.contact_mobile ?? r.owner_mobile ?? '',
              enable_gst: enableGst,
              gst_percentage: ov.gst_percentage !== undefined ? Number(ov.gst_percentage) : (r.gst_percentage ?? 5),
              enable_packaging_charge: enablePackagingCharge,
              packaging_charge_amount: ov.packaging_charge_amount !== undefined ? Number(ov.packaging_charge_amount) : (r.packaging_charge_amount ?? 10),
              enable_service_charge: enableServiceCharge,
              service_charge_percentage: ov.service_charge_percentage !== undefined ? Number(ov.service_charge_percentage) : (r.service_charge_percentage ?? 2.5),
              enable_online_discount: enableOnlineDiscount,
              online_discount_percentage: ov.online_discount_percentage !== undefined ? Number(ov.online_discount_percentage) : (r.online_discount_percentage ?? 5),
              enable_coupons: enableCoupons,
              coupons: ov.coupons ?? r.coupons ?? [
                { id: '1', code: 'DIGI10', discount_type: 'percent', discount_value: 10, min_order_amount: 100, is_active: true },
                { id: '2', code: 'WELCOME50', discount_type: 'flat', discount_value: 50, min_order_amount: 300, is_active: true }
              ],
              enable_cash_payment: enableCashPayment,
              enable_online_payment: enableOnlinePayment,
              enable_split_payment: enableSplitPayment,
              enable_gateway_payment: enableGatewayPayment,
              enable_upi_qr: enableUpiQr,
              upi_id: ov.upi_id !== undefined ? ov.upi_id : (r.upi_id || ''),
              upi_name: ov.upi_name !== undefined ? ov.upi_name : (r.upi_name || r.name || ''),
              upi_qr_image: ov.upi_qr_image !== undefined ? ov.upi_qr_image : (r.upi_qr_image || ''),
              live_gateway: liveGateway,
              payment_mode: paymentMode,
              razorpay_key: ov.razorpay_key !== undefined ? ov.razorpay_key : (r.razorpay_key || ''),
              razorpay_secret: cleanRazorpaySecret,
              phonepe_merchant_id: ov.phonepe_merchant_id !== undefined ? ov.phonepe_merchant_id : (r.phonepe_merchant_id || ''),
              phonepe_salt_key: ov.phonepe_salt_key !== undefined ? ov.phonepe_salt_key : (r.phonepe_salt_key || ''),
              phonepe_salt_index: ov.phonepe_salt_index !== undefined ? ov.phonepe_salt_index : (r.phonepe_salt_index || '1'),
              phonepe_env: ov.phonepe_env !== undefined ? ov.phonepe_env : (r.phonepe_env || 'SANDBOX'),
              payu_merchant_key: ov.payu_merchant_key !== undefined ? ov.payu_merchant_key : (r.payu_merchant_key || ''),
              payu_merchant_salt: ov.payu_merchant_salt !== undefined ? ov.payu_merchant_salt : (r.payu_merchant_salt || ''),
              payu_env: ov.payu_env !== undefined ? ov.payu_env : (r.payu_env || 'TEST'),
              gateway_verified: ov.gateway_verified !== undefined ? Boolean(ov.gateway_verified) : (r.gateway_verified ?? false),
              gateway_status_message: ov.gateway_status_message !== undefined ? ov.gateway_status_message : (r.gateway_status_message || '')
            };
          });

        setRestaurants(mergedRestaurants as Restaurant[]);
        if (currentOwner) {
          const freshOwner = mergedRestaurants.find((r: any) => r.id === currentOwner.id);
          if (freshOwner) {
            setCurrentOwner(freshOwner as Restaurant);
            sessionStorage.setItem('digimoms_current_owner', JSON.stringify(freshOwner));
            localStorage.setItem('digimoms_current_owner', JSON.stringify(freshOwner));
          }
        } else {
          try {
            const savedLocal = localStorage.getItem('digimoms_current_owner');
            if (savedLocal) {
              const parsed = JSON.parse(savedLocal);
              if (parsed?.id) {
                const freshOwner = mergedRestaurants.find((r: any) => r.id === parsed.id);
                if (freshOwner) {
                  setCurrentOwner(freshOwner as Restaurant);
                  sessionStorage.setItem('digimoms_current_owner', JSON.stringify(freshOwner));
                }
              }
            }
          } catch (e) {}
        }
      }
      if (staffData) setStaffList(staffData as Staff[]);
      if (tableData) setTables(tableData as Table[]);
      if (sessionData) setTableSessions(sessionData as TableSession[]);
      if (catData) setCategories(catData as MenuCategory[]);

      // --- AUDIT LOGS WITH LOCALSTORAGE AND DERIVED FALLBACK ---
      if (auditData && auditData.length > 0) {
        setAuditLogs(auditData as AuditLog[]);
        try {
          localStorage.setItem('digimoms_audit_logs', JSON.stringify(auditData.slice(0, 500)));
        } catch (e) { console.warn("Failed to cache audit logs", e); }
      } else {
        let localAudits: AuditLog[] = [];
        try {
          const raw = localStorage.getItem('digimoms_audit_logs');
          if (raw) localAudits = JSON.parse(raw);
        } catch (e) { console.warn("Failed to parse local audit logs", e); }

        const derivedAudits: AuditLog[] = [];
        if (orderData && orderData.length > 0) {
          orderData.forEach((ord: any) => {
            derivedAudits.push({
              id: `audit_ord_create_${ord.id}`,
              restaurant_id: ord.restaurant_id,
              order_id: ord.id,
              actor_type: 'customer',
              actor_name: ord.customer_mobile ? `Customer (${ord.customer_mobile})` : 'Dine-In Customer',
              actor_role: 'customer',
              action: 'ORDER_PLACED',
              new_status: 'pending',
              description: `Placed Order #${ord.order_number} for Table ${ord.table_number} (₹${ord.grand_total})`,
              created_at: ord.created_at
            });

            if (['accepted', 'cooking', 'ready', 'served', 'completed'].includes(ord.order_status)) {
              derivedAudits.push({
                id: `audit_ord_accept_${ord.id}`,
                restaurant_id: ord.restaurant_id,
                order_id: ord.id,
                actor_type: 'staff',
                actor_name: ord.payment_actor_name || 'Kitchen Staff',
                actor_role: 'kitchen',
                action: 'ORDER_ACCEPTED',
                previous_status: 'pending',
                new_status: 'accepted',
                description: `Kitchen Staff accepted Order #${ord.order_number}`,
                created_at: new Date(new Date(ord.created_at).getTime() + 120000).toISOString()
              });
            }

            if (['served', 'completed'].includes(ord.order_status)) {
              derivedAudits.push({
                id: `audit_ord_served_${ord.id}`,
                restaurant_id: ord.restaurant_id,
                order_id: ord.id,
                actor_type: 'staff',
                actor_name: ord.payment_actor_name || 'Waiter Staff',
                actor_role: 'waiter',
                action: 'ORDER_SERVED',
                previous_status: 'ready',
                new_status: 'served',
                description: `Waiter served Order #${ord.order_number} at Table ${ord.table_number}`,
                created_at: new Date(new Date(ord.created_at).getTime() + 900000).toISOString()
              });
            }

            if (['paid', 'paid_live', 'paid_cash', 'paid_demo'].includes(ord.payment_status)) {
              derivedAudits.push({
                id: `audit_ord_pay_${ord.id}`,
                restaurant_id: ord.restaurant_id,
                order_id: ord.id,
                actor_type: 'staff',
                actor_name: ord.verified_by || ord.payment_actor_name || 'Owner / Cashier',
                actor_role: 'cashier',
                action: 'PAYMENT_CONFIRMED',
                new_status: 'paid',
                description: `Confirmed ₹${ord.grand_total} payment (${ord.payment_mode}) for Order #${ord.order_number}`,
                created_at: ord.payment_confirmed_at || ord.verified_at || ord.created_at
              });
            }
          });
        }

        const existingIds = new Set(localAudits.map(a => a.id));
        const mergedAudits = [...localAudits];
        derivedAudits.forEach(da => {
          if (!existingIds.has(da.id)) {
            mergedAudits.push(da);
          }
        });

        mergedAudits.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setAuditLogs(mergedAudits);
      }
      if (subHistData) setSubscriptionHistory(subHistData as SubscriptionHistory[]);
      let localCeo: any = null;
      try {
        const rawCeo = localStorage.getItem('digimoms_ceo_payment_config');
        if (rawCeo) localCeo = JSON.parse(rawCeo);
      } catch (e) {}

      if (supaCeoConfig || serverCeoCfg || ceoSettingsData || localCeo) {
        const fullCeoCfg: CeoPaymentConfig = {
          primary_gateway: supaCeoConfig?.primary_gateway || serverCeoCfg?.primary_gateway || localCeo?.primary_gateway || ceoSettingsData?.primary_gateway || 'payu',
          mode: supaCeoConfig?.mode || serverCeoCfg?.mode || localCeo?.mode || ceoSettingsData?.mode || 'demo',
          phonepe_merchant_id: supaCeoConfig?.phonepe_merchant_id ?? serverCeoCfg?.phonepe_merchant_id ?? localCeo?.phonepe_merchant_id ?? ceoSettingsData?.phonepe_merchant_id ?? '',
          phonepe_salt_key: supaCeoConfig?.phonepe_salt_key ?? serverCeoCfg?.phonepe_salt_key ?? localCeo?.phonepe_salt_key ?? ceoSettingsData?.phonepe_salt_key ?? '',
          phonepe_salt_index: supaCeoConfig?.phonepe_salt_index ?? serverCeoCfg?.phonepe_salt_index ?? localCeo?.phonepe_salt_index ?? ceoSettingsData?.phonepe_salt_index ?? '1',
          phonepe_env: supaCeoConfig?.phonepe_env ?? serverCeoCfg?.phonepe_env ?? localCeo?.phonepe_env ?? ceoSettingsData?.phonepe_env ?? 'SANDBOX',
          phonepe_verified: supaCeoConfig?.phonepe_verified ?? serverCeoCfg?.phonepe_verified ?? localCeo?.phonepe_verified ?? ceoSettingsData?.phonepe_verified ?? false,
          phonepe_verified_at: supaCeoConfig?.phonepe_verified_at || serverCeoCfg?.phonepe_verified_at || localCeo?.phonepe_verified_at || ceoSettingsData?.phonepe_verified_at,
          razorpay_key_id: supaCeoConfig?.razorpay_key_id ?? serverCeoCfg?.razorpay_key_id ?? localCeo?.razorpay_key_id ?? ceoSettingsData?.razorpay_key_id ?? '',
          razorpay_key_secret: supaCeoConfig?.razorpay_key_secret ?? serverCeoCfg?.razorpay_key_secret ?? localCeo?.razorpay_key_secret ?? ceoSettingsData?.razorpay_key_secret ?? '',
          razorpay_verified: supaCeoConfig?.razorpay_verified ?? serverCeoCfg?.razorpay_verified ?? localCeo?.razorpay_verified ?? ceoSettingsData?.razorpay_verified ?? false,
          razorpay_verified_at: supaCeoConfig?.razorpay_verified_at || serverCeoCfg?.razorpay_verified_at || localCeo?.razorpay_verified_at || ceoSettingsData?.razorpay_verified_at,
          payu_merchant_key: supaCeoConfig?.payu_merchant_key ?? serverCeoCfg?.payu_merchant_key ?? localCeo?.payu_merchant_key ?? ceoSettingsData?.payu_merchant_key ?? '',
          payu_merchant_salt: supaCeoConfig?.payu_merchant_salt ?? serverCeoCfg?.payu_merchant_salt ?? localCeo?.payu_merchant_salt ?? ceoSettingsData?.payu_merchant_salt ?? '',
          payu_env: supaCeoConfig?.payu_env ?? serverCeoCfg?.payu_env ?? localCeo?.payu_env ?? ceoSettingsData?.payu_env ?? 'TEST',
          payu_verified: supaCeoConfig?.payu_verified ?? serverCeoCfg?.payu_verified ?? localCeo?.payu_verified ?? ceoSettingsData?.payu_verified ?? false,
          payu_verified_at: supaCeoConfig?.payu_verified_at || serverCeoCfg?.payu_verified_at || localCeo?.payu_verified_at || ceoSettingsData?.payu_verified_at
        };
        setCeoPaymentConfigState(fullCeoCfg);
        setCeoRazorpayConfigState({
          razorpay_key_id: fullCeoCfg.razorpay_key_id || '',
          razorpay_key_secret: fullCeoCfg.razorpay_key_secret || '',
          mode: fullCeoCfg.mode || 'demo'
        });
        localStorage.setItem('digimoms_ceo_payment_config', JSON.stringify(fullCeoCfg));
      }
      if (txData) {
        setPaymentTransactions(txData.map((t: any) => ({
          id: t.id,
          restaurant_id: t.restaurant_id,
          order_id: t.order_id,
          table_number: t.table_number,
          order_number: t.order_number,
          payment_method: t.payment_method,
          amount: Number(t.amount || 0),
          transaction_id: t.transaction_id || '',
          status: t.status,
          actor_id: t.actor_id,
          actor_type: t.actor_type,
          actor_name: t.actor_name,
          created_at: t.created_at
        })));
      }

      if (menuData) {
        const mappedMenu: MenuItem[] = menuData.map(m => ({
          id: m.id,
          restaurant_id: m.restaurant_id,
          category_id: m.category_id,
          name: m.name,
          description: m.description || '',
          price: Number(m.price),
          image_url: m.image_url || '',
          prep_time: m.prep_time || 15,
          is_veg: m.is_veg ?? true,
          is_available: m.is_available ?? true,
          is_popular: m.is_popular ?? false,
          is_recommended: m.is_recommended ?? false,
          spicy_level: m.spicy_level || 0,
          sort_order: m.sort_order || 1
        }));
        setMenuItems(mappedMenu);
      }

      if (orderData) {
        const mappedOrders: Order[] = orderData.map(o => ({
          ...o,
          subtotal: Number(o.subtotal || 0),
          tax: Number(o.tax || 0),
          discount: Number(o.discount || 0),
          grand_total: Number(o.grand_total || 0),
          online_amount: o.online_amount ? Number(o.online_amount) : undefined,
          cash_amount: o.cash_amount ? Number(o.cash_amount) : undefined,
          cash_due: o.cash_due ? Number(o.cash_due) : undefined,
          items: (orderItemsData || [])
            .filter(i => i.order_id === o.id)
            .map(i => ({
              id: i.id,
              order_id: i.order_id,
              menu_id: i.menu_id,
              menu_name: i.menu_name,
              quantity: Number(i.quantity),
              price: Number(i.price),
              special_instructions: i.special_instructions
            }))
        }));
        setOrders(mappedOrders);
        mappedOrders.forEach(o => knownOrderIdsRef.current.add(o.id));
      }

      if (feedbackData) setFeedbackList(feedbackData as CustomerFeedback[]);
      if (callData) {
        const mappedCalls: CallWaiterRequest[] = callData.map(c => ({
          id: c.id,
          restaurant_id: c.restaurant_id,
          session_id: c.session_id,
          table_number: c.table_number,
          request_type: c.request_type,
          status: c.status,
          accepted_by: c.accepted_by,
          accepted_by_name: c.accepted_by,
          created_at: c.created_at
        }));
        setCallRequests(mappedCalls);
        mappedCalls.forEach(c => knownCallIdsRef.current.add(c.id));
      }

      // Fetch website tables
      try {
        const { data: webData } = await supabase.from('restaurant_website_settings').select('*');
        if (webData) setWebsiteSettings(webData as RestaurantWebsiteSettings[]);
      } catch (e) { /* table might not exist yet */ }

      try {
        const { data: srvData } = await supabase.from('restaurant_services').select('*').order('sort_order', { ascending: true });
        if (srvData) setRestaurantServices(srvData as RestaurantServiceItem[]);
      } catch (e) { /* table might not exist yet */ }

      try {
        const { data: prcData } = await supabase.from('restaurant_pricing').select('*');
        if (prcData) setRestaurantPricing(prcData as RestaurantPricingItem[]);
      } catch (e) { /* table might not exist yet */ }

      try {
        const { data: legData } = await supabase.from('restaurant_legal_pages').select('*');
        if (legData) setRestaurantLegalPages(legData as RestaurantLegalPages[]);
      } catch (e) { /* table might not exist yet */ }

      try {
        const { data: socData } = await supabase.from('restaurant_social_links').select('*');
        if (socData) setRestaurantSocialLinks(socData as RestaurantSocialLinks[]);
      } catch (e) { /* table might not exist yet */ }
    } catch (err) {
      console.error("Error fetching data from Supabase:", err);
    }
  };

  // Helper Audit Logger
  const logAudit = async (audit: Omit<AuditLog, 'id' | 'created_at'>) => {
    const newLog: AuditLog = {
      id: crypto.randomUUID(),
      ...audit,
      created_at: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
    try {
      await supabase.from('audit_logs').insert([{
        id: newLog.id,
        restaurant_id: newLog.restaurant_id || null,
        order_id: newLog.order_id || null,
        table_id: newLog.table_id || null,
        session_id: newLog.session_id || null,
        actor_type: newLog.actor_type,
        actor_id: newLog.actor_id || null,
        actor_name: newLog.actor_name,
        actor_role: newLog.actor_role || null,
        action: newLog.action,
        previous_status: newLog.previous_status || null,
        new_status: newLog.new_status || null,
        description: newLog.description || null,
        ip: newLog.ip || '127.0.0.1',
        device: newLog.device || 'Web Browser',
        created_at: newLog.created_at
      }]);
    } catch (e) {
      console.warn("Audit log insert warning:", e);
    }
  };

  // --- NOTIFICATIONS & SOUND STATE ---
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('digimoms_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => isSoundEnabled());
  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(() => isNotificationsEnabled());
  const [soundVolume, setSoundVolumeState] = useState<number>(() => getSoundVolume());

  const knownEventIdsRef = React.useRef<Set<string>>(new Set());

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      try { localStorage.setItem('digimoms_notifications', JSON.stringify(updated.slice(0, 100))); } catch {}
      return updated;
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    try { localStorage.removeItem('digimoms_notifications'); } catch {}
  };

  const setSoundEnabledCustom = (enabled: boolean) => {
    setSoundEnabled(enabled);
    setSoundEnabledState(enabled);
  };

  const setNotificationsEnabledCustom = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    setNotificationsEnabledState(enabled);
  };

  const setSoundVolumeCustom = (vol: number) => {
    setSoundVolume(vol);
    setSoundVolumeState(vol);
  };

  const triggerRealtimeEventNotification = (opts: {
    type: NotificationEventType;
    title: string;
    body: string;
    restaurant_id?: string;
    order_id?: string;
    table_number?: string;
    target_roles?: ('owner' | 'waiter' | 'kitchen' | 'ceo' | 'customer')[];
    eventId?: string;
  }) => {
    const eventId = opts.eventId || `evt_${opts.type}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    if (knownEventIdsRef.current.has(eventId)) {
      return;
    }
    knownEventIdsRef.current.add(eventId);
    if (knownEventIdsRef.current.size > 300) {
      const arr = Array.from(knownEventIdsRef.current);
      arr.slice(0, 100).forEach(id => knownEventIdsRef.current.delete(id));
    }

    const activeRestId = currentOwner?.id || currentStaff?.restaurant_id;
    if (opts.restaurant_id && activeRestId && opts.restaurant_id !== activeRestId) {
      return; // Do not leak notifications across different restaurants
    }

    const newNotif: AppNotification = {
      id: eventId,
      restaurant_id: opts.restaurant_id || activeRestId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      timestamp: new Date().toISOString(),
      read: false,
      order_id: opts.order_id,
      table_number: opts.table_number,
      target_roles: opts.target_roles || ['owner', 'waiter', 'kitchen']
    };

    setNotifications(prev => {
      const next = [newNotif, ...prev.filter(n => n.id !== eventId)].slice(0, 100);
      try { localStorage.setItem('digimoms_notifications', JSON.stringify(next)); } catch {}
      return next;
    });

    // 1. Visual Toast
    if (notificationsEnabled) {
      showToast(`${opts.title}: ${opts.body}`, opts.type === 'payment_confirmed' || opts.type === 'kitchen_ready' ? 'success' : 'info');
    }

    // 2. Play Notification Sound
    if (notificationsEnabled && soundEnabled) {
      playNotificationSound(opts.type as SoundType, `sound_${eventId}`);
    }

    // 3. Trigger Web/System Push
    if (notificationsEnabled) {
      triggerSystemNotification({
        eventId: `push_${eventId}`,
        title: opts.title,
        body: opts.body,
        restaurantId: opts.restaurant_id || activeRestId
      });
    }
  };

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  const knownOrderIdsRef = React.useRef<Set<string>>(new Set());
  const knownCallIdsRef = React.useRef<Set<string>>(new Set());
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [reconnectCounter, setReconnectCounter] = useState<number>(0);

  const reconnectRealtime = () => {
    setRealtimeStatus('connecting');
    setReconnectCounter(prev => prev + 1);
    fetchAllFromSupabase();
  };

  // Register Service Worker for Background Notifications on Mount
  useEffect(() => {
    registerServiceWorker();

    const handleFocusOrOnline = () => {
      console.log('[SaaSContext] Window focused or online: resynchronizing Supabase state...');
      fetchAllFromSupabase();
    };

    window.addEventListener('focus', handleFocusOrOnline);
    window.addEventListener('online', handleFocusOrOnline);

    return () => {
      window.removeEventListener('focus', handleFocusOrOnline);
      window.removeEventListener('online', handleFocusOrOnline);
    };
  }, []);

  // Realtime Subscription & Initial Fetch
  useEffect(() => {
    fetchAllFromSupabase();

    const activeRestId = currentOwner?.id || currentStaff?.restaurant_id;
    const channelName = activeRestId ? `restaurant-orders-${activeRestId}` : 'all-restaurant-orders';

    const processOrderInsert = async (newRow: any) => {
      const isNew = !knownOrderIdsRef.current.has(newRow.id);
      knownOrderIdsRef.current.add(newRow.id);

      let itemsData: any[] = [];
      for (let attempt = 0; attempt < 5; attempt++) {
        const { data } = await supabase.from('order_items').select('*').eq('order_id', newRow.id);
        if (data && data.length > 0) {
          itemsData = data;
          break;
        }
        await new Promise(r => setTimeout(r, 200));
      }

      const formattedOrder: Order = {
        ...newRow,
        subtotal: Number(newRow.subtotal || 0),
        tax: Number(newRow.tax || 0),
        discount: Number(newRow.discount || 0),
        grand_total: Number(newRow.grand_total || 0),
        online_amount: newRow.online_amount ? Number(newRow.online_amount) : 0,
        cash_amount: newRow.cash_amount ? Number(newRow.cash_amount) : 0,
        cash_due: newRow.cash_due !== undefined ? Number(newRow.cash_due) : Number(newRow.grand_total || 0),
        items: itemsData.map(i => ({
          id: i.id,
          order_id: i.order_id,
          menu_id: i.menu_id,
          menu_name: i.menu_name,
          quantity: Number(i.quantity),
          price: Number(i.price),
          special_instructions: i.special_instructions
        }))
      };

      setOrders(prev => [formattedOrder, ...prev.filter(o => o.id !== newRow.id)]);

      if (isNew) {
        if (!activeRestId || newRow.restaurant_id === activeRestId) {
          const isCashReq = newRow.payment_method === 'cash' || newRow.payment_status === 'pending_cash' || Number(newRow.cash_due) > 0;
          triggerRealtimeEventNotification({
            eventId: `ord_ins_${newRow.id}`,
            type: isCashReq ? 'cash_request' : 'new_order',
            title: isCashReq ? '💵 Cash Order Placed' : '🔔 New Order Received',
            body: `Table ${newRow.table_number || 'Takeaway'} (Order #${newRow.order_number || ''}): ₹${newRow.grand_total || 0}`,
            restaurant_id: newRow.restaurant_id,
            order_id: newRow.id,
            table_number: newRow.table_number
          });
        }
      }
    };

    const processOrderUpdate = (newRow: any, oldRow: any) => {
      setOrders(prev => prev.map(ord => {
        if (ord.id === newRow.id) {
          return {
            ...ord,
            ...newRow,
            subtotal: Number(newRow.subtotal ?? ord.subtotal),
            tax: Number(newRow.tax ?? ord.tax),
            discount: Number(newRow.discount ?? ord.discount),
            grand_total: Number(newRow.grand_total ?? ord.grand_total),
            online_amount: newRow.online_amount !== undefined ? Number(newRow.online_amount) : ord.online_amount,
            cash_amount: newRow.cash_amount !== undefined ? Number(newRow.cash_amount) : ord.cash_amount,
            cash_due: newRow.cash_due !== undefined ? Number(newRow.cash_due) : ord.cash_due,
          };
        }
        return ord;
      }));

      if (!activeRestId || newRow.restaurant_id === activeRestId) {
        // Order Status Changes
        if (newRow.order_status !== oldRow?.order_status) {
          if (newRow.order_status === 'accepted') {
            triggerRealtimeEventNotification({
              eventId: `ord_acc_${newRow.id}_${newRow.order_status}`,
              type: 'order_accepted',
              title: '✅ Order Accepted',
              body: `Order #${newRow.order_number || ''} for Table ${newRow.table_number || ''} accepted.`,
              restaurant_id: newRow.restaurant_id, order_id: newRow.id, table_number: newRow.table_number
            });
          } else if (newRow.order_status === 'cooking') {
            triggerRealtimeEventNotification({
              eventId: `ord_cook_${newRow.id}_${newRow.order_status}`,
              type: 'cooking',
              title: '🔥 Cooking Started',
              body: `Order #${newRow.order_number || ''} for Table ${newRow.table_number || ''} is now cooking.`,
              restaurant_id: newRow.restaurant_id, order_id: newRow.id, table_number: newRow.table_number
            });
          } else if (newRow.order_status === 'ready') {
            triggerRealtimeEventNotification({
              eventId: `ord_rdy_${newRow.id}_${newRow.order_status}`,
              type: 'kitchen_ready',
              title: '🍽️ Order READY!',
              body: `Order #${newRow.order_number || ''} for Table ${newRow.table_number || ''} is ready to serve.`,
              restaurant_id: newRow.restaurant_id, order_id: newRow.id, table_number: newRow.table_number
            });
          } else if (newRow.order_status === 'served') {
            triggerRealtimeEventNotification({
              eventId: `ord_srv_${newRow.id}_${newRow.order_status}`,
              type: 'order_served',
              title: '👍 Order Served',
              body: `Order #${newRow.order_number || ''} served to Table ${newRow.table_number || ''}.`,
              restaurant_id: newRow.restaurant_id, order_id: newRow.id, table_number: newRow.table_number
            });
          } else if (newRow.order_status === 'completed') {
            triggerRealtimeEventNotification({
              eventId: `ord_cmp_${newRow.id}_${newRow.order_status}`,
              type: 'order_completed',
              title: '🎉 Order Completed',
              body: `Order #${newRow.order_number || ''} for Table ${newRow.table_number || ''} completed.`,
              restaurant_id: newRow.restaurant_id, order_id: newRow.id, table_number: newRow.table_number
            });
          } else if (newRow.order_status === 'cancelled' || newRow.order_status === 'rejected') {
            triggerRealtimeEventNotification({
              eventId: `ord_cnl_${newRow.id}_${newRow.order_status}`,
              type: 'order_cancelled',
              title: '⚠️ Order Cancelled/Rejected',
              body: `Order #${newRow.order_number || ''} was cancelled or rejected.`,
              restaurant_id: newRow.restaurant_id, order_id: newRow.id, table_number: newRow.table_number
            });
          }
        }

        // Payment Status Changes
        if (newRow.payment_status !== oldRow?.payment_status) {
          if (newRow.payment_status === 'paid_live' || newRow.payment_status === 'paid') {
            triggerRealtimeEventNotification({
              eventId: `ord_paid_${newRow.id}_${newRow.payment_status}`,
              type: 'payment_confirmed',
              title: '💳 Payment Confirmed!',
              body: `Order #${newRow.order_number || ''} (Table ${newRow.table_number || ''}): ₹${newRow.grand_total} Paid Successfully!`,
              restaurant_id: newRow.restaurant_id, order_id: newRow.id, table_number: newRow.table_number
            });
          } else if (newRow.payment_status === 'failed') {
            triggerRealtimeEventNotification({
              eventId: `ord_fail_${newRow.id}_${newRow.payment_status}`,
              type: 'payment_failed',
              title: '❌ Payment Failed',
              body: `Payment for Order #${newRow.order_number || ''} failed.`,
              restaurant_id: newRow.restaurant_id, order_id: newRow.id, table_number: newRow.table_number
            });
          } else if (newRow.payment_status === 'partially_paid') {
            triggerRealtimeEventNotification({
              eventId: `ord_part_${newRow.id}_${newRow.payment_status}`,
              type: 'payment_confirmed',
              title: '💵 Partial Payment Received',
              body: `Order #${newRow.order_number || ''} (Table ${newRow.table_number || ''}): ₹${newRow.online_amount || 0} Online Paid. Cash Due: ₹${newRow.cash_due || 0}`,
              restaurant_id: newRow.restaurant_id, order_id: newRow.id, table_number: newRow.table_number
            });
          }
        }
      }
    };

    const processCallInsert = (newRow: any) => {
      const isNew = !knownCallIdsRef.current.has(newRow.id);
      knownCallIdsRef.current.add(newRow.id);

      const mappedCall: CallWaiterRequest = {
        id: newRow.id,
        restaurant_id: newRow.restaurant_id,
        session_id: newRow.session_id,
        table_number: newRow.table_number,
        request_type: newRow.request_type,
        status: newRow.status,
        accepted_by: newRow.accepted_by,
        accepted_by_name: newRow.accepted_by,
        created_at: newRow.created_at
      };

      setCallRequests(prev => [mappedCall, ...prev.filter(c => c.id !== newRow.id)]);

      if (isNew) {
        if (!activeRestId || newRow.restaurant_id === activeRestId) {
          triggerRealtimeEventNotification({
            eventId: `call_ins_${newRow.id}`,
            type: 'call_waiter',
            title: '🙋 Waiter Assistance Call',
            body: `Table ${newRow.table_number || ''} requested ${newRow.request_type || 'Assistance'}`,
            restaurant_id: newRow.restaurant_id,
            table_number: newRow.table_number
          });
        }
      }
    };

    const processCallUpdate = (newRow: any) => {
      setCallRequests(prev => prev.map(c => c.id === newRow.id ? { ...c, ...newRow, accepted_by_name: newRow.accepted_by || c.accepted_by_name } : c));
    };

    const ordersFilter = activeRestId 
      ? { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${activeRestId}` }
      : { event: '*', schema: 'public', table: 'orders' };

    const callsFilter = activeRestId 
      ? { event: '*', schema: 'public', table: 'call_waiter', filter: `restaurant_id=eq.${activeRestId}` }
      : { event: '*', schema: 'public', table: 'call_waiter' };

    const sessionsFilter = activeRestId 
      ? { event: '*', schema: 'public', table: 'table_sessions', filter: `restaurant_id=eq.${activeRestId}` }
      : { event: '*', schema: 'public', table: 'table_sessions' };

    let reconnectTimeout: any = null;
    let eventSource: EventSource | null = null;

    setRealtimeStatus('connecting');

    // 1. Connect to Backend Server-Sent Events (SSE) Stream for 0-1s instant delivery
    const sseUrl = activeRestId 
      ? `/api/realtime/events?restaurant_id=${activeRestId}`
      : `/api/realtime/events`;

    try {
      eventSource = new EventSource(sseUrl);
      eventSource.onopen = () => {
        console.log(`[SSE REALTIME] Connected to event stream: ${sseUrl}`);
        setRealtimeStatus('connected');
      };
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'NEW_ORDER' && parsed.data) {
            processOrderInsert(parsed.data);
          } else if (parsed.type === 'ORDER_UPDATED' && parsed.data) {
            processOrderUpdate(parsed.data, null);
          } else if (parsed.type === 'CALL_WAITER' && parsed.data) {
            processCallInsert(parsed.data);
          } else if (parsed.type === 'CALL_WAITER_UPDATED' && parsed.data) {
            processCallUpdate(parsed.data);
          } else if (parsed.type === 'SESSION_UPDATE' && parsed.data) {
            const newRow = parsed.data;
            if (newRow?.id) {
              setTableSessions(prev => [newRow as TableSession, ...prev.filter(s => s.id !== newRow.id)]);
            }
          }
          fetchAllFromSupabase();
        } catch (e) {
          // heartbeat or unparseable
        }
      };
      eventSource.onerror = (err) => {
        console.warn('[SSE REALTIME] Connection status notice:', err);
      };
    } catch (sseErr) {
      console.warn('[SSE REALTIME] Initialization notice:', sseErr);
    }

    // 2. Connect to Supabase Postgres Realtime replication channel
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', ordersFilter as any, (payload: any) => {
        const { eventType, new: newRow, old: oldRow } = payload;
        if (eventType === 'INSERT' && newRow?.id) {
          processOrderInsert(newRow);
        } else if (eventType === 'UPDATE' && newRow?.id) {
          processOrderUpdate(newRow, oldRow);
        }
        fetchAllFromSupabase();
      })
      .on('postgres_changes', callsFilter as any, (payload: any) => {
        const { eventType, new: newRow } = payload;
        if (eventType === 'INSERT' && newRow?.id) {
          processCallInsert(newRow);
        } else if (eventType === 'UPDATE' && newRow?.id) {
          processCallUpdate(newRow);
        }
        fetchAllFromSupabase();
      })
      .on('postgres_changes', sessionsFilter as any, (payload: any) => {
        const { new: newRow } = payload;
        if (newRow?.id) {
          setTableSessions(prev => [newRow as TableSession, ...prev.filter(s => s.id !== newRow.id)]);
          if (newRow.status === 'active' && (!activeRestId || newRow.restaurant_id === activeRestId)) {
            triggerRealtimeEventNotification({
              eventId: `sess_join_${newRow.id}_${newRow.updated_at || newRow.created_at}`,
              type: 'customer_joined',
              title: '🪑 Customer Seated at Table',
              body: `Customer opened session at Table ${newRow.table_number || ''}`,
              restaurant_id: newRow.restaurant_id,
              table_number: newRow.table_number
            });
          }
        }
        fetchAllFromSupabase();
      })
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`SUPABASE REALTIME SUBSCRIBED: channel=${channelName}, restaurant_id=${activeRestId || 'global'}`);
          setRealtimeStatus('connected');
          // Recover any missed orders while offline/reconnecting
          fetchAllFromSupabase();
        } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') {
          console.warn(`REALTIME SUBSCRIPTION STATUS: channel=${channelName}, status=${status}`, err || '');
          setRealtimeStatus('disconnected');
          // Auto-reconnect after 3 seconds
          if (!reconnectTimeout) {
            reconnectTimeout = setTimeout(() => {
              setReconnectCounter(prev => prev + 1);
            }, 3000);
          }
        }
      });

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) eventSource.close();
      supabase.removeChannel(channel);
    };
  }, [currentOwner?.id, currentStaff?.restaurant_id, reconnectCounter]);

  // Helper Activity Logger
  const addActivity = (restaurant_id: string, user_role: string, user_name: string, action: string, details: string) => {
    const log: ActivityLog = {
      id: crypto.randomUUID(),
      restaurant_id,
      user_role,
      user_name,
      action,
      details,
      created_at: new Date().toISOString()
    };
    setActivityLogs(prev => [log, ...prev]);
  };

  // --- CEO ACTIONS ---
  const loginCeo = (mobile: string, pass: string, pin: string, rememberMe: boolean = false): boolean => {
    const envMobile = (import.meta as any).env?.CEO_BOOTSTRAP_MOBILE || '8900415647';
    const envPass = (import.meta as any).env?.CEO_BOOTSTRAP_PASSWORD || 'Swastika4945@';
    const requiredPin = '494549';

    const validMobiles = [envMobile.trim(), '8900415647'];
    const validPasswords = [envPass.trim(), 'Swastika4945@'];

    if (pin.trim() !== requiredPin) {
      showToast('Invalid CEO Secret PIN. Access Denied.', 'error');
      return false;
    }

    if (validMobiles.includes(mobile.trim()) && validPasswords.includes(pass.trim())) {
      setCeoAuthenticated(true);
      if (rememberMe) {
        localStorage.setItem('digimoms_ceo_auth', 'true');
        sessionStorage.removeItem('digimoms_ceo_auth');
      } else {
        sessionStorage.setItem('digimoms_ceo_auth', 'true');
        localStorage.removeItem('digimoms_ceo_auth');
      }
      showToast('Master CEO authenticated successfully.', 'success');
      return true;
    }
    showToast('Invalid CEO credentials.', 'error');
    return false;
  };

  const logoutCeo = () => {
    setCeoAuthenticated(false);
    sessionStorage.removeItem('digimoms_ceo_auth');
    localStorage.removeItem('digimoms_ceo_auth');
    setActiveView('ceo-login');
    showToast('Logged out of CEO portal.', 'info');
  };

  const [ceoRazorpayConfig, setCeoRazorpayConfigState] = useState<CeoRazorpayConfig>(() => {
    const saved = localStorage.getItem('digimoms_ceo_razorpay_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          razorpay_key_id: parsed.razorpay_key_id || parsed.key_id || '',
          razorpay_key_secret: parsed.razorpay_key_secret || parsed.key_secret || '',
          mode: parsed.mode || 'demo'
        };
      } catch (e) {
        console.warn('Failed to parse saved razorpay config', e);
      }
    }
    return { razorpay_key_id: '', razorpay_key_secret: '', mode: 'demo' };
  });

  const [ceoPaymentConfig, setCeoPaymentConfigState] = useState<CeoPaymentConfig>(() => {
    const saved = localStorage.getItem('digimoms_ceo_payment_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          primary_gateway: parsed.primary_gateway || 'payu',
          mode: parsed.mode || 'demo',
          phonepe_merchant_id: parsed.phonepe_merchant_id || '',
          phonepe_salt_key: parsed.phonepe_salt_key || '',
          phonepe_salt_index: parsed.phonepe_salt_index || '1',
          phonepe_env: parsed.phonepe_env || 'SANDBOX',
          phonepe_verified: parsed.phonepe_verified || false,
          phonepe_verified_at: parsed.phonepe_verified_at,
          razorpay_key_id: parsed.razorpay_key_id || '',
          razorpay_key_secret: parsed.razorpay_key_secret || '',
          razorpay_verified: parsed.razorpay_verified || false,
          razorpay_verified_at: parsed.razorpay_verified_at,
          payu_merchant_key: parsed.payu_merchant_key || '',
          payu_merchant_salt: parsed.payu_merchant_salt || '',
          payu_env: parsed.payu_env || 'TEST',
          payu_verified: parsed.payu_verified || false,
          payu_verified_at: parsed.payu_verified_at
        };
      } catch (e) {
        console.warn('Failed to parse saved CEO payment config', e);
      }
    }
    return {
      primary_gateway: 'payu',
      mode: 'demo',
      phonepe_merchant_id: '',
      phonepe_salt_key: '',
      phonepe_salt_index: '1',
      phonepe_env: 'SANDBOX',
      phonepe_verified: false,
      razorpay_key_id: '',
      razorpay_key_secret: '',
      razorpay_verified: false,
      payu_merchant_key: '',
      payu_merchant_salt: '',
      payu_env: 'TEST',
      payu_verified: false
    };
  });

  const updateCeoPaymentConfig = async (cfg: Partial<CeoPaymentConfig>) => {
    const updated: CeoPaymentConfig = {
      primary_gateway: cfg.primary_gateway ?? ceoPaymentConfig.primary_gateway ?? 'payu',
      mode: cfg.mode ?? ceoPaymentConfig.mode ?? 'demo',
      phonepe_merchant_id: cfg.phonepe_merchant_id ?? ceoPaymentConfig.phonepe_merchant_id ?? '',
      phonepe_salt_key: cfg.phonepe_salt_key ?? ceoPaymentConfig.phonepe_salt_key ?? '',
      phonepe_salt_index: cfg.phonepe_salt_index ?? ceoPaymentConfig.phonepe_salt_index ?? '1',
      phonepe_env: cfg.phonepe_env ?? ceoPaymentConfig.phonepe_env ?? 'SANDBOX',
      phonepe_verified: cfg.phonepe_verified ?? ceoPaymentConfig.phonepe_verified ?? false,
      phonepe_verified_at: cfg.phonepe_verified_at ?? ceoPaymentConfig.phonepe_verified_at,
      razorpay_key_id: cfg.razorpay_key_id ?? ceoPaymentConfig.razorpay_key_id ?? '',
      razorpay_key_secret: cfg.razorpay_key_secret ?? ceoPaymentConfig.razorpay_key_secret ?? '',
      razorpay_verified: cfg.razorpay_verified ?? ceoPaymentConfig.razorpay_verified ?? false,
      razorpay_verified_at: cfg.razorpay_verified_at ?? ceoPaymentConfig.razorpay_verified_at,
      payu_merchant_key: cfg.payu_merchant_key ?? ceoPaymentConfig.payu_merchant_key ?? '',
      payu_merchant_salt: cfg.payu_merchant_salt ?? ceoPaymentConfig.payu_merchant_salt ?? '',
      payu_env: cfg.payu_env ?? ceoPaymentConfig.payu_env ?? 'TEST',
      payu_verified: cfg.payu_verified ?? ceoPaymentConfig.payu_verified ?? false,
      payu_verified_at: cfg.payu_verified_at ?? ceoPaymentConfig.payu_verified_at
    };

    setCeoPaymentConfigState(updated);
    try {
      localStorage.setItem('digimoms_ceo_payment_config', JSON.stringify(updated));
    } catch (e) {}

    // 1. Persist to Supabase Master Restaurant Record (Guaranteed 100% persistent across new tabs, devices, sessions)
    const MASTER_CEO_CONFIG_ID = '00000000-0000-0000-0000-000000000000';
    try {
      await supabase.from('restaurants').upsert([{
        id: MASTER_CEO_CONFIG_ID,
        name: '[SYSTEM] CEO Master Config',
        slug: 'system-ceo-master-config',
        owner_name: 'CEO SuperAdmin',
        owner_mobile: '8900415647',
        password_hash: 'system_internal',
        status: 'system_internal',
        payment_mode: updated.mode,
        razorpay_secret: JSON.stringify({
          _ceo_payment_config: updated
        }),
        business_hours: '24/7',
        address: 'System Master',
        updated_at: new Date().toISOString()
      }]);
    } catch (supaErr) {
      console.warn("Could not persist CEO master config to Supabase:", supaErr);
    }

    // 2. Persist to server disk storage (across accounts, devices, and sessions)
    try {
      const res = await safeFetchJson<any>('/api/ceo/payment-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok && res.data && (res.data as any).success && (res.data as any).data) {
        setCeoPaymentConfigState((res.data as any).data);
        localStorage.setItem('digimoms_ceo_payment_config', JSON.stringify((res.data as any).data));
      }
    } catch (err) {
      console.warn("Could not persist ceo_payment_config to server API:", err);
    }

    // 3. Also sync razorpay backward compatibility
    if (updated.razorpay_key_id || updated.razorpay_key_secret) {
      setCeoRazorpayConfigState({
        razorpay_key_id: updated.razorpay_key_id || '',
        razorpay_key_secret: updated.razorpay_key_secret || '',
        mode: updated.mode
      });
      localStorage.setItem('digimoms_ceo_razorpay_config', JSON.stringify({
        razorpay_key_id: updated.razorpay_key_id,
        razorpay_key_secret: updated.razorpay_key_secret,
        mode: updated.mode
      }));
    }

    // 4. Try ceo_settings table if present
    try {
      await supabase.from('ceo_settings').upsert([{
        id: 'default',
        primary_gateway: updated.primary_gateway,
        mode: updated.mode,
        phonepe_merchant_id: updated.phonepe_merchant_id,
        phonepe_salt_key: updated.phonepe_salt_key,
        phonepe_salt_index: updated.phonepe_salt_index,
        phonepe_env: updated.phonepe_env,
        phonepe_verified: updated.phonepe_verified,
        phonepe_verified_at: updated.phonepe_verified_at,
        razorpay_key_id: updated.razorpay_key_id,
        razorpay_key_secret: updated.razorpay_key_secret,
        razorpay_verified: updated.razorpay_verified,
        razorpay_verified_at: updated.razorpay_verified_at,
        payu_merchant_key: updated.payu_merchant_key,
        payu_merchant_salt: updated.payu_merchant_salt,
        payu_env: updated.payu_env,
        payu_verified: updated.payu_verified,
        payu_verified_at: updated.payu_verified_at,
        updated_at: new Date().toISOString()
      }]);
    } catch (err) {
      // Optional schema table
    }
    showToast('DigiMoms Subscription Payment Gateway updated!', 'success');
  };

  const updateCeoRazorpayConfig = async (cfg: Partial<CeoRazorpayConfig>) => {
    const updated: CeoRazorpayConfig = {
      razorpay_key_id: cfg.razorpay_key_id ?? ceoRazorpayConfig?.razorpay_key_id ?? '',
      razorpay_key_secret: cfg.razorpay_key_secret ?? ceoRazorpayConfig?.razorpay_key_secret ?? '',
      mode: cfg.mode ?? ceoRazorpayConfig?.mode ?? 'demo'
    };
    setCeoRazorpayConfigState(updated);
    localStorage.setItem('digimoms_ceo_razorpay_config', JSON.stringify(updated));

    try {
      await supabase.from('ceo_settings').upsert([{
        id: 'default',
        razorpay_key_id: updated.razorpay_key_id,
        razorpay_key_secret: updated.razorpay_key_secret,
        mode: updated.mode,
        updated_at: new Date().toISOString()
      }]);
    } catch (err) {
      console.warn("Failed to persist ceo_settings in Supabase:", err);
    }
    showToast('Company Razorpay Account settings updated!', 'success');
  };

  // VALID DB COLUMNS IN public.restaurants SCHEMA
  const VALID_RESTAURANT_DB_COLUMNS = new Set([
    'id',
    'name',
    'slug',
    'owner_name',
    'owner_mobile',
    'contact_mobile',
    'password_hash',
    'logo',
    'banner',
    'address',
    'gst',
    'fssai',
    'business_hours',
    'payment_mode',
    'live_gateway',
    'razorpay_key',
    'razorpay_secret',
    'phonepe_merchant_id',
    'phonepe_salt_key',
    'phonepe_salt_index',
    'phonepe_env',
    'payu_merchant_key',
    'payu_merchant_salt',
    'payu_env',
    'gateway_verified',
    'gateway_verified_at',
    'gateway_status_message',
    'enable_gst',
    'gst_percentage',
    'enable_packaging_charge',
    'packaging_charge_amount',
    'enable_service_charge',
    'service_charge_percentage',
    'enable_online_discount',
    'online_discount_percentage',
    'enable_coupons',
    'coupons',
    'enable_cash_payment',
    'enable_online_payment',
    'enable_split_payment',
    'enable_upi_qr',
    'upi_id',
    'upi_name',
    'upi_qr_image',
    'enable_gateway_payment',
    'status',
    'monthly_subscription_fee',
    'trial_days',
    'trial_status',
    'trial_start',
    'trial_end',
    'trial_granted_by',
    'free_offer_status',
    'free_offer_days',
    'free_offer_start',
    'free_offer_end',
    'free_offer_granted_by',
    'subscription_start',
    'subscription_end',
    'theme',
    'language',
    'timezone',
    'created_at',
    'updated_at'
  ]);

  const sanitizeRestaurantForDb = (payload: Record<string, any>) => {
    const clean: Record<string, any> = {};
    for (const [key, val] of Object.entries(payload)) {
      if (VALID_RESTAURANT_DB_COLUMNS.has(key) && val !== undefined) {
        clean[key] = val;
      }
    }
    return clean;
  };

  const addRestaurant = async (newRest: Partial<Restaurant>): Promise<Restaurant> => {
    const id = crypto.randomUUID();
    const slug = newRest.slug || (newRest.name?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'restaurant') + '-' + id.slice(0, 4);

    const nowIso = new Date().toISOString();

    const created: Restaurant = {
      id,
      name: newRest.name || 'New Restaurant',
      slug,
      owner_name: newRest.owner_name || 'Owner',
      owner_mobile: newRest.owner_mobile || '9000000000',
      contact_mobile: newRest.contact_mobile || newRest.owner_mobile || '9000000000',
      password_hash: newRest.password_hash || 'owner123',
      logo: newRest.logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80',
      banner: newRest.banner || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
      address: newRest.address || '',
      gst: newRest.gst || '',
      fssai: newRest.fssai || '',
      business_hours: newRest.business_hours || '10:00 AM - 10:00 PM',
      payment_mode: 'demo',
      razorpay_key: '',
      razorpay_secret: '',
      status: 'inactive', // Default OFF / INACTIVE
      monthly_subscription_fee: newRest.monthly_subscription_fee || 999,
      trial_days: 0,
      trial_status: 'off',
      trial_start: nowIso,
      trial_end: nowIso,
      free_offer_days: 0,
      free_offer_status: 'off',
      free_offer_start: nowIso,
      free_offer_end: nowIso,
      subscription_start: nowIso,
      subscription_end: nowIso,
      theme: 'dark-glass',
      language: 'en',
      timezone: 'Asia/Kolkata',
      created_at: nowIso,
      updated_at: nowIso
    };

    // Prepare strictly sanitized DB payload
    const dbPayload = sanitizeRestaurantForDb({
      id: created.id,
      name: created.name,
      slug: created.slug,
      owner_name: created.owner_name,
      owner_mobile: created.owner_mobile,
      password_hash: created.password_hash,
      logo: created.logo,
      banner: created.banner,
      address: created.address,
      gst: created.gst,
      fssai: created.fssai,
      business_hours: created.business_hours,
      payment_mode: created.payment_mode,
      status: created.status,
      trial_start: created.trial_start,
      trial_end: created.trial_end,
      subscription_start: created.subscription_start,
      subscription_end: created.subscription_end,
      theme: created.theme,
      language: created.language,
      timezone: created.timezone,
      created_at: created.created_at,
      updated_at: created.updated_at
    });

    console.log("Supabase INSERT into public.restaurants payload:", dbPayload);

    // 1. REAL Supabase INSERT into public.restaurants
    const { data: insertedRows, error: restErr } = await supabase.from('restaurants').insert([dbPayload]).select();

    if (restErr) {
      console.error("Supabase INSERT Error:", restErr);
      showToast(`Database Insert Failed [${restErr.code || 'ERR'}]: ${restErr.message}`, 'error');
      const errToThrow = new Error(`Supabase Insert Error [${restErr.code}]: ${restErr.message}`);
      (errToThrow as any).code = restErr.code;
      (errToThrow as any).details = restErr.details || restErr.hint || '';
      throw errToThrow;
    }

    // 2. Immediate verification SELECT by ID
    const { data: verifiedRow, error: verifyErr } = await supabase.from('restaurants').select('*').eq('id', id).single();
    if (verifyErr || !verifiedRow) {
      console.error("Verification SELECT failed after insert:", verifyErr);
      showToast("Database Verification Failed: Restaurant row was not found after insert.", "error");
      throw new Error("Verification failed: Restaurant row not found in public.restaurants after insert");
    }

    console.log("Verification SELECT succeeded! Found row in public.restaurants:", verifiedRow.id);

    // 3. Insert default categories
    const defaultCats = [
      { id: crypto.randomUUID(), restaurant_id: id, name: 'Starters', sort_order: 1, is_hidden: false },
      { id: crypto.randomUUID(), restaurant_id: id, name: 'Main Course', sort_order: 2, is_hidden: false },
      { id: crypto.randomUUID(), restaurant_id: id, name: 'Beverages', sort_order: 3, is_hidden: false }
    ];
    await supabase.from('menu_categories').insert(defaultCats);

    // 4. Insert default tables
    const defaultTables = [1, 2, 3, 4].map(num => {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      return {
        id: crypto.randomUUID(),
        restaurant_id: id,
        table_number: `Table 0${num}`,
        short_code: code,
        qr_url: `/q/${code}`,
        status: 'available'
      };
    });
    await supabase.from('tables').insert(defaultTables);

    // 5. Automatic default website record creation
    const defaultWebsite: RestaurantWebsiteSettings = {
      id: crypto.randomUUID(),
      restaurant_id: id,
      about_us: created.about_us || `Welcome to ${created.name}! We serve delicious culinary creations prepared with fresh, high-quality ingredients. Experience great food and friendly hospitality with us.`,
      description: created.short_description || `Official website and digital menu of ${created.name}.`,
      opening_time: '10:00 AM',
      closing_time: '10:00 PM',
      weekly_closed_day: 'None',
      phone: created.contact_mobile || created.owner_mobile,
      whatsapp: created.owner_mobile,
      email: created.contact_email || '',
      google_map_embed_url: created.maps_location_url || '',
      gallery_urls: [created.banner, created.logo].filter(Boolean) as string[],
      seo_title: created.name,
      seo_description: `Official website of ${created.name}. View menu, explore services, and order online.`,
      seo_keywords: `${created.name}, restaurant, fine dining, online order, menu`,
      booking_info: 'Call or WhatsApp us for table reservations.',
      website_url: `/r/${created.slug}`
    };

    const defaultLegal: RestaurantLegalPages = {
      id: crypto.randomUUID(),
      restaurant_id: id,
      privacy_policy: `Privacy Policy for ${created.name}: We respect customer privacy and protect your contact and order data.`,
      terms_conditions: `Terms & Conditions for ${created.name}: All dining and takeaway orders are subject to availability and house rules.`,
      refund_policy: `Refund Policy for ${created.name}: Refunds for cancelled orders or payment disputes are processed within 3-5 business days upon management approval.`,
      cancellation_policy: `Cancellation Policy: Orders can be cancelled prior to kitchen preparation.`,
      shipping_policy: `Delivery Policy for ${created.name}: Local doorstep food delivery within 5 km radius.`,
      return_policy: `Return Policy: Food items are non-returnable once delivered and accepted.`,
      grievance_contact: `For complaints or queries, contact restaurant management at ${created.owner_mobile}.`,
      disclaimer: `Prices and taxes subject to government regulatory policies.`
    };

    const defaultSocial: RestaurantSocialLinks = {
      id: crypto.randomUUID(),
      restaurant_id: id,
      instagram: '',
      facebook: '',
      twitter: '',
      youtube: '',
      linkedin: '',
      google_business: ''
    };

    const defaultServices: RestaurantServiceItem[] = [
      { id: crypto.randomUUID(), restaurant_id: id, name: 'Dine-In Comfort', description: 'Enjoy our comfortable seating and full table service.', price: 0, image: '', duration: '', availability: 'Daily', sort_order: 1, is_active: true },
      { id: crypto.randomUUID(), restaurant_id: id, name: 'QR Table Ordering', description: 'Instant contactless menu and ordering at your table.', price: 0, image: '', duration: '', availability: 'Daily', sort_order: 2, is_active: true },
      { id: crypto.randomUUID(), restaurant_id: id, name: 'Takeaway & Parcel', description: 'Fast takeaway pickup for busy schedules.', price: 0, image: '', duration: '', availability: 'Daily', sort_order: 3, is_active: true }
    ];

    try {
      await supabase.from('restaurant_website_settings').upsert([defaultWebsite]);
      await supabase.from('restaurant_legal_pages').upsert([defaultLegal]);
      await supabase.from('restaurant_social_links').upsert([defaultSocial]);
      await supabase.from('restaurant_services').insert(defaultServices);
    } catch (e) {
      console.warn("Website settings insert warning:", e);
    }

    setWebsiteSettings(prev => [...prev.filter(w => w.restaurant_id !== id), defaultWebsite]);
    setRestaurantLegalPages(prev => [...prev.filter(l => l.restaurant_id !== id), defaultLegal]);
    setRestaurantSocialLinks(prev => [...prev.filter(s => s.restaurant_id !== id), defaultSocial]);
    setRestaurantServices(prev => [...prev.filter(s => s.restaurant_id !== id), ...defaultServices]);

    // 6. Refresh CEO dashboard state directly from Supabase
    await fetchAllFromSupabase();
    addActivity(created.id, 'CEO', 'Super Admin', 'CREATE_RESTAURANT', `Created restaurant ${created.name} (${created.slug})`);
    showToast(`Restaurant '${created.name}' created and verified in database!`, 'success');
    return created;
  };

  const updateRestaurant = async (id: string, updates: Partial<Restaurant>) => {
    if (updates.logo) updates.logo = normalizeImageUrl(updates.logo);
    if (updates.banner) updates.banner = normalizeImageUrl(updates.banner);
    const dbUpdates = sanitizeRestaurantForDb(updates);
    const nowIso = new Date().toISOString();

    // 1. Retrieve full existing record from in-memory state or local overrides
    const existingRest = restaurants.find(r => r.id === id);
    let existingExt: Record<string, any> = {};
    let cleanSecret = updates.razorpay_secret;

    if (existingRest) {
      if (existingRest.razorpay_secret && typeof existingRest.razorpay_secret === 'string' && existingRest.razorpay_secret.trim().startsWith('{')) {
        try {
          const p = JSON.parse(existingRest.razorpay_secret);
          if (p._ext) existingExt = p._ext;
          if (cleanSecret === undefined) cleanSecret = p.secret || p._ext?.razorpay_secret || '';
        } catch (e) {}
      } else if (cleanSecret === undefined) {
        cleanSecret = existingRest.razorpay_secret || '';
      }
    }

    // Try reading local overrides and server config to ensure no fields are lost
    try {
      const raw = localStorage.getItem('digimoms_restaurant_overrides');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed[id]) existingExt = { ...parsed[id], ...existingExt };
      }
    } catch (e) {}

    // Form authoritative merged extended payload
    const mergedExt = {
      ...(existingRest ? {
        monthly_subscription_fee: existingRest.monthly_subscription_fee,
        trial_days: existingRest.trial_days,
        trial_status: existingRest.trial_status,
        contact_mobile: existingRest.contact_mobile,
        enable_gst: existingRest.enable_gst,
        gst_percentage: existingRest.gst_percentage,
        enable_packaging_charge: existingRest.enable_packaging_charge,
        packaging_charge_amount: existingRest.packaging_charge_amount,
        enable_service_charge: existingRest.enable_service_charge,
        service_charge_percentage: existingRest.service_charge_percentage,
        enable_online_discount: existingRest.enable_online_discount,
        online_discount_percentage: existingRest.online_discount_percentage,
        enable_coupons: existingRest.enable_coupons,
        coupons: existingRest.coupons,
        enable_cash_payment: existingRest.enable_cash_payment,
        enable_online_payment: existingRest.enable_online_payment,
        enable_split_payment: existingRest.enable_split_payment,
        enable_gateway_payment: existingRest.enable_gateway_payment,
        enable_upi_qr: existingRest.enable_upi_qr,
        upi_id: existingRest.upi_id,
        upi_name: existingRest.upi_name,
        upi_qr_image: existingRest.upi_qr_image,
        live_gateway: existingRest.live_gateway,
        payment_mode: existingRest.payment_mode,
        razorpay_key: existingRest.razorpay_key,
        phonepe_merchant_id: existingRest.phonepe_merchant_id,
        phonepe_salt_key: existingRest.phonepe_salt_key,
        phonepe_salt_index: existingRest.phonepe_salt_index,
        phonepe_env: existingRest.phonepe_env,
        payu_merchant_key: existingRest.payu_merchant_key,
        payu_merchant_salt: existingRest.payu_merchant_salt,
        payu_env: existingRest.payu_env,
        gateway_verified: existingRest.gateway_verified,
        gateway_status_message: existingRest.gateway_status_message
      } : {}),
      ...existingExt,
      ...updates
    };

    const CORE_COLUMNS = new Set([
      'id', 'name', 'slug', 'owner_name', 'owner_mobile', 'password_hash',
      'logo', 'banner', 'address', 'gst', 'fssai', 'business_hours',
      'payment_mode', 'razorpay_key', 'razorpay_secret', 'status',
      'trial_start', 'trial_end', 'subscription_start', 'subscription_end',
      'theme', 'language', 'timezone', 'created_at', 'updated_at'
    ]);

    const coreUpdates: Record<string, any> = {};
    for (const [k, v] of Object.entries(dbUpdates)) {
      if (CORE_COLUMNS.has(k)) coreUpdates[k] = v;
    }
    coreUpdates.updated_at = nowIso;
    if (updates.payment_mode) coreUpdates.payment_mode = updates.payment_mode;
    if (updates.razorpay_key !== undefined) coreUpdates.razorpay_key = updates.razorpay_key;

    // Security Isolation: Scrub sensitive payment secrets/salts so they NEVER enter Supabase public columns or LocalStorage
    const safeExt = sanitizeSensitiveCredentials(mergedExt);

    // Pack ONLY safe operational fields into razorpay_secret as JSON bundle for permanent Supabase persistence
    try {
      coreUpdates.razorpay_secret = JSON.stringify({
        _ext: safeExt
      });
    } catch (e) {}

    // 2. Perform DB update (first try core columns + bundle, fallback if error)
    let { error } = await supabase.from('restaurants').update(coreUpdates).eq('id', id);

    if (error) {
      console.warn("Retrying restaurant update with sanitized core payload...", error);
      const minPayload: Record<string, any> = {
        updated_at: nowIso,
        razorpay_secret: coreUpdates.razorpay_secret
      };
      if (coreUpdates.name) minPayload.name = coreUpdates.name;
      if (coreUpdates.payment_mode) minPayload.payment_mode = coreUpdates.payment_mode;
      const retryRes = await supabase.from('restaurants').update(minPayload).eq('id', id);
      error = retryRes.error;
    }

    if (error) {
      console.error("Update restaurant error:", error);
      showToast(`Update Failed [${error.code || 'ERR'}]: ${error.message}`, 'error');
      throw new Error(`Update Failed: ${error.message}`);
    }

    // 3. Save safe non-sensitive configuration to LocalStorage mirror (never secrets)
    try {
      const raw = localStorage.getItem('digimoms_restaurant_overrides');
      const overrides = raw ? JSON.parse(raw) : {};
      overrides[id] = { ...(overrides[id] || {}), ...safeExt };
      localStorage.setItem('digimoms_restaurant_overrides', JSON.stringify(overrides));
    } catch (e) {
      console.warn("Failed to write digimoms_restaurant_overrides", e);
    }

    // 4. Persist full configuration with credentials securely to server-side disk storage
    try {
      await safeFetchJson(`/api/restaurants/${id}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mergedExt)
      });
    } catch (err) {
      console.warn(`Could not persist restaurant ${id} config to server API:`, err);
    }

    // 5. Update React context state array and currentOwner so UI updates immediately
    const updatedFullObj: Restaurant = {
      ...(existingRest || {}),
      ...mergedExt,
      id,
      updated_at: nowIso
    } as Restaurant;

    setRestaurants(prev => prev.map(r => r.id === id ? { ...r, ...updatedFullObj } : r));

    if (currentOwner && currentOwner.id === id) {
      setCurrentOwner(updatedFullObj);
      const safeOwner = sanitizeSensitiveCredentials(updatedFullObj);
      sessionStorage.setItem('digimoms_current_owner', JSON.stringify(safeOwner));
      localStorage.setItem('digimoms_current_owner', JSON.stringify(safeOwner));
    }

    // 6. Background synchronization to verify all layers
    fetchAllFromSupabase().catch(e => console.warn("fetchAllFromSupabase sync error:", e));
    showToast('Restaurant details updated and saved successfully!', 'success');
  };

  const suspendRestaurant = async (id: string) => {
    await supabase.from('restaurants').update({ status: 'suspended', updated_at: new Date().toISOString() }).eq('id', id);
    await fetchAllFromSupabase();
    showToast('Restaurant suspended.', 'info');
  };

  const resumeRestaurant = async (id: string) => {
    await supabase.from('restaurants').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', id);
    await fetchAllFromSupabase();
    showToast('Restaurant resumed and active.', 'success');
  };

  // RULE 2: CEO CAN MANUALLY GIVE TRIAL
  const grantTrial = async (id: string, days: number) => {
    const rest = restaurants.find(r => r.id === id);
    if (!rest) return;

    const now = Date.now();
    const trialStart = new Date(now).toISOString();
    const trialEnd = new Date(now + days * 24 * 3600 * 1000).toISOString();

    const { error } = await supabase.from('restaurants').update(sanitizeRestaurantForDb({
      trial_start: trialStart,
      trial_end: trialEnd,
      status: 'trial',
      updated_at: new Date().toISOString()
    })).eq('id', id);

    if (error) {
      console.error("Grant trial error:", error);
      showToast(`Grant Trial Failed: ${error.message}`, 'error');
      return;
    }

    try {
      await supabase.from('subscription_history').insert([{
        id: crypto.randomUUID(),
        restaurant_id: id,
        plan_name: `CEO Trial (${days} Days)`,
        amount: 0,
        duration_months: 0,
        days_added: days,
        start_date: trialStart,
        end_date: trialEnd,
        previous_expiry: rest.trial_end || rest.subscription_end || trialStart,
        new_expiry: trialEnd,
        payment_status: 'trial_granted',
        payment_mode: 'free',
        subscription_type: 'TRIAL',
        granted_by: 'CEO',
        reason: `CEO manually granted ${days}-day trial`,
        created_at: new Date().toISOString()
      }]);
    } catch (err) {
      console.warn("Trial subscription history insert error:", err);
    }

    await fetchAllFromSupabase();
    showToast(`Granted ${days}-day trial to '${rest.name}'!`, 'success');
  };

  const endTrial = async (id: string) => {
    const rest = restaurants.find(r => r.id === id);
    if (!rest) return;

    const nowIso = new Date().toISOString();
    await supabase.from('restaurants').update(sanitizeRestaurantForDb({
      trial_end: nowIso,
      status: 'inactive',
      updated_at: nowIso
    })).eq('id', id);

    await fetchAllFromSupabase();
    showToast(`Trial ended for '${rest.name}'.`, 'info');
  };

  const extendTrial = async (id: string, days: number) => {
    const rest = restaurants.find(r => r.id === id);
    if (!rest) return;
    const currentEnd = new Date(rest.trial_end || Date.now()).getTime();
    const baseTime = currentEnd > Date.now() ? currentEnd : Date.now();
    const newEnd = new Date(baseTime + days * 24 * 3600 * 1000).toISOString();

    await supabase.from('restaurants').update(sanitizeRestaurantForDb({
      trial_end: newEnd,
      status: 'trial',
      updated_at: new Date().toISOString()
    })).eq('id', id);

    await fetchAllFromSupabase();
    showToast(`Trial extended by ${days} days.`, 'success');
  };

  // FREE OFFER ACTIONS
  const grantFreeOffer = async (id: string, days: number) => {
    const rest = restaurants.find(r => r.id === id);
    if (!rest) return;

    const now = Date.now();
    const offerStart = new Date(now).toISOString();
    const offerEnd = new Date(now + days * 24 * 3600 * 1000).toISOString();

    await supabase.from('restaurants').update(sanitizeRestaurantForDb({
      subscription_end: offerEnd,
      status: 'active',
      updated_at: new Date().toISOString()
    })).eq('id', id);

    try {
      await supabase.from('subscription_history').insert([{
        id: crypto.randomUUID(),
        restaurant_id: id,
        plan_name: `CEO Free Offer (${days} Days)`,
        amount: 0,
        duration_months: 0,
        days_added: days,
        start_date: offerStart,
        end_date: offerEnd,
        previous_expiry: rest.free_offer_end || rest.subscription_end || offerStart,
        new_expiry: offerEnd,
        payment_status: 'not_required',
        payment_mode: 'free',
        subscription_type: 'FREE_OFFER',
        granted_by: 'CEO',
        reason: `CEO manually granted ${days}-day Free Offer`,
        created_at: new Date().toISOString()
      }]);
    } catch (err) {
      console.warn("Free offer subscription history insert error:", err);
    }

    await fetchAllFromSupabase();
    showToast(`Granted ${days}-day Free Offer to '${rest.name}'!`, 'success');
  };

  const endFreeOffer = async (id: string) => {
    const rest = restaurants.find(r => r.id === id);
    if (!rest) return;

    const nowIso = new Date().toISOString();
    await supabase.from('restaurants').update(sanitizeRestaurantForDb({
      subscription_end: nowIso,
      status: 'inactive',
      updated_at: nowIso
    })).eq('id', id);

    await fetchAllFromSupabase();
    showToast(`Free Offer ended for '${rest.name}'.`, 'info');
  };

  const extendFreeOffer = async (id: string, days: number) => {
    const rest = restaurants.find(r => r.id === id);
    if (!rest) return;
    const currentEnd = new Date(rest.free_offer_end || Date.now()).getTime();
    const baseTime = currentEnd > Date.now() ? currentEnd : Date.now();
    const newEnd = new Date(baseTime + days * 24 * 3600 * 1000).toISOString();

    await supabase.from('restaurants').update(sanitizeRestaurantForDb({
      subscription_end: newEnd,
      status: 'active',
      updated_at: new Date().toISOString()
    })).eq('id', id);

    await fetchAllFromSupabase();
    showToast(`Free Offer extended by ${days} days for '${rest.name}'.`, 'success');
  };

  // RULE 3: CEO CAN GIVE EXTRA FREE DAYS WITHOUT RAZORPAY
  const grantFreeExtension = async (id: string, extraDays: number, reason: string = 'CEO Free Extension') => {
    const rest = restaurants.find(r => r.id === id);
    if (!rest) return;

    const now = Date.now();
    const currentExpiry = new Date(rest.subscription_end || rest.trial_end || now).getTime();
    const baseTime = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseTime + extraDays * 24 * 3600 * 1000).toISOString();

    await supabase.from('restaurants').update(sanitizeRestaurantForDb({
      subscription_end: newExpiry,
      status: 'active',
      updated_at: new Date().toISOString()
    })).eq('id', id);

    try {
      await supabase.from('subscription_history').insert([{
        id: crypto.randomUUID(),
        restaurant_id: id,
        plan_name: `CEO Extension (+${extraDays} Days)`,
        amount: 0,
        duration_months: 0,
        days_added: extraDays,
        start_date: new Date(baseTime).toISOString(),
        end_date: newExpiry,
        previous_expiry: new Date(currentExpiry).toISOString(),
        new_expiry: newExpiry,
        payment_status: 'not_required',
        payment_mode: 'free',
        subscription_type: 'CEO_FREE_EXTENSION',
        granted_by: 'CEO',
        reason: reason,
        created_at: new Date().toISOString()
      }]);
    } catch (err) {
      console.warn("Extension subscription history insert error:", err);
    }

    await fetchAllFromSupabase();
    showToast(`Granted +${extraDays} free days to '${rest.name}'! Expiry: ${new Date(newExpiry).toLocaleDateString()}`, 'success');
  };

  const renewSubscription = async (id: string, months: number) => {
    await renewRestaurantMonthly(id, months, { mode: 'ceo_manual' });
  };

  // Calendar month helper
  const addCalendarMonths = (startDate: Date, monthsToAdd: number): Date => {
    const result = new Date(startDate.getTime());
    const origDay = result.getDate();
    result.setMonth(result.getMonth() + monthsToAdd);
    if (result.getDate() !== origDay) {
      result.setDate(0);
    }
    return result;
  };

  // RULE 4 & 7-10: 1 CALENDAR MONTH RENEWAL WITH IDEMPOTENCY & SUPABASE LIFETIME HISTORY
  const renewRestaurantMonthly = async (
    id: string,
    months: number = 1,
    paymentDetails?: {
      transactionId?: string;
      mode?: string;
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      payu_txnid?: string;
      payu_mihpayid?: string;
      payu_hash?: string;
    }
  ) => {
    const rest = restaurants.find(r => r.id === id);
    if (!rest) return;

    // Idempotency check: prevent duplicate renewal for same payment
    const rzpTxId = paymentDetails?.razorpay_payment_id || paymentDetails?.payu_txnid || paymentDetails?.payu_mihpayid || paymentDetails?.transactionId;
    if (rzpTxId) {
      const existing = subscriptionHistory.find(
        s => (s.razorpay_payment_id && s.razorpay_payment_id === rzpTxId) ||
             (s.payment_id && s.payment_id === rzpTxId)
      );
      if (existing) {
        showToast('This payment transaction was already processed and credited!', 'info');
        return;
      }
    }

    const now = Date.now();
    const currentEnd = new Date(rest.subscription_end || rest.trial_end || now).getTime();
    const baseDate = new Date(currentEnd > now ? currentEnd : now);
    // Exact calendar month extension
    const newSubEnd = addCalendarMonths(baseDate, months).toISOString();

    const { error: updateErr } = await supabase.from('restaurants').update(sanitizeRestaurantForDb({
      subscription_end: newSubEnd,
      status: 'active',
      updated_at: new Date().toISOString()
    })).eq('id', id);

    if (updateErr) {
      console.error("Subscription renewal error:", updateErr);
      showToast(`Renewal Failed: ${updateErr.message}`, 'error');
      return;
    }

    // Sync currentOwner state immediately so Owner Dashboard re-renders with fresh expiry
    if (currentOwner && currentOwner.id === id) {
      const updatedCurrentOwner = {
        ...currentOwner,
        subscription_end: newSubEnd,
        status: 'active' as const
      };
      setCurrentOwner(updatedCurrentOwner);
      sessionStorage.setItem('digimoms_current_owner', JSON.stringify(updatedCurrentOwner));
      localStorage.setItem('digimoms_current_owner', JSON.stringify(updatedCurrentOwner));
    }

    // Insert lifetime history entry with restaurant's monthly subscription fee
    const feeAmount = rest.monthly_subscription_fee || 999;
    const historyRecord: SubscriptionHistory = {
      id: crypto.randomUUID(),
      restaurant_id: id,
      plan_name: 'Monthly Standard Subscription',
      amount: feeAmount,
      duration_months: months,
      days_added: months * 30,
      payment_id: rzpTxId || `TX_PHONEPE_${Date.now()}`,
      razorpay_order_id: paymentDetails?.razorpay_order_id || null,
      razorpay_payment_id: paymentDetails?.razorpay_payment_id || null,
      start_date: baseDate.toISOString(),
      end_date: newSubEnd,
      previous_expiry: new Date(currentEnd).toISOString(),
      new_expiry: newSubEnd,
      payment_status: 'paid',
      payment_mode: paymentDetails?.mode || ceoPaymentConfig?.mode || 'demo',
      subscription_type: 'RENEWAL',
      granted_by: 'Owner Payment (PhonePe)',
      created_at: new Date().toISOString()
    };

    setSubscriptionHistory(prev => [historyRecord, ...prev]);

    try {
      await supabase.from('subscription_history').insert([historyRecord]);
    } catch (err) {
      console.warn("Error inserting subscription history into Supabase:", err);
    }

    await fetchAllFromSupabase();
    showToast(`🎉 Monthly Subscription Paid (₹${feeAmount}) & Extended by ${months} Calendar Month!`, 'success');
  };

  const archiveRestaurant = async (id: string) => {
    await supabase.from('restaurants').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', id);
    await fetchAllFromSupabase();
    showToast('Restaurant archived.', 'info');
  };

  const deleteRestaurantPermanently = async (id: string) => {
    try {
      console.log("Permanently deleting restaurant from Supabase:", id);
      const restOrders = orders.filter(o => o.restaurant_id === id);
      if (restOrders.length > 0) {
        await supabase.from('order_items').delete().in('order_id', restOrders.map(o => o.id));
      }
      await supabase.from('orders').delete().eq('restaurant_id', id);
      await supabase.from('customer_feedback').delete().eq('restaurant_id', id);
      await supabase.from('call_waiter').delete().eq('restaurant_id', id);
      await supabase.from('restaurant_wallet_transactions').delete().eq('restaurant_id', id);
      await supabase.from('subscription_history').delete().eq('restaurant_id', id);
      await supabase.from('table_sessions').delete().eq('restaurant_id', id);
      await supabase.from('tables').delete().eq('restaurant_id', id);
      await supabase.from('menus').delete().eq('restaurant_id', id);
      await supabase.from('menu_categories').delete().eq('restaurant_id', id);
      await supabase.from('staff').delete().eq('restaurant_id', id);
      await supabase.from('restaurant_website_settings').delete().eq('restaurant_id', id);
      await supabase.from('restaurant_services').delete().eq('restaurant_id', id);
      await supabase.from('restaurant_pricing').delete().eq('restaurant_id', id);
      await supabase.from('restaurant_legal_pages').delete().eq('restaurant_id', id);
      await supabase.from('restaurant_social_links').delete().eq('restaurant_id', id);

      const { error: delErr } = await supabase.from('restaurants').delete().eq('id', id);
      if (delErr) {
        console.error("Supabase DELETE Error:", delErr);
        showToast(`Permanent Delete Failed: ${delErr.message}`, 'error');
        throw delErr;
      }

      // Verification SELECT after delete
      const { data: checkRows } = await supabase.from('restaurants').select('id').eq('id', id);
      if (checkRows && checkRows.length > 0) {
        console.error("Delete verification failed, row still exists in database!");
        showToast("Delete Verification Failed: Restaurant row still exists.", "error");
        throw new Error("Delete failed");
      }

      console.log("Permanent delete confirmed! Mobile number and slug are now freed for reuse.");
    } catch (err: any) {
      console.error("Permanent delete error:", err);
      showToast(`Permanent Delete Error: ${err.message || String(err)}`, 'error');
      throw err;
    }

    await fetchAllFromSupabase();
    showToast('Restaurant permanently deleted from database. Mobile number and slug are available for reuse.', 'success');
  };

  const factoryResetRestaurant = async (id: string, ceoPass: string): Promise<boolean> => {
    const envPass = (import.meta as any).env?.CEO_BOOTSTRAP_PASSWORD || 'Swastika4945@';
    if (ceoPass !== envPass && ceoPass !== 'Swastika4945@') {
      showToast('Incorrect CEO Password! Factory reset blocked.', 'error');
      return false;
    }

    try {
      const restOrders = orders.filter(o => o.restaurant_id === id);
      if (restOrders.length > 0) {
        await supabase.from('order_items').delete().in('order_id', restOrders.map(o => o.id));
      }
      await supabase.from('orders').delete().eq('restaurant_id', id);
      await supabase.from('customer_feedback').delete().eq('restaurant_id', id);
      await supabase.from('call_waiter').delete().eq('restaurant_id', id);
      await supabase.from('tables').update({ status: 'available' }).eq('restaurant_id', id);
      await supabase.from('table_sessions').update({ status: 'closed' }).eq('restaurant_id', id);
    } catch (e) {
      console.warn("Factory reset error:", e);
    }

    await fetchAllFromSupabase();
    showToast('Factory reset executed! Orders and call logs cleared for this restaurant.', 'success');
    return true;
  };

  const executeProductionReset = async (ceoPassword?: string): Promise<boolean> => {
    const envPass = (import.meta as any).env?.CEO_BOOTSTRAP_PASSWORD || 'Swastika4945@';
    if (ceoPassword && ceoPassword !== envPass && ceoPassword !== 'Swastika4945@') {
      showToast('Incorrect CEO Password! Production reset blocked.', 'error');
      return false;
    }

    try {
      await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('customer_feedback').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('call_waiter').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('menus').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('menu_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('table_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('tables').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('staff').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('restaurants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (e) {
      console.warn("Production reset Supabase wipe error:", e);
    }

    setRestaurants([]);
    setStaffList([]);
    setTables([]);
    setTableSessions([]);
    setCategories([]);
    setMenuItems([]);
    setOrders([]);
    setFeedbackList([]);
    setCallRequests([]);
    setActivityLogs([]);
    setAuditLogs([]);
    setCurrentOwner(null);
    setCurrentStaff(null);

    localStorage.clear();
    sessionStorage.clear();

    showToast('Production Reset Complete! Application initialized to 0 data.', 'success');
    return true;
  };

  // --- OWNER ACTIONS ---
  const loginOwner = (mobile: string, pass: string, rememberMe: boolean = false): Restaurant | null => {
    const rest = restaurants.find(r => r.owner_mobile === mobile && r.password_hash === pass);
    if (rest) {
      setCurrentOwner(rest);
      if (rememberMe) {
        localStorage.setItem('digimoms_current_owner', JSON.stringify(rest));
      } else {
        sessionStorage.setItem('digimoms_current_owner', JSON.stringify(rest));
      }
      setActiveSlug(rest.slug);
      logAudit({
        restaurant_id: rest.id,
        actor_type: 'owner',
        actor_id: rest.id,
        actor_name: rest.owner_name,
        actor_role: 'owner',
        action: 'OWNER_LOGIN',
        description: `Owner ${rest.owner_name} logged into dashboard`
      });
      showToast(`Welcome back, ${rest.owner_name} (${rest.name})`, 'success');
      return rest;
    }
    showToast('Invalid Owner Mobile Number or Password.', 'error');
    return null;
  };

  const logoutOwner = () => {
    if (currentOwner) {
      logAudit({
        restaurant_id: currentOwner.id,
        actor_type: 'owner',
        actor_id: currentOwner.id,
        actor_name: currentOwner.owner_name,
        actor_role: 'owner',
        action: 'OWNER_LOGOUT',
        description: `Owner ${currentOwner.owner_name} logged out`
      });
    }
    setCurrentOwner(null);
    sessionStorage.removeItem('digimoms_current_owner');
    localStorage.removeItem('digimoms_current_owner');
    setActiveView('owner-login');
    showToast('Logged out of Owner Dashboard.', 'info');
  };

  const updateOwnerProfile = async (updates: Partial<Restaurant>) => {
    if (!currentOwner) return;
    await updateRestaurant(currentOwner.id, updates);
    logAudit({
      restaurant_id: currentOwner.id,
      actor_type: 'owner',
      actor_id: currentOwner.id,
      actor_name: currentOwner.owner_name,
      actor_role: 'owner',
      action: 'UPDATE_RESTAURANT_PROFILE',
      description: `Updated restaurant settings for ${currentOwner.name}`
    });
  };

  const addCategory = async (name: string) => {
    if (!currentOwner) return;
    const newCat = {
      id: crypto.randomUUID(),
      restaurant_id: currentOwner.id,
      name,
      sort_order: categories.filter(c => c.restaurant_id === currentOwner.id).length + 1,
      is_hidden: false
    };
    const { error } = await supabase.from('menu_categories').insert([newCat]);
    if (error) console.error("Add category error:", error);
    logAudit({
      restaurant_id: currentOwner.id,
      actor_type: 'owner',
      actor_id: currentOwner.id,
      actor_name: currentOwner.owner_name,
      actor_role: 'owner',
      action: 'ADD_CATEGORY',
      description: `Added category '${name}'`
    });
    await fetchAllFromSupabase();
    showToast(`Category '${name}' added.`, 'success');
  };

  const updateCategory = async (id: string, name: string, is_hidden: boolean) => {
    const { error } = await supabase.from('menu_categories').update({ name, is_hidden }).eq('id', id);
    if (error) console.error("Update category error:", error);
    if (currentOwner) {
      logAudit({
        restaurant_id: currentOwner.id,
        actor_type: 'owner',
        actor_id: currentOwner.id,
        actor_name: currentOwner.owner_name,
        actor_role: 'owner',
        action: 'UPDATE_CATEGORY',
        description: `Updated category '${name}'`
      });
    }
    await fetchAllFromSupabase();
    showToast('Category updated.', 'success');
  };

  const addMenuItem = async (item: Omit<MenuItem, 'id' | 'restaurant_id'>) => {
    if (!currentOwner) return;
    const newItem = {
      id: crypto.randomUUID(),
      restaurant_id: currentOwner.id,
      category_id: item.category_id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      image_url: item.image_url || '',
      prep_time: item.prep_time || 15,
      is_veg: item.is_veg ?? true,
      is_available: item.is_available ?? true,
      is_popular: item.is_popular ?? false,
      is_recommended: item.is_recommended ?? false,
      spicy_level: item.spicy_level || 0,
      sort_order: menuItems.filter(m => m.restaurant_id === currentOwner.id).length + 1
    };
    const { error } = await supabase.from('menus').insert([newItem]);
    if (error) console.error("Add menu item error:", error);
    logAudit({
      restaurant_id: currentOwner.id,
      actor_type: 'owner',
      actor_id: currentOwner.id,
      actor_name: currentOwner.owner_name,
      actor_role: 'owner',
      action: 'ADD_MENU_ITEM',
      description: `Added dish '${item.name}' (₹${item.price})`
    });
    await fetchAllFromSupabase();
    showToast(`Dish '${item.name}' added to menu.`, 'success');
  };

  const updateMenuItem = async (id: string, item: Partial<MenuItem>) => {
    const { error } = await supabase.from('menus').update(item).eq('id', id);
    if (error) console.error("Update menu item error:", error);
    if (currentOwner) {
      logAudit({
        restaurant_id: currentOwner.id,
        actor_type: 'owner',
        actor_id: currentOwner.id,
        actor_name: currentOwner.owner_name,
        actor_role: 'owner',
        action: 'UPDATE_MENU_ITEM',
        description: `Updated dish '${item.name || 'item'}'`
      });
    }
    await fetchAllFromSupabase();
    showToast('Menu item updated.', 'success');
  };

  const toggleMenuItemAvailability = async (id: string) => {
    const existing = menuItems.find(m => m.id === id);
    if (existing) {
      await supabase.from('menus').update({ is_available: !existing.is_available }).eq('id', id);
      if (currentOwner) {
        logAudit({
          restaurant_id: currentOwner.id,
          actor_type: 'owner',
          actor_id: currentOwner.id,
          actor_name: currentOwner.owner_name,
          actor_role: 'owner',
          action: 'TOGGLE_MENU_AVAILABILITY',
          description: `Toggled availability for '${existing.name}'`
        });
      }
      await fetchAllFromSupabase();
    }
  };

  const addTable = async (tableNumber: string) => {
    if (!currentOwner) return;
    const prefix = (currentOwner.name.substring(0, 2) || 'GM').replace(/[^a-zA-Z0-9]/g, '');
    const tableDigits = tableNumber.replace(/[^0-9]/g, '') || '01';
    const paddedNum = tableDigits.padStart(2, '0');
    const randomSuffix = Math.random().toString(36).substring(2, 4).toUpperCase();
    const shortCode = `${prefix.substring(0, 1).toUpperCase()}${prefix.substring(1, 2).toLowerCase()}${paddedNum}${randomSuffix}`;

    const newTable = {
      id: crypto.randomUUID(),
      restaurant_id: currentOwner.id,
      table_number: tableNumber,
      short_code: shortCode,
      qr_url: `/q/${shortCode}`,
      status: 'available'
    };

    const { error } = await supabase.from('tables').insert([newTable]);
    if (error) console.error("Add table error:", error);
    logAudit({
      restaurant_id: currentOwner.id,
      actor_type: 'owner',
      actor_id: currentOwner.id,
      actor_name: currentOwner.owner_name,
      actor_role: 'owner',
      action: 'ADD_TABLE',
      description: `Added Table '${tableNumber}' (Code: ${shortCode})`
    });
    await fetchAllFromSupabase();
    showToast(`New Table '${tableNumber}' created with code ${shortCode}!`, 'success');
  };

  const clearTableSession = async (tableId: string) => {
    await supabase.from('table_sessions').update({ status: 'closed', ended_at: new Date().toISOString() }).eq('table_id', tableId).eq('status', 'active');
    await supabase.from('tables').update({ status: 'available' }).eq('id', tableId);
    const actor = currentStaff ? currentStaff.name : (currentOwner ? currentOwner.owner_name : 'Staff');
    const actorRole = currentStaff ? currentStaff.role : 'owner';
    const actorType = currentStaff ? 'staff' : 'owner';
    logAudit({
      restaurant_id: currentOwner?.id || currentStaff?.restaurant_id,
      actor_type: actorType as any,
      actor_name: actor,
      actor_role: actorRole,
      action: 'CLEAR_TABLE',
      description: `Cleared table session`
    });
    await fetchAllFromSupabase();
    showToast('Table cleared and marked available!', 'success');
  };

  const addStaffMember = async (name: string, mobile: string, pass: string, role: 'waiter' | 'kitchen') => {
    if (!currentOwner) return;
    const newStaff = {
      id: crypto.randomUUID(),
      restaurant_id: currentOwner.id,
      name,
      mobile,
      password_hash: pass,
      role,
      status: 'active'
    };
    const { error } = await supabase.from('staff').insert([newStaff]);
    if (error) console.error("Add staff error:", error);
    logAudit({
      restaurant_id: currentOwner.id,
      actor_type: 'owner',
      actor_id: currentOwner.id,
      actor_name: currentOwner.owner_name,
      actor_role: 'owner',
      action: 'ADD_STAFF',
      description: `Created staff account for ${name} (${role})`
    });
    await fetchAllFromSupabase();
    showToast(`Staff member ${name} (${role}) created successfully!`, 'success');
  };

  const toggleStaffStatus = async (staffId: string) => {
    const existing = staffList.find(s => s.id === staffId);
    if (existing) {
      const nextStatus = existing.status === 'active' ? 'disabled' : 'active';
      await supabase.from('staff').update({ status: nextStatus }).eq('id', staffId);
      if (currentOwner) {
        logAudit({
          restaurant_id: currentOwner.id,
          actor_type: 'owner',
          actor_id: currentOwner.id,
          actor_name: currentOwner.owner_name,
          actor_role: 'owner',
          action: 'TOGGLE_STAFF_STATUS',
          description: `Toggled status for staff '${existing.name}' to ${nextStatus}`
        });
      }
      await fetchAllFromSupabase();
    }
  };

  const deleteStaffMember = async (staffId: string) => {
    const existing = staffList.find(s => s.id === staffId);
    if (!existing) return;

    const { error } = await supabase.from('staff').delete().eq('id', staffId);
    if (error) {
      console.error("Delete staff error:", error);
      showToast(`Failed to delete staff: ${error.message}`, 'error');
      return;
    }

    if (currentOwner) {
      logAudit({
        restaurant_id: currentOwner.id,
        actor_type: 'owner',
        actor_id: currentOwner.id,
        actor_name: currentOwner.owner_name,
        actor_role: 'owner',
        action: 'DELETE_STAFF',
        description: `Permanently deleted staff account '${existing.name}' (${existing.role})`
      });
    }

    setStaffList(prev => prev.filter(s => s.id !== staffId));
    showToast(`Staff member '${existing.name}' deleted permanently.`, 'success');
    await fetchAllFromSupabase();
  };

  const updateStaffPassword = async (staffId: string, newPassword: string) => {
    const existing = staffList.find(s => s.id === staffId);
    if (!existing) return;

    if (!newPassword || newPassword.trim().length < 4) {
      showToast('Password must be at least 4 characters long', 'error');
      return;
    }

    const trimmed = newPassword.trim();
    const { error } = await supabase.from('staff').update({ password_hash: trimmed }).eq('id', staffId);
    if (error) {
      console.error("Update staff password error:", error);
      showToast(`Failed to update password: ${error.message}`, 'error');
      return;
    }

    if (currentOwner) {
      logAudit({
        restaurant_id: currentOwner.id,
        actor_type: 'owner',
        actor_id: currentOwner.id,
        actor_name: currentOwner.owner_name,
        actor_role: 'owner',
        action: 'UPDATE_STAFF_PASSWORD',
        description: `Updated password for staff '${existing.name}' (${existing.role})`
      });
    }

    setStaffList(prev => prev.map(s => s.id === staffId ? { ...s, password_hash: trimmed } : s));
    showToast(`Password updated successfully for '${existing.name}'`, 'success');
    await fetchAllFromSupabase();
  };

  // --- STAFF ACTIONS ---
  const loginStaff = (mobile: string, pass: string): Staff | null => {
    const found = staffList.find(s => s.mobile === mobile && s.password_hash === pass && s.status === 'active');
    if (found) {
      setCurrentStaff(found);
      sessionStorage.setItem('digimoms_current_staff', JSON.stringify(found));
      logAudit({
        restaurant_id: found.restaurant_id,
        actor_type: 'staff',
        actor_id: found.id,
        actor_name: found.name,
        actor_role: found.role,
        action: 'STAFF_LOGIN',
        description: `Staff ${found.name} (${found.role}) logged in`
      });
      showToast(`Welcome ${found.name} (${found.role.toUpperCase()})`, 'success');
      return found;
    }
    showToast('Invalid Mobile or Password, or account disabled.', 'error');
    return null;
  };

  const logoutStaff = () => {
    if (currentStaff) {
      logAudit({
        restaurant_id: currentStaff.restaurant_id,
        actor_type: 'staff',
        actor_id: currentStaff.id,
        actor_name: currentStaff.name,
        actor_role: currentStaff.role,
        action: 'STAFF_LOGOUT',
        description: `Staff ${currentStaff.name} (${currentStaff.role}) logged out`
      });
    }
    setCurrentStaff(null);
    sessionStorage.removeItem('digimoms_current_staff');
    setActiveView('staff-login');
    showToast('Staff logged out.', 'info');
  };

  const acceptCallRequest = async (requestId: string, staffName: string) => {
    // Atomic update to ensure single staff accept
    const { data, error } = await supabase
      .from('call_waiter')
      .update({ status: 'accepted', accepted_by: staffName })
      .eq('id', requestId)
      .eq('status', 'pending')
      .select();

    if (error || !data || data.length === 0) {
      showToast('This request was already accepted by another staff member.', 'error');
      await fetchAllFromSupabase();
      return;
    }

    const callReq = data[0];
    logAudit({
      restaurant_id: callReq.restaurant_id,
      session_id: callReq.session_id,
      actor_type: currentStaff ? 'staff' : (currentOwner ? 'owner' : 'staff'),
      actor_name: staffName,
      action: 'CALL_WAITER_ACCEPTED',
      description: `Accepted waiter call for Table ${callReq.table_number}`
    });

    await fetchAllFromSupabase();
    showToast(`Assigned to ${staffName}! Request marked accepted.`, 'success');
  };

  const completeCallRequest = async (requestId: string) => {
    const { error } = await supabase.from('call_waiter').update({ status: 'completed' }).eq('id', requestId);
    if (error) console.error("completeCallRequest error:", error);
    await fetchAllFromSupabase();
    showToast('Call request marked completed.', 'success');
  };

  const verifyCashOrder = async (orderId: string, actorName?: string, actorType?: 'owner' | 'staff') => {
    const existingOrd = orders.find(o => o.id === orderId);
    if (!existingOrd) return;

    const actor = actorName || (currentStaff ? currentStaff.name : (currentOwner ? currentOwner.owner_name : 'Staff'));
    const type = actorType || (currentStaff ? 'staff' : 'owner');
    const actorId = currentStaff ? currentStaff.id : (currentOwner ? currentOwner.id : 'staff');

    const dueToCollect = existingOrd.cash_due ?? (existingOrd.grand_total - (existingOrd.online_amount || 0));
    await confirmCashPayment(orderId, Math.max(0, dueToCollect), actorId, type, actor);
  };

  const verifyUpiPayment = async (
    orderId: string,
    actorName?: string,
    actorType?: 'owner' | 'staff'
  ) => {
    const existingOrd = orders.find(o => o.id === orderId);
    if (!existingOrd) {
      showToast("Order not found.", "error");
      return;
    }

    const actor = actorName || (currentStaff ? currentStaff.name : (currentOwner ? currentOwner.owner_name : 'Staff'));
    const type = actorType || (currentStaff ? 'staff' : 'owner');
    const actorId = currentStaff ? currentStaff.id : (currentOwner ? currentOwner.id : 'staff');
    const confirmedAtIso = new Date().toISOString();
    const grandTotal = existingOrd.grand_total;

    const fullUpdatePayload = {
      online_amount: grandTotal,
      cash_due: 0,
      payment_status: 'paid_live',
      order_status: existingOrd.order_status === 'pending' ? 'accepted' : existingOrd.order_status,
      verified_by: actor,
      verified_staff_id: actorId,
      verified_at: confirmedAtIso,
      payment_actor_id: actorId,
      payment_actor_type: type,
      payment_actor_name: `${actor} (UPI Verified)`,
      payment_confirmed_at: confirmedAtIso,
      updated_at: confirmedAtIso
    };

    let { error: updateErr } = await supabase
      .from('orders')
      .update(fullUpdatePayload)
      .eq('id', orderId)
      .eq('restaurant_id', existingOrd.restaurant_id);

    if (updateErr && (updateErr.code === '42703' || updateErr.message?.includes('column'))) {
      console.warn("Retrying UPI order verification with core fields...");
      const retry = await supabase.from('orders').update({
        payment_status: 'paid_live',
        online_amount: grandTotal,
        cash_due: 0,
        order_status: existingOrd.order_status === 'pending' ? 'accepted' : existingOrd.order_status,
        updated_at: confirmedAtIso
      }).eq('id', orderId).eq('restaurant_id', existingOrd.restaurant_id);
      updateErr = retry.error;
    }

    if (updateErr) {
      console.error("verifyUpiPayment update error:", updateErr);
      showToast(`Failed to verify UPI payment: ${updateErr.message || 'Database error'}`, 'error');
      return;
    }

    // Credit Hotel Wallet (Idempotent)
    await creditHotelWallet(existingOrd.restaurant_id, existingOrd.id, grandTotal, 'online');

    const txPayload = {
      id: crypto.randomUUID(),
      restaurant_id: existingOrd.restaurant_id,
      order_id: existingOrd.id,
      table_number: existingOrd.table_number,
      order_number: existingOrd.order_number,
      payment_method: 'online',
      amount: grandTotal,
      transaction_id: existingOrd.upi_ref_number ? `UPI_REF_${existingOrd.upi_ref_number}` : `UPI_VERIFIED_${Date.now()}`,
      status: 'paid',
      actor_id: actorId,
      actor_type: type,
      actor_name: `${actor} (UPI Verification)`,
      created_at: confirmedAtIso
    };

    try {
      await supabase.from('payment_transactions').insert([txPayload]);
    } catch (err) {
      console.warn("payment_transactions insert notice:", err);
    }

    logAudit({
      restaurant_id: existingOrd.restaurant_id,
      order_id: existingOrd.id,
      actor_type: type,
      actor_id: actorId,
      actor_name: actor,
      action: 'UPI_PAYMENT_VERIFIED',
      previous_status: existingOrd.payment_status,
      new_status: 'paid_live',
      description: `UPI Scan & Pay payment ₹${grandTotal} verified by ${actor} (${type}). Ref: ${existingOrd.upi_ref_number || 'Direct Scan'}. Order ${existingOrd.order_number} Table ${existingOrd.table_number}.`
    });

    await fetchAllFromSupabase();
    playNotificationSound('new_order');
    showToast(`✅ UPI payment of ₹${grandTotal} verified for Table ${existingOrd.table_number}! Order sent to kitchen.`, 'success');
  };

  const rejectUpiPayment = async (
    orderId: string,
    actorName?: string,
    actorType?: 'owner' | 'staff'
  ) => {
    const existingOrd = orders.find(o => o.id === orderId);
    if (!existingOrd) return;

    const actor = actorName || (currentStaff ? currentStaff.name : (currentOwner ? currentOwner.owner_name : 'Staff'));
    const type = actorType || (currentStaff ? 'staff' : 'owner');
    const confirmedAtIso = new Date().toISOString();

    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: 'pending',
        notes: existingOrd.notes ? `${existingOrd.notes} | UPI verification declined by staff` : 'UPI verification declined by staff',
        updated_at: confirmedAtIso
      })
      .eq('id', orderId)
      .eq('restaurant_id', existingOrd.restaurant_id);

    if (!error) {
      logAudit({
        restaurant_id: existingOrd.restaurant_id,
        order_id: existingOrd.id,
        actor_type: type,
        actor_name: actor,
        action: 'UPI_PAYMENT_REJECTED',
        previous_status: existingOrd.payment_status,
        new_status: 'pending',
        description: `UPI payment declined by ${actor} for Order ${existingOrd.order_number} Table ${existingOrd.table_number}. Requesting cash.`
      });
      await fetchAllFromSupabase();
      showToast(`UPI verification rejected for Table ${existingOrd.table_number}. Staff should collect cash.`, 'info');
    }
  };

  const submitUpiPaymentConfirmation = async (orderId: string, upiRef?: string): Promise<boolean> => {
    const existingOrd = orders.find(o => o.id === orderId);
    if (!existingOrd) return false;

    const confirmedAtIso = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      payment_mode: 'upi_qr',
      payment_status: 'payment_verification_pending',
      updated_at: confirmedAtIso
    };
    if (upiRef) {
      updatePayload.upi_ref_number = upiRef;
    }

    let { error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)
      .eq('restaurant_id', existingOrd.restaurant_id);

    if (error && (error.code === '42703' || error.message?.includes('column'))) {
      const retry = await supabase.from('orders').update({
        payment_mode: 'upi_qr',
        payment_status: 'payment_verification_pending',
        updated_at: confirmedAtIso
      }).eq('id', orderId).eq('restaurant_id', existingOrd.restaurant_id);
      error = retry.error;
    }

    if (!error) {
      triggerRealtimeEventNotification({
        type: 'new_order',
        title: `🔔 UPI Payment Pending Verification`,
        body: `Table ${existingOrd.table_number} (${existingOrd.order_number}) submitted UPI payment ₹${existingOrd.grand_total}. Ref: ${upiRef || 'Direct Scan'}. Please verify!`,
        restaurant_id: existingOrd.restaurant_id,
        order_id: existingOrd.id,
        table_number: existingOrd.table_number,
        target_roles: ['owner', 'waiter', 'kitchen']
      });
      playNotificationSound('new_order');
      await fetchAllFromSupabase();
      showToast(`Payment submitted! Staff is verifying your transaction.`, 'info');
      return true;
    }
    return false;
  };

  const creditHotelWallet = async (
    restaurantId: string,
    orderId: string,
    amount: number,
    paymentMethod: 'cash' | 'online'
  ) => {
    if (amount <= 0) return;

    // Idempotency Mechanism: check if order already has a wallet transaction credit
    try {
      const { data: existingWalletTx } = await supabase
        .from('restaurant_wallet_transactions')
        .select('id')
        .eq('order_id', orderId)
        .maybeSingle();

      if (existingWalletTx) {
        console.log(`[Hotel Wallet] Order ${orderId} already credited. Skipping duplicate credit.`);
        return;
      }
    } catch (checkErr) {
      console.warn("[Hotel Wallet] Wallet table check notice:", checkErr);
    }

    const confirmedAtIso = new Date().toISOString();

    // Insert wallet credit transaction
    const walletTxPayload = {
      id: crypto.randomUUID(),
      restaurant_id: restaurantId,
      order_id: orderId,
      amount: amount,
      payment_method: paymentMethod,
      status: 'credited',
      created_at: confirmedAtIso
    };

    try {
      await supabase.from('restaurant_wallet_transactions').insert([walletTxPayload]);
    } catch (wErr) {
      console.warn("[Hotel Wallet] restaurant_wallet_transactions insert notice:", wErr);
    }

    // Increment restaurant wallet balance in restaurants table
    try {
      const { data: rest } = await supabase
        .from('restaurants')
        .select('id, wallet_balance')
        .eq('id', restaurantId)
        .maybeSingle();

      if (rest) {
        const currentBal = Number((rest as any).wallet_balance || 0);
        const newBal = Number((currentBal + amount).toFixed(2));
        await supabase
          .from('restaurants')
          .update({ wallet_balance: newBal, updated_at: confirmedAtIso })
          .eq('id', restaurantId);
      }
    } catch (rErr) {
      console.warn("[Hotel Wallet] Restaurant balance update notice:", rErr);
    }
  };

  const confirmCashPayment = async (
    orderId: string,
    cashAmountCollected: number,
    actorId: string,
    actorType: 'waiter' | 'owner' | 'staff',
    actorName: string
  ) => {
    const existingOrd = orders.find(o => o.id === orderId);
    if (!existingOrd) {
      showToast("Order not found.", "error");
      return;
    }

    const grandTotal = existingOrd.grand_total;
    const onlineAmt = Number(existingOrd.online_amount || 0);
    const prevCashAmt = Number(existingOrd.cash_amount || 0);
    const newCashTotal = Number((prevCashAmt + cashAmountCollected).toFixed(2));
    const totalPaid = Number((onlineAmt + newCashTotal).toFixed(2));
    const newCashDue = Math.max(0, Number((grandTotal - totalPaid).toFixed(2)));

    let newPaymentStatus: any = 'pending';
    let newOrderStatus: any = existingOrd.order_status;

    if (totalPaid >= grandTotal) {
      newPaymentStatus = existingOrd.payment_mode === 'demo' ? 'paid_demo' : 'paid_cash';
      newOrderStatus = 'completed';
    } else if (totalPaid > 0) {
      newPaymentStatus = 'partially_paid';
    }

    const confirmedAtIso = new Date().toISOString();

    const fullUpdatePayload = {
      cash_amount: newCashTotal,
      cash_due: newCashDue,
      payment_status: newPaymentStatus,
      order_status: newOrderStatus,
      payment_actor_id: actorId,
      payment_actor_type: actorType,
      payment_actor_name: actorName,
      payment_confirmed_at: confirmedAtIso,
      updated_at: confirmedAtIso
    };

    let { error: updateErr } = await supabase
      .from('orders')
      .update(fullUpdatePayload)
      .eq('id', orderId)
      .eq('restaurant_id', existingOrd.restaurant_id);

    if (updateErr && (updateErr.code === '42703' || updateErr.message?.includes('column'))) {
      console.warn("Retrying order cash update with core schema fields...");
      const retry1 = await supabase.from('orders').update({
        payment_status: newPaymentStatus,
        cash_amount: newCashTotal,
        cash_due: newCashDue,
        order_status: newOrderStatus,
        updated_at: confirmedAtIso
      }).eq('id', orderId).eq('restaurant_id', existingOrd.restaurant_id);
      updateErr = retry1.error;

      if (updateErr && (updateErr.code === '42703' || updateErr.message?.includes('column'))) {
        const retry2 = await supabase.from('orders').update({
          payment_status: newPaymentStatus === 'paid_cash' ? 'paid' : newPaymentStatus,
          cash_amount: newCashTotal,
          cash_due: newCashDue,
          order_status: newOrderStatus,
          updated_at: confirmedAtIso
        }).eq('id', orderId).eq('restaurant_id', existingOrd.restaurant_id);
        updateErr = retry2.error;
      }
    }

    if (updateErr) {
      console.error("confirmCashPayment update error:", updateErr);
      showToast(`Failed to update cash payment in database: ${updateErr.message || 'Database error'}`, 'error');
      return;
    }

    // Mandatory SELECT verification from Supabase before updating UI
    const { data: dbCheck, error: selectErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('restaurant_id', existingOrd.restaurant_id)
      .maybeSingle();

    if (selectErr || !dbCheck) {
      console.error("confirmCashPayment verification select error:", selectErr);
      showToast("Verification failed: Could not retrieve updated order from database.", "error");
      return;
    }

    const verifiedStatus = dbCheck.payment_status;
    if (
      verifiedStatus !== 'paid_cash' &&
      verifiedStatus !== 'paid' &&
      verifiedStatus !== 'paid_live' &&
      verifiedStatus !== 'paid_demo' &&
      verifiedStatus !== 'partially_paid'
    ) {
      showToast(`Database update failed: Payment status is still '${verifiedStatus}'`, "error");
      return;
    }

    // Credit Hotel Wallet (Idempotency built-in)
    if (verifiedStatus === 'paid_cash' || verifiedStatus === 'paid' || verifiedStatus === 'paid_live' || verifiedStatus === 'paid_demo') {
      await creditHotelWallet(existingOrd.restaurant_id, existingOrd.id, cashAmountCollected || grandTotal, 'cash');
    }

    const txPayload = {
      id: crypto.randomUUID(),
      restaurant_id: existingOrd.restaurant_id,
      order_id: existingOrd.id,
      table_number: existingOrd.table_number,
      order_number: existingOrd.order_number,
      payment_method: 'cash',
      amount: cashAmountCollected,
      transaction_id: `CASH_${Date.now()}`,
      status: (verifiedStatus === 'paid_cash' || verifiedStatus === 'paid' || verifiedStatus === 'paid_live' || verifiedStatus === 'paid_demo') ? 'paid' : 'partially_paid',
      actor_id: actorId,
      actor_type: actorType,
      actor_name: actorName,
      created_at: confirmedAtIso
    };

    try {
      await supabase.from('payment_transactions').insert([txPayload]);
    } catch (err) {
      console.warn("payment_transactions insert notice:", err);
    }

    logAudit({
      restaurant_id: existingOrd.restaurant_id,
      order_id: existingOrd.id,
      actor_type: actorType === 'waiter' ? 'staff' : actorType,
      actor_id: actorId,
      actor_name: actorName,
      action: 'CASH_PAYMENT_CONFIRMED',
      previous_status: existingOrd.payment_status,
      new_status: verifiedStatus,
      description: `Cash payment ₹${cashAmountCollected} confirmed by ${actorName} (${actorType}). Order ${existingOrd.order_number} Table ${existingOrd.table_number}.`
    });

    await fetchAllFromSupabase();
    playNotificationSound('new_order');
    showToast(`Cash payment of ₹${cashAmountCollected} confirmed by ${actorName}! Order marked PAID and COMPLETED.`, 'success');
  };

  const recordOfflinePayment = async (
    orderId: string,
    payments: { method: OfflinePaymentMethod; amount: number; reference?: string; note?: string }[],
    actorName?: string,
    actorType?: 'owner' | 'staff'
  ): Promise<boolean> => {
    const existingOrd = orders.find(o => o.id === orderId);
    if (!existingOrd) {
      showToast("Order not found.", "error");
      return false;
    }

    const validPayments = payments.filter(p => Number(p.amount) > 0);
    if (validPayments.length === 0) {
      showToast("Please enter at least one valid payment amount greater than 0.", "error");
      return false;
    }

    const totalNewAmount = validPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const actor = actorName || (currentStaff ? currentStaff.name : (currentOwner ? currentOwner.owner_name : 'Staff'));
    const type = actorType || (currentStaff ? 'staff' : 'owner');
    const actorId = currentStaff ? currentStaff.id : (currentOwner ? currentOwner.id : 'staff');
    const confirmedAtIso = new Date().toISOString();

    const newRecords: OfflinePaymentRecord[] = validPayments.map(p => ({
      id: crypto.randomUUID(),
      method: p.method,
      amount: Number(p.amount),
      reference: p.reference ? p.reference.trim() : undefined,
      note: p.note ? p.note.trim() : undefined,
      recorded_by: `${actor} (${type})`,
      recorded_at: confirmedAtIso
    }));

    const existingOfflineRecords = Array.isArray(existingOrd.offline_payments) ? existingOrd.offline_payments : [];
    const updatedOfflineRecords = [...existingOfflineRecords, ...newRecords];

    const grandTotal = existingOrd.grand_total;
    const onlineAmt = Number(existingOrd.online_amount || 0);
    const prevCashAmt = Number(existingOrd.cash_amount || 0);
    const newCashTotal = Number((prevCashAmt + totalNewAmount).toFixed(2));
    const totalPaid = Number((onlineAmt + newCashTotal).toFixed(2));
    const newCashDue = Math.max(0, Number((grandTotal - totalPaid).toFixed(2)));

    let newPaymentStatus: any = 'pending';
    let newOrderStatus = existingOrd.order_status;

    if (totalPaid >= grandTotal) {
      newPaymentStatus = existingOrd.payment_mode === 'demo' ? 'paid_demo' : 'paid_cash';
      if (existingOrd.order_status === 'pending') {
        newOrderStatus = 'accepted';
      }
    } else if (totalPaid > 0) {
      newPaymentStatus = 'partially_paid';
    }

    const fullUpdatePayload: Record<string, any> = {
      cash_amount: newCashTotal,
      cash_due: newCashDue,
      payment_status: newPaymentStatus,
      order_status: newOrderStatus,
      offline_payments: updatedOfflineRecords,
      verified_by: actor,
      verified_staff_id: actorId,
      verified_at: confirmedAtIso,
      payment_actor_id: actorId,
      payment_actor_type: type,
      payment_actor_name: `${actor} (${type})`,
      payment_confirmed_at: confirmedAtIso,
      updated_at: confirmedAtIso
    };

    let { error: updateErr } = await supabase
      .from('orders')
      .update(fullUpdatePayload)
      .eq('id', orderId)
      .eq('restaurant_id', existingOrd.restaurant_id);

    if (updateErr && (updateErr.code === '42703' || updateErr.message?.includes('column'))) {
      console.warn("Retrying offline payments update with core schema fields...");
      const retry1 = await supabase.from('orders').update({
        payment_status: newPaymentStatus,
        cash_amount: newCashTotal,
        cash_due: newCashDue,
        order_status: newOrderStatus,
        updated_at: confirmedAtIso
      }).eq('id', orderId).eq('restaurant_id', existingOrd.restaurant_id);
      updateErr = retry1.error;
    }

    if (updateErr) {
      console.error("recordOfflinePayment update error:", updateErr);
      showToast(`Failed to record offline payment: ${updateErr.message || 'Database error'}`, 'error');
      return false;
    }

    // Insert payment transactions for each recorded entry
    for (const p of validPayments) {
      const txPayload = {
        id: crypto.randomUUID(),
        restaurant_id: existingOrd.restaurant_id,
        order_id: existingOrd.id,
        table_number: existingOrd.table_number,
        order_number: existingOrd.order_number,
        payment_method: p.method === 'cash' ? 'cash' : (p.method === 'upi' || p.method === 'qr' ? 'upi_qr' : p.method),
        amount: Number(p.amount),
        transaction_id: p.reference ? `OFFLINE_${p.method.toUpperCase()}_${p.reference}` : `OFFLINE_${p.method.toUpperCase()}_${Date.now()}`,
        status: newPaymentStatus === 'paid_cash' || newPaymentStatus === 'paid' ? 'paid' : 'partially_paid',
        actor_id: actorId,
        actor_type: type,
        actor_name: `${actor} (${type})`,
        created_at: confirmedAtIso
      };

      try {
        await supabase.from('payment_transactions').insert([txPayload]);
      } catch (err) {
        console.warn("payment_transactions insert notice:", err);
      }
    }

    // Credit Hotel Wallet
    await creditHotelWallet(existingOrd.restaurant_id, existingOrd.id, totalNewAmount, 'cash');

    const breakdownText = validPayments.map(p => `${p.method.toUpperCase()}: ₹${p.amount}${p.reference ? ` (Ref: ${p.reference})` : ''}`).join(', ');

    logAudit({
      restaurant_id: existingOrd.restaurant_id,
      order_id: existingOrd.id,
      actor_type: type,
      actor_id: actorId,
      actor_name: actor,
      action: 'OFFLINE_PAYMENT_COLLECTED',
      previous_status: existingOrd.payment_status,
      new_status: newPaymentStatus,
      description: `Recorded offline payment of ₹${totalNewAmount} [${breakdownText}] by ${actor} (${type}). Remaining due: ₹${newCashDue}. Order ${existingOrd.order_number} Table ${existingOrd.table_number}.`
    });

    await fetchAllFromSupabase();
    playNotificationSound('new_order');
    if (newPaymentStatus === 'paid_cash' || newPaymentStatus === 'paid') {
      showToast(`✅ Payment of ₹${totalNewAmount} recorded by ${actor}! Order ${existingOrd.order_number} is fully PAID.`, 'success');
    } else {
      showToast(`📝 Payment of ₹${totalNewAmount} recorded. Remaining balance: ₹${newCashDue}.`, 'info');
    }
    return true;
  };

  const processRazorpayOnlinePayment = async (
    orderId: string,
    onlineAmountToPay: number,
    razorpayResponse: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string },
    customerMobile?: string
  ): Promise<boolean> => {
    const existingOrd = orders.find(o => o.id === orderId);
    if (!existingOrd) {
      showToast("Order not found for online payment.", "error");
      return false;
    }

    const rest = restaurants.find(r => r.id === existingOrd.restaurant_id);

    try {
      const verifyRes = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature,
          razorpay_secret: rest?.razorpay_secret
        })
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.verified) {
        showToast("Razorpay payment verification failed: " + (verifyData.error || "Invalid signature"), "error");
        return false;
      }

      const grandTotal = existingOrd.grand_total;
      const prevOnlineAmt = Number(existingOrd.online_amount || 0);
      const newOnlineTotal = Number((prevOnlineAmt + onlineAmountToPay).toFixed(2));
      const cashAmt = Number(existingOrd.cash_amount || 0);
      const totalPaid = Number((newOnlineTotal + cashAmt).toFixed(2));
      const newCashDue = Math.max(0, Number((grandTotal - totalPaid).toFixed(2)));

      let newPaymentStatus: any = 'pending';
      let newOrderStatus: any = existingOrd.order_status;

      if (totalPaid >= grandTotal) {
        newPaymentStatus = 'paid_live';
        newOrderStatus = existingOrd.order_status === 'pending' ? 'accepted' : existingOrd.order_status;
      } else if (totalPaid > 0) {
        newPaymentStatus = 'partially_paid';
      }

      const confirmedAtIso = new Date().toISOString();

      const updatePayload = {
        online_amount: newOnlineTotal,
        cash_due: newCashDue,
        payment_status: newPaymentStatus,
        order_status: newOrderStatus,
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature,
        payment_actor_id: customerMobile || 'online_gateway',
        payment_actor_type: 'customer',
        payment_actor_name: 'Online Payment (Razorpay)',
        payment_confirmed_at: confirmedAtIso,
        updated_at: confirmedAtIso
      };

      let { error: updateErr } = await supabase.from('orders').update(updatePayload).eq('id', orderId).eq('restaurant_id', existingOrd.restaurant_id);
      if (updateErr && (updateErr.code === '42703' || updateErr.message?.includes('column'))) {
        const retry1 = await supabase.from('orders').update({
          payment_status: newPaymentStatus,
          online_amount: newOnlineTotal,
          cash_due: newCashDue,
          order_status: newOrderStatus,
          updated_at: confirmedAtIso
        }).eq('id', orderId).eq('restaurant_id', existingOrd.restaurant_id);
        updateErr = retry1.error;
      }

      if (updateErr) {
        console.error("Razorpay order status update error:", updateErr);
        showToast("Database update error: " + updateErr.message, "error");
        return false;
      }

      const updatedOrderObj = { ...existingOrd, ...updatePayload };
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrderObj : o));

      // Persist to server API store & broadcast
      try {
        await fetch('/api/orders/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedOrderObj)
        });
      } catch (err) {
        console.warn("Could not save order to server API:", err);
      }

      // Clear any pending payment waiter calls for this table
      try {
        await supabase
          .from('call_waiter_requests')
          .update({ status: 'completed', completed_at: confirmedAtIso })
          .eq('restaurant_id', existingOrd.restaurant_id)
          .eq('table_number', existingOrd.table_number)
          .in('request_type', ['payment', 'bill', 'Bill / Payment'])
          .eq('status', 'pending');
      } catch (e) {
        // ignore
      }

      // SELECT Verification
      const { data: dbCheck, error: selectErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('restaurant_id', existingOrd.restaurant_id)
        .maybeSingle();

      // Credit Hotel Wallet (Idempotency built-in)
      if (newPaymentStatus === 'paid_live' || newPaymentStatus === 'paid') {
        await creditHotelWallet(existingOrd.restaurant_id, existingOrd.id, onlineAmountToPay || grandTotal, 'online');
      }

      const txPayload = {
        id: crypto.randomUUID(),
        restaurant_id: existingOrd.restaurant_id,
        order_id: existingOrd.id,
        table_number: existingOrd.table_number,
        order_number: existingOrd.order_number,
        payment_method: 'online',
        amount: onlineAmountToPay,
        transaction_id: razorpayResponse.razorpay_payment_id,
        status: 'paid',
        actor_id: customerMobile || 'customer',
        actor_type: 'customer',
        actor_name: 'Online Payment (Razorpay)',
        created_at: confirmedAtIso
      };

      try {
        await supabase.from('payment_transactions').insert([txPayload]);
      } catch (err) {
        console.warn("payment_transactions insert warning:", err);
      }

      try {
        await fetch('/api/transactions/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(txPayload)
        });
      } catch (err) {
        console.warn("Could not record transaction to server API:", err);
      }

      logAudit({
        restaurant_id: existingOrd.restaurant_id,
        order_id: existingOrd.id,
        actor_type: 'customer',
        actor_name: 'Customer (Razorpay)',
        action: 'RAZORPAY_PAYMENT_VERIFIED',
        previous_status: existingOrd.payment_status,
        new_status: newPaymentStatus,
        description: `Razorpay payment ₹${onlineAmountToPay} verified for Order ${existingOrd.order_number} (Payment ID: ${razorpayResponse.razorpay_payment_id})`
      });

      await fetchAllFromSupabase();
      playNotificationSound('new_order');
      showToast(`Online payment ₹${onlineAmountToPay} verified via Razorpay!`, 'success');
      return true;
    } catch (err: any) {
      console.error("Razorpay verification error:", err);
      showToast("Server connection error during payment verification.", "error");
      return false;
    }
  };

  const processPayUOnlinePayment = async (
    orderId: string,
    onlineAmountToPay: number,
    payuResponse: { txnid: string; mihpayid?: string; hash?: string; status?: string; udf1?: string; udf2?: string },
    customerMobile?: string
  ): Promise<boolean> => {
    const existingOrd = orders.find(o => o.id === orderId);
    if (!existingOrd) {
      showToast("Order not found for online payment.", "error");
      return false;
    }

    const rest = restaurants.find(r => r.id === existingOrd.restaurant_id);

    try {
      const verifyRes = await fetch('/api/payu/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txnid: payuResponse.txnid,
          mihpayid: payuResponse.mihpayid,
          amount: onlineAmountToPay,
          status: payuResponse.status || 'success',
          hash: payuResponse.hash,
          payu_key: rest?.payu_merchant_key,
          payu_salt: rest?.payu_merchant_salt,
          env: rest?.payu_env || 'TEST',
          mode: rest?.payment_mode || 'demo'
        })
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.verified) {
        showToast("PayU payment verification failed: " + (verifyData.error || "Invalid response signature"), "error");
        return false;
      }

      const grandTotal = existingOrd.grand_total;
      const prevOnlineAmt = Number(existingOrd.online_amount || 0);
      const newOnlineTotal = Number((prevOnlineAmt + onlineAmountToPay).toFixed(2));
      const cashAmt = Number(existingOrd.cash_amount || 0);
      const totalPaid = Number((newOnlineTotal + cashAmt).toFixed(2));
      const newCashDue = Math.max(0, Number((grandTotal - totalPaid).toFixed(2)));

      let newPaymentStatus: any = 'pending';
      let newOrderStatus: any = existingOrd.order_status;

      if (totalPaid >= grandTotal) {
        newPaymentStatus = 'paid_live';
        newOrderStatus = existingOrd.order_status === 'pending' ? 'accepted' : existingOrd.order_status;
      } else if (totalPaid > 0) {
        newPaymentStatus = 'partially_paid';
      }

      const confirmedAtIso = new Date().toISOString();

      const updatePayload = {
        online_amount: newOnlineTotal,
        cash_due: newCashDue,
        payment_status: newPaymentStatus,
        order_status: newOrderStatus,
        payu_txnid: payuResponse.txnid,
        payu_mihpayid: verifyData.mihpayid || payuResponse.mihpayid,
        payu_hash: payuResponse.hash,
        payment_actor_id: customerMobile || 'payu_gateway',
        payment_actor_type: 'customer',
        payment_actor_name: 'Online Payment (PayU)',
        payment_confirmed_at: confirmedAtIso,
        updated_at: confirmedAtIso
      };

      let { error: updateErr } = await supabase.from('orders').update(updatePayload).eq('id', orderId).eq('restaurant_id', existingOrd.restaurant_id);
      if (updateErr && (updateErr.code === '42703' || updateErr.message?.includes('column'))) {
        const retry1 = await supabase.from('orders').update({
          payment_status: newPaymentStatus,
          online_amount: newOnlineTotal,
          cash_due: newCashDue,
          order_status: newOrderStatus,
          updated_at: confirmedAtIso
        }).eq('id', orderId).eq('restaurant_id', existingOrd.restaurant_id);
        updateErr = retry1.error;
      }

      const updatedOrderObj = { ...existingOrd, ...updatePayload };
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrderObj : o));

      // Clear any pending payment waiter calls for this table
      try {
        await supabase
          .from('call_waiter_requests')
          .update({ status: 'completed', completed_at: confirmedAtIso })
          .eq('restaurant_id', existingOrd.restaurant_id)
          .eq('table_number', existingOrd.table_number)
          .in('request_type', ['payment', 'bill', 'Bill / Payment'])
          .eq('status', 'pending');
      } catch (e) {
        // ignore
      }

      // Persist to server API store
      try {
        await fetch('/api/orders/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedOrderObj)
        });
      } catch (err) {
        console.warn("Could not save order to server API:", err);
      }

      // Credit Hotel Wallet
      await creditHotelWallet(existingOrd.restaurant_id, existingOrd.id, onlineAmountToPay || grandTotal, 'online');

      const txPayload = {
        id: crypto.randomUUID(),
        restaurant_id: existingOrd.restaurant_id,
        order_id: existingOrd.id,
        table_number: existingOrd.table_number,
        order_number: existingOrd.order_number,
        payment_method: 'online',
        amount: onlineAmountToPay,
        transaction_id: verifyData.mihpayid || payuResponse.txnid,
        status: 'paid',
        actor_id: customerMobile || 'customer',
        actor_type: 'customer',
        actor_name: 'Online Payment (PayU)',
        created_at: confirmedAtIso
      };

      try {
        await supabase.from('payment_transactions').insert([txPayload]);
      } catch (err) {
        console.warn("payment_transactions insert warning:", err);
      }

      try {
        await fetch('/api/transactions/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(txPayload)
        });
      } catch (err) {
        console.warn("Could not record transaction to server API:", err);
      }

      logAudit({
        restaurant_id: existingOrd.restaurant_id,
        order_id: existingOrd.id,
        actor_type: 'customer',
        actor_name: 'Customer (PayU)',
        action: 'PAYU_PAYMENT_VERIFIED',
        previous_status: existingOrd.payment_status,
        new_status: newPaymentStatus,
        description: `PayU payment ₹${onlineAmountToPay} verified for Order ${existingOrd.order_number} (Txn: ${payuResponse.txnid})`
      });

      await fetchAllFromSupabase();
      playNotificationSound('new_order');
      showToast(`Online payment ₹${onlineAmountToPay} verified via PayU!`, 'success');
      return true;
    } catch (err: any) {
      console.error("PayU verification error:", err);
      showToast("Server connection error during payment verification.", "error");
      return false;
    }
  };

  const processPhonePeOnlinePayment = async (
    orderId: string,
    onlineAmountToPay: number,
    phonePeResponse: { transactionId: string; mode?: string },
    customerMobile?: string
  ): Promise<boolean> => {
    const existingOrd = orders.find(o => o.id === orderId);
    if (!existingOrd) {
      showToast("Order not found for online payment.", "error");
      return false;
    }

    const rest = restaurants.find(r => r.id === existingOrd.restaurant_id);

    try {
      const verifyRes = await fetch('/api/phonepe/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: rest?.phonepe_merchant_id,
          merchant_transaction_id: phonePeResponse.transactionId,
          salt_key: rest?.phonepe_salt_key,
          salt_index: rest?.phonepe_salt_index,
          env: rest?.phonepe_env || 'SANDBOX',
          mode: rest?.payment_mode || 'demo'
        })
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.verified) {
        showToast("PhonePe payment verification failed: " + (verifyData.message || "Could not verify transaction"), "error");
        return false;
      }

      const grandTotal = existingOrd.grand_total;
      const prevOnlineAmt = Number(existingOrd.online_amount || 0);
      const newOnlineTotal = Number((prevOnlineAmt + onlineAmountToPay).toFixed(2));
      const cashAmt = Number(existingOrd.cash_amount || 0);
      const totalPaid = Number((newOnlineTotal + cashAmt).toFixed(2));
      const newCashDue = Math.max(0, Number((grandTotal - totalPaid).toFixed(2)));

      let newPaymentStatus: any = 'pending';
      let newOrderStatus: any = existingOrd.order_status;

      if (totalPaid >= grandTotal) {
        newPaymentStatus = 'paid_live';
        newOrderStatus = existingOrd.order_status === 'pending' ? 'accepted' : existingOrd.order_status;
      } else if (totalPaid > 0) {
        newPaymentStatus = 'partially_paid';
      }

      const confirmedAtIso = new Date().toISOString();

      const updatePayload = {
        online_amount: newOnlineTotal,
        cash_due: newCashDue,
        payment_status: newPaymentStatus,
        order_status: newOrderStatus,
        payment_actor_id: customerMobile || 'phonepe_gateway',
        payment_actor_type: 'customer',
        payment_actor_name: 'Online Payment (PhonePe)',
        payment_confirmed_at: confirmedAtIso,
        updated_at: confirmedAtIso
      };

      let { error: updateErr } = await supabase.from('orders').update(updatePayload).eq('id', orderId).eq('restaurant_id', existingOrd.restaurant_id);
      if (updateErr && (updateErr.code === '42703' || updateErr.message?.includes('column'))) {
        const retry1 = await supabase.from('orders').update({
          payment_status: newPaymentStatus,
          online_amount: newOnlineTotal,
          cash_due: newCashDue,
          order_status: newOrderStatus,
          updated_at: confirmedAtIso
        }).eq('id', orderId).eq('restaurant_id', existingOrd.restaurant_id);
        updateErr = retry1.error;
      }

      const updatedOrderObj = { ...existingOrd, ...updatePayload };
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrderObj : o));

      // Clear any pending payment waiter calls for this table
      try {
        await supabase
          .from('call_waiter_requests')
          .update({ status: 'completed', completed_at: confirmedAtIso })
          .eq('restaurant_id', existingOrd.restaurant_id)
          .eq('table_number', existingOrd.table_number)
          .in('request_type', ['payment', 'bill', 'Bill / Payment'])
          .eq('status', 'pending');
      } catch (e) {
        // ignore
      }

      // Persist to server API store
      try {
        await fetch('/api/orders/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedOrderObj)
        });
      } catch (err) {
        console.warn("Could not save order to server API:", err);
      }

      // Credit Hotel Wallet
      await creditHotelWallet(existingOrd.restaurant_id, existingOrd.id, onlineAmountToPay || grandTotal, 'online');

      const txPayload = {
        id: crypto.randomUUID(),
        restaurant_id: existingOrd.restaurant_id,
        order_id: existingOrd.id,
        table_number: existingOrd.table_number,
        order_number: existingOrd.order_number,
        payment_method: 'online',
        amount: onlineAmountToPay,
        transaction_id: phonePeResponse.transactionId,
        status: 'paid',
        actor_id: customerMobile || 'customer',
        actor_type: 'customer',
        actor_name: 'Online Payment (PhonePe)',
        confirmed_at: confirmedAtIso
      };

      try {
        await supabase.from('payment_transactions').insert([txPayload]);
      } catch (err) {
        console.warn("payment_transactions insert warning:", err);
      }

      logAudit({
        restaurant_id: existingOrd.restaurant_id,
        order_id: existingOrd.id,
        actor_type: 'customer',
        actor_name: 'Customer (PhonePe)',
        action: 'PHONEPE_PAYMENT_VERIFIED',
        previous_status: existingOrd.payment_status,
        new_status: newPaymentStatus,
        description: `PhonePe payment ₹${onlineAmountToPay} verified for Order ${existingOrd.order_number} (Txn: ${phonePeResponse.transactionId})`
      });

      await fetchAllFromSupabase();
      playNotificationSound('new_order');
      showToast(`Online payment ₹${onlineAmountToPay} verified via PhonePe!`, 'success');
      return true;
    } catch (err: any) {
      console.error("PhonePe verification error:", err);
      showToast("Server connection error during payment verification.", "error");
      return false;
    }
  };

  const updateOrderPaymentMethod = async (
    orderId: string,
    newMode: 'cash' | 'online' | 'partial' | 'upi_qr',
    partialOnlineAmount?: number
  ) => {
    const existingOrd = orders.find(o => o.id === orderId);
    if (!existingOrd) return;

    const grandTotal = existingOrd.grand_total;
    let online_amount = Number(existingOrd.online_amount || 0);
    let cash_amount = Number(existingOrd.cash_amount || 0);
    let cash_due = grandTotal;

    if (newMode === 'partial') {
      online_amount = partialOnlineAmount || Math.round(grandTotal / 2);
      cash_due = Number((grandTotal - online_amount - cash_amount).toFixed(2));
    } else if (newMode === 'online') {
      online_amount = grandTotal;
      cash_due = 0;
    } else if (newMode === 'upi_qr') {
      online_amount = 0;
      cash_due = grandTotal;
    } else {
      cash_due = Number((grandTotal - online_amount - cash_amount).toFixed(2));
    }

    const { error } = await supabase.from('orders').update({
      payment_mode: newMode,
      online_amount,
      cash_due: Math.max(0, cash_due),
      updated_at: new Date().toISOString()
    }).eq('id', orderId);

    if (!error) {
      await fetchAllFromSupabase();
      showToast(`Payment method updated to ${newMode.toUpperCase()}`, 'info');
    }
  };

  const acceptOrder = async (orderId: string, actorName?: string, actorType?: 'owner' | 'staff') => {
    const existingOrd = orders.find(o => o.id === orderId);
    const actor = actorName || (currentStaff ? currentStaff.name : (currentOwner ? currentOwner.owner_name : 'Staff'));
    const type = actorType || (currentStaff ? 'staff' : 'owner');

    const { error } = await supabase.from('orders').update({ order_status: 'accepted' }).eq('id', orderId);
    if (error) console.error("acceptOrder error:", error);

    if (existingOrd) {
      logAudit({
        restaurant_id: existingOrd.restaurant_id,
        order_id: existingOrd.id,
        actor_type: type,
        actor_name: actor,
        action: 'ORDER_ACCEPTED',
        previous_status: existingOrd.order_status,
        new_status: 'accepted',
        description: `Order ${existingOrd.order_number} accepted by ${actor}`
      });
    }
    await fetchAllFromSupabase();
    showToast(`Order ${existingOrd?.order_number || ''} accepted!`, 'success');
  };

  const startCookingOrder = async (orderId: string, actorName?: string, actorType?: 'owner' | 'staff') => {
    const existingOrd = orders.find(o => o.id === orderId);
    const actor = actorName || (currentStaff ? currentStaff.name : (currentOwner ? currentOwner.owner_name : 'Kitchen Staff'));
    const type = actorType || (currentStaff ? 'staff' : 'owner');

    const { error } = await supabase.from('orders').update({ order_status: 'cooking' }).eq('id', orderId);
    if (error) console.error("startCookingOrder error:", error);

    if (existingOrd) {
      logAudit({
        restaurant_id: existingOrd.restaurant_id,
        order_id: existingOrd.id,
        actor_type: type,
        actor_name: actor,
        action: 'ORDER_COOKING_STARTED',
        previous_status: existingOrd.order_status,
        new_status: 'cooking',
        description: `Started cooking Order ${existingOrd.order_number} by ${actor}`
      });
    }
    await fetchAllFromSupabase();
    showToast('Order marked Cooking in Progress.', 'info');
  };

  const markOrderReady = async (orderId: string, actorName?: string, actorType?: 'owner' | 'staff') => {
    const existingOrd = orders.find(o => o.id === orderId);
    const actor = actorName || (currentStaff ? currentStaff.name : (currentOwner ? currentOwner.owner_name : 'Kitchen Staff'));
    const type = actorType || (currentStaff ? 'staff' : 'owner');

    const { error } = await supabase.from('orders').update({ order_status: 'ready' }).eq('id', orderId);
    if (error) console.error("markOrderReady error:", error);

    if (existingOrd) {
      logAudit({
        restaurant_id: existingOrd.restaurant_id,
        order_id: existingOrd.id,
        actor_type: type,
        actor_name: actor,
        action: 'ORDER_READY',
        previous_status: existingOrd.order_status,
        new_status: 'ready',
        description: `Order ${existingOrd.order_number} marked ready to serve by ${actor}`
      });
    }
    await fetchAllFromSupabase();
    playNotificationSound('kitchen_ready');
    showToast('Order Ready to Serve! Waiters notified.', 'success');
  };

  const serveOrder = async (orderId: string, actorName?: string, actorType?: 'owner' | 'staff') => {
    const existingOrd = orders.find(o => o.id === orderId);
    const actor = actorName || (currentStaff ? currentStaff.name : (currentOwner ? currentOwner.owner_name : 'Waiter'));
    const type = actorType || (currentStaff ? 'staff' : 'owner');

    const { error } = await supabase.from('orders').update({ order_status: 'served' }).eq('id', orderId);
    if (error) console.error("serveOrder error:", error);

    if (existingOrd) {
      logAudit({
        restaurant_id: existingOrd.restaurant_id,
        order_id: existingOrd.id,
        actor_type: type,
        actor_name: actor,
        action: 'ORDER_SERVED',
        previous_status: existingOrd.order_status,
        new_status: 'served',
        description: `Order ${existingOrd.order_number} served to Table ${existingOrd.table_number} by ${actor}`
      });
    }
    await fetchAllFromSupabase();
    showToast('Order Served at table.', 'success');
  };

  const completeOrder = async (orderId: string, actorName?: string, actorType?: 'owner' | 'staff') => {
    const existingOrd = orders.find(o => o.id === orderId);
    const actor = actorName || (currentStaff ? currentStaff.name : (currentOwner ? currentOwner.owner_name : 'Manager'));
    const type = actorType || (currentStaff ? 'staff' : 'owner');

    const { error } = await supabase.from('orders').update({ order_status: 'completed' }).eq('id', orderId);
    if (error) console.error("completeOrder error:", error);

    if (existingOrd) {
      logAudit({
        restaurant_id: existingOrd.restaurant_id,
        order_id: existingOrd.id,
        actor_type: type,
        actor_name: actor,
        action: 'ORDER_COMPLETED',
        previous_status: existingOrd.order_status,
        new_status: 'completed',
        description: `Order ${existingOrd.order_number} marked completed by ${actor}`
      });
    }
    await fetchAllFromSupabase();
    showToast(`Order ${existingOrd?.order_number || ''} completed!`, 'success');
  };

  // --- CUSTOMER QR ACTIONS ---
  const getActiveTableSession = async (restaurantId: string, tableId: string): Promise<TableSession | null> => {
    // 1. Check in-memory active session
    const existing = tableSessions.find(s => s.restaurant_id === restaurantId && s.table_id === tableId && s.status === 'active');
    if (existing) {
      const pin = existing.join_pin || existing.friend_code || String(Math.abs(existing.id.split('-').reduce((acc: number, part: string) => acc + (parseInt(part, 16) || 0), 0)) % 9000 + 1000).padStart(4, '0');
      return { ...existing, join_pin: pin, friend_code: pin, members_count: Number(existing.members_count || 1) };
    }

    // 2. Query Supabase directly for active session
    try {
      const { data: dbSess, error: sessErr } = await supabase
        .from('table_sessions')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('table_id', tableId)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .maybeSingle();

      if (sessErr) {
        console.warn("Supabase active table_sessions query warning:", sessErr);
      }

      if (dbSess) {
        const pin = dbSess.join_pin || dbSess.friend_code || String(Math.abs(dbSess.id.split('-').reduce((acc: number, part: string) => acc + (parseInt(part, 16) || 0), 0)) % 9000 + 1000).padStart(4, '0');
        const mappedSess: TableSession = {
          id: dbSess.id,
          restaurant_id: dbSess.restaurant_id,
          table_id: dbSess.table_id,
          table_number: dbSess.table_number,
          customer_mobile: dbSess.customer_mobile || '',
          join_pin: pin,
          friend_code: pin,
          members_count: Number(dbSess.members_count || 1),
          status: 'active',
          started_at: dbSess.started_at
        };
        setTableSessions(prev => [mappedSess, ...prev.filter(p => p.id !== mappedSess.id)]);
        return mappedSess;
      }
    } catch (err) {
      console.warn("Table session fetch error:", err);
    }

    // Return null if NO active session exists on DB (no order placed yet)
    return null;
  };

  const getOrCreateTableSession = async (restaurantId: string, tableId: string, tableNumber: string, mobile?: string): Promise<TableSession> => {
    // Check if active session already exists first
    const active = await getActiveTableSession(restaurantId, tableId);
    if (active) return active;

    // Create brand new active session with persistent 4-digit PIN only when explicitly requested
    const newId = crypto.randomUUID();
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const newSess: TableSession = {
      id: newId,
      restaurant_id: restaurantId,
      table_id: tableId,
      table_number: tableNumber,
      customer_mobile: mobile || '',
      join_pin: pin,
      friend_code: pin,
      members_count: 1,
      status: 'active',
      started_at: new Date().toISOString()
    };

    setTableSessions(prev => [newSess, ...prev.filter(p => p.id !== newSess.id)]);

    // Update table status to occupied
    await supabase.from('tables').update({ status: 'occupied' }).eq('id', tableId);

    // Insert into Supabase table_sessions
    const insertPayloadFull = {
      id: newSess.id,
      restaurant_id: restaurantId,
      table_id: tableId,
      table_number: tableNumber,
      customer_mobile: mobile || null,
      join_pin: pin,
      friend_code: pin,
      members_count: 1,
      status: 'active',
      started_at: newSess.started_at
    };

    let { error: insertErr } = await supabase.from('table_sessions').insert([insertPayloadFull]);
    if (insertErr && (insertErr.code === '42703' || insertErr.message?.includes('column'))) {
      const insertPayloadCore = {
        id: newSess.id,
        restaurant_id: restaurantId,
        table_id: tableId,
        table_number: tableNumber,
        customer_mobile: mobile || null,
        status: 'active',
        started_at: newSess.started_at
      };
      const retry = await supabase.from('table_sessions').insert([insertPayloadCore]);
      if (retry.error) {
        console.error("SUPABASE TABLE SESSION INSERT ERROR:", retry.error);
      }
    }

    return newSess;
  };

  const placeOrder = async (
    restaurantId: string,
    sessionId: string,
    tableId: string,
    tableNumber: string,
    items: { menu_id: string; menu_name: string; quantity: number; price: number; special_instructions?: string }[],
    paymentMode: 'cash' | 'demo' | 'online' | 'partial' | 'upi_qr',
    customerMobile?: string,
    partialDetails?: { online_amount: number; cash_amount: number },
    razorpayDetails?: { razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string },
    notes?: string,
    financialBreakdown?: {
      subtotal?: number;
      tax?: number;
      discount?: number;
      packaging_charge?: number;
      service_charge?: number;
      online_discount?: number;
      coupon_discount?: number;
      coupon_code?: string;
      grand_total?: number;
    }
  ): Promise<Order> => {
    // Validate inputs strictly
    if (!restaurantId) throw new Error("Missing restaurant ID.");
    if (!tableNumber) throw new Error("Missing table number.");
    if (!items || items.length === 0) throw new Error("Cart is empty.");

    const orderId = crypto.randomUUID();
    const rest = restaurants.find(r => r.id === restaurantId);
    const subtotal = financialBreakdown?.subtotal ?? items.reduce((acc, i) => acc + (i.price * i.quantity), 0);

    // Tax calculation
    let tax = 0;
    if (financialBreakdown?.tax !== undefined) {
      tax = financialBreakdown.tax;
    } else if (rest?.enable_gst || (rest?.gst_percentage && rest.gst_percentage > 0)) {
      tax = Number((subtotal * ((rest.gst_percentage || 5) / 100)).toFixed(2));
    }

    // Discount & Charges
    const discount = financialBreakdown?.discount ?? 0;
    const packaging_charge = financialBreakdown?.packaging_charge ?? 0;
    const service_charge = financialBreakdown?.service_charge ?? 0;
    const online_discount = financialBreakdown?.online_discount ?? 0;
    const coupon_discount = financialBreakdown?.coupon_discount ?? 0;
    const coupon_code = financialBreakdown?.coupon_code || null;

    const grand_total = financialBreakdown?.grand_total ?? Math.max(0, Number((subtotal + tax + packaging_charge + service_charge - discount).toFixed(2)));

    // Calculate restaurant-scoped sequential order number (#001, #002, ...)
    const restOrders = orders.filter(o => o.restaurant_id === restaurantId);
    const nextSeq = restOrders.length + 1;
    const orderNum = `#${String(nextSeq).padStart(3, '0')}`;

    const effectivePaymentMode = paymentMode === 'online' && rest?.payment_mode === 'demo' ? 'demo' : paymentMode;

    let paymentStatus: any = 'pending';
    let orderStatus: any = 'pending';
    let online_amount = 0;
    let cash_amount = 0;
    let cash_due = 0;

    const isRazorpayVerified = Boolean(razorpayDetails?.razorpay_payment_id && razorpayDetails?.razorpay_signature);

    if (effectivePaymentMode === 'demo') {
      paymentStatus = 'paid_demo';
      orderStatus = 'accepted';
      online_amount = grand_total;
      cash_due = 0;
    } else if (effectivePaymentMode === 'online') {
      if (isRazorpayVerified) {
        paymentStatus = 'paid_live';
        orderStatus = 'accepted';
        online_amount = grand_total;
        cash_due = 0;
      } else {
        paymentStatus = 'pending';
        orderStatus = 'pending';
        online_amount = 0;
        cash_due = grand_total;
      }
    } else if (effectivePaymentMode === 'partial') {
      const targetOnline = partialDetails?.online_amount || 0;
      if (isRazorpayVerified && targetOnline > 0) {
        paymentStatus = 'partially_paid';
        orderStatus = 'accepted';
        online_amount = targetOnline;
        cash_due = Number((grand_total - targetOnline).toFixed(2));
      } else {
        paymentStatus = 'pending';
        orderStatus = 'pending';
        online_amount = 0;
        cash_due = grand_total;
      }
    } else if (effectivePaymentMode === 'upi_qr') {
      paymentStatus = 'payment_verification_pending';
      orderStatus = 'pending';
      online_amount = 0;
      cash_due = grand_total;
    } else {
      // Cash payment
      paymentStatus = 'pending';
      orderStatus = 'pending';
      online_amount = 0;
      cash_amount = 0;
      cash_due = grand_total;
    }

    const createdIso = new Date().toISOString();

    const fullOrderPayload = {
      id: orderId,
      restaurant_id: restaurantId,
      session_id: sessionId || null,
      table_number: tableNumber,
      order_number: orderNum,
      payment_mode: effectivePaymentMode,
      payment_status: paymentStatus,
      order_status: orderStatus,
      subtotal,
      tax,
      discount,
      packaging_charge,
      service_charge,
      online_discount,
      coupon_discount,
      coupon_code,
      grand_total,
      online_amount,
      cash_amount,
      cash_due,
      notes: notes || null,
      upi_ref_number: (notes?.startsWith('UPI_REF:') ? notes.replace('UPI_REF:', '') : null),
      razorpay_order_id: razorpayDetails?.razorpay_order_id || null,
      razorpay_payment_id: razorpayDetails?.razorpay_payment_id || null,
      razorpay_signature: razorpayDetails?.razorpay_signature || null,
      customer_mobile: customerMobile || null,
      created_at: createdIso,
      updated_at: createdIso
    };

    const coreOrderPayload = {
      id: orderId,
      restaurant_id: restaurantId,
      session_id: sessionId || null,
      table_number: tableNumber,
      order_number: orderNum,
      payment_mode: effectivePaymentMode,
      payment_status: paymentStatus,
      order_status: orderStatus,
      subtotal,
      tax,
      discount: 0,
      grand_total,
      customer_mobile: customerMobile || null,
      created_at: createdIso,
      updated_at: createdIso
    };

    // Step 1: Real Supabase INSERT into public.orders
    let { error: ordErr } = await supabase.from('orders').insert([fullOrderPayload]);
    if (ordErr && (ordErr.code === '42703' || ordErr.message?.includes('column'))) {
      console.warn("Retrying orders insert with core schema fields due to missing table columns...");
      const retry = await supabase.from('orders').insert([coreOrderPayload]);
      ordErr = retry.error;
    }

    if (ordErr) {
      console.warn("Supabase orders insert warning:", ordErr);
    }

    // Step 2: Real Supabase INSERT into public.order_items
    const orderItemsToInsert = items.map(item => ({
      id: crypto.randomUUID(),
      order_id: orderId,
      menu_id: item.menu_id || null,
      menu_name: item.menu_name,
      quantity: item.quantity,
      price: item.price,
      special_instructions: item.special_instructions || null
    }));

    try {
      await supabase.from('order_items').insert(orderItemsToInsert);
    } catch (itemsErr) {
      console.warn("Supabase order_items insert warning:", itemsErr);
    }

    // Step 3: Update table status to 'occupied'
    if (tableId) {
      try {
        await supabase.from('tables').update({ status: 'occupied' }).eq('id', tableId);
      } catch (tErr) {
        console.warn("Table update warning:", tErr);
      }
    }

    // Persist order to server store
    try {
      await fetch('/api/orders/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fullOrderPayload, items: orderItemsToInsert })
      });
    } catch (srvErr) {
      console.warn("Server order save warning:", srvErr);
    }

    logAudit({
      restaurant_id: restaurantId,
      order_id: orderId,
      session_id: sessionId,
      actor_type: 'customer',
      actor_name: customerMobile ? `Customer (${customerMobile})` : 'Table Customer',
      action: 'ORDER_PLACED',
      new_status: orderStatus,
      description: `Placed Order ${orderNum} for Table ${tableNumber} (Total: ₹${grand_total}, Payment: ${effectivePaymentMode})`
    });

    if (paymentStatus === 'paid_demo') {
      await creditHotelWallet(restaurantId, orderId, grand_total, 'cash');
    } else if (paymentStatus === 'paid_live') {
      await creditHotelWallet(restaurantId, orderId, online_amount, 'online');
    }

    if (orderStatus === 'accepted') {
      playNotificationSound('new_order');
    }

    await fetchAllFromSupabase();

    const resultOrder: Order = {
      id: orderId,
      restaurant_id: restaurantId,
      session_id: sessionId,
      table_id: tableId,
      table_number: tableNumber,
      order_number: orderNum,
      payment_mode: effectivePaymentMode,
      payment_status: paymentStatus,
      order_status: orderStatus,
      subtotal,
      tax,
      discount,
      packaging_charge,
      service_charge,
      online_discount,
      coupon_discount,
      coupon_code: coupon_code || undefined,
      grand_total,
      online_amount,
      cash_amount,
      cash_due,
      customer_mobile: customerMobile || undefined,
      items: orderItemsToInsert.map(i => ({
        id: i.id,
        order_id: i.order_id,
        menu_id: i.menu_id || undefined,
        menu_name: i.menu_name,
        quantity: i.quantity,
        price: i.price,
        special_instructions: i.special_instructions || undefined
      })),
      created_at: createdIso,
      updated_at: createdIso
    };

    setOrders(prev => [resultOrder, ...prev.filter(o => o.id !== orderId)]);
    return resultOrder;
  };

  const sendCallWaiterRequest = async (
    restaurantId: string,
    sessionId: string,
    tableNumber: string,
    requestType: 'call' | 'water' | 'spoon' | 'tissue' | 'cleaning' | 'bill' | 'help'
  ) => {
    const req = {
      id: crypto.randomUUID(),
      restaurant_id: restaurantId,
      session_id: sessionId || null,
      table_number: tableNumber,
      request_type: requestType,
      status: 'pending'
    };
    const { error } = await supabase.from('call_waiter').insert([req]);
    if (error) console.error("Send call waiter error:", error);
    playNotificationSound('call_waiter');
    await fetchAllFromSupabase();
    showToast('Waiter call notification sent to staff!', 'success');
  };

  const submitCustomerFeedback = async (feedback: Omit<CustomerFeedback, 'id' | 'created_at'>) => {
    const newFb = {
      id: crypto.randomUUID(),
      restaurant_id: feedback.restaurant_id,
      order_id: feedback.order_id || null,
      table_number: feedback.table_number,
      food_rating: feedback.food_rating,
      service_rating: feedback.service_rating,
      cleanliness_rating: feedback.cleanliness_rating,
      overall_rating: feedback.overall_rating,
      comment: feedback.comment || ''
    };
    const { error } = await supabase.from('customer_feedback').insert([newFb]);
    if (error) console.error("Submit feedback error:", error);
    await fetchAllFromSupabase();
    showToast('Thank you for rating your dining experience!', 'success');
  };

  // Public Website Helpers
  const getWebsiteSettings = (restaurantId: string): RestaurantWebsiteSettings => {
    const found = websiteSettings.find(w => w.restaurant_id === restaurantId);
    if (found) return found;
    const rest = restaurants.find(r => r.id === restaurantId);
    return {
      id: crypto.randomUUID(),
      restaurant_id: restaurantId,
      about_us: rest?.about_us || '',
      description: rest?.short_description || '',
      opening_time: '10:00 AM',
      closing_time: '10:00 PM',
      weekly_closed_day: 'None',
      phone: rest?.owner_mobile || '',
      whatsapp: rest?.owner_mobile || '',
      email: rest?.contact_email || '',
      google_map_embed_url: rest?.maps_location_url || '',
      gallery_urls: [],
      seo_title: rest?.name || '',
      seo_description: rest?.short_description || '',
      seo_keywords: 'restaurant, fine dining, online menu',
      booking_info: '',
      website_url: ''
    };
  };

  const updateWebsiteSettings = async (restaurantId: string, updates: Partial<RestaurantWebsiteSettings>) => {
    if (updates.gallery_urls) {
      updates.gallery_urls = updates.gallery_urls.map(normalizeImageUrl);
    }
    const existing = getWebsiteSettings(restaurantId);
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
    setWebsiteSettings(prev => {
      const filtered = prev.filter(w => w.restaurant_id !== restaurantId);
      return [...filtered, updated];
    });
    try {
      await supabase.from('restaurant_website_settings').upsert([updated]);
    } catch (e) { console.warn(e); }
    showToast('Website Settings Saved!', 'success');
  };

  const getServices = (restaurantId: string): RestaurantServiceItem[] => {
    return restaurantServices.filter(s => s.restaurant_id === restaurantId);
  };

  const addService = async (restaurantId: string, service: Omit<RestaurantServiceItem, 'id' | 'restaurant_id'>) => {
    const newItem: RestaurantServiceItem = {
      ...service,
      id: crypto.randomUUID(),
      restaurant_id: restaurantId
    };
    setRestaurantServices(prev => [...prev, newItem]);
    try {
      await supabase.from('restaurant_services').insert([newItem]);
    } catch (e) { console.warn(e); }
    showToast('Service added!', 'success');
  };

  const updateService = async (serviceId: string, updates: Partial<RestaurantServiceItem>) => {
    setRestaurantServices(prev => prev.map(s => s.id === serviceId ? { ...s, ...updates } : s));
    try {
      await supabase.from('restaurant_services').update(updates).eq('id', serviceId);
    } catch (e) { console.warn(e); }
    showToast('Service updated!', 'success');
  };

  const deleteService = async (serviceId: string) => {
    setRestaurantServices(prev => prev.filter(s => s.id !== serviceId));
    try {
      await supabase.from('restaurant_services').delete().eq('id', serviceId);
    } catch (e) { console.warn(e); }
    showToast('Service removed!', 'info');
  };

  const getPricing = (restaurantId: string): RestaurantPricingItem[] => {
    return restaurantPricing.filter(p => p.restaurant_id === restaurantId);
  };

  const addPricingItem = async (restaurantId: string, item: Omit<RestaurantPricingItem, 'id' | 'restaurant_id'>) => {
    const newItem: RestaurantPricingItem = {
      ...item,
      id: crypto.randomUUID(),
      restaurant_id: restaurantId
    };
    setRestaurantPricing(prev => [...prev, newItem]);
    try {
      await supabase.from('restaurant_pricing').insert([newItem]);
    } catch (e) { console.warn(e); }
    showToast('Pricing item added!', 'success');
  };

  const updatePricingItem = async (itemId: string, updates: Partial<RestaurantPricingItem>) => {
    setRestaurantPricing(prev => prev.map(p => p.id === itemId ? { ...p, ...updates } : p));
    try {
      await supabase.from('restaurant_pricing').update(updates).eq('id', itemId);
    } catch (e) { console.warn(e); }
    showToast('Pricing item updated!', 'success');
  };

  const deletePricingItem = async (itemId: string) => {
    setRestaurantPricing(prev => prev.filter(p => p.id !== itemId));
    try {
      await supabase.from('restaurant_pricing').delete().eq('id', itemId);
    } catch (e) { console.warn(e); }
    showToast('Pricing item deleted!', 'info');
  };

  const getLegalPages = (restaurantId: string): RestaurantLegalPages => {
    const found = restaurantLegalPages.find(l => l.restaurant_id === restaurantId);
    if (found) return found;
    const rest = restaurants.find(r => r.id === restaurantId);
    return {
      id: crypto.randomUUID(),
      restaurant_id: restaurantId,
      privacy_policy: rest?.privacy_policy || 'Standard restaurant customer privacy policy.',
      terms_conditions: rest?.terms_conditions || 'Standard restaurant terms of dining service.',
      refund_policy: rest?.refund_cancellation_policy || 'Refunds processed as per manager approval.',
      cancellation_policy: 'Orders can be cancelled before preparation starts.',
      shipping_policy: rest?.shipping_delivery_policy || 'Doorstep delivery within 5km radius.',
      return_policy: 'Fresh food items are non-returnable once accepted.',
      grievance_contact: rest?.contact_us_info || 'For any queries, reach out to restaurant manager.',
      disclaimer: 'All prices subject to applicable government taxes.'
    };
  };

  const updateLegalPages = async (restaurantId: string, pages: Partial<RestaurantLegalPages>) => {
    const existing = getLegalPages(restaurantId);
    const updated = { ...existing, ...pages, updated_at: new Date().toISOString() };
    setRestaurantLegalPages(prev => {
      const filtered = prev.filter(l => l.restaurant_id !== restaurantId);
      return [...filtered, updated];
    });
    try {
      await supabase.from('restaurant_legal_pages').upsert([updated]);
    } catch (e) { console.warn(e); }
    showToast('Legal Pages Saved!', 'success');
  };

  const getSocialLinks = (restaurantId: string): RestaurantSocialLinks => {
    const found = restaurantSocialLinks.find(s => s.restaurant_id === restaurantId);
    if (found) return found;
    return {
      id: crypto.randomUUID(),
      restaurant_id: restaurantId,
      instagram: '',
      facebook: '',
      twitter: '',
      youtube: '',
      linkedin: '',
      google_business: ''
    };
  };

  const updateSocialLinks = async (restaurantId: string, links: Partial<RestaurantSocialLinks>) => {
    const existing = getSocialLinks(restaurantId);
    const updated = { ...existing, ...links, updated_at: new Date().toISOString() };
    setRestaurantSocialLinks(prev => {
      const filtered = prev.filter(s => s.restaurant_id !== restaurantId);
      return [...filtered, updated];
    });
    try {
      await supabase.from('restaurant_social_links').upsert([updated]);
    } catch (e) { console.warn(e); }
    showToast('Social Links Saved!', 'success');
  };

  return (
    <SaaSContext.Provider value={{
      activeView, setActiveView,
      activeSlug, setActiveSlug,
      activeShortCode, setActiveShortCode,
      language, setLanguage,
      toast, showToast,
      realtimeStatus, reconnectRealtime,
      notifications, unreadNotificationCount, markNotificationAsRead, clearAllNotifications,
      soundEnabled, setSoundEnabledState: setSoundEnabledCustom,
      notificationsEnabled, setNotificationsEnabledState: setNotificationsEnabledCustom,
      soundVolume, setSoundVolumeState: setSoundVolumeCustom,
      triggerRealtimeEventNotification,
      ceoAuthenticated, setCeoAuthenticated,
      currentOwner, setCurrentOwner,
      currentStaff, setCurrentStaff,
      restaurants, staffList, tables, tableSessions, categories, menuItems,
      orders, feedbackList, callRequests, activityLogs, auditLogs, logAudit,
      subscriptionHistory,
      paymentTransactions, confirmCashPayment, processRazorpayOnlinePayment, processPayUOnlinePayment, processPhonePeOnlinePayment, updateOrderPaymentMethod,
      loginCeo, logoutCeo, ceoRazorpayConfig, updateCeoRazorpayConfig, ceoPaymentConfig, updateCeoPaymentConfig,
      addRestaurant, updateRestaurant, suspendRestaurant,
      resumeRestaurant, grantTrial, endTrial, extendTrial, grantFreeOffer, endFreeOffer, extendFreeOffer, grantFreeExtension, renewSubscription, renewRestaurantMonthly, archiveRestaurant, deleteRestaurantPermanently,
      factoryResetRestaurant, executeProductionReset, loginOwner, logoutOwner, updateOwnerProfile,
      addCategory, updateCategory, addMenuItem, updateMenuItem, toggleMenuItemAvailability,
      addTable, clearTableSession, addStaffMember, toggleStaffStatus, deleteStaffMember, updateStaffPassword,
      loginStaff, logoutStaff, acceptCallRequest, completeCallRequest, verifyCashOrder, recordOfflinePayment,
      verifyUpiPayment, rejectUpiPayment, submitUpiPaymentConfirmation,
      acceptOrder, startCookingOrder, markOrderReady, serveOrder, completeOrder, placeOrder,
      sendCallWaiterRequest, submitCustomerFeedback, getActiveTableSession, getOrCreateTableSession,
      websiteSettings, restaurantServices, restaurantPricing, restaurantLegalPages, restaurantSocialLinks,
      getWebsiteSettings, updateWebsiteSettings, getServices, addService, updateService, deleteService,
      getPricing, addPricingItem, updatePricingItem, deletePricingItem, getLegalPages, updateLegalPages,
      getSocialLinks, updateSocialLinks
    }}>
      {children}
    </SaaSContext.Provider>
  );
};

export const useSaaS = () => {
  const context = useContext(SaaSContext);
  if (!context) throw new Error('useSaaS must be used within SaaSProvider');
  return context;
};
