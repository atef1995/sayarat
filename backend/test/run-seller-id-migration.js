require('dotenv').config({ path: '.env.development' });
const knex = require('../knexFile.js');
const db = require('knex')(knex.development);

async function runMigration() {
  try {
    console.log('=== Running Migration to Fix seller_id Column ===\n');

    // Step 1: Check current schema
    console.log('1. Current schema:');
    const currentSchema = await db.raw(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_subscriptions' AND column_name LIKE '%user_id%'
      ORDER BY ordinal_position;
    `);
    console.log('Before migration:', currentSchema.rows);

    // Step 2: Run the migration
    console.log('\n2. Running migration...');

    await db.raw(`
      -- Step 1: Alter the column type and rename it
      ALTER TABLE user_subscriptions 
      ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
      
      ALTER TABLE user_subscriptions 
      RENAME COLUMN user_id TO seller_id;
      
      -- Step 2: Add a comment to document the change
      COMMENT ON COLUMN user_subscriptions.seller_id IS 'UUID reference to sellers.id - renamed from user_id and converted to proper UUID type';
    `);

    console.log('Migration completed successfully!');

    // Step 3: Verify the changes
    console.log('\n3. Verifying changes:');
    const newSchema = await db.raw(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_subscriptions' AND column_name = 'seller_id'
      ORDER BY ordinal_position;
    `);
    console.log('After migration:', newSchema.rows);

    // Step 4: Test a sample query
    console.log('\n4. Testing sample query:');
    const sampleData = await db('user_subscriptions').select('id', 'seller_id', 'stripe_subscription_id').limit(1);
    console.log('Sample data:', sampleData);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await db.destroy();
  }
}

runMigration();
