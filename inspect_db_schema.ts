import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qjkoeehgkfnailgmhyjs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TMLOZVNYis6bZInTdfWJ3Q_BJ1kiuih';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectTables() {
  const t1 = await supabase.from('ceo_payment_settings').select('*');
  console.log('ceo_payment_settings:', t1.data, 'Error:', t1.error);

  const t2 = await supabase.from('payment_transactions').select('*').limit(3);
  console.log('payment_transactions:', t2.data, 'Error:', t2.error);

  const t4 = await supabase.from('staff').select('*').limit(1);
  console.log('staff sample keys:', t4.data ? Object.keys(t4.data[0] || {}) : null);
}

inspectTables();
