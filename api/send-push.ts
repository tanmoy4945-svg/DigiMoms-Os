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
    const { restaurantId, restaurant_id, title, body, data } = req.body || {};
    const targetRestId = restaurantId || restaurant_id;

    if (!targetRestId) {
      return res.status(400).json({ error: 'Missing restaurantId' });
    }

    // Fetch registered push tokens from Supabase audit_logs
    const { data: logs } = await supabase
      .from('audit_logs')
      .select('description')
      .eq('restaurant_id', targetRestId)
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

    const allTokens = Array.from(tokenSet);
    if (allTokens.length === 0) {
      return res.status(200).json({ success: false, reason: 'no_tokens_found' });
    }

    const expoTokens = allTokens.filter(t => t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['));
    let expoResults = null;

    if (expoTokens.length > 0) {
      const messages = expoTokens.map(tok => ({
        to: tok,
        sound: 'default',
        title: title || '🔔 DigiMoms Alert',
        body: body || 'New update available',
        channelId: 'orders',
        priority: 'high',
        _displayInForeground: true,
        data: { ...(data || {}), restaurantId: targetRestId }
      }));

      const expResp = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      expoResults = await expResp.json();
    }

    return res.status(200).json({
      success: true,
      deliveredTo: allTokens.length,
      expoTokensCount: expoTokens.length,
      expoResults
    });
  } catch (err: any) {
    console.error('[Vercel API send-push] Error:', err);
    return res.status(500).json({ error: err.message || 'Push dispatch failed' });
  }
}
