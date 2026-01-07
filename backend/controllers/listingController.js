const logger = require('../utils/logger');
const ListingDatabase = require('../service/listingDatabase');
const ListingService = require('../service/listingService');
const ListingValidation = require('../middleware/listingValidation');

/**
 * Main listing controller that orchestrates listing operations
 */
class ListingController {
  constructor(knex) {
    this.knex = knex;
    this.database = new ListingDatabase(knex);
    this.service = new ListingService(knex);
  }

  /**
   * Create a new listing
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createListing(req, res) {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      logger.info('Creating listing request received', {
        requestId,
        userId: req.user?.id,
        hasImages: !!(req.files && req.files.length > 0)
      });

      // Extract and validate data
      const listingData = this.extractListingData(req.body);
      const images = req.files || [];
      const sellerId = req.user.id;

      // Validate input
      ListingValidation.validateCreateListing(listingData);
      ListingValidation.validateImages(images); // Check listing permission based on user plan
      const permission = await this.checkListingPermission(req.user);
      if (!permission.canCreate) {
        logger.warn('Listing creation limit exceeded', {
          requestId,
          userId: sellerId,
          reason: permission.reason,
          currentListings: permission.currentListings,
          limit: permission.limit
        });
        return res.status(403).json({
          success: false,
          error: 'listing_limit_exceeded',
          message: `لقد تجاوزت الحد المسموح من الإعلانات المجانية (${permission.limit}). يرجى الاشتراك للحصول على إعلانات غير محدودة.`,
          currentListings: permission.currentListings,
          limit: permission.limit,
          needsUpgrade: true,
          requestId
        });
      }

      // Create listing
      const createdListing = await this.database.createListing(listingData, sellerId);
      const listingId = createdListing.id || createdListing;

      // Handle images if present
      if (images.length > 0) {
        await this.service.handleListingImages(images, listingId);
      }

      // Handle specs if present
      if (listingData.specs) {
        await this.service.handleListingSpecs(listingData.specs, listingId);
      }

      const processingTime = Date.now() - startTime;
      logger.info('Listing created successfully', {
        requestId,
        listingId,
        sellerId,
        processingTimeMs: processingTime,
        imagesCount: images.length
      });

      res.status(201).json({
        success: true,
        message: 'Listing created successfully',
        listingId,
        processingTimeMs: processingTime
      });
    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('Error creating listing', {
        requestId,
        error: error.message,
        processingTimeMs: processingTime,
        userId: req.user?.id
      });

      res.status(error.message.includes('Invalid') ? 400 : 500).json({
        success: false,
        error: error.message || 'Failed to create listing',
        requestId
      });
    }
  }

  /**
   * Update an existing listing
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateListing(req, res) {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      const { id: listingId } = req.params;
      const userId = req.user.id;
      const images = req.files || [];
      const updateData = this.extractUpdateData(req.body);

      logger.info('Updating listing request received', {
        requestId,
        listingId,
        userId,
        hasNewImages: images.length > 0
      });

      // Validate input
      ListingValidation.validateListingId(listingId);
      ListingValidation.validateUpdateListing(updateData);
      ListingValidation.validateImages(images);

      // Verify ownership
      const hasOwnership = await this.service.verifyListingOwnership(listingId, userId);
      if (!hasOwnership) {
        return res.status(404).json({
          success: false,
          error: 'Listing not found or does not belong to the user'
        });
      }

      // Update listing
      await this.database.updateListing(listingId, updateData, userId);

      // Handle specs update
      if (updateData.specs) {
        await this.service.updateListingSpecs(updateData.specs, listingId);
      }

      // Handle image updates
      if (images.length > 0) {
        await this.service.handleImageUpdates(images, updateData.initialImagesUrls, listingId);
      }

      const processingTime = Date.now() - startTime;
      logger.info('Listing updated successfully', {
        requestId,
        listingId,
        userId,
        processingTimeMs: processingTime
      });

      res.json({
        success: true,
        message: 'Listing updated successfully',
        processingTimeMs: processingTime
      });
    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('Error updating listing', {
        requestId,
        error: error.message,
        listingId: req.params.id,
        userId: req.user?.id,
        processingTimeMs: processingTime
      });

      res.status(error.message.includes('Invalid') ? 400 : 500).json({
        success: false,
        error: error.message || 'Failed to update listing',
        requestId
      });
    }
  }

  /**
   * Get listings with pagination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getListings(req, res) {
    const requestId = this.generateRequestId();

    try {
      const pagination = ListingValidation.validatePagination(req.query);
      const userId = req.user?.id;

      logger.info('Fetching listings', {
        requestId,
        pagination,
        userId
      });

      const result = await this.database.getListings(pagination, userId);

      logger.info('Listings fetched successfully', {
        requestId,
        count: result.rows.length,
        total: result.total
      });

      res.json(result);
    } catch (error) {
      logger.error('Error fetching listings', {
        requestId,
        error: error.message,
        query: req.query
      });

      res.status(error.message.includes('Invalid') ? 400 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch listings',
        requestId
      });
    }
  }

  /**
   * Search listings with filters
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async searchListings(req, res) {
    const requestId = this.generateRequestId();

    try {
      const pagination = ListingValidation.validatePagination(req.query);
      const userId = req.user?.id;

      // Validate and process search parameters
      ListingValidation.validateSearchParams(req.query);
      const searchParams = await this.service.processSearchParameters(req.query);

      logger.info('Searching listings', {
        requestId,
        searchParams: Object.keys(searchParams),
        pagination,
        userId
      });

      const result = await this.database.searchListings(searchParams, pagination, userId);

      logger.info('Search completed successfully', {
        requestId,
        resultsCount: result.rows.length,
        total: result.total
      });

      res.json(result);
    } catch (error) {
      logger.error('Error searching listings', {
        requestId,
        error: error.message,
        query: req.query
      });

      const status = error.message.includes('Invalid') || error.message.includes('User not found') ? 400 : 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Search failed',
        requestId
      });
    }
  }

  /**
   * Get single listing by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getListingById(req, res) {
    const requestId = this.generateRequestId();

    try {
      const { id } = req.params;

      ListingValidation.validateListingId(id);

      logger.info('Fetching listing by ID', { requestId, listingId: id });

      const listing = await this.database.getListingById(id);

      if (!listing) {
        return res.status(404).json({
          success: false,
          error: 'Listing not found',
          requestId
        });
      }

      logger.info('Listing fetched successfully', {
        requestId,
        listingId: id,
        title: listing.title?.substring(0, 50)
      });

      res.json(listing);
    } catch (error) {
      logger.error('Error fetching listing by ID', {
        requestId,
        error: error.message,
        listingId: req.params.id
      });

      res.status(error.message.includes('Invalid') ? 400 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch listing',
        requestId
      });
    }
  }

  /**
   * Get user listings
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserListings(req, res) {
    const requestId = this.generateRequestId();

    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          requestId
        });
      }

      logger.info('Fetching user listings', { requestId, userId });

      const listings = await this.database.getUserListings(userId);

      logger.info('User listings fetched successfully', {
        requestId,
        userId,
        count: listings.length
      });

      res.json(listings);
    } catch (error) {
      logger.error('Error fetching user listings', {
        requestId,
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to fetch user listings',
        requestId
      });
    }
  }

  /**
   * Delete a listing
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteListing(req, res) {
    const requestId = this.generateRequestId();

    try {
      const { id: listingId } = req.params;
      const userId = req.user.id;
      const { reason } = req.body;

      ListingValidation.validateListingId(listingId);

      logger.info('Deleting listing', {
        requestId,
        listingId,
        userId,
        reason
      });

      await this.database.deleteListing(listingId, userId, reason);

      logger.info('Listing deleted successfully', {
        requestId,
        listingId,
        userId
      });

      res.json({
        success: true,
        message: 'Listing deleted successfully',
        requestId
      });
    } catch (error) {
      logger.error('Error deleting listing', {
        requestId,
        error: error.message,
        listingId: req.params.id,
        userId: req.user?.id
      });

      const status = error.message.includes('not found') || error.message.includes('unauthorized') ? 403 : 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to delete listing',
        requestId
      });
    }
  }

  /**
   * Delete single image from listing
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteSingleImage(req, res) {
    const requestId = this.generateRequestId();

    try {
      const { listingId } = req.params;
      const { imageUrl } = req.body;
      const userId = req.user.id;

      ListingValidation.validateListingId(listingId);

      if (!imageUrl) {
        return res.status(400).json({
          success: false,
          error: 'Image URL is required',
          requestId
        });
      }

      logger.info('Deleting single image', {
        requestId,
        listingId,
        imageUrl,
        userId
      });

      await this.service.deleteSingleImage(listingId, imageUrl, userId);

      logger.info('Image deleted successfully', {
        requestId,
        listingId,
        imageUrl,
        userId
      });

      res.json({
        success: true,
        message: 'Image deleted successfully',
        requestId
      });
    } catch (error) {
      logger.error('Error deleting image', {
        requestId,
        error: error.message,
        listingId: req.params.listingId,
        userId: req.user?.id
      });

      const status = error.message.includes('Unauthorized') ? 403 : error.message.includes('not found') ? 404 : 500;

      res.status(status).json({
        success: false,
        error: error.message || 'Failed to delete image',
        requestId
      });
    }
  }

  /**
   * Increment listing views
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async incrementViews(req, res) {
    const requestId = this.generateRequestId();

    try {
      const { listingId } = req.params;

      ListingValidation.validateListingId(listingId);

      logger.info('Incrementing listing views', {
        requestId,
        listingId
      });

      await this.database.incrementViews(listingId);

      res.json({
        success: true,
        requestId
      });
    } catch (error) {
      logger.error('Error incrementing views', {
        requestId,
        error: error.message,
        listingId: req.params.listingId
      });

      const status = error.message.includes('not found') ? 404 : 500;
      res.status(status).json({
        success: false,
        error: error.message || 'Failed to update views',
        requestId
      });
    }
  }

  /**
   * Get listings with strategic highlighted placement
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getListingsWithStrategy(req, res) {
    const requestId = this.generateRequestId();

    try {
      const pagination = ListingValidation.validatePagination(req.query);
      const userId = req.user?.id;

      // Extract strategy options from query parameters
      const options = {
        highlightRatio: parseFloat(req.query.highlightRatio) || 0.3,
        highlightPositions: req.query.strategy || 'distributed', // 'mixed', 'distributed', 'top-bottom'
        maxHighlightedPerPage: req.query.maxHighlighted ? parseInt(req.query.maxHighlighted) : null
      };

      logger.info('Fetching listings with highlight strategy', {
        requestId,
        pagination,
        userId,
        options
      });

      const result = await this.database.getListingsWithHighlightStrategy(pagination, userId, options);

      logger.info('Strategic listings fetched successfully', {
        requestId,
        count: result.rows.length,
        total: result.total,
        highlightedCount: result.highlightedCount,
        strategy: result.strategy
      });

      res.json({
        ...result,
        requestId,
        strategy: result.strategy
      });
    } catch (error) {
      logger.error('Error fetching strategic listings', {
        requestId,
        error: error.message,
        pagination: req.query,
        userId: req.user?.id
      });

      res.status(500).json({
        error: 'Failed to fetch listings',
        requestId
      });
    }
  }

  /**
   * Get listings with smart highlight strategy
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSmartListings(req, res) {
    const requestId = this.generateRequestId();

    try {
      const pagination = ListingValidation.validatePagination(req.query);
      const userId = req.user?.id;

      // Validate and process search parameters (same as searchListings)
      const searchParams = await this.service.processSearchParameters(req.query);
      ListingValidation.validateSearchParams(searchParams);

      // Extract smart options from query parameters
      const options = {
        preferredStrategy: req.query.strategy || 'auto',
        highlightRatio: parseFloat(req.query.highlightRatio) || 0.25,
        adaptToContent: req.query.adaptToContent !== 'false', // Default true
        searchParams // Add search parameters to options
      };

      logger.info('Fetching listings with smart strategy and filters', {
        requestId,
        searchParams: Object.keys(searchParams),
        pagination,
        userId,
        options: {
          ...options,
          searchParams: Object.keys(searchParams) // Log keys only for brevity
        }
      });

      const result = await this.database.getSmartHighlightedListings(pagination, userId, options);

      logger.info('Smart listings fetched successfully', {
        requestId,
        count: result.rows.length,
        total: result.total,
        highlightedCount: result.highlightedCount,
        strategy: result.strategy
      });

      res.json({
        ...result,
        requestId,
        smart: true
      });
    } catch (error) {
      logger.error('Error fetching smart listings', {
        requestId,
        error: error.message,
        query: req.query,
        userId: req.user?.id,
        errorType: this._classifyError(error)
      });

      // Enhanced error classification for better debugging
      let status = 500;
      let errorMessage = 'Failed to fetch smart listings';

      if (error.message.includes('Invalid') || error.message.includes('validation')) {
        status = 400;
        errorMessage = 'Invalid search parameters';
      } else if (error.message.includes('User not found')) {
        status = 400;
        errorMessage = 'User not found';
      } else if (error.message.includes('FROM-clause') || error.message.includes('table')) {
        status = 500;
        errorMessage = 'Database query error - please try again';
        logger.error('Database query architecture issue detected', {
          requestId,
          error: error.message,
          suggestion: 'Check table aliases in _applySearchFilters method'
        });
      }

      res.status(status).json({
        success: false,
        error: errorMessage,
        requestId
      });
    }
  }

  /**
   * Enhanced Error Handling for Smart Listings
   *
   * Provides detailed error classification and logging for smart listings endpoint.
   * Handles database query errors, validation errors, and search parameter issues.
   *
   * Error Categories:
   * - Database query errors (table alias issues, syntax errors)
   * - Validation errors (invalid search parameters)
   * - User authentication issues
   * - Search parameter processing errors
   *
   * #TODO: Add error analytics and monitoring for production issues
   * #TODO: Implement error recovery strategies for transient failures
   * #TODO: Add user-friendly error messages for common issues
   */
  /**
   * Extract listing data from request body
   * @private
   */
  extractListingData(body) {
    const {
      title,
      car_type,
      color,
      description,
      make,
      mileage,
      model,
      price,
      transmission,
      year,
      location,
      fuel,
      currency,
      hp,
      specs,
      engine_cylinders,
      engine_liters,
      highlight,
      autoRelist,
      createdAt,
      timezone,
      products,
      clientSecret,
      // Rental-specific fields
      listingType,
      isRental,
      rentalDetails
    } = body;

    // Helper function to parse JSON strings for array fields
    const parseJsonField = (field) => {
      if (typeof field === 'string') {
        try {
          const parsed = JSON.parse(field);
          return Array.isArray(parsed) ? parsed : field;
        } catch {
          return field;
        }
      }
      return field;
    };

    // Helper function to convert string numbers to numbers
    const parseNumber = (field) => {
      if (typeof field === 'string' && field.trim() !== '') {
        const num = Number(field);
        return isNaN(num) ? field : num;
      }
      return field;
    };

    // Parse rental details if it's a string
    const parsedRentalDetails = rentalDetails && typeof rentalDetails === 'string' 
      ? JSON.parse(rentalDetails) 
      : rentalDetails;

    return {
      title,
      car_type,
      color,
      description,
      make,
      mileage: parseNumber(mileage),
      model,
      price: parseNumber(price),
      transmission,
      year: parseNumber(year),
      location,
      fuel,
      currency,
      hp: parseNumber(hp),
      specs: parseJsonField(specs),
      engine_cylinders, // Keep as string - Joi expects string
      engine_liters: parseNumber(engine_liters),
      highlight: highlight === 'true' || highlight === true,
      autoRelist: autoRelist === 'true' || autoRelist === true,
      createdAt,
      timezone,
      products: parseJsonField(products),
      clientSecret,
      // Rental-specific fields
      listingType: listingType || 'sale',
      isRental: isRental === 'true' || isRental === true,
      rentalDetails: parsedRentalDetails
    };
  }

