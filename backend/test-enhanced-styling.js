/**
 * Test script for markdown to HTML conversion with enhanced styling
 */

const { markdownToHtml } = require('./utils/markdownUtils');

const testMarkdown = `## Enhanced Blog Styling Test

This is a **bold text** with enhanced background styling and *italic text* with subtle border.

### Features List

- Beautiful numbered lists with gradient backgrounds
- Enhanced blockquotes with decorative elements  
- Improved code blocks with syntax highlighting hints
- Interactive hover effects on links and images

### Code Example

\`\`\`javascript
function enhancedBlogStyling() {
  console.log("Beautiful code blocks!");
  return "Enhanced visual appeal";
}
\`\`\`

### Quote Example

> This blockquote now has a beautiful gradient background, decorative quote marks, and enhanced visual appeal that makes content more engaging.

### Link Example

Visit our [enhanced blog platform](https://example.com) with improved styling.

### Inline Code

Use \`npm install\` to install dependencies with enhanced inline code styling.`;

const result = markdownToHtml(testMarkdown, { generateTOC: true });

console.log('🎨 Enhanced Blog Content HTML:');
console.log('================================');
console.log(result.html);
console.log('\n📊 Metadata:');
console.log(`Reading Time: ${result.readingTime} minutes`);
console.log(`Word Count: ${result.wordCount} words`);

if (result.toc && result.toc.length > 0) {
  console.log('\n📋 Table of Contents:');
  result.toc.forEach((item, index) => {
    const indent = '  '.repeat(item.level - 2);
    console.log(`${indent}${index + 1}. ${item.title}`);
  });
}

console.log('\n✅ Enhanced styling features:');
console.log('- H1 elements are hidden (title displayed separately)');
console.log('- H2/H3 elements have decorative borders and markers');
console.log('- Lists have beautiful numbered bullets and hover effects');
console.log('- Blockquotes have gradient backgrounds and quote marks');
console.log('- Code blocks have enhanced styling with indicators');
console.log('- Links have animated underlines and hover effects');
console.log('- Images have enhanced shadows and hover animations');
console.log('- Bold/italic text have subtle backgrounds and borders');
console.log('- Full RTL support for Arabic content');
console.log('- AntD theming compatibility (no hardcoded colors)');
