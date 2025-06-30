const passport = require('passport');
const logger = require('../utils/logger');

/**
 * Authentication route handlers
 * Handles user signup, login, logout, profile retrieval, and authentication checks.
 * @class AuthRouteHandlers
 * @param {UserRegistrationService} userRegistrationService - Service for user registration
 * @param {CompanyRegistrationService} companyRegistrationService - Service for company registration
 * @param {UserProfileService} userProfileService - Service for user profile management
 * @param {EmailVerificationService} emailVerificationService - Service for email verification
 * @param {ReqIdGenerator} reqIdGenerator - Service for generating request IDs
 * @constructor
 * @description This class encapsulates all authentication-related route handlers.
 */
class AuthRouteHandlers {
  constructor(
    userRegistrationService,
    companyRegistrationService,
    userProfileService,
    emailVerificationService,
    reqIdGenerator
  ) {
    this.userRegistrationService = userRegistrationService;
    this.companyRegistrationService = companyRegistrationService;
    this.userProfileService = userProfileService;
    this.emailVerificationService = emailVerificationService;
    this.reqIdGenerator = reqIdGenerator;
  }

  /**
   * Handle user signup
   */
  async signup(req, res, next) {
    try {
      const result = await this.userRegistrationService.registerUser(req.body);
      const requestId = this.reqIdGenerator.generateRequestId();

      if (!result.success) {
        const statusCode = result.field ? 409 : 400;
        return res.status(statusCode).json({
          success: false,
          error: result.error,
          field: result.field
        });
      }

      // Send verification email
      if (result.verificationToken) {
        await this.emailVerificationService.sendVerificationEmail(
          req.body.email,
          req.body.firstName,
          requestId,
          result.verificationToken
        );
      }

      res.json({
        success: true,
        message: 'Signup successful. Please check your email for verification.'
      });
    } catch (error) {
      logger.error('Signup handler error:', {
        error: error.message,
        stack: error.stack
      });
      res.status(500).json({
        success: false,
        error: 'An error occurred during signup'
      });
    }
  }

