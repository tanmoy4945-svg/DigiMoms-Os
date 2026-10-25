import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qjkoeehgkfnailgmhyjs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TMLOZVNYis6bZInTdfWJ3Q_BJ1kiuih';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkCeoSettings() {
  const { data, error } = await supabase.from('ceo_settings').select('*');
  console.log('ceo_settings data:', data, 'error:', error);
}

checkCeoSettings();
