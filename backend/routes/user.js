const express = require('express');
const logger = require('../utils/logger');

/**
 * User profile routes with enhanced messaging integration
 * Handles user profile retrieval with proper error handling and validation
 */
function user(knex) {
  const router = express.Router();

  /**
   * Get user profile by username
   * GET /:username
   * @param {string} username - Username to fetch profile for
   * @returns {Object} User profile with statistics
   */
  router.get('/:username', async(req, res) => {
    const { username } = req.params;

    try {
      // Input validation
      if (!username || typeof username !== 'string' || username.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Valid username is required'
        });
      }

      // Sanitize username input
      const sanitizedUsername = username.trim().toLowerCase();

      // Validate knex instance
      if (!knex) {
        logger.error('Database connection not available');
        return res.status(500).json({
          success: false,
          error: 'Database connection error'
        });
      }

      // Get user profile with enhanced statistics using Knex
      const user = await getUserProfile(knex, sanitizedUsername);

      if (!user) {
        logger.info('User not found', { username: sanitizedUsername });
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Get additional user statistics
      const userStats = await getUserStatistics(knex, user.id);

      const formattedUser = {
        id: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        createdAt: user.created_at,
        picture: user.picture,
        location: user.location,
        phone: user.phone,
        createdAt: user.created_at,
        accountType: user.role,
        isCompany: user.is_company || false,
        companyName: user.company_name || null,
        companyLogo: user.company_logo_url || null,
        companyDescription: user.company_description || null,
        companyAddress: user.company_address || null,
        companyCity: user.company_city || null,
        companyWebsite: user.company_website || null,
        companyCreatedAt: user.company_created_at || null,
        companyHeaderImage: user.company_header_image || null
      };

      // Combine user data with statistics
      const userProfile = {
        ...formattedUser,
        ...userStats
        // #TODO: Add user reviews and ratings aggregation
        // #TODO: Add user verification status
        // #TODO: Add user company membership info for enhanced messaging
      };

      logger.info('User profile retrieved successfully', {
        userId: user.id,
        username: sanitizedUsername
      });

      res.json({
        success: true,
        data: userProfile
      });
    } catch (error) {
      logger.error('Error fetching user profile', {
        error: error.message,
        stack: error.stack,
        username: req.params.username
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  return router;
}

/**
 * Get user profile data from database
 * @param {Object} knex - Knex database instance
 * @param {string} username - Username to search for
 * @returns {Promise<Object|null>} User profile data or null if not found
 */
async function getUserProfile(knex, username) {
  try {
    const user = await knex('sellers as s')
      .select(
        's.id',
        's.username',
        's.first_name',
        's.last_name',
        's.email',
        's.created_at',
        's.picture',
        's.location',
        's.phone',
        's.member_status', // Enhanced field for company member management
        's.company_id',
        's.role',
        's.is_company',
        'c.name as company_name', // Include company info for enhanced messaging
        'c.logo_url as company_logo_url',
        'c.description as company_description',
        'c.address as company_address',
        'c.city as company_city',
        'c.website as company_website',
        'c.created_at as company_created_at',
        'c.header_image_url as company_header_image'
      )
      .leftJoin('companies as c', 's.company_id', 'c.id')
      .where('s.username', username)
      .first();

    return user || null;
  } catch (error) {
    logger.error('Error in getUserProfile', {
      error: error.message,
      username
    });
    throw error;
  }
}

/**
 * Get user statistics including listings and sales
 * @param {Object} knex - Knex database instance
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User statistics
 */
async function getUserStatistics(knex, userId) {
  try {
    // Get listing statistics
    const listingStats = await knex('listed_cars')
      .select(
        knex.raw('COUNT(*) as total_listings'),
        knex.raw("COUNT(CASE WHEN status = 'active' THEN 1 END) as active_listings"),
        knex.raw("COUNT(CASE WHEN status = 'sold' THEN 1 END) as total_sales"),
        knex.raw("COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_listings")
      )
      .where('seller_id', userId)
      .first();

    // #TODO: Get user reviews and ratings statistics
    // #TODO: Get user messaging statistics (conversations, response time)
    // #TODO: Get user verification badges and trust score

    return {
      total_listings: parseInt(listingStats.total_listings) || 0,
      active_listings: parseInt(listingStats.active_listings) || 0,
      total_sales: parseInt(listingStats.total_sales) || 0,
      pending_listings: parseInt(listingStats.pending_listings) || 0,
      // Calculated fields
      sales_ratio:
        listingStats.total_listings > 0 ? Math.round((listingStats.total_sales / listingStats.total_listings) * 100) : 0
    };
  } catch (error) {
    logger.error('Error in getUserStatistics', {
      error: error.message,
      userId
    });
    throw error;
  }
}

module.exports = user;
