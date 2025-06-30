/**
 * Company Password Service - Strategy Pattern Implementation
 *
 * RESPONSIBILITIES:
 * =================
 * - Password hashing using PBKDF2 strategy
 * - Password verification with timing-safe comparison
 * - Configurable hashing parameters
 * - Secure random salt generation
 *
 * DESIGN PATTERNS:
 * ================
 * - Strategy Pattern: Different hashing algorithms can be plugged in
 * - Factory Pattern: Can create different hash strategies
 *
 * #TODO: Implement Argon2 hashing strategy as alternative
 * #TODO: Add password strength scoring mechanism
 * #TODO: Implement password history checking
 * #TODO: Add rate limiting for password attempts
 * #TODO: Implement secure password recovery mechanisms
 */

const crypto = require('crypto');
const logger = require('../../../utils/logger');

class CompanyPasswordService {
  constructor(options = {}) {
    // Default PBKDF2 configuration - following OWASP recommendations
    this.defaultSaltBytes = options.saltBytes || 16;
    this.defaultIterations = options.iterations || 310000; // OWASP recommended minimum
    this.defaultKeyLength = options.keyLength || 32;
    this.defaultAlgorithm = options.algorithm || 'sha256';

    // #TODO: Add configuration for different hashing strategies
    this.strategies = new Map();
    this._initializeStrategies();
  }

  /**
   * Initialize different hashing strategies
   * @private
   */
  _initializeStrategies() {
    // PBKDF2 Strategy (default)
    this.strategies.set('pbkdf2', {
      hash: (password, salt, options) => this._pbkdf2Hash(password, salt, options),
      verify: (password, hash, salt, options) => this._pbkdf2Verify(password, hash, salt, options)
    });

    // #TODO: Add Argon2 strategy
    // #TODO: Add bcrypt strategy for legacy support
  }

  /**
   * Hash password using specified strategy
   * @param {string} password - Plain text password
   * @param {Object} options - Hashing options
   * @returns {Promise<{hash: Buffer, salt: Buffer, strategy: string}>} Hashed password result
   */
  async hashPassword(password, options = {}) {
    try {
      if (!password || typeof password !== 'string') {
        throw new Error('Password must be a non-empty string');
      }

      const strategy = options.strategy || 'pbkdf2';
      const hashStrategy = this.strategies.get(strategy);

      if (!hashStrategy) {
        throw new Error(`Unsupported hashing strategy: ${strategy}`);
      }

      const salt = crypto.randomBytes(this.defaultSaltBytes);
      const hash = await hashStrategy.hash(password, salt, options);

      logger.debug('Password hashed successfully', {
        strategy,
        saltLength: salt.length,
        hashLength: hash.length
      });

      return { hash, salt, strategy };
    } catch (error) {
      logger.error('Password hashing failed:', {
        error: error.message,
        stack: error.stack
      });
      throw new Error('فشل في تشفير كلمة المرور');
    }
  }

  /**
   * Verify password against stored hash
   * @param {string} password - Plain text password
   * @param {Buffer} storedHash - Stored hash
   * @param {Buffer} salt - Stored salt
   * @param {Object} options - Verification options
   * @returns {Promise<boolean>} Verification result
   */
  async verifyPassword(password, storedHash, salt, options = {}) {
    try {
      if (!password || !storedHash || !salt) {
        return false;
      }

      const strategy = options.strategy || 'pbkdf2';
      const hashStrategy = this.strategies.get(strategy);

      if (!hashStrategy) {
        logger.error(`Unsupported verification strategy: ${strategy}`);
        return false;
      }

      const isValid = await hashStrategy.verify(password, storedHash, salt, options);

      logger.debug('Password verification completed', {
        strategy,
        isValid: isValid ? 'success' : 'failure'
      });

      return isValid;
    } catch (error) {
      logger.error('Password verification failed:', {
        error: error.message,
        stack: error.stack
      });
      return false;
    }
  }

  /**
   * PBKDF2 hashing implementation
   * @private
   */
  async _pbkdf2Hash(password, salt, options = {}) {
    const {
      iterations = this.defaultIterations,
      keyLength = this.defaultKeyLength,
      algorithm = this.defaultAlgorithm
    } = options;

    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, iterations, keyLength, algorithm, (err, hash) => {
        if (err) {
          reject(err);
        } else {
          resolve(hash);
        }
      });
    });
  }

  /**
   * PBKDF2 verification implementation
   * @private
   */
  async _pbkdf2Verify(password, storedHash, salt, options = {}) {
    try {
      const computedHash = await this._pbkdf2Hash(password, salt, options);
      return crypto.timingSafeEqual(storedHash, computedHash);
    } catch (error) {
      logger.error('PBKDF2 verification error:', error);
      return false;
    }
  }

  /**
   * Generate secure random password
   * @param {number} length - Password length
   * @returns {string} Generated password
   */
  generateSecurePassword(length = 16) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*#?&';
    let password = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }

    return password;
  }

  /**
   * Check password strength
   * @param {string} password - Password to check
   * @returns {Object} Strength analysis
   */
  checkPasswordStrength(password) {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[@$!%*#?&]/.test(password)
    };

    const score = Object.values(checks).filter(Boolean).length;

    return {
      score,
      maxScore: 5,
      strength: score >= 4 ? 'strong' : score >= 3 ? 'medium' : 'weak',
      checks,
      recommendations: this._getPasswordRecommendations(checks)
    };
  }

  /**
   * Get password improvement recommendations
   * @private
   */
  _getPasswordRecommendations(checks) {
    const recommendations = [];

    if (!checks.length) {
      recommendations.push('استخدم 8 أحرف على الأقل');
    }
    if (!checks.uppercase) {
      recommendations.push('أضف حروف كبيرة (A-Z)');
    }
    if (!checks.lowercase) {
      recommendations.push('أضف حروف صغيرة (a-z)');
    }
    if (!checks.numbers) {
      recommendations.push('أضف أرقام (0-9)');
    }
    if (!checks.symbols) {
      recommendations.push('أضف رموز خاصة (@$!%*#?&)');
    }

    return recommendations;
  }
}

module.exports = CompanyPasswordService;

/**
 * USAGE EXAMPLES:
 * ===============
 *
 * // Basic usage
 * const passwordService = new CompanyPasswordService();
 * const { hash, salt } = await passwordService.hashPassword('mypassword');
 * const isValid = await passwordService.verifyPassword('mypassword', hash, salt);
 *
 * // Custom options
 * const service = new CompanyPasswordService({
 *   iterations: 500000,
 *   keyLength: 64
 * });
 *
 * // Password strength checking
 * const strength = passwordService.checkPasswordStrength('MyPass123!');
 * console.log(strength); // { score: 5, strength: 'strong', ... }
 */
