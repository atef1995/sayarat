require('dotenv').config({ path: '.env.development' });
const knex = require('../knexFile.js');
const db = require('knex')(knex.development);

async function fixSubscriptionData() {
  try {
    console.log('=== Fixing Subscription Data ===\n');

    // Get the subscription that needs fixing
    const subscription = await db('user_subscriptions')
      .where('stripe_subscription_id', 'sub_1RcwcrPIR1o3pZmORq1wJmrx')
      .first();

    if (!subscription) {
      console.log('No subscription found!');
      return;
    }

    console.log('Current subscription data:');
    console.log(JSON.stringify(subscription, null, 2));

    // Extract the plan name from metadata
    let metadata = {};
    if (subscription.metadata) {
      if (typeof subscription.metadata === 'string') {
        metadata = JSON.parse(subscription.metadata);
      } else {
        metadata = subscription.metadata;
      }
    }

    const planName = metadata.planId; // "pro-monthly"
    console.log('\nPlan name from metadata:', planName);

    if (!planName) {
      console.log('No plan name found in metadata!');
      return;
    }

    // Find the corresponding subscription plan
    const plan = await db('subscription_plans').where('name', planName).first();

    console.log('\nMatching plan:');
    console.log(JSON.stringify(plan, null, 2));

    if (!plan) {
      console.log('No matching plan found!');
      return;
    }

    // Update the subscription with the correct plan_id (Stripe price ID)
    console.log('\nUpdating subscription plan_id to:', plan.stripe_price_id);

    const updateData = {
      plan_id: plan.stripe_price_id,
      updated_at: new Date()
    };

    // Also add the period dates if we can get them from Stripe
    // For now, let's add some reasonable defaults based on when it was created
    const subscriptionDate = new Date(subscription.created_at);
    const periodStart = subscriptionDate;
    const periodEnd = new Date(subscriptionDate);

    if (plan.interval === 'month') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else if (plan.interval === 'year') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    updateData.current_period_start = periodStart;
    updateData.current_period_end = periodEnd;

    console.log('Update data:', JSON.stringify(updateData, null, 2));

    const affectedRows = await db('user_subscriptions')
      .where('stripe_subscription_id', 'sub_1RcwcrPIR1o3pZmORq1wJmrx')
      .update(updateData);

    console.log('\nUpdate completed. Affected rows:', affectedRows);

    // Verify the update
    console.log('\n=== Verification ===');
    const updatedSubscription = await db('user_subscriptions')
      .leftJoin('subscription_plans', 'user_subscriptions.plan_id', 'subscription_plans.stripe_price_id')
      .select(
        'user_subscriptions.*',
        'subscription_plans.name as plan_name',
        'subscription_plans.display_name as plan_display_name',
        'subscription_plans.features as plan_features',
        'subscription_plans.price as plan_price',
        'subscription_plans.currency as plan_currency',
        'subscription_plans.interval as plan_interval'
      )
      .where('user_subscriptions.stripe_subscription_id', 'sub_1RcwcrPIR1o3pZmORq1wJmrx')
      .first();

    console.log('Updated subscription with plan data:');
    console.log(JSON.stringify(updatedSubscription, null, 2));
  } catch (error) {
    console.error('Error fixing subscription data:', error);
  } finally {
    await db.destroy();
  }
}

fixSubscriptionData();
