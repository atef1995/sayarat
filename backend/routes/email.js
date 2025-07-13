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

  router.post('/reset-password-request', async (req, res) => {
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

    // Get user details for the email
    const user = await knex('sellers').where({ email }).first();
    if (!user) {
      return res.status(400).json({ error: 'المستخدم غير موجود' });
    }

    // check if the token already exists for the email and not expired
    const existingToken = await knex('sellers')
      .where({ email: email, reset_token: resetToken })
      .andWhere('reset_token_expiry', '>', new Date())
      .first();
    if (existingToken) {
      return res.status(400).json({ error: 'تفقد البريد الإلكتروني الخاص بك، قد يكون هناك طلب إعادة تعيين كلمة المرور قيد المعالجة' });
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

      const resetPasswordResult = await emailService.sendResetPasswordEmail(email, user.first_name || 'User', reqId, resetToken, user.username);

      if (!resetPasswordResult.success) {
        logger.error('Failed to send reset password email:', {
          error: resetPasswordResult.error,
          email: to.email,
          stack: resetPasswordResult.stack
        });
        return res.status(500).json({ error: 'فشل في إرسال بريد إعادة تعيين كلمة المرور' });
      }

      res.json({ success: true, message: 'تم إرسال بريد إعادة تعيين كلمة المرور بنجاح' });
    } catch (err) {
      logger.error('Error during reset password process:', err);
      res.status(500).json({ error: 'فشل في إرسال بريد إعادة تعيين كلمة المرور' });
    }
  });

  router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
      logger.warn('Missing token or password in request body');
      return res.status(400).json({ error: 'الرمز وكلمة المرور مطلوبة' });
    }

    if (token.length !== 64) {
      logger.warn('Invalid token length:', { tokenLength: token.length });
      res.setTimeout(2000, () => {
        return res.status(400).json({ error: 'خطأ في إعادة تعيين كلمة المرور' });
      });
      return;
    }

    try {
      validatePassword(password);
    } catch (error) {
      logger.error('Password validation error:', { error: error.message });
      return res.status(400).json({ error: error.message });
    }

    try {
      const user = await knex('sellers')
        .where({ reset_token: token })
        .andWhere('reset_token_expiry', '>', new Date())
        .first();

      const now = new Date();
      logger.info('Current time:', { now: now.toISOString() });

      if (!user) {
        logger.warn('user not found or token expired:', { token });
        return res.status(400).json({ error: 'الرمز غير صالح أو منتهي الصلاحية' });
      }

      logger.info('Token expiry time:', { expiry: user.reset_token_expiry });

      if (new Date(user.reset_token_expiry) < now) {
        logger.warn('Token has expired:', {
          token,
          expiry: user.reset_token_expiry,
          current: now.toISOString()
        });
        return res.status(400).json({ error: 'الرمز غير صالح أو منتهي الصلاحية يرجى طلب اعادة تعيين كلمة المرور مرة أخرى' });
      }

      const salt = crypto.randomBytes(16).toString('hex'); // Generate a new salt
      logger.info('Generated salt for password reset');

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

      logger.info('Password reset successful for user:', { userId: user.id });
      res.json({ success: true, message: 'تم إعادة تعيين كلمة المرور بنجاح' });
    } catch (err) {
      logger.error('Error during password reset:', {
        error: err.message,
        stack: err.stack,
        token: token ? 'provided' : 'missing'
      });
      res.status(500).json({ error: 'فشل في إعادة تعيين كلمة المرور' });
    }
  });

  router.post('/verify-email', async (req, res) => {
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
        // Don't fail the verification just because notification email failed
        // The email is already verified successfully
      }

      // Always return success if email verification succeeded
      res.status(200).json({ success: true, message: 'Email Verified!' });
    } catch (error) {
      logger.error('Error sending email verification notification:', {
        error: error.message,
        email: emailVerified.email,
        stack: error.stack
      });

      // Still return success since email verification succeeded
      // Only the notification email failed
      res.status(200).json({ success: true, message: 'Email Verified!' });
    }
  });
  return router;
}

module.exports = { emailRouter };
