-- =======================================================
-- DIGIMOMS SAAS - PUBLIC RESTAURANT WEBSITE TABLES SCHEMA
-- Execute this SQL in Supabase SQL Editor if tables do not exist
-- =======================================================

-- 1. Restaurant Website Settings Table
CREATE TABLE IF NOT EXISTS public.restaurant_website_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  about_us TEXT,
  description TEXT,
  opening_time VARCHAR(50) DEFAULT '10:00 AM',
  closing_time VARCHAR(50) DEFAULT '10:00 PM',
  weekly_closed_day VARCHAR(50) DEFAULT 'None',
  phone VARCHAR(50),
  whatsapp VARCHAR(50),
  email VARCHAR(100),
  google_map_embed_url TEXT,
  gallery_urls TEXT[],
  seo_title VARCHAR(255),
  seo_description TEXT,
  seo_keywords TEXT,
  booking_info TEXT,
  website_url VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Restaurant Services Table
CREATE TABLE IF NOT EXISTS public.restaurant_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price NUMERIC(10,2) DEFAULT 0,
  image VARCHAR(500),
  duration VARCHAR(50),
  availability VARCHAR(100) DEFAULT 'Available Daily',
  sort_order INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Restaurant Pricing Table
CREATE TABLE IF NOT EXISTS public.restaurant_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  service_name VARCHAR(150) NOT NULL,
  price NUMERIC(10,2) DEFAULT 0,
  offer_price NUMERIC(10,2) DEFAULT 0,
  unit VARCHAR(50) DEFAULT 'per service',
  description TEXT,
  show_price BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Restaurant Legal Pages Table
CREATE TABLE IF NOT EXISTS public.restaurant_legal_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  privacy_policy TEXT,
  terms_conditions TEXT,
  refund_policy TEXT,
  cancellation_policy TEXT,
  shipping_policy TEXT,
  return_policy TEXT,
  grievance_contact TEXT,
  disclaimer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Restaurant Social Links Table
CREATE TABLE IF NOT EXISTS public.restaurant_social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  instagram VARCHAR(255),
  facebook VARCHAR(255),
  twitter VARCHAR(255),
  youtube VARCHAR(255),
  linkedin VARCHAR(255),
  google_business VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and add public access policies
ALTER TABLE public.restaurant_website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_legal_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to website settings" ON public.restaurant_website_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert to website settings" ON public.restaurant_website_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to website settings" ON public.restaurant_website_settings FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to services" ON public.restaurant_services FOR SELECT USING (true);
CREATE POLICY "Allow public insert to services" ON public.restaurant_services FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to services" ON public.restaurant_services FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to services" ON public.restaurant_services FOR DELETE USING (true);

CREATE POLICY "Allow public read access to pricing" ON public.restaurant_pricing FOR SELECT USING (true);
CREATE POLICY "Allow public insert to pricing" ON public.restaurant_pricing FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to pricing" ON public.restaurant_pricing FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to pricing" ON public.restaurant_pricing FOR DELETE USING (true);

CREATE POLICY "Allow public read access to legal pages" ON public.restaurant_legal_pages FOR SELECT USING (true);
CREATE POLICY "Allow public insert to legal pages" ON public.restaurant_legal_pages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to legal pages" ON public.restaurant_legal_pages FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to social links" ON public.restaurant_social_links FOR SELECT USING (true);
CREATE POLICY "Allow public insert to social links" ON public.restaurant_social_links FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to social links" ON public.restaurant_social_links FOR UPDATE USING (true);
