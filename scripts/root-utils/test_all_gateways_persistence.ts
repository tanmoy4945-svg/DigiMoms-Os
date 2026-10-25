import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qjkoeehgkfnailgmhyjs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TMLOZVNYis6bZInTdfWJ3Q_BJ1kiuih';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const MASTER_CEO_CONFIG_ID = '00000000-0000-0000-0000-000000000000';

async function testPersistenceForGateway(gateway: string, configUpdates: any) {
  console.log(`\n========================================`);
  console.log(`TESTING PERSISTENCE FOR GATEWAY: ${gateway.toUpperCase()}`);
  console.log(`========================================`);

  // 1. Read current master record
  const { data: existing, error: readErr } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', MASTER_CEO_CONFIG_ID)
    .single();

  if (readErr) {
    console.error('Error reading existing master record:', readErr);
    return false;
  }

  let currentConfig: any = {};
  if (existing?.razorpay_secret) {
    try {
      const parsed = typeof existing.razorpay_secret === 'string' ? JSON.parse(existing.razorpay_secret) : existing.razorpay_secret;
      currentConfig = parsed._ceo_payment_config || {};
    } catch (e) {}
  }

  // 2. Merge updates
  const newConfig = {
    ...currentConfig,
    ...configUpdates,
    primary_gateway: gateway
  };

  // 3. Save to Supabase
  const { error: upsertErr } = await supabase.from('restaurants').upsert([{
    id: MASTER_CEO_CONFIG_ID,
    name: '[SYSTEM] CEO Master Config',
    slug: 'system-ceo-master-config',
    owner_name: 'CEO SuperAdmin',
    owner_mobile: '8900415647',
    password_hash: 'system_internal',
    status: 'system_internal',
    payment_mode: newConfig.mode || 'demo',
    razorpay_secret: JSON.stringify({
      _ceo_payment_config: newConfig
    }),
    business_hours: '24/7',
    address: 'System Master',
    updated_at: new Date().toISOString()
  }]);

  if (upsertErr) {
    console.error(`Failed to save config for ${gateway}:`, upsertErr);
    return false;
  }

  // 4. Simulate a fresh page load / new session / new tab by querying Supabase cleanly
  const { data: refreshed, error: refreshErr } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', MASTER_CEO_CONFIG_ID)
    .single();

  if (refreshErr || !refreshed) {
    console.error(`Failed to fetch refreshed record for ${gateway}:`, refreshErr);
    return false;
  }

  const loadedSecret = typeof refreshed.razorpay_secret === 'string' ? JSON.parse(refreshed.razorpay_secret) : refreshed.razorpay_secret;
  const loadedConfig = loadedSecret._ceo_payment_config;

  console.log(`Verified Loaded Primary Gateway: ${loadedConfig.primary_gateway}`);
  console.log(`Verified Loaded Mode: ${loadedConfig.mode}`);
  
  if (gateway === 'payu') {
    console.log(`PayU Key: ${loadedConfig.payu_merchant_key}`);
    console.log(`PayU Env: ${loadedConfig.payu_env}`);
    console.log(`PayU Verified: ${loadedConfig.payu_verified}`);
  } else if (gateway === 'phonepe') {
    console.log(`PhonePe Merchant ID: ${loadedConfig.phonepe_merchant_id}`);
    console.log(`PhonePe Env: ${loadedConfig.phonepe_env}`);
    console.log(`PhonePe Verified: ${loadedConfig.phonepe_verified}`);
  } else if (gateway === 'razorpay') {
    console.log(`Razorpay Key ID: ${loadedConfig.razorpay_key_id}`);
    console.log(`Razorpay Verified: ${loadedConfig.razorpay_verified}`);
  }

  const matches = loadedConfig.primary_gateway === gateway && loadedConfig.mode === newConfig.mode;
  console.log(`✅ Result for ${gateway}: ${matches ? 'PASS (100% Durable Persistence)' : 'FAIL'}`);
  return matches;
}

async function runAll() {
  console.log('Testing durable persistence for all supported gateways...\n');

  // Test 1: PhonePe Gateway
  const phonepePass = await testPersistenceForGateway('phonepe', {
    mode: 'live',
    phonepe_merchant_id: 'MERCHANT_PHONEPE_TEST_ID',
    phonepe_salt_key: 'salt_key_phonepe_12345',
    phonepe_salt_index: '1',
    phonepe_env: 'PRODUCTION',
    phonepe_verified: true
  });

  // Test 2: Razorpay Gateway
  const razorpayPass = await testPersistenceForGateway('razorpay', {
    mode: 'live',
    razorpay_key_id: 'rzp_live_abcdef12345678',
    razorpay_key_secret: 'secret_rzp_987654321',
    razorpay_verified: true
  });

  // Test 3: PayU Gateway
  const payuPass = await testPersistenceForGateway('payu', {
    mode: 'live',
    payu_merchant_key: 'jTiqzx',
    payu_merchant_salt: 'Jp0apIqb5nstR9XDyQyVxM824YoRQ737',
    payu_env: 'LIVE',
    payu_verified: true
  });

  console.log('\n========================================');
  console.log('ALL GATEWAY PERSISTENCE TEST RESULTS:');
  console.log(`PhonePe Persistence: ${phonepePass ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Razorpay Persistence: ${razorpayPass ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`PayU Persistence:     ${payuPass ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('========================================\n');
}

runAll();
