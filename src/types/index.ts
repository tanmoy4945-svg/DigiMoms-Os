export type RestaurantStatus = 'trial' | 'active' | 'expired' | 'suspended' | 'maintenance' | 'archived' | 'inactive';
export type PaymentMode = 'demo' | 'live';
export type UserRole = 'ceo' | 'owner' | 'waiter' | 'kitchen' | 'customer';
export type Language = 'en' | 'bn' | 'hi';

export type TableStatus = 'available' | 'occupied' | 'cleaning' | 'reserved' | 'maintenance';
export type SessionStatus = 'active' | 'closed';
export type OrderStatus = 'pending' | 'accepted' | 'cooking' | 'ready' | 'served' | 'completed' | 'cancelled';
export type OrderPaymentMode = 'cash' | 'demo' | 'online' | 'partial';
export type OrderPaymentStatus = 'pending' | 'paid_demo' | 'paid_live' | 'paid_cash' | 'partial' | 'partially_paid' | 'failed' | 'paid';
export type RequestType = 'call' | 'water' | 'spoon' | 'tissue' | 'cleaning' | 'bill' | 'help' | 'payment';
export type CallStatus = 'pending' | 'accepted' | 'completed';

export interface CouponConfig {
  id: string;
  code: string;
  discount_type: 'percent' | 'flat';
  discount_value: number;
  min_order_amount?: number;
  is_active: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  owner_name: string;
  owner_mobile: string;
  contact_mobile?: string;
  password_hash?: string;
  logo: string;
  banner: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  maps_location_url?: string;
  contact_email?: string;
  whatsapp_number?: string;
  gst?: string;
  fssai?: string;
  business_hours: string;
  weekly_closing_day?: string;
  short_description?: string;
  detailed_description?: string;
  about_us?: string;
  enabled_services?: string[];
  privacy_policy?: string;
  terms_conditions?: string;
  refund_cancellation_policy?: string;
  shipping_delivery_policy?: string;
  contact_us_info?: string;
  payment_mode: PaymentMode; // 'demo' | 'live'
  live_gateway?: 'razorpay' | 'phonepe';
  razorpay_key: string;
  razorpay_secret: string;
  phonepe_merchant_id?: string;
  phonepe_salt_key?: string;
  phonepe_salt_index?: string;
  phonepe_env?: 'SANDBOX' | 'PRODUCTION';
  gateway_verified?: boolean;
  gateway_verified_at?: string;
  gateway_status_message?: string;
  // Tax & Extra Charges Settings
  enable_gst?: boolean;
  gst_percentage?: number;
  enable_packaging_charge?: boolean;
  packaging_charge_amount?: number;
  enable_service_charge?: boolean;
  service_charge_percentage?: number;
  // Online Payment Discount & Coupons
  enable_online_discount?: boolean;
  online_discount_percentage?: number;
  enable_coupons?: boolean;
  coupons?: CouponConfig[];
  // Allowed Payment Options
  enable_cash_payment?: boolean;
  enable_online_payment?: boolean;
  enable_split_payment?: boolean;
  status: RestaurantStatus;
  trial_start: string;
  trial_end: string;
  subscription_start: string;
  subscription_end: string;
  monthly_subscription_fee?: number;
  trial_days?: number;
  trial_status?: 'off' | 'active' | 'expired';
  trial_granted_by?: string;
  free_offer_status?: 'off' | 'active' | 'expired';
  free_offer_days?: number;
  free_offer_start?: string;
  free_offer_end?: string;
  free_offer_granted_by?: string;
  theme: string;
  language: Language;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: string;
  restaurant_id: string;
  name: string;
  mobile: string;
  password_hash?: string;
  role: 'waiter' | 'kitchen' | 'manager';
  status: 'active' | 'disabled';
  last_login?: string;
  created_at: string;
}

export interface Table {
  id: string;
  restaurant_id: string;
  table_number: string;
  short_code: string;
  qr_url: string;
  status: TableStatus;
  current_session_id?: string;
  created_at: string;
}

export interface TableSession {
  id: string;
  restaurant_id: string;
  table_id: string;
  table_number: string;
  customer_mobile?: string;
  device_fingerprint?: string;
  join_pin?: string; // 4-digit Friend Code
  friend_code?: string; // Alias for join_pin
  members_count?: number; // Up to 4 customers
  status: SessionStatus;
  started_at: string;
  ended_at?: string;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
  is_hidden: boolean;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  prep_time: number; // in minutes
  is_veg: boolean;
  is_available: boolean;
  is_popular: boolean;
  is_recommended: boolean;
  spicy_level: number; // 0-3
  sort_order: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_id: string;
  menu_name: string;
  quantity: number;
  price: number;
  special_instructions?: string;
}

