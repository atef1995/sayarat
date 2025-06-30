/**
 * Unified Subscription Service
 *
 * MIGRATION NOTES:
 * ================
 * This service REPLACES the previous scattered subscription handling approach by:
 *
 * 1. CONSOLIDATING LOGIC: All subscription operations now go through this unified service
 * 2. STRATEGY PATTERN: Different behaviors for individual vs company accounts
 * 3. FACTORY PATTERN: Automatic strategy selection based on account type
 * 4. IMPROVED SECURITY: Role-based permissions for company subscription management
 * 5. AUDIT COMPLIANCE: Comprehensive logging of all subscription changes
 *
 * ADVANTAGES OVER PREVIOUS APPROACH:
 * ==================================
 *
 * BEFORE (Multiple scattered services):
 * - subscriptionDatabase.js (basic CRUD operations)
 * - subscriptionSyncService.js (webhook handling)
 * - Various controller methods with duplicated logic
 * - No account type awareness
 * - Limited permission validation
 * - Inconsistent error handling
 *
 * AFTER (UnifiedSubscriptionService):
 * - Single point of truth for subscription logic
 * - Account type-aware operations
 * - Proper permission validation
 * - Consistent error handling and logging
 * - Transaction support for data integrity
 * - Extensible for new account types
 *
 * USAGE EXAMPLE:
 * ==============
 *
 * // Old approach (scattered, type-unaware):
 * const subscription = await subscriptionDb.createSubscription(userId, planId);
 *
 * // New approach (unified, type-aware):
 * const subscription = await UnifiedSubscriptionService.createSubscription(userId, planId, stripeData);
 *
 * Handles subscription management for both individual and company accounts
 * Implements Strategy pattern for different account type behaviors
 *
 * #TODO: Add subscription transfer between account types
 * #TODO: Implement bulk operations for enterprise clients
 * #TODO: Add subscription recommendation engine
 * #TODO: Implement usage-based billing for company accounts
 */

const AccountTypeService = require('./AccountTypeService');
const logger = require('../utils/logger');
const knex = require('../config/database');
/**
 * Base Subscription Strategy
 */
class BaseSubscriptionStrategy {
  constructor(accountType) {
    this.accountType = accountType;
  }

  async getSubscriptions(userId) {
    throw new Error('getSubscriptions must be implemented');
  }

  async createSubscription(userId, planId, stripeData) {
    throw new Error('createSubscription must be implemented');
  }

  async getAvailablePlans(userId) {
    throw new Error('getAvailablePlans must be implemented');
  }
}

/**
 * Individual Account Subscription Strategy
 */
class IndividualSubscriptionStrategy extends BaseSubscriptionStrategy {
  constructor() {
    super(AccountTypeService.ACCOUNT_TYPES.INDIVIDUAL);
  }

  async getSubscriptions(userId) {
    return await knex('user_subscriptions')
      .where({
        user_id: userId,
        account_type: this.accountType
      })
      .leftJoin('subscription_plans', 'user_subscriptions.subscription_plan_id', 'subscription_plans.id')
      .select('user_subscriptions.*', 'subscription_plans.name as plan_name');
  }

