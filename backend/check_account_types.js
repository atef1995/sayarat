const knex = require('knex')(require('./knexfile').development);

async function checkAccountTypes() {
  try {
    console.log('Checking account_type column and values...');

    // Check if account_type column exists
    const hasColumn = await knex.schema.hasColumn('sellers', 'account_type');
    console.log('account_type column exists:', hasColumn);

    if (hasColumn) {
      // Get all distinct account_type values
      const accountTypes = await knex('sellers').select('account_type').distinct().whereNotNull('account_type');
      console.log('Distinct account_type values:', accountTypes);

      // Count users by account type
      const counts = await knex('sellers').select('account_type').count('* as count').groupBy('account_type');
      console.log('Account type counts:', counts);

      // Show users with null account_type
      const nullCount = await knex('sellers').count('* as count').whereNull('account_type').first();
      console.log('Users with null account_type:', nullCount.count);

      // Show sample user data
      const sampleUser = await knex('sellers').select('id', 'username', 'email', 'account_type', 'company_id').first();
      console.log('Sample user:', sampleUser);
    }

    await knex.destroy();
  } catch (error) {
    console.error('Error checking database:', error);
    await knex.destroy();
  }
}

checkAccountTypes();
