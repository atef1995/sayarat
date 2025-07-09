/**
 * Test Blog Migration Script
 * Runs the blog migration directly to catch any errors
 */

require('@dotenvx/dotenvx').config({ path: '../.env.development' });
const knex = require('./config/database');

async function testBlogMigration() {
  try {
    console.log('🔄 Testing blog migration...');

    // Import the migration
    const migration = require('./migrations/20241226000001_create_blog_tables.js');

    // Run the up migration
    console.log('Running migration.up()...');
    await migration.up(knex);

    console.log('✅ Migration completed successfully');

    // Check if tables were created
    const result = await knex.raw("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'blog_%' ORDER BY tablename;");
    console.log('📋 Blog tables found:', result.rows.length);
    result.rows.forEach(row => {
      console.log(`   - ${row.tablename}`);
    });

    // Check default data
    const categories = await knex('blog_categories').select('*');
    console.log('📋 Default categories:', categories.length);
    categories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.slug})`);
    });

    const tags = await knex('blog_tags').select('*');
    console.log('📋 Default tags:', tags.length);

    const admins = await knex('blog_admins').select('username', 'email', 'role');
    console.log('📋 Default admins:', admins.length);
    admins.forEach(admin => {
      console.log(`   - ${admin.username} (${admin.email}) - ${admin.role}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await knex.destroy();
  }
}

testBlogMigration();
