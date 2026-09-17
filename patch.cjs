const fs = require('fs');

let content = fs.readFileSync('src/context/SaaSContext.tsx', 'utf8');

const helperCode = `
  const safeInsertSubscriptionHistory = async (record: SubscriptionHistory) => {
    let { error } = await supabase.from('subscription_history').insert([record]);
    if (error && (error.code === '42703' || error.message?.includes('column'))) {
      console.warn("Retrying subscription_history insert without new columns:", error);
      const { granted_by, reason, subscription_type, previous_expiry, new_expiry, days_added, start_date, end_date, plan_name, ...core } = record as any;
      const retry = await supabase.from('subscription_history').insert([core]);
      if (retry.error) {
        console.error("Core subscription_history insert failed:", retry.error);
      }
    } else if (error) {
      console.error("Subscription history insert error:", error);
    }
  };

  const grantTrial = async`;

content = content.replace('  const grantTrial = async', helperCode);

// Replace 1
content = content.replace(
`    try {
      await supabase.from('subscription_history').insert([{
        id: crypto.randomUUID(),
        restaurant_id: id,
        plan_name: \`CEO Trial (\${days} Days)\`,
        amount: 0,
        duration_months: 0,
        days_added: days,
        start_date: trialStart,
        end_date: trialEnd,
        previous_expiry: rest.trial_end || rest.subscription_end || trialStart,
        new_expiry: trialEnd,
        payment_status: 'trial_granted',
        payment_mode: 'free',
        subscription_type: 'TRIAL',
        granted_by: 'CEO',
        reason: \`CEO manually granted \${days}-day trial\`,
        created_at: new Date().toISOString()
      }]);
    } catch (err) {
      console.warn("Trial subscription history insert error:", err);
    }`,
`    const historyRecord = {
        id: crypto.randomUUID(),
        restaurant_id: id,
        plan_name: \`CEO Trial (\${days} Days)\`,
        amount: 0,
        duration_months: 0,
        days_added: days,
        start_date: trialStart,
        end_date: trialEnd,
        previous_expiry: rest.trial_end || rest.subscription_end || trialStart,
        new_expiry: trialEnd,
        payment_status: 'trial_granted',
        payment_mode: 'free',
        subscription_type: 'TRIAL',
        granted_by: 'CEO',
        reason: \`CEO manually granted \${days}-day trial\`,
        created_at: new Date().toISOString()
    };
    await safeInsertSubscriptionHistory(historyRecord);`
);

// Replace 2
content = content.replace(
`    try {
      await supabase.from('subscription_history').insert([{
        id: crypto.randomUUID(),
        restaurant_id: id,
        plan_name: \`CEO Free Offer (\${days} Days)\`,
        amount: 0,
        duration_months: 0,
        days_added: days,
        start_date: offerStart,
        end_date: offerEnd,
        previous_expiry: rest.free_offer_end || rest.subscription_end || offerStart,
        new_expiry: offerEnd,
        payment_status: 'not_required',
        payment_mode: 'free',
        subscription_type: 'FREE_OFFER',
        granted_by: 'CEO',
        reason: \`CEO manually granted \${days}-day Free Offer\`,
        created_at: new Date().toISOString()
      }]);
    } catch (err) {
      console.warn("Free offer subscription history insert error:", err);
    }`,
`    const historyRecord = {
        id: crypto.randomUUID(),
        restaurant_id: id,
        plan_name: \`CEO Free Offer (\${days} Days)\`,
        amount: 0,
        duration_months: 0,
        days_added: days,
        start_date: offerStart,
        end_date: offerEnd,
        previous_expiry: rest.free_offer_end || rest.subscription_end || offerStart,
        new_expiry: offerEnd,
        payment_status: 'not_required',
        payment_mode: 'free',
        subscription_type: 'FREE_OFFER',
        granted_by: 'CEO',
        reason: \`CEO manually granted \${days}-day Free Offer\`,
        created_at: new Date().toISOString()
    };
    await safeInsertSubscriptionHistory(historyRecord);`
);

// Replace 3
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

// Replace 4
content = content.replace(
`    try {
      await supabase.from('subscription_history').insert([historyRecord]);
    } catch (err) {
      console.warn("Free plan history insert error:", err);
    }`,
`    await safeInsertSubscriptionHistory(historyRecord);`
);

// Replace 5
content = content.replace(
`    try {
      await supabase.from('subscription_history').insert([historyRecord]);
    } catch (err) {
      console.warn("Error inserting subscription history into Supabase:", err);
    }`,
`    await safeInsertSubscriptionHistory(historyRecord);`
);

fs.writeFileSync('src/context/SaaSContext.tsx', content);
