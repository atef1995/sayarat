require('dotenv').config({ path: '.env.development' });
const knex = require('../knexFile.js');
const db = require('knex')(knex.development);

async function checkTableSchemas() {
  try {
    console.log('=== Checking Table Schemas ===\n');

    // Check user_subscriptions schema
    console.log('1. user_subscriptions schema:');
    const userSubsSchema = await db.raw(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user_subscriptions' 
      ORDER BY ordinal_position;
    `);
    console.log(JSON.stringify(userSubsSchema.rows, null, 2));

    // Check sellers schema
    console.log('\n2. sellers schema:');
    const sellersSchema = await db.raw(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'sellers' 
      ORDER BY ordinal_position;
    `);
    console.log(JSON.stringify(sellersSchema.rows, null, 2));

    // Check actual data types in use
    console.log('\n3. Sample user_id values from user_subscriptions:');
    const userSubsSample = await db('user_subscriptions').select('user_id').limit(3);
    console.log(userSubsSample);

    console.log('\n4. Sample id values from sellers:');
    const sellersSample = await db('sellers').select('id').limit(3);
    console.log(sellersSample);
  } catch (error) {
    console.error('Error checking schemas:', error);
  } finally {
    await db.destroy();
  }
}

checkTableSchemas();
