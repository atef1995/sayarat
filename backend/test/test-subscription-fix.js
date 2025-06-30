const knexConfig = require('../knexFile.js');
const knex = require('knex')(knexConfig.development);

async function testSubscriptionQuery() {
  try {
    console.log('Testing subscription query...');

    // Test the exact query that was failing
    const result = await knex('user_subscriptions')
      .leftJoin('subscription_plans', 'user_subscriptions.plan_id', 'subscription_plans.stripe_price_id')
      .select(
        'user_subscriptions.*',
        'subscription_plans.name as plan_name',
        'subscription_plans.display_name as plan_display_name',
        'subscription_plans.features as plan_features',
        'subscription_plans.price as plan_price',
        'subscription_plans.currency as plan_currency',
        'subscription_plans.interval as plan_interval'
      )
      .where('user_subscriptions.user_id', '50ed7946-0f3b-4f87-b7f3-65740bdd7ebf')
      .where('user_subscriptions.status', 'active')
      .limit(1);

    console.log('✅ Query executed successfully!');
    console.log('Result count:', result.length);

    if (result.length > 0) {
      console.log('Sample result:', {
        id: result[0].id,
        user_id: result[0].user_id,
        plan_id: result[0].plan_id,
        status: result[0].status,
        plan_name: result[0].plan_name
      });
    }

    // Also test the table structures
    console.log('\n--- Testing table structures ---');

    // Check user_subscriptions structure
    const userSubsColumns = await knex('user_subscriptions').columnInfo();
    console.log('user_subscriptions.plan_id type:', userSubsColumns.plan_id?.type);

    // Check subscription_plans structure
    const plansColumns = await knex('subscription_plans').columnInfo();
    console.log('subscription_plans.id type:', plansColumns.id?.type);
    console.log('subscription_plans.stripe_price_id type:', plansColumns.stripe_price_id?.type);

    // Check if there's any data in the tables
    const userSubsCount = await knex('user_subscriptions').count('* as count').first();
    const plansCount = await knex('subscription_plans').count('* as count').first();

    console.log('user_subscriptions count:', userSubsCount.count);
    console.log('subscription_plans count:', plansCount.count);

    // Show sample data
    const sampleSubs = await knex('user_subscriptions').limit(3).select('id', 'user_id', 'plan_id', 'status');
    const samplePlans = await knex('subscription_plans').limit(3).select('id', 'stripe_price_id', 'name');

    console.log('\nSample user_subscriptions:');
    console.log(sampleSubs);

    console.log('\nSample subscription_plans:');
    console.log(samplePlans);
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error.detail || 'No additional details');

    if (error.message.includes('operator does not exist')) {
      console.error('\n🔍 This suggests a type mismatch in the join condition.');
      console.error('The migration may not have been applied correctly.');
    }
  } finally {
    await knex.destroy();
  }
}

testSubscriptionQuery();
