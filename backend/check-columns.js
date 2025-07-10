const knex = require('knex')(require('./knexFile.js').development);

async function checkColumns() {
  try {
    const tables = ['listed_cars', 'companies', 'blog_posts'];
    for (const table of tables) {
      console.log(`\n=== ${table} ===`);
      const columns = await knex(table).columnInfo();
      const slugExists = 'slug' in columns;
      const metaDescExists = 'meta_description' in columns;
      const metaKeywordsExists = 'meta_keywords' in columns;
      console.log(`slug: ${slugExists}`);
      console.log(`meta_description: ${metaDescExists}`);
      console.log(`meta_keywords: ${metaKeywordsExists}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    knex.destroy();
  }
}

checkColumns();
