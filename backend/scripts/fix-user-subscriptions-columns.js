/**
 * Fix Missing Columns in user_subscriptions Table
 *
 * This script adds the missing account_type and company_id columns
 * to the user_subscriptions table if they don't exist.
 *
 * Following DRY principles and error handling best practices.
 */

const knex = require('knex')(require('../knexFile.js').development);
const logger = require('../utils/logger');

/**
 * Add missing columns to user_subscriptions table
 * @returns {Promise<boolean>} Success status
 */
async function addMissingColumns() {
  try {
    logger.info('🔧 Checking and adding missing columns to user_subscriptions table...');

    // Check if account_type column exists
    const hasAccountType = await knex.schema.hasColumn('user_subscriptions', 'account_type');
    if (!hasAccountType) {
      logger.info('➕ Adding account_type column...');
      await knex.schema.alterTable('user_subscriptions', table => {
        table.string('account_type', 20).defaultTo('individual').notNullable();
      });
      logger.info('✅ Added account_type column');
    } else {
      logger.info('✅ account_type column already exists');
    }

    // Check if company_id column exists
    const hasCompanyId = await knex.schema.hasColumn('user_subscriptions', 'company_id');
    if (!hasCompanyId) {
      logger.info('➕ Adding company_id column...');
      await knex.schema.alterTable('user_subscriptions', table => {
        table.uuid('company_id').nullable();
      });
      logger.info('✅ Added company_id column');
    } else {
      logger.info('✅ company_id column already exists');
    }

    // Add indexes for performance optimization
    try {
      await knex.raw(
        'CREATE INDEX IF NOT EXISTS idx_user_subscriptions_account_type ON user_subscriptions(account_type)'
      );
      await knex.raw('CREATE INDEX IF NOT EXISTS idx_user_subscriptions_company ON user_subscriptions(company_id)');
      logger.info('✅ Added performance indexes');
    } catch (indexError) {
      logger.warn('⚠️ Failed to add indexes (may already exist):', indexError.message);
    }

    // Update existing records to have account_type = 'individual' if null
    const updateResult = await knex('user_subscriptions').whereNull('account_type').orWhere('account_type', '').update({
      account_type: 'individual',
      updated_at: new Date()
    });

    if (updateResult > 0) {
      logger.info(`✅ Updated ${updateResult} existing records to individual account type`);
    }

    logger.info('🎉 Successfully fixed user_subscriptions table structure');
    return true;
  } catch (error) {
    logger.error('❌ Error fixing user_subscriptions table:', error);
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    const success = await addMissingColumns();
    process.exit(success ? 0 : 1);
  } catch (error) {
    logger.error('❌ Unexpected error:', error);
    process.exit(1);
  } finally {
    // Ensure database connection is closed
    await knex.destroy();
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = {
  addMissingColumns
};
