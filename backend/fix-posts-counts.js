/**
 * Fix Posts Counts Script
 * Updates the posts_count field for all categories and tags
 * to reflect the actual number of published posts
 */

require('@dotenvx/dotenvx').config({ path: '../.env.development' });
const knex = require('./config/database');

async function fixPostsCounts() {
  try {
    console.log('🔄 Fixing posts counts for categories and tags...');

    // Fix categories posts count
    console.log('\n📂 Updating categories posts count...');

    const categories = await knex('blog_categories').select('id', 'name');

    for (const category of categories) {
      const result = await knex('blog_posts')
        .where('category_id', category.id)
        .andWhere('status', 'published')
        .count('id as total')
        .first();

      const postsCount = parseInt(result.total) || 0;

      await knex('blog_categories')
        .where('id', category.id)
        .update({ posts_count: postsCount });

      console.log(`   ✅ ${category.name}: ${postsCount} posts`);
    }

    // Fix tags posts count
    console.log('\n🏷️  Updating tags posts count...');

    const tags = await knex('blog_tags').select('id', 'name');

    for (const tag of tags) {
      const result = await knex('blog_post_tags as bpt')
        .join('blog_posts as bp', 'bpt.post_id', 'bp.id')
        .where('bpt.tag_id', tag.id)
        .andWhere('bp.status', 'published')
        .count('bpt.post_id as total')
        .first();

      const postsCount = parseInt(result.total) || 0;

      await knex('blog_tags')
        .where('id', tag.id)
        .update({ posts_count: postsCount });

      console.log(`   ✅ ${tag.name}: ${postsCount} posts`);
    }

    // Summary
    console.log('\n📊 Summary:');

    const categoriesWithPosts = await knex('blog_categories')
      .select('name', 'posts_count')
      .where('posts_count', '>', 0)
      .orderBy('posts_count', 'desc');

    console.log('   Categories with posts:');
    categoriesWithPosts.forEach(cat => {
      console.log(`     - ${cat.name}: ${cat.posts_count} posts`);
    });

    const tagsWithPosts = await knex('blog_tags')
      .select('name', 'posts_count')
      .where('posts_count', '>', 0)
      .orderBy('posts_count', 'desc');

    console.log('   Tags with posts:');
    tagsWithPosts.forEach(tag => {
      console.log(`     - ${tag.name}: ${tag.posts_count} posts`);
    });

    const totalPosts = await knex('blog_posts')
      .where('status', 'published')
      .count('id as total')
      .first();

    console.log(`\n   📝 Total published posts: ${totalPosts.total}`);
    console.log('✅ Posts counts fixed successfully!');

  } catch (error) {
    console.error('❌ Failed to fix posts counts:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await knex.destroy();
  }
}

fixPostsCounts();
