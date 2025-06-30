const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * Reviews routes with enhanced error handling and proper Knex usage
 * Handles review creation, responses, and retrieval with comprehensive validation
 */
function reviews(knex) {
  const router = express.Router();

  /**
   * Add a review for a car listing
   * POST /
   * @body {string} car_id - Car listing ID
   * @body {string} reviewer_id - Reviewer user ID
   * @body {number} rating - Rating (1-5)
   * @body {string} comment - Review comment
   */
  router.post('/', ensureAuthenticated, async(req, res) => {
    const { car_id, reviewer_id, rating, comment } = req.body;

    try {
      // Input validation
      const validationError = validateReviewInput({ car_id, reviewer_id, rating, comment });
      if (validationError) {
        return res.status(400).json({
          success: false,
          error: validationError
        });
      }

      // Validate knex instance
      if (!knex) {
        logger.error('Database connection not available');
        return res.status(500).json({
          success: false,
          error: 'Database connection error'
        });
      }

      // Get seller_id for the car using proper Knex syntax
      const car = await knex('listed_cars')
        .select('seller_id', 'current_owner_id', 'current_owner_type') // Include enhanced messaging fields
        .where('id', car_id)
        .first();

      if (!car) {
        logger.info('Car not found for review', { car_id });
        return res.status(404).json({
          success: false,
          error: 'Car listing not found'
        });
      }

      // Use current owner for enhanced messaging system compatibility
      const target_seller_id = car.current_owner_id || car.seller_id;

      // Check if review already exists
      const existingReview = await knex('reviews')
        .where('listing_id', car_id)
        .andWhere('reviewer_id', reviewer_id)
        .first();

      if (existingReview) {
        return res.status(409).json({
          success: false,
          error: 'Review already exists for this car'
        });
      }

      // Insert review using proper Knex syntax
      const [reviewId] = await knex('reviews').insert({
        listing_id: listing_id,
        reviewer_id,
        seller_id: target_seller_id,
        rating: parseInt(rating),
        reviewer_text: comment,
        created_at: new Date(),
        updated_at: new Date()
      });

      logger.info('Review added successfully', {
        reviewId,
        listing_id,
        reviewer_id,
        seller_id: target_seller_id,
        rating
      });

      res.status(201).json({
        success: true,
        message: 'Review added successfully',
        data: {
          review_id: reviewId,
          listing_id,
          rating: parseInt(rating)
        }
      });
    } catch (error) {
      logger.error('Error adding review', {
        error: error.message,
        stack: error.stack,
        listing_id,
        reviewer_id
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  /**
   * Seller respond to a review (only once)
   * POST /:review_id/response
   * @param {string} review_id - Review ID
   * @body {string} response - Response text
   */
  router.post('/:review_id/response', ensureAuthenticated, async(req, res) => {
    const { review_id } = req.params;
    const { response } = req.body;

    try {
      // Input validation
      if (!review_id || !response || typeof response !== 'string' || response.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Valid review ID and response text are required'
        });
      }

      if (response.length > 1000) {
        return res.status(400).json({
          success: false,
          error: 'Response text is too long (max 1000 characters)'
        });
      }

      // Validate knex instance
      if (!knex) {
        logger.error('Database connection not available');
        return res.status(500).json({
          success: false,
          error: 'Database connection error'
        });
      }

      // Check if review exists and has no response yet
      const review = await knex('reviews').select('id', 'seller_id', 'response_text').where('id', review_id).first();

      if (!review) {
        return res.status(404).json({
          success: false,
          error: 'Review not found'
        });
      }

      if (review.response_text) {
        return res.status(409).json({
          success: false,
          error: 'Response already exists for this review'
        });
      }

      // #TODO: Add authorization check - only the seller should be able to respond
      // if (review.seller_id !== req.user.id) { ... }

      // Update review with response using proper Knex syntax
      const updatedRows = await knex('reviews')
        .where('id', review_id)
        .andWhere('response_text', null) // Double-check no response exists
        .update({
          response_text: response.trim(),
          response_date: new Date(),
          updated_at: new Date()
        });

      if (updatedRows === 0) {
        return res.status(409).json({
          success: false,
          error: 'Response already exists or review not found'
        });
      }

      logger.info('Review response added successfully', {
        review_id,
        seller_id: review.seller_id
      });

      res.json({
        success: true,
        message: 'Response added successfully'
      });
    } catch (error) {
      logger.error('Error adding review response', {
        error: error.message,
        stack: error.stack,
        review_id
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  /**
   * Get all reviews for a seller by username
   * GET /seller-reviews/:username
   * @param {string} username - Seller username
   */
  router.get('/seller-reviews/:username', async(req, res) => {
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

      // Get reviews with enhanced data using proper Knex joins
      const reviews = await getSellerReviews(knex, sanitizedUsername);

      // Get review statistics
      const reviewStats = await getReviewStatistics(knex, sanitizedUsername);

      logger.info('Reviews retrieved successfully', {
        username: sanitizedUsername,
        reviewCount: reviews.length
      });

      res.json({
        success: true,
        data: {
          reviews,
          statistics: reviewStats
        }
      });
    } catch (error) {
      logger.error('Error fetching seller reviews', {
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
 * Validate review input data
 * @param {Object} reviewData - Review data to validate
 * @returns {string|null} - Error message or null if valid
 */
function validateReviewInput({ listing_id, reviewer_id, rating, comment }) {
  if (!listing_id || !reviewer_id || !rating || !comment) {
    return 'All fields are required: listing_id, reviewer_id, rating, comment';
  }

  if (typeof comment !== 'string' || comment.trim().length === 0) {
    return 'Comment must be a non-empty string';
  }

  if (comment.length > 1000) {
    return 'Comment is too long (max 1000 characters)';
  }

  const ratingNum = parseInt(rating);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return 'Rating must be a number between 1 and 5';
  }

  return null;
}

/**
 * Get seller reviews with enhanced data
 * @param {Object} knex - Knex database instance
 * @param {string} username - Seller username
 * @returns {Promise<Array>} - Array of reviews with reviewer info
 */
async function getSellerReviews(knex, username) {
  try {
    const reviews = await knex('reviews as r')
      .select(
        'r.id',
        'r.listing_id',
        'r.stars',
        'r.reviewer_text',
        'r.response_text',
        'r.created_at',
        'r.response_date',
        'reviewer.first_name as reviewer_first_name',
        'reviewer.last_name as reviewer_last_name',
        'reviewer.username as reviewer_username',
        'reviewer.picture as reviewer_picture',
        'car.title as car_title',
        'car.make as car_make',
        'car.model as car_model',
        'car.year as car_year'
      )
      .join('sellers as seller', 'r.seller_id', 'seller.id')
      .join('sellers as reviewer', 'r.reviewer_id', 'reviewer.id')
      .leftJoin('listed_cars as car', 'r.listing_id', 'car.id')
      .where('seller.username', username)
      .orderBy('r.created_at', 'desc');

    return reviews;
  } catch (error) {
    logger.error('Error in getSellerReviews', {
      error: error.message,
      username
    });
    throw error;
  }
}

/**
 * Get review statistics for a seller
 * @param {Object} knex - Knex database instance
 * @param {string} username - Seller username
 * @returns {Promise<Object>} - Review statistics
 */
async function getReviewStatistics(knex, username) {
  try {
    const stats = await knex('reviews as r')
      .join('sellers as s', 'r.seller_id', 's.id')
      .where('s.username', username)
      .select(
        knex.raw('COUNT(*) as total_reviews'),
        knex.raw('AVG(r.stars) as average_rating'),
        knex.raw('COUNT(CASE WHEN r.stars = 5 THEN 1 END) as five_star_count'),
        knex.raw('COUNT(CASE WHEN r.stars = 4 THEN 1 END) as four_star_count'),
        knex.raw('COUNT(CASE WHEN r.stars = 3 THEN 1 END) as three_star_count'),
        knex.raw('COUNT(CASE WHEN r.stars = 2 THEN 1 END) as two_star_count'),
        knex.raw('COUNT(CASE WHEN r.stars = 1 THEN 1 END) as one_star_count'),
        knex.raw('COUNT(CASE WHEN r.response_text IS NOT NULL THEN 1 END) as responded_reviews')
      )
      .first();

    return {
      total_reviews: parseInt(stats.total_reviews) || 0,
      average_rating: parseFloat(stats.average_rating) || 0,
      five_star_count: parseInt(stats.five_star_count) || 0,
      four_star_count: parseInt(stats.four_star_count) || 0,
      three_star_count: parseInt(stats.three_star_count) || 0,
      two_star_count: parseInt(stats.two_star_count) || 0,
      one_star_count: parseInt(stats.one_star_count) || 0,
      responded_reviews: parseInt(stats.responded_reviews) || 0,
      response_rate: stats.total_reviews > 0 ? Math.round((stats.responded_reviews / stats.total_reviews) * 100) : 0
    };
  } catch (error) {
    logger.error('Error in getReviewStatistics', {
      error: error.message,
      username
    });
    throw error;
  }
}

module.exports = reviews;
