/**
 * Company Registration Service - Facade Pattern Implementation
 *
 * RESPONSIBILITIES:
 * =================
 * - Orchestrates company registration workflow
 * - Manages service dependencies and coordination
 * - Provides high-level API for company operations
 * - Handles complex business logic and validation
 *
 * DESIGN PATTERNS:
 * ================
 * - Facade Pattern: Simplifies complex subsystem interactions
 * - Dependency Injection: Services are injected for testability
 * - Command Pattern: Each operation is encapsulated as a command
 * - Template Method: Common workflow patterns are templated
 *
 * #TODO: Implement event-driven architecture for notifications
 * #TODO: Add comprehensive audit trail for all operations
 * #TODO: Implement saga pattern for complex workflows
 * #TODO: Add circuit breaker pattern for external services
 * #TODO: Implement rate limiting and throttling
 */

const logger = require('../../../utils/logger');
const CompanyPasswordService = require('./PasswordService');
const CompanyValidationService = require('./ValidationService');
const CompanyDatabaseService = require('./DatabaseService');

class CompanyRegistrationService {
  constructor(knex, options = {}) {
    if (!knex) {
      throw new Error('Database connection (knex) is required');
    }

    this.knex = knex;
    this.options = {
      enableAuditLog: options.enableAuditLog ?? true,
      enableValidationCache: options.enableValidationCache ?? false,
      transactionTimeout: options.transactionTimeout ?? 30000,
      ...options
    };

    // Initialize services with dependency injection
    this._initializeServices(options);

    // Initialize metrics if enabled
    if (this.options.enableMetrics) {
      this._initializeMetrics();
    }
  }

  /**
   * Initialize all required services
   * @private
   */
  _initializeServices(options) {
    try {
      // Initialize password service
      this.passwordService = new CompanyPasswordService(options.passwordService);

      // Initialize validation service with custom validators
      this.validationService = new CompanyValidationService(options.customValidators);

      // Initialize database service
      this.databaseService = new CompanyDatabaseService(this.knex);

      logger.info('Company registration services initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize company registration services:', error);
      throw new Error('فشل في تهيئة خدمات تسجيل الشركات');
    }
  }

  /**
   * Initialize metrics collection
   * @private
   */
  _initializeMetrics() {
    this.metrics = {
      registrations: {
        total: 0,
        successful: 0,
        failed: 0
      },
      validations: {
        total: 0,
        successful: 0,
        failed: 0
      },
      performance: {
        averageRegistrationTime: 0,
        averageValidationTime: 0
      }
    };
  }

  /**
   * Log audit event
   * @private
   */
  _logAuditEvent(event, data, success = true) {
    if (!this.options.enableAuditLog) {
      return;
    }

    logger.info('Audit Event', {
      event,
      timestamp: new Date().toISOString(),
      success,
      data: {
        ...data,
        // Remove sensitive information
        password: data.password ? '[REDACTED]' : undefined,
        hashedPassword: data.hashedPassword ? '[REDACTED]' : undefined,
        salt: data.salt ? '[REDACTED]' : undefined
      }
    });
  }

  /**
   * Update metrics
   * @private
   */
  _updateMetrics(type, subtype, duration = null) {
    if (!this.metrics) {
      return;
    }

    if (this.metrics[type]) {
      this.metrics[type].total++;
      this.metrics[type][subtype]++;

      if (duration && this.metrics.performance) {
        const avgKey = `average${type.charAt(0).toUpperCase() + type.slice(1)}Time`;
        if (this.metrics.performance[avgKey]) {
          this.metrics.performance[avgKey] = (this.metrics.performance[avgKey] + duration) / 2;
        }
      }
    }
  }

