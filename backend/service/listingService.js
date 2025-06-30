const { default: axios } = require('axios');
const { handleImageUpload } = require('../imageHandler');
const { insertSpecs } = require('../dbQueries/listed_cars');
const { convertToArray } = require('../utils/listingsDbHelper');
const { checkIfListingExistsAndBelongsToUser } = require('../service/listing');
const { fetchSellerIdByusername } = require('../service/userSchemas');
const logger = require('../utils/logger');

/**
 * Business logic for listing operations
 */
class ListingService {
  constructor(knex) {
    this.knex = knex;
  }

  /**
   * Handle image upload for listings
   * @param {Array} images - Array of uploaded files
   * @param {string} listingId - Listing ID
   * @returns {Array} - Uploaded image URLs
   */
  async handleListingImages(images, listingId) {
    if (!images || images.length === 0) {
      return [];
    }

    try {
      logger.info('Uploading images for listing', {
        listingId,
        imageCount: images.length
      });

      const imageUrls = await handleImageUpload(images);

      if (!imageUrls || imageUrls.length === 0) {
        logger.warn('No images uploaded successfully', { listingId });
        return [];
      }

      // Insert image URLs into database
      const insertPromises = imageUrls.map(async file => {
        try {
          const result = await this.knex('car_images')
            .insert({
              url: file.url,
              car_listing_id: listingId,
              delete_url: file.delete_url
            })
            .returning('id');

          logger.info('Image inserted successfully', {
            listingId,
            imageUrl: file.url,
            imageId: result[0]?.id || result[0]
          });

          return result;
        } catch (error) {
          logger.error('Error inserting image', {
            error: error.message,
            listingId,
            imageUrl: file.url
          });
          throw error;
        }
      });

      await Promise.all(insertPromises);

      logger.info('All images uploaded and inserted successfully', {
        listingId,
        count: imageUrls.length
      });

      return imageUrls;
    } catch (error) {
      logger.error('Error handling listing images', {
        error: error.message,
        listingId,
        imageCount: images.length
      });
      throw new Error(`Failed to upload images: ${error.message}`);
    }
  }

  /**
   * Handle specs for listings
   * @param {string|Array} specs - Specs data
   * @param {string} listingId - Listing ID
   */
  async handleListingSpecs(specs, listingId) {
    if (!specs) {
      return;
    }

    try {
      const specsArray = convertToArray(specs);

      if (specsArray.length === 0) {
        return;
      }

      logger.info('Inserting specs for listing', {
        listingId,
        specsCount: specsArray.length
      });

      await insertSpecs(this.knex, listingId, specsArray);

      logger.info('Specs inserted successfully', {
        listingId,
        specs: specsArray
      });
    } catch (error) {
      logger.error('Error handling listing specs', {
        error: error.message,
        listingId,
        specs
      });
      throw new Error(`Failed to handle specs: ${error.message}`);
    }
  }

  /**
   * Update listing specs
   * @param {string|Array} specs - New specs data
   * @param {string} listingId - Listing ID
   */
  async updateListingSpecs(specs, listingId) {
    if (!specs) {
      return;
    }

    try {
      const specsArray = convertToArray(specs);

      if (specsArray.length === 0) {
        return;
      }

      // Delete existing specs
      await this.knex('specs').where({ car_listing_id: listingId }).del();

      logger.info('Existing specs deleted for listing', { listingId });

      // Insert new specs
      await insertSpecs(this.knex, listingId, specsArray);

      logger.info('New specs inserted successfully', {
        listingId,
        specsCount: specsArray.length
      });
    } catch (error) {
      logger.error('Error updating listing specs', {
        error: error.message,
        listingId,
        specs
      });
      throw new Error(`Failed to update specs: ${error.message}`);
    }
  }

