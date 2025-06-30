/**
 * Company Database Service - Repository Pattern Implementation
 *
 * RESPONSIBILITIES:
 * =================
 * - Database operations for company-related data
 * - Transaction management and rollback handling
 * - Schema verification and migration support
 * - Query optimization and caching preparation
 *
 * DESIGN PATTERNS:
 * ================
 * - Repository Pattern: Abstracts database access layer
 * - Unit of Work Pattern: Manages transactions consistently
 * - Factory Pattern: Creates appropriate query builders
 *
 * #TODO: Implement query result caching with Redis
 * #TODO: Add database connection pooling optimization
 * #TODO: Implement read/write database splitting
 * #TODO: Add comprehensive query performance monitoring
 * #TODO: Implement database migration validation
 */

const crypto = require('crypto');
const logger = require('../../../utils/logger');

class CompanyDatabaseService {
  constructor(knex) {
    if (!knex) {
      throw new Error('Database connection (knex) is required');
    }

    this.knex = knex;
    this.tableName = 'companies';
    this.usersTableName = 'sellers';

    // Query timeout settings
    this.queryTimeout = 30000; // 30 seconds

    // Cache for schema information
    this._schemaCache = new Map();
    this._schemaCacheTimeout = 300000; // 5 minutes
  }

  /**
   * Check database schema and log table structure for debugging
   * @param {boolean} forceRefresh - Force refresh of schema cache
   * @returns {Promise<Object>} Schema information
   */
  async verifySchema(forceRefresh = false) {
    const cacheKey = 'schema_info';
    const cached = this._schemaCache.get(cacheKey);

    // Return cached result if available and not expired
    if (!forceRefresh && cached && Date.now() - cached.timestamp < this._schemaCacheTimeout) {
      return cached.data;
    }

    try {
      logger.info('Verifying database schema...');

      // Check if companies table exists
      const companiesExists = await this.knex.schema.hasTable(this.tableName);
      logger.info(`Companies table exists: ${companiesExists}`);

      // Check if users table exists
      const usersExists = await this.knex.schema.hasTable(this.usersTableName);
      logger.info(`Users table exists: ${usersExists}`);

      const schemaInfo = {
        companiesExists,
        usersExists,
        columns: {},
        hasNameColumn: false,
        hasRequiredColumns: false,
        timestamp: Date.now()
      };

      if (companiesExists) {
        // Get table info for debugging
        const tableInfo = await this.knex(this.tableName).columnInfo();
        const columns = Object.keys(tableInfo);

        schemaInfo.columns.companies = columns;
        schemaInfo.hasNameColumn = columns.includes('name');

        // Check for required columns
        const requiredColumns = ['id', 'name', 'description', 'address', 'city', 'tax_id'];
        schemaInfo.hasRequiredColumns = requiredColumns.every(col => columns.includes(col));

        logger.info('Companies table structure:', {
          columns,
          hasNameColumn: schemaInfo.hasNameColumn,
          hasRequiredColumns: schemaInfo.hasRequiredColumns
        });
      }

      if (usersExists) {
        const usersTableInfo = await this.knex(this.usersTableName).columnInfo();
        schemaInfo.columns.users = Object.keys(usersTableInfo);
        logger.info('Users table structure:', Object.keys(usersTableInfo));
      }

      // Cache the result
      this._schemaCache.set(cacheKey, {
        data: schemaInfo,
        timestamp: Date.now()
      });

      return schemaInfo;
    } catch (error) {
      logger.error('Schema verification failed:', {
        error: error.message,
        stack: error.stack
      });
      throw new Error('فشل في التحقق من قاعدة البيانات');
    }
  }

  /**
   * Execute query with timeout and error handling
   * @private
   */
  async _executeQuery(queryBuilder, operation = 'query') {
    try {
      return await queryBuilder.timeout(this.queryTimeout);
    } catch (error) {
      logger.error(`Database ${operation} failed:`, {
        error: error.message,
        sql: queryBuilder.toSQL?.(),
        stack: error.stack
      });

      if (error.message.includes('timeout')) {
        throw new Error('انتهت مهلة الاستعلام - يرجى المحاولة مرة أخرى');
      }

      if (error.message.includes('Undefined column')) {
        throw new Error('خطأ في بنية قاعدة البيانات - يرجى التواصل مع الدعم الفني');
      }

      throw error;
    }
  }

