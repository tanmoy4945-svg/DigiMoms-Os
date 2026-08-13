import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://qjkoeehgkfnailgmhyjs.supabase.co';
const rawKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_TMLOZVNYis6bZInTdfWJ3Q_BJ1kiuih';

// Strip any trailing slashes or /rest/v1 from SUPABASE_URL to avoid URL duplication in postgrest and realtime
export const SUPABASE_URL = String(rawUrl)
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/rest\/v1\/?$/i, '')
  .replace(/\/+$/, '');

export const SUPABASE_ANON_KEY = String(rawKey).trim();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

