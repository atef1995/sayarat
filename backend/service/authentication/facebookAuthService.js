const logger = require('../../utils/logger');
const { getSellerById } = require('../../dbQueries/sellers');

/**
 * Facebook Authentication Service
 * Handles Facebook OAuth integration and user management
 */
class FacebookAuthService {
  constructor(knex, userRegistrationService = null, reqIdGenerator = null) {
    this.knex = knex;
    this.userRegistrationService = userRegistrationService;
    this.reqIdGenerator = reqIdGenerator;
  }

  /**
   * Find user by Facebook ID
   * @param {string} facebookId 
   * @returns {Promise<object|null>}
   */
  async findUserByFacebookId(facebookId) {
    try {
      const user = await this.knex('sellers')
        .select(
          'id',
          'username',
          'email',
          'first_name',
          'facebook_id',
          'auth_provider',
          'facebook_picture_url',
          'facebook_profile_data',
          'facebook_linked_at',
          'email_verified',
          'is_company',
          'company_id',
          'is_premium',
          'is_admin',
          'account_type',
          'picture',
          'created_at',
          'last_login'
        )
        .where('facebook_id', facebookId)
        .first();

      return user || null;
    } catch (error) {
      logger.error('Error finding user by Facebook ID:', {
        facebookId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Find user by email address
   * @param {string} email 
   * @returns {Promise<object|null>}
   */
  async findUserByEmail(email) {
    try {
      const user = await this.knex('sellers')
        .select('*')
        .where('email', email)
        .first();

      return user || null;
    } catch (error) {
      logger.error('Error finding user by email:', {
        email,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Create new user from Facebook profile
   * @param {object} facebookProfile 
   * @returns {Promise<object>}
   */
  async createUserFromFacebookProfile(facebookProfile) {
    const trx = await this.knex.transaction();

    try {
      const userData = this._extractUserDataFromFacebookProfile(facebookProfile);

      // Use the existing user registration service if available
      if (this.userRegistrationService) {
        // #TODO: Adapt the existing registration service to handle Facebook data
        // For now, we'll create the user directly
      }

      const [newUser] = await trx('sellers')
        .insert({
          username: userData.username,
          email: userData.email,
          first_name: userData.firstName,
          facebook_id: userData.facebookId,
          auth_provider: 'facebook',
          facebook_picture_url: userData.profilePictureUrl,
          facebook_profile_data: JSON.stringify(userData.facebookProfileData),
          facebook_linked_at: trx.fn.now(),
          email_verified: true, // Facebook emails are considered verified
          created_at: trx.fn.now(),
          last_login: trx.fn.now()
        })
        .returning('*');

      await trx.commit();

      logger.info('New user created from Facebook profile:', {
        userId: newUser.id,
        email: newUser.email,
        facebookId: newUser.facebook_id
      });

      return this._formatUserObject(newUser);
    } catch (error) {
      await trx.rollback();
      logger.error('Error creating user from Facebook profile:', {
        facebookId: facebookProfile.id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Link Facebook account to existing user
   * @param {number} userId 
   * @param {object} facebookProfile 
   * @returns {Promise<object>}
   */
  async linkFacebookToExistingUser(userId, facebookProfile) {
    try {
      const userData = this._extractUserDataFromFacebookProfile(facebookProfile);

      await this.knex('sellers')
        .where('id', userId)
        .update({
          facebook_id: userData.facebookId,
          facebook_picture_url: userData.profilePictureUrl,
          facebook_profile_data: JSON.stringify(userData.facebookProfileData),
          facebook_linked_at: this.knex.fn.now(),
          // Update auth provider to indicate multiple auth methods
          auth_provider: 'local,facebook'
        });

      logger.info('Facebook account linked to existing user:', {
        userId,
        facebookId: userData.facebookId
      });

      // Return updated user
      const updatedUser = await getSellerById(this.knex, userId);
      return this._formatUserObject(updatedUser);
    } catch (error) {
      logger.error('Error linking Facebook to existing user:', {
        userId,
        facebookId: facebookProfile.id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Handle Facebook authentication flow
   * @param {object} facebookProfile 
   * @param {object} _accessToken 
   * @returns {Promise<object>}
   */
  async handleFacebookAuth(facebookProfile, _accessToken) {
    try {
      // First, try to find user by Facebook ID
      let user = await this.findUserByFacebookId(facebookProfile.id);

      if (user) {
        // User exists with Facebook ID, update last login
        await this._updateLastLogin(user.id);
        return {
          success: true,
          user: this._formatUserObject(user),
          isNewUser: false
        };
      }

      // Try to find user by email
      const emailUser = await this.findUserByEmail(facebookProfile.emails[0].value);

      if (emailUser) {
        // User exists with email but no Facebook ID - link accounts
        user = await this.linkFacebookToExistingUser(emailUser.id, facebookProfile);
        return {
          success: true,
          user,
          isNewUser: false,
          accountLinked: true
        };
      }

      // Create new user
      user = await this.createUserFromFacebookProfile(facebookProfile);
      return {
        success: true,
        user,
        isNewUser: true
      };

    } catch (error) {
      logger.error('Error handling Facebook authentication:', {
        facebookId: facebookProfile.id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Extract user data from Facebook profile
   * @private
   */
  _extractUserDataFromFacebookProfile(facebookProfile) {
    const email = facebookProfile.emails && facebookProfile.emails[0]
      ? facebookProfile.emails[0].value
      : null;

    if (!email) {
      throw new Error('Facebook profile must include email address');
    }

    // Generate username from email or name
    const baseUsername = email.split('@')[0] || facebookProfile.displayName?.replace(/\s+/g, '_').toLowerCase();
    const username = `${baseUsername}_${Date.now()}`;

    return {
      facebookId: facebookProfile.id,
      email,
      firstName: facebookProfile.name?.givenName || facebookProfile.displayName || 'User',
      username,
      profilePictureUrl: facebookProfile.photos && facebookProfile.photos[0]
        ? facebookProfile.photos[0].value
        : null,
      facebookProfileData: {
        displayName: facebookProfile.displayName,
        name: facebookProfile.name,
        gender: facebookProfile.gender,
        profileUrl: facebookProfile.profileUrl,
        locale: facebookProfile._json?.locale
      }
    };
  }

  /**
   * Update user's last login timestamp
   * @private
   */
  async _updateLastLogin(userId) {
    try {
      await this.knex('sellers')
        .where('id', userId)
        .update({
          last_login: this.knex.fn.now()
        });

      logger.info('Updated last_login for Facebook user:', { userId });
    } catch (error) {
      logger.error('Failed to update last_login for Facebook user:', {
        userId,
        error: error.message
      });
      // Don't throw - this shouldn't fail the authentication
    }
  }

  /**
   * Format user object for consistency with local auth
   * @private
   */
  _formatUserObject(seller) {
    return {
      id: seller.id,
      username: seller.username,
      email: seller.email,
      firstName: seller.first_name,
      email_verified: seller.email_verified,
      lastLogin: seller.last_login ? new Date(seller.last_login) : null,
      isCompany: seller.is_company,
      isAdmin: seller.is_admin || false,
      companyId: seller.company_id,
      isPremium: seller.is_premium,
      accountType: seller.account_type,
      picture: seller.picture || seller.facebook_picture_url,
      authProvider: seller.auth_provider,
      facebookId: seller.facebook_id,
      createdAt: seller.created_at ? new Date(seller.created_at) : null,
      facebookLinkedAt: seller.facebook_linked_at ? new Date(seller.facebook_linked_at) : null
    };
  }
}

module.exports = FacebookAuthService;
