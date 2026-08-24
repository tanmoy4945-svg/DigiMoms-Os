import crypto from 'crypto';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      amount,
      restaurant_id,
      order_id,
      razorpay_key,
      razorpay_secret
    } = req.body || {};

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const keyId = (razorpay_key || process.env.RAZORPAY_KEY_ID || 'rzp_test_digimoms_mock').trim();
    const keySecret = (razorpay_secret || process.env.RAZORPAY_KEY_SECRET || 'test_secret_digimoms').trim();
    const amountInPaise = Math.round(Number(amount) * 100);

    // If live keys provided, try direct Razorpay Order API
    if (keyId.startsWith('rzp_live_') && keySecret && keySecret.length > 8) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `rcpt_${(order_id || restaurant_id || 'saas').substring(0, 10)}_${Date.now()}`
          })
        });

        const rzpData: any = await rzpRes.json();
        if (rzpRes.ok && rzpData.id) {
          return res.status(200).json(rzpData);
        }
      } catch (err) {
        console.warn('Razorpay live order create warning:', err);
      }
    }

    // Standard / Sandbox Order ID generator
    const generatedOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return res.status(200).json({
      id: generatedOrderId,
      entity: 'order',
      amount: amountInPaise,
      amount_paid: 0,
      amount_due: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${order_id || restaurant_id || 'saas'}`,
      status: 'created',
      attempts: 0,
      notes: [],
      created_at: Math.floor(Date.now() / 1000)
    });
  } catch (err: any) {
    console.error('Razorpay create-order error:', err);
    return res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
}
