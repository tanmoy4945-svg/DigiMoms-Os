import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qjkoeehgkfnailgmhyjs.supabase.co';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_TMLOZVNYis6bZInTdfWJ3Q_BJ1kiuih';

// Robust URL cleaning to prevent double /rest/v1 or trailing slashes
export const SUPABASE_URL = String(rawUrl || '')
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/rest\/v1\/?$/i, '')
  .replace(/\/+$/, '');

export const SUPABASE_ANON_KEY = String(rawKey || '').trim();

if (!SUPABASE_URL.startsWith('http')) {
  console.warn('[Supabase] URL does not start with http/https. This might cause fetch errors.');
}


export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

