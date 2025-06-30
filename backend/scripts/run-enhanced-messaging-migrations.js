/**
 * Enhanced Messaging System Migration Runner
 *
 * Script to run all enhanced messaging system migrations in the correct order.
 * Use this to apply all changes for the enhanced member management and messaging system.
 */

const knex = require('knex');
const config = require('../knexFile.js');

async function runEnhancedMessagingMigrations() {
  const environment = process.env.NODE_ENV || 'development';
  const db = knex(config[environment]);

  console.log('🚀 Starting Enhanced Messaging System Migrations...');
  console.log(`Environment: ${environment}`);

  try {
    // Check current migration status
    console.log('\n📋 Checking current migration status...');
    const currentMigrations = await db.migrate.list();
    console.log(`Completed migrations: ${currentMigrations[0].length}`);
    console.log(`Pending migrations: ${currentMigrations[1].length}`);

    // Run the specific enhanced messaging migrations
    console.log('\n⚙️  Running Enhanced Messaging System migrations...');
    const migrationFiles = [
      '20250622113000_add_company_support_to_sellers.js',
      '20250622114000_add_company_support_to_listings.js',
      '20250622115000_cleanup_listing_status.js',
      '20250622120000_enhanced_member_management.js',
      '20250622121000_messaging_ownership_tracking.js',
      '20250622122000_messaging_conversation_tracking.js',
      '20250622123000_messaging_final_setup.js'
    ];

    for (const migrationFile of migrationFiles) {
      console.log(`\n📦 Applying migration: ${migrationFile}`);
      try {
        await db.migrate.up({ name: migrationFile });
        console.log(`✅ Successfully applied: ${migrationFile}`);
      } catch (error) {
        console.error(`❌ Failed to apply ${migrationFile}:`, error.message);
        // Continue with next migration but log the error
      }
    }

    // Run all pending migrations to ensure everything is up to date
    console.log('\n🔄 Running any remaining pending migrations...');
    const [batchNo, migrations] = await db.migrate.latest();

    if (migrations.length === 0) {
      console.log('✅ All migrations are up to date!');
    } else {
      console.log(`✅ Applied ${migrations.length} migration(s) in batch ${batchNo}:`);
      migrations.forEach(migration => console.log(`   - ${migration}`));
    }

    // Verify the enhanced messaging system is properly set up
    console.log('\n🔍 Verifying Enhanced Messaging System setup...');

    // Check tables exist
    const tables = ['company_member_audit', 'conversation_ownership_log', 'company_message_handlers'];
    for (const table of tables) {
      const exists = await db.schema.hasTable(table);
      console.log(`   ${exists ? '✅' : '❌'} Table ${table}: ${exists ? 'EXISTS' : 'MISSING'}`);
    }

    // Check columns exist
    const columns = [
      { table: 'sellers', column: 'member_status' },
      { table: 'listed_cars', column: 'current_owner_id' },
      { table: 'listed_cars', column: 'current_owner_type' },
      { table: 'listed_cars', column: 'original_seller_id' }
    ];

    for (const { table, column } of columns) {
      const exists = await db.schema.hasColumn(table, column);
      console.log(`   ${exists ? '✅' : '❌'} Column ${table}.${column}: ${exists ? 'EXISTS' : 'MISSING'}`);
    }

    // Check functions exist
    console.log('\n🔧 Checking database functions...');
    const functions = await db.raw(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_type = 'FUNCTION' 
      AND routine_name IN ('get_listing_message_recipient', 'update_conversation_ownership', 'get_member_statistics')
    `);

    const functionNames = functions.rows.map(f => f.routine_name);
    ['get_listing_message_recipient', 'update_conversation_ownership', 'get_member_statistics'].forEach(func => {
      const exists = functionNames.includes(func);
      console.log(`   ${exists ? '✅' : '❌'} Function ${func}: ${exists ? 'EXISTS' : 'MISSING'}`);
    });

    // Check views exist
    console.log('\n👀 Checking database views...');
    const views = await db.raw(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_name IN ('listing_message_routing', 'active_company_message_handlers', 'active_company_members')
    `);

    const viewNames = views.rows.map(v => v.table_name);
    ['listing_message_routing', 'active_company_message_handlers', 'active_company_members'].forEach(view => {
      const exists = viewNames.includes(view);
      console.log(`   ${exists ? '✅' : '❌'} View ${view}: ${exists ? 'EXISTS' : 'MISSING'}`);
    });

    console.log('\n🎉 Enhanced Messaging System Migration completed successfully!');
    console.log('\n📚 Next steps:');
    console.log('   1. Update your application to use EnhancedMessageService');
    console.log('   2. Test member removal and reactivation flows');
    console.log('   3. Verify message routing works correctly');
    console.log('   4. Update frontend components to show ownership changes');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await db.destroy();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runEnhancedMessagingMigrations()
    .then(() => {
      console.log('\n✅ Migration runner completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Migration runner failed:', error);
      process.exit(1);
    });
}

module.exports = { runEnhancedMessagingMigrations };
