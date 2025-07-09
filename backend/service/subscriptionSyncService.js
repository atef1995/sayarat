const Stripe = require('stripe');
const logger = require('../utils/logger');

/**
 * Subscription Sync Service
 *
 * ARCHITECTURE PRINCIPLES:
 * ========================
 *
 * 1. SINGLE RESPONSIBILITY: Handles synchronization between Stripe and local database
 * 2. DEPENDENCY INJECTION: Receives dependencies for better testability
 * 3. OBSERVER PATTERN: Can notify other services of sync events
 * 4. STRATEGY PATTERN: Different sync strategies for different scenarios
 * 5. ERROR BOUNDARIES: Comprehensive error handling and recovery
 *
 * USAGE:
 * ======
 *
 * const syncService = new SubscriptionSyncService(knex, stripe, subscriptionServiceFactory);
 * await syncService.syncAllSubscriptions();
 * await syncService.monitorNewPlans();
 *
 * #TODO: Add webhook integration for real-time sync
 * #TODO: Implement incremental sync for better performance
 * #TODO: Add sync conflict resolution strategies
 * #TODO: Implement rollback functionality for failed syncs
 */
class SubscriptionSyncService {
  constructor(knex, stripe, subscriptionServiceFactory, emailService = null) {
    if (!knex || !stripe || !subscriptionServiceFactory) {
      throw new Error('Required dependencies missing for SubscriptionSyncService');
    }

    this.knex = knex;
    this.stripe = stripe;
    this.subscriptionCoreService = subscriptionServiceFactory.getCoreService();
    this.emailService = emailService;

    // Sync strategies
    this.syncStrategies = {
      FULL: 'full',
      INCREMENTAL: 'incremental',
      PLANS_ONLY: 'plans_only',
      ACTIVE_ONLY: 'active_only'
    };

    // Known plan mappings to avoid constant Stripe API calls
    this.planCache = new Map();
    this.lastSyncTime = null;
  }

  /**
   * Sync all subscription data from Stripe
   * @param {string} strategy - Sync strategy to use
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Sync results
   */
  async syncAllSubscriptions(strategy = this.syncStrategies.ACTIVE_ONLY, options = {}) {
    const syncId = this._generateSyncId();
    const startTime = Date.now();

    try {
      logger.info('Starting subscription sync', {
        syncId,
        strategy,
        options,
        timestamp: new Date().toISOString()
      });

      const results = {
        syncId,
        strategy,
        startTime: new Date(startTime),
        subscriptionsProcessed: 0,
        subscriptionsUpdated: 0,
        plansDiscovered: 0,
        errors: [],
        warnings: []
      };

      // Get subscriptions based on strategy
      const subscriptions = await this._getSubscriptionsForSync(strategy, options);
      results.subscriptionsProcessed = subscriptions.length;

      // Process each subscription
      for (const dbSub of subscriptions) {
        try {
          const syncResult = await this._syncSingleSubscription(dbSub);

          if (syncResult.updated) {
            results.subscriptionsUpdated++;
          }

          if (syncResult.newPlan) {
            results.plansDiscovered++;
          }
        } catch (error) {
          logger.error('Error syncing subscription', {
            syncId,
            subscriptionId: dbSub.stripe_subscription_id,
            error: error.message
          });

          results.errors.push({
            subscriptionId: dbSub.stripe_subscription_id,
            error: error.message
          });
        }
      }

      // Update last sync time
      this.lastSyncTime = new Date();

      // Log completion
      const duration = Date.now() - startTime;
      results.endTime = new Date();
      results.duration = duration;

      logger.info('Subscription sync completed', {
        syncId,
        duration: `${duration}ms`,
        results: {
          processed: results.subscriptionsProcessed,
          updated: results.subscriptionsUpdated,
          plans: results.plansDiscovered,
          errors: results.errors.length
        }
      });

      // Notify if email service is available
      if (this.emailService && (results.errors.length > 0 || results.plansDiscovered > 0)) {
        await this._notifyAdminOfSyncResults(results);
      }

      return results;
    } catch (error) {
      logger.error('Subscription sync failed', {
        syncId,
        error: error.message,
        stack: error.stack,
        duration: Date.now() - startTime
      });

      throw error;
    }
  }

