export default async function handler(req: any, res: any) {
  try {
    const defaultCfg = {
      primary_gateway: 'payu',
      mode: 'demo',
      phonepe_merchant_id: '',
      phonepe_salt_key: '',
      phonepe_salt_index: '1',
      phonepe_env: 'SANDBOX',
      phonepe_verified: false,
      razorpay_key_id: '',
      razorpay_key_secret: '',
      razorpay_verified: false,
      payu_merchant_key: '',
      payu_merchant_salt: '',
      payu_env: 'TEST',
      payu_verified: false
    };

    if (req.method === 'POST') {
      const body = req.body || {};
      const updated = {
        ...defaultCfg,
        ...body,
        updated_at: new Date().toISOString()
      };
      return res.status(200).json({ success: true, data: updated });
    }

    return res.status(200).json({ success: true, data: defaultCfg });
  } catch (err: any) {
    return res.status(200).json({ success: true, data: {} });
  }
}
