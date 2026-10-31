import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://qjkoeehgkfnailgmhyjs.supabase.co')
  .trim().replace(/\/+$/, '').replace(/\/rest\/v1\/?$/i, '');
const SUPABASE_ANON_KEY = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_TMLOZVNYis6bZInTdfWJ3Q_BJ1kiuih').trim();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req: any, res: any) {
  try {
    // 1. Extract data safely from POST body or GET query
    let data: any = {};
    if (req.method === 'POST') {
      data = req.body || {};
      if (typeof data === 'string') {
        try {
          const parsed = new URLSearchParams(data);
          const obj: any = {};
          parsed.forEach((v, k) => { obj[k] = v; });
          data = obj;
        } catch {}
      }
    } else {
      data = req.query || {};
    }

    const status = String(data.status || (data.unmappedstatus === 'captured' ? 'success' : 'pending')).toLowerCase();
    const isSuccess = status === 'success';
    const txnid = String(data.txnid || '').trim();
    const amount = Number(data.amount) || 0;
    const mihpayid = String(data.mihpayid || data.payuMoneyId || '').trim();
    const hash = String(data.hash || '').trim();
    const udf1 = String(data.udf1 || '').trim(); // restaurant_id
    const udf2 = String(data.udf2 || '').trim(); // order_id
    const udf3 = String(data.udf3 || '').trim(); // table / short_code
    const udf4 = String(data.udf4 || '').trim(); // session_id
    const udf5 = String(data.udf5 || '').trim(); // is_subscription ('1')

    const isSubscription = udf5 === '1' || txnid.startsWith('SUB_') || txnid.startsWith('RENEW_') || (!udf2 && Boolean(udf1));

    // 2. If it is a subscription renewal and payment is SUCCESS, activate in Supabase:
    if (isSuccess && isSubscription && udf1) {
      try {
        console.log(`[PayU Callback] Activating Subscription for restaurant ${udf1}, txnid: ${txnid}, amount: ${amount}`);
        
        // Fetch current restaurant to calculate exact new calendar expiry
        const { data: currentRest } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', udf1)
          .maybeSingle();

        const now = Date.now();
        const currentExpiryMs = new Date(currentRest?.subscription_end || currentRest?.trial_end || now).getTime();
        const baseDate = new Date(currentExpiryMs > now ? currentExpiryMs : now);

        const newExpiryDate = new Date(baseDate.getTime());
        newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);
        const newSubEndIso = newExpiryDate.toISOString();

        // Authoritative update in Supabase: status = 'active', extended subscription_end
        const { error: restUpdateErr } = await supabase
          .from('restaurants')
          .update({
            subscription_end: newSubEndIso,
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', udf1);

        if (restUpdateErr) {
          console.error('[PayU Callback] Supabase update error:', restUpdateErr.message);
        } else {
          console.log(`[PayU Callback] Successfully updated restaurant ${udf1} to active, new expiry: ${newSubEndIso}`);
        }

        // Insert into subscription_history table in Supabase
        const historyId = crypto.randomUUID();
        await supabase
          .from('subscription_history')
          .insert([{
            id: historyId,
            restaurant_id: udf1,
            plan_name: 'Monthly Standard Subscription',
            amount: amount || (currentRest?.monthly_subscription_fee || 999),
            amount_paid: amount || (currentRest?.monthly_subscription_fee || 999),
            duration_months: 1,
            days_added: 30,
            payment_id: txnid || mihpayid || `PAYU_${Date.now()}`,
            transaction_id: txnid || mihpayid,
            start_date: baseDate.toISOString(),
            end_date: newSubEndIso,
            previous_expiry: new Date(currentExpiryMs).toISOString(),
            new_expiry: newSubEndIso,
            payment_status: 'paid',
            payment_mode: 'live',
            subscription_type: 'RENEWAL',
            granted_by: 'Owner Payment (PayU Gateway)',
            commission_status: currentRest?.partner_mobile ? 'pending' : undefined,
            created_at: new Date().toISOString()
          }]);
      } catch (subErr) {
        console.error('[PayU Callback] Subscription update exception:', subErr);
      }
    }

    // 3. If it is a food order and payment succeeded:
    if (isSuccess && udf2) {
      try {
        await supabase
          .from('orders')
          .update({
            payment_status: 'paid_live',
            order_status: 'accepted',
            online_amount: amount,
            cash_due: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', udf2);
      } catch (orderErr) {
        console.error('[PayU Callback] Order update exception:', orderErr);
      }
    }

    // 4. Determine redirect URL
    const statusParam = isSuccess ? 'success' : 'cancelled';
    let targetRedirectUrl = '/';
    if (isSubscription) {
      targetRedirectUrl = `/owner-dashboard?payment=${statusParam}&txnid=${encodeURIComponent(txnid)}&renewed=1`;
    } else if (udf3) {
      const basePath = udf3.startsWith('/') ? udf3 : `/q/${encodeURIComponent(udf3)}`;
      targetRedirectUrl = `${basePath}?order_id=${encodeURIComponent(udf2)}&payment=${statusParam}&txnid=${encodeURIComponent(txnid)}`;
    } else if (udf2) {
      targetRedirectUrl = `/?order_id=${encodeURIComponent(udf2)}&payment=${statusParam}&txnid=${encodeURIComponent(txnid)}`;
    }

    // 5. Generate and send complete HTML response
    const htmlResponse = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>PayU Payment ${isSuccess ? 'Success' : 'Status'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #020617; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background-color: #0f172a; border: 1px solid ${isSuccess ? '#10b981' : '#f59e0b'}; border-radius: 24px; padding: 32px; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
    .icon { width: 56px; height: 56px; border-radius: 50%; background-color: ${isSuccess ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}; color: ${isSuccess ? '#34d399' : '#fbbf24'}; display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 16px; }
    h1 { font-size: 20px; margin: 0 0 8px; color: #fff; }
    p { font-size: 13px; color: #94a3b8; margin: 0 0 20px; line-height: 1.5; }
    .details { background-color: #020617; border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; text-align: left; font-size: 12px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .row:last-child { margin-bottom: 0; }
    .btn { display: inline-block; width: 100%; padding: 14px; border-radius: 12px; background-color: ${isSuccess ? '#10b981' : '#3b82f6'}; color: #fff; text-decoration: none; font-weight: bold; font-size: 15px; border: none; cursor: pointer; box-sizing: border-box; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${isSuccess ? '✓' : '!'}</div>
    <h1>${isSuccess ? 'Payment Confirmed by PayU!' : 'Payment Cancelled / Incomplete'}</h1>
    <p>${isSuccess ? (isSubscription ? 'Your subscription has been renewed and your restaurant account is now ACTIVE.' : 'Your transaction has been verified securely by PayU Gateway.') : 'Payment was not completed. Please try again.'}</p>
    
    <div class="details">
      <div class="row"><span>Status:</span><strong style="color: ${isSuccess ? '#34d399' : '#fbbf24'}; text-transform: uppercase;">${status}</strong></div>
      ${amount ? `<div class="row"><span>Amount:</span><strong>₹${amount.toFixed(2)}</strong></div>` : ''}
      ${txnid ? `<div class="row"><span>Txn ID:</span><span style="font-family: monospace; font-size: 11px;">${txnid}</span></div>` : ''}
      ${mihpayid ? `<div class="row"><span>PayU ID:</span><span style="font-family: monospace; font-size: 11px;">${mihpayid}</span></div>` : ''}
    </div>

    <button class="btn" onclick="closeOrRedirect()">${isSubscription ? 'Go to Owner Dashboard' : (isSuccess ? 'Go to Home' : 'Return')}</button>
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

    try {
      if (window.opener) {
        window.opener.postMessage(payload, '*');
      }
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
      }
      if (typeof localStorage !== 'undefined' && '${txnid}') {
        localStorage.setItem('digimoms_payu_status_' + '${txnid}', JSON.stringify(payload));
        if ('${isSuccess}' === 'true' && '${isSubscription}' === 'true') {
          localStorage.setItem('digimoms_subscription_renewed', JSON.stringify({
            restaurant_id: '${udf1}',
            txnid: '${txnid}',
            timestamp: Date.now()
          }));
        }
      }
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('digimoms_payu_channel');
        bc.postMessage(payload);
        bc.close();
      }
    } catch (e) {}

    function closeOrRedirect() {
      if (window.opener) {
        try {
          window.opener.postMessage(payload, '*');
          window.close();
        } catch (e) {
          window.location.href = '${targetRedirectUrl}';
        }
      } else {
        window.location.href = '${targetRedirectUrl}';
      }
    }

    // Auto close popup or redirect immediately
    if (window.opener && '${isSuccess}' === 'true') {
      try { window.opener.postMessage(payload, '*'); } catch(e) {}
      setTimeout(() => {
        try { window.close(); } catch(e) {}
      }, 500);
    } else if (!window.opener && '${isSuccess}' === 'true') {
      setTimeout(() => {
        window.location.replace('${targetRedirectUrl}');
      }, 500);
    }
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(htmlResponse);
  } catch (err: any) {
    console.error('[PayU Callback Fatal Error]:', err);
    return res.redirect(302, '/owner-dashboard?payment=cancelled');
  }
}
