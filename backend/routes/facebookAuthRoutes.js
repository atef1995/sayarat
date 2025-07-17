const express = require('express');
const passport = require('passport');
const logger = require('../utils/logger');

// Constants for OAuth scopes and redirect routes
const FACEBOOK_SCOPES = ['email', 'public_profile'];
const REDIRECT_ROUTES = {
  AUTH_SUCCESS: '/?facebook_auth=success',
  AUTH_FAILED: '/?facebook_auth=failed',
  LINK_SUCCESS: '/profile?success=facebook_linked',
  LINK_FAILED: '/profile?error=facebook_link_failed',
  LINK_REDIRECT_FAILED: '/profile?error=link_redirect_failed'
};

/**
 * Facebook authentication routes
 * Handles OAuth flow, account linking, and GDPR compliance
 */
class FacebookAuthRoutes {
  constructor(knex = null) {
    this.router = express.Router();
    this.knex = knex; // Dependency injection for better testability
    this._setupRoutes();
  }

  /**
   * Setup Facebook authentication routes
   * @private
   */
  _setupRoutes() {
    // Initiate Facebook authentication
    this.router.get('/facebook',
      passport.authenticate('facebook', {
        scope: FACEBOOK_SCOPES
      })
    );

    // Facebook authentication callback
    this.router.get('/facebook/callback',
      (req, res, next) => {
        logger.info('Facebook callback received:', {
          query: req.query,
          url: req.url,
          method: req.method,
          headers: req.headers
        });
        next();
      },
      passport.authenticate('facebook', {
        failureRedirect: REDIRECT_ROUTES.AUTH_FAILED
      }),
      this._handleSuccessfulAuth.bind(this)
    );

    // Link Facebook account to existing user (when logged in)
    this.router.get('/facebook/link',
      this._requireAuth.bind(this),
      passport.authenticate('facebook', {
        scope: FACEBOOK_SCOPES
      })
    );

    // Facebook link callback
    this.router.get('/facebook/link/callback',
      this._requireAuth.bind(this),
      passport.authenticate('facebook', {
        failureRedirect: REDIRECT_ROUTES.LINK_FAILED
      }),
      this._handleSuccessfulLink.bind(this)
    );

    // Unlink Facebook account
    this.router.post('/facebook/unlink',
      this._requireAuth.bind(this),
      this._unlinkFacebook.bind(this)
    );

    // Facebook Data Deletion Webhook (required by Facebook)
    this.router.post('/facebook/deletion',
      this._handleDataDeletionRequest.bind(this)
    );

    // User-initiated Facebook data deletion
    this.router.post('/facebook/delete-data',
      this._requireAuth.bind(this),
      this._deleteUserFacebookData.bind(this)
    );
  }

  /**
   * Handle successful Facebook authentication
   * @private
   */
  _handleSuccessfulAuth(req, res) {
    try {
      logger.info('Facebook authentication successful:', {
        userId: req.user?.id,
        email: req.user?.email
      });

      // Redirect to frontend (not proxied route) with success parameter
      return res.redirect(REDIRECT_ROUTES.AUTH_SUCCESS);
    } catch (error) {
      logger.error('Error handling successful Facebook auth:', {
        error: error.message,
        stack: error.stack
      });
      return res.redirect(REDIRECT_ROUTES.AUTH_FAILED);
    }
  }

  /**
   * Handle successful Facebook account linking
   * @private
   */
  _handleSuccessfulLink(req, res) {
    try {
      logger.info('Facebook account linked successfully:', {
        userId: req.user?.id,
        email: req.user?.email
      });

      return res.redirect(REDIRECT_ROUTES.LINK_SUCCESS);
    } catch (error) {
      logger.error('Error handling successful Facebook link:', {
        error: error.message,
        stack: error.stack
      });
      return res.redirect(REDIRECT_ROUTES.LINK_REDIRECT_FAILED);
    }
  }

  /**
   * Get database instance (knex)
   * @private
   */
  _getDatabase(req) {
    return this.knex || req.app.get('knex');
  }

  /**
   * Get frontend URL for redirects
   * @private
   */
  _getFrontendUrl() {
    return process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000';
  }

