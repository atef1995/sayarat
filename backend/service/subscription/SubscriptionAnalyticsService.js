const logger = require('../../utils/logger');

/**
 * Subscription Analytics Service
 *
 * ARCHITECTURE PRINCIPLES:
 * ========================
 *
 * 1. SINGLE RESPONSIBILITY: Handles subscription analytics and reporting
 * 2. DEPENDENCY INJECTION: Receives Knex instance for testability
 * 3. DATA ANALYSIS LAYER: Subscription metrics and reporting queries
 * 4. ERROR BOUNDARIES: Comprehensive error handling and logging
 * 5. PERFORMANCE OPTIMIZATION: Efficient queries with proper indexing considerations
 *
 * RESPONSIBILITIES:
 * =================
 * - Subscription analytics by account type
 * - Revenue analytics and reporting
 * - Subscription lifecycle metrics
 * - Churn analysis and retention metrics
 * - Plan performance analytics
 *
 * #TODO: Add subscription cohort analysis
 * #TODO: Implement churn prediction metrics
 * #TODO: Add revenue forecasting analytics
 * #TODO: Implement subscription health scoring
 */
class SubscriptionAnalyticsService {
  constructor(knex) {
    if (!knex) {
      throw new Error('Knex instance is required for SubscriptionAnalyticsService');
    }
    this.knex = knex;
  }

