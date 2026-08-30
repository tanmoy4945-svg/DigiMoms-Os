import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://qjkoeehgkfnailgmhyjs.supabase.co').replace(/\/+$/, '');
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_TMLOZVNYis6bZInTdfWJ3Q_BJ1kiuih';
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req: any, res: any) {
  try {
    const data = req.method === 'POST' ? req.body : req.query;
    const status = (data?.status || (data?.unmappedstatus === 'captured' ? 'success' : 'pending')).toLowerCase();
    const txnid = data?.txnid || '';
    const amount = Number(data?.amount) || 0;
    const mihpayid = data?.mihpayid || data?.payuMoneyId || '';
    const hash = data?.hash || '';
    const error_Message = data?.error_Message || data?.field9 || '';
    const udf1 = data?.udf1 || ''; // restaurant_id
    const udf2 = data?.udf2 || ''; // order_id
    const udf3 = data?.udf3 || ''; // table_code or table url
    const udf4 = data?.udf4 || ''; // session_id
    const udf5 = data?.udf5 || ''; // is_subscription: '1' if subscription

    const isSuccess = status === 'success';
    const isSubscription = udf5 === '1' || txnid.startsWith('SUB_') || txnid.startsWith('RENEW_');

    let targetRedirectUrl = '/';
    if (isSubscription) {
      targetRedirectUrl = `/owner-dashboard?payment=${isSuccess ? 'success' : 'failed'}&txnid=${encodeURIComponent(txnid)}`;
    } else if (udf3) {
      const basePath = udf3.startsWith('/') ? udf3 : `/q/${encodeURIComponent(udf3)}`;
      targetRedirectUrl = `${basePath}?order_id=${encodeURIComponent(udf2)}&payment=${isSuccess ? 'success' : 'failed'}&txnid=${encodeURIComponent(txnid)}`;
    } else if (udf2) {
      targetRedirectUrl = `/?order_id=${encodeURIComponent(udf2)}&payment=${isSuccess ? 'success' : 'failed'}&txnid=${encodeURIComponent(txnid)}`;
    }

    // Directly sync success status to Supabase database so Owner & Staff terminals receive live confirmation
    if (isSuccess && udf2) {
      try {
        const confirmedAtIso = new Date().toISOString();
        const { data: updatedOrd } = await serverSupabase
          .from('orders')
          .update({
            payment_status: 'paid_live',
            order_status: 'accepted',
            online_amount: amount,
            cash_due: 0,
            payment_actor_id: mihpayid || txnid || 'payu_gateway',
            payment_actor_type: 'customer',
            payment_actor_name: 'Online Payment (PayU)',
            payment_confirmed_at: confirmedAtIso,
            transaction_id: txnid || mihpayid,
            updated_at: confirmedAtIso
          })
          .eq('id', udf2)
          .select()
          .maybeSingle();

        const restId = udf1 || updatedOrd?.restaurant_id;
        if (restId) {
          await serverSupabase.from('payment_transactions').insert({
            id: `pt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            order_id: udf2,
            restaurant_id: restId,
            amount: amount,
            mode: 'payu',
            type: 'online',
            status: 'success',
            reference_id: txnid || mihpayid,
            actor_id: 'payu_gateway',
            actor_name: 'Online Payment (PayU)',
            actor_type: 'customer',
            created_at: confirmedAtIso
          });
        }
      } catch (dbErr) {
        console.warn('Could not sync PayU order directly to Supabase in serverless function:', dbErr);
      }
    }

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
            padding: 14px;
            border-radius: 12px;
            background-color: ${isSuccess ? '#10b981' : '#3b82f6'};
            color: #fff;
            text-decoration: none;
            font-weight: bold;
            font-size: 15px;
            border: none;
            cursor: pointer;
            box-sizing: border-box;
            transition: all 0.2s ease;
          }
          .btn:active {
            transform: scale(0.98);
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">${isSuccess ? '✓' : '!'}</div>
          <h1>${isSuccess ? 'Payment Successful!' : 'Payment ' + (status.toUpperCase() || 'FAILED')}</h1>
          <p>${isSuccess ? 'Your transaction has been confirmed by PayU.' : (error_Message || 'Payment was not completed.')}</p>
          
          <div class="details">
            <div class="row"><span>Status:</span><strong style="color: ${isSuccess ? '#34d399' : '#fbbf24'}; text-transform: uppercase;">${status}</strong></div>
            ${amount ? `<div class="row"><span>Amount:</span><strong>₹${amount.toFixed(2)}</strong></div>` : ''}
            ${txnid ? `<div class="row"><span>Txn ID:</span><span style="font-family: monospace; font-size: 11px;">${txnid}</span></div>` : ''}
            ${mihpayid ? `<div class="row"><span>PayU ID:</span><span style="font-family: monospace; font-size: 11px;">${mihpayid}</span></div>` : ''}
          </div>

          <button class="btn" onclick="closeOrRedirect()">${isSubscription ? 'Go to Dashboard' : 'Go to Home'}</button>
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
              try {
                window.opener.postMessage(payload, '*');
                window.close();
              } catch(e) {
                window.location.href = '${targetRedirectUrl}';
              }
            } else {
              window.location.href = '${targetRedirectUrl}';
            }
          }

          if (window.opener && '${isSuccess}' === 'true') {
            setTimeout(() => {
              try { window.close(); } catch(e) {}
            }, 1800);
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
    return res.status(200).send(htmlResponse);
  } catch (err: any) {
    console.error('Vercel PayU callback error:', err);
    return res.redirect('/');
  }
}