  /**
   * Extract update data from request body
   * @private
   */
  extractUpdateData(body) {
    const {
      title,
      car_type,
      color,
      description,
      make,
      mileage,
      model,
      price,
      transmission,
      year,
      location,
      fuel,
      currency,
      hp,
      specs,
      engine_cylinders,
      engine_liters,
      highlight,
      autoRelist,
      initialImagesUrls,
      timezone,
      products,
      clientSecret
    } = body;

    return {
      title,
      car_type,
      color,
      description,
      make,
      mileage,
      model,
      price,
      transmission,
      year,
      fuel,
      location,
      currency,
      hp,
      specs,
      engine_cylinders,
      engine_liters,
      highlight,
      autoRelist,
      initialImagesUrls,
      timezone,
      products,
      clientSecret
    };
  }

  /**
   * Generate unique request ID
   * @private
   */
  generateRequestId() {
    return `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if user can create a new listing based on their plan
   * @param {Object} user - User object with account type and subscription info
   * @returns {Object} - Permission result with canCreate boolean and reason
   */
  async checkListingPermission(user) {
    try {
      // Check if user has active premium subscription
      const hasActivePremium = await this.checkActivePremiumSubscription(user.id);
      if (hasActivePremium) {
        return { canCreate: true, reason: 'premium_subscription' };
      }

      // For free users, check listing count
      const activeListingsCount = await this.database.getUserActiveListingsCount(user.id);
      const FREE_LISTING_LIMIT = 5;

      if (activeListingsCount < FREE_LISTING_LIMIT) {
        return {
          canCreate: true,
          reason: 'free_limit',
          remainingListings: FREE_LISTING_LIMIT - activeListingsCount,
          totalLimit: FREE_LISTING_LIMIT
        };
      }

      return {
        canCreate: false,
        reason: 'limit_exceeded',
        currentListings: activeListingsCount,
        limit: FREE_LISTING_LIMIT
      };
    } catch (error) {
      logger.error('Error checking listing permission', { userId: user.id, error: error.message });
      throw error;
    }
  }

  /**
   * Check if user has an active premium subscription
   * @param {string} userId - User ID
   * @returns {boolean} - True if user has active premium subscription
   */
  async checkActivePremiumSubscription(userId) {
    try {
      const subscription = await this.knex('user_subscriptions')
        .where({ seller_id: userId, status: 'active' })
        .whereNotNull('stripe_subscription_id')
        .first();

      return !!subscription;
    } catch (error) {
      logger.error('Error checking premium subscription', { userId, error: error.message });
      return false;
    }
  }

  /**
   * Get user's listing status and limits
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserListingStatus(req, res) {
    try {
      const permission = await this.checkListingPermission(req.user);
      const activeListingsCount = await this.database.getUserActiveListingsCount(req.user.id);

      res.json({
        success: true,
        status: {
          canCreate: permission.canCreate,
          reason: permission.reason,
          activeListings: activeListingsCount,
          remainingListings: permission.remainingListings || null,
          totalLimit: permission.totalLimit || null,
          accountType: req.user.accountType,
          hasActivePremium: await this.checkActivePremiumSubscription(req.user.id)
        }
      });
    } catch (error) {
      logger.error('Error getting user listing status', {
        userId: req.user.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get listing status'
      });
    }
  }

  /**
   * Validate listing data without creating (dry run)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async validateListing(req, res) {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      logger.info('Listing validation request received', {
        requestId,
        userId: req.user?.id,
        hasImages: !!(req.files && req.files.length > 0),
        dryRun: req.body.dryRun
      });

      // Extract and validate data
      const listingData = this.extractListingData(req.body);
      const images = req.files || [];
      const sellerId = req.user.id;

      // Perform all validations without creating the listing
      const validationResults = await this.performValidation(listingData, images, sellerId, requestId);

      const processingTime = Date.now() - startTime;

      if (validationResults.valid) {
        logger.info('Listing validation successful', {
          requestId,
          sellerId,
          processingTimeMs: processingTime,
          warnings: validationResults.warnings?.length || 0
        });

        res.status(200).json({
          valid: true,
          message: 'Listing data is valid',
          warnings: validationResults.warnings,
          processingTimeMs: processingTime,
          requestId
        });
      } else {
        logger.warn('Listing validation failed', {
          requestId,
          sellerId,
          errors: validationResults.errors,
          processingTimeMs: processingTime
        });

        res.status(400).json({
          valid: false,
          errors: validationResults.errors,
          warnings: validationResults.warnings,
          processingTimeMs: processingTime,
          requestId
        });
      }
    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('Error during listing validation', {
        requestId,
        error: error.message,
        processingTimeMs: processingTime,
        userId: req.user?.id
      });

      res.status(500).json({
        valid: false,
        errors: ['An unexpected error occurred during validation'],
        message: 'Validation service temporarily unavailable',
        processingTimeMs: processingTime,
        requestId
      });
    }
  }

  /**
   * Validate specific fields (for real-time validation)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async validateFields(req, res) {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      logger.info('Field validation request received', {
        requestId,
        userId: req.user?.id,
        fields: Object.keys(req.body).filter(key => !['dryRun', 'userId'].includes(key))
      });

      const fieldsData = req.body;
      const sellerId = req.user.id;

      // Validate only the provided fields
      const validationResults = await this.validateSpecificFields(fieldsData, sellerId, requestId);

      const processingTime = Date.now() - startTime;

      res.status(200).json({
        valid: validationResults.valid,
        errors: validationResults.errors,
        warnings: validationResults.warnings,
        processingTimeMs: processingTime,
        requestId
      });
    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error('Error during field validation', {
        requestId,
        error: error.message,
        processingTimeMs: processingTime,
        userId: req.user?.id
      });

      res.status(500).json({
        valid: false,
        errors: ['Field validation failed'],
        processingTimeMs: processingTime,
        requestId
      });
    }
  }

  /**
   * Health check for validation service
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getValidationHealth(req, res) {
    try {
      res.status(200).json({
        status: 'healthy',
        message: 'Validation service is operational',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        message: 'Validation service is not operational',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Perform comprehensive validation on listing data
   * @param {Object} listingData - Listing data to validate
   * @param {Array} images - Array of uploaded images
   * @param {string} sellerId - Seller ID
   * @param {string} requestId - Request ID for logging
   * @returns {Object} Validation results
   */
  async performValidation(listingData, images, sellerId, requestId) {
    const results = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      // 1. Input validation
      ListingValidation.validateCreateListing(listingData);
      ListingValidation.validateImages(images);

      // 2. Check listing permission based on user plan
      const permission = await this.checkListingPermission({ id: sellerId });
      if (!permission.canCreate) {
        results.valid = false;
        results.errors.push(
          `لقد تجاوزت الحد المسموح من الإعلانات المجانية (${permission.limit}). يرجى الاشتراك للحصول على إعلانات غير محدودة.`
        );
        return results;
      }

      // 3. Business logic validation
      const businessValidation = await this.validateBusinessRules(listingData, sellerId);
      if (!businessValidation.valid) {
        results.valid = false;
        results.errors.push(...businessValidation.errors);
      }
      if (businessValidation.warnings?.length > 0) {
        results.warnings.push(...businessValidation.warnings);
      }

      // 4. Image validation (if present)
      if (images.length > 0) {
        const imageValidation = await this.validateImages(images);
        if (!imageValidation.valid) {
          results.valid = false;
          results.errors.push(...imageValidation.errors);
        }
        if (imageValidation.warnings?.length > 0) {
          results.warnings.push(...imageValidation.warnings);
        }
      }

      // 5. Specs validation (if present)
      if (listingData.specs) {
        const specsValidation = await this.validateSpecs(listingData.specs);
        if (!specsValidation.valid) {
          results.valid = false;
          results.errors.push(...specsValidation.errors);
        }
        if (specsValidation.warnings?.length > 0) {
          results.warnings.push(...specsValidation.warnings);
        }
      }

      logger.info('Validation completed', {
        requestId,
        valid: results.valid,
        errorsCount: results.errors.length,
        warningsCount: results.warnings.length
      });
    } catch (error) {
      logger.error('Validation error', { requestId, error: error.message });
      results.valid = false;
      results.errors.push(error.message || 'Validation failed');
    }

    return results;
  }

  /**
   * Validate specific fields for real-time validation
   * @param {Object} fieldsData - Fields to validate
   * @param {string} sellerId - Seller ID
   * @param {string} requestId - Request ID for logging
   * @returns {Object} Validation results
   */
  async validateSpecificFields(fieldsData, sellerId, requestId) {
    const results = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      // Only validate fields that are present
      const fieldsToValidate = { ...fieldsData };
      delete fieldsToValidate.dryRun;
      delete fieldsToValidate.userId;

      // Perform partial validation
      if (Object.keys(fieldsToValidate).length > 0) {
        try {
          ListingValidation.validateCreateListing(fieldsToValidate);
        } catch (error) {
          // For field validation, we're more lenient
          results.warnings.push(error.message);
        }
      }

      logger.info('Field validation completed', {
        requestId,
        fields: Object.keys(fieldsToValidate),
        valid: results.valid
      });
    } catch (error) {
      logger.error('Field validation error', { requestId, error: error.message });
      results.valid = false;
      results.errors.push(error.message || 'Field validation failed');
    }

    return results;
  }

  /**
   * Validate business rules
   * @param {Object} listingData - Listing data
   * @param {string} sellerId - Seller ID
   * @returns {Object} Business validation results
   */
  async validateBusinessRules(listingData, _sellerId) {
    const results = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      // #TODO: Add business rule validations
      // Examples:
      // - Price reasonableness checks
      // - Duplicate listing detection
      // - Seller reputation checks
      // - Geographic location validation
      // - Make/model/year combinations validation

      // Example: Check for suspicious pricing
      if (listingData.price && listingData.year && listingData.currency?.toLowerCase().trim() === 'USD') {
        const currentYear = new Date().getFullYear();
        const carAge = currentYear - listingData.year;

        // Very basic price validation - can be enhanced
        if (listingData.price < 1000 && carAge < 5) {
          results.warnings.push('السعر قد يكون منخفض جداً للسيارة حديثة الصنع');
        }

        if (listingData.price > 1000000) {
          results.warnings.push('السعر قد يكون مرتفع جداً للسيارة');
        }
      }
    } catch (error) {
      logger.error('Business rule validation error', { error: error.message });
      results.warnings.push('تعذر فحص القواعد التجارية');
    }

    return results;
  }

  /**
   * Validate images beyond basic file type validation
   * @param {Array} images - Array of image files
   * @returns {Object} Image validation results
   */
  async validateImages(images) {
    const results = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      // Check image count
      if (images.length > 5) {
        results.valid = false;
        results.errors.push('يمكن رفع 5 صور كحد أقصى');
      }

      // Check individual image sizes
      for (const image of images) {
        if (image.size > 5 * 1024 * 1024) {
          // 5MB limit
          results.valid = false;
          results.errors.push(`الصورة ${image.originalname} كبيرة جداً (أكثر من 5MB)`);
        }
      }

      // #TODO: Add more image validations:
      // - Image dimension checks
      // - Image quality checks
      // - Duplicate image detection
      // - Content validation (car vs non-car images)
    } catch (error) {
      logger.error('Image validation error', { error: error.message });
      results.valid = false;
      results.errors.push('فشل في فحص الصور');
    }

    return results;
  }

  /**
   * Validate specs data
   * @param {Array|string} specs - Specs data
   * @returns {Object} Specs validation results
   */
  async validateSpecs(specs) {
    const results = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      // Convert string to array if needed
      const specsArray = Array.isArray(specs) ? specs : [specs];

      // Check for reasonable number of specs
      if (specsArray.length > 20) {
        results.warnings.push('عدد المواصفات كبير، يُفضل التركيز على أهم المواصفات');
      }

      // Check for empty specs
      const nonEmptySpecs = specsArray.filter(spec => spec && spec.trim());
      if (nonEmptySpecs.length !== specsArray.length) {
        results.warnings.push('توجد مواصفات فارغة، سيتم إزالتها');
      }

      // #TODO: Add more spec validations:
      // - Check for inappropriate content
      // - Validate against known car specifications
      // - Check for duplicate specs
    } catch (error) {
      logger.error('Specs validation error', { error: error.message });
      results.warnings.push('تعذر فحص المواصفات');
    }

    return results;
  }

  /**
   * Classify error types for better error handling and debugging
   * @private
   * @param {Error} error - The error object
   * @returns {string} - Error classification
   */
  _classifyError(error) {
    const message = error.message.toLowerCase();

    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation_error';
    } else if (message.includes('from-clause') || message.includes('table') || message.includes('alias')) {
      return 'database_query_error';
    } else if (message.includes('user not found') || message.includes('unauthorized')) {
      return 'authorization_error';
    } else if (message.includes('timeout') || message.includes('connection')) {
      return 'database_connection_error';
    } else if (message.includes('syntax') || message.includes('sql')) {
      return 'sql_syntax_error';
    }

    return 'unknown_error';
  }
}

module.exports = ListingController;
