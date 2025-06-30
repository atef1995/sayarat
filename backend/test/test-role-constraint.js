const knex = require('knex')(require('../knexFile').development);

async function checkRoleConstraint() {
  try {
    console.log('🔍 Checking sellers table role constraint...');

    // Get constraint information
    const constraintInfo = await knex.raw(`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conname LIKE '%role%' 
      AND conrelid = 'sellers'::regclass
    `);

    console.log('Role constraints found:', constraintInfo.rows);

    // Also check for any CHECK constraints on the sellers table
    const allConstraints = await knex.raw(`
      SELECT 
        conname as constraint_name,
        contype as constraint_type,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conrelid = 'sellers'::regclass
      AND contype = 'c'
    `);

    console.log('\nAll CHECK constraints on sellers table:', allConstraints.rows);
  } catch (error) {
    console.error('❌ Error checking role constraint:', error.message);
  } finally {
    await knex.destroy();
  }
}

checkRoleConstraint();
