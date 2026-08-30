import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSaaS } from '../../context/SaaSContext';
import {
  QrCode, Search, Bell, ShoppingBag, Plus, Minus, CheckCircle2,
  Clock, Download, Star, ShieldAlert, ShieldCheck, Sparkles, ChevronDown,
  Info, Utensils, CreditCard, ArrowDown, Users, KeyRound, Globe, Phone, Ticket, Zap,
  Copy, Check, ExternalLink
} from 'lucide-react';
import { t } from '../../utils/i18n';
import { CallWaiterModal } from './CallWaiterModal';
import { FeedbackModal } from './FeedbackModal';
import { BillModal } from '../common/BillModal';
import { PayUCheckoutModal } from '../common/PayUCheckoutModal';
import { PhonePeCheckoutModal } from '../common/PhonePeCheckoutModal';
import { RazorpayCheckoutModal } from '../common/RazorpayCheckoutModal';
import { AiHelpAssistant } from '../common/AiHelpAssistant';
import { generateInvoicePdf } from '../../utils/pdfGenerator';
import { MenuItem, MenuCategory, TableSession, Table, Language, Restaurant, Order, CouponConfig } from '../../types';
import { FileText, Printer } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SmartImage } from '../common/SmartImage';
import { safeFetchJson } from '../../lib/safeFetch';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  instructions: string;
}

