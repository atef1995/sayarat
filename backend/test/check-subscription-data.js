require('dotenv').config({ path: '.env.development' });
const knex = require('../knexFile.js');
const db = require('knex')(knex.development);

async function checkSubscriptionData() {
  try {
    console.log('=== Checking Subscription Data ===\n');

    // 1. Check user_subscriptions table
    console.log('1. User Subscriptions:');
    const userSubs = await db('user_subscriptions').select('*');
    console.log(JSON.stringify(userSubs, null, 2));

    console.log('\n2. Subscription Plans:');
    const plans = await db('subscription_plans').select('*');
    console.log(JSON.stringify(plans, null, 2));

    // 3. Check specific subscription that's active
    console.log('\n3. Active Subscription Details:');
    const activeSub = await db('user_subscriptions')
      .where('stripe_subscription_id', 'sub_1RcwcrPIR1o3pZmORq1wJmrx')
      .first();
    console.log('Active subscription:', JSON.stringify(activeSub, null, 2));

    // 4. Check if plan_id matches any stripe_price_id
    if (activeSub && activeSub.plan_id) {
      console.log('\n4. Looking for matching plan:');
      const matchingPlan = await db('subscription_plans').where('stripe_price_id', activeSub.plan_id).first();
      console.log('Matching plan:', JSON.stringify(matchingPlan, null, 2));
    } else {
      console.log('\n4. No plan_id in active subscription!');
    }

    // 5. Test the join query
    console.log('\n5. Testing join query:');
    const joinResult = await db('user_subscriptions')
      .leftJoin('subscription_plans', 'user_subscriptions.plan_id', 'subscription_plans.stripe_price_id')
      .select(
        'user_subscriptions.*',
        'subscription_plans.name as plan_name',
        'subscription_plans.display_name as plan_display_name',
        'subscription_plans.features as plan_features',
        'subscription_plans.stripe_price_id'
      )
      .where('user_subscriptions.stripe_subscription_id', 'sub_1RcwcrPIR1o3pZmORq1wJmrx')
      .first();
    console.log('Join result:', JSON.stringify(joinResult, null, 2));
  } catch (error) {
    console.error('Error checking subscription data:', error);
  } finally {
    await db.destroy();
  }
}

checkSubscriptionData();
