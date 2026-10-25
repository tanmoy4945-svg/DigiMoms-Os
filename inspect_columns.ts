import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qjkoeehgkfnailgmhyjs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TMLOZVNYis6bZInTdfWJ3Q_BJ1kiuih';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectColumns() {
  const o = await supabase.from('orders').select('*').limit(1);
  console.log('orders columns:', o.data ? Object.keys(o.data[0] || {}) : null);

  const r = await supabase.from('restaurants').select('*').limit(1);
  console.log('restaurants columns:', r.data ? Object.keys(r.data[0] || {}) : null);
}

inspectColumns();
