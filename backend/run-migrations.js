/**
 * Migration Runner Script
 * Handles database migrations with proper environment loading
 */

const knex = require('./config/database');

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...');

    // Run pending migrations
    const [batchNo, log] = await knex.migrate.latest({
      directory: './migrations'
    });

    if (log.length === 0) {
      console.log('✅ Database is already up to date');
    } else {
      console.log(`✅ Batch ${batchNo} run: ${log.length} migrations`);
      console.log('📋 Migrations run:');
      log.forEach(migration => {
        console.log(`   - ${migration}`);
      });
    }

    await knex.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    await knex.destroy();
    process.exit(1);
  }
}

runMigrations();
