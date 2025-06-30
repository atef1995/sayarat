require('dotenv').config({ path: '.env.development' });
const knex = require('../knexFile.js');
const db = require('knex')(knex.development);
const { SubscriptionDatabase } = require('../service/subscriptionDatabase');

async function testSubscriptionDatabase() {
  try {
    console.log('=== Testing SubscriptionDatabase Service ===\n');

    const subscriptionDb = new SubscriptionDatabase(db);
    const userId = '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf';

    // Test getUserActiveSubscription
    console.log('1. Testing getUserActiveSubscription...');
    const activeSubscription = await subscriptionDb.getUserActiveSubscription(userId);
    console.log('Active subscription result:');
    console.log(JSON.stringify(activeSubscription, null, 2));

    // Test getSubscriptionByStripeId
    console.log('\n2. Testing getSubscriptionByStripeId...');
    const subscriptionByStripeId = await subscriptionDb.getSubscriptionByStripeId('sub_1RcwcrPIR1o3pZmORq1wJmrx');
    console.log('Subscription by Stripe ID result:');
    console.log(JSON.stringify(subscriptionByStripeId, null, 2));

    console.log('\n=== Test completed successfully! ===');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await db.destroy();
  }
}

testSubscriptionDatabase();
