#!/usr/bin/env node

/**
 * Test script to check subscription status functionality
 */

const { config } = require('@dotenvx/dotenvx');
config();

const knex = require('knex')(require('../knexFile').development);
const { SubscriptionDatabase } = require('../service/subscriptionDatabase');

async function checkSubscriptionStatus() {
  try {
    console.log('=== Subscription Status Check ===\n');

    // Check available subscription plans
    console.log('1. Available subscription plans:');
    const plans = await knex('subscription_plans')
      .select('name', 'display_name', 'stripe_price_id', 'is_active')
      .orderBy('order_number', 'asc');

    if (plans.length === 0) {
      console.log('   No plans found in database');
    } else {
      console.table(plans);
    }

    // Check user subscriptions
    console.log('\n2. User subscriptions:');
    const subscriptions = await knex('user_subscriptions')
      .select('seller_id', 'plan_id', 'status', 'cancel_at_period_end', 'current_period_end', 'created_at')
      .orderBy('created_at', 'desc')
      .limit(10);

    if (subscriptions.length === 0) {
      console.log('   No subscriptions found in database');
    } else {
      console.table(subscriptions);
    }

    // Test subscription database service
    if (subscriptions.length > 0) {
      const subscriptionDb = new SubscriptionDatabase(knex);
      const testUserId = subscriptions[0].seller_id;

      console.log(`\n3. Testing getUserActiveSubscription for user: ${testUserId}`);
      const activeSubscription = await subscriptionDb.getUserActiveSubscription(testUserId);

      if (activeSubscription) {
        console.log('   Found subscription:');
        console.log('   - Plan ID:', activeSubscription.plan_id);
        console.log('   - Plan Name:', activeSubscription.plan_name);
        console.log('   - Plan Display Name:', activeSubscription.plan_display_name);
        console.log('   - Status:', activeSubscription.status);
        console.log('   - Cancel at Period End:', activeSubscription.cancel_at_period_end);
        console.log('   - Current Period End:', activeSubscription.current_period_end);
      } else {
        console.log('   No active subscription found');
      }
    }

    console.log('\n=== Check Complete ===');
  } catch (error) {
    console.error('Error checking subscription status:', error);
  } finally {
    await knex.destroy();
  }
}

if (require.main === module) {
  checkSubscriptionStatus();
}

module.exports = { checkSubscriptionStatus };
