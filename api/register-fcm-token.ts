import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://qjkoeehgkfnailgmhyjs.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_TMLOZVNYis6bZInTdfWJ3Q_BJ1kiuih';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req: any, res: any) {
  // Set CORS headers
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
    const { restaurant_id, restaurantId, token } = req.body || {};
    const targetRestId = restaurant_id || restaurantId;

    if (!targetRestId || !token) {
      return res.status(400).json({ error: 'Missing restaurant_id or token' });
    }

    const tokensToSave = Array.isArray(token) ? token : [token];
    const cleanTokens = tokensToSave.filter(t => typeof t === 'string' && t.trim().length > 5);

    if (cleanTokens.length === 0) {
      return res.status(400).json({ error: 'No valid tokens provided' });
    }

    // Persist to Supabase audit_logs as PUSH_TOKEN_REGISTRATION
    const id = crypto.randomUUID();
    const { error: dbErr } = await supabase.from('audit_logs').insert([{
      id,
      restaurant_id: targetRestId,
      actor_type: 'system',
      action: 'PUSH_TOKEN_REGISTRATION',
      description: JSON.stringify({ tokens: cleanTokens, updated_at: new Date().toISOString() })
    }]);

    if (dbErr) {
      console.warn('[Vercel API register-fcm-token] DB insert warning:', dbErr);
    }

    return res.status(200).json({ 
      success: true, 
      restaurantId: targetRestId, 
      tokenCount: cleanTokens.length 
    });
  } catch (err: any) {
    console.error('[Vercel API register-fcm-token] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
