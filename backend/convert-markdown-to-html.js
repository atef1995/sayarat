/**
 * Convert Existing Markdown Posts to HTML
 * 
 * This script converts any existing blog posts that contain markdown content
 * to HTML format for proper frontend rendering.
 */

require('@dotenvx/dotenvx').config({ path: '../.env.development' });
const knex = require('./config/database');
const { markdownToHtml } = require('./utils/markdownUtils');

async function convertMarkdownPostsToHtml() {
  try {
    console.log('🔄 Converting existing markdown posts to HTML...');

    // Get all published posts
    const posts = await knex('blog_posts')
      .select('id', 'title', 'content', 'reading_time')
      .where('status', 'published');

    console.log(`📄 Found ${posts.length} published posts to check`);

    let convertedCount = 0;
    let skippedCount = 0;

    for (const post of posts) {
      // Check if content looks like markdown
      const hasMarkdownSyntax = /^#{1,6}\s|^\*\s|\*\*.*\*\*|^-\s|^\d+\.\s/m.test(post.content);

      if (hasMarkdownSyntax) {
        console.log(`\n📝 Converting post: "${post.title}"`);

        try {
          // Convert markdown to HTML
          const { html, readingTime } = markdownToHtml(post.content);

          // Update the post with HTML content
          await knex('blog_posts')
            .where('id', post.id)
            .update({
              content: html,
              reading_time: readingTime || post.reading_time,
              updated_at: knex.fn.now()
            });

          console.log(`   ✅ Converted successfully (${readingTime} min read)`);
          convertedCount++;

        } catch (error) {
          console.error(`   ❌ Failed to convert post ${post.id}:`, error.message);
        }
      } else {
        skippedCount++;
      }
    }

    console.log('\n📊 Conversion Summary:');
    console.log(`   ✅ Converted: ${convertedCount} posts`);
    console.log(`   ⏭️ Skipped: ${skippedCount} posts (already HTML)`);
    console.log(`   📝 Total checked: ${posts.length} posts`);

    if (convertedCount > 0) {
      console.log('\n🎉 Markdown to HTML conversion completed successfully!');
      console.log('   Your blog posts should now render properly in the frontend.');
    } else {
      console.log('\n✨ All posts are already in HTML format. No conversion needed.');
    }

  } catch (error) {
    console.error('❌ Failed to convert markdown posts:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await knex.destroy();
  }
}

// Run the conversion
convertMarkdownPostsToHtml();
