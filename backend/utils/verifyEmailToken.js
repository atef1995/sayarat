const logger = require('./logger');

/**
 *
 * @param {import('knex')} knex
 * @param {string} token - The email verification token to verify
 *
 * @returns {Promise<{success: boolean, message: string, email?: string}>} 
 * - Returns an object indicating success or failure and a message.
 *
 */
const verifyEmailToken = async (knex, token) => {
  try {
    // Check if the token exists and is not expired
    const user = await knex('sellers')
      .where({ email_verification_token: token })
      .andWhere('email_token_expiry', '>', new Date())
      .first();

    if (!user) {
      return { success: false, message: 'Invalid or expired token' };
    }

    // Update the user's email verification status
    await knex('sellers').where({ email_verification_token: token }).update({
      email_verification_token: null,
      email_token_expiry: null,
      email_verified: true
    });

    return { success: true, message: 'Email verified successfully', email: user.email, name: user.first_name };
  } catch (error) {
    logger.error('Error verifying email token:', { error: error.message, stack: error.stack });
    return { success: false, message: 'Failed to verify email token' };
  }
};

module.exports = verifyEmailToken;
