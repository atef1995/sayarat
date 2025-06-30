/**
 * Account Type Management Service
 *
 * Handles account type detection, validation, and business logic
 * following Single Responsibility and Open/Closed principles
 */

const knex = require('knex')(require('../knexfile').development);
const logger = require('../utils/logger');

/**
 * Account Type Service - Factory pattern for account management
 */
class AccountTypeService {
  /**
   * Account type constants
   * Note: These match the database enum constraint and frontend expectations
   */
  static ACCOUNT_TYPES = {
    INDIVIDUAL: 'individual', // Using 'individual' for consistency with frontend
    COMPANY: 'company'
  };

  /**
   * Determine account type for a user
   * @param {number} userId - User ID
   * @returns {Promise<string>} Account type
   */ static async getUserAccountType(userId) {
    try {
      const seller = await knex('sellers').where({ id: userId }).first();

      if (!seller) {
        logger.warn('AccountTypeService - No seller found, defaulting to individual', { userId });
        return this.ACCOUNT_TYPES.INDIVIDUAL;
      }

      // Check if user has explicit account type
      if (seller.account_type) {
        logger.info('AccountTypeService - Found explicit account_type:', {
          userId,
          accountType: seller.account_type
        });
        return seller.account_type;
      }

      // Fallback: check if user has company association
      if (seller.company_id) {
        logger.info('AccountTypeService - Found company_id, returning company type', {
          userId,
          companyId: seller.company_id
        });
        return this.ACCOUNT_TYPES.COMPANY;
      }

      // Additional fallback: check legacy is_company field
      if (seller.is_company) {
        logger.info('AccountTypeService - Found legacy is_company flag, returning company type', {
          userId
        });
        return this.ACCOUNT_TYPES.COMPANY;
      }

      logger.info('AccountTypeService - No company indicators found, defaulting to individual', {
        userId
      });
      return this.ACCOUNT_TYPES.INDIVIDUAL;
    } catch (error) {
      logger.error('Error determining account type:', { userId, error });
      return this.ACCOUNT_TYPES.INDIVIDUAL; // Safe default
    }
  }
  /**
   * Get company information for a user
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Company data or null
   */
  static async getUserCompany(userId) {
    try {
      const seller = await knex('sellers')
        .leftJoin('companies', 'sellers.company_id', 'companies.id')
        .where('sellers.id', userId)
        .select('companies.*', 'sellers.role as user_role', 'sellers.member_status')
        .first();
      return seller?.company_id ? seller : null;
    } catch (error) {
      logger.error('Error fetching user company:', { userId, error });
      return null;
    }
  }

  /**
   * Get company information for a user (alias for getUserCompany)
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Company data or null
   */
  static async getUserCompanyInfo(userId) {
    try {
      const company = await this.getUserCompany(userId);
      if (!company) {
        return null;
      }

      return {
        id: company.id,
        name: company.name,
        email: company.email,
        description: company.description,
        isVerified: company.is_verified || false,
        userRole: company.user_role,
        memberStatus: company.member_status
      };
    } catch (error) {
      logger.error('Error fetching user company info:', { userId, error });
      return null;
    }
  }

  /**
   * Check if user can manage company subscriptions
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} Can manage subscriptions
   */
  static async canManageCompanySubscription(userId) {
    try {
      const company = await this.getUserCompany(userId);

      if (!company) {
        return false;
      }

      // Only owners and admins can manage subscriptions      return ['owner', 'admin'].includes(company.user_role);
    } catch (error) {
      logger.error('Error checking subscription permissions:', { userId, error });
      return false;
    }
  } /**
   * Switch user account type
   * @param {number} userId - User ID
   * @param {string} newAccountType - New account type
   * @param {string} companyId - Company ID (if switching to company)
   * @returns {Promise<boolean>} Success status
   */
  static async switchAccountType(userId, newAccountType, companyId = null) {
    const trx = await knex.transaction();

    try {
      logger.info('AccountTypeService - switchAccountType:', {
        userId,
        newAccountType,
        companyId
      });

      // Prepare update data based on account type
      const updateData = {
        account_type: newAccountType,
        updated_at: new Date(),
        // Ensure company_id and is_company are set correctly
        company_id: null, // Default to null, will be set based on account type
        is_company: false // Default to false, will be set based on account type
      };

      // Handle company_id based on account type
      if (newAccountType === this.ACCOUNT_TYPES.COMPANY) {
        updateData.company_id = companyId;
        updateData.is_company = true; // Ensure is_company is set for company accounts
      }

      // Update seller account type
      logger.info('AccountTypeService - Updating sellers table:', { userId, updateData });
      await trx('sellers').where({ id: userId }).update(updateData); // Update existing subscriptions
      // Note: user_subscriptions table uses 'seller_id' not 'user_id'
      logger.debug('AccountTypeService - Updating user_subscriptions table:', { userId });
      const subscriptionUpdateData = {
        account_type: newAccountType,
        company_id: newAccountType === this.ACCOUNT_TYPES.COMPANY ? companyId : null,
        updated_at: new Date()
      };

      logger.debug('AccountTypeService - Subscription update data:', subscriptionUpdateData);

      await trx('user_subscriptions')
        .where({ seller_id: userId }) // Important: using seller_id, not user_id
        .update(subscriptionUpdateData);

      await trx.commit();

      logger.info('AccountTypeService - switchAccountType successful:', {
        userId,
        newAccountType,
        companyId
      });

      return true;
    } catch (error) {
      await trx.rollback();
      logger.error('Error switching account type:', {
        userId,
        newAccountType,
        companyId,
        error: {
          message: error.message,
          code: error.code,
          detail: error.detail,
          query: error.sql || 'N/A'
        }
      });
      return false;
    }
  }
}

module.exports = AccountTypeService;
