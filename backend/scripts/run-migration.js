/**
 * Migration Runner Script for Unified Subscription System
 *
 * This script helps run and verify the unified subscription system migration
 * using Knex migration tools with proper error handling and validation.
 *
 * Uses the existing knexfile.js configuration for database connection.
 */

const knex = require('knex');
const path = require('path');

// Import the existing knexfile configuration
const knexConfig = require('../knexFile.js');

// #TODO: Add support for multiple environment configurations
// #TODO: Implement migration scheduling and batch processing

/**
 * Get database configuration from knexfile
 * @param {string} environment - Environment name (development, production, etc.)
 * @returns {Object} Knex configuration object
 */
const getKnexConfig = (environment = 'development') => {
  console.log('🔧 Using knexfile configuration:');
  console.log(`  - Environment: ${environment}`);
  console.log(`  - NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);

  const config = knexConfig[environment];
  if (!config) {
    throw new Error(`No configuration found for environment: ${environment}`);
  }

  console.log(`  - Database: ${config.connection.database}`);
  console.log(`  - Host: ${config.connection.host}`);
  console.log(`  - SSL: ${config.connection.ssl ? 'enabled' : 'disabled'}`);

  return config;
};

/**
 * Verify database connection
 * @param {Object} db - Knex database instance
 * @returns {Promise<boolean>} Connection status
 */
async function verifyConnection(db) {
  try {
    await db.raw('SELECT 1');
    console.log('✅ Database connection verified');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Check if migration has already been applied
 * @param {Object} db - Knex database instance
 * @returns {Promise<boolean>} Migration status
 */
async function checkMigrationStatus(db) {
  try {
    // Check if migrations table exists
    const hasTable = await db.schema.hasTable('knex_migrations');
    if (!hasTable) {
      console.log('ℹ️ Migrations table does not exist - first migration');
      return false;
    }

    // Check if our specific migration has been run
    const migration = await db('knex_migrations')
      .where('name', '20250623000001_unified_subscription_system.js')
      .first();

    if (migration) {
      console.log('ℹ️ Unified subscription system migration already applied');
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Error checking migration status:', error.message);
    return false;
  }
}

/**
 * Run the migration
 * @param {Object} db - Knex database instance
 * @returns {Promise<boolean>} Migration success status
 */
async function runMigration(db) {
  try {
    console.log('🚀 Running unified subscription system migration...');

    const [batchNo, log] = await db.migrate.latest();

    if (log.length === 0) {
      console.log('ℹ️ No migrations to run');
      return true;
    }

    console.log(`✅ Migration batch ${batchNo} completed successfully`);
    console.log('📋 Applied migrations:');
    log.forEach(migration => {
      console.log(`  - ${migration}`);
    });

    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

/**
 * Verify migration results
 * @param {Object} db - Knex database instance
 * @returns {Promise<boolean>} Verification status
 */
async function verifyMigration(db) {
  try {
    console.log('🔍 Verifying migration results...');

    // Check if new columns exist
    const checks = [
      {
        table: 'user_subscriptions',
        column: 'account_type',
        description: 'Account type column in user_subscriptions'
      },
      {
        table: 'user_subscriptions',
        column: 'company_id',
        description: 'Company ID column in user_subscriptions'
      },
      {
        table: 'subscription_plans',
        column: 'target_audience',
        description: 'Target audience column in subscription_plans'
      },
      {
        table: 'sellers',
        column: 'account_type',
        description: 'Account type column in sellers'
      }
    ];

    let allChecksPass = true;

    for (const check of checks) {
      try {
        const hasColumn = await db.schema.hasColumn(check.table, check.column);
        if (hasColumn) {
          console.log(`✅ ${check.description} - OK`);
        } else {
          console.log(`❌ ${check.description} - MISSING`);
          allChecksPass = false;
        }
      } catch (error) {
        console.log(`❌ ${check.description} - ERROR: ${error.message}`);
        allChecksPass = false;
      }
    }

    // Check if new tables exist
    const tables = ['companies', 'subscription_audit_log'];

    for (const tableName of tables) {
      try {
        const hasTable = await db.schema.hasTable(tableName);
        if (hasTable) {
          console.log(`✅ Table ${tableName} - OK`);
        } else {
          console.log(`❌ Table ${tableName} - MISSING`);
          allChecksPass = false;
        }
      } catch (error) {
        console.log(`❌ Table ${tableName} - ERROR: ${error.message}`);
        allChecksPass = false;
      }
    }

    // Check data migration
    try {
      const accountTypeStats = await db('user_subscriptions')
        .select('account_type')
        .count('* as count')
        .groupBy('account_type');

      console.log('📊 Account type distribution:');
      accountTypeStats.forEach(stat => {
        console.log(`  - ${stat.account_type}: ${stat.count} subscriptions`);
      });
    } catch (error) {
      console.log('⚠️ Could not verify account type distribution:', error.message);
    }

    return allChecksPass;
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

/**
 * Rollback migration
 * @param {Object} db - Knex database instance
 * @returns {Promise<boolean>} Rollback success status
 */
async function rollbackMigration(db) {
  try {
    console.log('🔄 Rolling back migration...');

    const [batchNo, log] = await db.migrate.rollback();

    if (log.length === 0) {
      console.log('ℹ️ No migrations to rollback');
      return true;
    }

    console.log(`✅ Rollback batch ${batchNo} completed successfully`);
    console.log('📋 Rolled back migrations:');
    log.forEach(migration => {
      console.log(`  - ${migration}`);
    });

    return true;
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    return false;
  }
}

/**
 * Main migration execution function with dotenvx support
 * @param {Object} options - Migration options
 */
async function main(options = {}) {
  const { action = 'migrate', environment = 'development' } = options;

  console.log('🎯 Unified Subscription System Migration Tool');
  console.log(`📅 Action: ${action}`);
  console.log(`🔧 Environment: ${environment}`);
  console.log('='.repeat(60));

  let db;

  try {
    // Initialize database connection with knexfile configuration
    const config = getKnexConfig(environment);
    db = knex(config);

    // Verify connection
    const connected = await verifyConnection(db);
    if (!connected) {
      console.error('❌ Cannot proceed without database connection');
      process.exit(1);
    }

    // Execute requested action with enhanced error handling
    switch (action) {
      case 'migrate':
        const alreadyApplied = await checkMigrationStatus(db);
        if (alreadyApplied && !options.force) {
          console.log('ℹ️ Migration already applied. Use --force to rerun.');
          console.log('ℹ️ Use "verify" action to check migration status.');
          break;
        }

        const migrationSuccess = await runMigration(db);
        if (migrationSuccess) {
          console.log('🔍 Verifying migration results...');
          await verifyMigration(db);
          console.log('✅ Migration completed successfully!');
          console.log('💡 Next steps:');
          console.log('   1. Update your application to use new endpoints');
          console.log('   2. Test subscription flows');
          console.log('   3. Monitor for any issues');
        } else {
          console.error('❌ Migration failed. Check logs above for details.');
          process.exit(1);
        }
        break;

      case 'rollback':
        console.log('⚠️ Warning: Rolling back will undo subscription system changes');
        const rollbackSuccess = await rollbackMigration(db);
        if (rollbackSuccess) {
          console.log('✅ Migration rollback completed');
          console.log('⚠️ Application may need to be reverted to previous version');
        } else {
          console.error('❌ Rollback failed. Manual intervention may be required.');
          process.exit(1);
        }
        break;

      case 'status':
        console.log('📊 Checking migration status...');
        const status = await checkMigrationStatus(db);
        console.log(status ? '✅ Migration is applied' : '❌ Migration not applied');
        break;

      case 'verify':
        console.log('🔍 Verifying migration integrity...');
        const verificationPassed = await verifyMigration(db);
        if (verificationPassed) {
          console.log('✅ All verification checks passed');
        } else {
          console.error('❌ Some verification checks failed');
          process.exit(1);
        }
        break;

      default:
        console.error(`❌ Unknown action: ${action}`);
        console.log('Available actions:');
        console.log('  - migrate: Apply the migration');
        console.log('  - rollback: Rollback the migration');
        console.log('  - status: Check migration status');
        console.log('  - verify: Verify migration integrity');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Migration tool error:', error.message);
    console.error('Stack trace:', error.stack);
    console.log('\n💡 Troubleshooting tips:');
    console.log('  - Check your environment variables are loaded correctly');
    console.log('  - Verify database connection details');
    console.log('  - Ensure database exists and is accessible');
    console.log('  - Check network connectivity to database');
    process.exit(1);
  } finally {
    if (db) {
      await db.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

// CLI support
if (require.main === module) {
  const args = process.argv.slice(2);
  const action = args[0] || 'migrate';
  const force = args.includes('--force');
  const environment = process.env.NODE_ENV || 'development';

  main({ action, force, environment }).catch(console.error);
}

// Export for programmatic use
module.exports = {
  main,
  getKnexConfig,
  verifyConnection,
  checkMigrationStatus,
  runMigration,
  verifyMigration,
  rollbackMigration
};
