#!/usr/bin/env node

/**
 * Test script to verify cloud database connection
 * Run this before starting Docker containers
 */

const db = require('../config/database');
const logger = require('../utils/logger');

async function testConnection() {
  try {
    logger.info('🔍 Testing cloud database connection...');

    // Test basic connection
    await db.raw('SELECT 1 as test');
    logger.info('✅ Database connection successful');

    // Test if tables exist
    const tables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    logger.info(`📊 Found ${tables.rows.length} tables in database:`);
    tables.rows.forEach(row => {
      logger.info(`  - ${row.table_name}`);
    });

    // Test sellers table (if it exists)
    try {
      const sellersCount = await db('sellers').count('* as count').first();
      logger.info(`👥 Sellers table has ${sellersCount.count} records`);
    } catch (error) {
      logger.info('ℹ️  Sellers table not found (this is OK if you haven\'t run migrations yet)');
    }

    logger.info('🎉 Cloud database is ready for use!');
    // eslint-disable-next-line no-process-exit
    process.exit(0);

  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    logger.error('💡 Please check:');
    logger.error('  - Your DATABASE_PASSWORD environment variable');
    logger.error('  - Your ca.pem certificate file exists');
    logger.error('  - Your network connection to Aiven');
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
}

testConnection();
