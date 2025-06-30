const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development') });

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const knexConfig = require('../knexFile');
const knex = require('knex')(knexConfig.development);

async function syncSubscriptionData() {
  try {
    console.log('🔄 Syncing subscription data from Stripe...');

    // Get all active subscriptions from database
    const dbSubscriptions = await knex('user_subscriptions')
      .select('*')
      .where('status', 'active')
      .whereNotNull('stripe_subscription_id');

    console.log(`📊 Found ${dbSubscriptions.length} active subscriptions in database`);

    for (const dbSub of dbSubscriptions) {
      try {
        console.log(`\n🔍 Checking subscription: ${dbSub.stripe_subscription_id}`);

        // Get current data from Stripe
        const stripeSub = await stripe.subscriptions.retrieve(dbSub.stripe_subscription_id);

        // Convert Unix timestamps to JavaScript Dates
        const currentPeriodStart = new Date(stripeSub.current_period_start * 1000);
        const currentPeriodEnd = new Date(stripeSub.current_period_end * 1000);

        console.log(`  📅 Stripe Period: ${currentPeriodStart.toISOString()} - ${currentPeriodEnd.toISOString()}`);
        console.log(`  📅 DB Period: ${dbSub.current_period_start} - ${dbSub.current_period_end}`);

        // Update database with current Stripe data
        const updateData = {
          status: stripeSub.status,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          updated_at: new Date()
        };

        // Add cancellation data if subscription is cancelled
        if (stripeSub.canceled_at) {
          updateData.canceled_at = new Date(stripeSub.canceled_at * 1000);
        }

        if (stripeSub.cancel_at_period_end) {
          updateData.cancel_at_period_end = stripeSub.cancel_at_period_end;
        }

        await knex('user_subscriptions').where('id', dbSub.id).update(updateData);

        console.log(`  ✅ Updated subscription ${dbSub.id}`);
      } catch (stripeError) {
        console.error(`  ❌ Error processing subscription ${dbSub.stripe_subscription_id}:`, stripeError.message);
      }
    }

    // Test the result by fetching updated data
    console.log('\n🧪 Testing updated data...');
    const testSub = await knex('user_subscriptions')
      .leftJoin('subscription_plans', function() {
        this.on('user_subscriptions.plan_id', '=', 'subscription_plans.stripe_price_id').orOn(
          'user_subscriptions.plan_id',
          '=',
          'subscription_plans.name'
        );
      })
      .select(
        'user_subscriptions.*',
        'subscription_plans.name as plan_name',
        'subscription_plans.display_name as plan_display_name'
      )
      .where('user_subscriptions.status', 'active')
      .first();

    if (testSub) {
      console.log('📋 Sample updated subscription:');
      console.log(`  ID: ${testSub.id}`);
      console.log(`  Plan: ${testSub.plan_display_name} (${testSub.plan_name})`);
      console.log(`  Period: ${testSub.current_period_start} - ${testSub.current_period_end}`);
      console.log(`  Status: ${testSub.status}`);
    }
  } catch (error) {
    console.error('❌ Error syncing subscription data:', error.message);
  } finally {
    await knex.destroy();
  }
}

syncSubscriptionData();
