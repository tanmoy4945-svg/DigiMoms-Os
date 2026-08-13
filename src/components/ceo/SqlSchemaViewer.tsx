import React, { useState } from 'react';
import { Database, Copy, Check, Shield } from 'lucide-react';

export const SqlSchemaViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const fullSqlScript = `-- ==========================================================
-- DIGIMOMS SMART RESTAURANT OS - MASTER SUPABASE SQL SCHEMA
-- Project URL: https://qjkoeehgkfnailgmhyjs.supabase.co
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. RESTAURANTS TABLE
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    owner_mobile VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    logo TEXT,
    banner TEXT,
    address TEXT,
    gst VARCHAR(50),
    fssai VARCHAR(50),
    business_hours VARCHAR(100) DEFAULT '10:00 AM - 10:00 PM',
    payment_mode VARCHAR(20) DEFAULT 'demo', -- 'demo' | 'live'
    razorpay_key TEXT,
    razorpay_secret TEXT,
    status VARCHAR(20) DEFAULT 'inactive', -- 'trial'|'active'|'expired'|'suspended'|'maintenance'|'archived'|'inactive'
    trial_days INT DEFAULT 0,
    trial_status VARCHAR(20) DEFAULT 'off', -- 'off' | 'active' | 'expired'
    trial_start TIMESTAMPTZ DEFAULT NOW(),
    trial_end TIMESTAMPTZ DEFAULT NOW(),
    trial_granted_by VARCHAR(100),
    free_offer_status VARCHAR(20) DEFAULT 'off', -- 'off' | 'active' | 'expired'
    free_offer_days INT DEFAULT 0,
    free_offer_start TIMESTAMPTZ DEFAULT NOW(),
    free_offer_end TIMESTAMPTZ DEFAULT NOW(),
    free_offer_granted_by VARCHAR(100),
    subscription_start TIMESTAMPTZ DEFAULT NOW(),
    subscription_end TIMESTAMPTZ DEFAULT NOW(),
    theme VARCHAR(50) DEFAULT 'dark-glass',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. STAFF TABLE
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'waiter' | 'kitchen' | 'manager'
    status VARCHAR(20) DEFAULT 'active',
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_staff_mobile_per_rest UNIQUE(restaurant_id, mobile)
);

-- 3. TABLES TABLE
CREATE TABLE IF NOT EXISTS public.tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_number VARCHAR(50) NOT NULL,
    short_code VARCHAR(20) NOT NULL UNIQUE,
    qr_url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'available', -- 'available'|'occupied'|'cleaning'|'reserved'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_table_per_rest UNIQUE(restaurant_id, table_number)
);

-- 4. TABLE SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.table_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
    table_number VARCHAR(50) NOT NULL,
    customer_mobile VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active', -- 'active' | 'closed'
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- 5. MENU CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 1,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. MENU ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    prep_time INT DEFAULT 15,
    is_veg BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    is_recommended BOOLEAN DEFAULT FALSE,
    spicy_level INT DEFAULT 0,
    sort_order INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.table_sessions(id),
    table_number VARCHAR(50) NOT NULL,
    order_number VARCHAR(50) NOT NULL,
    payment_mode VARCHAR(20) DEFAULT 'cash', -- 'cash' | 'demo' | 'online'
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'paid_demo' | 'paid_live'
    order_status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'accepted' | 'cooking' | 'ready' | 'served' | 'completed' | 'cancelled'
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    grand_total DECIMAL(10,2) NOT NULL,
    customer_mobile VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_id UUID REFERENCES public.menus(id) ON DELETE SET NULL,
    menu_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    special_instructions TEXT
);

-- 9. CUSTOMER FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS public.customer_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id),
    table_number VARCHAR(50),
    food_rating INT DEFAULT 5,
    service_rating INT DEFAULT 5,
    cleanliness_rating INT DEFAULT 5,
    overall_rating DECIMAL(3,2) DEFAULT 5.0,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CALL WAITER REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.call_waiter (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.table_sessions(id),
    table_number VARCHAR(50) NOT NULL,
    request_type VARCHAR(50) DEFAULT 'call', -- 'call'|'water'|'spoon'|'tissue'|'cleaning'|'bill'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending'|'accepted'|'completed'
    accepted_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_tables_short_code ON public.tables(short_code);
CREATE INDEX IF NOT EXISTS idx_orders_rest_id ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menus_rest_id ON public.menus(restaurant_id);

-- ROW LEVEL SECURITY (RLS) POLICIES & FULL ACCESS GRANTS
ALTER TABLE public.restaurants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus DISABLE ROW LEVEL SECURITY;
-- 11. RESTAURANT WALLET TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.restaurant_wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL, -- 'cash' | 'online'
    status VARCHAR(20) DEFAULT 'credited',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_wallet_order_tx UNIQUE(order_id)
);

-- 12. CEO SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.ceo_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    razorpay_key_id TEXT,
    razorpay_key_secret TEXT,
    mode VARCHAR(20) DEFAULT 'demo',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. SUBSCRIPTION HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.subscription_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) DEFAULT 'Monthly Standard',
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    duration_months INT DEFAULT 1,
    days_added INT DEFAULT 0,
    payment_id VARCHAR(255),
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    previous_expiry TIMESTAMPTZ,
    new_expiry TIMESTAMPTZ,
    payment_status VARCHAR(50) NOT NULL, -- 'paid' | 'not_required' | 'trial_granted' | 'failed'
    payment_mode VARCHAR(20) DEFAULT 'demo', -- 'demo' | 'live' | 'free'
    subscription_type VARCHAR(50) DEFAULT 'RENEWAL', -- 'RENEWAL' | 'CEO_FREE_EXTENSION' | 'TRIAL'
    granted_by VARCHAR(100),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. RESTAURANT WEBSITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.restaurant_website_settings (
    restaurant_id UUID PRIMARY KEY REFERENCES public.restaurants(id) ON DELETE CASCADE,
    about_us TEXT,
    description TEXT,
    cover_banner TEXT,
    google_map_embed_url TEXT,
    phone VARCHAR(30),
    whatsapp VARCHAR(30),
    email VARCHAR(255),
    opening_time VARCHAR(30),
    closing_time VARCHAR(30),
    weekly_closed_day VARCHAR(30),
    gallery_urls JSONB DEFAULT '[]'::jsonb,
    facilities JSONB DEFAULT '[]'::jsonb,
    special_offers JSONB DEFAULT '[]'::jsonb,
    booking_info TEXT,
    website_url TEXT,
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. RESTAURANT SERVICES TABLE
CREATE TABLE IF NOT EXISTS public.restaurant_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) DEFAULT 0,
    image TEXT,
    duration VARCHAR(50),
    availability VARCHAR(100) DEFAULT 'Available Daily',
    sort_order INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. RESTAURANT PRICING TABLE
CREATE TABLE IF NOT EXISTS public.restaurant_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    service_name VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) DEFAULT 0,
    offer_price NUMERIC(10, 2),
    unit VARCHAR(50) DEFAULT 'per service',
    description TEXT,
    show_price BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. RESTAURANT LEGAL PAGES TABLE
CREATE TABLE IF NOT EXISTS public.restaurant_legal_pages (
    restaurant_id UUID PRIMARY KEY REFERENCES public.restaurants(id) ON DELETE CASCADE,
    privacy_policy TEXT,
    terms_conditions TEXT,
    refund_policy TEXT,
    cancellation_policy TEXT,
    shipping_policy TEXT,
    return_policy TEXT,
    grievance_contact TEXT,
    disclaimer TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. RESTAURANT SOCIAL LINKS TABLE
CREATE TABLE IF NOT EXISTS public.restaurant_social_links (
    restaurant_id UUID PRIMARY KEY REFERENCES public.restaurants(id) ON DELETE CASCADE,
    instagram TEXT,
    facebook TEXT,
    twitter TEXT,
    youtube TEXT,
    linkedin TEXT,
    google_business TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_waiter DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_wallet_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ceo_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_website_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_pricing DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_legal_pages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_social_links DISABLE ROW LEVEL SECURITY;

-- PERMISSIVE POLICIES IF RLS IS ENABLED
DROP POLICY IF EXISTS "Public Read Restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Public Read Menus" ON public.menus;
DROP POLICY IF EXISTS "Public Read Tables" ON public.tables;

CREATE POLICY "Allow All Restaurants" ON public.restaurants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Staff" ON public.staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Tables" ON public.tables FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Table Sessions" ON public.table_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Categories" ON public.menu_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Menus" ON public.menus FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Order Items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Feedback" ON public.customer_feedback FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Call Waiter" ON public.call_waiter FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Website Settings" ON public.restaurant_website_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Services" ON public.restaurant_services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Pricing" ON public.restaurant_pricing FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Legal Pages" ON public.restaurant_legal_pages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Social Links" ON public.restaurant_social_links FOR ALL USING (true) WITH CHECK (true);
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullSqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-purple-400" />
          <div>
            <h3 className="text-lg font-bold text-white">Supabase SQL Schema Script</h3>
            <p className="text-xs text-slate-400">Target Project: https://qjkoeehgkfnailgmhyjs.supabase.co</p>
          </div>
        </div>

        <button
          onClick={copyToClipboard}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition-all"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'SQL Copied!' : 'Copy SQL Migration Script'}
        </button>
      </div>

      <div className="relative">
        <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto max-h-96 custom-scrollbar">
          {fullSqlScript}
        </pre>
      </div>
    </div>
  );
};
