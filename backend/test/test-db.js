/**
 * Simple database connection test
 * Run this to test if your database connection works before running migrations
 */

const knex = require('knex');
const knexConfig = require('../knexFile.js');

// Use development environment by default
const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

async function testConnection() {
  console.log('🔌 Testing database connection...');
  console.log('Environment:', environment);
  console.log('Config loaded:', config ? 'YES' : 'NO');

  const db = knex(config);

  try {
    await db.raw('SELECT 1 as test');
    console.log('✅ Database connection successful!');

    // Test if we can see tables
    const tables = await db.raw("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('📋 Available tables:', tables.rows.length);

    await db.destroy();
    console.log('✅ Connection test completed');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    await db.destroy();
    process.exit(1);
  }
}

testConnection();
