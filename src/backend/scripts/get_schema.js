import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
    // try inserting a very minimal record to see what it says
    const res = await supabase.from('subscription_history').insert([{id: 'abc', restaurant_id: 'abc'}]);
    console.log(res.error);
}
run();