  /**
   * Check if company name exists
   * @param {string} companyName - Company name to check
   * @param {Object} transaction - Optional transaction object
   * @returns {Promise<boolean>} True if exists
   */
  async checkCompanyNameExists(companyName, transaction = null) {
    try {
      if (!companyName || typeof companyName !== 'string') {
        throw new Error('Company name must be a non-empty string');
      }

      const db = transaction || this.knex;

      // First verify schema
      const schema = await this.verifySchema();
      if (!schema.hasNameColumn) {
        logger.error('Companies table missing name column. Available columns:', schema.columns.companies);
        throw new Error('خطأ في بنية قاعدة البيانات - عمود اسم الشركة غير موجود');
      }

      const queryBuilder = db(this.tableName).where('name', companyName.trim()).select('id').first();

      const existing = await this._executeQuery(queryBuilder, 'checkCompanyNameExists');

      logger.debug('Company name check completed', {
        companyName: companyName.trim(),
        exists: !!existing
      });

      return !!existing;
    } catch (error) {
      logger.error('Error checking company name:', {
        companyName,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  /**
   * Check if user email or username exists
   * @param {string|null} email - Email to check (optional)
   * @param {string|null} username - Username to check (optional)
   * @param {Object} transaction - Optional transaction object
   * @returns {Promise<Object>} Existing user info
   */
  async checkUserExists(email, username, transaction = null) {
    try {
      if (!email && !username) {
        throw new Error('At least one of email or username is required');
      }

      const db = transaction || this.knex;

      let queryBuilder = db(this.usersTableName).select('id', 'email', 'username');

      // Build query based on provided fields
      if (email && username) {
        // Check both fields
        queryBuilder = queryBuilder
          .where('email', email.trim().toLowerCase())
          .orWhere('username', username.trim().toLowerCase());
      } else if (email) {
        // Check only email
        queryBuilder = queryBuilder.where('email', email.trim().toLowerCase());
      } else if (username) {
        // Check only username
        queryBuilder = queryBuilder.where('username', username.trim().toLowerCase());
      }

      queryBuilder = queryBuilder.first();

      const existing = await this._executeQuery(queryBuilder, 'checkUserExists');

      if (existing) {
        // Determine which field matched
        let field = null;
        if (email && existing.email.toLowerCase() === email.trim().toLowerCase()) {
          field = 'email';
        } else if (username && existing.username.toLowerCase() === username.trim().toLowerCase()) {
          field = 'username';
        } else {
          // Fallback if exact match detection fails
          field = email ? 'email' : 'username';
        }

        logger.debug('User existence check completed', {
          email: email?.trim() || null,
          username: username?.trim() || null,
          exists: true,
          field
        });

        return {
          exists: true,
          field,
          user: existing
        };
      }

      logger.debug('User existence check completed', {
        email: email?.trim() || null,
        username: username?.trim() || null,
        exists: false
      });

      return { exists: false };
    } catch (error) {
      logger.error('Error checking user existence:', {
        email,
        username,
        error: error.message,
        stack: error.stack
      });
      throw new Error('خطأ في التحقق من بيانات المستخدم');
    }
  }

  /**
   * Create company record
   * @param {Object} companyData - Company data
   * @param {Object} transaction - Transaction object
   * @returns {Promise<string>} Company ID
   */
  async createCompany(companyData, transaction) {
    try {
      if (!transaction) {
        throw new Error('Transaction is required for company creation');
      }

      const companyId = crypto.randomUUID();
      const now = new Date();

      const companyRecord = {
        id: companyId,
        name: companyData.companyName.trim(),
        description: companyData.companyDescription.trim(),
        address: companyData.companyAddress.trim(),
        city: companyData.companyCity,
        tax_id: companyData.taxId.trim(),
        website: companyData.website ? companyData.website.trim() : null,
        subscription_type: companyData.subscriptionType,
        subscription_status: 'pending',
        created_at: now,
        updated_at: now
      };

      const queryBuilder = transaction(this.tableName).insert(companyRecord);
      await this._executeQuery(queryBuilder, 'createCompany');

      logger.info('Company created successfully', {
        companyId,
        companyName: companyData.companyName,
        subscriptionType: companyData.subscriptionType
      });

      return companyId;
    } catch (error) {
      logger.error('Error creating company:', {
        companyData: {
          companyName: companyData?.companyName,
          city: companyData?.companyCity,
          subscriptionType: companyData?.subscriptionType
        },
        error: error.message,
        stack: error.stack
      });
      throw new Error('فشل في إنشاء سجل الشركة');
    }
  }

  /**
   * Create admin user record
   * @param {Object} adminData - Admin data
   * @param {string} companyId - Company ID
   * @param {Buffer} hashedPassword - Hashed password
   * @param {Buffer} salt - Password salt
   * @param {Object} transaction - Transaction object
   * @returns {Promise<string>} User ID
   */
  async createAdminUser(adminData, companyId, hashedPassword, salt, transaction) {
    try {
      if (!transaction) {
        throw new Error('Transaction is required for user creation');
      }

      const userId = crypto.randomUUID();
      const now = new Date();

      const userRecord = {
        id: userId,
        username: adminData.username.trim().toLowerCase(),
        email: adminData.email.trim().toLowerCase(),
        hashed_password: hashedPassword,
        salt: salt,
        first_name: adminData.firstName.trim(),
        last_name: adminData.lastName.trim(),
        phone: adminData.phone.trim(),
        date_of_birth: '1900-01-01', // Placeholder for company accounts
        account_type: 'company',
        company_id: companyId,
        role: 'owner',
        email_verified: false,
        is_company: true,
        is_premium: false,
        created_at: now,
        last_login: null
      };

      const queryBuilder = transaction(this.usersTableName).insert(userRecord);
      await this._executeQuery(queryBuilder, 'createAdminUser');

      logger.info('Admin user created successfully', {
        userId,
        companyId,
        username: adminData.username,
        email: adminData.email
      });

      return userId;
    } catch (error) {
      logger.error('Error creating admin user:', {
        adminData: {
          username: adminData?.username,
          email: adminData?.email,
          firstName: adminData?.firstName,
          lastName: adminData?.lastName
        },
        companyId,
        error: error.message,
        stack: error.stack
      });
      throw new Error('فشل في إنشاء حساب المسؤول');
    }
  }

  /**
   * Update company subscription status
   * @param {string} companyId - Company ID
   * @param {string} subscriptionId - Stripe subscription ID
   * @param {string} status - Subscription status
   * @returns {Promise<boolean>} Success status
   */
  async updateSubscriptionStatus(companyId, subscriptionId, status = 'active') {
    try {
      if (!companyId || !subscriptionId) {
        throw new Error('Company ID and subscription ID are required');
      }

      const updateData = {
        subscription_status: status,
        subscription_id: subscriptionId,
        updated_at: new Date()
      };

      // Add activation date if activating
      if (status === 'active') {
        updateData.subscription_activated_at = new Date();
      }

      const queryBuilder = this.knex(this.tableName).where('id', companyId).update(updateData);

      const result = await this._executeQuery(queryBuilder, 'updateSubscriptionStatus');

      if (result === 0) {
        throw new Error(`Company with ID ${companyId} not found`);
      }

      logger.info('Company subscription status updated', {
        companyId,
        subscriptionId,
        status
      });

      return true;
    } catch (error) {
      logger.error('Failed to update company subscription status:', {
        companyId,
        subscriptionId,
        status,
        error: error.message,
        stack: error.stack
      });
      throw new Error('فشل في تحديث حالة اشتراك الشركة');
    }
  }

  /**
   * Get company with admin user information
   * @param {string} companyId - Company ID
   * @returns {Promise<Object>} Company data
   */
  async getCompanyById(companyId) {
    try {
      if (!companyId) {
        throw new Error('Company ID is required');
      }

      const queryBuilder = this.knex(this.tableName)
        .leftJoin(this.usersTableName, `${this.tableName}.id`, `${this.usersTableName}.company_id`)
        .select(
          `${this.tableName}.*`,
          `${this.usersTableName}.id as admin_id`,
          `${this.usersTableName}.username as admin_username`,
          `${this.usersTableName}.email as admin_email`,
          `${this.usersTableName}.first_name as admin_first_name`,
          `${this.usersTableName}.last_name as admin_last_name`,
          `${this.usersTableName}.phone as admin_phone`,
          `${this.usersTableName}.created_at as admin_created_at`
        )
        .where(`${this.tableName}.id`, companyId)
        .where(`${this.usersTableName}.role`, 'owner')
        .first();

      const company = await this._executeQuery(queryBuilder, 'getCompanyById');

      if (!company) {
        logger.warn('Company not found', { companyId });
        return null;
      }

      logger.debug('Company retrieved successfully', {
        companyId,
        companyName: company.name
      });

      return company;
    } catch (error) {
      logger.error('Failed to get company:', {
        companyId,
        error: error.message,
        stack: error.stack
      });
      throw new Error('فشل في استرجاع بيانات الشركة');
    }
  }

  /**
   * Get companies with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated companies data
   */
  async getCompanies(options = {}) {
    try {
      const { page = 1, limit = 10, status = null, city = null, subscriptionType = null, search = null } = options;

      const offset = (page - 1) * limit;

      let queryBuilder = this.knex(this.tableName)
        .select(`${this.tableName}.*`)
        .leftJoin(this.usersTableName, `${this.tableName}.id`, `${this.usersTableName}.company_id`)
        .where(`${this.usersTableName}.role`, 'owner');

      // Apply filters
      if (status) {
        queryBuilder = queryBuilder.where(`${this.tableName}.subscription_status`, status);
      }

      if (city) {
        queryBuilder = queryBuilder.where(`${this.tableName}.city`, city);
      }

      if (subscriptionType) {
        queryBuilder = queryBuilder.where(`${this.tableName}.subscription_type`, subscriptionType);
      }

      if (search) {
        queryBuilder = queryBuilder.where(function() {
          this.where(`${this.tableName}.name`, 'ilike', `%${search}%`).orWhere(
            `${this.tableName}.description`,
            'ilike',
            `%${search}%`
          );
        });
      }

      // Get total count
      const countQuery = queryBuilder.clone().count('* as total').first();
      const { total } = await this._executeQuery(countQuery, 'getCompaniesCount');

      // Get paginated results
      const companiesQuery = queryBuilder.orderBy(`${this.tableName}.created_at`, 'desc').limit(limit).offset(offset);

      const companies = await this._executeQuery(companiesQuery, 'getCompanies');

      return {
        companies,
        pagination: {
          page,
          limit,
          total: parseInt(total),
          pages: Math.ceil(parseInt(total) / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to get companies:', {
        options,
        error: error.message,
        stack: error.stack
      });
      throw new Error('فشل في استرجاع بيانات الشركات');
    }
  }

  /**
   * Delete company and associated user
   * @param {string} companyId - Company ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteCompany(companyId) {
    const transaction = await this.knex.transaction();

    try {
      if (!companyId) {
        throw new Error('Company ID is required');
      }

      // Delete associated users first
      await transaction(this.usersTableName).where('company_id', companyId).del();

      // Delete company
      const result = await transaction(this.tableName).where('id', companyId).del();

      if (result === 0) {
        throw new Error(`Company with ID ${companyId} not found`);
      }

      await transaction.commit();

      logger.info('Company deleted successfully', { companyId });
      return true;
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to delete company:', {
        companyId,
        error: error.message,
        stack: error.stack
      });
      throw new Error('فشل في حذف الشركة');
    }
  }

  /**
   * Clear schema cache
   */
  clearSchemaCache() {
    this._schemaCache.clear();
    logger.info('Schema cache cleared');
  }

  /**
   * Get database health status
   * @returns {Promise<Object>} Health status
   */
  async getHealthStatus() {
    try {
      const startTime = Date.now();

      // Test basic connectivity
      await this.knex.raw('SELECT 1');

      const responseTime = Date.now() - startTime;

      // Check table existence
      const schema = await this.verifySchema();

      return {
        status: 'healthy',
        responseTime,
        tables: {
          companies: schema.companiesExists,
          users: schema.usersExists
        },
        schemaValid: schema.hasRequiredColumns
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime: null
      };
    }
  }
}

module.exports = CompanyDatabaseService;

/**
 * USAGE EXAMPLES:
 * ===============
 *
 * // Initialize service
 * const dbService = new CompanyDatabaseService(knex);
 *
 * // Check company existence
 * const exists = await dbService.checkCompanyNameExists('Test Company');
 *
 * // Create company with transaction
 * const transaction = await knex.transaction();
 * const companyId = await dbService.createCompany(companyData, transaction);
 *
 * // Get companies with pagination
 * const result = await dbService.getCompanies({
 *   page: 1,
 *   limit: 10,
 *   city: 'دمشق',
 *   search: 'شركة'
 * });
 *
 * // Health check
 * const health = await dbService.getHealthStatus();
 */
