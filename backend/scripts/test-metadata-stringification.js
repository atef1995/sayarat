/**
 * Simple test to verify metadata stringification fix
 *
 * This script simulates how Stripe webhook metadata is handled
 * to ensure it's properly stringified before storage.
 */

const logger = require('../utils/logger');
const { SubscriptionCoreService } = require('../service/subscription/SubscriptionCoreService');
const knex = require('knex')(require('../knexFile.js').development);
const { v4: uuidv4 } = require('uuid');

async function testMetadataStringification() {
  logger.info('Starting metadata stringification test...');

  try {
    const subscriptionCoreService = new SubscriptionCoreService(knex);

    // Simulate metadata coming from Stripe (as object)
    const stripeMetadata = {
      accountType: 'company',
      companyId: 'comp_test_456',
      isCompanySubscription: true,
      createdBy: 'stripe_webhook'
    };

    logger.info('Test: Simulating webhook metadata handling', {
      originalMetadata: stripeMetadata,
      metadataType: typeof stripeMetadata
    });

    // This simulates what happens in stripeWebhookService.js now (AFTER our fix)
    const subscriptionData = {
      stripe_subscription_id: `sub_webhook_test_${Date.now()}`,
      stripe_customer_id: `cus_webhook_test_${Date.now()}`,
      seller_id: uuidv4(),
      status: 'active',
      plan_id: 'price_test',
      metadata: JSON.stringify(stripeMetadata) // This is what our fix does
    };

    logger.info('Metadata after stringification', {
      stringifiedMetadata: subscriptionData.metadata,
      isString: typeof subscriptionData.metadata === 'string'
    });

    // Create subscription with properly stringified metadata
    const createdSubscription = await subscriptionCoreService.createOrUpdateSubscription(subscriptionData);
    logger.info('Subscription created with stringified metadata', {
      subscriptionId: createdSubscription.stripe_subscription_id
    });

    // Retrieve and verify parsing works correctly
    const retrievedSubscription = await subscriptionCoreService.getSubscriptionByStripeId(
      createdSubscription.stripe_subscription_id
    );

    if (!retrievedSubscription) {
      throw new Error('Failed to retrieve subscription');
    }

    logger.info('Subscription retrieved and metadata parsed', {
      subscriptionId: retrievedSubscription.stripe_subscription_id,
      parsedMetadata: retrievedSubscription.metadata,
      metadataType: typeof retrievedSubscription.metadata
    });

    // Verify the metadata was parsed correctly
    if (typeof retrievedSubscription.metadata !== 'object') {
      throw new Error(`Expected metadata to be object, got ${typeof retrievedSubscription.metadata}`);
    }

    if (retrievedSubscription.metadata.accountType !== stripeMetadata.accountType) {
      throw new Error(
        `Expected accountType to be ${stripeMetadata.accountType}, got ${retrievedSubscription.metadata.accountType}`
      );
    }

    if (retrievedSubscription.metadata.companyId !== stripeMetadata.companyId) {
      throw new Error(
        `Expected companyId to be ${stripeMetadata.companyId}, got ${retrievedSubscription.metadata.companyId}`
      );
    }

    logger.info('✅ Metadata stringification and parsing test passed!');

    // Test the OLD way (what was causing the issue) for comparison
    logger.info('Test: Demonstrating the OLD problematic way');

    const problematicData = {
      stripe_subscription_id: `sub_problem_test_${Date.now()}`,
      stripe_customer_id: `cus_problem_test_${Date.now()}`,
      seller_id: uuidv4(),
      status: 'active',
      plan_id: 'price_test',
      metadata: stripeMetadata // NOT stringified - this would cause the issue
    };

    // This would cause "[object Object]" to be stored
    logger.info('What the old code would do (NOT stringified)', {
      problematicMetadata: problematicData.metadata,
      whenNotStringified: String(problematicData.metadata) // This becomes "[object Object]"
    });

    logger.info('🎉 Metadata fix verification completed successfully!');

    // Cleanup
    await knex('user_subscriptions').where('stripe_subscription_id', createdSubscription.stripe_subscription_id).del();
    logger.info('✅ Test cleanup completed');
  } catch (error) {
    logger.error('❌ Metadata stringification test failed', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testMetadataStringification()
    .then(() => {
      logger.info('Metadata stringification test completed successfully');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Metadata stringification test failed', { error: error.message });
      process.exit(1);
    });
}

module.exports = { testMetadataStringification };
