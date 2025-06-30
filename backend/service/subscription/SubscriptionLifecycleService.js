const logger = require('../../utils/logger');

/**
 * Subscription Lifecycle Service
 *
 * ARCHITECTURE PRINCIPLES:
 * ========================
 *
 * 1. SINGLE RESPONSIBILITY: Handles subscription lifecycle operations
 * 2. DEPENDENCY INJECTION: Receives Knex instance for testability
 * 3. BUSINESS LOGIC LAYER: Subscription state transitions and lifecycle
 * 4. ERROR BOUNDARIES: Comprehensive error handling and logging
 * 5. TRANSACTION SUPPORT: Ensures data consistency for complex operations
 *
 * RESPONSIBILITIES:
 * =================
 * - Subscription cancellation (immediate and at period end)
 * - Subscription reactivation
 * - Subscription plan changes
 * - Subscription status transitions
 * - Lifecycle audit logging
 *
 * #TODO: Add subscription transfer between users
 * #TODO: Implement subscription pause/resume functionality
 * #TODO: Add subscription downgrade/upgrade workflows
 */
class SubscriptionLifecycleService {
  constructor(knex) {
    if (!knex) {
      throw new Error('Knex instance is required for SubscriptionLifecycleService');
    }
    this.knex = knex;
  }

