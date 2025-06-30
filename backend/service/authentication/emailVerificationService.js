const { sendEmailVerification } = require('../email');
const logger = require('../../utils/logger');

/**
 * Email verification service handling email verification logic
 */
class EmailVerificationService {
  constructor() {
    // Could be extended to support multiple email providers
  }

  /**
   * Send verification email
   * @param {string} verificationToken
   * @param {string} email
   * @param {string} firstName
   * @returns {Promise<boolean>}
   */
  async sendVerificationEmail(verificationToken, email, firstName) {
    try {
      const emailSent = await sendEmailVerification(verificationToken, email, firstName);

      if (emailSent) {
        logger.info('Verification email sent to:', { email });
        return true;
      } else {
        logger.error('Failed to send verification email to:', email);
        return false;
      }
    } catch (error) {
      logger.error('Email verification error:', {
        error: error.message,
        stack: error.stack
      });
      return false;
    }
  }
  /**
   * Validate verification token format
   * @param {string} token
   * @returns {boolean}
   */
  isValidTokenFormat(token) {
    // Validation logic for token format
    return typeof token === 'string' && token.length === 64;
  }

  /**
   * Send company welcome email
   * @param {string} email
   * @param {string} firstName
   * @param {string} companyName
   * @param {string} requestId
   * @returns {Promise<boolean>}
   */
  async sendCompanyWelcomeEmail(email, firstName, companyName, requestId) {
    try {
      // This would typically send a welcome email for company registration
      // For now, we'll just log it since the actual email service might need to be extended
      logger.info('Company welcome email would be sent to:', {
        email,
        firstName,
        companyName,
        requestId
      });

      // TODO: Implement actual company welcome email sending
      // This could include information about next steps, payment links, etc.

      return true;
    } catch (error) {
      logger.error('Company welcome email error:', {
        error: error.message,
        stack: error.stack
      });
      return false;
    }
  }
}

module.exports = EmailVerificationService;
