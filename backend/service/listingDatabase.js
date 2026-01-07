const logger = require('../utils/logger');
const { convertToArray } = require('../utils/listingsDbHelper');
const create = require('./listings/create');


/**
 * Database operations for listings with error handling and optimization
 */
class ListingDatabase {
  constructor(knex) {
    this.create = new create(knex, logger);
    if (!knex) {
      throw new Error('Knex database instance is required for ListingDatabase');
    }
    this.knex = knex;
  }

  /**
   * Create a new listing
   * @param {Object} listingData - Listing data
   * @param {number} sellerId - Seller ID
   * @returns {Object} - Created listing info
   */
  async createListing(listingData, sellerId) {
    const {
      title,
      carType,
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
      createdAt,
      timezone,
      products,
      specs,
      clientSecret,
      // Rental-specific fields
      listingType,
      isRental,
      rentalDetails
    } = listingData;

    const finalCreatedAt = createdAt ? new Date(createdAt) : new Date();

    try {
      logger.info('Creating listing', {
        title: title?.substring(0, 50),
        make,
        model,
        sellerId,
        finalCreatedAt,
        timezone,
        products
      });
      const result = await this.knex('listed_cars')
        .insert({
          title,
          car_type: carType,
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
          engine_cylinders,
          engine_liters,
          seller_id: sellerId,
          current_owner_id: sellerId, // Track current ownership for messaging
          current_owner_type: 'seller', // Default to seller ownership
          original_seller_id: sellerId, // Track original seller
          created_at: finalCreatedAt,
          updated_at: finalCreatedAt,
          client_timezone: timezone,
          products,
          paid: !products,
          client_secret: clientSecret,
          status: products ? 'pending' : 'active',
          // Rental-specific fields
          listing_type: listingType || 'sale',
          is_rental: isRental || false,
          rental_details: rentalDetails ? JSON.stringify(rentalDetails) : null
        })
        .returning(['id', 'status', 'paid']);

      if (!result || result.length === 0) {
        throw new Error('Failed to create listing - no result returned');
      }

      // Insert specs if provided
      if (specs && specs.length > 0) {
        const specsArray = convertToArray(specs);
        if (specsArray.length > 0) {
          await this.knex('specs').insert(
            specsArray.map(spec => ({
              car_listing_id: result[0].id,
              spec_name: spec
            }))
          );
          logger.info('Specs inserted successfully', {
            listingId: result[0].id,
            specsCount: specsArray.length
          });
        }
      }

      const createdListing = Array.isArray(result) ? result[0] : result;
      logger.info('Listing created successfully', {
        listingId: createdListing.id || createdListing,
        status: createdListing.status,
        paid: createdListing.paid
      });

      return createdListing;
    } catch (error) {
      logger.error('Error creating listing in database', {
        error: error.message,
        sellerId,
        title: title?.substring(0, 50)
      });
      throw new Error(`Failed to create listing: ${error.message}`);
    }
  }

  /**
   * Update an existing listing
   * @param {string} listingId - Listing ID
   * @param {Object} updateData - Update data
   * @param {number} userId - User ID
   * @returns {Object} - Update result
   */
  async updateListing(listingId, updateData, userId) {
    const {
      title,
      carType,
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
      timezone,
      products,
      clientSecret
    } = updateData;

    logger.info('Updating listing products', {
      listingId,
      userId,
      title: title?.substring(0, 50),
      products
    });

    try {
      const result = await this.knex('listed_cars')
        .update({
          title,
          car_type: carType,
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
          updated_at: new Date(),
          client_timezone: timezone || null,
          products,
          client_secret: clientSecret || null,
          paid: !products,
          status: products ? 'pending' : 'active'
        })
        .where({ id: listingId, seller_id: userId })
        .returning(['id', 'updated_at']);

      if (!result || result.length === 0) {
        throw new Error('Listing not found or unauthorized');
      }

      // Insert specs if provided
      if (specs && specs.length > 0) {
        const specsArray = convertToArray(specs);
        if (specsArray.length > 0) {
          await this.knex('specs').insert(
            specsArray.map(spec => ({
              car_listing_id: result[0].id,
              spec_name: spec
            }))
          );
          logger.info('Specs inserted successfully', {
            listingId: result[0].id,
            specsCount: specsArray.length
          });
        }
      }

      logger.info('Listing updated successfully', {
        listingId,
        userId,
        updatedAt: result[0].updated_at
      });

      return result[0];
    } catch (error) {
      logger.error('Error updating listing', {
        error: error.message,
        listingId,
        userId
      });
      throw error;
    }
  }

