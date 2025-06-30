/**
 * @file listing.js
 * @description Service for handling car listings in the application.
 *
 */

/**
 * Check if a listing exists in the database.
 * This function checks if a listing with the given ID exists in the `listed_cars` table.
 * @param {number} listingId - The ID of the listing to check.
 * @param {Knex} knex knex
 * @returns {Promise<boolean>} - Returns a promise that resolves to true if the listing exists, false otherwise.
 * @throws {Error} - Throws an error if there is a problem with the database query.
 *
 */
const listingExists = async(listingId, knex) => {
  if (!listingId) {
    throw new Error('Listing ID is required');
  }

  const count = await knex('listed_cars').where({ id: listingId }).count('id as count').first();

  console.log(`Checking if listing ${listingId} exists:`, count.count > 0);

  return count.count > 0;
};

/**
 * Get a listing by its ID.
 * This function retrieves a listing from the `listed_cars` table based on the provided listing ID.
 * * @async
 * @function getListingById
 * @param {number} listingId - The ID of the listing to retrieve.
 * @param {Knex} knex knex
 * * @returns {Promise<Object>} - Returns a promise that resolves to the listing object if found, or null if not found.
 * @throws {Error} - Throws an error if there is a problem with the database query.
 */
const getListingById = async(listingId, knex) => {
  if (!listingId) {
    throw new Error('Listing ID is required');
  }

  const listing = await knex('listed_cars').where({ id: listingId }).first();

  if (!listing) {
    console.log(`Listing with ID ${listingId} not found`);
    return null;
  }

  console.log(`Listing with ID ${listingId} found:`, listing);
  return listing;
};

/**
 * Check if a listing exists and belongs to a specific user.
 * This function checks if a listing with the given ID exists in the `listed_cars` table
 * and if it belongs to the user with the specified user ID.
 * @param {number} listingId - The ID of the listing to check.
 * @param {number} userId - The ID of the user to check ownership.
 * @param {Knex} knex knex
 * * @returns {Promise<boolean>} - Returns a promise that resolves to true if the listing exists and belongs to the user, false otherwise.
 * @throws {Error} - Throws an error if there is a problem with the database query.
 */
const checkIfListingExistsAndBelongsToUser = async(listingId, userId, knex) => {
  if (!listingId || !userId) {
    throw new Error('Listing ID and User ID are required');
  }

  const count = await knex('listed_cars').where({ id: listingId, seller_id: userId }).count('id as count').first();
  console.log(`Checking if listing ${listingId} belongs to user ${userId}:`, count.count > 0);

  return count.count > 0;
};

module.exports = {
  listingExists,
  getListingById,
  checkIfListingExistsAndBelongsToUser
};
