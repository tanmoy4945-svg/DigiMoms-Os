-- SAFE SQL MIGRATION FOR DIGIMOMS RESTAURANTS PAYMENT SETTINGS
-- Execute this script in your Supabase SQL Editor to add payment settings columns safely.

ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS enable_gst BOOLEAN DEFAULT true;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS gst_percentage NUMERIC DEFAULT 5;

ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS enable_packaging_charge BOOLEAN DEFAULT false;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS packaging_charge_amount NUMERIC DEFAULT 10;

ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS enable_service_charge BOOLEAN DEFAULT false;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS service_charge_percentage NUMERIC DEFAULT 2.5;

ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS enable_online_discount BOOLEAN DEFAULT true;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS online_discount_percentage NUMERIC DEFAULT 5;

ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS enable_coupons BOOLEAN DEFAULT true;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS coupons JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS enable_cash_payment BOOLEAN DEFAULT true;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS enable_online_payment BOOLEAN DEFAULT true;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS enable_split_payment BOOLEAN DEFAULT true;

ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS live_gateway TEXT DEFAULT 'razorpay';
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS phonepe_merchant_id TEXT DEFAULT '';
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS phonepe_salt_key TEXT DEFAULT '';
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS phonepe_salt_index TEXT DEFAULT '1';
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS phonepe_env TEXT DEFAULT 'SANDBOX';

ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS gateway_verified BOOLEAN DEFAULT false;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS gateway_verified_at TEXT DEFAULT '';
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS gateway_status_message TEXT DEFAULT '';