  /**
   * Handle company signup
   */
  async companySignup(req, res, next) {
    try {
      const {
        companyName,
        companyDescription,
        companyAddress,
        companyCity,
        taxId,
        website,
        subscriptionType,
        firstName,
        lastName,
        email,
        username,
        phone,
        password
      } = req.body;

      const companyData = {
        companyName,
        companyDescription,
        companyAddress,
        companyCity,
        taxId,
        website,
        subscriptionType
      };

      const adminData = {
        firstName,
        lastName,
        email,
        username,
        phone,
        password
      };
      const result = await this.companyRegistrationService.createCompany(companyData, adminData);
      const requestId = this.reqIdGenerator.generateRequestId();

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      // Send welcome email to company admin using BrevoEmailService
      try {
        await this.emailVerificationService.sendCompanyWelcomeEmail(adminData, result.company, requestId);
      } catch (emailError) {
        logger.warn('Failed to send company welcome email:', {
          requestId,
          error: emailError.message,
          email: adminData.email
        });
        // Don't fail the registration if email fails
      }

      res.json({
        success: true,
        message: 'Company account created successfully. Please complete payment to activate.',
        user: {
          ...result.user,
          accountType: 'company'
        }
      });
    } catch (error) {
      logger.error('Company signup handler error:', {
        error: error.message,
        stack: error.stack
      });

      // Handle specific validation errors
      if (
        error.message.includes('مستخدم بالفعل') ||
        error.message.includes('البريد الإلكتروني') ||
        error.message.includes('اسم المستخدم')
      ) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'An error occurred during company signup'
      });
    }
  } /**
   * Validate company signup data without creating the account
   * Enhanced with step-based validation support
   */
  async validateCompanySignup(req, res, next) {
    try {
      const {
        companyName,
        companyDescription,
        companyAddress,
        companyCity,
        taxId,
        website,
        firstName,
        lastName,
        email,
        username,
        phone,
        password,
        confirmPassword,
        step,
        requiredFields
      } = req.body;

      logger.info('Company signup validation request', {
        companyName: `${companyName?.substring(0, 20)}...`,
        email: `${email?.substring(0, 5)}***`,
        username: `${username?.substring(0, 5)}***`,
        step,
        requiredFields,
        ip: req.ip
      });

      // For full validation, validate all company and admin data
      const companyData = {
        companyName,
        companyDescription,
        companyAddress,
        companyCity,
        taxId,
        website
      };

      const adminData = {
        firstName,
        lastName,
        email,
        username,
        phone,
        password,
        confirmPassword
      };

      // Validate company data
      const companyValidation = this.companyRegistrationService.validationService.validateCompanyData(companyData);
      if (!companyValidation.isValid) {
        // Find the first failed field to provide specific field information
        const failedField = Object.entries(companyValidation.results || {}).find(([field, result]) => !result.isValid);

        const firstError = companyValidation.errors[0];
        const fieldInfo = failedField ? { field: failedField[0] } : {};

        return res.status(400).json({
          success: false,
          error: firstError,
          ...fieldInfo,
          code: 'VALIDATION_ERROR'
        });
      }

      // Validate admin data
      const adminValidation = this.companyRegistrationService.validationService.validateAdminData(adminData);
      if (!adminValidation.isValid) {
        // Find the first failed field to provide specific field information
        const failedField = Object.entries(adminValidation.results || {}).find(([field, result]) => !result.isValid);

        const firstError = adminValidation.errors[0];
        const fieldInfo = failedField ? { field: failedField[0] } : {};

        return res.status(400).json({
          success: false,
          error: firstError,
          ...fieldInfo,
          code: 'VALIDATION_ERROR'
        });
      }

      // Check for existing records
      const validation = await this.companyRegistrationService.validateCompanySignupData(
        {
          companyName,
          email,
          username
        },
        {
          step,
          requiredFields
        }
      );

      if (!validation.success) {
        const statusCode = validation.field ? 409 : 400;
        return res.status(statusCode).json({
          success: false,
          error: validation.error,
          field: validation.field,
          code: validation.code
        });
      }

      res.json({
        success: true,
        message: 'Company data validation successful',
        metadata: validation.metadata
      });
    } catch (error) {
      logger.error('Error validating company signup:', {
        error: error.message,
        stack: error.stack,
        body: { ...req.body, email: '***', username: '***', password: '***' }
      });
      res.status(500).json({
        success: false,
        error: 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Handle user login
   */
  login(req, res, next) {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        logger.error('Authentication error:', {
          error: err.message,
          stack: err.stack
        });
        return next(err);
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          error: info.message
        });
      }

      req.logIn(user, err => {
        if (err) {
          logger.error('Login error:', {
            error: err.message,
            stack: err.stack
          });
          return next(err);
        }

        logger.info('User logged in:', { user: user.username });
        return res.json({ success: true, user });
      });
    })(req, res, next);
  }

  /**
   * Handle user logout
   */
  logout(req, res, next) {
    req.logout(err => {
      if (err) {
        return next(err);
      }
      res.status(200).json({ success: true });
    });
  }

  /**
   * Handle profile request
   */
  async profile(req, res) {
    try {
      const result = await this.userProfileService.getUserProfile(req.user.id);

      if (!result.success) {
        const statusCode = result.error === 'User not found' ? 404 : 500;
        return res.status(statusCode).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        user: result.user
      });
    } catch (error) {
      logger.error('Profile handler error:', {
        error: error.message,
        stack: error.stack
      });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch profile'
      });
    }
  }

  /**
   * Handle authentication check
   */
  async checkAuth(req, res) {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          success: true,
          isAuthenticated: false
        });
      }

      const result = await this.userProfileService.getAuthenticatedUser(req.user.id);

      if (!result.success) {
        const statusCode = result.error === 'User not found' ? 404 : 500;
        return res.status(statusCode).json({
          success: false,
          isAuthenticated: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        isAuthenticated: true,
        user: result.user
      });
    } catch (error) {
      logger.error('Auth check handler error:', {
        error: error.message,
        stack: error.stack
      });
      res.status(500).json({
        success: false,
        isAuthenticated: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Validate company step data (Step 1 - Company Information)
   */
  async validateCompanyStep(req, res, next) {
    try {
      const { companyName, step } = req.body;

      logger.info('Company step validation request', {
        companyName: `${companyName?.substring(0, 20)}...`,
        step,
        ip: req.ip
      });

      const validation = await this.companyRegistrationService.validateCompanyStepData({
        companyName
      });

      if (!validation.success) {
        const statusCode = validation.field ? 409 : 400;
        return res.status(statusCode).json({
          success: false,
          error: validation.error,
          field: validation.field,
          code: validation.code
        });
      }

      res.json({
        success: true,
        message: 'Company step validation successful',
        metadata: validation.metadata
      });
    } catch (error) {
      logger.error('Error validating company step:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      res.status(500).json({
        success: false,
        error: 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Validate admin step data (Step 2 - Admin User Information)
   */
  async validateAdminStep(req, res, next) {
    try {
      const { email, username, step } = req.body;

      logger.info('Admin step validation request', {
        email: `${email?.substring(0, 5)}***`,
        username: `${username?.substring(0, 5)}***`,
        step,
        ip: req.ip
      });

      const validation = await this.companyRegistrationService.validateAdminStepData({
        email,
        username
      });

      if (!validation.success) {
        const statusCode = validation.field ? 409 : 400;
        return res.status(statusCode).json({
          success: false,
          error: validation.error,
          field: validation.field,
          code: validation.code
        });
      }

      res.json({
        success: true,
        message: 'Admin step validation successful',
        metadata: validation.metadata
      });
    } catch (error) {
      logger.error('Error validating admin step:', {
        error: error.message,
        stack: error.stack,
        body: { ...req.body, email: '***', username: '***' }
      });
      res.status(500).json({
        success: false,
        error: 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Validate individual field data
   */
  async validateField(req, res, next) {
    try {
      const { fieldName, fieldValue, checkExistence = true } = req.body;

      logger.info('Field validation request', {
        fieldName,
        fieldValue: `${fieldValue?.substring(0, 10)}...`,
        checkExistence,
        ip: req.ip
      });

      const validation = await this.companyRegistrationService.validateFieldData(fieldName, fieldValue, checkExistence);

      if (!validation.success) {
        const statusCode = validation.field ? 409 : 400;
        return res.status(statusCode).json({
          success: false,
          error: validation.error,
          field: validation.field,
          code: validation.code
        });
      }

      res.json({
        success: true,
        message: 'Field validation successful',
        sanitizedValue: validation.sanitizedValue,
        metadata: validation.metadata
      });
    } catch (error) {
      logger.error('Error validating field:', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      res.status(500).json({
        success: false,
        error: 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى',
        code: 'INTERNAL_ERROR'
      });
    }
  }
}

module.exports = AuthRouteHandlers;
