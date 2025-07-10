const crypto = require('crypto');
const { getSellerByUsername } = require('../../dbQueries/sellers');
const logger = require('../../utils/logger');

/**
 * Authentication service handling password verification and user validation
 */
class AuthService {
  constructor(knex, emailVerificationService = null, reqIdGenerator = null, userCache = null) {
    this.knex = knex;
    this.emailVerificationService = emailVerificationService;
    this.reqIdGenerator = reqIdGenerator;
    this.userCache = userCache;
  }

  /**
   * Verify user credentials
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{success: boolean, user?: object, message?: string}>}
   */
  async verifyCredentials(username, password) {
    try {
      const seller = await getSellerByUsername(this.knex, username);

      if (!seller) {
        logger.error('No seller found for username:', username);
        return {
          success: false,
          message: 'اسم المستخدم أو كلمة المرور غير صحيحة.'
        };
      }

      // Check if email is verified
      if (!seller.email_verified) {
        const emailVerificationResult = await this._handleEmailVerification(seller);
        return emailVerificationResult;
      } // Verify password
      const passwordValid = await this._verifyPassword(password, seller.salt, seller.hashed_password);

      if (!passwordValid) {
        return {
          success: false,
          message: 'اسم المستخدم أو كلمة المرور غير صحيحة.'
        };
      } // Update last_login timestamp
      try {
        await this.knex('sellers').where('id', seller.id).update({
          last_login: this.knex.fn.now()
        });

        logger.info('Updated last_login for user:', {
          userId: seller.id,
          username: seller.username
        });

        // Update the seller object with the new last_login time
        seller.last_login = new Date();

        // Invalidate user cache to ensure fresh data on next request
        if (this.userCache) {
          await this.userCache.delete(seller.id);
        }
      } catch (updateError) {
        // Log the error but don't fail the login process
        logger.error('Failed to update last_login:', {
          userId: seller.id,
          username: seller.username,
          error: updateError.message
        });
      }

      const formattedSeller = {
        id: seller.id,
        username: seller.username,
        email: seller.email,
        firstName: seller.first_name,
        salt: seller.salt,
        hashedPassword: seller.hashed_password,
        email_verified: seller.email_verified,
        emailVerificationToken: seller.email_verification_token,
        emailTokenExpiry: seller.email_token_expiry,
        lastLogin: seller.last_login ? new Date(seller.last_login) : null,
        isCompany: seller.is_company,
        isAdmin: seller.is_admin || false,
        companyId: seller.company_id,
        isPremium: seller.is_premium,
        accountType: seller.account_type,
        picture: seller.picture,
        createdAt: seller.created_at ? new Date(seller.created_at) : null
      };

      return {
        success: true,
        user: formattedSeller
      };
    } catch (error) {
      logger.error('Error verifying credentials:', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Hash password with salt
   * @param {string} password
   * @param {Buffer} salt
   * @returns {Promise<Buffer>}
   */
  async hashPassword(password, salt = null) {
    if (!salt) {
      salt = crypto.randomBytes(16);
    }

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
   * Verify password against hash
   * @private
   */
  async _verifyPassword(password, salt, hashedPassword) {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 310000, 32, 'sha256', (err, hashedPassword2) => {
        if (err) {
          return reject(err);
        }
        resolve(crypto.timingSafeEqual(Buffer.from(hashedPassword), hashedPassword2));
      });
    });
  }

  /**
   * Handle email verification logic
   * @private
   */
  async _handleEmailVerification(seller) {
    logger.info('Email not verified for seller:', {
      username: seller.username,
      email: seller.email
    });
    const reqId = this.reqIdGenerator.generateRequestId();

    // Check if token date passed or email expiry token is null
    const tokenExpired =
      Math.abs(new Date().getTime() - new Date(seller.email_token_expiry).getTime()) / 3600000 < 0.01;

    if (tokenExpired || seller.email_token_expiry === null) {
      logger.info('Token expired or email expiry token is null');

      const verificationToken = crypto.randomBytes(32).toString('hex');
      await this.knex('sellers')
        .where('id', seller.id)
        .update({
          email_verification_token: verificationToken,
          email_token_expiry: this.knex.raw("NOW() + INTERVAL '24 hours'")
        });

      // Send verification email if email service is available
      if (this.emailVerificationService) {
        try {
          await this.emailVerificationService.sendVerificationEmail(
            seller.email,
            seller.first_name,
            reqId,
            verificationToken
          );
          logger.info('Verification email sent to:', { email: seller.email });
        } catch (emailError) {
          logger.error('Failed to send verification email:', {
            error: emailError.message,
            stack: emailError.stack
          });
          // Continue anyway - the token is saved, user can try again
        }
      }

      return {
        success: false,
        message: 'تم إرسال رابط التحقق الى بريدك الإلكتروني',
        needsEmailVerification: true,
        verificationToken
      };
    }
    // resend verification email if token is not expired
    if (this.emailVerificationService) {
      try {
        await this.emailVerificationService.sendVerificationEmail(
          seller.email,
          seller.first_name,
          reqId,
          seller.email_verification_token
        );
        logger.info('Verification email resent to:', { email: seller.email });
      } catch (emailError) {
        logger.error('Failed to resend verification email:', {
          error: emailError.message,
          stack: emailError.stack
        });
      }
    }

    return {
      success: false,
      message: 'البريد الإلكتروني غير مفعل'
    };
  }
}

module.exports = AuthService;
