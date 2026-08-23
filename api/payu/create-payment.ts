import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      amount,
      restaurant_id,
      restaurant_name,
      order_id,
      customer_name,
      customer_email,
      mobile,
      payu_key,
      payu_salt,
      env = 'TEST',
      product_info,
      udf1 = '',
      udf2 = '',
      udf3 = '',
      udf4 = '',
      udf5 = '',
      surl,
      furl
    } = req.body || {};

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid payment amount' });
    }

    const key = (payu_key || process.env.PAYU_MERCHANT_KEY || 'jTiqzx').trim();
    const salt = (payu_salt || process.env.PAYU_MERCHANT_SALT || 'Jp0apIqb5nstR9XDyQyVxM824YoRQ737').trim();
    const isLive = env === 'LIVE';

    const txnid = order_id
      ? `ORD_${(order_id || '').substring(0, 8)}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      : `SUB_${(restaurant_id || 'rest').substring(0, 8)}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const formattedAmount = Number(amount).toFixed(2);
    const productinfo = (product_info || (order_id ? `Order Payment ${order_id}` : `DigiMoms Subscription ${restaurant_name || ''}`)).trim();
    const firstname = (customer_name || (restaurant_name || 'Customer')).trim().replace(/[^a-zA-Z0-9 ]/g, '') || 'Customer';
    const email = (customer_email || 'customer@digimoms.in').trim();
    const phone = (mobile || '9999999999').trim();

    // PayU Standard Hash Sequence:
    // sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt)
    const hashSequence = `${key}|${txnid}|${formattedAmount}|${productinfo}|${firstname}|${email}|${udf1 || (restaurant_id || '')}|${udf2 || (order_id || '')}|${udf3}|${udf4}|${udf5}||||||${salt}`;
    const hash = crypto.createHash('sha512').update(hashSequence).digest('hex');

    const actionUrl = isLive
      ? 'https://secure.payu.in/_payment'
      : 'https://test.payu.in/_payment';

    const origin = req.headers.origin || (req.headers.host ? `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}` : 'http://localhost:3000');

    return res.status(200).json({
      success: true,
      actionUrl,
      mode: isLive ? 'live' : 'demo',
      txnid,
      hash,
      merchantKey: key,
      params: {
        key,
        txnid,
        amount: formattedAmount,
        productinfo,
        firstname,
        email,
        phone,
        surl: surl || `${origin}/api/payu/callback`,
        furl: furl || `${origin}/api/payu/callback`,
        udf1: udf1 || (restaurant_id || ''),
        udf2: udf2 || (order_id || ''),
        udf3,
        udf4,
        udf5,
        hash,
        service_provider: 'payu_paisa'
      }
    });
  } catch (err: any) {
    console.error('Vercel PayU create-payment error:', err);
    return res.status(500).json({ error: 'Failed to create PayU payment request' });
  }
}
