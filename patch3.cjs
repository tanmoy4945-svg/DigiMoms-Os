const fs = require('fs');
let content = fs.readFileSync('src/context/SaaSContext.tsx', 'utf8');

const regex = /try\s*\{\s*await supabase\.from\('subscription_history'\)\.insert\(\[\{\s*id: crypto\.randomUUID\(\),\s*restaurant_id: id,\s*plan_name: `CEO Extension \(\+\$\{extraDays\} Days\)`,\s*amount: 0,\s*duration_months: 0,\s*days_added: extraDays,\s*start_date: new Date\(baseTime\)\.toISOString\(\),\s*end_date: newExpiry,\s*previous_expiry: new Date\(currentExpiry\)\.toISOString\(\),\s*new_expiry: newExpiry,\s*payment_status: 'not_required',\s*payment_mode: 'free',\s*subscription_type: 'CEO_FREE_EXTENSION',\s*granted_by: 'CEO',\s*reason: reason,\s*created_at: new Date\(\)\.toISOString\(\)\s*\}\]\);\s*\}\s*catch\s*\(err\)\s*\{\s*console\.warn\("Free extension history insert error:", err\);\s*\}/;

const replaceWith = `const historyRecord = {
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
        payment_status: 'not_required',
        payment_mode: 'free',
        subscription_type: 'CEO_FREE_EXTENSION',
        granted_by: 'CEO',
        reason: reason,
        created_at: new Date().toISOString()
    };
    await safeInsertSubscriptionHistory(historyRecord);`;

content = content.replace(regex, replaceWith);
fs.writeFileSync('src/context/SaaSContext.tsx', content);
