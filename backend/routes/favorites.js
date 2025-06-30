const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { Knex } = require('knex');
const logger = require('../utils/logger');

/**
 *
 * @param {Knex} knex - The Knex instance for database operations
 * @returns {express.Router} - Returns the configured favorites router
 */
function favoritesRouter(knex) {
  // Add to favorites
  router.post('/:listingId', ensureAuthenticated, async (req, res) => {
    const { listingId } = req.params;
    const userId = req.user.id;
    logger.info('Adding to favorites:', { listingId, userId });

    // Validate input
    if (!listingId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid listing ID'
      });
    }

    try {
      const result = await knex.transaction(async trx => {
        // Check if listing exists
        const listing = await trx('listed_cars').select('id').where('id', listingId).first();

        if (!listing) {
          throw new Error('Listing not found');
        }

        // Check if already favorited
        const existingFavorite = await trx('favorites')
          .where({
            seller_id: userId,
            car_listing_id: listingId
          })
          .first();

        if (existingFavorite) {
          return { alreadyExists: true };
        }

        // Add to favorites
        await trx('favorites').insert({
          seller_id: userId,
          car_listing_id: listingId,
          created_at: new Date()
        });

        return { alreadyExists: false };
      });

      if (result.alreadyExists) {
        return res.status(409).json({
          success: false,
          error: 'Already in favorites'
        });
      }

      res.status(201).json({
        success: true,
        message: 'Added to favorites'
      });
    } catch (error) {
      const statusCode = error.message === 'Listing not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to add to favorites'
      });
    }
  });
  // Remove from favorites
  router.delete('/:listingId', ensureAuthenticated, async (req, res) => {
    const { listingId } = req.params;
    const userId = req.user.id;

    // Validate input
    if (!listingId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid listing ID'
      });
    }

    try {
      const deletedCount = await knex('favorites')
        .where({
          seller_id: userId,
          car_listing_id: listingId
        })
        .del();

      if (deletedCount === 0) {
        return res.status(404).json({
          success: false,
          error: 'Favorite not found'
        });
      }

      res.json({
        success: true,
        message: 'Removed from favorites'
      });
    } catch (error) {
      console.error('Error removing favorite:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove from favorites'
      });
    }
  });
  // Get user's favorites
  router.get('/', ensureAuthenticated, async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Cap at 50
    const offset = (pageNum - 1) * limitNum;

    try {
      // Get favorites with proper joins and aggregation
      const favorites = await knex('favorites as f')
        .select([
          'l.*',
          'f.created_at as favorited_at',
          knex.raw('ARRAY_AGG(ci.url ORDER BY ci.id) as image_urls'),
          knex.raw('COUNT(*) OVER() as total_count')
        ])
        .join('listed_cars as l', 'f.car_listing_id', 'l.id')
        .leftJoin('car_images as ci', 'l.id', 'ci.car_listing_id')
        .where('f.seller_id', userId)
        .andWhere('l.status', '!=', 'deleted') // Only active listings
        .groupBy([
          'l.id',
          'l.title',
          'l.make',
          'l.model',
          'l.year',
          'l.price',
          'l.mileage',
          'l.created_at',
          'l.updated_at',
          'l.status',
          'l.seller_id',
          'f.created_at'
        ])
        .orderBy('f.created_at', 'desc')
        .limit(limitNum)
        .offset(offset);

      // Process the results
      const processedFavorites = favorites.map(favorite => ({
        ...favorite,
        image_urls: favorite.image_urls ? favorite.image_urls.filter(url => url !== null) : [],
        total_count: parseInt(favorite.total_count) || 0
      }));

      const totalCount = processedFavorites.length > 0 ? processedFavorites[0].total_count : 0;
      const totalPages = Math.ceil(totalCount / limitNum);

      res.json({
        success: true,

        favorites: processedFavorites.map(({ total_count, ...favorite }) => favorite),
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limitNum,
          hasNext: pageNum < totalPages,
          hasPrevious: pageNum > 1
        }
      });
    } catch (error) {
      console.error('Error fetching favorites:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch favorites'
      });
    }
  });

  // Check if a listing is favorited by the user
  router.get('/:listingId/status', ensureAuthenticated, async (req, res) => {
    const { listingId } = req.params;
    const userId = req.user.id;

    // Validate input
    if (!listingId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid listing ID'
      });
    }

    try {
      const favorite = await knex('favorites')
        .where({
          seller_id: userId,
          car_listing_id: listingId
        })
        .first();

      res.json({
        success: true,
        isFavorited: !!favorite,
        favoritedAt: favorite ? favorite.created_at : null
      });
    } catch (error) {
      console.error('Error checking favorite status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check favorite status'
      });
    }
  });

  return router;
}

module.exports = favoritesRouter;
