const express = require('express');
const passport = require('passport');
const logger = require('../utils/logger');

/**
 * Facebook authentication routes
 */
class FacebookAuthRoutes {
  constructor() {
    this.router = express.Router();
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
        scope: ['email', 'public_profile']
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
        failureRedirect: '/?facebook_auth=failed'
      }),
      this._handleSuccessfulAuth.bind(this)
    );

    // Link Facebook account to existing user (when logged in)
    this.router.get('/facebook/link',
      this._requireAuth.bind(this),
      passport.authenticate('facebook', {
        scope: ['email', 'public_profile']
      })
    );

    // Facebook link callback
    this.router.get('/facebook/link/callback',
      this._requireAuth.bind(this),
      passport.authenticate('facebook', {
        failureRedirect: '/profile?error=facebook_link_failed'
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
      return res.redirect('/?facebook_auth=success');
    } catch (error) {
      logger.error('Error handling successful Facebook auth:', {
        error: error.message,
        stack: error.stack
      });
      return res.redirect('/?facebook_auth=failed');
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

      return res.redirect('/profile?success=facebook_linked');
    } catch (error) {
      logger.error('Error handling successful Facebook link:', {
        error: error.message,
        stack: error.stack
      });
      return res.redirect('/profile?error=link_redirect_failed');
    }
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

      // #TODO: Inject knex dependency properly
      const knex = req.app.get('knex');

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
   * Handle Facebook Data Deletion Request Webhook
   * Required by Facebook for app compliance
   * @private
   */
  async _handleDataDeletionRequest(req, res) {
    try {
      const { signed_request } = req.body;

      if (!signed_request) {
        logger.warn('Data deletion request missing signed_request parameter');
        return res.status(400).json({
          success: false,
          message: 'Missing signed_request parameter'
        });
      }

      // Parse the signed request (Facebook format: signature.payload)
      const [signature, payload] = signed_request.split('.');

      if (!signature || !payload) {
        logger.warn('Invalid signed_request format:', { signed_request });
        return res.status(400).json({
          success: false,
          message: 'Invalid signed_request format'
        });
      }

      // Decode the payload (Base64 URL decode)
      const decodedPayload = Buffer.from(payload, 'base64url').toString('utf8');
      const data = JSON.parse(decodedPayload);

      const { user_id } = data;

      if (!user_id) {
        logger.warn('Data deletion request missing user_id:', { data });
        return res.status(400).json({
          success: false,
          message: 'Missing user_id in request'
        });
      }

      logger.info('Processing Facebook data deletion request:', { user_id });

      // Find and delete user data associated with this Facebook ID
      const knex = req.app.get('knex');

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
      const confirmationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/facebook-deletion-confirmation?code=${confirmationCode}`;

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

      const knex = req.app.get('knex');

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
