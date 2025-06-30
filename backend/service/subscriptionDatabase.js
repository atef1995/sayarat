const logger = require('../utils/logger');
const { SubscriptionServiceFactory } = require('./subscription/SubscriptionServiceFactory');

/**
 * Subscription Database Service (DEPRECATED)
 *
 * ⚠️  DEPRECATION NOTICE:
 * ======================
 * This service is DEPRECATED and has been replaced by modular services:
 *
 * NEW ARCHITECTURE:
 * - SubscriptionCoreService: Basic CRUD operations
 * - SubscriptionPaymentService: Payment operations
 * - SubscriptionLifecycleService: Cancellation, reactivation
 * - UserAccountManagementService: User account operations
 * - SubscriptionAnalyticsService: Analytics and reporting
 * - SubscriptionServiceFactory: Unified interface
 *
 * MIGRATION PATH:
 * ===============
 *
 * // Old usage:
 * const subscriptionDb = new SubscriptionDatabase(knex);
 * await subscriptionDb.createOrUpdateSubscription(data);
 *
 * // New usage:
 * const factory = new SubscriptionServiceFactory(knex);
 * await factory.createOrUpdateSubscription(data);
 *
 * ADVANTAGES OF NEW ARCHITECTURE:
 * ===============================
 * ✅ Better separation of concerns
 * ✅ Easier testing and maintenance
 * ✅ More focused service responsibilities
 * ✅ Better error handling and logging
 * ✅ Unified operations with cross-service coordination
 *
 * #TODO: Remove this deprecated service after migration is complete
 * #TODO: Update all references to use SubscriptionServiceFactory
 */
class SubscriptionDatabase {
  constructor(knex) {
    if (!knex) {
      throw new Error('Knex instance is required for SubscriptionDatabase');
    }
    this.knex = knex;

    // Create factory instance for delegation
    this._factory = new SubscriptionServiceFactory(knex);

    // Log deprecation warning
    logger.warn('SubscriptionDatabase is DEPRECATED - Use SubscriptionServiceFactory instead', {
      deprecatedClass: 'SubscriptionDatabase',
      recommendedClass: 'SubscriptionServiceFactory',
      migrationGuide: 'See class documentation for migration path'
    });
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
        seller_id
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
      } // Add optional fields if provided
      if (plan_id) {
        subscriptionRecord.plan_id = plan_id;
      }
      if (stripe_checkout_session_id) {
        subscriptionRecord.stripe_checkout_session_id = stripe_checkout_session_id;
      }
      if (seller_id) {
        subscriptionRecord.seller_id = seller_id;
      }

      let result;

      if (existingSubscription) {
        // Update existing subscription
        await this.knex('user_subscriptions').where('id', existingSubscription.id).update(subscriptionRecord);

        result = { ...existingSubscription, ...subscriptionRecord };

        logger.info('Subscription updated successfully', {
          subscriptionId: stripe_subscription_id,
          status,
          existingId: existingSubscription.id
        });
      } else {
        // Create new subscription
        subscriptionRecord.created_at = new Date();

        const [insertedId] = await this.knex('user_subscriptions').insert(subscriptionRecord).returning('id');

        result = { id: insertedId, ...subscriptionRecord };

        logger.info('Subscription created successfully', {
          subscriptionId: stripe_subscription_id,
          status,
          newId: insertedId
        });
      } // Update user premium status if seller_id is available
      if (seller_id || existingSubscription?.seller_id) {
        await this._updateUserPremiumStatus(seller_id || existingSubscription.seller_id, this._isPremiumStatus(status));
      }

