/**
 * Test Script for Period End Null Fix
 *
 * This script tests the subscription sync functionality to ensure that
 * periodEnd is properly updated after payment processing.
 *
 * USAGE:
 * npx dotenvx run -f .env.development -- node scripts/test-period-end-fix.js
 */

const { SubscriptionServiceFactory } = require('../service/subscription/SubscriptionServiceFactory');
const knex = require('knex')(require('../knexFile.js').development);
const logger = require('../utils/logger');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Test Subscription Period End Fix
 */
async function testPeriodEndFix() {
  let subscriptionServiceFactory;

  try {
    logger.info('='.repeat(80));
    logger.info('TESTING SUBSCRIPTION PERIOD END FIX');
    logger.info('='.repeat(80));

    // Initialize subscription service factory
    subscriptionServiceFactory = new SubscriptionServiceFactory(knex);

    // Get all active subscriptions with null period end
    const subscriptionsWithNullPeriod = await knex('user_subscriptions')
      .where('status', 'active')
      .whereNull('current_period_end')
      .select('*');

    logger.info('Found subscriptions with null period end', {
      count: subscriptionsWithNullPeriod.length,
      subscriptions: subscriptionsWithNullPeriod.map(s => ({
        id: s.id,
        stripeSubscriptionId: s.stripe_subscription_id,
        status: s.status,
        currentPeriodEnd: s.current_period_end
      }))
    });

    // Test sync for each subscription with null period end
    for (const subscription of subscriptionsWithNullPeriod) {
      logger.info('Testing sync for subscription', {
        subscriptionId: subscription.id,
        stripeSubscriptionId: subscription.stripe_subscription_id
      });

      try {
        // Sync with Stripe
        const syncedSubscription = await subscriptionServiceFactory
          .getCoreService()
          .syncSubscriptionWithStripe(subscription.stripe_subscription_id, stripe);

        logger.info('Subscription sync result', {
          subscriptionId: subscription.id,
          stripeSubscriptionId: subscription.stripe_subscription_id,
          beforePeriodEnd: subscription.current_period_end,
          afterPeriodEnd: syncedSubscription?.current_period_end,
          fixed: syncedSubscription?.current_period_end !== null
        });
      } catch (error) {
        logger.error('Failed to sync subscription', {
          subscriptionId: subscription.id,
          stripeSubscriptionId: subscription.stripe_subscription_id,
          error: error.message
        });
      }
    }

    // Test subscription status evaluation after sync
    logger.info('-'.repeat(60));
    logger.info('TESTING SUBSCRIPTION STATUS EVALUATION AFTER SYNC');
    logger.info('-'.repeat(60));

    const testUserId = '763ab619-7355-4767-8960-ee416ca69294'; // User from logs

    try {
      const activeSubscription = await subscriptionServiceFactory
        .getCoreService()
        .getUserActiveSubscription(testUserId);

      if (activeSubscription) {
        const now = new Date();
        const periodEnd = new Date(activeSubscription.current_period_end);
        const isWithinPeriod = !activeSubscription.current_period_end || now <= periodEnd;
        const isActiveStatus = ['active', 'trialing'].includes(activeSubscription.status);
        const hasActiveSubscription = isActiveStatus && isWithinPeriod;

        logger.info('Test user subscription status evaluation', {
          userId: testUserId,
          status: activeSubscription.status,
          cancelAtPeriodEnd: activeSubscription.cancel_at_period_end,
          periodEnd: activeSubscription.current_period_end,
          isWithinPeriod,
          isActiveStatus,
          hasActiveSubscription,
          periodEndIsNull: activeSubscription.current_period_end === null
        });

        // Check if period end is still null
        if (activeSubscription.current_period_end === null) {
          logger.warn('⚠️  PERIOD END IS STILL NULL AFTER SYNC', {
            userId: testUserId,
            subscriptionId: activeSubscription.id,
            stripeSubscriptionId: activeSubscription.stripe_subscription_id
          });
        } else {
          logger.info('✅ PERIOD END IS NOW SET CORRECTLY', {
            userId: testUserId,
            periodEnd: activeSubscription.current_period_end
          });
        }
      } else {
        logger.info('No active subscription found for test user', { userId: testUserId });
      }
    } catch (error) {
      logger.error('Error testing subscription status evaluation', {
        userId: testUserId,
        error: error.message
      });
    }

    logger.info('='.repeat(80));
    logger.info('PERIOD END FIX TEST COMPLETED');
    logger.info('='.repeat(80));
  } catch (error) {
    logger.error('Error during period end fix test', {
      error: error.message,
      stack: error.stack
    });
  } finally {
    if (subscriptionServiceFactory) {
      // Clean up any resources
    }
    process.exit(0);
  }
}

// Run the test
testPeriodEndFix();
