import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qjkoeehgkfnailgmhyjs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TMLOZVNYis6bZInTdfWJ3Q_BJ1kiuih';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSupabase() {
  console.log("Checking restaurants...");
  const { data: r, error: rErr } = await supabase.from('restaurants').select('*');
  console.log("Restaurants count:", r?.length, "Error:", rErr);

  // Can we update a restaurant?
  if (r && r.length > 0) {
    const testId = r[0].id;
    const { data: uData, error: uErr } = await supabase.from('restaurants').update({
      payment_mode: 'live',
      razorpay_key: 'test_key',
      razorpay_secret: 'test_secret'
    }).eq('id', testId).select();
    console.log("Restaurant update test:", uData, "Error:", uErr);
  }

  // Can we store JSON metadata or configuration in existing tables or columns?
  // Let's check table columns of all existing tables:
  // restaurants, staff, menu_categories, tables, table_sessions, orders, order_items
  const tables = ['restaurants', 'staff', 'menu_categories', 'tables', 'table_sessions', 'orders', 'order_items'];
  for (const t of tables) {
    const { data } = await supabase.from(t).select('*').limit(1);
    if (data && data[0]) {
      console.log(`Table ${t} columns:`, Object.keys(data[0]));
    }
  }
}

testSupabase();
