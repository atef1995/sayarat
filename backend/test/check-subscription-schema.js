/**
 * Test script to check subscription table schema and run migration if needed
 */
require('@dotenvx/dotenvx').config();
const knex = require('knex');
const knexConfig = require('../knexFile');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

async function checkAndMigrateSchema() {
  console.log('🔧 Environment variables loaded with dotenvx');
  console.log(`📊 Database host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`📊 Database name: ${process.env.DB_NAME || 'not set'}`);
  console.log(`📊 Environment: ${environment}`);

  const db = knex(config);
  try {
    console.log('🔍 Checking user_subscriptions table schema...');

    // Test database connection
    try {
      await db.raw('SELECT 1+1 as result');
      console.log('✅ Database connection successful');
    } catch (connectionError) {
      console.error('❌ Database connection failed:', connectionError.message);
      console.error('💡 Please check your database configuration and ensure the database is running');
      return;
    }

    // Check if table exists
    const tableExists = await db.schema.hasTable('user_subscriptions');
    if (!tableExists) {
      console.log('❌ user_subscriptions table does not exist');
      return;
    }

    // Check for specific columns
    const columns = [
      'cancel_at_period_end',
      'cancel_at',
      'cancellation_reason',
      'reactivation_count',
      'trial_start',
      'trial_end',
      'plan_name',
      'plan_display_name'
    ];

    const missingColumns = [];

    for (const column of columns) {
      const hasColumn = await db.schema.hasColumn('user_subscriptions', column);
      if (hasColumn) {
        console.log(`✅ Column '${column}' exists`);
      } else {
        console.log(`❌ Column '${column}' is missing`);
        missingColumns.push(column);
      }
    }
    if (missingColumns.length > 0) {
      console.log(`\n🚨 Found ${missingColumns.length} missing columns:`, missingColumns);
      console.log('🔧 Running migration to add missing columns...');

      try {
        // Run migrations
        const [batchNo, log] = await db.migrate.latest();
        console.log(`✅ Migration completed successfully. Batch: ${batchNo}`);
        if (log.length > 0) {
          console.log('📝 Applied migrations:', log);
        } else {
          console.log('📝 No new migrations to apply');
        }
      } catch (migrationError) {
        console.error('❌ Migration failed:', migrationError.message);
        console.error('💡 Please check migration files and database permissions');
        return;
      }

      // Re-check columns
      console.log('\n🔍 Re-checking schema after migration...');
      for (const column of missingColumns) {
        const hasColumn = await db.schema.hasColumn('user_subscriptions', column);
        if (hasColumn) {
          console.log(`✅ Column '${column}' now exists`);
        } else {
          console.log(`❌ Column '${column}' still missing`);
        }
      }
    } else {
      console.log('\n✅ All required columns exist in the database');
    }
  } catch (error) {
    console.error('❌ Error checking schema:', error);
  } finally {
    await db.destroy();
  }
}

// Run the check
checkAndMigrateSchema()
  .then(() => {
    console.log('\n✅ Schema check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Schema check failed:', error);
    process.exit(1);
  });
