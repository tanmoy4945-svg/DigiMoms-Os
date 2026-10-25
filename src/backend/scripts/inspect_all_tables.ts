import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qjkoeehgkfnailgmhyjs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TMLOZVNYis6bZInTdfWJ3Q_BJ1kiuih';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const candidateTables = [
  'restaurants',
  'staff',
  'menu_categories',
  'menu_items',
  'tables',
  'table_sessions',
  'orders',
  'order_items',
  'audit_logs',
  'coupons',
  'subscription_history',
  'ceo_payment_settings',
  'payment_transactions',
  'website_settings',
  'app_settings',
  'settings'
];

async function checkAllTables() {
  for (const t of candidateTables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`Table '${t}': NOT FOUND or ERROR: ${error.message} (${error.code})`);
    } else {
      console.log(`Table '${t}': EXISTS (sample count/row returned: ${data?.length})`);
    }
  }
}

checkAllTables();
