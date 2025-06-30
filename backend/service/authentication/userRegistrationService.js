const crypto = require('crypto');
const logger = require('../../utils/logger');

/**
 * User registration service handling signup logic
 */
class UserRegistrationService {
  constructor(knex) {
    this.knex = knex;
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<{success: boolean, userId?: number, error?: string}>}
   */
  async registerUser(userData) {
    const { email, username, password, firstName, lastName, phone, dateOfBirth } = userData;

    try {
      // Validate input
      const validationResult = this._validateInput(userData);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.error,
          field: validationResult.field
        };
      }

      // Check for existing user
      const existingUserCheck = await this._checkExistingUser(username, email);
      if (!existingUserCheck.isValid) {
        return {
          success: false,
          error: existingUserCheck.error,
          field: existingUserCheck.field
        };
      }

      // Hash password
      const { hash: hashedPassword, salt } = await this._hashPassword(password);

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Create user
      const userId = await this._createUser({
        username,
        email,
        hashedPassword,
        salt,
        firstName,
        lastName,
        phone,
        dateOfBirth,
        verificationToken
      });

      return {
        success: true,
        userId,
        verificationToken
      };
    } catch (error) {
      logger.error('Registration error:', {
        error: error.message,
        stack: error.stack
      });
      return {
        success: false,
        error: 'An error occurred during signup'
      };
    }
  }

  /**
   * Validate user input
   * @private
   */
  _validateInput(userData) {
    const { email, username, password, firstName, lastName, phone, dateOfBirth } = userData;

    // Check required fields
    if (!username || !password || !email || !firstName || !lastName || !phone || !dateOfBirth) {
      return {
        isValid: false,
        error: 'All fields are required'
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        error: 'Invalid email format',
        field: 'email'
      };
    }

    return { isValid: true };
  }

  /**
   * Check for existing username or email
   * @private
   */
  async _checkExistingUser(username, email) {
    // Check for existing username
    const existingUsername = await this.knex('sellers').select('username').where('username', username).first();

    if (existingUsername) {
      return {
        isValid: false,
        error: 'اسم المستخدم غير صالح للاستخدام',
        field: 'username'
      };
    }

    // Check for existing email
    const existingEmail = await this.knex('sellers').select('email').where('email', email).first();

    if (existingEmail) {
      return {
        isValid: false,
        error: 'البريد الإلكتروني مسجل مسبقاً',
        field: 'email'
      };
    }

    return { isValid: true };
  }

  /**
   * Hash password
   * @private
   */
  async _hashPassword(password) {
    const salt = crypto.randomBytes(16);

    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 310000, 32, 'sha256', (err, hash) => {
        if (err) {
          reject(err);
        }
        resolve({ hash, salt });
      });
    });
  }

  /**
   * Create user in database
   * @private
   */
  async _createUser(userData) {
    const { username, email, hashedPassword, salt, firstName, lastName, phone, dateOfBirth, verificationToken } =
      userData;

    const result = await this.knex.transaction(async trx => {
      const [userId] = await trx('sellers')
        .insert({
          username,
          email,
          hashed_password: hashedPassword,
          salt,
          first_name: firstName,
          last_name: lastName,
          phone,
          date_of_birth: dateOfBirth,
          email_verification_token: verificationToken,
          email_token_expiry: null,
          created_at: this.knex.raw('NOW()'),
          last_login: this.knex.raw('NOW()')
        })
        .returning('id');

      return userId;
    });

    if (!result) {
      throw new Error('Failed to create user');
    }

    return result;
  }
}

module.exports = UserRegistrationService;
