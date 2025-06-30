/**
 * Company Validation Service - Strategy Pattern Implementation
 *
 * RESPONSIBILITIES:
 * =================
 * - Data validation using specialized validator strategies
 * - Field-specific validation rules
 * - Comprehensive error message generation
 * - Extensible validation framework
 *
 * DESIGN PATTERNS:
 * ================
 * - Strategy Pattern: Different validation strategies for different data types
 * - Factory Pattern: Creates appropriate validators dynamically
 * - Chain of Responsibility: Multiple validation rules can be chained
 *
 * #TODO: Implement async validation for remote checks
 * #TODO: Add custom validation rule builder
 * #TODO: Implement validation rule caching
 * #TODO: Add internationalization support for error messages
 * #TODO: Implement validation performance monitoring
 */

const logger = require('../../../utils/logger');

class CompanyValidationService {
  constructor(customValidators = {}) {
    this.validators = new Map();
    this.customRules = new Map();

    // Initialize default validators
    this._initializeValidators();

    // Add custom validators if provided
    Object.entries(customValidators).forEach(([name, validator]) => {
      this.validators.set(name, validator);
    });
  }

  /**
   * Initialize default validation strategies
   * @private
   */
  _initializeValidators() {
    // Email validation strategy with comprehensive checks
    this.validators.set('email', {
      validate: email => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email) && email.length <= 254;

        return {
          isValid,
          message: isValid ? '' : 'البريد الإلكتروني غير صالح',
          field: 'email'
        };
      },
      sanitize: email => email.trim().toLowerCase()
    });

    // Phone validation strategy
    this.validators.set('phone', {
      validate: phone => {
        // Support multiple phone formats
        const phoneRegex = /^(\+963|0)?[0-9]{9,10}$/;
        const cleanPhone = phone.replace(/[\s-()]/g, '');
        const isValid = phoneRegex.test(cleanPhone);

        return {
          isValid,
          message: isValid ? '' : 'رقم الهاتف غير صالح (يجب أن يكون 9-10 أرقام)',
          field: 'phone'
        };
      },
      sanitize: phone => phone.replace(/[\s-()]/g, '')
    });

    // Password validation strategy with strength requirements
    this.validators.set('password', {
      validate: password => {
        const checks = {
          length: password.length >= 8,
          uppercase: /[A-Z]/.test(password),
          lowercase: /[a-z]/.test(password),
          numbers: /\d/.test(password),
          symbols: /[@$!%*#?&]/.test(password)
        };

        const failedChecks = Object.entries(checks)
          .filter(([_, passed]) => !passed)
          .map(([check]) => check);

        const isValid = failedChecks.length === 0;

        return {
          isValid,
          message: isValid
            ? ''
            : 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل وتشمل حروف كبيرة وصغيرة وأرقام ورموز خاصة',
          field: 'password',
          details: { checks, failedChecks }
        };
      }
    });

    // URL validation strategy
    this.validators.set('url', {
      validate: url => {
        try {
          const urlObj = new URL(url);
          const isValid = ['http:', 'https:'].includes(urlObj.protocol);

          return {
            isValid,
            message: isValid ? '' : 'الموقع الإلكتروني غير صالح (يجب أن يبدأ بـ http أو https)',
            field: 'url'
          };
        } catch {
          return {
            isValid: false,
            message: 'الموقع الإلكتروني غير صالح',
            field: 'url'
          };
        }
      },
      sanitize: url => url.trim().toLowerCase()
    });

    // Company name validation strategy
    this.validators.set('companyName', {
      validate: name => {
        const trimmedName = name.trim();
        const isValid = trimmedName.length >= 2 && trimmedName.length <= 100;

        return {
          isValid,
          message: isValid ? '' : 'اسم الشركة يجب أن يكون بين 2 و 100 حرف',
          field: 'companyName'
        };
      },
      sanitize: name => name.trim()
    });

    // Tax ID validation strategy
    this.validators.set('taxId', {
      validate: taxId => {
        const cleanTaxId = taxId.replace(/\s/g, '');
        const isValid = cleanTaxId.length >= 6 && cleanTaxId.length <= 20 && /^\d+$/.test(cleanTaxId);

        return {
          isValid,
          message: isValid ? '' : 'الرقم الضريبي يجب أن يكون بين 6 و 20 رقم',
          field: 'taxId'
        };
      },
      sanitize: taxId => taxId.replace(/\s/g, '')
    });

    // Username validation strategy
    this.validators.set('username', {
      validate: username => {
        const isValid = username.length >= 3 && username.length <= 30 && /^[a-zA-Z0-9_]+$/.test(username);

        return {
          isValid,
          message: isValid ? '' : 'اسم المستخدم يجب أن يكون بين 3 و 30 حرف ويحتوي على حروف وأرقام و _ فقط',
          field: 'username'
        };
      },
      sanitize: username => username.trim().toLowerCase()
    });

    // Generic text validation strategy
    this.validators.set('text', {
      validate: (text, options = {}) => {
        const { minLength = 1, maxLength = 500 } = options;
        const trimmedText = text.trim();
        const isValid = trimmedText.length >= minLength && trimmedText.length <= maxLength;

        return {
          isValid,
          message: isValid ? '' : `النص يجب أن يكون بين ${minLength} و ${maxLength} حرف`,
          field: 'text'
        };
      },
      sanitize: text => text.trim()
    });

    // City validation strategy
    this.validators.set('city', {
      validate: city => {
        const validCities = [
          'دمشق',
          'حلب',
          'حمص',
          'حماة',
          'اللاذقية',
          'طرطوس',
          'درعا',
          'السويداء',
          'القنيطرة',
          'الحسكة',
          'الرقة',
          'دير الزور',
          'إدلب',
          'ريف دمشق'
        ];

        const isValid = validCities.includes(city);

        return {
          isValid,
          message: isValid ? '' : 'يرجى اختيار مدينة صالحة',
          field: 'city'
        };
      }
    });
  }

  /**
   * Validate field using appropriate strategy
   * @param {string} field - Field name
   * @param {*} value - Value to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateField(field, value, options = {}) {
    try {
      if (value === null || value === undefined) {
        return {
          isValid: false,
          message: 'القيمة مطلوبة',
          field
        };
      }

      const validator = this.validators.get(field);
      if (!validator) {
        logger.warn(`No validator found for field: ${field}`);
        return { isValid: true, message: '', field };
      }

      // Sanitize value if sanitizer exists
      const sanitizedValue = validator.sanitize ? validator.sanitize(value) : value;

      // Validate the sanitized value
      const result = validator.validate(sanitizedValue, options);

      return {
        ...result,
        sanitizedValue,
        originalValue: value
      };
    } catch (error) {
      logger.error(`Validation error for field ${field}:`, {
        error: error.message,
        value,
        stack: error.stack
      });

      return {
        isValid: false,
        message: 'خطأ في التحقق من البيانات',
        field,
        error: error.message
      };
    }
  }

  /**
   * Validate multiple fields at once
   * @param {Object} data - Data object to validate
   * @param {Array} rules - Validation rules
   * @returns {Object} Validation result
   */
  validateMultiple(data, rules = []) {
    const results = {};
    const errors = [];
    const sanitizedData = {};

    for (const rule of rules) {
      const { field, required = true, validator, options = {} } = rule;
      const value = data[field];

      // Check if required field is missing
      if (required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        const error = `حقل ${field} مطلوب`;
        errors.push(error);
        results[field] = {
          isValid: false,
          message: error,
          field
        };
        continue;
      }

      // Skip validation if field is optional and empty
      if (!required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        results[field] = { isValid: true, message: '', field };
        continue;
      }

      // Validate the field
      const validatorName = validator || field;
      const result = this.validateField(validatorName, value, options);

      results[field] = result;

      if (!result.isValid) {
        errors.push(result.message);
      } else if (result.sanitizedValue !== undefined) {
        sanitizedData[field] = result.sanitizedValue;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      results,
      sanitizedData: { ...data, ...sanitizedData }
    };
  }

  /**
   * Validate company data with predefined rules
   * @param {Object} data - Company data to validate
   * @returns {Object} Validation result
   */
  validateCompanyData(data) {
    const rules = [
      { field: 'companyName', required: true },
      { field: 'companyDescription', required: true, validator: 'text', options: { minLength: 10, maxLength: 1000 } },
      { field: 'companyAddress', required: true, validator: 'text', options: { minLength: 5, maxLength: 200 } },
      { field: 'companyCity', required: true, validator: 'city' },
      { field: 'taxId', required: true },
      { field: 'website', required: false, validator: 'url' },
      { field: 'subscriptionType', required: false } // Made optional - will be set during subscription process
    ];

    const validation = this.validateMultiple(data, rules);

    // Additional subscription type validation (only if provided)
    if (data.subscriptionType && !['monthly', 'yearly', 'pending'].includes(data.subscriptionType)) {
      validation.errors.push('نوع الاشتراك غير صالح');
      validation.isValid = false;
    }

    return validation;
  }

  /**
   * Validate admin user data with predefined rules
   * @param {Object} data - Admin user data to validate
   * @returns {Object} Validation result
   */
  validateAdminData(data) {
    const rules = [
      { field: 'firstName', required: true, validator: 'text', options: { minLength: 2, maxLength: 50 } },
      { field: 'lastName', required: true, validator: 'text', options: { minLength: 2, maxLength: 50 } },
      { field: 'email', required: true },
      { field: 'username', required: true },
      { field: 'phone', required: true },
      { field: 'password', required: true }
    ];

    return this.validateMultiple(data, rules);
  }

  /**
   * Add custom validator
   * @param {string} name - Validator name
   * @param {Function} validateFn - Validation function
   * @param {Function} sanitizeFn - Optional sanitization function
   */
  addValidator(name, validateFn, sanitizeFn = null) {
    this.validators.set(name, {
      validate: validateFn,
      sanitize: sanitizeFn
    });

    logger.info(`Custom validator '${name}' added successfully`);
  }

  /**
   * Remove validator
   * @param {string} name - Validator name
   */
  removeValidator(name) {
    const removed = this.validators.delete(name);
    if (removed) {
      logger.info(`Validator '${name}' removed successfully`);
    }
    return removed;
  }

  /**
   * Get list of available validators
   * @returns {Array} List of validator names
   */
  getAvailableValidators() {
    return Array.from(this.validators.keys());
  }
}

module.exports = CompanyValidationService;

/**
 * USAGE EXAMPLES:
 * ===============
 *
 * // Basic field validation
 * const validationService = new CompanyValidationService();
 * const result = validationService.validateField('email', 'test@example.com');
 *
 * // Multiple field validation
 * const companyData = { companyName: 'Test Corp', email: 'test@example.com' };
 * const rules = [
 *   { field: 'companyName', required: true },
 *   { field: 'email', required: true }
 * ];
 * const validation = validationService.validateMultiple(companyData, rules);
 *
 * // Company data validation
 * const companyValidation = validationService.validateCompanyData(companyData);
 *
 * // Custom validator
 * validationService.addValidator('customField', (value) => ({
 *   isValid: value.length > 5,
 *   message: 'Value must be longer than 5 characters'
 * }));
 */