  /**
   * Monitor and discover new Stripe price IDs that aren't in our database
   * @param {Object} options - Monitoring options
   * @returns {Promise<Object>} Monitoring results
   */
  async monitorNewPlans(options = {}) {
    const monitorId = this._generateSyncId('monitor');

    try {
      logger.info('Starting plan monitoring', { monitorId, options });

      const results = {
        monitorId,
        timestamp: new Date(),
        newPlansFound: [],
        existingPlans: [],
        errors: []
      };

      // Get all price IDs currently used in subscriptions
      const usedPriceIds = await this.knex('user_subscriptions')
        .distinct('plan_id')
        .whereNotNull('plan_id')
        .pluck('plan_id');

      // Check each price ID against our plans table
      for (const priceId of usedPriceIds) {
        try {
          const existingPlan = await this.knex('subscription_plans')
            .where('stripe_price_id', priceId)
            .orWhere('name', priceId)
            .first();

          if (!existingPlan) {
            // Discover plan details from Stripe
            const newPlan = await this._discoverPlanFromStripe(priceId);

            if (newPlan) {
              results.newPlansFound.push(newPlan);

              // Auto-add the plan if enabled
              if (options.autoAdd !== false) {
                await this._addDiscoveredPlan(newPlan);
                logger.info('Auto-added new plan', { priceId, planName: newPlan.name });
              }
            }
          } else {
            results.existingPlans.push(priceId);
          }
        } catch (error) {
          logger.error('Error monitoring plan', { priceId, error: error.message });
          results.errors.push({ priceId, error: error.message });
        }
      }

      logger.info('Plan monitoring completed', {
        monitorId,
        newPlans: results.newPlansFound.length,
        existingPlans: results.existingPlans.length,
        errors: results.errors.length
      });

      return results;
    } catch (error) {
      logger.error('Plan monitoring failed', {
        monitorId,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Sync a single subscription with Stripe
   * @private
   */
  async _syncSingleSubscription(dbSub) {
    const stripeSubId = dbSub.stripe_subscription_id;

    // Get current data from Stripe
    const stripeSub = await this.stripe.subscriptions.retrieve(stripeSubId);

    // Check if update is needed
    const needsUpdate = this._checkIfUpdateNeeded(dbSub, stripeSub);

    if (!needsUpdate) {
      return { updated: false, newPlan: false };
    }

    // Prepare update data
    const updateData = {
      status: stripeSub.status,
      current_period_start: new Date(stripeSub.current_period_start * 1000),
      current_period_end: new Date(stripeSub.current_period_end * 1000),
      updated_at: new Date()
    };

    // Add cancellation data if applicable
    if (stripeSub.canceled_at) {
      updateData.canceled_at = new Date(stripeSub.canceled_at * 1000);
    }

    if (stripeSub.cancel_at_period_end !== undefined) {
      updateData.cancel_at_period_end = stripeSub.cancel_at_period_end;
    }

    // Update the subscription
    await this.subscriptionCoreService.updateSubscriptionStatus(stripeSubId, stripeSub.status, updateData);

    // Check if this introduces a new plan
    const newPlan = await this._checkForNewPlan(stripeSub);

    return { updated: true, newPlan };
  }

  /**
   * Get subscriptions for sync based on strategy
   * @private
   */
  async _getSubscriptionsForSync(strategy, options) {
    let query = this.knex('user_subscriptions').select('*').whereNotNull('stripe_subscription_id');

    switch (strategy) {
      case this.syncStrategies.ACTIVE_ONLY:
        query = query.where('status', 'active');
        break;

      case this.syncStrategies.INCREMENTAL:
        if (this.lastSyncTime) {
          query = query.where('updated_at', '>', this.lastSyncTime);
        }
        break;

      case this.syncStrategies.FULL:
        // No additional filters
        break;

      default:
        query = query.where('status', 'active');
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    return await query;
  }

  /**
   * Check if subscription needs updating
   * @private
   */
  _checkIfUpdateNeeded(dbSub, stripeSub) {
    // Check status
    if (dbSub.status !== stripeSub.status) {
      return true;
    }

    // Check period dates
    const stripePeriodStart = new Date(stripeSub.current_period_start * 1000);
    const stripePeriodEnd = new Date(stripeSub.current_period_end * 1000);

    if (
      !dbSub.current_period_start ||
      !dbSub.current_period_end ||
      Math.abs(new Date(dbSub.current_period_start) - stripePeriodStart) > 1000 ||
      Math.abs(new Date(dbSub.current_period_end) - stripePeriodEnd) > 1000
    ) {
      return true;
    }

    // Check cancellation status
    if (stripeSub.cancel_at_period_end !== dbSub.cancel_at_period_end) {
      return true;
    }

    return false;
  }

  /**
   * Discover plan details from Stripe
   * @private
   */
  async _discoverPlanFromStripe(priceId) {
    try {
      const price = await this.stripe.prices.retrieve(priceId, {
        expand: ['product']
      });

      // Generate a sensible plan name and display name
      const planName = this._generatePlanName(price);
      const displayName = this._generateDisplayName(price);

      return {
        stripe_price_id: priceId,
        name: planName,
        display_name: displayName,
        price: price.unit_amount / 100, // Convert from cents
        currency: price.currency.toUpperCase(),
        interval: price.recurring?.interval || 'month',
        features: this._inferFeatures(price),
        is_active: true,
        discovered_at: new Date()
      };
    } catch (error) {
      logger.error('Error discovering plan from Stripe', { priceId, error: error.message });
      return null;
    }
  }

  /**
   * Add discovered plan to database
   * @private
   */
  async _addDiscoveredPlan(planData) {
    return await this.knex('subscription_plans').insert({
      ...planData,
      features: JSON.stringify(planData.features),
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  /**
   * Generate plan name from Stripe price
   * @private
   */
  _generatePlanName(price) {
    const productName = price.product?.name || 'premium';
    const interval = price.recurring?.interval || 'month';

    return `${productName.toLowerCase().replace(/\s+/g, '_')}_${interval}ly`;
  }

  /**
   * Generate display name from Stripe price
   * @private
   */
  _generateDisplayName(price) {
    const productName = price.product?.name || 'خطة مميزة';
    const interval = price.recurring?.interval || 'month';
    const intervalText = interval === 'month' ? 'شهرية' : 'سنوية';

    return `${productName} - ${intervalText}`;
  }

  /**
   * Infer features from price metadata or defaults
   * @private
   */
  _inferFeatures(price) {
    // Check price metadata for features
    if (price.metadata?.features) {
      try {
        return JSON.parse(price.metadata.features);
      } catch (e) {
        // Fall through to defaults
      }
    }

    // Default premium features
    return ['aiCarAnalysis', 'listingHighlights', 'prioritySupport', 'advancedAnalytics', 'unlimitedListings'];
  }

  /**
   * Check if subscription introduces a new plan
   * @private
   */
  async _checkForNewPlan(stripeSub) {
    const priceId = stripeSub.items.data[0]?.price?.id;

    if (!priceId) {
      return false;
    }

    const existingPlan = await this.knex('subscription_plans').where('stripe_price_id', priceId).first();

    return !existingPlan;
  }

  /**
   * Generate unique sync ID
   * @private
   */
  _generateSyncId(prefix = 'sync') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Notify admin of sync results
   * @private
   */
  async _notifyAdminOfSyncResults(results) {
    try {
      if (!this.emailService) {
        return;
      }

      const subject = `Subscription Sync Report - ${results.syncId}`;
      const message = this._formatSyncReport(results);

      // #TODO: Implement admin email notification
      logger.info('Sync notification prepared', { syncId: results.syncId });
    } catch (error) {
      logger.error('Failed to send sync notification', { error: error.message });
    }
  }

  /**
   * Format sync results for reporting
   * @private
   */
  _formatSyncReport(results) {
    return {
      syncId: results.syncId,
      duration: results.duration,
      summary: {
        processed: results.subscriptionsProcessed,
        updated: results.subscriptionsUpdated,
        newPlans: results.plansDiscovered,
        errors: results.errors.length
      },
      errors: results.errors,
      timestamp: results.endTime
    };
  }
}

module.exports = SubscriptionSyncService;
