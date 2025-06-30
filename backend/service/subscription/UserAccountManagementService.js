const logger = require('../../utils/logger');

/**
 * User Account Management Service
 *
 * ARCHITECTURE PRINCIPLES:
 * ========================
 *
 * 1. SINGLE RESPONSIBILITY: Handles user account operations related to subscriptions
 * 2. DEPENDENCY INJECTION: Receives Knex instance for testability
 * 3. DATA ACCESS LAYER: User account database operations
 * 4. ERROR BOUNDARIES: Comprehensive error handling and logging
 * 5. TRANSACTION SUPPORT: Ensures data consistency for account operations
 *
 * RESPONSIBILITIES:
 * =================
 * - Update user premium status
 * - Update user Stripe customer ID
 * - Account type switching (individual ↔ company)
 * - Company association management
 * - User subscription relationship management
 *
 * #TODO: Add user profile management for subscription-related data
 * #TODO: Implement user subscription preferences
 * #TODO: Add user billing information management
 */
class UserAccountManagementService {
  constructor(knex) {
    if (!knex) {
      throw new Error('Knex instance is required for UserAccountManagementService');
    }
    this.knex = knex;
  }

  /**
   * Update user premium status
   * @param {number} userId - User ID
   * @param {boolean} isPremium - Premium status
   * @returns {Promise<boolean>} Success status
   */
  async updateUserPremiumStatus(userId, isPremium) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      await this.knex('sellers').where('id', userId).update({
        is_premium: isPremium,
        updated_at: new Date()
      });

      logger.info('UserAccountManagementService - User premium status updated successfully', {
        userId,
        isPremium
      });

