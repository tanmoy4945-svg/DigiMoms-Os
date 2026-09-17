import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const tables = [
    'restaurants', 'staff', 'tables', 'table_sessions', 'menu_categories',
    'menus', 'orders', 'order_items', 'customer_feedback', 'call_waiter',
    'audit_logs', 'payment_transactions', 'subscription_history', 'ceo_settings'
];

async function run() {
    for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error && error.code === 'PGRST205') {
            console.log(table, "--> MISSING");
        } else if (error) {
            console.log(table, "--> Error:", error.message);
        } else {
            console.log(table, "--> EXISTS");
        }
    }
}
run();
