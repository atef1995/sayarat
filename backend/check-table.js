const knex = require('./knexFile');
const db = require('knex')(knex.development);

async function checkTable() {
  try {
    const result = await db.raw(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'blog_posts' 
      ORDER BY ordinal_position
    `);

    console.log('blog_posts table structure:');
    console.table(result.rows);

    // Also check if we have any existing data
    const count = await db('blog_posts').count('* as count').first();
    console.log(`\nExisting records: ${count.count}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.destroy();
  }
}

checkTable();
