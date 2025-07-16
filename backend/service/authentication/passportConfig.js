const passport = require('passport');
const LocalStrategy = require('passport-local');
const FacebookStrategy = require('passport-facebook').Strategy;
const logger = require('../../utils/logger');

/**
 * Passport configuration factory
 */
class PassportConfig {
  constructor(authService, emailVerificationService, facebookAuthService = null) {
    this.authService = authService;
    this.emailVerificationService = emailVerificationService;
    this.facebookAuthService = facebookAuthService;
  }

  /**
   * Configure passport strategies and serialization
   */
  configure() {
    this._configureLocalStrategy();
    if (this.facebookAuthService) {
      this._configureFacebookStrategy();
    }
    this._configureSessionSerialization();
  }

  /**
   * Configure local authentication strategy
   * @private
   */
  _configureLocalStrategy() {
    passport.use(
      new LocalStrategy(async (username, password, cb) => {
        try {
          const result = await this.authService.verifyCredentials(username, password);
          if (!result.success) {
            logger.warn('Authentication failed:', {
              username,
              message: result.message
            });

            return cb(null, false, { message: result.message });
          }

          return cb(null, result.user);
        } catch (error) {
          logger.error('Authentication strategy error:', {
            error: error.message,
            stack: error.stack
          });
          return cb(error);
        }
      })
    );
  }

  /**
   * Configure Facebook authentication strategy
   * @private
   */
  _configureFacebookStrategy() {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: process.env.FACEBOOK_CALLBACK_URL || '/auth/facebook/callback',
          profileFields: ['id', 'displayName', 'name', 'emails', 'photos', 'gender', 'profileUrl']
        },
        async (accessToken, refreshToken, profile, cb) => {
          try {
            logger.info('Facebook authentication attempt:', {
              facebookId: profile.id,
              email: profile.emails?.[0]?.value,
              displayName: profile.displayName
            });

            const result = await this.facebookAuthService.handleFacebookAuth(profile, accessToken);

            if (!result.success) {
              logger.warn('Facebook authentication failed:', {
                facebookId: profile.id,
                message: result.message
              });
              return cb(null, false, { message: result.message });
            }

            logger.info('Facebook authentication successful:', {
              userId: result.user.id,
              isNewUser: result.isNewUser,
              accountLinked: result.accountLinked
            });

            return cb(null, result.user);
          } catch (error) {
            logger.error('Facebook authentication strategy error:', {
              facebookId: profile.id,
              error: error.message,
              stack: error.stack
            });
            return cb(error);
          }
        }
      )
    );
  }

  /**
   * Configure session serialization
   * @private
   */
  _configureSessionSerialization() {
    passport.serializeUser((user, cb) => {
      process.nextTick(() => {
        const serializedUser = {
          id: user.id,
          username: user.username,
          email: user.email,
          is_admin: user.isAdmin || user.is_admin || false,
          is_company: user.isCompany || user.is_company || false,
          is_premium: user.isPremium || user.is_premium || false,
          account_type: user.accountType || user.account_type || 'personal',
          auth_provider: user.authProvider || user.auth_provider || 'local',
          facebook_id: user.facebookId || user.facebook_id || null
        };

        logger.info('User serialized for session:', {
          userId: serializedUser.id,
          username: serializedUser.username,
          isAdmin: serializedUser.is_admin,
          isCompany: serializedUser.is_company,
          isPremium: serializedUser.is_premium,
          accountType: serializedUser.account_type,
          authProvider: serializedUser.auth_provider,
          facebookId: serializedUser.facebook_id
        });

        cb(null, serializedUser);
      });
    });

    passport.deserializeUser((user, cb) => {
      process.nextTick(() => {
        // Simply return the user from session - no DB lookup needed
        return cb(null, user);
      });
    });
  }
}

module.exports = PassportConfig;
