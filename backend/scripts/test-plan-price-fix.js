/**
 * Test script to verify the plan price fix
 *
 * This script tests that plan_price and plan_currency are now correctly retrieved
 * after syncing the database plans with Stripe.
 */

const logger = require('../utils/logger');
const knex = require('knex')(require('../knexFile.js').development);
const { SubscriptionCoreService } = require('../service/subscription/SubscriptionCoreService');

async function testPlanPriceFix() {
  logger.info('Testing plan price fix...');

  try {
    const subscriptionCoreService = new SubscriptionCoreService(knex);

    // Get a sample active subscription to test
    const activeSub = await knex('user_subscriptions').whereIn('status', ['active', 'trialing']).first();

    if (!activeSub) {
      logger.warn('No active subscriptions found to test');
      return;
    }

    logger.info('Testing with subscription:', {
      id: activeSub.id,
      seller_id: activeSub.seller_id,
      plan_id: activeSub.plan_id
    });

    // Test getUserActiveSubscription
    const userActiveSub = await subscriptionCoreService.getUserActiveSubscription(activeSub.seller_id);

    logger.info('getUserActiveSubscription result:', {
      subscriptionFound: !!userActiveSub,
      planId: userActiveSub?.plan_id,
      planName: userActiveSub?.plan_name,
      planPrice: userActiveSub?.plan_price,
      planCurrency: userActiveSub?.plan_currency,
      planInterval: userActiveSub?.plan_interval,
      priceType: typeof userActiveSub?.plan_price,
      currencyType: typeof userActiveSub?.plan_currency,
      priceIsNotZero: userActiveSub?.plan_price !== null && userActiveSub?.plan_price !== '0',
      currencyIsNotNull: userActiveSub?.plan_currency !== null
    });

    // Verify the fix
    if (userActiveSub && userActiveSub.plan_price && userActiveSub.plan_currency) {
      logger.info('✅ PLAN PRICE FIX SUCCESSFUL!', {
        planPrice: userActiveSub.plan_price,
        planCurrency: userActiveSub.plan_currency,
        planName: userActiveSub.plan_name
      });
    } else {
      logger.error('❌ Plan price fix not working', {
        planPrice: userActiveSub?.plan_price,
        planCurrency: userActiveSub?.plan_currency
      });
    }

    // Test direct join to verify
    const directJoinTest = await knex('user_subscriptions')
      .leftJoin('subscription_plans', 'user_subscriptions.plan_id', 'subscription_plans.stripe_price_id')
      .select(
        'user_subscriptions.id',
        'user_subscriptions.plan_id',
        'subscription_plans.name as plan_name',
        'subscription_plans.price as plan_price',
        'subscription_plans.currency as plan_currency'
      )
      .where('user_subscriptions.id', activeSub.id)
      .first();

    logger.info('Direct join verification:', {
      id: directJoinTest.id,
      planId: directJoinTest.plan_id,
      planName: directJoinTest.plan_name,
      planPrice: directJoinTest.plan_price,
      planCurrency: directJoinTest.plan_currency,
      joinSuccessful: !!(directJoinTest.plan_name && directJoinTest.plan_price)
    });

    logger.info('🎉 Plan price fix test completed!');
  } catch (error) {
    logger.error('❌ Plan price fix test failed', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    await knex.destroy();
  }
}

// Run the test
if (require.main === module) {
  testPlanPriceFix()
    .then(() => {
      logger.info('Plan price fix test completed successfully');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Plan price fix test failed', { error: error.message });
      process.exit(1);
    });
}

module.exports = { testPlanPriceFix };
