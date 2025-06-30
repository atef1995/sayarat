const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ListingController = require('../controllers/listingController');
const logger = require('../utils/logger');

/**
 * Listings Router - Clean, modular implementation
 * Handles all listing operations with proper separation of concerns
 *
 * @param {Knex} knex - The Knex database instance
 * @returns {Object} - Express router with listings routes
 */
function listings(knex) {
  logger.info('Initializing listings router');

  const listingController = new ListingController(knex);

  // Validation endpoints (dry run)
  router.post('/validate', upload.array('images', 5), ensureAuthenticated, (req, res) =>
    listingController.validateListing(req, res)
  );

  router.post('/validate-fields', ensureAuthenticated, (req, res) => listingController.validateFields(req, res));

  router.get('/validate/health', (req, res) => listingController.getValidationHealth(req, res));

  // Create new listing
  router.post('/create-listing', upload.array('images', 5), ensureAuthenticated, (req, res) =>
    listingController.createListing(req, res)
  );

  // Update existing listing
  router.put('/update/:id', upload.array('images', 5), ensureAuthenticated, (req, res) =>
    listingController.updateListing(req, res)
  );

  // Get all listings with pagination
  router.get('/', (req, res) => listingController.getListings(req, res));

  // Get strategic listings with highlight distribution
  router.get('/strategic', (req, res) => listingController.getListingsWithStrategy(req, res));

  // Get smart listings with automatic strategy selection
  router.get('/smart', (req, res) => listingController.getSmartListings(req, res));

  // Search listings with filters
  router.get('/search', (req, res) => listingController.searchListings(req, res));

  // Get single listing by ID
  router.get('/get-listing/:id', (req, res) => listingController.getListingById(req, res));

  // Get user's listings
  router.post('/user-listings', ensureAuthenticated, (req, res) => listingController.getUserListings(req, res));

  // Delete listing (soft delete)
  router.delete('/delete-listing/:id', ensureAuthenticated, (req, res) => listingController.deleteListing(req, res));

  // Delete single image from listing
  router.delete('/delete-image/:listingId', ensureAuthenticated, (req, res) =>
    listingController.deleteSingleImage(req, res)
  );

  // Increment listing views
  router.put('/:listingId/view', (req, res) => listingController.incrementViews(req, res));

  // Get user's listing status and limits
  router.get('/status', ensureAuthenticated, (req, res) => listingController.getUserListingStatus(req, res));

  logger.info('Listings router initialized successfully');
  return router;
}

module.exports = listings;