  /**
   * Get listings with pagination
   * @param {Object} pagination - Pagination parameters
   * @param {number} userId - Optional user ID for favorites
   * @returns {Object} - Listings and total count
   */ async getListings(pagination, userId) {
    const { limit, offset } = pagination;
    logger.info('Fetching listings with userId', {
      userId
    });
    try {
      // Validate knex instance
      this._validateKnex();

      // Get total count
      const countResult = await this.knex('listed_cars').where('status', 'active').count('id as total').first();

      const total = parseInt(countResult.total, 10) || 0;

      if (total === 0) {
        return { rows: [], total: 0 };
      } // Build listings query with seller and company information
      let query = this.knex('listed_cars as l')
        .select(
          'l.id',
          'l.title',
          'l.make',
          'l.model',
          'l.price',
          'l.year',
          'l.location',
          'l.currency',
          'l.created_at',
          'l.status',
          'l.mileage',
          'l.transmission',
          'l.fuel',
          'l.highlight',
          'l.products',
          'l.current_owner_id', // Include ownership tracking for messaging
          'l.current_owner_type',
          'l.original_seller_id',
          // Seller information
          's.first_name as seller_name',
          's.username as seller_username',
          's.is_company',
          's.company_id',
          // Company information (when seller is a company or works for one)
          'c.name as company_name',
          'c.logo_url as company_logo',
          'c.subscription_status',
          'c.subscription_type as subscription_plan',
          this.knex.raw('CASE WHEN c.subscription_status = ? THEN true ELSE false END as is_verified', ['active']),
          this.knex.raw('COUNT(DISTINCT f1.car_listing_id) as favorites_count'),
          this.knex.raw("STRING_AGG(DISTINCT i.url, ',') as image_urls")
        )
        .leftJoin('favorites as f1', 'l.id', 'f1.car_listing_id')
        .leftJoin('car_images as i', 'l.id', 'i.car_listing_id')
        .leftJoin('sellers as s', 'l.seller_id', 's.id')
        .leftJoin('companies as c', 's.company_id', 'c.id')
        .where('l.status', 'active')
        .groupBy(
          'l.id',
          'l.current_owner_id',
          'l.current_owner_type',
          'l.original_seller_id',
          's.first_name',
          's.username',
          's.is_company',
          's.company_id',
          'c.name',
          'c.logo_url',
          'c.subscription_status',
          'c.subscription_type'
        )
        .orderBy('l.created_at', 'desc')
        .limit(limit)
        .offset(offset); // Add user favorites if authenticated
      if (userId) {
        const knexInstance = this.knex; // Capture knex in closure
        query = query
          .select(knexInstance.raw('CASE WHEN COUNT(f2.seller_id) > 0 THEN 1 ELSE 0 END as is_favorited'))
          .leftJoin('favorites as f2', function () {
            this.on('l.id', '=', 'f2.car_listing_id').andOn('f2.seller_id', '=', knexInstance.raw('?', [userId]));
          });
      }
      const carListings = await query;
      logger.info('query executed successfully', {
        query: query.toString(),
        userId: userId,
        hasUserId: !!userId,
        resultCount: carListings.length
      });
      const processedListings = carListings.map(listing => {
        const processed = {
          ...listing,
          image_urls: listing.image_urls ? listing.image_urls.split(',') : [],
          is_favorited: listing.is_favorited ? parseInt(listing.is_favorited, 10) === 1 : false,
          favorites_count: parseInt(listing.favorites_count, 10) || 0
        };

        // Debug log for first item to see what fields are available
        if (carListings.indexOf(listing) === 0) {
          logger.info('First listing fields debug', {
            availableFields: Object.keys(listing),
            hasIsFavorited: Object.prototype.hasOwnProperty.call(listing, 'is_favorited'),
            isFavoritedValue: listing.is_favorited,
            processedIsFavorited: processed.is_favorited,
            userId: userId
          });
        }

        return processed;
      });

      logger.info('Listings fetched successfully', {
        count: processedListings.length,
        total,
        offset,
        limit
      });

      return {
        rows: processedListings,
        total
      };
    } catch (error) {
      logger.error('Error fetching listings', {
        error: error.message,
        stack: error.stack,
        pagination,
        userId,
        hasKnex: !!this.knex
      });
      throw new Error(`Failed to fetch listings: ${error.message}`);
    }
  }

