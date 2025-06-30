/**
 * Company Registration Service - Legacy Compatibility Layer
 *
 * DEPRECATION NOTICE:
 * ===================
 * This file serves as a compatibility layer for the old monolithic service.
 * The service has been refactored into a modular architecture located in:
 * ./company/ directory with separate services for each concern.
 *
 * NEW MODULAR ARCHITECTURE:
 * =========================
 * - company/PasswordService.js: Password hashing and verification
 * - company/ValidationService.js: Data validation with strategy pattern
 * - company/DatabaseService.js: Database operations with repository pattern
 * - company/RegistrationService.js: Main orchestrator service
 * - company/index.js: Module exports and factory
 *
 * MIGRATION BENEFITS:
 * ===================
 * - Better error handling and schema verification
 * - Improved database query optimization
 * - Enhanced security with proper validation
 * - Better testability with dependency injection
 * - Extensible architecture following SOLID principles
 *
 * #TODO: Remove this file after all controllers migrate to the new services
 * #TODO: Update all imports to use the new modular services
 */

const { RegistrationService } = require('./company');

/**
 * Legacy CompanyRegistrationService - Compatibility Layer
 *
 * This class extends the new modular RegistrationService to maintain
 * backward compatibility while providing access to the improved
 * error handling and database operations.
 *
 * @deprecated Use company/RegistrationService.js directly for new implementations
 */
class CompanyRegistrationService extends RegistrationService {
  constructor(knex, options = {}) {
    // Show deprecation warning
    if (!options.suppressWarning) {
      console.warn(`
⚠️  DEPRECATION WARNING ⚠️
companyRegistrationService.js is deprecated and will be removed in a future version.

RECOMMENDED MIGRATION:
======================
Replace:
  const CompanyRegistrationService = require('./companyRegistrationService');
  
With:
  const { RegistrationService } = require('./company');
  
The new modular service provides:
✅ Better error handling and schema verification
✅ Improved database query optimization  
✅ Enhanced validation with strategy patterns
✅ Better testability with dependency injection
✅ Extensible architecture following SOLID principles

For more details, see: ./company/README.md
      `);
    }

    // Initialize with the new modular service
    super(knex, {
      enableAuditLog: true,
      enableValidationCache: false,
      ...options
    });
  }

  /**
   * Legacy method wrapper for backward compatibility
   * @deprecated Use createCompany() instead
   */
  async registerCompany(companyData, adminData) {
    console.warn('registerCompany() is deprecated. Use createCompany() instead.');
    return await this.createCompany(companyData, adminData);
  }

  /**
   * Legacy method wrapper for validation
   * @deprecated Use validateCompanySignupData() instead
   */
  async validateCompanyData(data) {
    console.warn('validateCompanyData() is deprecated. Use validateCompanySignupData() instead.');
    return await this.validateCompanySignupData(data);
  }
}

module.exports = CompanyRegistrationService;

/**
 * MIGRATION GUIDE:
 * ================
 *
 * STEP 1: Update imports in your controllers/routes
 * OLD:
 *   const CompanyRegistrationService = require('./companyRegistrationService');
 *
 * NEW:
 *   const { RegistrationService } = require('./company');
 *   // OR use the factory
 *   const { createRegistrationService } = require('./company');
 *
 * STEP 2: Update service instantiation
 * OLD:
 *   const service = new CompanyRegistrationService(knex);
 *
 * NEW:
 *   const service = new RegistrationService(knex);
 *   // OR with custom options
 *   const service = createRegistrationService(knex, {
 *     enableAuditLog: true,
 *     enableMetrics: true
 *   });
 *
 * STEP 3: Update method calls (most are the same)
 * - createCompany() - No changes needed
 * - validateCompanySignupData() - No changes needed
 * - activateCompanySubscription() - No changes needed
 * - getCompanyById() - No changes needed
 *
 * STEP 4: Remove this legacy file after migration
 *
 * BENEFITS OF MIGRATION:
 * ======================
 * ✅ Improved error handling with specific database column checks
 * ✅ Better schema verification and caching
 * ✅ Enhanced security with input validation
 * ✅ Better performance with query optimization
 * ✅ Improved logging and debugging capabilities
 * ✅ Better testability with dependency injection
 * ✅ Extensible architecture for future features
 *
 * For detailed documentation, see: ./company/README.md
 */
