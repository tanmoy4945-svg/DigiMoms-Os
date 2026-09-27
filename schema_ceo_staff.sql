-- =======================================================
-- DIGIMOMS SAAS - CEO STAFF MEMBERS TABLE SCHEMA
-- Execute this SQL in your Supabase SQL Editor
-- =======================================================

CREATE TABLE IF NOT EXISTS public.ceo_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  mobile VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'manager',
  status VARCHAR(50) DEFAULT 'active',
  permissions JSONB DEFAULT '{}'::jsonb,
  last_password_change TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ceo_staff ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (or authenticated)
CREATE POLICY "Allow public read access to ceo staff" ON public.ceo_staff FOR SELECT USING (true);
CREATE POLICY "Allow public insert to ceo staff" ON public.ceo_staff FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to ceo staff" ON public.ceo_staff FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to ceo staff" ON public.ceo_staff FOR DELETE USING (true);
