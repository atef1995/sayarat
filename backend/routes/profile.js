const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const { validateEmail } = require('../service/inputValidation');
const { generateResetToken } = require('../generator/token');
const logger = require('../utils/logger');
const router = express.Router();
const BrevoEmailService = require('../service/brevoEmailService');
const ReqIdGenerator = require('../utils/reqIdGenerator');
function profile(knex) {
  const brevoEmailService = new BrevoEmailService();
  const reqIdGenerator = new ReqIdGenerator();
  router.put('/', ensureAuthenticated, async(req, res) => {
    const reqId = reqIdGenerator.generateRequestId();
    const { firstName, lastName, phone, email: rawEmail, dateOfBirth } = req.body;
    const userId = req.user.id;

    // Input validation
    if (!firstName || !lastName || !phone || !rawEmail || !dateOfBirth) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Normalize and validate email
    const email = rawEmail.trim().toLowerCase();
    const validEmail = validateEmail(email);
    if (!validEmail) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Validate other fields
    if (firstName.length < 2 || lastName.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'First name and last name must be at least 2 characters'
      });
    }

    if (phone.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Phone number must be at least 10 digits'
      });
    }

    try {
      // Check if email exists for other users
      const existingUser = await knex('sellers')
        .select('id')
        .where('email', email)
        .andWhere('id', '!=', userId)
        .first();

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'Email already exists'
        });
      }

      // Get current user data to check if email changed
      const currentUser = await knex('sellers').select('email', 'email_verified').where('id', userId).first();

      if (!currentUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const emailChanged = currentUser.email !== email;
      const token = emailChanged ? generateResetToken() : null;

      // Update profile using transaction
      const result = await knex.transaction(async trx => {
        // Update user profile
        const updateData = {
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          email: email,
          date_of_birth: dateOfBirth,
          updated_at: new Date()
        };

        // If email changed, reset verification
        if (emailChanged) {
          updateData.email_verified = false;
          updateData.email_verification_token = token;
          updateData.email_token_expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        }

        await trx('sellers').where('id', userId).update(updateData);

        // Get updated profile
        const updatedProfile = await trx('sellers')
          .select([
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'phone',
            'date_of_birth',
            'created_at',
            'updated_at',
            'picture',
            'last_login',
            'email_verified'
          ])
          .where('id', userId)
          .first();

        return { updatedProfile, emailChanged, token };
      });

      // Send email verification if email changed (outside transaction)
      if (result.emailChanged && result.token) {
        try {
          await brevoEmailService.sendEmailVerification(email, firstName, result.token, reqId);
          logger.info('Email verification sent', {
            userId,
            email,
            token: result.token
          });
        } catch (emailError) {
          logger.error('Failed to send email verification', {
            error: emailError.message,
            userId,
            email
          });
          // Don't fail the profile update if email sending fails
        }
      }

      // Format response
      const formattedProfile = {
        id: result.updatedProfile.id,
        username: result.updatedProfile.username,
        email: result.updatedProfile.email,
        firstName: result.updatedProfile.first_name,
        lastName: result.updatedProfile.last_name,
        phone: result.updatedProfile.phone,
        dateOfBirth: result.updatedProfile.date_of_birth,
        createdAt: result.updatedProfile.created_at,
        updatedAt: result.updatedProfile.updated_at,
        picture: result.updatedProfile.picture,
        lastLogin: result.updatedProfile.last_login,
        emailVerified: result.updatedProfile.email_verified
      };

      logger.info('Profile updated successfully', {
        userId,
        emailChanged: result.emailChanged
      });

      res.status(200).json({
        success: true,
        user: formattedProfile,
        message: result.emailChanged
          ? 'Profile updated. Please check your email to verify your new email address.'
          : 'Profile updated successfully'
      });
    } catch (error) {
      logger.error('Profile update error', {
        error: error.message,
        stack: error.stack,
        userId
      });

      res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  });

  // Update profile picture
  router.put('/picture', ensureAuthenticated, async(req, res) => {
    const { picture } = req.body;
    const userId = req.user.id;

    if (!picture) {
      return res.status(400).json({
        success: false,
        error: 'Picture data is required'
      });
    }

    try {
      await knex('sellers').where('id', userId).update({
        picture,
        updated_at: new Date()
      });

      logger.info('Profile picture updated', { userId });

      res.json({
        success: true,
        message: 'Profile picture updated successfully'
      });
    } catch (error) {
      logger.error('Profile picture update error', {
        error: error.message,
        userId
      });

      res.status(500).json({
        success: false,
        error: 'Failed to update profile picture'
      });
    }
  });

  // Delete profile picture
  router.delete('/picture', ensureAuthenticated, async(req, res) => {
    const userId = req.user.id;

    try {
      await knex('sellers').where('id', userId).update({
        picture: null,
        updated_at: new Date()
      });

      logger.info('Profile picture deleted', { userId });

      res.json({
        success: true,
        message: 'Profile picture deleted successfully'
      });
    } catch (error) {
      logger.error('Profile picture deletion error', {
        error: error.message,
        userId
      });

      res.status(500).json({
        success: false,
        error: 'Failed to delete profile picture'
      });
    }
  });

  // Get profile statistics
  router.get('/stats', ensureAuthenticated, async(req, res) => {
    const userId = req.user.id;

    try {
      const stats = await knex.transaction(async trx => {
        // Get listing stats
        const listingStats = await trx('listed_cars')
          .select(
            trx.raw(`
            COUNT(*) as total_listings,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_listings,
            COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_listings,
            AVG(price) as average_price
          `)
          )
          .where('seller_id', userId)
          .first();

        // Get favorites count
        const favoritesCount = await trx('favorites').count('* as count').where('seller_id', userId).first();

        // Get messages count
        const messagesCount = await trx('messages')
          .join('conversation_participants', 'messages.conversation_id', 'conversation_participants.conversation_id')
          .count('messages.id as count')
          .where('conversation_participants.user_id', userId)
          .first();

        return {
          listings: {
            total: parseInt(listingStats.total_listings) || 0,
            active: parseInt(listingStats.active_listings) || 0,
            sold: parseInt(listingStats.sold_listings) || 0,
            averagePrice: parseFloat(listingStats.average_price) || 0
          },
          favorites: parseInt(favoritesCount.count) || 0,
          messages: parseInt(messagesCount.count) || 0
        };
      });

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      logger.error('Profile stats error', {
        error: error.message,
        userId
      });

      res.status(500).json({
        success: false,
        error: 'Failed to fetch profile statistics'
      });
    }
  });

  return router;
}

module.exports = profile;
