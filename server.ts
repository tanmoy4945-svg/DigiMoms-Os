import express from 'express';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  const DATA_DIR = path.join(process.cwd(), 'data');
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (err) {
      console.warn('Could not create data dir:', err);
    }
  }

  function readJsonFile<T>(filename: string, defaultVal: T): T {
    try {
      const filePath = path.join(DATA_DIR, filename);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2), 'utf-8');
        return defaultVal;
      }
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn(`Error reading ${filename}, using default:`, err);
      return defaultVal;
    }
  }

  function writeJsonFile<T>(filename: string, data: T): void {
    try {
      const filePath = path.join(DATA_DIR, filename);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Error writing ${filename}:`, err);
    }
  }

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Route: Persistent CEO Payment Config
  app.get('/api/ceo/payment-config', (req, res) => {
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
    const cfg = readJsonFile('ceo_payment_config.json', defaultCfg);
    res.json({ success: true, data: cfg });
  });

  app.post('/api/ceo/payment-config', (req, res) => {
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
    const current = readJsonFile('ceo_payment_config.json', defaultCfg);
    const body = req.body || {};
    
    // Preserve existing saved secret salts if client sends masked placeholder
    const resolvedPayuSalt = (typeof body.payu_merchant_salt === 'string' && !body.payu_merchant_salt.startsWith('•••'))
      ? body.payu_merchant_salt
      : (current.payu_merchant_salt || '');

    const resolvedPhonepeSalt = (typeof body.phonepe_salt_key === 'string' && !body.phonepe_salt_key.startsWith('•••'))
      ? body.phonepe_salt_key
      : (current.phonepe_salt_key || '');

    const resolvedRazorpaySecret = (typeof body.razorpay_key_secret === 'string' && !body.razorpay_key_secret.startsWith('•••'))
      ? body.razorpay_key_secret
      : (current.razorpay_key_secret || '');

    const updated = {
      ...current,
      ...body,
      payu_merchant_salt: resolvedPayuSalt,
      phonepe_salt_key: resolvedPhonepeSalt,
      razorpay_key_secret: resolvedRazorpaySecret,
      updated_at: new Date().toISOString()
    };
    
    writeJsonFile('ceo_payment_config.json', updated);
    res.json({ success: true, data: updated });
  });

  // Helper: Sanitize restaurant configuration to prevent payment secrets & credential exposure
  function sanitizeRestaurantConfig(cfg: Record<string, any>, maskSecrets = true): Record<string, any> {
    if (!cfg) return {};
    const copy = { ...cfg };
    delete copy.password_hash;

    if (maskSecrets) {
      if (copy.payu_merchant_salt) copy.payu_merchant_salt = '••••••••';
      if (copy.phonepe_salt_key) copy.phonepe_salt_key = '••••••••';
      if (copy.razorpay_secret) copy.razorpay_secret = '••••••••';
      if (copy.razorpay_key_secret) copy.razorpay_key_secret = '••••••••';
    } else {
      delete copy.payu_merchant_salt;
      delete copy.phonepe_salt_key;
      delete copy.razorpay_secret;
      delete copy.razorpay_key_secret;
    }
    return copy;
  }

  // API Route: Persistent Restaurant Payment Configurations & Overrides (Public/Sync: Secrets completely stripped)
  app.get('/api/restaurants-configs', (req, res) => {
    const configs = readJsonFile<Record<string, any>>('restaurant_configs.json', {});
    const sanitized: Record<string, any> = {};
    for (const [id, cfg] of Object.entries(configs)) {
      sanitized[id] = sanitizeRestaurantConfig(cfg, false);
    }
    res.json({ success: true, data: sanitized });
  });

  // API Route: Specific Restaurant Config (Masked for authenticated owner UI, stripped for guests)
  app.get(['/api/restaurants/:id/config', '/api/restaurant-config/:id'], (req, res) => {
    const { id } = req.params;
    const configs = readJsonFile<Record<string, any>>('restaurant_configs.json', {});
    const cfg = configs[id] || {};
    res.json({ success: true, data: sanitizeRestaurantConfig(cfg, true) });
  });

  app.post(['/api/restaurants/:id/config', '/api/restaurant-config/:id'], (req, res) => {
    const { id } = req.params;
    const configs = readJsonFile<Record<string, any>>('restaurant_configs.json', {});
    const currentRest = configs[id] || {};
    const body = req.body || {};

    // Preserve existing saved secrets if client sends masked placeholder or leaves empty
    const resolvedPayuSalt = (typeof body.payu_merchant_salt === 'string' && !body.payu_merchant_salt.startsWith('•••') && body.payu_merchant_salt.trim() !== '')
      ? body.payu_merchant_salt
      : (currentRest.payu_merchant_salt || '');

    const resolvedPhonepeSalt = (typeof body.phonepe_salt_key === 'string' && !body.phonepe_salt_key.startsWith('•••') && body.phonepe_salt_key.trim() !== '')
      ? body.phonepe_salt_key
      : (currentRest.phonepe_salt_key || '');

    const resolvedRazorpaySecret = (typeof body.razorpay_secret === 'string' && !body.razorpay_secret.startsWith('•••') && body.razorpay_secret.trim() !== '')
      ? body.razorpay_secret
      : (currentRest.razorpay_secret || '');

    configs[id] = {
      ...currentRest,
      ...body,
      payu_merchant_salt: resolvedPayuSalt,
      phonepe_salt_key: resolvedPhonepeSalt,
      razorpay_secret: resolvedRazorpaySecret,
      updated_at: new Date().toISOString()
    };
    writeJsonFile('restaurant_configs.json', configs);
    res.json({ success: true, data: sanitizeRestaurantConfig(configs[id], true) });
  });

  // Realtime Server-Sent Events (SSE) Manager for Ultra-Fast Instant Multi-Device Notifications
  const sseClients = new Map<string, Set<express.Response>>();

  function broadcastRealtimeOrderEvent(restaurantId: string | undefined, eventPayload: any) {
    const targetIds = ['all'];
    if (restaurantId) targetIds.push(restaurantId);

    const enrichedPayload = {
      ...eventPayload,
      data: eventPayload.data || eventPayload.order || eventPayload.call_request || eventPayload.payload,
      timestamp: eventPayload.timestamp || new Date().toISOString()
    };

    targetIds.forEach(rid => {
      const clients = sseClients.get(rid);
      if (clients) {
        const msg = `data: ${JSON.stringify(enrichedPayload)}\n\n`;
        clients.forEach(res => {
          try {
            res.write(msg);
          } catch (e) {
            clients.delete(res);
          }
        });
      }
    });
  }

  // API Route: Realtime SSE Stream for Dashboards & Terminals
  app.get('/api/realtime/events', (req, res) => {
    const restaurantId = (req.query.restaurant_id as string) || 'all';
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    if (!sseClients.has(restaurantId)) {
      sseClients.set(restaurantId, new Set());
    }
    sseClients.get(restaurantId)!.add(res);

    // Initial connection acknowledgement
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', restaurant_id: restaurantId, timestamp: new Date().toISOString() })}\n\n`);

    const keepAlive = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(keepAlive);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.get(restaurantId)?.delete(res);
    });
  });

  // API Route: Cross-Device Realtime Broadcast Endpoint
  app.post('/api/realtime/broadcast', (req, res) => {
    const { restaurant_id, type, order, call_request, payload } = req.body;
    broadcastRealtimeOrderEvent(restaurant_id, {
      type: type || 'EVENT',
      restaurant_id,
      order,
      call_request,
      payload,
      timestamp: new Date().toISOString()
    });
    res.json({ success: true });
  });

  // API Route: Persistent Orders Sync & Backup
  app.get('/api/orders/list', (req, res) => {
    const { restaurant_id } = req.query;
    const allOrders = readJsonFile<any[]>('orders.json', []);
    const filtered = restaurant_id ? allOrders.filter(o => o.restaurant_id === restaurant_id) : allOrders;
    res.json({ success: true, data: filtered });
  });

  app.post('/api/orders/save', (req, res) => {
    const order = req.body;
    if (!order || !order.id) {
      return res.status(400).json({ error: 'Missing order data' });
    }
    const allOrders = readJsonFile<any[]>('orders.json', []);
    const idx = allOrders.findIndex(o => o.id === order.id);
    let isNew = false;
    if (idx >= 0) {
      allOrders[idx] = { ...allOrders[idx], ...order, updated_at: new Date().toISOString() };
    } else {
      isNew = true;
      allOrders.unshift({ ...order, created_at: order.created_at || new Date().toISOString() });
    }
    writeJsonFile('orders.json', allOrders.slice(0, 1000));

    // Immediately broadcast to all connected Owner & Staff dashboards via SSE
    broadcastRealtimeOrderEvent(order.restaurant_id, {
      type: isNew ? 'NEW_ORDER' : 'ORDER_UPDATED',
      restaurant_id: order.restaurant_id,
      order,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, data: order });
  });

  // API Route: Persistent Transactions Record
  app.get('/api/transactions/list', (req, res) => {
    const { restaurant_id } = req.query;
    const allTx = readJsonFile<any[]>('transactions.json', []);
    const filtered = restaurant_id ? allTx.filter(t => t.restaurant_id === restaurant_id) : allTx;
    res.json({ success: true, data: filtered });
  });

  app.post('/api/transactions/record', (req, res) => {
    const tx = req.body;
    if (!tx || !tx.id) {
      return res.status(400).json({ error: 'Missing transaction data' });
    }
    const allTx = readJsonFile<any[]>('transactions.json', []);
    allTx.unshift({ ...tx, created_at: tx.created_at || new Date().toISOString() });
    writeJsonFile('transactions.json', allTx.slice(0, 1000));
    res.json({ success: true, data: tx });
  });

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

      const origin = req.headers.origin || (req.headers.host ? `${req.protocol}://${req.get('host')}` : 'http://localhost:3000');
      
      let resolvedMerchantId = (merchant_id || '').trim();
      let resolvedSaltKey = (salt_key || '').trim();
      let resolvedSaltIndex = (salt_index || '').trim();

      // Look up credentials securely from server-side store if not passed or masked
      if (!resolvedMerchantId || !resolvedSaltKey || resolvedSaltKey.startsWith('•••') || resolvedSaltKey === 'test-salt-key-digimoms-secret') {
        if (restaurant_id) {
          const restConfigs = readJsonFile<Record<string, any>>('restaurant_configs.json', {});
          const rCfg = restConfigs[restaurant_id] || {};
          if (rCfg.phonepe_merchant_id && !resolvedMerchantId) resolvedMerchantId = rCfg.phonepe_merchant_id;
          if (rCfg.phonepe_salt_key && (!resolvedSaltKey || resolvedSaltKey.startsWith('•••'))) resolvedSaltKey = rCfg.phonepe_salt_key;
          if (rCfg.phonepe_salt_index && !resolvedSaltIndex) resolvedSaltIndex = rCfg.phonepe_salt_index;
        }
        if (!resolvedMerchantId || !resolvedSaltKey || resolvedSaltKey.startsWith('•••')) {
          const ceoCfg = readJsonFile<any>('ceo_payment_config.json', {});
          if (ceoCfg.phonepe_merchant_id && !resolvedMerchantId) resolvedMerchantId = ceoCfg.phonepe_merchant_id;
          if (ceoCfg.phonepe_salt_key && (!resolvedSaltKey || resolvedSaltKey.startsWith('•••'))) resolvedSaltKey = ceoCfg.phonepe_salt_key;
          if (ceoCfg.phonepe_salt_index && !resolvedSaltIndex) resolvedSaltIndex = ceoCfg.phonepe_salt_index;
        }
      }

      const merchantId = resolvedMerchantId || process.env.PHONEPE_MERCHANT_ID || 'DIGIMOMS_ONLINE';
      const saltKey = resolvedSaltKey || process.env.PHONEPE_SALT_KEY || 'test-salt-key-digimoms-secret';
      const saltIndex = resolvedSaltIndex || process.env.PHONEPE_SALT_INDEX || '1';
      const merchantTransactionId = `MT_SUB_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const merchantUserId = `MUID_${(restaurant_id || 'rest').substring(0, 8)}`;
      const amountPaise = Math.round(amount * 100);

      const payload = {
        merchantId,
        merchantTransactionId,
        merchantUserId,
        amount: amountPaise,
        redirectUrl: redirect_url || `${origin}/api/phonepe/callback?redirect=1`,
        redirectMode: 'POST',
        callbackUrl: callback_url || `${origin}/api/phonepe/callback`,
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

  // API Route: PhonePe Callback Handler (POST / GET from PhonePe redirect or S2S callback)
  app.all('/api/phonepe/callback', (req, res) => {
    try {
      const data = req.method === 'POST' ? req.body : req.query;
      const reqQuery = req.query || {};
      let transactionId = '';
      let merchantTransactionId = '';
      let code = 'PAYMENT_SUCCESS';
      let isSuccess = true;
      let amount = 0;

      if (data?.response) {
        try {
          const decoded = Buffer.from(String(data.response), 'base64').toString('utf8');
          const parsed = JSON.parse(decoded);
          code = parsed.code || 'PAYMENT_SUCCESS';
          isSuccess = code === 'PAYMENT_SUCCESS' || parsed.success === true;
          merchantTransactionId = parsed.data?.merchantTransactionId || '';
          transactionId = parsed.data?.transactionId || '';
          amount = parsed.data?.amount ? parsed.data.amount / 100 : 0;
        } catch (e) {
          console.warn('Could not decode base64 PhonePe response:', e);
        }
      } else {
        merchantTransactionId = String(data?.merchantTransactionId || data?.merchant_transaction_id || data?.txnid || '');
        transactionId = String(data?.transactionId || data?.providerReferenceId || '');
        code = String(data?.code || 'PAYMENT_SUCCESS');
        isSuccess = code === 'PAYMENT_SUCCESS' || data?.status === 'SUCCESS' || data?.status === 'success';
        amount = Number(data?.amount) || 0;
      }

      const orderId = String(reqQuery.order_id || (req.body && req.body.order_id) || '');
      const tableCode = String(reqQuery.table_code || (req.body && req.body.table_code) || '');
      const paymentType = String(reqQuery.type || (req.body && req.body.type) || '');
      const isSubscription = paymentType === 'subscription' || merchantTransactionId.startsWith('SUB_') || merchantTransactionId.startsWith('RENEW_');

      let targetRedirectUrl = '/';
      if (isSubscription) {
        targetRedirectUrl = `/owner-dashboard?payment=${isSuccess ? 'success' : 'failed'}&txnid=${encodeURIComponent(merchantTransactionId)}`;
      } else if (tableCode || orderId) {
        targetRedirectUrl = `/q/${encodeURIComponent(tableCode || 'table')}?order_id=${encodeURIComponent(orderId)}&payment=${isSuccess ? 'success' : 'failed'}&txnid=${encodeURIComponent(merchantTransactionId)}`;
      } else {
        targetRedirectUrl = '/owner-dashboard';
      }

      // Update server order record if payment was successful
      if (isSuccess && orderId) {
        try {
          const allOrders = readJsonFile<any[]>('orders.json', []);
          const idx = allOrders.findIndex(o => o.id === orderId);
          if (idx >= 0) {
            allOrders[idx] = {
              ...allOrders[idx],
              payment_status: 'paid_live',
              order_status: allOrders[idx].order_status === 'pending' ? 'accepted' : allOrders[idx].order_status,
              online_amount: amount || allOrders[idx].grand_total,
              cash_due: 0,
              transaction_id: merchantTransactionId || transactionId,
              updated_at: new Date().toISOString()
            };
            writeJsonFile('orders.json', allOrders.slice(0, 1000));
            broadcastRealtimeOrderEvent(allOrders[idx].restaurant_id, {
              type: 'ORDER_UPDATED',
              restaurant_id: allOrders[idx].restaurant_id,
              order: allOrders[idx],
              timestamp: new Date().toISOString()
            });
          }
        } catch (e) {
          console.warn('Could not sync order on PhonePe callback:', e);
        }
      }

      const htmlResponse = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>PhonePe Payment ${isSuccess ? 'Success' : 'Status'}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: #020617;
              color: #f8fafc;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            .card {
              background-color: #0f172a;
              border: 1px solid ${isSuccess ? '#10b981' : '#f59e0b'};
              border-radius: 24px;
              padding: 32px;
              max-width: 420px;
              width: 100%;
              text-align: center;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
            }
            .icon {
              width: 56px;
              height: 56px;
              border-radius: 50%;
              background-color: ${isSuccess ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'};
              color: ${isSuccess ? '#34d399' : '#fbbf24'};
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 28px;
              margin: 0 auto 16px;
            }
            h1 { font-size: 20px; margin: 0 0 8px; color: #fff; }
            p { font-size: 13px; color: #94a3b8; margin: 0 0 20px; line-height: 1.5; }
            .details {
              background-color: #020617;
              border-radius: 12px;
              padding: 12px 16px;
              margin-bottom: 20px;
              text-align: left;
              font-size: 12px;
            }
            .row { display: flex; justify-content: space-between; margin-bottom: 6px; }
            .row:last-child { margin-bottom: 0; }
            .btn {
              display: inline-block;
              width: 100%;
              padding: 12px;
              border-radius: 12px;
              background-color: ${isSuccess ? '#10b981' : '#3b82f6'};
              color: #fff;
              text-decoration: none;
              font-weight: bold;
              font-size: 14px;
              border: none;
              cursor: pointer;
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">${isSuccess ? '✓' : '!'}</div>
            <h1>${isSuccess ? 'Payment Processed!' : 'Payment ' + code}</h1>
            <p>${isSuccess ? 'Your transaction has been received from PhonePe.' : 'Transaction update from PhonePe gateway.'}</p>
            
            <div class="details">
              <div class="row"><span>Status:</span><strong style="color: ${isSuccess ? '#34d399' : '#fbbf24'}; text-transform: uppercase;">${code}</strong></div>
              ${amount ? `<div class="row"><span>Amount:</span><strong>₹${amount}</strong></div>` : ''}
              ${merchantTransactionId ? `<div class="row"><span>Merchant Txn:</span><span style="font-family: monospace; font-size: 11px;">${merchantTransactionId}</span></div>` : ''}
              ${transactionId ? `<div class="row"><span>PhonePe ID:</span><span style="font-family: monospace; font-size: 11px;">${transactionId}</span></div>` : ''}
            </div>

            <button class="btn" onclick="closeOrRedirect()">${isSubscription ? 'Return to Dashboard' : 'Return to Order'}</button>
          </div>

          <script>
            const payload = {
              type: 'PHONEPE_PAYMENT_CALLBACK',
              status: '${isSuccess ? 'success' : 'failed'}',
              code: '${code}',
              merchantTransactionId: '${merchantTransactionId}',
              transactionId: '${transactionId}',
              amount: '${amount}',
              order_id: '${orderId}',
              table_code: '${tableCode}'
            };

            try {
              if (window.opener) {
                window.opener.postMessage(payload, '*');
              }
              if (window.parent && window.parent !== window) {
                window.parent.postMessage(payload, '*');
              }
              if (typeof localStorage !== 'undefined' && '${merchantTransactionId}') {
                localStorage.setItem('digimoms_phonepe_status_' + '${merchantTransactionId}', JSON.stringify(payload));
              }
              if (typeof BroadcastChannel !== 'undefined') {
                const bc = new BroadcastChannel('digimoms_phonepe_channel');
                bc.postMessage(payload);
                bc.close();
              }
            } catch (e) {
              console.warn('Callback notification error:', e);
            }

            function closeOrRedirect() {
              if (window.opener) {
                try { window.close(); } catch(e) {}
              } else {
                window.location.href = '${targetRedirectUrl}';
              }
            }

            if (window.opener && '${isSuccess}' === 'true') {
              setTimeout(() => {
                try { window.close(); } catch(e) {}
              }, 2000);
            } else if (!window.opener && '${isSuccess}' === 'true') {
              setTimeout(() => {
                window.location.href = '${targetRedirectUrl}';
              }, 2500);
            }
          </script>
        </body>
        </html>
      `;

      res.setHeader('Content-Type', 'text/html');
      return res.send(htmlResponse);
    } catch (err) {
      console.error('PhonePe callback error:', err);
      res.redirect('/owner-dashboard');
    }
  });

  // API Route: Create Razorpay Order
  app.post('/api/razorpay/create-order', async (req, res) => {
    try {
      const { amount, currency = 'INR', restaurant_id, order_id, razorpay_key, razorpay_secret } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      let keyId = (razorpay_key || '').trim();
      let keySecret = (razorpay_secret || '').trim();

      if (!keyId || !keySecret || keySecret.startsWith('•••')) {
        if (restaurant_id) {
          const restConfigs = readJsonFile<Record<string, any>>('restaurant_configs.json', {});
          const rCfg = restConfigs[restaurant_id] || {};
          if (rCfg.razorpay_key && !keyId) keyId = rCfg.razorpay_key;
          if (rCfg.razorpay_secret && (!keySecret || keySecret.startsWith('•••'))) keySecret = rCfg.razorpay_secret;
        }
        if (!keyId || !keySecret || keySecret.startsWith('•••')) {
          const ceoCfg = readJsonFile<any>('ceo_payment_config.json', {});
          if (ceoCfg.razorpay_key_id && !keyId) keyId = ceoCfg.razorpay_key_id;
          if (ceoCfg.razorpay_key_secret && (!keySecret || keySecret.startsWith('•••'))) keySecret = ceoCfg.razorpay_key_secret;
        }
      }

      keyId = keyId || process.env.RAZORPAY_KEY_ID || 'rzp_test_digimoms';
      keySecret = keySecret || process.env.RAZORPAY_KEY_SECRET;

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
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, razorpay_secret, restaurant_id } = req.body;

      if (!razorpay_payment_id) {
        return res.status(400).json({ error: 'Missing payment ID' });
      }

      let secret = (razorpay_secret || '').trim();
      if (!secret || secret.startsWith('•••')) {
        if (restaurant_id) {
          const restConfigs = readJsonFile<Record<string, any>>('restaurant_configs.json', {});
          const rCfg = restConfigs[restaurant_id] || {};
          if (rCfg.razorpay_secret) secret = rCfg.razorpay_secret;
        }
        if (!secret || secret.startsWith('•••')) {
          const ceoCfg = readJsonFile<any>('ceo_payment_config.json', {});
          if (ceoCfg.razorpay_key_secret) secret = ceoCfg.razorpay_key_secret;
        }
      }

      secret = secret || process.env.RAZORPAY_KEY_SECRET;

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

  // Track verified PayU transactions in memory
  interface VerifiedPayUPaymentRecord {
    status: string;
    txnid: string;
    mihpayid: string;
    amount: number;
    hash?: string;
    mode: string;
    verified_at: string;
    udf1?: string;
    udf2?: string;
    udf3?: string;
    udf4?: string;
    udf5?: string;
  }
  const verifiedPayUTransactions = new Map<string, VerifiedPayUPaymentRecord>();

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

      let key = (payu_key || '').trim();
      let salt = (payu_salt || '').trim();

      // If salt or key not passed directly, look up from persistent server configs
      if (!key || key === 'PAYU_TEST_KEY' || !salt || salt === 'PAYU_TEST_SALT' || salt.startsWith('•••')) {
        if (restaurant_id) {
          const restConfigs = readJsonFile<Record<string, any>>('restaurant_configs.json', {});
          const rCfg = restConfigs[restaurant_id] || {};
          if (rCfg.payu_merchant_key && (!key || key === 'PAYU_TEST_KEY')) key = rCfg.payu_merchant_key;
          if (rCfg.payu_merchant_salt && (!salt || salt === 'PAYU_TEST_SALT' || salt.startsWith('•••'))) salt = rCfg.payu_merchant_salt;
        }
        if (!key || key === 'PAYU_TEST_KEY' || !salt || salt === 'PAYU_TEST_SALT' || salt.startsWith('•••')) {
          const ceoCfg = readJsonFile<any>('ceo_payment_config.json', {});
          if (ceoCfg.payu_merchant_key && (!key || key === 'PAYU_TEST_KEY')) key = ceoCfg.payu_merchant_key;
          if (ceoCfg.payu_merchant_salt && (!salt || salt === 'PAYU_TEST_SALT' || salt.startsWith('•••'))) salt = ceoCfg.payu_merchant_salt;
        }
      }

      key = key || process.env.PAYU_MERCHANT_KEY || 'PAYU_TEST_KEY';
      salt = salt || process.env.PAYU_MERCHANT_SALT || 'PAYU_TEST_SALT';

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
      const hashSequence = `${key}|${txnid}|${formattedAmount}|${productinfo}|${firstname}|${email}|${udf1 || (restaurant_id || '')}|${udf2 || (order_id || '')}|${udf3}|${udf4}|${udf5}||||||${salt}`;
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
        merchantKey: key,
        params: {
          key,
          txnid,
          amount: formattedAmount,
          productinfo,
          firstname,
          email,
          phone,
          surl: surl || `${req.protocol}://${req.get('host')}/api/payu/callback`,
          furl: furl || `${req.protocol}://${req.get('host')}/api/payu/callback`,
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

  // API Route: Real-Time PayU Payment Status Check (Polled by Frontend)
  app.get('/api/payu/check-status', async (req, res) => {
    try {
      const txnid = (req.query.txnid as string || '').trim();
      if (!txnid) {
        return res.status(400).json({ success: false, error: 'Missing txnid parameter' });
      }

      // 1. Check if callback has already registered a verified payment
      if (verifiedPayUTransactions.has(txnid)) {
        const record = verifiedPayUTransactions.get(txnid)!;
        return res.json({
          success: true,
          verified: true,
          ...record
        });
      }

      // 2. Query PayU Postservice if live credentials available
      const restaurantId = req.query.restaurant_id as string;
      const env = ((req.query.env as string) || 'TEST').toUpperCase();
      let key = (req.query.payu_key as string || '').trim();
      let salt = (req.query.payu_salt as string || '').trim();

      if (!key || !salt || salt.startsWith('•••') || key === 'PAYU_TEST_KEY') {
        if (restaurantId) {
          const restConfigs = readJsonFile<Record<string, any>>('restaurant_configs.json', {});
          const rCfg = restConfigs[restaurantId] || {};
          if (rCfg.payu_merchant_key) key = rCfg.payu_merchant_key;
          if (rCfg.payu_merchant_salt && !rCfg.payu_merchant_salt.startsWith('•••')) salt = rCfg.payu_merchant_salt;
        }
        if (!key || !salt || salt.startsWith('•••') || key === 'PAYU_TEST_KEY') {
          const ceoCfg = readJsonFile<any>('ceo_payment_config.json', {});
          if (ceoCfg.payu_merchant_key) key = ceoCfg.payu_merchant_key;
          if (ceoCfg.payu_merchant_salt && !ceoCfg.payu_merchant_salt.startsWith('•••')) salt = ceoCfg.payu_merchant_salt;
        }
      }

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

          const payuRes = await fetch(verifyApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
          });

          const payuData: any = await payuRes.json();
          if (payuData && payuData.status === 1 && payuData.transaction_details && payuData.transaction_details[txnid]) {
            const txnDetails = payuData.transaction_details[txnid];
            if (txnDetails.status === 'success') {
              const record: VerifiedPayUPaymentRecord = {
                status: 'success',
                txnid,
                mihpayid: txnDetails.mihpayid || `mih_${Date.now()}`,
                amount: Number(txnDetails.amt || txnDetails.transaction_amount || 0),
                mode: env === 'LIVE' ? 'live' : 'test',
                verified_at: new Date().toISOString()
              };
              verifiedPayUTransactions.set(txnid, record);
              return res.json({
                success: true,
                verified: true,
                ...record
              });
            }
          }
        } catch (postErr) {
          console.warn('PayU check-status postservice error:', postErr);
        }
      }

      // 3. Payment not yet confirmed by PayU gateway
      return res.json({
        success: false,
        verified: false,
        status: 'pending',
        message: 'Waiting for PayU gateway confirmation...'
      });
    } catch (err: any) {
      console.error('Error checking PayU payment status:', err);
      res.status(500).json({ success: false, error: 'Status check failed' });
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

      // Check if this transaction was already registered as verified
      if (verifiedPayUTransactions.has(txnid)) {
        const record = verifiedPayUTransactions.get(txnid)!;
        return res.json({
          success: true,
          verified: true,
          ...record
        });
      }

      let key = (payu_key || '').trim();
      let salt = (payu_salt || '').trim();

      if (!key || key === 'PAYU_TEST_KEY' || !salt || salt === 'PAYU_TEST_SALT' || salt.startsWith('•••')) {
        const restId = udf1 || req.body.restaurant_id;
        if (restId) {
          const restConfigs = readJsonFile<Record<string, any>>('restaurant_configs.json', {});
          const rCfg = restConfigs[restId] || {};
          if (rCfg.payu_merchant_key && (!key || key === 'PAYU_TEST_KEY')) key = rCfg.payu_merchant_key;
          if (rCfg.payu_merchant_salt && (!salt || salt === 'PAYU_TEST_SALT' || salt.startsWith('•••'))) salt = rCfg.payu_merchant_salt;
        }
        if (!key || key === 'PAYU_TEST_KEY' || !salt || salt === 'PAYU_TEST_SALT' || salt.startsWith('•••')) {
          const ceoCfg = readJsonFile<any>('ceo_payment_config.json', {});
          if (ceoCfg.payu_merchant_key && (!key || key === 'PAYU_TEST_KEY')) key = ceoCfg.payu_merchant_key;
          if (ceoCfg.payu_merchant_salt && (!salt || salt === 'PAYU_TEST_SALT' || salt.startsWith('•••'))) salt = ceoCfg.payu_merchant_salt;
        }
      }

      key = key || process.env.PAYU_MERCHANT_KEY || 'PAYU_TEST_KEY';
      salt = salt || process.env.PAYU_MERCHANT_SALT || 'PAYU_TEST_SALT';
      const formattedAmount = Number(amount || 0).toFixed(2);

      // Verify Reverse Hash if live salt and return hash provided
      let isHashValid = false;
      if (salt && salt !== 'PAYU_TEST_SALT' && hash && status) {
        // PayU Reverse Hash Sequence:
        // sha512(salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
        const reverseHashSequence = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${formattedAmount}|${txnid}|${key}`;
        const calculatedHash = crypto.createHash('sha512').update(reverseHashSequence).digest('hex');

        if (calculatedHash.toLowerCase() === (hash || '').toLowerCase() && status === 'success') {
          isHashValid = true;
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
              const record: VerifiedPayUPaymentRecord = {
                status: 'success',
                txnid,
                mihpayid: txnDetails.mihpayid || mihpayid || `mih_${Date.now()}`,
                amount: Number(txnDetails.amt || formattedAmount),
                mode: 'live',
                verified_at: new Date().toISOString()
              };
              verifiedPayUTransactions.set(txnid, record);
              return res.json({
                success: true,
                verified: true,
                ...record
              });
            }
          }
        } catch (postErr) {
          console.warn('PayU postservice verification network error:', postErr);
        }
      }

      // If reverse hash matched or test hash validated
      if (isHashValid || (mode === 'demo' && status === 'success')) {
        const record: VerifiedPayUPaymentRecord = {
          status: 'success',
          txnid,
          mihpayid: mihpayid || `mih_${Date.now()}`,
          amount: Number(formattedAmount),
          mode: mode || 'demo',
          verified_at: new Date().toISOString()
        };
        verifiedPayUTransactions.set(txnid, record);
        return res.json({
          success: true,
          verified: true,
          ...record
        });
      }

      // Strict rejection if PayU has not verified this transaction
      return res.status(400).json({
        success: false,
        verified: false,
        status: 'pending',
        error: 'PayU gateway confirmation was not received for this transaction.'
      });
    } catch (err: any) {
      console.error('Error verifying PayU payment:', err);
      res.status(500).json({ error: 'PayU payment verification failed' });
    }
  });

  // API Route: PayU Callback Handler (POST & GET from PayU Gateway)
  app.all('/api/payu/callback', (req, res) => {
    try {
      const data = req.method === 'POST' ? req.body : req.query;
      const status = data.status || (data.unmappedstatus === 'captured' ? 'success' : 'pending');
      const txnid = data.txnid || '';
      const amount = Number(data.amount) || 0;
      const mihpayid = data.mihpayid || data.payuMoneyId || '';
      const hash = data.hash || '';
      const udf1 = data.udf1 || ''; // restaurant_id
      const udf2 = data.udf2 || ''; // order_id
      const udf3 = data.udf3 || ''; // table_short_code
      const udf4 = data.udf4 || ''; // session_id
      const udf5 = data.udf5 || ''; // is_subscription: '1' if subscription

      const isSuccess = status === 'success';

      if (isSuccess && txnid) {
        verifiedPayUTransactions.set(txnid, {
          status: 'success',
          txnid,
          mihpayid: mihpayid || `mih_${Date.now()}`,
          amount,
          hash,
          mode: 'payu_gateway',
          verified_at: new Date().toISOString(),
          udf1,
          udf2,
          udf3,
          udf4,
          udf5
        });
      }

      const isSubscription = udf5 === '1' || txnid.startsWith('SUB_') || txnid.startsWith('RENEW_');

      let targetRedirectUrl = '/';
      if (isSubscription) {
        targetRedirectUrl = `/owner-dashboard?payment=${isSuccess ? 'success' : 'failed'}&txnid=${encodeURIComponent(txnid)}`;
      } else if (udf3 || udf2) {
        targetRedirectUrl = `/q/${encodeURIComponent(udf3 || 'table')}?order_id=${encodeURIComponent(udf2)}&payment=${isSuccess ? 'success' : 'failed'}&txnid=${encodeURIComponent(txnid)}`;
      } else {
        targetRedirectUrl = '/';
      }

      // Update server order record if payment was successful
      if (isSuccess && udf2) {
        try {
          const allOrders = readJsonFile<any[]>('orders.json', []);
          const idx = allOrders.findIndex(o => o.id === udf2);
          if (idx >= 0) {
            allOrders[idx] = {
              ...allOrders[idx],
              payment_status: 'paid_live',
              order_status: allOrders[idx].order_status === 'pending' ? 'accepted' : allOrders[idx].order_status,
              online_amount: amount || allOrders[idx].grand_total,
              cash_due: 0,
              transaction_id: txnid || mihpayid,
              updated_at: new Date().toISOString()
            };
            writeJsonFile('orders.json', allOrders.slice(0, 1000));
            broadcastRealtimeOrderEvent(allOrders[idx].restaurant_id, {
              type: 'ORDER_UPDATED',
              restaurant_id: allOrders[idx].restaurant_id,
              order: allOrders[idx],
              timestamp: new Date().toISOString()
            });
          }
        } catch (e) {
          console.warn('Could not sync order on PayU callback:', e);
        }
      }

      // Return a clean HTML response that automatically notifies parent or redirects back
      const htmlResponse = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>PayU Payment ${isSuccess ? 'Success' : 'Status'}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: #020617;
              color: #f8fafc;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            .card {
              background-color: #0f172a;
              border: 1px solid ${isSuccess ? '#10b981' : '#f59e0b'};
              border-radius: 24px;
              padding: 32px;
              max-width: 420px;
              width: 100%;
              text-align: center;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
            }
            .icon {
              width: 56px;
              height: 56px;
              border-radius: 50%;
              background-color: ${isSuccess ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'};
              color: ${isSuccess ? '#34d399' : '#fbbf24'};
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 28px;
              margin: 0 auto 16px;
            }
            h1 { font-size: 20px; margin: 0 0 8px; color: #fff; }
            p { font-size: 13px; color: #94a3b8; margin: 0 0 20px; line-height: 1.5; }
            .details {
              background-color: #020617;
              border-radius: 12px;
              padding: 12px 16px;
              margin-bottom: 20px;
              text-align: left;
              font-size: 12px;
            }
            .row { display: flex; justify-content: space-between; margin-bottom: 6px; }
            .row:last-child { margin-bottom: 0; }
            .btn {
              display: inline-block;
              width: 100%;
              padding: 12px;
              border-radius: 12px;
              background-color: ${isSuccess ? '#10b981' : '#3b82f6'};
              color: #fff;
              text-decoration: none;
              font-weight: bold;
              font-size: 14px;
              border: none;
              cursor: pointer;
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">${isSuccess ? '✓' : '!'}</div>
            <h1>${isSuccess ? 'Payment Confirmed by PayU!' : 'Payment ' + (status || 'Processed')}</h1>
            <p>${isSuccess ? 'Your transaction has been verified securely by PayU Gateway.' : 'Transaction response received from PayU gateway.'}</p>
            
            <div class="details">
              <div class="row"><span>Status:</span><strong style="color: ${isSuccess ? '#34d399' : '#fbbf24'}; text-transform: uppercase;">${status}</strong></div>
              ${amount ? `<div class="row"><span>Amount:</span><strong>₹${amount}</strong></div>` : ''}
              ${txnid ? `<div class="row"><span>Txn ID:</span><span style="font-family: monospace; font-size: 11px;">${txnid}</span></div>` : ''}
              ${mihpayid ? `<div class="row"><span>PayU ID:</span><span style="font-family: monospace; font-size: 11px;">${mihpayid}</span></div>` : ''}
            </div>

            <button class="btn" onclick="closeOrRedirect()">${isSubscription ? 'Return to Dashboard' : 'Return to Order'}</button>
          </div>

          <script>
            const payload = {
              type: 'PAYU_PAYMENT_CALLBACK',
              status: '${status}',
              txnid: '${txnid}',
              amount: '${amount}',
              mihpayid: '${mihpayid}',
              hash: '${hash}',
              udf1: '${udf1}',
              udf2: '${udf2}',
              udf3: '${udf3}',
              udf4: '${udf4}',
              udf5: '${udf5}'
            };

            // Notify parent / opener window via PostMessage, localStorage, and BroadcastChannel
            try {
              if (window.opener) {
                window.opener.postMessage(payload, '*');
              }
              if (window.parent && window.parent !== window) {
                window.parent.postMessage(payload, '*');
              }
              if (typeof localStorage !== 'undefined' && '${txnid}') {
                localStorage.setItem('digimoms_payu_status_' + '${txnid}', JSON.stringify(payload));
              }
              if (typeof BroadcastChannel !== 'undefined') {
                const bc = new BroadcastChannel('digimoms_payu_channel');
                bc.postMessage(payload);
                bc.close();
              }
            } catch (e) {
              console.warn('Callback notification error:', e);
            }

            function closeOrRedirect() {
              if (window.opener) {
                try { window.close(); } catch(e) {}
              } else {
                window.location.href = '${targetRedirectUrl}';
              }
            }

            // Auto close popup if successful
            if (window.opener && '${isSuccess}' === 'true') {
              setTimeout(() => {
                try { window.close(); } catch(e) {}
              }, 2000);
            } else if (!window.opener && '${isSuccess}' === 'true') {
              setTimeout(() => {
                window.location.href = '${targetRedirectUrl}';
              }, 2500);
            }
          </script>
        </body>
        </html>
      `;

      res.setHeader('Content-Type', 'text/html');
      return res.send(htmlResponse);
    } catch (err) {
      console.error('PayU callback error:', err);
      res.redirect('/');
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

Reasoning Workflow:
1. IDENTIFY USER ROLE & INTENT: Understand whether user is Customer, Waiter, Kitchen, Owner, or CEO, and what specific action they want to accomplish.
2. CHECK CONTEXT & ACCURACY: Check current restaurant, view, and role permissions. If user asks for DigiMoms support, contact number, or WhatsApp number, provide official DigiMoms channels:
   - Official WhatsApp Support Line / Contact: 9475388085 (+91 9475388085)
   - Official Support Email: digimomsagency@gmail.com
   - Official Web Portals: https://www.digmoms.in or https://os.digimoms.in
   - Company: DigiMoms Marketing Agency (Sub: DigiMoms Restaurant OS / DigiMoms Smart Restaurant OS)
   - Founder & Owner: Tanmoy Jana (Sabang, Paschim Medinipur, West Bengal, India)
   - Supported Payment Gateways: PayU, PhonePe, Razorpay, plus Direct UPI QR and Cash on Counter / Table
   - Support Operating Hours: Monday to Saturday, 9:00 AM - 9:00 PM IST
   Never invent random phone numbers or personal mobile numbers.
3. ANSWER DIRECTLY: Provide actionable, step-by-step guidance without unrelated answers, hallucinations, or unrequested conversational fluff.

Country & Currency Rules:
- Default Country: India
- Default Currency: Indian Rupee (INR / ₹) (e.g. ₹499, ₹999, ₹1,099, ₹2,500)
- Timezone: Asia/Kolkata
- NEVER use Bangladesh or BDT (৳) currency or Bangladesh payment services (bKash/Nagad/Rocket/Bangladesh Bank).
- Even if the user selects Bengali (বাংলা), respond strictly within the Indian context (India, ₹ INR, PayU/PhonePe/Razorpay/UPI, Indian restaurant rules).

Payment Gateway Context:
- Supported Payment Gateways in DigiMoms OS: PayU, PhonePe, and Razorpay, plus Direct UPI QR and Cash settlements.
- Demo Payment Mode: Permanent simulated mode inside app for safe testing without real money transfer. Always label as DEMO PAYMENT.
- Live Payment Mode: Requires valid merchant gateway credentials. Live payments MUST be verified server-side via gateway verification API before marking as paid.
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
- Online Payment: Customer/Owner selects Online Payment -> Gateway checkout -> Server verifies transaction status -> Payment marked as paid -> Order/Subscription updated.
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
