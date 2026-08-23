export default async function handler(req: any, res: any) {
  try {
    const data = req.method === 'POST' ? req.body : req.query;
    const status = (data?.status || 'success').toLowerCase();
    const txnid = data?.txnid || '';
    const amount = data?.amount || '';
    const mihpayid = data?.mihpayid || data?.payuMoneyId || '';
    const hash = data?.hash || '';
    const error_Message = data?.error_Message || data?.field9 || '';

    const isSuccess = status === 'success';

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
          <h1>${isSuccess ? 'Payment Successful!' : 'Payment ' + (status.toUpperCase() || 'FAILED')}</h1>
          <p>${isSuccess ? 'Your transaction has been confirmed by PayU.' : (error_Message || 'Payment was not completed.')}</p>
          
          <div class="details">
            <div class="row"><span>Status:</span><strong style="color: ${isSuccess ? '#34d399' : '#fbbf24'}; text-transform: uppercase;">${status}</strong></div>
            ${amount ? `<div class="row"><span>Amount:</span><strong>₹${amount}</strong></div>` : ''}
            ${txnid ? `<div class="row"><span>Txn ID:</span><span style="font-family: monospace; font-size: 11px;">${txnid}</span></div>` : ''}
            ${mihpayid ? `<div class="row"><span>PayU ID:</span><span style="font-family: monospace; font-size: 11px;">${mihpayid}</span></div>` : ''}
          </div>

          <button class="btn" onclick="closeOrRedirect()">Return to Dashboard</button>
        </div>

        <script>
          const payload = {
            type: 'PAYU_PAYMENT_CALLBACK',
            status: '${status}',
            txnid: '${txnid}',
            amount: '${amount}',
            mihpayid: '${mihpayid}',
            hash: '${hash}'
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
              try { window.close(); } catch(e) {}
            } else {
              window.location.href = '/owner-dashboard';
            }
          }

          if (window.opener && '${isSuccess}' === 'true') {
            setTimeout(() => {
              try { window.close(); } catch(e) {}
            }, 1800);
          }
        </script>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(htmlResponse);
  } catch (err: any) {
    console.error('Vercel PayU callback error:', err);
    return res.redirect('/owner-dashboard');
  }
}
