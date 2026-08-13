import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qjkoeehgkfnailgmhyjs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TMLOZVNYis6bZInTdfWJ3Q_BJ1kiuih';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectRestaurants() {
  const { data, error } = await supabase.from('restaurants').select('*');
  console.log('Error:', error);
  console.log('Rows in restaurants:', data);
}

inspectRestaurants();
