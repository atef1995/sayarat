const logger = require('../../utils/logger');

/**
 * Subscription Core Service
 *
 * ARCHITECTURE PRINCIPLES:
 * ========================
 *
 * 1. SINGLE RESPONSIBILITY: Handles basic subscription CRUD operations
 * 2. DEPENDENCY INJECTION: Receives Knex instance for testability
 * 3. DATA ACCESS LAYER: Core subscription database operations
 * 4. ERROR BOUNDARIES: Comprehensive error handling and logging
 *
 * RESPONSIBILITIES:
 * =================
 * - Create/Update/Read subscription records
 * - Get subscription by various identifiers
 * - Basic subscription status management
 *
 * #TODO: Add caching layer for frequently accessed subscription data
 * #TODO: Implement subscription search and filtering
 */
class SubscriptionCoreService {
  constructor(knex) {
    if (!knex) {
      throw new Error('Knex instance is required for SubscriptionCoreService');
    }
    this.knex = knex;
  }

  /**
   * Create or update subscription record
   * @param {Object} subscriptionData - Subscription data to insert/update
   * @param {string} subscriptionData.stripe_subscription_id - Stripe subscription ID
   * @param {string} subscriptionData.stripe_customer_id - Stripe customer ID
   * @param {string} subscriptionData.status - Subscription status
   * @param {Date} subscriptionData.current_period_start - Current period start date
   * @param {Date} subscriptionData.current_period_end - Current period end date
   * @param {string} [subscriptionData.plan_id] - Plan ID
   * @param {Object} [subscriptionData.metadata] - Additional metadata
   * @returns {Promise<Object>} Created or updated subscription record
   */
  async createOrUpdateSubscription(subscriptionData) {
    try {
      // Validate required fields
      this._validateSubscriptionData(subscriptionData);

      const {
        stripe_subscription_id,
        stripe_customer_id,
        status,
        current_period_start,
        current_period_end,
        plan_id,
        metadata = {},
        stripe_checkout_session_id,
        seller_id,
        account_type,
        company_id
      } = subscriptionData;

      // Check if subscription already exists
      const existingSubscription = await this.knex('user_subscriptions')
        .where('stripe_subscription_id', stripe_subscription_id)
        .first();

      const subscriptionRecord = {
        stripe_subscription_id,
        stripe_customer_id,
        status,
        metadata: JSON.stringify(metadata),
        updated_at: new Date()
      };

      // Only add dates if they are valid Date objects
      if (current_period_start instanceof Date && !isNaN(current_period_start.getTime())) {
        subscriptionRecord.current_period_start = current_period_start;
      }
      if (current_period_end instanceof Date && !isNaN(current_period_end.getTime())) {
        subscriptionRecord.current_period_end = current_period_end;
      }

      // Add optional fields if provided
      if (plan_id) {
        subscriptionRecord.plan_id = plan_id;
      }
      if (stripe_checkout_session_id) {
        subscriptionRecord.stripe_checkout_session_id = stripe_checkout_session_id;
      }
      if (seller_id) {
        subscriptionRecord.seller_id = seller_id;
      }
      if (account_type) {
        subscriptionRecord.account_type = account_type;
      }
      if (company_id) {
        subscriptionRecord.company_id = company_id;
      }

      let result;

      if (existingSubscription) {
        // Update existing subscription
        await this.knex('user_subscriptions').where('id', existingSubscription.id).update(subscriptionRecord);

        result = { ...existingSubscription, ...subscriptionRecord };

        logger.info('Subscription updated successfully', {
          subscriptionId: stripe_subscription_id,
          status,
          existingId: existingSubscription.id,
          accountType: account_type
        });
      } else {
        // Create new subscription
        subscriptionRecord.created_at = new Date();

        const [insertedId] = await this.knex('user_subscriptions').insert(subscriptionRecord).returning('id');

        result = { id: insertedId, ...subscriptionRecord };

        logger.info('Subscription created successfully', {
          subscriptionId: stripe_subscription_id,
          status,
          newId: insertedId,
          accountType: account_type
        });
      }

      return result;
    } catch (error) {
      logger.error('SubscriptionCoreService - Error creating/updating subscription', {
        error: error.message,
        subscriptionData: {
          ...subscriptionData,
          metadata: 'redacted'
        },
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get subscription by Stripe subscription ID
   * @param {string} stripeSubscriptionId - Stripe subscription ID
   * @returns {Promise<Object|null>} Subscription record or null
   */
  async getSubscriptionByStripeId(stripeSubscriptionId) {
    try {
      if (!stripeSubscriptionId) {
        throw new Error('Stripe subscription ID is required');
      }

      const subscription = await this.knex('user_subscriptions')
        .leftJoin('subscription_plans', 'user_subscriptions.plan_id', 'subscription_plans.stripe_price_id')
        .leftJoin('sellers', 'user_subscriptions.seller_id', 'sellers.id')
        .leftJoin('companies', 'user_subscriptions.company_id', 'companies.id')
        .select(
          'user_subscriptions.*',
          'subscription_plans.name as plan_name',
          'subscription_plans.display_name as plan_display_name',
          'subscription_plans.price as plan_price',
          'subscription_plans.currency as plan_currency',
          'subscription_plans.interval as plan_interval',
          'sellers.email as user_email',
          'sellers.first_name as user_first_name',
          'sellers.last_name as user_last_name',
          'companies.name as company_name'
        )
        .where('user_subscriptions.stripe_subscription_id', stripeSubscriptionId)
        .first();

      if (subscription && subscription.metadata) {
        try {
          subscription.metadata = JSON.parse(subscription.metadata);
        } catch (parseError) {
          logger.warn('Failed to parse subscription metadata', {
            stripeSubscriptionId,
            error: parseError.message
          });
          subscription.metadata = {};
        }
      }

      return subscription;
    } catch (error) {
      logger.error('SubscriptionCoreService - Error getting subscription by Stripe ID', {
        error: error.message,
        stripeSubscriptionId,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get user's active subscription
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Active subscription or null
   */
  async getUserActiveSubscription(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const subscription = await this.knex('user_subscriptions')
        .leftJoin('subscription_plans', 'user_subscriptions.plan_id', 'subscription_plans.stripe_price_id')
        .leftJoin('companies', 'user_subscriptions.company_id', 'companies.id')
        .select(
          'user_subscriptions.*',
          'subscription_plans.name as plan_name',
          'subscription_plans.display_name as plan_display_name',
          'subscription_plans.price as plan_price',
          'subscription_plans.currency as plan_currency',
          'subscription_plans.interval as plan_interval', // Added interval for billing frequency
          'subscription_plans.features as plan_features',
          'companies.name as company_name'
        )
        .where('user_subscriptions.seller_id', userId)
        .whereIn('user_subscriptions.status', ['active', 'trialing'])
        .first();

      // Debug: Check if plan data is found and log details
      if (subscription) {
        logger.info('Subscription plan data debug', {
          userId,
          subscriptionId: subscription.id,
          planId: subscription.plan_id,
          planName: subscription.plan_name,
          planPrice: subscription.plan_price,
          planCurrency: subscription.plan_currency,
          planPriceType: typeof subscription.plan_price,
          planCurrencyType: typeof subscription.plan_currency,
          hasJoinedPlanData: !!(subscription.plan_name || subscription.plan_price || subscription.plan_currency)
        });

        // If join failed to get plan data, try to get it from getPlanDetails
        if (subscription.plan_id && !subscription.plan_name) {
          logger.warn('Plan data not found in database join - attempting fallback', {
            userId,
            planId: subscription.plan_id,
            subscriptionId: subscription.id
          });

          // Try to get plan details (this will use Stripe if available)
          const planDetails = await this.getPlanDetails(subscription.plan_id);

          if (planDetails) {
            // Merge plan details into subscription
            subscription.plan_name = planDetails.name;
            subscription.plan_display_name = planDetails.display_name;
            subscription.plan_price = planDetails.price;
            subscription.plan_currency = planDetails.currency;
            subscription.plan_interval = planDetails.interval;
            subscription.plan_features = planDetails.features;
            subscription.plan_data_source = planDetails.source;

            logger.info('Plan data retrieved via fallback', {
              userId,
              planId: subscription.plan_id,
              planName: planDetails.name,
              planPrice: planDetails.price,
              planCurrency: planDetails.currency,
              source: planDetails.source
            });
          }
        }
      }

      // #TODO: If no plan data found in database, fetch from Stripe as fallback
      if (subscription && subscription.plan_id && !subscription.plan_name) {
        logger.warn('Plan data not found in database - consider syncing with Stripe', {
          userId,
          planId: subscription.plan_id,
          subscriptionId: subscription.id
        });
      }

      logger.debug('SubscriptionCoreService - Retrieved user active subscription', {
        userId,
        subscriptionFound: !!subscription,
        subscriptionId: subscription?.id,
        planId: subscription?.plan_id,
        planFound: !!subscription?.plan_name,
        accountType: subscription?.account_type
      });

      return subscription;
    } catch (error) {
      logger.error('SubscriptionCoreService - Error getting user active subscription', {
        error: error.message,
        userId,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get other active subscriptions for a user
   * @param {number} userId - User ID
   * @param {number} excludeSubscriptionId - Subscription ID to exclude
   * @returns {Promise<Array>} Other active subscriptions
   */
  async getUserOtherActiveSubscriptions(userId, excludeSubscriptionId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const query = this.knex('user_subscriptions')
        .leftJoin('subscription_plans', 'user_subscriptions.plan_id', 'subscription_plans.stripe_price_id')
        .select(
          'user_subscriptions.*',
          'subscription_plans.name as plan_name',
          'subscription_plans.display_name as plan_display_name'
        )
        .where('user_subscriptions.seller_id', userId)
        .whereIn('user_subscriptions.status', ['active', 'trialing']);

      if (excludeSubscriptionId) {
        query.whereNot('user_subscriptions.id', excludeSubscriptionId);
      }

      const subscriptions = await query;

      logger.debug('SubscriptionCoreService - Retrieved user other active subscriptions', {
        userId,
        excludeSubscriptionId,
        count: subscriptions.length
      });

      return subscriptions;
    } catch (error) {
      logger.error('SubscriptionCoreService - Error getting user other active subscriptions', {
        error: error.message,
        userId,
        excludeSubscriptionId,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Update subscription status
   * @param {string} stripeSubscriptionId - Stripe subscription ID
   * @param {string} status - New subscription status
   * @param {Object} additionalData - Additional data to update
   * @returns {Promise<number>} Number of affected rows
   */
  async updateSubscriptionStatus(stripeSubscriptionId, status, additionalData = {}) {
    try {
      if (!stripeSubscriptionId || !status) {
        throw new Error('Stripe subscription ID and status are required');
      }

      const updateData = {
        status,
        updated_at: new Date()
      };

      // Add additional data, validating dates
      Object.keys(additionalData).forEach(key => {
        const value = additionalData[key];

        if (key === 'current_period_start' || key === 'current_period_end') {
          if (value instanceof Date && !isNaN(value.getTime())) {
            updateData[key] = value;
          } else if (value !== null && value !== undefined) {
            logger.warn('Invalid date value provided for subscription update', {
              field: key,
              value,
              type: typeof value,
              stripeSubscriptionId
            });
          }
        } else if (value !== undefined && value !== null) {
          updateData[key] = value;
        }
      });

      const affectedRows = await this.knex('user_subscriptions')
        .where('stripe_subscription_id', stripeSubscriptionId)
        .update(updateData);

      if (affectedRows === 0) {
        logger.warn('SubscriptionCoreService - No subscription found to update', {
          stripeSubscriptionId,
          status
        });
        return 0;
      }

      logger.info('SubscriptionCoreService - Subscription status updated successfully', {
        stripeSubscriptionId,
        status,
        affectedRows
      });

      return affectedRows;
    } catch (error) {
      logger.error('SubscriptionCoreService - Error updating subscription status', {
        error: error.message,
        stripeSubscriptionId,
        status,
        additionalData,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get subscription plans from database
   * @returns {Promise<Array>} Subscription plans
   */
  async getSubscriptionPlans() {
    try {
      const plans = await this.knex('subscription_plans').select('*').orderBy('created_at', 'asc');

      logger.debug('SubscriptionCoreService - Retrieved subscription plans', {
        count: plans.length
      });

      return plans;
    } catch (error) {
      logger.error('SubscriptionCoreService - Error getting subscription plans', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Validate subscription data
   * @param {Object} subscriptionData - Subscription data to validate
   * @private
   */
  _validateSubscriptionData(subscriptionData) {
    const required = ['stripe_subscription_id', 'stripe_customer_id', 'status'];

    for (const field of required) {
      if (!subscriptionData[field]) {
        throw new Error(`${field} is required for subscription`);
      }
    }

    // Check for seller_id requirement (database constraint)
    if (!subscriptionData.seller_id) {
      throw new Error('seller_id is required for subscription (database constraint)');
    }

    // Validate status
    const validStatuses = ['active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid'];
    if (!validStatuses.includes(subscriptionData.status)) {
      throw new Error(
        `Invalid subscription status: ${subscriptionData.status}. Must be one of: ${validStatuses.join(', ')}`
      );
    }

    // Validate date fields if provided
    if (subscriptionData.current_period_start !== undefined) {
      if (!(subscriptionData.current_period_start instanceof Date)) {
        throw new Error('current_period_start must be a Date object');
      }
    }

    if (subscriptionData.current_period_end !== undefined) {
      if (!(subscriptionData.current_period_end instanceof Date)) {
        throw new Error('current_period_end must be a Date object');
      }
    }
  }

  /**
   * Sync subscription data with Stripe
   * Fetches latest subscription data from Stripe and updates local database
   *
   * @param {string} stripeSubscriptionId - Stripe subscription ID
   * @param {Object} stripe - Stripe client instance
   * @returns {Promise<Object>} Updated subscription record
   */
  async syncSubscriptionWithStripe(stripeSubscriptionId, stripe) {
    try {
      if (!stripeSubscriptionId || !stripe) {
        throw new Error('Stripe subscription ID and Stripe client are required');
      }

      // Fetch latest subscription data from Stripe
      const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

      logger.info('Syncing subscription with Stripe data', {
        subscriptionId: stripeSubscriptionId,
        status: stripeSubscription.status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
      });

      // Update local subscription with Stripe data
      const updateData = {
        status: stripeSubscription.status,
        current_period_start: new Date(stripeSubscription.current_period_start * 1000),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000),
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
        updated_at: new Date()
      };

      // Add canceled_at if subscription is canceled
      if (stripeSubscription.canceled_at) {
        updateData.canceled_at = new Date(stripeSubscription.canceled_at * 1000);
      }

      const affectedRows = await this.knex('user_subscriptions')
        .where('stripe_subscription_id', stripeSubscriptionId)
        .update(updateData);

      if (affectedRows === 0) {
        logger.warn('SubscriptionCoreService - No subscription found to sync', {
          stripeSubscriptionId
        });
        return null;
      }

      logger.info('SubscriptionCoreService - Subscription synced successfully', {
        stripeSubscriptionId,
        affectedRows,
        currentPeriodEnd: updateData.current_period_end
      });

      // Return the updated subscription record
      return await this.getSubscriptionByStripeId(stripeSubscriptionId);
    } catch (error) {
      logger.error('SubscriptionCoreService - Error syncing subscription with Stripe', {
        stripeSubscriptionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get plan details with Stripe fallback
   *
   * This method first tries to get plan details from the database,
   * and falls back to Stripe if not found locally.
   *
   * #TODO: Implement caching for Stripe plan lookups
   * #TODO: Add plan data sync job to keep database up-to-date
   *
   * @param {string} planId - Stripe price ID
   * @param {Object} [stripe] - Stripe client instance (optional)
   * @returns {Promise<Object|null>} Plan details or null
   */
  async getPlanDetails(planId, stripe = null) {
    try {
      if (!planId) {
        return null;
      }

      // First, try to get plan from database
      const dbPlan = await this.knex('subscription_plans').where('stripe_price_id', planId).first();

      if (dbPlan) {
        logger.debug('Plan details retrieved from database', {
          planId,
          planName: dbPlan.name
        });
        return {
          id: dbPlan.stripe_price_id,
          name: dbPlan.name,
          display_name: dbPlan.display_name,
          price: dbPlan.price,
          currency: dbPlan.currency,
          interval: dbPlan.interval,
          features: dbPlan.features,
          source: 'database'
        };
      }

      // Fallback to Stripe if available
      if (stripe) {
        logger.info('Plan not found in database, fetching from Stripe', {
          planId
        });

        try {
          const stripePrice = await stripe.prices.retrieve(planId, {
            expand: ['product']
          });

          const planDetails = {
            id: stripePrice.id,
            name: stripePrice.product.name,
            display_name: stripePrice.product.name,
            price: stripePrice.unit_amount / 100, // Convert from cents
            currency: stripePrice.currency.toUpperCase(),
            interval: stripePrice.recurring?.interval || 'month',
            features: stripePrice.product.metadata || {},
            source: 'stripe'
          };

          // #TODO: Consider auto-syncing this data to database
          logger.warn('Plan retrieved from Stripe - consider syncing to database', {
            planId,
            planName: planDetails.name
          });

          return planDetails;
        } catch (stripeError) {
          logger.error('Failed to fetch plan from Stripe', {
            planId,
            error: stripeError.message
          });
        }
      }

      logger.warn('Plan details not found in database or Stripe', {
        planId,
        stripeAvailable: !!stripe
      });

      return null;
    } catch (error) {
      logger.error('Error getting plan details', {
        planId,
        error: error.message,
        stack: error.stack
      });
      return null;
    }
  }

  /**
   * Get subscription with enriched plan data
   *
   * This method provides comprehensive subscription data with reliable plan information,
   * using database first and Stripe as fallback for plan details.
   *
   * @param {string} stripeSubscriptionId - Stripe subscription ID
   * @param {Object} [stripe] - Stripe client instance for fallback plan lookup
   * @returns {Promise<Object|null>} Subscription with enriched plan data
   */
  async getSubscriptionWithPlanDetails(stripeSubscriptionId, stripe = null) {
    try {
      // Get basic subscription data
      const subscription = await this.getSubscriptionByStripeId(stripeSubscriptionId);

      if (!subscription) {
        return null;
      }

      // If plan data is missing from join, try to get it separately
      if (subscription.plan_id && !subscription.plan_name) {
        const planDetails = await this.getPlanDetails(subscription.plan_id, stripe);

        if (planDetails) {
          // Merge plan details into subscription object
          subscription.plan_name = planDetails.name;
          subscription.plan_display_name = planDetails.display_name;
          subscription.plan_price = planDetails.price;
          subscription.plan_currency = planDetails.currency;
          subscription.plan_interval = planDetails.interval;
          subscription.plan_features = planDetails.features;
          subscription.plan_data_source = planDetails.source;
        }
      }

      return subscription;
    } catch (error) {
      logger.error('Error getting subscription with plan details', {
        stripeSubscriptionId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

module.exports = { SubscriptionCoreService };
