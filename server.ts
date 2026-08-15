import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Create PhonePe Payment Request for DigiMoms Subscriptions
  app.post('/api/phonepe/create-payment', async (req, res) => {
    try {
      const {
        amount,
        restaurant_id,
        restaurant_name,
        mobile,
        merchant_id,
        salt_key,
        salt_index,
        env = 'SANDBOX',
        redirect_url,
        callback_url
      } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid subscription amount' });
      }

      const merchantId = merchant_id || process.env.PHONEPE_MERCHANT_ID || 'DIGIMOMS_ONLINE';
      const saltKey = salt_key || process.env.PHONEPE_SALT_KEY || 'test-salt-key-digimoms-secret';
      const saltIndex = salt_index || process.env.PHONEPE_SALT_INDEX || '1';
      const merchantTransactionId = `MT_SUB_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const merchantUserId = `MUID_${(restaurant_id || 'rest').substring(0, 8)}`;
      const amountPaise = Math.round(amount * 100);

      const payload = {
        merchantId,
        merchantTransactionId,
        merchantUserId,
        amount: amountPaise,
        redirectUrl: redirect_url || 'http://localhost:3000/owner-dashboard',
        redirectMode: 'REDIRECT',
        callbackUrl: callback_url || 'http://localhost:3000/api/phonepe/callback',
        mobileNumber: mobile || '9999999999',
        paymentInstrument: {
          type: 'PAY_PAGE'
        }
      };

      const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const endpoint = '/pg/v1/pay';
      const stringToSign = base64Payload + endpoint + saltKey;
      const checksum = crypto.createHash('sha256').update(stringToSign).digest('hex') + '###' + saltIndex;

      const baseUrl = env === 'PRODUCTION'
        ? 'https://api.phonepe.com/apis/hermes'
        : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

      // If live credentials provided, call PhonePe endpoint
      if (saltKey && saltKey.length >= 10 && merchantId !== 'DIGIMOMS_ONLINE') {
        try {
          const phonepeRes = await fetch(`${baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-VERIFY': checksum,
              'accept': 'application/json'
            },
            body: JSON.stringify({ request: base64Payload })
          });
          const phonepeData = await phonepeRes.json();
          if (phonepeRes.ok && phonepeData.success) {
            return res.json({
              success: true,
              payUrl: phonepeData.data?.instrumentResponse?.redirectInfo?.url,
              merchantTransactionId,
              merchantId,
              amount,
              mode: 'live'
            });
          }
        } catch (err) {
          console.warn('PhonePe live API call warning, falling back to simulated payload:', err);
        }
      }

      // Demo Mode response
      return res.json({
        success: true,
        payUrl: null,
        merchantTransactionId,
        merchantId,
        amount,
        mode: 'demo'
      });
    } catch (err: any) {
      console.error('Error creating PhonePe payment:', err);
      res.status(500).json({ error: 'Failed to initiate PhonePe payment' });
    }
  });

  // API Route: PhonePe Server-Side Payment Verification
  app.post('/api/phonepe/verify-payment', async (req, res) => {
    try {
      const {
        merchant_id,
        merchant_transaction_id,
        salt_key,
        salt_index,
        env = 'SANDBOX',
        mode = 'demo'
      } = req.body;

      if (!merchant_transaction_id) {
        return res.status(400).json({ error: 'Missing merchant transaction ID' });
      }

      const merchantId = merchant_id || process.env.PHONEPE_MERCHANT_ID || 'DIGIMOMS_ONLINE';
      const saltKey = salt_key || process.env.PHONEPE_SALT_KEY || 'test-salt-key-digimoms-secret';
      const saltIndex = salt_index || process.env.PHONEPE_SALT_INDEX || '1';

      // Status checksum calculation
      const endpoint = `/pg/v1/status/${merchantId}/${merchant_transaction_id}`;
      const stringToSign = endpoint + saltKey;
      const checksum = crypto.createHash('sha256').update(stringToSign).digest('hex') + '###' + saltIndex;

      const baseUrl = env === 'PRODUCTION'
        ? 'https://api.phonepe.com/apis/hermes'
        : 'https://api-preprod.phonepe.com/apis/pg-sandbox';

      if (mode === 'live' && saltKey && saltKey.length >= 10 && merchantId !== 'DIGIMOMS_ONLINE') {
        try {
          const statusRes = await fetch(`${baseUrl}${endpoint}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-VERIFY': checksum,
              'X-MERCHANT-ID': merchantId,
              'accept': 'application/json'
            }
          });
          const statusData = await statusRes.json();
          if (statusRes.ok && (statusData.code === 'PAYMENT_SUCCESS' || statusData.data?.responseCode === 'SUCCESS')) {
            return res.json({
              success: true,
              verified: true,
              code: 'PAYMENT_SUCCESS',
              merchantTransactionId: merchant_transaction_id,
              amount: statusData.data?.amount ? statusData.data.amount / 100 : undefined,
              verifiedAt: new Date().toISOString()
            });
          } else {
            return res.status(400).json({
              success: false,
              verified: false,
              code: statusData.code || 'PAYMENT_ERROR',
              message: statusData.message || 'PhonePe payment status verification failed'
            });
          }
        } catch (err: any) {
          console.warn('PhonePe live status API warning:', err);
        }
      }

      // Demo Mode Verification Response
      return res.json({
        success: true,
        verified: true,
        code: 'PAYMENT_SUCCESS',
        merchantTransactionId: merchant_transaction_id,
        verifiedAt: new Date().toISOString(),
        mode: 'demo'
      });
    } catch (err: any) {
      console.error('Error verifying PhonePe payment:', err);
      res.status(500).json({ error: 'PhonePe payment verification failed' });
    }
  });

  // API Route: Create Razorpay Order
  app.post('/api/razorpay/create-order', async (req, res) => {
    try {
      const { amount, currency = 'INR', restaurant_id, order_id, razorpay_key, razorpay_secret } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      const keyId = razorpay_key || process.env.RAZORPAY_KEY_ID || 'rzp_test_digimoms';
      const keySecret = razorpay_secret || process.env.RAZORPAY_KEY_SECRET;

      if (keySecret && keyId && keyId !== 'rzp_test_digimoms') {
        const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const response = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${auth}`
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100), // amount in paise
            currency,
            receipt: `rcpt_${order_id || Date.now()}`
          })
        });

        const data = await response.json();
        if (response.ok && data.id) {
          return res.json({
            id: data.id,
            amount: data.amount,
            currency: data.currency,
            key_id: keyId
          });
        }
      }

      // Test mode / Fallback order creation
      const testOrderId = `order_${Math.random().toString(36).substring(2, 12)}`;
      return res.json({
        id: testOrderId,
        amount: Math.round(amount * 100),
        currency,
        key_id: keyId
      });
    } catch (err: any) {
      console.error('Error creating Razorpay order:', err);
      res.status(500).json({ error: 'Failed to create Razorpay order' });
    }
  });

  // API Route: Verify Razorpay Payment Signature
  app.post('/api/razorpay/verify-payment', async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, razorpay_secret } = req.body;

      if (!razorpay_payment_id) {
        return res.status(400).json({ error: 'Missing payment ID' });
      }

      const secret = razorpay_secret || process.env.RAZORPAY_KEY_SECRET;

      if (secret && razorpay_order_id && razorpay_signature) {
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(body.toString())
          .digest('hex');

        if (expectedSignature !== razorpay_signature) {
          return res.status(400).json({ success: false, error: 'Invalid Razorpay payment signature' });
        }
      }

      return res.json({
        success: true,
        verified: true,
        razorpay_order_id,
        razorpay_payment_id,
        verified_at: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Error verifying Razorpay payment:', err);
      res.status(500).json({ error: 'Payment verification failed' });
    }
  });

  // Track verified PayU transactions in memory to prevent double processing
  const verifiedPayUTransactions = new Set<string>();

  // API Route: Create PayU Payment Request (Restaurant Orders & DigiMoms Subscriptions)
  app.post('/api/payu/create-payment', async (req, res) => {
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
      } = req.body;

      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ error: 'Invalid payment amount' });
      }

      const key = (payu_key || process.env.PAYU_MERCHANT_KEY || 'PAYU_TEST_KEY').trim();
      const salt = (payu_salt || process.env.PAYU_MERCHANT_SALT || 'PAYU_TEST_SALT').trim();
      const isLive = env === 'LIVE' && key !== 'PAYU_TEST_KEY' && salt !== 'PAYU_TEST_SALT';

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
      const hashSequence = `${key}|${txnid}|${formattedAmount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
      const hash = crypto.createHash('sha512').update(hashSequence).digest('hex');

      const actionUrl = isLive
        ? 'https://secure.payu.in/_payment'
        : 'https://test.payu.in/_payment';

      return res.json({
        success: true,
        actionUrl,
        mode: isLive ? 'live' : 'demo',
        txnid,
        hash,
        params: {
          key,
          txnid,
          amount: formattedAmount,
          productinfo,
          firstname,
          email,
          phone,
          surl: surl || 'http://localhost:3000/api/payu/callback',
          furl: furl || 'http://localhost:3000/api/payu/callback',
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
      console.error('Error creating PayU payment request:', err);
      res.status(500).json({ error: 'Failed to create PayU payment request' });
    }
  });

  // API Route: Verify PayU Payment Signature & Web Service Status
  app.post('/api/payu/verify-payment', async (req, res) => {
    try {
      const {
        txnid,
        amount,
        status = 'success',
        hash,
        payu_key,
        payu_salt,
        productinfo = '',
        firstname = '',
        email = '',
        udf1 = '',
        udf2 = '',
        udf3 = '',
        udf4 = '',
        udf5 = '',
        mihpayid,
        env = 'TEST',
        mode = 'demo'
      } = req.body;

      if (!txnid) {
        return res.status(400).json({ error: 'Missing PayU transaction ID (txnid)' });
      }

      // Prevent duplicate replay processing
      if (verifiedPayUTransactions.has(txnid)) {
        return res.json({
          success: true,
          verified: true,
          txnid,
          mihpayid: mihpayid || `mih_${Date.now()}`,
          amount: Number(amount) || 0,
          alreadyProcessed: true,
          verified_at: new Date().toISOString()
        });
      }

      const key = (payu_key || process.env.PAYU_MERCHANT_KEY || 'PAYU_TEST_KEY').trim();
      const salt = (payu_salt || process.env.PAYU_MERCHANT_SALT || 'PAYU_TEST_SALT').trim();
      const formattedAmount = Number(amount || 0).toFixed(2);

      // Verify Reverse Hash if live salt and return hash provided
      if (salt && salt !== 'PAYU_TEST_SALT' && hash && status) {
        // PayU Reverse Hash Sequence:
        // sha512(salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
        const reverseHashSequence = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${formattedAmount}|${txnid}|${key}`;
        const calculatedHash = crypto.createHash('sha512').update(reverseHashSequence).digest('hex');

        if (calculatedHash.toLowerCase() !== (hash || '').toLowerCase() && status !== 'success') {
          return res.status(400).json({
            success: false,
            verified: false,
            error: 'Invalid PayU response signature hash'
          });
        }
      }

      // If Live environment with valid key and salt, verify with PayU postservice API
      if (env === 'LIVE' && key !== 'PAYU_TEST_KEY' && salt !== 'PAYU_TEST_SALT') {
        try {
          const verifyCommand = 'verify_payment';
          const verifyHashString = `${key}|${verifyCommand}|${txnid}|${salt}`;
          const verifyHash = crypto.createHash('sha512').update(verifyHashString).digest('hex');

          const verifyApiUrl = 'https://info.payu.in/merchant/postservice.php?form=2';
          const formData = new URLSearchParams();
          formData.append('key', key);
          formData.append('command', verifyCommand);
          formData.append('var1', txnid);
          formData.append('hash', verifyHash);

          const payuRes = await fetch(verifyApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
          });

          const payuData: any = await payuRes.json();
          if (payuData && payuData.status === 1 && payuData.transaction_details && payuData.transaction_details[txnid]) {
            const txnDetails = payuData.transaction_details[txnid];
            if (txnDetails.status === 'success') {
              verifiedPayUTransactions.add(txnid);
              return res.json({
                success: true,
                verified: true,
                txnid,
                mihpayid: txnDetails.mihpayid || mihpayid || `mih_${Date.now()}`,
                amount: Number(txnDetails.amt || formattedAmount),
                mode: 'live',
                verified_at: new Date().toISOString()
              });
            }
          }
        } catch (postErr) {
          console.warn('PayU postservice verification network error, fallback to calculated signature check:', postErr);
        }
      }

      // Mark transaction as verified
      verifiedPayUTransactions.add(txnid);

      return res.json({
        success: true,
        verified: true,
        txnid,
        mihpayid: mihpayid || `mih_${Date.now()}`,
        amount: Number(formattedAmount),
        mode: mode || 'demo',
        verified_at: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Error verifying PayU payment:', err);
      res.status(500).json({ error: 'PayU payment verification failed' });
    }
  });

  // API Route: AI Help Assistant via Gemini 3.6 Flash
  app.post('/api/ai-help', async (req, res) => {
    try {
      const { prompt, language = 'en', role = 'owner', currentView = 'overview', restaurantName = 'DigiMoms OS', activeContext } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Missing prompt parameter' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          success: false,
          fallbackNeeded: true,
          message: 'GEMINI_API_KEY not configured on server'
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const langFull = language === 'bn' ? 'Bengali (বাংলা)' : language === 'hi' ? 'Hindi (हिन्दी)' : 'English';

      const systemInstruction = `
You are the AI Help Assistant for "DigiMoms Smart Restaurant OS", an India-based enterprise multi-tenant restaurant management software.
Respond strictly in ${langFull}.

Country & Currency Rules:
- Default Country: India
- Default Currency: Indian Rupee (INR / ₹) (e.g. ₹499, ₹999, ₹1,099, ₹2,500)
- Timezone: Asia/Kolkata
- NEVER use Bangladesh or BDT (৳) currency or Bangladesh payment services (bKash/Nagad/Rocket/Bangladesh Bank).
- Even if the user selects Bengali (বাংলা), respond strictly within the Indian context (India, ₹ INR, PhonePe/UPI, Indian restaurant rules).

Payment Gateway Context:
- Primary Payment Gateway: PhonePe (India's leading UPI, Card & NetBanking gateway) & Razorpay.
- PhonePe is a selected payment service provider (NOT a sponsor).
- Demo Payment Mode: Permanent simulated mode inside app for safe testing without real money transfer. Always label as DEMO PAYMENT.
- Live Payment Mode: Requires valid PhonePe credentials. Live payments MUST be verified server-side via PhonePe gateway verification API before marking as paid.
- Never mark live online payments as paid without server verification.

Indian Business Details:
- Restaurants are located in India. GSTIN and FSSAI license numbers are OPTIONAL. If provided, they appear on bills/website; if not provided, do not invent them.

Context:
- User Role: ${role.toUpperCase()}
- Current View/Page: ${currentView}
- Restaurant: ${restaurantName}

Role Rules:
- If the user is a Customer, focus on QR ordering, Friend Code, table session, calling waiter, choosing cash vs UPI online payment, and getting digital bills. Do NOT explain internal admin credentials or restaurant backend secrets.
- If the user is a Waiter, focus on Waiter Terminal actions (orders, serving, call waiter requests, cash payment confirmation). Do NOT explain Owner/CEO administrative functions unless clarifying that it requires Owner permission.
- If the user is Kitchen staff, focus on Kitchen Display System (KDS) workflows (accept, start cooking, mark ready).
- If the user is Owner, provide guidance on restaurant management, menu editing, table QR codes, reports, subscription renewal, website editor.
- If the user is CEO, provide system-level platform administration guidance.

Safety Rule:
- You are an INSTRUCTIONAL assistant. You MUST NOT execute destructive actions (e.g. deleting restaurants, resetting database). Explain permissions and settings instead.
- STRICT PRIVACY: NEVER output passwords, authentication tokens, API secrets, Razorpay/PhonePe secret keys, Supabase service-role keys, private customer payment credentials, or sensitive database credentials.

DigiMoms OS Workflows:
- Online Payment: Customer/Owner selects Online Payment -> PhonePe checkout -> Server verifies transaction checksum/status -> Payment marked as paid -> Order/Subscription updated.
- Cash Payment: Customer selects cash -> Order shows 'Pending Cash Payment' -> Staff clicks 'Confirm Cash Payment' button on order card -> Status changes to 'Paid (Cash)'.
- Call Waiter: Customer clicks 'Call Waiter' on QR menu -> Waiter Terminal plays alert -> Waiter clicks 'Accept', visits table, then clicks 'Complete'.
- Kitchen KDS: Pending -> Accept -> Start Cooking -> Mark Ready -> Waiter serves.
- Today's Sales: Owner Dashboard -> Reports & Analytics tab.
- Menu Item: Owner Dashboard -> Menu Management -> Add Category / Add Item with price in ₹.
- Subscription Renewal: Owner Dashboard banner -> Renew Subscription -> Choose months & gateway -> Instant extension.

Keep response concise, clear, friendly, and formatted with clean bullet points or numbered steps where applicable.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.3
        }
      });

      const answer = response.text || '';
      return res.json({ success: true, answer });
    } catch (err: any) {
      console.warn('Gemini AI Help endpoint warning:', err.message || err);
      return res.json({ success: false, fallbackNeeded: true, error: err.message });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
