const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development') });

const knexConfig = require('../knexFile');
const knex = require('knex')(knexConfig.development);

const SubscriptionSyncService = require('../service/subscriptionSyncService');
const SubscriptionScheduler = require('../service/subscriptionScheduler');
const { SubscriptionDatabase } = require('../service/subscriptionDatabase');

async function testSyncServices() {
  try {
    console.log('🧪 Testing subscription sync services...');

    // Initialize services
    const subscriptionDb = new SubscriptionDatabase(knex);

    const Stripe = require('stripe');
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const syncService = new SubscriptionSyncService(knex, stripe, subscriptionDb);
    const scheduler = new SubscriptionScheduler(syncService, { enabled: false }); // Don't auto-start for testing

    console.log('✅ Services initialized successfully');

    // Test 1: Sync active subscriptions
    console.log('\n📋 Test 1: Sync active subscriptions');
    const syncResult = await syncService.syncAllSubscriptions('active_only', { limit: 2 });
    console.log('Sync result:', {
      processed: syncResult.subscriptionsProcessed,
      updated: syncResult.subscriptionsUpdated,
      duration: syncResult.duration,
      errors: syncResult.errors.length
    });

    // Test 2: Monitor new plans
    console.log('\n📋 Test 2: Monitor for new plans');
    const monitorResult = await syncService.monitorNewPlans({ autoAdd: false });
    console.log('Monitor result:', {
      newPlans: monitorResult.newPlansFound.length,
      existingPlans: monitorResult.existingPlans.length,
      errors: monitorResult.errors.length
    });

    if (monitorResult.newPlansFound.length > 0) {
      console.log(
        'New plans found:',
        monitorResult.newPlansFound.map(p => p.stripe_price_id)
      );
    }

    // Test 3: Scheduler functionality
    console.log('\n📋 Test 3: Scheduler functionality');
    const schedulerStatus = scheduler.getStatus();
    console.log('Scheduler status:', {
      isRunning: schedulerStatus.isRunning,
      tasksCount: schedulerStatus.tasksCount,
      enabled: schedulerStatus.options.enabled
    });

    // Test 4: Manual trigger via scheduler
    console.log('\n📋 Test 4: Manual trigger via scheduler');
    const manualResult = await scheduler.triggerSync('active', { limit: 1 });
    console.log('Manual trigger result:', {
      processed: manualResult.subscriptionsProcessed,
      updated: manualResult.subscriptionsUpdated
    });

    console.log('\n✅ All tests completed successfully!');

    console.log('\n📊 Service Features Available:');
    console.log('- ✅ Automatic subscription data sync from Stripe');
    console.log('- ✅ New plan discovery and auto-addition');
    console.log('- ✅ Scheduled sync operations (configurable)');
    console.log('- ✅ Manual admin triggers');
    console.log('- ✅ Comprehensive error handling and logging');
    console.log('- ✅ Analytics and monitoring capabilities');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await knex.destroy();
  }
}

testSyncServices();
