const logger = require('../utils/logger');

const insertSpecs = async(knex, listingId, specs) => {
  if (!listingId || !specs) {
    throw new Error('Listing ID and specs are required to insert specs');
  }

  // Insert specs into the database
  const result = await knex('car_specs')
    .insert({ listing_id: listingId, ...specs })
    .onConflict('listing_id') // Handle conflict on listing_id
    .merge(); // Update existing record if conflict occurs

  if (result.rowCount === 0) {
    throw new Error('Failed to insert or update specs for the listing');
  }

  logger.info(`Specs inserted for listing ID: ${listingId}`);
};

const insertImages = async(knex, listingId, images) => {
  if (!listingId || !images || images.length === 0) {
    throw new Error('Listing ID and images are required to insert images');
  }

  // Insert images into the database
  const imageRecords = images.map(image => ({ listing_id: listingId, image_url: image }));
  const result = await knex('car_images')
    .insert(imageRecords)
    .onConflict(['listing_id', 'image_url']) // Handle conflict on listing_id and image_url
    .ignore(); // Ignore duplicates

  if (result.rowCount === 0) {
    throw new Error('Failed to insert images for the listing');
  }

  logger.info(`Images inserted for listing ID: ${listingId}`);
};

const getAllListedCars = async knex => {
  try {
    const cars = await knex('listed_cars').select('*').orderBy('created_at', 'desc');

    return cars;
  } catch (error) {
    console.error('Error fetching all listed cars:', error);
    throw error;
  }
};

const getListingsByUsername = async(knex, username) => {
  if (!username) {
    throw new Error('Username is required to get listing by username');
  }
  const listings = await knex('listed_cars as l')
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
      'l.seller_id', // Added seller_id
      's.first_name',
      's.username',
      's.phone',
      's.company_id',
      's.is_company',
      // Company information
      'c.name as company_name',
      'c.logo_url as company_logo',
      'c.subscription_status',
      'c.subscription_type as subscription_plan',
      // Note: is_verified column doesn't exist in companies table, using subscription_status instead
      knex.raw('CASE WHEN c.subscription_status = ? THEN true ELSE false END as is_verified', ['active']),
      knex.raw("STRING_AGG(DISTINCT i.url, ',') as image_urls")
    )
    .leftJoin('car_images as i', 'l.id', 'i.car_listing_id')
    .leftJoin('sellers as s', 'l.seller_id', 's.id')
    .leftJoin('companies as c', 's.company_id', 'c.id')
    .where('s.username', username)
    .orderBy('l.created_at', 'desc')
    .groupBy('l.id', 's.username')
    .first();

  if (!listings) {
    logger.info(`No listings found for username: ${username}`);
    return null;
  }
  logger.info(`Listings found for username ${username}:`, listings);
  return listings;
};

const getListingById = async(knex, listingId) => {
  if (!listingId) {
    throw new Error('Listing ID is required');
  }

  const listing = await knex('listed_cars as l')
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
      'l.seller_id', // Added seller_id
      's.first_name',
      's.username',
      's.phone',
      's.company_id',
      's.is_company',
      // Company information
      'c.name as company_name',
      'c.logo_url as company_logo',
      'c.subscription_status',
      'c.subscription_type as subscription_plan',
      // Note: is_verified column doesn't exist in companies table, using subscription_status instead
      knex.raw('CASE WHEN c.subscription_status = ? THEN true ELSE false END as is_verified', ['active']),
      knex.raw("STRING_AGG(DISTINCT i.url, ',') as image_urls")
    )
    .leftJoin('car_images as i', 'l.id', 'i.car_listing_id')
    .leftJoin('sellers as s', 'l.seller_id', 's.id')
    .leftJoin('companies as c', 's.company_id', 'c.id')
    .where('l.id', listingId)
    .groupBy(
      'l.id',
      's.first_name',
      's.username',
      's.phone',
      's.company_id',
      's.is_company',
      'c.name',
      'c.logo_url',
      'c.subscription_status',
      'c.subscription_type'
    )
    .first();

  if (!listing) {
    logger.info(`Listing with ID ${listingId} not found`);
    return null;
  }

  logger.info(`Listing with ID ${listingId} found:`, listing);
  return listing;
};

const markAsPaid = async(knex, clientSecret) => {
  if (!clientSecret) {
    throw new Error('clientSecret is required to mark as paid');
  }

  const result = await knex('listed_cars')
    .where({ client_secret: clientSecret })
    .update({ status: 'active', paid: true, updated_at: new Date() });

  if (result === 0) {
    throw new Error(`No listing found with client secret ${clientSecret} or it is already marked as paid`);
  }

  logger.info(`client secret ${clientSecret} marked as paid`);
  return result;
};

const toggleHighlight = async(knex, clientSecret, highlight) => {
  if (!clientSecret) {
    throw new Error('client secret is required to toggle highlight');
  }

  const result = await knex('listed_cars')
    .where({ client_secret: clientSecret })
    .update({ highlight, updated_at: new Date() });

  if (result === 0) {
    throw new Error(`No listing found with ID ${clientSecret}`);
  }

  logger.info(`client secret ${clientSecret} highlight toggled to ${highlight}`);
  return result;
};

module.exports = {
  insertImages,
  insertSpecs,
  getAllListedCars,
  getListingById,
  markAsPaid,
  toggleHighlight,
  getListingsByUsername
};
