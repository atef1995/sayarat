const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const cache = require('../service/dbCache');
const logger = require('../utils/logger');
const FacebookAuthRoutes = require('./facebookAuthRoutes');

const AuthServiceFactory = require('../service/authentication/authServiceFactory');

/**
 * Authentication router factory
 * @param {Knex} knex - Knex database instance
 * @returns {Router} - Express router for authentication handling
 */
function authRouter(knex) {
  const router = express.Router();

  // Initialize services
  logger.info('Initializing authentication services...');
  const authServiceFactory = new AuthServiceFactory(knex, {
    enableCaching: true,
    cacheOptions: {},
    emailProvider: 'brevo'
  });
  const {
    authService,
    userRegistrationService,
    userProfileService,
    emailVerificationService,
    passportConfig,
    authRouteHandlers
  } = authServiceFactory.createAllServices();

  // Configure Passport strategies
  passportConfig.configure();

  // Setup Facebook authentication routes
  const facebookAuthRoutes = new FacebookAuthRoutes();
  router.use('/', facebookAuthRoutes.getRouter());

  // Route definitions

  // Individual user registration
  router.post('/signup', authRouteHandlers.signup.bind(authRouteHandlers));

  // Company registration routes
  router.post('/company-signup', authRouteHandlers.companySignup.bind(authRouteHandlers));

  // Company validation routes (step-based and full)
  router.post('/validate-company-signup', authRouteHandlers.validateCompanySignup.bind(authRouteHandlers));
  router.post('/validate-company-step', authRouteHandlers.validateCompanyStep.bind(authRouteHandlers));
  router.post('/validate-admin-step', authRouteHandlers.validateAdminStep.bind(authRouteHandlers));
  router.post('/validate-field', authRouteHandlers.validateField.bind(authRouteHandlers));

  // Authentication routes
  router.post('/login', authRouteHandlers.login.bind(authRouteHandlers));
  router.post('/logout', authRouteHandlers.logout.bind(authRouteHandlers));
  router.get('/profile', ensureAuthenticated, authRouteHandlers.profile.bind(authRouteHandlers));
  router.get('/check', authRouteHandlers.checkAuth.bind(authRouteHandlers));

  return router;
}

module.exports = authRouter;
