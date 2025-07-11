const passport = require('passport');
const LocalStrategy = require('passport-local');
const logger = require('../../utils/logger');

/**
 * Passport configuration factory
 */
class PassportConfig {
  constructor(authService, emailVerificationService) {
    this.authService = authService;
    this.emailVerificationService = emailVerificationService;
  }

  /**
   * Configure passport strategies and serialization
   */
  configure() {
    this._configureLocalStrategy();
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
          account_type: user.accountType || user.account_type || 'personal'
        };

        logger.info('User serialized for session:', {
          userId: serializedUser.id,
          username: serializedUser.username,
          isAdmin: serializedUser.is_admin,
          isCompany: serializedUser.is_company,
          isPremium: serializedUser.is_premium,
          accountType: serializedUser.account_type
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
