import fetch from 'node-fetch';

async function testApi() {
  console.log("Testing GET /api/ceo/payment-config...");
  const res1 = await fetch('http://localhost:3000/api/ceo/payment-config');
  const json1 = await res1.json();
  console.log("GET result:", json1);

  console.log("Saving LIVE PayU configuration...");
  const res2 = await fetch('http://localhost:3000/api/ceo/payment-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      primary_gateway: 'payu',
      mode: 'live',
      payu_merchant_key: 'TEST_KEY_123',
      payu_merchant_salt: 'TEST_SALT_456',
      payu_env: 'LIVE',
      payu_verified: true
    })
  });
  const json2 = await res2.json();
  console.log("POST result:", json2);

  console.log("Testing GET again after save...");
  const res3 = await fetch('http://localhost:3000/api/ceo/payment-config');
  const json3 = await res3.json();
  console.log("GET after save:", json3);
}

testApi();
