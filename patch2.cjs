const fs = require('fs');
let content = fs.readFileSync('src/context/SaaSContext.tsx', 'utf8');

content = content.replace(
`    try {
      await supabase.from('subscription_history').insert([{
        id: crypto.randomUUID(),
        restaurant_id: id,
        plan_name: \`CEO Extension (+\${extraDays} Days)\`,
        amount: 0,
        duration_months: 0,
        days_added: extraDays,
        start_date: new Date(baseTime).toISOString(),
        end_date: newExpiry,
        previous_expiry: new Date(currentExpiry).toISOString(),
        new_expiry: newExpiry,
        payment_status: 'CEO Extension',
        payment_mode: 'free',
        subscription_type: 'CEO_FREE_EXTENSION',
        granted_by: 'CEO',
        reason: \`CEO dynamically added \${extraDays} days\`,
        created_at: new Date().toISOString()
      }]);
    } catch (err) {
      console.warn("Free extension history insert error:", err);
    }`,
`    const historyRecord = {
        id: crypto.randomUUID(),
        restaurant_id: id,
        plan_name: \`CEO Extension (+\${extraDays} Days)\`,
        amount: 0,
        duration_months: 0,
        days_added: extraDays,
        start_date: new Date(baseTime).toISOString(),
        end_date: newExpiry,
        previous_expiry: new Date(currentExpiry).toISOString(),
        new_expiry: newExpiry,
        payment_status: 'CEO Extension',
        payment_mode: 'free',
        subscription_type: 'CEO_FREE_EXTENSION',
        granted_by: 'CEO',
        reason: \`CEO dynamically added \${extraDays} days\`,
        created_at: new Date().toISOString()
    };
    await safeInsertSubscriptionHistory(historyRecord);`
);
fs.writeFileSync('src/context/SaaSContext.tsx', content);
