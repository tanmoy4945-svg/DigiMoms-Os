export default async function handler(req: any, res: any) {
  try {
    const data = req.method === 'POST' ? req.body : req.query;
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
          <h1>${isSuccess ? 'Payment Successful!' : 'Payment ' + code}</h1>
          <p>${isSuccess ? 'Your transaction has been processed by PhonePe.' : 'Payment could not be completed.'}</p>
          
          <div class="details">
            <div class="row"><span>Status:</span><strong style="color: ${isSuccess ? '#34d399' : '#fbbf24'};">${code}</strong></div>
            ${amount ? `<div class="row"><span>Amount:</span><strong>₹${amount}</strong></div>` : ''}
            ${merchantTransactionId ? `<div class="row"><span>Transaction ID:</span><span style="font-family: monospace; font-size: 11px;">${merchantTransactionId}</span></div>` : ''}
            ${transactionId ? `<div class="row"><span>PhonePe Ref:</span><span style="font-family: monospace; font-size: 11px;">${transactionId}</span></div>` : ''}
          </div>

          <button class="btn" onclick="closeOrRedirect()">Return to Dashboard</button>
        </div>

        <script>
          const payload = {
            type: 'PHONEPE_PAYMENT_CALLBACK',
            status: '${isSuccess ? 'success' : 'failed'}',
            merchantTransactionId: '${merchantTransactionId}',
            transactionId: '${transactionId}',
            amount: '${amount}',
            code: '${code}'
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
          } catch (e) {
            console.warn('Callback error:', e);
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
    console.error('PhonePe callback error:', err);
    return res.redirect('/owner-dashboard');
  }
}