  /**
   * Handle image updates for listings
   * @param {Array} newImages - New images to upload
   * @param {Array|string} initialImagesUrls - Existing images to keep
   * @param {string} listingId - Listing ID
   */
  async handleImageUpdates(newImages, initialImagesUrls, listingId) {
    if (!newImages || newImages.length === 0) {
      return;
    }

    try {
      logger.info('Handling image updates', {
        listingId,
        newImagesCount: newImages.length,
        initialImagesUrls
      });

      // Parse initial images
      let initialImages = [];
      if (Array.isArray(initialImagesUrls)) {
        initialImages = initialImagesUrls.map(url => url.trim());
      } else if (typeof initialImagesUrls === 'string') {
        try {
          initialImages = JSON.parse(initialImagesUrls);
        } catch {
          initialImages = [];
        }
      }

      // Delete images not in the keep list
      if (initialImages.length > 0) {
        const deletedImages = await this.knex('car_images')
          .select('delete_url')
          .where('car_listing_id', listingId)
          .whereNotIn('url', initialImages)
          .del();

        logger.info('Deleted outdated images', {
          listingId,
          deletedCount: deletedImages
        });
      } else {
        // Delete all existing images
        const deletedImages = await this.knex('car_images').where('car_listing_id', listingId).del();

        logger.info('All existing images deleted', {
          listingId,
          deletedCount: deletedImages
        });
      }

      // Upload and insert new images
      await this.handleListingImages(newImages, listingId);
    } catch (error) {
      logger.error('Error handling image updates', {
        error: error.message,
        listingId,
        newImagesCount: newImages?.length
      });
      throw new Error(`Failed to update images: ${error.message}`);
    }
  }

  /**
   * Delete a single image from listing
   * @param {string} listingId - Listing ID
   * @param {string} imageUrl - Image URL to delete
   * @param {number} userId - User ID
   * @returns {boolean} - Success status
   */
  async deleteSingleImage(listingId, imageUrl, userId) {
    try {
      // Verify ownership
      const listing = await checkIfListingExistsAndBelongsToUser(listingId, userId, this.knex);
      if (!listing) {
        throw new Error('Unauthorized');
      }

      // Get image info
      const imageData = await this.knex('car_images')
        .select('delete_url')
        .where({ url: imageUrl, car_listing_id: listingId })
        .first();

      if (!imageData) {
        throw new Error('Image not found');
      }

      // Delete from external storage if delete URL exists
      if (imageData.delete_url) {
        try {
          await axios.delete(imageData.delete_url);
          logger.info('Image deleted from external storage', {
            listingId,
            imageUrl,
            deleteUrl: imageData.delete_url
          });
        } catch (error) {
          logger.warn('Failed to delete image from external storage', {
            error: error.message,
            deleteUrl: imageData.delete_url
          });
        }
      }

      // Delete from database
      const result = await this.knex('car_images').where({ url: imageUrl, car_listing_id: listingId }).del();

      if (result === 0) {
        throw new Error('Image not found in database');
      }

      logger.info('Image deleted successfully', {
        listingId,
        imageUrl,
        userId
      });

      return true;
    } catch (error) {
      logger.error('Error deleting single image', {
        error: error.message,
        listingId,
        imageUrl,
        userId
      });
      throw error;
    }
  }

  /**
   * Get seller ID by username
   * @param {string} username - Username to search
   * @returns {number|null} - Seller ID or null if not found
   */
  async getSellerIdByUsername(username) {
    try {
      const sellerId = await fetchSellerIdByusername(this.knex, username);

      if (!sellerId) {
        logger.warn('Seller not found by username', { username });
        return null;
      }

      logger.info('Seller found by username', { username, sellerId });
      return sellerId;
    } catch (error) {
      logger.error('Error fetching seller by username', {
        error: error.message,
        username
      });
      throw new Error(`Failed to find seller: ${error.message}`);
    }
  }

  /**
   * Verify listing ownership
   * @param {string} listingId - Listing ID
   * @param {number} userId - User ID
   * @returns {boolean} - Ownership status
   */
  async verifyListingOwnership(listingId, userId) {
    try {
      const listing = await checkIfListingExistsAndBelongsToUser(listingId, userId, this.knex);
      return !!listing;
    } catch (error) {
      logger.error('Error verifying listing ownership', {
        error: error.message,
        listingId,
        userId
      });
      return false;
    }
  }

  /**
   * Process search parameters and handle username filtering
   * @param {Object} searchParams - Raw search parameters
   * @returns {Object} - Processed search parameters
   */
  async processSearchParameters(searchParams) {
    const processedParams = { ...searchParams };
    if (processedParams.engine_liters) {
      processedParams.engine_liters = processedParams.engine_liters.split(',').map(Number);
      logger.info('Processed engine_liters', {
        engine_liters: processedParams.engine_liters
      });
    }

    // // Handle username search
    // if (searchParams.username) {
    //   const sellerId = await this.getSellerIdByUsername(searchParams.username);
    //   if (!sellerId) {
    //     throw new Error('User not found');
    //   }
    //   processedParams.sellerId = sellerId;
    //   delete processedParams.username; // Remove username from search params
    // }

    return processedParams;
  }
}

module.exports = ListingService;
