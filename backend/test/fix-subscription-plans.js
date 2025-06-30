const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development') });

const knexConfig = require('../knexFile');
const knex = require('knex')(knexConfig.development);

async function fixSubscriptionPlans() {
  try {
    console.log('🔧 Fixing subscription plans...');

    // Check if the missing plan exists
    const missingPlan = await knex('subscription_plans')
      .where('stripe_price_id', 'price_1RbhnwPIR1o3pZmObQQrJgs2')
      .first();

    if (!missingPlan) {
      console.log('➕ Adding missing subscription plan...');

      // Insert the missing plan
      await knex('subscription_plans').insert({
        name: 'premium_monthly',
        display_name: 'الخطة المميزة - شهرية',
        stripe_price_id: 'price_1RbhnwPIR1o3pZmObQQrJgs2',
        price: 29.99,
        currency: 'USD',
        interval: 'month',
        features: JSON.stringify([
          'aiCarAnalysis',
          'listingHighlights',
          'prioritySupport',
          'advancedAnalytics',
          'unlimitedListings'
        ]),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      console.log('✅ Added missing plan with stripe_price_id: price_1RbhnwPIR1o3pZmObQQrJgs2');
    } else {
      console.log('ℹ️ Plan already exists for stripe_price_id: price_1RbhnwPIR1o3pZmObQQrJgs2');
    }

    // Verify the fix by running a test query
    console.log('🔍 Testing join query...');

    const testJoin = await knex('user_subscriptions')
      .leftJoin('subscription_plans', function() {
        this.on('user_subscriptions.plan_id', '=', 'subscription_plans.stripe_price_id').orOn(
          'user_subscriptions.plan_id',
          '=',
          'subscription_plans.name'
        );
      })
      .select(
        'user_subscriptions.id',
        'user_subscriptions.plan_id',
        'user_subscriptions.status',
        'subscription_plans.name as plan_name',
        'subscription_plans.display_name as plan_display_name'
      )
      .where('user_subscriptions.status', 'active')
      .limit(3);

    console.log('📊 Test join results:');
    testJoin.forEach((result, index) => {
      console.log(`  ${index + 1}. Plan ID: ${result.plan_id}`);
      console.log(`     Plan Name: ${result.plan_name}`);
      console.log(`     Display Name: ${result.plan_display_name}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error fixing subscription plans:', error.message);
  } finally {
    await knex.destroy();
  }
}

fixSubscriptionPlans();
