/**
 * Test script to verify metadata parsing fix
 *
 * This script tests that metadata is properly stringified when stored
 * and parsed correctly when retrieved, fixing the "[object Object]" issue.
 */

const logger = require('../utils/logger');
const { SubscriptionCoreService } = require('../service/subscription/SubscriptionCoreService');
const { SubscriptionPaymentService } = require('../service/subscription/SubscriptionPaymentService');
const knex = require('knex')(require('../knexFile.js').development);
const { v4: uuidv4 } = require('uuid');

async function testMetadataHandling() {
  logger.info('Starting metadata handling test...');

  try {
    const subscriptionCoreService = new SubscriptionCoreService(knex);
    const subscriptionPaymentService = new SubscriptionPaymentService(knex);

    // Test 1: Create subscription with complex metadata
    const testMetadata = {
      accountType: 'company',
      companyId: 'comp_test_123',
      planFeatures: ['advanced_analytics', 'custom_branding'],
      createdBy: 'test_script',
      timestamp: new Date().toISOString()
    };

    logger.info('Test 1: Creating subscription with complex metadata', {
      metadata: testMetadata
    });

    // Create a test subscription (this should stringify the metadata)
    const subscriptionData = {
      stripe_subscription_id: `sub_test_${Date.now()}`,
      stripe_customer_id: `cus_test_${Date.now()}`,
      seller_id: uuidv4(), // Use proper UUID format
      status: 'active',
      plan_id: 'price_test',
      metadata: testMetadata
    };

    const createdSubscription = await subscriptionCoreService.createOrUpdateSubscription(subscriptionData);
    logger.info('Subscription created successfully', {
      subscriptionId: createdSubscription.stripe_subscription_id
    });

    // Test 2: Retrieve subscription and verify metadata parsing
    logger.info('Test 2: Retrieving subscription to verify metadata parsing');

    const retrievedSubscription = await subscriptionCoreService.getSubscriptionByStripeId(
      createdSubscription.stripe_subscription_id
    );

    if (!retrievedSubscription) {
      throw new Error('Failed to retrieve subscription');
    }

    logger.info('Subscription retrieved successfully', {
      subscriptionId: retrievedSubscription.stripe_subscription_id,
      metadata: retrievedSubscription.metadata,
      metadataType: typeof retrievedSubscription.metadata
    });

    // Verify metadata is properly parsed as object
    if (typeof retrievedSubscription.metadata !== 'object') {
      throw new Error(`Expected metadata to be object, got ${typeof retrievedSubscription.metadata}`);
    }

    if (retrievedSubscription.metadata.accountType !== testMetadata.accountType) {
      throw new Error(
        `Expected accountType to be ${testMetadata.accountType}, got ${retrievedSubscription.metadata.accountType}`
      );
    }

    if (retrievedSubscription.metadata.companyId !== testMetadata.companyId) {
      throw new Error(
        `Expected companyId to be ${testMetadata.companyId}, got ${retrievedSubscription.metadata.companyId}`
      );
    }

    logger.info('✅ Test 1 & 2 passed: Subscription metadata handling works correctly');

    // Test 3: Create payment with metadata
    logger.info('Test 3: Creating payment with metadata');

    const paymentMetadata = {
      paymentType: 'subscription',
      planName: 'Enterprise',
      billingCycle: 'monthly',
      promoCode: 'TESTPROMO'
    };

    const paymentData = {
      stripe_subscription_id: createdSubscription.stripe_subscription_id,
      stripe_invoice_id: `in_test_${Date.now()}`,
      stripe_customer_id: subscriptionData.stripe_customer_id,
      amount: 9999,
      currency: 'usd',
      status: 'succeeded',
      paid_at: new Date(),
      metadata: paymentMetadata
    };

    const createdPayment = await subscriptionPaymentService.recordPayment(paymentData);
    logger.info('Payment created successfully', {
      paymentId: createdPayment.id
    });

    // Test 4: Retrieve payment history and verify metadata parsing
    logger.info('Test 4: Retrieving payment history to verify metadata parsing');

    const paymentHistory = await subscriptionPaymentService.getSubscriptionPaymentHistory(
      createdSubscription.stripe_subscription_id,
      10
    );

    if (!paymentHistory || paymentHistory.length === 0) {
      throw new Error('Failed to retrieve payment history');
    }

    const payment = paymentHistory[0];
    logger.info('Payment history retrieved successfully', {
      paymentId: payment.id,
      metadata: payment.metadata,
      metadataType: typeof payment.metadata
    });

    // Verify payment metadata is properly parsed
    if (typeof payment.metadata !== 'object') {
      throw new Error(`Expected payment metadata to be object, got ${typeof payment.metadata}`);
    }

    if (payment.metadata.paymentType !== paymentMetadata.paymentType) {
      throw new Error(`Expected paymentType to be ${paymentMetadata.paymentType}, got ${payment.metadata.paymentType}`);
    }

    logger.info('✅ Test 3 & 4 passed: Payment metadata handling works correctly');

    // Test 5: Update subscription metadata
    logger.info('Test 5: Updating subscription metadata');

    const updatedMetadata = {
      ...testMetadata,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'test_script_update'
    };

    await subscriptionCoreService.updateSubscriptionStatus(createdSubscription.stripe_subscription_id, 'active', {
      metadata: updatedMetadata
    });

    const updatedSubscription = await subscriptionCoreService.getSubscriptionByStripeId(
      createdSubscription.stripe_subscription_id
    );

    if (!updatedSubscription || !updatedSubscription.metadata.lastUpdated) {
      throw new Error('Failed to update subscription metadata');
    }

    logger.info('✅ Test 5 passed: Subscription metadata update works correctly', {
      updatedMetadata: updatedSubscription.metadata
    });

    logger.info('🎉 All metadata handling tests passed successfully!');

    // Cleanup
    logger.info('Cleaning up test data...');
    await knex('subscription_payments')
      .where('stripe_subscription_id', createdSubscription.stripe_subscription_id)
      .del();
    await knex('user_subscriptions').where('stripe_subscription_id', createdSubscription.stripe_subscription_id).del();

    logger.info('✅ Test cleanup completed');
  } catch (error) {
    logger.error('❌ Metadata handling test failed', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testMetadataHandling()
    .then(() => {
      logger.info('Metadata handling test completed successfully');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Metadata handling test failed', { error: error.message });
      process.exit(1);
    });
}

module.exports = { testMetadataHandling };
