const express = require('express');
const { generateResetToken, generateTokenExpiry } = require('../generator/token');
const verifyEmailToken = require('../utils/verifyEmailToken');
const checkIfEmailExists = require('../utils/checkIfEmailExists');
const router = express.Router();
const crypto = require('crypto');
const { validatePassword } = require('../service/inputValidation');
const logger = require('../utils/logger');
const brevoEmailService = require('../service/brevoEmailService');
const ReqIdGenerator = require('../utils/reqIdGenerator');

function emailRouter(knex) {
  const emailService = new brevoEmailService();
  const generator = new ReqIdGenerator();

  router.post('/reset-password-request', async(req, res) => {
    const reqId = generator.generateRequestId();
    const { email } = req.body;
    const resetToken = generateResetToken(); // Implement token generation logic
    const resetTokenExpiry = generateTokenExpiry();
    logger.info('token:', { resetToken });
    logger.info('token expiry:', { resetTokenExpiry });
    logger.info('email:', { email });

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailExists = await checkIfEmailExists(email, knex);
    if (!emailExists) {
      return res.status(400).json({ error: 'error' });
    }

    // check if the token already exists for the email and not expired
    const existingToken = await knex('sellers')
      .where({ email: email, reset_token: resetToken })
      .andWhere('reset_token_expiry', '>', new Date())
      .first();
    if (existingToken) {
      return res.status(400).json({ error: 'Reset token already exists and is not expired' });
    }

    try {
      const to = { email };
      // Update the database with the reset token and expiry
      await new Promise((resolve, reject) => {
        knex('sellers')
          .where({ email: to.email })
          .update({
            reset_token: resetToken,
            reset_token_expiry: resetTokenExpiry
          })
          .then(() => resolve())
          .catch(err => reject(err));
      });

      const resetPasswordResult = await emailService.sendResetPasswordEmail(email, firstName, reqId, resetToken);

      if (!resetPasswordResult.success) {
        logger.error('Failed to send reset password email:', {
          error: resetPasswordResult.error,
          email: to.email,
          stack: resetPasswordResult.stack
        });
        return res.status(500).json({ error: 'Failed to send reset password email' });
      }

      res.json({ success: true, message: 'Reset password email sent successfully' });
    } catch (err) {
      logger.error('Error during reset password process:', err);
      res.status(500).json({ error: 'Failed to send reset password email' });
    }
  });

  router.post('/reset-password', async(req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
      logger.warn('Missing token or password in request body');
      return res.status(400).json({ error: 'Token and password are required' });
    }

    logger.info('token:', { token });

    const validPassword = validatePassword(password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password format' });
    }

    try {
      const user = await knex('sellers')
        .where({ reset_token: token })
        .andWhere('reset_token_expiry', '>', new Date())
        .first();

      if (!user) {
        logger.warn('Invalid or expired token:', { token });
        return res.status(400).json({ error: 'Invalid or expired token' });
      }

      const now = new Date();
      if (new Date(user.reset_token_expiry) < now) {
        return res.status(400).json({ error: 'Token has expired' });
      }

      const salt = crypto.randomBytes(16).toString('hex'); // Generate a new salt
      logger.log('salt:', salt);

      const hashedPassword = await new Promise((resolve, reject) => {
        crypto.pbkdf2(password, salt, 310000, 32, 'sha256', (err, hash) => {
          if (err) {
            return reject(err);
          }
          resolve(hash);
        });
      });

      await knex('sellers').where({ reset_token: token }).update({
        hashed_password: hashedPassword,
        salt: salt,
        reset_token: null,
        reset_token_expiry: null
      });

      res.json({ success: true, message: 'Password reset successfully' });
    } catch (err) {
      logger.error('Error during password reset:', { err });
      res.status(500).json({ error: 'Failed to reset password' });
    }
  });

  router.post('/verify-email', async(req, res) => {
    const { token } = req.body;
    const reqId = generator.generateRequestId();

    if (!token) {
      return res.status(400).json({ success: false, error: 'Error' });
    }

    const emailVerified = await verifyEmailToken(knex, token);
    if (!emailVerified.success) {
      return res.status(400).json({ success: false, error: emailVerified.message });
    }

    try {
      const result = await emailService.sendEmailVerifiedNotification(
        emailVerified.email,
        emailVerified.firstName,
        reqId
      );
      if (!result.success) {
        logger.error('Failed to send email verification notification:', {
          error: result.error,
          email: emailVerified.email,
          stack: result.stack
        });
        return;
      }
      res.status(200).json({ success: true, message: 'Email Verified!' });
    } catch (error) {
      logger.error('Error sending email verification:', {
        error: error.message,
        email: emailVerified.email,
        stack: error.stack
      });
    }
  });
  return router;
}

module.exports = { emailRouter };
