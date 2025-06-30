/**
 * Company Authentication Services - Module Exports
 *
 * MODULAR ARCHITECTURE:
 * ====================
 *
 * This module provides a clean interface for importing company authentication services.
 * Each service follows SOLID principles and can be used independently or together.
 *
 * SERVICES:
 * =========
 * - PasswordService: Handles password hashing and verification
 * - ValidationService: Handles data validation with strategy pattern
 * - DatabaseService: Handles database operations with repository pattern
 * - RegistrationService: Main facade service that coordinates all operations
 *
 * DESIGN PATTERNS USED:
 * ====================
 * - Factory Pattern: For creating service instances
 * - Facade Pattern: RegistrationService provides simplified interface
 * - Strategy Pattern: Different validation and hashing strategies
 * - Repository Pattern: Database operations abstraction
 * - Dependency Injection: Services are injected for better testability
 *
 * #TODO: Add service factory for creating pre-configured instances
 * #TODO: Implement service registry for dynamic service discovery
 * #TODO: Add configuration validation for service options
 * #TODO: Implement service lifecycle management
 */

const PasswordService = require('./PasswordService');
const ValidationService = require('./ValidationService');
const DatabaseService = require('./DatabaseService');
const RegistrationService = require('./RegistrationService');

/**
 * Service Factory - Creates pre-configured service instances
 */
class CompanyServiceFactory {
  /**
   * Create a complete registration service with all dependencies
   * @param {Object} knex - Database connection
   * @param {Object} options - Configuration options
   * @returns {RegistrationService} Configured registration service
   */
  static createRegistrationService(knex, options = {}) {
    return new RegistrationService(knex, options);
  }

  /**
   * Create password service with custom options
   * @param {Object} options - Password service options
   * @returns {PasswordService} Configured password service
   */
  static createPasswordService(options = {}) {
    return new PasswordService(options);
  }

  /**
   * Create validation service with custom validators
   * @param {Object} customValidators - Custom validation functions
   * @returns {ValidationService} Configured validation service
   */
  static createValidationService(customValidators = {}) {
    return new ValidationService(customValidators);
  }

  /**
   * Create database service
   * @param {Object} knex - Database connection
   * @returns {DatabaseService} Configured database service
   */
  static createDatabaseService(knex) {
    return new DatabaseService(knex);
  }

  /**
   * Create all services with shared configuration
   * @param {Object} knex - Database connection
   * @param {Object} config - Shared configuration
   * @returns {Object} All configured services
   */
  static createAllServices(knex, config = {}) {
    const passwordService = new PasswordService(config.password);
    const validationService = new ValidationService(config.customValidators);
    const databaseService = new DatabaseService(knex);
    const registrationService = new RegistrationService(knex, config);

    return {
      passwordService,
      validationService,
      databaseService,
      registrationService
    };
  }
}

// Export individual services
module.exports = {
  // Individual services
  PasswordService,
  ValidationService,
  DatabaseService,
  RegistrationService,

  // Factory for creating services
  CompanyServiceFactory,

  // Convenience method for creating the main service
  createRegistrationService: CompanyServiceFactory.createRegistrationService,

  // Default export is the main registration service
  default: RegistrationService
};

/**
 * USAGE EXAMPLES:
 * ===============
 *
 * // Import the main service (most common usage)
 * const { RegistrationService } = require('./company');
 * const service = new RegistrationService(knex);
 *
 * // Step-based validation for multi-step forms
 * const step1Validation = await service.validateCompanyStepData({
 *   companyName: 'My Company'
 * });
 *
 * const step2Validation = await service.validateAdminStepData({
 *   email: 'admin@company.com',
 *   username: 'admin'
 * });
 *
 * // Individual field validation
 * const fieldValidation = await service.validateFieldData('email', 'test@example.com');
 *
 * // Import specific services
 * const { PasswordService, ValidationService } = require('./company');
 * const passwordService = new PasswordService();
 * const validationService = new ValidationService();
 *
 * // Use factory to create pre-configured services
 * const { CompanyServiceFactory } = require('./company');
 * const registrationService = CompanyServiceFactory.createRegistrationService(knex, {
 *   enableAuditLog: true,
 *   enableMetrics: true
 * });
 *
 * // Create all services at once
 * const services = CompanyServiceFactory.createAllServices(knex, {
 *   password: { iterations: 500000 },
 *   customValidators: { myValidator: validatorFunction },
 *   enableAuditLog: true
 * });
 *
 * // Convenience method
 * const { createRegistrationService } = require('./company');
 * const service = createRegistrationService(knex);
 */
