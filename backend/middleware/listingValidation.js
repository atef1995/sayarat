const logger = require('../utils/logger');
const { validateCarDetails, validateImageFileType, validateSearchParameters } = require('../service/inputValidation');

/**
 * Validation middleware for listings
 */
class ListingValidation {
  /**
   * Validate listing creation data
   * @param {Object} listingData - Listing data to validate
   * @throws {Error} - Validation error
   */
  static validateCreateListing(listingData) {
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
      engine_cylinders,
      engine_liters,
      specs,
      highlight,
      autoRelist
    } = listingData;

    try {
      validateCarDetails({
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
        engine_cylinders,
        engine_liters,
        specs,
        highlight,
        autoRelist
      });
    } catch (error) {
      logger.error('Listing validation error:', { error: error.message, listingData });
      throw new Error('Invalid listing data provided');
    }
  }

  /**
   * Validate listing update data
   * @param {Object} updateData - Update data to validate
   * @throws {Error} - Validation error
   */
  static validateUpdateListing(updateData) {
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
      products,
      clientSecret
    } = updateData;

    try {
      validateCarDetails({
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
        autoRelist
      });
    } catch (error) {
      logger.error('Listing update validation error:', { error: error.message, updateData });
      throw new Error('Invalid update data provided');
    }
  }

  /**
   * Validate uploaded images
   * @param {Array} images - Array of uploaded files
   * @throws {Error} - Validation error
   */
  static validateImages(images) {
    if (!images || !Array.isArray(images)) {
      return; // No images to validate
    }

    images.forEach((file, index) => {
      if (!validateImageFileType(file.mimetype)) {
        logger.error('Invalid image file type:', {
          mimetype: file.mimetype,
          filename: file.originalname,
          index
        });
        throw new Error(`Invalid image file type: ${file.mimetype}`);
      }
    });
  }

  /**
   * Validate search parameters
   * @param {Object} searchParams - Search parameters to validate
   * @throws {Error} - Validation error
   */
  static validateSearchParams(searchParams) {
    try {
      validateSearchParameters(searchParams);
    } catch (error) {
      logger.error('Search parameters validation error:', {
        error,
        searchParams
      });
      throw new Error('Invalid search parameters');
    }
  }

  /**
   * Validate listing ID
   * @param {string} listingId - Listing ID to validate
   * @throws {Error} - Validation error
   */
  static validateListingId(listingId) {
    if (!listingId || typeof listingId !== 'string' || listingId.trim() === '') {
      throw new Error('Valid listing ID is required');
    }
  }

  /**
   * Validate pagination parameters
   * @param {Object} params - Pagination parameters
   * @returns {Object} - Validated and parsed parameters
   */
  static validatePagination(params) {
    const { page = 1, limit = 10 } = params;

    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);

    if (isNaN(parsedPage) || parsedPage < 1) {
      throw new Error('Page must be a positive integer');
    }

    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      throw new Error('Limit must be a positive integer between 1 and 100');
    }

    return {
      page: parsedPage,
      limit: parsedLimit,
      offset: (parsedPage - 1) * parsedLimit
    };
  }
}

module.exports = ListingValidation;
