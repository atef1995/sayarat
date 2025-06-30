const { SubscriptionCoreService } = require('./SubscriptionCoreService');
const { SubscriptionPaymentService } = require('./SubscriptionPaymentService');
const { SubscriptionLifecycleService } = require('./SubscriptionLifecycleService');
const { UserAccountManagementService } = require('./UserAccountManagementService');
const { SubscriptionAnalyticsService } = require('./SubscriptionAnalyticsService');
const logger = require('../../utils/logger');

/**
 * Subscription Service Factory
 *
 * ARCHITECTURE PRINCIPLES:
 * ========================
 *
 * 1. FACTORY PATTERN: Creates and manages specialized subscription services
 * 2. SINGLE RESPONSIBILITY: Each service handles specific subscription concerns
 * 3. DEPENDENCY INJECTION: Provides consistent Knex instance to all services
 * 4. FACADE PATTERN: Provides unified interface to subscription operations
 * 5. SERVICE ORCHESTRATION: Coordinates between different subscription services
 *
 * SERVICES PROVIDED:
 * ==================
 * - SubscriptionCoreService: Basic CRUD operations
 * - SubscriptionPaymentService: Payment recording and tracking
 * - SubscriptionLifecycleService: Cancellation, reactivation, plan changes
 * - UserAccountManagementService: User account operations
 * - SubscriptionAnalyticsService: Analytics and reporting
 *
 * USAGE:
 * ======
 *
 * const factory = new SubscriptionServiceFactory(knex);
 * const coreService = factory.getCoreService();
 * const paymentService = factory.getPaymentService();
 *
 * // Or use unified operations
 * await factory.createSubscription(subscriptionData);
 * await factory.cancelSubscription(subscriptionId, cancellationData);
 *
 * #TODO: Add service health monitoring
 * #TODO: Implement service-level caching
 * #TODO: Add cross-service transaction management
 */
class SubscriptionServiceFactory {
  constructor(knex) {
    if (!knex) {
      throw new Error('Knex instance is required for SubscriptionServiceFactory');
    }

    this.knex = knex;
    this._services = {};

    // Initialize all services
    this._initializeServices();

    logger.info('SubscriptionServiceFactory - Initialized with all specialized services');
  }

  /**
   * Get Core Service (CRUD operations)
   * @returns {SubscriptionCoreService} Core service instance
   */
  getCoreService() {
    return this._services.core;
  }

  /**
   * Get Payment Service (payment operations)
   * @returns {SubscriptionPaymentService} Payment service instance
   */
  getPaymentService() {
    return this._services.payment;
  }

  /**
   * Get Lifecycle Service (cancellation, reactivation, etc.)
   * @returns {SubscriptionLifecycleService} Lifecycle service instance
   */
  getLifecycleService() {
    return this._services.lifecycle;
  }

  /**
   * Get User Account Management Service (account operations)
   * @returns {UserAccountManagementService} User account management service instance
   */
  getUserAccountService() {
    return this._services.userAccount;
  }

  /**
   * Get Analytics Service (reporting and analytics)
   * @returns {SubscriptionAnalyticsService} Analytics service instance
   */
  getAnalyticsService() {
    return this._services.analytics;
  }

  // ============================================================================
  // UNIFIED OPERATIONS - Facade methods that orchestrate multiple services
  // ============================================================================

