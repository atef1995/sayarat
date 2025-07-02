require('@dotenvx/dotenvx').config();
const knex = require('./backend/config/database');

async function testDatabase() {
  try {
    console.log('Testing database connection...');

    // Test if table exists
    const tableExists = await knex.schema.hasTable('all_cars');
    console.log('Table all_cars exists:', tableExists);

    if (tableExists) {
      // Count total rows
      const count = await knex('all_cars').count('* as count').first();
      console.log('Total rows in all_cars:', count.count);

      // Get first 5 rows
      const sample = await knex('all_cars').limit(5);
      console.log('Sample data:', sample);

      // Test distinct makes
      const makes = await knex('all_cars').distinct('make').select('make');
      console.log('Distinct makes:', makes);
    }

    process.exit(0);
  } catch (error) {
    console.error('Database test failed:', error);
    process.exit(1);
  }
}

testDatabase();