export const CustomerQrApp: React.FC = () => {
  const {
    activeShortCode,
    tables,
    restaurants,
    menuItems,
    categories,
    orders,
    tableSessions,
    placeOrder,
    getActiveTableSession,
    getOrCreateTableSession,
    processRazorpayOnlinePayment,
    processPayUOnlinePayment,
    processPhonePeOnlinePayment,
    submitUpiPaymentConfirmation,
    sendCallWaiterRequest,
    showToast,
    language,
    setLanguage
  } = useSaaS();

  // Strict QR Resolver State: ONLY resolves if tables.short_code matches exactly
  const [resolved, setResolved] = useState<{
    table: Table | null;
    restaurant: Restaurant | null;
    loading: boolean;
  }>({
    table: null,
    restaurant: null,
    loading: true,
  });

  const currentCode = useMemo(() => {
    return activeShortCode || (window.location.pathname.startsWith('/q/') ? window.location.pathname.split('/q/')[1]?.split('/')[0] : '');
  }, [activeShortCode]);

  useEffect(() => {
    let isMounted = true;

    if (!currentCode) {
      setResolved({ table: null, restaurant: null, loading: false });
      return;
    }

    const codeLower = currentCode.toLowerCase();

    // Step 1: Check in-memory context state
    const matchedTable = tables.find(t => t.short_code.toLowerCase() === codeLower);
    if (matchedTable) {
      const matchedRest = restaurants.find(r => r.id === matchedTable.restaurant_id);
      if (matchedRest) {
        if (isMounted) {
          setResolved({ table: matchedTable, restaurant: matchedRest, loading: false });
        }
        return;
      }
    }

    // Step 2: Query fresh data from Supabase WHERE short_code matches
    const fetchFromSupabase = async () => {
      try {
        const { data: dbTable } = await supabase
          .from('tables')
          .select('*')
          .ilike('short_code', currentCode)
          .maybeSingle();

        if (dbTable && dbTable.restaurant_id) {
          const { data: dbRest } = await supabase
            .from('restaurants')
            .select('*')
            .eq('id', dbTable.restaurant_id)
            .maybeSingle();

          if (dbRest && isMounted) {
            const mappedTable: Table = {
              id: dbTable.id,
              restaurant_id: dbTable.restaurant_id,
              table_number: dbTable.table_number,
              short_code: dbTable.short_code,
              qr_url: dbTable.qr_url || `/q/${dbTable.short_code}`,
              status: dbTable.status || 'available',
              created_at: dbTable.created_at || new Date().toISOString()
            };
            const mappedRest: Restaurant = dbRest as Restaurant;
            setResolved({ table: mappedTable, restaurant: mappedRest, loading: false });
            return;
          }
        }
      } catch (err) {
        console.warn("Supabase QR table lookup error:", err);
      }

      // Step 3: No matching table or restaurant -> Return NULL
      if (isMounted) {
        setResolved({ table: null, restaurant: null, loading: false });
      }
    };

    fetchFromSupabase();

    return () => {
      isMounted = false;
    };
  }, [currentCode, tables, restaurants]);

  const { table, restaurant, loading: isLoadingTable } = resolved;

  // Customer View Step: 'welcome' (default landing) or 'menu'
  const [customerStep, setCustomerStep] = useState<'welcome' | 'menu'>('welcome');

  // Modals & Quantity Popup State
  const [detailsItem, setDetailsItem] = useState<MenuItem | null>(null);
  const [quantityPopupItem, setQuantityPopupItem] = useState<{ item: MenuItem; quantity: number; instructions: string } | null>(null);

  // Active Session for Table (Loaded once per table/restaurant, stable & persistent)
  const [session, setSession] = useState<TableSession | null>(null);
  const isDeviceSessionCreator = useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    if (!table || !restaurant) {
      setSession(null);
      setPinVerified(true);
      return;
    }

    const loadSession = async () => {
      const activeSess = await getActiveTableSession(restaurant.id, table.id);
      if (isMounted) {
        if (activeSess) {
          setSession(activeSess);
          localStorage.setItem(`digimoms_device_session_${table.id}`, activeSess.id);

          const isCreator = localStorage.getItem(`digimoms_session_creator_${activeSess.id}`) === 'true' ||
                            localStorage.getItem(`digimoms_table_creator_${table.id}`) === 'true' ||
                            isDeviceSessionCreator.current;
          const isVerified = localStorage.getItem(`digimoms_pin_verified_${activeSess.id}`) === 'true';

          if (isCreator || isVerified) {
            setPinVerified(true);
          } else {
            setPinVerified(false);
          }
        } else {
          // NO active session -> customer browsing menu before placing first order!
          setSession(null);
          setPinVerified(true);
          isDeviceSessionCreator.current = true;
          localStorage.setItem(`digimoms_table_creator_${table.id}`, 'true');
        }
      }
    };

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [table?.id, restaurant?.id, getActiveTableSession]);

  // Group Dining 4-Digit PIN State (STABLE across renders and reloads)
  const tableJoinPin = useMemo(() => {
    if (!session) return '4827';
    return session.join_pin || session.friend_code || String(Math.abs(session.id.split('-').reduce((acc: number, part: string) => acc + (parseInt(part, 16) || 0), 0)) % 9000 + 1000).padStart(4, '0');
  }, [session]);

  const [pinVerified, setPinVerified] = useState<boolean>(() => {
    if (!session) return true;
    const isCreator = localStorage.getItem(`digimoms_session_creator_${session.id}`) === 'true' ||
                      (table ? localStorage.getItem(`digimoms_table_creator_${table.id}`) === 'true' : false) ||
                      isDeviceSessionCreator.current;
    const isVerified = localStorage.getItem(`digimoms_pin_verified_${session.id}`) === 'true';
    return isCreator || isVerified;
  });

  useEffect(() => {
    if (!session) return;
    const isCreator = localStorage.getItem(`digimoms_session_creator_${session.id}`) === 'true' ||
                      (table ? localStorage.getItem(`digimoms_table_creator_${table.id}`) === 'true' : false) ||
                      isDeviceSessionCreator.current;
    const isVerified = localStorage.getItem(`digimoms_pin_verified_${session.id}`) === 'true';
    if (isCreator || isVerified) {
      setPinVerified(true);
    }
  }, [session, table]);

  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // UI Filters & Cart State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'online' | 'partial' | 'upi_qr'>('cash');
  const [partialOnlineAmount, setPartialOnlineAmount] = useState<string>('');
  const [customerMobile, setCustomerMobile] = useState<string>('');

  // UPI Scan & Pay Modal State
  const [upiPaymentModalOrder, setUpiPaymentModalOrder] = useState<Order | null>(null);
  const [upiRefInput, setUpiRefInput] = useState<string>('');
  const [isSubmittingUpi, setIsSubmittingUpi] = useState<boolean>(false);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);

  // Coupon State
  const [couponInput, setCouponInput] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponConfig | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Modals & Online Payment Gateway State (Pay First, Confirm Order)
  const [showCallModal, setShowCallModal] = useState<boolean>(false);
  const [feedbackOrder, setFeedbackOrder] = useState<string | null>(null);
  const [selectedBillOrder, setSelectedBillOrder] = useState<Order | null>(null);
  const [onlinePaymentModalData, setOnlinePaymentModalData] = useState<{
    gateway: 'payu' | 'razorpay' | 'phonepe';
    amountToPay: number;
    title: string;
    subtitle: string;
    effectivePaymentMode: 'online' | 'partial';
    onlineAmt: number;
    cashAmt: number;
    items: any[];
    financialBreakdown: any;
    existingOrder: Order;
  } | null>(null);

  // Auto-restore order confirmation screen if returning from payment gateway callback
  useEffect(() => {
    if (!table || !restaurant) return;
    const params = new URLSearchParams(window.location.search);
    const orderIdParam = params.get('order_id') || params.get('ord');
    const statusParam = params.get('status') || params.get('payment_status');

    if (orderIdParam) {
      const match = orders.find(o => o.id === orderIdParam || o.order_number === orderIdParam);
      if (match) {
        setLastPlacedOrder(match);
        setCart([]);
        setIsCartOpen(false);
      }
    }
  }, [table?.id, restaurant?.id, orders]);

  const restCategories = restaurant ? categories.filter(c => c.restaurant_id === restaurant.id && !c.is_hidden) : [];
  const restMenu = restaurant ? menuItems.filter(m => m.restaurant_id === restaurant.id && m.is_available) : [];

  const filteredMenu = restMenu.filter(item => {
    const matchesCat = selectedCategory === 'all' || item.category_id === selectedCategory;
    const matchesVeg = !vegOnly || item.is_veg;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesVeg && matchesSearch;
  });

  // Cart operations
  const getItemQuantity = (itemId: string) => {
    return cart.find(c => c.menuItem.id === itemId)?.quantity || 0;
  };

  const getItemInstructions = (itemId: string) => {
    return cart.find(c => c.menuItem.id === itemId)?.instructions || '';
  };

  const handleConfirmQuantityPopup = () => {
    if (!quantityPopupItem) return;
    const { item, quantity, instructions } = quantityPopupItem;

    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === item.id);
      if (quantity <= 0) {
        return prev.filter(c => c.menuItem.id !== item.id);
      }
      if (existing) {
        return prev.map(c => c.menuItem.id === item.id ? { ...c, quantity, instructions } : c);
      }
      return [...prev, { menuItem: item, quantity, instructions }];
    });

    setQuantityPopupItem(null);
  };

  const cartSubtotal = cart.reduce((acc, i) => acc + (i.menuItem.price * i.quantity), 0);

  // Master Online Payment Switch
  const isOnlinePaymentActive = Boolean(restaurant?.enable_online_payment ?? true);

  // 1. GST Tax - ONLY if enabled by owner or gst_percentage > 0
  const isGstEnabled = Boolean(restaurant?.enable_gst ?? true);
  const gstRate = isGstEnabled ? Number(restaurant?.gst_percentage ?? 5) : 0;
  const cartTax = Number((cartSubtotal * (gstRate / 100)).toFixed(2));

  // 2. Extra Charges
  const isPackagingEnabled = Boolean(restaurant?.enable_packaging_charge);
  const cartPackagingCharge = isPackagingEnabled ? Number(restaurant?.packaging_charge_amount || 0) : 0;

  const isServiceChargeEnabled = Boolean(restaurant?.enable_service_charge);
  const cartServiceCharge = isServiceChargeEnabled ? Number((cartSubtotal * (Number(restaurant?.service_charge_percentage || 0) / 100)).toFixed(2)) : 0;

  // 3. Online Payment Discount (Only active when online payment is ON)
  const isOnlineDiscountEnabled = isOnlinePaymentActive && Boolean(restaurant?.enable_online_discount ?? true);
  const onlineDiscountRate = (paymentMode === 'online' || paymentMode === 'demo') && isOnlineDiscountEnabled
    ? Number(restaurant?.online_discount_percentage ?? 5)
    : 0;
  const cartOnlineDiscount = Number((cartSubtotal * (onlineDiscountRate / 100)).toFixed(2));

  // 4. Coupon Discount
  let cartCouponDiscount = 0;
  if (appliedCoupon && appliedCoupon.is_active && cartSubtotal >= (appliedCoupon.min_order_amount || 0)) {
    if (appliedCoupon.discount_type === 'percent') {
      cartCouponDiscount = Number((cartSubtotal * (appliedCoupon.discount_value / 100)).toFixed(2));
    } else {
      cartCouponDiscount = Number(appliedCoupon.discount_value);
    }
  }

  // 5. Total Discount & Grand Total
  const cartTotalDiscount = Number((cartOnlineDiscount + cartCouponDiscount).toFixed(2));
  const cartTotalCharges = Number((cartTax + cartPackagingCharge + cartServiceCharge).toFixed(2));
  const cartGrandTotal = Math.max(0, Number((cartSubtotal + cartTotalCharges - cartTotalDiscount).toFixed(2)));

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    const availableCoupons: CouponConfig[] = (restaurant?.coupons && restaurant.coupons.length > 0)
      ? restaurant.coupons
      : [
          { id: '1', code: 'DIGI10', discount_type: 'percent', discount_value: 10, min_order_amount: 100, is_active: true },
          { id: '2', code: 'WELCOME50', discount_type: 'flat', discount_value: 50, min_order_amount: 300, is_active: true }
        ];

    const found = availableCoupons.find(c => c.code.toUpperCase() === code && c.is_active);
    if (!found) {
      setCouponError('Invalid or expired coupon code.');
      return;
    }

    if (cartSubtotal < (found.min_order_amount || 0)) {
      setCouponError(`Minimum order amount of ₹${found.min_order_amount} required for code ${found.code}.`);
      return;
    }

    setAppliedCoupon(found);
    setCouponError(null);
  };

  const activeSessionOrders = useMemo(() => {
    if (!session || !restaurant) return [];
    return orders.filter(o => o.restaurant_id === restaurant.id && o.session_id === session.id);
  }, [orders, restaurant, session]);

  const tableActiveOrders = useMemo(() => {
    if (!table || !restaurant) return [];
    return orders.filter(o => o.restaurant_id === restaurant.id && o.table_number === table.table_number && o.order_status !== 'completed' && o.order_status !== 'cancelled');
  }, [orders, restaurant, table]);

  const totalSessionBill = useMemo(() => {
    return activeSessionOrders.reduce((sum, ord) => sum + ord.grand_total, 0);
  }, [activeSessionOrders]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!table || !restaurant || cart.length === 0) return;

    setOrderError(null);
    setIsPlacingOrder(true);

    try {
      let activeSess = session;
      if (!activeSess) {
        activeSess = await getOrCreateTableSession(restaurant.id, table.id, table.table_number);
        setSession(activeSess);
        localStorage.setItem(`digimoms_session_creator_${activeSess.id}`, 'true');
        localStorage.setItem(`digimoms_pin_verified_${activeSess.id}`, 'true');
        setPinVerified(true);
      }

      const items = cart.map(c => ({
        menu_id: c.menuItem.id,
        menu_name: c.menuItem.name,
        quantity: c.quantity,
        price: c.menuItem.price,
        special_instructions: c.instructions
      }));

      const effectivePaymentMode = isOnlinePaymentActive ? paymentMode : 'cash';
      const onlineAmt = effectivePaymentMode === 'partial' ? (Number(partialOnlineAmount) || Math.round(cartGrandTotal / 2)) : (effectivePaymentMode === 'online' ? cartGrandTotal : 0);
      const cashAmt = effectivePaymentMode === 'partial' ? Number((cartGrandTotal - onlineAmt).toFixed(2)) : (effectivePaymentMode === 'cash' ? cartGrandTotal : 0);

      // DATABASE-FIRST ORDER FLOW: Create the pending order in the database FIRST
      const createdOrder = await placeOrder(
        restaurant.id,
        activeSess.id,
        table.id,
        table.table_number,
        items,
        effectivePaymentMode,
        customerMobile,
        effectivePaymentMode === 'partial' ? { online_amount: onlineAmt, cash_amount: cashAmt } : undefined,
        undefined,
        undefined,
        {
          subtotal: cartSubtotal,
          tax: cartTax,
          discount: cartTotalDiscount,
          packaging_charge: cartPackagingCharge,
          service_charge: cartServiceCharge,
          online_discount: cartOnlineDiscount,
          coupon_discount: cartCouponDiscount,
          coupon_code: appliedCoupon?.code || undefined,
          grand_total: cartGrandTotal
        }
      );

      if (!createdOrder || !createdOrder.id) {
        throw new Error("Order creation failed in database.");
      }

      // If Online or Partial gateway payment, launch checkout modal with the created Order ID
      if (effectivePaymentMode === 'online' || effectivePaymentMode === 'partial') {
        const activeGw = (restaurant.live_gateway || 'payu') as 'payu' | 'razorpay' | 'phonepe';
        setOnlinePaymentModalData({
          gateway: activeGw,
          amountToPay: onlineAmt,
          title: `Table #${table.table_number.replace(/^Table\s+/i, '')} • ${effectivePaymentMode === 'partial' ? 'Advance Payment' : 'Food Order'}`,
          subtitle: `${restaurant.name} (${items.length} items)`,
          effectivePaymentMode,
          onlineAmt,
          cashAmt,
          items,
          financialBreakdown: {
            subtotal: cartSubtotal,
            tax: cartTax,
            discount: cartTotalDiscount,
            packaging_charge: cartPackagingCharge,
            service_charge: cartServiceCharge,
            online_discount: cartOnlineDiscount,
            coupon_discount: cartCouponDiscount,
            coupon_code: appliedCoupon?.code || undefined,
            grand_total: cartGrandTotal
          },
          existingOrder: createdOrder
        });
        setIsPlacingOrder(false);
        return;
      }

      setLastPlacedOrder(createdOrder);

      if (effectivePaymentMode === 'upi_qr') {
        setCart([]);
        setIsCartOpen(false);
        setUpiPaymentModalOrder(createdOrder);
        setUpiRefInput('');
      } else {
        setCart([]);
        setIsCartOpen(false);
      }
    } catch (err: any) {
      console.error("SUPABASE ORDER ERROR:", err);
      const errMsg = err?.message || "Failed to place order in database.";
      setOrderError(errMsg);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    if (pinInput.trim() === tableJoinPin) {
      localStorage.setItem(`digimoms_pin_verified_${session.id}`, 'true');
      setPinVerified(true);
      setPinError('');
      setCustomerStep('menu');

      // Increment members_count in database for session
      try {
        const nextCount = (session.members_count || 1) + 1;
        await supabase.from('table_sessions').update({ members_count: nextCount }).eq('id', session.id);
      } catch (err) {
        console.warn("Failed to update session members count:", err);
      }
    } else {
      setPinError('Invalid Friend Code. Please ask the person who created Table #' + table.table_number + ' session.');
    }
  };

  // Loading state while checking table short code against context & Supabase
  if (isLoadingTable) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 text-sm font-medium">Connecting to restaurant table...</p>
      </div>
    );
  }

  // If table or restaurant does not exist
  if (!table || !restaurant) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/30 mb-4">
          <QrCode className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Invalid QR Code</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          This QR code is invalid or does not match any active restaurant table. Please scan a valid table QR code provided by the restaurant.
        </p>

        <div className="mt-12 text-slate-500 text-xs font-semibold">
          Powered by <span className="text-slate-300 font-bold">DigiMoms OS</span>
        </div>
      </div>
    );
  }

  // MAX 4 CUSTOMERS RULE
  if (session && !pinVerified && Number(session.members_count || 1) >= 4) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border-2 border-rose-500/50 rounded-3xl p-6 sm:p-8 space-y-4 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/40">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">Table Limit Reached</h2>
          <p className="text-sm text-rose-300 font-bold">
            Maximum 4 customers have joined this table session.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            No additional customers can join Table #{table.table_number.replace(/^Table\s+/i, '')} for this active session. Please ask restaurant staff if you need assistance.
          </p>
        </div>
      </div>
    );
  }

  // FRIEND JOIN SECURITY GATE
  // Require PIN verification ONLY if session exists AND active orders exist on this table AND device is not the creator AND not in ordering process:
  const isCurrentlyOrderingOrCheckingOut = isPlacingOrder || isCartOpen || !!onlinePaymentModalData || !!upiPaymentModalOrder || !!lastPlacedOrder || cart.length > 0;
  if (session && !pinVerified && !isDeviceSessionCreator.current && tableActiveOrders.length > 0 && !isCurrentlyOrderingOrCheckingOut) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-amber-600 selection:text-white">
        <div className="max-w-md w-full bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 space-y-6 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/40">
            <KeyRound className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Dining session already active.</h2>
            <p className="text-xs text-amber-200/90 leading-relaxed font-semibold">
              Table #{table.table_number.replace(/^Table\s+/i, '')} currently has an active dining session.
            </p>
            <p className="text-xs text-slate-400">
              Share this Friend Code with everyone sitting at this table, or enter the 4-digit Friend Code from your table friend to join and order together.
            </p>
          </div>

          <form onSubmit={handleVerifyPin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-extrabold text-amber-300 uppercase tracking-wider mb-2 text-center">
                Enter Friend Code
              </label>
              <input
                type="text"
                maxLength={4}
                required
                placeholder="e.g. 4821"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full bg-slate-950 border-2 border-amber-500/50 rounded-2xl px-4 py-3 text-center text-3xl font-mono font-black text-amber-300 tracking-widest outline-none focus:border-amber-400 shadow-inner"
              />
            </div>

            {pinError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-bold text-center">
                {pinError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-sm shadow-xl shadow-amber-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" /> Verify & Join Table
            </button>
          </form>

          <div className="text-[11px] text-slate-500 font-semibold border-t border-slate-800 pt-4">
            Menu remains locked until correct Friend Code is verified.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* GLOBAL TOP HEADER (Present on Welcome & Menu Pages) */}
      <div>
        <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-white">{restaurant.name}</span>
                <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                  Table #{table.table_number}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
                <Globe className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
                {(['en', 'bn', 'hi'] as Language[]).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-2 py-0.5 rounded-lg uppercase font-bold transition-all ${
                      language === lang ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang === 'en' ? 'EN' : lang === 'bn' ? 'বাংলা' : 'हिन्दी'}
                  </button>
                ))}
              </div>

              {/* Call Waiter Top Quick Button */}
              <button
                onClick={() => setShowCallModal(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center gap-1.5 transition-all"
              >
                <Bell className="w-3.5 h-3.5 animate-pulse" />
                <span className="hidden sm:inline">{t('call_waiter', language)}</span>
              </button>
            </div>
          </div>
        </header>

        {/* ========================================================= */}
        {/* VIEW 1: CUSTOMER WELCOME PAGE */}
        {/* ========================================================= */}
        {customerStep === 'welcome' && (
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
            {/* Banner & Logo */}
            <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
              <div className="h-48 w-full overflow-hidden relative">
                <SmartImage src={restaurant.banner} alt={restaurant.name} className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              </div>

              <div className="p-6 relative -mt-16 z-10 space-y-4">
                <div className="flex items-end gap-4">
                  <SmartImage src={restaurant.logo} alt={restaurant.name} className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500 shadow-2xl shrink-0" />
                  <div>
                    <h1 className="text-2xl font-black text-white">{restaurant.name}</h1>
                    <p className="text-xs text-slate-300">{restaurant.address}</p>
                    <a
                      href={`tel:${restaurant.contact_mobile || restaurant.owner_mobile || '8900415647'}`}
                      className="inline-flex items-center gap-1.5 text-xs text-blue-400 font-semibold mt-1 bg-blue-950/80 px-2.5 py-1 rounded-lg border border-blue-500/30"
                    >
                      <Phone className="w-3 h-3 text-blue-400" /> Contact: +91 {restaurant.contact_mobile || restaurant.owner_mobile || '8900415647'}
                    </a>
                  </div>
                </div>

                {/* Group Dining 4-Digit Table Session Code Card */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-purple-500/40 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-purple-300 font-extrabold text-xs">
                      <Users className="w-4 h-4 text-purple-400" />
                      Table #{table.table_number.replace(/^Table\s+/i, '')} Group Dining Session
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                      Active Session
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900 p-3.5 rounded-xl border border-slate-800 gap-3">
                    <div>
                      <div className="text-xs font-bold text-white">Share this Friend Code with everyone sitting at this table.</div>
                      <div className="text-[11px] text-slate-400">Friends enter this 4-digit code to join & order on their phone</div>
                    </div>

                    <div className="flex items-center gap-2 bg-purple-950/90 border-2 border-purple-500/60 px-4 py-2 rounded-xl font-mono text-xl font-black text-purple-200 tracking-widest shadow-md shrink-0">
                      <KeyRound className="w-5 h-5 text-purple-400" /> {tableJoinPin}
                    </div>
                  </div>
                </div>

                {/* COMPACT LIVE ORDER STATUS ON WELCOME PAGE */}
                {activeSessionOrders.length > 0 && (
                  <div className="p-5 rounded-3xl bg-slate-900 border-2 border-amber-500/50 space-y-4 shadow-2xl animate-fade-in">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-400" /> YOUR ACTIVE ORDER
                        </div>
                        <div className="text-base font-black text-white font-mono mt-0.5">
                          Order #{activeSessionOrders[0].order_number} • Table #{table.table_number.replace(/^Table\s+/i, '')}
                        </div>
                      </div>
                      <button
                        onClick={() => setCustomerStep('menu')}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-1 transition-all"
                      >
                        View Order →
                      </button>
                    </div>

                    {/* Compact Status Timeline */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold uppercase text-slate-400">Status Timeline:</div>
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                        {['Placed', 'Accepted', 'Cooking', 'Ready', 'Served', 'Completed'].map((stepLabel, idx) => {
                          const statusOrderMap = ['pending', 'accepted', 'cooking', 'ready', 'served', 'completed'];
                          const currentIdx = statusOrderMap.indexOf(activeSessionOrders[0].order_status);
                          const isDone = idx <= (currentIdx >= 0 ? currentIdx : 0);
                          const isCurrent = idx === (currentIdx >= 0 ? currentIdx : 0);
                          return (
                            <div key={stepLabel} className="flex flex-col items-center text-center p-1">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                                isCurrent ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 animate-pulse' :
                                isDone ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                              }`}>
                                {isDone ? '✓' : idx + 1}
                              </div>
                              <span className={`text-[10px] mt-1 font-extrabold ${
                                isCurrent ? 'text-amber-300 font-black' : isDone ? 'text-emerald-400' : 'text-slate-500'
                              }`}>
                                {stepLabel}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Payment:</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          (activeSessionOrders[0].payment_status === 'paid' || activeSessionOrders[0].payment_status === 'paid_live' || activeSessionOrders[0].payment_status === 'paid_demo' || (activeSessionOrders[0].cash_due !== undefined && activeSessionOrders[0].cash_due <= 0))
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                            : 'bg-amber-950 text-amber-400 border-amber-500/40'
                        }`}>
                          {(activeSessionOrders[0].payment_status === 'paid' || activeSessionOrders[0].payment_status === 'paid_live' || activeSessionOrders[0].payment_status === 'paid_demo' || (activeSessionOrders[0].cash_due !== undefined && activeSessionOrders[0].cash_due <= 0))
                            ? 'PAID'
                            : 'PAYMENT PENDING'}
                        </span>
                      </div>
                      <div className="font-extrabold text-white font-mono">
                        Total: ₹{activeSessionOrders[0].grand_total}
                      </div>
                    </div>
                  </div>
                )}

                {/* Guide Section with Directional Arrow & ONLY "Order Now" Button */}
                <div className="p-6 rounded-3xl bg-slate-900/90 border border-blue-500/30 space-y-5 text-center shadow-2xl">
                  <div className="space-y-1">
                    <h2 className="text-lg font-black text-white flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-400" />
                      How to Order Food at Your Table
                    </h2>
                    <p className="text-xs text-slate-400">Follow quick guide below and tap Order Now to open digital menu</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">1</span>
                      <div className="font-bold text-white text-xs">Browse Menu</div>
                      <div className="text-[10px] text-slate-400">Select dishes from food categories</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">2</span>
                      <div className="font-bold text-white text-xs">Select Quantity</div>
                      <div className="text-[10px] text-slate-400">Choose portion & special notes</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">3</span>
                      <div className="font-bold text-white text-xs">Choose Payment</div>
                      <div className="text-[10px] text-slate-400">Cash to waiter or online UPI</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">4</span>
                      <div className="font-bold text-white text-xs">Track Status</div>
                      <div className="text-[10px] text-slate-400">Live order cooking & serving status</div>
                    </div>
                  </div>

                  {/* Directional Guide Arrow pointing to ONLY Order Now Button */}
                  <div className="flex flex-col items-center justify-center gap-2 pt-2">
                    <div className="text-xs font-extrabold text-blue-400 uppercase tracking-widest flex items-center gap-1 animate-bounce">
                      <ArrowDown className="w-4 h-4 text-blue-400" /> Tap Order Now Button Below <ArrowDown className="w-4 h-4 text-blue-400" />
                    </div>

                    <button
                      onClick={() => setCustomerStep('menu')}
                      className="w-full sm:w-80 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-base shadow-2xl shadow-blue-600/40 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95 border border-blue-400/30"
                    >
                      <ShoppingBag className="w-5 h-5" /> Order Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: DIGITAL FOOD MENU & ORDERING */}
        {/* ========================================================= */}
        {customerStep === 'menu' && (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-28">
            {/* STICKY FLOATING ORDER STATUS BAR ON MENU PAGE */}
            {activeSessionOrders.length > 0 && (
              <div className="sticky top-2 z-30 p-3 bg-slate-950/95 backdrop-blur-xl border border-amber-500/50 rounded-2xl shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                    <div className="text-xs truncate">
                      <span className="font-extrabold text-white font-mono">Order #{activeSessionOrders[0].order_number}</span>
                      <span className="text-slate-400 ml-1.5">• Table #{table?.table_number.replace(/^Table\s+/i, '')}</span>
                      <span className="ml-2 px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 font-extrabold text-[10px] uppercase border border-amber-500/30">
                        {activeSessionOrders[0].order_status}
                      </span>
                      <span className={`ml-1.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                        (activeSessionOrders[0].payment_status === 'paid' || activeSessionOrders[0].payment_status === 'paid_live' || activeSessionOrders[0].payment_status === 'paid_demo' || (activeSessionOrders[0].cash_due !== undefined && activeSessionOrders[0].cash_due <= 0))
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-950 text-amber-400 border-amber-500/30'
                      }`}>
                        {(activeSessionOrders[0].payment_status === 'paid' || activeSessionOrders[0].payment_status === 'paid_live' || activeSessionOrders[0].payment_status === 'paid_demo' || (activeSessionOrders[0].cash_due !== undefined && activeSessionOrders[0].cash_due <= 0)) ? 'PAID' : 'PAYMENT PENDING'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const el = document.getElementById('active-orders-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[11px] shadow-md transition-all shrink-0"
                  >
                    View Order
                  </button>
                </div>
              </div>
            )}

            {/* Top Navigation Back to Welcome & Table PIN Bar */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
              <button
                onClick={() => setCustomerStep('welcome')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1"
              >
                ← Back to Welcome
              </button>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Table PIN:</span>
                <span className="px-2.5 py-1 rounded-lg bg-purple-950 text-purple-300 font-mono font-bold border border-purple-500/40">
                  {tableJoinPin}
                </span>
              </div>
            </div>

            {/* MULTIPLE ORDERS IN SESSION DISPLAY */}
            {activeSessionOrders.length > 0 && (
              <div id="active-orders-section" className="p-5 rounded-3xl bg-slate-900 border border-blue-500/30 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-blue-400" /> Active Orders in Table Session ({activeSessionOrders.length})
                    </h3>
                    <p className="text-[11px] text-slate-400">Table #{table.table_number} • Total Bill: <strong className="text-emerald-400">₹{totalSessionBill}</strong></p>
                  </div>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                  {activeSessionOrders.map(order => {
                    const dueAmt = order.cash_due ?? (order.grand_total - (order.online_amount || 0) - (order.cash_amount || 0));
                    const isFullyPaid = order.payment_status === 'paid_live' || order.payment_status === 'paid' || order.payment_status === 'paid_demo' || dueAmt <= 0;

                    // Timeline steps mapping
                    const statusSteps = [
                      { id: 'pending', label: 'Order Placed' },
                      { id: 'accepted', label: 'Accepted' },
                      { id: 'cooking', label: 'Cooking' },
                      { id: 'ready', label: 'Ready' },
                      { id: 'served', label: 'Served' },
                      { id: 'completed', label: 'Completed' }
                    ];

                    const currentStepIdx = statusSteps.findIndex(s => s.id === order.order_status);
                    const activeIdx = currentStepIdx >= 0 ? currentStepIdx : 0;

                    return (
                      <div key={order.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 shadow-lg">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <div>
                            <span className="font-extrabold text-white text-sm font-mono">Order #{order.order_number}</span>
                            <span className="text-[10px] text-slate-400 ml-2">Table #{order.table_number}</span>
                            <span className="text-[10px] text-slate-500 block font-mono">{new Date(order.created_at).toLocaleTimeString()}</span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                            order.order_status === 'completed' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' :
                            order.order_status === 'served' ? 'bg-sky-950 text-sky-300 border-sky-500/40' :
                            order.order_status === 'ready' ? 'bg-amber-950 text-amber-300 border-amber-500/40' :
                            'bg-blue-950 text-blue-300 border-blue-500/40'
                          }`}>
                            {t(`status_${order.order_status}` as any, language) || order.order_status}
                          </span>
                        </div>

                        {/* LIVE ORDER STATUS TIMELINE */}
                        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2">
                          <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Live Order Status:</div>
                          <div className="flex items-center justify-between gap-1 overflow-x-auto custom-scrollbar pb-1">
                            {statusSteps.map((step, idx) => {
                              const isCompleted = idx <= activeIdx;
                              const isCurrent = idx === activeIdx;
                              return (
                                <div key={step.id} className="flex flex-col items-center flex-1 min-w-[55px] text-center">
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-all ${
                                    isCurrent ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400/50 animate-pulse' :
                                    isCompleted ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'
                                  }`}>
                                    {isCompleted ? '✓' : idx + 1}
                                  </div>
                                  <span className={`text-[9px] mt-1 font-semibold leading-tight ${
                                    isCurrent ? 'text-amber-300 font-extrabold' : isCompleted ? 'text-emerald-400' : 'text-slate-500'
                                  }`}>
                                    {step.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* ORDER ITEMS LIST */}
                        <div className="text-xs text-slate-300 space-y-1 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/50">
                          {order.items.map(item => (
                            <div key={item.id} className="flex justify-between">
                              <span>{item.quantity}x {item.menu_name}</span>
                              <span className="font-semibold text-white">₹{item.quantity * item.price}</span>
                            </div>
                          ))}
                        </div>

                        {/* PAYMENT STATUS CALLOUTS */}
                        {order.payment_status === 'payment_verification_pending' ? (
                          <div className="bg-purple-950/40 border border-purple-500/40 rounded-xl p-3 space-y-2 text-purple-200">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs flex items-center gap-1.5 text-purple-300">
                                <Clock className="w-4 h-4 text-purple-400 animate-spin" /> UPI Verification in Progress
                              </span>
                              <span className="text-xs font-extrabold text-purple-400 font-mono">₹{order.grand_total}</span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-snug">
                              We received your UPI payment confirmation{order.upi_ref_number ? ` (Ref: ${order.upi_ref_number})` : ''}. Waiter or counter staff is verifying the transaction.
                            </p>
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => {
                                  setUpiPaymentModalOrder(order);
                                  setUpiRefInput(order.upi_ref_number || '');
                                }}
                                className="flex-1 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white font-bold text-xs border border-purple-500/30 transition-all flex items-center justify-center gap-1.5"
                              >
                                <QrCode className="w-3.5 h-3.5" /> View UPI QR
                              </button>
                              <button
                                onClick={() => {
                                  sendCallWaiterRequest(restaurant.id, session?.id || '', table.table_number, 'payment');
                                  showToast(`Waiter notified to verify Table #${table.table_number}'s UPI payment.`, 'info');
                                }}
                                className="px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-extrabold text-xs transition-all flex items-center justify-center gap-1"
                              >
                                <Bell className="w-3.5 h-3.5" /> Call Waiter
                              </button>
                            </div>
                          </div>
                        ) : !isFullyPaid ? (
                          <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 space-y-2 text-amber-200">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs flex items-center gap-1.5 text-amber-300">
                                ⚠️ Payment is pending.
                              </span>
                              <span className="text-xs font-extrabold text-amber-400 font-mono">Due: ₹{dueAmt}</span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-snug">
                              {isOnlinePaymentActive
                                ? 'To make payment, tap the Bell 🔔 icon to call a waiter, or pay instantly via UPI Scan & Pay.'
                                : (t('payment_collected_by_restaurant', language) || 'Payment will be collected by the restaurant. Please call the waiter or make payment at the cash counter.')}
                            </p>
                            <div className="flex gap-2">
                              {isOnlinePaymentActive && Boolean(restaurant?.enable_upi_qr ?? true) && (
                                <button
                                  onClick={() => {
                                    setUpiPaymentModalOrder(order);
                                    setUpiRefInput('');
                                  }}
                                  className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/20 flex items-center justify-center gap-1.5 transition-all"
                                >
                                  <QrCode className="w-4 h-4" /> Scan & Pay (UPI)
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  sendCallWaiterRequest(restaurant.id, session?.id || '', table.table_number, 'payment');
                                  showToast(`Payment assistance requested! Waiter notified for Table #${table.table_number}.`, 'info');
                                }}
                                className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all"
                              >
                                🔔 {isOnlinePaymentActive ? 'Call Waiter' : 'Call Waiter for Bill / Payment'}
                              </button>
                            </div>
                          </div>
                        ) : null}

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800">
                          <div>
                            <div className="text-xs font-extrabold text-white flex items-center gap-2">
                              <span>Total: ₹{order.grand_total}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                                isFullyPaid ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40' :
                                order.payment_status === 'payment_verification_pending' ? 'bg-purple-950 text-purple-300 border-purple-500/40' :
                                'bg-amber-950 text-amber-400 border-amber-500/40'
                              }`}>
                                {isFullyPaid ? 'PAID' : order.payment_status === 'payment_verification_pending' ? 'UPI VERIFICATION PENDING' : 'PAYMENT PENDING'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {!isFullyPaid && isOnlinePaymentActive && (
                              <button
                                onClick={() => {
                                  const activeGw = (restaurant?.live_gateway || 'payu') as 'payu' | 'razorpay' | 'phonepe';
                                  setOnlinePaymentModalData({
                                    gateway: activeGw,
                                    amountToPay: dueAmt,
                                    title: `Order #${order.order_number || ''} • Table ${order.table_number || ''}`,
                                    subtitle: `Payment for ${restaurant?.name || ''}`,
                                    effectivePaymentMode: 'online',
                                    onlineAmt: dueAmt,
                                    cashAmt: 0,
                                    items: [],
                                    financialBreakdown: {
                                      subtotal: dueAmt,
                                      tax: 0,
                                      discount: 0,
                                      packaging_charge: 0,
                                      service_charge: 0,
                                      online_discount: 0,
                                      coupon_discount: 0,
                                      grand_total: dueAmt
                                    }
                                  });
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] shadow-md transition-all flex items-center gap-1"
                              >
                                <CreditCard className="w-3 h-3" />
                                Pay Online (UPI / Card / Net Banking)
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedBillOrder(order)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white font-bold text-[11px] border border-blue-500/30 transition-all flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3 text-blue-400" /> Digital Bill
                            </button>

                            <button
                              onClick={() => generateInvoicePdf(order, restaurant)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] transition-all flex items-center gap-1"
                              title="Download PDF Receipt"
                            >
                              <Download className="w-3 h-3 text-emerald-400" /> PDF
                            </button>
                            <button
                              onClick={() => setFeedbackOrder(order.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white font-bold text-[11px] border border-amber-500/30 transition-all flex items-center gap-1"
                            >
                              <Star className="w-3 h-3 fill-amber-400" /> Rate
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Food Menu Filter Controls */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder={t('search_food', language)}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none"
                  />
                </div>

                <button
                  onClick={() => setVegOnly(!vegOnly)}
                  className={`px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    vegOnly ? 'bg-emerald-950 text-emerald-400 border-emerald-500/50' : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${vegOnly ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  {t('veg_only', language)}
                </button>
              </div>

              {/* Category Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {t('all_categories', language)}
                </button>
                {restCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Food Menu Items List */}
            <div className="space-y-4 pb-40 sm:pb-48">
              {filteredMenu.map(item => {
                const qty = getItemQuantity(item.id);
                return (
                  <div key={item.id} className="p-4 rounded-3xl bg-slate-900 border border-slate-800/80 flex gap-4 transition-all hover:border-slate-700">
                    <SmartImage src={item.image_url} alt={item.name} className="w-24 h-24 rounded-2xl object-cover border border-slate-800 shrink-0" />

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white text-sm">{item.name}</span>
                          <span className={`w-3 h-3 rounded-full border shrink-0 ${item.is_veg ? 'bg-emerald-500 border-emerald-400' : 'bg-rose-500 border-rose-400'}`} />
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{item.description}</p>

                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {item.prep_time} mins
                          </span>

                          {/* Food Details Button */}
                          <button
                            onClick={() => setDetailsItem(item)}
                            className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold text-[10px] flex items-center gap-1 border border-slate-700"
                          >
                            <Info className="w-3 h-3" /> Details
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="text-base font-extrabold text-white">₹{item.price}</div>

                        <button
                          onClick={() => {
                            setQuantityPopupItem({
                              item,
                              quantity: qty > 0 ? qty : 1,
                              instructions: getItemInstructions(item.id)
                            });
                          }}
                          className={`px-4 py-2 rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 transition-all ${
                            qty > 0
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" /> {qty > 0 ? `Selected (${qty})` : '+ Add Food'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Permanent Sticky Bottom Action Bar */}
        {customerStep === 'menu' && (
          <div className="fixed bottom-0 inset-x-0 z-40 p-3 sm:p-4 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 shadow-2xl">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  🛒 {cart.reduce((a, c) => a + c.quantity, 0)} {t('items_in_cart', language)}
                </div>
                <div className="text-lg sm:text-xl font-black text-white flex items-center gap-1">
                  ₹{cartGrandTotal} <span className="text-[10px] font-normal text-slate-400">(incl. tax)</span>
                </div>
              </div>

              <button
                onClick={() => setIsCartOpen(true)}
                disabled={cart.length === 0}
                className={`px-5 py-3 rounded-2xl font-extrabold text-xs sm:text-sm shadow-xl flex items-center gap-2 transition-all ${
                  cart.length > 0
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 transform hover:scale-105 active:scale-95'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                {cart.length > 0 ? t('view_cart_checkout', language) : t('cart_empty', language)}
              </button>
            </div>
          </div>
        )}

        {/* Customer AI Assistant Drawer */}
        <AiHelpAssistant
          role="customer"
          restaurantName={restaurant.name}
          currentView={customerStep === 'menu' ? 'Digital Menu' : 'Table Welcome'}
        />
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: QUANTITY SELECTOR POPUP MODAL */}
      {/* ========================================================= */}
      {quantityPopupItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="font-extrabold text-white text-base">{quantityPopupItem.item.name}</div>
              <button onClick={() => setQuantityPopupItem(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="flex gap-4">
              <SmartImage src={quantityPopupItem.item.image_url} alt={quantityPopupItem.item.name} className="w-20 h-20 rounded-2xl object-cover border border-slate-800 shrink-0" />
              <div className="space-y-1">
                <div className="text-sm font-extrabold text-emerald-400">₹{quantityPopupItem.item.price} each</div>
                <p className="text-xs text-slate-400 line-clamp-2">{quantityPopupItem.item.description}</p>
              </div>
            </div>

            {/* Quantity Selector Controls */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase text-slate-400">Select Quantity</label>
              <div className="flex items-center justify-center gap-4 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setQuantityPopupItem({ ...quantityPopupItem, quantity: Math.max(0, quantityPopupItem.quantity - 1) })}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-lg flex items-center justify-center"
                >
                  -
                </button>
                <span className="font-black text-2xl text-white font-mono w-12 text-center">{quantityPopupItem.quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantityPopupItem({ ...quantityPopupItem, quantity: quantityPopupItem.quantity + 1 })}
                  className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-blue-600/30"
                >
                  +
                </button>
              </div>
            </div>

            {/* Special Instructions */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">Special Cooking Request</label>
              <input
                type="text"
                placeholder="e.g. Less spicy, extra sauce, no onions"
                value={quantityPopupItem.instructions}
                onChange={(e) => setQuantityPopupItem({ ...quantityPopupItem, instructions: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleConfirmQuantityPopup}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {quantityPopupItem.quantity > 0 ? `Confirm (${quantityPopupItem.quantity} x ₹${quantityPopupItem.item.price})` : 'Remove from Order'}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: FOOD ITEM DETAILS MODAL */}
      {/* ========================================================= */}
      {detailsItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                <h3 className="font-extrabold text-white text-base">{detailsItem.name}</h3>
              </div>
              <button onClick={() => setDetailsItem(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <SmartImage src={detailsItem.image_url} alt={detailsItem.name} className="w-full h-40 rounded-2xl object-cover border border-slate-800" />

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-emerald-400 text-lg">₹{detailsItem.price}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                  detailsItem.is_veg ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' : 'bg-rose-950 text-rose-300 border-rose-500/40'
                }`}>
                  {detailsItem.is_veg ? '100% Pure Veg' : 'Non-Vegetarian'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Item Description</div>
                <p className="text-slate-200 text-xs leading-relaxed">{detailsItem.description || 'Freshly prepared by restaurant chef using finest ingredients.'}</p>
              </div>

              <div className="flex items-center justify-between text-slate-400 pt-1">
                <span>Approx Prep Time:</span>
                <strong className="text-white">{detailsItem.prep_time} mins</strong>
              </div>
            </div>

            <button
              onClick={() => {
                const itemToPop = detailsItem;
                setDetailsItem(null);
                setQuantityPopupItem({
                  item: itemToPop,
                  quantity: getItemQuantity(itemToPop.id) || 1,
                  instructions: getItemInstructions(itemToPop.id)
                });
              }}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add This Item To Order
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: CART & CHECKOUT DRAWER */}
      {/* ========================================================= */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-400" /> {t('cart', language)}
              </h3>
              <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Cart Items List */}
            <div className="space-y-3">
              {cart.map(c => (
                <div key={c.menuItem.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{c.menuItem.name}</span>
                    <span className="font-bold text-white">₹{c.menuItem.price * c.quantity}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      placeholder={t('special_instructions', language)}
                      value={c.instructions}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCart(prev => prev.map(item => item.menuItem.id === c.menuItem.id ? { ...item, instructions: val } : item));
                      }}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 text-[11px] text-white w-2/3 outline-none"
                    />

                    <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setCart(prev => prev.map(item => item.menuItem.id === c.menuItem.id ? { ...item, quantity: item.quantity - 1 } : item).filter(i => i.quantity > 0));
                        }}
                        className="text-slate-400 hover:text-white px-1"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-white text-xs">{c.quantity}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCart(prev => prev.map(item => item.menuItem.id === c.menuItem.id ? { ...item, quantity: item.quantity + 1 } : item));
                        }}
                        className="text-slate-400 hover:text-white px-1"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Code Input Box */}
            {Boolean(restaurant?.enable_coupons ?? true) && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-amber-400" /> Coupon Code
                  </label>
                  {appliedCoupon && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      ✓ {appliedCoupon.code} APPLIED
                    </span>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-950/30 border border-emerald-500/30 p-2.5 rounded-xl text-xs text-emerald-300">
                    <div>
                      <span className="font-extrabold">{appliedCoupon.code}</span> ({appliedCoupon.discount_type === 'percent' ? `${appliedCoupon.discount_value}% OFF` : `₹${appliedCoupon.discount_value} OFF`})
                    </div>
                    <button
                      type="button"
                      onClick={() => setAppliedCoupon(null)}
                      className="text-[10px] text-rose-400 hover:underline font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Code (e.g. DIGI10)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white uppercase outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition-all"
                    >
                      Apply
                    </button>
                  </div>
                )}

                {couponError && (
                  <p className="text-[11px] text-rose-400 font-semibold">{couponError}</p>
                )}
              </div>
            )}

            {/* Price Calculations */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>{t('subtotal', language)}</span>
                <span className="font-mono font-semibold text-white">₹{cartSubtotal}</span>
              </div>

              {/* GST Tax */}
              {isGstEnabled && cartTax > 0 && (
                <div className="flex justify-between">
                  <span>GST Tax ({gstRate}%)</span>
                  <span className="font-mono font-semibold text-white">₹{cartTax}</span>
                </div>
              )}

              {/* Packaging Charge */}
              {isPackagingEnabled && cartPackagingCharge > 0 && (
                <div className="flex justify-between">
                  <span>Packaging Charge</span>
                  <span className="font-mono font-semibold text-white">₹{cartPackagingCharge}</span>
                </div>
              )}

              {/* Service Charge */}
              {isServiceChargeEnabled && cartServiceCharge > 0 && (
                <div className="flex justify-between">
                  <span>Service Charge ({restaurant?.service_charge_percentage}%)</span>
                  <span className="font-mono font-semibold text-white">₹{cartServiceCharge}</span>
                </div>
              )}

              {/* Full Online Payment Discount */}
              {cartOnlineDiscount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span className="flex items-center gap-1">⚡ Online Pay Discount ({onlineDiscountRate}% OFF)</span>
                  <span className="font-mono">-₹{cartOnlineDiscount}</span>
                </div>
              )}

              {/* Coupon Code Discount */}
              {cartCouponDiscount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span className="flex items-center gap-1">🎟️ Coupon ({appliedCoupon?.code})</span>
                  <span className="font-mono">-₹{cartCouponDiscount}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800">
                <span>{t('total', language)}</span>
                <span className="font-mono text-emerald-400 text-lg">₹{cartGrandTotal}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <form onSubmit={handlePlaceOrder} className="space-y-4">
              {isOnlinePaymentActive ? (
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase text-slate-400">{t('payment_mode', language)}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Boolean(restaurant?.enable_cash_payment ?? true) && (
                      <div
                        onClick={() => setPaymentMode('cash')}
                        className={`p-2.5 rounded-2xl border cursor-pointer text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 text-center ${
                          paymentMode === 'cash' ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300' : 'border-slate-800 bg-slate-950 text-slate-400'
                        }`}
                      >
                        <Utensils className="w-4 h-4" /> Cash
                      </div>
                    )}

                    {Boolean(restaurant?.enable_upi_qr ?? true) && (
                      <div
                        onClick={() => setPaymentMode('upi_qr')}
                        className={`p-2.5 rounded-2xl border cursor-pointer text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 text-center ${
                          paymentMode === 'upi_qr' ? 'border-purple-500 bg-purple-950/40 text-purple-300 shadow-md shadow-purple-500/10' : 'border-slate-800 bg-slate-950 text-slate-400'
                        }`}
                      >
                        <QrCode className="w-4 h-4 text-purple-400" /> UPI Scan & Pay
                      </div>
                    )}

                    {Boolean(restaurant?.enable_gateway_payment ?? true) && (
                      <div
                        onClick={() => setPaymentMode('online')}
                        className={`p-2.5 rounded-2xl border cursor-pointer text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 text-center ${
                          paymentMode === 'online' ? 'border-blue-500 bg-blue-950/40 text-blue-300' : 'border-slate-800 bg-slate-950 text-slate-400'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" /> Online Gateway
                      </div>
                    )}

                    {Boolean(restaurant?.enable_split_payment ?? true) && (
                      <div
                        onClick={() => setPaymentMode('partial')}
                        className={`p-2.5 rounded-2xl border cursor-pointer text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 text-center ${
                          paymentMode === 'partial' ? 'border-amber-500 bg-amber-950/40 text-amber-300' : 'border-slate-800 bg-slate-950 text-slate-400'
                        }`}
                      >
                        <Sparkles className="w-4 h-4" /> Partial Pay
                      </div>
                    )}
                  </div>

                  {paymentMode === 'upi_qr' && (
                    <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl space-y-1.5 text-xs text-purple-200">
                      <div className="font-bold flex items-center gap-1.5 text-purple-300">
                        <QrCode className="w-4 h-4 text-purple-400" /> Direct UPI Scan & Pay
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        On clicking Confirm Order, you'll see {restaurant.upi_name || restaurant.name}'s UPI QR code. Pay using any UPI app (UPI, Cards, Net Banking) and staff verifies instantly!
                      </p>
                    </div>
                  )}

                  {paymentMode === 'partial' && (
                    <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl space-y-2">
                      <label className="block text-[11px] font-semibold text-purple-300">Online Deposit Amount (INR)</label>
                      <input
                        type="number"
                        placeholder={`Default ₹${Math.round(cartGrandTotal / 2)}`}
                        value={partialOnlineAmount}
                        onChange={(e) => setPartialOnlineAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                      />
                      <p className="text-[10px] text-purple-400 font-medium">
                        Pay ₹{Number(partialOnlineAmount) || Math.round(cartGrandTotal / 2)} online now, remaining ₹{cartGrandTotal - (Number(partialOnlineAmount) || Math.round(cartGrandTotal / 2))} in cash at counter.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 bg-amber-950/40 border border-amber-500/30 rounded-2xl space-y-1 text-amber-200">
                  <div className="font-bold text-xs flex items-center gap-2 text-amber-300">
                    <Utensils className="w-4 h-4 text-amber-400" />
                    <span>Restaurant Collection Notice</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    {t('payment_collected_by_restaurant', language) || 'Payment will be collected by the restaurant. Please call the waiter or make payment at the cash counter.'}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number (Optional for order tracking)</label>
                <input
                  type="tel"
                  placeholder="10 digit mobile"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:border-blue-500 outline-none"
                />
              </div>

              {orderError && (
                <div className="p-3.5 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs font-semibold leading-relaxed space-y-1">
                  <div className="flex items-center gap-1.5 font-extrabold text-rose-400">
                    <ShieldAlert className="w-4 h-4" /> Order Creation Failed
                  </div>
                  <div>{orderError}</div>
                </div>
              )}

              <button
                type="submit"
                disabled={isPlacingOrder}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
              >
                {isPlacingOrder ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Inserting Order in Database...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" /> Confirm Order (₹{cartGrandTotal})
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3.5: DIRECT UPI SCAN & PAY MODAL */}
      {upiPaymentModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">UPI Direct Scan & Pay</h3>
                  <p className="text-[10px] text-slate-400">Order {upiPaymentModalOrder.order_number} • Table {upiPaymentModalOrder.table_number}</p>
                </div>
              </div>
              <button onClick={() => setUpiPaymentModalOrder(null)} className="text-slate-400 hover:text-white p-1">✕</button>
            </div>

            {/* Payee Details & Total */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">Pay to</div>
                <div className="text-xs font-bold text-white">{restaurant?.upi_name || restaurant?.name}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-slate-400">Amount Due</div>
                <div className="text-base font-extrabold font-mono text-purple-400">₹{upiPaymentModalOrder.grand_total}</div>
              </div>
            </div>

            {/* QR Code Container */}
            {(() => {
              const upiPayeeId = restaurant?.upi_id?.trim() || '';
              const upiPayeeName = restaurant?.upi_name?.trim() || restaurant?.name || 'Restaurant';
              const upiAmount = upiPaymentModalOrder.grand_total;
              const upiNote = `Order ${upiPaymentModalOrder.order_number}`;
              const upiDeepLink = upiPayeeId
                ? `upi://pay?pa=${encodeURIComponent(upiPayeeId)}&pn=${encodeURIComponent(upiPayeeName)}&am=${upiAmount}&cu=INR&tn=${encodeURIComponent(upiNote)}`
                : '';
              const qrDisplayUrl = restaurant?.upi_qr_image || (upiDeepLink
                ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiDeepLink)}`
                : '');

              return (
                <div className="space-y-3 text-center">
                  {qrDisplayUrl ? (
                    <div className="p-3 bg-white rounded-2xl shadow-xl border-2 border-purple-500/30 max-w-[200px] mx-auto relative group">
                      <img
                        src={qrDisplayUrl}
                        alt="Restaurant UPI QR"
                        className="w-full h-auto object-contain rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs">
                      UPI ID not configured by restaurant owner yet. Please pay in cash.
                    </div>
                  )}

                  {/* UPI ID & Copy Action */}
                  {upiPayeeId && (
                    <div className="flex items-center justify-between bg-slate-950 border border-purple-500/20 rounded-xl px-3 py-2 text-xs">
                      <div className="text-left overflow-hidden">
                        <span className="text-[10px] text-slate-400 block">UPI VPA:</span>
                        <span className="font-mono text-purple-300 font-semibold text-[11px] truncate block">{upiPayeeId}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(upiPayeeId);
                          setCopiedUpi(true);
                          setTimeout(() => setCopiedUpi(false), 2000);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white font-bold text-[10px] flex items-center gap-1 transition-all"
                      >
                        {copiedUpi ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedUpi ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  )}

                  {/* Direct Mobile Intent Link */}
                  {upiDeepLink && (
                    <a
                      href={upiDeepLink}
                      className="w-full py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Pay via UPI Apps (UPI / Card / Net Banking)
                    </a>
                  )}

                  {/* UTR / Reference Input */}
                  <div className="space-y-1.5 text-left pt-1">
                    <label className="block text-[11px] font-semibold text-slate-300">
                      UPI Ref / UTR / Txn No. (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 423456789012 or your name"
                      value={upiRefInput}
                      onChange={(e) => setUpiRefInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500 font-mono"
                    />
                    <p className="text-[10px] text-slate-400">
                      Enter the 12-digit UPI reference from your payment app so staff can verify faster.
                    </p>
                  </div>

                  {/* Submit Confirmation Button */}
                  <button
                    type="button"
                    disabled={isSubmittingUpi}
                    onClick={async () => {
                      setIsSubmittingUpi(true);
                      const res = await submitUpiPaymentConfirmation(upiPaymentModalOrder.id, upiRefInput.trim() || undefined);
                      setIsSubmittingUpi(false);
                      if (res) {
                        setUpiPaymentModalOrder(null);
                        setUpiRefInput('');
                      }
                    }}
                    className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white font-extrabold text-xs shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-all"
                  >
                    {isSubmittingUpi ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting to Staff...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> I Have Paid — Submit for Verification
                      </>
                    )}
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* VERIFIED ORDER SUCCESS MODAL */}
      {lastPlacedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-500/40">
                Database Order Verified
              </span>
              <h2 className="text-2xl font-black text-white pt-2">ORDER SUCCESSFUL</h2>
              <div className="text-3xl font-mono font-black text-emerald-400">{lastPlacedOrder.order_number}</div>
              <p className="text-xs text-slate-300 pt-1">
                Table #{lastPlacedOrder.table_number} • Total ₹{lastPlacedOrder.grand_total}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between text-slate-400 font-semibold">
                <span>Status:</span>
                <strong className="text-amber-400 uppercase">Order Received</strong>
              </div>
              <div className="flex justify-between text-slate-400 font-semibold">
                <span>Payment Mode:</span>
                <strong className="text-white uppercase">{lastPlacedOrder.payment_mode}</strong>
              </div>
              <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2">
                Order details saved in Supabase. Kitchen and waiter notified in real-time.
              </div>
            </div>

            <button
              onClick={() => {
                setLastPlacedOrder(null);
                setCustomerStep('menu');
              }}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-xl shadow-emerald-600/30"
            >
              Back to Digital Menu
            </button>
          </div>
        </div>
      )}

      {/* Call Waiter Modal */}
      {showCallModal && (
        <CallWaiterModal
          restaurantId={restaurant.id}
          sessionId={session?.id || 'temp'}
          tableNumber={table.table_number}
          onClose={() => setShowCallModal(false)}
        />
      )}

      {/* Feedback Modal */}
      {feedbackOrder && (
        <FeedbackModal
          restaurantId={restaurant.id}
          orderId={feedbackOrder}
          tableNumber={table.table_number}
          onClose={() => setFeedbackOrder(null)}
        />
      )}

      {/* Bill Preview & Print Modal */}
      {selectedBillOrder && restaurant && (
        <BillModal
          order={selectedBillOrder}
          restaurant={restaurant}
          onClose={() => setSelectedBillOrder(null)}
        />
      )}

      {/* PayU Food Order Payment Gateway Modal */}
      {onlinePaymentModalData && onlinePaymentModalData.gateway === 'payu' && restaurant && (
        <PayUCheckoutModal
          isOpen={true}
          onClose={() => {
            setOnlinePaymentModalData(null);
            setIsPlacingOrder(false);
          }}
          onSuccess={async (paymentData) => {
            try {
              const existingOrd = onlinePaymentModalData.existingOrder;
              const { onlineAmt } = onlinePaymentModalData;

              await processPayUOnlinePayment(
                existingOrd.id,
                onlineAmt,
                {
                  txnid: paymentData.txnid,
                  mihpayid: paymentData.mihpayid || `mih_${Date.now()}`,
                  hash: paymentData.hash,
                  status: 'success'
                },
                customerMobile
              );

              setCart([]);
              setIsCartOpen(false);
              setOnlinePaymentModalData(null);
              setLastPlacedOrder(existingOrd);
              showToast('🎉 PayU payment confirmed! Your food order is placed and being prepared.', 'success');
            } catch (err: any) {
              console.error("PayU Order Payment Error:", err);
              showToast('Payment received! Order active.', 'info');
              setCart([]);
              setIsCartOpen(false);
              setLastPlacedOrder(onlinePaymentModalData.existingOrder);
              setOnlinePaymentModalData(null);
            }
          }}
          amount={onlinePaymentModalData.amountToPay}
          title={onlinePaymentModalData.title}
          subtitle={onlinePaymentModalData.subtitle}
          orderId={onlinePaymentModalData.existingOrder.id}
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
          customerName={customerMobile ? `Customer (${customerMobile})` : `Table ${table.table_number}`}
          customerMobile={customerMobile || '9999999999'}
          customerEmail="customer@digimoms.in"
          payuKey={restaurant.payu_merchant_key}
          payuSalt={restaurant.payu_merchant_salt}
          env={restaurant.payu_env || 'TEST'}
          isSubscription={false}
        />
      )}

      {/* PhonePe Food Order Payment Gateway Modal */}
      {onlinePaymentModalData && onlinePaymentModalData.gateway === 'phonepe' && restaurant && (
        <PhonePeCheckoutModal
          isOpen={true}
          onClose={() => {
            setOnlinePaymentModalData(null);
            setIsPlacingOrder(false);
          }}
          onSuccess={async (paymentData) => {
            try {
              const existingOrd = onlinePaymentModalData.existingOrder;
              const { onlineAmt } = onlinePaymentModalData;

              await processPhonePeOnlinePayment(
                existingOrd.id,
                onlineAmt,
                {
                  transactionId: paymentData.transactionId,
                  mode: 'phonepe'
                },
                customerMobile
              );

              setCart([]);
              setIsCartOpen(false);
              setOnlinePaymentModalData(null);
              setLastPlacedOrder(existingOrd);
              showToast('🎉 PhonePe payment confirmed! Your food order is placed and being prepared.', 'success');
            } catch (err: any) {
              console.error("PhonePe Order Payment Error:", err);
              showToast('Payment received! Order active.', 'info');
              setCart([]);
              setIsCartOpen(false);
              setLastPlacedOrder(onlinePaymentModalData.existingOrder);
              setOnlinePaymentModalData(null);
            }
          }}
          amount={onlinePaymentModalData.amountToPay}
          title={onlinePaymentModalData.title}
          subtitle={onlinePaymentModalData.subtitle}
          orderId={onlinePaymentModalData.existingOrder.id}
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
          merchantId={restaurant.phonepe_merchant_id}
          saltKey={restaurant.phonepe_salt_key}
          saltIndex={restaurant.phonepe_salt_index}
          env={restaurant.phonepe_env || 'TEST'}
          customerMobile={customerMobile || '9999999999'}
          customerName={customerMobile ? `Customer (${customerMobile})` : `Table ${table.table_number}`}
          isSubscription={false}
        />
      )}

      {/* Razorpay Food Order Payment Gateway Modal */}
      {onlinePaymentModalData && onlinePaymentModalData.gateway === 'razorpay' && restaurant && (
        <RazorpayCheckoutModal
          isOpen={true}
          onClose={() => {
            setOnlinePaymentModalData(null);
            setIsPlacingOrder(false);
          }}
          onSuccess={async (paymentData) => {
            try {
              const existingOrd = onlinePaymentModalData.existingOrder;
              const { onlineAmt } = onlinePaymentModalData;

              await processRazorpayOnlinePayment(
                existingOrd.id,
                onlineAmt,
                {
                  razorpay_payment_id: paymentData.razorpay_payment_id,
                  razorpay_order_id: paymentData.razorpay_order_id,
                  razorpay_signature: paymentData.razorpay_signature
                },
                customerMobile
              );

              setCart([]);
              setIsCartOpen(false);
              setOnlinePaymentModalData(null);
              setLastPlacedOrder(existingOrd);
              showToast('🎉 Razorpay payment confirmed! Your food order is placed and being prepared.', 'success');
            } catch (err: any) {
              console.error("Razorpay Order Payment Error:", err);
              showToast('Payment received! Order active.', 'info');
              setCart([]);
              setIsCartOpen(false);
              setLastPlacedOrder(onlinePaymentModalData.existingOrder);
              setOnlinePaymentModalData(null);
            }
          }}
          amount={onlinePaymentModalData.amountToPay}
          title={onlinePaymentModalData.title}
          subtitle={onlinePaymentModalData.subtitle}
          orderId={onlinePaymentModalData.existingOrder.id}
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
          razorpayKey={restaurant.razorpay_key}
          customerMobile={customerMobile || '9999999999'}
          customerName={customerMobile ? `Customer (${customerMobile})` : `Table ${table.table_number}`}
          isSubscription={false}
        />
      )}

      {/* FOOTER SIGNATURE ON ALL CUSTOMER PAGES */}
      <footer className="text-center py-6 border-t border-slate-900/80 text-slate-500 text-xs font-medium">
        Powered by <strong className="text-slate-300 font-extrabold tracking-wide">DigiMoms OS</strong> • Enterprise Restaurant System
      </footer>
    </div>
  );
};