export interface Order {
  id: string;
  restaurant_id: string;
  table_id?: string;
  session_id: string;
  table_number: string;
  order_number: string; // e.g. #001
  payment_mode: OrderPaymentMode;
  payment_status: OrderPaymentStatus;
  online_amount?: number;
  cash_amount?: number;
  cash_due?: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  notes?: string;
  order_status: OrderStatus;
  subtotal: number;
  tax: number;
  discount: number;
  packaging_charge?: number;
  service_charge?: number;
  online_discount?: number;
  coupon_discount?: number;
  coupon_code?: string;
  grand_total: number;
  customer_mobile?: string;
  items: OrderItem[];
  verified_by?: string;
  verified_staff_id?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  restaurant_id: string;
  order_id: string;
  amount: number;
  mode: OrderPaymentMode;
  payment_status: OrderPaymentStatus;
  transaction_id: string;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  restaurant_id: string;
  order_id: string;
  table_number: string;
  order_number: string;
  payment_method: 'online' | 'cash' | 'partial';
  amount: number;
  transaction_id: string;
  status: 'paid' | 'pending' | 'partially_paid' | 'failed';
  actor_id?: string;
  actor_type?: 'waiter' | 'owner' | 'customer' | 'system';
  actor_name?: string;
  created_at: string;
}

export interface CustomerFeedback {
  id: string;
  restaurant_id: string;
  order_id: string;
  table_number: string;
  food_rating: number; // 1-5
  service_rating: number;
  cleanliness_rating: number;
  overall_rating: number;
  comment: string;
  created_at: string;
}

export interface CallWaiterRequest {
  id: string;
  restaurant_id: string;
  session_id: string;
  table_number: string;
  request_type: RequestType;
  status: CallStatus;
  accepted_by?: string;
  accepted_by_name?: string;
  accepted_at?: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  restaurant_id: string;
  user_role: string;
  user_name: string;
  action: string;
  details: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  restaurant_id?: string;
  order_id?: string;
  table_id?: string;
  session_id?: string;
  actor_type: 'ceo' | 'owner' | 'staff' | 'customer';
  actor_id?: string;
  actor_name: string;
  actor_role?: string;
  action: string;
  previous_status?: string;
  new_status?: string;
  description?: string;
  ip?: string;
  device?: string;
  created_at: string;
}

export interface SubscriptionHistory {
  id: string;
  restaurant_id: string;
  plan_name?: string;
  amount: number;
  duration_months?: number;
  days_added?: number;
  payment_id?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  start_date?: string;
  end_date?: string;
  previous_expiry?: string;
  new_expiry?: string;
  payment_status: string;
  payment_mode?: string;
  subscription_type?: string;
  granted_by?: string;
  reason?: string;
  created_at: string;
}

export interface CeoRazorpayConfig {
  razorpay_key_id: string;
  razorpay_key_secret: string;
  mode: 'demo' | 'live';
  primary_gateway?: 'razorpay' | 'phonepe' | 'demo';
  phonepe_merchant_id?: string;
  phonepe_salt_key?: string;
  phonepe_salt_index?: string;
  phonepe_env?: 'SANDBOX' | 'PRODUCTION';
  phonepe_verified?: boolean;
  phonepe_verified_at?: string;
  razorpay_verified?: boolean;
  razorpay_verified_at?: string;
}

export type CeoPaymentConfig = CeoRazorpayConfig;

export interface RestaurantWebsiteSettings {
  id?: string;
  restaurant_id: string;
  about_us?: string;
  description?: string;
  cover_banner?: string;
  google_map_embed_url?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  opening_time?: string;
  closing_time?: string;
  weekly_closed_day?: string;
  gallery_urls?: string[];
  facilities?: string[];
  special_offers?: { title: string; code?: string; discount?: string; description?: string }[];
  booking_info?: string;
  website_url?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  updated_at?: string;
}

export interface RestaurantServiceItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  duration?: string;
  availability: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface RestaurantPricingItem {
  id: string;
  restaurant_id: string;
  service_name: string;
  price: number;
  offer_price?: number;
  unit: string;
  description?: string;
  show_price: boolean;
  is_active: boolean;
  created_at?: string;
}

export interface RestaurantLegalPages {
  id?: string;
  restaurant_id: string;
  privacy_policy?: string;
  terms_conditions?: string;
  refund_policy?: string;
  cancellation_policy?: string;
  shipping_policy?: string;
  return_policy?: string;
  grievance_contact?: string;
  disclaimer?: string;
  updated_at?: string;
}

export interface RestaurantSocialLinks {
  id?: string;
  restaurant_id: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
  google_business?: string;
  updated_at?: string;
}


export type NotificationEventType = 
  | 'new_order'
  | 'order_accepted'
  | 'order_rejected'
  | 'cooking'
  | 'kitchen_ready'
  | 'order_served'
  | 'order_completed'
  | 'order_cancelled'
  | 'call_waiter'
  | 'cash_request'
  | 'payment_confirmed'
  | 'payment_failed'
  | 'customer_joined'
  | 'customer_request'
  | 'general';

export interface AppNotification {
  id: string;
  restaurant_id?: string;
  type: NotificationEventType;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  order_id?: string;
  table_number?: string;
  target_roles?: ('owner' | 'waiter' | 'kitchen' | 'ceo' | 'customer')[];
}

export interface DigiMomsSubscriptionPayment {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  subscription_id: string;
  gateway: 'phonepe' | 'razorpay' | 'demo';
  transaction_id: string;
  amount: number;
  billing_period: string; // e.g. '1_month'
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  payment_mode: 'demo' | 'live';
  gateway_reference?: string;
  checksum_verified?: boolean;
  created_at: string;
  confirmed_at?: string;
  error_message?: string;
}


