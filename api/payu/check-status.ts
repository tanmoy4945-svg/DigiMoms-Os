import crypto from 'crypto';

export default async function handler(req: any, res: any) {
  try {
    const txnid = (req.query.txnid as string || '').trim();
    if (!txnid) {
      return res.status(400).json({ success: false, error: 'Missing txnid parameter' });
    }

    const env = ((req.query.env as string) || 'TEST').toUpperCase();
    const key = (req.query.payu_key as string || process.env.PAYU_MERCHANT_KEY || 'jTiqzx').trim();
    const salt = (req.query.payu_salt as string || process.env.PAYU_MERCHANT_SALT || 'Jp0apIqb5nstR9XDyQyVxM824YoRQ737').trim();

    if (key && salt && key !== 'PAYU_TEST_KEY' && salt !== 'PAYU_TEST_SALT') {
      try {
        const verifyCommand = 'verify_payment';
        const verifyHashString = `${key}|${verifyCommand}|${txnid}|${salt}`;
        const verifyHash = crypto.createHash('sha512').update(verifyHashString).digest('hex');

        const verifyApiUrl = env === 'LIVE'
          ? 'https://info.payu.in/merchant/postservice.php?form=2'
          : 'https://test.payu.in/merchant/postservice.php?form=2';

        const formData = new URLSearchParams();
        formData.append('key', key);
        formData.append('command', verifyCommand);
        formData.append('var1', txnid);
        formData.append('hash', verifyHash);

        const response = await fetch(verifyApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString()
        });

        const json: any = await response.json();
        if (json?.status === 1 && json?.transaction_details?.[txnid]) {
          const detail = json.transaction_details[txnid];
          const isSuccess = detail.status === 'success';
          return res.status(200).json({
            success: true,
            verified: isSuccess,
            status: isSuccess ? 'success' : detail.status,
            txnid,
            mihpayid: detail.mihpayid,
            amount: parseFloat(detail.amt || detail.amount || '0'),
            mode: detail.mode || 'live',
            unmappedstatus: detail.unmappedstatus,
            message: detail.error_Message || 'Verified by PayU'
          });
        }
      } catch (postErr) {
        console.warn('PayU Postservice query warning:', postErr);
      }
    }

    return res.status(200).json({
      success: true,
      verified: false,
      status: 'pending',
      txnid,
      message: 'Payment status is pending'
    });
  } catch (err: any) {
    console.error('Vercel PayU check-status error:', err);
    return res.status(500).json({ success: false, error: 'Status check failed' });
  }
}
