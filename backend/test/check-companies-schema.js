/**
 * Script to check database schema for companies table
 */

const knexFile = require('../knexfile');
const knex = require('knex');

async function checkCompaniesSchema() {
  const db = knex(knexFile.development);

  try {
    console.log('🔍 Checking companies table schema...\n');

    const result = await db.raw(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'companies' 
      ORDER BY ordinal_position
    `);

    console.log('📊 Companies table columns:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type})${row.is_nullable === 'YES' ? ' - nullable' : ''}`);
    });
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
  } finally {
    await db.destroy();
  }
}

checkCompaniesSchema().catch(console.error);
