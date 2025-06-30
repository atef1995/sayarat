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
      new LocalStrategy(async(username, password, cb) => {
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
        cb(null, { id: user.id, username: user.username });
      });
    });

    passport.deserializeUser((user, cb) => {
      process.nextTick(() => {
        return cb(null, user);
      });
    });
  }
}

module.exports = PassportConfig;
