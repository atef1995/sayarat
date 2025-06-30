const knex = require('knex');
const knexConfig = require('../knexfile');

// Get the appropriate configuration based on environment
const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

// Create knex instance
const db = knex(config);

// Test the connection
db.raw('SELECT 1')
  .then(() => {
    console.log('✅ Database connection established successfully');
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

module.exports = db;
