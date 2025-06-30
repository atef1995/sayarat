/**
 * Diagnostic script to debug plan price and currency issues
 *
 * This script will help identify why plan_price is 0 and plan_currency is null
 * by examining the database tables and join relationships.
 */

const logger = require('../utils/logger');
const knex = require('knex')(require('../knexfile.js').development);
const { SubscriptionCoreService } = require('../service/subscription/SubscriptionCoreService');

async function diagnosePlanPriceIssue() {
  logger.info('Starting plan price diagnostic...');

  try {
    const subscriptionCoreService = new SubscriptionCoreService(knex);

    // Step 1: Check subscription_plans table structure and data
    logger.info('=== Step 1: Checking subscription_plans table ===');

    const planColumns = await knex('subscription_plans').columnInfo();
    logger.info('subscription_plans table columns:', {
      columns: Object.keys(planColumns)
    });

    const plansCount = await knex('subscription_plans').count('* as count').first();
    logger.info('Total plans in database:', plansCount);

    const samplePlans = await knex('subscription_plans')
      .select('id', 'name', 'stripe_price_id', 'price', 'currency', 'is_active')
      .limit(5);

    logger.info('Sample plans from database:', {
      plans: samplePlans.map(plan => ({
        id: plan.id,
        name: plan.name,
        stripe_price_id: plan.stripe_price_id,
        price: plan.price,
        currency: plan.currency,
        priceType: typeof plan.price,
        currencyType: typeof plan.currency,
        isActive: plan.is_active
      }))
    });

    // Step 2: Check user_subscriptions table
    logger.info('=== Step 2: Checking user_subscriptions table ===');

    const subsColumns = await knex('user_subscriptions').columnInfo();
    logger.info('user_subscriptions table columns:', {
      columns: Object.keys(subsColumns)
    });

    const subsCount = await knex('user_subscriptions').count('* as count').first();
    logger.info('Total subscriptions in database:', subsCount);

    const activeSubs = await knex('user_subscriptions')
      .select('id', 'seller_id', 'plan_id', 'status', 'stripe_subscription_id')
      .whereIn('status', ['active', 'trialing'])
      .limit(5);

    logger.info('Sample active subscriptions:', {
      subscriptions: activeSubs.map(sub => ({
        id: sub.id,
        seller_id: sub.seller_id,
        plan_id: sub.plan_id,
        planIdType: typeof sub.plan_id,
        status: sub.status,
        stripe_subscription_id: sub.stripe_subscription_id
      }))
    });

    // Step 3: Test the join relationship
    logger.info('=== Step 3: Testing join relationship ===');

    for (const sub of activeSubs) {
      logger.info(`Testing subscription ${sub.id} with plan_id: ${sub.plan_id}`);

      // Direct lookup in subscription_plans
      const directPlan = await knex('subscription_plans').where('stripe_price_id', sub.plan_id).first();

      logger.info('Direct plan lookup result:', {
        subscriptionId: sub.id,
        planId: sub.plan_id,
        planFound: !!directPlan,
        planData: directPlan
          ? {
            id: directPlan.id,
            name: directPlan.name,
            price: directPlan.price,
            currency: directPlan.currency,
            stripe_price_id: directPlan.stripe_price_id
          }
          : null
      });

      // Test the actual join
      const joinResult = await knex('user_subscriptions')
        .leftJoin('subscription_plans', 'user_subscriptions.plan_id', 'subscription_plans.stripe_price_id')
        .select(
          'user_subscriptions.id as sub_id',
          'user_subscriptions.plan_id as sub_plan_id',
          'subscription_plans.id as plan_db_id',
          'subscription_plans.stripe_price_id as plan_stripe_id',
          'subscription_plans.name as plan_name',
          'subscription_plans.price as plan_price',
          'subscription_plans.currency as plan_currency'
        )
        .where('user_subscriptions.id', sub.id)
        .first();

      logger.info('Join result:', {
        subscriptionId: sub.id,
        joinResult: joinResult
          ? {
            sub_id: joinResult.sub_id,
            sub_plan_id: joinResult.sub_plan_id,
            plan_db_id: joinResult.plan_db_id,
            plan_stripe_id: joinResult.plan_stripe_id,
            plan_name: joinResult.plan_name,
            plan_price: joinResult.plan_price,
            plan_currency: joinResult.plan_currency,
            priceType: typeof joinResult.plan_price,
            currencyType: typeof joinResult.plan_currency
          }
          : 'No join result'
      });

      // Test getUserActiveSubscription for this user
      if (sub.seller_id) {
        const userActiveSub = await subscriptionCoreService.getUserActiveSubscription(sub.seller_id);
        logger.info('getUserActiveSubscription result:', {
          userId: sub.seller_id,
          subscriptionFound: !!userActiveSub,
          subscriptionData: userActiveSub
            ? {
              id: userActiveSub.id,
              plan_id: userActiveSub.plan_id,
              plan_name: userActiveSub.plan_name,
              plan_price: userActiveSub.plan_price,
              plan_currency: userActiveSub.plan_currency,
              priceType: typeof userActiveSub.plan_price,
              currencyType: typeof userActiveSub.plan_currency
            }
            : null
        });
      }

      break; // Only test first subscription to avoid spam
    }

    // Step 4: Check for potential data type issues
    logger.info('=== Step 4: Checking for data type mismatches ===');

    const planIdMismatches = await knex.raw(`
      SELECT 
        us.id as subscription_id,
        us.plan_id as subscription_plan_id,
        sp.stripe_price_id as plan_stripe_price_id,
        CASE 
          WHEN us.plan_id = sp.stripe_price_id THEN 'MATCH'
          ELSE 'NO_MATCH'
        END as match_status
      FROM user_subscriptions us
      LEFT JOIN subscription_plans sp ON us.plan_id = sp.stripe_price_id
      WHERE us.status IN ('active', 'trialing')
      LIMIT 10
    `);

    logger.info('Plan ID matching analysis:', {
      results: planIdMismatches.rows || planIdMismatches
    });

    logger.info('🎉 Plan price diagnostic completed');
  } catch (error) {
    logger.error('❌ Plan price diagnostic failed', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    await knex.destroy();
  }
}

// Run the diagnostic
if (require.main === module) {
  diagnosePlanPriceIssue()
    .then(() => {
      logger.info('Plan price diagnostic completed successfully');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Plan price diagnostic failed', { error: error.message });
      process.exit(1);
    });
}

module.exports = { diagnosePlanPriceIssue };