      return result;
    } catch (error) {
      logger.error('Error creating/updating subscription', {
        error: error.message,
        subscriptionData: {
          ...subscriptionData,
          metadata: 'redacted' // Don't log potentially sensitive metadata
        },
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Update subscription status and additional data
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

      // Add additional data, but validate dates first
      Object.keys(additionalData).forEach(key => {
        const value = additionalData[key];

        // Handle date fields specifically
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
          // Add non-date fields if they have valid values
          updateData[key] = value;
        }
      });

      const affectedRows = await this.knex('user_subscriptions')
        .where('stripe_subscription_id', stripeSubscriptionId)
        .update(updateData);

      if (affectedRows === 0) {
        logger.warn('No subscription found to update', {
          stripeSubscriptionId,
          status
        });
        return 0;
      } // Get seller_id for premium status update
      const subscription = await this.knex('user_subscriptions')
        .select('seller_id')
        .where('stripe_subscription_id', stripeSubscriptionId)
        .first();

      if (subscription?.seller_id) {
        await this._updateUserPremiumStatus(subscription.seller_id, this._isPremiumStatus(status));
      }

      logger.info('Subscription status updated successfully', {
        stripeSubscriptionId,
        status,
        affectedRows
      });

      return affectedRows;
    } catch (error) {
      logger.error('Error updating subscription status', {
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
   * Record payment for subscription or one-time payment
   * @param {Object} paymentData - Payment data to record
   * @param {string} [paymentData.stripe_subscription_id] - Stripe subscription ID
   * @param {string} [paymentData.stripe_payment_intent_id] - Stripe payment intent ID
   * @param {string} paymentData.stripe_invoice_id - Stripe invoice ID
   * @param {number} paymentData.amount - Payment amount
   * @param {string} paymentData.currency - Payment currency
   * @param {string} paymentData.status - Payment status
   * @param {Date} [paymentData.paid_at] - Payment success date
   * @param {Date} [paymentData.failed_at] - Payment failure date
   * @param {Object} [paymentData.metadata] - Additional metadata
   * @returns {Promise<Object>} Created payment record
   */
  async recordPayment(paymentData) {
    try {
      this._validatePaymentData(paymentData);

      const {
        stripe_subscription_id,
        stripe_payment_intent_id,
        stripe_invoice_id,
        stripe_customer_id,
        stripe_checkout_session_id,
        amount,
        currency,
        status,
        paid_at,
        failed_at,
        metadata = {}
      } = paymentData;

      const paymentRecord = {
        stripe_subscription_id,
        stripe_payment_intent_id,
        stripe_invoice_id,
        stripe_customer_id,
        stripe_checkout_session_id,
        amount,
        currency: currency?.toLowerCase(),
        status,
        paid_at,
        failed_at,
        metadata: JSON.stringify(metadata),
        created_at: new Date(),
        updated_at: new Date()
      };

      // Remove undefined fields
      Object.keys(paymentRecord).forEach(key => {
        if (paymentRecord[key] === undefined) {
          delete paymentRecord[key];
        }
      });

      const [paymentId] = await this.knex('subscription_payments').insert(paymentRecord).returning('id');

      const result = { id: paymentId, ...paymentRecord };

      logger.info('Payment recorded successfully', {
        paymentId,
        stripeSubscriptionId: stripe_subscription_id,
        stripeInvoiceId: stripe_invoice_id,
        amount,
        currency,
        status
      });

      return result;
    } catch (error) {
      logger.error('Error recording payment', {
        error: error.message,
        paymentData: {
          ...paymentData,
          metadata: 'redacted' // Don't log potentially sensitive metadata
        },
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Update payment record with charge information
   * @param {string} stripePaymentIntentId - Stripe payment intent ID
   * @param {Object} chargeData - Charge data to update
   * @param {string} [chargeData.stripe_charge_id] - Stripe charge ID
   * @param {Date} [chargeData.charged_at] - Charge success timestamp
   * @param {Date} [chargeData.charge_failed_at] - Charge failure timestamp
   * @param {string} [chargeData.charge_status] - Charge status (succeeded/failed)
   * @param {string} [chargeData.charge_failure_reason] - Charge failure reason
   * @returns {Promise<Object>} Updated payment record
   */
  async updatePaymentWithCharge(stripePaymentIntentId, chargeData) {
    try {
      if (!stripePaymentIntentId) {
        throw new Error('Stripe payment intent ID is required');
      }

      if (!chargeData || typeof chargeData !== 'object') {
        throw new Error('Valid charge data is required');
      }

      // Build update object with only provided fields
      const updateData = {};
      if (chargeData.stripe_charge_id) {
        updateData.stripe_charge_id = chargeData.stripe_charge_id;
      }
      if (chargeData.charged_at) {
        updateData.charged_at = chargeData.charged_at;
      }
      if (chargeData.charge_failed_at) {
        updateData.charge_failed_at = chargeData.charge_failed_at;
      }
      if (chargeData.charge_status) {
        updateData.charge_status = chargeData.charge_status;
      }
      if (chargeData.charge_failure_reason) {
        updateData.charge_failure_reason = chargeData.charge_failure_reason;
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error('No valid charge data fields provided for update');
      }

      // Add updated timestamp
      updateData.updated_at = new Date();

      const updatedRows = await this.knex('subscription_payments')
        .where('stripe_payment_intent_id', stripePaymentIntentId)
        .update(updateData);

      if (updatedRows === 0) {
        logger.warn('No payment record found to update with charge data', {
          stripePaymentIntentId,
          chargeData
        });
        return null;
      }

      // Fetch and return the updated record
      const updatedPayment = await this.knex('subscription_payments')
        .where('stripe_payment_intent_id', stripePaymentIntentId)
        .first();

      logger.info('Payment record updated with charge information', {
        stripePaymentIntentId,
        chargeId: chargeData.stripe_charge_id,
        chargeStatus: chargeData.charge_status,
        updatedRows
      });

      return updatedPayment;
    } catch (error) {
      logger.error('Error updating payment with charge data', {
        error: error.message,
        stripePaymentIntentId,
        chargeData,
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
        .select(
          'user_subscriptions.*',
          'subscription_plans.name as plan_name',
          'subscription_plans.display_name as plan_display_name',
          'subscription_plans.price as plan_price',
          'subscription_plans.currency as plan_currency',
          'subscription_plans.interval as plan_interval',
          'sellers.email as user_email',
          'sellers.first_name as user_first_name',
          'sellers.last_name as user_last_name'
        )
        .where('user_subscriptions.stripe_subscription_id', stripeSubscriptionId)
        .first();

      if (subscription) {
        // Parse metadata if it exists
        if (subscription.metadata) {
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
      }

      return subscription;
    } catch (error) {
      logger.error('Error getting subscription by Stripe ID', {
        error: error.message,
        stripeSubscriptionId,
        stack: error.stack
      });
      throw error;
    }
  } /**
   * Get user's current subscription (active or scheduled for cancellation)
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Current subscription or null
   */
  async getUserActiveSubscription(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const subscription = await this.knex('user_subscriptions')
        .where('seller_id', userId)
        .whereIn('status', ['active', 'trialing'])
        .first();

      logger.debug('Retrieved user active subscription', {
        userId,
        subscriptionFound: !!subscription,
        subscriptionId: subscription?.id
      });

      return subscription;
    } catch (error) {
      logger.error('Error getting user active subscription', {
        error: error.message,
        userId,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Update subscription with cancellation data
   * @param {number} subscriptionId - Subscription ID
   * @param {Object} cancellationData - Cancellation data
   * @param {boolean} immediate - Whether cancellation is immediate
   * @returns {Promise<Object>} Updated subscription
   */
  async updateSubscriptionCancellation(subscriptionId, cancellationData, immediate = false) {
    try {
      if (!subscriptionId) {
        throw new Error('Subscription ID is required');
      }

      const updateData = {
        updated_at: new Date(),
        metadata: cancellationData.metadata || {}
      };

      if (immediate) {
        updateData.status = 'canceled';
        updateData.canceled_at = new Date();
      } else {
        updateData.cancel_at_period_end = true;
        if (cancellationData.cancelAt) {
          updateData.cancel_at = new Date(cancellationData.cancelAt * 1000);
        }
      }

      await this.knex('user_subscriptions').where('id', subscriptionId).update(updateData);

      logger.info('Subscription cancellation updated successfully', {
        subscriptionId,
        immediate,
        status: updateData.status,
        cancelAt: updateData.cancel_at
      });

      return { success: true, updateData };
    } catch (error) {
      logger.error('Error updating subscription cancellation', {
        error: error.message,
        subscriptionId,
        immediate,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Check for other active subscriptions for a user
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
        .where('seller_id', userId)
        .whereIn('status', ['active', 'trialing']);

      if (excludeSubscriptionId) {
        query.whereNot('id', excludeSubscriptionId);
      }

      const subscriptions = await query;

      logger.debug('Retrieved user other active subscriptions', {
        userId,
        excludeSubscriptionId,
        count: subscriptions.length
      });

      return subscriptions;
    } catch (error) {
      logger.error('Error getting user other active subscriptions', {
        error: error.message,
        userId,
        excludeSubscriptionId,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Update subscription plan
   * @param {number} subscriptionId - Subscription ID
   * @param {Object} planData - New plan data
   * @returns {Promise<Object>} Updated subscription
   */
  async updateSubscriptionPlan(subscriptionId, planData) {
    try {
      if (!subscriptionId || !planData) {
        throw new Error('Subscription ID and plan data are required');
      }

      const updateData = {
        subscription_plan_id: planData.planId,
        plan_name: planData.planName,
        plan_display_name: planData.planDisplayName,
        updated_at: new Date()
      };

      await this.knex('user_subscriptions').where('id', subscriptionId).update(updateData);

      logger.info('Subscription plan updated successfully', {
        subscriptionId,
        newPlanId: planData.planId,
        newPlanName: planData.planName
      });

      return { success: true, updateData };
    } catch (error) {
      logger.error('Error updating subscription plan', {
        error: error.message,
        subscriptionId,
        planData,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Create manual payment request
   * @param {Object} paymentRequestData - Manual payment request data
   * @returns {Promise<Object>} Created payment request
   */
  async createManualPaymentRequest(paymentRequestData) {
    try {
      this._validateManualPaymentRequestData(paymentRequestData);

      const requestData = {
        ...paymentRequestData,
        created_at: new Date(),
        updated_at: new Date()
      };

      const [requestId] = await this.knex('manual_payment_requests').insert(requestData).returning('id');

      const result = { id: requestId, ...requestData };

      logger.info('Manual payment request created successfully', {
        requestId,
        userId: paymentRequestData.user_id,
        planName: paymentRequestData.plan_name
      });

      return result;
    } catch (error) {
      logger.error('Error creating manual payment request', {
        error: error.message,
        paymentRequestData: {
          ...paymentRequestData,
          // Redact sensitive data
          phone: 'redacted',
          email: 'redacted'
        },
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Update seller account type and company association
   * @param {number} userId - User ID
   * @param {string} accountType - New account type ('individual' | 'company')
   * @param {number|null} companyId - Company ID (null for individual accounts)
   * @returns {Promise<Object>} Update result
   */
  async updateSellerAccountType(userId, accountType, companyId = null) {
    const trx = await this.knex.transaction();

    try {
      if (!userId || !accountType) {
        throw new Error('User ID and account type are required');
      }

      const validAccountTypes = ['individual', 'company'];
      if (!validAccountTypes.includes(accountType)) {
        throw new Error(`Invalid account type: ${accountType}. Must be one of: ${validAccountTypes.join(', ')}`);
      }

      // Prepare update data based on account type
      const updateData = {
        account_type: accountType,
        updated_at: new Date()
      };

      if (accountType === 'individual') {
        // For individual accounts, clear company association
        updateData.is_company = false;
        updateData.company_id = null;
      } else if (accountType === 'company') {
        // For company accounts, set company association
        updateData.is_company = true;
        updateData.company_id = companyId;
      }

      // Update seller record
      await trx('sellers').where('id', userId).update(updateData);

      // If switching to individual, cancel any company subscriptions
      if (accountType === 'individual') {
        const companySubscriptions = await trx('user_subscriptions')
          .where('seller_id', userId)
          .where('account_type', 'company')
          .whereIn('status', ['active', 'trialing']);

        if (companySubscriptions.length > 0) {
          await trx('user_subscriptions')
            .where('seller_id', userId)
            .where('account_type', 'company')
            .whereIn('status', ['active', 'trialing'])
            .update({
              status: 'canceled',
              canceled_at: new Date(),
              cancel_at_period_end: true,
              metadata: JSON.stringify({
                cancellation_reason: 'account_type_switch',
                switched_to: 'individual',
                switched_at: new Date().toISOString()
              }),
              updated_at: new Date()
            });

          logger.info('Company subscriptions canceled due to account type switch', {
            userId,
            canceledSubscriptions: companySubscriptions.length,
            newAccountType: accountType
          });
        }
      }

      await trx.commit();

      logger.info('Seller account type updated successfully', {
        userId,
        oldAccountType: 'unknown', // Could be retrieved if needed
        newAccountType: accountType,
        companyId,
        isCompany: accountType === 'company'
      });

      return {
        success: true,
        userId,
        accountType,
        companyId,
        isCompany: accountType === 'company'
      };
    } catch (error) {
      await trx.rollback();
      logger.error('Error updating seller account type', {
        error: error.message,
        userId,
        accountType,
        companyId,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Reactivate subscription (remove cancellation)
   * @param {number} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Update result
   */
  async reactivateSubscription(subscriptionId) {
    try {
      if (!subscriptionId) {
        throw new Error('Subscription ID is required');
      }

      const updateData = {
        cancel_at_period_end: false,
        cancel_at: null,
        canceled_at: null,
        updated_at: new Date(),
        metadata: JSON.stringify({
          reactivated_at: new Date().toISOString(),
          reactivation_reason: 'user_requested'
        })
      };

      await this.knex('user_subscriptions').where('id', subscriptionId).update(updateData);

      logger.info('Subscription reactivated successfully', {
        subscriptionId
      });

      return { success: true, subscriptionId };
    } catch (error) {
      logger.error('Error reactivating subscription', {
        error: error.message,
        subscriptionId,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Update user Stripe customer ID
   * @param {number} userId - User ID
   * @param {string} stripeCustomerId - Stripe customer ID
   * @returns {Promise<boolean>} Success status
   */
  async updateUserStripeCustomerId(userId, stripeCustomerId) {
    try {
      if (!userId || !stripeCustomerId) {
        throw new Error('User ID and Stripe customer ID are required');
      }

      await this.knex('sellers').where('id', userId).update({
        stripe_customer_id: stripeCustomerId,
        updated_at: new Date()
      });

      logger.info('User Stripe customer ID updated successfully', {
        userId,
        stripeCustomerId
      });

      return true;
    } catch (error) {
      logger.error('Error updating user Stripe customer ID', {
        error: error.message,
        userId,
        stripeCustomerId,
        stack: error.stack
      });
      throw error;
    }
  }

  // ============================================================================
  // DELEGATION METHODS - Forward calls to new specialized services
  // ============================================================================

  /**
   * Create or update subscription (delegated to SubscriptionCoreService)
   * @deprecated Use SubscriptionServiceFactory.createOrUpdateSubscription() instead
   */
  async createOrUpdateSubscription(subscriptionData) {
    logger.warn('createOrUpdateSubscription called on deprecated SubscriptionDatabase', {
      method: 'createOrUpdateSubscription',
      recommendation: 'Use SubscriptionServiceFactory.createOrUpdateSubscription()'
    });

    return await this._factory.createOrUpdateSubscription(subscriptionData);
  }

  /**
   * Get subscription by Stripe ID (delegated to SubscriptionCoreService)
   * @deprecated Use SubscriptionServiceFactory.getCoreService().getSubscriptionByStripeId() instead
   */
  async getSubscriptionByStripeId(stripeSubscriptionId) {
    logger.warn('getSubscriptionByStripeId called on deprecated SubscriptionDatabase', {
      method: 'getSubscriptionByStripeId',
      recommendation: 'Use SubscriptionServiceFactory.getCoreService().getSubscriptionByStripeId()'
    });

    return await this._factory.getCoreService().getSubscriptionByStripeId(stripeSubscriptionId);
  }

  /**
   * Get user active subscription (delegated to SubscriptionCoreService)
   * @deprecated Use SubscriptionServiceFactory.getCoreService().getUserActiveSubscription() instead
   */
  async getUserActiveSubscription(userId) {
    logger.warn('getUserActiveSubscription called on deprecated SubscriptionDatabase', {
      method: 'getUserActiveSubscription',
      recommendation: 'Use SubscriptionServiceFactory.getCoreService().getUserActiveSubscription()'
    });

    return await this._factory.getCoreService().getUserActiveSubscription(userId);
  }

  /**
   * Update subscription status (delegated to SubscriptionCoreService)
   * @deprecated Use SubscriptionServiceFactory.getCoreService().updateSubscriptionStatus() instead
   */
  async updateSubscriptionStatus(stripeSubscriptionId, status, additionalData = {}) {
    logger.warn('updateSubscriptionStatus called on deprecated SubscriptionDatabase', {
      method: 'updateSubscriptionStatus',
      recommendation: 'Use SubscriptionServiceFactory.getCoreService().updateSubscriptionStatus()'
    });

    return await this._factory.getCoreService().updateSubscriptionStatus(stripeSubscriptionId, status, additionalData);
  }

  /**
   * Record payment (delegated to SubscriptionPaymentService)
   * @deprecated Use SubscriptionServiceFactory.getPaymentService().recordPayment() instead
   */
  async recordPayment(paymentData) {
    logger.warn('recordPayment called on deprecated SubscriptionDatabase', {
      method: 'recordPayment',
      recommendation: 'Use SubscriptionServiceFactory.getPaymentService().recordPayment()'
    });

    return await this._factory.getPaymentService().recordPayment(paymentData);
  }

  /**
   * Update user premium status (delegated to UserAccountManagementService)
   * @deprecated Use SubscriptionServiceFactory.getUserAccountService().updateUserPremiumStatus() instead
   */
  async updateUserPremiumStatus(userId, isPremium) {
    logger.warn('updateUserPremiumStatus called on deprecated SubscriptionDatabase', {
      method: 'updateUserPremiumStatus',
      recommendation: 'Use SubscriptionServiceFactory.getUserAccountService().updateUserPremiumStatus()'
    });

    return await this._factory.getUserAccountService().updateUserPremiumStatus(userId, isPremium);
  }

  /**
   * Get subscription plans (delegated to SubscriptionCoreService)
   * @deprecated Use SubscriptionServiceFactory.getCoreService().getSubscriptionPlans() instead
   */
  async getSubscriptionPlans() {
    logger.warn('getSubscriptionPlans called on deprecated SubscriptionDatabase', {
      method: 'getSubscriptionPlans',
      recommendation: 'Use SubscriptionServiceFactory.getCoreService().getSubscriptionPlans()'
    });

    return await this._factory.getCoreService().getSubscriptionPlans();
  }

  /**
   * Update subscription cancellation (delegated to SubscriptionLifecycleService)
   * @deprecated Use SubscriptionServiceFactory.getLifecycleService().updateSubscriptionCancellation() instead
   */
  async updateSubscriptionCancellation(subscriptionId, cancellationData, immediate = false) {
    logger.warn('updateSubscriptionCancellation called on deprecated SubscriptionDatabase', {
      method: 'updateSubscriptionCancellation',
      recommendation: 'Use SubscriptionServiceFactory.getLifecycleService().updateSubscriptionCancellation()'
    });

    return await this._factory
      .getLifecycleService()
      .updateSubscriptionCancellation(subscriptionId, cancellationData, immediate);
  }

  /**
   * Get user other active subscriptions (delegated to SubscriptionCoreService)
   * @deprecated Use SubscriptionServiceFactory.getCoreService().getUserOtherActiveSubscriptions() instead
   */
  async getUserOtherActiveSubscriptions(userId, excludeSubscriptionId) {
    logger.warn('getUserOtherActiveSubscriptions called on deprecated SubscriptionDatabase', {
      method: 'getUserOtherActiveSubscriptions',
      recommendation: 'Use SubscriptionServiceFactory.getCoreService().getUserOtherActiveSubscriptions()'
    });

    return await this._factory.getCoreService().getUserOtherActiveSubscriptions(userId, excludeSubscriptionId);
  }

  /**
   * Update subscription plan (delegated to SubscriptionLifecycleService)
   * @deprecated Use SubscriptionServiceFactory.getLifecycleService().updateSubscriptionPlan() instead
   */
  async updateSubscriptionPlan(subscriptionId, planData) {
    logger.warn('updateSubscriptionPlan called on deprecated SubscriptionDatabase', {
      method: 'updateSubscriptionPlan',
      recommendation: 'Use SubscriptionServiceFactory.getLifecycleService().updateSubscriptionPlan()'
    });

    return await this._factory.getLifecycleService().updateSubscriptionPlan(subscriptionId, planData);
  }

  /**
   * Create manual payment request (delegated to SubscriptionPaymentService)
   * @deprecated Use SubscriptionServiceFactory.getPaymentService().createManualPaymentRequest() instead
   */
  async createManualPaymentRequest(paymentRequestData) {
    logger.warn('createManualPaymentRequest called on deprecated SubscriptionDatabase', {
      method: 'createManualPaymentRequest',
      recommendation: 'Use SubscriptionServiceFactory.getPaymentService().createManualPaymentRequest()'
    });

    return await this._factory.getPaymentService().createManualPaymentRequest(paymentRequestData);
  }

  /**
   * Update seller account type (delegated to UserAccountManagementService)
   * @deprecated Use SubscriptionServiceFactory.switchUserAccountType() instead
   */
  async updateSellerAccountType(userId, accountType, companyId = null) {
    logger.warn('updateSellerAccountType called on deprecated SubscriptionDatabase', {
      method: 'updateSellerAccountType',
      recommendation: 'Use SubscriptionServiceFactory.switchUserAccountType()'
    });

    return await this._factory.switchUserAccountType(userId, accountType, companyId);
  }

  /**
   * Reactivate subscription (delegated to SubscriptionLifecycleService)
   * @deprecated Use SubscriptionServiceFactory.getLifecycleService().reactivateSubscription() instead
   */
  async reactivateSubscription(subscriptionId) {
    logger.warn('reactivateSubscription called on deprecated SubscriptionDatabase', {
      method: 'reactivateSubscription',
      recommendation: 'Use SubscriptionServiceFactory.getLifecycleService().reactivateSubscription()'
    });

    return await this._factory.getLifecycleService().reactivateSubscription(subscriptionId);
  }

  /**
   * Update user Stripe customer ID (delegated to UserAccountManagementService)
   * @deprecated Use SubscriptionServiceFactory.getUserAccountService().updateUserStripeCustomerId() instead
   */
  async updateUserStripeCustomerId(userId, stripeCustomerId) {
    logger.warn('updateUserStripeCustomerId called on deprecated SubscriptionDatabase', {
      method: 'updateUserStripeCustomerId',
      recommendation: 'Use SubscriptionServiceFactory.getUserAccountService().updateUserStripeCustomerId()'
    });

    return await this._factory.getUserAccountService().updateUserStripeCustomerId(userId, stripeCustomerId);
  }

  // ============================================================================
  // DEPRECATED METHODS - Not implemented in new architecture
  // ============================================================================

  /**
   * @deprecated This method is not implemented in the new modular architecture
   */
  async updatePaymentWithCharge(stripePaymentIntentId, chargeData) {
    logger.error('updatePaymentWithCharge called on deprecated SubscriptionDatabase - method not implemented', {
      method: 'updatePaymentWithCharge',
      recommendation: 'Use SubscriptionServiceFactory.getPaymentService().updatePaymentWithCharge()'
    });

    return await this._factory.getPaymentService().updatePaymentWithCharge(stripePaymentIntentId, chargeData);
  }

  /**
   * @deprecated This method is not implemented in the new modular architecture
   */
  async getSubscriptionPaymentHistory(stripeSubscriptionId, limit = 50) {
    logger.error('getSubscriptionPaymentHistory called on deprecated SubscriptionDatabase - method not implemented', {
      method: 'getSubscriptionPaymentHistory',
      recommendation: 'Use SubscriptionServiceFactory.getPaymentService().getSubscriptionPaymentHistory()'
    });

    return await this._factory.getPaymentService().getSubscriptionPaymentHistory(stripeSubscriptionId, limit);
  }

  /**
   * @deprecated This method is not implemented in the new modular architecture
   */
  async subscriptionExists(stripeSubscriptionId) {
    logger.error('subscriptionExists called on deprecated SubscriptionDatabase - method not implemented', {
      method: 'subscriptionExists',
      recommendation: 'Use SubscriptionServiceFactory.getCoreService().getSubscriptionByStripeId() and check for null'
    });

    const subscription = await this._factory.getCoreService().getSubscriptionByStripeId(stripeSubscriptionId);
    return !!subscription;
  }

  /**
   * Validate subscription data
   * @param {Object} subscriptionData - Subscription data to validate
   * @private
   */ _validateSubscriptionData(subscriptionData) {
    const required = ['stripe_subscription_id', 'stripe_customer_id', 'status'];

    for (const field of required) {
      if (!subscriptionData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    } // Check for seller_id requirement (database constraint)
    if (!subscriptionData.seller_id) {
      logger.error('Missing seller_id for subscription creation', {
        stripe_subscription_id: subscriptionData.stripe_subscription_id,
        stripe_customer_id: subscriptionData.stripe_customer_id,
        metadata: subscriptionData.metadata
      });
      throw new Error(
        'seller_id is required for subscription creation. Cannot create subscription without linking to a user.'
      );
    }

    // Validate status
    const validStatuses = ['active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid'];
    if (!validStatuses.includes(subscriptionData.status)) {
      throw new Error(`Invalid subscription status: ${subscriptionData.status}`);
    }

    // Validate date fields if provided
    if (subscriptionData.current_period_start !== undefined) {
      if (
        subscriptionData.current_period_start !== null &&
        (!(subscriptionData.current_period_start instanceof Date) ||
          isNaN(subscriptionData.current_period_start.getTime()))
      ) {
        logger.warn('Invalid current_period_start provided, will be excluded', {
          value: subscriptionData.current_period_start,
          type: typeof subscriptionData.current_period_start
        });
      }
    }

    if (subscriptionData.current_period_end !== undefined) {
      if (
        subscriptionData.current_period_end !== null &&
        (!(subscriptionData.current_period_end instanceof Date) || isNaN(subscriptionData.current_period_end.getTime()))
      ) {
        logger.warn('Invalid current_period_end provided, will be excluded', {
          value: subscriptionData.current_period_end,
          type: typeof subscriptionData.current_period_end
        });
      }
    }
  }

  /**
   * Validate payment data
   * @param {Object} paymentData - Payment data to validate
   * @private
   */
  _validatePaymentData(paymentData) {
    const required = ['amount', 'currency', 'status'];

    for (const field of required) {
      if (paymentData[field] === undefined || paymentData[field] === null) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate that either subscription_id or payment_intent_id is provided
    if (!paymentData.stripe_subscription_id && !paymentData.stripe_payment_intent_id) {
      throw new Error('Either stripe_subscription_id or stripe_payment_intent_id is required');
    }

    // Validate amount
    if (typeof paymentData.amount !== 'number' || paymentData.amount < 0) {
      throw new Error('Amount must be a positive number');
    }

    // Validate status
    const validStatuses = ['succeeded', 'failed', 'pending', 'canceled'];
    if (!validStatuses.includes(paymentData.status)) {
      throw new Error(`Invalid payment status: ${paymentData.status}`);
    }
  }

  /**
   * Update user premium status
   * @param {string} userId - User ID
   * @param {boolean} isPremium - Premium status
   * @private
   */
  async _updateUserPremiumStatus(userId, isPremium) {
    try {
      if (!userId) {
        return;
      }

      await this.knex('sellers').where('id', userId).update({
        is_premium: isPremium,
        updated_at: new Date()
      });

      logger.info('User premium status updated', {
        userId,
        isPremium
      });
    } catch (error) {
      logger.warn('Failed to update user premium status', {
        error: error.message,
        userId,
        isPremium
      });
      // Don't throw error for premium status update failure
    }
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

  /**
   * Validate manual payment request data
   * @param {Object} requestData - Request data to validate
   * @private
   */
  _validateManualPaymentRequestData(requestData) {
    const required = [
      'user_id',
      'full_name',
      'phone',
      'email',
      'payment_method',
      'preferred_contact',
      'plan_name',
      'plan_price',
      'currency'
    ];

    for (const field of required) {
      if (!requestData[field]) {
        throw new Error(`${field} is required for manual payment request`);
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(requestData.email)) {
      throw new Error('Invalid email format');
    }

    // Validate price
    if (typeof requestData.plan_price !== 'number' || requestData.plan_price <= 0) {
      throw new Error('Plan price must be a positive number');
    }
  }
}

module.exports = { SubscriptionDatabase };
