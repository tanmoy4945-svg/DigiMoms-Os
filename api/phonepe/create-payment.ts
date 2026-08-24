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
      mobile,
      merchant_id,
      salt_key,
      salt_index = '1',
      env = 'SANDBOX',
      mode = 'demo'
    } = req.body || {};

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid payment amount' });
    }

    const merchantId = (merchant_id || process.env.PHONEPE_MERCHANT_ID || 'M22PHONEPE').trim();
    const saltKey = (salt_key || process.env.PHONEPE_SALT_KEY || 'test-salt-key-phonepe-secret').trim();
    const saltIndex = (salt_index || process.env.PHONEPE_SALT_INDEX || '1').toString().trim();
    const isLive = env === 'PRODUCTION' || mode === 'live';

    const merchantTransactionId = order_id
      ? `ORD_${(order_id || '').substring(0, 8)}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      : `SUB_${(restaurant_id || 'rest').substring(0, 8)}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const amountInPaise = Math.round(Number(amount) * 100);
    const origin = req.headers.origin || (req.headers.host ? `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}` : 'http://localhost:3000');
    const redirectUrl = `${origin}/api/phonepe/callback`;

    const payload = {
      merchantId,
      merchantTransactionId,
      merchantUserId: `MUID_${(mobile || '9999999999').replace(/[^0-9]/g, '') || '9999999999'}`,
      amount: amountInPaise,
      redirectUrl,
      redirectMode: 'POST',
      callbackUrl: redirectUrl,
      mobileNumber: (mobile || '9999999999').replace(/[^0-9]/g, ''),
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const stringToHash = base64Payload + '/pg/v1/pay' + saltKey;
    const checksum = crypto.createHash('sha256').update(stringToHash).digest('hex') + '###' + saltIndex;

    const baseUrl = isLive
      ? 'https://api.phonepe.com/apis/hermes'
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

    if (isLive && saltKey.length >= 10 && merchantId !== 'M22PHONEPE' && merchantId !== 'DIGIMOMS_ONLINE') {
      try {
        const response = await fetch(`${baseUrl}/pg/v1/pay`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': checksum,
            'accept': 'application/json'
          },
          body: JSON.stringify({ request: base64Payload })
        });

        const data: any = await response.json();
        if (response.ok && data.success && data.data?.instrumentResponse?.redirectInfo?.url) {
          return res.status(200).json({
            success: true,
            payUrl: data.data.instrumentResponse.redirectInfo.url,
            merchantTransactionId,
            merchantId,
            mode: 'live'
          });
        }
      } catch (phonePeErr) {
        console.warn('PhonePe live initiate warning:', phonePeErr);
      }
    }

    // Standard / Sandbox Simulator Response
    return res.status(200).json({
      success: true,
      mode: isLive ? 'live' : 'demo',
      merchantTransactionId,
      merchantId,
      base64Payload,
      checksum,
      amount: Number(amount)
    });
  } catch (err: any) {
    console.error('PhonePe create-payment error:', err);
    return res.status(500).json({ error: 'Failed to create PhonePe payment request' });
  }
}