  /**
   * Unlink Facebook account
   * @private
   */
  async _unlinkFacebook(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'المستخدم غير مسجل الدخول'
        });
      }

      const knex = this._getDatabase(req);

      await knex('sellers')
        .where('id', userId)
        .update({
          facebook_id: null,
          facebook_picture_url: null,
          facebook_profile_data: null,
          facebook_linked_at: null,
          auth_provider: 'local' // Reset to local only
        });

      logger.info('Facebook account unlinked:', { userId });

      return res.json({
        success: true,
        message: 'تم إلغاء ربط حساب فيسبوك بنجاح'
      });

    } catch (error) {
      logger.error('Error unlinking Facebook account:', {
        userId: req.user?.id,
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء إلغاء ربط حساب فيسبوك'
      });
    }
  }

  /**
   * Validate signed request from Facebook
   * @private
   */
  _validateSignedRequest(signedRequest) {
    if (!signedRequest || typeof signedRequest !== 'string') {
      return { isValid: false, error: 'Missing or invalid signed_request parameter' };
    }

    const parts = signedRequest.split('.');
    if (parts.length !== 2) {
      return { isValid: false, error: 'Invalid signed_request format' };
    }

    const [signature, payload] = parts;
    if (!signature || !payload) {
      return { isValid: false, error: 'Invalid signed_request structure' };
    }

    try {
      const decodedPayload = Buffer.from(payload, 'base64url').toString('utf8');
      const data = JSON.parse(decodedPayload);

      if (!data.user_id) {
        return { isValid: false, error: 'Missing user_id in request' };
      }

      return { isValid: true, data };
    } catch (error) {
      return { isValid: false, error: 'Failed to decode signed_request payload' };
    }
  }

  /**
   * Handle Facebook Data Deletion Request Webhook
   * Required by Facebook for app compliance
   * @private
   */
  async _handleDataDeletionRequest(req, res) {
    try {
      const { signed_request } = req.body;

      // Validate the signed request
      const validation = this._validateSignedRequest(signed_request);
      if (!validation.isValid) {
        logger.warn('Data deletion request validation failed:', { error: validation.error });
        return res.status(400).json({
          success: false,
          message: validation.error
        });
      }

      const { user_id } = validation.data;
      logger.info('Processing Facebook data deletion request:', { user_id });

      // Find and delete user data associated with this Facebook ID
      const knex = this._getDatabase(req);

      const deletedCount = await knex('sellers')
        .where('facebook_id', user_id)
        .update({
          facebook_id: null,
          facebook_picture_url: null,
          facebook_profile_data: null,
          facebook_linked_at: null,
          auth_provider: 'local',
          // Add deletion timestamp for audit purposes
          facebook_data_deleted_at: knex.fn.now()
        });

      logger.info('Facebook data deletion completed:', {
        user_id,
        recordsUpdated: deletedCount
      });

      // Return confirmation URL as required by Facebook
      const confirmationCode = `${user_id}_${Date.now()}`;
      const confirmationUrl = `${this._getFrontendUrl()}/facebook-deletion-confirmation?code=${confirmationCode}`;

      return res.json({
        url: confirmationUrl,
        confirmation_code: confirmationCode
      });

    } catch (error) {
      logger.error('Error processing Facebook data deletion request:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });

      return res.status(500).json({
        success: false,
        message: 'Internal server error processing deletion request'
      });
    }
  }

  /**
   * Delete user's Facebook data (user-initiated)
   * @private
   */
  async _deleteUserFacebookData(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'المستخدم غير مسجل الدخول'
        });
      }

      const knex = this._getDatabase(req);

      // Check if user has Facebook data to delete
      const user = await knex('sellers')
        .select('facebook_id', 'facebook_picture_url', 'facebook_profile_data')
        .where('id', userId)
        .first();

      if (!user || !user.facebook_id) {
        return res.status(400).json({
          success: false,
          message: 'لا توجد بيانات فيسبوك مرتبطة بحسابك'
        });
      }

      // Delete Facebook data
      await knex('sellers')
        .where('id', userId)
        .update({
          facebook_id: null,
          facebook_picture_url: null,
          facebook_profile_data: null,
          facebook_linked_at: null,
          auth_provider: 'local',
          facebook_data_deleted_at: knex.fn.now()
        });

      logger.info('User-initiated Facebook data deletion completed:', { userId });

      return res.json({
        success: true,
        message: 'تم حذف جميع بيانات فيسبوك الخاصة بك بنجاح'
      });

    } catch (error) {
      logger.error('Error deleting user Facebook data:', {
        userId: req.user?.id,
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء حذف بيانات فيسبوك'
      });
    }
  }

  /**
   * Middleware to require authentication
   * @private
   */
  _requireAuth(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }

    return res.status(401).json({
      success: false,
      message: 'يجب تسجيل الدخول أولاً'
    });
  }

  /**
   * Get the router instance
   */
  getRouter() {
    return this.router;
  }
}

module.exports = FacebookAuthRoutes;
