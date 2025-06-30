/**
 * Test script to verify user_subscriptions table structure and queries
 *
 * This script helps debug the column missing error in account type switching
 */

const knex = require('knex')(require('../knexFile.js').development);
const logger = require('../utils/logger');

/**
 * Test the user_subscriptions table structure and queries
 */
async function testUserSubscriptionsTable() {
  try {
    console.log('🔍 Testing user_subscriptions table structure...\n');

    // 1. Check table structure
    console.log('📋 Table columns:');
    const columns = await knex('information_schema.columns')
      .select('column_name', 'data_type', 'is_nullable', 'column_default')
      .where('table_name', 'user_subscriptions')
      .orderBy('ordinal_position');

    console.table(columns);

    // 2. Test if account_type and company_id columns exist
    const hasAccountType = await knex.schema.hasColumn('user_subscriptions', 'account_type');
    const hasCompanyId = await knex.schema.hasColumn('user_subscriptions', 'company_id');

    console.log('\n✅ Column existence check:');
    console.log(`   account_type: ${hasAccountType ? '✓' : '✗'}`);
    console.log(`   company_id: ${hasCompanyId ? '✓' : '✗'}`);

    // 3. Test a simple select query
    console.log('\n📊 Sample data (first 3 rows):');
    const sampleData = await knex('user_subscriptions')
      .select('user_id', 'account_type', 'company_id', 'status')
      .limit(3);

    console.table(sampleData);

    // 4. Test the exact update query that's failing
    console.log('\n🧪 Testing update query structure...');
    const testUserId = '60a4091c-d617-4d6f-8cf8-decce1aeb79d'; // From the error logs

    // First check if this user has any subscriptions
    const userSubscriptions = await knex('user_subscriptions').where({ user_id: testUserId }).select('*');

    console.log(`User ${testUserId} has ${userSubscriptions.length} subscription(s)`);
    if (userSubscriptions.length > 0) {
      console.table(userSubscriptions);
    }

    // 5. Test the actual update query (dry run)
    console.log('\n🔧 Testing update query (dry run)...');
    const updateQuery = knex('user_subscriptions').where({ user_id: testUserId }).update({
      account_type: 'individual',
      company_id: null,
      updated_at: new Date()
    });

    console.log('Generated SQL:', updateQuery.toString());

    // 6. Try the actual update in a transaction (rollback)
    const trx = await knex.transaction();
    try {
      console.log('\n⚡ Attempting actual update (will rollback)...');
      const result = await trx('user_subscriptions').where({ user_id: testUserId }).update({
        account_type: 'individual',
        company_id: null,
        updated_at: new Date()
      });

      console.log(`✅ Update successful! ${result} row(s) affected`);
      await trx.rollback(); // Rollback the transaction
      console.log('🔄 Transaction rolled back');
    } catch (updateError) {
      await trx.rollback();
      console.error('❌ Update failed:', {
        message: updateError.message,
        code: updateError.code,
        detail: updateError.detail,
        position: updateError.position
      });
    }

    console.log('\n🎉 Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await knex.destroy();
  }
}

// Run the test
if (require.main === module) {
  testUserSubscriptionsTable();
}

module.exports = {
  testUserSubscriptionsTable
};
