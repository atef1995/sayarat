/**
 * Script to update subscription plans with real Stripe Price IDs
 *
 * This script will sync the local database plans with actual Stripe Price IDs
 * to fix the join relationship and get correct plan pricing data.
 */

const logger = require('../utils/logger');
const knex = require('knex')(require('../knexFile.js').development);
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function updatePlansWithStripeData() {
  logger.info('Starting plan sync with Stripe...');

  try {
    // Step 1: Get current plans from database
    const dbPlans = await knex('subscription_plans').select('*');
    logger.info('Current database plans:', {
      plans: dbPlans.map(p => ({
        id: p.id,
        name: p.name,
        stripe_price_id: p.stripe_price_id,
        price: p.price,
        currency: p.currency
      }))
    });

    // Step 2: Get active subscriptions to see what Price IDs are being used
    const activeSubs = await knex('user_subscriptions')
      .whereIn('status', ['active', 'trialing'])
      .select('plan_id')
      .groupBy('plan_id');

    const usedPriceIds = activeSubs.map(sub => sub.plan_id);
    logger.info('Stripe Price IDs currently in use:', { usedPriceIds });

    // Step 3: Fetch these Price IDs from Stripe
    const stripePlansData = [];

    for (const priceId of usedPriceIds) {
      try {
        logger.info(`Fetching Stripe data for price: ${priceId}`);

        const stripePrice = await stripe.prices.retrieve(priceId, {
          expand: ['product']
        });

        const planData = {
          stripe_price_id: stripePrice.id,
          name: stripePrice.product.name.toLowerCase().replace(/\s+/g, '-'),
          display_name: stripePrice.product.name,
          description: stripePrice.product.description || null,
          price: (stripePrice.unit_amount / 100).toFixed(2), // Convert from cents
          currency: stripePrice.currency.toUpperCase(),
          interval: stripePrice.recurring?.interval || 'month',
          features: JSON.stringify(stripePrice.product.metadata || {}),
          is_active: stripePrice.active
        };

        stripePlansData.push(planData);

        logger.info('Stripe plan data retrieved:', {
          priceId,
          planData: {
            name: planData.name,
            price: planData.price,
            currency: planData.currency,
            interval: planData.interval
          }
        });
      } catch (stripeError) {
        logger.error('Failed to fetch price from Stripe:', {
          priceId,
          error: stripeError.message
        });
      }
    }

    // Step 4: Update or insert plans in database
    for (const stripePlan of stripePlansData) {
      const existingPlan = await knex('subscription_plans')
        .where('stripe_price_id', stripePlan.stripe_price_id)
        .first();

      if (existingPlan) {
        // Update existing plan
        await knex('subscription_plans')
          .where('id', existingPlan.id)
          .update({
            ...stripePlan,
            updated_at: new Date()
          });

        logger.info('Updated existing plan:', {
          id: existingPlan.id,
          stripe_price_id: stripePlan.stripe_price_id,
          name: stripePlan.name
        });
      } else {
        // Insert new plan
        const [insertedId] = await knex('subscription_plans')
          .insert({
            ...stripePlan,
            order_number: 0,
            created_at: new Date(),
            updated_at: new Date()
          })
          .returning('id');

        logger.info('Inserted new plan:', {
          id: insertedId,
          stripe_price_id: stripePlan.stripe_price_id,
          name: stripePlan.name
        });
      }
    }

    // Step 5: Verify the fix by testing join
    logger.info('=== Verifying the fix ===');

    const testJoin = await knex('user_subscriptions')
      .leftJoin('subscription_plans', 'user_subscriptions.plan_id', 'subscription_plans.stripe_price_id')
      .select(
        'user_subscriptions.id as sub_id',
        'user_subscriptions.plan_id as sub_plan_id',
        'subscription_plans.name as plan_name',
        'subscription_plans.price as plan_price',
        'subscription_plans.currency as plan_currency'
      )
      .whereIn('user_subscriptions.status', ['active', 'trialing'])
      .limit(3);

    logger.info('Join test results after sync:', {
      results: testJoin.map(result => ({
        sub_id: result.sub_id,
        sub_plan_id: result.sub_plan_id,
        plan_name: result.plan_name,
        plan_price: result.plan_price,
        plan_currency: result.plan_currency,
        joinWorking: !!(result.plan_name && result.plan_price)
      }))
    });

    logger.info('🎉 Plan sync with Stripe completed successfully!');
  } catch (error) {
    logger.error('❌ Plan sync failed', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    await knex.destroy();
  }
}

// Run the sync
if (require.main === module) {
  updatePlansWithStripeData()
    .then(() => {
      logger.info('Plan sync completed successfully');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Plan sync failed', { error: error.message });
      process.exit(1);
    });
}

module.exports = { updatePlansWithStripeData };