  /**
   * Create or update subscription (unified operation)
   * @param {Object} subscriptionData - Subscription data
   * @returns {Promise<Object>} Created/updated subscription
   */
  async createOrUpdateSubscription(subscriptionData) {
    try {
      const result = await this._services.core.createOrUpdateSubscription(subscriptionData);

      // Update user premium status if needed
      if (subscriptionData.seller_id && this._isPremiumStatus(subscriptionData.status)) {
        await this._services.userAccount.updateUserPremiumStatus(subscriptionData.seller_id, true);
      }

      logger.info('SubscriptionServiceFactory - Subscription created/updated with premium status sync', {
        subscriptionId: result.id,
        userId: subscriptionData.seller_id,
        status: subscriptionData.status
      });

      return result;
    } catch (error) {
      logger.error('SubscriptionServiceFactory - Error in unified createOrUpdateSubscription', {
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
   * Cancel subscription (unified operation)
   * @param {number} subscriptionId - Subscription ID
   * @param {Object} cancellationData - Cancellation data
   * @param {boolean} immediate - Whether to cancel immediately
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelSubscription(subscriptionId, cancellationData, immediate = false) {
    try {
      // Cancel the subscription
      const cancellationResult = await this._services.lifecycle.updateSubscriptionCancellation(
        subscriptionId,
        cancellationData,
        immediate
      );

      // If immediate cancellation, check if user should lose premium status
      if (immediate && cancellationResult.subscription) {
        const userId = cancellationResult.subscription.seller_id;

        // Check for other active subscriptions
        const otherSubscriptions = await this._services.core.getUserOtherActiveSubscriptions(userId, subscriptionId);

        // Remove premium status if no other active subscriptions
        if (otherSubscriptions.length === 0) {
          await this._services.userAccount.updateUserPremiumStatus(userId, false);

          logger.info('SubscriptionServiceFactory - Premium status removed due to immediate cancellation', {
            subscriptionId,
            userId
          });
        }
      }

      return cancellationResult;
    } catch (error) {
      logger.error('SubscriptionServiceFactory - Error in unified cancelSubscription', {
        error: error.message,
        subscriptionId,
        immediate,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Switch user account type (unified operation)
   * @param {number} userId - User ID
   * @param {string} newAccountType - New account type
   * @param {number|null} companyId - Company ID (for company accounts)
   * @returns {Promise<Object>} Account switch result
   */
  async switchUserAccountType(userId, newAccountType, companyId = null) {
    try {
      const result = await this._services.userAccount.updateSellerAccountType(userId, newAccountType, companyId);

      // Log the account type switch for analytics
      logger.info('SubscriptionServiceFactory - Account type switched successfully', {
        userId,
        oldAccountType: result.oldAccountType,
        newAccountType: result.newAccountType,
        companyId,
        subscriptionChanges: result.subscriptionChanges
      });

      return result;
    } catch (error) {
      logger.error('SubscriptionServiceFactory - Error in unified switchUserAccountType', {
        error: error.message,
        userId,
        newAccountType,
        companyId,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Record payment and update subscription status (unified operation)
   * @param {Object} paymentData - Payment data
   * @param {Object} [subscriptionUpdate] - Subscription update data
   * @returns {Promise<Object>} Payment and subscription update result
   */
  async recordPaymentAndUpdateSubscription(paymentData, subscriptionUpdate = null) {
    try {
      // Record the payment
      const paymentResult = await this._services.payment.recordPayment(paymentData);

      let subscriptionResult = null;

      // Update subscription if update data provided
      if (subscriptionUpdate && paymentData.stripe_subscription_id) {
        subscriptionResult = await this._services.core.updateSubscriptionStatus(
          paymentData.stripe_subscription_id,
          subscriptionUpdate.status || 'active',
          subscriptionUpdate
        );

        // Update user premium status for successful payments
        if (paymentData.status === 'succeeded' && subscriptionUpdate.seller_id) {
          await this._services.userAccount.updateUserPremiumStatus(subscriptionUpdate.seller_id, true);
        }
      }

      logger.info('SubscriptionServiceFactory - Payment recorded and subscription updated', {
        paymentId: paymentResult.id,
        subscriptionUpdated: !!subscriptionResult,
        paymentStatus: paymentData.status
      });

      return {
        payment: paymentResult,
        subscription: subscriptionResult
      };
    } catch (error) {
      logger.error('SubscriptionServiceFactory - Error in unified recordPaymentAndUpdateSubscription', {
        error: error.message,
        paymentData: {
          ...paymentData,
          metadata: 'redacted'
        },
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get comprehensive user subscription info (unified operation)
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Comprehensive subscription information
   */
  async getUserSubscriptionInfo(userId) {
    try {
      // Get user account info
      const userAccountInfo = await this._services.userAccount.getUserAccountInfo(userId);

      if (!userAccountInfo) {
        return null;
      }

      // Get active subscription details
      const activeSubscription = await this._services.core.getUserActiveSubscription(userId);

      // Get payment history if there's an active subscription
      let paymentHistory = [];
      if (activeSubscription?.stripe_subscription_id) {
        paymentHistory = await this._services.payment.getSubscriptionPaymentHistory(
          activeSubscription.stripe_subscription_id,
          10 // Last 10 payments
        );
      }

      // Get lifecycle history if there's an active subscription
      let lifecycleHistory = [];
      if (activeSubscription?.id) {
        lifecycleHistory = await this._services.lifecycle.getSubscriptionLifecycleHistory(activeSubscription.id);
      }

      const result = {
        user: userAccountInfo,
        activeSubscription,
        paymentHistory,
        lifecycleHistory,
        summary: {
          hasActiveSubscription: !!activeSubscription,
          accountType: userAccountInfo.account_type,
          isCompany: userAccountInfo.is_company,
          isPremium: userAccountInfo.is_premium,
          totalPayments: paymentHistory.length,
          totalLifecycleEvents: lifecycleHistory.length
        }
      };

      logger.debug('SubscriptionServiceFactory - Retrieved comprehensive user subscription info', {
        userId,
        hasActiveSubscription: result.summary.hasActiveSubscription,
        accountType: result.summary.accountType,
        paymentCount: paymentHistory.length
      });

      return result;
    } catch (error) {
      logger.error('SubscriptionServiceFactory - Error in unified getUserSubscriptionInfo', {
        error: error.message,
        userId,
        stack: error.stack
      });
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Initialize all specialized services
   * @private
   */
  _initializeServices() {
    this._services = {
      core: new SubscriptionCoreService(this.knex),
      payment: new SubscriptionPaymentService(this.knex),
      lifecycle: new SubscriptionLifecycleService(this.knex),
      userAccount: new UserAccountManagementService(this.knex),
      analytics: new SubscriptionAnalyticsService(this.knex)
    };

    logger.debug('SubscriptionServiceFactory - All specialized services initialized', {
      services: Object.keys(this._services)
    });
  }

  /**
   * Check if subscription status qualifies for premium features
   * @param {string} status - Subscription status
   * @returns {boolean} True if status qualifies for premium
   * @private
   */
  _isPremiumStatus(status) {
    const premiumStatuses = ['active', 'trialing'];
    return premiumStatuses.includes(status);
  }
}

module.exports = { SubscriptionServiceFactory };
