const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development') });

const knexConfig = require('../knexFile');
const knex = require('knex')(knexConfig.development);
const { SubscriptionDatabase } = require('../service/subscriptionDatabase');

async function testSubscriptionAPI() {
  try {
    console.log('🧪 Testing subscription API data structure...');

    // Initialize subscription database service
    const subscriptionDb = new SubscriptionDatabase(knex);

    // Get a test user ID (we'll use the first active subscription's seller_id)
    const testSubscription = await knex('user_subscriptions')
      .select('seller_id')
      .where('status', 'active')
      .whereNotNull('seller_id')
      .first();

    if (!testSubscription) {
      console.log('❌ No active subscriptions found for testing');
      return;
    }

    const userId = testSubscription.seller_id;
    console.log(`🔍 Testing with user ID: ${userId}`);

    // Get subscription data using the service
    const activeSubscription = await subscriptionDb.getUserActiveSubscription(userId);

    if (activeSubscription) {
      console.log('✅ Subscription found successfully');

      // Simulate the controller response structure
      const apiResponse = {
        id: activeSubscription.id,
        planId: activeSubscription.plan_id,
        planName: activeSubscription.plan_name,
        planDisplayName: activeSubscription.plan_display_name,
        status: activeSubscription.status,
        currentPeriodStart: activeSubscription.current_period_start,
        currentPeriodEnd: activeSubscription.current_period_end,
        stripeSubscriptionId: activeSubscription.stripe_subscription_id,
        features: activeSubscription.plan_features || []
      };

      console.log('📋 API Response Structure:');
      console.log(JSON.stringify(apiResponse, null, 2));

      // Verify all expected fields are populated
      const requiredFields = ['planName', 'planDisplayName', 'currentPeriodStart', 'currentPeriodEnd'];
      const missingFields = requiredFields.filter(field => !apiResponse[field]);

      if (missingFields.length === 0) {
        console.log('✅ All required fields are populated');
      } else {
        console.log('⚠️ Missing fields:', missingFields);
      }
    } else {
      console.log('❌ No active subscription found');
    }
  } catch (error) {
    console.error('❌ Error testing subscription API:', error.message);
  } finally {
    await knex.destroy();
  }
}

testSubscriptionAPI();