  async createSubscription(userId, planId, stripeData) {
    return await knex('user_subscriptions').insert({
      user_id: userId,
      subscription_plan_id: planId,
      account_type: this.accountType,
      company_id: null,
      stripe_subscription_id: stripeData.id,
      status: stripeData.status,
      current_period_start: new Date(stripeData.current_period_start * 1000),
      current_period_end: new Date(stripeData.current_period_end * 1000),
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  async getAvailablePlans() {
    return await knex('subscription_plans')
      .whereRaw('target_audience::jsonb ? ?', [this.accountType])
      .orWhereRaw('target_audience::jsonb ? ?', ['both'])
      .select('*');
  }
}

/**
 * Company Account Subscription Strategy
 */
class CompanySubscriptionStrategy extends BaseSubscriptionStrategy {
  constructor() {
    super(AccountTypeService.ACCOUNT_TYPES.COMPANY);
  }

  async getSubscriptions(userId) {
    const company = await AccountTypeService.getUserCompany(userId);

    if (!company) {
      return [];
    }

    return await knex('user_subscriptions')
      .where({
        company_id: company.id,
        account_type: this.accountType
      })
      .leftJoin('subscription_plans', 'user_subscriptions.subscription_plan_id', 'subscription_plans.id')
      .leftJoin('companies', 'user_subscriptions.company_id', 'companies.id')
      .select('user_subscriptions.*', 'subscription_plans.name as plan_name', 'companies.name as company_name');
  }

  async createSubscription(userId, planId, stripeData) {
    const company = await AccountTypeService.getUserCompany(userId);

    if (!company) {
      throw new Error('User is not associated with a company');
    }

    const canManage = await AccountTypeService.canManageCompanySubscription(userId);
    if (!canManage) {
      throw new Error('User does not have permission to manage company subscriptions');
    }

    return await knex('user_subscriptions').insert({
      user_id: userId,
      subscription_plan_id: planId,
      account_type: this.accountType,
      company_id: company.id,
      stripe_subscription_id: stripeData.id,
      status: stripeData.status,
      current_period_start: new Date(stripeData.current_period_start * 1000),
      current_period_end: new Date(stripeData.current_period_end * 1000),
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  async getAvailablePlans() {
    return await knex('subscription_plans')
      .whereRaw('target_audience::jsonb ? ?', [this.accountType])
      .orWhereRaw('target_audience::jsonb ? ?', ['both'])
      .select('*');
  }
}

/**
 * Unified Subscription Service - Factory pattern
 */
class UnifiedSubscriptionService {
  /**
   * Strategy factory method
   * @param {string} accountType - Account type
   * @returns {BaseSubscriptionStrategy} Strategy instance
   */
  static createStrategy(accountType) {
    switch (accountType) {
      case AccountTypeService.ACCOUNT_TYPES.INDIVIDUAL:
        return new IndividualSubscriptionStrategy();
      case AccountTypeService.ACCOUNT_TYPES.COMPANY:
        return new CompanySubscriptionStrategy();
      default:
        throw new Error(`Unsupported account type: ${accountType}`);
    }
  }

  /**
   * Get user subscriptions using appropriate strategy
   * @param {number} userId - User ID
   * @returns {Promise<Array>} User subscriptions
   */
  static async getUserSubscriptions(userId) {
    try {
      const accountType = await AccountTypeService.getUserAccountType(userId);
      const strategy = this.createStrategy(accountType);
      return await strategy.getSubscriptions(userId);
    } catch (error) {
      logger.error('UnifiedSubscriptionService - Error fetching user subscriptions:', {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Create new subscription using appropriate strategy
   * @param {number} userId - User ID
   * @param {string} planId - Plan ID
   * @param {Object} stripeData - Stripe subscription data
   * @returns {Promise<Object>} Created subscription
   */
  static async createSubscription(userId, planId, stripeData) {
    const trx = await knex.transaction();

    try {
      const accountType = await AccountTypeService.getUserAccountType(userId);
      const strategy = this.createStrategy(accountType);

      const subscription = await strategy.createSubscription(userId, planId, stripeData);

      // Log audit trail
      await this.logSubscriptionAction(trx, {
        subscription_id: subscription[0],
        user_id: userId,
        company_id:
          accountType === AccountTypeService.ACCOUNT_TYPES.COMPANY
            ? (await AccountTypeService.getUserCompany(userId))?.id
            : null,
        action: 'created',
        new_status: stripeData.status,
        new_plan_id: planId,
        metadata: { stripe_data: stripeData }
      });

      await trx.commit();
      return subscription;
    } catch (error) {
      await trx.rollback();
      logger.error('UnifiedSubscriptionService - Error creating subscription:', {
        userId,
        planId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get available plans for user's account type
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Available plans
   */
  static async getAvailablePlans(userId) {
    try {
      const accountType = await AccountTypeService.getUserAccountType(userId);
      const strategy = this.createStrategy(accountType);
      return await strategy.getAvailablePlans();
    } catch (error) {
      logger.error('UnifiedSubscriptionService - Error fetching available plans:', {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Update subscription status
   * @param {string} stripeSubscriptionId - Stripe subscription ID
   * @param {Object} updateData - Update data
   * @returns {Promise<boolean>} Success status
   */
  static async updateSubscriptionStatus(stripeSubscriptionId, updateData) {
    const trx = await knex.transaction();

    try {
      const existingSubscription = await trx('user_subscriptions')
        .where({ stripe_subscription_id: stripeSubscriptionId })
        .first();

      if (!existingSubscription) {
        throw new Error('Subscription not found');
      }

      await trx('user_subscriptions')
        .where({ stripe_subscription_id: stripeSubscriptionId })
        .update({
          ...updateData,
          updated_at: new Date()
        });

      // Log audit trail
      await this.logSubscriptionAction(trx, {
        subscription_id: existingSubscription.id,
        user_id: existingSubscription.user_id,
        company_id: existingSubscription.company_id,
        action: 'updated',
        old_status: existingSubscription.status,
        new_status: updateData.status,
        metadata: updateData
      });

      await trx.commit();
      return true;
    } catch (error) {
      await trx.rollback();
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  /**
   * Log subscription action to audit trail
   * @param {Object} trx - Knex transaction
   * @param {Object} actionData - Action data
   * @private
   */
  static async logSubscriptionAction(trx, actionData) {
    await trx('subscription_audit_log').insert({
      ...actionData,
      created_at: new Date(),
      ip_address: actionData.ip_address || null,
      user_agent: actionData.user_agent || null
    });
  }

  /**
   * Get subscription analytics for account type
   * @param {string} accountType - Account type
   * @returns {Promise<Object>} Analytics data
   */
  static async getSubscriptionAnalytics(accountType) {
    try {
      const analytics = await knex('user_subscriptions')
        .where({ account_type: accountType })
        .leftJoin('subscription_plans', 'user_subscriptions.subscription_plan_id', 'subscription_plans.id')
        .select([
          knex.raw('COUNT(*) as total_subscriptions'),
          knex.raw('COUNT(CASE WHEN status = ? THEN 1 END) as active_subscriptions', ['active']),
          knex.raw('COUNT(CASE WHEN status = ? THEN 1 END) as cancelled_subscriptions', ['cancelled']),
          'subscription_plans.name as plan_name',
          knex.raw('COUNT(*) as plan_count')
        ])
        .groupBy('subscription_plans.id', 'subscription_plans.name');

      return analytics;
    } catch (error) {
      console.error('Error fetching subscription analytics:', error);
      throw error;
    }
  }
}

module.exports = {
  UnifiedSubscriptionService,
  AccountTypeService
};
