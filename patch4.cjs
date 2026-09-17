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
`;
if (!content.includes('safeInsertSubscriptionHistory')) {
    console.log("NOT INCLUDED!");
}
