const logger = require('../utils/logger');
const { DbCache } = require('./dbCache');

const dbCache = new DbCache();

const fetchFromDb = async (db, collectionName, query) => {
  // Check if the result is cached
  const cacheKey = `${collectionName}:${JSON.stringify(query)}`;
  if (dbCache.has(cacheKey)) {
    logger.info(`Cache hit for ${cacheKey}`);
    return dbCache.get(cacheKey);
  }

  // If not cached, fetch from the database
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM ${collectionName} WHERE ?`;
    db.all(sql, query, (err, rows) => {
      if (err) {
        console.error(`Error fetching from ${collectionName}:`, err);
        return reject(err);
      }
      logger.info(`Fetched ${rows.length} rows from ${collectionName} with query:`, { query });

      // Cache the result
      dbCache.set(cacheKey, rows);

      resolve(rows);
    });
  });
};
/**
 * Fetch distinct values from a specific column in a collection.
 * This function retrieves distinct values from a specified column in a given collection.
 * @param {Knex} knex - The Knex database instance.
 * @param {string} collectionName - The name of the collection (table) to query.
 * @param {string} column - The column name to fetch distinct values from.
 * @returns {Promise<Array>} - Returns a promise that resolves to an array of distinct values.
 * @throws {Error} - Throws an error if there is a problem with the database query.
 */
const fetchDistinctFromDb = async (knex, collectionName, column) => {
  // Check if the result is cached
  const cacheKey = `${collectionName}:distinct:${column}`;
  if (dbCache.has(cacheKey)) {
    logger.info(`Cache hit for ${cacheKey}`);
    return dbCache.get(cacheKey);
  }

  // If not cached, fetch distinct values from the database
  const row = await knex(collectionName).distinct(column).select(column);
  // Cache the result
  dbCache.set(cacheKey, row);
  logger.info(`Fetched ${row.length} distinct values from ${collectionName}.${column}`);
  return row.map(r => r[column]);
};

/**
 *
 * @param {Knex} knex - The Knex database instance.
 * @param {string} make - The make of the car to fetch models for.
 * @returns {Promise<Array>} - Returns a promise that resolves to an array of models for the specified make.
 * @throws {Error} - Throws an error if there is a problem with the database query.
 */
const fetchModelsByMake = async (knex, make) => {
  if (!make) {
    throw new Error('Make is required to fetch models');
  }
  // Check if the result is cached
  const cacheKey = `models:${make}`;
  if (dbCache.has(cacheKey)) {
    logger.info(`Cache hit for ${cacheKey} for make: ${make}`);

    return dbCache.get(cacheKey);
  }

  // If not cached, fetch models by make from the database
  const models = await knex('all_cars').select('model').whereRaw('LOWER(make) = ?', [make.toLowerCase()]).distinct();

  const modelsArray = models.map(model => model.model);
  // Cache the result
  dbCache.set(cacheKey, modelsArray);

  logger.info(`Fetched ${models.length} models for make: ${make}`);
  return modelsArray;
};

const fetchModelsByMakes = async (knex, makes) => {
  if (!makes || makes.length === 0) {
    throw new Error('Makes are required to fetch models');
  }

  const models = await knex('all_cars')
    .select('model')
    .whereIn('make', makes)
    .distinct();

  logger.info('Fetched models for makes:', {
    models
  });
  const modelsArray = models.map(model => model.model);
  // Cache the result
  return modelsArray;
};

module.exports = {
  fetchFromDb,
  fetchDistinctFromDb,
  fetchModelsByMake,
  fetchModelsByMakes
};
