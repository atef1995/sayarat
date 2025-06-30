const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development') });

const knexConfig = require('../knexFile');
const knex = require('knex')(knexConfig.development);

async function checkSubscriptionPlans() {
  try {
    console.log('🔍 Checking subscription plans table...');

    // Check if table exists
    const tableExists = await knex.schema.hasTable('subscription_plans');
    console.log('📋 subscription_plans table exists:', tableExists);

    if (tableExists) {
      // Get all plans
      const plans = await knex('subscription_plans').select('*');
      console.log('📦 Total plans found:', plans.length);

      if (plans.length > 0) {
        console.log('📝 Subscription plans:');
        plans.forEach((plan, index) => {
          console.log(`  ${index + 1}. ${plan.name} (${plan.stripe_price_id})`);
          console.log(`     Display: ${plan.display_name}`);
          console.log(`     Price: ${plan.price} ${plan.currency}/${plan.interval}`);
          console.log('');
        });
      } else {
        console.log('⚠️  No subscription plans found in database');
      }

      // Check user_subscriptions table
      console.log('🔍 Checking user_subscriptions table...');
      const subscriptions = await knex('user_subscriptions')
        .select('id', 'plan_id', 'status', 'seller_id', 'stripe_subscription_id')
        .limit(5);

      console.log('📦 Sample user_subscriptions:', subscriptions.length);
      subscriptions.forEach((sub, index) => {
        console.log(`  ${index + 1}. Plan ID: ${sub.plan_id}, Status: ${sub.status}, Seller: ${sub.seller_id}`);
      });
    }
  } catch (error) {
    console.error('❌ Error checking subscription plans:', error.message);
  } finally {
    await knex.destroy();
  }
}

checkSubscriptionPlans();
