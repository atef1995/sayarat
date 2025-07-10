/**
 * Script to remove H1 titles from markdown content in sample posts
 * since the title is already displayed separately in the UI
 */

const fs = require('fs');
const path = require('path');

/**
 * Remove H1 headings from markdown content
 * @param {string} markdownContent - The markdown content
 * @returns {string} - The markdown content without H1 headings
 */
function removeH1FromMarkdown(markdownContent) {
  if (!markdownContent || typeof markdownContent !== 'string') {
    return markdownContent;
  }

  // Remove H1 headings (lines starting with # but not ##, ###, etc.)
  const lines = markdownContent.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmedLine = line.trim();
    // Remove line if it starts with exactly one # followed by space
    return !(trimmedLine.match(/^#\s+/) && !trimmedLine.match(/^#{2,}/));
  });

  return filteredLines.join('\n').trim();
}

/**
 * Process sample posts in create-sample-post.js
 */
function processSamplePosts() {
  const samplePostFile = path.join(__dirname, 'create-sample-post.js');

  if (!fs.existsSync(samplePostFile)) {
    console.log('create-sample-post.js not found');
    return;
  }

  let content = fs.readFileSync(samplePostFile, 'utf8');

  // Find all content: ` blocks and process them
  const contentRegex = /content:\s*`([^`]*)`/g;

  content = content.replace(contentRegex, (match, markdownContent) => {
    const processedContent = removeH1FromMarkdown(markdownContent);
    return `content: \`${processedContent}\``;
  });

  // Write back the processed content
  fs.writeFileSync(samplePostFile, content, 'utf8');
  console.log('✅ Removed H1 headings from sample posts in create-sample-post.js');
}

/**
 * Main execution
 */
function main() {
  try {
    console.log('🔄 Processing sample posts to remove H1 headings...');
    processSamplePosts();
    console.log('✅ Processing complete!');

    console.log(`
📝 Summary:
- Removed H1 headings from markdown content in sample posts
- Titles are now displayed only through the UI component
- No duplicate titles will appear in blog content

💡 Note:
- Backend markdownUtils.js now adds 'blog-hidden-title' class to H1 elements
- Frontend CSS hides elements with 'blog-hidden-title' class
- AntD theming is now used instead of custom dark/light mode styles
    `);

  } catch (error) {
    console.error('❌ Error processing sample posts:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  removeH1FromMarkdown,
  processSamplePosts
};