  /**
   * Get subscription analytics for account type
   * @param {string} accountType - Account type ('individual' | 'company')
   * @param {Object} [options] - Analytics options
   * @param {Date} [options.startDate] - Start date for analytics
   * @param {Date} [options.endDate] - End date for analytics
   * @returns {Promise<Object>} Analytics data
   */
  async getSubscriptionAnalytics(accountType, options = {}) {
    try {
      const query = this.knex('user_subscriptions').leftJoin(
        'subscription_plans',
        'user_subscriptions.subscription_plan_id',
        'subscription_plans.id'
      );

      if (accountType) {
        query.where('user_subscriptions.account_type', accountType);
      }

      if (options.startDate) {
        query.where('user_subscriptions.created_at', '>=', options.startDate);
      }

      if (options.endDate) {
        query.where('user_subscriptions.created_at', '<=', options.endDate);
      }

      const analytics = await query
        .select([
          this.knex.raw('COUNT(*) as total_subscriptions'),
          this.knex.raw('COUNT(CASE WHEN user_subscriptions.status = ? THEN 1 END) as active_subscriptions', [
            'active'
          ]),
          this.knex.raw('COUNT(CASE WHEN user_subscriptions.status = ? THEN 1 END) as trialing_subscriptions', [
            'trialing'
          ]),
          this.knex.raw('COUNT(CASE WHEN user_subscriptions.status = ? THEN 1 END) as canceled_subscriptions', [
            'canceled'
          ]),
          this.knex.raw('COUNT(CASE WHEN user_subscriptions.status = ? THEN 1 END) as past_due_subscriptions', [
            'past_due'
          ]),
          'subscription_plans.name as plan_name',
          'subscription_plans.display_name as plan_display_name',
          this.knex.raw('COUNT(*) as plan_count')
        ])
        .groupBy('subscription_plans.id', 'subscription_plans.name', 'subscription_plans.display_name');

      logger.info('SubscriptionAnalyticsService - Subscription analytics retrieved', {
        accountType,
        options,
        resultCount: analytics.length
      });

      return {
        accountType,
        period: {
          startDate: options.startDate,
          endDate: options.endDate
        },
        analytics
      };
    } catch (error) {
      logger.error('SubscriptionAnalyticsService - Error fetching subscription analytics', {
        error: error.message,
        accountType,
        options,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get revenue analytics
   * @param {Object} options - Analytics options
   * @param {Date} options.startDate - Start date
   * @param {Date} options.endDate - End date
   * @param {string} [options.groupBy='month'] - Group by period ('day', 'week', 'month', 'year')
   * @param {string} [options.currency] - Currency filter
   * @returns {Promise<Object>} Revenue analytics
   */
  async getRevenueAnalytics(options) {
    try {
      if (!options.startDate || !options.endDate) {
        throw new Error('Start date and end date are required for revenue analytics');
      }

      const groupBy = options.groupBy || 'month';
      const dateFormat = this._getDateFormat(groupBy);

      let query = this.knex('subscription_payments')
        .leftJoin(
          'user_subscriptions',
          'subscription_payments.stripe_subscription_id',
          'user_subscriptions.stripe_subscription_id'
        )
        .leftJoin('subscription_plans', 'user_subscriptions.subscription_plan_id', 'subscription_plans.id')
        .whereBetween('subscription_payments.created_at', [options.startDate, options.endDate])
        .where('subscription_payments.status', 'succeeded');

      if (options.currency) {
        query = query.where('subscription_payments.currency', options.currency.toLowerCase());
      }

      const revenueData = await query
        .select([
          this.knex.raw(`DATE_FORMAT(subscription_payments.created_at, '${dateFormat}') as period`),
          this.knex.raw('SUM(subscription_payments.amount) as total_revenue'),
          this.knex.raw('COUNT(*) as payment_count'),
          this.knex.raw('AVG(subscription_payments.amount) as average_payment'),
          'subscription_payments.currency',
          'user_subscriptions.account_type',
          'subscription_plans.name as plan_name'
        ])
        .groupBy(
          'period',
          'subscription_payments.currency',
          'user_subscriptions.account_type',
          'subscription_plans.name'
        )
        .orderBy('period', 'desc');

      logger.info('SubscriptionAnalyticsService - Revenue analytics retrieved', {
        options,
        resultCount: revenueData.length
      });

      return {
        period: {
          startDate: options.startDate,
          endDate: options.endDate,
          groupBy
        },
        revenueData
      };
    } catch (error) {
      logger.error('SubscriptionAnalyticsService - Error fetching revenue analytics', {
        error: error.message,
        options,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get subscription lifecycle metrics
   * @param {Object} [options] - Analytics options
   * @param {Date} [options.startDate] - Start date
   * @param {Date} [options.endDate] - End date
   * @returns {Promise<Object>} Lifecycle metrics
   */
  async getSubscriptionLifecycleMetrics(options = {}) {
    try {
      let baseQuery = this.knex('user_subscriptions');

      if (options.startDate) {
        baseQuery = baseQuery.where('created_at', '>=', options.startDate);
      }

      if (options.endDate) {
        baseQuery = baseQuery.where('created_at', '<=', options.endDate);
      }

      // Get basic lifecycle metrics
      const lifecycleMetrics = await baseQuery
        .clone()
        .select([
          this.knex.raw('COUNT(*) as total_subscriptions'),
          this.knex.raw('COUNT(CASE WHEN status = ? THEN 1 END) as active_count', ['active']),
          this.knex.raw('COUNT(CASE WHEN status = ? THEN 1 END) as canceled_count', ['canceled']),
          this.knex.raw('COUNT(CASE WHEN cancel_at_period_end = true THEN 1 END) as scheduled_cancellation_count'),
          this.knex.raw('AVG(DATEDIFF(COALESCE(canceled_at, NOW()), created_at)) as avg_subscription_lifetime_days'),
          'account_type'
        ])
        .groupBy('account_type');

      // Get churn rate by account type
      const churnMetrics = await this._getChurnMetrics(options);

      // Get retention metrics
      const retentionMetrics = await this._getRetentionMetrics(options);

      logger.info('SubscriptionAnalyticsService - Subscription lifecycle metrics retrieved', {
        options,
        lifecycleCount: lifecycleMetrics.length,
        churnCount: churnMetrics.length,
        retentionCount: retentionMetrics.length
      });

      return {
        period: {
          startDate: options.startDate,
          endDate: options.endDate
        },
        lifecycle: lifecycleMetrics,
        churn: churnMetrics,
        retention: retentionMetrics
      };
    } catch (error) {
      logger.error('SubscriptionAnalyticsService - Error fetching subscription lifecycle metrics', {
        error: error.message,
        options,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get plan performance analytics
   * @param {Object} [options] - Analytics options
   * @returns {Promise<Object>} Plan performance data
   */
  async getPlanPerformanceAnalytics(options = {}) {
    try {
      const planPerformance = await this.knex('subscription_plans')
        .leftJoin('user_subscriptions', 'subscription_plans.id', 'user_subscriptions.subscription_plan_id')
        .leftJoin(
          'subscription_payments',
          'user_subscriptions.stripe_subscription_id',
          'subscription_payments.stripe_subscription_id'
        )
        .select([
          'subscription_plans.id as plan_id',
          'subscription_plans.name as plan_name',
          'subscription_plans.display_name as plan_display_name',
          'subscription_plans.price as plan_price',
          'subscription_plans.currency as plan_currency',
          'subscription_plans.target_audience',
          this.knex.raw('COUNT(DISTINCT user_subscriptions.id) as total_subscriptions'),
          this.knex.raw(
            'COUNT(DISTINCT CASE WHEN user_subscriptions.status = ? THEN user_subscriptions.id END) as active_subscriptions',
            ['active']
          ),
          this.knex.raw(
            'COUNT(DISTINCT CASE WHEN user_subscriptions.status = ? THEN user_subscriptions.id END) as canceled_subscriptions',
            ['canceled']
          ),
          this.knex.raw(
            'SUM(CASE WHEN subscription_payments.status = ? THEN subscription_payments.amount ELSE 0 END) as total_revenue',
            ['succeeded']
          ),
          this.knex.raw('AVG(subscription_payments.amount) as avg_payment_amount'),
          this.knex.raw('COUNT(CASE WHEN subscription_payments.status = ? THEN 1 END) as successful_payments', [
            'succeeded'
          ]),
          this.knex.raw('COUNT(CASE WHEN subscription_payments.status = ? THEN 1 END) as failed_payments', ['failed'])
        ])
        .groupBy([
          'subscription_plans.id',
          'subscription_plans.name',
          'subscription_plans.display_name',
          'subscription_plans.price',
          'subscription_plans.currency',
          'subscription_plans.target_audience'
        ])
        .orderBy('total_subscriptions', 'desc');

      logger.info('SubscriptionAnalyticsService - Plan performance analytics retrieved', {
        options,
        planCount: planPerformance.length
      });

      return {
        planPerformance
      };
    } catch (error) {
      logger.error('SubscriptionAnalyticsService - Error fetching plan performance analytics', {
        error: error.message,
        options,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get account type comparison analytics
   * @param {Object} [options] - Analytics options
   * @returns {Promise<Object>} Account type comparison data
   */
  async getAccountTypeComparison(options = {}) {
    try {
      const comparison = await this.knex('user_subscriptions')
        .leftJoin(
          'subscription_payments',
          'user_subscriptions.stripe_subscription_id',
          'subscription_payments.stripe_subscription_id'
        )
        .leftJoin('subscription_plans', 'user_subscriptions.subscription_plan_id', 'subscription_plans.id')
        .select([
          'user_subscriptions.account_type',
          this.knex.raw('COUNT(DISTINCT user_subscriptions.id) as total_subscriptions'),
          this.knex.raw(
            'COUNT(DISTINCT CASE WHEN user_subscriptions.status = ? THEN user_subscriptions.id END) as active_subscriptions',
            ['active']
          ),
          this.knex.raw(
            'SUM(CASE WHEN subscription_payments.status = ? THEN subscription_payments.amount ELSE 0 END) as total_revenue',
            ['succeeded']
          ),
          this.knex.raw('AVG(subscription_payments.amount) as avg_revenue_per_user'),
          this.knex.raw(
            'AVG(DATEDIFF(COALESCE(user_subscriptions.canceled_at, NOW()), user_subscriptions.created_at)) as avg_lifetime_days'
          ),
          this.knex.raw('COUNT(DISTINCT subscription_plans.id) as unique_plans_used')
        ])
        .groupBy('user_subscriptions.account_type');

      logger.info('SubscriptionAnalyticsService - Account type comparison retrieved', {
        options,
        comparisonCount: comparison.length
      });

      return {
        comparison
      };
    } catch (error) {
      logger.error('SubscriptionAnalyticsService - Error fetching account type comparison', {
        error: error.message,
        options,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get churn metrics
   * @param {Object} options - Analytics options
   * @returns {Promise<Array>} Churn metrics
   * @private
   */
  async _getChurnMetrics(options) {
    try {
      let query = this.knex('user_subscriptions').where('status', 'canceled');

      if (options.startDate) {
        query = query.where('canceled_at', '>=', options.startDate);
      }

      if (options.endDate) {
        query = query.where('canceled_at', '<=', options.endDate);
      }

      const churnData = await query
        .select([
          'account_type',
          this.knex.raw('COUNT(*) as churned_subscriptions'),
          this.knex.raw('AVG(DATEDIFF(canceled_at, created_at)) as avg_days_before_churn')
        ])
        .groupBy('account_type');

      return churnData;
    } catch (error) {
      logger.error('SubscriptionAnalyticsService - Error fetching churn metrics', {
        error: error.message,
        options,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get retention metrics
   * @param {Object} options - Analytics options
   * @returns {Promise<Array>} Retention metrics
   * @private
   * #TODO: Implement detailed cohort retention analysis
   */
  async _getRetentionMetrics(options) {
    try {
      // Basic retention metrics - can be expanded with cohort analysis
      const retentionData = await this.knex('user_subscriptions')
        .select([
          'account_type',
          this.knex.raw('COUNT(CASE WHEN status = ? THEN 1 END) as retained_subscriptions', ['active']),
          this.knex.raw('COUNT(*) as total_subscriptions'),
          this.knex.raw('(COUNT(CASE WHEN status = ? THEN 1 END) / COUNT(*) * 100) as retention_rate', ['active'])
        ])
        .groupBy('account_type');

      return retentionData;
    } catch (error) {
      logger.error('SubscriptionAnalyticsService - Error fetching retention metrics', {
        error: error.message,
        options,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get date format for SQL based on groupBy period
   * @param {string} groupBy - Group by period
   * @returns {string} SQL date format
   * @private
   */
  _getDateFormat(groupBy) {
    const formats = {
      day: '%Y-%m-%d',
      week: '%Y-%u',
      month: '%Y-%m',
      year: '%Y'
    };

    return formats[groupBy] || formats.month;
  }
}

module.exports = { SubscriptionAnalyticsService };