      return true;
    } catch (error) {
      logger.error('UserAccountManagementService - Error updating user premium status', {
        error: error.message,
        userId,
        isPremium,
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

      logger.info('UserAccountManagementService - User Stripe customer ID updated successfully', {
        userId,
        stripeCustomerId
      });

      return true;
    } catch (error) {
      logger.error('UserAccountManagementService - Error updating user Stripe customer ID', {
        error: error.message,
        userId,
        stripeCustomerId,
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

      // Get current user data
      const currentUser = await trx('sellers').where('id', userId).first();

      if (!currentUser) {
        throw new Error('User not found');
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

        // Validate company exists if companyId is provided
        if (companyId) {
          const company = await trx('companies').where('id', companyId).first();
          if (!company) {
            throw new Error('Company not found');
          }
        }
      }

      // Update seller record
      await trx('sellers').where('id', userId).update(updateData);

      // Handle subscription changes based on account type switch
      const subscriptionChanges = await this._handleAccountTypeSubscriptionChanges(
        trx,
        userId,
        currentUser.account_type,
        accountType
      );

      await trx.commit();

      logger.info('UserAccountManagementService - Seller account type updated successfully', {
        userId,
        oldAccountType: currentUser.account_type,
        newAccountType: accountType,
        companyId,
        isCompany: accountType === 'company',
        subscriptionChanges
      });

      return {
        success: true,
        userId,
        oldAccountType: currentUser.account_type,
        newAccountType: accountType,
        companyId,
        isCompany: accountType === 'company',
        subscriptionChanges
      };
    } catch (error) {
      await trx.rollback();
      logger.error('UserAccountManagementService - Error updating seller account type', {
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
   * Associate user with company
   * @param {number} userId - User ID
   * @param {number} companyId - Company ID
   * @param {string} [role='member'] - User role in company
   * @returns {Promise<Object>} Association result
   */
  async associateUserWithCompany(userId, companyId, role = 'member') {
    const trx = await this.knex.transaction();

    try {
      if (!userId || !companyId) {
        throw new Error('User ID and Company ID are required');
      }

      // Validate company exists
      const company = await trx('companies').where('id', companyId).first();
      if (!company) {
        throw new Error('Company not found');
      }

      // Update user to company account type
      await trx('sellers').where('id', userId).update({
        account_type: 'company',
        is_company: true,
        company_id: companyId,
        updated_at: new Date()
      });

      // Add user to company members if not already exists
      const existingMembership = await trx('company_members').where({ user_id: userId, company_id: companyId }).first();

      if (!existingMembership) {
        await trx('company_members').insert({
          user_id: userId,
          company_id: companyId,
          role: role,
          status: 'active',
          joined_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        });
      }

      await trx.commit();

      logger.info('UserAccountManagementService - User associated with company successfully', {
        userId,
        companyId,
        role,
        companyName: company.name
      });

      return {
        success: true,
        userId,
        companyId,
        companyName: company.name,
        role,
        isNewMembership: !existingMembership
      };
    } catch (error) {
      await trx.rollback();
      logger.error('UserAccountManagementService - Error associating user with company', {
        error: error.message,
        userId,
        companyId,
        role,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Remove user from company
   * @param {number} userId - User ID
   * @param {number} companyId - Company ID
   * @returns {Promise<Object>} Removal result
   */
  async removeUserFromCompany(userId, companyId) {
    const trx = await this.knex.transaction();

    try {
      if (!userId || !companyId) {
        throw new Error('User ID and Company ID are required');
      }

      // Update user to individual account type
      await trx('sellers').where('id', userId).update({
        account_type: 'individual',
        is_company: false,
        company_id: null,
        updated_at: new Date()
      });

      // Remove from company members
      await trx('company_members').where({ user_id: userId, company_id: companyId }).update({
        status: 'inactive',
        left_at: new Date(),
        updated_at: new Date()
      });

      // Handle company subscriptions
      const canceledSubscriptions = await this._cancelCompanySubscriptions(trx, userId);

      await trx.commit();

      logger.info('UserAccountManagementService - User removed from company successfully', {
        userId,
        companyId,
        canceledSubscriptions: canceledSubscriptions.length
      });

      return {
        success: true,
        userId,
        companyId,
        canceledSubscriptions: canceledSubscriptions.length
      };
    } catch (error) {
      await trx.rollback();
      logger.error('UserAccountManagementService - Error removing user from company', {
        error: error.message,
        userId,
        companyId,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get user account information including subscription status
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User account information
   */
  async getUserAccountInfo(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const userInfo = await this.knex('sellers')
        .leftJoin('companies', 'sellers.company_id', 'companies.id')
        .leftJoin('company_members', function() {
          this.on('company_members.user_id', '=', 'sellers.id').andOn(
            'company_members.company_id',
            '=',
            'sellers.company_id'
          );
        })
        .select(
          'sellers.*',
          'companies.name as company_name',
          'companies.type as company_type',
          'company_members.role as company_role',
          'company_members.status as membership_status'
        )
        .where('sellers.id', userId)
        .first();

      if (!userInfo) {
        return null;
      }

      // Get active subscriptions
      const activeSubscriptions = await this.knex('user_subscriptions')
        .leftJoin('subscription_plans', 'user_subscriptions.plan_id', 'subscription_plans.stripe_price_id')
        .select(
          'user_subscriptions.*',
          'subscription_plans.name as plan_name',
          'subscription_plans.display_name as plan_display_name'
        )
        .where('user_subscriptions.seller_id', userId)
        .whereIn('user_subscriptions.status', ['active', 'trialing']);

      logger.debug('UserAccountManagementService - Retrieved user account info', {
        userId,
        accountType: userInfo.account_type,
        isCompany: userInfo.is_company,
        activeSubscriptions: activeSubscriptions.length
      });

      return {
        ...userInfo,
        activeSubscriptions
      };
    } catch (error) {
      logger.error('UserAccountManagementService - Error getting user account info', {
        error: error.message,
        userId,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Handle subscription changes when account type switches
   * @param {Object} trx - Knex transaction
   * @param {number} userId - User ID
   * @param {string} oldAccountType - Old account type
   * @param {string} newAccountType - New account type
   * @returns {Promise<Object>} Changes made
   * @private
   */
  async _handleAccountTypeSubscriptionChanges(trx, userId, oldAccountType, newAccountType) {
    const changes = {
      canceledSubscriptions: [],
      updatedSubscriptions: []
    };

    try {
      if (oldAccountType === 'company' && newAccountType === 'individual') {
        // Cancel company subscriptions when switching to individual
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

          changes.canceledSubscriptions = companySubscriptions.map(sub => sub.id);
        }
      }

      // Add more account type switch logic here as needed

      return changes;
    } catch (error) {
      logger.error('UserAccountManagementService - Error handling account type subscription changes', {
        error: error.message,
        userId,
        oldAccountType,
        newAccountType,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Cancel user's company subscriptions
   * @param {Object} trx - Knex transaction
   * @param {number} userId - User ID
   * @returns {Promise<Array>} Canceled subscription IDs
   * @private
   */
  async _cancelCompanySubscriptions(trx, userId) {
    try {
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
              cancellation_reason: 'user_removed_from_company',
              canceled_at: new Date().toISOString()
            }),
            updated_at: new Date()
          });
      }

      return companySubscriptions.map(sub => sub.id);
    } catch (error) {
      logger.error('UserAccountManagementService - Error canceling company subscriptions', {
        error: error.message,
        userId,
        stack: error.stack
      });
      throw error;
    }
  }
}

module.exports = { UserAccountManagementService };
