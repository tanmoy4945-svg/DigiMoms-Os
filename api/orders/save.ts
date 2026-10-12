import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://qjkoeehgkfnailgmhyjs.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_TMLOZVNYis6bZInTdfWJ3Q_BJ1kiuih';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const order = req.body;
    if (!order || !order.id || !order.restaurant_id) {
      return res.status(400).json({ error: 'Missing order data' });
    }

    // Trigger push notification to Expo Push
    const isCash = order.payment_mode === 'cash' || order.payment_mode === 'partial';
    const title = isCash ? '💵 New Cash Order' : '🔔 New Order Received';
    const body = `Table ${order.table_number || 'Takeaway'} (Order #${order.order_number}): ₹${order.grand_total}. Please accept!`;

    // Fetch tokens for this restaurant
    const { data: logs } = await supabase
      .from('audit_logs')
      .select('description')
      .eq('restaurant_id', order.restaurant_id)
      .eq('action', 'PUSH_TOKEN_REGISTRATION')
      .order('created_at', { ascending: false })
      .limit(5);

    const tokenSet = new Set<string>();
    if (logs && logs.length > 0) {
      logs.forEach(log => {
        try {
          const parsed = JSON.parse(log.description);
          if (Array.isArray(parsed?.tokens)) {
            parsed.tokens.forEach((t: string) => {
              if (t && typeof t === 'string' && t.trim().length > 5) {
                tokenSet.add(t.trim());
              }
            });
          }
        } catch (e) {}
      });
    }

    const expoTokens = Array.from(tokenSet).filter(t => t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['));
    if (expoTokens.length > 0) {
      const messages = expoTokens.map(tok => ({
        to: tok,
        sound: 'default',
        title,
        body,
        channelId: 'orders',
        priority: 'high',
        _displayInForeground: true,
        data: { orderId: order.id, type: 'new_order', restaurant_id: order.restaurant_id }
      }));

      fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      }).catch(err => console.warn('[Vercel API orders/save] Expo push send warning:', err));
    }

    return res.status(200).json({ success: true, data: order, pushTokensFound: expoTokens.length });
  } catch (err: any) {
    console.error('[Vercel API orders/save] Error:', err);
    return res.status(500).json({ error: err.message || 'Order save error' });
  }
}
