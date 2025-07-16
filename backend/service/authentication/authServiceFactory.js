const AuthService = require('./authService');
const UserRegistrationService = require('./userRegistrationService');
const UserProfileService = require('./userProfileService');
const EmailVerificationService = require('./emailVerificationService');
const FacebookAuthService = require('./facebookAuthService');
const PassportConfig = require('./passportConfig');
const AuthRouteHandlers = require('../../controllers/authController');
const cache = require('../dbCache');
const BrevoEmailService = require('../brevoEmailService');
const reqIdGenerator = require('../../utils/reqIdGenerator');
const { RegistrationService } = require('./company');
/**
 * Factory for creating authentication services
 * Implements dependency injection and makes the system more testable
 */
class AuthServiceFactory {
  constructor(knex, options = {}) {
    this.knex = knex;
    this.options = {
      enableCaching: true,
      cacheOptions: {},
      emailProvider: 'default',
      ...options
    };

    // Initialize cache if enabled
    this.userCache = this.options.enableCaching ? new cache.DbCache(this.options.cacheOptions) : null;
  }

  /**
   * Create a req ID generator instance
   */
  createReqIdGenerator() {
    return new reqIdGenerator();
  }
  /**
   * Create auth service instance
   */
  createAuthService() {
    const emailService = this.createEmailVerificationService();
    return new AuthService(this.knex, emailService, this.createReqIdGenerator(), this.userCache);
  }
  /**
   * Create user registration service instance
   */
  createUserRegistrationService() {
    return new UserRegistrationService(this.knex);
  }

  /**
   * Create company registration service instance
   */
  createCompanyRegistrationService() {
    return new RegistrationService(this.knex);
  }

  /**
   * Create user profile service instance
   */
  createUserProfileService() {
    return new UserProfileService(this.knex, this.userCache);
  }

  /**
   * Create email verification service instance
   */
  createEmailVerificationService() {
    // Could be extended to support different email providers
    switch (this.options.emailProvider) {
      case 'brevo':
        return new BrevoEmailService();
      default:
        return new EmailVerificationService();
    }
  }

  /**
   * Create passport configuration instance
   */
  createPassportConfig() {
    const authService = this.createAuthService();
    const emailService = this.createEmailVerificationService();
    const facebookAuthService = this.createFacebookAuthService();
    return new PassportConfig(authService, emailService, facebookAuthService);
  }
  /**
   * Create auth route handlers instance
   */
  createAuthRouteHandlers() {
    return new AuthRouteHandlers(
      this.createUserRegistrationService(),
      this.createCompanyRegistrationService(),
      this.createUserProfileService(),
      this.createEmailVerificationService(),
      this.createReqIdGenerator()
    );
  }

  /**
   * Create Facebook authentication service instance
   */
  createFacebookAuthService() {
    return new FacebookAuthService(this.knex, this.createUserRegistrationService(), this.createReqIdGenerator());
  }

  /**
   * Create all services at once
   */
  createAllServices() {
    return {
      authService: this.createAuthService(),
      userRegistrationService: this.createUserRegistrationService(),
      companyRegistrationService: this.createCompanyRegistrationService(),
      userProfileService: this.createUserProfileService(),
      emailVerificationService: this.createEmailVerificationService(),
      facebookAuthService: this.createFacebookAuthService(),
      passportConfig: this.createPassportConfig(),
      authRouteHandlers: this.createAuthRouteHandlers(),
      reqIdGenerator: this.createReqIdGenerator()
    };
  }
}

module.exports = AuthServiceFactory;
