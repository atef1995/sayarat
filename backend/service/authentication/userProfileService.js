const logger = require('../../utils/logger');

/**
 * User profile service handling profile operations
 */
class UserProfileService {
  constructor(knex, userCache) {
    this.knex = knex;
    this.userCache = userCache;
  }

  /**
   * Get user profile with caching
   * @param {number} userId
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  async getUserProfile(userId) {
    try {
      logger.info('Fetching profile for user:', { userId });

      // Check cache first
      const cachedUser = await this.userCache.get(userId);
      if (cachedUser) {
        logger.info('Returning cached user details:', { userId });
        return {
          success: true,
          user: cachedUser
        };
      }

      // Fetch from database
      const userDetails = await this._fetchUserFromDatabase(userId);

      if (!userDetails) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const formattedUser = this._formatUserData(userDetails);

      // Cache the user data
      await this.userCache.set(userId, formattedUser);

      return {
        success: true,
        user: formattedUser
      };
    } catch (error) {
      logger.error('Profile fetch error:', {
        error: error.message,
        stack: error.stack
      });
      return {
        success: false,
        error: 'Failed to fetch profile'
      };
    }
  }

  /**
   * Check authentication status and return user data
   * @param {number} userId
   * @returns {Promise<{success: boolean, user?: object, error?: string}>}
   */
  async getAuthenticatedUser(userId) {
    try {
      // Check cache first
      let user = await this.userCache.get(userId);

      if (!user) {
        // Fetch from database if not cached
        const row = await this._fetchUserFromDatabase(userId, [
          'id',
          'username',
          'email',
          'first_name',
          'last_name',
          'phone',
          'picture',
          'last_login',
          'account_type',
          'company_id'
        ]);

        if (!row) {
          return {
            success: false,
            error: 'User not found'
          };
        }

        user = this._formatUserData(row);
        await this.userCache.set(userId, user);
      }

      return {
        success: true,
        user
      };
    } catch (error) {
      logger.error('Auth check error:', {
        error: error.message,
        stack: error.stack
      });
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  /**
   * Fetch user data from database
   * @private
   */ async _fetchUserFromDatabase(userId, columns = null) {
    const defaultColumns = [
      'id',
      'username',
      'email',
      'first_name',
      'last_name',
      'phone',
      'date_of_birth',
      'created_at',
      'last_login',
      'picture',
      'account_type',
      'company_id'
    ];

    return await this.knex('sellers')
      .select(columns || defaultColumns)
      .where('id', userId)
      .first();
  }
  /**
   * Format user data for API response
   * @private
   */ _formatUserData(userDetails) {
    // Handle null/undefined account_type
    const accountType = userDetails.account_type || 'personal';
    const isCompany = accountType === 'company' || !!userDetails.company_id;

    return {
      id: userDetails.id,
      username: userDetails.username,
      email: userDetails.email,
      firstName: userDetails.first_name,
      lastName: userDetails.last_name,
      phone: userDetails.phone,
      dateOfBirth: userDetails.date_of_birth,
      createdAt: userDetails.created_at,
      lastLogin: userDetails.last_login,
      lastActive: userDetails.last_active,
      picture: userDetails.picture,
      accountType: accountType,
      companyId: userDetails.company_id,
      isCompany: isCompany
    };
  }
}

module.exports = UserProfileService;