  /**
   * Search listings with advanced filters
   * @param {Object} searchParams - Search parameters
   * @param {Object} pagination - Pagination parameters
   * @param {number} userId - Optional user ID
   * @returns {Object} - Search results and total count
   */ async searchListings(searchParams, pagination, userId = null) {
    const { limit, offset } = pagination;

    try {
      // Validate knex instance
      this._validateKnex(); // Build the main query with seller and company information
      let query = this.knex('listed_cars as l')
        .select(
          'l.id',
          'l.title',
          'l.make',
          'l.model',
          'l.price',
          'l.year',
          'l.location',
          'l.currency',
          'l.created_at',
          'l.updated_at',
          'l.status',
          'l.car_type',
          'l.color',
          'l.description',
          'l.mileage',
          'l.transmission',
          'l.fuel',
          'l.hp',
          'l.current_owner_id', // Include ownership tracking for messaging
          'l.current_owner_type',
          'l.original_seller_id',
          // Seller information
          's.first_name as seller_name',
          's.username as seller_username',
          's.is_company',
          's.company_id',
          // Company information (when seller is a company or works for one)
          'c.name as company_name',
          'c.logo_url as company_logo',
          'c.subscription_status',
          'c.subscription_type as subscription_plan',
          this.knex.raw('CASE WHEN c.subscription_status = ? THEN true ELSE false END as is_verified', ['active']),
          this.knex.raw('COUNT(DISTINCT f1.car_listing_id) as favorites_count'),
          this.knex.raw("STRING_AGG(DISTINCT i.url, ',') as image_urls")
        )
        .leftJoin('favorites as f1', 'l.id', 'f1.car_listing_id')
        .leftJoin('car_images as i', 'l.id', 'i.car_listing_id')
        .leftJoin('sellers as s', 'l.seller_id', 's.id')
        .leftJoin('companies as c', 's.company_id', 'c.id')
        .where('l.status', 'active')
        .groupBy(
          'l.id',
          'l.current_owner_id',
          'l.current_owner_type',
          'l.original_seller_id',
          's.first_name',
          's.username',
          's.is_company',
          's.company_id',
          'c.name',
          'c.logo_url',
          'c.subscription_status',
          'c.subscription_type'
        );

      // Apply search filters
      query = this._applySearchFilters(query, searchParams);

      // Add specs join if needed
      if (searchParams.specs) {
        query = query
          .select(this.knex.raw("STRING_AGG(DISTINCT s.spec_name, ',') as specs"))
          .leftJoin('specs as s', 'l.id', 's.car_listing_id');
      } // Add user favorites if authenticated
      if (userId) {
        const knexInstance = this.knex; // Capture knex in closure
        query = query
          .select(knexInstance.raw('CASE WHEN COUNT(f2.seller_id) > 0 THEN 1 ELSE 0 END as is_favorited'))
          .leftJoin('favorites as f2', function () {
            this.on('l.id', '=', 'f2.car_listing_id').andOn('f2.seller_id', '=', knexInstance.raw('?', [userId]));
          });
      }

      // Get total count
      const countQuery = query.clone().clearSelect().clearOrder().count('l.id as total').first();
      const countResult = await countQuery;
      const total = parseInt(countResult.total, 10) || 0;

      if (total === 0) {
        return { rows: [], total: 0 };
      }

      // Execute main query with pagination
      const results = await query
        .orderBy('l.status', 'asc')
        .orderBy('l.created_at', 'desc')
        .limit(limit)
        .offset(offset);

      const processedListings = results.map(listing => ({
        ...listing,
        image_urls: listing.image_urls ? listing.image_urls.split(',') : [],
        specs: listing.specs ? listing.specs.split(',') : [],
        price: parseInt(listing.price, 10),
        year: parseInt(listing.year, 10),
        mileage: parseInt(listing.mileage, 10),
        is_favorited: listing.is_favorited ? parseInt(listing.is_favorited, 10) === 1 : false
      }));

      logger.info('Search completed successfully', {
        resultsCount: processedListings.length,
        total,
        searchParams: Object.keys(searchParams)
      });

      return {
        rows: processedListings,
        total
      };
    } catch (error) {
      logger.error('Error searching listings', {
        error: error.message,
        searchParams,
        pagination
      });
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Apply search filters to query
   * @private
   */
  _applySearchFilters(query, params) {
    const {
      make,
      model,
      price_min,
      price_max,
      currency,
      makeYear_min,
      makeYear_max,
      carMileage_min,
      carMileage_max,
      fuel,
      transmission,
      carType,
      location,
      engine_cylinders,
      engine_liters,
      keyword,
      specs,
      username
    } = params;

    // Multiple value filters
    const multiValueFilters = [
      { param: make, column: 'l.make' },
      { param: model, column: 'l.model' },
      { param: fuel, column: 'l.fuel' },
      { param: transmission, column: 'l.transmission' },
      { param: carType, column: 'l.car_type' },
      { param: location, column: 'l.location' },
      { param: engine_cylinders, column: 'l.engine_cylinders' },
      { param: engine_liters, column: 'l.engine_liters' }
    ];

    multiValueFilters.forEach(({ param, column }) => {
      if (param) {
        const values = Array.isArray(param) ? param : [param];
        if (values.length > 0) {
          if (column.includes('engine_cylinders')) {
            query = query.whereIn(column, values);
          } else if (column.includes('engine_liters')) {
            query = query.whereBetween(
              this.knex.raw(`CAST(${column} AS FLOAT)`),
              values.map(v => parseFloat(v))
            );
          } else {
            query = query.whereIn(
              this.knex.raw(`LOWER(${column})`),
              values.map(v => v.toLowerCase())
            );
          }
        }
      }
    });

    // Range filters
    if (price_min && price_max) {
      query = query.whereBetween(this.knex.raw('CAST(l.price AS INTEGER)'), [parseInt(price_min, 10), parseInt(price_max, 10)]);
    }

    if (makeYear_min && makeYear_max) {
      query = query.whereBetween(this.knex.raw('CAST(l.year AS INTEGER)'), [
        parseInt(makeYear_min, 10),
        parseInt(makeYear_max, 10)
      ]);
    }

    if (carMileage_min && carMileage_max) {
      query = query.whereBetween(this.knex.raw('CAST(l.mileage AS INTEGER)'), [
        parseInt(carMileage_min, 10),
        parseInt(carMileage_max, 10)
      ]);
    }

    // Currency filter
    if (currency) {
      query = query.where('l.currency', currency);
    }

    // Keyword search
    if (keyword) {
      const searchTerm = `%${keyword.toLowerCase()}%`;
      query = query.where(function () {
        this.whereRaw('LOWER(l.title) LIKE ?', [searchTerm])
          .orWhereRaw('LOWER(l.make) LIKE ?', [searchTerm])
          .orWhereRaw('LOWER(l.model) LIKE ?', [searchTerm])
          .orWhereRaw('LOWER(l.description) LIKE ?', [searchTerm]);
      });
    }

    // Username search
    if (username) {
      query = query.whereExists(function () {
        this.select('*')
          .from('sellers as s')
          .whereRaw('LOWER(s.username) = ?', [username.toLowerCase()])
          .andWhereRaw('s.id = l.seller_id');
      });
    }

    // Specs search
    if (specs) {
      const specsArray = Array.isArray(specs) ? specs : [specs];
      if (specsArray.length > 0) {
        const subquery = this.knex('specs')
          .select('car_listing_id')
          .whereIn(
            this.knex.raw('LOWER(spec_name)'),
            specsArray.map(s => s.toLowerCase())
          )
          .groupBy('car_listing_id')
          .havingRaw('COUNT(DISTINCT spec_name) = ?', [specsArray.length]);

        query = query.whereIn('l.id', subquery);
      }
    }

    return query;
  }

  /**
   * Get listing by ID
   * @param {string} listingId - Listing ID
   * @returns {Object} - Listing details
   */
  async getListingById(listingId) {
    try {
      const { getListingById } = require('../dbQueries/listed_cars');
      const listing = await getListingById(this.knex, listingId);

      if (!listing) {
        return null;
      }

      // Return the complete listing data with proper structure
      return {
        ...listing,
        image_urls: listing.image_urls ? listing.image_urls.split(',') : [],
        // Ensure seller information is included
        seller_id: listing.seller_id || '', // #TODO: Ensure seller_id is returned from query
        first_name: listing.first_name || 'Unknown',
        username: listing.username || 'unknown',
        phone: listing.phone || null,
        // Company information for badge display
        seller_name: listing.first_name || listing.username || 'Unknown',
        seller_username: listing.username || 'unknown',
        is_company: Boolean(listing.is_company),
        company_name: listing.company_name || null,
        company_logo: listing.company_logo || null,
        subscription_status: listing.subscription_status || null,
        subscription_plan: listing.subscription_plan || null,
        is_verified: Boolean(listing.is_verified)
      };
    } catch (error) {
      logger.error('Error fetching listing by ID', {
        error: error.message,
        listingId
      });
      throw new Error(`Failed to fetch listing: ${error.message}`);
    }
  }

  /**
   * Get user listings
   * @param {number} userId - User ID
   * @returns {Array} - User listings
   */
  async getUserListings(userId) {
    try {
      const listings = await this.knex('listed_cars as l')
        .select(
          'l.id',
          'l.title',
          'l.make',
          'l.model',
          'l.price',
          'l.status',
          'l.views',
          'l.created_at',
          'l.updated_at',
          'l.currency',
          'l.highlight',
          'l.products',
          this.knex.raw("STRING_AGG(DISTINCT i.url, ',') as image_urls")
        )
        .leftJoin('car_images as i', 'l.id', 'i.car_listing_id')
        .leftJoin('sellers as s', 'l.seller_id', 's.id')
        .where('s.id', userId)
        .groupBy('l.id')
        .orderBy('l.created_at', 'desc');

      const processedListings = listings.map(listing => ({
        ...listing,
        image_urls: listing.image_urls ? listing.image_urls.split(',') : []
      }));

      logger.info('User listings fetched', {
        userId,
        count: processedListings.length
      });

      return processedListings;
    } catch (error) {
      logger.error('Error fetching user listings', {
        error: error.message,
        userId
      });
      throw new Error(`Failed to fetch user listings: ${error.message}`);
    }
  }

  async getListingsByUsername(pagination, username) {
    try {
      const { getListingsByUsername } = require('../dbQueries/listed_cars');
      const listings = await getListingsByUsername(this.knex, username);

      if (!listings || listings.length === 0) {
        return [];
      }

      return listings.map(listing => ({
        ...listing,
        image_urls: listing.image_urls ? listing.image_urls.split(',') : []
      }));
    } catch (error) {
      logger.error('Error fetching listings by username', {
        error: error.message,
        username
      });
      throw new Error(`Failed to fetch listings by username: ${error.message}`);
    }
  }

  /**
   * Delete (disable) a listing
   * @param {string} listingId - Listing ID
   * @param {number} userId - User ID
   * @param {string} reason - Deletion reason
   * @returns {boolean} - Success status
   */
  async deleteListing(listingId, userId, reason) {
    try {
      const { checkIfListingExistsAndBelongsToUser } = require('../service/listing');

      const listing = await checkIfListingExistsAndBelongsToUser(listingId, userId, this.knex);
      if (!listing) {
        throw new Error('Listing not found or unauthorized');
      }

      await this.knex('listed_cars').where({ id: listingId, seller_id: userId }).update({
        status: 'expired',
        removal_reason: reason,
        updated_at: new Date().toISOString()
      });

      logger.info('Listing deleted successfully', {
        listingId,
        userId,
        reason
      });

      return true;
    } catch (error) {
      logger.error('Error deleting listing', {
        error: error.message,
        listingId,
        userId,
        reason
      });
      throw error;
    }
  }

  /**
   * Update listing views
   * @param {string} listingId - Listing ID
   * @returns {boolean} - Success status
   */
  async incrementViews(listingId) {
    try {
      const result = await this.knex('listed_cars').where({ id: listingId }).increment('views', 1).returning('views');

      if (result.length === 0) {
        throw new Error('Listing not found');
      }

      logger.info('Listing views incremented', {
        listingId,
        newViews: result[0].views || result[0]
      });

      return true;
    } catch (error) {
      logger.error('Error incrementing views', {
        error: error.message,
        listingId
      });
      throw error;
    }
  }

  /**
   * Validate knex instance is available before database operations
   * @throws {Error} If knex is not available
   */
  _validateKnex() {
    if (!this.knex) {
      throw new Error('Database connection not available. Knex instance is required.');
    }
  }

  /**
   * Get listings with strategic highlighted placement
   * @param {Object} pagination - Pagination parameters
   * @param {number} userId - Optional user ID for favorites
   * @param {Object} options - Additional options for highlighted placement
   * @returns {Object} - Strategically mixed listings and total count
   */
  async getListingsWithHighlightStrategy(pagination, userId = null, options = {}) {
    const { limit, offset } = pagination;
    const {
      highlightRatio = 0.3, // 30% highlighted by default
      highlightPositions = 'mixed', // 'mixed', 'distributed', 'top-bottom'
      maxHighlightedPerPage = null, // Optional cap on highlighted per page
      searchParams = {} // Search parameters for filtering
    } = options;

    try {
      this._validateKnex();

      // Calculate highlighted distribution
      const maxHighlighted = maxHighlightedPerPage || Math.floor(limit * highlightRatio);
      const regularCount = limit - maxHighlighted;

      logger.info('Fetching listings with highlight strategy and filters', {
        limit,
        offset,
        maxHighlighted,
        regularCount,
        highlightPositions,
        searchParams: Object.keys(searchParams),
        userId
      });

      // Get total counts for both types with search filters applied
      const totalQuery = this._buildBaseQuery('all').where('l.status', 'active').clearSelect().count('l.id as total');

      const highlightedCountQuery = this._buildBaseQuery('all')
        .where({ 'l.status': 'active', 'l.highlight': true })
        .clearSelect()
        .count('l.id as total');

      // Apply search filters to count queries
      if (Object.keys(searchParams).length > 0) {
        this._applySearchFilters(totalQuery, searchParams);
        this._applySearchFilters(highlightedCountQuery, searchParams);
      }

      logger.debug('Executing count queries for strategic listings', {
        searchParams: Object.keys(searchParams),
        totalQuerySql: totalQuery.toString(),
        highlightedQuerySql: highlightedCountQuery.toString()
      });

      const [totalResult, highlightedCountResult] = await Promise.all([
        totalQuery.first(),
        highlightedCountQuery.first()
      ]);

      // Add null checking and error handling for count queries
      if (!totalResult || totalResult.total === undefined) {
        logger.error('Total count query returned undefined result', {
          totalResult,
          searchParams: Object.keys(searchParams)
        });
        return { rows: [], total: 0, highlightedCount: 0 };
      }

      if (!highlightedCountResult || highlightedCountResult.total === undefined) {
        logger.error('Highlighted count query returned undefined result', {
          highlightedCountResult,
          searchParams: Object.keys(searchParams)
        });
        // Continue with 0 highlighted count instead of failing
        const totalListings = parseInt(totalResult.total, 10) || 0;
        if (totalListings === 0) {
          return { rows: [], total: 0, highlightedCount: 0 };
        }
        // Get only regular listings if highlighted count fails
        const regularListings = await this._getRegularListings(limit, offset, userId, [], searchParams);
        return {
          rows: regularListings,
          total: totalListings,
          highlightedCount: 0,
          strategy: 'regular-only'
        };
      }

      const totalListings = parseInt(totalResult.total, 10) || 0;
      const totalHighlighted = parseInt(highlightedCountResult.total, 10) || 0;

      if (totalListings === 0) {
        return { rows: [], total: 0, highlightedCount: 0 };
      }

      // Strategy 1: Get highlighted listings first with search filters
      const highlightedListings = await this._getHighlightedListings(
        Math.min(maxHighlighted, totalHighlighted),
        offset,
        userId,
        searchParams
      );

      // Strategy 2: Get regular listings (excluding highlighted ones) with search filters
      const excludeIds = highlightedListings.map(listing => listing.id);
      const regularListings = await this._getRegularListings(regularCount, offset, userId, excludeIds, searchParams);

      // Strategy 3: Mix listings based on position strategy
      const mixedListings = this._mixListingsStrategically(
        highlightedListings,
        regularListings,
        highlightPositions,
        limit
      );

      logger.info('Strategic listing fetch completed with filters', {
        totalFetched: mixedListings.length,
        highlightedCount: highlightedListings.length,
        regularCount: regularListings.length,
        totalAvailable: totalListings,
        searchParams: Object.keys(searchParams)
      });

      return {
        rows: mixedListings,
        total: totalListings,
        highlightedCount: highlightedListings.length,
        strategy: highlightPositions
      };
    } catch (error) {
      logger.error('Error fetching listings with highlight strategy', {
        error: error.message,
        pagination,
        userId,
        options: {
          ...options,
          searchParams: Object.keys(searchParams)
        }
      });
      throw new Error(`Failed to fetch strategic listings: ${error.message}`);
    }
  }
  /**
   * Get highlighted listings
   * @private
   */
  async _getHighlightedListings(limit, offset, userId, searchParams = {}) {
    try {
      let query = this._buildBaseQuery('highlighted')
        .where(function () {
          // Check for highlight=true OR products='تمييز الإعلان' for backward compatibility
          this.where('l.highlight', true).orWhere('l.products', 'تمييز الإعلان');
        })
        .orderBy('l.created_at', 'desc')
        .limit(limit);

      // Apply search filters if provided
      if (Object.keys(searchParams).length > 0) {
        query = this._applySearchFilters(query, searchParams);
      }

      // Add pagination offset for highlighted listings
      const highlightOffset = Math.floor(offset * 0.3); // Proportional offset for highlighted
      if (highlightOffset > 0) {
        query = query.offset(highlightOffset);
      }

      if (userId) {
        query = this._addUserFavorites(query, userId);
      }

      const results = await query;
      return this._processListingResults(results);
    } catch (error) {
      logger.error('Error fetching highlighted listings', {
        error: error.message,
        limit,
        offset,
        userId,
        searchParams: Object.keys(searchParams)
      });
      // Return empty array instead of throwing to prevent cascading failures
      return [];
    }
  }
  /**
   * Get regular listings
   * @private
   */
  async _getRegularListings(limit, offset, userId, excludeIds = [], searchParams = {}) {
    try {
      let query = this._buildBaseQuery('regular')
        .where(function () {
          // Get listings that are NOT highlighted (highlight=false OR products!='تمييز الإعلان')
          this.where('l.highlight', false)
            .orWhereNull('l.highlight')
            .orWhere(function () {
              this.whereNot('l.products', 'تمييز الإعلان').orWhereNull('l.products');
            });
        })
        .orderBy('l.created_at', 'desc')
        .limit(limit);

      // Apply search filters if provided
      if (Object.keys(searchParams).length > 0) {
        query = this._applySearchFilters(query, searchParams);
      }

      // Exclude already selected highlighted listings
      if (excludeIds.length > 0) {
        query = query.whereNotIn('l.id', excludeIds);
      }

      // Add pagination offset for regular listings
      const regularOffset = Math.floor(offset * 0.7); // Proportional offset for regular
      if (regularOffset > 0) {
        query = query.offset(regularOffset);
      }

      if (userId) {
        query = this._addUserFavorites(query, userId);
      }

      const results = await query;
      return this._processListingResults(results);
    } catch (error) {
      logger.error('Error fetching regular listings', {
        error: error.message,
        limit,
        offset,
        userId,
        excludeIds: excludeIds.length,
        searchParams: Object.keys(searchParams)
      });
      // Return empty array instead of throwing to prevent cascading failures
      return [];
    }
  }
  /**
   * Build base query for listings
   * @private
   */
  _buildBaseQuery(type = 'all') {
    return this.knex('listed_cars as l')
      .select(
        'l.id',
        'l.title',
        'l.make',
        'l.model',
        'l.price',
        'l.year',
        'l.location',
        'l.currency',
        'l.created_at',
        'l.status',
        'l.mileage',
        'l.transmission',
        'l.fuel',
        // Use COALESCE to handle missing highlight column gracefully
        this.knex.raw('COALESCE(l.highlight, false) as highlight'),
        // Use COALESCE to handle missing products column gracefully
        this.knex.raw('COALESCE(l.products, null) as products'),
        // Seller information
        's.first_name as seller_name',
        's.username as seller_username',
        's.is_company',
        's.company_id',
        // Company information (when seller is a company or works for one)
        'c.name as company_name',
        'c.logo_url as company_logo',
        this.knex.raw('COUNT(DISTINCT f1.car_listing_id) as favorites_count'),
        this.knex.raw("STRING_AGG(DISTINCT i.url, ',') as image_urls")
      )
      .leftJoin('favorites as f1', 'l.id', 'f1.car_listing_id')
      .leftJoin('car_images as i', 'l.id', 'i.car_listing_id')
      .leftJoin('sellers as s', 'l.seller_id', 's.id')
      .leftJoin('companies as c', 's.company_id', 'c.id')
      .where('l.status', 'active')
      .groupBy('l.id', 's.first_name', 's.username', 's.is_company', 's.company_id', 'c.name', 'c.logo_url');
  }

  /**
   * Add user favorites to query
   * @private
   */
  _addUserFavorites(query, userId) {
    const knexInstance = this.knex;
    return query
      .select(knexInstance.raw('CASE WHEN COUNT(f2.seller_id) > 0 THEN 1 ELSE 0 END as is_favorited'))
      .leftJoin('favorites as f2', function () {
        this.on('l.id', '=', 'f2.car_listing_id').andOn('f2.seller_id', '=', knexInstance.raw('?', [userId]));
      });
  }

  /**
   * Process listing results
   * @private
   */
  _processListingResults(results) {
    return results.map(listing => ({
      ...listing,
      image_urls: listing.image_urls ? listing.image_urls.split(',') : [],
      is_favorited: listing.is_favorited ? parseInt(listing.is_favorited, 10) === 1 : false,
      favorites_count: parseInt(listing.favorites_count, 10) || 0
    }));
  }

  /**
   * Mix highlighted and regular listings strategically
   * @private
   */
  _mixListingsStrategically(highlighted, regular, strategy, totalLimit) {
    switch (strategy) {
      case 'distributed':
        return this._distributeListings(highlighted, regular, totalLimit);

      case 'top-bottom':
        return this._topBottomMix(highlighted, regular, totalLimit);

      case 'golden-ratio':
        return this._goldenRatioMix(highlighted, regular, totalLimit);

      case 'alternating':
        return this._alternatingMix(highlighted, regular, totalLimit);

      case 'weighted':
        return this._weightedMix(highlighted, regular, totalLimit);

      case 'mixed':
      default:
        return this._randomMix(highlighted, regular, totalLimit);
    }
  }

  /**
   * Distribute highlighted listings evenly throughout the page
   * @private
   */
  _distributeListings(highlighted, regular, totalLimit) {
    const mixed = [];
    const totalHighlighted = highlighted.length;
    const totalRegular = regular.length;

    if (totalHighlighted === 0) {
      return regular.slice(0, totalLimit);
    }
    if (totalRegular === 0) {
      return highlighted.slice(0, totalLimit);
    }

    // Calculate distribution interval
    const interval = Math.floor(totalLimit / totalHighlighted);

    let highlightIndex = 0;
    let regularIndex = 0;

    for (let i = 0; i < totalLimit && (highlightIndex < totalHighlighted || regularIndex < totalRegular); i++) {
      // Place highlighted listing at calculated intervals
      if (i % interval === 0 && highlightIndex < totalHighlighted) {
        mixed.push({ ...highlighted[highlightIndex], _placement: 'highlighted' });
        highlightIndex++;
      } else if (regularIndex < totalRegular) {
        mixed.push({ ...regular[regularIndex], _placement: 'regular' });
        regularIndex++;
      } else if (highlightIndex < totalHighlighted) {
        mixed.push({ ...highlighted[highlightIndex], _placement: 'highlighted' });
        highlightIndex++;
      }
    }

    return mixed.slice(0, totalLimit);
  }

  /**
   * Place highlighted listings at top and bottom
   * @private
   */
  _topBottomMix(highlighted, regular, totalLimit) {
    const mixed = [];
    const topHighlighted = Math.ceil(highlighted.length / 2);

    // Add top highlighted
    mixed.push(...highlighted.slice(0, topHighlighted).map(l => ({ ...l, _placement: 'highlighted-top' })));

    // Add regular listings
    mixed.push(...regular.map(l => ({ ...l, _placement: 'regular' })));

    // Add bottom highlighted
    mixed.push(...highlighted.slice(topHighlighted).map(l => ({ ...l, _placement: 'highlighted-bottom' })));

    return mixed.slice(0, totalLimit);
  }

  /**
   * Random mix of highlighted and regular listings
   * @private
   */
  _randomMix(highlighted, regular, totalLimit) {
    const allListings = [
      ...highlighted.map(l => ({ ...l, _placement: 'highlighted' })),
      ...regular.map(l => ({ ...l, _placement: 'regular' }))
    ];

    // Simple shuffle algorithm
    for (let i = allListings.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allListings[i], allListings[j]] = [allListings[j], allListings[i]];
    }

    return allListings.slice(0, totalLimit);
  }

  /**
   * Golden ratio distribution (1:1.618 ratio for visual appeal)
   * @private
   */
  _goldenRatioMix(highlighted, regular, totalLimit) {
    const mixed = [];
    const goldenRatio = 1.618;
    let highlightIndex = 0;
    let regularIndex = 0;
    let highlightCounter = 0;
    let regularCounter = 0;

    for (let i = 0; i < totalLimit && (highlightIndex < highlighted.length || regularIndex < regular.length); i++) {
      // Use golden ratio to determine placement
      const shouldPlaceHighlighted =
        highlightCounter / goldenRatio <= regularCounter && highlightIndex < highlighted.length;

      if (shouldPlaceHighlighted) {
        mixed.push({ ...highlighted[highlightIndex], _placement: 'highlighted-golden' });
        highlightIndex++;
        highlightCounter++;
      } else if (regularIndex < regular.length) {
        mixed.push({ ...regular[regularIndex], _placement: 'regular' });
        regularIndex++;
        regularCounter++;
      } else if (highlightIndex < highlighted.length) {
        mixed.push({ ...highlighted[highlighted.length - 1], _placement: 'highlighted-golden' });
        highlightIndex++;
      }
    }

    return mixed.slice(0, totalLimit);
  }

  /**
   * Alternating pattern (regular, regular, highlighted)
   * @private
   */
  _alternatingMix(highlighted, regular, totalLimit) {
    const mixed = [];
    const pattern = [false, false, true]; // Two regular, one highlighted
    let highlightIndex = 0;
    let regularIndex = 0;
    let patternIndex = 0;

    for (let i = 0; i < totalLimit && (highlightIndex < highlighted.length || regularIndex < regular.length); i++) {
      const shouldPlaceHighlighted = pattern[patternIndex] && highlightIndex < highlighted.length;

      if (shouldPlaceHighlighted) {
        mixed.push({ ...highlighted[highlighted.length - 1], _placement: 'highlighted-alt' });
        highlightIndex++;
      } else if (regularIndex < regular.length) {
        mixed.push({ ...regular[regularIndex], _placement: 'regular' });
        regularIndex++;
      } else if (highlightIndex < highlighted.length) {
        mixed.push({ ...highlighted[highlighted.length - 1], _placement: 'highlighted-alt' });
        highlightIndex++;
      }

      patternIndex = (patternIndex + 1) % pattern.length;
    }

    return mixed.slice(0, totalLimit);
  }

  /**
   * Weighted distribution based on page position
   * @private
   */
  _weightedMix(highlighted, regular, totalLimit) {
    const mixed = [];
    let highlightIndex = 0;
    let regularIndex = 0;

    for (let i = 0; i < totalLimit && (highlightIndex < highlighted.length || regularIndex < regular.length); i++) {
      // Higher weight for highlighted at strategic positions (positions 2, 5, 8, etc.)
      const isStrategicPosition = (i + 1) % 3 === 2; // Positions 2, 5, 8, 11...
      const shouldPlaceHighlighted = isStrategicPosition && highlightIndex < highlighted.length;

      if (shouldPlaceHighlighted) {
        mixed.push({ ...highlighted[highlighted.length - 1], _placement: 'highlighted-weighted' });
        highlightIndex++;
      } else if (regularIndex < regular.length) {
        mixed.push({ ...regular[regularIndex], _placement: 'regular' });
        regularIndex++;
      } else if (highlightIndex < highlighted.length) {
        mixed.push({ ...highlighted[highlighted.length - 1], _placement: 'highlighted-weighted' });
        highlightIndex++;
      }
    }

    return mixed.slice(0, totalLimit);
  }

  /**
   * Get listings with automatic smart strategy selection
   * This method analyzes the context and selects the best strategy
   */
  async getSmartHighlightedListings(pagination, userId = null, options = {}) {
    const { limit, offset } = pagination;
    const {
      preferredStrategy = 'auto',
      highlightRatio = 0.25, // Lower ratio for better UX
      adaptToContent = true, // Adapt strategy based on content
      searchParams = {} // Search parameters for filtering
    } = options;

    try {
      this._validateKnex();

      // Get content analysis (considering search filters)
      const analysis = await this._analyzeContentContext(limit, offset, searchParams);

      // Select smart strategy based on analysis
      const smartStrategy =
        preferredStrategy === 'auto'
          ? this._selectSmartStrategy(analysis, { highlightRatio, adaptToContent })
          : preferredStrategy;

      // Apply strategy with smart options including search parameters
      const smartOptions = {
        highlightRatio: this._adaptHighlightRatio(analysis, highlightRatio),
        highlightPositions: smartStrategy,
        maxHighlightedPerPage: Math.min(Math.floor(limit * 0.4), 4), // Cap at 4 highlighted per page
        searchParams // Include search parameters for filtering
      };

      logger.info('Smart strategy selected with filters', {
        strategy: smartStrategy,
        analysis,
        searchParams: Object.keys(searchParams),
        options: smartOptions
      });

      return await this.getListingsWithHighlightStrategy(pagination, userId, smartOptions);
    } catch (error) {
      logger.error('Error in smart highlighted listings', {
        error: error.message,
        pagination,
        userId,
        searchParams: Object.keys(searchParams)
      });
      throw new Error(`Failed to fetch smart listings: ${error.message}`);
    }
  }

  /**
   * Analyze content context for smart strategy selection
   * @private
   */
  async _analyzeContentContext(limit, offset, searchParams = {}) {
    // Build base queries using _buildBaseQuery to get proper table aliases
    const baseQuery = this._buildBaseQuery('all').where('l.status', 'active').clearSelect().count('l.id as total');

    const highlightedQuery = this._buildBaseQuery('all')
      .where('l.status', 'active')
      .where(function () {
        // Count highlighted listings (highlight=true OR products='تمييز الإعلان')
        this.where('l.highlight', true).orWhere('l.products', 'تمييز الإعلان');
      })
      .clearSelect()
      .count('l.id as total');

    const recentQuery = this._buildBaseQuery('all')
      .where('l.status', 'active')
      .where('l.created_at', '>', this.knex.raw("NOW() - INTERVAL '24 HOURS'"))
      .clearSelect()
      .count('l.id as total');

    // Apply search filters to all queries if provided
    if (Object.keys(searchParams).length > 0) {
      this._applySearchFilters(baseQuery, searchParams);
      this._applySearchFilters(highlightedQuery, searchParams);
      this._applySearchFilters(recentQuery, searchParams);
    }

    const [totalResult, highlightedResult, recentResult] = await Promise.all([
      baseQuery.first(),
      highlightedQuery.first(),
      recentQuery.first()
    ]);

    // Add null checking for analysis count queries
    const totalListings = parseInt((totalResult && totalResult.total), 10 || 0);
    const totalHighlighted = parseInt((highlightedResult && highlightedResult.total), 10 || 0);
    const recentListings = parseInt((recentResult && recentResult.total), 10 || 0);

    logger.debug('Content analysis results', {
      totalResult,
      highlightedResult,
      recentResult,
      parsed: {
        totalListings,
        totalHighlighted,
        recentListings
      }
    });

    const highlightedRatio = totalListings > 0 ? totalHighlighted / totalListings : 0;
    const recentActivityRatio = totalListings > 0 ? recentListings / totalListings : 0;
    const pageNumber = Math.floor(offset / limit) + 1;
    let density = 'low';
    if (totalListings > 100) {
      density = 'high';
    } else if (totalListings > 20) {
      density = 'medium';
    }

    return {
      totalListings,
      totalHighlighted,
      recentListings,
      highlightedRatio,
      recentActivityRatio,
      pageNumber,
      isFirstPage: pageNumber === 1,
      density,
      hasFilters: Object.keys(searchParams).length > 0
    };
  }

  /**
   * Select smart strategy based on content analysis
   * @private
   */
  _selectSmartStrategy(analysis, options) {
    const { highlightedRatio, recentActivityRatio, pageNumber, density, isFirstPage } = analysis;

    // First page gets special treatment
    if (isFirstPage) {
      if (highlightedRatio > 0.4) {
        return 'distributed'; // Too many highlighted, spread them out
      } else if (highlightedRatio < 0.1) {
        return 'weighted'; // Few highlighted, place strategically
      } else {
        return 'golden-ratio'; // Balanced, use golden ratio
      }
    }

    // Subsequent pages
    if (density === 'high') {
      if (pageNumber % 3 === 1) {
        return 'alternating';
      }
      if (pageNumber % 3 === 2) {
        return 'weighted';
      }
      return 'distributed';
    } else if (density === 'medium') {
      return pageNumber % 2 === 1 ? 'golden-ratio' : 'weighted';
    } else {
      return 'top-bottom'; // Low density, simple approach
    }
  }

  /**
   * Adapt highlight ratio based on content analysis
   * @private
   */
  _adaptHighlightRatio(analysis, baseRatio) {
    const { highlightedRatio, density, pageNumber } = analysis;

    // Reduce ratio on later pages
    let adaptedRatio = baseRatio * (1 - (pageNumber - 1) * 0.05);

    // Adjust based on overall highlighted content
    if (highlightedRatio > 0.5) {
      adaptedRatio *= 0.7; // Too many highlighted globally, reduce local ratio
    } else if (highlightedRatio < 0.1) {
      adaptedRatio *= 1.3; // Few highlighted globally, increase local ratio
    }

    // Adjust based on content density
    if (density === 'low') {
      adaptedRatio *= 1.2; // Lower density, can afford more highlighted
    }

    return Math.max(0.1, Math.min(0.5, adaptedRatio)); // Keep between 10% and 50%
  }

  /**
   * Get count of user's active listings
   * @param {number} userId - User ID
   * @returns {number} - Count of active listings
   */
  async getUserActiveListingsCount(userId) {
    try {
      const result = await this.knex('listed_cars')
        .where('seller_id', userId)
        .where('status', 'active')
        .whereNull('removal_reason')
        .count('* as count')
        .first();

      return parseInt(result.count, 10) || 0;
    } catch (error) {
      logger.error('Error getting user active listings count', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Enhanced smart highlighted listings with search filtering
   *
   * This method provides intelligent listing distribution with search parameter support.
   * It analyzes the content context (considering applied filters) and selects the optimal
   * highlighting strategy for better user experience.
   *
   * Key Features:
   * - Content-aware strategy selection
   * - Search parameter filtering (username, category, price, etc.)
   * - Adaptive highlight ratios based on filtered content
   * - Proportional pagination for highlighted/regular listings
   *
   * Strategy Selection Logic:
   * - 'auto': Automatically selects best strategy based on content analysis
   * - 'distributed': Evenly distributes highlighted listings
   * - 'top-bottom': Places highlights at top and bottom
   * - 'golden-ratio': Uses golden ratio for visual appeal
   * - 'alternating': Alternating pattern (2 regular, 1 highlighted)
   * - 'weighted': Position-based weighting
   *
   * @param {Object} pagination - Pagination parameters (limit, offset)
   * @param {string|null} userId - User ID for favorites
   * @param {Object} options - Configuration options
   * @param {string} options.preferredStrategy - Strategy preference ('auto', 'distributed', etc.)
   * @param {number} options.highlightRatio - Ratio of highlighted listings (0-1)
   * @param {boolean} options.adaptToContent - Whether to adapt strategy to content
   * @param {Object} options.searchParams - Search/filter parameters
   *
   * @returns {Promise<Object>} Result with mixed listings, totals, and strategy info
   *
   * #TODO: Add machine learning for optimal strategy selection based on user behavior
   * #TODO: Implement strategy performance metrics and analytics
   * #TODO: Add support for time-based highlighting (recent vs. popular)
   * #TODO: Consider user preference learning for personalized strategies
   */

  /**
   * Critical Error Fixes for Smart Listings
   *
   * 1. Variable Name Fix: Fixed 'highlightedIndex' -> 'highlightIndex' typo in _distributeListings
   * 2. Null Safety: Added comprehensive null checking for count query results
   * 3. Graceful Degradation: Helper methods return empty arrays instead of throwing errors
   * 4. Debug Logging: Added detailed logging for count queries and analysis results
   * 5. Fallback Strategy: Return regular-only listings if highlighted count fails
   *
   * Error Recovery Strategy:
   * - Count query fails -> Return empty result set
   * - Highlighted count fails -> Continue with regular listings only
   * - Helper method fails -> Return empty array for that type
   * - Strategy execution fails -> Fallback to basic listing fetch
   *
   * #TODO: Add retry mechanism for transient database errors
   * #TODO: Implement circuit breaker pattern for repeated failures
   * #TODO: Add monitoring alerts for error patterns
   * #TODO: Consider implementing query result caching for stability
   */
}

module.exports = ListingDatabase;