  /**
   * Create a new company account with initial admin user
   * @param {Object} companyData - Company information
   * @param {Object} adminData - Admin user information
   * @returns {Promise<Object>} Company and user data
   */
  async createCompany(companyData, adminData) {
    const startTime = Date.now();
    let transaction = null;

    try {
      logger.info('Starting company creation process', {
        companyName: companyData?.companyName,
        adminEmail: adminData?.email,
        requestId: crypto.randomUUID()
      });

      this._logAuditEvent('COMPANY_CREATION_STARTED', {
        companyName: companyData?.companyName,
        adminEmail: adminData?.email
      });

      // Validate input data using validation service
      const companyValidation = this.validationService.validateCompanyData(companyData);
      if (!companyValidation.isValid) {
        const error = new Error(companyValidation.errors.join(', '));
        error.code = 'VALIDATION_ERROR';
        error.details = companyValidation;
        throw error;
      }

      const adminValidation = this.validationService.validateAdminData(adminData);
      if (!adminValidation.isValid) {
        const error = new Error(adminValidation.errors.join(', '));
        error.code = 'VALIDATION_ERROR';
        error.details = adminValidation;
        throw error;
      } // Use sanitized data from validation
      const sanitizedCompanyData = companyValidation.sanitizedData;
      const sanitizedAdminData = adminValidation.sanitizedData;

      // Set default subscription type if not provided (will be updated during subscription process)
      if (!sanitizedCompanyData.subscriptionType) {
        sanitizedCompanyData.subscriptionType = 'pending';
      }

      // Start database transaction with timeout
      transaction = await this.knex.transaction();

      // Set transaction timeout
      setTimeout(() => {
        if (transaction && !transaction.isCompleted()) {
          transaction.rollback(new Error('Transaction timeout'));
        }
      }, this.options.transactionTimeout);

      // Check for existing records using database service
      const companyExists = await this.databaseService.checkCompanyNameExists(
        sanitizedCompanyData.companyName,
        transaction
      );

      if (companyExists) {
        const error = new Error('اسم الشركة مستخدم بالفعل');
        error.code = 'COMPANY_EXISTS';
        throw error;
      }

      const userCheck = await this.databaseService.checkUserExists(
        sanitizedAdminData.email,
        sanitizedAdminData.username,
        transaction
      );

      if (userCheck.exists) {
        const errorMessage =
          userCheck.field === 'email' ? 'البريد الإلكتروني مستخدم بالفعل' : 'اسم المستخدم مستخدم بالفعل';

        const error = new Error(errorMessage);
        error.code = 'USER_EXISTS';
        error.field = userCheck.field;
        throw error;
      }

      // Hash password using password service
      const { hash: hashedPassword, salt } = await this.passwordService.hashPassword(sanitizedAdminData.password);

      // Create company and admin user using database service
      const companyId = await this.databaseService.createCompany(sanitizedCompanyData, transaction);

      const userId = await this.databaseService.createAdminUser(
        sanitizedAdminData,
        companyId,
        hashedPassword,
        salt,
        transaction
      );

      await transaction.commit();

      const duration = Date.now() - startTime;

      this._logAuditEvent('COMPANY_CREATION_COMPLETED', {
        companyId,
        userId,
        companyName: sanitizedCompanyData.companyName,
        duration
      });

      this._updateMetrics('registrations', 'successful', duration);

      logger.info('Company creation completed successfully', {
        companyId,
        userId,
        companyName: sanitizedCompanyData.companyName,
        duration: `${duration}ms`
      });

      return {
        success: true,
        company: {
          id: companyId,
          name: sanitizedCompanyData.companyName,
          subscriptionType: sanitizedCompanyData.subscriptionType,
          city: sanitizedCompanyData.companyCity
        },
        user: {
          id: userId,
          username: sanitizedAdminData.username,
          email: sanitizedAdminData.email,
          firstName: sanitizedAdminData.firstName,
          lastName: sanitizedAdminData.lastName,
          companyId: companyId
        },
        metadata: {
          createdAt: new Date().toISOString(),
          duration
        }
      };
    } catch (error) {
      if (transaction && !transaction.isCompleted()) {
        await transaction.rollback();
      }

      const duration = Date.now() - startTime;

      this._logAuditEvent(
        'COMPANY_CREATION_FAILED',
        {
          companyName: companyData?.companyName,
          adminEmail: adminData?.email,
          error: error.message,
          duration
        },
        false
      );

      this._updateMetrics('registrations', 'failed', duration);

      logger.error('Company creation failed:', {
        error: error.message,
        code: error.code,
        companyName: companyData?.companyName,
        adminEmail: adminData?.email,
        duration: `${duration}ms`,
        stack: error.stack
      });

      // Re-throw with additional context
      if (error.code) {
        throw error;
      }

      const enhancedError = new Error(error.message);
      enhancedError.code = 'INTERNAL_ERROR';
      enhancedError.originalError = error;
      throw enhancedError;
    }
  }
  /**
   * Validate company data without creating the account
   * @param {Object} data - Data to validate (companyName, email, username)
   * @param {Object} options - Validation options (step, requiredFields)
   * @returns {Promise<Object>} Validation result
   */
  async validateCompanySignupData(data, options = {}) {
    const startTime = Date.now();
    const { step, requiredFields = [] } = options;

    try {
      logger.info('Starting company signup data validation', {
        companyName: data?.companyName,
        email: data?.email,
        username: data?.username,
        step,
        requiredFields,
        requestId: crypto.randomUUID()
      });

      this._logAuditEvent('VALIDATION_STARTED', {
        companyName: data?.companyName,
        email: data?.email,
        username: data?.username,
        step,
        requiredFields
      });

      // Verify database schema first
      const schema = await this.databaseService.verifySchema();
      if (!schema.companiesExists) {
        logger.error('Companies table does not exist');
        return {
          success: false,
          error: 'خطأ في قاعدة البيانات - جدول الشركات غير موجود',
          code: 'SCHEMA_ERROR'
        };
      }

      if (!schema.hasRequiredColumns) {
        logger.error('Companies table missing required columns');
        return {
          success: false,
          error: 'خطأ في بنية قاعدة البيانات - أعمدة مطلوبة غير موجودة',
          code: 'SCHEMA_ERROR'
        };
      }

      const { companyName, email, username } = data;
      const fieldsToValidate = [];
      const validationResults = {};

      // Determine which fields to validate based on step or explicit requiredFields
      if (step !== undefined) {
        // Step-based validation
        switch (step) {
          case 1: // Company info step
            if (companyName) {
              fieldsToValidate.push('companyName');
            }
            break;
          case 2: // Admin info step
            if (email) {
              fieldsToValidate.push('email');
            }
            if (username) {
              fieldsToValidate.push('username');
            }
            break;
          default: // All fields for step 0 or final validation
            if (companyName) {
              fieldsToValidate.push('companyName');
            }
            if (email) {
              fieldsToValidate.push('email');
            }
            if (username) {
              fieldsToValidate.push('username');
            }
        }
      } else if (requiredFields.length > 0) {
        // Explicit field validation
        if (requiredFields.includes('companyName') && companyName) {
          fieldsToValidate.push('companyName');
        }
        if (requiredFields.includes('email') && email) {
          fieldsToValidate.push('email');
        }
        if (requiredFields.includes('username') && username) {
          fieldsToValidate.push('username');
        }
      } else {
        // Default: validate all provided fields
        if (companyName) {
          fieldsToValidate.push('companyName');
        }
        if (email) {
          fieldsToValidate.push('email');
        }
        if (username) {
          fieldsToValidate.push('username');
        }
      }

      // Validate only the fields that are provided and required for this step
      for (const fieldName of fieldsToValidate) {
        const fieldValue = data[fieldName];

        if (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '')) {
          return {
            success: false,
            error: `حقل ${fieldName} مطلوب`,
            field: fieldName,
            code: 'MISSING_REQUIRED_FIELD'
          };
        }

        const validation = this.validationService.validateField(fieldName, fieldValue);
        if (!validation.isValid) {
          return {
            success: false,
            error: validation.message,
            field: fieldName,
            code: 'VALIDATION_ERROR'
          };
        }

        validationResults[fieldName] = validation;
      }

      // Check existence in database only for validated fields
      if (validationResults.companyName) {
        const companyExists = await this.databaseService.checkCompanyNameExists(
          validationResults.companyName.sanitizedValue
        );

        if (companyExists) {
          return {
            success: false,
            error: 'اسم الشركة مستخدم بالفعل',
            field: 'companyName',
            code: 'COMPANY_EXISTS'
          };
        }
      }

      // Check user existence only if email or username are being validated
      if (validationResults.email || validationResults.username) {
        const userCheck = await this.databaseService.checkUserExists(
          validationResults.email?.sanitizedValue || null,
          validationResults.username?.sanitizedValue || null
        );

        if (userCheck.exists) {
          const errorMessage =
            userCheck.field === 'email' ? 'البريد الإلكتروني مستخدم بالفعل' : 'اسم المستخدم مستخدم بالفعل';

          return {
            success: false,
            error: errorMessage,
            field: userCheck.field,
            code: 'USER_EXISTS'
          };
        }
      }

      const duration = Date.now() - startTime;

      this._logAuditEvent('VALIDATION_COMPLETED', {
        companyName: data.companyName,
        email: data.email,
        username: data.username,
        duration
      });

      this._updateMetrics('validations', 'successful', duration);

      logger.info('Company signup data validation successful', {
        duration: `${duration}ms`
      });

      return {
        success: true,
        metadata: {
          validatedAt: new Date().toISOString(),
          duration
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      this._logAuditEvent(
        'VALIDATION_FAILED',
        {
          companyName: data?.companyName,
          email: data?.email,
          username: data?.username,
          error: error.message,
          duration
        },
        false
      );

      this._updateMetrics('validations', 'failed', duration);

      logger.error('Error validating company data:', {
        error: error.message,
        data: {
          companyName: data?.companyName,
          email: data?.email,
          username: data?.username
        },
        duration: `${duration}ms`,
        stack: error.stack
      });

      return {
        success: false,
        error: 'حدث خطأ في التحقق من البيانات. يرجى المحاولة مرة أخرى',
        code: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Validate company step data (step 1 - company information)
   * @param {Object} data - Company data to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateCompanyStepData(data) {
    return await this.validateCompanySignupData(data, {
      step: 1,
      requiredFields: ['companyName']
    });
  }

  /**
   * Validate admin step data (step 2 - admin user information)
   * @param {Object} data - Admin data to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateAdminStepData(data) {
    return await this.validateCompanySignupData(data, {
      step: 2,
      requiredFields: ['email', 'username']
    });
  }

  /**
   * Validate field data (individual field validation)
   * @param {string} fieldName - Field name to validate
   * @param {*} fieldValue - Field value to validate
   * @param {boolean} checkExistence - Whether to check database existence
   * @returns {Promise<Object>} Validation result
   */
  async validateFieldData(fieldName, fieldValue, checkExistence = true) {
    const startTime = Date.now();

    try {
      logger.debug('Validating individual field', { fieldName, checkExistence });

      // Basic field validation
      const validation = this.validationService.validateField(fieldName, fieldValue);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.message,
          field: fieldName,
          code: 'VALIDATION_ERROR'
        };
      }

      // Check existence in database if requested
      if (checkExistence) {
        if (fieldName === 'companyName') {
          const exists = await this.databaseService.checkCompanyNameExists(validation.sanitizedValue);
          if (exists) {
            return {
              success: false,
              error: 'اسم الشركة مستخدم بالفعل',
              field: fieldName,
              code: 'COMPANY_EXISTS'
            };
          }
        } else if (fieldName === 'email' || fieldName === 'username') {
          const userCheck = await this.databaseService.checkUserExists(
            fieldName === 'email' ? validation.sanitizedValue : null,
            fieldName === 'username' ? validation.sanitizedValue : null
          );
          if (userCheck.exists) {
            const errorMessage =
              fieldName === 'email' ? 'البريد الإلكتروني مستخدم بالفعل' : 'اسم المستخدم مستخدم بالفعل';
            return {
              success: false,
              error: errorMessage,
              field: fieldName,
              code: 'USER_EXISTS'
            };
          }
        }
      }

      const duration = Date.now() - startTime;
      logger.debug('Field validation successful', { fieldName, duration: `${duration}ms` });

      return {
        success: true,
        sanitizedValue: validation.sanitizedValue,
        metadata: {
          validatedAt: new Date().toISOString(),
          duration
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Error validating field:', {
        fieldName,
        error: error.message,
        duration: `${duration}ms`,
        stack: error.stack
      });

      return {
        success: false,
        error: 'حدث خطأ في التحقق من البيانات. يرجى المحاولة مرة أخرى',
        field: fieldName,
        code: 'INTERNAL_ERROR'
      };
    }
  }

  /**
   * Update company subscription status after successful payment
   * @param {string} companyId - Company ID
   * @param {string} subscriptionId - Stripe subscription ID
   * @param {string} status - Subscription status
   * @returns {Promise<boolean>} Success status
   */
  async activateCompanySubscription(companyId, subscriptionId, status = 'active') {
    try {
      logger.info('Activating company subscription', {
        companyId,
        subscriptionId,
        status
      });

      this._logAuditEvent('SUBSCRIPTION_ACTIVATION_STARTED', {
        companyId,
        subscriptionId,
        status
      });

      const result = await this.databaseService.updateSubscriptionStatus(companyId, subscriptionId, status);

      this._logAuditEvent('SUBSCRIPTION_ACTIVATION_COMPLETED', {
        companyId,
        subscriptionId,
        status
      });

      return result;
    } catch (error) {
      this._logAuditEvent(
        'SUBSCRIPTION_ACTIVATION_FAILED',
        {
          companyId,
          subscriptionId,
          status,
          error: error.message
        },
        false
      );

      logger.error('Failed to activate company subscription:', {
        companyId,
        subscriptionId,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Get company information with admin user
   * @param {string} companyId - Company ID
   * @returns {Promise<Object>} Company data
   */
  async getCompanyById(companyId) {
    try {
      logger.debug('Retrieving company by ID', { companyId });
      return await this.databaseService.getCompanyById(companyId);
    } catch (error) {
      logger.error('Failed to get company:', {
        companyId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get companies with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated companies data
   */
  async getCompanies(options = {}) {
    try {
      logger.debug('Retrieving companies with options', options);
      return await this.databaseService.getCompanies(options);
    } catch (error) {
      logger.error('Failed to get companies:', {
        options,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get service metrics
   * @returns {Object} Service metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get service health status
   * @returns {Promise<Object>} Health status
   */
  async getHealthStatus() {
    try {
      const dbHealth = await this.databaseService.getHealthStatus();

      return {
        status: dbHealth.status === 'healthy' ? 'healthy' : 'degraded',
        database: dbHealth,
        services: {
          password: 'healthy',
          validation: 'healthy',
          database: dbHealth.status
        },
        metrics: this.metrics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    try {
      // Clear any caches
      this.databaseService.clearSchemaCache();

      // Reset metrics if needed
      if (this.metrics) {
        // Keep historical data but reset counters if needed
      }

      logger.info('Company registration service cleanup completed');
    } catch (error) {
      logger.error('Cleanup failed:', error);
    }
  }

  // #TODO: Implement caching for frequently accessed data
  // #TODO: Add method for bulk company operations
  // #TODO: Implement company data export functionality
  // #TODO: Add company analytics and reporting methods
  // #TODO: Implement company backup and restore functionality
  // #TODO: Add webhook notifications for company events
  // #TODO: Implement advanced search with Elasticsearch integration
}

module.exports = CompanyRegistrationService;

/**
 * USAGE EXAMPLES:
 * ===============
 *
 * // Initialize service
 * const registrationService = new CompanyRegistrationService(knex, {
 *   enableAuditLog: true,
 *   enableMetrics: true,
 *   transactionTimeout: 30000
 * });
 *
 * // Create company
 * const result = await registrationService.createCompany(companyData, adminData);
 *
 * // Step-based validation (recommended for multi-step forms)
 *
 * // Step 1: Validate company information only
 * const step1Validation = await registrationService.validateCompanyStepData({
 *   companyName: 'Test Corp'
 * });
 *
 * // Step 2: Validate admin user information only
 * const step2Validation = await registrationService.validateAdminStepData({
 *   email: 'admin@testcorp.com',
 *   username: 'admin'
 * });
 *
 * // Individual field validation (for real-time validation)
 * const fieldValidation = await registrationService.validateFieldData(
 *   'email',
 *   'test@example.com',
 *   true // check existence in database
 * );
 *
 * // Full validation (all fields at once)
 * const fullValidation = await registrationService.validateCompanySignupData({
 *   companyName: 'Test Corp',
 *   email: 'admin@testcorp.com',
 *   username: 'admin'
 * });
 *
 * // Flexible validation with custom options
 * const customValidation = await registrationService.validateCompanySignupData({
 *   email: 'admin@testcorp.com',
 *   username: 'admin'
 * }, {
 *   step: 2,
 *   requiredFields: ['email', 'username']
 * });
 *
 * // Get health status
 * const health = await registrationService.getHealthStatus();
 *
 * // Get metrics
 * const metrics = registrationService.getMetrics();
 */