  /**
   * Update subscription with cancellation data
   * @param {number} subscriptionId - Subscription ID
   * @param {Object} cancellationData - Cancellation data
   * @param {boolean} immediate - Whether cancellation is immediate
   * @returns {Promise<Object>} Updated subscription
   */
  async updateSubscriptionCancellation(subscriptionId, cancellationData, immediate = false) {
    const trx = await this.knex.transaction();

    try {
      if (!subscriptionId) {
        throw new Error('Subscription ID is required');
      }

      // Get current subscription
      const currentSubscription = await trx('user_subscriptions').where('id', subscriptionId).first();

      if (!currentSubscription) {
        throw new Error('Subscription not found');
      }

      const updateData = {
        updated_at: new Date(),
        metadata: JSON.stringify({
          ...this._parseMetadata(currentSubscription.metadata),
          ...cancellationData.metadata,
          cancellation_processed_at: new Date().toISOString()
        })
      };

      if (immediate) {
        updateData.status = 'canceled';
        updateData.canceled_at = new Date();
        updateData.cancel_at_period_end = false;
      } else {
        updateData.cancel_at_period_end = true;
        if (cancellationData.cancelAt) {
          updateData.cancel_at = new Date(cancellationData.cancelAt * 1000);
        }
      }

      // Update subscription
      await trx('user_subscriptions').where('id', subscriptionId).update(updateData);

      // Log the cancellation action
      await this._logLifecycleAction(trx, {
        subscription_id: subscriptionId,
        user_id: currentSubscription.seller_id,
        company_id: currentSubscription.company_id,
        action: immediate ? 'immediate_cancellation' : 'scheduled_cancellation',
        old_status: currentSubscription.status,
        new_status: immediate ? 'canceled' : currentSubscription.status,
        metadata: cancellationData.metadata || {}
      });

      await trx.commit();

      logger.info('SubscriptionLifecycleService - Subscription cancellation updated successfully', {
        subscriptionId,
        immediate,
        status: updateData.status,
        cancelAt: updateData.cancel_at,
        userId: currentSubscription.seller_id
      });

      return {
        success: true,
        updateData,
        subscription: {
          ...currentSubscription,
          ...updateData
        }
      };
    } catch (error) {
      await trx.rollback();
      logger.error('SubscriptionLifecycleService - Error updating subscription cancellation', {
        error: error.message,
        subscriptionId,
        immediate,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Reactivate subscription (remove cancellation)
   * @param {number} subscriptionId - Subscription ID
   * @param {Object} [reactivationData] - Additional reactivation data
   * @returns {Promise<Object>} Update result
   */
  async reactivateSubscription(subscriptionId, reactivationData = {}) {
    const trx = await this.knex.transaction();

    try {
      if (!subscriptionId) {
        throw new Error('Subscription ID is required');
      }

      // Get current subscription
      const currentSubscription = await trx('user_subscriptions').where('id', subscriptionId).first();

      if (!currentSubscription) {
        throw new Error('Subscription not found');
      }

      const currentMetadata = this._parseMetadata(currentSubscription.metadata);
      const reactivationCount = (currentMetadata.reactivation_count || 0) + 1;

      const updateData = {
        cancel_at_period_end: false,
        cancel_at: null,
        canceled_at: null,
        updated_at: new Date(),
        metadata: JSON.stringify({
          ...currentMetadata,
          reactivated_at: new Date().toISOString(),
          reactivation_reason: reactivationData.reason || 'user_requested',
          reactivation_count: reactivationCount,
          ...reactivationData.metadata
        })
      };

      // If subscription was canceled, reactivate it
      if (currentSubscription.status === 'canceled') {
        updateData.status = 'active';
      }

      await trx('user_subscriptions').where('id', subscriptionId).update(updateData);

      // Log the reactivation action
      await this._logLifecycleAction(trx, {
        subscription_id: subscriptionId,
        user_id: currentSubscription.seller_id,
        company_id: currentSubscription.company_id,
        action: 'reactivation',
        old_status: currentSubscription.status,
        new_status: updateData.status || currentSubscription.status,
        metadata: {
          reactivation_count: reactivationCount,
          reason: reactivationData.reason || 'user_requested'
        }
      });

      await trx.commit();

      logger.info('SubscriptionLifecycleService - Subscription reactivated successfully', {
        subscriptionId,
        reactivationCount,
        userId: currentSubscription.seller_id
      });

      return {
        success: true,
        subscriptionId,
        reactivationCount,
        metadata: updateData.metadata
      };
    } catch (error) {
      await trx.rollback();
      logger.error('SubscriptionLifecycleService - Error reactivating subscription', {
        error: error.message,
        subscriptionId,
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
    const trx = await this.knex.transaction();

    try {
      if (!subscriptionId || !planData) {
        throw new Error('Subscription ID and plan data are required');
      }

      // Get current subscription
      const currentSubscription = await trx('user_subscriptions').where('id', subscriptionId).first();

      if (!currentSubscription) {
        throw new Error('Subscription not found');
      }

      const updateData = {
        subscription_plan_id: planData.planId,
        plan_name: planData.planName,
        plan_display_name: planData.planDisplayName,
        updated_at: new Date(),
        metadata: JSON.stringify({
          ...this._parseMetadata(currentSubscription.metadata),
          plan_changed_at: new Date().toISOString(),
          previous_plan_id: currentSubscription.subscription_plan_id,
          previous_plan_name: currentSubscription.plan_name
        })
      };

      await trx('user_subscriptions').where('id', subscriptionId).update(updateData);

      // Log the plan change action
      await this._logLifecycleAction(trx, {
        subscription_id: subscriptionId,
        user_id: currentSubscription.seller_id,
        company_id: currentSubscription.company_id,
        action: 'plan_change',
        old_plan_id: currentSubscription.subscription_plan_id,
        new_plan_id: planData.planId,
        metadata: {
          old_plan_name: currentSubscription.plan_name,
          new_plan_name: planData.planName
        }
      });

      await trx.commit();

      logger.info('SubscriptionLifecycleService - Subscription plan updated successfully', {
        subscriptionId,
        oldPlanId: currentSubscription.subscription_plan_id,
        newPlanId: planData.planId,
        newPlanName: planData.planName,
        userId: currentSubscription.seller_id
      });

      return {
        success: true,
        updateData,
        subscription: {
          ...currentSubscription,
          ...updateData
        }
      };
    } catch (error) {
      await trx.rollback();
      logger.error('SubscriptionLifecycleService - Error updating subscription plan', {
        error: error.message,
        subscriptionId,
        planData,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Pause subscription (for future implementation)
   * @param {number} subscriptionId - Subscription ID
   * @param {Object} pauseData - Pause configuration
   * @returns {Promise<Object>} Update result
   * #TODO: Implement subscription pause functionality
   */
  async pauseSubscription(subscriptionId, pauseData) {
    throw new Error('pauseSubscription not yet implemented - #TODO');
  }

  /**
   * Resume paused subscription (for future implementation)
   * @param {number} subscriptionId - Subscription ID
   * @param {Object} resumeData - Resume configuration
   * @returns {Promise<Object>} Update result
   * #TODO: Implement subscription resume functionality
   */
  async resumeSubscription(subscriptionId, resumeData) {
    throw new Error('resumeSubscription not yet implemented - #TODO');
  }

  /**
   * Transfer subscription to another user (for future implementation)
   * @param {number} subscriptionId - Subscription ID
   * @param {number} newUserId - New user ID
   * @param {Object} transferData - Transfer configuration
   * @returns {Promise<Object>} Transfer result
   * #TODO: Implement subscription transfer functionality
   */
  async transferSubscription(subscriptionId, newUserId, transferData) {
    throw new Error('transferSubscription not yet implemented - #TODO');
  }

  /**
   * Get subscription lifecycle history
   * @param {number} subscriptionId - Subscription ID
   * @returns {Promise<Array>} Lifecycle history
   */
  async getSubscriptionLifecycleHistory(subscriptionId) {
    try {
      if (!subscriptionId) {
        throw new Error('Subscription ID is required');
      }

      const history = await this.knex('subscription_audit_log')
        .where('subscription_id', subscriptionId)
        .orderBy('created_at', 'desc');

      // Parse metadata for each entry
      const historyWithParsedMetadata = history.map(entry => ({
        ...entry,
        metadata: this._parseMetadata(entry.metadata)
      }));

      logger.debug('SubscriptionLifecycleService - Retrieved subscription lifecycle history', {
        subscriptionId,
        entryCount: history.length
      });

      return historyWithParsedMetadata;
    } catch (error) {
      logger.error('SubscriptionLifecycleService - Error getting subscription lifecycle history', {
        error: error.message,
        subscriptionId,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Log subscription lifecycle action
   * @param {Object} trx - Knex transaction
   * @param {Object} actionData - Action data
   * @private
   */
  async _logLifecycleAction(trx, actionData) {
    try {
      await trx('subscription_audit_log').insert({
        subscription_id: actionData.subscription_id,
        user_id: actionData.user_id,
        company_id: actionData.company_id,
        action: actionData.action,
        old_status: actionData.old_status,
        new_status: actionData.new_status,
        old_plan_id: actionData.old_plan_id,
        new_plan_id: actionData.new_plan_id,
        metadata: JSON.stringify(actionData.metadata || {}),
        created_at: new Date(),
        ip_address: actionData.ip_address || null,
        user_agent: actionData.user_agent || null
      });

      logger.debug('SubscriptionLifecycleService - Lifecycle action logged', {
        subscriptionId: actionData.subscription_id,
        action: actionData.action
      });
    } catch (error) {
      logger.error('SubscriptionLifecycleService - Error logging lifecycle action', {
        error: error.message,
        actionData,
        stack: error.stack
      });
      // Don't throw here - logging should not fail the main operation
    }
  }

  /**
   * Parse metadata JSON string safely
   * @param {string} metadataString - JSON string
   * @returns {Object} Parsed metadata object
   * @private
   */
  _parseMetadata(metadataString) {
    try {
      return metadataString ? JSON.parse(metadataString) : {};
    } catch (error) {
      logger.warn('SubscriptionLifecycleService - Failed to parse metadata', {
        error: error.message,
        metadataString
      });
      return {};
    }
  }
}

module.exports = { SubscriptionLifecycleService };
